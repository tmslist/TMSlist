/**
 * Bulk send welcome emails to all imported clinic emails.
 *
 * - Reads clinic emails from clinics.json (gsheet- imports only)
 * - Sends personalized HTML email via Resend
 * - Rate limited to 2/sec (Resend free tier)
 * - Logs progress and failures to scripts/data/email-send-log.json
 *
 * Usage:
 *   npx tsx scripts/send-welcome-emails.ts              # send all
 *   npx tsx scripts/send-welcome-emails.ts --dry-run     # preview without sending
 *   npx tsx scripts/send-welcome-emails.ts --limit 10    # send to first 10 only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLINICS_PATH = path.resolve(__dirname, '../src/data/clinics.json');
const TEMPLATE_PATH = path.resolve(__dirname, 'emails/welcome-launch.html');
const LOG_PATH = path.resolve(__dirname, 'data/email-send-log.json');

// ── Config ──────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'TMS List <login@mail.tmslist.com>';
const RATE_LIMIT_MS = 600; // ~1.6/sec to stay under 2/sec limit
const SUBJECT = 'Welcome to TMS List — Your Clinic Profile is Live!';

// ── Args ──────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const sendLimit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity;

// ── Helpers ──────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function personalizeEmail(html: string, clinicName: string): string {
  // Replace generic "your clinic" with actual name in the hero
  return html.replace(
    'Your Clinic is Now Live on TMS List',
    `${clinicName} is Now Live on TMS List`
  );
}

// ── Main ──────────────────────────────────

async function main() {
  if (!RESEND_API_KEY && !isDryRun) {
    console.error('RESEND_API_KEY env var is required. Set it or use --dry-run');
    process.exit(1);
  }

  // Load clinics
  const clinics: Record<string, any>[] = JSON.parse(fs.readFileSync(CLINICS_PATH, 'utf-8'));
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Filter to new imports with valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const toSend = clinics
    .filter(c => c.id?.startsWith('gsheet-') && c.email && emailRegex.test(c.email))
    .slice(0, sendLimit);

  // Load existing log to skip already-sent
  let log: Record<string, { status: string; sentAt: string; error?: string }> = {};
  if (fs.existsSync(LOG_PATH)) {
    log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  }
  const alreadySent = new Set(Object.keys(log).filter(k => log[k].status === 'sent'));
  const pending = toSend.filter(c => !alreadySent.has(c.email));

  console.log(`\n========================================`);
  console.log(`  TMS List Welcome Email Campaign`);
  console.log(`========================================`);
  console.log(`  Mode:           ${isDryRun ? 'DRY RUN (no emails sent)' : 'LIVE SEND'}`);
  console.log(`  From:           ${FROM_EMAIL}`);
  console.log(`  Total eligible: ${toSend.length}`);
  console.log(`  Already sent:   ${alreadySent.size}`);
  console.log(`  To send now:    ${pending.length}`);
  console.log(`  Rate limit:     ${RATE_LIMIT_MS}ms between sends`);
  console.log(`  Est. time:      ~${Math.round(pending.length * RATE_LIMIT_MS / 60000)} minutes`);
  console.log(`========================================\n`);

  if (pending.length === 0) {
    console.log('Nothing to send. All emails already delivered.');
    return;
  }

  if (isDryRun) {
    console.log('DRY RUN — showing first 10 recipients:\n');
    for (const c of pending.slice(0, 10)) {
      console.log(`  ${c.name} <${c.email}>`);
    }
    console.log(`\n  ... and ${Math.max(0, pending.length - 10)} more`);
    console.log('\nRun without --dry-run to send.');
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const clinic = pending[i];
    const html = personalizeEmail(template, clinic.name);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: clinic.email,
        subject: SUBJECT,
        html,
        replyTo: 'arush.thapar@rainmindz.com',
      });

      if (result.error) {
        throw new Error(result.error.message || JSON.stringify(result.error));
      }

      log[clinic.email] = { status: 'sent', sentAt: new Date().toISOString() };
      sent++;
    } catch (err: any) {
      log[clinic.email] = {
        status: 'failed',
        sentAt: new Date().toISOString(),
        error: err.message || String(err)
      };
      failed++;
    }

    // Progress
    const total = sent + failed;
    if (total % 50 === 0 || total === pending.length) {
      const pct = Math.round(total / pending.length * 100);
      console.log(`  [${pct}%] ${total}/${pending.length} — ${sent} sent, ${failed} failed`);

      // Save log periodically
      fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
    }

    // Rate limit
    await sleep(RATE_LIMIT_MS);
  }

  // Final save
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));

  console.log(`\n========================================`);
  console.log(`  Campaign Complete`);
  console.log(`========================================`);
  console.log(`  Sent:     ${sent}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Log:      ${LOG_PATH}`);
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
