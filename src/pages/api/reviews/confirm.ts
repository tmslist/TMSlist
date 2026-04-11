import type { APIRoute } from 'astro';
import { eq, and, like } from 'drizzle-orm';
import { db } from '../../../db';
import { reviews } from '../../../db/schema';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const GET: APIRoute = async ({ url }) => {
  try {
    const token = url.searchParams.get('token');
    const reviewId = url.searchParams.get('id');

    if (!token || !reviewId) {
      return new Response('Missing token or review ID', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Find the review with matching token in userEmail field
    const existing = await db.select().from(reviews)
      .where(
        and(
          eq(reviews.id, reviewId),
          like(reviews.userEmail, `%|verify:${token}`)
        )
      )
      .limit(1);

    if (!existing[0]) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${SITE_URL}/thank-you?status=invalid` },
      });
    }

    if (existing[0].verified) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${SITE_URL}/thank-you?status=already-verified` },
      });
    }

    // Extract the original email (before the |verify: part)
    const originalEmail = existing[0].userEmail?.split('|verify:')[0] || existing[0].userEmail;

    // Mark review as verified and restore the clean email
    await db.update(reviews)
      .set({
        verified: true,
        userEmail: originalEmail,
      })
      .where(eq(reviews.id, reviewId));

    return new Response(null, {
      status: 302,
      headers: { 'Location': `${SITE_URL}/thank-you?status=verified` },
    });
  } catch (err) {
    console.error('Review confirm error:', err);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};
