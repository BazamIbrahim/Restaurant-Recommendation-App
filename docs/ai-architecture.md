# NEMO AI and recommendation design

## Recommended baseline

**Image/text encoder:** `google/siglip2-base-patch16-224`, using Hugging Face Transformers.

SigLIP 2 is a pretrained multilingual vision-language encoder. Its model card supports zero-shot image classification and image-text retrieval and lists the checkpoint under Apache-2.0. It is a better starting fit for NEMO's multi-country and multilingual product than the original English-focused OpenCLIP proposal. Benchmark it on permissioned food photos before deciding whether its accuracy and inference cost fit the service. [Google checkpoint card](https://huggingface.co/google/siglip2-base-patch16-224), [Transformers SigLIP 2 retrieval guide](https://huggingface.co/docs/transformers/model_doc/siglip2)

The image encoder is **pretrained by Google and is not fine-tuned by NEMO**. In the research experiment, NEMO learns a separate classifier head over its image embeddings. The demo UI currently validates photo selection and local preview; it does not call this model.

## Retrieval components

| Component | Method | Role |
| --- | --- | --- |
| Food image encoder | SigLIP 2 Base, pretrained; inference only in the initial milestone | Maps an uploaded meal image into a vector. The image is processed in memory and should not be retained by default. |
| Catalog representation | Same encoder, run offline over rights-cleared menu/meal photos | Stores one normalized vector plus dish, restaurant, source, license, and freshness metadata per permitted example. Precompute; do not re-encode the full catalog for every user request. |
| Meal retrieval | Exact KNN with cosine distance for the small pilot catalog; approximate nearest-neighbor index when the catalog grows | Finds visually/semantically similar catalog meal examples for the uploaded image. |
| Restaurant ranking | Aggregate nearest examples by restaurant, then filter/rank by confirmed menu evidence, distance, freshness, and user preferences | Keeps recommendations grounded in a dish/menu record. Similar cuisine alone must be labeled as a related suggestion. |
| Research classifier | Frozen SigLIP 2 embeddings plus balanced logistic regression | Learns to identify the benchmark's known dish labels without updating encoder weights. |
| Fine-tuning | Deferred until research results justify it | Improve food-specific retrieval only if the measured baseline misses the pilot's quality threshold. |

### Similarity math

Normalize query vector `q` and each catalog vector `x` to unit length. Cosine similarity is `q · x`; cosine distance is `1 - (q · x)`. `NearestNeighbors(metric="cosine")` returns the smallest distances, so convert with `similarity = 1 - distance` for a readable ranking. This value is **not a probability or calibrated confidence**.

KNN's `fit()` step stores the reference vectors and supports neighbor lookup. That is retrieval/indexing, not training the neural encoder. The classifier head is a separate supervised model trained on labeled embeddings; it does not update SigLIP 2.

## Request flow when AI is connected

1. The user takes or selects a JPEG/PNG/WebP photo. Validate file type and size on the client; keep it in memory and explain any later server transfer.
2. The inference service decodes and preprocesses it with the exact SigLIP 2 processor, runs the image tower, and L2-normalizes the embedding.
3. KNN retrieves the nearest licensed/permissioned meal-image examples. Collapse near-duplicate hits by dish and restaurant; return supporting evidence and similarity score.
4. Join the candidate restaurant IDs to current menu-evidence and place records. A dish is “served here” only where evidence supports that claim.
5. Apply distance and user filters; present the nearest matches plus a typed-search/correction fallback. Do not claim the photo itself identifies an exact dish when the retrieval is uncertain.

The reference script is [ml/recommend.py](../ml/recommend.py). It expects a CSV catalog with `image_path`, `dish_name`, `restaurant_id`, and optional `evidence_url`. Its small-catalog KNN rebuilds embeddings each run for clarity; a real service must precompute/cache vectors and use a versioned vector index instead.

## First training experiment

The repository includes [ml/prepare_food101_research.py](../ml/prepare_food101_research.py) and [ml/train_classifier.py](../ml/train_classifier.py). The preparation script creates a balanced sample from the Food-101 train/test splits; the training script encodes those images with frozen SigLIP 2 Base and fits a balanced logistic-regression head. This is a lightweight supervised research experiment, not full encoder fine-tuning. The same embeddings can power the existing cosine-KNN retrieval path.

The manifest requires image path, canonical dish ID/name, fixed split, source URL, license, and an explicit `training_allowed` flag. It rejects rows not marked as cleared and writes the classifier plus per-class metrics locally under the ignored `ml/artifacts/` directory. This flag is a workflow guard, not legal verification. The current app UI remains disconnected from the model.

Food-101 has 101 dishes and 101,000 images. Its dataset card says use beyond scientific fair use must be negotiated with image owners. NEMO is using it for a bounded research benchmark; any deployment or commercial use requires the image-owner permissions first. Its labels are not representative of all countries or regional dishes. [Food-101 dataset card and rights notice](https://huggingface.co/datasets/ethz/food101)

The first benchmark run used 20 images per class for train and test (4,040 images total). The frozen SigLIP 2 embedding classifier scored 90.94% top-1, 99.21% top-5, and 0.9082 macro F1. Cosine KNN at k=5 had 85.84% nearest-neighbor label accuracy and 96.14% same-dish hit rate. These are small-sample benchmark results, not production accuracy or evidence about restaurant menus. See the [full experiment record](ai-research/food101-baseline-2026-11-18.md), including limitations and exact environment.

## Further training plan

1. After the benchmark, build a representative Europe/world-cuisine dataset of meal images paired with canonical dish IDs, cuisine, language aliases, and source/consent provenance. Include confusing lookalike dishes, varied lighting/angles, and multiple regions. Secure product-use permissions before deployment.
2. Keep user-uploaded photos out of training unless users separately opt in with revocable consent. The search feature must work without training on its users.
3. Run the frozen-encoder classifier experiment and measure top-1/top-5 accuracy and macro F1. For restaurant retrieval, measure recall@K and verified-menu evidence precision. Split by restaurant and image source, not random images, to reduce leakage.
4. If needed, fine-tune with contrastive image-to-dish/text pairs (SigLIP-style or supervised contrastive loss), initially freezing most layers and training a small projection/adapter. Compare against the unchanged checkpoint on a held-out set across cuisines and languages.
5. Calibrate abstention thresholds per evaluation slice. Track false “serves this dish” claims, not just image-classification accuracy. Roll back if the model becomes less reliable for any supported cuisine/language group.

## Demo and deployment boundaries

- The photo control only previews the local file; it does not upload, identify, or search with it yet.
- Restaurant names, distances, and scores in the UI are sample data, not verified places or model output.
- The model is open weights, but still has real compute, disk, and hosting costs. Downloading weights is not a paid inference API, but NEMO needs hardware to serve them.
- Do not commit model weights, user photos, embeddings, API secrets, or a production catalog to GitHub.
- Google/Apple auth, live maps, and real review ratings are not connected by the retrieval model.

