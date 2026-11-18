# NEMO food-identification experiment

## Model choice

The first NEMO experiment uses **Google SigLIP 2 Base** as a frozen image encoder and trains a **balanced logistic-regression head** on top of its normalized image embeddings. This gives us a measurable dish classifier without expensive full-network fine-tuning. It does not change or fine-tune the SigLIP weights.

For image similarity, keep the same embeddings and use **KNN with cosine distance** against a rights-cleared meal-image index. Classification answers “which known dish label is most likely?”; KNN answers “which catalog meal photos look/encode most similarly?” A restaurant is only said to serve a dish when separate menu evidence confirms it.

## Data contract

Images must be held outside Git. Copy `manifest-template.csv` and make one row per image. Every row needs a stable dish ID, exact image path, dataset/source URL, license, explicit permission status, and a fixed split (`train`, `validation`, or `test`). `training_allowed` must be `true` only after the project has recorded rights that permit model training for the intended use. Publicly viewable or downloadable is not sufficient. Split by original source/restaurant where possible to expose source leakage; do not randomly split near-duplicate photos.

The script rejects missing provenance, missing files, and rows not explicitly cleared. This is a project guardrail, not legal advice or independent verification of a license.

## Run locally

1. Install Python 3.11+ and create an isolated environment. Install PyTorch and torchvision for your machine using [PyTorch's official selector](https://pytorch.org/get-started/locally/), then install `-r ml/requirements.txt`. The research workstation for this first run uses PyTorch 2.11 with CUDA 12.8 and torchvision 0.26.
2. For a quick research benchmark, prepare a balanced Food-101 subset. The script downloads the full dataset, then writes 20 images per class per train/test split (4,040 images total) under Git-ignored `ml/data`:

   ```powershell
   python ml/prepare_food101_research.py --per-class 20
   ```

   Food-101's dataset card allows scientific fair use; this is a research experiment only, not approval for NEMO deployment or commercial use. It is also not representative of all world cuisines.

3. Run feature extraction and classifier fitting:

   ```powershell
   python ml/train_classifier.py ml\data\food101-research.csv --batch-size 4 --output ml\artifacts\food101-research
   ```

   Pin the checkpoint used by the recorded baseline for exact reproduction with `--revision 75de2d55ec2d0b4efc50b3e9ad70dba96a7b2fa2`.

4. Run the local image predictor against a test photo or another local image:

   ```powershell
   python ml/predict_food.py path\to\meal.jpg --artifacts ml\artifacts\food101-research
   ```

   It returns classifier label scores plus nearest cosine-KNN dish examples. Those scores are not calibrated confidence, and the KNN examples are Food-101 images rather than restaurants.

5. Review test top-1 accuracy, top-5 accuracy, macro F1, cosine-KNN hit rate, and each class's recall, then evaluate by cuisine, country, image source, and capture conditions before showing predictions to users. The script never treats a similarity score as calibrated confidence.

The first research run used 20 examples/class/split and scored 90.94% top-1, 99.21% top-5, and macro F1 0.9082 on its 2,020-image test sample. Cosine KNN at k=5 achieved 96.14% same-dish hit rate. This small Food-101 benchmark result is not an estimate of worldwide or NEMO production performance; see the [full research record](../docs/ai-research/food101-baseline-2026-11-18.md).

## Regional retrieval research

WorldCuisines adds an image-level-licensed, broader cuisine catalog: 2,414 dish records with country, cuisine, area, aliases, and image-license metadata. The dataset card describes 6,045 images sourced from Wikimedia Commons and licenses the dataset CC BY-SA 4.0; individual image terms are stored in the CSV. This experiment keeps those licenses and attribution URLs alongside the images, filters out unknown/unsupported image licenses, and never uploads or commits the data. [WorldCuisines knowledge base](https://huggingface.co/datasets/worldcuisines/food-kb-v1.1), [WorldCuisines dataset card](https://huggingface.co/datasets/worldcuisines/vqa).

Run the preparation step to download the metadata and approximately 1.79 GB image archive, safely extract the images, and build a deterministic within-dish gallery/query split:

```powershell
python ml/prepare_worldcuisines_research.py --extract
```

Then evaluate the same pinned SigLIP 2 encoder and cosine KNN by country and cuisine:

```powershell
python ml/evaluate_worldcuisines_research.py ml\data\worldcuisines-retrieval.csv --output ml\artifacts\worldcuisines-research
```

This is a retrieval benchmark, not a classifier fine-tune: most dish labels have too few images for a robust new classification head. Single-image dish labels are excluded because they cannot form both a gallery and query. Country/cuisine metrics overlap when a dish is associated with multiple places. Results are only research diagnostics; they do not establish menu availability or commercial data rights.

The output folder is ignored by Git. It contains local evaluation metrics; do not commit weights, datasets, or user photographs. The current UI is not connected to this model.

## Data reality check

Food-101 has 101 categories and 101,000 benchmark images, so it is useful for reproducing a research experiment. Its dataset card says the images belong to Foodspotting contributors and use beyond scientific fair use must be negotiated with image owners. **Do not use it for NEMO product training unless those rights are secured.** Its category list also does not represent the full range of meals or regional names NEMO wants to support. Build the product dataset from sources whose image-level rights permit ML training, plus restaurant/creator contributions with explicit permission.
