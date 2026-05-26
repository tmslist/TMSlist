# Security & Bug Audit — tmslist (2026-04-26)

Four parallel audits across auth/OAuth, admin panel, lead magnet flow, and other APIs.
Detail in `AUDIT_AUTH.md`, `AUDIT_ADMIN.md`, `AUDIT_LEADMAGNET.md`, `AUDIT_APIS.md`.

## Severity totals
| Area | Critical | High | Medium | Low |
|---|---|---|---|---|
| Auth & OAuth | 4 | 5 | 9 | 4 |
| Admin panel | 5 | 5 | 6 | 4 |
| Lead magnet | 5 | 7 | 6 | 4 |
| Other APIs | 6 | 9 | 10 | 6 |
| **Total** | **20** | **26** | **31** | **18** |

## Top 12 must-fix-now (cross-cutting, ranked by exploit ease × blast radius)

1. **`api/admin/generate.ts` — fully unauthenticated** — anonymous POST accepted on an admin endpoint.
2. **`api/auth/dev-login.ts` — compile-time guard only** — `import.meta.env.DEV` is baked at build; if a build slips through without `NODE_ENV=production`, the file is wide open and creates admin accounts via GET.
3. **`api/auth/2fa/verify.ts` — unauth + broken lockout** — accepts attacker-supplied `userId`; lockout counter never reaches threshold. Combined with `login.ts` leaking `userId`, full bypass of 2FA.
4. **`api/auth/google/index.ts` — OAuth state is `"admin"`/`"portal"` literal, not a CSRF nonce**. Login CSRF + admin/portal selector via `Referer`.
5. **`api/admin/compliance.ts:135` — `await request.json` without `()`** — entire PUT silently broken. Legal doc publishing doesn't work.
6. **`api/admin/gdpr.ts` POST — missing `hasRole(...,'admin')`** — any logged-in user can spam the GDPR queue.
7. **`utils/auth.ts` — JWT sessions not cross-checked against `sessions` table** — revoked tokens stay valid up to 7 days. Affects all admin and portal endpoints.
8. **`api/referral/track.ts` — wide-open lead injection.** No auth, no rate limit, no validation.
9. **`api/reviews/verify-email.ts` — anyone can overwrite any pending review's email**, then verify it.
10. **`api/reviews/index.ts:83` — auto-approve when `userEmail === session.email`** — any signed-up user posts auto-approved 1-stars on competitors.
11. **`api/cron/email-campaigns.ts` (+ siblings) — `if (cronSecret && ...)` fails open if `CRON_SECRET` unset** — public endpoint that fires bulk emails. Risk of Resend domain blacklist.
12. **Lead magnet flow doesn't deliver emails** — `nurtureFunnel.ts` `fromMap` uses `*@tmslist.com` but only `mail.tmslist.com` is verified in Resend. Every drip + welcome silently fails. Also `LeadMagnetModal.astro` is imported nowhere; `open-lead-magnet` event has no listener.

## Other notable fast-fail bugs (cheap to fix)

- `api/clinics/[id]/claim.ts:50` — `crypto.randomUUID()` called without import → ReferenceError at runtime.
- `api/places/autocomplete.ts` — `AbortSignal.timeout` referenced without `()` → no timeout, no abort.
- `api/auth/passkey/authenticate.ts:244` — catch block re-reads already-consumed body; lockout never triggers.
- `api/admin/impersonate.ts` — open redirect on `redirectTo`, no admin-on-admin block, default 7-day expiry.
- `api/auth/logout.ts:30` — open redirect on `?redirect=`.
- `api/auth/verify.ts:55,102` — open redirect via `?state=` (`/account.evil.com` passes the `startsWith('/account')` check).

## Action plan
Per the operating mode, I'm fixing the must-fix-now list inline rather than waiting for review. Larger items that touch design (e.g., `mail.tmslist.com` domain verification, full re-architecture of the 2FA pre-auth handshake) will be done in the safest minimum-change form and surfaced.

See per-area audit files for the complete catalogue and lower-priority hardening recommendations.
