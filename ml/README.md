# NEMO food-identification experiment

## Model choice

The first NEMO experiment uses **Google SigLIP 2 Base** as a frozen image encoder and trains a **balanced logistic-regression head** on top of its normalized image embeddings. This gives us a measurable dish classifier without expensive full-network fine-tuning. It does not change or fine-tune the SigLIP weights.

For image similarity, keep the same embeddings and use **KNN with cosine distance** against a rights-cleared meal-image index. Classification answers “which known dish label is most likely?”; KNN answers “which catalog meal photos look/encode most similarly?” A restaurant is only said to serve a dish when separate menu evidence confirms it.

## Data contract

Images must be held outside Git. Copy `manifest-template.csv` and make one row per image. Every row needs a stable dish ID, exact image path, dataset/source URL, license, explicit permission status, and a fixed split (`train`, `validation`, or `test`). `training_allowed` must be `true` only after the project has recorded rights that permit model training for the intended use. Publicly viewable or downloadable is not sufficient. Split by original source/restaurant where possible to expose source leakage; do not randomly split near-duplicate photos.

The script rejects missing provenance, missing files, and rows not explicitly cleared. This is a project guardrail, not legal advice or independent verification of a license.

## Run locally

1. Install Python 3.10+ and a compatible PyTorch build for your CPU/GPU. For GPU training, follow the current PyTorch install selector for the machine's CUDA setup.
2. From this directory, create an isolated environment and install `-r ml/requirements.txt` from the repository root.
3. Build a rights-cleared image directory and CSV manifest outside Git. Images are read locally; this script makes no image-upload request. Hugging Face downloads the selected model checkpoint on its first run.
4. Run:

   ```powershell
   python ml/train_classifier.py path\to\manifest.csv --output ml\artifacts\food-classifier
   ```

5. Review test top-1 accuracy, top-5 accuracy, macro F1, and each class's recall, then evaluate by cuisine, country, image source, and capture conditions before showing predictions to users. The script never treats a similarity score as calibrated confidence.

The output folder is ignored by Git. It contains a local classifier artifact and metrics; do not commit weights, datasets, or user photographs. The current UI is not connected to this model.

## Data reality check

Food-101 has 101 categories and 101,000 benchmark images, so it is useful for reproducing a research experiment. Its dataset card says the images belong to Foodspotting contributors and use beyond scientific fair use must be negotiated with image owners. **Do not use it for NEMO product training unless those rights are secured.** Its category list also does not represent the full range of meals or regional names NEMO wants to support. Build the product dataset from sources whose image-level rights permit ML training, plus restaurant/creator contributions with explicit permission.

