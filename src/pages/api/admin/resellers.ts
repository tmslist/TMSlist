import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { whiteLabelConfigs, users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List white-label configs with reseller info
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const active = url.searchParams.get('active');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const configs = await db
      .select()
      .from(whiteLabelConfigs)
      .where(active ? eq(whiteLabelConfigs.isActive, active === 'true') : undefined)
      .orderBy(desc(whiteLabelConfigs.createdAt))
      .limit(limit)
      .offset(offset);

    // Attach reseller names
    const resellerIds = configs.map(c => c.resellerId).filter(Boolean);
    const resellers = resellerIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(sql`${users.id} IN ${resellerIds}`)
      : [];

    const resellerMap = Object.fromEntries(resellers.map(r => [r.id, r]));
    const data = configs.map(c => ({
      ...c,
      reseller: c.resellerId ? resellerMap[c.resellerId] ?? null : null,
    }));

    return json({ data });
  } catch (err) {
    console.error('Resellers GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create reseller account (domain, brandName, colors, logo, custom links)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const {
      domain, brandName, primaryColor, secondaryColor, logoUrl, faviconUrl,
      customCss, customHeaderLinks, customFooterLinks, resellerId,
    } = body;

    if (!domain || !brandName) {
      return json({ error: 'domain and brandName are required' }, 400);
    }

    const [config] = await db.insert(whiteLabelConfigs).values({
      domain,
      brandName,
      resellerId: resellerId || null,
      primaryColor: primaryColor || '#2563eb',
      secondaryColor: secondaryColor || '#1e40af',
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      customCss: customCss || null,
      customHeaderLinks: customHeaderLinks || null,
      customFooterLinks: customFooterLinks || null,
      isActive: body.isActive ?? false,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_reseller',
      entityType: 'white_label_config',
      entityId: config.id,
      details: { domain, brandName },
    });

    return json({ success: true, data: config }, 201);
  } catch (err) {
    console.error('Resellers POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update reseller config
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Reseller config ID required' }, 400);

    const allowed = [
      'domain', 'brandName', 'primaryColor', 'secondaryColor', 'logoUrl',
      'faviconUrl', 'customCss', 'customHeaderLinks', 'customFooterLinks', 'isActive',
    ] as const;

    const safe: Record<string, unknown> = {};
    for (const k of allowed) if (k in updates) safe[k] = updates[k];

    if (Object.keys(safe).length === 0) return json({ error: 'No valid fields to update' }, 400);

    await db.update(whiteLabelConfigs).set(safe).where(eq(whiteLabelConfigs.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_reseller',
      entityType: 'white_label_config',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Resellers PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove reseller
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Reseller config ID required' }, 400);

    await db.delete(whiteLabelConfigs).where(eq(whiteLabelConfigs.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_reseller',
      entityType: 'white_label_config',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Resellers DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};