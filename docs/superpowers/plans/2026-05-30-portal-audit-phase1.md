# Portal Audit Fixes — Phase 1: Data Integrity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix P0 data integrity issues in Leads API, Portal Claim, and Portal Onboarding

**Architecture:** Each component fixed independently with minimal changes. Phase 1 focuses on preventing silent data loss and ensuring email failures are surfaced.

**Tech Stack:** Astro API routes, React components, Drizzle ORM, Resend email

---

## File Map

| File | Changes |
|------|---------|
| `src/pages/api/leads/index.ts` | L-1, L-2, L-3 |
| `src/pages/api/leads/appointment.ts` | L-1, L-2, L-3, L-4, L-5 |
| `src/pages/api/portal/claim.ts` | C-1, C-2, C-3, C-9, C-10 |
| `src/components/react/PortalClaimClinic.tsx` | C-4, C-5 |
| `src/pages/api/portal/onboarding.ts` | O-3 |
| `src/components/react/PortalOnboardingWizard.tsx` | O-1, O-2 |

---

## Task 1: Leads API — Assert returning() rows (L-1)

**Files:**
- Modify: `src/pages/api/leads/index.ts:74`
- Modify: `src/pages/api/leads/appointment.ts:117`

- [ ] **Step 1: Add assertion after lead insert in index.ts**

Locate the line `return new Response(JSON.stringify({ success: true, id: lead?.id }), ...)`

Replace with:
```ts
// Assert that the insert returned rows
if (!lead || lead.length === 0) {
  console.error('[leads] Insert returned no rows');
  return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
const leadId = lead[0].id;
return new Response(JSON.stringify({ success: true, id: leadId }), {
  status: 201,
  headers: { 'Content-Type': 'application/json' },
});
```

- [ ] **Step 2: Add assertion after lead insert in appointment.ts**

Locate line ~117 with `lead[0]?.id`

Replace with:
```ts
if (!lead || lead.length === 0) {
  console.error('[leads:appointment] Insert returned no rows');
  return new Response(JSON.stringify({ error: 'Failed to create appointment' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
const leadId = lead[0].id;
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/leads/index.ts src/pages/api/leads/appointment.ts
git commit -m "fix(leads): assert returning() rows to prevent silent id loss

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Leads API — Log email failures to emailLogs (L-2)

**Files:**
- Modify: `src/pages/api/leads/index.ts:51-72`
- Modify: `src/pages/api/leads/appointment.ts:107-115`

- [ ] **Step 1: Check if logEmailSent exists in queries**

```bash
grep -n "logEmailSent" src/db/queries.ts
```

If not found, check for emailLogs table operations. If no logging exists, use console.error with structured data instead.

- [ ] **Step 2: Update sendLeadNotification catch in index.ts**

Find line ~61:
```ts
}).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));
```

Replace with:
```ts
}).catch(async (err) => {
  console.error('[email] sendLeadNotification failed:', {
    error: err?.message,
    patientEmail: data.email,
    clinicName: data.clinicName,
    leadId: lead?.[0]?.id,
  });
  // Fire-and-forget - do not block response
});
```

- [ ] **Step 3: Update sendPatientConfirmation catch in index.ts**

Find line ~71:
```ts
}).catch((err) => console.error("[bg-task] Autoresponder failed:", err?.message));
```

Replace with:
```ts
}).catch(async (err) => {
  console.error('[email] sendPatientConfirmation failed:', {
    error: err?.message,
    to: data.email,
    leadId: lead?.[0]?.id,
  });
});
```

- [ ] **Step 4: Update appointment.ts email catches similarly**

Apply same pattern to appointment.ts lines ~107 and ~115.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/leads/index.ts src/pages/api/leads/appointment.ts
git commit -m "fix(leads): log email failures with structured context

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Leads API — Don't HTML-escape sourceUrl (L-3)

**Files:**
- Modify: `src/pages/api/leads/index.ts:45`
- Modify: `src/pages/api/leads/appointment.ts:66,99`

- [ ] **Step 1: Remove escapeHtml from sourceUrl in index.ts**

Find line ~45:
```ts
sourceUrl: parsed.data.sourceUrl ? escapeHtml(parsed.data.sourceUrl) : undefined,
```

Replace with:
```ts
sourceUrl: parsed.data.sourceUrl || undefined,
```

- [ ] **Step 2: Remove escapeHtml from sourceUrl in appointment.ts**

Find lines ~66 and ~99, same pattern. Remove `escapeHtml()` wrapper.

- [ ] **Step 3: Verify email template handles raw URLs**

Check `src/utils/email.ts` for sourceUrl rendering. Ensure href uses raw URL and displayed text uses escapeHtml:

```ts
// Should be like:
`<a href="${data.sourceUrl}" ...>${escapeHtml(data.sourceUrl)}</a>`
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/leads/index.ts src/pages/api/leads/appointment.ts
git commit -m "fix(leads): store raw sourceUrl, escape only for text display

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Leads API — Validate clinicId and escape LIKE wildcards (L-4, L-5)

**Files:**
- Modify: `src/pages/api/leads/appointment.ts:80-85`
- Modify: `src/db/queries.ts:353-357`

- [ ] **Step 1: Add clinic existence validation in appointment.ts**

Find the clinic lookup at ~80:
```ts
const [clinicRow] = await db
  .select({ email: clinics.email })
  .from(clinics)
  .where(eq(clinics.id, data.clinicId))
  .limit(1);
```

Replace with:
```ts
const [clinicRow] = await db
  .select({ email: clinics.email })
  .from(clinics)
  .where(and(
    eq(clinics.id, data.clinicId),
    eq(clinics.active, true)  // If clinics has active flag
  ))
  .limit(1);

// Validate clinic exists and has email
if (!clinicRow?.email) {
  return new Response(JSON.stringify({ error: 'Invalid or inactive clinic' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

If `clinics.active` doesn't exist, just check for email:
```ts
if (!clinicRow?.email) {
  return new Response(JSON.stringify({ error: 'Clinic not found' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Escape LIKE wildcards in queries.ts**

Find lines ~353-357 in getPatientEnquiry:
```ts
conditions.push(sql`(
  ${patientEnquiries.name} ILIKE ${'%' + opts.search + '%'} OR
  ${patientEnquiries.email} ILIKE ${'%' + opts.search + '%'} OR
  ${doctors.name} ILIKE ${'%' + opts.search + '%'}
)`);
```

Replace with:
```ts
// Escape LIKE metacharacters
function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}

conditions.push(sql`(
  ${patientEnquiries.name} ILIKE ${'%' + escapeLike(opts.search) + '%'} ESCAPE '\\' OR
  ${patientEnquiries.email} ILIKE ${'%' + escapeLike(opts.search) + '%'} ESCAPE '\\' OR
  ${doctors.name} ILIKE ${'%' + escapeLike(opts.search) + '%'} ESCAPE '\\'
)`);
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/leads/appointment.ts src/db/queries.ts
git commit -m "fix(leads): validate clinic exists, escape LIKE wildcards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Portal Claim — Check email result and throw (C-1)

**Files:**
- Modify: `src/pages/api/portal/claim.ts:118-130`

- [ ] **Step 1: Find and fix email result check**

Locate around line 118:
```ts
await sendClaimVerificationEmail({
  clinicName: clinic.name,
  clinicEmail: clinic.email,
  claimId: claim.id,
  token,
  expiresAt,
  userEmail: session.email,
});
// ... later catch block
} catch (err) {
```

Replace with:
```ts
const emailResult = await sendClaimVerificationEmail({
  clinicName: clinic.name,
  clinicEmail: clinic.email,
  claimId: claim.id,
  token,
  expiresAt,
  userEmail: session.email,
});

// If email delivery failed, throw so user sees error
if (!emailResult) {
  console.error('[claim] Email delivery failed for claim', claim.id);
  return new Response(JSON.stringify({ error: 'Failed to send verification email' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/claim.ts
git commit -m "fix(claim): check email result and return error if delivery fails

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Portal Claim — Prevent duplicate pending claims (C-2)

**Files:**
- Modify: `src/pages/api/portal/claim.ts:106-115`

- [ ] **Step 1: Add duplicate check before insert**

Find the insert section around line 108:
```ts
const [newClaim] = await db.insert(clinicClaims).values({
```

Add this check right before the insert:
```ts
// Check for existing pending claim
const [existingClaim] = await db
  .select({ id: clinicClaims.id })
  .from(clinicClaims)
  .where(and(
    eq(clinicClaims.clinicId, clinic.id),
    eq(clinicClaims.userId, session.userId),
    eq(clinicClaims.status, 'pending')
  ))
  .limit(1);

if (existingClaim) {
  return new Response(JSON.stringify({ error: 'A claim request is already pending for this clinic' }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/claim.ts
git commit -m "fix(claim): prevent duplicate pending claims with uniqueness check

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Portal Claim — Add Content-Type to error responses (C-3)

**Files:**
- Modify: `src/pages/api/portal/claim.ts:14, 49`

- [ ] **Step 1: Fix 401 response**

Find line 14:
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

- [ ] **Step 2: Fix search error response**

Find line 49:
```ts
return new Response(JSON.stringify({ error: 'Failed to search clinics' }), { status: 500 });
```

Replace with:
```ts
return new Response(JSON.stringify({ error: 'Failed to search clinics' }), {
  status: 500,
  headers: { 'Content-Type': 'application/json' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/portal/claim.ts
git commit -m "fix(claim): add Content-Type header to all JSON error responses

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Portal Claim — Fix useState → useEffect (C-4)

**Files:**
- Modify: `src/components/react/PortalClaimClinic.tsx:22-32`

- [ ] **Step 1: Replace useState with useEffect**

Find:
```tsx
useState(() => {
  fetch('/api/portal/dashboard')
    .then(...)
    .catch(() => { /* Continue normally */ });
});
```

Replace with:
```tsx
import { useState, useEffect } from 'react';

useEffect(() => {
  fetch('/api/portal/dashboard')
    .then(res => {
      if (res.status === 401) {
        window.location.href = '/portal/login/';
        return;
      }
      if (!res.ok) return;
      return res.json();
    })
    .then(data => {
      if (data?.needsClaim === false && data?.clinic) {
        window.location.href = '/portal/dashboard/';
      }
    })
    .catch(() => { /* Continue normally */ });
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalClaimClinic.tsx
git commit -m "fix(claim): use useEffect for mount-side-effect instead of useState

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Portal Claim — Use alreadyClaimed flag (C-5)

**Files:**
- Modify: `src/components/react/PortalClaimClinic.tsx:69-90`

- [ ] **Step 1: Update response handling**

Find the error handling that uses string matching:
```tsx
.catch(err => {
  if (status === 'error' && error.includes('already have a clinic')) {
    setAlreadyClaimed(true);
    return;
  }
  setError(error || 'Failed to submit claim');
});
```

Replace with checking for the explicit `alreadyClaimed` field:
```tsx
.then(data => {
  if (data.alreadyClaimed) {
    setAlreadyClaimed(true);
    return;
  }
  // ... rest of success handling
})
.catch(err => {
  setError(error || 'Failed to submit claim');
});
```

Also update the API to return `alreadyClaimed: true` instead of error string:
In claim.ts, update the already-claimed response:
```ts
return new Response(JSON.stringify({
  error: 'You already have a clinic',
  alreadyClaimed: true,
}), { status: 400, headers: { 'Content-Type': 'application/json' } });
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/claim.ts src/components/react/PortalClaimClinic.tsx
git commit -m "fix(claim): use explicit alreadyClaimed flag instead of string parsing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Portal Onboarding — Check fetch response (O-1)

**Files:**
- Modify: `src/components/react/PortalOnboardingWizard.tsx:150-164`

- [ ] **Step 1: Check response before calling onComplete**

Find the completeOnboarding function and update:
```tsx
const completeOnboarding = async () => {
  setSaving(true);
  try {
    const res = await fetch('/api/portal/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });

    if (!res.ok) {
      setError('Failed to complete onboarding. Please try again.');
      setSaving(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.portal.dashboard() });
    onComplete?.();
  } catch {
    setError('Network error. Please check your connection.');
  } finally {
    setSaving(false);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalOnboardingWizard.tsx
git commit -m "fix(onboarding): check fetch response before completing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Portal Onboarding — Map formData to availability/pricing (O-2)

**Files:**
- Modify: `src/components/react/PortalOnboardingWizard.tsx:80-100`

- [ ] **Step 1: Map flat fields to nested schema format**

Find where formData is sent to the API:
```tsx
const data = {
  ...formData,
  onboarding: true,
};
```

Replace with:
```tsx
const data = {
  // Copy non-availability/pricing fields directly
  name: formData.name,
  description: formData.description,
  phone: formData.phone,
  website: formData.website,
  email: formData.email,
  city: formData.city,
  state: formData.state,

  // Map flat fields to nested availability object
  availability: {
    accepting_new_patients: formData.accepting_new_patients ?? true,
    same_week_available: formData.same_week_available ?? false,
    evening_hours: formData.evening_hours ?? false,
    weekend_hours: formData.weekend_hours ?? false,
    home_visits: formData.home_visits ?? false,
  },

  // Map flat fields to nested pricing object
  pricing: {
    price_range: formData.price_range || 'moderate',
    session_price_min: formData.session_price_min || null,
    session_price_max: formData.session_price_max || null,
    free_consultation: formData.free_consultation ?? false,
    accepts_insurance: formData.accepts_insurance ?? false,
  },

  onboarding: true,
};
```

Also update formData interface to have `availability` and `pricing` as optional nested objects for loading existing data.

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalOnboardingWizard.tsx
git commit -m "fix(onboarding): map formData to availability/pricing schema format

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Portal Onboarding — Add role check to API (O-3)

**Files:**
- Modify: `src/pages/api/portal/onboarding.ts:9-15`

- [ ] **Step 1: Add role validation**

Find the auth check:
```ts
const session = await validateSessionStrict(request);
if (!session) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... });
}
// No role check
```

Replace with:
```ts
const session = await validateSessionStrict(request);
if (!session) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Only clinic owners or admins can complete onboarding
if (session.role !== 'clinic_owner' && session.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/onboarding.ts
git commit -m "fix(onboarding): add role check to prevent unauthorized completion

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Verification Steps

After all tasks complete, verify:

1. **Leads API:**
   - Submit lead with no return from DB → 500 with error
   - Submit lead with valid email → check console logs email failure
   - Submit lead with `sourceUrl?foo=1` → URL should not be escaped

2. **Portal Claim:**
   - Submit claim for same clinic twice → second returns 409
   - Access claim page → no Content-Type errors in console
   - Navigate away mid-claim → no double-submit

3. **Portal Onboarding:**
   - Complete onboarding with network failure → error shown, no redirect
   - Save wizard → availability/pricing fields persisted in DB

Run tests:
```bash
npm run test
```

Run type check:
```bash
npm run build  # Quick type check
```