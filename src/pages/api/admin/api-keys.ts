import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { apiKeys, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import crypto from 'node:crypto';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const key = `tmslist_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.slice(0, 12);
  return { key, keyHash, keyPrefix };
}

// GET: List API keys (masked — full key only shown once on creation)
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const keys = await db.select().from(apiKeys).orderBy(sql`${apiKeys.createdAt} DESC`);
    // Mask the full key — only show prefix
    const masked = keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      permissions: k.permissions,
      rateLimitOverride: k.rateLimitOverride,
      expiresAt: k.expiresAt,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      isExpired: k.expiresAt ? new Date(k.expiresAt) < new Date() : false,
    }));
    return json({ data: masked });
  } catch (err) {
    console.error('List API keys error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create a new API key
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { name, permissions, rateLimitOverride, expiresAt } = body;

    if (!name) return json({ error: 'Name is required' }, 400);

    const { key, keyHash, keyPrefix } = generateApiKey();

    const [record] = await db.insert(apiKeys).values({
      name,
      keyHash,
      keyPrefix,
      permissions: permissions || [],
      rateLimitOverride: rateLimitOverride || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_api_key',
      entityType: 'api_key',
      entityId: record.id,
      details: { name },
    });

    // Return the full key ONLY on creation — it's never stored in plain text
    return json({
      success: true,
      keyId: record.id,
      key, // full key, shown once
      keyPrefix,
      message: 'Save this key securely — it will not be shown again',
    }, 201);
  } catch (err) {
    console.error('Create API key error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update API key settings
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Key ID required' }, 400);

    const allowed = ['name', 'permissions', 'rateLimitOverride', 'expiresAt'] as const;
    const safe: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) {
        safe[k] = k === 'expiresAt' && updates[k] ? new Date(updates[k] as string) : updates[k];
      }
    }

    await db.update(apiKeys).set(safe).where(eq(apiKeys.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_api_key',
      entityType: 'api_key',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Update API key error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Revoke an API key
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Key ID required' }, 400);

    await db.delete(apiKeys).where(eq(apiKeys.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'revoke_api_key',
      entityType: 'api_key',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Revoke API key error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
