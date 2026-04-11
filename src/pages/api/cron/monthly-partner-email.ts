/**
 * Monthly Partner Email Cron
 *
 * Sends the appropriate monthly email to all clinic partners.
 * Automatically selects the right template based on current month.
 * Tracks sent emails to avoid duplicates within the same month.
 *
 * Schedule: 1st of every month at 9:00 AM UTC
 * VPS cron: 0 9 1 * * cd /path/to/tmslist && npx tsx scripts/send-monthly-email.ts
 */

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { MONTHLY_EMAILS } from '../../../utils/monthlyEmails';
import type { ClinicData } from '../../../utils/monthlyEmails';
import clinicsData from '../../../data/clinics.json';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const prerender = false;

const FROM_EMAIL = 'TMS List <login@mail.tmslist.com>';
const RATE_LIMIT_MS = 600;
const BATCH_SIZE = 400;
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const GET: APIRoute = async ({ request }) => {
  // Auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  // Determine which month's email to send
  const url = new URL(request.url);
  const now = new Date();
  const currentMonth = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1));
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const emailTemplate = MONTHLY_EMAILS[currentMonth];
  if (!emailTemplate) {
    return Response.json({
      status: 'skipped',
      reason: `No email template for month ${currentMonth} (April is welcome email, handled separately)`,
    });
  }

  // Build recipient list
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const allClinics = (clinicsData as Record<string, any>[])
    .filter(c => c.email && emailRegex.test(c.email))
    .map(c => ({
      name: c.name,
      email: c.email,
      city: c.city || '',
      state: c.state || '',
      slug: c.slug || '',
    } as ClinicData));

  const batch = allClinics.slice(offset, offset + BATCH_SIZE);
  const remaining = allClinics.length - offset - batch.length;

  if (batch.length === 0) {
    return Response.json({
      status: 'complete',
      month: currentMonth,
      totalSent: offset,
    });
  }

  const resend = new Resend(RESEND_KEY);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const clinic of batch) {
    try {
      const { subject, html } = emailTemplate(clinic);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: clinic.email,
        subject,
        html,
        replyTo: FOUNDER_EMAIL,
      });

      if (result.error) {
        failed++;
        errors.push(`${clinic.email}: ${result.error.message}`);
      } else {
        sent++;
      }
    } catch (err: any) {
      failed++;
      errors.push(`${clinic.email}: ${err.message || String(err)}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  // Chain next batch if needed
  const hasMore = remaining > 0;
  if (hasMore) {
    const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';
    const nextOffset = offset + BATCH_SIZE;
    try {
      fetch(`${siteUrl}/api/cron/monthly-partner-email?month=${currentMonth}&offset=${nextOffset}`, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      }).catch(() => {});
    } catch {}
  }

  return Response.json({
    status: hasMore ? 'in_progress' : 'complete',
    month: currentMonth,
    batch: { offset, sent, failed, errors: errors.slice(0, 10) },
    remaining,
    totalClinics: allClinics.length,
  });
};
