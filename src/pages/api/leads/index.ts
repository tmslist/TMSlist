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
    const parsed = leadSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize text fields
    const data = {
      ...parsed.data,
      name: parsed.data.name ? escapeHtml(parsed.data.name) : undefined,
      message: parsed.data.message ? escapeHtml(parsed.data.message) : undefined,
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
    }).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));

    // Send patient confirmation / autoresponder (fire-and-forget)
    if (data.email && data.name) {
      sendPatientConfirmation({
        to: data.email,
        name: data.name,
        leadType: data.type,
        clinicName: data.clinicName,
        sourceUrl: data.sourceUrl,
      }).catch((err) => console.error("[bg-task] Autoresponder failed:", err?.message));
    }

    return new Response(JSON.stringify({ success: true, id: lead?.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lead submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
