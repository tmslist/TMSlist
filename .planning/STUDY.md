# TMSList — Study & Task Plan

## Context
User wants: Stripe purchase flow fixed, autoresponders confirmed, job applications in admin panel, internal linking audit, image audit on Top Locations, coverage confirmation, and full content/design audit + conversion optimization across all pages.

---

## ROOT CAUSE ANALYSIS

### 1. Stripe Not Redirecting to Checkout

**Root Cause:** The Stripe checkout endpoint at `src/pages/api/subscribe.ts` calls `createSubscriptionCheckout()` which uses `plan.priceId` — which maps to `process.env.STRIPE_PRICE_PRO` / `STRIPE_PRICE_PREMIUM` / `STRIPE_PRICE_ENTERPRISE`. If these env vars are NOT set in Vercel:
- `priceId` becomes `null`
- `createSubscriptionCheckout` throws: `"Free plan does not require checkout"`
- Returns HTTP 500 JSON error
- The billing page shows an alert instead of redirecting

**Fix:** Set the three `STRIPE_PRICE_*` env vars in Vercel. OR add better error handling that shows a helpful message.

Additionally, the advertising page (`/advertise/`) has NO Stripe integration — it only has `mailto:advertise@tmslist.com` links. There's no purchase flow for advertising at all.

### 2. Autoresponder — ALREADY IMPLEMENTED ✓
`src/pages/api/leads/index.ts` already calls `sendPatientConfirmation()` for every enquiry. It works for all types: `contact`, `callback_request`, `appointment_request`, `newsletter`, `lead_magnet`, `enquiry`.

**Status:** Working. No changes needed unless confirmation emails are landing in spam.

### 3. Job Applications in Admin Panel — MISSING
Job applications are:
- Stored in DB (`job_applications` table)
- Emailed to clinic owners
- Create in-app notifications for clinic owners

**MISSING:** Admin panel has no UI to view/manage job applications. Admins cannot see who applied to what jobs.

### 4. Internal Linking
- `InternalLinks.astro` caps at 8 links/page
- User wants 10-15 links/page
- State/city pages have good contextual links
- Content pages (blog, treatments, resources) need more links

### 5. Top Locations Section — NO Images
`src/pages/us/index.astro` lines 322-336: The "Most Popular TMS States" section uses `gemini-city-img` CSS gradient fallbacks. Images are loaded via `/api/ai/generate-image` but the API may be failing. The fallback is a gradient, not a real image.

### 6. TMS Clinic & Psychiatrist Coverage
- **TMS Clinics:** All 50 states + DC, cities derived from `clinics.json` data. ✓
- **Psychiatrists:** City-specific psychiatrist pages exist at `/us/[state]/[city]/psychiatrists/`. Coverage is data-driven — all cities where a clinic has doctors. ✓

### 7. Content & Design Audit
- 217 pages total — massive scope
- Need to audit: conversion optimization, aesthetics, link density, image usage, content quality
- The `advertising.md` content file has DUPLICATE content (sections repeated 3 times)
- Content pages need conversion CTAs and internal links

---

## TASK BREAKDOWN

### Phase 1: Fix Critical Issues

- [ ] **Task 1:** Set `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_ENTERPRISE` in Vercel env vars + add better error messaging in checkout flow
- [ ] **Task 2:** Add job applications view to admin panel (new API endpoint + AdminJobApplications React component + admin page)
- [ ] **Task 3:** Confirm all enquiry types send autoresponder confirmation email

### Phase 2: Internal Linking & Images

- [ ] **Task 4:** Audit and add 10-15 internal links to key pages (homepage, state pages, city pages, treatment pages, blog, resources)
- [ ] **Task 5:** Fix Top Locations section — ensure AI images load or add fallback Unsplash images for top 5 states (California, Florida, New York, Connecticut, Alabama)

### Phase 3: Coverage & Data Audit

- [ ] **Task 6:** Verify TMS clinic coverage across all US cities (spot-check the data)
- [ ] **Task 7:** Verify psychiatrist coverage across all US cities

### Phase 4: Content & Design Optimization

- [ ] **Task 8:** Content audit + conversion optimization for all key pages
- [ ] **Task 9:** Aesthetic improvements — typography, spacing, visual hierarchy, CTAs
- [ ] **Task 10:** Fix duplicate content in `advertising.md`

### Phase 5: Advertising Purchase Flow

- [ ] **Task 11:** Build Stripe-powered advertising purchase flow (or Stripe Payment Links for advertising)
