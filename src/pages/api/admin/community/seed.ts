import type { APIRoute } from 'astro';
import { seedForumCategories } from '../../../../db/forumQueries';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

/**
 * One-time seed endpoint for forum categories.
 * POST /api/admin/community/seed (admin only)
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await seedForumCategories();
    return new Response(JSON.stringify({ success: true, message: 'Forum categories seeded' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Seed error:', err);
    return new Response(JSON.stringify({ error: 'Failed to seed categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
