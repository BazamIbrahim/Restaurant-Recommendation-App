# NEMO data sources and reuse plan

This is a candidate inventory, not blanket authorization to copy every publicly accessible dataset. Before integration, record the provider, fields used, license/contract, attribution, retention/caching rules, region coverage, refresh method, and owner for every source. Re-check live terms before launch because they can change.

NEMO's discovery scope is all European countries. A country or data field is enabled only when a useful source exists and its license/terms allow the intended use. Keep a coverage registry by country and field; mark unsupported coverage clearly when no suitable source is available. Publicly viewable, downloadable, and legally reusable are different conditions.

The current budget is zero for paid APIs. Design the MVP so paid services are optional. A free quota that still requires billing or can incur overages is not considered a zero-cost dependency.

The initial market inventory is in [europe-country-coverage.csv](europe-country-coverage.csv). It uses the UN M49 Europe grouping and separately tracks extended European markets that are sometimes grouped outside Europe in statistical classifications. All source-coverage values start as unverified until we measure real dataset coverage; this avoids treating global availability as proof of local completeness.

## Candidate sources

| Need | Candidate source | Useful information | Reuse / operational notes |
|---|---|---|---|
| Open map and points of interest | [OpenStreetMap (OSM)](https://www.openstreetmap.org/copyright) | Road geometry, addresses and mapped amenities such as restaurants where contributors have added them | OSM data is under ODbL and requires attribution; database use and derived database obligations need review. Public tile and routing servers have separate usage policies; do not assume the community servers are a production backend. |
| Global open place directory | [Foursquare Open Source Places](https://docs.foursquare.com/data-products/docs/access-fsq-os-places) | Global POIs including restaurants; names, coordinates, addresses, locality, country, categories, freshness/closure dates, phone, and website where available | Free dataset under Apache 2.0 with required Foursquare attribution. Access is through the Places Portal/Iceberg catalog using an account and token. Assess per-country coverage/freshness. It does not provide menus or a review corpus. |
| Live restaurant discovery and Google reviews | [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) | Search restaurant listings and fetch current business details, aggregate rating/count, and up to five user reviews for a place | Deferred while the budget is zero. Google offers monthly free usage caps per SKU, but API access requires a billing account and overages can cost money. If added later: attribute reviews, link to Google Maps, avoid prohibited storage, and use Places UI Kit for map-adjacent Places content under EEA terms. |
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
- Google Places API (New) can return average rating and rating count, and up to five reviews per restaurant when requested. Review content is a live provider result, not a dataset NEMO can freely copy into its database. Attribution, direct source links, and review display policies apply.
- No current nationwide, openly reusable food-inspection outcome feed was verified in this review. Do not present inspection or hygiene scores unless an authoritative source and reuse right are confirmed.

## Europe-wide public-data strategy

- Use Foursquare Open Source Places and OSM as candidate baseline datasets for every European country they cover. Measure actual coverage, freshness, duplicates, and closure quality by country before enabling a country in the app.
- Use each country's official open-data portal and tourism/municipal sources to add local data. Read each dataset's license and update schedule; national portals aggregate publishers and do not guarantee a common restaurant schema or complete restaurant coverage.
- Use Wikidata's CC0 structured data and a NEMO-reviewed taxonomy for dish/cuisine names, alternate spellings, and multilingual aliases. Do not treat a taxonomy as evidence that a restaurant serves a dish.
- There is no single verified, reusable public dataset covering menus, reviews, and ratings across Europe. Keep menu evidence unavailable unless permissioned restaurant data or another licensed source supports it. For ratings/reviews, use an authorized provider integration or NEMO's own moderated reviews; never scrape review sites.
- Add a country/region record to a coverage registry with supported fields, source IDs, license/terms, attribution, freshness, and quality status. Enable only country-field combinations that pass the source and quality checks; otherwise return a clear no-coverage state.

### Zero-budget MVP source plan

- Use Foursquare Open Source Places as a candidate global directory and OSM for open geographic data. Both require license compliance and attribution. Foursquare access requires a Places Portal account/token; OSM production tiles and routing need an appropriate service or self-hosted deployment.
- Add official national open datasets only when their licenses permit the intended reuse. Do not assume every country's portal has restaurant listings.
- For dish-level matches, start with a NEMO-curated dish taxonomy and restaurant-submitted or permissioned menu evidence. Without menu evidence, show a lower-confidence cuisine/category match or mark dish availability unknown.
- For Google reviews, provide an outbound Google Maps search/listing link using venue information NEMO is entitled to use. Do not copy review text or ratings from web pages. Later, NEMO can collect moderated first-party reviews or add Google Places when billing is available.
- Keep paid-provider integrations disabled by default. If Google free quotas are explored later, set hard quotas and alerts first; Google requires a billing account and may bill or stop requests after free thresholds.

### Capital-first country rollout

For user-facing rollout in each country, start in its capital city. Data-source discovery can happen across Europe in parallel. Record restaurant/place coverage, menu evidence, freshness, language support, and provider rights for each country and area. Once a capital experience meets the product's quality bar, expand coverage to the country's other major areas. Repeat rights and quality checks per country; do not assume they transfer across borders.

### Ireland pilot source direction

For the no-budget Ireland pilot, compare Foursquare Open Source Places and OSM as open base sources. Measure country/capital coverage, freshness, duplicates, and closure errors before enabling each country. Use restaurant-submitted or permissioned menus for dish-level evidence; provide an outbound Google Maps search link for reviews. Keep Fáilte Ireland attractions and activities as optional tourism context. Add Google Places API/Places UI Kit only when the project can safely support billing and has reviewed EEA display rules. Avoid scraped directories or public visibility alone as permission to reuse.

### Google review and restaurant data boundary

- Google Places API can provide `rating`, `userRatingCount`, and at most five `reviews` for a place request. Reviews are selected and returned by Google; NEMO does not receive a complete review archive.
- Retrieve only what the interface needs, on demand. Show Google/author attribution and the per-review Google Maps source link.
- Store the Google Place ID to refresh data. Do not treat Google names, addresses, ratings, review text, or photos as NEMO-owned permanent records unless current written terms explicitly allow a field and retention period.
- For an EEA billing account, use Places UI Kit if the product must show Google Places content alongside a map. Google says the standard Places API content generally cannot be used with any map in those EEA terms. This may constrain NEMO's custom visual design and must be checked before development.
- Keep NEMO-owned user records, user-submitted menu evidence, consent, and account data in NEMO's database, separately from provider-controlled Google content.

## Suggested source strategy

1. **Pilot with one licensed place source plus one map/routing option.** Compare coverage, costs, and contractual rights in the chosen city before picking.
2. **Keep a provider adapter boundary.** Normalize only fields NEMO is allowed to retain. Store provider IDs only when permitted; fetch restricted fields live and render the required attribution/source link.
3. **Use OSM where its license and coverage fit.** It can provide an open geographic foundation, but completeness and restaurant detail vary by location.
4. **Use restaurant menu evidence for dish matching.** A cuisine category is not proof that a restaurant serves a particular dish. Prefer licensed menu feeds, restaurant-submitted menus, or links to source menus.
5. **Treat reviews as source-owned content.** Do not scrape reviews, combine ratings from different scales, or retain reviews/photos without rights. With no API budget, link out to Google Maps or collect clearly labeled NEMO reviews after moderation and abuse handling are ready.
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
