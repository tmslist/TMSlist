import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads, clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendLeadNotification } from '../../../utils/email';
import { sendLeadSms } from '../../../utils/sms';
import { z } from 'zod';

export const prerender = false;

const messageSchema = z.object({
  clinicId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(5).max(5000),
  condition: z.string().max(100).optional(),
  insurance: z.string().max(100).optional(),
  urgency: z.enum(['routine', 'soon', 'urgent']).default('routine'),
});

/**
 * In-app messaging — patient sends structured message to clinic.
 * Creates a lead record and notifies via email + SMS.
 */
export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get clinic details
    const clinicData = await db.select().from(clinics).where(eq(clinics.id, parsed.data.clinicId)).limit(1);
    const clinic = clinicData[0];

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build structured message
    const structuredMessage = [
      parsed.data.subject ? `Subject: ${parsed.data.subject}` : null,
      `Message: ${parsed.data.message}`,
      parsed.data.condition ? `Condition: ${parsed.data.condition}` : null,
      parsed.data.insurance ? `Insurance: ${parsed.data.insurance}` : null,
      `Urgency: ${parsed.data.urgency}`,
    ].filter(Boolean).join('\n');

    // Create lead
    const result = await db.insert(leads).values({
      type: 'specialist_enquiry',
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: structuredMessage,
      clinicId: parsed.data.clinicId,
      clinicName: clinic.name,
      sourceUrl: request.headers.get('referer') || undefined,
      metadata: {
        subject: parsed.data.subject,
        condition: parsed.data.condition,
        insurance: parsed.data.insurance,
        urgency: parsed.data.urgency,
        channel: 'in_app_message',
      },
    }).returning();

    // Notify clinic via email
    if (clinic.email) {
      sendLeadNotification({
        clinicName: clinic.name,
        clinicEmail: clinic.email,
        patientName: parsed.data.name,
        patientEmail: parsed.data.email,
        patientPhone: parsed.data.phone,
        message: structuredMessage,
      }).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));
    }

    // Notify clinic via SMS
    if (clinic.phone) {
      sendLeadSms({
        clinicPhone: clinic.phone,
        clinicName: clinic.name,
        patientName: parsed.data.name,
        patientPhone: parsed.data.phone,
        condition: parsed.data.condition,
      }).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));
    }

    // Track analytics
    fetch(new URL('/api/analytics/track', request.url).href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId: parsed.data.clinicId, event: 'lead_submit' }),
    }).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));

    return new Response(JSON.stringify({ success: true, id: result[0]?.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Message send error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
