"""Rights-cleared demo retrieval: pretrained OpenCLIP embeddings + cosine KNN.

This script is a reference implementation; it is not wired into the web UI yet.
Never add private user photos, provider images, model weights, or secrets to Git.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import open_clip
import torch
from PIL import Image
from sklearn.neighbors import NearestNeighbors


def encoder(device: str, checkpoint: str):
    # Check the selected checkpoint's provenance and license before downloading it.
    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-32", pretrained=checkpoint
    )
    model.eval().to(device)
    return model, preprocess, open_clip.get_tokenizer("ViT-B-32")


def unit(vector: torch.Tensor) -> torch.Tensor:
    return vector / vector.norm(dim=-1, keepdim=True).clamp_min(1e-12)


@torch.inference_mode()
def embed_image(model, preprocess, path: Path, device: str) -> np.ndarray:
    image = preprocess(Image.open(path).convert("RGB")).unsqueeze(0).to(device)
    return unit(model.encode_image(image)).cpu().numpy().astype("float32")


@torch.inference_mode()
def embed_texts(model, tokenizer, labels: list[str], device: str) -> np.ndarray:
    tokens = tokenizer(labels).to(device)
    return unit(model.encode_text(tokens)).cpu().numpy().astype("float32")


def nearest_dishes(query_vector: np.ndarray, labels: list[str], vectors: np.ndarray, k: int = 5):
    # sklearn returns cosine distance; similarity = 1 - distance.
    index = NearestNeighbors(n_neighbors=min(k, len(labels)), metric="cosine", algorithm="brute")
    index.fit(vectors)
    distances, indices = index.kneighbors(query_vector)
    return [(labels[i], float(1.0 - d)) for i, d in zip(indices[0], distances[0])]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="Local food image with permission to use")
    parser.add_argument("--checkpoint", required=True, help="Reviewed OpenCLIP ViT-B/32 checkpoint tag or local path")
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()
    # Only a tiny illustrative vocabulary: replace with a reviewed, rights-cleared catalog.
    labels = ["masala dosa", "jollof rice", "ramen", "arepa", "pad thai", "falafel"]
    model, preprocess, tokenizer = encoder(args.device, args.checkpoint)
    candidates = embed_texts(model, tokenizer, labels, args.device)
    query_vector = embed_image(model, preprocess, args.image, args.device)
    print("Candidate dish suggestions (cosine similarity; not calibrated confidence):")
    for label, similarity in nearest_dishes(query_vector, labels, candidates):
        print(f"  {label}: {similarity:.3f}")


if __name__ == "__main__":
    main()

