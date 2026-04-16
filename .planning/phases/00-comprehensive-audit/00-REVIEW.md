---
phase: comprehensive-audit
reviewed: 2026-04-15T13:30:00Z
depth: standard
files_reviewed: 45
files_reviewed_list:
  - src/pages/api/auth/login.ts
  - src/pages/api/auth/magic-link.ts
  - src/pages/api/auth/portal-login.ts
  - src/pages/api/auth/community-login.ts
  - src/pages/api/clinics/submit.ts
  - src/pages/api/clinics/verify.ts
  - src/pages/api/clinics/claim.ts
  - src/pages/api/clinics/social-proof.ts
  - src/pages/api/reviews/index.ts
  - src/pages/api/reviews/respond.ts
  - src/pages/api/reviews/request.ts
  - src/pages/api/leads/index.ts
  - src/pages/api/upload.ts
  - src/pages/api/ai/chat.ts
  - src/pages/api/admin/bulk.ts
  - src/pages/api/portal/clinic.ts
  - src/pages/api/portal/reviews.ts
  - src/pages/api/portal/leads.ts
  - src/pages/api/portal/jobs.ts
  - src/pages/api/payments/portal.ts
  - src/pages/api/payments/razorpay-webhook.ts
  - src/pages/api/doctors/verify-npi.ts
  - src/pages/api/funnel/enter.ts
  - src/pages/api/community/posts.ts
  - src/pages/api/subscribe.ts
  - src/pages/api/webhooks/stripe.ts
  - src/utils/auth.ts
  - src/utils/sanitize.ts
  - src/utils/email.ts
  - src/utils/rateLimit.ts
  - src/utils/redis.ts
  - src/utils/stripe.ts
  - src/utils/razorpay.ts
  - src/db/schema.ts
  - src/db/queries.ts
  - src/db/validation.ts
  - src/db/forumQueries.ts
  - src/db/subscriptions.ts
  - src/middleware.ts
  - src/components/react/BookingWidget.tsx
  - src/pages/index.astro
  - src/pages/api/community/posts.ts
  - src/pages/api/advertising/checkout.ts
  - src/pages/api/reviews/vote.ts
findings:
  critical: 3
  warning: 8
  info: 12
  total: 23
status: issues_found
---

# Phase: Comprehensive Code Audit Report

**Reviewed:** 2026-04-15T13:30:00Z
**Depth:** standard
**Files Reviewed:** 45
**Status:** issues_found

## Summary

The TMSlist codebase is generally well-structured with good security foundations: Zod validation on API inputs, parameterized queries via Drizzle ORM, HTML sanitization for user content, and rate limiting. However, the audit identified **3 critical issues**, **8 warnings**, and **12 info-level findings** across authentication, type safety, API design, and code quality.

Key security gaps: the JWT secret warning-only check can cause silent auth failures in production, magic tokens are stored unhashed, and social-proof APIs lack authentication. Type safety issues include pervasive `as any` casts that bypass compile-time checking.

---

## Critical Issues

### CR-01: JWT_SECRET missing causes silent auth failure in production

**File:** `src/utils/auth.ts:10-13`
**Issue:** The JWT secret validation only logs a warning when not configured, allowing the application to start without proper authentication. On Vercel, if the environment variable is unset, `createToken()` throws, but `verifyToken()` returns `null`, causing unpredictable auth failures across requests.

**Code:**
```typescript
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET && typeof window === 'undefined') {
  console.warn('[auth] JWT_SECRET is not set — authentication will not work');
}
```

**Fix:**
```typescript
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

### CR-02: Magic tokens stored unhashed in database

**File:** `src/utils/auth.ts:175-186`
**Issue:** When a magic link token is created, the raw token (32 random bytes) is stored directly in the `magicTokens` table. If the database is compromised through SQL injection, backup breach, or unauthorized access, all active magic tokens can be used immediately to authenticate as any user.

**Code:**
```typescript
export async function createMagicToken(email: string, purpose: MagicTokenPurpose = 'portal-magic'): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicTokens).values({
    email: email.toLowerCase(),
    token,  // <-- stored raw
    purpose,
    expiresAt,
  });
  return token;
}
```

**Fix:**
```typescript
import { createHash } from 'crypto';

export async function createMagicToken(email: string, purpose: MagicTokenPurpose = 'portal-magic'): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicTokens).values({
    email: email.toLowerCase(),
    token: tokenHash,  // store hash only
    purpose,
    expiresAt,
  });
  return token;  // return raw token to send via email (one-way only)
}

// Update verifyMagicToken to hash the incoming token for comparison
```

---

### CR-03: Social proof API exposes lead counts without authentication

**File:** `src/pages/api/clinics/social-proof.ts:9-22`
**Issue:** The `/api/clinics/social-proof` endpoint returns 30-day lead counts for any clinic ID without requiring authentication or rate limiting. This allows an attacker to enumerate all clinic IDs (UUIDs) and gather business intelligence data about lead volumes, potentially identifying high-performing clinics for competitive targeting.

**Code:**
```typescript
export const GET: APIRoute = async ({ url }) => {
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) return new Response(JSON.stringify({ count: 0 }), { headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), sql`${leads.createdAt} > NOW() - INTERVAL '30 days'`));
    return new Response(JSON.stringify({ count: Number(result[0]?.count ?? 0) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({ count: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }
};
```

**Fix:** Add authentication check and validate UUID format:
```typescript
export const GET: APIRoute = async ({ url, request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) return new Response(JSON.stringify({ error: 'clinicId required' }), { status: 400 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId)) {
    return new Response(JSON.stringify({ error: 'Invalid clinicId format' }), { status: 400 });
  }
  // ... rest of handler
};
```

---

## Warnings

### WR-01: Portal APIs use unsafe type cast for clinicId

**File:** `src/pages/api/payments/portal.ts:18, 45`
**Issue:** Portal API routes cast the session to `any` to access `clinicId`, bypassing TypeScript's type safety. The `JWTPayload` interface does include `clinicId?: string`, but Astro's cookie parsing may not populate it. Using `as any` suppresses the type error but can cause runtime `undefined` access.

**Code:**
```typescript
const clinicId = (session as any).clinicId as string;
if (!clinicId) {
  return new Response(JSON.stringify({ error: 'Clinic not associated with user' }), { status: 400 });
}
```

**Fix:**
```typescript
const clinicId = session?.clinicId;
if (!clinicId) {
  return new Response(JSON.stringify({ error: 'Clinic not associated with user' }), { status: 400 });
}
```

---

### WR-02: No CORS headers on API routes

**File:** `src/pages/api/**/*.ts` (all files)
**Issue:** None of the API routes set explicit CORS headers (`Access-Control-Allow-Origin`, etc.). While Astro/Vercel applies default CORS behavior, this is implicit and not documented. API routes that may be called from browser clients need explicit CORS policy.

**Fix:** Add CORS headers to responses or create a middleware helper:
```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': import.meta.env.SITE_URL || 'https://tmslist.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

---

### WR-03: NPI verification API lacks input validation for body fields

**File:** `src/pages/api/doctors/verify-npi.ts:25`
**Issue:** The NPI verification endpoint destructures `doctorId`, `npiNumber`, `firstName`, `lastName`, `state`, and `credential` directly from `request.json()` without schema validation. Malformed or missing fields will cause runtime errors.

**Code:**
```typescript
const { doctorId, npiNumber, firstName, lastName, state, credential } = await request.json();
```

**Fix:**
```typescript
const body = await request.json();
const parsed = z.object({
  doctorId: z.string().uuid().optional(),
  npiNumber: z.string().regex(/^\d{10}$/).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  state: z.string().max(2).optional(),
  credential: z.string().optional(),
}).safeParse(body);
if (!parsed.success) { return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 }); }
const { doctorId, npiNumber, firstName, lastName, state, credential } = parsed.data;
```

---

### WR-04: Duplicate dead code in forumQueries.ts

**File:** `src/db/forumQueries.ts:329-331`
**Issue:** The `getForumComments` function has unreachable code after the return statement. The function returns `deduped` on line 328 but then has another `return rows;` on line 330.

**Code:**
```typescript
  return deduped;

  return rows;  // <-- unreachable, dead code
}
```

**Fix:** Remove line 330.

---

### WR-05: Empty catch blocks swallow errors silently

**File:** `src/pages/quiz/depression-severity-test.astro:346`
**Issue:** An empty catch block catches and discards all errors without logging or re-throwing, making debugging impossible for production issues.

**Code:**
```typescript
} catch (e) {}
```

**Fix:**
```typescript
} catch (err) {
  console.error('Depression severity test error:', err);
}
```

---

### WR-06: Forum search allows wildcard injection via ILIKE

**File:** `src/db/forumQueries.ts:109`
**Issue:** User-provided search strings are interpolated directly into ILIKE patterns. While Drizzle ORM prevents SQL injection for the value itself, users can inject PostgreSQL wildcard characters (`%`, `_`) to perform denial-of-service-style pattern matching that scans the entire table.

**Code:**
```typescript
conditions.push(sql`(${forumPosts.title} ILIKE ${'%' + search + '%'} OR ${forumPosts.body} ILIKE ${'%' + search + '%'})`);
```

**Fix:**
```typescript
const escaped = search.replace(/[%_]/g, '\\$&');
conditions.push(sql`(${forumPosts.title} ILIKE ${'%' + escaped + '%'}`));
```

---

### WR-07: Email confirmation sends plaintext temp password

**File:** `src/pages/api/clinics/verify.ts:54`
**Issue:** When a clinic owner claims a clinic, a readable temporary password is generated and sent in plaintext via email. While the token-based verification flow mitigates this somewhat, email is not a secure channel, and the password is stored hashed.

**Code:**
```typescript
const rawPassword = `TMS-${crypto.randomUUID().slice(0, 8)}`;
const tempPassword = await hashPassword(rawPassword);
// ... send rawPassword in email
sendWelcomeEmail(claim[0].email, rawPassword).catch(...)
```

**Fix:** Send a secure magic-link reset flow instead of plaintext passwords via email, or use a one-time passcode (OTP) approach where the email contains only a "Your temporary password is: X" without requiring email security guarantees.

---

### WR-08: Inconsistent 401 responses between auth checks

**File:** `src/pages/api/admin/bulk.ts:34`
**Issue:** The bulk API returns status `401` for unauthorized requests, but many other APIs also return `401` for unauthenticated users. However, some use `403` interchangeably (e.g., `src/pages/api/portal/reviews.ts` uses `403` when "No clinic linked"). This inconsistency can confuse clients about whether 401 means "not logged in" vs "logged in but not permitted."

**Code:**
```typescript
if (!hasRole(session, 'admin')) {
  return json({ error: 'Unauthorized' }, 401);  // should be 403 for role check
}
```

**Fix:** Use `401` only for missing authentication and `403` for insufficient permissions.

---

## Info

### IN-01: Pervasive `as any` type casts bypass type safety

**File:** Multiple files
**Issue:** `as any` is used 21 times across the codebase to bypass TypeScript type checking. Most occurrences are for dynamic window properties (Leaflet, PostHog) or legacy data structures, but portal API routes use it to access `clinicId` from sessions.

**Key occurrences:**
- `src/pages/api/payments/portal.ts:18, 45` — accesses `session.clinicId`
- `src/pages/api/analytics/stats.ts:50` — accesses `result.rows`
- `src/pages/api/cron/email-campaigns.ts:60, 65` — stores state in JSONB

**Fix:** Define proper typed wrappers for window extensions and strengthen the `JWTPayload` interface.

---

### IN-02: Hardcoded founder/admin email addresses in email templates

**File:** `src/utils/email.ts:13-14`
**Issue:** Email addresses for the founder and admin are hardcoded directly in the email utility. These should be configurable via environment variables.

**Code:**
```typescript
const ADMIN_EMAIL = 'brandingpioneers@gmail.com';
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';
```

**Fix:** Move to environment variables:
```typescript
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const FOUNDER_EMAIL = import.meta.env.FOUNDER_EMAIL || process.env.FOUNDER_EMAIL;
```

---

### IN-03: Missing null checks on optional fields

**File:** `src/pages/api/reviews/respond.ts:61` and `src/pages/api/portal/review-response.ts:56`
**Issue:** The owner response text is passed through `escapeHtml()` without a null check. If the response field is empty or undefined, this could cause a runtime error.

**Code:**
```typescript
const sanitized = escapeHtml(response);
```

**Fix:**
```typescript
const sanitized = response ? escapeHtml(response) : '';
```

---

### IN-04: Fire-and-forget async operations without error visibility

**File:** `src/pages/api/clinics/verify.ts:66`, `src/pages/api/clinics/claim.ts:61`, `src/pages/api/reviews/submit.ts:86`
**Issue:** Email sending and background tasks use `.catch()` to log errors, but these errors are only visible in server logs. Users see a successful response while emails may silently fail.

**Code:**
```typescript
sendWelcomeEmail(claim[0].email, rawPassword).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));
```

**Fix:** Consider a structured async queue (e.g., a database-backed job table) for critical operations that cannot be silently dropped.

---

### IN-05: Razorpay utility uses CommonJS require in ESM context

**File:** `src/utils/razorpay.ts:7, 74`
**Issue:** The Razorpay utility uses `require('razorpay')` which is CommonJS syntax in a file that may be loaded as ESM. This can cause module resolution failures in some bundler configurations.

**Code:**
```typescript
const Razorpay = require('razorpay');
```

**Fix:** Use dynamic import:
```typescript
const Razorpay = (await import('razorpay')).default;
```

---

### IN-06: Forum query uses PostgreSQL-specific SQL features

**File:** `src/db/forumQueries.ts:131`
**Issue:** The "hot" sort algorithm uses `EXTRACT(EPOCH FROM ...)` which is PostgreSQL-specific. If the database is ever migrated to MySQL or another dialect, this query will break.

**Code:**
```typescript
sql`(${forumPosts.voteScore} + ${forumPosts.commentCount}) / POWER(EXTRACT(EPOCH FROM (NOW() - ${forumPosts.createdAt})) / 3600 + 2, 1.5)`
```

**Fix:** Document the PostgreSQL dependency or abstract it behind a database-specific query layer.

---

### IN-07: No validation on bulk action ids beyond array check

**File:** `src/pages/api/admin/bulk.ts:45-51`
**Issue:** The bulk API validates that `ids` is an array and has a maximum length of 500, but does not validate that each element is a valid UUID. Malformed IDs could cause database errors.

**Code:**
```typescript
if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
  return json({ error: 'Missing action or ids' }, 400);
}
if (ids.length > 500) { ... }
```

**Fix:** Validate each ID:
```typescript
const validUuids = ids.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
if (validUuids.length === 0) return json({ error: 'No valid IDs provided' }, 400);
```

---

### IN-08: Auth middleware console.warn instead of structured logging

**File:** `src/utils/auth.ts:12`
**Issue:** The missing JWT secret warning uses `console.warn` instead of the application's `logger.ts` utility, which may have structured logging, alerting, and format consistency.

**Code:**
```typescript
console.warn('[auth] JWT_SECRET is not set — authentication will not work');
```

**Fix:**
```typescript
import { logger } from './logger';
logger.warn('[auth] JWT_SECRET is not set — authentication will not work');
```

---

### IN-09: BookingWidget makes fire-and-forget analytics call

**File:** `src/components/react/BookingWidget.tsx:31-35`
**Issue:** The analytics tracking in BookingWidget uses a fire-and-forget pattern without error handling or await, meaning analytics events can be silently dropped if the network fails before the form submission completes.

**Code:**
```typescript
fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ clinicId, event: 'lead_submit' }),
}).catch(() => {});  // silently ignored
```

**Fix:** Consider queuing failed events for retry, or at minimum log the failure.

---

### IN-10: Missing HTTP OPTIONS handler for preflight requests

**File:** All API routes
**Issue:** None of the API routes define an `OPTIONS` handler for CORS preflight requests. While Vercel applies default CORS handling, explicit OPTIONS handlers would make the CORS policy clear and controllable.

**Fix:** Add a shared preflight handler or configure CORS at the Astro middleware level.

---

### IN-11: Redis client lazy initialization with stale singleton

**File:** `src/utils/redis.ts:12-16`
**Issue:** The Redis singleton (`_redis`) is lazily initialized but never revalidated. If Redis connection fails on first call, the cached `null` result will persist, causing all subsequent rate limit checks to silently pass (no rate limiting) without retry.

**Code:**
```typescript
let _redis: Redis | null = null;
export function redis() {
  if (!_redis) _redis = getRedis();
  return _redis;  // returns cached null on failure
}
```

**Fix:** Add periodic reconnection logic or at minimum log when Redis is unavailable to make the degraded state visible.

---

### IN-12: Admin emails hardcoded in sendLeadNotification

**File:** `src/utils/email.ts:172`
**Issue:** The `sendLeadNotification` function hardcodes the admin email recipient list. This creates a maintenance burden and violates the principle of configuration-as-code.

**Code:**
```typescript
const recipients = [ADMIN_EMAIL, ...(data.clinicEmail ? [data.clinicEmail] : [])];
```

**Fix:** Make the admin recipients configurable via environment variable with comma-separated values.

---

## Positive Findings

The following aspects of the codebase demonstrate strong engineering practices:

1. **Zod validation coverage** — All major API endpoints have Zod schemas for input validation, including clinic submissions, reviews, leads, forum posts, and job applications.

2. **Parameterized queries** — Database operations use Drizzle ORM's parameterized query builder throughout, preventing SQL injection at the application layer.

3. **HTML sanitization** — User-provided text in reviews, leads, and forum posts is sanitized via `escapeHtml()` before storage.

4. **Rate limiting** — Both form submission and API endpoints have rate limiting via Upstash Redis, with appropriate limits per endpoint type.

5. **Audit logging** — Bulk admin operations, subscription changes, and forum moderation are logged to an `audit_log` table for accountability.

6. **Atomic operations** — Forum vote upserts use database transactions to prevent race conditions.

7. **Indexed database schema** — The schema has appropriate indexes on `clinicId`, `userId`, `createdAt`, and composite indexes for common query patterns.

8. **No eval() or dangerous string operations** — The codebase avoids `eval()`, `new Function()`, `innerHTML` assignments with user content, and other common XSS vectors.

9. **Magic link auth with email enumeration prevention** — Login endpoints always return success even for non-existent emails to prevent user enumeration.

10. **HTTPS-only cookies with SameSite** — Session cookies are set with `HttpOnly`, `SameSite=Lax`, and conditional `Secure` flags based on environment.

---

_Reviewed: 2026-04-15T13:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
