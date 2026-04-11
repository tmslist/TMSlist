/**
 * Automated Email Campaign Manager
 *
 * Runs daily via Vercel/VPS cron. Automatically determines what to send:
 *   - Welcome emails: sent once after first deploy (tracks in site_settings)
 *   - Monthly emails: sent on 1st-3rd of each month (one per month, auto-selected)
 *
 * Self-chaining: sends 400 per invocation, then calls itself for the next batch.
 * Fully autonomous — no manual setup needed after deploy.
 *
 * Schedule: daily at 9 AM UTC → 0 9 * * *
 */

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { db } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { MONTHLY_EMAILS } from '../../../utils/monthlyEmails';
import type { ClinicData } from '../../../utils/monthlyEmails';
import clinicsData from '../../../data/clinics.json';
import fs from 'fs';
import path from 'path';

export const prerender = false;

const FROM_EMAIL = 'TMS List <login@mail.tmslist.com>';
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';
const RATE_LIMIT_MS = 600;
const BATCH_SIZE = 400;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Database State Management ──────────────────────────────

interface CampaignState {
  welcomeSent: boolean;
  welcomeSentAt?: string;
  welcomeSentCount?: number;
  monthlySent: Record<string, boolean>; // "2026-05": true
  sentEmails: Record<string, string[]>; // "welcome": ["email1", "email2"]
}

async function getCampaignState(): Promise<CampaignState> {
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, 'email_campaigns')).limit(1);
  if (result[0]?.value) {
    return result[0].value as CampaignState;
  }
  return { welcomeSent: false, monthlySent: {}, sentEmails: {} };
}

async function saveCampaignState(state: CampaignState): Promise<void> {
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'email_campaigns')).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettings)
      .set({ value: state as any, updatedAt: new Date() })
      .where(eq(siteSettings.key, 'email_campaigns'));
  } else {
    await db.insert(siteSettings).values({
      key: 'email_campaigns',
      value: state as any,
    });
  }
}

// ── Clinic List ──────────────────────────────────

function getEligibleClinics(): ClinicData[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (clinicsData as Record<string, any>[])
    .filter(c => c.email && emailRegex.test(c.email))
    .map(c => ({
      name: c.name,
      email: c.email,
      city: c.city || '',
      state: c.state || '',
      slug: c.slug || '',
    }));
}

// ── Welcome Email HTML ──────────────────────────────────

function buildWelcomeHtml(clinicName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f0f4f8;">Your clinic is now live on TMS List. Claim your free profile today.</div>
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">
  <div style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa);border-radius:4px 4px 0 0;"></div>
  <div style="background:#fff;padding:40px 40px 24px;text-align:center;border-bottom:1px solid #f1f5f9;">
    <h1 style="color:#0f172a;font-size:32px;margin:0;font-weight:700;letter-spacing:-0.5px;">TMS List</h1>
    <p style="color:#6366f1;font-size:13px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;font-weight:600;">America's TMS Provider Directory</p>
  </div>
  <div style="background:#fff;padding:40px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:24px;padding:6px 16px;">
        <span style="color:#16a34a;font-size:13px;font-weight:600;">LAUNCHING APRIL 2026</span>
      </div>
    </div>
    <h2 style="color:#0f172a;font-size:24px;margin:0 0 20px;text-align:center;font-weight:700;line-height:1.3;">${clinicName} is Now Live on TMS List</h2>
    <p style="color:#475569;font-size:16px;line-height:1.75;margin:0 0 20px;text-align:center;">We're thrilled to officially welcome you to <strong>TMS List</strong> — the largest and most comprehensive directory of TMS therapy providers across the United States.</p>
    <p style="color:#475569;font-size:16px;line-height:1.75;margin:0 0 24px;">Your clinic profile has been created using verified public data, and patients in your area are <strong>already searching for TMS providers like you</strong>. We're actively driving enquiries from people seeking TMS therapy for depression, OCD, anxiety, and more.</p>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 32px;border:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="33%" style="text-align:center;padding:8px;"><div style="color:#6366f1;font-size:28px;font-weight:700;">4,100+</div><div style="color:#64748b;font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Clinics Listed</div></td>
          <td width="33%" style="text-align:center;padding:8px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;"><div style="color:#6366f1;font-size:28px;font-weight:700;">50</div><div style="color:#64748b;font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">States Covered</div></td>
          <td width="33%" style="text-align:center;padding:8px;"><div style="color:#6366f1;font-size:28px;font-weight:700;">Free</div><div style="color:#64748b;font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">To Get Listed</div></td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <p style="color:#334155;font-size:15px;margin:0 0 16px;font-weight:600;">Log in to claim your profile and keep your details up to date:</p>
      <a href="${SITE_URL}/portal" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(99,102,241,0.4);">Log In to Your Clinic Portal</a>
      <p style="color:#94a3b8;font-size:13px;margin:12px 0 0;">Use your clinic email to receive a secure magic login link — no password needed.</p>
    </div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
    <h3 style="color:#0f172a;font-size:18px;margin:0 0 16px;font-weight:700;">Once you log in, you can:</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:10px 12px 10px 0;vertical-align:top;width:28px;"><div style="width:24px;height:24px;background:#ede9fe;border-radius:6px;text-align:center;line-height:24px;color:#6366f1;font-size:14px;font-weight:700;">1</div></td><td style="padding:10px 0;"><strong style="color:#0f172a;font-size:15px;">Verify &amp; claim your clinic</strong><p style="color:#64748b;font-size:14px;margin:4px 0 0;line-height:1.5;">Confirm ownership to get the verified badge on your profile.</p></td></tr>
      <tr><td style="padding:10px 12px 10px 0;vertical-align:top;"><div style="width:24px;height:24px;background:#ede9fe;border-radius:6px;text-align:center;line-height:24px;color:#6366f1;font-size:14px;font-weight:700;">2</div></td><td style="padding:10px 0;"><strong style="color:#0f172a;font-size:15px;">Complete your profile</strong><p style="color:#64748b;font-size:14px;margin:4px 0 0;line-height:1.5;">Add your TMS machines, insurance accepted, specialties, photos, and opening hours.</p></td></tr>
      <tr><td style="padding:10px 12px 10px 0;vertical-align:top;"><div style="width:24px;height:24px;background:#ede9fe;border-radius:6px;text-align:center;line-height:24px;color:#6366f1;font-size:14px;font-weight:700;">3</div></td><td style="padding:10px 0;"><strong style="color:#0f172a;font-size:15px;">Start receiving patient enquiries</strong><p style="color:#64748b;font-size:14px;margin:4px 0 0;line-height:1.5;">Patients can contact you directly through your listing. Track all leads from your dashboard.</p></td></tr>
      <tr><td style="padding:10px 12px 10px 0;vertical-align:top;"><div style="width:24px;height:24px;background:#ede9fe;border-radius:6px;text-align:center;line-height:24px;color:#6366f1;font-size:14px;font-weight:700;">4</div></td><td style="padding:10px 0;"><strong style="color:#0f172a;font-size:15px;">Manage reviews &amp; reputation</strong><p style="color:#64748b;font-size:14px;margin:4px 0 0;line-height:1.5;">Respond to patient reviews and build trust with prospective patients.</p></td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
    <div style="background:linear-gradient(135deg,#eef2ff,#faf5ff);border-radius:12px;padding:28px 32px;border:1px solid #c7d2fe;margin:0 0 32px;">
      <h3 style="color:#4338ca;font-size:18px;margin:0 0 12px;font-weight:700;">Exclusive Launch Offer</h3>
      <p style="color:#3730a3;font-size:15px;line-height:1.7;margin:0 0 12px;">We're hand-selecting a group of TMS clinics to receive <strong>3 months of completely free profile management</strong> — including:</p>
      <ul style="color:#3730a3;font-size:15px;line-height:2;margin:0 0 16px;padding-left:20px;"><li>Priority placement in search results</li><li>Professional profile optimization</li><li>Lead tracking &amp; analytics dashboard</li><li>Review management tools</li></ul>
      <p style="color:#3730a3;font-size:15px;line-height:1.7;margin:0;"><strong>No credit card required. No strings attached.</strong> Just claim your profile to be considered.</p>
    </div>
    <div style="background:#fffbeb;border-radius:12px;padding:28px 32px;border:1px solid #fde68a;">
      <h3 style="color:#92400e;font-size:16px;margin:0 0 12px;font-weight:700;">A Note from the Founder</h3>
      <p style="color:#78350f;font-size:15px;line-height:1.7;margin:0 0 12px;">Hi, I'm Arush — the founder of TMS List. I built this platform because I believe every person struggling with treatment-resistant depression deserves easy access to TMS therapy providers near them.</p>
      <p style="color:#78350f;font-size:15px;line-height:1.7;margin:0 0 16px;">I'd love to hear from you. Whether it's feedback on your listing, ideas for the platform, or if you're interested in marketing your practice to more patients — my inbox is always open.</p>
      <p style="margin:0;"><a href="mailto:${FOUNDER_EMAIL}" style="display:inline-block;background:#f59e0b;color:#78350f;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:700;">Reach Out to Arush</a></p>
      <p style="color:#a16207;font-size:13px;margin:12px 0 0;">${FOUNDER_EMAIL}</p>
    </div>
  </div>
  <div style="background:#f8fafc;padding:28px 40px;border-top:1px solid #e2e8f0;border-radius:0 0 4px 4px;">
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px;text-align:center;">You're receiving this email because your clinic is listed on <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">tmslist.com</a>. Your listing was created using verified public business data.</p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px;text-align:center;">Want to update or remove your listing? Reply to this email or contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#94a3b8;">${FOUNDER_EMAIL}</a></p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 12px;text-align:center;"><a href="mailto:${FOUNDER_EMAIL}?subject=Unsubscribe%20from%20TMS%20List%20emails&body=Please%20unsubscribe%20my%20clinic%20from%20future%20emails." style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>
    <p style="color:#cbd5e1;font-size:11px;margin:16px 0 0;text-align:center;">&copy; 2026 Rain AI LLC</p>
  </div>
</div>
</body></html>`;
}

// ── Send Batch ──────────────────────────────────

async function sendBatch(
  resend: InstanceType<typeof Resend>,
  clinics: ClinicData[],
  getEmail: (clinic: ClinicData) => { subject: string; html: string },
  alreadySent: Set<string>,
): Promise<{ sent: number; failed: number; sentEmails: string[] }> {
  let sent = 0;
  let failed = 0;
  const sentEmails: string[] = [];

  for (const clinic of clinics) {
    if (alreadySent.has(clinic.email)) continue;

    try {
      const { subject, html } = getEmail(clinic);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: clinic.email,
        subject,
        html,
        replyTo: FOUNDER_EMAIL,
      });

      if (result.error) {
        failed++;
      } else {
        sent++;
        sentEmails.push(clinic.email);
      }
    } catch {
      failed++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  return { sent, failed, sentEmails };
}

// ── Main Handler ──────────────────────────────────

export const GET: APIRoute = async ({ request }) => {
  // Auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  const resend = new Resend(RESEND_KEY);
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const forceType = url.searchParams.get('type'); // 'welcome' or 'monthly'

  // Load state
  const state = await getCampaignState();
  const allClinics = getEligibleClinics();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonth = now.getMonth() + 1;

  // ── Decide what to send ──────────────────────────────

  let campaignType: 'welcome' | 'monthly' | 'none' = 'none';

  if (forceType === 'welcome' || forceType === 'monthly') {
    campaignType = forceType;
  } else if (!state.welcomeSent) {
    campaignType = 'welcome';
  } else if (!state.monthlySent[monthKey] && currentMonth !== 4 && MONTHLY_EMAILS[currentMonth]) {
    // Send monthly on days 1-3 of the month (buffer for cron timing)
    if (now.getDate() <= 3) {
      campaignType = 'monthly';
    }
  }

  if (campaignType === 'none') {
    return Response.json({
      status: 'idle',
      message: 'No campaigns to send right now',
      welcomeSent: state.welcomeSent,
      monthlySentThisMonth: state.monthlySent[monthKey] || false,
      currentMonth,
    });
  }

  // ── Batch the recipients ──────────────────────────────

  const alreadySent = new Set<string>(state.sentEmails[campaignType] || []);
  const pending = allClinics.filter(c => !alreadySent.has(c.email));
  const batch = pending.slice(offset, offset + BATCH_SIZE);
  const remaining = pending.length - offset - batch.length;

  if (batch.length === 0) {
    // Mark campaign complete
    if (campaignType === 'welcome') {
      state.welcomeSent = true;
      state.welcomeSentAt = now.toISOString();
      state.welcomeSentCount = alreadySent.size;
    } else {
      state.monthlySent[monthKey] = true;
    }
    await saveCampaignState(state);

    return Response.json({
      status: 'complete',
      campaign: campaignType,
      totalSent: alreadySent.size,
    });
  }

  // ── Send ──────────────────────────────

  let getEmail: (clinic: ClinicData) => { subject: string; html: string };

  if (campaignType === 'welcome') {
    getEmail = (clinic) => ({
      subject: `Welcome to TMS List — Your Clinic Profile is Live!`,
      html: buildWelcomeHtml(clinic.name),
    });
  } else {
    const templateFn = MONTHLY_EMAILS[currentMonth];
    if (!templateFn) {
      return Response.json({ error: `No template for month ${currentMonth}` }, { status: 400 });
    }
    getEmail = (clinic) => templateFn(clinic);
  }

  const result = await sendBatch(resend, batch, getEmail, alreadySent);

  // Update state with newly sent emails
  if (!state.sentEmails[campaignType]) state.sentEmails[campaignType] = [];
  state.sentEmails[campaignType].push(...result.sentEmails);
  await saveCampaignState(state);

  // Chain next batch
  const hasMore = remaining > 0;
  if (hasMore) {
    const nextOffset = offset + BATCH_SIZE;
    try {
      fetch(`${SITE_URL}/api/cron/email-campaigns?offset=${nextOffset}&type=${campaignType}`, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      }).catch(() => {});
    } catch {}
  }

  return Response.json({
    status: hasMore ? 'in_progress' : 'complete',
    campaign: campaignType,
    batch: { offset, sent: result.sent, failed: result.failed },
    remaining,
    totalClinics: allClinics.length,
    totalSentSoFar: (state.sentEmails[campaignType]?.length || 0),
  });
};
