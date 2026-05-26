import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';
import { legalDocuments, retentionPolicies, gdprRequests, consentRecords } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Aggregates compliance signals from existing tables. The component expects
// a unified summary; nested CRUD lives under /api/admin/compliance/* already.
export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const [legal, retention, gdpr, consent] = await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(legalDocuments),
      db.select({ c: sql<number>`count(*)` }).from(retentionPolicies),
      db.select({ c: sql<number>`count(*)` }).from(gdprRequests),
      db.select({ c: sql<number>`count(*)` }).from(consentRecords),
    ]);
    return json({
      data: {
        legalDocs: Number(legal[0]?.c ?? 0),
        retentionPolicies: Number(retention[0]?.c ?? 0),
        gdprRequests: Number(gdpr[0]?.c ?? 0),
        consentRecords: Number(consent[0]?.c ?? 0),
      },
    });
  } catch (err) { console.error('compliance-center GET', err); return json({ error: 'Internal server error' }, 500); }
};
