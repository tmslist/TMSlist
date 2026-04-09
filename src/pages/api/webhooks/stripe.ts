import type { APIRoute } from 'astro';
import { verifyWebhookSignature } from '../../../utils/stripe';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, auditLog } from '../../../db/schema';

export const prerender = false;

const WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook not configured', { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const clinicId = session.metadata?.clinicId;
        const type = session.metadata?.type;

        if (clinicId && type === 'featured_listing') {
          await db.update(clinics)
            .set({ isFeatured: true, updatedAt: new Date() })
            .where(eq(clinics.id, clinicId));

          await db.insert(auditLog).values({
            action: 'featured_listing_activated',
            entityType: 'clinic',
            entityId: clinicId,
            details: { stripeSessionId: session.id, subscriptionId: session.subscription },
          });
        }

        if (clinicId && type === 'verified_badge') {
          await db.update(clinics)
            .set({ verified: true, updatedAt: new Date() })
            .where(eq(clinics.id, clinicId));

          await db.insert(auditLog).values({
            action: 'verified_badge_purchased',
            entityType: 'clinic',
            entityId: clinicId,
            details: { stripeSessionId: session.id },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        // Find clinic by subscription metadata and remove featured status
        const clinicId = subscription.metadata?.clinicId;
        if (clinicId) {
          await db.update(clinics)
            .set({ isFeatured: false, updatedAt: new Date() })
            .where(eq(clinics.id, clinicId));
        }
        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return new Response('Webhook processing failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};
