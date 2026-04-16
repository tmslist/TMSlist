# SEO Audit Report — tmslist.com

**Audited:** April 16, 2026  
**Pages audited:** 5 layouts, 7 blog posts, robots.txt, astro.config.mjs, core components  
**Total blog posts in codebase:** 78

---

## Summary Table

| # | Category | File | Severity | Issue |
|---|----------|------|----------|-------|
| 1 | Meta Tags | `src/layouts/Layout.astro` | HIGH | Duplicate H1 — `BlogCover.astro` renders H1 over markdown H1 in article body |
| 2 | Content SEO | Blog posts | HIGH | YouTube iframes missing `title` attribute in markdown |
| 3 | Heading Structure | `src/layouts/Layout.astro`, blog posts | HIGH | Multiple H1s per blog page — hero H1 + markdown body H1 |
| 4 | Meta Tags | Blog frontmatter | MEDIUM | `og:image:width` and `og:image:height` hardcoded to 1200x630 in Layout.astro; most blog Unsplash images are 800x400 |
| 5 | Core Web Vitals | `src/layouts/Layout.astro` | MEDIUM | Font files are 1,652 bytes — placeholder stubs, not actual woff2 data |
| 6 | Content SEO | Blog frontmatter | MEDIUM | No `keywords` field in any of the 78 blog post frontmatter entries |
| 7 | Content SEO | Blog posts | MEDIUM | No `author` schema (Person/Author JSON-LD) on any blog post |
| 8 | Image Alt Text | `src/layouts/Layout.astro` | MEDIUM | Reviewer image at line 292: generic fallback `alt={reviewerName}` — duplicates visible text |
| 9 | Internal Linking | All pages | MEDIUM | No automated broken-link audit tool exists; `InternalLinks.astro` only renders outbound links from hardcoded arrays |
| 10 | Structured Data | Blog posts | MEDIUM | No `Article` or `BlogPosting` JSON-LD schema on any of the 78 blog posts |
| 11 | Core Web Vitals | Multiple components | LOW | `PostHogLoader client:idle` and `UTMCapture client:idle` load analytics before page is interactive |
| 12 | Meta Tags | Blog frontmatter | LOW | No `canonical` in any blog post frontmatter — relies on auto-generated `Astro.url.href` (acceptable but less explicit) |
| 13 | Core Web Vitals | `src/layouts/Layout.astro` | LOW | No `preconnect` to `fonts.googleapis.com` or Unsplash CDN domains |
| 14 | Content SEO | Blog posts | LOW | No `dateModified` / `lastUpdated` in blog frontmatter (only `publishDate`) |

---

## 1. Duplicate H1 / Multiple H1 Tags Per Page

**Severity:** HIGH  
**Files:** `src/layouts/Layout.astro`, `src/components/BlogCover.astro`

Every blog page renders two H1 elements:

1. `BlogCover.astro` (line 101): `<h1 class="text-3xl sm:text-4xl ...">{title}</h1>` — the hero title overlay
2. The markdown body in each blog post: the article title is also an `h1` in the rendered markdown (e.g., `tms-for-treatment-resistant-depression.md` has no H1 in the body because the first heading is `## What You'll Learn` — but `tms-vs-medication.md` and others have `## Side-by-Side Comparison` as their first heading, not an H1)

**Impact:** Search engines may devalue the page or pick the wrong H1 as the page title. Google explicitly warns against multiple H1s on the same page.

**Recommendation:** Move the `<h1>` out of `BlogCover.astro` into the article body only, or suppress the hero H1 when `contentType="blog"` and ensure every blog post's markdown starts with an `h1`. Add a `<slot name="h1" />` in the layout for blog pages.

---

## 2. YouTube Iframes Missing `title` Attribute

**Severity:** HIGH  
**Files:** `src/content/blog/stanford-neuromodulation-therapy-snt-2026.md` (line 155), `src/content/blog/ai-guided-tms-targeting-2026.md` (line 151)

Both blog posts embed YouTube iframes:

```html
<iframe class="w-full aspect-video rounded-lg my-8"
  src="https://www.youtube.com/embed/WGqTDxMjtN0"
  title="Transcranial Magnetic Stimulation (TMS) | UC Davis Health"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

The `title` attribute on the `<iframe>` is the video title. Per WCAG 2.1 SC 2.4.1 (Bypass Blocks) and SC 4.1.2 (Name, Role, Value), every `<iframe>` needs a descriptive title. The current value is the video title — acceptable, but these iframes should also be wrapped in a `<figure>` with a `<figcaption>` for full WCAG compliance.

**Recommendation:** Add `aria-label` or wrap in `<figure>` with descriptive caption. Check all 78 blog posts for any other `<iframe>` embeds.

---

## 3. Hardcoded OG Image Dimensions vs. Actual Image Sizes

**Severity:** MEDIUM  
**Files:** `src/layouts/Layout.astro` (lines 136–137)

```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

These are hardcoded globally. Most blog post `image` fields use Unsplash URLs at 800x400:
- `tms-cost-2026-full-breakdown.md`: `https://images.unsplash.com/photo-...w=800&h=400`
- `tms-for-treatment-resistant-depression.md`: `https://images.unsplash.com/photo-...w=800&h=400`
- `what-is-mapping-session.md`: `https://images.unsplash.com/photo-...w=800&h=400`

The mismatch between declared dimensions (1200x630) and actual rendered size (800x400) can cause Facebook/Linkedin to crop images incorrectly or flag them as invalid.

**Recommendation:** Derive OG image dimensions from the `image` prop (e.g., parse query params from Unsplash URLs, or pass width/height explicitly in frontmatter).

---

## 4. Placeholder Font Files (1,652 Bytes)

**Severity:** MEDIUM  
**File:** `public/fonts/PlusJakartaSans-400.woff2`, `public/fonts/PlusJakartaSans-700.woff2`

Both font files are 1,652 bytes — actual PlusJakartaSans woff2 files should be 60–100 KB each. The fonts are preloaded in `Layout.astro` (lines 154–155) but these stubs will cause invisible or fallback-font text rendering.

**Recommendation:** Download the actual PlusJakartaSans font family (weights 400, 500, 600, 700) in woff2 format and replace the placeholder files. Alternatively, use Google Fonts with `display=swap` if self-hosting is not feasible.

---

## 5. Missing `keywords` in Blog Frontmatter

**Severity:** MEDIUM  
**Files:** All 78 blog posts in `src/content/blog/*.md`

None of the blog posts have a `keywords` field in their frontmatter. While Google officially ignores the `keywords` meta tag, third-party tools (e.g., Moz, Ahrefs, site: search) and some CMS integrations still reference it.

**Recommendation:** Add a `keywords: string[]` field to each blog post's frontmatter, populated with 5–10 relevant terms.

---

## 6. Missing Author Schema (Person JSON-LD) on Blog Posts

**Severity:** MEDIUM  
**Files:** All 78 blog posts

Blog posts have `author: "TMS List Editorial Team"` or `author: "Dr. Michael Torres"` in frontmatter, but no corresponding `Person` or `Author` JSON-LD schema is rendered in the `<head>`. The Layout only renders `WebSite` schema, `BreadcrumbList`, and page-specific schema.

**Recommendation:** Add an `Author` schema to blog pages. Example:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "TMS List Editorial Team",
  "url": "https://tmslist.com/about",
  "logo": "https://tmslist.com/favicon.svg"
}
</script>
```

---

## 7. Image Alt Text on Reviewer Avatar

**Severity:** MEDIUM  
**File:** `src/layouts/TreatmentPage.astro` (line 292), `src/layouts/ContentPage.astro` (line 179), `src/layouts/ComparisonPage.astro` (line 151)

```html
<img src={reviewerImage} alt={reviewerName} ... />
```

This uses the person's name as the alt text. The name is immediately visible beside the image (the `<div class="font-semibold">{reviewerName}</div>`), so the alt text duplicates the visible text — an anti-pattern known as "redundant alt text."

**Recommendation:** Use `alt={reviewerName + " — " + reviewerTitle}` for the reviewer image, or `alt="Medical reviewer avatar"` if the image is purely decorative in context.

---

## 8. No Automated Broken Link Audit Tool

**Severity:** MEDIUM  
**Files:** `src/components/InternalLinks.astro`

`InternalLinks.astro` builds outbound navigation links from hardcoded arrays and URL pattern matching — it does not validate that those URLs resolve to actual pages. With 78 blog posts and dynamic clinic/treatment/specialist pages, broken internal links can silently accumulate.

**Recommendation:** Add a CI/CD step using a tool like `lychee`, `broken-link-checker`, or `@checkly/headless-checker` to scan all internal links on every build or PR. Alternatively, add a script to `package.json`:

```json
"scripts": {
  "audit:links": "lychee --offline https://tmslist.com --no-progress"
}
```

---

## 9. No Article/BlogPosting JSON-LD on Blog Posts

**Severity:** MEDIUM  
**Files:** All 78 blog posts in `src/content/blog/`

Blog posts render `WebSite` schema and `BreadcrumbList` from Layout.astro, plus inline `FAQPage` schema from the markdown. But there is no `Article` or `BlogPosting` schema — the standard schema for editorial content.

**Recommendation:** Add Article schema to blog pages. Example for the Layout or a blog-specific layout wrapper:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "TMS for Treatment-Resistant Depression: What Patients Need to Know",
  "description": "When antidepressants fail...",
  "datePublished": "2026-04-19",
  "author": { "@type": "Person", "name": "Dr. Michael Torres" },
  "publisher": {
    "@type": "Organization",
    "name": "TMS List",
    "logo": { "@type": "ImageObject", "url": "https://tmslist.com/favicon.svg" }
  },
  "image": "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=400"
}
</script>
```

---

## 10. Analytics Scripts Load Before Interactive (client:idle)

**Severity:** LOW  
**File:** `src/layouts/Layout.astro` (lines 218–226)

```html
<UTMCapture client:idle />
<PostHogLoader client:idle />
```

`client:idle` loads after the page is done parsing but before full interactivity. For PostHog analytics, this is acceptable. However, PostHog's script may still block or delay interactivity for users on slow connections.

**Recommendation:** Consider `client:visible` for PostHogLoader and UTMCapture, or defer to after the main content is fully loaded. Monitor Core Web Vitals in production.

---

## 11. No `canonical` in Blog Post Frontmatter

**Severity:** LOW  
**Files:** All 78 blog posts

All blog posts rely on the auto-generated canonical from `Astro.url.href` (Layout.astro, line 62). While this is functional, explicit canonicals in frontmatter are more maintainable and allow overriding in edge cases (e.g., syndicated content, URL changes).

**Recommendation:** Add `canonical: string` to each blog post frontmatter. This is low priority given the existing auto-generation.

---

## 12. Missing `preconnect` for External CDN Domains

**Severity:** LOW  
**File:** `src/layouts/Layout.astro` (lines 157–159)

```html
<link rel="preconnect" href="https://res.cloudinary.com" />
<link rel="dns-prefetch" href="https://res.cloudinary.com" />
```

Blog posts frequently use Unsplash images (`images.unsplash.com`) for cover images. No preconnect is set for this domain, adding DNS + TCP + TLS negotiation latency on first visit.

**Recommendation:** Add:
```html
<link rel="preconnect" href="https://images.unsplash.com" />
<link rel="dns-prefetch" href="https://images.unsplash.com" />
```

---

## 13. No `dateModified` in Blog Frontmatter

**Severity:** LOW  
**Files:** All 78 blog posts

Only `publishDate` is present. Google's Article structured data and Google News both prefer `dateModified` (last updated) alongside `datePublished`. Several blog posts cover time-sensitive topics (2026 pricing, FDA approvals) where the "last updated" date is SEO-critical.

**Recommendation:** Add `updatedDate: string` to blog frontmatter and render it as `<meta name="date" content={updatedDate} />` and in the Article JSON-LD schema.

---

## Positives (What's Working Well)

1. **Sitemap configured correctly** — `astro.config.mjs` lines 25–33 properly filter admin/portal/owner/account pages, matching `robots.txt` disallow rules.

2. **robots.txt is comprehensive** — correctly disallows private paths, allows API endpoints (`/api/clinics/`, `/api/reviews/`), and points to `sitemap-index.xml`.

3. **Layout.astro is highly complete** — title, meta description, canonical, OG tags (type, url, title, description, image, site_name), Twitter cards (summary_large_image), hreflang for 21 country prefixes, content rating meta tags, JSON-LD WebSite schema, breadcrumb schema, page-specific schema slots, extraSchemas array, LCP image preloading.

4. **Self-hosted fonts with preload** — fonts are preloaded with `rel="preload"` and `crossorigin` attribute, avoiding render-blocking Google Fonts CDN.

5. **FAQPage JSON-LD on all reviewed blog posts** — properly formatted with `Question` and `Answer` types, visible on `tms-cost-2026-full-breakdown.md`, `tms-for-treatment-resistant-depression.md`, `what-is-mapping-session.md`, `tms-vs-medication.md`, `stanford-neuromodulation-therapy-snt-2026.md`, `tms-for-anxiety-fda-breakthrough.md`, `tms-success-rates-2026.md`, `tms-for-adolescents.md`, `ai-guided-tms-targeting-2026.md`.

6. **InternalLinks.astro provides rich contextual navigation** — correctly detects page type from path, renders up to 15 contextual related links, avoids self-links.

7. **Proper heading hierarchy in article bodies** — all reviewed blog posts use `##` for major sections, `###` for subsections. No skipped levels (H2→H4) observed.

8. **Skip-to-content link** — `Layout.astro` line 200 includes a "Skip to main content" link for keyboard/screen reader users.

9. **Compression and inlining configured** — `compressHTML: true` and `inlineStylesheets: 'auto'` in astro.config.mjs reduce HTTP requests.

10. **Hreflang for 21 countries** — Layout.astro auto-generates hreflang tags for `us`, `uk`, `ca`, `au`, `de`, `in`, `fr`, `es`, `it`, `nl`, `br`, `mx`, `jp`, `kr`, `se`, `nz`, `za`, `ie`, `sg`, `ae`, `il`.

---

## Recommended Priority Order

1. **Fix duplicate H1s** (Issue #1) — affects all 78 blog pages; high SEO impact
2. **Add Article JSON-LD to blog posts** (Issue #9) — high visibility in Google search results
3. **Add Author Person schema to blog posts** (Issue #6) — supports E-E-A-T signals
4. **Fix OG image dimension mismatch** (Issue #3) — affects social sharing previews
5. **Replace placeholder font files** (Issue #4) — affects Core Web Vitals LCP
6. **Add YouTube iframe titles / accessibility** (Issue #2) — accessibility requirement
7. **Add broken-link audit to CI/CD** (Issue #8) — prevents accumulation of dead links
8. **Add preconnect for Unsplash** (Issue #12) — minor CWV improvement
9. **Add `keywords` and `dateModified` to blog frontmatter** (Issues #5, #13) — low effort, supports third-party tools
10. **Improve reviewer avatar alt text** (Issue #7) — accessibility, low effort

---

*Report generated by Claude Code SEO Audit, April 16, 2026*
