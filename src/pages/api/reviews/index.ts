import type { APIRoute } from 'astro';
import { getReviewsByClinic, createReview, updateClinicRating } from '../../../db/queries';
import { reviewSubmitSchema } from '../../../db/validation';
import { escapeHtml } from '../../../utils/sanitize';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { reviews } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const clinicId = url.searchParams.get('clinicId');
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'clinicId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format to prevent SQL injection
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId)) {
      return new Response(JSON.stringify({ error: 'Invalid clinicId format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reviews = await getReviewsByClinic(clinicId, { approved: true });

    return new Response(JSON.stringify({ data: reviews }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Require authenticated session
    const session = getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'You must be signed in to leave a review.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only patient, viewer, or clinic_owner roles can submit reviews
    if (!['patient', 'viewer', 'clinic_owner'].includes(session.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 3 requests per IP per hour
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 3, '1 h', 'reviews:submit');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = reviewSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isVerifiedEmail = parsed.data.userEmail?.toLowerCase() === session.email.toLowerCase();

    // Block clinic owners from reviewing their own clinic
    if (session.clinicId && session.clinicId === parsed.data.clinicId) {
      return new Response(JSON.stringify({ error: 'You cannot review your own clinic.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate verified review from the same user for the same clinic
    if (session.userId) {
      const existing = await db.select({ id: reviews.id })
        .from(reviews)
        .where(and(
          eq(reviews.userId, session.userId),
          eq(reviews.clinicId, parsed.data.clinicId),
        ))
        .limit(1);

      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: 'You have already reviewed this clinic.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Sanitize user-provided text
    const sanitized = {
      ...parsed.data,
      userName: escapeHtml(parsed.data.userName),
      title: parsed.data.title ? escapeHtml(parsed.data.title) : undefined,
      body: escapeHtml(parsed.data.body),
    };

    // Auto-approve verified reviews; others need moderation
    const approved = isVerifiedEmail;
    const review = await createReview({
      ...sanitized,
      verified: isVerifiedEmail,
      approved,
      userId: session.userId,
    });

    // Update denormalized rating (approved reviews only affect this)
    await updateClinicRating(parsed.data.clinicId);

    return new Response(JSON.stringify({
      success: true,
      review,
      status: approved ? 'published' : 'pending',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Review submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
