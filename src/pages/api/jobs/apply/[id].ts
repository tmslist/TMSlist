import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { jobs, jobApplications, clinics, notifications, users } from '../../../../db/schema';
import { jobApplicationSubmitSchema } from '../../../../db/validation';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) return json({ error: 'Missing job ID' }, 400);

    // Fetch job with clinic info
    const [job] = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        applicationEmail: jobs.applicationEmail,
        applicationUrl: jobs.applicationUrl,
        clinicId: jobs.clinicId,
        clinicName: clinics.name,
        status: jobs.status,
      })
      .from(jobs)
      .leftJoin(clinics, eq(jobs.clinicId, clinics.id))
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) return json({ error: 'Job not found' }, 404);
    if (job.status !== 'active') return json({ error: 'This job is no longer accepting applications' }, 410);

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = jobApplicationSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Validation failed', details: parsed.error.flatten() }, 422);
    }
    const { applicantName, applicantEmail, applicantPhone, resumeUrl, coverLetter, linkedInUrl } = parsed.data;

    // Check for duplicate application
    const [existing] = await db
      .select({ id: jobApplications.id })
      .from(jobApplications)
      .where(eq(jobApplications.jobId, id))
      .limit(1);

    // Use clinic email as fallback
    const sendToEmail = job.applicationEmail || job.clinicName || '';

    // Insert application
    const [application] = await db
      .insert(jobApplications)
      .values({
        jobId: id,
        clinicId: job.clinicId,
        applicantName,
        applicantEmail,
        applicantPhone: applicantPhone || null,
        resumeUrl: resumeUrl || null,
        coverLetter: coverLetter || null,
        linkedInUrl: linkedInUrl || null,
        clinicOwnerEmail: sendToEmail,
        status: 'new',
      })
      .returning({ id: jobApplications.id });

    // Increment application count
    await db
      .update(jobs)
      .set({ applicationCount: sql`${jobs.applicationCount} + 1` })
      .where(eq(jobs.id, id));

    // Send notification to clinic owner
    try {
      const owner = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.clinicId, job.clinicId))
        .limit(1);

      if (owner[0]) {
        await db.insert(notifications).values({
          userId: owner[0].userId,
          type: 'new_job_application',
          title: 'New job application',
          message: `${applicantName} applied for "${job.title}"`,
          link: '/portal/jobs/',
          metadata: { jobId: id, applicationId: application.id },
        });
      }
    } catch (notifErr) {
      console.error('[job apply] notification error:', notifErr);
    }

    // Send email to clinic owner (fire-and-forget)
    sendApplicationEmail({
      to: sendToEmail,
      jobTitle: job.title,
      applicantName,
      applicantEmail,
      coverLetter: coverLetter || '',
    }).catch((err) => console.error('[job apply] email error:', err));

    return json({ success: true, applicationId: application.id, message: 'Application submitted successfully' }, 201);
  } catch (err) {
    console.error('[POST /api/jobs/apply/[id]]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

async function sendApplicationEmail(opts: {
  to: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
}) {
  const { to, jobTitle, applicantName, applicantEmail, coverLetter } = opts;
  if (!to || !applicantEmail) return;

  const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('[sendApplicationEmail] RESEND_API_KEY not set');
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Job Application</h2>
      <p><strong>Position:</strong> ${jobTitle}</p>
      <hr style="border: 1px solid #e5e7eb; margin: 16px 0;"/>
      <p><strong>Applicant:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
      ${coverLetter ? `<p><strong>Cover Letter:</strong></p><blockquote style="border-left: 3px solid #4F46E5; padding-left: 16px; color: #4b5563;">${coverLetter.replace(/\n/g, '<br/>')}</blockquote>` : ''}
      <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">This application was submitted via TMS List Jobs.</p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TMS List Jobs <jobs@tmslist.com>',
      to: [to],
      subject: `New Application: ${jobTitle}`,
      html,
    }),
  });
}
