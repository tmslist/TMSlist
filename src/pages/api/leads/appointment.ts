import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { escapeHtml } from '../../../utils/sanitize';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { sendLeadNotification, sendPatientConfirmation } from '../../../utils/email';
import { z } from 'zod';

export const prerender = false;

const appointmentSchema = z.object({
  clinicId: z.string().uuid(),
  clinicName: z.string().max(200),
  clinicEmail: z.string().email().optional(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  preferredDate: z.string().max(20).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  condition: z.string().max(100).optional(),
  insurance: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  consent: z.boolean(),
});

export const POST: APIRoute = async ({ request }) => {
  // Rate limit: 2 per IP per hour
  const ip = getClientIp(request);
  const rateLimited = await strictRateLimit(ip, 2, '1 h', 'appointment:submit');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => i.message).join(', ');
      return new Response(JSON.stringify({ error: 'Validation failed: ' + issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;

    if (!data.consent) {
      return new Response(JSON.stringify({ error: 'Consent is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store as lead with metadata
    const lead = await db.insert(leads).values({
      type: 'specialist_enquiry',
      name: escapeHtml(data.name),
      email: data.email,
      phone: data.phone,
      message: data.message ? escapeHtml(data.message) : undefined,
      clinicId: data.clinicId,
      clinicName: escapeHtml(data.clinicName),
      sourceUrl: request.headers.get('referer') || undefined,
      metadata: {
        form_type: 'appointment_request',
        preferred_date: data.preferredDate,
        preferred_time: data.preferredTime,
        condition: data.condition,
        insurance_provider: data.insurance,
        submitted_at: new Date().toISOString(),
      },
    }).returning();

    // Send notification email to clinic and admin
    const notifyEmail = data.clinicEmail || undefined;
    sendLeadNotification({
      clinicName: data.clinicName,
      clinicEmail: notifyEmail,
      patientName: data.name,
      patientEmail: data.email,
      patientPhone: data.phone,
      message: [
        data.condition ? `Condition: ${data.condition}` : '',
        data.preferredDate ? `Preferred date: ${data.preferredDate}` : '',
        data.preferredTime ? `Preferred time: ${data.preferredTime}` : '',
        data.insurance ? `Insurance: ${data.insurance}` : '',
        data.message || '',
      ].filter(Boolean).join('\n'),
      sourceUrl: request.headers.get('referer') || undefined,
      leadType: 'appointment_request',
      metadata: {
        preferred_date: data.preferredDate,
        preferred_time: data.preferredTime,
        condition: data.condition,
        insurance_provider: data.insurance,
      },
    }).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));

    // Send patient confirmation (fire-and-forget)
    sendPatientConfirmation({
      to: data.email,
      name: data.name,
      leadType: 'appointment_request',
      clinicName: data.clinicName,
    }).catch((err) => console.error("[bg-task] Appointment confirmation failed:", err?.message));

    return new Response(JSON.stringify({ success: true, id: lead[0]?.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Appointment request error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
