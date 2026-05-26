import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { leads, clinics } from '../../../db/schema';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { getPostHogServer } from '../../../lib/posthog-server';

export const prerender = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Hard rate limit — endpoint is unauthenticated and writes leads,
    // so it's a high-value target for analytics pollution.
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 10, '5 m', 'referral:track');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { clinicId, referralCode, source } = body as {
      clinicId?: string;
      referralCode?: string;
      source?: string;
    };

    if (!clinicId || !referralCode) {
      return new Response(
        JSON.stringify({ error: 'clinicId and referralCode are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate format to block injection / arbitrary string pollution.
    if (typeof clinicId !== 'string' || !UUID_RE.test(clinicId)) {
      return new Response(JSON.stringify({ error: 'Invalid clinicId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof referralCode !== 'string' || referralCode.length > 64 || !/^[A-Za-z0-9_-]{4,64}$/.test(referralCode)) {
      return new Response(JSON.stringify({ error: 'Invalid referralCode' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (source !== undefined && (typeof source !== 'string' || source.length > 256)) {
      return new Response(JSON.stringify({ error: 'Invalid source' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Confirm the clinic actually exists — silently dropping bogus clinicIds
    // prevents the table from filling with leads pointed at non-existent rows.
    const clinicExists = await db.select({ id: clinics.id }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    if (clinicExists.length === 0) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [lead] = await db
      .insert(leads)
      .values({
        type: 'specialist_enquiry',
        clinicId,
        sourceUrl: source || null,
        metadata: {
          type: 'referral',
          referralCode,
          source: source || 'direct',
          trackedAt: new Date().toISOString(),
        },
      })
      .returning({ id: leads.id });

    const sessionId = request.headers.get('X-PostHog-Session-Id');
    getPostHogServer().capture({
      distinctId: referralCode,
      event: 'referral_tracked',
      properties: {
        $session_id: sessionId || undefined,
        clinic_id: clinicId,
        referral_code: referralCode,
        source: source || 'direct',
        tracking_id: lead.id,
      },
    });

    return new Response(
      JSON.stringify({ success: true, trackingId: lead.id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Referral tracking error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
