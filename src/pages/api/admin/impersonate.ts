import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import {
  getSessionFromRequest,
  hasRole,
  createSessionCookie,
  logAuthEvent,
  getClientIpFromRequest,
} from '../../../utils/auth';

export const prerender = false;

/**
 * POST /api/admin/impersonate
 * Admin-only: switch into another user's session with a single click.
 * Logs the impersonation event for audit trail.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let targetUserId: string;
  let redirectTo: string;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      targetUserId = body.userId;
      redirectTo = body.redirectTo;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    targetUserId = formData.get('userId') as string;
    redirectTo = formData.get('redirectTo') as string;
  } else {
    return new Response(JSON.stringify({ error: 'Unsupported content type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!targetUserId) {
    return new Response(JSON.stringify({ error: 'userId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Prevent self-impersonation
  if (targetUserId === session.userId) {
    return new Response(JSON.stringify({ error: 'Cannot impersonate yourself' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch target user
  const results = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    clinicId: users.clinicId,
    name: users.name,
  }).from(users).where(eq(users.id, targetUserId)).limit(1);

  const targetUser = results[0];
  if (!targetUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build impersonation payload
  const impersonationPayload = {
    userId: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    clinicId: targetUser.clinicId ?? undefined,
  };

  // Create session cookie for the target user
  const impersonationCookie = createSessionCookie(impersonationPayload);

  // Determine redirect destination
  const destination = redirectTo
    || (targetUser.role === 'clinic_owner' ? '/portal/' : '/admin/dashboard');

  // Log impersonation event for audit
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
    metadata: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      impersonatorEmail: session.email,
    },
  });

  // Redirect with the impersonation cookie set
  return new Response(null, {
    status: 302,
    headers: {
      'Location': destination,
      'Set-Cookie': impersonationCookie,
    },
  });
};
