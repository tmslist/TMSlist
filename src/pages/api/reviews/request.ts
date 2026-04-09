import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { users, clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { sendReviewRequestEmail } from '../../../utils/reviewCollection';
import { sendSms } from '../../../utils/reviewCollection';
import { checkRateLimit } from '../../../utils/rateLimit';
import { z } from 'zod';

export const prerender = false;

const requestSchema = z.object({
  patientName: z.string().min(1).max(100),
  patientEmail: z.string().email().optional(),
  patientPhone: z.string().max(20).optional(),
  method: z.enum(['email', 'sms', 'both']).default('email'),
});

/**
 * Send review request to a patient after treatment completion.
 * Only clinic owners can trigger this.
 */
export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!parsed.data.patientEmail && !parsed.data.patientPhone) {
      return new Response(JSON.stringify({ error: 'Either email or phone required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get clinic info
    const user = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
    const clinicId = user[0]?.clinicId;
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const clinicData = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    const clinic = clinicData[0];
    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const results: { email?: boolean; sms?: boolean } = {};

    if ((parsed.data.method === 'email' || parsed.data.method === 'both') && parsed.data.patientEmail) {
      results.email = await sendReviewRequestEmail({
        patientName: parsed.data.patientName,
        patientEmail: parsed.data.patientEmail,
        clinicName: clinic.name,
        clinicSlug: clinic.slug,
      });
    }

    if ((parsed.data.method === 'sms' || parsed.data.method === 'both') && parsed.data.patientPhone) {
      results.sms = await sendSms(
        parsed.data.patientPhone,
        `Hi ${parsed.data.patientName}, we hope your TMS treatment at ${clinic.name} is going well! We'd love your feedback: tmslist.com/clinic/${clinic.slug}#reviews`
      );
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Review request error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
