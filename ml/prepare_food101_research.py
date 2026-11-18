"""Download Food-101 for a bounded, research-only classifier experiment."""
from __future__ import annotations

import argparse
import csv
import random
from collections import defaultdict
from pathlib import Path

from torchvision.datasets import Food101

SOURCE = "https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/"
RESEARCH_RIGHTS = "Scientific fair use per Food-101 dataset card; research only, not product deployment"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("ml/data"), help="Dataset download location (ignored by Git)")
    parser.add_argument("--output", type=Path, default=Path("ml/data/food101-research.csv"))
    parser.add_argument("--per-class", type=int, default=20, help="Deterministic examples per class and split")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if args.per_class < 1:
        parser.error("--per-class must be positive")

    args.root.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, str]] = []
    for split in ("train", "test"):
        dataset = Food101(root=str(args.root), split=split, download=True)
        grouped: dict[int, list[Path]] = defaultdict(list)
        for image_path, label in zip(dataset._image_files, dataset._labels):
            grouped[int(label)].append(Path(image_path))
        rng = random.Random(args.seed + (0 if split == "train" else 1))
        for label, image_paths in sorted(grouped.items()):
            if len(image_paths) < args.per_class:
                raise ValueError(f"{dataset.classes[label]} has only {len(image_paths)} rows in {split}.")
            selected = sorted(rng.sample(image_paths, args.per_class))
            dish_name = dataset.classes[label]
            for image_path in selected:
                rows.append({
                    "image_path": str(image_path.resolve()),
                    "dish_id": dish_name,
                    "dish_name": dish_name.replace("_", " "),
                    "split": split,
                    "source_url": SOURCE,
                    "license": RESEARCH_RIGHTS,
                    "training_allowed": "true",
                })

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} research-only image rows to {args.output.resolve()}")
    print(f"{args.per_class} examples/class/split across {len(dataset.classes)} classes.")
    print("Do not ship this checkpoint or dataset in NEMO without image-owner permissions.")


if __name__ == "__main__":
    main()

