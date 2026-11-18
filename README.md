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

Open the local URL printed by the command (normally `http://127.0.0.1:5173`). `npm run build` creates a static production bundle in `dist/`.

Guest browsing works without credentials. To enable real sign-in and saved searches, create a Supabase project, apply [`supabase/migrations/0001_nemo_core.sql`](supabase/migrations/0001_nemo_core.sql), copy `.env.example` to `.env.local`, and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The publishable key is public by design; row-level security protects the database. Never put a Supabase secret/service-role key in a `VITE_` variable or commit `.env.local`. Supabase Auth handles password verification; NEMO does not store passwords. Configure the exact site and redirect URLs in Supabase Auth before testing email confirmation or password reset.

The demo's `npm run dev` server binds to loopback only, serves a fixed allowlist of built app files, and sends browser security headers. For production hosting, configure equivalent security headers at the hosting provider; see [`docs/security-baseline.md`](docs/security-baseline.md). Do not use the local server as a production server.

## AI model plan

The recommended first retrieval baseline is Google SigLIP 2 Base (`google/siglip2-base-patch16-224`) for multilingual image embeddings, followed by scikit-learn KNN with cosine distance over a rights-cleared meal-image catalog. Restaurant ranking joins nearest food examples to verified menu evidence, then applies geographic and freshness filters. The encoder is pretrained; the NEMO-specific model is not trained yet. KNN indexes examples and is not neural-network training. See [`docs/ai-architecture.md`](docs/ai-architecture.md) and the reference script in [`ml/recommend.py`](ml/recommend.py).

## Demo control behavior

- **Photo:** choose/drop an image or tap **Take a photo** on a device with camera capture support. NEMO validates and previews it locally; AI image search is not connected yet.
- **Dish search and suggestions:** update the illustrative result cards for the entered dish.
- **Sort:** toggles between best sample match and closest sample location.
- **Map pins and directions:** open an OpenStreetMap search for the matching cuisine in Dublin; the map drawing itself is illustrative.
- **Save search and saved-search icon:** require Supabase configuration and a signed-in account; saved searches are user-scoped by RLS.
- **Log in:** opens email/password sign-in, account creation, and password reset when Supabase is configured. Without it, the dialog explains setup and guest browsing remains available.

## Repository layout

- `src/` — demonstration interface and styles
- `docs/` — requirements, data sources, AI architecture, and market coverage
- `supabase/migrations/` — versioned database schema and row-level security policies
- `scripts/` — build and loopback-only local web server
- `ml/` — isolated model/retrieval experiment
- `.env.example` — variable names only; no credentials

## Data and product boundaries

The data plan is Europe-wide. Dublin is the first end-to-end validation city; expand each country from its capital after data quality and rights are checked. Public visibility does not mean public reuse. Do not scrape Google reviews or copy provider-controlled ratings. With no paid API budget, use appropriately licensed place data, restaurant-submitted menu evidence, NEMO-owned feedback, and outbound map links. Show an unavailable/unknown state where evidence is missing.

The UI is built to show the journey, not to claim integrations that are not connected. Before a real launch, connect a licensed data source, a live map provider, an image inference service or device-side model, backups, account deletion, and security review. A free hosted database tier is suitable for a demo but may pause or lack production-grade backup/availability guarantees; verify the current provider plan before relying on it.

## Security checklist

See [`docs/security-baseline.md`](docs/security-baseline.md) for implemented controls, Supabase setup, and what remains before a public launch. Google/Apple sign-in, account deletion/export, live maps, and live restaurant data are not configured in this demo.

## Project planning

- [Product requirements and coverage checklist](docs/product-requirements.md)
- [Data sources and reuse constraints](docs/data-sources.md)
- [AI architecture and training plan](docs/ai-architecture.md)
- [Europe country coverage register](docs/europe-country-coverage.csv)

