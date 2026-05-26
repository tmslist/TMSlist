import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { slugRedirects } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Check redirect table before rendering clinic pages
// This runs as middleware in a real setup, but as an API for simplicity
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) return json({ error: 'slug required' }, 400);

    const [redirect] = await db.select()
      .from(slugRedirects)
      .where(eq(slugRedirects.oldSlug, slug))
      .limit(1);

    if (!redirect) return json({ found: false });

    // Increment hit count
    await db.execute(
      `UPDATE slug_redirects SET hits = hits + 1 WHERE id = $1`,
      [redirect.id]
    );

    return json({
      found: true,
      redirect: {
        oldSlug: redirect.oldSlug,
        newSlug: redirect.newSlug,
        reason: redirect.reason,
        hits: redirect.hits + 1,
      },
    });
  } catch (err) {
    console.error('Redirect check error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json() as {
      oldSlug: string;
      newSlug: string;
      reason?: string;
    };

    if (!body.oldSlug || !body.newSlug) {
      return json({ error: 'oldSlug and newSlug required' }, 400);
    }

    // Upsert redirect
    const existing = await db.select({ id: slugRedirects.id })
      .from(slugRedirects)
      .where(eq(slugRedirects.oldSlug, body.oldSlug))
      .limit(1);

    if (existing.length > 0) {
      await db.update(slugRedirects)
        .set({ newSlug: body.newSlug, reason: body.reason ?? null })
        .where(eq(slugRedirects.oldSlug, body.oldSlug));
    } else {
      await db.insert(slugRedirects).values({
        oldSlug: body.oldSlug,
        newSlug: body.newSlug,
        reason: body.reason ?? null,
        hits: 0,
      });
    }

    return json({ success: true });
  } catch (err) {
    console.error('Redirect create error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json() as { oldSlug: string };
    if (!body.oldSlug) return json({ error: 'oldSlug required' }, 400);

    await db.delete(slugRedirects).where(eq(slugRedirects.oldSlug, body.oldSlug));
    return json({ success: true });
  } catch (err) {
    console.error('Redirect delete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};