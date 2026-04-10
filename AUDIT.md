# TMS List — Full Application Audit (500 Issues)

**Date:** 2026-04-10  
**Scope:** Every page, API route, database table, component, utility, config, content file, and SEO element

---

## CRITICAL — Security & Data Loss (1-20)

| # | Category | Issue | Location |
|---|----------|-------|----------|
| 1 | **Security** | Hardcoded Gemini API key as fallback — key is compromised | `utils/gemini.ts:6` |
| 2 | **Security** | SQL injection via raw string concat in ILIKE search | `api/clinics/search.ts:44-46` |
| 3 | **Security** | SQL injection in admin clinic search (same pattern) | `api/admin/clinics.ts:44-46` |
| 4 | **Security** | SQL injection in clinic compare — IDs not parameterized via `sql.raw()` | `api/clinics/compare.ts:35` |
| 5 | **Security** | SQL injection risk in NPI verify — no input validation on npiNumber | `api/doctors/verify-npi.ts:55` |
| 6 | **Security** | ADMIN_EMAILS exposed in public API response | `api/admin/settings.ts:62` |
| 7 | **Security** | No rate limiting on login endpoint — brute force vector | `api/auth/login.ts` |
| 8 | **Security** | No rate limiting on magic-link email sending — spam vector | `api/auth/magic-link.ts` |
| 9 | **Security** | Portal login accepts ANY email with no whitelist — account takeover risk | `api/auth/portal-login.ts:25` |
| 10 | **Security** | No rate limiting on public clinic submission — spam vector | `api/clinics/submit.ts` |
| 11 | **Security** | Cron secret passed in query string — logged in server/CDN logs | `api/funnel/process-drips.ts:18` |
| 12 | **Security** | Missing `crypto` module import — runtime crash on clinic verify | `api/clinics/verify.ts:54` |
| 13 | **Security** | AI prompt injection — user input directly interpolated into blog generation prompt | `api/ai/blog-generate.ts:92-97` |
| 14 | **Security** | No input length validation on AI chat — unlimited payload DOS | `api/ai/chat.ts` |
| 15 | **Security** | Magic token race condition — can be used twice concurrently | `utils/auth.ts:118-138` |
| 16 | **Security** | Stripe webhook missing idempotency — duplicate events double-process | `api/webhooks/stripe.ts` |
| 17 | **Security** | Missing Content-Security-Policy header | `vercel.json` |
| 18 | **Security** | Missing Strict-Transport-Security (HSTS) header | `vercel.json` |
| 19 | **Data Loss** | `db.insert(leads)` and `sendFunnelEmail` not awaited, `.catch(() => {})` | `api/patient/register.ts:56-75` |
| 20 | **Data Loss** | `checkoutSession.url!` non-null assertion crashes if Stripe returns null | `api/subscribe.ts:65` |

---

## BROKEN FUNCTIONALITY (21-35)

| # | Issue | Location |
|---|-------|----------|
| 21 | 788 image references point to `.png` files that now only exist as `.jpg` | `clinics.json`, `blog/index.astro`, `index.astro` |
| 22 | "The content content" — duplicate word in legal document | `legal/medical-disclaimer.astro:29` |
| 23 | Blog posts array hardcoded — not dynamic from DB | `blog/index.astro` |
| 24 | Unsubscribe page is frontend-only — comment says "In a real implementation..." | `unsubscribe.astro:47-50` |
| 25 | No duplicate review prevention — same user can submit unlimited reviews | `api/reviews/index.ts` |
| 26 | No duplicate clinic claim check — same email can claim same clinic multiple times | `api/clinics/claim.ts` |
| 27 | IP-based vote dedup uses spoofable `x-forwarded-for` header | `api/reviews/vote.ts:23` |
| 28 | clinicClaims have no expiration cleanup — stale records accumulate | `db/schema.ts` |
| 29 | magicTokens have no cleanup job — tokens accumulate forever | `db/schema.ts` |
| 30 | `analytics/stats.ts` allows URL param to query ANY clinic's stats | `api/analytics/stats.ts:25` |
| 31 | Reviews stored only in localStorage — lost on browser clear/different device | `GoogleReviews.astro:396-399` |
| 32 | GoogleReviews mock auth — uses fake data, doesn't actually authenticate | `GoogleReviews.astro:336-349` |
| 33 | DoctorCard.astro is empty (1 line) — dead file | `components/DoctorCard.astro` |
| 34 | Open redirect risk — `redirect` query param not validated on register page | `account/register.astro:76` |
| 35 | QR code uses hardcoded `https://tmslist.com` instead of env var | `owner/review-qr.astro:73` |

---

## DATABASE — Schema (36-55)

| # | Issue | Location |
|---|-------|----------|
| 36 | Missing index: `(verified, ratingAvg DESC)` — used in 9+ queries | `db/schema.ts` (clinics) |
| 37 | Missing index: `(country, verified)` — international queries full scan | `db/schema.ts` (clinics) |
| 38 | Missing index: `(isFeatured, ratingAvg DESC)` | `db/schema.ts` (clinics) |
| 39 | Missing index: `(clinicId, approved, createdAt DESC)` on reviews | `db/schema.ts` (reviews) |
| 40 | Missing index: `category` on questions | `db/schema.ts` (questions) |
| 41 | Missing index: `clinicId` on users — portal lookups | `db/schema.ts` (users) |
| 42 | Missing index: `(userId, clinicId)` unique on savedClinics | `db/schema.ts` |
| 43 | Missing index: `(clinicId, status)` on clinicClaims | `db/schema.ts` |
| 44 | Missing index: `verificationToken` on clinicClaims | `db/schema.ts` |
| 45 | Missing index: `(clinicId, status)` on subscriptions | `db/schema.ts` |
| 46 | `leads.clinicId` has `ON DELETE no action` — inconsistent | `drizzle migration:202` |
| 47 | `doctors.slug` is UNIQUE but nullable | `db/schema.ts:155` |
| 48 | `treatments.slug` same issue — unique + nullable | `db/schema.ts` |
| 49 | `ratingAvg` nullable — should be NOT NULL default 0 | `db/schema.ts:137` |
| 50 | `reviews.rating` no CHECK constraint (1-5) | `db/schema.ts` |
| 51 | `clinicClaims.status` is free text — should be enum | `db/schema.ts` |
| 52 | `subscriptions.plan`/`status` are free text — should be enums | `db/schema.ts` |
| 53 | `auditLog.entityId` is text but references uuid entities | `db/schema.ts:273` |
| 54 | `leads.email` nullable in schema but required in validation | `db/schema.ts` vs `db/validation.ts:59` |
| 55 | No `deletedAt` column on any table — no soft-delete for GDPR | All tables |

---

## DATABASE — Queries (56-70)

| # | Issue | Location |
|---|-------|----------|
| 56 | Haversine formula recalculated on EVERY row — no spatial index | `db/queries.ts:125-169` |
| 57 | `getDashboardStats` runs 4 separate COUNT queries | `db/queries.ts:471-485` |
| 58 | `updateClinicRating` race condition — SELECT then UPDATE not atomic | `db/queries.ts:235-248` |
| 59 | 17 functions use `select().from(table)` — over-fetching all columns | `db/queries.ts` |
| 60 | `getClinicsByCity` has no LIMIT — unbounded | `db/queries.ts:38-46` |
| 61 | `getAllVerifiedClinics` loads ALL into memory | `db/queries.ts:406-410` |
| 62 | `getClinicsByMachine` no LIMIT | `db/queries.ts:422-429` |
| 63 | `getClinicsBySpecialty` no LIMIT | `db/queries.ts:431-438` |
| 64 | `getClinicsByInsurance` no LIMIT | `db/queries.ts:440-447` |
| 65 | `getClinicsByCountryAndRegion` no LIMIT | `db/queries.ts:355-363` |
| 66 | No error handling in any query function | `db/queries.ts` |
| 67 | `getUniqueStates()` appears unused — dead code | `db/queries.ts:53-59` |
| 68 | `getCitiesByState()` appears unused — dead code | `db/queries.ts:61-67` |
| 69 | Clinic slug generation race condition — concurrent dupes crash | `api/clinics/submit.ts:21-24` |
| 70 | `getAllDoctors` joins clinics but returns bloated result set | `db/queries.ts:192-205` |

---

## DATABASE — Validation (71-80)

| # | Issue | Location |
|---|----------|-------|
| 71 | No HTML/XSS sanitization in `clinicSubmitSchema` text fields | `db/validation.ts:25-41` |
| 72 | `state` accepts any string up to 50 chars — no ISO format | `db/validation.ts:15` |
| 73 | Array fields have no max length — could send 10,000 items | `db/validation.ts:18-20` |
| 74 | `website` allows `http://` — should enforce `https://` | `db/validation.ts:32` |
| 75 | `phone` no format validation — any 7-20 chars | `db/validation.ts:33` |
| 76 | `metadata` accepts `Record<string, unknown>` — any JSON | `db/validation.ts:65` |
| 77 | `sourceUrl` no `.url()` validation | `db/validation.ts:63` |
| 78 | `password` min 8 — NIST recommends 12+ | `db/validation.ts:73` |
| 79 | `registerSchema` missing password confirmation | `db/validation.ts:80-85` |
| 80 | `.coerce.number()` allows decimals for integer fields | `db/validation.ts` |

---

## API ROUTES (81-100)

| # | Issue | Location |
|---|-------|----------|
| 81 | No rate limiting on `/api/clinics/search` | `api/clinics/search.ts` |
| 82 | No rate limiting on `/api/analytics/track` | `api/analytics/track.ts` |
| 83 | No rate limiting on `/api/reviews` POST | `api/reviews/index.ts` |
| 84 | No rate limiting on `/api/ai/generate-image` | `api/ai/generate-image.ts` |
| 85 | No rate limiting on `/api/reviews/vote` | `api/reviews/vote.ts` |
| 86 | No CORS headers on ANY API route (50 routes) | All API routes |
| 87 | No response caching on admin GET routes | `api/admin/*.ts` |
| 88 | Admin reviews PUT no check review exists before updating | `api/admin/reviews.ts` |
| 89 | `offset`/`limit` not validated as non-negative | `api/admin/clinics.ts:39` |
| 90 | `yearsExperience` converted to Number without bounds | `api/admin/doctors.ts:100` |
| 91 | Portal auto-creates user on first magic link verify | `api/auth/portal-verify.ts:28-35` |
| 92 | No cost control on AI API calls | `api/ai/blog-generate.ts` |
| 93 | No IP whitelisting for Stripe webhook | `api/webhooks/stripe.ts` |
| 94 | Upload no filename sanitization | `api/upload.ts` |
| 95 | MIME validation via header only (can be spoofed) | `api/upload.ts` |
| 96 | Fire-and-forget analytics fetch — silent failure | `api/messages/send.ts:106-110` |
| 97 | Portal login returns success even if email send fails | `api/auth/portal-login.ts:63-66` |
| 98 | HTTP 501 for missing Blob token — should be 503 | `api/upload.ts:62` |
| 99 | No timeout on AI API streaming responses | `api/ai/chat.ts` |
| 100 | `clinicId` not validated to exist in analytics/track | `api/analytics/track.ts` |

---

## SEO — Structural (101-130)

| # | Issue | Location |
|---|-------|----------|
| 101 | No hreflang tags on any of 63 international pages | `layouts/Layout.astro` |
| 102 | Missing meta descriptions on `/quiz/[slug]` pages | `quiz/[slug].astro:15` |
| 103 | Missing meta descriptions on `/demographic/[slug]` pages | `demographic/[slug].astro:15` |
| 104 | No JSON-LD schema on `/search` page | `search.astro` |
| 105 | No JSON-LD schema on `/compare-clinics` page | `compare-clinics.astro` |
| 106 | No JSON-LD schema on `/compare/[slug]` pages | `compare/[slug].astro` |
| 107 | Missing breadcrumbs on 7+ deep page types | compare, legal, protocol, stories |
| 108 | City page titles exceed 70 chars with long names | `us/[state]/[city]/index.astro:55` |
| 109 | City/clinic meta descriptions exceed 160 chars | `us/[state]/[city]/index.astro:56` |
| 110 | `/compare-clinics` and `/compare/index` keyword cannibalization | Two compare pages |
| 111 | Blog posts use FAQPage schema instead of BlogPosting | `blog/[slug].astro:213` |
| 112 | No BreadcrumbList JSON-LD schema on any page (HTML only) | All pages |
| 113 | Clinic page mixes schema types `["MedicalClinic","Physician"]` | `clinic/[slug].astro:66` |
| 114 | Missing FAQPage schema on clinic FAQs section | `clinic/[slug].astro:378-395` |
| 115 | Doctor schema hardcodes `medicalSpecialty: "Psychiatry"` for all doctors | `doctor/[slug].astro:60` |
| 116 | Missing Review schema on clinic pages despite having reviews | `clinic/[slug].astro` |
| 117 | No schema on treatment detail pages | `treatments/[slug].astro` |
| 118 | No schema on insurance detail pages | `insurance/[slug].astro` |
| 119 | No schema on question category pages | `questions/category/[category].astro` |
| 120 | No BlogPosting schema on blog index | `blog/index.astro` |
| 121 | No PricingPlan/Offer schema on pricing page | `pricing.astro` |
| 122 | No ContactPoint schema on contact page | `contact.astro` |
| 123 | Missing canonical URLs (not explicitly set on any page) | All pages |
| 124 | `about-us.astro` title only 14 chars — needs keywords | `about-us.astro` |
| 125 | `contact.astro` title only 10 chars — needs keywords | `contact.astro` |
| 126 | `account/register.astro` title only 25 chars | `account/register.astro` |
| 127 | `thank-you.astro` meta description only 37 chars | `thank-you.astro` |
| 128 | `account/saved.astro` meta description only 54 chars | `account/saved.astro` |
| 129 | No H1 tag on `compare-clinics.astro` | `compare-clinics.astro` |
| 130 | No H1 on portal sub-pages (clinic, reviews, leads) | `portal/clinic.astro`, etc. |

---

## SEO — Content Quality (131-165)

| # | Issue | Location |
|---|-------|----------|
| 131 | Thin fallback content (~400 words) on ContentPage slug pages | `layouts/ContentPage.astro:34-121` |
| 132 | US index page SEO section only ~250 words | `us/index.astro:214-220` |
| 133 | US state pages SEO section only ~180 words | `us/[state]/index.astro:175-186` |
| 134 | US city pages SEO section only ~200 words | `us/[state]/[city]/index.astro:259-266` |
| 135 | near-me pages have zero prose content | `near-me/[slug].astro` |
| 136 | near-me pages have no H2/H3 heading hierarchy | `near-me/[slug].astro` |
| 137 | near-me breadcrumb incomplete — missing "Near Me" level | `near-me/[slug].astro:63-67` |
| 138 | International country pages ~600 words — thin for landing pages | All country index pages |
| 139 | ~70% of international content is templated/duplicated | All international pages |
| 140 | No cross-linking between similar regions across countries | International pages |
| 141 | No "Related Articles" on blog pages | `blog/index.astro` |
| 142 | Repetitive title templates across region pages | `au/[region]/index.astro` etc. |
| 143 | 22 compare pages have ZERO content — all generic fallback | `compare/[slug].astro` |
| 144 | 9 protocol pages have ZERO content — all generic fallback | `protocols/[slug].astro` |
| 145 | 2 research pages have ZERO content | `research/[slug].astro` |
| 146 | 2 stories pages have ZERO content | `stories/[slug].astro` |
| 147 | 8 demographic pages have no [slug] page file at all | `demographic/` |
| 148 | 12 of 24 treatments lack markdown content (50% coverage) | `treatments/[slug].astro` |
| 149 | 14 of 19 insurers lack markdown content (26% coverage) | `insurance/[slug].astro` |
| 150 | 5 LEGAL_SLUGS defined but no `/legal/[slug].astro` page exists | Missing page |
| 151 | No `/research/index.astro` page | Missing page |
| 152 | No `/stories/index.astro` page | Missing page |
| 153 | No `/compare/index.astro` page linking to comparisons | Missing page |
| 154 | Clinic count discrepancy — "900+" on about-us vs "1,100+" on for-clinics | `about-us.astro:9` vs `for-clinics.astro:16` |
| 155 | "1,100+" clinic count hardcoded in multiple places | Search page, Hero |
| 156 | H1 doesn't match title emphasis on multiple US pages | `us/[state]/index.astro` etc. |
| 157 | Duplicate sitemap pages — `sitemap.astro` and `sitemap.html.astro` | Two files |
| 158 | Interactive search/filter content invisible to crawlers | `search.astro`, `compare-clinics.astro` |
| 159 | `robots.txt` blocks all `/api/` — too broad for public endpoints | `public/robots.txt` |
| 160 | Missing images on US state directory pages — no visual branding | `us/[state]/index.astro` |
| 161 | Blog index only shows 6 of 10 defined blog posts | `blog/index.astro` |
| 162 | Categories hardcoded in TWO places — DRY violation | `questions/index.astro`, `questions/category/[category].astro` |
| 163 | Treatment detail page Gemini image generation commented out | `treatments/index.astro:189-204` |
| 164 | Technology pages show clinic images, not device-specific images | `technology/[slug].astro` |
| 165 | Insurance matching uses fragile `string.includes()` | `insurance/[slug]/[state]/index.astro` |

---

## INTERNATIONAL — Localization (166-185)

| # | Issue | Location |
|---|-------|----------|
| 166 | ALL non-English country pages are in English only | `fr/`, `es/`, `de/`, `it/`, etc. |
| 167 | France pages: "TMS Therapy Clinics in France" (should be French) | `fr/index.astro:66-68` |
| 168 | Spain pages: English copy only | `es/index.astro:66-68` |
| 169 | Germany pages: English copy only + HTML entity `&auml;` | `de/index.astro:55-57,82` |
| 170 | Italy pages: English copy only | `it/index.astro:66-68` |
| 171 | Netherlands pages: English copy only | `nl/index.astro:66-68` |
| 172 | Japan, Korea, Brazil, Mexico — all English only | `jp/`, `kr/`, `br/`, `mx/` |
| 173 | No currency localization — all countries show same format | All international pages |
| 174 | No phone format localization — missing country codes | All international pages |
| 175 | Empty state handling missing — no "0 clinics" message on any int'l page | All int'l region/city pages |
| 176 | Missing aggregateRating in schema for 30+ region pages | All `[region]/index.astro` |
| 177 | Only UK and AU have healthcare-system-specific content (NHS, Medicare) | Other countries missing |
| 178 | Navigation text ("Browse by Region", "Related Resources") all in English | All int'l pages |
| 179 | Canada pages use British spelling "anaesthesia" instead of "anesthesia" | `ca/[region]/[city]/index.astro:169` |
| 180 | India pages hardcode Germany cost comparison only | `in/[region]/[city]/index.astro:113` |
| 181 | No cross-country comparison pages ("TMS availability by country") | Missing feature |
| 182 | No i18n framework or translation system in codebase | Project-wide |
| 183 | UAE pages don't reference local healthcare system (DHA, MOHAP) | `ae/` pages |
| 184 | Israel pages don't reference Kupat Holim / national health | `il/` pages |
| 185 | South Africa pages don't reference medical aid / Discovery Health | `za/` pages |

---

## CLINIC DETAIL PAGE (186-210)

| # | Issue | Location |
|---|-------|----------|
| 186 | Opening hours hardcoded Mon-Fri 09:00-17:00 regardless of actual data | `clinic/[slug].astro:92-99` |
| 187 | Default rating fallback is 4.5 — inflates expectations | `clinic/[slug].astro:44` |
| 188 | Default review count fallback is 50 — misleading | `clinic/[slug].astro:48` |
| 189 | County fallback is generic `${city} County` — not verified data | `clinic/[slug].astro:31` |
| 190 | Landmarks fallback is `Downtown ${city}` — not real data | `clinic/[slug].astro:34` |
| 191 | Remission rate hardcoded to "50-60%" | `clinic/[slug].astro:209` |
| 192 | Session length hardcoded to "19m" | `clinic/[slug].astro:213` |
| 193 | "Accepting New Patients" badge hardcoded, not data-driven | `clinic/[slug].astro:141-147` |
| 194 | Hero image has no width/height — CLS issue | `clinic/[slug].astro:183` |
| 195 | Hero image fallback selected by hash — changes on rebuild | `clinic/[slug].astro:110` |
| 196 | Gallery images have generic alt text `"Photo 1"` | `clinic/[slug].astro:258` |
| 197 | No lightbox/zoom on gallery images | `clinic/[slug].astro:250-266` |
| 198 | Two CTAs do same thing — unclear distinction | `clinic/[slug].astro:171,173-177` |
| 199 | Phone number hidden behind "Enquire to reveal" gate | `clinic/[slug].astro:420-425` |
| 200 | Insurance list truncated with no "show more" mechanism | `clinic/[slug].astro:362-366` |
| 201 | No medical disclaimer on clinic detail page | `clinic/[slug].astro` |
| 202 | No social share buttons | `clinic/[slug].astro` |
| 203 | No print-friendly CSS | `clinic/[slug].astro` |
| 204 | Sticky sidebar may overlap content on mobile | `clinic/[slug].astro:400` |
| 205 | No cross-linking to related clinics in same city/state | `clinic/[slug].astro` |
| 206 | No links to related treatments, conditions, or insurance pages | `clinic/[slug].astro` |
| 207 | Machines empty state shows vague "Cutting-edge FDA-cleared equipment" | `clinic/[slug].astro:284-286` |
| 208 | Treatments fallback only shows "Major Depressive Disorder" | `clinic/[slug].astro:302` |
| 209 | Insurance fallback: "Please call to verify" — unhelpful | `clinic/[slug].astro:367` |
| 210 | No map fallback if Google Business Profile embed unavailable | `clinic/[slug].astro:434-448` |

---

## DOCTOR DETAIL PAGE (211-225)

| # | Issue | Location |
|---|-------|----------|
| 211 | All doctors tagged as `medicalSpecialty: "Psychiatry"` regardless of actual | `doctor/[slug].astro:60` |
| 212 | Doctor photo has no `loading` strategy specified | `doctor/[slug].astro:115-116` |
| 213 | No license/credentials display — critical for medical professionals | `doctor/[slug].astro` |
| 214 | No board certification display | `doctor/[slug].astro` |
| 215 | No hospital affiliations | `doctor/[slug].astro` |
| 216 | No patient testimonials/reviews for individual doctors | `doctor/[slug].astro` |
| 217 | No licensing/regulatory disclaimer | `doctor/[slug].astro` |
| 218 | Bio has hardcoded fallback template text | `doctor/[slug].astro:53` |
| 219 | Title defaults to "TMS Specialist" if missing | `doctor/[slug].astro:47` |
| 220 | Alt text minimal: name only, should include title | `doctor/[slug].astro:317` |
| 221 | No links to related doctors at same clinic | `doctor/[slug].astro` |
| 222 | No links to treatment/condition pages | `doctor/[slug].astro` |
| 223 | No FAQ section on doctor pages | `doctor/[slug].astro` |
| 224 | No map on doctor page | `doctor/[slug].astro` |
| 225 | Contact form is only inquiry method — no direct booking | `doctor/[slug].astro` |

---

## UI/UX (226-275)

| # | Issue | Location |
|---|-------|----------|
| 226 | Missing focus-visible rings on 15+ elements | Multiple components |
| 227 | No loading skeleton in ComparisonTool search | `ComparisonTool.tsx:50-65` |
| 228 | No loading skeleton in AdvancedSearch results | `AdvancedSearch.tsx:230` |
| 229 | Text-only "Loading data..." in LeadsDashboard | `LeadsDashboard.tsx:213-218` |
| 230 | Text-only "Loading clinics..." on map | `ClinicMap.tsx:286-291` |
| 231 | HealthScoreBadge shows nothing if API fails | `HealthScoreBadge.tsx:35-41` |
| 232 | SaveClinicButton silently fails on error | `SaveClinicButton.tsx:31-46` |
| 233 | AIChatbot "Network error" with no recovery option | `AIChatbot.tsx:55-57` |
| 234 | BookingWidget 2-col grid on mobile — should be 1-col | `BookingWidget.tsx:115,122` |
| 235 | AIChatbot `w-[380px]` overflows mobile viewport | `AIChatbot.tsx:81` |
| 236 | No confirmation dialog before Verify/Unverify | `AdminClinics.tsx:197-207` |
| 237 | No confirmation before Approve/Reject review | `AdminReviews.tsx:213-228` |
| 238 | No confirmation on "Clear All" | `ComparisonTool.tsx:80-84` |
| 239 | No pagination in AdminReviews | `AdminReviews.tsx:49-71` |
| 240 | No pagination in LeadsDashboard | `LeadsDashboard.tsx:65` |
| 241 | No debounce on ComparisonTool search | `ComparisonTool.tsx:103` |
| 242 | Missing `aria-required` on required form fields | `EnquiryModal.tsx:169-197` |
| 243 | Missing `role="group"` on vote button containers | `ReviewVote.tsx:35` |
| 244 | Missing focus trap in BookingWidget modal | `BookingWidget.tsx:83-102` |
| 245 | Inconsistent button padding (py-1.5 to py-3.5) | Multiple components |
| 246 | Inconsistent card padding (p-3 to p-6) | Multiple components |
| 247 | No dark mode on any React component | All React components |
| 248 | Dashboard headers not responsive (`text-3xl` fixed) | `PortalDashboard.tsx`, `OwnerDashboard.tsx` |
| 249 | No "Read More" cue on truncated blog excerpts | `blog/index.astro:150-159` |
| 250 | z-index conflicts — hamburger and overlay both `z-50` | `AdminSidebar.tsx:166,176` |
| 251 | AdminClinicEditor is 13,800+ lines — needs splitting | `AdminClinicEditor.tsx` |
| 252 | OwnerDashboard 14 useState calls — needs useReducer | `OwnerDashboard.tsx:61-72` |
| 253 | Empty `href="#"` on social media links | `Footer.astro:299-305` |
| 254 | Footer toggle sections no keyboard support | `Footer.astro:322-378` |
| 255 | EnquiryModal posts to external Formester | `EnquiryModal.astro:72` |
| 256 | CallbackModal WhatsApp message includes unsanitized name | `CallbackModal.astro:350` |
| 257 | No form validation in EnquiryModal beyond HTML5 | `EnquiryModal.tsx` |
| 258 | Missing required-field indicators (asterisks) | `EnquiryModal.tsx`, `ReviewForm.tsx` |
| 259 | ReviewForm `minLength={10}` but no character counter | `ReviewForm.tsx:126` |
| 260 | ClinicCard missing `loading="lazy"` on image | `ClinicCard.astro:46` |
| 261 | ClinicCard country flag emoji no aria-label | `ClinicCard.astro:118` |
| 262 | No error boundary in any React component | All React components |
| 263 | Specialists page specialty filter limited to 15 | `specialists/index.astro:349` |
| 264 | Specialists doctor photos missing `loading="lazy"` | `specialists/index.astro:514` |
| 265 | AnalyticsDashboard Math on undefined — could return NaN | `AnalyticsDashboard.tsx:92-95` |
| 266 | No loading skeleton in AnalyticsDashboard | `AnalyticsDashboard.tsx` |
| 267 | `LoginForm` success message shows email — enumeration risk | `LoginForm.tsx:58` |
| 268 | `SearchBox` localStorage not wrapped in try-catch | `SearchBox.tsx:32` |
| 269 | `SearchBox` uses window.location.href — breaks SPA | `SearchBox.tsx:220` |
| 270 | AIChatbot message array unbounded — memory issue | `AIChatbot.tsx` |
| 271 | EnquiryModal.astro 130 lines inline JS — should be external | `EnquiryModal.astro:251-303` |
| 272 | CallbackModal.astro 200+ lines inline JS | `CallbackModal.astro:175-382` |
| 273 | Phone `replace(/\D/g, '')` breaks international formats | `CallbackModal.astro:299,348` |
| 274 | PortalDashboard "Find Your Clinic" generic CTA | `PortalDashboard.tsx:86-91` |
| 275 | No transitions on state changes in AdminReviews | `AdminReviews.tsx:84-92` |

---

## CONTENT & COPY (276-305)

| # | Issue | Location |
|---|-------|----------|
| 276 | Inconsistent terminology — "clinic" vs "provider" vs "center" | Project-wide |
| 277 | Generic error: "Something went wrong. Please try again." | `for-clinics.astro:116` |
| 278 | Missing help text/tooltips on OwnerDashboard forms | `OwnerDashboard.tsx:348-369` |
| 279 | Inconsistent CTAs: "Get Started Free" vs "Start Plan" | `pricing.astro:66-72` |
| 280 | "Wellness TMS clinic data being compiled" placeholder | `wellness/index.astro:102-105` |
| 281 | Missing trust signals on for-clinics and for-specialists | Key landing pages |
| 282 | Quiz mixes MDD and treatment-resistant depression terms | `quiz/am-i-a-candidate.astro` |
| 283 | Medical disclaimer missing verification methodology | `legal/medical-disclaimer.astro` |
| 284 | No phone number for urgent support | `Footer.astro` |
| 285 | Newsletter signup different messaging across pages | `NewsletterSignup.astro` vs `blog/index.astro` |
| 286 | STATE_NAMES dictionary only has 15 states | `us/[state]/index.astro` |
| 287 | Pricing page `$` symbol hardcoded — no int'l currency | `pricing.astro:49` |
| 288 | TMS cost calculator has hardcoded session costs | `tms-cost-calculator.astro:158-161` |
| 289 | Pricing page hardcoded email: "clinics@tmslist.com" | `pricing.astro:96` |
| 290 | "50K+ Monthly patient searches" — unverified stat | `for-clinics.astro:26` |
| 291 | Contact page has no actual contact form — email links only | `contact.astro` |
| 292 | for-specialists form captures state but not city | `for-specialists.astro` |
| 293 | Providers page mentions "900+ clinics" — may be outdated | `providers/index.astro` |
| 294 | Admin dashboard uses email instead of display name | `admin/dashboard.astro:34` |
| 295 | Portal title says "Doctor Portal" but accepts clinic owners | `portal/login.astro` |
| 296 | Portal leads page title uses British "Enquiries" for US audience | `portal/leads.astro` |
| 297 | register.astro links to `/admin/login` — wrong for patient signup | `account/register.astro:46` |
| 298 | No password strength indicator on registration | `account/register.astro` |
| 299 | No conversion tracking on thank-you page | `thank-you.astro` |
| 300 | Fisher-Yates randomization not used — biased shuffle | `index.astro:119` |
| 301 | Homepage STATE_NAMES hardcoded inline (not imported from utils) | `index.astro:23-40` |
| 302 | Resources page hardcoded array — should be data-driven | `resources/index.astro:4-54` |
| 303 | Resources button labels generic ("Get Checklist") — should be "Download" | `resources/index.astro` |
| 304 | Resources links to potentially non-existent pages | `resources/index.astro:151` |
| 305 | Sitemap page desktop-only friendly (4-col at lg) | `sitemap.astro` |

---

## PERFORMANCE (306-335)

| # | Issue | Location |
|---|-------|----------|
| 306 | 928KB questions JSON imported synchronously | `questions/index.astro:214` |
| 307 | API cache TTL 60s on `/api/clinics/search` — too short | `api/clinics/search.ts:31` |
| 308 | API cache TTL 60s on `/api/reviews` — too short | `api/reviews/index.ts:24` |
| 309 | Google Fonts loading 8 weights across 2 families | `styles/global.css:1` |
| 310 | `xlsx` (250KB) in dependencies — appears unused | `package.json` |
| 311 | `posthog-node` in dependencies — no imports found | `package.json` |
| 312 | `@sentry/astro` + `@sentry/node` — no config found | `package.json` |
| 313 | AdvancedSearch client-side filtering after fetching all | `AdvancedSearch.tsx:60-68` |
| 314 | `public/data/reviews.json` is 1.9MB static file | `public/data/reviews.json` |
| 315 | No React.memo on any component | All React components |
| 316 | SearchBox debounce timeout not cleaned up on unmount | `SearchBox.tsx:114` |
| 317 | ClinicMap loads scripts without cleanup on unmount | `ClinicMap.tsx:63-100` |
| 318 | Redis cache flat 5-min default for everything | `utils/redis.ts` |
| 319 | No WebP/AVIF images used anywhere | Project-wide |
| 320 | Small SVGs could be inlined (4 requests, 26KB) | `public/images/tms_*.svg` |
| 321 | `src/data/clinics.json` is 17.7MB on disk | `src/data/clinics.json` |
| 322 | Dark mode CSS 34 lines of `!important` overrides | `styles/global.css:50-83` |
| 323 | Duplicate `CLINIC_IMAGE_POOL` in two files | `utils/dataHelpers.ts`, `utils/images.ts` |
| 324 | `getAllVerifiedClinics` loads all into memory at build | `db/queries.ts:406-410` |
| 325 | `verified-clinics/index.astro` file too large (10,000+ tokens) | `verified-clinics/index.astro` |
| 326 | No code-splitting strategy for React chunks | `astro.config.mjs` |
| 327 | `brain.png` still 143KB unoptimized | `public/images/brain.png` |
| 328 | `logotmslist.png` 55KB — should be SVG or compressed | `public/logotmslist.png` |
| 329 | `public/data/reviews.json` + `src/data/clinics.json` = 19.6MB | Data files |
| 330 | No image `sizes` attribute for responsive loading | `ClinicCard.astro`, `clinic/[slug].astro` |
| 331 | AdvancedSearch `sortBy` uses `as any` type assertion | `AdvancedSearch.tsx:127` |
| 332 | Specialist filter limited to first 15 options | `specialists/index.astro:349` |
| 333 | Cost calculator depends on `window.TMS_GEO` global | `tms-cost-calculator.astro:219` |
| 334 | Verified clinics page mutable state mutations on build | `verified-clinics/index.astro:21-28` |
| 335 | No HTTP/2 push hints for critical assets | `vercel.json` |

---

## CODE QUALITY (336-370)

| # | Issue | Location |
|---|-------|----------|
| 336 | 8+ `as any` casts in health-score endpoint | `api/clinics/health-score.ts:54-58` |
| 337 | `any` type on chat messages | `api/ai/chat.ts:60` |
| 338 | Multiple `any` in compare reduce functions | `api/clinics/compare.ts:44-56` |
| 339 | `any` in NPI registry response parsing | `utils/npi.ts:45,95` |
| 340 | `any` in AdminReviews filter | `AdminReviews.tsx:66` |
| 341 | `any` in SaveClinicButton map | `SaveClinicButton.tsx:25` |
| 342 | `any` type for window.L in ClinicMap | `ClinicMap.tsx:112` |
| 343 | Analytics uses UTC date grouping | `api/analytics/track.ts:33` |
| 344 | Funnel drip `new Date()` no error handling | `api/funnel/process-drips.ts:45` |
| 345 | Hardcoded `leads@tmslist.com` | `api/leads/index.ts:38` |
| 346 | Hardcoded `https://tmslist.com` fallback | `utils/config.ts`, `api/ai/chat.ts:84` |
| 347 | Stripe.ts and subscriptions.ts both create instances | `utils/stripe.ts`, `utils/subscriptions.ts` |
| 348 | Duplicate Resend client across 3 files | `utils/email.ts`, `reviewCollection.ts`, `newsletter.ts` |
| 349 | JWT role typed as `string` not union | `utils/auth.ts` |
| 350 | `gemini.ts` parses JSON with regex, no try-catch | `utils/gemini.ts:110,136` |
| 351 | `rateLimit.ts` falls back to "unknown" IP | `utils/rateLimit.ts` |
| 352 | `sanitize.ts` only has `escapeHtml` — incomplete | `utils/sanitize.ts` |
| 353 | `ranking.ts` verification worth 50% of score | `utils/ranking.ts` |
| 354 | 25+ env vars with no startup validation | Project-wide |
| 355 | tsconfig missing `noUncheckedIndexedAccess` | `tsconfig.json` |
| 356 | tailwind.config missing explicit `darkMode: 'class'` | `tailwind.config.mjs` |
| 357 | Bare `catch(() => {})` in 12+ React components | Multiple components |
| 358 | `postcss.config.mjs` minimal — no autoprefixer | `postcss.config.mjs` |
| 359 | No `onerror` fallback for broken images | `ClinicCard.astro:41-48` |
| 360 | `healthScore.ts` uses undocumented magic numbers | `utils/healthScore.ts:57-90` |
| 361 | `filterOptions.ts` no guarantee enum matches DB values | `utils/filterOptions.ts` |
| 362 | `images.ts` doctor photo fallback to ui-avatars.com | `utils/images.ts` |
| 363 | `geo.js` timezone detection has empty catch | `public/js/geo.js:32-40` |
| 364 | `.env.example` missing OPENROUTER_API_KEY, TWILIO vars | `.env.example` |
| 365 | Global CSS `@import` for fonts duplicates Layout `<link>` | `styles/global.css:1` + `layouts/Layout.astro:82-93` |
| 366 | `global.css` — dead/unused `.bg-gradient-brand`, `.bg-gradient-hero` classes | `styles/global.css:384+` |
| 367 | Mobile tab bar uses magic number `1023px` + `!important` | `styles/global.css:269-273` |
| 368 | `adminClinicEditor` — no autosave, user loses work on page close | `AdminClinicEditor.tsx` |
| 369 | OwnerDashboard hours textarea uses HTML entity `&#10;` | `OwnerDashboard.tsx:369` |
| 370 | AdminClinics string filter comparison `'true'` vs boolean | `AdminClinics.tsx:40` |

---

## IMAGES & ASSETS (371-395)

| # | Issue | Location |
|---|-------|----------|
| 371 | 6+ images missing `width`/`height` — CLS | `index.astro:1034`, clinic card etc. |
| 372 | External images from neurostar.com, brainsway.com | `index.astro:1530-1605` |
| 373 | Google Images proxy URL used as image source | `index.astro:1605` |
| 374 | Missing `apple-touch-icon.png` for iOS | `public/` |
| 375 | Incomplete `manifest.json` — missing icon sizes, scope | `public/manifest.json` |
| 376 | No `favicon-32x32.png` or `favicon-16x16.png` | `public/` |
| 377 | Doctor photos fall back to `ui-avatars.com` external | `utils/dataHelpers.ts` |
| 378 | No lazy loading on DoctorCard images | `DoctorCard.astro` |
| 379 | ClinicMap inline SVG markers — potential XSS | `ClinicMap.tsx:137,207` |
| 380 | `public/downloads/` contains 3 empty PDF files | `public/downloads/` |
| 381 | US index page dynamic images missing alt text | `us/index.astro:196-206` |
| 382 | City page background image missing alt text | `us/[state]/[city]/index.astro:102` |
| 383 | Clinic card image no `onerror` fallback | `ClinicCard.astro:41-48` |
| 384 | Psychiatrists page hardcoded `"4.8+"` rating text | `us/[state]/[city]/psychiatrists/index.astro:97` |
| 385 | Clinic banner images on specialists page exclude `tms_chair` via filter | `specialists/index.astro:500` |
| 386 | Hardcoded review count fallback `|| 50` in schema generation | `us/[state]/index.astro:91` |
| 387 | Same hardcoded fallback in clinics sub-page | `us/[state]/[city]/clinics/index.astro:39` |
| 388 | Schema generation: `c.rating?.count || 50` repeated in 4+ pages | Multiple US pages |
| 389 | No WebP format conversion strategy | Project-wide |
| 390 | SVG hero image `tms_hero.svg` at 11KB — could be optimized | `public/images/tms_hero.svg` |
| 391 | Unsplash fallback URLs hardcoded in clinic page | `clinic/[slug].astro:103-110` |
| 392 | Specialist card clinic banner no alt text | `specialists/index.astro:502` |
| 393 | ClinicCard hover scale-105 on image may cause jank | `ClinicCard.astro:46` |
| 394 | Gallery images aspect-[4/3] with rounded-2xl — crops corners | `clinic/[slug].astro:250-266` |
| 395 | `resources/for-providers.astro` color in template literal — risky | `resources/for-providers.astro:60-61` |

---

## PAGE-SPECIFIC BUGS (396-430)

| # | Issue | Location |
|---|-------|----------|
| 396 | `/stories/[slug]` — NO actual story content | `stories/[slug].astro` |
| 397 | `/research/[slug]` — placeholder only | `research/[slug].astro` |
| 398 | `/providers/[slug]` — empty content | `providers/[slug].astro` |
| 399 | `/protocols/[slug]` — placeholder only | `protocols/[slug].astro` |
| 400 | `/demographic/[slug]` — placeholder only | `demographic/[slug].astro` |
| 401 | `/compare/[slug]` — all 22 pages placeholder only | `compare/[slug].astro` |
| 402 | `/quiz/[slug]` — minimal text | `quiz/[slug].astro` |
| 403 | `/legal/[slug]` — placeholder legal text | `legal/[slug].astro` |
| 404 | OwnerDashboard tab panels not using `aria-tabpanel` | `OwnerDashboard.tsx:242` |
| 405 | `window.location.href` navigation in SearchBox | `SearchBox.tsx:220` |
| 406 | ClinicMap sidebar 312px max-height too restrictive on mobile | `ClinicMap.tsx:312` |
| 407 | EnquiryModal no CSRF token | `EnquiryModal.tsx` |
| 408 | CallbackModal no CSRF token | `CallbackModal.astro` |
| 409 | BookingWidget condition select hardcoded options | `BookingWidget.tsx:135-144` |
| 410 | BookingWidget insurance input accepts any text | `BookingWidget.tsx:146` |
| 411 | BookingWidget no form reset on submission failure | `BookingWidget.tsx:88` |
| 412 | ReviewVote no optimistic updates | `ReviewVote.tsx` |
| 413 | ComparisonTool search dropdown no transition | `ComparisonTool.tsx:107-124` |
| 414 | PortalDashboard checks user.clinicId twice | `portal/dashboard.ts:23,30` |
| 415 | Saved clinics page uses HTML template strings (fragile) | `account/saved.astro:75-96` |
| 416 | Saved clinics inline onclick handler | `account/saved.astro:85` |
| 417 | US state page no empty state if 0 clinics | `us/[state]/index.astro` |
| 418 | US city page no empty state if 0 clinics (only filter results) | `us/[state]/[city]/index.astro` |
| 419 | Psychiatrists page no empty state if 0 doctors | `us/[state]/[city]/psychiatrists/index.astro` |
| 420 | NPI verification form has no input validation on frontend | `for-specialists.astro` |
| 421 | `for-clinics.astro` no validation feedback per field | `for-clinics.astro` |
| 422 | Admin sidebar mobile overlay uses `absolute` not `fixed` | `AdminSidebar.tsx:174-190` |
| 423 | Admin `currentPage` matching is fragile string comparison | `AdminSidebar.tsx:124` |
| 424 | Logout fetch has no error handling | `AdminSidebar.tsx:99` |
| 425 | AdminDoctors uses `any` type extensively | `AdminDoctors.tsx` |
| 426 | AdminDoctors TagInput has no maxLength | `AdminDoctors.tsx:49` |
| 427 | PortalReviews no pagination | `PortalReviews.tsx` |
| 428 | PortalLeads no pagination | `PortalLeads.tsx` |
| 429 | PortalLeads table not responsive on mobile | `PortalLeads.tsx` |
| 430 | PortalClinicEditor success auto-hides before user sees it | `PortalClinicEditor.tsx:97` |

---

## ACCESSIBILITY (431-460)

| # | Issue | Location |
|---|-------|----------|
| 431 | No `aria-label` on filter buttons in AdminClinics | `AdminClinics.tsx:99` |
| 432 | No grouped `aria-labels` on AdvancedSearch filter checkboxes | `AdvancedSearch.tsx:145-151` |
| 433 | EnquiryModal form fields missing `aria-required` | `EnquiryModal.tsx:169-197` |
| 434 | Focus ring on BookingWidget inputs too subtle (`ring-1`) | `BookingWidget.tsx:112-150` |
| 435 | BookingWidget submit button no focus indicator | `BookingWidget.tsx:155` |
| 436 | ComparisonTool dropdown search not keyboard-trapped | `ComparisonTool.tsx:100-126` |
| 437 | AdvancedSearch pagination disabled at page===0 (off-by-one?) | `AdvancedSearch.tsx:235` |
| 438 | ClinicMap no accessibility labels for map markers | `ClinicMap.tsx` |
| 439 | Star rating in AdminReviews uses string concatenation not component | `AdminReviews.tsx:105-113` |
| 440 | Table headers use `text-xs uppercase` — hard to read | `AdminClinics.tsx:134-139` |
| 441 | Color-only information for HealthScoreBadge grades | `HealthScoreBadge.tsx` |
| 442 | No `prefers-reduced-motion` support on animations | `styles/global.css:215-241` |
| 443 | Glass effect (backdrop-blur) expensive on mobile | `styles/global.css:244-248` |
| 444 | Hero heading `text-5xl` may be too large on small mobile | `Hero.astro:26` |
| 445 | Trust icons in Hero not aria-labeled | `Hero.astro:37-50` |
| 446 | Footer social SVG icons no accessible text | `Footer.astro:299-305` |
| 447 | No skip-to-content link on admin pages | Admin pages |
| 448 | Comparison table missing ARIA roles for header cells | `ComparisonTool.tsx:146-186` |
| 449 | AnalyticsDashboard text on colored backgrounds needs contrast check | `AnalyticsDashboard.tsx:72-73` |
| 450 | ReviewForm star rating buttons no individual labels | `ReviewForm.tsx:92` |
| 451 | Search autocomplete role="listbox" may be missing | `SearchBox.tsx` |
| 452 | EnquiryModal no `prefers-reduced-motion` on transitions | `EnquiryModal.astro` |
| 453 | CallbackModal backdrop doesn't prevent background interaction | `CallbackModal.astro:14` |
| 454 | GoogleReviews write-review button may be hidden from screen readers | `GoogleReviews.astro:85-102` |
| 455 | TopClinicsRanking missing `tel:` link for phone | `TopClinicsRanking.astro` |
| 456 | RelatedContent no questions data passed by default | `RelatedContent.astro:16-57` |
| 457 | Multiple modals could override scroll lock simultaneously | `EnquiryModal.tsx:51-56` |
| 458 | No lang attribute changes for international pages | `layouts/Layout.astro` — always `lang="en"` |
| 459 | No text-resize friendly layouts — rem-based but no max-width on text | Multiple pages |
| 460 | AIChatbot no keyboard shortcut to close | `AIChatbot.tsx` |

---

## DATA & CONTENT GAPS (461-500)

| # | Issue | Location |
|---|-------|----------|
| 461 | Missing treatment content: autism-spectrum | `treatments/` |
| 462 | Missing treatment content: long-covid-brain-fog | `treatments/` |
| 463 | Missing treatment content: stroke-rehabilitation | `treatments/` |
| 464 | Missing treatment content: parkinsons-disease | `treatments/` |
| 465 | Missing treatment content: alzheimers-dementia | `treatments/` |
| 466 | Missing treatment content: fibromyalgia | `treatments/` |
| 467 | Missing treatment content: eating-disorders | `treatments/` |
| 468 | Missing treatment content: cocaine-addiction | `treatments/` |
| 469 | Missing treatment content: alcohol-dependence | `treatments/` |
| 470 | Missing treatment content: schizophrenia | `treatments/` |
| 471 | Missing treatment content: multiple-sclerosis-fatigue | `treatments/` |
| 472 | Missing treatment content: epilepsy | `treatments/` |
| 473 | Missing insurance content: medicaid | `insurance/` |
| 474 | Missing insurance content: tricare | `insurance/` |
| 475 | Missing insurance content: kaiser | `insurance/` |
| 476 | Missing insurance content: humana | `insurance/` |
| 477 | Missing insurance content: all state-specific plans (10+) | `insurance/` |
| 478 | Missing comparison content: tms-vs-ect | `compare/` |
| 479 | Missing comparison content: tms-vs-ketamine | `compare/` |
| 480 | Missing comparison content: tms-vs-antidepressants | `compare/` |
| 481 | Missing comparison content: tms-vs-cbt | `compare/` |
| 482 | Missing comparison content: all 18 remaining comparisons | `compare/` |
| 483 | Missing protocol content: saint-protocol | `protocols/` |
| 484 | Missing protocol content: theta-burst-stimulation | `protocols/` |
| 485 | Missing protocol content: neuronavigation-mri-guided | `protocols/` |
| 486 | Missing protocol content: all 6 remaining protocols | `protocols/` |
| 487 | Missing research content: clinical-trials | `research/` |
| 488 | Missing research content: fda-clearance-history | `research/` |
| 489 | Missing stories content: patient-video-testimonials | `stories/` |
| 490 | Missing stories content: celebrities-who-used-tms | `stories/` |
| 491 | Missing legal content: tms-malpractice-insurance | `legal/` |
| 492 | Missing legal content: starting-a-tms-clinic | `legal/` |
| 493 | Missing legal content: who-can-administer-tms | `legal/` |
| 494 | Missing legal content: tms-cpt-codes-billing | `legal/` |
| 495 | Missing legal content: single-case-agreements | `legal/` |
| 496 | All 8 demographic pages have no content or page file | `demographic/` |
| 497 | No healthcare system content for 15 countries (only UK/AU have it) | International pages |
| 498 | Blog index missing 4 of 10 defined posts | `blog/index.astro` |
| 499 | Technology pages show clinic data but no device specifications/efficacy | `technology/[slug].astro` |
| 500 | No cross-reference between treatments ↔ technology ↔ protocols | Content architecture |

---

## SUMMARY

| Category | Count |
|----------|-------|
| Security & Data Loss | 20 |
| Broken Functionality | 15 |
| Database Schema | 20 |
| Database Queries | 15 |
| Database Validation | 10 |
| API Routes | 20 |
| SEO Structural | 30 |
| SEO Content Quality | 35 |
| International/Localization | 20 |
| Clinic Detail Page | 25 |
| Doctor Detail Page | 15 |
| UI/UX | 50 |
| Content & Copy | 30 |
| Performance | 30 |
| Code Quality | 35 |
| Images & Assets | 25 |
| Page-Specific Bugs | 35 |
| Accessibility | 30 |
| Data & Content Gaps | 40 |
| **TOTAL** | **500** |

---

**Priority order for fixes:**
1. **#1** — Revoke compromised Gemini API key immediately
2. **#2-5** — Fix SQL injection vulnerabilities (4 endpoints)
3. **#21** — Fix 788 broken image references (.png → .jpg)
4. **#7-10** — Add rate limiting to auth/submission endpoints
5. **#6** — Remove exposed admin emails from API
6. **#36-45** — Add missing database indexes
7. **#101** — Add hreflang tags for international SEO
8. **#166-172** — Address localization gaps (non-English pages in English)
9. **#186-192** — Remove hardcoded placeholder data from clinic pages
10. **#461-500** — Write missing content for 80+ empty pages
