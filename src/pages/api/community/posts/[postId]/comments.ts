import type { APIRoute } from 'astro';
import { getForumComments, createForumComment, getForumPostById, getForumPostBySlug, getForumAuthorInfo } from '../../../../../db/forumQueries';
import { forumCommentSchema } from '../../../../../db/validation';
import { getSessionFromRequest } from '../../../../../utils/auth';
import { strictRateLimit } from '../../../../../utils/rateLimit';
import { sendForumReplyNotification } from '../../../../../utils/email';
import { db } from '../../../../../db';
import { users, forumPosts, forumCategories } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const comments = await getForumComments(postId, limit, offset);

    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    });
  } catch (err) {
    console.error('Forum comments GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check post exists and isn't locked
    const post = await getForumPostById(postId);
    if (!post || post.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (post.isLocked) {
      return new Response(JSON.stringify({ error: 'This thread is locked' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 20 comments per hour per user
    const rateLimited = await strictRateLimit(session.userId, 20, '1 h', 'community:comment');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = forumCommentSchema.safeParse({ ...body, postId });

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid comment data', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment = await createForumComment({
      postId,
      authorId: session.userId,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    });

    // Send email notification to the post author (fire-and-forget, don't block response)
    try {
      if (post.authorId !== session.userId) {
        const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';
        const postAuthor = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, post.authorId)).limit(1);
        const commenterInfo = await getForumAuthorInfo(session.userId);

        // Get category slug for URL
        const catRow = await db.select({ slug: forumCategories.slug }).from(forumCategories).where(eq(forumCategories.id, post.categoryId)).limit(1);
        const postFull = await db.select({ slug: forumPosts.slug }).from(forumPosts).where(eq(forumPosts.id, postId)).limit(1);

        if (postAuthor[0]?.email && catRow[0] && postFull[0]) {
          sendForumReplyNotification({
            recipientEmail: postAuthor[0].email,
            recipientName: postAuthor[0].name || 'there',
            replierName: commenterInfo?.doctorName || commenterInfo?.name || 'Someone',
            postTitle: post.title,
            replyPreview: parsed.data.body,
            threadUrl: `${SITE_URL}/community/${catRow[0].slug}/${postFull[0].slug}`,
          }).catch(() => {}); // Swallow errors — notification is best-effort
        }
      }
    } catch {
      // Don't fail the comment creation if notification fails
    }

    return new Response(JSON.stringify({ comment }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forum comments POST error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
