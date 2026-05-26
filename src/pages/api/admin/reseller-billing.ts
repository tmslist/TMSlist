import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { resellerInvoices } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin') ? json({ error: 'Forbidden' }, 403) : null;
};

export const GET: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const resellerId = url.searchParams.get('resellerId');
    const query = resellerId
      ? db.select().from(resellerInvoices).where(eq(resellerInvoices.resellerId, resellerId))
      : db.select().from(resellerInvoices);
    const rows = await query.orderBy(desc(resellerInvoices.periodStart)).limit(200);
    return json({ data: rows });
  } catch (err) { console.error('reseller-billing GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.resellerId || !body?.periodStart || !body?.periodEnd) {
      return json({ error: 'resellerId, periodStart, periodEnd required' }, 400);
    }
    const [row] = await db.insert(resellerInvoices).values({
      resellerId: body.resellerId,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      grossRevenueCents: body.grossRevenueCents ?? 0,
      commissionCents: body.commissionCents ?? 0,
      payoutCents: body.payoutCents ?? 0,
      status: body.status ?? 'pending',
      notes: body.notes ?? null,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('reseller-billing POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    if (body.periodStart) body.periodStart = new Date(body.periodStart);
    if (body.periodEnd) body.periodEnd = new Date(body.periodEnd);
    if (body.paidAt) body.paidAt = new Date(body.paidAt);
    const [row] = await db.update(resellerInvoices).set(body).where(eq(resellerInvoices.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('reseller-billing PATCH', err); return json({ error: 'Internal server error' }, 500); }
};
