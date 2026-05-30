# Roadmap: TMSList Admin Panel Completeness & Portal v2.0

**Total phases:** 18 (original 7 + 5 new bug fix/bugfix phases + 6 new completeness phases)
**Total requirements:** ~200 (original 100 + ~100 new)
**All requirements mapped:** In Progress

## Phase Summary

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Auth & Security Hardening | Complete | 4/4 |
| 2 | Admin Dashboard & Analytics | Complete | 4/4 |
| 3 | Admin Clinic Management | Complete | 4/4 |
| 4 | Admin Reviews & Leads | In Progress | - |
| 5 | Admin Blog, Billing & SEO | Pending | - |
| 6 | Clinic Portal Core Experience | Pending | - |
| 7 | Clinic Portal Advanced Features | Pending | - |
| 8 | Admin Critical Bug Fixes | Pending | 2 |
| 9 | Admin User Management & RBAC | Pending | 2 |
| 10 | Admin Panel Completeness | Pending | 2 |
| 11 | Admin Data Layer Buildout | Pending | 2 |
| 12 | Portal Completeness | Pending | 1 |

---

## Phase 8: Admin Critical Bug Fixes

**Goal:** Fix 16 critical bugs blocking basic operations across the admin panel.

**Requirements:** BUG-01 through BUG-16

**Success Criteria:**

1. Enquiries page renders without duplicate Layout block
2. Reviews component has useMemo import
3. Settings allowlist accepts tracking_enabled
4. Email templates component sends bodyHtml, API stores bodyHtml
5. Blog scheduler POST endpoint exists and generates markdown files
6. Content calendar has PATCH endpoint for updating events
7. Users component receives currentUserEmail prop correctly
8. Data quality page imports AdminSidebar correctly
9. Report builder metric IDs match API
10. SEO auditor persists to database (not in-memory)
11. Newsletter errors are logged (not empty catch)
12. Blog view links work without trailing slash 404s
13. Backup manager POST accepts body
14. Backup manager restore endpoint exists
15. Dashboard verified->approved column fix
16. Email stats colspan HTML syntax corrected

**Key Files:**
- `src/pages/admin/enquiries.astro`
- `src/components/react/AdminReviews.tsx`
- `src/pages/api/admin/settings.ts`
- `src/pages/api/admin/email-templates.ts`
- `src/pages/api/admin/blog-scheduler.ts`
- `src/pages/api/admin/content-calendar.ts`

---

## Phase 9: Admin User Management & RBAC

**Goal:** Build comprehensive user management with role-based access control.

**Requirements:** USER-01, USER-02, USER-03, USER-04, USER-05, USER-06, USER-07, USER-08, RBAC-01, RBAC-02, RBAC-03

**Success Criteria:**

1. Admin can invite users via email with generated invite token
2. Invited users can accept invitation and set their password
3. Admin can view all active sessions
4. Admin can force-logout any session (individual or all)
5. Admin can send invite via modal with email, name, role selection
6. Sessions page shows active sessions with logout buttons
7. Permission guards hide/disable UI elements based on user permissions
8. Invite acceptance page creates account and redirects to login
9. Permission middleware enforces role-based access on all admin APIs
10. Roles page allows CRUD for roles with permission assignment
11. Permissions page allows CRUD for individual permissions

**Key Files:**
- `src/pages/api/admin/users/invite.ts`
- `src/pages/api/admin/users/accept-invite.ts`
- `src/pages/api/admin/sessions.ts`
- `src/middleware/auth.ts`
- `src/components/react/AdminInviteModal.tsx`
- `src/components/react/AdminSessions.tsx`
- `src/components/react/AdminPermissionGuard.tsx`
- `src/components/react/AdminRoles.tsx`
- `src/components/react/AdminPermissions.tsx`

---

## Phase 10: Admin Panel Completeness

**Goal:** Fix all broken admin pages and build missing UI-to-API bridges.

**Requirements:** PAGE-01 through PAGE-08, BRIDGE-01 through BRIDGE-11

**Success Criteria:**

1. Blog management page fully functional with list, create, edit, delete
2. Email stats page displays real data from email_logs table
3. Content calendar shows scheduled content with drag-to-reschedule
4. Report builder generates and exports reports with selected metrics
5. SEO auditor scans URLs and persists results to DB
6. Settings page saves all allowed keys without silent rejection
7. Tracking page shows all tracking configuration options
8. SEO page has all technical tools (sitemap, robots, redirects, 404s)
9. Subscriptions page shows all clinic subscriptions with status
10. Jobs applications page shows all applications with status management
11. Notifications page shows all notifications with read/unread toggle
12. Billing page shows invoices, payments, and outstanding balances
13. GDPR page shows data requests with approve/reject actions
14. Integrations page shows connected services with connect/disconnect
15. Questions page shows quiz questions with CRUD
16. Treatments page shows treatments with edit capabilities
17. Audit trail page shows all admin actions with filtering
18. Newsletter page fully functional with subscriber and campaign management
19. All pages properly wired to their respective APIs

**Key Files:**
- `src/components/react/AdminBlog.tsx`
- `src/components/react/AdminEmailStats.tsx`
- `src/components/react/AdminContentCalendar.tsx`
- `src/components/react/AdminReportBuilder.tsx`
- `src/components/react/AdminSEOAuditor.tsx`
- `src/components/react/AdminSettings.tsx`
- `src/components/react/AdminSubscriptions.tsx`
- `src/components/react/AdminJobsApplications.tsx`
- `src/components/react/AdminNotifications.tsx`
- `src/components/react/AdminBilling.tsx`

---

## Phase 11: Admin Data Layer Buildout

**Goal:** Build APIs and database tables for 55+ unused tables.

**Requirements:** DATA-01 through DATA-12

**Success Criteria:**

**High Priority (5 tables):**
1. clinicClaims: Full ownership verification workflow (approve/reject/takeover)
2. supportTickets: Create, assign, respond, resolve workflow
3. bulkEmailCampaigns: Schedule, track, report on email campaigns
4. apiKeys: Create, rotate, revoke for external integrations
5. forumModeration: Flag, hide, remove, restore, warn actions

**Medium Priority (7 tables):**
6. authEvents: Login history with security alerts
7. loginHistory: IP/device tracking per user
8. mediaAssets: Upload, organize, delete images
9. experiments: A/B test configuration and results
10. insurancePlans: CRUD for insurance providers
11. featureFlags: Toggle features on/off with gradual rollout
12. leadRoutingRules: Automatic lead assignment conditions

**Key Files:**
- `src/db/schema.ts` (new table definitions)
- `src/pages/api/admin/clinic-claims.ts`
- `src/pages/api/admin/support-tickets.ts`
- `src/pages/api/admin/bulk-email-campaigns.ts`
- `src/pages/api/admin/api-keys.ts`
- `src/pages/api/admin/forum-moderation.ts`
- `src/pages/api/admin/media-library.ts`
- `src/pages/api/admin/experiments.ts`
- `src/pages/api/admin/feature-flags.ts`
- `src/pages/api/admin/lead-routing.ts`

---

## Phase 12: Portal Completeness

**Goal:** Build missing portal features for clinic owners.

**Requirements:** PORT-16, PORT-17, PORT-18, PORT-19, PORT-20, PORT-21, PORT-22

**Success Criteria:**

1. Doctor/Staff Management: Add, edit, remove, reorder team members
2. Portal Jobs Page: Job listings with application management
3. Invoice History: Past invoices with PDF download
4. Notification Preferences: Email/in-app toggle per notification type
5. Photo/Gallery Management: Upload, drag-to-reorder, caption management
6. Service/Treatment Management: CRUD for treatments offered
7. Multi-location Sync: Manage clinic chain locations

**Key Files:**
- `src/components/react/PortalTeamManager.tsx`
- `src/components/react/PortalJobsDashboard.tsx`
- `src/components/react/PortalInvoiceHistory.tsx`
- `src/components/react/PortalNotificationPrefs.tsx`
- `src/components/react/PortalGallery.tsx`
- `src/components/react/PortalServices.tsx`
- `src/components/react/PortalLocations.tsx`

---

## Phase Ordering Rationale

- **Phase 8 first:** 16 critical bugs block basic operations — must fix before anything else
- **Phase 9 after Phase 8:** RBAC requires the broken pages to be fixed first so permission guards can be applied
- **Phase 10 depends on 8 and 9:** Need working APIs and RBAC before completing pages
- **Phase 11 parallel to 10:** Data layer buildout doesn't depend on UI completeness
- **Phase 12 last:** Portal features benefit from all admin infrastructure being in place

---

## Low Priority (Future Phases)

These were identified but not prioritized in this roadmap:

**Low Priority Tables:**
- badges (clinic badges/badges table)
- doctorCredentials (professional credentials)
- pushNotificationCampaigns (mobile push)
- pageContent (CMS pages)
- helpCenter (FAQ articles)
- i18n/translations (multi-language)
- incidents (system incidents)
- slaMonitor (service level agreements)
- backups (backup configurations)
- disasterRecovery (DR configurations)
- slugRedirects (SEO redirects - already partially implemented)

---

*Roadmap updated: 2026-05-31 for Admin Panel Completeness*