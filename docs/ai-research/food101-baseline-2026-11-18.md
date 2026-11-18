# NEMO Food-101 research baseline

**Run date:** 2026-11-18  
**Status:** Research benchmark only. Do not use this dataset or resulting classifier for a NEMO deployment until image-owner permissions for that use have been secured.

## Question

Can a frozen multilingual SigLIP 2 image encoder support food identification and same-dish visual retrieval on a balanced sample of the Food-101 benchmark?

## Method

- Dataset: Food-101, using the official train/test split. The preparation script sampled 20 images per class from each split with seed 42 for train and 43 for test: **2,020 train + 2,020 test images across 101 labels**. No image files or embeddings are part of this repository.
- Encoder: `google/siglip2-base-patch16-224`, model revision `75de2d55ec2d0b4efc50b3e9ad70dba96a7b2fa2`.
- Feature extraction: the encoder was frozen, images were processed with the checkpoint's `AutoProcessor`, embeddings were L2-normalized, and inference used FP16 on an NVIDIA GeForce RTX 3050 Ti Laptop GPU (4 GB VRAM).
- Classifier: balanced scikit-learn multinomial logistic regression fitted to the train embeddings (`max_iter=1000`, `random_state=42`). SigLIP 2 weights were not fine-tuned.
- Similarity retrieval: exact `NearestNeighbors(metric="cosine")`, `k=5`, indexed on train embeddings and queried with test embeddings. Since vectors are unit normalized, cosine distance is `1 - dot_product`.
- Runtime: Python 3.11.9, PyTorch 2.11.0+cu128, torchvision 0.26.0+cu128, Transformers 5.23.0, scikit-learn 1.9.1.

## Results

| Task | Metric | Result |
| --- | --- | ---: |
| Dish classification | Top-1 accuracy | 90.94% |
| Dish classification | Top-5 accuracy | 99.21% |
| Dish classification | Macro F1 | 0.9082 |
| Cosine KNN | Nearest-neighbor label accuracy | 85.84% |
| Cosine KNN | Same-dish hit rate within top 5 | 96.14% |
| Cosine KNN | Same-dish precision within top 5 | 80.46% |

The test sample is balanced at 20 images per class, so macro metrics are meaningful for this small benchmark slice. They are not estimates of production performance.

## Interpretation and limits

1. This validates the code path: SigLIP 2 image features can feed both a supervised label head and a cosine-KNN search.
2. The classifier identifies one of 101 Food-101 labels. The benchmark does not cover NEMO's intended worldwide dish vocabulary, regional spellings, or all preparation variants.
3. SigLIP 2 was pretrained externally. Its pretraining data may overlap with this benchmark; these results do not prove generalization to unseen cuisines, restaurants, cameras, or user photos.
4. Twenty test images per label is a small evaluation set. Scores can move with a different sample. We have not calibrated confidence/abstention or measured per-country and per-language performance.
5. KNN finds similar benchmark photos. It does **not** prove a restaurant serves the dish. Live restaurant recommendations need independent, current menu evidence.
6. Food-101's dataset card says use beyond scientific fair use must be negotiated with the image owners. This experiment is for research only; secure the necessary image rights before deployment or commercial use.

## Reproduce

See [`ml/README.md`](../../ml/README.md). The preparation code and training code are [`ml/prepare_food101_research.py`](../../ml/prepare_food101_research.py) and [`ml/train_classifier.py`](../../ml/train_classifier.py). Local dataset files and model artifacts are excluded from Git.

Sources: [Food-101 dataset card and rights notice](https://huggingface.co/datasets/ethz/food101), [pinned SigLIP 2 checkpoint](https://huggingface.co/google/siglip2-base-patch16-224/tree/75de2d55ec2d0b4efc50b3e9ad70dba96a7b2fa2).

