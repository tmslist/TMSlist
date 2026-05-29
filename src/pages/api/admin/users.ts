import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole, invalidateAllUserSessions } from '../../../utils/auth.js';
import { hashPassword } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Permission schema
const PERMISSION_KEYS = [
  'can_edit_clinics', 'can_delete_clinics',
  'can_edit_doctors', 'can_delete_doctors',
  'can_moderate_reviews',
  'can_manage_leads', 'can_manage_enquiries',
  'can_manage_users', 'can_manage_admins',
  'can_view_analytics', 'can_export_data',
  'can_manage_blog', 'can_manage_content',
  'can_manage_campaigns', 'can_view_email_stats',
  'can_manage_settings', 'can_manage_integrations',
  'can_view_billing', 'can_manage_billing',
  'can_view_audit_log', 'can_manage_audit',
  'can_manage_security',
] as const;

type PermissionKey = typeof PERMISSION_KEYS[number];

// Reset password / MFA toggle / permissions / role update
export const PATCH: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, password, mfaAction, permissions } = body;

    if (!id) return json({ error: 'User ID required' }, 400);

    // Password reset
    if (password && typeof password === 'string' && password.length >= 8) {
      const hash = await hashPassword(password);
      await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, id));
      await invalidateAllUserSessions(id);
      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'reset_user_password',
        entityType: 'user',
        entityId: id,
      });
      return json({ success: true, field: 'password' });
    }

    // MFA toggle (enable/disable TOTP for a user)
    if (mfaAction === 'enable') {
      // Generate a new TOTP secret for the user
      const { generateTOTPSecret } = await import('../../../utils/totp.js');
      const secret = generateTOTPSecret();
      await db.update(users).set({ totpSecret: secret, totpEnabled: false, updatedAt: new Date() }).where(eq(users.id, id));
      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'mfa_enabled_pending_verification',
        entityType: 'user',
        entityId: id,
      });
      return json({ success: true, field: 'mfa', totpSecret: secret, setupUrl: `otpauth://totp/TMSList:${id}?secret=${secret}&issuer=TMSList` });
    }

    if (mfaAction === 'disable') {
      await db.update(users).set({ totpSecret: null, totpEnabled: false, totpVerifiedAt: null, updatedAt: new Date() }).where(eq(users.id, id));
      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'mfa_disabled',
        entityType: 'user',
        entityId: id,
      });
      return json({ success: true, field: 'mfa' });
    }

    if (mfaAction === 'verify') {
      const { token } = body;
      if (!token || typeof token !== 'string') {
        return json({ error: 'Token required' }, 400);
      }
      const [user] = await db.select({ totpSecret: users.totpSecret }).from(users).where(eq(users.id, id)).limit(1);
      if (!user || !user.totpSecret) {
        return json({ error: 'No TOTP secret set for this user' }, 400);
      }
      const { verifyTOTP } = await import('../../../utils/totp.js');
      const valid = verifyTOTP(user.totpSecret, token.trim());
      if (!valid) {
        return json({ error: 'Invalid token' }, 400);
      }
      await db.update(users).set({ totpEnabled: true, totpVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'mfa_verified',
        entityType: 'user',
        entityId: id,
      });
      return json({ success: true, field: 'mfa' });
    }

    // Permissions update
    if (permissions && typeof permissions === 'object') {
      const perms = permissions as Partial<Record<PermissionKey, boolean>>;
      const cleanPerms: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(perms)) {
        if (PERMISSION_KEYS.includes(key as PermissionKey)) {
          cleanPerms[key] = Boolean(val);
        }
      }
      await db.update(users).set({ permissions: cleanPerms, updatedAt: new Date() }).where(eq(users.id, id));
      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'update_user_permissions',
        entityType: 'user',
        entityId: id,
        details: { permissions: cleanPerms },
      });
      return json({ success: true, field: 'permissions' });
    }

    // Role/name update
    const validRoles = ['admin', 'editor', 'viewer', 'clinic_owner'] as const;
    const allowedFields = ['role', 'name', 'clinicId'] as const;
    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) {
        if (key === 'role' && !validRoles.includes(body[key])) {
          return json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, 400);
        }
        safeUpdates[key] = body[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, 400);
    }

    await db.update(users).set(safeUpdates).where(eq(users.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_user',
      entityType: 'user',
      entityId: id,
      details: { fields: Object.keys(safeUpdates) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Admin user PATCH error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// List users with pagination and search
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const search = url.searchParams.get('search') || '';
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');

    // Activity log endpoint
    if (action === 'activity' && userId) {
      const logs = await db.select({
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        details: auditLog.details,
        createdAt: auditLog.createdAt,
      })
        .from(auditLog)
        .where(sql`${auditLog.userId} = ${userId}`)
        .orderBy(desc(auditLog.createdAt))
        .limit(50);
      return json({ logs });
    }
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (search) {
      conditions.push(sql`(
        ${users.email} ILIKE ${'%' + search + '%'} OR
        ${users.name} ILIKE ${'%' + search + '%'}
      )`);
    }

    const data = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        clinicId: users.clinicId,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        totpEnabled: users.totpEnabled,
        totpVerifiedAt: users.totpVerifiedAt,
        permissions: users.permissions,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(countResult[0]?.count ?? 0);

    return json({ data, total });
  } catch (err) {
    console.error('Admin users list error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Create a user
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const body = await request.json();
    const { email, name, role, clinicId } = body;

    if (!email) {
      return json({ error: 'Email is required' }, 400);
    }

    const validRoles = ['admin', 'editor', 'viewer', 'clinic_owner'] as const;
    if (role && !validRoles.includes(role)) {
      return json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, 400);
    }

    // Check if email already exists
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return json({ error: 'A user with this email already exists' }, 409);
    }

    const result = await db.insert(users).values({
      email: email.toLowerCase(),
      name: name || null,
      role: role || 'viewer',
      clinicId: clinicId || null,
    }).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      name: users.name,
      clinicId: users.clinicId,
      createdAt: users.createdAt,
    });

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_user',
      entityType: 'user',
      entityId: result[0].id,
      details: { email: email.toLowerCase(), role: role || 'viewer' },
    });

    return json({ success: true, data: result[0] }, 201);
  } catch (err) {
    console.error('Admin user create error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Update a user (role, name, clinicId)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return json({ error: 'User ID required' }, 400);
    }

    const validRoles = ['admin', 'editor', 'viewer', 'clinic_owner'] as const;
    if (updates.role && !validRoles.includes(updates.role)) {
      return json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, 400);
    }

    const allowedFields = ['role', 'name', 'clinicId'] as const;
    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, 400);
    }

    await db.update(users).set(safeUpdates).where(eq(users.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_user',
      entityType: 'user',
      entityId: id,
      details: { fields: Object.keys(safeUpdates) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Admin user update error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Delete a user (prevent self-deletion)
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return json({ error: 'User ID required' }, 400);
    }

    // Prevent self-deletion
    if (session?.userId === id) {
      return json({ error: 'Cannot delete your own account' }, 403);
    }

    // Invalidate all sessions before deleting so tokens are revoked immediately
    await invalidateAllUserSessions(id);

    await db.delete(users).where(eq(users.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_user',
      entityType: 'user',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Admin user delete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
