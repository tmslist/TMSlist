import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users, leads, reviews, clinics } from '../../../db/schema';
import { eq, gte, and, avg, count, desc } from 'drizzle-orm';
import { Resend } from 'resend';

export const prerender = false;

function buildDigestHtml(data: {
  clinicName: string;
  ownerName: string;
  newLeads: number;
  newReviews: number;
  avgRating: string;
  weekStart: string;
  weekEnd: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:20px;color:#1e293b;margin:0 0 4px;">Weekly Digest</h1>
        <p style="font-size:13px;color:#94a3b8;margin:0;">${data.weekStart} - ${data.weekEnd}</p>
      </div>

      <p style="font-size:15px;color:#475569;margin:0 0 24px;">
        Hi ${data.ownerName || 'there'},<br>
        Here's your weekly summary for <strong>${data.clinicName}</strong>.
      </p>

      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#16a34a;">${data.newLeads}</div>
          <div style="font-size:12px;color:#4ade80;font-weight:600;margin-top:4px;">New Leads</div>
        </div>
        <div style="flex:1;background:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#2563eb;">${data.newReviews}</div>
          <div style="font-size:12px;color:#60a5fa;font-weight:600;margin-top:4px;">New Reviews</div>
        </div>
        <div style="flex:1;background:#faf5ff;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#7c3aed;">${data.avgRating}</div>
          <div style="font-size:12px;color:#a78bfa;font-weight:600;margin-top:4px;">Avg Rating</div>
        </div>
      </div>

      ${data.newLeads > 0 ? `
      <div style="background:#fefce8;border-radius:10px;padding:14px 16px;margin-bottom:16px;border:1px solid #fef08a;">
        <p style="font-size:13px;color:#854d0e;margin:0;">
          You have <strong>${data.newLeads} new lead${data.newLeads === 1 ? '' : 's'}</strong> waiting.
          <a href="https://tmslist.com/portal/leads" style="color:#7c3aed;font-weight:600;">View leads</a>
        </p>
      </div>
      ` : ''}

      ${data.newReviews > 0 ? `
      <div style="background:#f0f9ff;border-radius:10px;padding:14px 16px;margin-bottom:16px;border:1px solid #bae6fd;">
        <p style="font-size:13px;color:#075985;margin:0;">
          You received <strong>${data.newReviews} new review${data.newReviews === 1 ? '' : 's'}</strong>.
          <a href="https://tmslist.com/portal/reviews" style="color:#7c3aed;font-weight:600;">Respond now</a>
        </p>
      </div>
      ` : ''}

      <div style="text-align:center;margin-top:24px;">
        <a href="https://tmslist.com/portal/dashboard" style="display:inline-block;background:#7c3aed;color:white;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
          Open Dashboard
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0 16px;">
      <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0;">
        TMS List - The leading TMS therapy directory<br>
        <a href="https://tmslist.com" style="color:#94a3b8;">tmslist.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET || process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const resend = new Resend(import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY);

    // Get clinic owners
    const owners = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        clinicId: users.clinicId,
      })
      .from(users)
      .where(and(eq(users.role, 'clinic_owner')));

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const weekStart = oneWeekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let sent = 0;
    let skipped = 0;

    for (const owner of owners) {
      if (!owner.clinicId || !owner.email) {
        skipped++;
        continue;
      }

      // Get clinic info
      const [clinic] = await db
        .select({ name: clinics.name, ratingAvg: clinics.ratingAvg })
        .from(clinics)
        .where(eq(clinics.id, owner.clinicId))
        .limit(1);

      if (!clinic) {
        skipped++;
        continue;
      }

      // Count new leads this week
      const [leadResult] = await db
        .select({ total: count() })
        .from(leads)
        .where(and(eq(leads.clinicId, owner.clinicId), gte(leads.createdAt, oneWeekAgo)));

      // Count new reviews this week
      const [reviewResult] = await db
        .select({ total: count() })
        .from(reviews)
        .where(and(eq(reviews.clinicId, owner.clinicId), gte(reviews.createdAt, oneWeekAgo)));

      const newLeads = leadResult?.total ?? 0;
      const newReviews = reviewResult?.total ?? 0;

      // Skip if nothing to report
      if (newLeads === 0 && newReviews === 0) {
        skipped++;
        continue;
      }

      const html = buildDigestHtml({
        clinicName: clinic.name,
        ownerName: owner.name || '',
        newLeads,
        newReviews,
        avgRating: clinic.ratingAvg ? Number(clinic.ratingAvg).toFixed(1) : 'N/A',
        weekStart,
        weekEnd,
      });

      await resend.emails.send({
        from: 'TMS List <digest@mail.tmslist.com>',
        to: owner.email,
        subject: `Weekly Digest: ${newLeads} lead${newLeads === 1 ? '' : 's'}, ${newReviews} review${newReviews === 1 ? '' : 's'} - ${clinic.name}`,
        html,
      });

      sent++;
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, total: owners.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Weekly digest error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send digests' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
