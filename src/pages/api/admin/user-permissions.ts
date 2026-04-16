import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import type { UserPermissions } from '../../../db/schema';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Require admin session and can_manage_users permission.
 * Admins with role='admin' bypass permission check.
 */
async function requireAdminWithManageUsers(
  request: Request
): Promise<{ authorized: true; session: import('../../../utils/auth').JWTPayload; userId: string } | { authorized: false; response: Response }> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return {
      authorized: false,
      response: json({ error: 'Unauthorized' }, 401),
    };
  }

  // Admins get all permissions
  if (session.role === 'admin') {
    return { authorized: true, session, userId: session.userId };
  }

  // Check can_manage_users permission from DB
  const userResults = await db
    .select({ permissions: users.permissions })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const perms = userResults[0]?.permissions as UserPermissions | null;
  if (!perms?.can_manage_users) {
    return {
      authorized: false,
      response: json({ error: 'Forbidden' }, 403),
    };
  }

  return { authorized: true, session, userId: session.userId };
}

/**
 * PUT /api/admin/user-permissions
 * Update permission flags for a user.
 * Requires: admin role OR can_manage_users permission.
 * Prevents self-modification.
 */
export const PUT: APIRoute = async ({ request }) => {
  const auth = await requireAdminWithManageUsers(request);
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('id');
  if (!targetUserId) {
    return json({ error: 'User ID required' }, 400);
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return json({ error: 'Invalid user ID format' }, 400);
  }

  // Prevent self-modification
  if (targetUserId === auth.userId) {
    return json({ error: 'Cannot modify your own permissions' }, 400);
  }

  const body = await request.json();
  const parsed = z.object({
    can_edit: z.boolean().optional(),
    can_delete: z.boolean().optional(),
    can_export: z.boolean().optional(),
    can_manage_users: z.boolean().optional(),
    can_billing: z.boolean().optional(),
  }).safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid permissions object' }, 400);
  }

  // Fetch existing permissions and merge
  const existing = await db
    .select({ permissions: users.permissions })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  const currentPerms: UserPermissions = (existing[0]?.permissions as UserPermissions | null) ?? {
    can_edit: false,
    can_delete: false,
    can_export: false,
    can_manage_users: false,
    can_billing: false,
  };

  const updatedPerms: UserPermissions = { ...currentPerms, ...parsed.data };

  await db.update(users).set({ permissions: updatedPerms, updatedAt: new Date() }).where(eq(users.id, targetUserId));

  // Audit log
  await db.insert(auditLog).values({
    userId: auth.userId,
    action: 'permission_changed',
    entityType: 'user',
    entityId: targetUserId,
    details: { permissions: updatedPerms },
  });

  return json({ success: true, permissions: updatedPerms });
};

/**
 * GET /api/admin/user-permissions?id=<userId>
 * Get current permission flags for a user (admin role required).
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('id');
  if (!targetUserId) {
    return json({ error: 'User ID required' }, 400);
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return json({ error: 'Invalid user ID format' }, 400);
  }

  const result = await db
    .select({ permissions: users.permissions, role: users.role, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!result[0]) {
    return json({ error: 'User not found' }, 404);
  }

  return json({
    userId: targetUserId,
    email: result[0].email,
    name: result[0].name,
    role: result[0].role,
    permissions: result[0].permissions as UserPermissions | null,
  });
};
