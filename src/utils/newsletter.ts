/**
 * Newsletter and email drip campaign utilities.
 */

import { Resend } from 'resend';

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

function getResend() {
  if (!RESEND_KEY) return null;
  return new Resend(RESEND_KEY);
}

/**
 * Send newsletter welcome email with TMS intro guide.
 */
export async function sendNewsletterWelcome(data: { email: string; name: string }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: 'TMS List <newsletter@tmslist.com>',
      to: data.email,
      subject: 'Welcome to TMS List — Your Guide to TMS Therapy',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 32px; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 8px; font-size: 24px;">Welcome to TMS List</h1>
            <p style="margin: 0; opacity: 0.8; font-size: 14px;">Your trusted guide to TMS therapy</p>
          </div>
          <div style="padding: 32px; background: white; border: 1px solid #e2e8f0; border-top: 0;">
            <p style="font-size: 16px; color: #334155;">Hi ${data.name},</p>
            <p style="color: #64748b; line-height: 1.6;">
              Thank you for subscribing! Here's what you'll get from us:
            </p>
            <ul style="color: #64748b; line-height: 1.8;">
              <li>Weekly updates on new TMS clinics in your area</li>
              <li>Insurance coverage guides and cost-saving tips</li>
              <li>Latest TMS research and treatment advances</li>
              <li>Patient success stories and testimonials</li>
            </ul>

            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 16px;">Quick Start Guide</h3>
              <p style="color: #64748b; margin: 0 0 12px; font-size: 14px;">Not sure where to begin? Here are the top resources:</p>
              <a href="${SITE_URL}/quiz/am-i-a-candidate/" style="display: block; color: #4f46e5; font-weight: 600; font-size: 14px; margin-bottom: 6px; text-decoration: none;">1. Am I a TMS Candidate? (2-min quiz)</a>
              <a href="${SITE_URL}/map/" style="display: block; color: #4f46e5; font-weight: 600; font-size: 14px; margin-bottom: 6px; text-decoration: none;">2. Find Clinics Near Me (interactive map)</a>
              <a href="${SITE_URL}/tms-cost-calculator/" style="display: block; color: #4f46e5; font-weight: 600; font-size: 14px; margin-bottom: 6px; text-decoration: none;">3. TMS Cost Calculator</a>
              <a href="${SITE_URL}/treatments/depression/" style="display: block; color: #4f46e5; font-weight: 600; font-size: 14px; text-decoration: none;">4. TMS for Depression Guide</a>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/map/" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">Find a Clinic Near You</a>
            </div>
          </div>
          <div style="padding: 16px; text-align: center; border-radius: 0 0 16px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: 0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              You're receiving this because you subscribed at tmslist.com.<br/>
              <a href="${SITE_URL}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send drip email — Day 3: Insurance & Cost Guide
 */
export async function sendDripDay3(data: { email: string; name: string }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: 'TMS List <newsletter@tmslist.com>',
      to: data.email,
      subject: `${data.name}, does your insurance cover TMS?`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b;">Does Your Insurance Cover TMS?</h2>
          <p style="color: #64748b; line-height: 1.6;">
            Good news — most major insurance companies now cover TMS therapy for treatment-resistant depression. Here's what you need to know:
          </p>
          <ul style="color: #64748b; line-height: 1.8;">
            <li><strong>Medicare:</strong> Covers TMS nationwide (Part B)</li>
            <li><strong>BCBS, Aetna, Cigna, UHC:</strong> Most plans cover TMS after 2-4 failed medications</li>
            <li><strong>Medicaid:</strong> Coverage varies by state</li>
          </ul>
          <p style="color: #64748b;">
            <a href="${SITE_URL}/tms-cost-calculator/" style="color: #4f46e5; font-weight: 600;">Use our cost calculator</a> to estimate your out-of-pocket expense.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            <a href="${SITE_URL}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send drip email — Day 7: Success Stories
 */
export async function sendDripDay7(data: { email: string; name: string }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: 'TMS List <newsletter@tmslist.com>',
      to: data.email,
      subject: `Real patients, real results — TMS success stories`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b;">TMS Changed Their Lives</h2>
          <p style="color: #64748b; line-height: 1.6;">
            Over 50% of TMS patients achieve significant improvement in their depression symptoms. Here's what the research shows:
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #166534; font-weight: 600; margin: 0 0 8px;">By the numbers:</p>
            <p style="color: #166534; margin: 0;">50-60% response rate | 30% full remission | Minimal side effects</p>
          </div>
          <p style="color: #64748b; line-height: 1.6;">
            Ready to explore your options?
          </p>
          <a href="${SITE_URL}/map/" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">Find a Clinic Near You</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            <a href="${SITE_URL}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
