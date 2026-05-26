import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clinicBadges } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { eq, and } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Predefined badge metadata
const BADGE_METADATA: Record<string, { name: string; description: string }> = {
  'top-rated': { name: 'Top Rated', description: '4.5+ star average rating' },
  'fda-approved': { name: 'FDA Approved Devices', description: 'Uses FDA-cleared TMS devices' },
  'experienced': { name: 'Experienced', description: '100+ TMS sessions performed' },
  'insurance-accepted': { name: 'Insurance Accepted', description: 'Accepts major insurance plans' },
  'rapid-response': { name: 'Rapid Response', description: 'Responds within 2 hours' },
  '24-7-coverage': { name: '24/7 Coverage', description: 'Round-the-clock availability' },
  'research-active': { name: 'Research Active', description: 'Participates in clinical trials' },
  'affordable': { name: 'Affordable', description: 'Competitive pricing or payment plans' },
  'inclusive-care': { name: 'Inclusive Care', description: 'Serves diverse populations' },
  'telehealth': { name: 'Telehealth Available', description: 'Offers virtual consultations' },
};

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  const url = new URL(request.url);
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) return json({ error: 'clinicId required' }, 400);

  const badges = await db.select().from(clinicBadges).where(eq(clinicBadges.clinicId, clinicId));
  return json({ badges });
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json() as { clinicId: string; badgeTypes: string[] };

    if (!body.clinicId) return json({ error: 'clinicId required' }, 400);

    // Remove existing badges for this clinic
    await db.delete(clinicBadges).where(eq(clinicBadges.clinicId, body.clinicId));

    // Insert new badges
    if (body.badgeTypes && body.badgeTypes.length > 0) {
      await db.insert(clinicBadges).values(
        body.badgeTypes.map(badgeType => ({
          clinicId: body.clinicId,
          badgeType,
          badgeName: BADGE_METADATA[badgeType]?.name ?? badgeType,
          badgeDescription: BADGE_METADATA[badgeType]?.description ?? null,
        }))
      );
    }

    return json({ success: true, count: body.badgeTypes?.length ?? 0 });
  } catch (err) {
    console.error('Badge update error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};