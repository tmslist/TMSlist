import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import {
  getSessionFromRequest,
  hasRole,
  createImpersonationCookie,
  logAuthEvent,
  getClientIpFromRequest,
} from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Reject anything that isn't a same-origin relative path.
 * Allows `/foo`, blocks `//evil.com`, `https://...`, `javascript:...`, etc.
 */
function isSafeRelativePath(value: string | undefined | null): value is string {
  if (!value || typeof value !== 'string') return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (/[\r\n]/.test(value)) return false;
  if (/^\/[a-z]+:/i.test(value)) return false;
  return true;
}

/**
 * POST /api/admin/impersonate
 * Admin-only: switch into another user's session for support.
 * Issues a 1-hour impersonation cookie with isImpersonation=true.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden — admin access required' }, 403);

  let targetUserId: string;
  let redirectTo: string | undefined;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      targetUserId = body.userId;
      redirectTo = body.redirectTo;
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    targetUserId = formData.get('userId') as string;
    redirectTo = formData.get('redirectTo') as string | undefined;
  } else {
    return json({ error: 'Unsupported content type' }, 415);
  }

  if (!targetUserId) return json({ error: 'userId is required' }, 400);
  if (targetUserId === session.userId) return json({ error: 'Cannot impersonate yourself' }, 400);

  const results = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    clinicId: users.clinicId,
    name: users.name,
  }).from(users).where(eq(users.id, targetUserId)).limit(1);

  const targetUser = results[0];
  if (!targetUser) return json({ error: 'User not found' }, 404);

  // Block impersonation of other admins — defense in depth against
  // privilege escalation via stolen impersonation tokens.
  if (targetUser.role === 'admin') {
    return json({ error: 'Cannot impersonate another admin' }, 403);
  }

  const impersonationCookie = createImpersonationCookie({
    userId: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    clinicId: targetUser.clinicId ?? undefined,
  });

  // Validate redirect destination — only same-origin relative paths.
  const fallbackDestination = targetUser.role === 'clinic_owner' ? '/portal/' : '/admin/dashboard';
  const destination = isSafeRelativePath(redirectTo) ? redirectTo : fallbackDestination;

  const ip = getClientIpFromRequest(request);
  const userAgent = request.headers.get('user-agent') || '';

  await logAuthEvent({
    userId: session.userId,
    action: 'impersonate_user',
    ipAddress: ip,
    userAgent,
    metadata: {
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
    },
  });

  await db.insert(auditLog).values({
    userId: session.userId,
    action: 'impersonate_user',
    entityType: 'user',
    entityId: targetUser.id,
    details: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      impersonatorEmail: session.email,
    },
  });

  return new Response(null, {
    status: 302,
    headers: {
      'Location': destination,
      'Set-Cookie': impersonationCookie,
    },
  });
};
