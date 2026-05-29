import type { APIRoute } from 'astro';
import { getTrendingPosts } from '../../../db/forumQueries';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    const hoursBack = timeframe === '7d' ? 168 : 24;

    const posts = await getTrendingPosts(5, hoursBack);

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, s-maxage=120',
      },
    });
  } catch (err) {
    console.error('Trending posts GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};