"""Identify a food image with the local NEMO research artifacts."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import joblib
import torch
from PIL import Image
from transformers import AutoModel, AutoProcessor


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="Local JPEG/PNG/WebP food image")
    parser.add_argument("--artifacts", type=Path, default=Path("ml/artifacts/food101-research"))
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()
    if not args.image.is_file():
        parser.error(f"Image not found: {args.image}")
    if args.top_k < 1:
        parser.error("--top-k must be positive")

    classifier_data = joblib.load(args.artifacts / "classifier.joblib")
    knn_data = joblib.load(args.artifacts / "knn-index.joblib")
    model_id = classifier_data["encoder_model"]
    revision = classifier_data["encoder_revision"]
    options = {"revision": revision} if revision else {}
    precision = torch.float16 if args.device.startswith("cuda") else torch.float32
    processor = AutoProcessor.from_pretrained(model_id, **options)
    encoder = AutoModel.from_pretrained(model_id, use_safetensors=True, **options).eval().to(
        device=args.device, dtype=precision
    )

    with Image.open(args.image) as source:
        inputs = processor(images=source.convert("RGB"), return_tensors="pt")
    inputs = {
        name: tensor.to(device=args.device, dtype=precision if tensor.is_floating_point() else tensor.dtype)
        for name, tensor in inputs.items()
    }
    with torch.inference_mode():
        vector = encoder.get_image_features(**inputs)
        if hasattr(vector, "pooler_output"):
            vector = vector.pooler_output
        vector = torch.nn.functional.normalize(vector.float(), p=2, dim=-1).cpu().numpy()

    classifier = classifier_data["classifier"]
    probabilities = classifier.predict_proba(vector)[0]
    class_order = probabilities.argsort()[::-1][:args.top_k]
    predictions = [
        {"dish_id": classifier_data["label_ids"][int(index)],
         "dish_name": classifier_data["dish_names"][int(index)],
         "score": float(probabilities[index])}
        for index in class_order
    ]

    k = min(args.top_k, len(knn_data["train_labels"]))
    distances, neighbors = knn_data["index"].kneighbors(vector, n_neighbors=k)
    grouped: dict[int, dict[str, object]] = defaultdict(lambda: {"examples": 0, "best_similarity": 0.0})
    for distance, neighbor in zip(distances[0], neighbors[0]):
        class_index = int(knn_data["train_labels"][int(neighbor)])
        match = grouped[class_index]
        match["examples"] = int(match["examples"]) + 1
        match["best_similarity"] = max(float(match["best_similarity"]), float(1.0 - distance))
    similar = [
        {"dish_id": knn_data["label_ids"][index],
         "dish_name": knn_data["dish_names"][index], **values}
        for index, values in grouped.items()
    ]
    similar.sort(key=lambda row: (int(row["examples"]), float(row["best_similarity"])), reverse=True)
    print(json.dumps({
        "scope": "Food-101 research labels only; not calibrated and not restaurant evidence",
        "predictions": predictions,
        "cosine_knn_examples": similar,
    }, indent=2))


if __name__ == "__main__":
    main()

