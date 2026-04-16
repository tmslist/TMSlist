# GEO / AEO Audit Report
**TMS List Codebase** | Audited: 2026-04-16

---

## Summary Table of Findings

| # | Category | Severity | File(s) | Issue |
|---|----------|----------|---------|-------|
| 1 | Structured Data | HIGH | `src/pages/clinic/[slug].astro` | Clinic pages render `<details>` FAQ HTML but no `FAQPage` JSON-LD injected |
| 2 | Structured Data | HIGH | `src/pages/clinic/[slug].astro` | Individual `Review` schema not emitted for patient reviews (only aggregate `AggregateRating`) |
| 3 | Structured Data | HIGH | `src/pages/clinic/[slug].astro` | `acceptsNewPatients` property missing from `MedicalClinic` schema |
| 4 | Structured Data | HIGH | `src/pages/clinic/[slug].astro` | `areaServed` property missing from `MedicalClinic` schema (GBP relevance) |
| 5 | Structured Data | HIGH | All country pages | Non-US country pages (uk/, de/, fr/, etc.) hardcode `ratingCount` / `reviewCount` defaults (50) instead of real per-country data |
| 6 | Structured Data | HIGH | `src/pages/index.astro` lines 308–321 | `ClaimReview` schema contains inflated/fabricated stats (e.g., "28,000+ patients treated through TMS List referrals") — Google may penalize for unverified claims |
| 7 | Structured Data | HIGH | `src/utils/schema.ts` | `generateLocalBusinessSchema()` exists but is **never called** anywhere in the codebase |
| 8 | Structured Data | HIGH | `src/components/FAQSchema.astro`, `src/pages/questions/[slug].astro` | `FAQSchema.astro` component exists but is **never imported/used** in any page; questions page manually emits its own FAQPage JSON-LD |
| 9 | Structured Data | MEDIUM | `src/pages/us/[state]/index.astro`, `src/pages/us/[state]/[city]/index.astro` | State/city pages have no FAQ section and no FAQPage JSON-LD despite `ContentFAQ.astro` existing |
| 10 | Structured Data | MEDIUM | `src/pages/us/[state]/index.astro` line 45 | State page H1 title is static `"Top TMS Clinics in {stateName}"` — missing local intent modifiers like "near me", "affordable", "with insurance" |
| 11 | Structured Data | MEDIUM | `src/pages/us/[state]/[city]/index.astro` line 157 | City page H1 same pattern — static title, no location modifiers |
| 12 | Structured Data | MEDIUM | `src/components/StateHero.astro` lines 56–64 | H1 hardcoded as `"Top TMS Clinics in {stateName}"` — not parameterized for keyword injection |
| 13 | Structured Data | MEDIUM | `src/utils/schema.ts` | `generateHowToSchema()`, `generateQAPageSchema()`, `generateSpeakableFAQSchema()`, `generateCourseSchema()` all exist but are **never used** in any page |
| 14 | NAP / Machine-Readable | MEDIUM | `src/components/ClinicCard.astro` | NAP displayed visually (`clinic.name`, `city/state`, phone via button) but no `LocalBusiness` / `MedicalClinic` JSON-LD microdata on the card |
| 15 | NAP / Machine-Readable | MEDIUM | `src/components/react/ClinicMap.tsx` lines 27–41 | `MapClinic` interface has lat/lng but no machine-readable address/NAP in the rendered markup |
| 16 | GBP Signals | MEDIUM | `src/pages/clinic/[slug].astro` | Clinic detail page does NOT render a "Claim this business" CTA link for owners |
| 17 | GBP Signals | MEDIUM | `src/pages/clinic/[slug].astro` | No `priceRange` in structured data on non-clinic detail pages (state/city list pages) |
| 18 | AEO / Featured Snippets | MEDIUM | `src/pages/questions/[slug].astro` | Question heading rendered as `<h1>` without question-format prefix in some cases; "People Also Ask" section correctly present |
| 19 | AEO / Featured Snippets | LOW | `src/pages/questions/[slug].astro` | `generateQAPageSchema()` (more AEO-powerful than `FAQPage`) exists but questions page emits `FAQPage` instead |
| 20 | Review/Rating | MEDIUM | `src/components/GoogleReviews.astro` | Review form and display component lacks `Review` or `ReviewBody` JSON-LD output for individual submitted reviews |
| 21 | Structured Data | LOW | `src/pages/us/[state]/[city]/index.astro` lines 84–109 | City page `CollectionPage` schema lacks `BreadcrumbList` (breadcrumb is declared in Layout but the schema only contains `CollectionPage`/`ItemList`) |
| 22 | GeoData | LOW | `src/pages/us/[state]/[city]/index.astro` line 322 | Inline Leaflet map on city pages uses `clinicsForMap` data but this geo data is not in JSON-LD |
| 23 | Schema Quality | LOW | `src/pages/clinic/[slug].astro` line 78 | `GeoCoordinates` uses `latitude`/`longitude` — correct per schema.org, but the `geo` field could also use `geo:lat`/`geo:long` alias for broader crawler compatibility |
| 24 | Schema Quality | LOW | `src/layouts/Layout.astro` line 43–52 | Breadcrumb schema uses `siteUrl + item.url` but does not validate URL construction — potential mismatches if `item.url` is already absolute |
| 25 | Organization | LOW | `src/layouts/Layout.astro` lines 162–175 | Only `WebSite` schema is output as a hardcoded block; no `Organization` schema with `name`, `logo`, `url`, `sameAs` (social profiles) |

---

## Detailed Findings

### 1. Clinic Detail Pages: Missing FAQPage JSON-LD
**Severity:** HIGH  
**File:** `src/pages/clinic/[slug].astro` lines 427–444

Clinic detail pages render FAQ content using HTML `<details>/<summary>` elements, but **no JSON-LD `FAQPage` schema is emitted**. This is a critical AEO gap — Google uses FAQ schema on clinic pages to generate featured snippets and "People Also Ask" placements.

The FAQ data (`clinic.faqs`) is available at build time. A `FAQPage` block should be injected into the `<Layout schema={...}>` or `extraSchemas` prop, e.g.:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": clinic.faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
  }))
}
```

---

### 2. Clinic Detail Pages: Missing Individual Review Schema
**Severity:** HIGH  
**File:** `src/pages/clinic/[slug].astro`, `src/components/GoogleReviews.astro`

`GoogleReviews.astro` fetches and renders individual patient reviews but emits **zero JSON-LD**. Only aggregate `AggregateRating` is in the page schema. For AEO and GBP signals, individual `Review` or `ReviewBody` schema entries should be included.

Each submitted review should emit a `Review` schema entry via `extraSchemas` or injected inline.

---

### 3. Missing `acceptsNewPatients` on MedicalClinic Schema
**Severity:** HIGH  
**File:** `src/pages/clinic/[slug].astro` lines 60–107

The `MedicalClinic` schema on clinic detail pages is missing the `acceptsNewPatients` boolean field. This is a high-value GBP-aligned field that Google reads for local business signals. The data (`isAcceptingNew` / `clinic.availability.accepting_new_patients`) exists in the Astro component but is not serialized into schema.

---

### 4. Missing `areaServed` on MedicalClinic Schema
**Severity:** HIGH  
**File:** `src/pages/clinic/[slug].astro` lines 60–107

No `areaServed` property in the `MedicalClinic` schema. For a directory covering 21 countries, this field should specify the city, state, and service radius. This helps Google understand the clinic's geographic relevance for "TMS near me" queries.

---

### 5. Hardcoded Review Counts on Non-US Country Pages
**Severity:** HIGH  
**Files:** `src/pages/uk/[region]/index.astro` (line 72), `src/pages/uk/[region]/[city]/index.astro` (line 61), `src/pages/au/[region]/[city]/index.astro` (line 58), and ~15 other country pages

All non-US country pages use:
```json
"reviewCount": typeof c.rating === 'object' ? c.rating?.count || 0 : 50
```
The `|| 50` fallback is a hardcoded default, not real data. This means the UK, Germany, Australia, France, Japan, South Korea, and 15+ other country/city pages all have fabricated review counts in their JSON-LD. Google may detect statistical inconsistencies.

---

### 6. Fabricated Stats in ClaimReview Schema on Homepage
**Severity:** HIGH  
**File:** `src/pages/index.astro` lines 299–347

The `ClaimReview` schema on the homepage includes:
- `"28,000+ patients treated through TMS List referrals"` (line 317)
- `"400+ verified TMS clinics listed on TMS List"` (line 309)

These are unverified, self-asserted claims. Google's Structured Data Guidelines for `ClaimReview` require that claims be substantiated by credible sources. Publishing inflated referral counts risks a manual action. These should either be removed or linked to verifiable external sources.

---

### 7. `generateLocalBusinessSchema()` Never Called
**Severity:** HIGH  
**File:** `src/utils/schema.ts` lines 61–91

The utility `generateLocalBusinessSchema()` exists and is well-structured with GeoCoordinates, PostalAddress, AggregateRating, and `medicalSpecialty`. However, it is **never imported or used** in any Astro page. This is a dead code path that should be wired into `clinic/[slug].astro` or the `ClinicCard` component.

---

### 8. `FAQSchema.astro` Component Never Imported
**Severity:** HIGH  
**Files:** `src/components/FAQSchema.astro`, `src/pages/questions/[slug].astro`

`FAQSchema.astro` is a clean, reusable FAQPage JSON-LD component. It is **never imported anywhere** in the codebase. The questions page (`questions/[slug].astro`) manually builds its own FAQPage JSON-LD inline instead of using the existing component. This creates duplication and maintenance risk.

---

### 9. State/City Pages Lack FAQ Content and Schema
**Severity:** MEDIUM  
**Files:** `src/pages/us/[state]/index.astro`, `src/pages/us/[state]/[city]/index.astro`

State and city landing pages have no FAQ section and no FAQPage JSON-LD, despite `ContentFAQ.astro` existing. Adding a location-specific FAQ (e.g., "Does insurance cover TMS in Texas?", "How much does TMS cost in Austin?") would significantly boost AEO performance for "near me" queries. The `LocationSEOContent` component provides SEO text but lacks FAQ markup.

---

### 10 & 11. State/City H1 Missing Local Intent Keywords
**Severity:** MEDIUM  
**Files:** `src/pages/us/[state]/index.astro` (line 45), `src/pages/us/[state]/[city]/index.astro` (line 157)

State page H1: `"Top TMS Clinics in {stateName}"` — static, no keyword modifiers.  
City page H1: `"TMS Therapy in {cityName}, {stateName}"` — location correct but no modifiers.

For AEO/local intent optimization, H1s should incorporate keyword modifiers relevant to searcher intent:
- `"Top TMS Clinics in {stateName} — Verified, Insurance-Covered"`
- `"TMS Therapy in {cityName}, {stateName} | Affordable & FDA-Cleared"`

---

### 12. `StateHero.astro` H1 Not Keyword-Parameterized
**Severity:** MEDIUM  
**File:** `src/components/StateHero.astro` lines 52–65

The `<h1>` is hardcoded as `"Top TMS Clinics in {stateName}"`. This component is reused across state pages and should accept a `keywordModifier` prop to inject dynamic intent keywords.

---

### 13. Multiple Schema Generators Never Used
**Severity:** MEDIUM  
**File:** `src/utils/schema.ts`

| Function | Purpose | Used? |
|----------|---------|-------|
| `generateHowToSchema()` | Step-by-step TMS prep guide | NO |
| `generateQAPageSchema()` | AEO-optimized QA page | NO |
| `generateSpeakableFAQSchema()` | FAQPage with SpeakableSpecification | NO |
| `generateCourseSchema()` | Educational program schema | NO |
| `generateLocalBusinessSchema()` | Full LocalBusiness/MedicalClinic | NO |
| `generateClaimReviewSchema()` | Verified stats schema | NO (manual implementation on homepage) |

These utilities represent investment that is not being realized. `generateQAPageSchema()` in particular would be more AEO-effective than the current `FAQPage` approach.

---

### 14. ClinicCard Lacks Machine-Readable NAP
**Severity:** MEDIUM  
**File:** `src/components/ClinicCard.astro`

Clinic cards display clinic name, city/state, and phone (via click-to-call button) but emit **zero JSON-LD microdata** or structured data. For AEO, each card on list pages should include embedded `MedicalClinic` or at minimum `PostalAddress` microdata. The `article[data-*]` attributes are present for JS use but are not standard schema.org vocabulary.

---

### 15. ClinicMap Lacks Machine-Readable NAP
**Severity:** MEDIUM  
**File:** `src/components/react/ClinicMap.tsx` lines 27–41

The `MapClinic` interface has `lat`, `lng`, `city`, `state`, `phone` but these are rendered as plain text in popups, not as structured data. Consider adding `PostalAddress` to each clinic's popup render.

---

### 16. No "Claim This Business" CTA on Clinic Pages
**Severity:** MEDIUM  
**File:** `src/pages/clinic/[slug].astro`

GBP optimization requires a visible "Claim this business" link for unclaimed listings. The clinic detail page sidebar has contact/booking CTAs but no ownership claim path. A link to `/claim-listing/?clinic={slug}` would be appropriate.

---

### 17. `priceRange` Missing on State/City List Pages
**Severity:** MEDIUM  
**Files:** `src/pages/us/[state]/index.astro`, `src/pages/us/[state]/[city]/index.astro`

The `MedicalClinic` entries in the `ItemList` schema on state/city pages omit `priceRange`. Google may use this for rich results. The data exists in `clinic.price_range`.

---

### 18. Question Headings Not Optimized for Featured Snippets
**Severity:** MEDIUM  
**File:** `src/pages/questions/[slug].astro` lines 58–62

The question heading uses `<h1>` with the raw question text. For featured snippet optimization, the heading should be preceded by a signal word like "Answer:" or wrapped with `speakable` CSS selectors. The page does have a "Quick Answer" highlight section which is good.

---

### 19. `generateQAPageSchema()` Not Used Over `FAQPage`
**Severity:** LOW  
**File:** `src/pages/questions/[slug].astro` line 267

`QAPage` schema is considered more AEO-powerful than `FAQPage` for Google AI Overviews. The utility exists but the page emits `FAQPage`. Switching would require a schema type change.

---

### 20. `GoogleReviews.astro` Missing Review JSON-LD
**Severity:** MEDIUM  
**File:** `src/components/GoogleReviews.astro`

Individual reviews (fetched from `/api/reviews`) are rendered as plain HTML. Each review should emit a `Review` schema entry:
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
  "author": { "@type": "Person", "name": "Patient" },
  "reviewBody": "..."
}
```

---

### 21. City Page Schema Missing BreadcrumbList
**Severity:** LOW  
**File:** `src/pages/us/[state]/[city]/index.astro` lines 84–109

The `citySchema` is a `CollectionPage`/`ItemList` but the breadcrumb declared in `Layout` is not included in the schema block. Adding the breadcrumb as a `BreadcrumbList` entry in the page schema would reinforce the site hierarchy for crawlers.

---

### 22. Inline Leaflet Map Data Not in JSON-LD
**Severity:** LOW  
**File:** `src/pages/us/[state]/[city]/index.astro` line 322

The city page passes `clinicsForMap` (lat/lng data) to an inline Leaflet script. This geo data should also appear in the `ItemList` schema for consistency.

---

### 23. GeoCoordinates: `geo:lat`/`geo:long` Alias Not Used
**Severity:** LOW  
**File:** `src/pages/clinic/[slug].astro` line 78

The schema uses `latitude`/`longitude` which is correct schema.org. However, for maximum crawler compatibility, `geo:lat` and `geo:long` (the older microformat aliases) can also be included as parallel properties. This is a minor redundancy.

---

### 24. Breadcrumb URL Construction Risk
**Severity:** LOW  
**File:** `src/layouts/Layout.astro` lines 43–52

The breadcrumb schema prepends `siteUrl` to `item.url` regardless of whether `item.url` is already absolute:
```javascript
"item": item.url.startsWith('http') ? item.url : `${siteUrl}${item.url || '/'}`
```
This logic is correct, but the guard clause may not handle edge cases (e.g., `//example.com`). A thorough audit of all breadcrumb data sources is recommended.

---

### 25. Missing Organization Schema
**Severity:** LOW  
**File:** `src/layouts/Layout.astro` lines 162–175

Only `WebSite` schema is hardcoded. An `Organization` schema with `name`, `logo`, `url`, `sameAs` (social profiles: Twitter, LinkedIn, Facebook, YouTube) should be added for E-E-A-T signals. The `WebSite` schema references `potentialAction.SearchAction` which is good, but the publisher organization is not explicitly defined.

---

## Positive Findings (Working Well)

1. **`MedicalClinic` schema on clinic detail pages** — well-structured with `GeoCoordinates`, `PostalAddress`, `AggregateRating`, `OpeningHoursSpecification`, and `priceRange` (`src/pages/clinic/[slug].astro` lines 60–107). This is the strongest schema implementation on the site.

2. **`FAQPage` schema on questions pages** — properly implemented in `src/pages/questions/[slug].astro` lines 265–279 with `Question` and `Answer` types.

3. **`FAQSchema.astro` component** — clean, reusable implementation even if currently unused.

4. **`ContentFAQ.astro` / `<details>` FAQ accordion** — properly implemented with semantic HTML (`<details>/<summary>`) on clinic detail pages.

5. **`BreadcrumbList` schema** — correctly implemented in `Layout.astro` and populated on all major page types.

6. **`HowTo` schema generator** — `generateHowToSchema()` in `src/utils/schema.ts` is comprehensive with `HowToSupply`, `HowToStep`, and `SpeakableSpecification`.

7. **`VideoObject` schema** — implemented with full publisher details, embed URL, and duration.

8. **hreflang tags** — comprehensive international hreflang coverage across all 21 country variants in `Layout.astro`.

9. **`ClinicMap.tsx`** — proper use of OpenStreetMap tiles (no Google Maps API key required), good accessibility with `aria-label` on the locate button.

10. **`StateHero.astro`** — good visual structure, displays verified clinic count prominently, clean gradient/image fallback.

---

## Priority Recommendations

### Immediate (Fix Before Next Deploy)
1. Add `FAQPage` JSON-LD to `clinic/[slug].astro` using `clinic.faqs` data
2. Add `Review` JSON-LD entries in `GoogleReviews.astro` for individual reviews
3. Replace `|| 50` hardcoded review counts in all non-US country pages with real data
4. Remove or source-verify the `ClaimReview` inflated stats on homepage
5. Wire `FAQSchema.astro` into the questions page (replace inline schema)
6. Add `acceptsNewPatients` and `areaServed` to clinic detail `MedicalClinic` schema

### Short-Term (1–2 Sprints)
7. Add FAQ sections to state/city landing pages using `ContentFAQ.astro`
8. Add `Claim this business` link to clinic detail sidebar
9. Add `priceRange` to `ItemList` entries on state/city pages
10. Parameterize `StateHero.astro` H1 for keyword modifiers
11. Integrate `generateLocalBusinessSchema()` into `ClinicCard` or list pages
12. Investigate adding `generateQAPageSchema()` for AEO edge over `FAQPage`

### Long-Term (Backlog)
13. Add Organization schema with `sameAs` social profiles to `Layout.astro`
14. Add `serviceArea` and `areaServed` to all clinic schemas
15. Add `Review` schema microdata to `ClinicMap.tsx` popups
16. Audit `generateHowToSchema()` and `generateCourseSchema()` usage on treatment/guide pages
17. Consider `SpeakableSpecification` on all FAQPage schemas for voice search

---

## Schema Coverage Matrix

| Page Type | FAQPage | LocalBusiness/MedicalClinic | AggregateRating | GeoCoordinates | OpeningHours | BreadcrumbList | Review | HowTo |
|-----------|---------|----------------------------|-----------------|----------------|--------------|----------------|--------|-------|
| Homepage | NO | NO | NO | NO | NO | YES | NO | NO |
| State page | NO | ItemList only | YES | NO | NO | YES | NO | NO |
| City page | NO | ItemList only | YES | NO | NO | YES | NO | NO |
| Clinic detail | NO (HTML only) | YES | YES | YES | YES | YES | NO | NO |
| Questions | YES | NO | NO | NO | NO | YES | NO | NO |
| Blog | N/A | NO | NO | NO | NO | YES | NO | NO |
| Treatment | NO | NO | NO | NO | NO | YES | NO | PARTIAL |

---

*Report generated by GEO/AEO audit of `/Users/taps/tmslist`*
