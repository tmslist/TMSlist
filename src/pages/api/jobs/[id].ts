import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { jobs, clinics } from '../../../db/schema';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const { id } = params;
    if (!id) return json({ error: 'Missing job ID' }, 400);

    const [job] = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        roleCategory: jobs.roleCategory,
        employmentType: jobs.employmentType,
        location: jobs.location,
        remote: jobs.remote,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryDisplay: jobs.salaryDisplay,
        description: jobs.description,
        requirements: jobs.requirements,
        responsibilities: jobs.responsibilities,
        benefits: jobs.benefits,
        applicationEmail: jobs.applicationEmail,
        applicationUrl: jobs.applicationUrl,
        status: jobs.status,
        viewCount: jobs.viewCount,
        applicationCount: jobs.applicationCount,
        expiresAt: jobs.expiresAt,
        createdAt: jobs.createdAt,
        clinicId: jobs.clinicId,
        createdBy: jobs.createdBy,
        clinicName: clinics.name,
        clinicCity: clinics.city,
        clinicState: clinics.state,
        clinicZip: clinics.zip,
        clinicAddress: clinics.address,
        clinicPhone: clinics.phone,
        clinicEmail: clinics.email,
        clinicWebsite: clinics.website,
        clinicLogo: clinics.media,
        clinicSlug: clinics.slug,
      })
      .from(jobs)
      .leftJoin(clinics, eq(jobs.clinicId, clinics.id))
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) return json({ error: 'Job not found' }, 404);
    if (job.status !== 'active') return json({ error: 'Job is not available' }, 410);

    // Increment view count
    await db
      .update(jobs)
      .set({ viewCount: sql`${jobs.viewCount} + 1` })
      .where(eq(jobs.id, id));

    return json({ data: job });
  } catch (err) {
    console.error('[GET /api/jobs/[id]]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
