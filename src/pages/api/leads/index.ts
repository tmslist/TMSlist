import type { APIRoute } from 'astro';
import { createLead } from '../../../db/queries';
import { leadSubmitSchema } from '../../../db/validation';
import { escapeHtml } from '../../../utils/sanitize';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendLeadNotification } from '../../../utils/email';

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

    // Send email notification (fire-and-forget)
    if (data.clinicName && data.email) {
      sendLeadNotification({
        clinicName: data.clinicName || 'Unknown Clinic',
        clinicEmail: 'leads@tmslist.com',
        patientName: data.name || 'Anonymous',
        patientEmail: data.email,
        patientPhone: data.phone,
        message: data.message || '',
        sourceUrl: data.sourceUrl,
      }).catch(() => {});
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
