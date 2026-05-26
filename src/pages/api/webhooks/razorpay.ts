import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { subscriptions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const prerender = false;

function verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  // `timingSafeEqual` throws when buffer lengths differ — pre-check to keep
  // the signature mismatch path constant-time and exception-free.
  const expectedBuf = Buffer.from(expected, 'utf8');
  const sigBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = import.meta.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[RazorpayWebhook] RAZORPAY_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500 });
  }

  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const rawBody = await request.text();

  if (!verifyRazorpaySignature(rawBody, signature, webhookSecret)) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  // Idempotency: hash the full body so distinct events with similar prefixes
  // don't collide. The 200-byte slice approach was vulnerable to false hits.
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const eventKey = `razorpay:event:${bodyHash}`;
  const { getCached, setCache } = await import('../../../utils/redis').then(m => m);
  const existing = await getCached<boolean>(eventKey).catch(() => null);
  if (existing) return new Response(JSON.stringify({ received: true }), { status: 200 });
  await setCache(eventKey, true, 86400 * 7).catch(() => {});

  try {
    const event = JSON.parse(rawBody);

    switch (event.event) {
      case 'subscription.activated': {
        const { id, plan_id, customer_id } = event.payload.subscription;
        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.externalId, id))
          .limit(1);

        if (!existing) {
          // Map Razorpay plan ID to our plan enum
          const planMap: Record<string, string> = {
            [import.meta.env.RAZORPAY_PLAN_PRO ?? '']: 'pro',
            [import.meta.env.RAZORPAY_PLAN_PREMIUM ?? '']: 'premium',
            [import.meta.env.RAZORPAY_PLAN_ENTERPRISE ?? '']: 'enterprise',
          };
          // Validate that the clinicId in `notes` is a UUID we recognise —
          // anyone with checkout access can stuff arbitrary strings in
          // metadata. The signature verifies the Razorpay envelope, NOT the
          // user-supplied notes inside it.
          const rawClinicId = event.payload.subscription.entity?.notes?.clinicId;
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          let clinicIdToStore: string | null = null;
          if (typeof rawClinicId === 'string' && UUID_RE.test(rawClinicId)) {
            const { clinics } = await import('../../../db/schema');
            const exists = await db.select({ id: clinics.id }).from(clinics).where(eq(clinics.id, rawClinicId)).limit(1);
            if (exists.length > 0) clinicIdToStore = rawClinicId;
          }
          await db.insert(subscriptions).values({
            externalId: id,
            plan: planMap[plan_id] ?? 'pro',
            status: 'active',
            clinicId: clinicIdToStore,
          });
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.paused': {
        const subId = event.payload.subscription.entity?.id;
        await db
          .update(subscriptions)
          .set({ status: 'cancelled' })
          .where(eq(subscriptions.externalId, subId));
        break;
      }

      case 'payment.failed': {
        const paymentId = event.payload.payment.entity?.id;
        console.warn(`[RazorpayWebhook] Payment failed: ${paymentId}`);
        break;
      }

      default:
        console.log(`[RazorpayWebhook] Unhandled event: ${event.event}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('[RazorpayWebhook] Error processing event:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Processing failed' }), { status: 500 });
  }
};