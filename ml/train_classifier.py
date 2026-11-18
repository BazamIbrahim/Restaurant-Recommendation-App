"""Train a lightweight food classifier on SigLIP 2 image embeddings.

This trains a logistic-regression classification head, not the SigLIP encoder.
The encoder is frozen so the first experiment is practical on modest hardware.
Input images are kept outside the repository and are never uploaded by this script.
"""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

import joblib
import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score, top_k_accuracy_score
from transformers import AutoModel, AutoProcessor
from tqdm.auto import tqdm

DEFAULT_MODEL = "google/siglip2-base-patch16-224"
REQUIRED = {"image_path", "dish_id", "dish_name", "split", "source_url", "license", "training_allowed"}


def load_manifest(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames or not REQUIRED.issubset(reader.fieldnames):
            raise ValueError(f"Manifest must include columns: {','.join(sorted(REQUIRED))}")
        rows = list(reader)
    if not rows:
        raise ValueError("Manifest contains no image rows.")

    denied = [row for row in rows if row["training_allowed"].strip().lower() not in {"true", "yes", "1"}]
    if denied:
        raise ValueError(f"{len(denied)} row(s) are not explicitly cleared for training. Remove them or document permission first.")

    for row in rows:
        for field in REQUIRED - {"image_path", "split", "training_allowed"}:
            if not row[field].strip():
                raise ValueError(f"Missing {field} for image row {row.get('image_path', '<unknown>')}")
        if row["split"].strip() not in {"train", "validation", "test"}:
            raise ValueError(f"Invalid split {row['split']!r}; use train, validation, or test.")
        candidate = Path(row["image_path"].strip())
        row["resolved_image_path"] = str((path.parent / candidate).resolve() if not candidate.is_absolute() else candidate.resolve())
        if not Path(row["resolved_image_path"]).is_file():
            raise FileNotFoundError(row["resolved_image_path"])
    return rows


def encode_rows(rows: list[dict[str, str]], model, processor, device: str, batch_size: int, precision: torch.dtype) -> np.ndarray:
    chunks: list[np.ndarray] = []
    for offset in tqdm(range(0, len(rows), batch_size), desc="Encoding images", unit="batch"):
        batch_rows = rows[offset:offset + batch_size]
        images = []
        for row in batch_rows:
            try:
                with Image.open(row["resolved_image_path"]) as image:
                    images.append(image.convert("RGB"))
            except (UnidentifiedImageError, OSError) as exc:
                raise ValueError(f"Could not decode {row['resolved_image_path']}: {exc}") from exc
        inputs = processor(images=images, return_tensors="pt")
        inputs = {
            name: tensor.to(device=device, dtype=precision if tensor.is_floating_point() else tensor.dtype)
            for name, tensor in inputs.items()
        }
        with torch.inference_mode():
            features = model.get_image_features(**inputs)
            if hasattr(features, "pooler_output"):
                features = features.pooler_output
            features = torch.nn.functional.normalize(features.float(), p=2, dim=-1)
        chunks.append(features.cpu().numpy().astype("float32"))
        for image in images:
            image.close()
    return np.concatenate(chunks, axis=0)


def score(model, features: np.ndarray, labels: np.ndarray, names: list[str], split: str) -> dict:
    probabilities = model.predict_proba(features)
    predicted = model.classes_[probabilities.argmax(axis=1)]
    k = min(5, len(model.classes_))
    report = classification_report(
        labels, predicted, labels=model.classes_, output_dict=True, zero_division=0
    )
    return {
        "split": split,
        "images": len(labels),
        "top1_accuracy": float(accuracy_score(labels, predicted)),
        "macro_f1": float(f1_score(labels, predicted, average="macro", zero_division=0)),
        "top_k": k,
        "top_k_accuracy": float(top_k_accuracy_score(labels, probabilities, labels=model.classes_, k=k)),
        "per_dish": {
            names[label]: {
                "precision": report[str(label)]["precision"],
                "recall": report[str(label)]["recall"],
                "f1": report[str(label)]["f1-score"],
                "support": report[str(label)]["support"],
            }
            for label in model.classes_
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="CSV manifest; images stay local")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--revision", help="Pin a reviewed Hugging Face commit/revision for reproducibility")
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--max-iter", type=int, default=1000)
    parser.add_argument("--output", type=Path, default=Path("ml/artifacts/food-classifier"))
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()
    if args.batch_size < 1:
        parser.error("--batch-size must be at least 1")

    rows = load_manifest(args.manifest)
    splits = {name: [row for row in rows if row["split"] == name] for name in ("train", "validation", "test")}
    if not splits["train"] or not splits["test"]:
        parser.error("Manifest needs explicit train and test rows; split by source/restaurant before training.")
    train_ids = {row["dish_id"] for row in splits["train"]}
    test_only = {row["dish_id"] for row in splits["test"]} - train_ids
    if test_only:
        parser.error(f"Test dishes missing training examples: {', '.join(sorted(test_only))}")
    validation_only = {row["dish_id"] for row in splits["validation"]} - train_ids
    if validation_only:
        parser.error(f"Validation dishes missing training examples: {', '.join(sorted(validation_only))}")

    dish_names: dict[str, str] = {}
    for row in rows:
        previous = dish_names.setdefault(row["dish_id"], row["dish_name"])
        if previous != row["dish_name"]:
            parser.error(f"Dish ID {row['dish_id']} has conflicting names.")

    print(f"Loading frozen encoder {args.model} on {args.device}; images are processed locally.")
    options = {"revision": args.revision} if args.revision else {}
    processor = AutoProcessor.from_pretrained(args.model, **options)
    precision = torch.float16 if args.device.startswith("cuda") else torch.float32
    encoder = AutoModel.from_pretrained(args.model, use_safetensors=True, **options).eval().to(device=args.device, dtype=precision)
    vectors = {name: encode_rows(group, encoder, processor, args.device, args.batch_size, precision)
               for name, group in splits.items() if group}
    label_ids = sorted(train_ids)
    label_index = {dish_id: index for index, dish_id in enumerate(label_ids)}
    train_y = np.asarray([label_index[row["dish_id"]] for row in splits["train"]])
    classifier = LogisticRegression(max_iter=args.max_iter, class_weight="balanced", random_state=42)
    classifier.fit(vectors["train"], train_y)

    metrics = {}
    for split in ("validation", "test"):
        group = splits[split]
        if group:
            y = np.asarray([label_index[row["dish_id"]] for row in group])
            metrics[split] = score(classifier, vectors[split], y, dish_names_by_index(label_ids, dish_names), split)

    args.output.mkdir(parents=True, exist_ok=True)
    joblib.dump({"classifier": classifier, "label_ids": label_ids,
                 "dish_names": [dish_names[dish_id] for dish_id in label_ids],
                 "encoder_model": args.model, "encoder_revision": args.revision}, args.output / "classifier.joblib")
    metadata = {
        "encoder": args.model,
        "encoder_revision": args.revision,
        "training_method": "frozen SigLIP 2 image embeddings + balanced multinomial logistic regression",
        "train_images": len(splits["train"]),
        "class_count": len(label_ids),
        "class_counts": dict(Counter(row["dish_id"] for row in splits["train"])),
        "metrics": metrics,
        "provenance": sorted({(row["source_url"], row["license"]) for row in rows}),
    }
    (args.output / "metrics.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({split: {key: value for key, value in result.items() if key != "per_dish"}
                      for split, result in metrics.items()}, indent=2))
    print(f"Saved local artifacts to {args.output.resolve()} (do not commit images or model artifacts).")


def dish_names_by_index(label_ids: list[str], names: dict[str, str]) -> dict[int, str]:
    return {index: names[dish_id] for index, dish_id in enumerate(label_ids)}


if __name__ == "__main__":
    main()

