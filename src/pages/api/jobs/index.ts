import type { APIRoute } from 'astro';
import { eq, desc, ilike, and, or, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { jobs, clinics } from '../../../db/schema';
import { jobQuerySchema } from '../../../db/validation';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = jobQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400);
    }
    const { search, state, city, roleCategory, employmentType, remote, status, sort, limit, offset } = parsed.data;

    const conditions = [eq(jobs.status, 'active')];

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(jobs.title, term),
          ilike(clinics.name, term),
          ilike(jobs.location, term)
        ) as unknown as ReturnType<typeof eq>
      );
    }

    if (state) {
      conditions.push(ilike(clinics.state, state) as unknown as ReturnType<typeof eq>);
    }

    if (city) {
      conditions.push(ilike(clinics.city, city) as unknown as ReturnType<typeof eq>);
    }

    if (roleCategory) {
      conditions.push(eq(jobs.roleCategory, roleCategory as any));
    }

    if (employmentType) {
      conditions.push(eq(jobs.employmentType, employmentType as any));
    }

    if (remote !== undefined) {
      conditions.push(eq(jobs.remote, remote));
    }

    const orderBy = sort === 'oldest' ? jobs.createdAt : desc(jobs.createdAt);

    const data = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        roleCategory: jobs.roleCategory,
        employmentType: jobs.employmentType,
        location: jobs.location,
        remote: jobs.remote,
        salaryDisplay: jobs.salaryDisplay,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        description: jobs.description,
        status: jobs.status,
        applicationCount: jobs.applicationCount,
        viewCount: jobs.viewCount,
        expiresAt: jobs.expiresAt,
        createdAt: jobs.createdAt,
        clinicId: jobs.clinicId,
        clinicName: clinics.name,
        clinicCity: clinics.city,
        clinicState: clinics.state,
        clinicLogo: clinics.media,
      })
      .from(jobs)
      .leftJoin(clinics, eq(jobs.clinicId, clinics.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .leftJoin(clinics, eq(jobs.clinicId, clinics.id))
      .where(and(...conditions));

    return json({ data, total: Number(countResult[0]?.count ?? 0), limit, offset });
  } catch (err) {
    console.error('[GET /api/jobs]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
