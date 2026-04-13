import type { APIRoute } from 'astro';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { jobs, clinics } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ url, request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Unauthorized' }, 401);

  try {
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${jobs.title} ILIKE ${'%' + search + '%'} OR ${clinics.name} ILIKE ${'%' + search + '%'})`
      );
    }
    if (status) {
      conditions.push(eq(jobs.status, status as any));
    }

    const data = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        roleCategory: jobs.roleCategory,
        employmentType: jobs.employmentType,
        location: jobs.location,
        remote: jobs.remote,
        salaryDisplay: jobs.salaryDisplay,
        status: jobs.status,
        viewCount: jobs.viewCount,
        applicationCount: jobs.applicationCount,
        createdAt: jobs.createdAt,
        clinicId: jobs.clinicId,
        clinicName: clinics.name,
      })
      .from(jobs)
      .leftJoin(clinics, eq(jobs.clinicId, clinics.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(jobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(countResult[0]?.count ?? 0);

    return json({ data, total });
  } catch (err) {
    console.error('Admin jobs error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
