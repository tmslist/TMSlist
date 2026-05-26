import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { aiTemplates } from '../../../db/schema';
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
    const rows = await db.select().from(aiTemplates).orderBy(desc(aiTemplates.updatedAt));
    return json({ data: rows });
  } catch (err) { console.error('ai-templates GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.key || !body?.name || !body?.userPromptTemplate) {
      return json({ error: 'key, name, userPromptTemplate required' }, 400);
    }
    const [row] = await db.insert(aiTemplates).values({
      key: body.key,
      name: body.name,
      description: body.description ?? null,
      systemPrompt: body.systemPrompt ?? null,
      userPromptTemplate: body.userPromptTemplate,
      defaultModelId: body.defaultModelId ?? null,
      variables: body.variables ?? null,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('ai-templates POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(aiTemplates).set(body).where(eq(aiTemplates.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('ai-templates PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(aiTemplates).where(eq(aiTemplates.id, id));
    return json({ success: true });
  } catch (err) { console.error('ai-templates DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
