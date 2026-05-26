import type { APIRoute } from 'astro';
import { sql, gte, desc, eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { forumPosts, forumComments, forumCategories, users } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  const range = url.searchParams.get('range') || '30d';
  const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'all' ? 3650 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const [
      totalPostsRow,
      totalCommentsRow,
      totalUsersRow,
      postsThisWeekRow,
      postsThisMonthRow,
      categoryStats,
      topContribs,
      postsByDay,
      activeUsersByDay,
    ] = await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(forumPosts).where(eq(forumPosts.status, 'published')),
      db.select({ c: sql<number>`count(*)` }).from(forumComments).where(eq(forumComments.status, 'published')),
      db.select({ c: sql<number>`count(distinct ${forumPosts.authorId})` }).from(forumPosts),
      db.select({ c: sql<number>`count(*)` }).from(forumPosts).where(gte(forumPosts.createdAt, sevenDaysAgo)),
      db.select({ c: sql<number>`count(*)` }).from(forumPosts).where(gte(forumPosts.createdAt, thirtyDaysAgo)),
      db.select({
        categoryId: forumCategories.id,
        name: forumCategories.name,
        color: forumCategories.color,
        posts: sql<number>`count(distinct ${forumPosts.id})`,
        comments: sql<number>`count(distinct ${forumComments.id})`,
        avgVotes: sql<number>`coalesce(avg(${forumPosts.voteScore}), 0)`,
      }).from(forumCategories)
        .leftJoin(forumPosts, eq(forumPosts.categoryId, forumCategories.id))
        .leftJoin(forumComments, eq(forumComments.postId, forumPosts.id))
        .groupBy(forumCategories.id)
        .orderBy(desc(sql`count(distinct ${forumPosts.id})`))
        .limit(10),
      db.select({
        userId: users.id,
        name: users.name,
        role: users.role,
        postCount: sql<number>`count(distinct ${forumPosts.id})`,
        commentCount: sql<number>`count(distinct ${forumComments.id})`,
      }).from(users)
        .leftJoin(forumPosts, eq(forumPosts.authorId, users.id))
        .leftJoin(forumComments, eq(forumComments.authorId, users.id))
        .groupBy(users.id)
        .having(sql`count(distinct ${forumPosts.id}) + count(distinct ${forumComments.id}) > 0`)
        .orderBy(desc(sql`count(distinct ${forumPosts.id}) + count(distinct ${forumComments.id})`))
        .limit(8),
      db.select({
        date: sql<string>`date_trunc('day', ${forumPosts.createdAt})::date`.as('date'),
        count: sql<number>`count(*)`.as('count'),
      }).from(forumPosts)
        .where(gte(forumPosts.createdAt, since))
        .groupBy(sql`date_trunc('day', ${forumPosts.createdAt})::date`)
        .orderBy(sql`date`),
      db.select({
        date: sql<string>`date_trunc('day', ${forumPosts.createdAt})::date`.as('date'),
        activeUsers: sql<number>`count(distinct ${forumPosts.authorId})`.as('active_users'),
      }).from(forumPosts)
        .where(gte(forumPosts.createdAt, since))
        .groupBy(sql`date_trunc('day', ${forumPosts.createdAt})::date`)
        .orderBy(sql`date`),
    ]);

    const totalPosts = Number(totalPostsRow[0]?.c ?? 0);
    const totalComments = Number(totalCommentsRow[0]?.c ?? 0);

    const topCategories = categoryStats.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      color: c.color || 'blue',
      postCount: Number(c.posts ?? 0),
      engagement: Math.round(Number(c.avgVotes ?? 0)),
    }));

    const categoryBreakdown = categoryStats.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      color: c.color || 'blue',
      posts: Number(c.posts ?? 0),
      comments: Number(c.comments ?? 0),
      avgVotes: Number(c.avgVotes ?? 0),
    }));

    const topContributors = topContribs.map((u) => ({
      userId: u.userId,
      name: u.name || 'Unknown',
      role: u.role || 'patient',
      postCount: Number(u.postCount ?? 0),
      commentCount: Number(u.commentCount ?? 0),
      score: Number(u.postCount ?? 0) * 10 + Number(u.commentCount ?? 0),
    }));

    return json({
      totalPosts,
      totalComments,
      totalUsers: Number(totalUsersRow[0]?.c ?? 0),
      postsThisWeek: Number(postsThisWeekRow[0]?.c ?? 0),
      postsThisMonth: Number(postsThisMonthRow[0]?.c ?? 0),
      avgCommentsPerPost: totalPosts > 0 ? Number((totalComments / totalPosts).toFixed(2)) : 0,
      topCategories,
      topContributors,
      postFrequency: postsByDay.map((p) => ({ date: p.date, count: Number(p.count) })),
      activeUsers: activeUsersByDay.map((p) => ({ date: p.date, activeUsers: Number(p.activeUsers) })),
      categoryBreakdown,
    });
  } catch (err) {
    console.error('forum/analytics GET', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
