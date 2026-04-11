import type { APIRoute } from 'astro';
import { getUserForumProfile, getUserForumPosts, getUserForumComments } from '../../../../db/forumQueries';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { userId } = params;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || 'posts';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const profile = await getUserForumProfile(userId);
    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let items;
    if (tab === 'comments') {
      items = await getUserForumComments(userId, limit, offset);
    } else {
      items = await getUserForumPosts(userId, limit, offset);
    }

    return new Response(JSON.stringify({ profile, items }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (err) {
    console.error('User profile error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
