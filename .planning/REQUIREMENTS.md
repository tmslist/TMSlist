# Requirements: TMSList Clinic & Admin Portal

**Defined:** 2026-04-16
**Core Value:** Help patients find and connect with TMS clinics, and help clinic owners grow their practice through a complete practice management experience.

## v1 Requirements

100 improvements across 10 categories, mapped to 7 phases.

---

### Phase 1: Authentication & Security

- [x] **AUTH-01**: Admin accounts can enable TOTP-based 2FA (Google Authenticator compatible)
- [x] **AUTH-02**: Admin accounts support passkey/WebAuthn as 2FA alternative
- [x] **AUTH-03**: Role-based granular permissions — separate `can_edit`, `can_delete`, `can_export` flags per user, not just broad roles
- [x] **AUTH-04**: Session expiry controls — configurable session length (1h, 8h, 24h, 30d) and "remember me" persistent sessions
- [x] **AUTH-05**: Login activity audit — last 10 logins shown per admin account with IP, device, timestamp
- [x] **AUTH-06**: Suspicious login alerts — email notification to admin when login from new IP/device detected
- [x] **AUTH-07**: Magic tokens hashed before storage in database (fix CR-02 from code review)
- [x] **AUTH-08**: JWT_SECRET throws error instead of warning when missing (fix CR-01 from code review)
- [x] **AUTH-09**: Account lockout after 5 failed login attempts, with 15-minute cooldown
- [x] **AUTH-10**: Audit log captures all auth events — failed logins, password resets, permission changes

---

### Phase 2: Admin Dashboard & Analytics

- [ ] **DASH-01**: KPI trend cards — MoM/YoY delta shown on each metric (leads, clinics, reviews, revenue)
- [ ] **DASH-02**: Clinic health distribution chart — pie/donut chart of clinics by health score bucket (0-25, 26-50, 51-75, 76-100)
- [ ] **DASH-03**: Lead source attribution chart — bar chart of leads by UTM source (Google, Facebook, direct, referral)
- [ ] **DASH-04**: Conversion funnel — visit → lead → booked appointment per clinic (requires analytics events)
- [ ] **DASH-05**: Revenue projection widget — estimate monthly recurring revenue from featured/paid listings
- [ ] **DASH-06**: Spam lead detection — auto-flag leads with disposable email domains or bot patterns
- [ ] **DASH-07**: Admin activity feed — real-time feed of other admins' recent actions in sidebar
- [ ] **DASH-08**: Customizable dashboard widgets — admins can pin/remove/reorder dashboard cards
- [ ] **DASH-09**: Scheduled email digests — daily or weekly summary sent to admin email addresses
- [ ] **DASH-10**: Export analytics to PDF — one-click monthly report generation with charts

---

### Phase 3: Admin Clinic Management

- [ ] **CLIN-01**: Inline clinic preview — "View live" button in admin opens clinic page in new tab
- [ ] **CLIN-02**: Clinic comparison mode — select 2-3 clinics side-by-side to compare ratings, leads, completeness
- [ ] **CLIN-03**: Bulk CSV import — import 100+ clinics from CSV file with field mapping UI
- [ ] **CLIN-04**: Duplicate clinic merging — merge two clinic records, choose which fields to keep from each
- [ ] **CLIN-05**: Automated verification workflow — auto-verify clinics with valid NPI/license, flag others for manual review
- [ ] **CLIN-06**: Clinic takeover request workflow — existing owner can request to claim a clinic someone else listed
- [ ] **CLIN-07**: Featured clinic editor — promote clinics with start/end date, auto-expire featured status
- [ ] **CLIN-08**: Clinic tier/badging system — "Verified", "Top Rated", "New", "Accepting New Patients" badges
- [ ] **CLIN-09**: Location geocoding map — show lat/lng on mini-map in clinic editor, allow pin adjustment via drag
- [ ] **CLIN-10**: Smart address autocomplete — integrate Google Places API in address fields of clinic editor
- [ ] **CLIN-11**: Insurance plan autocomplete — type "blue" → show "Blue Cross Blue Shield", "Blue Shield of CA", etc.
- [ ] **CLIN-12**: Clinic categories/tags bulk editor — bulk assign tags across multiple clinics
- [ ] **CLIN-13**: Soft-delete with redirect — when deleting clinic, option to redirect old slug to another clinic
- [ ] **CLIN-14**: Clinic status reasons — require admin to select reason when rejecting/pausing a clinic
- [ ] **CLIN-15**: Clone clinic — duplicate a clinic record as starting point for a new location

---

### Phase 4: Admin Reviews & Leads

- [ ] **RVWS-01**: Review sentiment analysis — auto-tag reviews as positive/neutral/negative via keyword detection
- [ ] **RVWS-02**: Review response deadlines — alert admins when clinic owner hasn't responded within 7 days
- [ ] **RVWS-03**: Review flagging by admins — flag reviews for policy violations, not just approve/reject binary
- [ ] **RVWS-04**: Admin review response editor — admin can draft/edit owner responses before publishing
- [ ] **RVWS-05**: Review analytics per clinic — rating distribution over time, common keywords extracted
- [ ] **RVWS-06**: Reply-to-review email trigger — send email to reviewer when clinic owner responds
- [ ] **RVWS-07**: Bulk review import — import Google reviews via CSV upload

- [ ] **LEAD-01**: Lead scoring — auto-score leads by completeness (has phone, has message, clinic match)
- [ ] **LEAD-02**: Lead assignment — manually assign leads to specific clinic owners
- [ ] **LEAD-03**: Lead tagging & internal notes — add internal notes to leads, tag by campaign/keyword
- [ ] **LEAD-04**: Auto-responder templates — configure automated email responses per lead type
- [ ] **LEAD-05**: Lead notification preferences — per-admin notification settings (email, in-app)
- [ ] **LEAD-06**: Lead deduplication — auto-detect when same person submits multiple leads (same email/phone)
- [ ] **LEAD-07**: Lead export filters — export leads by date range, type, clinic, status to CSV/Excel
- [ ] **LEAD-08**: Lead Kanban pipeline view — board: New → Contacted → Qualified → Booked → Lost
- [ ] **LEAD-09**: Social proof API authentication (fix CR-03 from code review) — require auth for `/api/clinics/social-proof`

---

### Phase 5: Admin Blog, Billing & SEO

- [ ] **BLOG-01**: Blog post scheduling — schedule posts to publish at specific date/time
- [ ] **BLOG-02**: Blog post live preview — split-pane editor with real-time preview of rendered post
- [ ] **BLOG-03**: Blog analytics per post — pageviews, time on page, bounce rate for each post
- [ ] **BLOG-04**: Author profiles — assign author to post, display author bio on post page
- [ ] **BLOG-05**: Related posts suggestions — auto-suggest 3 related posts when writing a new post
- [ ] **BLOG-06**: Content versioning — keep history of all blog post edits, restore any previous version
- [ ] **BLOG-07**: Broken link checker — scan all blog posts for broken internal/external links
- [ ] **BLOG-08**: Blog category/tag taxonomy — hierarchical categories, not just flat tags

- [ ] **BILL-01**: Invoice generation — create and send PDF invoices for featured listing payments
- [ ] **BILL-02**: Payment status tracking — track paid, overdue, pending status per clinic
- [ ] **BILL-03**: Pricing tier management — CRUD for pricing tiers (Basic, Featured, Premium)
- [ ] **BILL-04**: Discount/coupon codes — generate codes with configurable discount amount/percentage
- [ ] **BILL-05**: Revenue by plan breakdown — chart showing revenue from each pricing tier
- [ ] **BILL-06**: Refund workflow — process partial/full refunds with audit trail
- [ ] **BILL-07**: Auto-billing reminders — email clinics 30/7/1 day before subscription renewal

- [ ] **SEO-01**: Schema.org validator — check that clinic pages have valid LocalBusiness JSON-LD
- [ ] **SEO-02**: Sitemap management — view/edit which pages are in sitemap, submit to Google Search Console
- [ ] **SEO-03**: Robots.txt editor — visual editor for robots.txt rules with preview
- [ ] **SEO-04**: 404 error tracker — log all 404s with referrer, suggest redirects for high-traffic ones
- [ ] **SEO-05**: Core Web Vitals dashboard — show LCP, FID, CLS scores per page type
- [ ] **SEO-06**: Redirect manager — CRUD for 301/302 redirects, bulk import from CSV
- [ ] **SEO-07**: Canonical URL checker — flag pages with duplicate or missing canonical tags
- [ ] **SEO-08**: Image optimization report — list oversized/unoptimized images on pages
- [ ] **SEO-09**: Hreflang tag checker — verify hreflang tags for multi-language support

---

### Phase 6: Clinic Portal Core Experience

- [ ] **PORT-01**: Review response — clinic owners can reply to patient reviews directly from portal
- [ ] **PORT-02**: Profile completeness tips — inline coaching with specific suggestions: "Add a photo to get 3x more leads"
- [ ] **PORT-03**: Real-time notifications — WebSocket-based instant notifications, replacing polling
- [ ] **PORT-04**: Mobile-optimized portal — responsive redesign for tablet/phone portal access
- [ ] **PORT-05**: Bulk job listing actions — archive/delete multiple job listings at once
- [ ] **PORT-06**: Job application email notifications — email clinic owner when new application arrives
- [ ] **PORT-07**: Application status workflow — mark applications as Reviewing → Interview → Offer → Hired
- [ ] **PORT-08**: Saved competitor clinics — clinic owners can bookmark competitor listings
- [ ] **PORT-09**: Profile visibility toggle — let clinics hide their listing from public temporarily
- [ ] **PORT-10**: Direct image upload — upload clinic photos directly to cloud storage, not just URL input
- [ ] **PORT-11**: Before/after photo gallery — dedicated section for treatment result photos on clinic profile
- [ ] **PORT-12**: Doctor/staff roster — add multiple doctors/staff with credentials and photos per clinic
- [ ] **PORT-13**: Onboarding checklist — step-by-step checklist for new clinic owners to complete their profile
- [ ] **PORT-14**: Help center / FAQ — contextual help articles in portal sidebar
- [ ] **PORT-15**: Announcement banner — admins can push announcements to all clinic portal users

---

### Phase 7: Clinic Portal Advanced Features

- [ ] **DATA-01**: Own clinic analytics — give clinics their own analytics page (visits, leads, trends)
- [ ] **DATA-02**: Lead source breakdown — show which channels (search, map, blog) bring the most leads
- [ ] **DATA-03**: Competitor comparison — compare own rating/reviews against top 3 nearby competitors
- [ ] **DATA-04**: Patient satisfaction trends — chart showing average rating over time
- [ ] **DATA-05**: SEO score for their listing — simple "listing health score" (0-100) with specific improvements
- [ ] **DATA-06**: Google Business Profile sync — pull in Google reviews, ratings, photos via GBP API
- [ ] **DATA-07**: QR code generator — generate QR code linking to their clinic listing for print materials
- [ ] **DATA-08**: Embed widget code — give clinics "Book Now" or "Find Us" embeddable button for their website
- [ ] **DATA-09**: Referral program — unique referral link per clinic, track new clinic signups from referrals
- [ ] **DATA-10**: Integration hub placeholder — connect with EHR/EMR, Zapier, or other tools (UI only, v1 stub)

---

## v2 Requirements

Deferred to future release. Acknowledged but not in current roadmap.

### Appointments & Scheduling

- **APPT-01**: Appointment calendar — let clinics set available slots, patients can book online
- **APPT-02**: Booking confirmation emails — automated email on booking request + confirmation
- **APPT-03**: Patient messaging — secure message thread between clinic and patient
- **APPT-04**: Calendar sync — sync appointments with Google Calendar / Outlook

### Advanced Revenue

- **REV-01**: Stripe billing portal — self-serve upgrade/downgrade/cancel for clinic owners
- **REV-02**: Usage-based pricing — charge per lead received beyond plan limit
- **REV-03**: Multi-location management — one login to manage multiple clinic locations

### Community & Social

- **COMM-01**: Clinic-to-clinic forum — private forum for verified clinic owners to share best practices
- **COMM-02**: Patient testimonials library — clinic owners can request and manage patient testimonials

### AI & Automation

- **AI-01**: AI-powered reply suggestions — suggest review responses using AI
- **AI-02**: Auto-generate clinic description — AI writes initial clinic description from NPI data

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app (iOS/Android) | Web-first strategy; mobile app deferred to v2+ |
| Multi-language / i18n | Single language (English) for now |
| Video consultation | Not core to directory/review value prop |
| White-label / custom domains | Too complex for initial release |
| Advanced AI features | Require external AI API integration; defer |
| Real-time chat (patient ↔ clinic) | Privacy/HIPAA concerns, complex moderation |
| EHR/EMR system integration | Out of scope for portal v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 – AUTH-10 | Phase 1 | Pending |
| DASH-01 – DASH-10 | Phase 2 | Pending |
| CLIN-01 – CLIN-15 | Phase 3 | Pending |
| RVWS-01 – RVWS-07 | Phase 4 | Pending |
| LEAD-01 – LEAD-09 | Phase 4 | Pending |
| BLOG-01 – BLOG-08 | Phase 5 | Pending |
| BILL-01 – BILL-07 | Phase 5 | Pending |
| SEO-01 – SEO-09 | Phase 5 | Pending |
| PORT-01 – PORT-15 | Phase 6 | Pending |
| DATA-01 – DATA-10 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 100 total
- Mapped to phases: 100
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
