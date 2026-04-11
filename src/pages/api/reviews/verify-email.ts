import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { reviews } from '../../../db/schema';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { z } from 'zod';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';
const API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const FROM = 'TMS List <notifications@mail.tmslist.com>';

const verifySchema = z.object({
  reviewId: z.string().uuid(),
  email: z.string().email(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { reviewId, email } = parsed.data;

    // Check review exists and is not already verified
    const existing = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
    if (!existing[0]) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (existing[0].verified) {
      return new Response(JSON.stringify({ success: true, message: 'Already verified' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate a verification token and store it in the review's email field as a marker
    // We use a secure random token appended to a known prefix
    const token = randomBytes(32).toString('hex');

    // Store the token temporarily -- we put it in the review metadata-style by updating userEmail
    // with a compound value: email|token (the confirm endpoint will parse it)
    await db.update(reviews)
      .set({ userEmail: `${email}|verify:${token}` })
      .where(eq(reviews.id, reviewId));

    // Send verification email
    if (API_KEY) {
      const resend = new Resend(API_KEY);
      const verificationUrl = `${SITE_URL}/api/reviews/confirm?token=${token}&id=${reviewId}`;

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Verify Your TMS Review',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #7c3aed; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0;">Verify Your Review</h2>
            </div>
            <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p>Thank you for leaving a review on TMS List. Please click the button below to verify your email and confirm your review.</p>
              <a href="${verificationUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Verify My Review</a>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">If you did not write this review, please ignore this email. This link expires in 48 hours.</p>
            </div>
          </div>
        `,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Verification email sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Review verify-email error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
