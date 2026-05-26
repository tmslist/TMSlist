import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { helpArticles } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin') ? json({ error: 'Forbidden' }, 403) : null;
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.slug || !body?.title || !body?.body) return json({ error: 'slug, title, body required' }, 400);
    const session = getSessionFromRequest(request);
    const [row] = await db.insert(helpArticles).values({
      categoryId: body.categoryId ?? null,
      slug: body.slug,
      title: body.title,
      body: body.body,
      published: body.published ?? false,
      authorId: session?.userId ?? null,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('help-center/article POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(helpArticles).set(body).where(eq(helpArticles.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('help-center/article PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(helpArticles).where(eq(helpArticles.id, id));
    return json({ success: true });
  } catch (err) { console.error('help-center/article DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
