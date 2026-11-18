# WorldCuisines regional retrieval research

**Run date:** 2026-11-18  
**Status:** Research-only retrieval evaluation. Image files, vectors, and index are local and Git-ignored. Complete permissions review before any deployment or commercial use.

## Dataset preparation

The WorldCuisines Food Knowledge Base v1.1 contains 2,414 dish records with names, aliases, cuisine, country, area, and image-license fields. Its dataset card declares CC BY-SA 4.0; each image also has its own license. Images are sourced from Wikimedia Commons. NEMO retained the source URL and per-image license in the local manifest, and included only image entries labeled CC-BY, CC-BY-SA, CC0, or Public Domain. Entries without a license, labeled FAL, or labeled “Copyrighted free use” were excluded by this experiment's conservative allowlist. [WorldCuisines Food Knowledge Base](https://huggingface.co/datasets/worldcuisines/food-kb-v1.1), [WorldCuisines dataset card](https://huggingface.co/datasets/worldcuisines/vqa).

The current metadata file lists 6,088 image entries. After the license filter, 1,340 dishes had enough images to create both gallery and query sets, yielding 3,717 gallery and 1,462 query images. Another 895 dishes had only one eligible image and were excluded from same-dish evaluation; 179 dishes had no eligible image after filtering. The split is deterministic (seed 42), performed within each dish, and reserves about 20% for queries while keeping at least one gallery image. It is not split by image author/source, so source-level leakage has not been ruled out.

## Model and task

- Encoder: frozen `google/siglip2-base-patch16-224`, revision `75de2d55ec2d0b4efc50b3e9ad70dba96a7b2fa2`.
- Image embeddings are L2-normalized and queried with exact KNN using cosine distance, `k=5`.
- This experiment evaluates **visual same-dish retrieval**. It does not train a classifier head on the sparse WorldCuisines examples. The Food-101 classifier remains a separate benchmark model.
- Query images are assigned all associated cuisine/country labels in the metadata; those group metrics overlap when a dish is associated with multiple places.
- Per-group metrics are emitted only for groups with at least five query images.

## Results

| Measure | Result |
| --- | ---: |
| Gallery / query images | 3,717 / 1,462 |
| Dish labels | 1,340 |
| Nearest-neighbor same-dish accuracy | 43.37% |
| Same-dish hit rate in top five | 63.95% |
| Same-dish precision in top five | 22.71% |
| Reportable country / cuisine groups | 138 / 123 |

Selected country groups:

| Country label | Query images | Top-five same-dish hit rate |
| --- | ---: | ---: |
| Japan | 148 | 76% |
| United States | 146 | 66% |
| China | 106 | 62% |
| Indonesia | 101 | 59% |
| Mexico | 97 | 68% |
| India | 88 | 70% |
| France | 83 | 64% |
| Philippines | 82 | 49% |
| Ireland | 16 | 50% |

Selected cuisine groups:

| Cuisine label | Query images | Top-five same-dish hit rate |
| --- | ---: | ---: |
| Japanese | 145 | 77% |
| American | 132 | 64% |
| Chinese | 113 | 61% |
| Indonesian | 96 | 60% |
| Mexican | 90 | 68% |
| Indian | 78 | 69% |
| French | 77 | 68% |
| Filipino | 72 | 50% |

The Ireland result is based on only 16 queries and is exploratory. Group sizes vary; rates with small supports can move substantially with a new split.

## Interpretation

1. WorldCuisines adds useful country/cuisine labels and regional dish examples for NEMO's image-retrieval path.
2. Same-dish hit rate is substantially lower than the Food-101 sample. The tasks are not directly comparable: this set has only a few photos per dish, many more dish labels, and no source-group holdout. This points to a clear research gap: NEMO needs more independent photos per regional dish and a source-held-out evaluation.
3. The results measure whether an image retrieves another image with the same dataset dish ID. They do not identify every food worldwide, establish calibrated confidence, or prove a restaurant serves a dish.
4. Similar dishes may have different names across countries and recipes. A reviewed canonical taxonomy and multilingual aliases are still required.
5. Preserve each image's source and license. Secure and review the relevant image-owner permissions before deployment or commercial use, as planned for NEMO.

## Reproduce

Preparation: [`ml/prepare_worldcuisines_research.py`](../../ml/prepare_worldcuisines_research.py).  
Evaluation: [`ml/evaluate_worldcuisines_research.py`](../../ml/evaluate_worldcuisines_research.py).  
Instructions: [`ml/README.md`](../../ml/README.md).  
Local metrics/profile and all image/model files remain under Git-ignored `ml/data` and `ml/artifacts`.
