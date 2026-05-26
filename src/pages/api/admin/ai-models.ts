import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { aiModels } from '../../../db/schema';
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
    const rows = await db.select().from(aiModels).orderBy(desc(aiModels.createdAt));
    return json({ data: rows });
  } catch (err) { console.error('ai-models GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.provider || !body?.modelId || !body?.displayName) {
      return json({ error: 'provider, modelId, displayName required' }, 400);
    }
    const [row] = await db.insert(aiModels).values({
      provider: body.provider,
      modelId: body.modelId,
      displayName: body.displayName,
      capabilities: body.capabilities ?? null,
      inputCostPer1k: body.inputCostPer1k != null ? String(body.inputCostPer1k) : null,
      outputCostPer1k: body.outputCostPer1k != null ? String(body.outputCostPer1k) : null,
      contextWindow: body.contextWindow ?? null,
      enabled: body.enabled ?? true,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('ai-models POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    if (body.inputCostPer1k != null) body.inputCostPer1k = String(body.inputCostPer1k);
    if (body.outputCostPer1k != null) body.outputCostPer1k = String(body.outputCostPer1k);
    const [row] = await db.update(aiModels).set(body).where(eq(aiModels.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('ai-models PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(aiModels).where(eq(aiModels.id, id));
    return json({ success: true });
  } catch (err) { console.error('ai-models DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
