# Portal Audit Fixes — Phase 4: Quality & Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix P2 code quality issues, validation, and minor improvements.

**Architecture:** Final polish phase addressing validation, error messages, type safety, and code consistency.

**Tech Stack:** Astro API routes, React components, TypeScript

---

## File Map

| File | Changes |
|------|---------|
| `src/pages/api/leads/index.ts` | L-6, L-7 |
| `src/pages/api/portal/clinic.ts` | E-7, E-9 |
| `src/pages/api/portal/onboarding.ts` | O-6, O-7 |
| `src/pages/api/notifications/sse.ts` | S-8, S-9 |
| `src/db/queries.ts` | L-8 |

---

## Task 1: Leads API — Strip err.message in production (L-6)

**Files:**
- Modify: `src/pages/api/leads/index.ts:78-86`

- [ ] **Step 1: Conditionally include error details**

Find:
```ts
} catch (err) {
  console.error('Lead submit error:', err);
  return new Response(JSON.stringify({
    error: 'Internal server error',
    details: err instanceof Error ? err.message : 'Unknown error'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Replace with:
```ts
} catch (err) {
  console.error('Lead submit error:', err);

  const isDev = import.meta.env.DEV;
  return new Response(JSON.stringify({
    error: 'Internal server error',
    ...(isDev && { details: err instanceof Error ? err.message : 'Unknown error' })
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/leads/index.ts
git commit -m "fix(leads): strip error details in production responses

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Leads API — Validate sourceUrl as URL (L-7)

**Files:**
- Modify: `src/pages/api/leads/index.ts`

- [ ] **Step 1: Update Zod schema to validate URL**

Find the subscribeSchema:
```ts
const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  interests: z.array(z.string()).optional(),
  source: z.string().max(100).optional(),
});
```

Add sourceUrl validation with custom validator:
```ts
const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  interests: z.array(z.string()).optional(),
  source: z.string().max(100).optional(),
  sourceUrl: z.string()
    .max(500)
    .optional()
    .refine(val => !val || isValidHttpUrl(val), {
      message: 'sourceUrl must be a valid HTTP(S) URL',
    }),
});

function isValidHttpUrl(val: string): boolean {
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/leads/index.ts
git commit -m "fix(leads): validate sourceUrl as HTTP(S) URL

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Clinic Editor — Remove redundant updatedAt (E-7)

**Files:**
- Modify: `src/pages/api/portal/clinic.ts`

- [ ] **Step 1: Remove manual updatedAt assignment**

Find:
```ts
updateData.updatedAt = new Date();
```

This should be removed since the schema has `$onUpdate(() => new Date())`. However, verify first:

```bash
grep -n "onUpdate" src/db/schema.ts | grep -i updated
```

If `$onUpdate` exists, remove the manual assignment. If not, keep it but add a comment.

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/clinic.ts
git commit -m "refactor(clinic): remove redundant updatedAt (schema has \$onUpdate)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Clinic Editor — Add correlation IDs (E-9)

**Files:**
- Modify: `src/pages/api/portal/clinic.ts`

- [ ] **Step 1: Add correlation ID to error responses**

Add helper at top:
```ts
function errorResponse(message: string, correlationId: string, status = 500): Response {
  return new Response(JSON.stringify({
    error: message,
    correlationId,
    ...(import.meta.env.DEV && { stack: new Error().stack }),
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Use in error handlers:
```ts
const correlationId = crypto.randomUUID();

try {
  // ... DB operations
} catch (err) {
  console.error(`[clinic] Error (${correlationId}):`, err);
  return errorResponse('Failed to update clinic', correlationId);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/clinic.ts
git commit -m "fix(clinic): add correlation IDs to error responses

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Onboarding — Add Zod validation (O-6)

**Files:**
- Modify: `src/pages/api/portal/onboarding.ts`

- [ ] **Step 1: Add Zod schema for request body**

Add at top:
```ts
import { z } from 'zod';

const onboardingSchema = z.object({
  completed: z.literal(true).optional(),
  // Add other fields if POST accepts more
});
```

Validate in handler:
```ts
let body: { completed?: boolean };
try {
  body = onboardingSchema.parse(await request.json());
} catch (err) {
  return new Response(JSON.stringify({ error: 'Invalid request body' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Add request body size limit (O-7)**

Add before JSON parsing:
```ts
// Limit body size to 1MB
const contentLength = request.headers.get('content-length');
if (contentLength && parseInt(contentLength) > 1024 * 1024) {
  return new Response(JSON.stringify({ error: 'Request body too large' }), {
    status: 413,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/portal/onboarding.ts
git commit -m "fix(onboarding): add Zod validation and body size limit

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: SSE — Use named events (S-8)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts`

- [ ] **Step 1: Use event name prefix in SSE format**

Find where events are sent:
```ts
controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', ... })}\n\n`));
```

Replace with named events:
```ts
controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ createdAt: new Date().toISOString() })}\n\n`));

// Broadcast notification
controller.enqueue(encoder.encode(`event: notification\ndata: ${data}\n\n`));
```

- [ ] **Step 2: Update client to use addEventListener**

```ts
const eventSource = new EventSource('/api/notifications/sse');

eventSource.addEventListener('connected', (e) => {
  console.log('Connected:', JSON.parse(e.data));
});

eventSource.addEventListener('notification', (e) => {
  const data = JSON.parse(e.data);
  // Handle notification
});
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): use named events for better client event handling

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: SSE — Consistent JSON 401 response (S-9)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts`

- [ ] **Step 1: Fix GET 401 response**

Find:
```ts
return new Response('Unauthorized', { status: 401 });
```

Replace with:
```ts
return new Response(JSON.stringify({ error: 'Unauthorized' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): return JSON for all auth failure responses

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Queries — Fix doctorId type cast (L-8)

**Files:**
- Modify: `src/db/queries.ts:350`

- [ ] **Step 1: Add UUID validation**

Find:
```ts
if (opts.doctorId) conditions.push(eq(patientEnquiries.doctorId, opts.doctorId as any));
```

Replace with:
```ts
if (opts.doctorId) {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(opts.doctorId)) {
    conditions.push(eq(patientEnquiries.doctorId, opts.doctorId));
  }
  // Invalid format silently ignored - no results will match
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db/queries.ts
git commit -m "fix(queries): validate UUID format instead of using as any

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Verification Steps

After all tasks complete, verify:

1. **Build succeeds** with no type errors
2. **Error responses** include correlation IDs in dev mode
3. **sourceUrl validation** rejects invalid URLs

Run full build:
```bash
npm run build
```

Run tests:
```bash
npm run test
```