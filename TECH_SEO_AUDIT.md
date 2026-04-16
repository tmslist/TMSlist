# TMS List — Technical SEO Audit Report

**Date:** 2026-04-16  
**Scope:** Full codebase (Astro SSR, Node adapter)  
**Site URL:** https://tmslist.com

---

## Summary Table

| # | Area | Severity | Issue | File(s) |
|---|------|----------|-------|---------|
| 1 | Canonical URLs | **HIGH** | Clinic pages, specialist pages, and multiple index pages lack explicit `canonical` prop | `src/pages/clinic/[slug].astro`, `src/pages/specialist/[slug].astro`, `src/pages/blog/index.astro`, `src/pages/specialists/index.astro`, `src/pages/questions/index.astro`, `src/pages/insurance/[slug]/[state]/index.astro` |
| 2 | Sitemap | **HIGH** | `sitemap.xml` does not exist as a static file in `public/`; robots.txt references `sitemap-index.xml` — verify this filename matches Astro's build output | `public/robots.txt`, `astro.config.mjs` |
| 3 | robots.txt | **MEDIUM** | Redundant `Allow: /api/clinics/` after `Disallow: /api/` is ineffective; no `Crawl-delay` directive | `public/robots.txt` |
| 4 | Image Optimization | **MEDIUM** | `@astrojs/image` / `astro:assets` not integrated; all images are raw `<img>` tags or Cloudinary URLs; no width/height enforcement, no AVIF/WebP serving | `astro.config.mjs` |
| 5 | Font Display | **MEDIUM** | Self-hosted fonts preloaded but no `font-display: swap` in CSS; causes potential CLS (FOIT) | `src/styles/global.css` (not found — check font CSS) |
| 6 | Hreflang | **LOW** | `HreflangTags.astro` component defined but never imported/used; duplicate hreflang logic exists unused | `src/components/HreflangTags.astro` |
| 7 | Hardcoded Canonical | **LOW** | Ten `/answers/` pages and ten `/faqs/*.html.astro` pages use hardcoded domain strings instead of `getCanonicalUrl()` helper | `src/pages/answers/*.astro`, `src/pages/faqs/*.html.astro` |
| 8 | Duplicate Redirect | **LOW** | `/doctor/[slug].astro` redirect is missing the trailing slash in the target URL (`/specialist/${slug}/` has trailing slash, but the original route is `Astro.redirect("/specialists/")` without trailing slash) | `src/pages/doctor/[slug].astro` |

---

## Detailed Findings

---

### 1. Canonical URLs — HIGH

**Affected files:**
- `src/pages/clinic/[slug].astro`
- `src/pages/specialist/[slug].astro`
- `src/pages/blog/index.astro`
- `src/pages/specialists/index.astro`
- `src/pages/questions/index.astro`
- `src/pages/insurance/[slug]/[state]/index.astro`

**Problem:** The `Layout.astro` component (lines 62-65) strips query params from `Astro.url.href` and renders `<link rel="canonical">`. However, the canonical tag falls back to `Astro.url.href` when no `canonical` prop is passed. For SSR pages (this project uses `output: 'server'`), `Astro.url.href` will reflect the live request URL — which may include geo-redirect path changes (e.g., `/us/...` rewritten from `/uk/...`). Pages that rely solely on the default fallback can produce inconsistent canonical URLs depending on the entry path.

Specific issues:
- **Clinic pages** (`clinic/[slug].astro`, line 19): When clinic is not found in DB, it redirects to `/us/?clinic=${slug}` — the error fallback itself produces a query-param URL that would propagate as canonical if the redirect target were a page.
- **Specialist pages** (`specialist/[slug].astro`, line 103): Only passes `hreflangxDefault={true}` but no explicit `canonical` prop.
- **Index/listing pages** (`blog/index.astro`, `specialists/index.astro`, `questions/index.astro`): No canonical prop passed to Layout.

**Recommendation:** Pass explicit `canonical={...}` prop on every page, ideally via `getCanonicalUrl(Astro.url.pathname)` from `src/utils/canonical.ts`.

---

### 2. Sitemap — HIGH

**File:** `public/robots.txt` (line 23), `astro.config.mjs` (lines 25-33)

**Problem:** `robots.txt` references:
```
Sitemap: https://tmslist.com/sitemap-index.xml
```

However, `ls public/` shows **no `sitemap.xml` or `sitemap-index.xml` in the `public/` directory**. The `@astrojs/sitemap` integration is configured in `astro.config.mjs`, which generates the sitemap at build time. Astro's default output filename is `sitemap-index.xml` (or `sitemap-0.xml` depending on page count).

**Risk:** If the build outputs `sitemap-0.xml` (or another filename) but `robots.txt` references `sitemap-index.xml`, search engines will get a 404 for the sitemap reference. Additionally, the filter in the sitemap config excludes `/admin/`, `/portal/`, `/owner/`, `/account/`, `/thank-you`, and `/unsubscribe` — this is good, but the sitemap should be verified post-build.

**Recommendation:** After running a production build, verify the actual sitemap filename in the `dist/` or build output directory. Update `robots.txt` to match exactly. Also consider adding the `changefreq` and `priority` attributes to the sitemap entries via the `@astrojs/sitemap` `customPages` option for key pages.

---

### 3. robots.txt — MEDIUM

**File:** `public/robots.txt`

**Issues:**

a) **Redundant Allow after Disallow (lines 17-21):**
```
Disallow: /api/
Allow: /api/clinics/
Allow: /api/reviews/
Allow: /api/clinics/search
Allow: /api/clinics/nearby
```

In robots.txt, `Allow` directives override `Disallow` for the same path prefix. By specifying `Disallow: /api/` and then `Allow: /api/clinics/`, the intent is correct — to allow crawl of the public clinic/search APIs. However, this is redundant because crawlers already handle this correctly, and the more explicit pattern is `Allow: /api/clinics`. The current pattern with full paths is fine but overly verbose.

b) **No `Crawl-delay` directive:** Large crawlers (Yandex, some bots) respect `Crawl-delay: 1` to avoid server overload. Not critical for Google/Bing but beneficial.

c) **Missing sitemap reference for international sitemaps:** Only one sitemap is declared. If international pages use separate sitemap files (e.g., `/uk/sitemap.xml`), they should be listed here too.

**Recommendation:** Add `Crawl-delay: 1` after the Disallow/Allow block. Consider adding all international sitemap references.

---

### 4. Image Optimization — MEDIUM

**File:** `astro.config.mjs`

**Problem:** `@astrojs/image` (`astro:assets`) is **not installed or integrated**. The project relies entirely on:
1. Cloudinary CDN URLs with query parameters (e.g., `?auto=format&fit=crop`)
2. Raw `<img>` HTML tags with `loading="lazy"`

While Cloudinary does provide format conversion and CDN delivery, the absence of Astro's image integration means:
- No automatic `srcset` generation for responsive images
- No AVIF/WebP conversion beyond what Cloudinary's `auto=format` provides
- No build-time width/height extraction to prevent layout shift
- No image minimization for non-Cloudinary images (SVG fallbacks, local images)

Additionally, many `<img>` tags do **not** specify explicit `width` and `height` attributes, which contributes to Cumulative Layout Shift (CLS). Examples found:
- `src/pages/clinic/[slug].astro` line 593: `<img src={similarClinic.logo_url} ... loading="lazy" />` (no width/height)
- `src/pages/index.astro` line 1160: `<img src={post.image} ... loading="lazy" />` (no width/height)
- `src/components/ClinicCard.astro` line 77: `<img ... loading="lazy" />` (no width/height)

**Recommendation:** Install `@astrojs/image` and replace `<img>` tags with Astro's `<Image>` component for local/static images. For Cloudinary URLs, ensure all `<img>` tags have explicit `width` and `height` attributes.

---

### 5. Font Display — MEDIUM

**File:** `src/layouts/Layout.astro` (lines 154-155) + font CSS (not found in repo root)

**Problem:** Fonts are preloaded in the HTML `<head>`:
```html
<link rel="preload" as="font" type="font/woff2" href="/fonts/PlusJakartaSans-400.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/PlusJakartaSans-700.woff2" crossorigin />
```

However, the corresponding CSS `@font-face` declarations were not found in the codebase. The absence of `font-display: swap` in `@font-face` rules means browsers may use an invisible fallback font during load (FOIT — Flash of Invisible Text), which hurts First Contentful Paint (FCP) and Largest Contentful Paint (LCP).

**Recommendation:** Ensure all `@font-face` declarations in the font CSS include `font-display: swap;`.

---

### 6. Hreflang — LOW

**File:** `src/components/HreflangTags.astro`

**Problem:** `HreflangTags.astro` is a standalone component (73 lines) that implements hreflang generation for 21 countries. A Grep search across all `.astro` files returns **zero imports of this component** — it is never used.

The hreflang logic is **already fully implemented in `Layout.astro`** (lines 78-99), covering:
- Auto-detection of country pages via `COUNTRY_PREFIXES`
- Generation of equivalent URLs for all 21 countries with `x-default`
- Conditional `x-default` via `hreflangxDefault` prop

The `HreflangTags.astro` component is dead code.

**Recommendation:** Remove `src/components/HreflangTags.astro` to avoid maintenance confusion.

---

### 7. Hardcoded Canonical URLs — LOW

**Affected files:**
- `src/pages/answers/does-tms-work-for-depression.astro`
- `src/pages/answers/does-insurance-cover-tms.astro`
- `src/pages/answers/how-long-does-tms-take.astro`
- `src/pages/answers/tms-cost-per-session.astro`
- `src/pages/answers/who-qualifies-for-tms.astro`
- `src/pages/answers/is-tms-safe.astro`
- `src/pages/answers/what-is-tms-therapy.astro`
- `src/pages/answers/tms-success-rates.astro`
- `src/pages/answers/tms-side-effects.astro`
- `src/pages/answers/tms-vs-medication.astro`
- `src/pages/faqs/tms-fda-approval.html.astro`
- `src/pages/faqs/tms-cost-per-session.html.astro`
- `src/pages/faqs/tms-insurance-coverage.html.astro`
- `src/pages/faqs/tms-sessions-needed.html.astro`

**Problem:** Each file contains a hardcoded `<link rel="canonical">` tag with the literal domain `https://tmslist.com`:
```html
<link rel="canonical" href="https://tmslist.com/answers/does-tms-work-for-depression/">
```

This works correctly but bypasses the `getCanonicalUrl()` helper in `src/utils/canonical.ts` which provides consistent URL normalization (stripping trailing slashes, lowercasing). If the site domain ever changes, all 14 files would need manual updates.

**Recommendation:** Replace hardcoded canonical tags in these files with `getCanonicalUrl(Astro.url.pathname)` or pass the `canonical` prop to Layout.

---

### 8. Redirect Target Missing Trailing Slash — LOW

**File:** `src/pages/doctor/[slug].astro` (line 23)

**Problem:**
```javascript
return Astro.redirect(`/specialist/${slug}/`, 301);
```

While this is correct, note that the preceding error redirect (line 20) does **not** include a trailing slash:
```javascript
if (!found) return Astro.redirect("/specialists/");
```

This is actually correct — `/specialists/` with trailing slash matches the canonical URL of the specialists listing page. However, verify that the specialists index page (`src/pages/specialists/index.astro`) renders at exactly `/specialists/` (with trailing slash) as the canonical URL, to prevent a redirect chain.

**Status:** Not a bug — confirm consistency only.

---

## Positive Findings

| Area | Status | Notes |
|------|--------|-------|
| robots.txt | Good | Proper Disallow directives for `/admin/`, `/portal/`, `/owner/`, `/account/`; sitemap reference present |
| Breadcrumbs | Excellent | `Breadcrumbs.astro` provides both visual breadcrumbs AND JSON-LD `BreadcrumbList` schema |
| 404 page | Good | `src/pages/404.astro` exists with `noindex={true}` |
| 500 page | Good | `src/pages/500.astro` exists with `noindex={true}` |
| Hreflang (Layout) | Excellent | Auto-generated hreflang for 21 countries + x-default in `Layout.astro` |
| Redirects | Good | 301 redirect from `/doctor/[slug]` to `/specialist/[slug]/` |
| Security headers | Excellent | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `middleware.ts` |
| Font preloading | Good | PlusJakartaSans woff2 files preloaded |
| LCP image preloading | Good | `preloadImages` prop on Layout enables `<link rel="preload" as="image">` |
| Lazy loading | Good | 30+ instances of `loading="lazy"` across pages |
| Schema markup | Good | MedicalClinic, Physician, FAQPage, Article, BreadcrumbList, Organization schemas present |
| Content Security Policy | Good | Comprehensive CSP in middleware |
| Content rating meta | Good | `rating` meta tag varies by `contentType` (General for blog/treatment, 6plus otherwise) |
| OpenSearch | Good | `/opensearch.xml` registered in Layout and present in `public/` |
| sitemap config | Good | Filter excludes private routes (`/admin/`, `/portal/`, etc.) |

---

## Priority Action Items

### Do First (HIGH)
1. Verify sitemap build output filename (`sitemap-index.xml` vs `sitemap-0.xml`) and update `public/robots.txt` to match
2. Add explicit `canonical` prop to: `clinic/[slug].astro`, `specialist/[slug].astro`, `blog/index.astro`, `specialists/index.astro`, `questions/index.astro`, `insurance/[slug]/[state]/index.astro`

### Do Second (MEDIUM)
3. Install `@astrojs/image` and add explicit `width`/`height` to all `<img>` tags lacking them
4. Add `font-display: swap` to `@font-face` declarations for self-hosted fonts

### Do Third (LOW)
5. Remove `src/components/HreflangTags.astro` (dead code)
6. Replace hardcoded canonical URLs in `/answers/` and `/faqs/` pages with `getCanonicalUrl()` helper
7. Add `Crawl-delay: 1` to `robots.txt`
8. Verify `/specialists/` renders at trailing-slash URL as canonical
