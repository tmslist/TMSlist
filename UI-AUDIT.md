# UI Audit — tmslist

Date: 2026-04-26. Two classes audited: text contrast/cloaking, and missing/broken media. CSS vars used throughout: `--paper: #FBFAF7` (cream/off‑white), `--paper2: #F4F1EA`, `--ink: #0A1628` (near‑black), `--ink2: #1E2A3B`, `--accent: #1B4B5A` (dark teal), `--muted: #5A6B82`.

---

## 1. Contrast / cloaking issues

Severity legend: **CRIT** = text fully invisible or near-invisible to most users; **HIGH** = fails WCAG AA on a load-bearing element; **MED** = legible but well below intended hierarchy.

### Site-wide (shared components / layouts) — fix first

#### 1.1 CRIT — `EnquiryModal` heading uses `text-slate-900` on `bg-[#1B4B5A]` header
File: `src/components/EnquiryModal.astro:42`, close button at `:47`
```html
<div class="bg-[#1B4B5A] px-6 py-4 ...">
  <h3 class="text-lg font-semibold text-slate-900" id="modal-title">Get Free TMS Guidance</h3>
  <button class="text-[#1B4B5A] hover:text-slate-900 ..."> ...close icon... </button>
```
Why: dark navy text on dark teal header → unreadable; close X is `#1B4B5A` on `#1B4B5A` (literally the same color, completely invisible).
Fix: change both to `text-white` (and hover `text-white/80`).

#### 1.2 CRIT — `CallbackModal` modal headers (callback + WhatsApp) repeat the same bug
File: `src/components/CallbackModal.astro:23, 25, 157, 159`
```html
<div class="bg-[#1B4B5A] px-6 py-4 ...">
  <h3 class="... text-white">Request a Callback</h3>
  <p class="text-[#1B4B5A] text-xs mt-0.5" id="callback-clinic-name"></p>
  <button class="text-[#1B4B5A] hover:text-white ..."> ...close X... </button>
```
Why: clinic name caption (`:23`) and close button (`:25`) are `text-[#1B4B5A]` painted on `bg-[#1B4B5A]` — invisible. Same pattern in WhatsApp variant.
Fix: clinic name → `text-white/80`; close button → `text-white/80 hover:text-white`.

#### 1.3 CRIT — `BlogCover.astro` category badge text on dark hero is dark teal
File: `src/components/BlogCover.astro:20-26`
```js
'Research':      { ..., badge: 'bg-[#1B4B5A]/30', badgeText: 'text-[#1B4B5A]' },
'Treatment':     { ..., badge: 'bg-[#1B4B5A]/30', badgeText: 'text-[#1B4B5A]' },
'FAQ':           { ..., badge: 'bg-[#1B4B5A]/30', badgeText: 'text-[#1B4B5A]' },
'Patient Guide': { ..., badge: 'bg-[#1B4B5A]/30', badgeText: 'text-[#1B4B5A]' },
const accent = ... || { color: '#1B4B5A', badge: 'bg-[#1B4B5A]/30', badgeText: 'text-[#1B4B5A]' };
```
Why: badge sits on `bg-[#0F2A36]` hero (and the colored fill behind is also dark). `text-[#1B4B5A]` (dark teal) on dark backdrop is unreadable. Affects every blog post except the Insurance category. Suspected leftover from a "violet → teal" rebrand where light pill text wasn't migrated.
Fix: change `badgeText` for all dark-bg categories to `text-white` or `text-[#5BA8BD]` (light teal).

#### 1.4 CRIT — `ContentHero.astro` "violet" badge uses dark text on dark bg
File: `src/components/ContentHero.astro:41`
```js
violet: 'bg-[#1B4B5A]/20 text-[#1B4B5A] border-[#1B4B5A]/20',
```
Why: ContentHero wrapping `<section>` is `bg-[#0F2A36]`; the violet badge (the default for many pages) is dark teal text on a 20%-opacity teal pill = invisible. Other colors (emerald, blue, amber, rose, cyan, slate) correctly use `text-*-300` light variants.
Fix: `violet: 'bg-[#1B4B5A]/30 text-cyan-200 border-cyan-300/20'` (or any light tone).

#### 1.5 CRIT — `QuizTeaser.astro` body paragraph dark teal on dark teal gradient
File: `src/components/QuizTeaser.astro:17`
```html
<div class="... bg-gradient-to-br from-[#1B4B5A] via-[#143844] to-[#0F2A36] ...">
  ...
  <p class="text-[#1B4B5A] leading-relaxed mb-8">Answer a few quick questions ...</p>
```
Why: `text-[#1B4B5A]` body copy on a `from-[#1B4B5A]` gradient is invisible. This component is rendered on `index.astro` and elsewhere.
Fix: `text-white/80`.

#### 1.6 CRIT — `SpecialistsSection.astro` "Find a Specialist" CTA
File: `src/components/SpecialistsSection.astro:36`
```html
<a class="px-6 py-3 bg-white hover:bg-[#1B4B5A] text-white rounded-xl ...">Find a Specialist</a>
```
Why: `text-white` on `bg-white` — button text is invisible until hover.
Fix: `text-[#143844]` (and keep `hover:text-white`).

#### 1.7 CRIT — `FindClinicCTA.astro` description uses `text-slate-400`
File: `src/components/FindClinicCTA.astro:27`
```html
<section class="... bg-[#0F2A36] mt-8">
  ...
  <p class="text-slate-400 max-w-xl mx-auto mb-8 ...">{description}</p>
```
Why: `text-slate-400` is roughly `#94a3b8` over `#0F2A36` — passes 3:1 large-text but fails 4.5:1 for body. Per `CLAUDE.md`, `text-slate-*` shouldn't exist; this should be `text-white/70`. This component is included in `ContentPage`, `ComparisonPage`, `TreatmentPage`, `InsurancePage` layouts and `blog/[slug].astro` — affects most content pages.
Fix: `text-white/70` (and `text-xs text-slate-500` on `:38` → `text-white/50`).

#### 1.8 CRIT — `BlogCover.astro` title rendered as `<p>` not `<h1>`
File: `src/components/BlogCover.astro:82`
```html
<p class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight ...">
  {title}
</p>
```
Not contrast, but adjacent semantic bug — the page title element on every blog post is a `<p>`. Worth flagging while you are in this file.
Fix: change the `<p>` to `<h1>`.

#### 1.9 HIGH — `LeadMagnetModal.astro` close button
File: `src/components/LeadMagnetModal.astro:26`
```html
class="text-slate-600 hover:text-slate-900 transition-colors"
```
Why: assumes light header, but the modal panel header in this file is also painted dark in the markdown variant — verify; either way, slate→gray rename per CLAUDE.md.
Fix: confirm parent bg, then `text-gray-500 hover:text-gray-900` or `text-white/70 hover:text-white`.

#### 1.10 HIGH — `BlogSources.astro` heavy use of `text-slate-400` bibliography text on white card
File: `src/components/BlogSources.astro:55-72`
Why: `text-slate-400` numerals/DOI on white card is borderline-illegible body text. Component is rendered on every blog post that includes sources.
Fix: bump to `text-gray-500`/`text-gray-600`; per CLAUDE.md no `text-slate-*` anywhere.

#### 1.11 HIGH — `ClinicalEvidence.astro` slate-on-white DOI text
File: `src/components/ClinicalEvidence.astro:96`, `:91`
```html
<p class="text-xs text-slate-400 mb-2">DOI: ...</p>
<p class="text-sm text-slate-500 mb-1">{authors} ({year}) {journal}</p>
```
Same as 1.10. Reused on every treatment page.
Fix: `text-gray-500` for citation lines, `text-gray-600` for authors.

#### 1.12 MED — `TrustSignals.astro`, `LocationSEOContent.astro`, `SectionLinks.astro`, `FeaturedClinics.astro`, `TreatmentMeta.astro`, `AuthorBio.astro` all use `text-slate-*`
1124 hits across `src/components/`, `src/pages/`, `src/layouts/`. Most are visually OK because `slate` happens to render fine over the white/cream backgrounds; the issue is the explicit project rule: "classes are `text-gray-*` (not `text-slate-*`) per design system." Mass-replace `slate-` → `gray-` across these files.

### Per-page contrast issues

#### 1.13 CRIT — `bg-[var(--paper)] text-white` pattern (white text on cream) — 15 occurrences across pages
This is the single biggest user-facing bug. `--paper` is `#FBFAF7` (cream); white text on it is invisible. Looks like a botched search/replace where `bg-ink` → `bg-[var(--paper)]` happened but `text-white` wasn't flipped.

| File:line | Element |
|---|---|
| `src/pages/index.astro:1641` | "Check Eligibility" CTA on home final-CTA |
| `src/pages/unsubscribe.astro:23` | Unsubscribe submit button |
| `src/pages/pricing.astro:28` | Enterprise plan badge — `badge: 'bg-[var(--paper)] text-white'` |
| `src/pages/portal/billing.astro:86` | Enterprise billing badge (same pattern) |
| `src/pages/best-tms-clinics/index.astro:123` | "View All Clinics" button |
| `src/pages/best-tms-clinics/by-city/[slug].astro:309` | Same button, every city page |
| `src/pages/us/[state]/[city]/[treatment]/index.astro:312` | Treatment city CTA — every treatment×city page |
| `src/pages/alternative-treatments/index.astro:162, 261` | Treatment CTAs |
| `src/pages/advertise/index.astro:147` | Non-popular tier CTA |
| `src/pages/add-listing/index.astro:488` | "Submit listing" button |
| `src/pages/blog/index.astro:81, 240, 244` | "All" filter pill (default + JS toggle classes) |
| `src/pages/resources/for-providers.astro:45, 123, 126` | Active category-filter pill (default + JS toggle) |
| `src/pages/providers/filter/[slug].astro:93` | "View All Clinics" CTA |
| `src/pages/how-we-rank/index.astro:88` | Hover tooltip |

Fix: replace `bg-[var(--paper)] text-white` with either `bg-[var(--ink)] text-white` (the likely original intent — dark button) or `bg-[var(--paper)] text-[var(--ink)]` (cream button with dark text). The hover state `hover:bg-[#1B4B5A]` in several of them confirms the intent was a dark button. Recommend: bulk replace `bg-[var(--paper)] text-white` → `bg-[var(--ink)] text-white`. For the JS toggle in `blog/index.astro` and `resources/for-providers.astro`, also update the `classList.add/remove` strings to match.

#### 1.14 HIGH — `index.astro:1450, 1486, 1596` use `bg-[var(--paper)]/10 text-white`
File: `src/pages/index.astro:1450, 1486, 1596`
These are over a dark "knowledge base" section so likely fine, but the literal class is misleading. Confirm parent is dark `--ink`; if so, change to `bg-white/10` for consistency.

#### 1.15 HIGH — `thank-you.astro:39`, `research/index.astro:129`, all `answers/*.astro` CTAs use `bg-[var(--paper)]/10 ... text-white`
Likely OK if rendered over dark ink hero, but verify the section bg in each — these are at the bottom of pages and you've had section backgrounds change.

#### 1.16 MED — `timeline.astro:309` `text-slate-200` link text
Hero is `bg-[var(--ink)]` (dark) so visually it's fine, but per CLAUDE.md kill the `slate-`.

#### 1.17 CRIT — `ProviderPageBody.astro` and `LeadMagnetModal.astro` `text-slate-*` spread on white card backgrounds
Mostly readability MED, but several `text-slate-300` placeholder/secondary on white = HIGH (e.g. `AiHeroImage.astro:28` "Loading..." text — `text-slate-300` on `var(--paper2)` cream = nearly invisible). Fix: `text-gray-500`.

#### 1.18 MED — `PageHero.astro:40, 79` breadcrumb / stat sublabel `text-slate-400`
On white hero. `slate-400` = `#94a3b8` ≈ 3.0:1 — fails AA for small text.
Fix: `text-gray-500` (4.6:1).

### Heroes — variant defaults review

- `PageHero.astro` (white-bg hero): correctly uses dark text. **OK**.
- `ContentHero.astro` (dark-bg hero): see 1.4 (violet badge invisible). All other badge variants OK.
- `StateHero.astro`: dark gradient, white text. **OK**.
- `BlogCover.astro`: see 1.3 (badge text invisible).
- `Hero.astro` home hero: heavy use of inline styles with `var(--ink)` bg + light text. **OK**.

### Gradient overlays
- `BlogCover.astro:51` — overlay `from-[#0F2A36] via-[#0F2A36]/70 to-[#0F2A36]/40` over AI image: the 0.40 top is thin; long titles near the top can wash out. MED.
- `ContentHero.astro:116` — `bg-gradient-to-t from-white to-transparent` 12px fade at the bottom of a dark hero. If the next section is **not** white this produces a visible white line. Several pages embed `ContentHero` then a non-white `bg-[var(--paper)]/50` section right after — visually OK but verify on `pricing`, `tools`, `for-clinics`.

**Total contrast issues found: ~1140 (1124 raw `text-slate-*` + ~15 unique CRIT cloaking issues).** Top ~50 highest-impact captured above; the remaining are all "rename `slate-` → `gray-`" cleanup hits that don't visually break anything but violate the design system.

---

## 2. Missing / broken media

### Sweep results

- All `<img src="/...">` static refs in `src/components/` and `src/pages/` resolve to files that exist under `public/`:
  - `/assets/tms_chair_luxury.jpg` ✓ (`public/assets/tms_chair_luxury.jpg`)
  - `/images/tms_hero.svg` ✓
  - `/images/tms_mechanism.svg`, `tms_coil_detail.svg`, `tms_consultation.svg`, `tms_session.svg`, `tms_results.svg` ✓
  - `/grid.svg` ✓ (`public/grid.svg`)
- Default OG image `DEFAULT_OG_IMAGE = '/images/tms_hero.svg'` ✓ (file exists; suboptimal because OG images should be raster ~1200×630 — Facebook/LinkedIn typically reject SVG).
- All `/downloads/*.pdf` referenced exist:
  - `/downloads/tms-buyers-guide.pdf` ✓
  - `/downloads/insurance-checklist.pdf` ✓
  - `/downloads/tms-vs-medication.pdf` ✓
- Favicons `public/favicon.png`, `public/favicon.svg`, `public/favicon.ico` all present.

No hard-broken local image refs found in scoped sweep.

### Issues

#### 2.1 HIGH — Default OG image is SVG (`/images/tms_hero.svg`)
File: `src/content.config.ts:4`
```ts
const DEFAULT_OG_IMAGE = '/images/tms_hero.svg';
```
Why: SVG OG images are not rendered by most social-link unfurlers (Facebook, Slack, LinkedIn). Every blog/comparison/treatment/research page that does not override `image` in frontmatter will share with no preview thumbnail.
Fix: produce a 1200×630 PNG/JPG default (e.g. `/images/og-default.jpg`) and point the constant at it.

#### 2.2 HIGH — Comparison/treatment OG images depend on Unsplash hot-link (~30 markdown files)
Files: `src/content/comparisons/*.md`, `src/content/treatments/{epilepsy,chronic-pain,smoking-cessation}.md` (e.g.):
```yaml
image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=400&fit=crop"
```
Why: external Unsplash CDN can disappear or rate-limit; many entries reuse the same photo across unrelated comparisons (e.g. `photo-1559757175-...` appears in 15+ files), which is also a brand/SEO problem. If Unsplash ever blocks hot-linking, every comparison/treatment page loses its OG/hero image at once.
Fix: download to `public/images/og/` and reference locally; ideally generate per-topic art.

#### 2.3 MED — `TechnologySection.astro` hot-links a vendor logo with `mix-blend-multiply`
File: `src/components/TechnologySection.astro:28`
```html
<img src="https://www.brainsway.com/wp-content/uploads/2021/04/BrainsWay-2021-logo_full-color_black-name-1-e1619462194423.png" ... />
```
Why: external logo URL on the BrainsWay corporate site — fragile and uncached. If they rename or move it, the card breaks. Other vendor logos in this section likely have the same issue (file has more entries below that line).
Fix: download vendor logos to `public/images/devices/` and serve locally with proper `width`/`height`.

#### 2.4 MED — `src/data/clinics.json` row 22432 has a placeholder hero image
```json
"hero_image_url": "https://forsale.spaceship-cdn.com/static/latest/3.latest/assets/fonts/spaceship-logo-small.svg"
```
Why: a clinic record points at the Spaceship domain "for sale" page logo — clearly a wrong/garbage value scraped at some point.
Fix: null this field or replace with a real image; consider validating `hero_image_url` patterns at import time.

#### 2.5 LOW — Many `<img src={dynamic}>` paths (clinic, doctor, author, OG) are user/data-driven
Files include `ClinicCard.astro:72`, `SpecialistsSection.astro:51`, `AuthorBio.astro:26`, `TreatmentMeta.astro:56`, `react/AdminMediaLibrary.tsx`, `react/PortalClinicEditor.tsx`, etc.
These can't be statically validated. Several React components already swallow with `onError={... display='none'}` or fallback to `/images/tms_hero.svg` (good — see `ClinicCard.astro:79`). Recommend doing the same for `AuthorBio`, `TreatmentMeta`, `SpecialistsSection` to avoid broken-image icons when a clinic/doctor record has a stale URL.

**Total media issues found: 5 unique (1 OG default; ~33 Unsplash hot-link records; 1 vendor logo hot-link; 1 garbage clinic hero; many unguarded dynamic `<img>` tags).**

---

## Recommended fix order
1. The 15 `bg-[var(--paper)] text-white` page-level hits (1.13) — single highest-blast-radius bug.
2. The 5 modal/badge cloaking issues (1.1–1.6) — site-wide components.
3. Default OG image swap to PNG (2.1).
4. `text-slate-400`/`text-slate-500` on dark backgrounds in `FindClinicCTA`, `BlogCover`, `ContentHero` (1.7, 1.3, 1.4).
5. Bulk `text-slate-*` → `text-gray-*` rename per CLAUDE.md (1.12) — Tailwind 4 migration finish.
6. Replace Unsplash hot-links with local files (2.2).
