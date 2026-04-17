import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinicClaims, clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendVerificationEmail } from '../../../utils/email';
import { z } from 'zod';
import crypto from 'crypto';
import { getPostHogServer } from '../../../lib/posthog-server';

export const prerender = false;

const claimSchema = z.object({
  clinicId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = claimSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check clinic exists
    const clinic = await db.select({ id: clinics.id, name: clinics.name })
      .from(clinics).where(eq(clinics.id, parsed.data.clinicId)).limit(1);

    if (!clinic[0]) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await db.insert(clinicClaims).values({
      clinicId: parsed.data.clinicId,
      email: parsed.data.email,
      verificationToken: token,
      expiresAt,
    });

    // Send verification email
    const siteUrl = import.meta.env.SITE_URL || 'https://tmslist.com';
    await sendVerificationEmail({
      email: parsed.data.email,
      clinicName: clinic[0].name,
      verificationUrl: `${siteUrl}/api/clinics/verify?token=${token}`,
    }).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));

    const sessionId = request.headers.get('X-PostHog-Session-Id');
    getPostHogServer().capture({
      distinctId: parsed.data.email,
      event: 'clinic_claim_initiated',
      properties: {
        $session_id: sessionId || undefined,
        clinic_id: parsed.data.clinicId,
        clinic_name: clinic[0].name,
        claimant_name: parsed.data.name,
      },
    });

    return new Response(JSON.stringify({ success: true, message: 'Verification email sent' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Clinic claim error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
