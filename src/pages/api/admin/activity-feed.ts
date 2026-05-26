import type { APIRoute } from 'astro';
import { desc, and, isNotNull, gte } from 'drizzle-orm';
import { db } from '../../../db';
import { authEvents } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, opts: { status?: number; headers?: Record<string, string> } = {}) =>
  new Response(JSON.stringify(data), {
    status: opts.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const ACTION_VERBS: Record<string, string> = {
    login_success: 'logged in',
    login_failed: 'failed login',
    permission_changed: 'changed permissions',
    session_created: 'started session',
    totp_enabled: 'enabled 2FA',
    totp_disabled: 'disabled 2FA',
    passkey_registered: 'registered passkey',
    passkey_authenticated: 'authenticated with passkey',
  };

  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const events = await db
      .select({
        id: authEvents.id,
        action: authEvents.action,
        userId: authEvents.userId,
        metadata: authEvents.metadata,
        createdAt: authEvents.createdAt,
      })
      .from(authEvents)
      .where(
        and(
          isNotNull(authEvents.userId),
          gte(authEvents.createdAt, oneDayAgo),
        )
      )
      .orderBy(desc(authEvents.createdAt))
      .limit(20);

    const adminPrefixes = ['clinic_', 'lead_', 'review_', 'blog_', 'settings_', 'admin_'];

    const feedItems = events
      .filter((event) => {
        if (!event.action) return false;
        const action = event.action.toLowerCase();
        return (
          adminPrefixes.some((p) => action.startsWith(p)) ||
          Object.prototype.hasOwnProperty.call(ACTION_VERBS, action)
        );
      })
      .slice(0, 10)
      .map((event, index) => {
        const action = event.action || 'performed action';
        const verb =
          ACTION_VERBS[action] ||
          (action.includes('added')
            ? 'added'
            : action.includes('removed')
              ? 'removed'
              : action.includes('edited') || action.includes('updated')
                ? 'edited'
                : action.includes('approved') || action.includes('verified')
                  ? 'approved'
                  : action.includes('rejected')
                    ? 'rejected'
                    : action.includes('export')
                      ? 'exported'
                      : 'edited');

        const meta = event.metadata as Record<string, unknown> | null;
        const subject =
          (meta?.target as string) ||
          (meta?.clinicName as string) ||
          (meta?.name as string) ||
          action.replace(/_/g, ' ');

        const initials = 'A';
        const actorName = `Admin ${String(event.userId).slice(0, 8)}`;

        return {
          id: `${event.id}-${index}`,
          actorName,
          actorInitials: initials,
          action: verb as 'added' | 'removed' | 'edited' | 'approved' | 'rejected' | 'exported',
          subject,
          timestamp: event.createdAt?.toISOString() ?? new Date().toISOString(),
        };
      });

    return json(
      { items: feedItems },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return json({ items: [] });
  }
};
