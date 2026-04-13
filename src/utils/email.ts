import { Resend } from 'resend';

const API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

function getResend() {
  if (!API_KEY) return null;
  return new Resend(API_KEY);
}

const FROM = 'TMS List <notifications@mail.tmslist.com>';
const ADMIN_EMAIL = 'brandingpioneers@gmail.com';

export async function sendLeadNotification(data: {
  clinicName: string;
  clinicEmail?: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  message: string;
  sourceUrl?: string;
  leadType?: string;
  metadata?: Record<string, unknown>;
}) {
  const resend = getResend();
  if (!resend) return null;

  const recipients = [ADMIN_EMAIL, ...(data.clinicEmail ? [data.clinicEmail] : [])];
  const typeLabel = data.leadType ? data.leadType.replace(/_/g, ' ') : 'New enquiry';

  return resend.emails.send({
    from: FROM,
    to: recipients,
    subject: `[TMSList] ${typeLabel} from ${data.patientName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; font-size: 20px;">New Lead — ${typeLabel}</h2>
          <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">Received on TMS List</p>
        </div>
        <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          ${data.clinicName && data.clinicName !== 'Unknown Clinic' ? `<p><strong>Clinic:</strong> ${data.clinicName}</p>` : ''}
          <p><strong>Name:</strong> ${data.patientName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.patientEmail}">${data.patientEmail}</a></p>
          ${data.patientPhone ? `<p><strong>Phone:</strong> <a href="tel:${data.patientPhone}">${data.patientPhone}</a></p>` : ''}
          ${data.metadata && Object.keys(data.metadata).length > 0 ? `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #334155; font-size: 13px;">Additional Details:</p>
              ${Object.entries(data.metadata).map(([k, v]) => `<p style="margin: 4px 0; color: #64748b; font-size: 13px;"><strong>${k.replace(/_/g, ' ')}:</strong> ${String(v)}</p>`).join('')}
            </div>
          ` : ''}
          ${data.message ? `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #334155; font-size: 13px;">Message:</p>
              <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
          ${data.sourceUrl ? `<p style="color: #94a3b8; font-size: 12px; margin-top: 16px;"><strong>Source:</strong> <a href="${data.sourceUrl}" style="color: #7c3aed;">${data.sourceUrl}</a></p>` : ''}
          <div style="margin-top: 20px;">
            <a href="${SITE_URL}/portal/leads" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendReviewNotification(data: {
  clinicEmail: string;
  clinicName: string;
  reviewerName: string;
  rating: number;
}) {
  const resend = getResend();
  if (!resend) return null;

  const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);

  return resend.emails.send({
    from: FROM,
    to: data.clinicEmail,
    subject: `New ${data.rating}-star review for ${data.clinicName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Review Received</h2>
        <p><strong>${data.clinicName}</strong> received a new review from ${data.reviewerName}.</p>
        <p style="font-size: 24px; color: #f59e0b;">${stars}</p>
        <p>The review is pending moderation.</p>
        <a href="${SITE_URL}/admin/reviews" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Moderate Reviews</a>
      </div>
    `,
  });
}

export async function sendVerificationEmail(data: {
  email: string;
  clinicName: string;
  verificationUrl: string;
}) {
  const resend = getResend();
  if (!resend) return null;

  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Verify your clinic: ${data.clinicName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Clinic on TMS List</h2>
        <p>Click the button below to verify ownership of <strong>${data.clinicName}</strong>.</p>
        <a href="${data.verificationUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify Clinic</a>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">This link expires in 48 hours. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const resend = getResend();
  if (!resend) return null;

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to TMS List',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for joining TMS List. You can now:</p>
        <ul>
          <li>Save and compare clinics</li>
          <li>Write reviews</li>
          <li>Get personalized clinic recommendations</li>
        </ul>
        <a href="${SITE_URL}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Browse Clinics</a>
      </div>
    `,
  });
}

// ── COMMUNITY FORUM NOTIFICATIONS ──────────────────

export async function sendForumReplyNotification(data: {
  recipientEmail: string;
  recipientName: string;
  replierName: string;
  postTitle: string;
  replyPreview: string;
  threadUrl: string;
}) {
  const resend = getResend();
  if (!resend) return null;

  return resend.emails.send({
    from: FROM,
    to: data.recipientEmail,
    subject: `${data.replierName} replied to "${data.postTitle.slice(0, 50)}"`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0;">TMS List Community</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px;">Hi ${data.recipientName},</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 16px;"><strong>${data.replierName}</strong> replied to your discussion:</p>
          <p style="color: #6b7280; font-size: 13px; font-style: italic; margin: 0 0 4px;">"${data.postTitle}"</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: #4b5563; font-size: 13px; margin: 0; line-height: 1.5;">${data.replyPreview.slice(0, 300)}${data.replyPreview.length > 300 ? '...' : ''}</p>
          </div>
          <a href="${data.threadUrl}" style="display: inline-block; background: #7C3AED; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Reply</a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">You're receiving this because someone replied to your post on TMS List Community.</p>
      </div>
    `,
  });
}
