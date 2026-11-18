# Europe food image research: contributor collection protocol

## Goal

Build country-aware research benchmarks for foods across Europe, with test images from contributors absent from training. This evaluates whether frozen SigLIP 2 embeddings plus cosine KNN generalize across people and capture styles. Food recognition and restaurant availability are separate; an image match does not prove a restaurant serves a dish.

## Pilot target

- Ireland is the first model-evaluation cohort. Begin with 10 dish labels reviewed with Irish food knowledge holders; record aliases and resolve ambiguous names before collecting.
- Keep all 51 European and extended-European markets visible in [`europe-food-image-coverage.csv`](europe-food-image-coverage.csv) from the start. Run source and taxonomy discovery for other countries in parallel; prioritize each capital city for user-facing rollout, then expand to other major areas.
- For each country's cohort, aim for at least 10 reviewed dish labels, 5 distinct pseudonymous contributors per dish, and 5 different photos per contributor/dish (about 250 images per 10-dish cohort). Do not mark any country as covered until its source rights and contributor support are recorded.
- Assign each contributor to exactly one split: 60% train, 20% validation, 20% test. Every dish must occur in all three splits. The split script enforces contributor separation and fails when coverage is insufficient.
- Capture varied presentations and environments. Ask contributors to photograph the dish as served, without people, private documents, or location-identifying background details.

These are pilot targets for diagnostic benchmarks, not enough evidence for broad deployment claims. If recruitment is limited in one country, reduce that cohort's dish labels or defer its model evaluation rather than mixing contributors across splits. Use `ISO2:dish-slug` IDs for country-specific labels and curated shared IDs only when reviewers agree two labels refer to the same dish.

## Permission and privacy before intake

1. Provide a plain-language research consent form that names NEMO, explains image use for model training and evaluation, retention, access, withdrawal route, and that this pilot is not public deployment or commercial use.
2. Obtain affirmative permission from the photographer and confirm they have the right to submit the image. Do not infer permission from a public post or a restaurant visit.
3. Record consent in a restricted project-controlled store. Put only a random `permission_record_id` and random `contributor_id` in the dataset manifest; keep names and contact details out of the repository and ML workspace.
4. Keep raw photos outside Git in a restricted local or managed storage location. Remove EXIF metadata, especially GPS, before analysis. Do not collect faces or other unnecessary personal information.
5. Mark `training_allowed=true` and `permission_verified=true` only after the project owner checks the permission record. Mark withdrawn consent and remove affected rows/images/derived artifacts before any future run.

The consent form and storage controls must be reviewed for the actual research setting before participants are recruited. This document is an operational checklist, not a consent form.

## Intake fields

Use [`ml/contributor-image-template.csv`](../../ml/contributor-image-template.csv). `contributor_id` must be a random pseudonymous code, not a name or email. Fill ISO2 country and capital for each image. `dish_id` should include the country code unless the reviewed taxonomy already has a shared canonical dish ID. `source_url` should be a unique opaque identifier such as `nemo-contributor://asset/<random-id>`; the restricted consent record maps that ID to permission evidence. Keep one row per image.

The data loader rejects unverified or withdrawn rows, missing permission references, duplicate source/image IDs, missing files, and identical image bytes. It produces a new split manifest without changing the intake file.

## Prepare and train

1. Place images in private, Git-ignored storage and fill the intake CSV. Never commit images or consent records.
2. Create contributor-held-out splits:

   ```powershell
   python ml/prepare_contributor_split.py ml\data\europe-contributors\intake.csv
   ```

3. Check the generated counts and confirm every dish has examples in all three splits. The script assigns contributors, never individual images, to splits.
4. Train the existing frozen SigLIP 2 plus logistic head and cosine-KNN baseline:

   ```powershell
   python ml/train_classifier.py ml\data\europe-contributors\intake-split.csv --output ml\artifacts\europe-contributors
   ```

5. Report macro F1, top-1/top-5 accuracy, cosine-KNN hit@5, per-dish support, and the number of contributors and images per split and country. Keep each country cohort's contributor-held-out result separate from Food-101 and WorldCuisines metrics.

## Interpretation limits

Each cohort can measure generalization to contributors represented in that collection. A pilot in one capital does not establish coverage for its whole country or for other countries. A dish needs enough contributor diversity to appear in every split; do not silently fall back to image-level random splitting. Review class labels with knowledgeable people in the relevant country and document uncertain aliases.
