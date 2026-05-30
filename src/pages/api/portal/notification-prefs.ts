import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { notifications } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Notification preferences are stored per user in the notifications table
// GET returns existing preferences; PUT creates a "prefs" notification record
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor', 'viewer')) return json({ error: 'Forbidden' }, 403);

  try {
    const prefs = await db.select().from(notifications)
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    // Parse stored preferences from metadata
    const emailPrefs: Record<string, boolean> = {};
    const inAppPrefs: Record<string, boolean> = {};
    prefs.forEach(n => {
      const meta = n.metadata as Record<string, boolean> | undefined;
      if (meta?.preferenceKey) {
        if (meta.channel === 'email') emailPrefs[meta.preferenceKey] = n.read;
        if (meta.channel === 'in_app') inAppPrefs[meta.preferenceKey] = n.read;
      }
    });

    return json({
      email: emailPrefs,
      in_app: inAppPrefs,
      defaults: {
        new_lead: { email: true, in_app: true },
        new_review: { email: true, in_app: true },
        job_application: { email: true, in_app: true },
        billing_reminder: { email: true, in_app: false },
        system_announcement: { email: false, in_app: true },
      },
    });
  } catch (err) {
    console.error('[GET /api/portal/notification-prefs]', err);
    return json({ error: 'Failed to load preferences' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor', 'viewer')) return json({ error: 'Forbidden' }, 403);

  try {
    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const b = body as { preferenceKey: string; channel: 'email' | 'in_app'; enabled: boolean };

    if (!b.preferenceKey || !b.channel) {
      return json({ error: 'preferenceKey and channel required' }, 422);
    }

    // Upsert: delete existing preference record, insert new one
    const { and: dAnd, eq: dEq } = await import('drizzle-orm');
    await db.delete(notifications).where(
      and(
        dEq(notifications.userId, session.userId),
        dEq(notifications.type, `pref:${b.preferenceKey}:${b.channel}`)
      )
    );

    await db.insert(notifications).values({
      userId: session.userId,
      type: `pref:${b.preferenceKey}:${b.channel}`,
      title: `Notification preference: ${b.preferenceKey}`,
      message: `Channel: ${b.channel}, Enabled: ${b.enabled}`,
      read: b.enabled,
      metadata: { preferenceKey: b.preferenceKey, channel: b.channel, enabled: b.enabled },
    });

    return json({ success: true });
  } catch (err) {
    console.error('[PUT /api/portal/notification-prefs]', err);
    return json({ error: 'Failed to save preference' }, 500);
  }
};