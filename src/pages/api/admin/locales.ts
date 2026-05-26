import type { APIRoute } from 'astro';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { locales } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin') ? json({ error: 'Forbidden' }, 403) : null;
};

export const GET: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const rows = await db.select().from(locales).orderBy(asc(locales.sortOrder), asc(locales.code));
    return json({ data: rows });
  } catch (err) { console.error('locales GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.code || !body?.name) return json({ error: 'code and name required' }, 400);
    const [row] = await db.insert(locales).values({
      code: body.code,
      name: body.name,
      nativeName: body.nativeName ?? null,
      isActive: body.isActive ?? false,
      isRtl: body.isRtl ?? false,
      sortOrder: body.sortOrder ?? 0,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('locales POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'code required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(locales).set(body).where(eq(locales.code, code)).returning();
    return json({ data: row });
  } catch (err) { console.error('locales PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'code required' }, 400);
  try {
    await db.delete(locales).where(eq(locales.code, code));
    return json({ success: true });
  } catch (err) { console.error('locales DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
