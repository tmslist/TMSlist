import type { APIRoute } from 'astro';
import { db } from '../../../../../db';
import { clinics } from '../../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  const { id } = params;
  if (!id) return json({ error: 'Missing clinic id' }, 400);

  try {
    const body = await request.json() as {
      suffix?: string;
    };

    const [source] = await db.select({ id: clinics.id, name: clinics.name, city: clinics.city })
      .from(clinics).where(eq(clinics.id, id)).limit(1);

    if (!source) return json({ error: 'Source clinic not found' }, 404);

    const suffix = body.suffix ?? ' (Copy)';
    const timestamp = Date.now().toString(36);
    const baseSlug = source.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSlug = `${baseSlug}-${timestamp}`;
    const newName = `${source.name}${suffix}`;

    await db.insert(clinics).values({
      name: newName,
      slug: newSlug,
      city: source.city,
      state: '', // State not in the select
      providerType: 'tms_center',
      verified: false,
      isFeatured: false,
      ratingAvg: '0',
      reviewCount: 0,
      country: 'US',
      createdBy: { name: 'Admin Clone', source: 'admin-clone' },
    });

    return json({ success: true, newSlug, newName });
  } catch (err) {
    console.error('Clone error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};