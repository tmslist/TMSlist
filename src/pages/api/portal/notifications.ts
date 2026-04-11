import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

interface NotificationPrefs {
  emailOnNewLead: boolean;
  emailOnNewReview: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  emailOnNewLead: true,
  emailOnNewReview: true,
  weeklyDigest: false,
};

function prefsKey(userId: string) {
  return `notif_prefs_${userId}`;
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rows = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, prefsKey(session.userId)))
      .limit(1);

    const prefs = rows[0]?.value
      ? { ...DEFAULT_PREFS, ...(rows[0].value as Partial<NotificationPrefs>) }
      : DEFAULT_PREFS;

    return new Response(JSON.stringify({ preferences: prefs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal notifications prefs GET error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load preferences' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    const prefs: NotificationPrefs = {
      emailOnNewLead: typeof body.emailOnNewLead === 'boolean' ? body.emailOnNewLead : DEFAULT_PREFS.emailOnNewLead,
      emailOnNewReview: typeof body.emailOnNewReview === 'boolean' ? body.emailOnNewReview : DEFAULT_PREFS.emailOnNewReview,
      weeklyDigest: typeof body.weeklyDigest === 'boolean' ? body.weeklyDigest : DEFAULT_PREFS.weeklyDigest,
    };

    const key = prefsKey(session.userId);

    // Upsert into siteSettings
    await db
      .insert(siteSettings)
      .values({
        key,
        value: prefs as unknown as Record<string, unknown>,
        updatedAt: new Date(),
        updatedBy: session.userId,
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: prefs as unknown as Record<string, unknown>,
          updatedAt: new Date(),
          updatedBy: session.userId,
        },
      });

    return new Response(JSON.stringify({ success: true, preferences: prefs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal notifications prefs PUT error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update preferences' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
