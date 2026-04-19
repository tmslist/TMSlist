import type { APIRoute } from 'astro';
import { eq, sql, and, desc } from 'drizzle-orm';
import { db } from '../../../db';
import {
  forumCategories, forumPosts, forumComments, forumReports,
  forumVotes, users, auditLog
} from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Forum analytics dashboard
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const view = url.searchParams.get('view');

    if (view === 'categories') {
      const cats = await db.select().from(forumCategories).orderBy(forumCategories.sortOrder);
      return json({ data: cats });
    }

    if (view === 'pending') {
      const posts = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          body: forumPosts.body,
          status: forumPosts.status,
          authorId: forumPosts.authorId,
          categoryId: forumPosts.categoryId,
          createdAt: forumPosts.createdAt,
          voteScore: forumPosts.voteScore,
          commentCount: forumPosts.commentCount,
        })
        .from(forumPosts)
        .where(eq(forumPosts.status, 'pending'))
        .orderBy(desc(forumPosts.createdAt))
        .limit(50);
      return json({ data: posts });
    }

    if (view === 'reports') {
      const reports = await db.execute(sql`
        SELECT fr.*, u.email as reporter_email,
          CASE WHEN fr.target_type = 'post' THEN fp.title ELSE fc.body END as target_content
        FROM forum_reports fr
        LEFT JOIN users u ON u.id = fr.reporter_id
        LEFT JOIN forum_posts fp ON fr.target_type = 'post' AND fp.id = fr.target_id
        LEFT JOIN forum_comments fc ON fr.target_type = 'comment' AND fc.id = fr.target_id
        WHERE fr.resolved = false
        ORDER BY fr.created_at DESC
        LIMIT 50
      `);
      return json({ data: reports.rows || [] });
    }

    // Default: aggregate stats
    const [totalPosts] = await db.select({ count: sql<number>`count(*)` }).from(forumPosts);
    const [pendingPosts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumPosts)
      .where(eq(forumPosts.status, 'pending'));
    const [totalComments] = await db.select({ count: sql<number>`count(*)` }).from(forumComments);
    const [totalReports] = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumReports)
      .where(eq(forumReports.resolved, false));

    const topContributors = await db.execute(sql`
      SELECT u.id, u.email, u.name,
        count(fp.id) as post_count,
        (SELECT count(*) FROM forum_comments WHERE author_id = u.id) as comment_count,
        (SELECT sum(vote_score) FROM forum_posts WHERE author_id = u.id) as total_votes
      FROM users u
      LEFT JOIN forum_posts fp ON fp.author_id = u.id AND fp.status = 'published'
      GROUP BY u.id
      ORDER BY post_count DESC, total_votes DESC
      LIMIT 10
    `);

    const postsByMonth = await db.execute(sql`
      SELECT to_char(created_at, 'YYYY-MM') as month, count(*) as count
      FROM forum_posts
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `);

    return json({
      stats: {
        totalPosts: totalPosts?.count ?? 0,
        pendingPosts: pendingPosts?.count ?? 0,
        totalComments: totalComments?.count ?? 0,
        unresolvedReports: totalReports?.count ?? 0,
      },
      topContributors: topContributors.rows || [],
      postsByMonth: postsByMonth.rows || [],
    });
  } catch (err) {
    console.error('Forum analytics error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Moderate posts/comments, resolve reports
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { action, targetType, targetId, categoryData, postData, reportData } = body;

    if (action === 'resolve_report') {
      await db.update(forumReports).set({
        resolved: true,
        resolvedBy: session.userId,
      }).where(eq(forumReports.id, targetId));

      if (postData?.action === 'hide') {
        await db.update(forumPosts).set({ status: 'removed' })
          .where(eq(forumPosts.id, targetId));
      }

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'resolve_forum_report',
        entityType: 'forum_report',
        entityId: targetId,
        details: { resolved: true },
      });
      return json({ success: true });
    }

    if (action === 'approve_post') {
      await db.update(forumPosts).set({ status: 'published' })
        .where(eq(forumPosts.id, targetId));
      return json({ success: true });
    }

    if (action === 'remove_post') {
      await db.update(forumPosts).set({ status: 'removed' })
        .where(eq(forumPosts.id, targetId));
      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'remove_forum_post',
        entityType: 'forum_post',
        entityId: targetId,
      });
      return json({ success: true });
    }

    if (action === 'create_category') {
      if (!categoryData?.name || !categoryData?.slug) {
        return json({ error: 'name and slug required' }, 400);
      }
      const [cat] = await db.insert(forumCategories).values({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        icon: categoryData.icon || null,
        color: categoryData.color || null,
        sortOrder: categoryData.sortOrder || 0,
      }).returning();
      return json({ success: true, category: cat }, 201);
    }

    if (action === 'update_category') {
      const { id, ...updates } = categoryData;
      if (!id) return json({ error: 'Category ID required' }, 400);
      await db.update(forumCategories).set(updates).where(eq(forumCategories.id, id));
      return json({ success: true });
    }

    if (action === 'delete_category') {
      await db.delete(forumCategories).where(eq(forumCategories.id, targetId));
      return json({ success: true });
    }

    if (action === 'toggle_pin') {
      const post = await db.select().from(forumPosts).where(eq(forumPosts.id, targetId)).limit(1);
      if (post[0]) {
        await db.update(forumPosts).set({ isPinned: !post[0].isPinned })
          .where(eq(forumPosts.id, targetId));
      }
      return json({ success: true });
    }

    if (action === 'toggle_lock') {
      const post = await db.select().from(forumPosts).where(eq(forumPosts.id, targetId)).limit(1);
      if (post[0]) {
        await db.update(forumPosts).set({ isLocked: !post[0].isLocked })
          .where(eq(forumPosts.id, targetId));
      }
      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('Forum moderation error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
