import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { clinicId, referralCode, source } = body;

    if (!clinicId || !referralCode) {
      return new Response(
        JSON.stringify({ error: 'clinicId and referralCode are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
