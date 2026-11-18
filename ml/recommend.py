"""Reference image-to-image meal retrieval for a rights-cleared catalog.

This is an offline experiment, not connected to the web UI or a production index.
The first run downloads the selected pretrained checkpoint to the local model cache.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from sklearn.neighbors import NearestNeighbors
from transformers import AutoModel, AutoProcessor

DEFAULT_MODEL = "google/siglip2-base-patch16-224"


def load_encoder(model_id: str, device: str):
    processor = AutoProcessor.from_pretrained(model_id)
    model = AutoModel.from_pretrained(model_id, use_safetensors=True).eval().to(device)
    return model, processor


def normalized_features(features: torch.Tensor) -> np.ndarray:
    features = torch.nn.functional.normalize(features.float(), p=2, dim=-1)
    return features.cpu().numpy().astype("float32")


@torch.inference_mode()
def encode_image(model, processor, image_path: Path, device: str) -> np.ndarray:
    with Image.open(image_path) as source:
        inputs = processor(images=source.convert("RGB"), return_tensors="pt")
    inputs = {name: tensor.to(device) for name, tensor in inputs.items()}
    # Use the image tower's projected features from the pretrained vision-language model.
    features = model.get_image_features(**inputs)
    if hasattr(features, "pooler_output"):
        features = features.pooler_output
    return normalized_features(features)


def read_catalog(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open(newline="", encoding="utf-8-sig") as source:
        rows = list(csv.DictReader(source))
    required = {"image_path", "dish_name", "restaurant_id"}
    if not rows or not required.issubset(rows[0]):
        raise ValueError("Catalog CSV must contain image_path,dish_name,restaurant_id and at least one row.")
    for row in rows:
        image_path = Path(row["image_path"])
        row["resolved_image_path"] = str((csv_path.parent / image_path).resolve() if not image_path.is_absolute() else image_path)
        if not Path(row["resolved_image_path"]).is_file():
            raise FileNotFoundError(f"Catalog image not found: {row['resolved_image_path']}")
    return rows


def retrieve(query_vector: np.ndarray, catalog_vectors: np.ndarray, rows: list[dict[str, str]], k: int):
    neighbors = min(k, len(rows))
    index = NearestNeighbors(n_neighbors=neighbors, metric="cosine", algorithm="brute")
    index.fit(catalog_vectors)
    distances, indices = index.kneighbors(query_vector)

    # Collapse multiple food-photo neighbors into one restaurant suggestion.
    grouped: dict[str, dict[str, object]] = {}
    for distance, row_index in zip(distances[0], indices[0]):
        row = rows[int(row_index)]
        similarity = float(1.0 - distance)
        restaurant_id = row["restaurant_id"]
        candidate = grouped.setdefault(restaurant_id, {
            "restaurant_id": restaurant_id,
            "dish_name": row["dish_name"],
            "cosine_similarity": similarity,
            "supporting_examples": 0,
            "evidence_url": row.get("evidence_url", ""),
        })
        candidate["supporting_examples"] = int(candidate["supporting_examples"]) + 1
        if similarity > float(candidate["cosine_similarity"]):
            candidate["cosine_similarity"] = similarity
            candidate["dish_name"] = row["dish_name"]
            candidate["evidence_url"] = row.get("evidence_url", "")
    return sorted(grouped.values(), key=lambda item: float(item["cosine_similarity"]), reverse=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="User-provided image with permission to process")
    parser.add_argument("catalog", type=Path, help="CSV of permitted meal-image examples and restaurant evidence")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Reviewed Hugging Face model ID or local checkpoint directory")
    parser.add_argument("--top-k", type=int, default=10)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()
    if args.top_k < 1:
        parser.error("--top-k must be at least 1")
    if not args.image.is_file():
        parser.error(f"Query image not found: {args.image}")

    rows = read_catalog(args.catalog)
    model, processor = load_encoder(args.model, args.device)
    catalog_vectors = np.concatenate([
        encode_image(model, processor, Path(row["resolved_image_path"]), args.device)
        for row in rows
    ], axis=0)
    query_vector = encode_image(model, processor, args.image, args.device)
    matches = retrieve(query_vector, catalog_vectors, rows, args.top_k)

    print("Nearest restaurants (cosine similarity; not calibrated confidence):")
    for match in matches:
        print(
            f"  {match['restaurant_id']} | {match['dish_name']} | "
            f"similarity={match['cosine_similarity']:.3f} | "
            f"examples={match['supporting_examples']} | {match['evidence_url']}"
        )


if __name__ == "__main__":
    main()

