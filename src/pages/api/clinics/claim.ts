import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinicClaims, clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '../../../utils/rateLimit.js';
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

    // Check clinic exists. Pull listed email + website so we can validate
    // the requested email is plausibly tied to the actual business.
    const clinic = await db.select({
      id: clinics.id,
      name: clinics.name,
      email: clinics.email,
      website: clinics.website,
    }).from(clinics).where(eq(clinics.id, parsed.data.clinicId)).limit(1);

    if (!clinic[0]) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Defense against takeover: only send verification email to:
    //   (a) the exact email already on file for this clinic, OR
    //   (b) an email at the clinic's website domain.
    // Otherwise an attacker could simply submit their own email and become
    // the listed owner. If the clinic has no email AND no website on record,
    // the claim must go through manual admin review (queued as `pending`
    // without sending a verification email automatically).
    const submitted = parsed.data.email.toLowerCase().trim();
    const onFile = clinic[0].email?.toLowerCase().trim() || '';
    const webDomain = (() => {
      const w = clinic[0].website;
      if (!w) return '';
      try { return new URL(w.startsWith('http') ? w : `https://${w}`).hostname.replace(/^www\./, '').toLowerCase(); }
      catch { return ''; }
    })();
    const submittedDomain = submitted.split('@')[1] || '';

    const allowAutoVerify = !!onFile && submitted === onFile;
    const allowDomainVerify = !!webDomain && submittedDomain === webDomain;
    const requireManualReview = !allowAutoVerify && !allowDomainVerify;

    if (requireManualReview && !onFile && !webDomain) {
      // No way to autoverify — queue for admin without sending email.
      await db.insert(clinicClaims).values({
        clinicId: parsed.data.clinicId,
        email: submitted,
        verificationToken: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
      });
      return new Response(JSON.stringify({
        success: true,
        message: 'Submitted for admin review. We will follow up via the contact info on file.',
      }), { status: 202, headers: { 'Content-Type': 'application/json' } });
    }

    if (requireManualReview) {
      return new Response(JSON.stringify({
        error: `Verification can only be sent to the email on file (${onFile.replace(/(.{2}).*(@.+)/, '$1***$2')}) or an address at ${webDomain}.`,
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
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
