import type { APIRoute } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { jobs, clinics } from '../../../db/schema';
import { jobSubmitSchema } from '../../../db/validation';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET — list jobs for the logged-in clinic owner
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
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
        expiresAt: jobs.expiresAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        clinicId: jobs.clinicId,
        clinicName: clinics.name,
      })
      .from(jobs)
      .leftJoin(clinics, eq(jobs.clinicId, clinics.id))
      .where(eq(jobs.clinicId, session.clinicId ?? ''))
      .orderBy(desc(jobs.createdAt));

    return json({ data });
  } catch (err) {
    console.error('[GET /api/portal/jobs]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST — create a new job
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!session.clinicId) {
    return json({ error: 'No clinic linked to your account' }, 403);
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = jobSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Validation failed', details: parsed.error.flatten() }, 422);
    }

    const data = parsed.data;
    const clinicEmail = await getClinicEmail(session.clinicId);

    const [job] = await db
      .insert(jobs)
      .values({
        clinicId: session.clinicId,
        createdBy: session.userId,
        title: data.title,
        roleCategory: data.roleCategory,
        employmentType: data.employmentType,
        location: data.location,
        remote: data.remote,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        salaryDisplay: data.salaryDisplay ?? buildSalaryDisplay(data.salaryMin, data.salaryMax),
        description: data.description,
        requirements: data.requirements ?? null,
        responsibilities: data.responsibilities ?? null,
        benefits: data.benefits ?? null,
        applicationEmail: data.applicationEmail ?? clinicEmail,
        applicationUrl: data.applicationUrl ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: 'active',
      })
      .returning({ id: jobs.id });

    return json({ success: true, id: job.id }, 201);
  } catch (err) {
    console.error('[POST /api/portal/jobs]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

async function getClinicEmail(clinicId: string): Promise<string> {
  const [clinic] = await db
    .select({ email: clinics.email })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);
  return clinic?.email ?? '';
}

function buildSalaryDisplay(min?: number, max?: number): string {
  if (!min && !max) return 'Competitive';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}
