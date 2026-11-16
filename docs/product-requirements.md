# NEMO product requirements and coverage checklist

## Goal

Help a traveler find a familiar or desired dish in an unfamiliar place, understand why a restaurant is a plausible match, and get there.

## Market rollout

- **First market:** Republic of Ireland, beginning in Dublin.
- **Coverage sequence:** for each country, launch in the capital city first; validate restaurant/menu coverage and matching quality; then expand to other major areas in that country.
- **Next markets:** after Ireland, repeat the capital-first sequence one European country at a time, with a coverage, localization, and data-rights review for each.
- **Boundary:** Northern Ireland is part of the UK, with separate data and regulatory considerations. Include it only if the intended first launch is across the whole island.

## Primary user journey

1. **Set location:** use device location with permission, or let the user search/select a city or neighborhood manually.
2. **Provide food intent:** take/upload a food photo or type a dish name. Photo use and retention are explained before upload.
3. **Resolve the dish:** return a small set of likely dishes, cuisine/local aliases, and confidence. Allow correction and text search when recognition is uncertain.
4. **Find places:** rank nearby restaurants using dish/menu evidence, cuisine, distance, opening status, and user filters. Do not imply a restaurant serves a dish without evidence.
5. **Compare:** show source-attributed details, rating context, opening hours, price where available, and data freshness where useful.
6. **Navigate:** show the results on a map and offer a route through a supported mapping provider.
7. **Improve:** allow correction/reporting of stale or mismatched listings. Only collect ratings/reviews from NEMO users if moderation, abuse handling, and legal terms are ready.

## Coverage checklist

### Product and UX

- [ ] Pick one launch city/region and define a measurable pilot success criterion.
- [ ] Define target users, supported devices, and minimum network assumptions.
- [ ] Design photo, typed search, no-match, low-confidence, and permission-denied states.
- [ ] Provide filters for distance, cuisine, price, open now, and dietary needs where reliable data exists.
- [ ] Explain why a place matched (menu evidence, cuisine/category, or user-provided tag).
- [ ] Include source attribution and a way to open the source listing where required.
- [ ] Make results usable without creating an account; require sign-in only for account features.

### Data and machine learning

- [ ] Select licensed place and map sources for the pilot region.
- [ ] Decide which fields NEMO may store, cache, display, or derive for each provider.
- [ ] Define a canonical restaurant schema with provenance and `last_verified_at`.
- [ ] Establish dish taxonomy, translations, transliterations, aliases, and regional variants.
- [ ] Choose an image model/dataset with rights suitable for the intended use; evaluate across cuisines and image conditions.
- [ ] Define confidence thresholds, fallback to text search, and a feedback/correction process.
- [ ] Avoid training on user photos by default; get explicit opt-in and set deletion/retention rules if training use is introduced.
- [ ] Track coverage gaps and freshness by region instead of claiming complete worldwide data.

### Maps and location

- [ ] Select map tiles/rendering, geocoding, place search, and routing providers independently or as a compatible bundle.
- [ ] Obtain location permission only when needed and support manual location entry.
- [ ] Minimize precision and retention of location history; avoid retaining raw location unless a feature needs it.
- [ ] Check attribution, caching, offline, and display restrictions for each map/places provider.
- [ ] Handle inaccessible routes, mobility needs, and route-provider handoff gracefully.

### Restaurant details, ratings, and reviews

- [ ] Decide whether NEMO displays provider ratings/reviews live, links out, or builds its own first-party review system.
- [ ] Keep provider content separate by source; never merge ratings into a misleading NEMO-wide score.
- [ ] Show rating scale, review count, source, and freshness when available.
- [ ] Design stale listing, duplicate listing, closed business, and correction workflows.
- [ ] Do not scrape review sites or copy provider content into NEMO's database without explicit permission.

### Languages and regional support

- [ ] Choose launch languages and define translation ownership/review.
- [ ] Localize interface, dish search aliases, units, currency, time, and address formats.
- [ ] Handle right-to-left scripts, diacritics, transliteration, and local restaurant naming conventions.
- [ ] Keep machine-translated descriptions visibly distinct where errors could mislead users.
- [ ] Identify regional dietary terminology and avoid presenting unverified allergen claims as facts.

### Accounts, privacy, and security

- [ ] Create a data inventory and retention/deletion schedule before collecting personal data.
- [ ] Use a managed identity provider or a well-reviewed authentication library; never store plaintext passwords.
- [ ] Add secure session handling, rate limits, abuse protection, account recovery, and optional MFA where appropriate.
- [ ] Keep secrets server-side; use least-privilege database roles, encryption in transit/at rest, backups, and access auditing.
- [ ] Separate user identity/profile data from restaurant/provider content.
- [ ] Publish privacy notice, terms, cookie/analytics choices as applicable, and clear photo/location handling notices.
- [ ] Provide account export/deletion and photo deletion paths.
- [ ] Assess applicable privacy and consumer rules for launch markets before production.
- [ ] Add Google/Apple login only through their official OAuth/OIDC flows when credentials and configuration are available.

### Operations and quality

- [ ] Choose an application stack, hosting region, database, image storage, and deployment process.
- [ ] Set service budgets and quotas for maps, place lookups, image inference, and storage.
- [ ] Add structured logs, error reporting, uptime monitoring, and provider outage handling without logging secrets or raw photos.
- [ ] Define backup/restore, incident response, and key rotation procedures.
- [ ] Establish accessibility expectations, including screen-reader labels, contrast, and non-photo search paths.
- [ ] Define a verification plan covering search relevance, location accuracy, privacy/security, accessibility, and supported languages.

## Suggested pilot release

The pilot should prove photo/text dish intent → useful nearby matches → trustworthy evidence → directions in one region. Keep sign-in optional. Use a provider for live review content unless NEMO has explicit rights to store it. Make restaurant/menu evidence and coverage quality visible; do not promise a match when the evidence is weak.

## Decisions still needed

- Which Irish areas to add after Dublin, and what qualifies as a major area in each country
- Mobile, web, or both for the first client
- Preferred implementation stack and hosting constraints
- Initial languages
- Whether the first release needs accounts or can remain guest-first
- Budget range for commercial place/map APIs
