import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { blogPosts } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10'), 50));

    // Get top blog posts by engagement metrics
    const topPosts = await db.execute(sql`
      SELECT
        id,
        title,
        slug,
        published_at,
        (SELECT COUNT(*)::int FROM forum_posts fp WHERE fp.body ILIKE '%' || blog_posts.slug || '%') +
        COALESCE((metadata->>'views')::int, 0) as views,
        COALESCE((metadata->>'shares')::int, 0) as shares,
        COALESCE((metadata->>'engagement')::int, 0) as engagement
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY views DESC, engagement DESC
      LIMIT ${limit}
    `);

    const rows = (topPosts as unknown as {
      rows: {
        id: string;
        title: string;
        slug: string;
        published_at: string | null;
        views: number;
        shares: number;
        engagement: number;
      };
    })?.rows ?? [];

    const items = rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      slug: String(r.slug),
      publishedAt: r.published_at ? String(r.published_at) : null,
      views: Number(r.views ?? 0),
      engagement: Number(r.engagement ?? 0),
      shares: Number(r.shares ?? 0),
    }));

    return json({ items });
  } catch (err) {
    console.error('Content performance error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
