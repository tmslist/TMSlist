import type { APIRoute } from 'astro';
import { getPatientEnquiries, createPatientEnquiry, updatePatientEnquiry, getPatientEnquiryStats } from '../../../db/queries';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const opts = {
    status: url.searchParams.get('status') ?? undefined,
    doctorId: url.searchParams.get('doctorId') ?? undefined,
    assignedTo: url.searchParams.get('assignedTo') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    limit: Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200),
    offset: parseInt(url.searchParams.get('offset') ?? '0'),
  };

  try {
    const [enquiries, stats] = await Promise.all([
      getPatientEnquiries(opts),
      getPatientEnquiryStats(),
    ]);
    return new Response(JSON.stringify({ enquiries, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const enquiry = await createPatientEnquiry(body);
    return new Response(JSON.stringify({ enquiry }), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id && !body.ids) {
      return new Response(JSON.stringify({ error: 'id or ids required' }), { status: 400 });
    }

    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { patientEnquiries } = await import('../../../db/schema');
      const { eq: eqCond, inArray } = await import('drizzle-orm');
      const updates: Record<string, unknown> = {};
      if (body.status) updates.status = body.status;
      if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo || null;
      if (body.priority) updates.priority = body.priority;
      updates.updatedAt = new Date();
      await db.update(patientEnquiries).set(updates as any).where(inArray((patientEnquiries as any).id, body.ids));
      return new Response(JSON.stringify({ success: true, updated: body.ids.length }), { status: 200 });
    }

    // Single update
    if (!body.id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
    }
    const { id, ...data } = body;
    const enquiry = await updatePatientEnquiry(id, data);
    return new Response(JSON.stringify({ enquiry: enquiry[0] }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');

  if (!idsParam) {
    return new Response(JSON.stringify({ error: 'ids required' }), { status: 400 });
  }

  const ids = idsParam.split(',').filter(Boolean);
  if (ids.length === 0) {
    return new Response(JSON.stringify({ error: 'ids required' }), { status: 400 });
  }

  try {
    const { patientEnquiries } = await import('../../../db/schema');
    const { inArray } = await import('drizzle-orm');
    await db.update(patientEnquiries).set({ deletedAt: new Date() } as any).where(inArray((patientEnquiries as any).id, ids));
    return new Response(JSON.stringify({ success: true, deleted: ids.length }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
