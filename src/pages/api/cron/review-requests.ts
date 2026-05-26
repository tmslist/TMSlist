/**
 * Review-request cron — sends pending review-request emails via Resend.
 *
 * Picks up `lead_reminders` rows where reminder_at <= now, isCompleted=false,
 * and the message contains "review request". For each one:
 *   1. Loads the lead + its clinic.
 *   2. Skips if the patient already has an approved review for that clinic
 *      (no double-asking once they've already reviewed).
 *   3. Sends via sendReviewRequestEmail (Resend).
 *   4. Marks reminder isCompleted=true on success; leaves it for retry on failure.
 *
 * Schedule suggestion: every 30 minutes  ->  cron 0,30 * * * *
 */

import type { APIRoute } from 'astro';
import { and, eq, ilike, lte, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { leadReminders, leads, clinics, reviews, auditLog } from '../../../db/schema';
import { sendReviewRequestEmail } from '../../../utils/reviewCollection';
import { requireCronAuth } from '../../../utils/cronAuth';

export const prerender = false;

const RATE_LIMIT_MS = 600;
const BATCH_SIZE = 50;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const POST: APIRoute = async ({ request }) => {
  const denied = requireCronAuth(request);
  if (denied) return denied;
  return runReviewRequests();
};

// Allow GET for manual probing (still gated by CRON_SECRET).
export const GET: APIRoute = async ({ request }) => {
  const denied = requireCronAuth(request);
  if (denied) return denied;
  return runReviewRequests();
};

async function runReviewRequests(): Promise<Response> {
  const now = new Date();

  const due = await db
    .select({
      reminderId: leadReminders.id,
      reminderMessage: leadReminders.message,
      reminderAt: leadReminders.reminderAt,
      leadId: leadReminders.leadId,
      patientName: leads.name,
      patientEmail: leads.email,
      clinicId: leads.clinicId,
      clinicName: clinics.name,
      clinicSlug: clinics.slug,
    })
    .from(leadReminders)
    .leftJoin(leads, eq(leadReminders.leadId, leads.id))
    .leftJoin(clinics, eq(leads.clinicId, clinics.id))
    .where(
      and(
        eq(leadReminders.isCompleted, false),
        lte(leadReminders.reminderAt, now),
        ilike(leadReminders.message, '%review request%'),
      ),
    )
    .limit(BATCH_SIZE);

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const reasons: Record<string, number> = {};

  for (const row of due) {
    if (!row.patientEmail || !row.clinicSlug || !row.clinicName) {
      reasons.missing_data = (reasons.missing_data || 0) + 1;
      skipped++;
      // Mark complete so we don't retry forever on incomplete data.
      await db.update(leadReminders).set({ isCompleted: true }).where(eq(leadReminders.id, row.reminderId));
      continue;
    }

    // Skip if patient already left an approved review for this clinic.
    if (row.clinicId) {
      const existing = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(
          and(
            eq(reviews.clinicId, row.clinicId),
            eq(reviews.userEmail, row.patientEmail),
            eq(reviews.approved, true),
          ),
        )
        .limit(1);
      if (existing.length > 0) {
        reasons.already_reviewed = (reasons.already_reviewed || 0) + 1;
        skipped++;
        await db.update(leadReminders).set({ isCompleted: true }).where(eq(leadReminders.id, row.reminderId));
        continue;
      }
    }

    try {
      const ok = await sendReviewRequestEmail({
        patientName: row.patientName || 'there',
        patientEmail: row.patientEmail,
        clinicName: row.clinicName,
        clinicSlug: row.clinicSlug,
      });
      if (ok) {
        await db.update(leadReminders).set({ isCompleted: true }).where(eq(leadReminders.id, row.reminderId));
        // Annotate the lead so we can see send history.
        const leadRow = await db.select().from(leads).where(eq(leads.id, row.leadId)).limit(1);
        const meta = (leadRow[0]?.metadata && typeof leadRow[0].metadata === 'object'
          ? leadRow[0].metadata
          : {}) as Record<string, unknown>;
        const sentList = Array.isArray(meta.reviewRequestSentAt) ? [...meta.reviewRequestSentAt] : [];
        sentList.push(new Date().toISOString());
        await db.update(leads).set({ metadata: { ...meta, reviewRequestSentAt: sentList } }).where(eq(leads.id, row.leadId));
        sent++;
      } else {
        failed++;
        reasons.send_failed = (reasons.send_failed || 0) + 1;
      }
    } catch (err) {
      console.error('[cron/review-requests] send error', row.reminderId, err);
      failed++;
      reasons.exception = (reasons.exception || 0) + 1;
    }

    // Resend free tier: keep under ~100/min — RATE_LIMIT_MS gives us a safe pace.
    await sleep(RATE_LIMIT_MS);
  }

  try {
    await db.insert(auditLog).values({
      userId: null,
      action: 'cron_review_requests',
      entityType: 'cron',
      entityId: null,
      details: { processed: due.length, sent, skipped, failed, reasons },
    });
  } catch (err) {
    console.error('[cron/review-requests] audit log failed', err);
  }

  return new Response(
    JSON.stringify({ processed: due.length, sent, skipped, failed, reasons, hasMore: due.length === BATCH_SIZE }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
