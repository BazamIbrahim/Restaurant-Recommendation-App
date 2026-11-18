# NEMO

NEMO helps travelers find food they miss or want to try. A traveler uploads or takes a food photo, NEMO identifies likely dishes, finds nearby restaurants that serve them or similar food, and provides useful restaurant information and directions.

## Product principles

- Be honest about uncertain food matches and incomplete restaurant information.
- Give users practical ways to refine results: location, distance, cuisine, price, and dietary needs.
- Respect the license and terms of every data provider. Publicly viewable does not automatically mean reusable or storable.
- Collect the minimum personal data needed, and keep account credentials under NEMO's control through a reputable authentication system.
- Design for multiple languages and regions from the start.

## Initial product scope

NEMO's data plan is Europe-wide: use reusable public sources wherever they provide useful coverage, and leave countries or data types unsupported when there is no source NEMO can lawfully use. Ireland is the first product validation market, beginning in Dublin. For every country, begin user-facing coverage in its capital, validate data quality and the user journey, then expand to its other major areas. This capital-first product rollout does not limit public-data discovery or ingestion to Ireland.

Validate the core flow:

1. User supplies a food photo or searches for a dish by name.
2. NEMO suggests likely dish names and cuisines, with a confidence-aware explanation.
3. User chooses a match and sees nearby restaurants with supporting evidence that they serve similar food.
4. User reviews available business details and opens a map route.

Accounts, saved places, Google/Apple sign-in, broad multilingual coverage, and additional countries should follow the core validation unless a launch requirement makes them essential.

For planning, "Ireland" means the Republic of Ireland, with Dublin as its first city. Northern Ireland has distinct country-level data and rules and should be planned as a separate UK market unless the launch scope is explicitly the whole island.

## Project planning

- [Product requirements and coverage checklist](docs/product-requirements.md)
- [Data sources and reuse constraints](docs/data-sources.md)
- [Europe country coverage register](docs/europe-country-coverage.csv)

## Data handling boundary

NEMO should own its account records, user preferences, consent records, and first-party data it is entitled to collect. External place, review, photo, map, and route data must be treated according to each source's current license and API terms. Do not scrape sites or build a permanent mirror of provider content without explicit rights. Keep provider-backed content in the provider's permitted display flow; only persist identifiers or fields when the applicable terms allow it.

## No-budget starting mode

The first build should not depend on paid APIs. Start with reusable open place/map data and restaurant-submitted information. For Google reviews, link users to Google Maps rather than scraping or embedding review content. Paid or billing-backed APIs can be added later as optional integrations.

## Core platform needs

NEMO needs a persistent database that the project team controls and the app can access reliably, plus a usable interface for trying the core food-to-restaurant journey and inspecting the data. Start with only the database records and UI screens needed for that first slice. Choose infrastructure with availability, backup, security, and free-tier limits in mind; do not promise 24/7 availability until the selected service and operating budget support it.

## Current status

The GitHub repository contains NEMO's product and data planning documents. Ireland is the first product validation market, Dublin is the first city, and the project is currently planned for a no-budget start using reusable public data. An application stack has not yet been selected.
