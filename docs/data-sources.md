# NEMO data sources and reuse plan

This is a candidate inventory, not blanket authorization to copy every publicly accessible dataset. Before integration, record the provider, fields used, license/contract, attribution, retention/caching rules, region coverage, refresh method, and owner for every source. Re-check live terms before launch because they can change.

NEMO's discovery scope is all European countries. A country or data field is enabled only when a useful source exists and its license/terms allow the intended use. Keep a coverage registry by country and field; mark unsupported coverage clearly when no suitable source is available. Publicly viewable, downloadable, and legally reusable are different conditions.

## Candidate sources

| Need | Candidate source | Useful information | Reuse / operational notes |
|---|---|---|---|
| Open map and points of interest | [OpenStreetMap (OSM)](https://www.openstreetmap.org/copyright) | Road geometry, addresses and mapped amenities such as restaurants where contributors have added them | OSM data is under ODbL and requires attribution; database use and derived database obligations need review. Public tile and routing servers have separate usage policies; do not assume the community servers are a production backend. |
| Global open place directory | [Foursquare Open Source Places](https://docs.foursquare.com/data-products/docs/access-fsq-os-places) | Global POIs including restaurants; names, coordinates, addresses, locality, country, categories, freshness/closure dates, phone, and website where available | Free dataset under Apache 2.0 with required Foursquare attribution. Access is through the Places Portal/Iceberg catalog using an account and token. Assess per-country coverage/freshness. It does not provide menus or a review corpus. |
| Commercial place search/details | [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) | Place search, details, some photos and reviews, depending on fields and availability | Google requires attribution and has restrictions on caching/storing Places content. Place results shown on a map have display requirements. Use the official API and read current terms; do not create a permanent copy in NEMO's database by default. |
| Commercial place catalog | [Foursquare Places](https://foursquare.com/products/places/) | Place search/details and, on applicable endpoints, photos/tips | Pay-as-you-go pricing and API license terms apply. Confirm permitted storage, derived data, and review/photo usage for NEMO's exact plan. |
| Open place directory | [Foursquare Open Source Places](https://docs.foursquare.com/data-products/docs/access-fsq-os-places) | Business names, coordinates, address, locality, country, categories, refreshed/closed dates, phone, and website where available | Free dataset under Apache 2.0 with Foursquare attribution requirements. Access is through the Foursquare Places Portal/Iceberg catalog (account and access token required). It is a POI foundation, not a source of restaurant menus, ratings, or reviews. Verify Ireland coverage and freshness before relying on it. |
| Business listings and reviews | [Yelp Fusion API](https://docs.developer.yelp.com/docs/getting-started) | Business search and local review content where available | Access and displayed review volume may be limited by API terms and geographic coverage. Confirm display/attribution and retention terms before relying on it. |
| Food image benchmark | [Food-101 dataset](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/) | Research benchmark images and 101 dish categories for model experiments | Review the dataset's license and intended-use terms before training or shipping. It is a benchmark, not live restaurant/menu coverage. |
| Food/product terminology | [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing) and curated NEMO taxonomy | Multilingual labels, aliases, links, and structured identifiers for dishes/cuisines | Wikidata's structured data is CC0; verify the license of any linked text/media separately. Editorial review is needed for regional aliases and food meaning. |
| Restaurant menu evidence | Restaurant-owned websites/menus and direct restaurant submissions | Dish names, descriptions, ingredients, prices, hours | Respect site terms and copyright; get permission or use a documented feed/partnership. Prefer restaurant-submitted data or outbound links over copying menus wholesale. |
| NEMO first-party quality data | User corrections and optional restaurant submissions | Updates to hours, dish availability, accessibility notes, and listing corrections | Keep provenance, consent, moderation, abuse controls, and deletion/reporting workflows. Separate first-party user content from provider data. |

## Ireland-first data findings

- [Data.gov.ie](https://data.gov.ie/) is Ireland's official open-data portal. Search results identify tourism and public-sector datasets, but this initial review did not establish a complete nationwide restaurant/menu directory. Check individual dataset licenses, freshness, and coverage before use.
- [Fáilte Ireland Open Data](https://www.failteireland.ie/en/info/open-data) is useful tourism context. Its developer portal lists accommodation, activities, and attractions; the activities/attractions data covers businesses registered to appear on DiscoverIreland.ie and VisitDublin.com. The Activities and Attractions dataset is listed under CC BY 4.0. Treat it as supplementary visitor information, not as a complete restaurant directory or menu source. The free Open Data API has usage limits; the Open Data Plus API requires a subscription.
- [Foursquare Open Source Places](https://docs.foursquare.com/data-products/docs/access-fsq-os-places) is a strong candidate for a reusable business directory: the published schema includes name, coordinates, address/locality, categories, `date_refreshed`, `date_closed`, phone, and website where present. Foursquare documents the dataset under Apache 2.0 with attribution requirements. Access now uses an account/token and Iceberg catalog. It does not include the menu and review evidence NEMO needs; measure its Dublin coverage and freshness before choosing it as the primary place seed.
- [OpenStreetMap (OSM)](https://www.openstreetmap.org/copyright) is a second open source for restaurant/cafe POIs plus road and map geometry. Coverage depends on local contributions, and ODbL attribution/database conditions apply. Compare it with Foursquare for Dublin gaps and duplicates. It does not establish authoritative menu availability, ratings, or reviews.
- Google Places needs special review for an Ireland launch. Google documents different EEA terms for projects with an EEA billing address. Those terms restrict use of most Places API content "with any map" (with specified exceptions such as place IDs and coordinates). NEMO's map-and-restaurant-results flow must be checked against the exact current agreement before choosing Google Places.
- No current nationwide, openly reusable food-inspection outcome feed was verified in this review. Do not present inspection or hygiene scores unless an authoritative source and reuse right are confirmed.

## Europe-wide public-data strategy

- Use Foursquare Open Source Places and OSM as candidate baseline datasets for every European country they cover. Measure actual coverage, freshness, duplicates, and closure quality by country before enabling a country in the app.
- Use each country's official open-data portal and tourism/municipal sources to add local data. Read each dataset's license and update schedule; national portals aggregate publishers and do not guarantee a common restaurant schema or complete restaurant coverage.
- Use Wikidata's CC0 structured data and a NEMO-reviewed taxonomy for dish/cuisine names, alternate spellings, and multilingual aliases. Do not treat a taxonomy as evidence that a restaurant serves a dish.
- There is no single verified, reusable public dataset covering menus, reviews, and ratings across Europe. Keep menu evidence unavailable unless permissioned restaurant data or another licensed source supports it. For ratings/reviews, use an authorized provider integration or NEMO's own moderated reviews; never scrape review sites.
- Add a country/region record to a coverage registry with supported fields, source IDs, license/terms, attribution, freshness, and quality status. Enable only country-field combinations that pass the source and quality checks; otherwise return a clear no-coverage state.

### Capital-first country rollout

For user-facing rollout in each country, start in its capital city. Data-source discovery can happen across Europe in parallel. Record restaurant/place coverage, menu evidence, freshness, language support, and provider rights for each country and area. Once a capital experience meets the product's quality bar, expand coverage to the country's other major areas. Repeat rights and quality checks per country; do not assume they transfer across borders.

### Ireland pilot source direction

Compare Foursquare Open Source Places with OSM in Dublin as open, attributable sources for base listings and map geometry, then run the same coverage audit across other European capitals in parallel. Measure coverage, freshness, duplicate rate, and closure errors before enabling a country. Use restaurant-submitted or permissioned menus for dish-level evidence. For ratings/reviews, evaluate a separately licensed live provider or build NEMO's own clearly labeled review system; the open datasets above do not supply the needed review corpus. Keep Fáilte Ireland attractions and activities as optional tourism context. Avoid depending on scraped directories or public visibility alone as permission to reuse.

## Suggested source strategy

1. **Pilot with one licensed place source plus one map/routing option.** Compare coverage, costs, and contractual rights in the chosen city before picking.
2. **Keep a provider adapter boundary.** Normalize only fields NEMO is allowed to retain. Store provider IDs only when permitted; fetch restricted fields live and render the required attribution/source link.
3. **Use OSM where its license and coverage fit.** It can provide an open geographic foundation, but completeness and restaurant detail vary by location.
4. **Use restaurant menu evidence for dish matching.** A cuisine category is not proof that a restaurant serves a particular dish. Prefer licensed menu feeds, restaurant-submitted menus, or links to source menus.
5. **Treat reviews as source-owned content.** Do not scrape reviews, combine ratings from different scales, or retain reviews/photos without rights. If NEMO later collects its own reviews, keep them clearly labeled and build moderation and abuse handling.
6. **Use public food datasets for research only after license review.** Public access does not establish commercial training rights or permission to redistribute images.

## Canonical NEMO-owned records

NEMO should be able to maintain its own operational records without copying restricted provider content. A starting schema:

- `restaurant_id` (NEMO internal ID)
- `provider`, `provider_place_id` (only where the provider permits persistence)
- `display_name`, `location`, `address`, `categories` (each with field-level provenance and retention rules)
- `menu_evidence` (source URL or permissioned menu record, dish identifiers, evidence date)
- `opening_hours` and `price_level` (source, last checked, confidence)
- `rating_snapshot` only if the source expressly permits caching; otherwise retrieve live and display per its rules
- `created_at`, `updated_at`, `last_verified_at`, `status`, `region`

Avoid storing raw third-party review text, review photos, or provider map content unless the relevant agreement explicitly grants that right.

## Data governance checklist

- [ ] Maintain a source register and save the applicable terms/license version and review date.
- [ ] Record provenance and rights at field level, not only at table level.
- [ ] Implement deletion/refresh jobs where the source requires expiry or re-fetching.
- [ ] Label inferred dish matches separately from confirmed menu items.
- [ ] Keep uploaded photos private by default, define short retention, and delete on user request.
- [ ] Do not use user photos for training unless the user has given specific, revocable consent.
- [ ] Review regional privacy, copyright, database, and consumer rules with qualified counsel before commercial launch.

## Official references

- [Google Places API policies and attributions](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Places EEA adjustments](https://developers.google.com/maps/comms/eea/places)
- [OpenStreetMap attribution guidance](https://osmfoundation.org/wiki/Attribution_Guidelines)
- [Ireland's open-data portal](https://data.gov.ie/)
- [Fáilte Ireland Open Data](https://www.failteireland.ie/en/info/open-data)
- [Fáilte Ireland Activities and Attractions dataset](https://data.gov.ie/dataset/tourism-activities-and-attractions)
- [Foursquare Places API pricing](https://foursquare.com/pricing/)
- [Foursquare Places API license agreement](https://foursquare.com/legal/terms/apilicenseagreement/)
- [Foursquare Open Source Places access and license details](https://docs.foursquare.com/data-products/docs/access-fsq-os-places)
- [Foursquare Open Source Places data schema](https://docs.foursquare.com/data-products/docs/places-os-data-schema)
- [Yelp Fusion API getting started](https://docs.developer.yelp.com/docs/getting-started)
- [Wikidata licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)
