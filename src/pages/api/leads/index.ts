import type { APIRoute } from 'astro';
import { createLead } from '../../../db/queries';
import { leadSubmitSchema } from '../../../db/validation';
import { escapeHtml } from '../../../utils/sanitize';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendLeadNotification, sendPatientConfirmation } from '../../../utils/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();

    // Honeypot — `website` is a hidden field that real users never fill in.
    // Accept the request but silently drop it so bots don't get a useful signal.
    if (body && typeof body === 'object' && typeof body.website === 'string' && body.website.trim().length > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = leadSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize all user-supplied text fields to prevent XSS
    const data = {
      ...parsed.data,
      name: parsed.data.name ? escapeHtml(parsed.data.name) : undefined,
      message: parsed.data.message ? escapeHtml(parsed.data.message) : undefined,
      clinicName: parsed.data.clinicName ? escapeHtml(parsed.data.clinicName) : undefined,
      phone: parsed.data.phone ? escapeHtml(parsed.data.phone) : undefined,
      sourceUrl: parsed.data.sourceUrl || undefined,
    };

    const lead = await createLead(data);

    // Send email notification to admin (fire-and-forget)
    sendLeadNotification({
      clinicName: data.clinicName || 'Unknown Clinic',
      clinicEmail: undefined,
      patientName: data.name || 'Anonymous',
      patientEmail: data.email,
      patientPhone: data.phone,
      message: data.message || '',
      sourceUrl: data.sourceUrl,
      leadType: data.type,
      metadata: data.metadata,
    }).catch((err) => console.error("[email] sendLeadNotification failed:", {
      error: err?.message,
      patientEmail: data.email,
      clinicName: data.clinicName,
      leadId: lead?.[0]?.id,
    }));

    // Send patient confirmation / autoresponder (fire-and-forget)
    if (data.email && data.name) {
      sendPatientConfirmation({
        to: data.email,
        name: data.name,
        leadType: data.type,
        clinicName: data.clinicName,
        sourceUrl: data.sourceUrl,
      }).catch((err) => console.error("[email] sendPatientConfirmation failed:", {
        error: err?.message,
        to: data.email,
        clinicName: data.clinicName,
        leadId: lead?.[0]?.id,
      }));
    }

    // Assert that the insert returned rows
    if (!lead || lead.length === 0) {
      console.error('[leads] Insert returned no rows');
      return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const leadId = lead[0].id;
    return new Response(JSON.stringify({ success: true, id: leadId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lead submit error:', err);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
