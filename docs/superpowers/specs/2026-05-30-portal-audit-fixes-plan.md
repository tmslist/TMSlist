# Portal Subsystems Audit — Implementation Plan
**Date:** 2026-05-30
**Status:** Draft
**Audits:** SSE, Claims, Leads, Onboarding, Clinic Editor, Billing

---

## 1. Overview

Six portal subsystems were audited. This plan prioritizes fixes by severity and groups by component. All changes are backwards-compatible unless noted.

**Severity Scale:**
- **P0 (Critical):** Data loss, security vulnerability, or broken core flow
- **P1 (High):** Silent failures, inconsistent state, missing functionality
- **P2 (Medium):** Edge cases, UX improvements, code quality

---

## 2. Priority Matrix

| Component | P0 | P1 | P2 | Est. Time |
|-----------|----|----|----|----|
| Notifications SSE | 4 | 3 | 3 | 3 hrs |
| Leads API | 3 | 3 | 2 | 2 hrs |
| Portal Claim | 4 | 2 | 2 | 2.5 hrs |
| Portal Clinic Editor | 2 | 3 | 3 | 2 hrs |
| Portal Onboarding | 2 | 2 | 2 | 1.5 hrs |
| Portal Billing | 1 | 3 | 4 | 2 hrs |
| **Total** | **16** | **15** | **16** | **~13 hrs** |

---

## 3. Implementation Order

### Phase 1: Data Integrity (P0 blockers)

#### 1.1 Leads API — Fix silent data loss
**Files:** `src/pages/api/leads/index.ts`, `src/pages/api/leads/appointment.ts`

| # | Fix | Detail |
|---|-----|--------|
| L-1 | Assert `returning()` rows | Throw if insert returns empty array |
| L-2 | Log email failures to `emailLogs` | Use `logEmailSent` on catch |
| L-3 | Don't HTML-escape `sourceUrl` | Store raw, escape only for text display |
| L-4 | Validate `clinicId` exists | Reject if clinic not found or inactive |
| L-5 | Escape LIKE wildcards in search | Escape `%`, `_`, `\` before ILIKE |

```ts
// L-1: After insert, assert rows returned
const lead = await db.insert(leads).returning();
if (!lead || lead.length === 0) {
  throw new Error('Lead insert returned no rows');
}
```

```ts
// L-3: sourceUrl handling
sourceUrl: parsed.data.sourceUrl, // Store raw URL
// In email template: ${escapeHtml(data.sourceUrl)} for text, raw for href
```

#### 1.2 Portal Claim — Fix race condition + silent failure
**Files:** `src/pages/api/portal/claim.ts`, `src/components/react/PortalClaimClinic.tsx`

| # | Fix | Detail |
|---|-----|--------|
| C-1 | Check email result and throw | If `sendClaimVerificationEmail` returns null, throw |
| C-2 | Add pending claim uniqueness | Query for existing pending before insert |
| C-3 | Add `Content-Type` to error responses | Lines 14, 49 |
| C-4 | Fix `useState` → `useEffect` | For dashboard fetch on mount |
| C-5 | Use `alreadyClaimed` flag | Don't parse error strings |

```ts
// C-1: Check email delivery
const emailResult = await sendClaimVerificationEmail({ ... });
if (!emailResult) throw new Error('Email delivery failed');
```

```ts
// C-2: Prevent duplicate pending claims
const existing = await db.select().from(clinicClaims)
  .where(and(
    eq(clinicClaims.clinicId, clinic.id),
    eq(clinicClaims.userId, session.userId),
    eq(clinicClaims.status, 'pending')
  )).limit(1);
if (existing[0]) {
  return new Response(JSON.stringify({ error: 'Claim already pending' }), { status: 409 });
}
```

#### 1.3 Portal Onboarding — Fix data loss + silent failure
**Files:** `src/pages/api/portal/onboarding.ts`, `src/components/react/PortalOnboardingWizard.tsx`

| # | Fix | Detail |
|---|-----|--------|
| O-1 | Check fetch response before `onComplete()` | Await + `res.ok` check |
| O-2 | Map formData to `availability`/`pricing` | Flat fields → nested objects |
| O-3 | Add role check to API | Restrict to `clinic_owner`/`admin` |
| O-4 | Add per-step validation | Block `nextStep()` until required fields filled |
| O-5 | Keep error state until next success | Don't clear error immediately |

```ts
// O-1: Check response before completing
const res = await fetch('/api/portal/onboarding', { ... });
if (!res.ok) {
  setError('Failed to complete onboarding');
  return;
}
onComplete?.();
```

```ts
// O-2: Map formData to schema format
const mapped = {
  ...data,
  availability: {
    accepting_new_patients: data.accepting_new_patients,
    same_week_available: data.same_week_available,
    evening_hours: data.evening_hours,
    weekend_hours: data.weekend_hours,
    home_visits: data.home_visits,
  },
  pricing: {
    price_range: data.price_range,
    session_price_min: data.session_price_min,
    session_price_max: data.session_price_max,
    free_consultation: data.free_consultation,
    accepts_insurance: data.accepts_insurance,
  },
};
```

---

### Phase 2: Memory & State Management (P0)

#### 2.1 Notifications SSE — Fix memory leaks
**File:** `src/pages/api/notifications/sse.ts`

| # | Fix | Detail |
|---|-----|--------|
| S-1 | Remove controller in `cancel()` | `userConnections.delete(controller)` |
| S-2 | Move `clearInterval` into `cancel()` | Not in `.then()` chain |
| S-3 | Collect dead controllers before delete | Fix race condition in iteration |
| S-4 | Wire up `broadcastNotification` | Document limitation + add SSE_ENABLED flag |
| S-5 | Add per-user connection limit | Cap at 3 connections |
| S-6 | Implement POST markRead | Use `notifications-list.ts` pattern |
| S-7 | Add rate limiting | 20 req/min for GET, 10 req/min for POST |

```ts
// S-1 + S-2: Correct cancel cleanup
const heartbeatInterval = setInterval(() => { ... }, 30000);

const stream = new ReadableStream({
  start(controller) { ... },
  cancel() {
    clearInterval(heartbeatInterval); // Direct, not .then()
    userConnections.delete(controller);
  },
});
```

```ts
// S-3: Safe iteration with deferred deletion
const dead: ReadableStreamDefaultController[] = [];
for (const controller of userConnections) {
  try {
    controller.enqueue(encoder.encode(chunk));
  } catch {
    dead.push(controller);
  }
}
dead.forEach(c => userConnections.delete(c));
```

#### 2.2 Portal Clinic Editor — Fix stale closure + inconsistent status
**Files:** `src/pages/api/portal/clinic.ts`, `src/components/react/PortalClinicEditor.tsx`

| # | Fix | Detail |
|---|-----|--------|
| E-1 | Match 403 → 404 for "no clinic" | Consistent with GET endpoint |
| E-2 | Pass snapshot to `handleSave` | Avoid stale closure in debounce |
| E-3 | Fix `updateMedia` null handling | `{ ...(clinic.media ?? {}) }` |
| E-4 | Add role check | `clinic_owner` or `admin` only |
| E-5 | Detect no-op updates | Return `{ success: true, noop: true }` |
| E-6 | Add `home_visits` checkbox | Or remove from type |

```ts
// E-2: Pass snapshot to handleSave
saveTimeoutRef.current = setTimeout(() => {
  handleSave(true, clinic); // Pass current snapshot
}, 3000);

// handleSave signature
async function handleSave(isAutoSave = false, snapshot?: ClinicData) {
  const data = snapshot ?? clinic;
  ...
}
```

---

### Phase 3: Edge Cases & UX (P1)

#### 3.1 Portal Billing — Fix partial cancellation + stale cache
**Files:** `src/pages/api/payments/portal.ts`, `src/components/react/PortalBilling.tsx`

| # | Fix | Detail |
|---|-----|--------|
| B-1 | Track `canceling` state before provider calls | Idempotency guard |
| B-2 | Update DB after each provider call | Don't leave partial state |
| B-3 | Add audit log | `logAuthEvent` for cancellation |
| B-4 | Invalidate query before redirect | Fix success banner |
| B-5 | Validate date parsing | Handle `Invalid Date` |
| B-6 | Add `billingCurrency` display | Or remove from type |

```ts
// B-4: Invalidate before redirect
onSuccess: async (data) => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.portal.subscription() });
  window.location.href = data.checkoutUrl;
}
```

#### 3.2 Portal Claim — Additional hardening
**Files:** `src/pages/api/portal/claim.ts`

| # | Fix | Detail |
|---|-----|--------|
| C-6 | Add rate limiting | 10 POST/min per user |
| C-7 | Make `userId` notNull in schema | Add migration |
| C-8 | Validate `price_range` enum | Prevent invalid values |
| C-9 | Add cron to clean expired claims | Or check in verification |
| C-10 | Return 400 for short queries | "Enter at least 2 characters" |

---

### Phase 4: Code Quality (P2)

#### 4.1 Leads API
| # | Fix |
|---|-----|
| L-6 | Strip `err.message` from 500 response in production |
| L-7 | Validate `sourceUrl` as URL with Zod |

#### 4.2 Portal Clinic Editor
| # | Fix |
|---|-----|
| E-7 | Remove redundant `updatedAt` assignment (schema has `$onUpdate`) |
| E-8 | Add URL validation for media fields |
| E-9 | Return correlation IDs for machine-readable errors |

#### 4.3 Portal Onboarding
| # | Fix |
|---|-----|
| O-6 | Add Zod validation for request body |
| O-7 | Add request body size limit |

#### 4.4 Notifications SSE
| # | Fix |
|---|-----|
| S-8 | Use named events (`event: notification\n`) |
| S-9 | Consistent JSON 401 response body |

---

## 4. Testing Strategy

### Unit Tests
- `sse.ts`: Connection lifecycle, broadcast, race conditions
- `claim.ts`: Duplicate prevention, email failure handling
- `clinic.ts`: Empty update, role validation

### Integration Tests
- Full claim flow with duplicate prevention
- Onboarding → dashboard redirect
- Billing cancel → success banner

### E2E (Playwright)
- Portal signup → onboarding → dashboard
- Lead submission → email verification
- Billing upgrade → success state

---

## 5. Migration Notes

### Schema Changes
```sql
-- Make clinicClaims.userId not null (after data cleanup)
ALTER TABLE clinic_claims
  ALTER COLUMN user_id SET NOT NULL;

-- Add partial unique index for pending claims
CREATE UNIQUE INDEX idx_clinic_claims_pending_unique
  ON clinic_claims (clinic_id, user_id)
  WHERE status = 'pending';

-- Add subscription audit log table
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  provider TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Feature Flags
```env
SSE_ENABLED=false  # Disable until Redis adapter is implemented
```

---

## 6. Rollout Order

1. **Leads API fixes** (L-1 through L-5) — Data integrity
2. **Portal Claim fixes** (C-1 through C-5) — Core flow
3. **Portal Onboarding fixes** (O-1 through O-3) — Data integrity
4. **SSE memory leaks** (S-1 through S-3) — Stability
5. **Clinic Editor fixes** (E-1 through E-4) — Core flow
6. **Billing fixes** (B-1 through B-3) — Financial integrity
7. **Remaining P1/P2 fixes** — Polish

---

## 7. Files Modified

| File | Changes |
|------|---------|
| `src/pages/api/leads/index.ts` | L-1, L-2, L-3, L-6 |
| `src/pages/api/leads/appointment.ts` | L-1, L-2, L-3, L-4, L-5 |
| `src/pages/api/portal/claim.ts` | C-1, C-2, C-3, C-6, C-9, C-10 |
| `src/components/react/PortalClaimClinic.tsx` | C-4, C-5 |
| `src/pages/api/portal/onboarding.ts` | O-3, O-6, O-7 |
| `src/components/react/PortalOnboardingWizard.tsx` | O-1, O-2, O-4, O-5 |
| `src/pages/api/notifications/sse.ts` | S-1, S-2, S-3, S-4, S-5, S-6, S-7, S-8, S-9 |
| `src/pages/api/portal/clinic.ts` | E-1, E-4, E-5, E-9 |
| `src/components/react/PortalClinicEditor.tsx` | E-2, E-3, E-6, E-7, E-8 |
| `src/pages/api/payments/portal.ts` | B-1, B-2, B-3 |
| `src/components/react/PortalBilling.tsx` | B-4, B-5, B-6 |
| `src/db/schema.ts` | C-7 (optional) |

---

## 8. Success Criteria

- [ ] No silent data loss in lead submission
- [ ] No memory leaks in SSE connections
- [ ] No duplicate pending claims possible
- [ ] Billing cancellations are idempotent and logged
- [ ] All error responses return JSON with proper Content-Type
- [ ] Auto-save uses current state, not stale closure
- [ ] Onboarding completion waits for API confirmation