import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendFunnelEmail, DRIP_SEQUENCES } from '../../../utils/nurtureFunnel';
import { z } from 'zod';

export const prerender = false;

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  interests: z.array(z.string()).optional(),
  source: z.string().max(100).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store as newsletter lead with funnel tracking
    await db.insert(leads).values({
      type: 'newsletter',
      email: parsed.data.email,
      name: parsed.data.name,
      metadata: {
        funnel_segment: 'newsletter',
        funnel_entered_at: new Date().toISOString(),
        funnel_completed_steps: ['newsletter_welcome'],
        state: parsed.data.state,
        interests: parsed.data.interests,
        source: parsed.data.source || 'website',
      },
    });

    // Send welcome drip email immediately via funnel
    const firstStep = DRIP_SEQUENCES.newsletter[0];
    if (firstStep) {
      sendFunnelEmail(
        { email: parsed.data.email, name: parsed.data.name || 'there', segment: 'newsletter', metadata: { state: parsed.data.state || '' } },
        firstStep
      ).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
