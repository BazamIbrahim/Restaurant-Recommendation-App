"""Validate the Irish contributor dataset and split by pseudonymous contributor."""
from __future__ import annotations

import argparse
import csv
import hashlib
import random
from collections import defaultdict
from pathlib import Path

REQUIRED = {
    "image_path", "dish_id", "dish_name", "contributor_id", "source_url", "license",
    "permission_record_id", "permission_verified", "training_allowed", "consent_withdrawn",
}
SPLITS = ("train", "validation", "test")
MIN_CONTRIBUTORS_PER_DISH = 5


def truth(value: str) -> bool:
    return value.strip().lower() in {"true", "yes", "1"}


def load_rows(manifest: Path) -> list[dict[str, str]]:
    with manifest.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames or not REQUIRED.issubset(reader.fieldnames):
            raise ValueError(f"Manifest must include columns: {','.join(sorted(REQUIRED))}")
        rows = list(reader)
    if not rows:
        raise ValueError("Manifest contains no image rows.")

    seen_sources: set[str] = set()
    seen_hashes: dict[str, str] = {}
    for row in rows:
        for field in REQUIRED - {"image_path", "split", "permission_verified", "training_allowed", "consent_withdrawn"}:
            if not row.get(field, "").strip():
                raise ValueError(f"Missing {field} for row {row.get('image_path', '<unknown>')}")
        if not truth(row["permission_verified"]) or not truth(row["training_allowed"]):
            raise ValueError(f"Permission is not verified for {row['image_path']}")
        if truth(row["consent_withdrawn"]):
            raise ValueError(f"Consent has been withdrawn for {row['image_path']}")
        source = row["source_url"].strip()
        if source in seen_sources:
            raise ValueError(f"Duplicate source/image ID {source!r}; deduplicate before splitting")
        seen_sources.add(source)

        candidate = Path(row["image_path"].strip())
        resolved = (manifest.parent / candidate).resolve() if not candidate.is_absolute() else candidate.resolve()
        if not resolved.is_file():
            raise FileNotFoundError(resolved)
        row["image_path"] = str(resolved)
        digest = hashlib.sha256(resolved.read_bytes()).hexdigest()
        if digest in seen_hashes:
            raise ValueError(
                f"Duplicate image content in {row['image_path']} and {seen_hashes[digest]}; "
                "remove duplicate/alternate-label rows before splitting"
            )
        seen_hashes[digest] = row["image_path"]

    return rows


def assign_contributors(rows: list[dict[str, str]], seed: int,
                        fractions: tuple[float, float, float]) -> dict[str, str]:
    by_dish: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        by_dish[row["dish_id"]].add(row["contributor_id"].strip())
    for dish_id, contributors in by_dish.items():
        if len(contributors) < MIN_CONTRIBUTORS_PER_DISH:
            raise ValueError(
                f"Dish {dish_id!r} has {len(contributors)} contributor(s); "
                f"at least {MIN_CONTRIBUTORS_PER_DISH} are required for a useful "
                "contributor-held-out train/validation/test split"
            )

    all_contributors = sorted({row["contributor_id"].strip() for row in rows})
    rng = random.Random(seed)
    for _ in range(5000):
        shuffled = all_contributors[:]
        rng.shuffle(shuffled)
        n_train = max(1, round(len(shuffled) * fractions[0]))
        n_validation = max(1, round(len(shuffled) * fractions[1]))
        if n_train + n_validation >= len(shuffled):
            n_train = len(shuffled) - 2
            n_validation = 1
        groups = {
            **dict.fromkeys(shuffled[:n_train], "train"),
            **dict.fromkeys(shuffled[n_train:n_train + n_validation], "validation"),
            **dict.fromkeys(shuffled[n_train + n_validation:], "test"),
        }
        represented: dict[str, set[str]] = defaultdict(set)
        for dish_id, contributors in by_dish.items():
            represented[dish_id].update(groups[contributor] for contributor in contributors)
        if all(set(SPLITS).issubset(represented[dish_id]) for dish_id in by_dish):
            return groups
    raise ValueError(
        "Could not make contributor-held-out train/validation/test splits with every dish in all sets. "
        "Collect more contributors per dish or review contributor overlap."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="Completed contributor intake CSV")
    parser.add_argument("--output", type=Path, help="Output CSV; defaults to <manifest>-split.csv")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--fractions", type=float, nargs=3, default=(0.6, 0.2, 0.2),
                        metavar=("TRAIN", "VALIDATION", "TEST"))
    args = parser.parse_args()
    if any(value <= 0 for value in args.fractions) or abs(sum(args.fractions) - 1.0) > 1e-6:
        parser.error("--fractions must be positive and sum to 1")
    rows = load_rows(args.manifest)
    contributor_split = assign_contributors(rows, args.seed, tuple(args.fractions))
    for row in rows:
        row["split"] = contributor_split[row["contributor_id"].strip()]

    output = args.output or args.manifest.with_name(f"{args.manifest.stem}-split.csv")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    counts = {split: sum(row["split"] == split for row in rows) for split in SPLITS}
    print(f"Wrote {len(rows)} verified image rows to {output}")
    print(f"Contributors: {len(contributor_split)}; dishes: {len({row['dish_id'] for row in rows})}; rows by split: {counts}")
    print("Contributor IDs are group-held-out; do not add names, email addresses, or contact details to this manifest.")


if __name__ == "__main__":
    main()
