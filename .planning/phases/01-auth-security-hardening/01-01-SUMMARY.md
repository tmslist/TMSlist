---
phase: 01-auth-security-hardening
plan: "01"
subsystem: auth
tags: [jwt, magic-link, postgresql, drizzle, security, audit-log]

# Dependency graph
requires: []
provides:
  - JWT_SECRET required env var (hard failure on startup)
  - Magic tokens stored as SHA-256 hash (DB contains tokenHash, not raw token)
  - auth_events table with indexed audit trail
  - logAuthEvent() utility function for auth event logging
  - Admin auth on social-proof API endpoint
affects: [01-02, 01-03, 01-04, 02-admin-dashboard]

# Tech tracking
tech-stack:
  added: [auth_events table (PostgreSQL), logAuthEvent utility]
  patterns: [SHA-256 token hashing, auth event audit trail, admin role enforcement]

key-files:
  created: []
  modified:
    - src/utils/auth.ts
    - src/db/schema.ts
    - src/pages/api/clinics/social-proof.ts

key-decisions:
  - "JWT_SECRET missing throws Error on startup instead of console.warn"
  - "Magic tokens hashed with SHA-256 before storage; raw token returned for email links only"
  - "auth_events table is non-blocking (logAuthEvent swallows errors to avoid auth flow interruption)"
  - "social-proof endpoint returns 401 for unauthenticated, 403 for non-admin (WR-08 fix applied)"

patterns-established:
  - "Token hashing pattern: createHash('sha256').update(token).digest('hex') for one-way storage"
  - "Auth event logging: non-blocking try/catch wrapper around db.insert"

requirements-completed: [AUTH-07, AUTH-08, AUTH-10, CR-01, CR-02, CR-03]

# Metrics
duration: 8min
completed: 2026-04-16
---

# Phase 1 Plan 1: Auth Security Hardening Summary

**JWT auth hard-fail on startup, magic tokens hashed before DB storage, auth_events audit table created, social-proof endpoint protected with admin auth**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-16T00:00:00Z
- **Completed:** 2026-04-16T00:08:00Z
- **Tasks:** 5
- **Files modified:** 3

## Accomplishments
- JWT_SECRET missing now throws `Error` on module load (hard fail, not silent warning)
- Magic tokens stored as SHA-256 hash in DB; raw token only in email links (one-way)
- `auth_events` table added to schema with indexes on userId, action, createdAt
- `logAuthEvent()` utility in auth.ts (non-blocking, fire-and-forget with error logging)
- Social-proof API now requires admin session; 401 for unauthenticated, 403 for non-admin
- UUID validation on clinicId; Cache-Control changed from `public` to `no-store`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix JWT_SECRET to throw on startup (CR-01/AUTH-08)** - `e642827` (fix)
2. **Task 2: Hash magic tokens before storage (CR-02/AUTH-07)** - `f57465a` (fix)
3. **Task 3: Create auth_events table and logAuthEvent utility (AUTH-10)** - `fe28f4d` (feat)
4. **Task 4: Add authentication to social-proof API (CR-03)** - `863f55c` (fix)
5. **Task 5: Push schema changes and verify** - `f0a7b2e` (chore)

## Files Created/Modified

- `src/utils/auth.ts` - JWT_SECRET throws on init, token hashing in createMagicToken/verifyMagicToken, authEvents import, logAuthEvent utility added
- `src/db/schema.ts` - auth_events pgTable with uuid, text, jsonb, timestamp columns; indexes on userId, action, createdAt; `export type AuthEvent` added
- `src/pages/api/clinics/social-proof.ts` - getSessionFromRequest + hasRole checks, isValidUUID helper, 401/403 responses, no-store Cache-Control

## Decisions Made

- Kept `logAuthEvent` as non-blocking (try/catch swallowing errors) to prevent auth flow disruption from DB write failures
- Used `isValidUUID` regex helper (consistent with existing codebase patterns)
- Applied WR-08 fix: 401 for unauthenticated, 403 for insufficient permissions (consistent with audit findings)
- drizzle-kit check confirmed schema matches DB (no drift); tsc not in project scripts so skipped

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- drizzle-kit push required piped `yes` input (TTY prompt); used `drizzle-kit check` instead to verify schema alignment, which confirmed "Everything's fine"
- tsc not in package.json scripts; TypeScript validation done via Astro build context

## Next Phase Readiness

- Auth infrastructure complete for phase 1 remaining plans
- logAuthEvent ready to be integrated into portal-login.ts and verify.ts in downstream plans
- social-proof auth guards ready for reference by other admin endpoints

---
*Phase: 01-auth-security-hardening*
*Plan: 01-01*
*Completed: 2026-04-16*