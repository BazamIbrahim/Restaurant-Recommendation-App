# NEMO AI and recommendation design

## Explicit model plan

| Component | Choice for the prototype | What it does | Training status |
| --- | --- | --- | --- |
| Food image/text encoder | OpenCLIP ViT-B/32, pretrained checkpoint selected only after license review | Encodes a food photo and dish/menu text as vectors in a shared representation | Pretrained by its upstream authors; NEMO does not train it yet |
| Food label classifier | None in the first build | Avoids presenting an unvalidated class label as fact; use encoder similarity plus user confirmation | Not trained |
| Similar food retrieval | K-nearest neighbors with cosine distance (`scikit-learn` `NearestNeighbors(metric="cosine")`) over embeddings of permitted reference examples | Returns the closest known dish examples and similarity distances | Index is fitted on curated examples; this is retrieval, not gradient-based model training |
| Restaurant ranking | Cosine similarity between the confirmed dish/photo vector and menu-evidence vectors, then apply distance and data-quality filters | Ranks restaurants with evidence for the requested dish or a clearly labeled related dish | No learned ranker in the prototype |
| Future project-specific model | Fine-tune an image encoder or train a small food classifier only after obtaining a licensed, representative, labeled dataset | Improve dish recognition across cuisines, photo conditions, and languages | Deferred; requires data rights, evaluation set, and consent decisions |

## Request flow

1. The app receives an image locally. The prototype does not upload or retain it.
2. Inference code produces an L2-normalized image embedding. Typed dish text can be embedded through the same text tower.
3. KNN returns candidate food examples with cosine distances. NEMO presents candidates as suggestions for user confirmation, not certain identifications.
4. The confirmed dish is compared with restaurant menu-evidence embeddings. A restaurant must have current menu evidence to be labeled as serving that dish. Cuisine similarity alone is labeled as a related cuisine suggestion.
5. Geographic distance, freshness, and user filters are applied after similarity. Provider review/rating content is not manufactured or scraped.

Cosine similarity is `dot(a,b) / (||a|| * ||b||)` and cosine distance is `1 - similarity`. With unit-normalized vectors, similarity is their dot product. KNN searches the reference vectors; cosine similarity scores candidate matches. They work together but are distinct pieces.

## Demonstration boundaries

- The current UI only previews a chosen photo in the browser. It does not call OpenCLIP or claim image recognition.
- Restaurant cards are clearly illustrative; ratings, distances, menu items, and match percentages are demo values, not live verified listings.
- No production model weights or food images are committed to GitHub.
- Food-101 is a possible research benchmark, not an assumed training source. Review its current terms and image rights for the intended commercial use before downloading, training, or redistributing anything.
- OpenCLIP checkpoints have checkpoint-specific provenance and terms. Select an exact checkpoint only after reviewing those terms.
- Do not train on uploaded user photos without specific, revocable consent and a documented deletion path.

## Evaluation before launch

Build a rights-cleared test set stratified by cuisine, dish, language, lighting, occlusion, and image source. Measure top-1/top-5 dish retrieval, recall@K for restaurants with verified menu evidence, calibration/abstention quality, and performance gaps across cuisine groups. Keep a user correction route and allow “not sure” / text search fallback. Set acceptance thresholds before fine-tuning.

