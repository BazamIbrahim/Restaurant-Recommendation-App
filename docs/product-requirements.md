# NEMO product requirements and coverage checklist

## Goal

Help a traveler find a familiar or desired dish in an unfamiliar place, understand why a restaurant is a plausible match, and get there.

## Budget constraint

- The first build must work without paid API usage or a payment card attached to a provider account.
- Prefer reusable open datasets and direct restaurant contributions. A free quota that requires billing or can incur overage charges is optional, not a required dependency.
- Google review content is not embedded in the no-budget MVP. Where possible, provide an outbound Google Maps link using venue information NEMO is entitled to use; do not scrape reviews.

## Market rollout

- **Data discovery scope:** all European countries. Discover and use public datasets and APIs when their licenses/terms allow NEMO's intended use. Track coverage by country and by data type. If a country or field has no reusable source, mark it unavailable rather than inventing or scraping data.
- **First product validation market:** Republic of Ireland, beginning in Dublin.
- **User-facing coverage sequence:** begin each country's experience in its capital city, validate place/menu coverage and matching quality, then expand to that country's other major areas.
- **Data ingestion scope:** public-data research and ingestion can cover multiple European countries from the start; Ireland-first describes the first end-to-end product validation, not a limit on data discovery.
- **Boundary:** Northern Ireland is part of the UK, with separate data and regulatory considerations. Include it only if the intended first launch is across the whole island.

The current demo has a selector for all 51 registered European and extended-European country/capital markets. Dublin alone has illustrative sample listings and an illustrative map. Other capitals display an explicit unverified-coverage state and open an outbound OpenStreetMap search. This selector is navigation scaffolding; it does not mean restaurant, menu, rating, review, or map coverage has been verified for those markets.

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
- [ ] No-budget MVP: use permitted outbound source links or moderated NEMO reviews; do not require a paid review API.
- [ ] If using Google reviews, request rating/count/reviews through the official Places API and display the required author attribution and source links; do not scrape reviews or store them as NEMO-owned content.
- [ ] For an EEA-billed Google Maps project, verify whether Places UI Kit supports the desired map and result experience; standard Places API content has EEA map-display restrictions.
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
- [ ] Use a persistent managed database the project team controls, with secure app access, backup/restore, and a clear availability target.
- [ ] For the initial no-budget build, evaluate a free database tier and its storage, availability, backup, and overage limits before relying on it.
- [ ] Build a usable UI for the first vertical slice: food photo/text input, dish confirmation, restaurant results, and map or route handoff.
- [ ] Keep the first database schema and UI limited to fields and flows needed by that slice; add broader country coverage incrementally.
- [ ] Set service budgets and quotas for maps, place lookups, image inference, and storage.
- [ ] Add structured logs, error reporting, uptime monitoring, and provider outage handling without logging secrets or raw photos.
- [ ] Define backup/restore, incident response, and key rotation procedures.
- [ ] Establish accessibility expectations, including screen-reader labels, contrast, and non-photo search paths.
- [ ] Define a verification plan covering search relevance, location accuracy, privacy/security, accessibility, and supported languages.

## Suggested pilot release

The pilot should prove photo/text dish intent → useful nearby matches → trustworthy evidence → directions in one region. Keep sign-in optional. Use a provider for live review content unless NEMO has explicit rights to store it. Make restaurant/menu evidence and coverage quality visible; do not promise a match when the evidence is weak.

## Decisions still needed

- Which Irish areas to add after Dublin, and what qualifies as a major area in each country
- Country coverage quality thresholds for enabling each capital and area
- Mobile, web, or both for the first client
- Preferred implementation stack and hosting constraints
- Initial languages
- Whether the first release needs accounts or can remain guest-first
- Budget range for commercial place/map APIs
