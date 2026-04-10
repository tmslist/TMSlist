import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { sql, and, isNotNull } from 'drizzle-orm';
import { sendFunnelEmail, getNextDripStep, type FunnelSegment, type FunnelContact } from '../../../utils/nurtureFunnel';

export const prerender = false;

/**
 * Drip processor — called by cron job (e.g., daily).
 * Finds all funnel contacts with pending drip emails and sends them.
 *
 * Security: Protected by a secret token in the query string.
 * Set CRON_SECRET in your environment and call:
 * GET /api/funnel/process-drips?secret=YOUR_CRON_SECRET
 */
export const GET: APIRoute = async ({ request, url }) => {
  // Check Authorization header first, fall back to query param for backwards compat
  const authHeader = request.headers.get('authorization');
  const secret = authHeader?.replace('Bearer ', '') || url.searchParams.get('secret');
  const expectedSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Find all leads that are part of a funnel (have funnel_segment in metadata)
    const funnelLeads = await db.select().from(leads)
      .where(and(
        isNotNull(leads.metadata),
        sql`${leads.metadata}->>'funnel_segment' IS NOT NULL`,
        sql`${leads.metadata}->>'funnel_entered_at' IS NOT NULL`,
      ))
      .limit(500); // Process in batches

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const lead of funnelLeads) {
      const meta = lead.metadata as Record<string, any>;
      const segment = meta.funnel_segment as FunnelSegment;
      const enteredAt = new Date(meta.funnel_entered_at);
      const completedSteps: string[] = meta.funnel_completed_steps || [];

      if (!segment || !enteredAt) {
        skipped++;
        continue;
      }

      // Check if there's a step due
      const nextStep = getNextDripStep(segment, enteredAt, completedSteps);

      if (!nextStep) {
        skipped++;
        continue;
      }

      // Build contact
      const contact: FunnelContact = {
        email: lead.email || '',
        name: lead.name || 'there',
        segment,
        metadata: {
          state: meta.state || '',
          city: meta.city || '',
          condition: meta.condition || '',
          guide_title: meta.guide_title || '',
        },
      };

      if (!contact.email) {
        skipped++;
        continue;
      }

      // Send the email
      const success = await sendFunnelEmail(contact, nextStep);

      if (success) {
        // Mark step as completed
        const updatedSteps = [...completedSteps, nextStep.stepId];
        await db.execute(sql`
          UPDATE leads
          SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{funnel_completed_steps}',
            ${JSON.stringify(updatedSteps)}::jsonb
          )
          WHERE id = ${lead.id}
        `);
        sent++;
      } else {
        errors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: funnelLeads.length,
      sent,
      skipped,
      errors,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Drip processor error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
