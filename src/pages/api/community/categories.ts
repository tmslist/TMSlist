import type { APIRoute } from 'astro';
import { getForumCategories } from '../../../db/forumQueries';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const categories = await getForumCategories();

    return new Response(JSON.stringify({ categories }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('Forum categories error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
