---
phase: 00-security-audit
reviewed: 2026-04-21T12:00:00Z
depth: deep
files_reviewed: 54
files_reviewed_list:
  - src/utils/auth.ts
  - src/utils/rateLimit.ts
  - src/middleware.ts
  - src/pages/api/auth/login.ts
  - src/pages/api/auth/verify.ts
  - src/pages/api/auth/session.ts
  - src/pages/api/auth/logout.ts
  - src/pages/api/auth/dev-login.ts
  - src/pages/api/auth/patient-login.ts
  - src/pages/api/auth/portal-login.ts
  - src/pages/api/auth/portal-password-login.ts
  - src/pages/api/auth/portal-signup.ts
  - src/pages/api/auth/portal-verify.ts
  - src/pages/api/auth/magic-link.ts
  - src/pages/api/auth/forgot-password.ts
  - src/pages/api/auth/reset-password.ts
  - src/pages/api/auth/verify-email.ts
  - src/pages/api/auth/community-login.ts
  - src/pages/api/auth/community-verify.ts
  - src/pages/api/auth/2fa/disable.ts
  - src/pages/api/auth/google/index.ts
  - src/pages/api/auth/google/patient-callback.ts
  - src/pages/api/auth/google-dir/callback.ts
  - src/pages/api/auth/npi-lookup.ts
  - src/pages/api/oauth/consent.ts
  - src/pages/api/admin/users.ts
  - src/pages/api/admin/clinics.ts
  - src/pages/api/admin/leads.ts
  - src/pages/api/admin/bulk.ts
  - src/pages/api/admin/settings.ts
  - src/pages/api/admin/audit.ts
  - src/pages/api/admin/impersonate.ts
  - src/pages/api/admin/login-history.ts
  - src/pages/api/admin/user-permissions.ts
  - src/pages/api/admin/user-session-expiry.ts
  - src/pages/api/admin/api-keys.ts
  - src/pages/api/admin/reviews.ts
  - src/pages/api/admin/blog.ts
  - src/pages/api/admin/blog-content.ts
  - src/pages/api/admin/content.ts
  - src/components/react/AdminApiKeys.tsx
  - src/components/react/AdminUsers.tsx
  - src/components/react/AdminDashboard.tsx
  - src/components/react/AdminSettings.tsx
  - src/components/react/AdminLeads.tsx
  - src/components/react/AdminClinics.tsx
  - src/components/react/AdminBulkOperations.tsx
  - src/components/react/AdminImpersonate.tsx
  - src/components/react/AdminAuditLog.tsx
  - src/components/react/AdminAuditTrail.tsx
  - src/components/react/AdminApiDocs.tsx
  - src/components/react/AdminSecurityDashboard.tsx
  - src/components/react/AdminComplianceCenter.tsx
  - src/components/react/AdminConsentManager.tsx
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 00: Security & Quality Audit Report

**Reviewed:** 2026-04-21
**Depth:** deep (cross-file analysis + import graph + call-chain tracing)
**Files Reviewed:** 54
**Status:** issues_found

## Summary

The auth implementation is generally well-engineered: bcrypt hashing at cost 12, TOTP 2FA with atomic token consumption, brute-force lockout, parameterized queries throughout, and role-gated admin routes. However, there are 10 findings spanning one critical vulnerability and several security gaps that should be addressed.

---

## Critical Issues

### CR-01: Open Redirect in OAuth Consent Endpoint allows Phishing

**File:** `src/pages/api/oauth/consent.ts:40-43, 72-75`
**Severity:** Critical
**Issue:** The OAuth consent endpoint accepts a `redirect_uri` parameter from the request body and uses it directly to construct a redirect without validating it belongs to a whitelisted domain. An attacker can craft a consent page submission that redirects the victim to an arbitrary external domain after they authorize the application, enabling phishing attacks.

```typescript
// Line 40-43: Cancel path — unchecked redirect_uri
const redirectUri = formData.get('redirect_uri') as string;
const params = new URLSearchParams({
  error: 'access_denied',
  state: state || '',
});
return new Response(null, {
  status: 302,
  headers: { Location: `${redirectUri}?${params}` },
});

// Line 72-75: Approval path — same unchecked redirect_uri
return new Response(null, {
  status: 302,
  headers: { Location: `${redirectUri}?${params}` },
});
```

**Fix:** Validate `redirect_uri` against a strict allowlist before using it. Only permit redirects to known, trusted Supabase/OAuth provider domains. Reject or ignore the parameter if it does not match the expected pattern.

```typescript
const ALLOWED_REDIRECT_DOMAINS = [
  'tmslist.com',
  'auth.tmslist.com',
  // add all known OAuth callback domains here
];

function isAllowedRedirect(uri: string): boolean {
  try {
    const url = new URL(uri);
    return ALLOWED_REDIRECT_DOMAINS.includes(url.hostname);
  } catch {
    return false;
  }
}

// Before redirecting:
if (!isAllowedRedirect(redirectUri)) {
  return new Response('Invalid redirect URI', { status: 400 });
}
```

---

## Warnings

### WR-01: sql.raw() with user-supplied LIMIT/OFFSET — Potential for Abuse

**File:** `src/pages/api/admin/reviews.ts:41-46`
**Severity:** Warning
**Issue:** While `limit` and `offset` are bounded with `Math.max/min`, the string interpolation into `sql.raw()` is not parameterized. The variable parts `where`, `orderBy`, and the LIMIT/OFFSET clause come from user input and are concatenated directly into the SQL string. Though the current validation bounds them to integers, if any future code change relaxes those bounds, the `sql.raw()` interpolation would be unsafe. Also, `orderBy` is hardcoded but `where` is constructed from user input (via `whereMap`).

```typescript
const whereMap: Record<string, string> = {
  pending: 'WHERE approved = false',
  approved: 'WHERE approved = true',
  all: '',
};
const where = whereMap[status || 'all'] || whereMap.all; // safe (allowlist), but fragile
const limitOffset = `LIMIT ${limit} OFFSET ${offset}`; // limit/offset are bounded
const rowsResult = await db.execute(sql`
  SELECT ... FROM reviews ${sql.raw(where)} ${sql.raw(orderBy)} ${sql.raw(limitOffset)}
`);
```

**Fix:** Move entirely to parameterized queries using Drizzle ORM's query builder instead of raw SQL, or at minimum validate every fragment strictly. Prefer:

```typescript
// Use Drizzle's parameterized where clause throughout:
const rows = await db
  .select({ ... })
  .from(reviews)
  .where(status === 'pending' ? eq(reviews.approved, false) : undefined)
  .orderBy(desc(reviews.createdAt))
  .limit(limit)
  .offset(offset);
```

---

### WR-02: JWT_SECRET Unguarded at Module Import — Silent Failure on Cold Start

**File:** `src/utils/auth.ts:12`
**Severity:** Warning
**Issue:** `JWT_SECRET` is read at module import time (line 12: `const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET`). If the variable is not set, `createToken()` (line 41) throws an error but `verifyToken()` (line 46) returns `null` silently. This asymmetric behavior means that during cold starts where `JWT_SECRET` is missing, token verification will silently reject all sessions while token creation throws. On Vercel serverless, each cold-start invocation re-imports the module — meaning some requests could fail unpredictably if env vars are slow to load.

```typescript
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET; // line 12

export function createToken(payload: JWTPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured'); // throws
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  if (!JWT_SECRET) return null; // silent null — users are logged out without explanation
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
```

**Fix:** Validate that `JWT_SECRET` is set at module initialization time and fail fast in CI/staging. Consider adding a startup check:

```typescript
// At the top of auth.ts or in a separate validate-env.ts:
const REQUIRED_ENV = ['JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!import.meta.env[key] && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

---

### WR-03: dev-login Endpoint Bypasses All Auth Controls in Production

**File:** `src/pages/api/auth/dev-login.ts:24-29`
**Severity:** Warning
**Issue:** The dev-login endpoint correctly checks `isDev` before proceeding (line 24), but the `DEV` check is purely client-side enforcement based on `import.meta.env.DEV`. In Vercel preview deployments, `import.meta.env.DEV` is `false` even though the environment may be a non-production "dev-like" context. However, there is a subtle risk: if a build is deployed with `DEV=true` (e.g., via a misconfigured build flag), the entire auth bypass would be live. The code creates admin sessions for emails in `ADMIN_EMAILS` without any credential verification.

```typescript
async function devLogin(email: string) {
  if (!isDev) {
    return new Response(JSON.stringify({ error: 'Dev login is only available in development' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // ... proceeds without any credential check
}
```

**Fix:** Add an explicit environment guard that cannot be overridden:

```typescript
const isDev = import.meta.env.DEV === true && process.env.NODE_ENV !== 'production';
```

Additionally, consider requiring a `DEV_AUTH_SECRET` that must be passed in the request body for dev-login to activate.

---

### WR-04: Admin Settings GET Returns 401 for Unauthorized but Uses 403 Semantics

**File:** `src/pages/api/admin/settings.ts:18-19`
**Severity:** Warning
**Issue:** The GET handler for admin settings checks `hasRole(session, 'admin', 'editor')` but returns status `401` (Unauthorized) instead of `403` (Forbidden) when the session exists but the role does not match. This leaks information: an attacker can distinguish between "no session" (401) and "session exists but insufficient role" (401, same response), which is actually a 403 condition. The distinction is subtle but the semantics are inverted.

```typescript
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401); // should be 403 when session exists
  }
  // ...
};
```

Compare with the PUT handler (line 75) which correctly uses `hasRole(session, 'admin')` and returns `401` for the same pattern.

**Fix:**

```typescript
if (!session) {
  return json({ error: 'Unauthorized' }, 401);
}
if (!hasRole(session, 'admin', 'editor')) {
  return json({ error: 'Forbidden' }, 403);
}
```

---

### WR-05: Community / Portal Login Auto-Create Unauthenticated Users

**File:** `src/pages/api/auth/community-verify.ts:33-40`
**Issue:** `src/pages/api/auth/portal-verify.ts:75-82`
**Severity:** Warning
**Issue:** Both the community and portal magic link verify endpoints will create a new user account if one does not exist, auto-assigning roles (`viewer` for community, `clinic_owner` for portal) without any email verification step. While this is intentional for magic-link flows, it means an attacker who guesses or obtains a valid magic link token for an unclaimed email would automatically create an account for that email — potentially pre-staging an account before the legitimate user does.

```typescript
// community-verify.ts lines 33-40
if (!user) {
  const created = await db.insert(users).values({
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0],
    role: 'viewer' as const, // auto-creates account with no verification
  }).returning();
  user = created[0];
}
```

**Fix:** This is a known trade-off in magic-link flows. The risk is limited because the token itself is the proof of email access. However, consider logging a security event when a new account is auto-created via magic link, and potentially flagging the account as "unverified" until the user completes a secondary step.

---

## Info

### IN-01: AdminApiKeys React Component — Incorrect API Response Field Mapping

**File:** `src/components/react/AdminApiKeys.tsx:31`
**Severity:** Info
**Issue:** The component reads `d.keys` from the API response (line 31), but the backend endpoint `src/pages/api/admin/api-keys.ts` returns `{ data: masked }` (line 44), not `{ keys: [...] }`. The response is `data` but the component reads `keys`, meaning the key list will always be empty and the UI will show "No API keys yet" even when keys exist.

```typescript
// Frontend (AdminApiKeys.tsx:31):
.then(d => setKeys(d.keys || []))  // reads 'keys' — always undefined

// Backend (admin/api-keys.ts:44):
return json({ data: masked });       // returns 'data'
```

**Fix:** Change line 31 to `d.data || []`.

---

### IN-02: AdminApiKeys — toggleKey and revokeKey Use Wrong HTTP Endpoints

**File:** `src/components/react/AdminApiKeys.tsx:57, 65`
**Severity:** Info
**Issue:** The React component calls `/api/admin/api-keys/${id}` with DELETE (line 57) and PATCH (line 65), but the backend `src/pages/api/admin/api-keys.ts` does not have a `DELETE /api-keys/[id]` route — it only has a single `DELETE /api-keys` endpoint that reads the ID from `url.searchParams.get('id')` (line 142). The toggleKey PATCH call also hits a non-existent route.

```typescript
// Component lines 57 and 65:
await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });  // wrong URL
await fetch(`/api/admin/api-keys/${key.id}`, { method: 'PATCH', ... }); // PATCH not in backend
```

**Fix:** Use the existing endpoints: DELETE should call `DELETE /api/admin/api-keys?id=${id}`. The toggleKey PATCH would need to call PUT `/api/admin/api-keys` with `{ id, ...updates }`.

---

### IN-03: Missing CSRF Protection on Mutation Endpoints

**File:** `src/pages/api/admin/bulk.ts` and multiple other admin mutation routes
**Severity:** Info
**Issue:** The admin bulk operations, settings PUT, and other mutation endpoints do not implement CSRF token validation. While the session cookie uses `SameSite=Lax`, cookie-only CSRF protection does not defend against attacks from the same origin. Astro's CSRF protection is opt-in via `@astroparty/csrf` or custom middleware. For an admin panel with significant mutation surface, adding CSRF tokens would harden the application.

**Fix:** Implement CSRF token middleware for all state-changing admin API routes. Generate a token on each admin page load and require it in the `X-CSRF-Token` header for all mutations.

---

### IN-04: Admin Audit Log GET — Missing Authorization Session Check

**File:** `src/pages/api/admin/audit.ts:17-18`
**Severity:** Info
**Issue:** The audit log GET endpoint checks `hasRole(session, 'admin')` but never calls `getSessionFromRequest(request)` explicitly. It passes `session` directly to `hasRole`, which would receive `undefined` if the cookie is absent (because `getSessionFromRequest` is not called). Actually, looking more carefully, `getSessionFromRequest(request)` is not imported — only `hasRole` is imported. This means `session` is always `undefined`, so `hasRole(undefined, 'admin')` returns `false`, and the endpoint returns 401. However, this works by accident — the code should explicitly call `getSessionFromRequest` for clarity and correctness.

```typescript
// Line 16-17 — getSessionFromRequest is NOT called:
const session = getSessionFromRequest(request); // this line does NOT exist
if (!hasRole(session, 'admin')) {  // session is always undefined here
  return json({ error: 'Unauthorized' }, 401);
}
```

**Fix:** Add the explicit session retrieval:

```typescript
const session = getSessionFromRequest(request);
if (!session) return json({ error: 'Unauthorized' }, 401);
if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);
```

---

## Positive Findings (Security Strengths)

The following are notable security strengths that were verified during this audit:

1. **bcrypt at cost 12** — Password hashing uses bcrypt with cost factor 12 (`src/utils/auth.ts:28`), which is appropriately strong for 2026.

2. **Atomic magic token consumption** — `verifyMagicToken()` in `src/utils/auth.ts:438` uses `UPDATE...RETURNING` to atomically mark tokens as used, preventing race-condition replay attacks.

3. **Brute-force lockout** — All password login endpoints check `isAccountLocked()` before verifying the password, preventing credential stuffing.

4. **Parameterized queries throughout** — All admin API routes use Drizzle ORM's query builder with parameterized conditions. No raw string interpolation in SQL except the intentionally reviewed `sql.raw()` in `reviews.ts`.

5. **Role-gated admin routes** — Every admin endpoint verified calls `hasRole()` with the appropriate roles (`admin`, `editor`, etc.) before processing any data.

6. **TOTP 2FA with secret nulling** — `src/pages/api/auth/2fa/disable.ts` properly nulls the TOTP secret on disable and requires a valid code before doing so.

7. **Account self-deletion prevention** — `src/pages/api/admin/users.ts:259` prevents admins from deleting their own accounts.

8. **Passkey counter regression detection** — `verifyPasskeyAuth()` in `src/utils/auth.ts:786` rejects authenticators with a stale counter, detecting cloned passkeys.

9. **Impersonation audit trail** — `src/pages/api/admin/impersonate.ts` logs both an auth event and an audit log entry with the impersonator's identity.

---

_Reviewed: 2026-04-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
