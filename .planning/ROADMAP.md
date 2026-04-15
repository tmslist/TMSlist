# Roadmap: TMSList Clinic & Admin Portal v1.0

**Total phases:** 7
**Total requirements:** 100
**All requirements mapped:** ✓

## Phase Summary

| Phase | Name | Requirements | Success Criteria |
|-------|------|-------------|-------------------|
| 1 | Auth & Security Hardening | AUTH-01–10 (10) | 10 |
| 2 | Admin Dashboard & Analytics | DASH-01–10 (10) | 10 |
| 3 | Admin Clinic Management | CLIN-01–15 (15) | 10 |
| 4 | Admin Reviews & Leads | RVWS-01–07, LEAD-01–09 (16) | 10 |
| 5 | Admin Blog, Billing & SEO | BLOG-01–08, BILL-01–07, SEO-01–09 (24) | 10 |
| 6 | Clinic Portal Core Experience | PORT-01–15 (15) | 10 |
| 7 | Clinic Portal Advanced Features | DATA-01–10 (10) | 10 |

---

## Phase 1: Auth & Security Hardening

**Goal:** Fix all critical security issues and add enterprise-grade auth controls.

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10

**Success Criteria:**

1. Admin can enable TOTP 2FA from account settings and must enter 6-digit code on login
2. Admin can register a passkey and use it to log in (biometric/hardware key)
3. Admin users have granular permission flags — `can_edit`, `can_delete`, `can_export` — enforced on all admin actions
4. Admin can configure session length; "remember me" creates 30-day session
5. Admin sees last 10 logins (IP, device, timestamp) in account settings
6. Admin receives email alert when new IP/device login detected
7. Magic tokens are hashed (SHA-256) before storage — raw token only sent to email
8. App throws error on startup if JWT_SECRET not configured (not warning)
9. Account locks for 15 minutes after 5 failed attempts; unlock email available
10. Audit log table captures all auth events with timestamp, actor, action, IP

**Key Files:**
- `src/utils/auth.ts`
- `src/pages/api/auth/*.ts`
- `src/db/schema.ts` (users, sessions, audit_log tables)

---

## Phase 2: Admin Dashboard & Analytics

**Goal:** Transform admin dashboard from static stats to an actionable command center.

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10

**Success Criteria:**

1. Each metric card shows MoM % change (green up arrow or red down arrow)
2. Pie chart renders clinic distribution across 4 health score buckets
3. Bar chart shows leads by UTM source with breakdown table
4. Funnel chart shows drop-off rates: visits → leads → conversions per clinic
5. Revenue widget shows MRR estimate with projected growth line
6. Leads table shows spam score badge; spam leads grayed out by default
7. Sidebar/header shows live feed of admin actions (new clinic added, lead assigned, etc.)
8. Admin can drag cards to reorder; removed cards accessible from "Add widget" menu
9. Admin configures digest frequency (daily/weekly) and email in settings; receives email on schedule
10. "Export PDF" button generates report with all metrics, charts, and date range

**Key Files:**
- `src/components/react/AdminAnalytics.tsx`
- `src/pages/api/admin/analytics.ts`
- `src/components/react/AdminDashboard.tsx` (new or existing)

---

## Phase 3: Admin Clinic Management

**Goal:** Give admins powerful bulk and workflow tools for managing the clinic directory at scale.

**Requirements:** CLIN-01, CLIN-02, CLIN-03, CLIN-04, CLIN-05, CLIN-06, CLIN-07, CLIN-08, CLIN-09, CLIN-10, CLIN-11, CLIN-12, CLIN-13, CLIN-14, CLIN-15

**Success Criteria:**

1. Clinic row in admin table has "View live" icon that opens clinic page in new tab
2. Admin can check 2-3 clinics, click "Compare" to see side-by-side stats table
3. CSV import wizard: upload CSV → field mapping UI → preview → confirm → import with progress bar
4. Duplicate merge UI: select two clinics → side-by-side field diff → checkboxes to pick source → merge
5. NPI-valid clinics auto-marked verified; NPI-invalid clinics appear in "Needs Review" queue
6. Takeover request form: requester enters their NPI, admin approves/rejects, ownership transfers
7. Featured toggle with date picker for start/end; featured status auto-expires on end date
8. Badge assignment UI: check clinics → select badge(s) → apply; badge shown on clinic card
9. Clinic editor shows embedded mini-map; dragging pin updates lat/lng fields
10. Address field shows Google Places autocomplete dropdown, auto-fills all address components
11. Insurance field shows autocomplete dropdown with common insurance providers
12. Tag manager: select multiple clinics → bulk add/remove tags
13. Delete action shows modal with "Redirect to:" field (clinic selector) for slug preservation
14. Reject/Pause actions require selecting reason from dropdown + optional note
15. "Clone" button on clinic editor creates copy with "(Copy)" appended to name; opens editor for new clinic

**Key Files:**
- `src/components/react/AdminClinics.tsx`
- `src/components/react/AdminClinicEditor.tsx`
- `src/pages/api/admin/clinics.ts`
- `src/pages/api/admin/bulk.ts`

---

## Phase 4: Admin Reviews & Leads

**Goal:** Comprehensive review moderation and lead pipeline management.

**Requirements:** RVWS-01, RVWS-02, RVWS-03, RVWS-04, RVWS-05, RVWS-06, RVWS-07, LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06, LEAD-07, LEAD-08, LEAD-09

**Success Criteria:**

1. Review list shows sentiment badge (positive/neutral/negative) auto-assigned by keyword analysis
2. Reviews older than 7 days without owner response show orange "Response overdue" badge
3. Admin can flag a review with violation type (spam, off-topic, harassment); flagged reviews require senior review
4. Admin can edit owner response text before it publishes; history preserved
5. Review detail view shows rating trend chart and top keywords extracted from text
6. When owner publishes response, reviewer receives email notification with response text
7. CSV upload for bulk review import with field mapping (source, rating, title, body, date)
8. Leads show auto-calculated score badge (1-10) based on field completeness
9. Admin can reassign lead to different clinic via dropdown in lead detail view
10. Leads support internal notes (hidden from patient) and custom tags
11. Admin can create email templates per lead type; template uses placeholders like {{name}}, {{clinic}}
12. Notification settings per admin: toggle email/in-app for new leads, new reviews, etc.
13. Duplicate detection: leads with same email/phone within 30 days linked with "duplicate of" indicator
14. Export leads to CSV with all fields; filters applied (date range, type, clinic, status)
15. Kanban board with 5 columns: New → Contacted → Qualified → Booked → Lost; drag to update status
16. `/api/clinics/social-proof` requires admin authentication; rate-limited to 60 req/min

**Key Files:**
- `src/components/react/AdminReviews.tsx`
- `src/components/react/AdminLeads.tsx`
- `src/pages/api/admin/leads.ts`
- `src/pages/api/clinics/social-proof.ts`

---

## Phase 5: Admin Blog, Billing & SEO

**Goal:** Complete content management, billing, and technical SEO infrastructure.

**Requirements:** BLOG-01–08, BILL-01–07, SEO-01–09

**Success Criteria:**

1. Blog editor has "Schedule" button; date/time picker sets future `publishedAt`
2. Split-pane editor: left = markdown/rich text, right = live rendered preview
3. Blog post detail shows pageviews, avg time on page, bounce rate from analytics
4. Author field in blog editor; author bio renders below post content
5. "Related posts" section auto-populates with 3 posts sharing same tags/category
6. "History" tab on blog editor lists all saved versions; admin can restore any version
7. "Check links" button scans all blog posts, reports broken links with URL and status code
8. Category taxonomy: categories have parent/child hierarchy; tags are flat; both assignable in editor
9. Invoice creation form generates PDF; "Send invoice" emails PDF to clinic owner
10. Billing table shows payment status per clinic with overdue highlighted in red
11. Pricing tiers CRUD: create/edit/archive tiers with name, price, features list
12. Coupon codes: generate code, set discount (% or $), expiry date, usage limit
13. Revenue chart shows breakdown by pricing tier with total
14. Refund form: select clinic → enter amount → confirm; refund logged in audit trail
15. Billing settings: configure 30/7/1 day reminder emails; test reminder button
16. Schema validator: admin enters URL → fetches page → checks JSON-LD validity → reports errors
17. Sitemap view: table of all URLs, checkboxes to include/exclude, "Submit to Google" button
18. Robots.txt editor: textarea with syntax highlighting, "Preview" renders how bots see it
19. 404 log table: URL, count, last hit, referrer; admin can create redirect from this view
20. Core Web Vitals section: LCP, FID, CLS scores with thresholds (good/needs improvement/poor)
21. Redirect manager: CRUD for 301/302 redirects; bulk import from CSV
22. Canonical checker: batch-check URLs, flag duplicates and missing canonical tags
23. Image report: list all images with size, dimensions, and "oversized" warning if >500KB
24. Hreflang checker: scan pages for hreflang tags, report missing or mismatched language codes

**Key Files:**
- `src/components/react/AdminBlog.tsx`
- `src/components/react/AdminBlogEditor.tsx`
- `src/components/react/AdminRevenue.tsx`
- `src/components/react/AdminSEO.tsx`
- `src/components/react/AdminAdvertising.tsx`
- `src/pages/api/admin/blog*.ts`
- `src/pages/api/admin/campaigns.ts`
- `src/utils/stripe.ts`

---

## Phase 6: Clinic Portal Core Experience

**Goal:** Transform clinic portal from a passive profile viewer into an active practice management tool.

**Requirements:** PORT-01–15

**Success Criteria:**

1. Clinic owner can type and submit a reply to any review; reply shows on public listing
2. Profile editor shows contextual tips: specific empty fields highlighted with tip text
3. Notifications panel shows new leads/reviews/inquiries instantly via WebSocket
4. Portal is fully usable on mobile (320px+) — all tables scroll, forms stack vertically
5. Job listings table has checkboxes for bulk select; "Archive" and "Delete" appear in action bar
6. New job application triggers email to clinic owner with applicant summary
7. Application status dropdown: Reviewing → Interview → Offer → Hired; status updates logged
8. "Competitors" section in portal sidebar; owner can search and save rival clinic listings
9. "Visibility" toggle in portal settings: "Listed publicly" / "Hidden" with confirmation
10. Photo section has drag-and-drop upload zone; images upload to cloud storage (Vercel Blob or S3)
11. "Results Gallery" section: before/after photo pairs with caption; max 10 pairs
12. "Team" tab in clinic editor: add doctor/staff cards with name, credentials, photo, bio
13. New owner onboarding: 6-step checklist (add photos, set hours, reply to reviews, etc.)
14. Portal sidebar has "Help" section with searchable FAQ articles
15. Admin can create announcement banner shown at top of all portal pages with dismiss option

**Key Files:**
- `src/components/react/PortalReviews.tsx`
- `src/components/react/PortalClinicEditor.tsx`
- `src/components/react/PortalDashboard.tsx`
- `src/components/react/PortalJobsDashboard.tsx`
- `src/components/react/PortalHealthScore.tsx`
- `src/components/react/PortalSidebar.tsx`
- `src/pages/api/portal/reviews.ts`
- `src/pages/api/portal/clinic.ts`
- `src/pages/api/upload.ts`

---

## Phase 7: Clinic Portal Advanced Features

**Goal:** Give clinic owners data-driven insights and growth tools.

**Requirements:** DATA-01–10

**Success Criteria:**

1. "Analytics" page in portal shows: pageviews, unique visitors, leads received, over time (30/60/90 days)
2. Leads chart shows breakdown by source: organic search, direct, referral, social
3. "Compare" section shows own clinic vs top 3 competitors: rating, review count, completeness score
4. Rating trend chart: monthly average rating over last 12 months
5. "Listing Score" widget (0-100): calculated from completeness, recency, photo count, response rate; clicking shows improvement tips
6. GBP sync: clinic owner enters Google Business Profile URL; system pulls in ratings, reviews, photos
7. QR code generator: generates PNG QR code linking to clinic listing; download button
8. "Embed" section: copy-paste HTML snippet for "Book Now" button, "Find Us" widget
9. Referral dashboard: unique referral URL per clinic; shows signups attributed to referral; payout info
10. Integration hub: grid of integration tiles (Zapier, Google Calendar, Mailchimp) with "Connect" buttons; v1 shows connected/disconnected state only

**Key Files:**
- `src/components/react/PortalAnalytics.tsx`
- `src/components/react/PortalDashboard.tsx`
- `src/components/react/PortalHealthScore.tsx`
- `src/pages/api/portal/analytics.ts`
- `src/pages/api/portal/referral.ts`
- `src/pages/api/portal/integrations.ts`

---

## Phase Ordering Rationale

- **Phase 1 first:** Security fixes (CR-01, CR-02, CR-03) are blockers — can't build on an insecure foundation
- **Phase 2 next:** Better analytics make everything else measurable; admins can track impact
- **Phase 3 follows:** Core clinic management; bulk tools unlock efficiency gains
- **Phase 4 parallel:** Reviews and leads are data-heavy; pipeline view depends on Phase 2 chart components
- **Phase 5 builds:** Blog, billing, SEO are more specialized; depend on Phase 2 and 3 patterns
- **Phase 6 and 7 last:** Clinic-facing features benefit from everything built before; dependencies on Phases 3-5

---
*Roadmap created: 2026-04-16*
