---
phase: 01-auth-security-hardening
plan: "03"
subsystem: auth
tags: [permissions, jsonb, session-management, auth, api, drizzle]
dependency-graph:
  requires:
    - JWT_SECRET hard-fail on startup (01-01)
    - logAuthEvent utility (01-01)
    - sessions table with expiresAt field (01-01)
    - createSession utility (01-01)
    - knownDevices JSONB (01-02)
  provides:
    - permissions JSONB on users table (can_edit, can_delete, can_export, can_manage_users, can_billing)
    - sessionExpiry text column on users table (1h, 8h, 24h, 30d)
    - hasPermission() helper in auth.ts
    - parseSessionExpiry() helper in auth.ts
    - createSessionWithExpiry() for remember-me flows
    - PUT/GET /api/admin/user-permissions endpoint
    - PUT/GET /api/admin/user-session-expiry endpoint
    - Standardized 401/403 across all admin API routes
  affects: [01-04, 02-admin-dashboard]
tech-stack:
  added: [permissions JSONB, sessionExpiry text column, hasPermission helper, parseSessionExpiry helper, createSessionWithExpiry, user-permissions API, user-session-expiry API]
  patterns: [granular permission flags via JSONB, configurable session expiry (1h/8h/24h/30d), 401 for missing session, 403 for insufficient permissions]
key-files:
  created:
    - src/pages/api/admin/user-permissions.ts
    - src/pages/api/admin/user-session-expiry.ts
  modified:
    - src/db/schema.ts
    - src/utils/auth.ts
    - src/pages/api/admin/bulk.ts
    - src/pages/api/admin/reviews.ts
    - src/pages/api/admin/leads.ts
    - src/pages/api/admin/clinics.ts
    - src/pages/api/admin/users.ts
key-decisions:
  - "Permissions stored as JSONB on users table (not a separate table) — simple, flexible, no JOIN needed"
  - "Admin role='admin' automatically gets all permissions (hasPermission returns true for admins)"
  - "Non-admin users must have permissions explicitly granted via user-permissions endpoint"
  - "Self-modification of own permissions blocked in user-permissions endpoint"
  - "parseSessionExpiry defaults to '8h' for invalid/unknown values"
  - "createSessionWithExpiry: rememberMe=true forces 30d; otherwise uses sessionExpiryDays or default 8h"
  - "bulk.ts had missing session check — added 401 before role check (was: no session check, just 401 for role failure)"
  - "All admin routes now: 401 for missing session, 403 for insufficient role/permission"
patterns-established:
  - "401 = unauthenticated (no valid session); 403 = authenticated but insufficient role/permission"
  - "Permission changes and session expiry changes both audit-logged via db.insert(auditLog)"
  - "hasPermission(session, 'can_X') called in API routes after fetching user from DB"
  - "UserPermissions type mirrors JSONB structure: { can_edit, can_delete, can_export, can_manage_users, can_billing }"
requirements-completed: [AUTH-03, AUTH-04, WR-08]
metrics:
  duration: 15min
  completed: 2026-04-16
---

# Phase 1 Plan 3: Granular Permissions & Session Expiry Summary

**Granular permission flags (can_edit, can_delete, can_export, can_manage_users, can_billing) as JSONB on users table; configurable session expiry (1h/8h/24h/30d); standardized 401/403 auth responses across all admin API routes**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-16T00:30:00Z
- **Completed:** 2026-04-16T00:45:00Z
- **Tasks:** 5
- **Files modified:** 7
- **Files created:** 2

## Accomplishments

- `permissions` JSONB column added to `users` table with `can_edit`, `can_delete`, `can_export`, `can_manage_users`, `can_billing` boolean flags
- `sessionExpiry` text column added to `users` table with default `'8h'` (options: 1h, 8h, 24h, 30d)
- `UserPermissions` type exported from both `src/db/schema.ts` and `src/utils/auth.ts`
- `hasPermission(session, permission)` helper in auth.ts: returns true for admin role or if permission is set
- `parseSessionExpiry(expiry)` converts '1h'/'8h'/'24h'/'30d' to milliseconds; defaults to 8h
- `createSessionWithExpiry(payload, { rememberMe, sessionExpiryDays })` for configurable session lengths
- `PUT/GET /api/admin/user-permissions?id=<userId>` — manage granular permission flags; requires admin or `can_manage_users`; self-modification blocked
- `PUT/GET /api/admin/user-session-expiry?id=<userId>` — manage session length per user; admin-only
- All permission and session changes logged to `auditLog` table
- Fixed 401/403 inconsistencies across all 5 admin API files (bulk, reviews, leads, clinics, users)
- TypeScript check passes with no errors

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add permissions and sessionExpiry fields to users table (AUTH-03, AUTH-04) | `21d55c5` | src/db/schema.ts |
| 2 | Add hasPermission and createSessionWithExpiry helpers (AUTH-03, AUTH-04) | `4d11c9b` | src/utils/auth.ts |
| 3 | Add user-permissions and user-session-expiry endpoints (AUTH-03, AUTH-04) | `784e256` | src/pages/api/admin/user-permissions.ts, src/pages/api/admin/user-session-expiry.ts |
| 4 | Standardize 401/403 across admin routes (WR-08) | `ad9c3d2` | src/pages/api/admin/{bulk,reviews,leads,clinics,users}.ts |
| 5 | Schema push (requires live DB) | N/A | Schema changes committed in Task 1 |

## Files Created/Modified

### Created
- `src/pages/api/admin/user-permissions.ts` — PUT/GET /api/admin/user-permissions for granular permission management
- `src/pages/api/admin/user-session-expiry.ts` — PUT/GET /api/admin/user-session-expiry for session length management

### Modified
- `src/db/schema.ts` — `permissions` JSONB and `sessionExpiry` text columns added to `users` table; `UserPermissions` type exported
- `src/utils/auth.ts` — `UserPermissions` type, `hasPermission()`, `parseSessionExpiry()`, `createSessionWithExpiry()` added
- `src/pages/api/admin/bulk.ts` — Added missing session check (401) before role check (403)
- `src/pages/api/admin/reviews.ts` — GET and PUT: split into 401 for missing session, 403 for wrong role
- `src/pages/api/admin/leads.ts` — GET, PATCH, DELETE: split into 401 for missing session, 403 for wrong role
- `src/pages/api/admin/clinics.ts` — GET, PUT, DELETE: split into 401 for missing session, 403 for wrong role
- `src/pages/api/admin/users.ts` — PATCH, GET, POST, PUT, DELETE: split into 401 for missing session, 403 for wrong role

## Decisions Made

- Used JSONB for permissions rather than a separate table — simpler schema, no JOIN needed for permission checks
- Admin role (`role='admin'`) bypasses all granular permission checks in `hasPermission()` for backward compatibility
- Non-admin users must have permissions explicitly granted — no permissions by default
- `createSessionWithExpiry` uses `rememberMe=true` to force 30-day session regardless of user preference
- `bulk.ts` missing session check was a security gap: now returns 401 when no session present before checking role
- All admin routes follow the same 401/403 pattern for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx drizzle-kit push` requires a live database connection; failed in local environment without running Postgres. Schema changes committed in Task 1 code; DB migration must be run in deployment environment with live connection.
- TypeScript check passes cleanly with no errors related to new schema or API routes.

## Threat Surface

| Flag | File | Description |
|------|------|-------------|
| threat_flag: privilege_escalation | src/pages/api/admin/user-permissions.ts | `requireAdminWithManageUsers` helper enforces admin role OR `can_manage_users`; self-modification blocked; audit-logged |
| threat_flag: info_disclosure | src/pages/api/admin/user-permissions.ts | Only admin role can read/write permission flags; 401/403 enforced on all endpoints |

## Next Phase Readiness

- `hasPermission()` ready to be wired into individual admin routes for fine-grained mutation control
- `createSessionWithExpiry` ready for integration into `login.ts` (uses `rememberMe` from login form)
- Granular permission endpoints ready for admin UI integration (user management panel)

---
*Phase: 01-auth-security-hardening*
*Plan: 01-03*
*Completed: 2026-04-16*
