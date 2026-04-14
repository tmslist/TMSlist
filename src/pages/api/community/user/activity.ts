import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../../utils/auth';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { forumPosts, forumComments } from '../../../../db/schema';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ activity: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [posts, comments] = await Promise.all([
      db.select({
        id: forumPosts.id,
        title: forumPosts.title,
        slug: forumPosts.slug,
        category: forumPosts.category,
        createdAt: forumPosts.createdAt,
        status: forumPosts.status,
      })
        .from(forumPosts)
        .where(eq(forumPosts.authorId, session.userId))
        .orderBy(desc(forumPosts.createdAt))
        .limit(20),

      db.select({
        id: forumComments.id,
        postTitle: forumPosts.title,
        postSlug: forumPosts.slug,
        category: forumPosts.category,
        createdAt: forumComments.createdAt,
      })
        .from(forumComments)
        .innerJoin(forumPosts, eq(forumComments.postId, forumPosts.id))
        .where(eq(forumComments.authorId, session.userId))
        .orderBy(desc(forumComments.createdAt))
        .limit(20),
    ]);

    const activity = [
      ...posts.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        postSlug: p.slug,
        action: p.status === 'published' ? 'Posted a thread' : 'Drafted a thread',
        createdAt: p.createdAt,
        type: 'post',
      })),
      ...comments.map(c => ({
        id: c.id,
        title: c.postTitle,
        category: c.category,
        postSlug: c.postSlug,
        action: 'Left a comment',
        createdAt: c.createdAt,
        type: 'comment',
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

    return new Response(JSON.stringify({ activity }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ activity: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};