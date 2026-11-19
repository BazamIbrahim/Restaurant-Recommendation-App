# NEMO

NEMO helps travellers find familiar food in unfamiliar places. This repository contains the first Dublin-focused demonstration UI, the proposed database foundation, and an explicit AI retrieval design.

## Demo status

The current web demo has a responsive discovery screen, typed dish search, local photo preview, a local Food-101 image-search button, a country/capital selector for 51 European and extended-European markets, and an email/password sign-in interface. Restaurant discovery links to OpenStreetMap place search; NEMO does not yet claim verified restaurant, menu, review, or rating data. The map graphic remains illustrative and is not used to position restaurant results.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by the command (normally `http://127.0.0.1:5173`). `npm run build` creates a static production bundle in `dist/`.

Guest browsing works without credentials. To enable real sign-in and saved searches, create a Supabase project, apply migrations `0001_nemo_core.sql` and `0002_saved_search_markets.sql` in order, copy `.env.example` to `.env.local`, and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The publishable key is public by design; row-level security protects the database. Never put a Supabase secret/service-role key in a `VITE_` variable or commit `.env.local`. Supabase Auth handles password verification; NEMO does not store passwords. Configure the exact site and redirect URLs in Supabase Auth before testing email confirmation or password reset.

The demo's `npm run dev` server binds to loopback only, serves a fixed allowlist of built app files, and sends browser security headers. For production hosting, configure equivalent security headers at the hosting provider; see [`docs/security-baseline.md`](docs/security-baseline.md). Do not use the local server as a production server.

## AI model plan

The local demo uses Google SigLIP 2 Base (`google/siglip2-base-patch16-224`) as a frozen image encoder, a logistic-regression classifier trained on a balanced Food-101 sample, and cosine KNN for similar benchmark images. Its held-out sample scores 90.94% top-1 and 99.21% top-5 across 101 labels. These are benchmark results, not worldwide accuracy. The image button runs inference through the loopback development server; restaurant discovery opens an external OpenStreetMap search and is not yet joined to verified dish/menu evidence. See [`docs/ai-architecture.md`](docs/ai-architecture.md) and the [training guide](ml/README.md).

## Demo control behavior

- **Photo:** choose/drop an image or tap **Take a photo** on a device with camera capture support. NEMO validates and previews it locally. **Search this image** sends it to the loopback development server, runs Food-101 classification and cosine-KNN retrieval, shows possible labels, and offers a button to search places with a chosen label. The image is held in a temporary file for inference and deleted afterward; it is not added to training.
- **Dish search and suggestions:** set the dish label, then open an OpenStreetMap search for restaurant records in the selected capital. The link does not confirm that a restaurant serves the dish.
- **Country/capital selector:** lists the current 51-market Europe coverage register and builds the public map search for that capital.
- **Map link:** opens OpenStreetMap. NEMO does not yet have live restaurant records, verified menus, reviews, or ratings; the decorative map is clearly labeled as an illustration.
- **Save search and saved-search icon:** require Supabase configuration, both migrations, and a signed-in account; saved searches keep their selected country/capital and are user-scoped by RLS.
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

The image-search endpoint is a local research integration using Food-101's limited label set. Before a real launch, replace it with a securely hosted or device-side model trained and evaluated on appropriately permissioned regional data, connect licensed restaurant/menu sources and a live map provider, and complete backups, account deletion, privacy, and security reviews. A free hosted database tier is suitable for a demo but may pause or lack production-grade backup/availability guarantees; verify the current provider plan before relying on it.

## Security checklist

See [`docs/security-baseline.md`](docs/security-baseline.md) for implemented controls, Supabase setup, and what remains before a public launch. Google/Apple sign-in, account deletion/export, live maps, and live restaurant data are not configured in this demo.

## Project planning

- [Product requirements and coverage checklist](docs/product-requirements.md)
- [Data sources and reuse constraints](docs/data-sources.md)
- [AI architecture and training plan](docs/ai-architecture.md)
- [Europe contributor image collection protocol](docs/ai-research/europe-contributor-image-protocol.md)
- [Europe food image coverage register](docs/ai-research/europe-food-image-coverage.csv)
- [Europe country coverage register](docs/europe-country-coverage.csv)
