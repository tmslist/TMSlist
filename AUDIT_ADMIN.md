# Admin Panel Audit

## Critical — auth bypass or data exposure

**C1 — `generate.ts` zero authentication** — `src/pages/api/admin/generate.ts:1-6` — entire file is a stub that accepts any POST body and echoes it. No auth. **Fix:** add `getSessionFromRequest` + `hasRole(session, 'admin')` guard, or delete the stub.

**C2 — `sql.raw()` pattern in admin reviews** — `src/pages/api/admin/reviews.ts:33-45` — `where`, `orderBy`, `limitOffset` are assembled from internal sources today, but using `sql.raw()` on derived strings is a structural injection risk and a copy-paste hazard. **Fix:** rewrite with Drizzle `.limit()/.offset()/.where()` chainable API; remove all `sql.raw()`.

**C3 — Open redirect in impersonate** — `src/pages/api/admin/impersonate.ts:54,106` — `redirectTo` from request body used directly as Location header. **Fix:** require `^/(?!/)` and reject anything containing `://`.

**C4 — Revoked sessions not checked — JWT oracle** — `src/utils/auth.ts:84-89` — `getSessionFromRequest` only validates JWT signature; never queries `sessions` table. Logout / password reset / user delete don't actually invalidate the cookie for up to 7 days. Affects every admin endpoint. **Fix:** after `verifyToken()` succeeds, query `sessions` by `tokenHash`; reject if missing.

**C5 — GDPR POST has no role check** — `src/pages/api/admin/gdpr.ts:52-58` — only checks `session` exists. Any logged-in user (viewer/clinic_owner) can submit GDPR requests against any email. **Fix:** add `if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403)`.

## High — privilege escalation, IDOR, destructive bug

**H1 — Compliance PUT silently does nothing** — `src/pages/api/admin/compliance.ts:135` — `const body = await request.json;` is a property reference, not a function call. `body` is the unbound method; subsequent `body.id` etc. is `undefined`. PUT always falls through to 400. Legal document publication is completely broken. **Fix:** `await request.json()`.

**H2 — Impersonate can promote to admin and persists 7 days** — `src/pages/api/admin/impersonate.ts:95-103` — no guard preventing impersonation of admins; default 7-day cookie expiry. With C4, a stolen impersonation token = 7-day full admin. **Fix:** block when target `role === 'admin'`; cap expiry to 1 hour; embed `isImpersonation: true` in JWT for downstream sensitive-mutation rejection.

**H3 — `blog-generate-all.ts` can write outside blog dir** — `src/pages/api/admin/blog-generate-all.ts:291-292` — `post.slug` from manifest joined into path; `join()` doesn't reject `../`. Slug `../../middleware` writes outside `BLOG_DIR`. **Fix:** validate slug against `/^[a-z0-9-]+$/` and assert resolved path starts with `BLOG_DIR`.

**H4 — Bulk delete has no transaction** — `src/pages/api/admin/bulk.ts:91-92` — `delete_clinics` issues `DELETE...WHERE id IN (...)` then audit log insert; if audit log throws, deletion is committed without record. **Fix:** wrap in `db.transaction()`.

**H5 — `media.ts` POST has no MIME / size validation** — `src/pages/api/admin/media.ts:54-69` — unlike `upload-doctor-image.ts`. Editors can upload SVG-with-JS, very large files. **Fix:** copy `ALLOWED_TYPES` and `MAX_SIZE_BYTES` from doctor image handler.

## Medium

**M1 — Middleware doesn't enforce auth on `/api/admin/*`** — `src/middleware.ts:1-47` — auth is endpoint-local only. A future endpoint that forgets the check is silently public. **Fix:** middleware-level 401 for `/api/admin/*` without valid session.

**M2 — `settings.ts` PUT accepts arbitrary keys** — `src/pages/api/admin/settings.ts:73` — no key allowlist; any key persisted to `siteSettings`. **Fix:** allowlist known config keys.

**M3 — `analytics.ts` `days` param unclamped** — `src/pages/api/admin/analytics.ts:24` — `parseInt(daysParam)` with no bounds. `?days=999999` runs giant date-range query. **Fix:** `Math.min(Math.max(parseInt(daysParam) || 30, 1), 365)`.

**M4 — `bulk-campaigns.ts` `all_users` sends to everyone with no rate limit / preview** — `src/pages/api/admin/bulk-campaigns.ts:234-239` — one click → email blast with no recipient cap. **Fix:** require preview-then-confirm token; cap recipient count; rate-limit one campaign per hour per admin.

**M5 — Impersonate session not time-bound** — `src/pages/api/admin/impersonate.ts:103` — default 7-day expiry. **Fix:** 1-hour max with explicit expiry claim.

**M6 — 401 vs 403 confusion** — `src/pages/api/admin/blog.ts:31-32` (and several others) — returns 401 for authenticated users without role; correct is 403. Misleads monitoring. **Fix:** 403 when session exists but role check fails.

## Low

**L1 — `generate.ts` stub leaks request body in echo response** — incomplete code shipped.
**L2 — `import.ts` row-by-row inserts in loop** — up to 5000 round-trips. **Fix:** batch in chunks of 250.
**L3 — `compliance.ts` GET stats counted client-side from a 100-row slice** — wrong when records > 100. **Fix:** SQL aggregate.
**L4 — `auditLog.metadata` vs `auditLog.details` inconsistency** in `impersonate.ts:125-135` — wrong column name silently dropped.
