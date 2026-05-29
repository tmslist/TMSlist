# Portal Audit Fixes — Phase 3: Edge Cases & UX

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix P1 edge cases in Portal Billing, add missing validation, and add cron job for expired claims cleanup.

**Architecture:** Phase 3 focuses on financial integrity, cache invalidation, and data lifecycle management.

**Tech Stack:** Astro API routes, React components, Stripe/Razorpay SDKs

---

## File Map

| File | Changes |
|------|---------|
| `src/pages/api/payments/portal.ts` | B-1, B-2, B-3 |
| `src/components/react/PortalBilling.tsx` | B-4, B-5, B-6 |
| `src/pages/api/portal/claim.ts` | C-6, C-9, C-10 |
| `src/pages/cron/cleanup.ts` | (new) |

---

## Task 1: Billing — Track canceling state before provider calls (B-1)

**Files:**
- Modify: `src/pages/api/payments/portal.ts:59-89`

- [ ] **Step 1: Add idempotency guard with canceling state**

Find the cancel action:
```ts
if (body.action === 'cancel') {
  const sub = await getClinicSubscription(clinicId);
  if (!sub) {
    return new Response(JSON.stringify({ error: 'No active subscription' }), { status: 400, ... });
  }

  // Cancel at provider(s) and track each result
  const results: { razorpay?: string; stripe?: string } = {};
  let overallSuccess = true;

  if (sub.razorpaySubscriptionId) {
    try {
      await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
      results.razorpay = 'canceled';
    } catch (err) {
      results.razorpay = 'failed';
      overallSuccess = false;
    }
  }
  // ... similar for stripe
}
```

Replace with:
```ts
if (body.action === 'cancel') {
  const sub = await getClinicSubscription(clinicId);
  if (!sub) {
    return new Response(JSON.stringify({ error: 'No active subscription' }), { status: 400, ... });
  }

  // Idempotency: Check if already in canceling or canceled state
  if (sub.status === 'canceling' || sub.status === 'canceled') {
    return new Response(JSON.stringify({
      success: true,
      status: sub.status,
      message: 'Subscription is already being canceled or has been canceled'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Set intermediate "canceling" state BEFORE making provider calls
  // This prevents double-cancellation on retry
  await db.update(subscriptions)
    .set({ status: 'canceling' })
    .where(eq(subscriptions.clinicId, clinicId));

  // Cancel at provider(s) and track each result
  const results: { razorpay?: string; stripe?: string } = {};
  let overallSuccess = true;

  if (sub.razorpaySubscriptionId) {
    try {
      await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
      results.razorpay = 'canceled';
    } catch (err) {
      console.error('[payments] Razorpay cancel failed:', err);
      results.razorpay = 'failed';
      overallSuccess = false;
    }
  }

  if (sub.stripeSubscriptionId) {
    try {
      await cancelSubscription(sub.stripeSubscriptionId);
      results.stripe = 'canceled';
    } catch (err) {
      console.error('[payments] Stripe cancel failed:', err);
      results.stripe = 'failed';
      overallSuccess = false;
    }
  }

  // Final state update
  await db.update(subscriptions)
    .set({ status: overallSuccess ? 'canceled' : sub.status })
    .where(eq(subscriptions.clinicId, clinicId));

  if (!overallSuccess) {
    return new Response(JSON.stringify({
      error: 'One or more cancellations failed. Please contact support.',
      details: results,
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/payments/portal.ts
git commit -m "fix(billing): add canceling state for idempotency guard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Billing — Update DB after each provider call (B-2)

**Files:**
- Modify: `src/pages/api/payments/portal.ts`

- [ ] **Step 1: Track partial cancellation state**

The code in Task 1 already updates to 'canceled' or reverts on failure. Ensure the intermediate state is tracked properly:

After each provider call, update the DB to reflect what we know:
```ts
// After Razorpay call
if (sub.razorpaySubscriptionId) {
  try {
    await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
    results.razorpay = 'canceled';
  } catch (err) {
    results.razorpay = 'failed';
    overallSuccess = false;
  }
  // Record what we know so far
  await db.update(subscriptions)
    .set({
      status: overallSuccess ? 'canceled' : 'partially_canceled',
      metadata: { ...sub.metadata, cancellationProgress: results }
    })
    .where(eq(subscriptions.clinicId, clinicId));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/payments/portal.ts
git commit -m "fix(billing): track partial cancellation state per provider

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Billing — Add audit log for cancellations (B-3)

**Files:**
- Modify: `src/pages/api/payments/portal.ts`
- Check: `src/db/queries.ts` for `logAuthEvent`

- [ ] **Step 1: Check if logAuthEvent exists**

```bash
grep -n "logAuthEvent" src/db/queries.ts src/utils/auth.ts
```

If exists, use it. If not, create a simple audit log function.

- [ ] **Step 2: Add audit logging**

After the cancel block (before returning), add:
```ts
// Audit log for financial operation
try {
  await logAuthEvent({
    action: 'subscription_cancel_attempted',
    userId: session.userId,
    clinicId,
    metadata: {
      razorpayResult: results.razorpay,
      stripeResult: results.stripe,
      overallSuccess,
      subscriptionId: sub.stripeSubscriptionId || sub.razorpaySubscriptionId,
    },
  });
} catch (auditErr) {
  // Don't fail the cancellation if audit logging fails
  console.error('[billing] Audit log failed:', auditErr);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/payments/portal.ts
git commit -m "fix(billing): add audit log for subscription cancellations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Billing — Invalidate query before redirect (B-4)

**Files:**
- Modify: `src/components/react/PortalBilling.tsx`

- [ ] **Step 1: Invalidate query in onSuccess before redirect**

Find upgradeSubscription mutation:
```ts
const upgradeSubscription = useMutation({
  mutationFn: async () => {
    // ... fetch to checkout
    return res.json();
  },
  onSuccess: (data) => {
    window.location.href = data.checkoutUrl;
  },
});
```

Replace with:
```ts
const upgradeSubscription = useMutation({
  mutationFn: async () => {
    // ... fetch to checkout
    return res.json();
  },
  onSuccess: async (data) => {
    // Invalidate subscription query BEFORE redirect
    // This ensures fresh data on return
    await queryClient.invalidateQueries({ queryKey: queryKeys.portal.subscription() });
    window.location.href = data.checkoutUrl;
  },
});
```

- [ ] **Step 2: Fix date parsing validation**

Find line ~225:
```ts
new Date(subscription.currentPeriodEnd).toLocaleDateString(...)
```

Replace with:
```ts
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Use: formatDate(subscription.currentPeriodEnd)
```

- [ ] **Step 3: Commit**

```bash
git add src/components/react/PortalBilling.tsx
git commit -m "fix(billing): invalidate query before redirect, validate date parsing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Portal Claim — Add rate limiting (C-6)

**Files:**
- Modify: `src/pages/api/portal/claim.ts`

- [ ] **Step 1: Add rate limiting to claim endpoint**

Check if rate limit utility exists:
```bash
grep -n "checkRateLimit" src/utils/rateLimit.ts
```

Add at the start of POST handler:
```ts
export const POST: APIRoute = async ({ request }) => {
  // Apply rate limiting for claim submissions
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;
  // ... rest of handler
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/claim.ts
git commit -m "fix(claim): add rate limiting to prevent abuse

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Portal Claim — Add cron to clean expired claims (C-9)

**Files:**
- Create: `src/pages/cron/cleanup.ts`

- [ ] **Step 1: Create cleanup cron endpoint**

```ts
import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinicClaims } from '../../../db/schema';
import { eq, lt, and } from 'drizzle-orm';
import { validateCronSecret } from '../../../utils/auth';

export const prerender = false;

// Clean up expired pending claims (older than 7 days)
export const GET: APIRoute = async ({ request }) => {
  // Validate cron secret for security
  const authError = await validateCronSecret(request);
  if (authError) return authError;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Delete expired pending claims
    const result = await db.delete(clinicClaims)
      .where(and(
        eq(clinicClaims.status, 'pending'),
        lt(clinicClaims.createdAt, sevenDaysAgo)
      ));

    return new Response(JSON.stringify({
      success: true,
      deletedCount: result.rowCount || 0,
      cleanedBefore: sevenDaysAgo.toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[cron] Cleanup expired claims failed:', err);
    return new Response(JSON.stringify({ error: 'Cleanup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2: Add validateCronSecret to auth utils**

If not exists in `src/utils/auth.ts`:
```ts
export async function validateCronSecret(request: Request): Promise<Response | null> {
  const secret = request.headers.get('x-cron-secret');
  const expectedSecret = import.meta.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn('[cron] CRON_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Cron not configured' }), { status: 500 });
  }

  if (secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  return null; // Valid
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/cron/cleanup.ts src/utils/auth.ts
git commit -m "feat(claim): add cron endpoint to clean expired pending claims

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Portal Claim — Return 400 for short queries (C-10)

**Files:**
- Modify: `src/pages/api/portal/claim.ts:21-24`

- [ ] **Step 1: Return proper validation error**

Find:
```ts
if (!query || query.length < 2) {
  return new Response(JSON.stringify({ clinics: [] }), { status: 200, ... });
}
```

Replace with:
```ts
if (!query || query.length < 2) {
  return new Response(JSON.stringify({
    error: 'Search query must be at least 2 characters',
    clinics: []
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/claim.ts
git commit -m "fix(claim): return 400 for short search queries

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Verification Steps

After all tasks complete, verify:

1. **Billing:**
   - Cancel subscription → status shows "canceling" immediately
   - Cancel again mid-canceling → returns idempotent response
   - Upgrade → return to page → fresh data shown

2. **Claims:**
   - Submit search with 1 char → 400 error shown
   - Cron cleanup → expired claims removed
   - Multiple rapid claims → rate limited

Run tests:
```bash
npm run test
```

Test cron endpoint:
```bash
curl -H "x-cron-secret: $CRON_SECRET" /api/cron/cleanup
```