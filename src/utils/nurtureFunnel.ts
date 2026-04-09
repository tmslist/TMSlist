/**
 * Unified Nurturing Funnel Engine
 *
 * 5 segments, each with multi-step drip sequences:
 * 1. newsletter    — General TMS education subscribers
 * 2. lead_magnet   — Downloaded a guide/resource
 * 3. patient       — Created a patient account
 * 4. clinic_owner  — Clinic owner signup / claim
 * 5. specialist    — Psychiatrist / specialist signup
 *
 * Each segment has a sequence of timed emails.
 * The drip processor (cron) checks which emails are due and sends them.
 */

import { Resend } from 'resend';

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

function getResend() {
  if (!RESEND_KEY) return null;
  return new Resend(RESEND_KEY);
}

// ─── TYPES ────────────────────────────────────────

export type FunnelSegment = 'newsletter' | 'lead_magnet' | 'patient' | 'clinic_owner' | 'specialist';

export interface FunnelContact {
  email: string;
  name: string;
  segment: FunnelSegment;
  metadata?: Record<string, string>;
}

export interface DripStep {
  stepId: string;
  delayDays: number;
  subject: string;
  buildHtml: (contact: FunnelContact) => string;
}

// ─── EMAIL WRAPPER ────────────────────────────────

const emailWrapper = (content: string, accent: string = '#4f46e5') => `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: ${accent}; padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <a href="${SITE_URL}" style="color: white; text-decoration: none; font-weight: 700; font-size: 18px;">TMS<span style="opacity: 0.7;">List</span></a>
  </div>
  <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: 0;">
    ${content}
  </div>
  <div style="padding: 16px 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
      TMS List | <a href="${SITE_URL}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a> | <a href="${SITE_URL}/legal/privacy-policy/" style="color: #94a3b8;">Privacy</a>
    </p>
  </div>
</div>`;

const btn = (text: string, href: string, color: string = '#4f46e5') =>
  `<a href="${href}" style="display: inline-block; background: ${color}; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">${text}</a>`;

const divider = '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />';

// ─── DRIP SEQUENCES ───────────────────────────────

export const DRIP_SEQUENCES: Record<FunnelSegment, DripStep[]> = {

  // ── NEWSLETTER SUBSCRIBERS ──────────────────────
  newsletter: [
    {
      stepId: 'newsletter_welcome',
      delayDays: 0,
      subject: 'Welcome to TMS List — Your TMS Therapy Guide',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome, ${c.name}!</h2>
        <p style="color: #64748b; line-height: 1.7;">Thank you for joining the TMS List community. We're here to help you navigate TMS therapy with clear, evidence-based information.</p>
        <p style="color: #64748b; line-height: 1.7;">Here's what you'll receive:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li>Weekly clinic updates in your area</li>
          <li>Insurance coverage guides</li>
          <li>New research and treatment breakthroughs</li>
          <li>Patient success stories</li>
        </ul>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Take the Candidacy Quiz', `${SITE_URL}/quiz/am-i-a-candidate/`)}
        </div>
      `),
    },
    {
      stepId: 'newsletter_day3_insurance',
      delayDays: 3,
      subject: 'Does your insurance cover TMS therapy?',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Good news about TMS coverage</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, one of the most common questions we get is about insurance. Here's the quick answer:</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #166534; margin: 0;"><strong>Most major insurers now cover TMS</strong> — including Medicare, BCBS, Aetna, Cigna, and UnitedHealthcare — when you've tried 2-4 antidepressants without adequate response.</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Calculate Your Cost', `${SITE_URL}/tms-cost-calculator/`)}
        </div>
      `),
    },
    {
      stepId: 'newsletter_day7_stories',
      delayDays: 7,
      subject: 'Real patients, real results with TMS',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">TMS success stories</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, TMS therapy has helped thousands find relief. Here are the numbers:</p>
        <div style="display: flex; gap: 12px; margin: 20px 0;">
          <div style="flex: 1; background: #eff6ff; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="font-size: 28px; font-weight: 800; color: #1e40af; margin: 0;">50-60%</p>
            <p style="font-size: 12px; color: #3b82f6; margin: 4px 0 0;">Response Rate</p>
          </div>
          <div style="flex: 1; background: #f0fdf4; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="font-size: 28px; font-weight: 800; color: #166534; margin: 0;">~30%</p>
            <p style="font-size: 12px; color: #16a34a; margin: 4px 0 0;">Full Remission</p>
          </div>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Find a Clinic Near You', `${SITE_URL}/map/`)}
        </div>
      `),
    },
    {
      stepId: 'newsletter_day14_compare',
      delayDays: 14,
      subject: 'How to choose the right TMS clinic',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Choosing your TMS provider</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, not all TMS clinics are equal. Here's what to look for:</p>
        <ol style="color: #64748b; line-height: 2;">
          <li><strong>FDA-cleared devices</strong> — NeuroStar, BrainsWay, or MagVenture</li>
          <li><strong>Experienced staff</strong> — Board-certified psychiatrists</li>
          <li><strong>Insurance billing</strong> — Do they handle prior authorization?</li>
          <li><strong>Patient reviews</strong> — What do others say?</li>
          <li><strong>Location & hours</strong> — You'll visit 36 times, so convenience matters</li>
        </ol>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Compare Clinics Side-by-Side', `${SITE_URL}/compare-clinics/`)}
        </div>
      `),
    },
    {
      stepId: 'newsletter_day21_book',
      delayDays: 21,
      subject: 'Ready to take the next step?',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Your next step, ${c.name}</h2>
        <p style="color: #64748b; line-height: 1.7;">Over the past few weeks, you've learned about TMS therapy, insurance coverage, and how to choose a clinic. If you're considering treatment, here's what to do next:</p>
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #6b21a8; margin: 0 0 8px; font-weight: 700;">Three simple steps:</p>
          <ol style="color: #7c3aed; margin: 0; padding-left: 20px; line-height: 2;">
            <li>Find a clinic near you on our map</li>
            <li>Call and ask about a free consultation</li>
            <li>Bring your medication history to the appointment</li>
          </ol>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Find & Book a Consultation', `${SITE_URL}/map/`, '#059669')}
        </div>
      `),
    },
  ],

  // ── LEAD MAGNET DOWNLOADS ───────────────────────
  lead_magnet: [
    {
      stepId: 'leadmag_delivery',
      delayDays: 0,
      subject: 'Your TMS guide is ready to download',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Here's your guide, ${c.name}</h2>
        <p style="color: #64748b; line-height: 1.7;">Thank you for your interest in TMS therapy. Your guide is attached below.</p>
        <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #334155; font-weight: 600; margin: 0 0 12px;">${c.metadata?.guide_title || 'Your TMS Therapy Guide'}</p>
          ${btn('Download Guide', `${SITE_URL}/resources/`)}
        </div>
        <p style="color: #64748b; line-height: 1.7;">While you're reading, you might also want to:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li><a href="${SITE_URL}/quiz/am-i-a-candidate/" style="color: #4f46e5;">Check if you're a TMS candidate</a></li>
          <li><a href="${SITE_URL}/tms-cost-calculator/" style="color: #4f46e5;">Estimate your treatment cost</a></li>
        </ul>
      `),
    },
    {
      stepId: 'leadmag_day2_candidacy',
      delayDays: 2,
      subject: 'Could TMS work for you? Take our 2-minute quiz',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Are you a candidate for TMS?</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, since you downloaded our guide, you might be wondering if TMS could help you or someone you know.</p>
        <p style="color: #64748b; line-height: 1.7;">Our quick quiz evaluates your situation based on the same criteria psychiatrists use:</p>
        <ul style="color: #64748b; line-height: 1.8;">
          <li>Diagnosis and symptom severity</li>
          <li>Medication history</li>
          <li>Treatment goals</li>
        </ul>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Take the 2-Minute Quiz', `${SITE_URL}/quiz/am-i-a-candidate/`, '#059669')}
        </div>
      `),
    },
    {
      stepId: 'leadmag_day5_clinics',
      delayDays: 5,
      subject: 'TMS clinics near you accepting new patients',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Clinics near you</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, we have over 1,100 verified TMS clinics in our directory${c.metadata?.state ? `, including providers in ${c.metadata.state}` : ''}.</p>
        <p style="color: #64748b; line-height: 1.7;">Many offer free initial consultations. Use our interactive map to find clinics accepting new patients near you.</p>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Search the Map', `${SITE_URL}/map/`)}
        </div>
      `),
    },
    {
      stepId: 'leadmag_day10_cost',
      delayDays: 10,
      subject: 'How much will TMS cost you? (Calculator inside)',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Your TMS cost estimate</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, cost is one of the biggest concerns we hear. The good news: most insurance covers TMS, and many patients pay less than they expect.</p>
        <div style="background: #eff6ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #1e40af; margin: 0; font-weight: 600;">Typical out-of-pocket costs:</p>
          <ul style="color: #3b82f6; margin: 8px 0 0; line-height: 2;">
            <li>With insurance (deductible met): $500 – $2,000</li>
            <li>With insurance (deductible unmet): $2,000 – $5,000</li>
            <li>Self-pay with discount: $6,000 – $10,000</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Get Your Personalized Estimate', `${SITE_URL}/tms-cost-calculator/`)}
        </div>
      `),
    },
  ],

  // ── PATIENT ACCOUNT SIGNUPS ─────────────────────
  patient: [
    {
      stepId: 'patient_welcome',
      delayDays: 0,
      subject: 'Welcome to TMS List — your account is ready',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome aboard, ${c.name}!</h2>
        <p style="color: #64748b; line-height: 1.7;">Your TMS List account is now active. Here's what you can do:</p>
        <div style="margin: 20px 0;">
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 16px;">
            <div style="width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #2563eb; font-weight: 700;">1</div>
            <div><strong style="color: #1e293b;">Save clinics</strong><br/><span style="color: #64748b; font-size: 14px;">Bookmark clinics to compare later</span></div>
          </div>
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 16px;">
            <div style="width: 32px; height: 32px; background: #f0fdf4; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #16a34a; font-weight: 700;">2</div>
            <div><strong style="color: #1e293b;">Write reviews</strong><br/><span style="color: #64748b; font-size: 14px;">Help others by sharing your experience</span></div>
          </div>
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="width: 32px; height: 32px; background: #faf5ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #7c3aed; font-weight: 700;">3</div>
            <div><strong style="color: #1e293b;">Get matched</strong><br/><span style="color: #64748b; font-size: 14px;">Our AI advisor recommends the best clinics for you</span></div>
          </div>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Find Your Clinic', `${SITE_URL}/map/`)}
        </div>
      `),
    },
    {
      stepId: 'patient_day3_search',
      delayDays: 3,
      subject: 'Have you found a TMS clinic yet?',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Need help finding the right clinic?</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, our AI Treatment Advisor can help you narrow down your options based on your insurance, location, and condition.</p>
        <p style="color: #64748b; line-height: 1.7;">You can also use our advanced search to filter by:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li>Insurance accepted</li>
          <li>TMS device type</li>
          <li>Condition treated</li>
          <li>Patient rating</li>
          <li>Availability</li>
        </ul>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Advanced Search', `${SITE_URL}/search/`)}
        </div>
      `),
    },
    {
      stepId: 'patient_day7_prepare',
      delayDays: 7,
      subject: 'How to prepare for your first TMS appointment',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Your first TMS visit — what to expect</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, if you're scheduling your first consultation, here's what to bring:</p>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #92400e; font-weight: 700; margin: 0 0 8px;">Bring with you:</p>
          <ul style="color: #92400e; margin: 0; line-height: 2;">
            <li>List of current and past medications (with doses)</li>
            <li>Insurance card</li>
            <li>Referral from your prescribing doctor (if required)</li>
            <li>List of questions you want to ask</li>
          </ul>
        </div>
        <p style="color: #64748b; line-height: 1.7;">The first session includes a "mapping" procedure to find your optimal treatment spot. It's painless and takes about 30 minutes.</p>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Read: How to Prepare for TMS', `${SITE_URL}/blog/how-to-prepare-for-tms/`)}
        </div>
      `),
    },
    {
      stepId: 'patient_day14_review',
      delayDays: 14,
      subject: 'How is your TMS journey going?',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">We'd love to hear from you</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, whether you've started treatment or are still exploring options, your experience matters.</p>
        <p style="color: #64748b; line-height: 1.7;">If you've visited a clinic, leaving a review helps other patients make informed decisions and helps great clinics get recognized.</p>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Share Your Experience', `${SITE_URL}/account/saved/`)}
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Have questions? Our AI advisor is available 24/7 on tmslist.com (look for the chat icon).</p>
      `),
    },
  ],

  // ── CLINIC OWNER SIGNUPS ────────────────────────
  clinic_owner: [
    {
      stepId: 'owner_welcome',
      delayDays: 0,
      subject: 'Welcome to TMS List — your clinic dashboard is ready',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome, ${c.name}!</h2>
        <p style="color: #64748b; line-height: 1.7;">Your clinic is now listed on TMS List, the leading directory for TMS therapy providers. Here's how to maximize your visibility:</p>
        <div style="margin: 20px 0;">
          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
            <p style="color: #1e293b; font-weight: 700; margin: 0 0 4px;">Step 1: Complete your profile</p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Clinics with complete profiles get 3x more patient enquiries.</p>
          </div>
          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
            <p style="color: #1e293b; font-weight: 700; margin: 0 0 4px;">Step 2: Verify your clinic</p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Earn a "Verified" badge that boosts patient trust.</p>
          </div>
          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px;">
            <p style="color: #1e293b; font-weight: 700; margin: 0 0 4px;">Step 3: Encourage reviews</p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Use our review request tool to collect patient feedback.</p>
          </div>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Go to Your Dashboard', `${SITE_URL}/owner/dashboard/`)}
        </div>
      `, '#0f172a'),
    },
    {
      stepId: 'owner_day2_profile',
      delayDays: 2,
      subject: 'Your clinic profile is 40% complete — here\'s what\'s missing',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Complete your profile</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, clinics with complete profiles receive <strong>3x more enquiries</strong>. Here's what to add:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li>Upload a clinic photo (real photos perform 5x better than stock)</li>
          <li>List all TMS devices you use</li>
          <li>Add accepted insurance providers</li>
          <li>Set your opening hours</li>
          <li>Write a detailed description</li>
          <li>Add your medical team</li>
        </ul>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Edit Your Profile', `${SITE_URL}/owner/dashboard/`)}
        </div>
      `, '#0f172a'),
    },
    {
      stepId: 'owner_day5_reviews',
      delayDays: 5,
      subject: 'Get your first 5 reviews (we\'ll help)',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Reviews drive patient decisions</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, <strong>87% of patients read reviews</strong> before choosing a clinic. Here's how to collect them:</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #1e40af; font-weight: 700; margin: 0 0 8px;">3 ways to collect reviews:</p>
          <ol style="color: #3b82f6; margin: 0; padding-left: 20px; line-height: 2;">
            <li><strong>Email requests</strong> — Send review links via your dashboard</li>
            <li><strong>SMS requests</strong> — Text patients after their final session</li>
            <li><strong>QR code</strong> — Print and place in your waiting room</li>
          </ol>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Send Review Requests', `${SITE_URL}/owner/dashboard/`)}
        </div>
      `, '#0f172a'),
    },
    {
      stepId: 'owner_day10_upgrade',
      delayDays: 10,
      subject: 'Get 5x more patient leads with Pro',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Upgrade to grow your practice</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, Pro clinics on TMS List receive <strong>5x more patient enquiries</strong> than free listings. Here's what you get:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li>Instant SMS + email lead notifications</li>
          <li>Analytics dashboard (views, clicks, conversions)</li>
          <li>Respond to patient reviews</li>
          <li>"Pro" badge on your listing</li>
          <li>Priority placement in search</li>
        </ul>
        <p style="color: #64748b; line-height: 1.7;">Plans start at just <strong>$99/month</strong> — less than one TMS session.</p>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('View Pricing Plans', `${SITE_URL}/pricing/`, '#059669')}
        </div>
      `, '#0f172a'),
    },
    {
      stepId: 'owner_day21_healthscore',
      delayDays: 21,
      subject: 'Your Clinic Health Score report',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">How does your clinic score?</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, we've introduced the <strong>Clinic Health Score</strong> — a 0-100 rating that measures your listing's effectiveness across 6 dimensions:</p>
        <ol style="color: #64748b; line-height: 2;">
          <li>Review quality & volume</li>
          <li>Profile completeness</li>
          <li>Technology & devices</li>
          <li>Insurance breadth</li>
          <li>Responsiveness</li>
          <li>Verification status</li>
        </ol>
        <p style="color: #64748b; line-height: 1.7;">Log into your dashboard to see your score and get personalized recommendations to improve it.</p>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Check Your Score', `${SITE_URL}/owner/dashboard/`)}
        </div>
      `, '#0f172a'),
    },
  ],

  // ── SPECIALIST / PSYCHIATRIST SIGNUPS ────────────
  specialist: [
    {
      stepId: 'specialist_welcome',
      delayDays: 0,
      subject: 'Welcome to TMS List, Dr. ' + '${name}',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome, ${c.name}</h2>
        <p style="color: #64748b; line-height: 1.7;">Thank you for joining TMS List. Your profile is now live and visible to patients searching for TMS providers in your area.</p>
        <p style="color: #64748b; line-height: 1.7;">Here's what happens next:</p>
        <div style="margin: 20px 0;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
            <p style="color: #166534; font-weight: 700; margin: 0;">NPI Verification</p>
            <p style="color: #166534; font-size: 14px; margin: 4px 0 0;">We'll automatically verify your credentials via the NPI Registry. This earns you a "Verified Credentials" badge.</p>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px;">
            <p style="color: #1e40af; font-weight: 700; margin: 0;">Patient Referrals</p>
            <p style="color: #1e40af; font-size: 14px; margin: 4px 0 0;">Patients searching for TMS specialists will find your profile with your credentials, specialties, and clinic affiliation.</p>
          </div>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('View Your Profile', `${SITE_URL}/specialists/`)}
        </div>
      `, '#1e40af'),
    },
    {
      stepId: 'specialist_day3_profile',
      delayDays: 3,
      subject: 'Optimize your specialist profile for more referrals',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Make your profile stand out</h2>
        <p style="color: #64748b; line-height: 1.7;">${c.name}, specialists with complete profiles receive significantly more patient enquiries. Consider adding:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li><strong>Professional photo</strong> — Profiles with photos get 4x more clicks</li>
          <li><strong>Detailed bio</strong> — Your background, approach, and specializations</li>
          <li><strong>Education & training</strong> — Board certifications, residency, fellowships</li>
          <li><strong>TMS experience</strong> — Years of experience, protocols used</li>
          <li><strong>Conditions treated</strong> — Depression, OCD, anxiety, etc.</li>
        </ul>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Update Your Profile', `${SITE_URL}/owner/dashboard/`)}
        </div>
      `, '#1e40af'),
    },
    {
      stepId: 'specialist_day7_research',
      delayDays: 7,
      subject: 'Latest TMS research you should know about',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">TMS research updates</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, here are the latest developments in TMS therapy relevant to your practice:</p>
        <ul style="color: #64748b; line-height: 2;">
          <li><strong>SAINT Protocol</strong> — Stanford's accelerated protocol showing 79% remission rate in 5 days</li>
          <li><strong>Theta Burst (iTBS)</strong> — 3-minute sessions now FDA-cleared, same efficacy as standard</li>
          <li><strong>OCD expansion</strong> — BrainsWay Deep TMS showing strong results for treatment-resistant OCD</li>
          <li><strong>Neuronavigation</strong> — MRI-guided targeting improving precision and outcomes</li>
        </ul>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Browse Clinical Research', `${SITE_URL}/research/clinical-trials/`)}
        </div>
      `, '#1e40af'),
    },
    {
      stepId: 'specialist_day14_network',
      delayDays: 14,
      subject: 'Grow your TMS referral network',
      buildHtml: (c) => emailWrapper(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Expand your reach</h2>
        <p style="color: #64748b; line-height: 1.7;">Hi ${c.name}, here's how TMS List helps grow your practice:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: 800; color: #1e293b; margin: 0;">1,100+</p>
          <p style="color: #64748b; margin: 4px 0 0;">patients search for TMS clinics on our platform every month</p>
        </div>
        <p style="color: #64748b; line-height: 1.7;">Upgrade your clinic to Pro or Premium to unlock analytics, lead notifications, and featured placement.</p>
        <div style="text-align: center; margin: 28px 0;">
          ${btn('Explore Pricing', `${SITE_URL}/pricing/`)}
        </div>
      `, '#1e40af'),
    },
  ],
};

// ─── SEND FUNCTION ────────────────────────────────

export async function sendFunnelEmail(
  contact: FunnelContact,
  step: DripStep
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const fromMap: Record<FunnelSegment, string> = {
    newsletter: 'TMS List <newsletter@tmslist.com>',
    lead_magnet: 'TMS List <guides@tmslist.com>',
    patient: 'TMS List <welcome@tmslist.com>',
    clinic_owner: 'TMS List for Clinics <clinics@tmslist.com>',
    specialist: 'TMS List for Specialists <specialists@tmslist.com>',
  };

  try {
    await resend.emails.send({
      from: fromMap[contact.segment],
      to: contact.email,
      subject: step.subject.replace('${name}', contact.name),
      html: step.buildHtml(contact),
      tags: [
        { name: 'segment', value: contact.segment },
        { name: 'step', value: step.stepId },
      ],
    });
    return true;
  } catch (err) {
    console.error(`Funnel email failed [${step.stepId}]:`, err);
    return false;
  }
}

/**
 * Get the next drip step due for a contact based on when they entered the funnel.
 */
export function getNextDripStep(
  segment: FunnelSegment,
  enteredAt: Date,
  completedSteps: string[]
): DripStep | null {
  const sequence = DRIP_SEQUENCES[segment];
  if (!sequence) return null;

  const now = new Date();
  const daysSinceEntry = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));

  for (const step of sequence) {
    if (completedSteps.includes(step.stepId)) continue;
    if (daysSinceEntry >= step.delayDays) return step;
  }

  return null;
}
