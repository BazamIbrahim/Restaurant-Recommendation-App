# NEMO

NEMO helps travellers find familiar food in unfamiliar places. This repository contains the first Dublin-focused demonstration UI, the proposed database foundation, and an explicit AI retrieval design.

## Demo status

The current web demo has a responsive discovery screen, typed dish search, local photo preview, illustrative restaurant cards, a map-style preview, and an email/password sign-in interface. Search results and ratings are demonstration content; the photo preview is not connected to an image model; the map graphic is not a live map. Do not present the sample results as verified businesses or ratings.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Guest browsing works without credentials. To enable real sign-in, create a Supabase project, apply [`supabase/migrations/0001_nemo_core.sql`](supabase/migrations/0001_nemo_core.sql), copy `.env.example` to `.env.local`, and set the project URL and public anon key. Never put a Supabase service-role key in frontend code or commit `.env.local`. Supabase Auth handles password verification; NEMO does not store passwords. Saved-place UI and backend wiring are not implemented yet.

## AI model plan

The intended first retrieval prototype uses a pretrained OpenCLIP ViT-B/32 image/text encoder to create vectors, then scikit-learn KNN with cosine distance over a rights-cleared food reference set. Restaurant ranking compares the confirmed food vector with menu-evidence vectors using cosine similarity, then applies geographic and freshness filters. The KNN index is fitted to examples; this is not the same as training/fine-tuning the image encoder. NEMO has not trained a project-specific model. See [`docs/ai-architecture.md`](docs/ai-architecture.md) and the reference script in [`ml/recommend.py`](ml/recommend.py). Review each checkpoint and dataset's terms before use.

## Repository layout

- `src/` — demonstration interface and styles
- `docs/` — requirements, data sources, AI architecture, and market coverage
- `supabase/migrations/` — versioned database schema and row-level security policies
- `ml/` — isolated model/retrieval experiment
- `.env.example` — variable names only; no credentials

## Data and product boundaries

The data plan is Europe-wide. Dublin is the first end-to-end validation city; expand each country from its capital after data quality and rights are checked. Public visibility does not mean public reuse. Do not scrape Google reviews or copy provider-controlled ratings. With no paid API budget, use appropriately licensed place data, restaurant-submitted menu evidence, NEMO-owned feedback, and outbound map links. Show an unavailable/unknown state where evidence is missing.

The UI is built to show the journey, not to claim integrations that are not connected. Before a real launch, connect a licensed data source, a live map provider, an image inference service or device-side model, backups, account deletion, and security review. A free hosted database tier is suitable for a demo but may pause or lack production-grade backup/availability guarantees; verify the current provider plan before relying on it.

## Project planning

- [Product requirements and coverage checklist](docs/product-requirements.md)
- [Data sources and reuse constraints](docs/data-sources.md)
- [AI architecture and training plan](docs/ai-architecture.md)
- [Europe country coverage register](docs/europe-country-coverage.csv)

