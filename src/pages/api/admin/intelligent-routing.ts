import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { routeLead, getColdLeads, getRoutingAnalytics } from '../../../utils/leadRouting';

export const prerender = false;

/**
 * Intelligent lead routing API
 * GET /api/admin/intelligent-routing?leadId=xxx
 * GET /api/admin/intelligent-routing/cold-leads
 * GET /api/admin/intelligent-routing/analytics?clinicId=xxx
 * POST /api/admin/intelligent-routing/route
 */
export const GET: APIRoute = async ({ url, request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const path = url.pathname;
  const searchParams = url.searchParams;

  try {
    // Cold leads queue
    if (path.endsWith('/cold-leads')) {
      const hours = parseInt(searchParams.get('hours') || '24');
      const coldLeads = await getColdLeads(hours);
      return new Response(JSON.stringify({ coldLeads, count: coldLeads.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Routing analytics for a clinic
    if (searchParams.has('clinicId')) {
      const clinicId = searchParams.get('clinicId')!;
      const analytics = await getRoutingAnalytics(clinicId);
      return new Response(JSON.stringify(analytics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Routing recommendation for a specific lead
    if (searchParams.has('leadId')) {
      const leadId = searchParams.get('leadId')!;
      const { db } = await import('../../../db');
      const { leads } = await import('../../../db/schema');
      const { eq } = await import('drizzle-orm');

      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const routing = await routeLead(lead as any);
      return new Response(JSON.stringify(routing), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'leadId, clinicId, or cold-leads required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Intelligent routing error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Manual routing override
 * POST /api/admin/intelligent-routing/route
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { leadId, clinicId, reason } = body;

    if (!leadId || !clinicId) {
      return new Response(JSON.stringify({ error: 'leadId and clinicId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { db } = await import('../../../db');
    const { leads } = await import('../../../db/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(leads).set({ clinicId }).where(eq(leads.id, leadId));

    return new Response(JSON.stringify({
      success: true,
      message: `Lead ${leadId} routed to clinic ${clinicId}. Reason: ${reason || 'manual override'}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Manual routing error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};