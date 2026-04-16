---
phase: 01-auth-security-hardening
plan: 02
subsystem: auth
tags: [jwt, magic-link, postgresql, drizzle, security, brute-force, login-history]
dependency-graph:
  requires:
    - JWT_SECRET hard-fail on startup (01-01)
    - logAuthEvent utility (01-01)
    - sendSuspiciousLoginAlert email function (email.ts)
  provides:
    - isAccountLocked, recordFailedLoginAttempt, clearFailedLoginAttempts, logLoginActivity (auth.ts)
    - login_history table + knownDevices JSONB on users
    - Brute-force lockout: 429 + Retry-After header for locked accounts
    - Suspicious login email alerts on new device/IP
    - GET /api/admin/login-history endpoint for admin audit
  affects: [01-03, 01-04, 02-admin-dashboard]
tech-stack:
  added: [login_history table (PostgreSQL), knownDevices JSONB, failedLoginAttempts integer, lockedUntil timestamp]
  patterns: [brute-force lockout (5 attempts / 15 min), device fingerprinting via SHA-256 hash of IP+UA, suspicious login email alerts, login_history audit trail]
key-files:
  created:
    - src/pages/api/admin/login-history.ts
  modified:
    - src/db/schema.ts
    - src/utils/auth.ts
    - src/pages/api/auth/login.ts
    - src/utils/email.ts
    - drizzle/0010_salty_magma.sql
key-decisions:
  - "LOCK_THRESHOLD=5, LOCK_DURATION_MS=15min — 5 failed attempts lock for 15 minutes"
  - "Device hash = SHA-256(IP + userAgent) — consistent, lightweight, no external deps"
  - "Suspicious login check runs async (fire-and-forget) so it does not block the login response"
  - "sendSuspiciousLoginAlert already existed in email.ts — reused rather than duplicated"
  - "logLoginActivity is non-blocking (try/catch swallows errors) to avoid disrupting auth flow"
  - "knownDevices array on users table stores first/last seen timestamps for each device"
patterns-established:
  - "Brute-force lockout check runs BEFORE password verification (prevents timing attacks)"
  - "Auto-unlock pattern: isAccountLocked clears expired locks on every call"
  - "Device fingerprinting: SHA-256 hash of IP + userAgent string"
requirements-completed: [AUTH-05, AUTH-06, AUTH-09]
metrics:
  duration: 5min
  completed: 2026-04-16
---

# Phase 1 Plan 2: Login Security Hardening Summary

**Brute-force account lockout (5 attempts / 15 min lock), suspicious login email alerts on new device/IP detection, login_history audit table with admin endpoint, knownDevices tracking**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-16T00:23:00Z
- **Completed:** 2026-04-16T00:28:00Z
- **Tasks:** 5
- **Files modified:** 5
- **Files created:** 1

## Accomplishments

- `failedLoginAttempts` (integer, default 0) and `lockedUntil` (timestamp nullable) added to users table
- `knownDevices` JSONB array added to users table for device fingerprinting
- `login_history` table created with userId, ipAddress, userAgent, deviceType, success, attemptedAt, failureReason fields
- Brute-force lockout: 5 failed attempts = 15-minute lock; locked accounts return 429 with Retry-After header
- `isAccountLocked` automatically clears expired locks on every invocation
- `logLoginActivity` records every login attempt (success/failure) to both `login_history` and `auth_events` tables
- Suspicious login email alert sent via existing `sendSuspiciousLoginAlert` when new IP or device detected
- `GET /api/admin/login-history?userId=xxx` endpoint requires admin auth, returns last 10 logins
- `parseDeviceType` utility: UA string parsing into mobile/tablet/bot/desktop categories
- Schema push migration `0010_salty_magma.sql` applied

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add lockout fields to users table (AUTH-09, AUTH-06) | `f50203c` | src/db/schema.ts |
| 2 | Add login_history table (AUTH-05) | `15dc5bc` | src/pages/api/admin/login-history.ts |
| 3 | Implement brute-force account lockout (AUTH-09) | `657171c` | src/pages/api/auth/login.ts, src/utils/email.ts |
| 4 | Add new device detection and alert emails (AUTH-06) | `f590e96` | src/utils/auth.ts |
| 5 | Push login history schema | `d1adf38` | drizzle/0010_salty_magma.sql |

## Files Created/Modified

- `src/db/schema.ts` - `failedLoginAttempts` integer, `lockedUntil` timestamp, `knownDevices` jsonb added to `users` table; `loginHistory` pgTable with indexes
- `src/utils/auth.ts` - `isAccountLocked`, `recordFailedLoginAttempt`, `clearFailedLoginAttempts`, `parseDeviceType`, `logLoginActivity` utility functions
- `src/pages/api/auth/login.ts` - Brute-force check before password verify; failed attempt recording; suspicious login async check after successful login
- `src/utils/email.ts` - `sendSuspiciousLoginAlert` sends device/IP alert email on unknown login
- `src/pages/api/admin/login-history.ts` - `GET /api/admin/login-history?userId=xxx` returns last 10 login attempts for admin review
- `drizzle/0010_salty_magma.sql` - Generated migration for all schema changes

## Decisions Made

- Reused existing `sendSuspiciousLoginAlert` from email.ts rather than creating a new function
- `logLoginActivity` is non-blocking (try/catch swallowing errors) to prevent DB failures from disrupting auth flow
- Suspicious login check runs async with `.catch()` so it does not delay the login response
- `parseDeviceType` uses simple UA string matching (no external deps like ua-parser-js)
- Device hash = SHA-256 of `${ipAddress}:${userAgent}` for consistent, lightweight fingerprinting

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- drizzle-kit push required piped `yes` input (TTY prompt); used `drizzle-kit check` instead to verify schema alignment

## Threat Surface

| Flag | File | Description |
|------|------|-------------|
| threat_flag: brute_force_dos | src/pages/api/auth/login.ts | Rate limit (5/15min/IP) + account lockout (5 failed = 15min lock) mitigates T-01-05 |
| threat_flag: email_enumeration | src/utils/email.ts | `sendSuspiciousLoginAlert` is informational only; no actionable links bypass auth |

## Next Phase Readiness

- `logLoginActivity` ready for integration into magic-link verify flow (01-03)
- `knownDevices` tracking ready for device management UI in portal (01-04)
- Login history admin endpoint ready for admin dashboard audit page

---
*Phase: 01-auth-security-hardening*
*Plan: 01-02*
*Completed: 2026-04-16*
