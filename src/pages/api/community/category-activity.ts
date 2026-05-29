import type { APIRoute } from 'astro';
import { getCategoryActivity } from '../../../db/forumQueries';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const hoursBack = parseInt(url.searchParams.get('hours') || '24', 10);

    const categories = await getCategoryActivity(hoursBack);

    return new Response(JSON.stringify({ categories }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (err) {
    console.error('Category activity GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};