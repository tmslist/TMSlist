import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { permissions } from '../../../db/schema';
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
    const all = await db.select().from(permissions).orderBy(permissions.category, permissions.key);
    return json({ permissions: all });
  } catch (err) {
    console.error('Permissions GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { key, label, description, category } = body;
    if (!key || !label) return json({ error: 'key and label are required' }, 400);

    const [perm] = await db.insert(permissions).values({
      key,
      label,
      description: description || null,
      category: category || null,
    }).returning();

    return json({ permission: perm }, 201);
  } catch (err) {
    console.error('Permissions POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id query param required' }, 400);

    await db.delete(permissions).where(eq(permissions.id, id));
    return json({ success: true });
  } catch (err) {
    console.error('Permissions DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};