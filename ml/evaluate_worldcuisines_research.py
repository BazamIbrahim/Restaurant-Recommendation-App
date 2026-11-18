"""Evaluate same-dish SigLIP 2 cosine-KNN retrieval by cuisine and country."""
from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
from sklearn.neighbors import NearestNeighbors
from transformers import AutoModel, AutoProcessor

from train_classifier import DEFAULT_MODEL, encode_rows


def labels(rows: list[dict[str, str]], field: str) -> list[list[str]]:
    return [json.loads(row.get(field, "[]") or "[]") for row in rows]


def group_metrics(rows: list[dict[str, str]], hits: np.ndarray, top1: np.ndarray,
                  precisions: np.ndarray, field: str) -> dict[str, dict[str, float | int]]:
    members: dict[str, list[int]] = defaultdict(list)
    for index, row_labels in enumerate(labels(rows, field)):
        for label in set(row_labels):
            members[label].append(index)
    output = {}
    for label, indices in members.items():
        if len(indices) < 5:
            continue
        output[label] = {
            "query_images": len(indices),
            "same_dish_top1_accuracy": float(np.mean(top1[indices])),
            "same_dish_hit_rate_at_5": float(np.mean(hits[indices])),
            "same_dish_precision_at_5": float(np.mean(precisions[indices])),
        }
    return dict(sorted(output.items(), key=lambda item: item[1]["query_images"], reverse=True))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, nargs="?", default=Path("ml/data/worldcuisines-retrieval.csv"))
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--revision", default="75de2d55ec2d0b4efc50b3e9ad70dba96a7b2fa2")
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--output", type=Path, default=Path("ml/artifacts/worldcuisines-research"))
    args = parser.parse_args()
    if args.k < 1:
        parser.error("--k must be positive")
    with args.manifest.open(newline="", encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))
    gallery = [row for row in rows if row["split"] == "gallery"]
    queries = [row for row in rows if row["split"] == "query"]
    if not gallery or not queries:
        parser.error("Manifest must include gallery and query images")
    gallery_sources = {row.get("source_url", "").strip() for row in gallery}
    query_sources = {row.get("source_url", "").strip() for row in queries}
    leaked_sources = (gallery_sources & query_sources) - {""}
    if leaked_sources:
        parser.error(
            f"Manifest has {len(leaked_sources)} exact source URLs in both gallery and query; "
            "regenerate it with prepare_worldcuisines_research.py"
        )
    known = {row["dish_id"] for row in gallery}
    queries = [row for row in queries if row["dish_id"] in known]
    if not queries:
        parser.error("No query dishes have a gallery image")
    for row in gallery + queries:
        row["resolved_image_path"] = row["image_path"]

    precision = torch.float16 if args.device.startswith("cuda") else torch.float32
    options = {"revision": args.revision} if args.revision else {}
    processor = AutoProcessor.from_pretrained(args.model, **options)
    encoder = AutoModel.from_pretrained(args.model, use_safetensors=True, **options).eval().to(
        device=args.device, dtype=precision
    )
    gallery_vectors = encode_rows(gallery, encoder, processor, args.device, args.batch_size, precision)
    query_vectors = encode_rows(queries, encoder, processor, args.device, args.batch_size, precision)
    class_ids = sorted({row["dish_id"] for row in gallery})
    class_indices = {dish_id: index for index, dish_id in enumerate(class_ids)}
    gallery_y = np.asarray([class_indices[row["dish_id"]] for row in gallery])
    query_y = np.asarray([class_indices[row["dish_id"]] for row in queries])
    k = min(args.k, len(gallery))
    index = NearestNeighbors(n_neighbors=k, metric="cosine", algorithm="brute").fit(gallery_vectors)
    _, neighbor_indices = index.kneighbors(query_vectors)
    neighbor_labels = gallery_y[neighbor_indices]
    same_dish = neighbor_labels == query_y[:, None]
    hits = np.any(same_dish, axis=1)
    top1 = same_dish[:, 0]
    precisions = np.mean(same_dish, axis=1)
    metrics = {
        "dataset": "WorldCuisines food-kb-v1.1",
        "dataset_license": "CC-BY-SA-4.0; image-level license/attribution retained in manifest",
        "encoder": args.model,
        "encoder_revision": args.revision,
        "distance": "cosine over L2-normalized image embeddings",
        "k": k,
        "gallery_images": len(gallery),
        "query_images": len(queries),
        "dish_classes": len(class_ids),
        "same_dish_top1_accuracy": float(np.mean(top1)),
        "same_dish_hit_rate_at_k": float(np.mean(hits)),
        "same_dish_precision_at_k": float(np.mean(precisions)),
        "by_country": group_metrics(queries, hits, top1, precisions, "countries_json"),
        "by_cuisine": group_metrics(queries, hits, top1, precisions, "cuisines_json"),
        "split_method": "deterministic within-dish random split after excluding every repeated exact source URL globally; single-image dishes excluded",
        "source_holdout_limit": "Exact source URLs cannot cross splits. Dataset has no creator/uploader IDs, so this is not a creator-held-out evaluation.",
        "warning": "Research retrieval benchmark only; scores are not calibrated confidence or evidence a restaurant serves a dish.",
    }
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "metrics.json").write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({key: value for key, value in metrics.items()
                      if key not in {"by_country", "by_cuisine"}}, indent=2, ensure_ascii=False))
    print(f"Country groups: {len(metrics['by_country'])}; cuisine groups: {len(metrics['by_cuisine'])}")
    print(f"Saved group metrics to {args.output / 'metrics.json'}")


if __name__ == "__main__":
    main()
