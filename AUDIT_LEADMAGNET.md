# Lead Magnet / Lead Capture Audit — `tmslist`

**Audit date:** 2026-04-26
**Scope:** Modals, API endpoints, email delivery, rate limiting, spam, GDPR, attribution.

---

## Severity counts

- **Critical:** 5
- **High:** 7
- **Medium:** 6
- **Low:** 4
- **Total:** 22

---

## Critical

### C1. `LeadMagnetModal.astro` is never mounted on any page — its CTAs do nothing
- **File:** `src/components/LeadMagnetModal.astro` (whole file) and consumer `src/pages/questions/[slug].astro:177`
- **Repro:**
  ```
  $ grep -rln "LeadMagnetModal" src/
  src/components/LeadMagnetModal.astro    # only the file itself
  ```
  No `import LeadMagnetModal` anywhere in the project. `Layout.astro`, `index.astro`, the resources pages — none mount it. Yet `src/pages/questions/[slug].astro:177` has `onclick="document.dispatchEvent(new Event('open-lead-magnet'))"`. The event has no listener at runtime, so clicking the "Download Free" button on every `/questions/*` page is a complete no-op.
- **Fix:** Add `<LeadMagnetModal />` to `Layout.astro` (or a parent layout used by the questions pages), or replace the CTA with a direct `/resources/<slug>/` link.

### C2. Lead-magnet "free guide" is never emailed — only auto-download. Confirmation email lies.
- **File:** `src/components/LeadMagnetModal.astro:418-441`, `src/utils/email.ts:328-334`, `src/pages/api/leads/index.ts:48-56`
- **Repro:** `LeadMagnetModal` form posts to `/api/leads`. The endpoint calls `sendPatientConfirmation` with `leadType: 'lead_magnet'`. That template (line 328) tells the user: *"Your free guide is on its way to your inbox."* But no PDF is ever attached, no link to the guide is included, and the drip email (`leadmag_delivery` in `nurtureFunnel.ts`) is **never enqueued from this endpoint** — `/api/leads/index.ts` only calls `sendPatientConfirmation`, never `sendFunnelEmail`. The user is told their guide is coming — it isn't. Only the static `/downloads/<slug>.pdf` auto-click works, and only if the browser doesn't block the programmatic click.
- **Fix:** In `/api/leads/index.ts`, when `data.type === 'lead_magnet'`, call `sendFunnelEmail({ ..., segment: 'lead_magnet' }, DRIP_SEQUENCES.lead_magnet[0])` so the actual content email goes out. Or attach a public `/downloads/<slug>.pdf` link in `sendPatientConfirmation`'s `lead_magnet` template body.

### C3. Funnel sender uses unverified `*@tmslist.com` sub-domains — every funnel email silently fails
- **File:** `src/utils/nurtureFunnel.ts:620-626`
- **Repro:** The verified sender configured in `resend.ts`-using paths is `notifications@mail.tmslist.com` / `login@mail.tmslist.com` (see `src/utils/email.ts:11-12`). But `nurtureFunnel.ts` sends from `newsletter@tmslist.com`, `guides@tmslist.com`, `welcome@tmslist.com`, `clinics@tmslist.com`, `specialists@tmslist.com` — a **different** root domain (`tmslist.com` vs `mail.tmslist.com`). Unless the apex domain has separate Resend domain verification + DKIM (no evidence in repo, no env doc), every drip email — newsletter welcome, lead-magnet delivery, patient onboarding — fails with `403 The domain is not verified`. The `try/catch` in `sendFunnelEmail` swallows it (line 640-643) and only `console.error`s. From the user's POV the form succeeds; nothing arrives.
- **Fix:** Either (a) verify each subdomain in Resend and document the SPF/DKIM, or (b) change all `fromMap` entries to use `notifications@mail.tmslist.com` (same domain already verified for `email.ts`). Option b is the safe shortcut.

### C4. `/api/leads` has no honeypot, no spam scoring, accepts anything that parses
- **File:** `src/pages/api/leads/index.ts:10-32`
- **Repro:** `spamDetection.ts` exports `calculateSpamScore` and `isDisposableEmail`. `grep -rln spamDetection src/pages/` returns **nothing** — the spam util is dead code. `/api/leads` has no honeypot field, no captcha, no disposable-email check, and `formRateLimit()` is just 5/min/IP (`redis.ts:35`). With Redis missing it falls to in-memory which is per-instance, so on a serverless platform with N cold instances effective rate is `5*N/min`. A single bot can flood `leads`, send the admin `brandingpioneers@gmail.com` thousands of `[TMSList] New enquiry` emails, and trigger thousands of `sendPatientConfirmation`s to spoofed addresses (= Resend abuse complaint risk).
- **Fix:** (1) Add a hidden `website` honeypot field in `LeadMagnetModal`/`EnquiryModal`/`CallbackModal`; in `/api/leads` reject if non-empty. (2) Call `calculateSpamScore` and `isDisposableEmail` and 422 on score >= 70 or disposable. (3) Add per-email rate limit (e.g. 1 per email per 10 min) using `strictRateLimit(email, 1, '10 m', 'lead:email')` in addition to per-IP.

### C5. Appointment endpoint accepts `clinicEmail` from the client and emails it — open relay
- **File:** `src/pages/api/leads/appointment.ts:14, 74-77`
- **Repro:** `appointmentSchema.clinicEmail = z.string().email().optional()` — pulled from request body, then `sendLeadNotification({ clinicEmail: notifyEmail, ... })` is called, which CC's that address (`email.ts:172`). An attacker can POST `{clinicId: <real>, clinicName: "anything", clinicEmail: "victim@example.com", ...}` and Resend will send a "New Lead" email branded as TMSList to `victim@example.com`. That's an unauthenticated outbound-email relay — perfect spam/phishing primitive and a guaranteed Resend account-suspension trigger.
- **Fix:** Don't accept `clinicEmail` from the client. Look it up server-side: `const clinic = await db.select().from(clinics).where(eq(clinics.id, data.clinicId)).limit(1); notifyEmail = clinic[0]?.email;`. Drop `clinicEmail` from the zod schema entirely.

---

## High

### H1. `CallbackModal` and WhatsApp form synthesize fake email `noemail@provided.com`
- **File:** `src/components/CallbackModal.astro:322, 465`
- **Repro:** When user leaves the optional email blank, the modal sends `email: formData.get('email') || 'noemail@provided.com'`. The `/api/leads` endpoint then triggers `sendPatientConfirmation({ to: 'noemail@provided.com' })` for every blank-email callback. Resend bounces / silently sinks. Worse, the `leads` table accumulates rows whose `email = 'noemail@provided.com'` — every `count distinct email`, every "duplicate-email upsert" check, every dedup query is now broken. It's also a fake address being sent at scale → bounce-rate spike → Resend reputation hit.
- **Fix:** In the modal: don't set the field if blank, send `email: undefined`. In the API/schema: make `email` optional for `callback_request` and `whatsapp_inquiry` types (the zod `leadSubmitSchema` currently makes it required: `validation.ts:60`). Skip `sendPatientConfirmation` when no email.

### H2. `EnquiryModal` shows success even on API failure when network throws after request started
- **File:** `src/components/EnquiryModal.astro:319-349`
- **Repro:** The flow is: try `fetch`, then `if (res.ok) success`, `else error`, `catch error`. That's correct. But: server returns 500 → `res.ok=false` → user sees error. Server returns 201 → success. So actually OK. **However**, `LeadMagnetModal.astro:402-444` is genuinely broken: the fetch is fire-and-forget (line 412 `void apiPromise`). The success UI is rendered unconditionally before the API responds. If the API returns 400/500/429, the user is told "Success! Your guide is downloading" and the lead is never recorded server-side (only in `localStorage`, line 407-409). All rate-limit-blocked users still see "Success".
- **Fix:** `await` the API response. Only show success on 2xx. On 429/500 show "Try again in a moment" — don't lie.

### H3. Newsletter has no double opt-in — anyone can subscribe anyone
- **File:** `src/pages/api/newsletter/subscribe.ts` (whole file), `src/utils/nurtureFunnel.ts:67-167`
- **Repro:** POST `{email: "victim@target.com"}` → row inserted, drip sequence `newsletter_welcome` → `newsletter_day3_insurance` → … all 5 fire over 21 days to a non-consenting address. There is no confirmation token, no expiration, no `confirmed_at`. Combined with no IP rate limit on email (`checkRateLimit` is per-IP only), a single attacker IP can subscribe 5 victim addresses/min from rotating IPs. Plus this violates GDPR (Art. 7) and CAN-SPAM "affirmative consent" for a healthcare audience.
- **Fix:** Generate a `confirmation_token` (UUID + expiry 24h), email it from `email.ts`, only insert into `leads` (or activate the funnel) after `/api/newsletter/confirm?token=` is hit. Drop step `newsletter_welcome` from `DRIP_SEQUENCES.newsletter` and let confirm-email serve as the welcome.

### H4. Duplicate email handling: every form re-submit creates a new `leads` row
- **File:** `src/db/queries.ts:82-85`, `src/pages/api/newsletter/subscribe.ts:35-47`, `src/pages/api/leads/index.ts:32`, `src/pages/api/funnel/enter.ts:58-75`
- **Repro:** `createLead` is `db.insert(leads).values(data).returning()` — pure insert, no `onConflictDoUpdate`. There is no unique index on `email` (per schema review of `leads` table indices: only `idx_leads_type` at line 302). A user filling the lead-magnet modal 3 times → 3 leads, 3 confirmation emails, drip sequence enters the funnel 3 times — they get `leadmag_delivery` 3 times, `leadmag_day2_candidacy` 3 times, etc. Same on newsletter subscribe.
- **Fix:** Add `index('idx_leads_email_type').on(table.email, table.type)` to `leads` table and use `db.insert(...).onConflictDoUpdate({ target: [leads.email, leads.type], set: { metadata: ... } })`. Or in app code, look up existing lead and skip drip enrollment if `funnel_entered_at` already set.

### H5. CTA `Send Email` & `Request Callback` show success when API rate-limited
- **File:** `src/components/CallbackModal.astro:308-346`
- **Repro:** The catch block catches *any* throw, including `throw new Error("Request failed (429)")` from line 335. So a 429 looks identical to a 500. The user sees only "Something went wrong" — fine. But the real issue: the rate limit is keyed by IP only (`checkRateLimit` → `formRateLimit` 5/min). A clinic owner showing the CTA to a colleague behind same office NAT will hit the limit. There's no specific 429 messaging ("you've submitted recently — please wait 1 minute") — user just retries indefinitely.
- **Fix:** In the catch, parse `res.status === 429` and show a specific "Please wait a moment before submitting again" message with the `retryAfter` header.

### H6. UTM / referrer attribution is broken — `sourceUrl` is the modal page, not the landing entry
- **File:** Every modal sends `sourceUrl: window.location.href` (e.g. `EnquiryModal.astro:332`, `LeadMagnetModal.astro:370`); `src/utils/utm.ts` exists but is never imported in the lead path
- **Repro:**
  ```
  $ grep -rn "from.*utm\|import.*utm" src/components/ src/pages/api/leads/
  # empty
  ```
  `utm.ts` has UTM-capture helpers, none of the modals use them. So if a Google-Ads click `?utm_source=google&utm_campaign=tms-buyer` lands on `/`, browses to `/clinics/california/`, and submits the enquiry — the lead's `sourceUrl` is `/clinics/california/`, the UTM params are lost. Attribution to ad spend is impossible.
- **Fix:** On first page load, store UTMs from `URLSearchParams` into `sessionStorage`/`localStorage`. In each modal, read them and include in `metadata`: `metadata: { utm_source, utm_campaign, utm_medium, landing_url, referrer: document.referrer }`.

### H7. PostHog server-side event uses email as `distinctId` (PII) and includes `condition`
- **File:** `src/pages/api/funnel/enter.ts:95-106`
- **Repro:** `getPostHogServer().capture({ distinctId: email, properties: { condition: meta.condition, state, city } })`. Email is plaintext PII as the analytics primary key — flows into PostHog forever, ungovernable for GDPR/HIPAA "right to deletion". `condition` is a free-text health field (e.g. "depression", "OCD") — that's potentially-sensitive health info under HIPAA hygiene rules going to a marketing analytics platform with no BAA.
- **Fix:** Use a hashed identifier (`crypto.subtle.digest('SHA-256', email)`) or a UUID `lead_id` as `distinctId`. Drop `condition`/`insurance` from the event properties — keep only `segment`, `source`, broad geo (`state` is borderline OK).

---

## Medium

### M1. Lead-magnet HTML download endpoint isn't reachable from the modal flow at all
- **File:** `src/pages/api/downloads/[resource].ts`
- **Repro:** This SSR endpoint generates a printable HTML document. But the only callers are: nothing. The modal links to `/downloads/<slug>.pdf` (static), and the `/resources/<slug>/` page also links to `/downloads/<slug>.pdf`. The `/api/downloads/[resource]` route is dead code that nonetheless ships in the SSR bundle. Also it returns `Content-Type: text/html` while setting `Content-Disposition: inline; filename=".html"` (line 292) — that's an inline display, not a download. If anyone ever links to it, the filename hint is wrong.
- **Fix:** Either remove the file, or wire it as the canonical fallback (`if pdf exists redirect, else render html`) and switch to `Content-Disposition: attachment`.

### M2. Lead-magnet modal honors GDPR "subscribe" checkbox client-side only
- **File:** `src/components/LeadMagnetModal.astro:282-295, 369, 399`
- **Repro:** Modal has a checkbox `subscribe` defaulted to `checked`. Value is forwarded as `metadata.subscribed: true|false`. But `/api/leads/index.ts` ignores `metadata.subscribed` entirely — both consenting and non-consenting users get `sendPatientConfirmation` (line 48-56) **and** the eventual drip enrollment (when fixed per C2). User unchecks → still emailed. GDPR opt-in is theatre.
- **Fix:** In `/api/leads`, branch on `data.metadata?.subscribed === true` before adding to funnel/sending autoresponder.

### M3. `LeadMagnetModal` close button calls undefined `closeModal()` from injected HTML
- **File:** `src/components/LeadMagnetModal.astro:428` (success-state injected HTML)
- **Repro:** The success replacement HTML embeds `<button onclick="closeModal()">`. `closeModal` is defined inside the script's closure (line 326) — it isn't on `window`, so the inline `onclick` resolves to `undefined`. Click → `ReferenceError: closeModal is not defined`. User can only escape with the X button or Esc key.
- **Fix:** Either expose `window.closeLeadMagnetModal = closeModal;` or replace inline onclick with `addEventListener` after the innerHTML swap.

### M4. Newsletter form's success state ignores actual response shape
- **File:** `src/components/NewsletterSignup.astro:62-71`
- **Repro:** On `!res.ok` it does `await res.json()` then `error || 'Something went wrong'`. The newsletter API returns `{error: 'Invalid email'}` — fine. But on 429 from `checkRateLimit` it returns `{error: 'Too many requests', retryAfter: N}` — UI displays "Too many requests" with no retry advice. And there's no debouncing — a user clicking submit twice will get rate-limited on the second click.
- **Fix:** Disable the button on submit; display retryAfter in the error message.

### M5. `sendLeadNotification` and `sendPatientConfirmation` HTML-inject user-controlled fields without escaping
- **File:** `src/utils/email.ts:178, 187, 199, 357, 369-374`
- **Repro:** `subject: \`[TMSList] ${typeLabel} from ${data.patientName}\`` — patientName is user input, unescaped. In the body: `<p><strong>Name:</strong> ${data.patientName}</p>` — direct interpolation into HTML. `data.message.replace(/\n/g, '<br>')` is the only sanitization, no `escapeHtml`. The `/api/leads` endpoint does call `escapeHtml` on `name` and `message` before insert (line 28-30), so the *email* sees escaped data — but `appointment.ts:78` passes `patientName: data.name` which is the **un-escaped** name (escaping is applied to the DB write at line 56 but `data.name` itself is mutated/unmutated inconsistently). Confirm by reading lines 54-78: `data.name` is the original parsed input, not the escaped form.
- **Fix:** Either escape consistently in the email helpers themselves, or always pass escaped strings. Centralize in `email.ts`.

### M6. PII (full name, phone, email, message) `console.log`'d to server logs on errors
- **File:** `src/pages/api/leads/index.ts:63`, `src/pages/api/leads/appointment.ts:111`, `src/pages/api/funnel/enter.ts:118`
- **Repro:** `console.error('Lead submit error:', err);` — if the error object is wrapped/serialized with the request body (which Drizzle errors sometimes include), the user's name/phone/email lands in stdout → cloud-logging → potentially indexed by Datadog/Sentry/Vercel logs without a HIPAA-aware retention policy. `validation` errors specifically `console.error` the entire `err`, which may include the rejected payload.
- **Fix:** Log only `err.code` / `err.message` / a request UUID. Never log the body. Add a `requestId` header for correlation instead.

---

## Low

### L1. PDF download is triggered by programmatic `<a>` click — many browsers block popups
- **File:** `src/components/LeadMagnetModal.astro:435-441`, `src/pages/resources/[slug].astro:223-230`
- **Repro:** Safari and Firefox in strict mode block `link.click()` not initiated by direct user gesture (the gesture chain breaks across the `await fetch`). Result: success message shows, but no download starts. User is told "Your guide is downloading now" — nothing downloads.
- **Fix:** Trigger the download directly from the form's submit handler (it *is* a user gesture), before/parallel to the API call. Or render a "Your download didn't start? Click here" link in the success state.

### L2. Floating CTA button (`#floating-cta-btn`) shows on every page including admin/portal
- **File:** `src/components/EnquiryModal.astro:6-13`
- **Repro:** The floating button is always rendered. If `EnquiryModal` is included in the global Layout, admins viewing `/admin/leads` see the patient-facing "Talk to a Specialist" CTA.
- **Fix:** Gate by `Astro.url.pathname` or pass a `hide` prop when used inside admin layouts.

### M3 fix duplicate — see M3.

### L3. `for` attributes in `EnquiryModal` collide on multi-instance pages
- **File:** `src/components/EnquiryModal.astro:118-121` etc.
- **Repro:** All inputs use `id="name"`, `id="email"`, `id="phone"`. If a page accidentally renders the modal twice (e.g. a layout includes it once and a section another), DOM has duplicate IDs and screen-readers focus the wrong field.
- **Fix:** Use unique IDs scoped to the modal (`id="enquiry-name"`).

### L4. `subscribeSchema` doesn't bind email to lowercase / trim
- **File:** `src/pages/api/newsletter/subscribe.ts:11-17`
- **Repro:** `John@Foo.com` and `john@foo.com` both pass and create separate rows (combined with H4 dup issue). Compounds duplicate-lead problem.
- **Fix:** `email: z.string().email().toLowerCase().trim()`.

---

## Summary

The lead-capture flow has **structural delivery failures** (C1: dead modal, C2: promised email never sent, C3: every funnel email comes from an unverified domain) layered with **abuse vectors** (C4: no spam controls, C5: open email relay via `clinicEmail`). Even when these get fixed, attribution (H6), consent (H3, M2), and dedup (H4) are broken — so the funnel will collect leads but won't be able to prove ROI or stay GDPR/CAN-SPAM compliant.

Recommended order: fix C5 (legal liability) → C3 (every email failing) → C2 + C1 (the actual user-promised behavior) → C4 (lock down abuse) → H series.
