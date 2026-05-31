---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-05-31T07:50:00Z"
last_activity: "2026-05-31"
progress:
  total_phases: 12
  completed_phases: 9
  total_plans: 24
  completed_plans: 23
  percent: 87
---

# State

## Current Position

**Phase:** 03 (admin-clinic-management) — BACKLOG
**Last activity:** 2026-05-31

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-16)

**Core value:** Help patients find and connect with TMS clinics, and help clinic owners grow their practice through a complete practice management experience.
**Current focus:** Phase 11 — admin-data-layer-buildout

## Milestone v1.0 Progress

| Phase | Name | Requirements | Status |
|-------|------|-------------|--------|
| 1 | Auth & Security Hardening | AUTH-01–AUTH-10 | ✅ Complete (TOTP 2FA, account lockout, device tracking, magic link + password auth, bcrypt passwords, remember-me sessions, suspicious login alerts, rate limiting, session allowlist) |
| 2 | Admin Dashboard & Analytics | DASH-01–DASH-10 | ✅ Complete (real data, system health, audit log, sparklines, lead stats, trend tracking) |
| 3 | Admin Clinic Management | CLIN-01–CLIN-15 | 🔄 Partial (AdminClinics, AdminClinicEditor, UpsellModal done; full CRUD pending) |
| 4 | Admin Reviews & Leads | RVWS-01–RVWS-07, LEAD-01–LEAD-09 | 🔄 Partial (lead API, patient enquiries done; reviews management pending) |
| 5 | Admin Blog, Billing & SEO | BLOG-01–BLOG-08, BILL-01–BILL-07, SEO-01–SEO-09 | 🔄 Partial (newsletter stats API done; blog CMS, billing reports, SEO scanner pending) |
| 6 | Clinic Portal Core Experience | PORT-01–PORT-15 | ✅ Done (all 18 pages built; PortalDashboard, PortalClaimClinic, PortalHealthScore, PortalOnboardingWizard, PortalAnalytics all wired to real APIs) |
| 7 | Clinic Portal Advanced Features | DATA-01–DATA-10 | ✅ Done (team manager, invoice history, notification preferences) |
| 8 | Admin Critical Bugfixes | — | ✅ Complete (6 commits, 14 files, 10/10 must-haves) |
| 9 | Admin User Mgmt & RBAC | — | ✅ Complete (invite flow, accept-invite, sessions management, RBAC middleware + guard, permission guards wired in AdminClinics + AdminUsers) |
| 10 | Admin SEO Audit & Fixes | — | ✅ Complete (sitemap redirects, soft 404s, canonical tags, robots.txt) |
| 11 | Admin Data Layer Buildout | — | ✅ Complete (billing API, subscriptions API, AdminBilling component, newsletter stats confirmed) |
| 12 | Portal Completeness | — | ✅ Complete (portal invoices API, profile-views API wired, PortalInvoiceHistory component, AdminPermissionGuard wired to AdminClinics + AdminUsers) |

**Overall:** ~87% of committed plan tasks complete

### Remaining Gaps (non-blocking)
- Phase 3 full CRUD for clinics (partial — editor modal exists)
- Phase 4 reviews management UI (leads API + patient enquiries done)
- Phase 5 blog CMS, billing reports, SEO scanner UI
- Stripe full integration (billing/subscription data is mock until Stripe is wired)

## Accumulated Context

- **Framework:** Astro 6 with React 19 islands for interactive components
- **Database:** PostgreSQL via Drizzle ORM 0.45.2
- **Auth:** Custom session + magic link system (JWT-based, needs security hardening — AUTH-01–AUTH-10 still pending)
- **Styling:** Tailwind CSS with violet (admin) and emerald (portal) color schemes
- **Analytics:** PostHog integration
- **Deployment:** Vercel

## Code Review Findings (from Phase 00 audit)

**Critical (3):**

- CR-01: JWT_SECRET missing causes silent auth failure
- CR-02: Magic tokens stored unhashed in DB
- CR-03: Social proof API exposes data without auth

**Warnings (8):** Pervasive `as any` casts, missing CORS headers, NPI validation gaps, dead code, empty catch blocks, email plaintext password, inconsistent 401/403

**Info (12):** Various minor issues

## Known Gaps

### Provider Admin (admin panel for clinic owners)
- `/admin/providers` — **done** (built 2026-05-31: API + AdminProviders.tsx + providers.astro page + sidebar nav)
- `/admin/providers/[id]` — **done** (built 2026-05-31: [id].astro + AdminProviderDetail.tsx + AdminProviderModal.tsx)
- Hardcoded credentials (S141) — **done** (create-admin script + email utils + .env.example updated)
- Provider role in roles/permissions system — still pending (Phase 09 partial)

### Doctor Dashboard
- `/doctor/` route — **done** (20+ pages exist, full component library under src/components/react/Doctor*.tsx)
- `/api/doctor/profile` — **done** (scoped to session.clinicId, PUT works)
- `/api/doctor/reviews` — **done** (scoped to session.clinicId, POST for owner responses)
- Doctor profile editor — **done** (DoctorProfileEditor.tsx exists)

### Portal Quality Audit (Phase 06)
All17 portal pages have React islands and data fetching wired. Known issues:
- `PortalAnalytics.tsx:156` — profile views section is a placeholder
- `PortalClaimClinic.tsx` — needs verified status check against DB
- `PortalHealthScore.tsx` — needs health score calculation from real metrics
- `PortalOnboardingWizard.tsx` — may not persist step completion to DB
- Invoices page (`PortalInvoiceHistory.tsx`) — needs Stripe integration wired

## Blockers

(None)
