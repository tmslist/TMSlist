# Portal Audit Fixes — Phase 2: Memory & State Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix P0 memory leaks in SSE, and state management bugs in Clinic Editor

**Architecture:** Phase 2 focuses on connection lifecycle management in SSE and proper state handling in auto-save debounce logic.

**Tech Stack:** Astro API routes, React components, ReadableStream SSE

---

## File Map

| File | Changes |
|------|---------|
| `src/pages/api/notifications/sse.ts` | S-1, S-2, S-3, S-4, S-5, S-6, S-7 |
| `src/pages/api/portal/clinic.ts` | E-1, E-4, E-5 |
| `src/components/react/PortalClinicEditor.tsx` | E-2, E-3, E-6, E-8 |

---

## Task 1: SSE — Fix memory leak: cancel() never removes controller (S-1)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts:78-91`

- [ ] **Step 1: Add controller deletion in cancel()**

Find the cancel callback:
```ts
cancel() {
  const userConnections = connections.get(userId);
  if (userConnections) {
    for (const controller of userConnections) {
      try {
        // Controller will be cleaned up by the stream
      } catch {
        // Already cleaned up
      }
    }
  }
}
```

Replace with:
```ts
cancel() {
  const userConnections = connections.get(userId);
  if (userConnections) {
    // Find and remove this specific controller
    for (const controller of userConnections) {
      userConnections.delete(controller);
    }
  }
  // Clean up empty set
  if (userConnections && userConnections.size === 0) {
    connections.delete(userId);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): delete controller from connections on cancel

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: SSE — Fix memory leak: clearInterval reliability (S-2)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts:95-115`

- [ ] **Step 1: Move clearInterval into cancel() callback**

Find the current structure:
```ts
const heartbeatInterval = setInterval(() => { ... }, 30000);

// Clean up interval when stream is cancelled
stream.cancel().then(() => clearInterval(heartbeatInterval));
```

Replace with:
```ts
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

const stream = new ReadableStream({
  start(controller) {
    // Add connection
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId)!.add(controller);

    // Send initial connection event
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', createdAt: new Date().toISOString() })}\n\n`));

    // Start heartbeat after connection is set up
    heartbeatInterval = setInterval(() => {
      const userConnections = connections.get(userId);
      if (!userConnections || userConnections.size === 0) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        return;
      }
      const encoder = new TextEncoder();
      const heartbeat = `: heartbeat ${Date.now()}\n\n`;
      for (const ctrl of userConnections) {
        try {
          ctrl.enqueue(encoder.encode(heartbeat));
        } catch {
          userConnections.delete(ctrl);
        }
      }
    }, 30000);
  },
  cancel() {
    // Clean up heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    // Remove controller
    const userConnections = connections.get(userId);
    if (userConnections) {
      for (const controller of userConnections) {
        userConnections.delete(controller);
      }
      if (userConnections.size === 0) {
        connections.delete(userId);
      }
    }
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): move clearInterval into cancel callback for reliability

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: SSE — Fix race condition: mutating Set during iteration (S-3)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts:35-48`

- [ ] **Step 1: Collect dead controllers before deletion**

Find broadcastToUser:
```ts
function broadcastToUser(userId: string, notification: PendingNotification) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const data = JSON.stringify({ ... });
  const encoder = new TextEncoder();
  const chunk = `data: ${data}\n\n`;

  for (const controller of userConnections) {
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      userConnections.delete(controller);
    }
  }

  if (userConnections.size === 0) {
    connections.delete(userId);
  }
}
```

Replace with:
```ts
function broadcastToUser(userId: string, notification: PendingNotification) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const data = JSON.stringify({
    type: notification.type,
    title: notification.title,
    message: notification.message || null,
    createdAt: new Date().toISOString(),
  });
  const encoder = new TextEncoder();
  const chunk = `data: ${data}\n\n`;

  // Collect dead controllers first, then delete after iteration
  const dead: ReadableStreamDefaultController[] = [];
  for (const controller of userConnections) {
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      dead.push(controller);
    }
  }

  // Remove dead controllers
  for (const controller of dead) {
    userConnections.delete(controller);
  }

  if (userConnections.size === 0) {
    connections.delete(userId);
  }
}
```

- [ ] **Step 2: Apply same pattern to heartbeat interval**

Update the heartbeat interval code similarly to collect dead controllers before deletion.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): collect dead controllers before deletion to fix race condition

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: SSE — Add per-user connection limit (S-5)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts:66-76`

- [ ] **Step 1: Add connection limit check**

Find the start callback:
```ts
start(controller) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
  // ...
}
```

Replace with:
```ts
const MAX_CONNECTIONS_PER_USER = 3;

start(controller) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  const userConnections = connections.get(userId)!;

  // Check connection limit
  if (userConnections.size >= MAX_CONNECTIONS_PER_USER) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Too many connections' })}\n\n`));
    controller.close();
    return;
  }

  userConnections.add(controller);
  // ...
}
```

Also update the response headers to include 429 status:
```ts
return new Response(stream, {
  status: 429, // When limit exceeded
  headers: { ... },
});
```

Actually, need to handle this differently - we can't return a 429 from within the stream start. Instead, check before creating the stream:

```ts
export const GET: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.userId;

  // Check connection limit before creating stream
  const existing = connections.get(userId);
  if (existing && existing.size >= MAX_CONNECTIONS_PER_USER) {
    return new Response(JSON.stringify({ error: 'Too many connections. Please close other tabs.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ... rest of stream creation
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): add per-user connection limit of 3

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: SSE — Implement POST markRead (S-6)

**Files:**
- Modify: `src/pages/api/notifications/sse.ts:127-159`

- [ ] **Step 1: Implement markRead functionality**

Find the POST handler with the TODO comment:
```ts
if (action === 'markRead' && notificationId) {
  // Mark notification as read in database
  // This would update the notifications table
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

Replace with:
```ts
import { db } from '../../../db';
import { notifications } from '../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

if (action === 'markRead' && notificationId) {
  try {
    // Support single ID or array of IDs
    const ids = Array.isArray(notificationId) ? notificationId : [notificationId];

    await db.update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(and(
        inArray(notifications.id, ids),
        eq(notifications.userId, session.userId)  // Ensure ownership
      ));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[sse] markRead failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to mark notification as read' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/notifications/sse.ts
git commit -m "fix(sse): implement POST markRead endpoint

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Clinic Editor — Fix 403 vs 404 inconsistency (E-1)

**Files:**
- Modify: `src/pages/api/portal/clinic.ts:70-71`

- [ ] **Step 1: Change PUT to return 404 for "no clinic linked"**

Find:
```ts
if (!clinicId) {
  return new Response(JSON.stringify({ error: 'No clinic linked' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Replace with:
```ts
if (!clinicId) {
  return new Response(JSON.stringify({ error: 'No clinic linked' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/clinic.ts
git commit -m "fix(clinic): return 404 for no clinic (matches GET behavior)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Clinic Editor — Fix stale closure in debounce (E-2)

**Files:**
- Modify: `src/components/react/PortalClinicEditor.tsx:130-145`

- [ ] **Step 1: Pass snapshot to handleSave**

Find the scheduleAutoSave function:
```ts
const scheduleAutoSave = useCallback(() => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  saveTimeoutRef.current = setTimeout(() => {
    handleSave(true);
  }, 3000);
}, [clinic, handleSave]);
```

Replace with:
```ts
const scheduleAutoSave = useCallback((snapshot: ClinicData) => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  saveTimeoutRef.current = setTimeout(() => {
    handleSave(true, snapshot);
  }, 3000);
}, [handleSave]);
```

Then update the call sites to pass the current clinic:
```ts
// In update functions like updateName, updateDescription, etc.
scheduleAutoSave(clinic);
```

And update handleSave to accept optional snapshot:
```ts
async function handleSave(isAutoSave = false, snapshot?: ClinicData) {
  const data = snapshot ?? clinic;
  // ... rest of save logic uses data instead of clinic
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalClinicEditor.tsx
git commit -m "fix(clinic-editor): pass snapshot to handleSave to fix stale closure

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Clinic Editor — Fix updateMedia null handling (E-3)

**Files:**
- Modify: `src/components/react/PortalClinicEditor.tsx:159-164`

- [ ] **Step 1: Add null coalescing for media**

Find:
```ts
function updateMedia(field: string, value: unknown) {
  if (!clinic) return;
  setClinic({ ...clinic, media: { ...clinic.media, [field]: value } });
}
```

Replace with:
```ts
function updateMedia(field: string, value: unknown) {
  if (!clinic) return;
  setClinic({
    ...clinic,
    media: {
      ...(clinic.media ?? {}),
      [field]: value,
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalClinicEditor.tsx
git commit -m "fix(clinic-editor): handle null media in updateMedia

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Clinic Editor — Add role check (E-4)

**Files:**
- Modify: `src/pages/api/portal/clinic.ts:14-18`

- [ ] **Step 1: Add role validation**

Find the auth check:
```ts
const session = await validateSessionStrict(request);
if (!session) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... });
}
```

Add after:
```ts
// Only clinic owners or admins can edit clinics
if (session.role !== 'clinic_owner' && session.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/clinic.ts
git commit -m "fix(clinic): add role check to prevent unauthorized edits

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Clinic Editor — Detect no-op updates (E-5)

**Files:**
- Modify: `src/pages/api/portal/clinic.ts:77-92`

- [ ] **Step 1: Track if any fields were actually updated**

Find where updateData is built and returned:
```ts
const updateData = { ... };
updateData.updatedAt = new Date();

await db.update(clinics).set(updateData).where(eq(clinics.id, clinicId));
return new Response(JSON.stringify({ success: true }), { status: 200, ... });
```

Replace with:
```ts
const ALLOWED_FIELDS = [
  'name', 'description', 'descriptionLong',
  'phone', 'website', 'email',
  'machines', 'specialties', 'insurances', 'openingHours',
  'availability', 'pricing', 'media',
] as const;

// Extract only allowed fields from body
const updateData: Record<string, unknown> = {};
let fieldCount = 0;
for (const field of ALLOWED_FIELDS) {
  if (field in body && body[field] !== undefined) {
    updateData[field] = body[field];
    fieldCount++;
  }
}

// Always update timestamp
updateData.updatedAt = new Date();

if (fieldCount === 0) {
  // No actual fields to update
  return new Response(JSON.stringify({ success: true, noop: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

await db.update(clinics).set(updateData).where(eq(clinics.id, clinicId));
return new Response(JSON.stringify({ success: true }), { status: 200, ... });
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/portal/clinic.ts
git commit -m "fix(clinic): return noop flag for empty updates

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Clinic Editor — Add home_visits checkbox (E-6)

**Files:**
- Modify: `src/components/react/PortalClinicEditor.tsx`

- [ ] **Step 1: Add missing home_visits checkbox**

Find the availability section checkboxes (around lines 501-518). Look for the pattern:
```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="weekend_hours"
    checked={clinic.availability?.weekend_hours ?? false}
    onChange={(e) => updateAvailability('weekend_hours', e.target.checked)}
  />
  <label htmlFor="weekend_hours">Weekend hours</label>
</div>
```

Add after the last checkbox:
```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="home_visits"
    checked={clinic.availability?.home_visits ?? false}
    onChange={(e) => updateAvailability('home_visits', e.target.checked)}
  />
  <label htmlFor="home_visits">Home visits available</label>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalClinicEditor.tsx
git commit -m "fix(clinic-editor): add missing home_visits checkbox

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Clinic Editor — Add URL validation (E-8)

**Files:**
- Modify: `src/components/react/PortalClinicEditor.tsx`

- [ ] **Step 1: Add URL validation helper**

Add at the top of the file:
```ts
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

Then in each media field onChange:
```tsx
const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (value && !isValidUrl(value)) {
    setFieldError('logo_url', 'Please enter a valid URL (https://...)');
    return;
  }
  clearFieldError('logo_url');
  updateMedia('logo_url', value || null);
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/PortalClinicEditor.tsx
git commit -m "fix(clinic-editor): add URL validation for media fields

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Verification Steps

After all tasks complete, verify:

1. **SSE:**
   - Open SSE connection → controller added to Map
   - Close tab → controller removed from Map
   - Open 4+ tabs → 4th returns 429
   - Broadcast notification → all connected clients receive it

2. **Clinic Editor:**
   - Edit field → wait 3s → save uses current value (not stale)
   - Clear media fields → no crash
   - Save with no changes → returns noop: true
   - Visit as viewer role → 403 forbidden

Run tests:
```bash
npm run test
```

Check for memory leaks with multiple connection cycles.