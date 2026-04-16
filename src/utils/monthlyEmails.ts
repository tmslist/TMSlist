/**
 * Monthly Partner Email Templates
 *
 * 12-month engagement cycle for TMS clinic partners.
 * Each function returns { subject, html } for the given clinic.
 *
 * Month 1 (April)  — Welcome (handled separately by send-welcome-emails.ts)
 * Month 2 (May)    — First Month Report
 * Month 3 (June)   — Patient Insights
 * Month 4 (July)   — Review Spotlight
 * Month 5 (August) — TMS Industry Trends
 * Month 6 (Sept)   — Half-Year Report
 * Month 7 (Oct)    — Marketing Tips
 * Month 8 (Nov)    — Insurance Season Prep
 * Month 9 (Dec)    — Year in Review
 * Month 10 (Jan)   — New Year, New Patients
 * Month 11 (Feb)   — Competitor Comparison
 * Month 12 (Mar)   — Anniversary + Renewal
 */

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';

interface ClinicData {
  name: string;
  email: string;
  city: string;
  state: string;
  slug: string;
}

interface EmailOutput {
  subject: string;
  html: string;
}

// ── Shared Layout ──────────────────────────────────

function wrapLayout(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f0f4f8;">${preheader}</div>
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">
  <div style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa);border-radius:4px 4px 0 0;"></div>
  <div style="background:#fff;padding:32px 40px 20px;text-align:center;border-bottom:1px solid #f1f5f9;">
    <h1 style="color:#0f172a;font-size:28px;margin:0;font-weight:700;">TMS List</h1>
    <p style="color:#6366f1;font-size:12px;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Partner Update</p>
  </div>
  <div style="background:#fff;padding:40px;">
    ${content}
  </div>
  <div style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;border-radius:0 0 4px 4px;">
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 8px;text-align:center;">
      You're receiving this because your clinic is listed on <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">tmslist.com</a>.
    </p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 8px;text-align:center;">
      Questions? Reply to this email or contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#94a3b8;">${FOUNDER_EMAIL}</a>
    </p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 8px;text-align:center;">
      <a href="mailto:${FOUNDER_EMAIL}?subject=Unsubscribe%20from%20TMS%20List%20emails&body=Please%20unsubscribe%20my%20clinic%20from%20future%20emails." style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
    </p>
    <p style="color:#cbd5e1;font-size:11px;margin:12px 0 0;text-align:center;">&copy; 2026 Rain AI LLC</p>
  </div>
</div>
</body></html>`;
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(99,102,241,0.3);">${text}</a>
  </div>`;
}

function heading(text: string): string {
  return `<h2 style="color:#0f172a;font-size:22px;margin:0 0 20px;font-weight:700;line-height:1.3;">${text}</h2>`;
}

function para(text: string): string {
  return `<p style="color:#475569;font-size:15px;line-height:1.75;margin:0 0 16px;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">`;
}

function highlightBox(title: string, content: string, colors: { bg: string; border: string; title: string; text: string }): string {
  return `<div style="background:${colors.bg};border-radius:12px;padding:24px 28px;border:1px solid ${colors.border};margin:24px 0;">
    <h3 style="color:${colors.title};font-size:17px;margin:0 0 10px;font-weight:700;">${title}</h3>
    <div style="color:${colors.text};font-size:14px;line-height:1.7;">${content}</div>
  </div>`;
}

function statRow(items: { value: string; label: string }[]): string {
  const cells = items.map(item =>
    `<td style="text-align:center;padding:12px;">
      <div style="color:#6366f1;font-size:26px;font-weight:700;">${item.value}</div>
      <div style="color:#64748b;font-size:11px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">${item.label}</div>
    </td>`
  ).join('');
  return `<div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:20px 0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
  </div>`;
}

function bulletList(items: string[]): string {
  return `<ul style="color:#475569;font-size:15px;line-height:2;margin:0 0 16px;padding-left:20px;">
    ${items.map(i => `<li>${i}</li>`).join('')}
  </ul>`;
}

function founderNote(message: string): string {
  return `<div style="background:#fffbeb;border-radius:12px;padding:24px 28px;border:1px solid #fde68a;margin:24px 0;">
    <h3 style="color:#92400e;font-size:15px;margin:0 0 10px;font-weight:700;">From Arush, Founder of TMS List</h3>
    <p style="color:#78350f;font-size:14px;line-height:1.7;margin:0 0 12px;">${message}</p>
    <a href="mailto:${FOUNDER_EMAIL}" style="color:#b45309;font-size:13px;font-weight:600;">${FOUNDER_EMAIL}</a>
  </div>`;
}

// ── Month 2: First Month Report (May) ──────────────────

export function month2_firstMonthReport(clinic: ClinicData): EmailOutput {
  return {
    subject: `${clinic.name} — Your First Month on TMS List`,
    html: wrapLayout(`
      ${heading(`Your First Month on TMS List`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`It's been one month since your clinic went live on TMS List, and patients in <strong>${clinic.city}, ${clinic.state}</strong> are actively searching for TMS providers.`)}
      ${statRow([
        { value: '4,100+', label: 'Clinics Listed' },
        { value: '50K+', label: 'Monthly Searches' },
        { value: '50', label: 'States' },
      ])}
      ${para(`Patients are filtering by insurance, location, and TMS machine type. Clinics with complete profiles are getting significantly more visibility.`)}
      ${highlightBox('Quick Wins to Boost Your Profile', `
        <ul style="margin:8px 0 0;padding-left:18px;line-height:2;">
          <li><strong>Add your insurance list</strong> — 72% of patients filter by insurance</li>
          <li><strong>Upload a clinic photo</strong> — profiles with photos get 2x more clicks</li>
          <li><strong>List your TMS machines</strong> — patients compare NeuroStar, BrainsWay, MagVenture</li>
          <li><strong>Add opening hours</strong> — helps patients who need evening or weekend sessions</li>
        </ul>
      `, { bg: '#eef2ff', border: '#c7d2fe', title: '#4338ca', text: '#3730a3' })}
      ${ctaButton('Complete Your Profile', `${SITE_URL}/portal`)}
      ${founderNote(`Every detail you add helps a real patient find your clinic. If you need help setting up your profile, just reply to this email — I'll personally walk you through it.`)}
    `, `Your first month on TMS List — here's how patients are finding you.`)
  };
}

// ── Month 3: Patient Insights (June) ──────────────────

export function month3_patientInsights(clinic: ClinicData): EmailOutput {
  return {
    subject: `What TMS Patients Are Actually Searching For`,
    html: wrapLayout(`
      ${heading(`What Patients Search Before Choosing a TMS Clinic`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`We analyzed thousands of patient searches on TMS List to understand what matters most when they're choosing a provider. Here's what we found:`)}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <strong style="color:#0f172a;font-size:20px;">1.</strong>
            <strong style="color:#0f172a;font-size:15px;margin-left:8px;">"Does this clinic take my insurance?"</strong>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0 28px;">The #1 filter used. Clinics with insurance info get 3x more enquiries.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <strong style="color:#0f172a;font-size:20px;">2.</strong>
            <strong style="color:#0f172a;font-size:15px;margin-left:8px;">"How close is this clinic to me?"</strong>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0 28px;">Proximity matters — most patients search within 25 miles of their home.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <strong style="color:#0f172a;font-size:20px;">3.</strong>
            <strong style="color:#0f172a;font-size:15px;margin-left:8px;">"What TMS machine do they use?"</strong>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0 28px;">Informed patients compare NeuroStar vs BrainsWay vs theta burst protocols.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <strong style="color:#0f172a;font-size:20px;">4.</strong>
            <strong style="color:#0f172a;font-size:15px;margin-left:8px;">"What do other patients say?"</strong>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0 28px;">Reviews build trust. Clinics with 5+ reviews see 4x more engagement.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#0f172a;font-size:20px;">5.</strong>
            <strong style="color:#0f172a;font-size:15px;margin-left:8px;">"Can I get an appointment soon?"</strong>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0 28px;">Availability info (wait times, evening hours) drives the final decision.</p>
          </td>
        </tr>
      </table>
      ${divider()}
      ${para(`<strong>The takeaway:</strong> The more complete your profile, the more patients find and choose you. Clinics that fill in all five areas above see dramatically better results.`)}
      ${ctaButton('Update Your Profile Now', `${SITE_URL}/portal`)}
      ${founderNote(`I'd love to hear what questions your patients ask most. It helps us build better tools for you. Hit reply anytime.`)}
    `, `The top 5 things patients search for when choosing a TMS clinic.`)
  };
}

// ── Month 4: Review Spotlight (July) ──────────────────

export function month4_reviewSpotlight(clinic: ClinicData): EmailOutput {
  return {
    subject: `How Reviews Are Driving TMS Patient Decisions`,
    html: wrapLayout(`
      ${heading(`The Power of Patient Reviews for TMS Clinics`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`In a field as personal as mental health treatment, trust is everything. And nothing builds trust faster than hearing from real patients who've been through TMS therapy.`)}
      ${statRow([
        { value: '89%', label: 'Read Reviews First' },
        { value: '4x', label: 'More Enquiries' },
        { value: '5+', label: 'Reviews Threshold' },
      ])}
      ${para(`Clinics on TMS List with 5 or more patient reviews receive <strong>4 times more enquiries</strong> than those without any reviews. Patients want to know what to expect — the treatment experience, staff friendliness, and real outcomes.`)}
      ${highlightBox('How to Collect More Reviews', `
        <ul style="margin:8px 0 0;padding-left:18px;line-height:2;">
          <li><strong>Ask at session 30+</strong> — patients who complete treatment are your best advocates</li>
          <li><strong>Send a follow-up email</strong> — we provide a direct review link for your clinic</li>
          <li><strong>Display your TMS List profile</strong> in your waiting room with a QR code</li>
          <li><strong>Respond to every review</strong> — it shows you care and boosts your ranking</li>
        </ul>
      `, { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534', text: '#15803d' })}
      ${ctaButton('Manage Your Reviews', `${SITE_URL}/portal`)}
      ${founderNote(`Want us to set up automated review collection for your clinic? We're offering this free to early partners. Just reply and I'll set it up personally.`)}
    `, `89% of patients read reviews before choosing a TMS clinic. Here's how to get more.`)
  };
}

// ── Month 5: TMS Industry Trends (August) ──────────────────

export function month5_industryTrends(clinic: ClinicData): EmailOutput {
  return {
    subject: `TMS Industry Update — What's Changing in 2026`,
    html: wrapLayout(`
      ${heading(`TMS Industry Trends You Should Know`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`The TMS landscape is evolving fast. Here are the developments that matter most for your practice:`)}
      ${divider()}
      ${highlightBox('Accelerated Protocols Gaining Ground', `
        <p style="margin:0;">Stanford's SAINT protocol and theta burst stimulation are making TMS faster — some patients completing treatment in just 5 days instead of 6 weeks. Patients are actively searching for clinics offering these protocols.</p>
      `, { bg: '#eef2ff', border: '#c7d2fe', title: '#4338ca', text: '#3730a3' })}
      ${highlightBox('Insurance Coverage Expanding', `
        <p style="margin:0;">More insurance carriers are covering TMS for treatment-resistant depression and OCD. Several major plans expanded coverage criteria in 2026, reducing the prior authorization burden.</p>
      `, { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534', text: '#15803d' })}
      ${highlightBox('New Indications on the Horizon', `
        <p style="margin:0;">Clinical trials for PTSD, anxiety disorders, and substance use are showing promising results. Clinics positioned for these indications will have a first-mover advantage as FDA clearances come through.</p>
      `, { bg: '#fefce8', border: '#fde68a', title: '#854d0e', text: '#a16207' })}
      ${divider()}
      ${para(`<strong>What this means for you:</strong> Make sure your profile reflects the latest protocols and conditions you treat. Patients are becoming more informed and searching for specific treatment approaches.`)}
      ${ctaButton('Update Your Treatments & Protocols', `${SITE_URL}/portal`)}
      ${founderNote(`We're building a TMS knowledge hub with provider-contributed insights. Interested in contributing? Your expertise could help thousands of patients make better decisions.`)}
    `, `Accelerated protocols, expanding insurance, new indications — what's changing in TMS.`)
  };
}

// ── Month 6: Half-Year Report (September) ──────────────────

export function month6_halfYearReport(clinic: ClinicData): EmailOutput {
  return {
    subject: `${clinic.name} — Your 6-Month TMS List Report`,
    html: wrapLayout(`
      ${heading(`Your Half-Year Report`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`Six months in, and TMS List is growing fast. Here's where things stand — for the platform and for your clinic.`)}
      ${statRow([
        { value: '4,100+', label: 'Clinics' },
        { value: '100K+', label: 'Patient Searches' },
        { value: '15K+', label: 'Enquiries Sent' },
      ])}
      ${divider()}
      ${highlightBox('Your Profile Health Score', `
        <p style="margin:0 0 12px;">Clinics with complete profiles rank higher and get more enquiries. Here's what boosts your score:</p>
        <table width="100%" style="border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#15803d;">&#10003; Listed on TMS List</td><td style="text-align:right;color:#15803d;font-weight:600;">+10 pts</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">&#9744; Insurance list added</td><td style="text-align:right;color:#64748b;">+20 pts</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">&#9744; TMS machines listed</td><td style="text-align:right;color:#64748b;">+15 pts</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">&#9744; Clinic photos uploaded</td><td style="text-align:right;color:#64748b;">+15 pts</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">&#9744; Opening hours added</td><td style="text-align:right;color:#64748b;">+10 pts</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">&#9744; 5+ patient reviews</td><td style="text-align:right;color:#64748b;">+20 pts</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">&#9744; Profile verified</td><td style="text-align:right;color:#64748b;">+10 pts</td></tr>
        </table>
      `, { bg: '#eef2ff', border: '#c7d2fe', title: '#4338ca', text: '#3730a3' })}
      ${ctaButton('Boost Your Profile Score', `${SITE_URL}/portal`)}
      ${highlightBox('Still Available: 3 Months Free Management', `
        <p style="margin:0;">We're still offering <strong>complimentary profile management</strong> to select clinics. This includes profile optimization, priority placement, and dedicated support. Claim it before spots fill up.</p>
      `, { bg: '#faf5ff', border: '#d8b4fe', title: '#6b21a8', text: '#7c3aed' })}
      ${founderNote(`Half a year in, and I'm incredibly grateful for every clinic that's joined us. Your feedback has shaped every feature we've built. What should we build next? I'm all ears.`)}
    `, `Your 6-month TMS List report — profile score, platform growth, and what's next.`)
  };
}

// ── Month 7: Marketing Tips (October) ──────────────────

export function month7_marketingTips(clinic: ClinicData): EmailOutput {
  return {
    subject: `5 Ways to Attract More TMS Patients This Fall`,
    html: wrapLayout(`
      ${heading(`5 Proven Ways to Grow Your TMS Practice`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`Fall is one of the busiest seasons for mental health — people reassess their treatment plans as the year winds down. Here are five strategies top-performing TMS clinics are using:`)}
      ${divider()}
      ${para(`<strong style="color:#0f172a;font-size:17px;">1. Educate, Don't Sell</strong>`)}
      ${para(`Most patients have never heard of TMS. The clinics that grow fastest are the ones creating simple, approachable content explaining what TMS is, how it works, and what to expect. Your TMS List profile's FAQ section is a great place to start.`)}
      ${para(`<strong style="color:#0f172a;font-size:17px;">2. Make Insurance Crystal Clear</strong>`)}
      ${para(`"Do you take my insurance?" is the first question every patient asks. List every plan you accept prominently. If you offer payment plans or financing, say so — it removes the biggest barrier to treatment.`)}
      ${para(`<strong style="color:#0f172a;font-size:17px;">3. Leverage Patient Stories</strong>`)}
      ${para(`A single genuine patient testimonial is worth more than any ad. Ask patients who've had positive outcomes if they'd be willing to share their experience. Even a brief Google or TMS List review makes a difference.`)}
      ${para(`<strong style="color:#0f172a;font-size:17px;">4. Partner with Referring Providers</strong>`)}
      ${para(`Primary care physicians and therapists are the top referral source for TMS. Build relationships with providers in your area who see treatment-resistant depression patients.`)}
      ${para(`<strong style="color:#0f172a;font-size:17px;">5. Keep Your Online Presence Fresh</strong>`)}
      ${para(`Update your TMS List profile, Google Business listing, and website regularly. Search engines and patients both favor active, current listings.`)}
      ${ctaButton('Update Your Profile', `${SITE_URL}/portal`)}
      ${founderNote(`Want personalized marketing advice for your practice? I've helped dozens of TMS clinics grow their patient volume. Book a free 15-minute call — just reply to this email.`)}
    `, `5 strategies top TMS clinics use to attract more patients.`)
  };
}

// ── Month 8: Insurance Season (November) ──────────────────

export function month8_insuranceSeason(clinic: ClinicData): EmailOutput {
  return {
    subject: `Open Enrollment Is Here — Is Your Insurance List Current?`,
    html: wrapLayout(`
      ${heading(`Insurance Open Enrollment: Your Checklist`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`It's open enrollment season. Millions of Americans are choosing new health insurance plans right now — and many of them will be searching for TMS providers who accept their new coverage in January.`)}
      ${highlightBox('Why This Matters for Your Clinic', `
        <p style="margin:0;">January is historically the <strong>biggest month for new TMS enquiries</strong>. Patients with new plans, fresh deductibles, and New Year motivation are actively searching. If your insurance list is outdated, you're invisible to them.</p>
      `, { bg: '#fef2f2', border: '#fecaca', title: '#991b1b', text: '#b91c1c' })}
      ${divider()}
      ${para(`<strong>Your pre-enrollment checklist:</strong>`)}
      ${bulletList([
        '<strong>Update your accepted insurance list</strong> — add any new plans you\'ve contracted with',
        '<strong>Note any dropped plans</strong> — remove carriers you no longer accept',
        '<strong>Add cash-pay pricing</strong> — patients comparing plans want to know the self-pay option',
        '<strong>Mention payment plans</strong> — if you offer financing, make it visible',
        '<strong>Verify prior auth requirements</strong> — note which plans require prior authorization',
      ])}
      ${ctaButton('Update Your Insurance Info', `${SITE_URL}/portal`)}
      ${founderNote(`This is the most impactful update you can make all year. Five minutes now could mean dozens of new patients in January. Need help? Just reply.`)}
    `, `Open enrollment is here. Make sure patients with new plans can find you in January.`)
  };
}

// ── Month 9: Year in Review (December) ──────────────────

export function month9_yearInReview(clinic: ClinicData): EmailOutput {
  return {
    subject: `Thank You — TMS List's Year in Review`,
    html: wrapLayout(`
      ${heading(`2026: A Year of Connecting Patients with TMS`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`As the year wraps up, we want to say <strong>thank you</strong> for being part of TMS List. Together, we've helped thousands of patients find the TMS care they need.`)}
      ${statRow([
        { value: '4,100+', label: 'Clinics' },
        { value: '200K+', label: 'Patient Searches' },
        { value: '30K+', label: 'Enquiries' },
      ])}
      ${divider()}
      ${para(`<strong>What we built this year:</strong>`)}
      ${bulletList([
        'Launched the largest TMS provider directory in the US',
        'Added clinic owner portals with lead tracking and analytics',
        'Built a patient review and reputation management system',
        'Expanded to all 50 states plus international listings',
        'Created 15+ educational guides for patients considering TMS',
      ])}
      ${para(`<strong>What's coming in 2027:</strong>`)}
      ${bulletList([
        'Real-time appointment availability and booking',
        'Patient-clinic messaging through the platform',
        'Advanced analytics with conversion tracking',
        'Insurance verification tools',
        'Mobile app for clinic owners',
      ])}
      ${highlightBox('A Holiday Gift', `
        <p style="margin:0;">As a thank you, all active clinics will receive <strong>one month of complimentary featured placement</strong> in January 2027. No action needed — it's automatic.</p>
      `, { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534', text: '#15803d' })}
      ${founderNote(`Building TMS List has been the most meaningful work of my career. Every time I hear from a patient who found their TMS provider through us, it reminds me why we do this. Thank you for trusting us to represent your clinic. Here's to an even bigger 2027.`)}
    `, `Thank you for an incredible year. Here's what we accomplished together.`)
  };
}

// ── Month 10: New Year New Patients (January) ──────────────────

export function month10_newYear(clinic: ClinicData): EmailOutput {
  return {
    subject: `January Is Peak TMS Search Season — Are You Ready?`,
    html: wrapLayout(`
      ${heading(`New Year, New Patients`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`January is the <strong>single biggest month</strong> for mental health treatment searches. New Year's resolutions, fresh insurance plans, and renewed motivation drive a surge of patients looking for TMS therapy.`)}
      ${statRow([
        { value: '+47%', label: 'Search Increase' },
        { value: 'Jan', label: 'Peak Month' },
        { value: '3x', label: 'More Enquiries' },
      ])}
      ${para(`Patients searching right now are highly motivated — they've already decided to explore TMS. The question is whether they find <strong>your</strong> clinic or a competitor's.`)}
      ${highlightBox('Maximize Your January Visibility', `
        <ul style="margin:8px 0 0;padding-left:18px;line-height:2;">
          <li><strong>Verify your profile</strong> — verified clinics appear first in search results</li>
          <li><strong>Update insurance for 2027</strong> — patients have new plans</li>
          <li><strong>Set availability to "accepting new patients"</strong></li>
          <li><strong>Add a recent photo</strong> — make a strong first impression</li>
        </ul>
      `, { bg: '#eef2ff', border: '#c7d2fe', title: '#4338ca', text: '#3730a3' })}
      ${ctaButton('Optimize Your Profile for January', `${SITE_URL}/portal`)}
      ${founderNote(`Want featured placement during the busiest month of the year? We have limited slots available. Reply to this email and I'll share details.`)}
    `, `January is the biggest month for TMS searches. Make sure patients find your clinic.`)
  };
}

// ── Month 11: Competitor Comparison (February) ──────────────────

export function month11_competitorComparison(clinic: ClinicData): EmailOutput {
  return {
    subject: `How Does ${clinic.name} Compare to Other Clinics in ${clinic.state}?`,
    html: wrapLayout(`
      ${heading(`How Your Profile Stacks Up`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`We looked at TMS clinics across <strong>${clinic.state}</strong> to see what the top-performing profiles have in common. Here's how the best ones stand out:`)}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
        <tr style="background:#f8fafc;">
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Feature</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:center;">Top Clinics</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:center;">Average</td>
        </tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">Insurance listed</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#16a34a;font-weight:600;">8+ plans</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#dc2626;">0-2 plans</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">Patient reviews</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#16a34a;font-weight:600;">10+</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#dc2626;">0-2</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">Photos</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#16a34a;font-weight:600;">5+ photos</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#dc2626;">0-1</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">Profile verified</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#16a34a;font-weight:600;">Yes</td><td style="text-align:center;border-bottom:1px solid #f1f5f9;color:#dc2626;">No</td></tr>
        <tr><td style="padding:10px 16px;font-size:14px;color:#334155;">Response to reviews</td><td style="text-align:center;color:#16a34a;font-weight:600;">Within 48h</td><td style="text-align:center;color:#dc2626;">Never</td></tr>
      </table>
      ${para(`The gap between top clinics and the rest is dramatic — and it's almost entirely about <strong>profile completeness</strong>, not location or price.`)}
      ${ctaButton('Close the Gap — Update Your Profile', `${SITE_URL}/portal`)}
      ${founderNote(`I can do a free personalized audit of your profile and show you exactly what to improve. Takes 5 minutes. Just reply with "audit" and I'll send it over.`)}
    `, `See how your TMS List profile compares to top clinics in your state.`)
  };
}

// ── Month 12: Anniversary + Renewal (March) ──────────────────

export function month12_anniversary(clinic: ClinicData): EmailOutput {
  return {
    subject: `Happy Anniversary, ${clinic.name}! A Year on TMS List`,
    html: wrapLayout(`
      ${heading(`One Year Together`)}
      ${para(`Hi <strong>${clinic.name}</strong> team,`)}
      ${para(`It's been exactly one year since your clinic joined TMS List. We're proud to have you as a partner, and we're just getting started.`)}
      ${statRow([
        { value: '1', label: 'Year Together' },
        { value: '365', label: 'Days Live' },
        { value: '12', label: 'Emails Exchanged' },
      ])}
      ${divider()}
      ${para(`Over the past year, TMS List has grown from a simple directory into a full platform for TMS clinics to connect with patients, manage their reputation, and grow their practice.`)}
      ${highlightBox('Introducing TMS List Premium', `
        <p style="margin:0 0 12px;">To celebrate our first year, we're launching premium plans designed to help clinics like yours attract even more patients:</p>
        <table width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:16px;background:#f8fafc;border-radius:8px;vertical-align:top;width:50%;">
              <div style="font-weight:700;color:#0f172a;font-size:15px;margin-bottom:8px;">Verified Plan</div>
              <ul style="margin:0;padding-left:16px;font-size:13px;line-height:1.8;color:#475569;">
                <li>Verified badge</li>
                <li>Priority in search</li>
                <li>Review management</li>
                <li>Basic analytics</li>
              </ul>
            </td>
            <td style="width:16px;"></td>
            <td style="padding:16px;background:#eef2ff;border-radius:8px;border:2px solid #6366f1;vertical-align:top;width:50%;">
              <div style="font-weight:700;color:#4338ca;font-size:15px;margin-bottom:8px;">Featured Plan</div>
              <ul style="margin:0;padding-left:16px;font-size:13px;line-height:1.8;color:#3730a3;">
                <li>Everything in Verified</li>
                <li>Featured placement</li>
                <li>Lead tracking &amp; CRM</li>
                <li>Advanced analytics</li>
                <li>Dedicated support</li>
              </ul>
            </td>
          </tr>
        </table>
      `, { bg: '#fff', border: '#e2e8f0', title: '#0f172a', text: '#334155' })}
      ${highlightBox('Anniversary Offer: 30% Off Annual Plans', `
        <p style="margin:0;">As a founding partner, you're eligible for <strong>30% off any annual plan</strong>. This offer is only available to clinics who joined in our first year.</p>
      `, { bg: '#faf5ff', border: '#d8b4fe', title: '#6b21a8', text: '#7c3aed' })}
      ${ctaButton('Explore Premium Plans', `${SITE_URL}/pricing`)}
      ${founderNote(`A year ago, I emailed you about a new platform for TMS clinics. Today, we're one of the largest TMS directories in the country — and it's because of partners like you. Thank you for believing in this vision. The best is yet to come.`)}
    `, `It's been one year since you joined TMS List. Here's a special thank you.`)
  };
}

// ── Export Map ──────────────────────────────────

export const MONTHLY_EMAILS: Record<number, (clinic: ClinicData) => EmailOutput> = {
  5: month2_firstMonthReport,     // May
  6: month3_patientInsights,      // June
  7: month4_reviewSpotlight,      // July
  8: month5_industryTrends,       // August
  9: month6_halfYearReport,       // September
  10: month7_marketingTips,       // October
  11: month8_insuranceSeason,     // November
  12: month9_yearInReview,        // December
  1: month10_newYear,             // January
  2: month11_competitorComparison, // February
  3: month12_anniversary,         // March
};

export type { ClinicData, EmailOutput };
