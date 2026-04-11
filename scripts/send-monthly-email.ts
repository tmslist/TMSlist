/**
 * Monthly Partner Email Sender (standalone script for VPS cron)
 *
 * Automatically picks the right email template based on current month.
 * Sends to all clinics with valid emails. Logs progress.
 *
 * Usage:
 *   npx tsx scripts/send-monthly-email.ts              # send current month's email
 *   npx tsx scripts/send-monthly-email.ts --month 6    # force a specific month
 *   npx tsx scripts/send-monthly-email.ts --dry-run    # preview without sending
 *   npx tsx scripts/send-monthly-email.ts --limit 10   # send to first 10 only
 *
 * VPS Cron (1st of every month at 9 AM UTC):
 *   0 9 1 * * cd /path/to/tmslist && RESEND_API_KEY=xxx npx tsx scripts/send-monthly-email.ts >> /tmp/monthly-email.log 2>&1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLINICS_PATH = path.resolve(__dirname, '../src/data/clinics.json');
const LOG_DIR = path.resolve(__dirname, 'data');

const RATE_LIMIT_MS = 600;
const FROM_EMAIL = 'TMS List <login@mail.tmslist.com>';
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';

// Month names for display
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Email templates mapped by month (same as monthlyEmails.ts but standalone)
const MONTHLY_SUBJECTS: Record<number, string> = {
  5: 'Your First Month on TMS List',
  6: 'What TMS Patients Are Actually Searching For',
  7: 'How Reviews Are Driving TMS Patient Decisions',
  8: 'TMS Industry Update — What\'s Changing in 2026',
  9: 'Your 6-Month TMS List Report',
  10: '5 Ways to Attract More TMS Patients This Fall',
  11: 'Open Enrollment Is Here — Is Your Insurance List Current?',
  12: 'Thank You — TMS List\'s Year in Review',
  1: 'January Is Peak TMS Search Season — Are You Ready?',
  2: 'How Does Your Clinic Compare?',
  3: 'Happy Anniversary! A Year on TMS List',
};

// ── Args ──────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const monthIdx = args.indexOf('--month');
const limitIdx = args.indexOf('--limit');

const now = new Date();
const targetMonth = monthIdx >= 0 ? parseInt(args[monthIdx + 1]) : now.getMonth() + 1;
const sendLimit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Dynamically import the templates (they use import.meta.env)
  // For standalone script, we inline the template loading
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY && !isDryRun) {
    console.error('RESEND_API_KEY required. Set it or use --dry-run');
    process.exit(1);
  }

  // Check if this month has a template
  if (targetMonth === 4) {
    console.log('Month 4 (April) is the welcome email — use send-welcome-emails.ts instead.');
    process.exit(0);
  }

  const subjectTemplate = MONTHLY_SUBJECTS[targetMonth];
  if (!subjectTemplate) {
    console.error(`No email template defined for month ${targetMonth}`);
    process.exit(1);
  }

  // Load clinics
  const clinics: Record<string, any>[] = JSON.parse(fs.readFileSync(CLINICS_PATH, 'utf-8'));
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const eligible = clinics
    .filter(c => c.email && emailRegex.test(c.email))
    .slice(0, sendLimit);

  // Load sent log for this month to avoid duplicates
  const logFile = path.resolve(LOG_DIR, `monthly-email-${now.getFullYear()}-${String(targetMonth).padStart(2, '0')}.json`);
  let sentLog: Record<string, { status: string; sentAt: string }> = {};
  if (fs.existsSync(logFile)) {
    sentLog = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  }
  const alreadySent = new Set(Object.keys(sentLog).filter(k => sentLog[k].status === 'sent'));
  const pending = eligible.filter(c => !alreadySent.has(c.email));

  console.log(`\n========================================`);
  console.log(`  Monthly Partner Email`);
  console.log(`========================================`);
  console.log(`  Month:          ${MONTH_NAMES[targetMonth]} (${targetMonth})`);
  console.log(`  Subject:        ${subjectTemplate}`);
  console.log(`  Mode:           ${isDryRun ? 'DRY RUN' : 'LIVE SEND'}`);
  console.log(`  Total eligible: ${eligible.length}`);
  console.log(`  Already sent:   ${alreadySent.size}`);
  console.log(`  To send now:    ${pending.length}`);
  console.log(`  Est. time:      ~${Math.round(pending.length * RATE_LIMIT_MS / 60000)} minutes`);
  console.log(`========================================\n`);

  if (pending.length === 0) {
    console.log('Nothing to send.');
    return;
  }

  if (isDryRun) {
    console.log('DRY RUN — first 10 recipients:\n');
    for (const c of pending.slice(0, 10)) {
      console.log(`  ${c.name} <${c.email}>`);
    }
    console.log(`\n  ... and ${Math.max(0, pending.length - 10)} more`);
    return;
  }

  // Dynamically import templates
  const { MONTHLY_EMAILS } = await import('../src/utils/monthlyEmails');
  const templateFn = MONTHLY_EMAILS[targetMonth];
  if (!templateFn) {
    console.error('Template function not found');
    process.exit(1);
  }

  const resend = new Resend(RESEND_API_KEY);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const clinic = pending[i];
    const clinicData = {
      name: clinic.name,
      email: clinic.email,
      city: clinic.city || '',
      state: clinic.state || '',
      slug: clinic.slug || '',
    };

    try {
      const { subject, html } = templateFn(clinicData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: clinic.email,
        subject,
        html,
        replyTo: FOUNDER_EMAIL,
      });

      if (result.error) {
        sentLog[clinic.email] = { status: 'failed', sentAt: new Date().toISOString() };
        failed++;
      } else {
        sentLog[clinic.email] = { status: 'sent', sentAt: new Date().toISOString() };
        sent++;
      }
    } catch (err: any) {
      sentLog[clinic.email] = { status: 'failed', sentAt: new Date().toISOString() };
      failed++;
    }

    const total = sent + failed;
    if (total % 50 === 0 || total === pending.length) {
      const pct = Math.round(total / pending.length * 100);
      console.log(`  [${pct}%] ${total}/${pending.length} — ${sent} sent, ${failed} failed`);
      fs.writeFileSync(logFile, JSON.stringify(sentLog, null, 2));
    }

    await sleep(RATE_LIMIT_MS);
  }

  fs.writeFileSync(logFile, JSON.stringify(sentLog, null, 2));

  console.log(`\n========================================`);
  console.log(`  Complete: ${sent} sent, ${failed} failed`);
  console.log(`  Log: ${logFile}`);
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
