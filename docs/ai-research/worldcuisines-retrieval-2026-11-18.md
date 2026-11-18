# WorldCuisines regional retrieval research

**Run date:** 2026-11-18  
**Status:** Research-only retrieval evaluation. Image files, vectors, and index are local and Git-ignored. Complete permissions review before any deployment or commercial use.

## Dataset preparation

The WorldCuisines Food Knowledge Base v1.1 contains 2,414 dish records with names, aliases, cuisine, country, area, and image-license fields. Its dataset card declares CC BY-SA 4.0; each image also has its own license. Images are sourced from Wikimedia Commons. NEMO retained the source URL and per-image license in the local manifest, and included only image entries labeled CC-BY, CC-BY-SA, CC0, or Public Domain. Entries without a license, labeled FAL, or labeled “Copyrighted free use” were excluded by this experiment's conservative allowlist. [WorldCuisines Food Knowledge Base](https://huggingface.co/datasets/worldcuisines/food-kb-v1.1), [WorldCuisines dataset card](https://huggingface.co/datasets/worldcuisines/vqa).

The current metadata file lists 6,088 image entries. After the license filter, the preparation script excludes every exact source URL that appears more than once across dish labels: 44 URLs (88 image records). This prevents an identical source image from being counted as different dishes or appearing in both sets. The remaining data yields 3,663 gallery and 1,437 query images across 1,329 dish labels. Another 886 dishes have only one remaining eligible image and are excluded from same-dish evaluation; 199 have none after filtering and duplicate removal. The split is deterministic (seed 42), performed within each dish, and reserves about 20% for queries while keeping at least one gallery image. The dataset does not expose photographer/uploader IDs, so this is not a creator-held-out test and cannot rule out source-style leakage.

## Model and task

- Encoder: frozen `google/siglip2-base-patch16-224`, revision `75de2d55ec2d0b4efc50b3e9ad70dba96a7b2fa2`.
- Image embeddings are L2-normalized and queried with exact KNN using cosine distance, `k=5`.
- This experiment evaluates **visual same-dish retrieval**. It does not train a classifier head on the sparse WorldCuisines examples. The Food-101 classifier remains a separate benchmark model.
- Query images are assigned all associated cuisine/country labels in the metadata; those group metrics overlap when a dish is associated with multiple places.
- Per-group metrics are emitted only for groups with at least five query images.
- The evaluator rejects any manifest where an exact `source_url` appears in both gallery and query.

## Results

| Measure | Result |
| --- | ---: |
| Gallery / query images | 3,663 / 1,437 |
| Dish labels | 1,329 |
| Nearest-neighbor same-dish accuracy | 41.06% |
| Same-dish hit rate in top five | 63.95% |
| Same-dish precision in top five | 22.78% |
| Reportable country / cuisine groups | 136 / 122 |

Selected country groups:

| Country label | Query images | Top-five same-dish hit rate |
| --- | ---: | ---: |
| Japan | 147 | 76% |
| United States | 143 | 66% |
| China | 105 | 61% |
| Indonesia | 101 | 62% |
| Mexico | 96 | 65% |
| India | 88 | 68% |
| France | 81 | 65% |
| Philippines | 81 | 54% |
| Ireland | 16 | 50% |

Selected cuisine groups:

| Cuisine label | Query images | Top-five same-dish hit rate |
| --- | ---: | ---: |
| Japanese | 144 | 76% |
| American | 129 | 63% |
| Chinese | 112 | 59% |
| Indonesian | 96 | 65% |
| Mexican | 89 | 64% |
| Indian | 78 | 68% |
| French | 76 | 70% |
| Filipino | 71 | 56% |

The Ireland result is based on only 16 queries and is exploratory. Group sizes vary; rates with small supports can move substantially with a new split.

## Interpretation

1. WorldCuisines adds useful country/cuisine labels and regional dish examples for NEMO's image-retrieval path.
2. Removing repeated exact source URLs changed top-1 accuracy from 43.37% to 41.06%; top-five hit rate stayed at 63.95%. This small difference does not resolve source leakage from the same photographers or similar shoots because uploader IDs are absent. Same-dish hit rate is lower than the Food-101 sample, but the tasks are not directly comparable: this set has only a few photos per dish and many more dish labels. NEMO needs more independent photos per regional dish and a creator-held-out evaluation on a dataset that includes contributor IDs.
3. The results measure whether an image retrieves another image with the same dataset dish ID. They do not identify every food worldwide, establish calibrated confidence, or prove a restaurant serves a dish.
4. Similar dishes may have different names across countries and recipes. A reviewed canonical taxonomy and multilingual aliases are still required.
5. Preserve each image's source and license. Secure and review the relevant image-owner permissions before deployment or commercial use, as planned for NEMO.

## Reproduce

Preparation: [`ml/prepare_worldcuisines_research.py`](../../ml/prepare_worldcuisines_research.py).  
Evaluation: [`ml/evaluate_worldcuisines_research.py`](../../ml/evaluate_worldcuisines_research.py).  
Instructions: [`ml/README.md`](../../ml/README.md).  
Local metrics/profile and all image/model files remain under Git-ignored `ml/data` and `ml/artifacts`.
