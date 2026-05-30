import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { roles } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const allRoles = await db.select().from(roles).orderBy(roles.name);
    return json({ roles: allRoles });
  } catch (err) {
    console.error('Roles GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { name, label, description, permissions } = body;
    if (!name || !label) return json({ error: 'name and label are required' }, 400);

    const [role] = await db.insert(roles).values({
      name,
      label,
      description: description || null,
      permissions: permissions || [],
    }).returning();

    return json({ role }, 201);
  } catch (err) {
    console.error('Roles POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id query param required' }, 400);

    const body = await request.json();
    const { name, label, description, permissions } = body;

    const [role] = await db.update(roles)
      .set({ name, label, description, permissions, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();

    if (!role) return json({ error: 'Role not found' }, 404);
    return json({ role });
  } catch (err) {
    console.error('Roles PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};