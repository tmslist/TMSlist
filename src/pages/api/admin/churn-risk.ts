import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { calculateChurnRisk, getAllAtRiskClinics, logRetentionAction } from '../../../utils/churnPrediction';

export const prerender = false;

/**
 * Churn risk API
 * GET /api/admin/churn-risk — list at-risk clinics
 * GET /api/admin/churn-risk/:clinicId — get specific clinic risk
 * POST /api/admin/churn-risk/:clinicId/intervention — log retention action
 */
export const GET: APIRoute = async ({ url, request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pathParts = url.pathname.split('/').filter(Boolean);
  const clinicId = pathParts[pathParts.length - 1];

  try {
    // List all at-risk clinics
    if (pathParts.length <= 2 || clinicId === 'churn-risk') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const riskLevel = url.searchParams.get('riskLevel');

      const atRisk = await getAllAtRiskClinics(limit);

      let filtered = atRisk;
      if (riskLevel) {
        filtered = atRisk.filter((c) => c.riskLevel === riskLevel);
      }

      const summary = {
        critical: atRisk.filter((c) => c.riskLevel === 'critical' || c.riskScore >= 50).length,
        high: atRisk.filter((c) => c.riskLevel === 'high').length,
        medium: atRisk.filter((c) => c.riskLevel === 'medium').length,
        low: atRisk.filter((c) => c.riskLevel === 'low').length,
      };

      return new Response(JSON.stringify({ clinics: filtered, summary }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Specific clinic risk
    if (clinicId && clinicId !== 'churn-risk') {
      const risk = await calculateChurnRisk(clinicId);
      return new Response(JSON.stringify(risk), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Churn risk error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Log a retention intervention
 * POST /api/admin/churn-risk/:clinicId/intervention
 */
export const POST: APIRoute = async ({ url, request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pathParts = url.pathname.split('/').filter(Boolean);
  const clinicId = pathParts[pathParts.length - 1];

  if (!clinicId || clinicId === 'churn-risk') {
    return new Response(JSON.stringify({ error: 'clinicId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { actionType, note } = body;

    if (!actionType) {
      return new Response(JSON.stringify({ error: 'actionType required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logRetentionAction(clinicId, actionType, 'success');

    return new Response(JSON.stringify({
      success: true,
      message: `Retention action '${actionType}' logged for clinic ${clinicId}`,
      note: note || undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Churn intervention error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};