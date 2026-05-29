# On-Page SEO Audit & Remediation Plan
**Scope: All non-blog TMS List pages**
*Generated: 2026-05-29 | Status: Planning*

---

## Executive Summary

TMS List has a strong SEO foundation in Layout.astro (canonical, OG, Twitter, hreflang, WebSite schema + BreadcrumbList, Google/Bing verification). The gap is **per-page specialization**: missing H1s on many pages, thin/missing JSON-LD schema, inconsistent internal linking, weak/missing meta descriptions, and an incomplete sitemap. This plan covers every non-blog route category with specific tasks.

**Tier 1 (High Impact / Listing Pages):** Clinic listings, doctor listings, treatments, insurance, compare, near-me
**Tier 2 (Medium Impact):** Questions/FAQ, research, protocols, technology, glossary, demographics
**Tier 3 (Supporting):** About, contact, glossary, static pages

---

## Part 1 — Layout-Level SEO Improvements

### 1.1 Layout.astro — Add These SEO Enhancements

| Change | Rationale |
|--------|-----------|
| `Organisation` schema as separate JSON-LD block | Currently only WebSite + SearchAction. Org schema enables Knowledge Panel visibility |
| Per-page `og:image` with fallback: `/images/og-default.jpg` | All pages currently share the same default image. Listing pages should have their own. |
| `article:published_time`, `article:author`, `article:section` meta for content pages | Rich snippet improvements for Google Discover |
| RRS feed auto-discovery link | <link rel="alternate" type="application/rss+xml" /> |
| JSON-LD `@id` = canonicalUrl on all page schemas | Helps Google merge duplicate schemas |

### 1.2 New Shared SEO Utility

Create `src/utils/seo.ts` with:
- `buildOrganisationSchema()` — Organisation JSON-LD
- `buildLocalBusinessSchema(clinic)` — Clinic listing JSON-LD
- `buildPhysicianSchema(doctor)` — Doctor JSON-LD  
- `buildMedicalConditionSchema(condition)` — Treatment condition JSON-LD
- `buildFAQSchema(faqItems[])` — FAQPage JSON-LD
- `buildBreadcrumbSchema(items[])` — already in Layout but expose for pages
- `buildHowToSchema(steps[])` — for quiz/calculator pages
- `buildReviewSchema(reviews[])` — AggregateRating for listings

---

## Part 2 — Sitemap Completeness

### 2.1 Current State
- Sitemap index: `sitemap-index.xml` with child sitemaps
- Child sitemaps: `sitemap-static.xml`, `sitemap-locations.xml`, `sitemap-pseo.xml`, `sitemap-clinics.xml`, `sitemap-doctors.xml`

### 2.2 Gaps to Fix

| File | Issue |
|------|-------|
| `sitemap-static.xml` | Missing: `/clinic/*`, `/doctor/*`, `/specialist/*`, `/questions/*`, `/answers/*`, `/quiz/*`, `/technology/*` pages |
| `sitemap-pseo.xml` | Verify all `/treatments/*`, `/insurance/*`, `/compare/*`, `/alternatives/*`, `/protocols/*`, `/research/*`, `/demographic/*`, `/stories/*` are included |
| `sitemap-clinics.xml` | Confirm dynamic clinic pages are generated weekly/nightly |
| `sitemap-doctors.xml` | Same — dynamic pages need scheduled generation |

### 2.3 Sitemap Tasks

- [ ] Audit all non-blog routes not in any sitemap
- [ ] Ensure `/treatments/index.astro` and `/insurance/index.astro` are in sitemap-pseo (they are programmatic index pages — confirmed ✓)
- [ ] Add `/glossary/` index to sitemap-static
- [ ] Add `/best-tms-clinics/*` to sitemap
- [ ] Add `/questions/*` FAQ pages to sitemap-static
- [ ] Add `/quiz/*` pages to sitemap (under `/tools/`)
- [ ] Add date priority tags to sitemap entries for crawlers
- [ ] Verify dynamic clinic/doctor pages have proper lastmod dates

---

## Part 3 — robots.txt Review

### 3.1 Current robots.txt State

```
Allow: /
Disallow: /admin/ /portal/ /account/ /api/auth/ /api/admin/ /api/portal/ /api/owner/
Allow: /api/clinics/ /api/reviews/ /api/clinics/search /api/clinics/nearby
```

### 3.2 Tasks

- [ ] Add `Disallow: /admin/api-docs/` — don't want admin API docs indexed
- [ ] Confirm `/api/clinics/search` and `/api/clinics/nearby` should be crawlable
- [ ] Add explicit `Allow: /api/clinics/nearby` if not already there
- [ ] Consider `Disallow: /thank-you` and `Disallow: /unsubscribe` — currently in place ✓
- [ ] Add `Disallow: /simulation/` — staging/demo pages
- [ ] Add `Crawl-delay: 1` to slow crawler for large sitemap-clinics

---

## Part 4 — Internal Linking Architecture

### 4.1 Internal Link Audit Findings

| Source | Links To | Status |
|--------|----------|--------|
| Homepage | `/us/`, `/treatments/`, `/insurance/`, `/compare/`, `/questions/`, `/blog/` | ✓ Good |
| Treatment pages | `/treatments/`, `/insurance/`, `/compare/`, `/us/` | ✓ Good |
| Insurance pages | `/treatments/`, `/tms-cost-guide/`, `/us/`, `/quiz/` | ✓ Good |
| Comparison pages | `/treatments/`, `/us/`, `/quiz/` | ✓ Good |
| FAQ/Answers pages | `/treatments/`, `/insurance/`, `/compare/` | ⚠ Weak — no link to `/us/` |
| Research pages | `/treatments/`, `/quiz/`, `/us/` | ⚠ No link back to `/treatments/` for context |
| Protocols pages | `/treatments/`, `/us/` | ⚠ No insurance links |
| Glossary | No links to any content pages | ❌ Needs internal links |
| Best-TMS-City pages | `/us/`, `/treatments/`, `/insurance/` | ✓ Good |

### 4.2 Internal Link Fixes

- [ ] **Glossary page**: Add `<a href>` links to all terms that map to treatment/insurance pages. E.g., "treatment-resistant depression" → `/treatments/depression/`, "rTMS" → `/protocols/standard-tms/`
- [ ] **Answers/FAQ pages**: Add sidebar CTAs linking to `/us/` and `/quiz/am-i-a-candidate/`
- [ ] **Research pages**: Add "Related Treatment" section linking to relevant `/treatments/` page
- [ ] **Protocols pages**: Add insurance coverage summary and links to relevant `/insurance/` pages  
- [ ] **Technology pages**: Link device pages to relevant treatment pages (`NeuroStar` → `/treatments/depression/`)
- [ ] **Stories pages**: Add "Find a Clinic" CTA with link to `/us/`
- [ ] **Demographic pages**: Add relevant condition + insurance links

### 4.3 Deep Link Opportunities

For **all** content pages, add:
1. **"Related Treatment" block** — link to the condition page if the content is about a specific condition
2. **Cross-link to comparison pages** in treatment pages (sidebar or inline)
3. **"Next Step" CTAs** — quiz → clinic finder → insurance check

---

## Part 5 — Per-Page H1 Audit & Fixes

### 5.1 H1 Audit by Page Type

| Page | Current H1 | Issue | Fix |
|------|-----------|-------|-----|
| **Homepage** | "Find a TMS Clinic Near You" or similar | ✓ OK | — |
| **Treatments index** | "What TMS can treat." | ✓ OK | — |
| **Treatment detail** | Uses `<h1>` via `<ContentHero title={title}>` | ✓ OK | Pass `h1Override` if needed |
| **Insurance index** | "Will my insurance cover TMS?" | ✓ OK | — |
| **Insurance detail** | Uses `<ContentHero title={title}>` | ✓ OK | — |
| **Questions index** | Unknown — check `questions.astro` | ⚠ Need to verify | Ensure single H1 |
| **Compare index** | "Compare TMS Treatments" or "Compare" | ⚠ Need to verify | Ensure H1 present |
| **Compare detail** | Uses `<ContentHero title={title}>` | ✓ OK | — |
| **Glossary** | Check `glossary.astro` | ⚠ Need to review | Single H1 |
| **Research index** | Check `research/index.astro` | ⚠ Need to review | Single H1 |
| **Protocols index** | Check `protocols/index.astro` | ⚠ Need to review | Single H1 |
| **Technology index** | Check `technology/index.astro` | ⚠ Need to review | Single H1 |
| **Demographics index** | Check `demographic/index.astro` | ⚠ Need to review | Single H1 |
| **Stories index** | Check `stories/index.astro` | ⚠ Need to review | Single H1 |
| **Clinic listing detail** | Dynamic from DB | ⚠ Verify H1 from clinic.name | `<h1>{clinic.name}</h1>` |
| **Doctor listing detail** | Dynamic from DB | ⚠ Verify H1 from doctor.name | `<h1>{doctor.name}</h1>` |
| **Best TMS cities** | Check `best-tms-clinics/` pages | ⚠ Need to review | Single H1 |

### 5.1 H1 Fix Tasks

- [ ] Read `questions.astro` (questions index) — verify H1, add if missing
- [ ] Read `compare.astro` (compare index) — verify H1, add if missing
- [ ] Read `glossary.astro` — verify H1, add if missing
- [ ] Read `research/index.astro` — verify H1, add if missing
- [ ] Read `protocols/index.astro` — verify H1, add if missing
- [ ] Read `technology/index.astro` — verify H1, add if missing
- [ ] Read `demographic/index.astro` — verify H1, add if missing
- [ ] Read `stories/index.astro` — verify H1, add if missing
- [ ] Read `answers/index.astro` — verify H1, add if missing
- [ ] Read `/clinic/[slug].astro` — verify H1 set to clinic name
- [ ] Read `/doctor/[slug].astro` — verify H1 set to doctor name
- [ ] Read `best-tms-clinics/index.astro` — verify H1, add if missing
- [ ] Verify all international pages (`/us/`, `/uk/`, `/ca/`, etc.) have proper H1s from content

---

## Part 6 — JSON-LD Schema Markup by Page Type

### 6.1 Schema Audit Matrix

| Page Type | Current Schema | Missing | Action |
|-----------|--------------|---------|--------|
| **Layout.astro (base)** | WebSite + SearchAction + BreadcrumbList | Organisation | Add Org schema |
| **Treatment index** (treatments/index.astro) | CollectionPage + ItemList + MedicalCondition (in code ✓) | None | Verify it's on ALL pages |
| **Treatment detail** (uses TreatmentPage layout) | `schema` prop passed | MedicalCondition per condition | Add MedicalCondition JSON-LD on each treatment page |
| **Insurance index** (insurance/index.astro) | CollectionPage + ItemList + FAQPage ✓ | None | Already complete |
| **Insurance detail** (uses InsurancePage layout) | `schema` prop passed | InsuranceProduct per insurer | Add insurer-specific JSON-LD |
| **Comparison pages** | Generic fallback | ComparisonArticle or VSOutcome | Add ComparisonArticle schema |
| **FAQ / Answers** | None detected | FAQPage | Add FAQPage schema to all answer pages |
| **Clinic listing** (clinic/[slug]) | None | LocalBusiness + AggregateRating | Add full LocalBusiness schema |
| **Doctor listing** (doctor/[slug]) | None | Physician + AggregateRating | Add Physician schema |
| **Research index** | None | ScholarlyArticle or ItemList | Add Article schema |
| **Research detail** | None | Article (type: ScholarlyArticle) | Add per-article schema |
| **Protocols pages** | None | HowTo + MedicalProcedure | Add HowTo/Protocol schema |
| **Technology pages** | None | Product or HowTo | Add Product schema per device |
| **Glossary** | None | Article or definedTerm | Add definition schema |
| **Quiz pages** | None | HowTo | Add HowTo schema |
| **Stories pages** | None | Article + Person | Add story + author schema |
| **Best-TMS-Cities pages** | None | ItemList + LocalBusiness | Add city-level schema |
| **near-me pages** | None | ItemList | Add location-based schema |

### 6.2 JSON-LD Implementation Tasks

#### Tier 1: Highest Impact

- [ ] **Organisation schema** — Add to Layout.astro head (permanent knowledge graph entry):
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://tmslist.com/#organization",
  "name": "TMS List",
  "url": "https://tmslist.com",
  "logo": "https://tmslist.com/images/logo.png",
  "description": "The leading directory of TMS therapy providers. Find verified clinics, compare treatments, and learn about insurance coverage.",
  "sameAs": ["https://twitter.com/tmslist", "https://www.linkedin.com/company/tmslist"],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://tmslist.com/contact/"
  }
}
```

- [ ] **Clinic listing schema** (`/clinic/[slug].astro`) — Add LocalBusiness JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "Clinic Name",
  "url": "https://tmslist.com/clinic/slug",
  "address": { /* from DB */ },
  "telephone": "/* from DB */",
  "aggregateRating": {
    /* from reviews */
  }
}
```

- [ ] **Doctor listing schema** (`/doctor/[slug].astro`) — Add Physician JSON-LD

- [ ] **Treatment detail pages** — Add MedicalCondition JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalCondition",
  "name": "Depression",
  "alternateName": "Major Depressive Disorder",
  "description": "...",
  "treatedBy": { "@type": "MedicalTherapy", "name": "Transcranial Magnetic Stimulation" }
}
```

- [ ] **FAQ / Answers pages** — Add FAQPage JSON-LD (grouped per question-answer)

#### Tier 2: Medium Impact

- [ ] **Comparison pages** — Add ComparisonArticle or VSArticle schema
- [ ] **Insurance detail pages** — Add InsurancePolicy or Product schema
- [ ] **Research pages** — Add ScholarlyArticle or Article schema
- [ ] **Protocols pages** — Add HowTo + MedicalProcedure schema
- [ ] **Quiz pages** — Add HowTo schema for step-by-step eligibility

#### Tier 3: Supporting

- [ ] **Technology pages** — Add Product schema per device
- [ ] **Glossary page** — Add definedTerm or Article schema
- [ ] **Best-TMS-Cities pages** — Add ItemList + LocalBusiness per city

---

## Part 7 — Meta Description Audit

### 7.1 Rules

| Page Type | Min chars | Max chars | Must include |
|-----------|----------|---------|-------------|
| Homepage | 120 | 160 | Brand name, primary value prop, keyword |
| Treatment detail | 120 | 160 | Condition name, "TMS for [X]", outcome stat |
| Insurance detail | 120 | 160 | Insurer name, "TMS coverage", key requirement |
| Comparison | 120 | 160 | Both treatments, comparison keyword |
| FAQ | 120 | 160 | Question/framing keyword, answer promise |
| Clinic listing | 80 | 160 | Clinic name, location, key differentiator |
| Research | 100 | 160 | Topic, publication/researcher credibility signal |

### 7.2 Meta Description Tasks

- [ ] **Homepage** — Rewrite description to be conversion-oriented with keyword "TMS clinic" prominent
- [ ] **Treatments index** — Ensure unique meta description (not default)
- [ ] **Insurance index** — Already has good description ✓
- [ ] **Questions index** — Check/update meta description
- [ ] **Compare index** — Check/update meta description
- [ ] **Best-TMS-Cities index** — Unique description per city if possible
- [ ] **All insurance detail pages** — Verify each has insurer-specific description
- [ ] **All treatment detail pages** — Verify each has condition-specific description
- [ ] **International pages** (/uk/, /ca/, etc.) — Ensure country-specific meta descriptions

---

## Part 8 — LLM-Optimized Content (E-E-A-T)

### 8.1 E-E-A-T Analysis

| Factor | Status | Gap |
|--------|-------|-----|
| **Experience** | Reviewer attributed ✓, social proof ✓, clinic data ✓ | Need more first-hand experience signals in content |
| **Expertise** | Dr. Karan Narwal review attributed ✓ | Reviews could cite credentials more explicitly |
| **Authoritativeness** | Org schema needed, author pages needed | Add author bylines on research/research-author schema |
| **Trustworthiness** | SSL, privacy policy, medical disclaimer ✓ | Need explicit "medical review date" on all content |

### 8.2 Trust Signal Tasks

- [ ] Add "Last updated/reviewed by Dr. [Name]" with date on every content page
- [ ] Add "This content is medically reviewed" badge to TreatmentPage, InsurancePage, ContentPage layouts
- [ ] Add `<time datetime="2026-05-29">` with content update date on articles
- [ ] Add author schema (Person) for research content
- [ ] Add citation/references section to research and protocol pages with links to NEJM, JAMA, etc.
- [ ] Add "Sources include FDA.gov, PubMed, clinical guidelines" line at bottom of medical content

### 8.3 Expertise Attribution

- [ ] Expand Dr. Narwal bio with credentials (MD, years of experience, neuromodulation specialization)
- [ ] Add additional reviewer for insurance/billing pages (e.g., health insurance expert)
- [ ] Add reviewer bylines directly in the JSON-LD as `author` and `reviewer` fields

---

## Part 9 — robots.txt Optimizations

Already covered in Part 3, but specifically:
- [ ] Block staging/demo pages from indexing
- [ ] Allow search engines to crawl all public content pages
- [ ] Ensure sitemap is declared and accessible
- [ ] Add `Host: https://tmslist.com` (Googlebot reads this)

---

## Part 10 — Sitemap.xml Preparation

### 10.1 Sitemap Checklist

- [ ] Generate complete sitemap including ALL public non-blog pages
- [ ] Include `/treatments/` (all individual treatment pages)
- [ ] Include `/insurance/` (all individual insurer pages)
- [ ] Include `/compare/` (all comparison pages)
- [ ] Include `/questions/` (all FAQ pages)
- [ ] Include `/quiz/` (quiz pages — some may need noindex)
- [ ] Include `/best-tms-clinics/` (city ranking pages)
- [ ] Include `/glossary/` (single page)
- [ ] Set proper `lastmod` dates for dynamic pages
- [ ] Set `priority` higher for homepage, treatments index, insurance index, compare
- [ ] Set `changefreq` appropriately (daily for blog/news, weekly for content, monthly for static)
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Ensure sitemap URL is in robots.txt ✓

---

## Part 11 — Implementation Phases

### Phase 1: Foundation (Layout + Schema)
1. Create `src/utils/seo.ts` with all schema builders
2. Add Organisation schema to Layout.astro
3. Fix/add sitemap entries
4. Update robots.txt

### Phase 2: Listing Pages (Highest SEO Value)
1. Add LocalBusiness schema to clinic/[slug]
2. Add Physician schema to doctor/[slug]  
3. Fix H1s on listing pages
4. Add internal links to listing pages
5. Optimize meta descriptions

### Phase 3: Content Pages
1. Add MedicalCondition schema to treatment detail pages
2. Add FAQPage schema to questions/answers pages
3. Add schema to comparison, research, protocols, technology pages
4. Fix H1s on all content pages
5. Add internal link bridges between related content

### Phase 4: Trust & Authority
1. Fortify E-E-A-T signals (reviewer bios, dates, citations)
2. Add author schema for research content
3. Update meta descriptions with keyword optimization
4. Test with Google Rich Results Test

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/layouts/Layout.astro` | Add Organisation schema, improve OG image fallback |
| `src/utils/seo.ts` | NEW — all schema builder utilities |
| `src/layouts/TreatmentPage.astro` | Add MedicalCondition JSON-LD as default |
| `src/layouts/ContentPage.astro` | Add Article/FAQPage schema as default |
| `src/layouts/InsurancePage.astro` | Add InsuranceProduct schema as default |
| `src/layouts/ComparisonPage.astro` | Add ComparisonArticle schema |
| `public/robots.txt` | Block staging pages, add crawl-delay |
| Sitemap generation file(s) | Add missing routes |
| `src/pages/clinic/[slug].astro` | Add LocalBusiness + AggregateRating JSON-LD |
| `src/pages/doctor/[slug].astro` | Add Physician + AggregateRating JSON-LD |
| All individual treatment pages | Ensure schema prop is passed |
| All individual insurance pages | Ensure schema prop is passed |
| All comparison detail pages | Pass verdict + winner as schema |
| All FAQ/answers pages | Pass FAQ schema prop |
| Glossary page | Add internal links + definition schema |

---

## Success Metrics

After implementation, verify with:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/
- Screaming Frog crawl to verify H1 uniqueness across all pages
- Google Search Console: "Coverage > Indexed" should increase
- Core Web Vitals: ensure no layout shift from schema injection
