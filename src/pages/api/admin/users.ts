import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// List users with pagination and search
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const search = url.searchParams.get('search') || '';
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
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
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
      userId: session?.userId ?? null,
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
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
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
      userId: session?.userId ?? null,
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
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
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

    await db.delete(users).where(eq(users.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
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
