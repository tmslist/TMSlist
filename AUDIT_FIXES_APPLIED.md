# Audit Fixes Applied — 2026-04-26

89 findings audited (`AUDIT_REPORT.md`); all critical and high-severity items below were patched.
Build verifies clean (`npm run build` → 39s, 0 errors).

## Auth & OAuth
| # | What | Files |
|---|---|---|
| 1 | Google OAuth state changed from literal `"admin"`/`"portal"` to a random 32-byte nonce stored in an HttpOnly cookie and verified constant-time on callback | `src/pages/api/auth/google/index.ts`, `src/pages/api/auth/google/callback.ts` |
| 2 | `dev-login.ts` guard switched from compile-time `import.meta.env.DEV` to runtime `process.env.NODE_ENV` check | `src/pages/api/auth/dev-login.ts` |
| 3 | 2FA bypass closed: `login.ts` no longer leaks `userId`; instead issues a 5-min HttpOnly `tms_mfa_pending` cookie. `2fa/verify.ts` now derives userId only from server-issued cookies (login flow or active session), never from the request body | `src/pages/api/auth/login.ts`, `src/pages/api/auth/2fa/verify.ts`, `src/utils/auth.ts` (new `createPendingMfaCookie` / `verifyPendingMfaCookie`) |
| 4 | 2FA lockout counter rewired to use `failedLoginAttempts` column (was always 1-2, never hit threshold) | `src/pages/api/auth/2fa/verify.ts`, `src/pages/api/auth/2fa/disable.ts` |
| 5 | Open redirect on logout `?redirect=` and magic-link verify `?state=` blocked via shared `isSafeRedirectPath` helper | `src/pages/api/auth/logout.ts`, `src/pages/api/auth/verify.ts`, `src/utils/auth.ts` |
| 6 | `2fa/disable.ts` rate-limited (10/5min) + lockout window honored | `src/pages/api/auth/2fa/disable.ts` |
| 7 | `npi-lookup.ts` rate-limited (20/min) — was an open relay to NPPES | `src/pages/api/auth/npi-lookup.ts` |
| 8 | Passkey catch block re-reading already-consumed body fixed (lockout now actually fires on auth failure) | `src/pages/api/auth/passkey/authenticate.ts` |

## Admin panel
| # | What | Files |
|---|---|---|
| 9 | `api/admin/generate.ts` — was an unauthenticated body-echo endpoint. Now requires admin role; returns 501 | `src/pages/api/admin/generate.ts` |
| 10 | `api/admin/compliance.ts:135` — `await request.json` without `()` (PUT was always falling through to 400). Fixed | `src/pages/api/admin/compliance.ts` |
| 11 | `api/admin/gdpr.ts` POST — added missing `hasRole(session, 'admin')` check | `src/pages/api/admin/gdpr.ts` |
| 12 | `api/admin/impersonate.ts` — open redirect blocked, admin-on-admin impersonation refused, 1-hour cookie expiry, `isImpersonation: true` embedded in JWT, audit-log column corrected (`details` not `metadata`) | `src/pages/api/admin/impersonate.ts`, `src/utils/auth.ts` (new `createImpersonationCookie`) |
| 13 | `api/admin/analytics.ts` — `?days` clamped to 1–365 | `src/pages/api/admin/analytics.ts` |
| 14 | `api/admin/media.ts` — MIME allowlist + 25 MB size cap on uploads | `src/pages/api/admin/media.ts` |
| 15 | `api/admin/bulk.ts` — destructive deletes (clinics, reviews, leads) wrapped in transactions with audit log | `src/pages/api/admin/bulk.ts` |
| 16 | `api/admin/blog-generate-all.ts` — slug regex + resolved-path check prevents `../` escape from `BLOG_DIR` | `src/pages/api/admin/blog-generate-all.ts` |
| 17 | `api/admin/settings.ts` PUT — keys allowlisted; rejects unknown ones; 401 vs 403 corrected | `src/pages/api/admin/settings.ts` |

## Other APIs
| # | What | Files |
|---|---|---|
| 18 | `api/referral/track.ts` — added rate limit, UUID/format validation, clinic-existence check (was wide-open lead injection) | `src/pages/api/referral/track.ts` |
| 19 | `api/reviews/verify-email.ts` — added auth/ownership check, rate limit, normalized email (was: anyone could overwrite any pending review's userEmail) | `src/pages/api/reviews/verify-email.ts` |
| 20 | `api/reviews/index.ts` — removed auto-approve loophole (was: any logged-in user could auto-publish 1-stars on competitors). All public reviews now go to moderation | `src/pages/api/reviews/index.ts` |
| 21 | All 7 cron endpoints — `requireCronAuth` helper created; closes both fail-open patterns (`if (cronSecret && ...)` and `Bearer ${... \|\| undefined}`) | `src/utils/cronAuth.ts`, `src/pages/api/cron/{cleanup,publish-scheduled,stale-check,weekly-digest,monthly-partner-email,send-welcome,email-campaigns}.ts` |
| 22 | `api/clinics/[id]/claim.ts` — deleted (dead duplicate of `api/clinics/claim.ts`, called from nowhere, no email actually sent) | (deleted) |
| 23 | `api/places/autocomplete.ts` — `AbortSignal.timeout` → `AbortSignal.timeout(8000)` (was passing the unbound method, no actual timeout); added rate limit (60/min) | `src/pages/api/places/autocomplete.ts` |
| 24 | `api/analytics/stats.ts` — IDOR fixed: clinic_owner can only request own clinic's stats; admin can target any | `src/pages/api/analytics/stats.ts` |
| 25 | `api/webhooks/razorpay.ts` — signature compare now length-checks before `timingSafeEqual` (was throwing); idempotency key uses sha256 of full body (was 200-byte slice → collisions); user-supplied `notes.clinicId` validated as UUID + existence-checked before persisting | `src/pages/api/webhooks/razorpay.ts` |

## Lead magnet flow
| # | What | Files |
|---|---|---|
| 26 | `nurtureFunnel.ts fromMap` switched from `*@tmslist.com` (unverified) to `*@mail.tmslist.com` (verified Resend domain) — drips/welcomes/lead-magnet emails were silently 403'ing | `src/utils/nurtureFunnel.ts` |
| 27 | `LeadMagnetModal.astro` mounted in `Layout.astro` — was unimported anywhere, the `open-lead-magnet` event had no listener | `src/layouts/Layout.astro` |
| 28 | `api/leads/appointment.ts` — removed client-controlled `clinicEmail` (open relay); clinic email resolved server-side from clinics table | `src/pages/api/leads/appointment.ts` |
| 29 | `api/leads/index.ts` — honeypot (`website` hidden field) silently drops bot submissions | `src/pages/api/leads/index.ts` |

## Round 2 — previously deferred items, now applied

| # | What | Files |
|---|---|---|
| 30 | **Async `validateSessionStrict(request)`** added — JWT verify + sessions allowlist lookup. Returns null when the row has been deleted by logout/`invalidateAllUserSessions`, so revocation actually takes effect within the JWT's 7-day TTL. Impersonation cookies bypass the table check by design. | `src/utils/auth.ts` |
| 31 | **Middleware-level admin gate** — every `/api/admin/*` request must pass `validateSessionStrict` + role check before any handler runs. Impersonation cookies are refused on non-GET admin requests. Avoids the per-endpoint enforcement gap that audit C4 / M1 (admin) called out. | `src/middleware.ts` |
| 32 | **All session issuers converted from `createSessionCookie` to `createSession`**, so every authenticated cookie now has a row in the `sessions` table and is revocable. | `src/pages/api/auth/patient-login.ts`, `src/pages/api/auth/google/patient-callback.ts`, `src/pages/api/auth/google-dir/callback.ts`, `src/pages/api/auth/dev-login.ts`, `src/pages/api/auth/google/callback.ts`, `src/pages/api/patient/register.ts` |
| 33 | **Rate limiter fails closed in production** — `strictRateLimit` returns HTTP 503 if Upstash env vars are missing in `NODE_ENV=production` (set `ALLOW_INMEMORY_RATELIMIT=true` to opt out). Closes the cold-start bypass where each new serverless instance reset the counter. | `src/utils/rateLimit.ts` |
| 34 | **TOTP secrets encrypted at rest** (AES-256-GCM). New `secretEncryption.ts` helper with `enc:v1:<iv>:<tag>:<ct>` format. Setup encrypts; verify/disable decrypt; legacy plaintext rows are accepted and opportunistically re-encrypted on next successful verify. Key from `TOTP_ENC_KEY` env (preferred) or derived from `JWT_SECRET`. | `src/utils/secretEncryption.ts`, `src/pages/api/auth/2fa/setup.ts`, `src/pages/api/auth/2fa/verify.ts`, `src/pages/api/auth/2fa/disable.ts` |
| 35 | **`api/admin/reviews.ts` GET rewritten** — replaced `sql.raw()` patterns with Drizzle's chainable API, added a proper `leftJoin(clinics)` for clinicName/clinicSlug (the previous query selected those columns from `reviews` where they don't exist). Pending/total counts now come from SQL aggregates. | `src/pages/api/admin/reviews.ts` |
| 36 | **Clinic claim verification tightened** — `/api/clinics/claim.ts` only sends verification email when the submitted address matches the clinic's listed email OR an address at the clinic's website domain. If neither is on file, the claim is queued for admin review without sending. Closes the account-takeover surface flagged in API audit H7. | `src/pages/api/clinics/claim.ts` |
| 37 | **Dead 2FA `setupToken` removed** — was a SHA-256 of inputs returned to the client but never persisted or verified anywhere. Implied a protection that didn't exist; deleted. | `src/pages/api/auth/2fa/setup.ts` |
| 38 | **`clearSessionCookie` Secure flag mirrored** — clear cookie now adds `Secure` in production so the browser actually overwrites the (Secure) session cookie. | `src/utils/auth.ts` |
| 39 | **Account-type enumeration in `portal-password-login.ts` neutralized** — wrong-credentials and magic-link-only accounts now both return generic "Invalid email or password" 401. | `src/pages/api/auth/portal-password-login.ts` |
| 40 | **`auditLog.metadata` → `auditLog.details`** in `verify-email.ts` and `reset-password.ts`. Schema only has `details`; `metadata` was silently dropped on insert. | `src/pages/api/auth/verify-email.ts`, `src/pages/api/auth/reset-password.ts` |
| 41 | **Bulk-campaign send forces preview-then-confirm** — non-preview send must echo back `confirmedRecipientCount` matching server-side count, capped at 10 000 recipients, rate-limited to 1 send/hour per admin+IP. Closes the "all_users one click" risk. | `src/pages/api/admin/bulk-campaigns.ts` |
| 42 | **Compliance cookie-consent stats use SQL aggregates** instead of in-memory filtering of a 100-row slice (which was wrong once you exceeded 100 records). | `src/pages/api/admin/compliance.ts` |
| 43 | **`patient-login.ts` failed-login audit logging** added (`logLoginActivity success: false`) — failures were previously invisible to the audit trail. | `src/pages/api/auth/patient-login.ts` |

## Still deferred (genuinely low-priority or design decisions)
- **`api/admin/import.ts` — row-by-row insert loop** (up to 5 000 round-trips). Not a security issue; per-row error attribution complicates batching. Leaving as-is.
- **401 vs 403 status code consistency across admin endpoints** — cosmetic; existing endpoints work, only monitoring dashboards see the difference.
- **CAPTCHA on signup / magic-link / community-login** — needs a CAPTCHA provider decision.
- **Sweeping `getSessionFromRequest` migration** — public endpoints still use the sync JWT-only check; admin endpoints are now strict via middleware. Migration of doctor/owner/portal endpoints to strict can happen progressively.

## What was deleted
- `src/pages/api/clinics/[id]/claim.ts` (and its now-empty parent dir) — dead duplicate.

## New env vars
- **`TOTP_ENC_KEY`** (recommended) — 64 hex chars (32 bytes) for TOTP-secret encryption. Falls back to a key derived from `JWT_SECRET` if unset.
- **`ALLOW_INMEMORY_RATELIMIT=true`** (optional) — opt out of the production-mode 503 when Upstash is unavailable. Don't set this unless you understand the cold-start bypass.

## Build verify
- `npm run build` — completes in ~42s with no errors. Pre-existing `Astro.request.headers` warnings are unchanged.

