import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendFunnelEmail, DRIP_SEQUENCES, type FunnelSegment, type FunnelContact } from '../../../utils/nurtureFunnel';
import { z } from 'zod';
import { getPostHogServer } from '../../../lib/posthog-server';

export const prerender = false;

const enterSchema = z.object({
  segment: z.enum(['newsletter', 'lead_magnet', 'patient', 'clinic_owner', 'specialist']),
  email: z.string().email(),
  name: z.string().min(1).max(200),
  // Optional metadata for personalization
  state: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  condition: z.string().max(100).optional(),
  insurance: z.string().max(100).optional(),
  clinicName: z.string().max(200).optional(),
  specialty: z.string().max(200).optional(),
  guideTitle: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
});

/**
 * Enter a contact into a nurturing funnel.
 * Stores the contact, sends the first drip email immediately.
 */
export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = enterSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { segment, email, name, ...meta } = parsed.data;

    // Map funnel segment to lead type
    const leadTypeMap: Record<FunnelSegment, 'newsletter' | 'lead_magnet' | 'specialist_enquiry' | 'quiz_lead'> = {
      newsletter: 'newsletter',
      lead_magnet: 'lead_magnet',
      patient: 'newsletter',
      clinic_owner: 'specialist_enquiry',
      specialist: 'specialist_enquiry',
    };

    // Store in leads table with funnel metadata
    await db.insert(leads).values({
      type: leadTypeMap[segment],
      name,
      email,
      clinicName: meta.clinicName,
      metadata: {
        funnel_segment: segment,
        funnel_entered_at: new Date().toISOString(),
        funnel_completed_steps: [],
        state: meta.state,
        city: meta.city,
        condition: meta.condition,
        insurance: meta.insurance,
        specialty: meta.specialty,
        guide_title: meta.guideTitle,
        source: meta.source || 'website',
      },
    });

    // Send the first drip email (delay=0) immediately
    const contact: FunnelContact = {
      email,
      name,
      segment,
      metadata: {
        state: meta.state || '',
        city: meta.city || '',
        condition: meta.condition || '',
        guide_title: meta.guideTitle || '',
      },
    };

    const firstStep = DRIP_SEQUENCES[segment]?.[0];
    if (firstStep && firstStep.delayDays === 0) {
      sendFunnelEmail(contact, firstStep).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));
    }

    const sessionId = request.headers.get('X-PostHog-Session-Id');
    getPostHogServer().capture({
      distinctId: email,
      event: 'funnel_entered',
      properties: {
        $session_id: sessionId || undefined,
        segment,
        source: meta.source || 'website',
        condition: meta.condition,
        state: meta.state,
        city: meta.city,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      segment,
      message: `Entered ${segment} funnel`,
      totalSteps: DRIP_SEQUENCES[segment]?.length || 0,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Funnel entry error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
