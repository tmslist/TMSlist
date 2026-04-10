import type { APIRoute } from 'astro';
import { getReviewsByClinic, createReview, updateClinicRating } from '../../../db/queries';
import { reviewSubmitSchema } from '../../../db/validation';
import { escapeHtml } from '../../../utils/sanitize';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';

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

    // Sanitize user-provided text
    const sanitized = {
      ...parsed.data,
      userName: escapeHtml(parsed.data.userName),
      title: parsed.data.title ? escapeHtml(parsed.data.title) : undefined,
      body: escapeHtml(parsed.data.body),
    };

    const review = await createReview(sanitized);

    // Update denormalized rating (approved reviews only affect this)
    await updateClinicRating(parsed.data.clinicId);

    return new Response(JSON.stringify({ success: true, review }), {
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
