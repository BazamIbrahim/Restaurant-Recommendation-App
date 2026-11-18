"""Prepare a license-filtered, country/cuisine-tagged WorldCuisines KNN set."""
from __future__ import annotations

import argparse
import csv
import json
import random
import tarfile
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath

from huggingface_hub import hf_hub_download

REPO_ID = "worldcuisines/food-kb-v1.1"
DATASET_LICENSE = "CC-BY-SA-4.0"
DATASET_URL = "https://huggingface.co/datasets/worldcuisines/food-kb-v1.1"
IMAGE_PREFIX = "Image"


def parse_array(value: str) -> list[str]:
    if not value.strip():
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        parsed = [value]
    if not isinstance(parsed, list):
        parsed = [parsed]
    return [str(item).strip() for item in parsed if str(item).strip()]


def research_license_allowed(value: str) -> bool:
    normalized = " ".join(value.strip().lower().split())
    return normalized.startswith(("cc-by ", "cc-by-sa ", "cc0", "public domain"))


def download_files(root: Path) -> tuple[Path, Path]:
    root.mkdir(parents=True, exist_ok=True)
    csv_path = Path(hf_hub_download(
        repo_id=REPO_ID, filename="worldcuisines.csv", repo_type="dataset", local_dir=str(root)
    ))
    archive_path = Path(hf_hub_download(
        repo_id=REPO_ID, filename="images.tar.gz", repo_type="dataset", local_dir=str(root)
    ))
    return csv_path, archive_path


def safe_extract(archive_path: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    destination_resolved = destination.resolve()
    with tarfile.open(archive_path, "r:gz") as archive:
        members = []
        for member in archive.getmembers():
            relative = PurePosixPath(member.name.replace("\\", "/"))
            if relative.is_absolute() or ".." in relative.parts:
                raise ValueError(f"Unsafe archive member path: {member.name}")
            if not (member.isdir() or member.isfile()):
                continue
            target = (destination / Path(*relative.parts)).resolve()
            if target != destination_resolved and destination_resolved not in target.parents:
                raise ValueError(f"Archive member escapes image directory: {member.name}")
            members.append(member)
        archive.extractall(destination, members=members)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("ml/data/worldcuisines"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--extract", action="store_true", help="Extract the 1.79 GB image archive if needed")
    parser.add_argument("--manifest", type=Path, default=Path("ml/data/worldcuisines-retrieval.csv"))
    parser.add_argument("--profile", type=Path, default=Path("ml/data/worldcuisines-profile.json"))
    args = parser.parse_args()

    csv_path, archive_path = download_files(args.root)
    image_root = args.root / "images"
    if args.extract or not any(image_root.rglob("*.jpg")):
        print(f"Extracting {archive_path} to {image_root}")
        safe_extract(archive_path, image_root)

    image_by_name: dict[str, Path] = {}
    for path in image_root.rglob("*"):
        if path.is_file():
            image_by_name.setdefault(path.name, path)

    with csv_path.open(newline="", encoding="utf-8-sig") as source:
        food_rows = list(csv.DictReader(source))
    examples: list[dict[str, str]] = []
    skipped_licenses: Counter[str] = Counter()
    missing_files = 0
    missing_metadata = 0
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)

    for food in food_rows:
        food_id = str(food.get("food_id", "")).strip()
        dish_name = food.get("Name", "").strip()
        if not food_id or not dish_name:
            missing_metadata += 1
            continue
        countries = parse_array(food.get("Countries", ""))
        cuisines = parse_array(food.get("Cuisines", "")) + parse_array(food.get("Associated Cuisines", ""))
        areas = parse_array(food.get("Area", ""))
        regions = [parse_array(food.get(f"Region{i}", ""))[0]
                   for i in range(1, 6) if parse_array(food.get(f"Region{i}", ""))]
        for image_number in range(1, 9):
            filename = food.get(f"{IMAGE_PREFIX}{image_number} filename", "").strip()
            if not filename:
                continue
            license_name = food.get(f"{IMAGE_PREFIX}{image_number} License", "").strip()
            if not research_license_allowed(license_name):
                skipped_licenses[license_name or "missing"] += 1
                continue
            image_path = image_by_name.get(Path(filename).name)
            if image_path is None:
                missing_files += 1
                continue
            source_url = food.get(f"{IMAGE_PREFIX}{image_number} name / URL", "").strip()
            if not source_url:
                missing_metadata += 1
                continue
            row = {
                "image_path": str(image_path.resolve()),
                "dish_id": f"worldcuisines:{food_id}",
                "dish_name": dish_name,
                "split": "",
                "source_url": source_url,
                "license": f"WorldCuisines dataset {DATASET_LICENSE}; image {license_name}",
                "training_allowed": "true",
                "image_license": license_name,
                "image_attribution_url": source_url,
                "dataset_url": DATASET_URL,
                "countries_json": json.dumps(countries, ensure_ascii=False),
                "cuisines_json": json.dumps(sorted(set(cuisines)), ensure_ascii=False),
                "areas_json": json.dumps(areas, ensure_ascii=False),
                "regions_json": json.dumps(regions, ensure_ascii=False),
                "aliases": food.get("Alias", "").strip(),
            }
            grouped[row["dish_id"]].append(row)

    # Wikimedia file URLs occasionally appear under multiple dish labels. Drop
    # every occurrence of a reused URL so an exact image cannot cross splits
    # (or be counted as evidence for two different dishes).
    source_counts = Counter(
        row["source_url"] for dish_rows in grouped.values() for row in dish_rows
    )
    duplicate_source_urls = {url for url, count in source_counts.items() if count > 1}
    duplicate_source_rows_excluded = sum(source_counts[url] for url in duplicate_source_urls)
    for dish_id in list(grouped):
        grouped[dish_id] = [
            row for row in grouped[dish_id] if row["source_url"] not in duplicate_source_urls
        ]
        if not grouped[dish_id]:
            del grouped[dish_id]

    eligible_class_count = 0
    singleton_classes = 0
    rng = random.Random(args.seed)
    for dish_id, rows in grouped.items():
        if len(rows) < 2:
            singleton_classes += 1
            continue
        eligible_class_count += 1
        rng.shuffle(rows)
        query_count = min(max(1, round(len(rows) * 0.2)), len(rows) - 1)
        for index, row in enumerate(rows):
            row["split"] = "query" if index < query_count else "gallery"
            examples.append(row)

    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    fields = ["image_path", "dish_id", "dish_name", "split", "source_url", "license",
              "training_allowed", "image_license", "image_attribution_url", "dataset_url",
              "countries_json", "cuisines_json", "areas_json", "regions_json", "aliases"]
    with args.manifest.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=fields)
        writer.writeheader()
        writer.writerows(examples)

    group_stats: dict[str, dict[str, int]] = {}
    for field in ("countries_json", "cuisines_json"):
        counts: Counter[str] = Counter()
        for row in examples:
            if row["split"] != "query":
                continue
            for item in json.loads(row[field]):
                counts[item] += 1
        group_stats[field] = dict(counts.most_common())
    profile = {
        "dataset": REPO_ID,
        "dataset_license": DATASET_LICENSE,
        "seed": args.seed,
        "source_dishes": len(food_rows),
        "source_images": sum(1 for food in food_rows for i in range(1, 9)
                              if food.get(f"Image{i} filename", "").strip()),
        "dishes_with_zero_eligible_images": len(food_rows) - len(grouped),
        "eligible_dishes_with_gallery_and_query": eligible_class_count,
        "singleton_dishes_excluded_from_retrieval_metrics": singleton_classes,
        "duplicate_source_urls_excluded": len(duplicate_source_urls),
        "duplicate_source_rows_excluded": duplicate_source_rows_excluded,
        "paired_images_in_retrieval_manifest": len(examples),
        "gallery_images": sum(row["split"] == "gallery" for row in examples),
        "query_images": sum(row["split"] == "query" for row in examples),
        "missing_files": missing_files,
        "missing_metadata": missing_metadata,
        "skipped_license_counts": dict(skipped_licenses),
        "query_image_counts_by_country": group_stats["countries_json"],
        "query_image_counts_by_cuisine": group_stats["cuisines_json"],
        "manifest": str(args.manifest),
    }
    args.profile.write_text(json.dumps(profile, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({key: value for key, value in profile.items()
                      if key not in {"query_image_counts_by_country", "query_image_counts_by_cuisine"}},
                     indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
