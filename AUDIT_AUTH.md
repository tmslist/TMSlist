# Auth & OAuth Audit

## Critical (exploitable now)

**C1 — OAuth `state` is a non-random string, not a CSRF nonce** — `src/pages/api/auth/google/index.ts:15-16` — `state` is set to the literal `"admin"` or `"portal"` based on the `Referer` header. No random nonce is generated or stored. **Attack:** Login CSRF — attacker serves a page that initiates the flow with their own auth code; the callback accepts any `state` matching `"admin"`/`"portal"`. Attacker can also steer admin-vs-portal by spoofing Referer. **Fix:** Generate `randomBytes(32).toString('hex')`, store in a short-lived HttpOnly cookie, verify on callback — same pattern `google-dir/index.ts` already uses correctly.

**C2 — 2FA TOTP lockout counter never reaches threshold** — `src/pages/api/auth/2fa/verify.ts:94` — `currentAttempts = (user.lockedUntil ? 1 : 0) + 1` is always 1 or 2. Threshold is 5. Lockout never fires. **Attack:** with a known `userId`, brute-force any TOTP in unlimited attempts. **Fix:** add `totp_failed_attempts` integer column on users; increment on each failure; lock at threshold.

**C3 — 2FA verify endpoint is unauthenticated** — `src/pages/api/auth/2fa/verify.ts:25-52` — accepts attacker-supplied `userId` via POST body with no session, no pre-auth token. `login.ts:142` leaks the `userId` to anyone with valid email/password. **Attack:** combined with C2, complete account takeover of any 2FA-enabled admin. **Fix:** issue a signed short-lived `pending_mfa` token from `login.ts` after password verification; require it on `2fa/verify` instead of client-supplied userId.

**C4 — `dev-login.ts` guard is compile-time only** — `src/pages/api/auth/dev-login.ts:16,24-28` — `import.meta.env.DEV` is Vite's compile-time flag. Built without `NODE_ENV=production`, the guard tree-shakes away leaving the endpoint open. **Attack:** GET `/api/auth/dev-login?email=any@email.com` → admin user + valid session, no credentials. **Fix:** runtime guard `if (process.env.NODE_ENV !== 'development') return 403`. Better: exclude file from production deploy.

## High (likely exploitable)

**H1 — Open redirect on logout `?redirect=`** — `src/pages/api/auth/logout.ts:30` — used directly as `Location` header with no validation. **Fix:** require `^/(?!/)`.

**H2 — Open redirect in magic-link verify `?state=`** — `src/pages/api/auth/verify.ts:55,102-103` — `startsWith('/account')` accepts `/account.evil.com/...`. **Fix:** parse with `new URL(state, request.url)`, require origin match.

**H3 — Race on signup creates duplicates** — `src/pages/api/auth/portal-signup.ts:54-73` — separate `getUserByEmail` + `db.insert` calls, no transaction, no UNIQUE constraint. **Fix:** add UNIQUE on `users.email`, use `INSERT ON CONFLICT DO NOTHING RETURNING`.

**H4 — In-memory rate limiter resets per cold start** — `src/utils/rateLimit.ts:84-109` — when Upstash env vars absent, falls back to process-local Map. Serverless = fresh process per invocation = unlimited login attempts. **Fix:** require Redis in production; return 503 if missing.

**H5 — Sessions insert failure swallowed** — `src/utils/auth.ts:115-125` — try/catch logs and continues; JWT still issued. `invalidateSession` and `invalidateAllUserSessions` now have no effect on the cookie. **Fix:** fail closed; do not issue cookie if sessions insert throws.

## Medium

**M1 — TOTP secret stored plaintext** — `src/pages/api/auth/2fa/setup.ts:33` — comment says "consider encrypting"; not encrypted. DB exfil = full 2FA bypass. **Fix:** AES-256-GCM with server key.

**M2 — `2fa/disable.ts` no rate limit / no lockout** — entire handler — session-holding attacker brute-forces TOTP to disable 2FA. **Fix:** mirror `verify.ts` lockout + `strictRateLimit`.

**M3 — `patient-login.ts` doesn't `logLoginActivity` on failures** — `src/pages/api/auth/patient-login.ts:54-59` — failed login attacks invisible. **Fix:** mirror `portal-password-login.ts`.

**M4 — `npi-lookup.ts` unauth + no rate limit** — entire handler — open relay to NPPES; can exhaust upstream rate limits. **Fix:** `strictRateLimit(ip, 20, '1 m')`.

**M5 — `getSessionFromRequest` doesn't cross-check sessions table** — `src/utils/auth.ts:84-89` — JWT signature only; revoked DB row still accepts the token. **Fix:** look up `sha256(token)` after verify, reject if missing.

**M6 — Account-type enumeration in `portal-password-login.ts`** — `src/pages/api/auth/portal-password-login.ts:91-99` — distinct error reveals magic-link-vs-password. **Fix:** generic `"Invalid email or password"`.

**M7 — `clearSessionCookie` missing `Secure`** — `src/utils/auth.ts:162` — secure cookie may not be cleared in production. **Fix:** mirror prod-conditional `Secure` flag.

**M8 — Passkey catch block re-reads consumed body** — `src/pages/api/auth/passkey/authenticate.ts:244` — body stream single-use; `JSON.parse('')` throws; lockout never triggers. **Fix:** keep parsed body from initial `request.json()` in scope.

**M9 — `2fa/setup.ts` `setupToken` is dead theatre** — `src/pages/api/auth/2fa/setup.ts:38-41` — sha256 of inputs returned but never persisted/checked. **Fix:** persist + verify, or remove.

## Low / hygiene

**L1 — No CAPTCHA** on signup, magic-link, community-login.
**L2 — `JWT_SECRET` missing causes silent null returns**, not a startup crash.
**L3 — `google/index.ts` derives admin/portal from `Referer`** — fragile; use explicit query param.
**L4 — Magic-link URL logged in dev** — risk of CI log leak if `NODE_ENV` mis-set in prod.

## Verified safe

- Magic token single-use (atomic `UPDATE ... WHERE usedAt IS NULL RETURNING`).
- Magic token 15-min TTL.
- Token purpose scoping prevents cross-flow reuse.
- bcrypt cost factor 12.
- Password strength enforced server-side.
- JWT `none` algo not possible (no override).
- Session cookie flags HttpOnly/SameSite/Secure correctly set in prod.
- Passkey challenge replay prevention (atomic consume).
- Passkey counter regression detection.
- ADMIN_EMAILS allowlist on admin Google OAuth callback.
- Session invalidation on password reset & email verify (limited by H5/M5).
- NPI input restricted to 10 numeric digits — no SSRF surface.
- Brute-force lockout on password login (correct).
