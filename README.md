# NEMO

NEMO helps travelers find food they miss or want to try. A traveler uploads or takes a food photo, NEMO identifies likely dishes, finds nearby restaurants that serve them or similar food, and provides useful restaurant information and directions.

## Product principles

- Be honest about uncertain food matches and incomplete restaurant information.
- Give users practical ways to refine results: location, distance, cuisine, price, and dietary needs.
- Respect the license and terms of every data provider. Publicly viewable does not automatically mean reusable or storable.
- Collect the minimum personal data needed, and keep account credentials under NEMO's control through a reputable authentication system.
- Design for multiple languages and regions from the start.

## Initial product scope

Start with a single launch area and validate the core flow:

1. User supplies a food photo or searches for a dish by name.
2. NEMO suggests likely dish names and cuisines, with a confidence-aware explanation.
3. User chooses a match and sees nearby restaurants with supporting evidence that they serve similar food.
4. User reviews available business details and opens a map route.

Accounts, saved places, Google/Apple sign-in, broad multilingual coverage, and additional countries should follow the core validation unless a launch requirement makes them essential.

## Project planning

- [Product requirements and coverage checklist](docs/product-requirements.md)
- [Data sources and reuse constraints](docs/data-sources.md)

## Data handling boundary

NEMO should own its account records, user preferences, consent records, and first-party data it is entitled to collect. External place, review, photo, map, and route data must be treated according to each source's current license and API terms. Do not scrape sites or build a permanent mirror of provider content without explicit rights. Keep provider-backed content in the provider's permitted display flow; only persist identifiers or fields when the applicable terms allow it.

## Current status

The GitHub repository was empty when project work began. This repository currently contains the initial product and data planning documents; an application stack and launch geography have not yet been selected.
