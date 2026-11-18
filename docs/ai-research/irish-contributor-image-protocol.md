# Ireland food image pilot: contributor collection protocol

## Goal

Build a small research benchmark for Irish-market foods where test images come from contributors absent from training. This evaluates whether frozen SigLIP 2 embeddings plus cosine KNN generalize across people and capture styles. It is separate from restaurant availability and does not prove a restaurant serves a dish.

## Pilot target

- Start with 10 dish labels selected with Irish food knowledge holders; record aliases and resolve ambiguous names before collecting.
- Aim for at least 5 distinct pseudonymous contributors per dish and 5 different photos per contributor/dish (about 250 images for 10 dishes).
- Assign each contributor to exactly one split: 60% train, 20% validation, 20% test. Every dish must occur in all three splits. The split script enforces contributor separation and fails when coverage is insufficient.
- Capture varied presentations and environments. Ask contributors to photograph the dish as served, without people, private documents, or location-identifying background details.

These are pilot targets for a diagnostic benchmark, not enough evidence for broad deployment claims. If contributor recruitment is limited, reduce the number of dish labels rather than mixing contributors across splits.

## Permission and privacy before intake

1. Provide a plain-language research consent form that names NEMO, explains image use for model training and evaluation, retention, access, withdrawal route, and that this pilot is not public deployment or commercial use.
2. Obtain affirmative permission from the photographer and confirm they have the right to submit the image. Do not infer permission from a public post or a restaurant visit.
3. Record consent in a restricted project-controlled store. Put only a random `permission_record_id` and random `contributor_id` in the dataset manifest; keep names and contact details out of the repository and ML workspace.
4. Keep raw photos outside Git in a restricted local or managed storage location. Remove EXIF metadata, especially GPS, before analysis. Do not collect faces or other unnecessary personal information.
5. Mark `training_allowed=true` and `permission_verified=true` only after the project owner checks the permission record. Mark withdrawn consent and remove affected rows/images/derived artifacts before any future run.

The consent form and storage controls must be reviewed for the actual research setting before participants are recruited. This document is an operational checklist, not a consent form.

## Intake fields

Use [`ml/irish-contributor-template.csv`](../../ml/irish-contributor-template.csv). `contributor_id` must be a random pseudonymous code, not a name or email. `source_url` should be a unique opaque identifier such as `nemo-contributor://asset/<random-id>`; the restricted consent record maps that ID to permission evidence. Keep one row per image.

The data loader rejects unverified or withdrawn rows, missing permission references, duplicate source/image IDs, missing files, and identical image bytes. It produces a new split manifest without changing the intake file.

## Prepare and train

1. Place images in private, Git-ignored storage and fill the intake CSV. Never commit images or consent records.
2. Create contributor-held-out splits:

   ```powershell
   python ml/prepare_irish_contributor_split.py ml\data\irish-contributors\intake.csv
   ```

3. Check the generated counts and confirm every dish has examples in all three splits. The script assigns contributors, never individual images, to splits.
4. Train the existing frozen SigLIP 2 plus logistic head and cosine-KNN baseline:

   ```powershell
   python ml/train_classifier.py ml\data\irish-contributors\intake-split.csv --output ml\artifacts\irish-contributors
   ```

5. Report macro F1, top-1/top-5 accuracy, cosine-KNN hit@5, per-dish support, and the number of contributors and images per split. Keep this contributor-held-out result separate from Food-101 and WorldCuisines metrics.

## Interpretation limits

The pilot can measure generalization to contributors represented in this collection. It will not establish coverage of all Irish foods, restaurants, or countries. A dish needs enough contributor diversity to appear in every split; do not silently fall back to image-level random splitting. Review class labels with knowledgeable participants and document uncertain aliases.
