import { Resend } from 'resend';

const API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

function getResend() {
  if (!API_KEY) return null;
  return new Resend(API_KEY);
}

const FROM = 'TMS List <notifications@mail.tmslist.com>';
const LOGIN_FROM = 'TMS List <login@mail.tmslist.com>';
const ADMIN_EMAIL = 'brandingpioneers@gmail.com';
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';

// ── AUTH EMAIL TEMPLATES ──────────────────────────────

type MagicLinkType = 'portal' | 'community';

interface MagicLinkEmailOptions {
  to: string;
  magicUrl: string;
  type: MagicLinkType;
}

export async function sendMagicLinkEmail(opts: MagicLinkEmailOptions) {
  const resend = getResend();
  if (!resend) {
    console.error('[email] RESEND_API_KEY not set — cannot send magic link');
    return;
  }

  const isPortal = opts.type === 'portal';
  const brandColor = isPortal ? '#059669' : '#7C3AED';
  const brandColorLight = isPortal ? '#d1fae5' : '#ede9fe';
  const brandLabel = isPortal ? 'Doctor Portal' : 'Community Forum';
  const ctaLabel = isPortal ? 'Sign In to Portal' : 'Join Community';
  const description = isPortal
    ? 'Click the button below to sign in to your Doctor Portal. This link expires in 15 minutes.'
    : 'Click the button below to join the TMS List Community. This link expires in 15 minutes.';
  const footerNote = isPortal
    ? 'Manage your clinic listing, view reviews, and track enquiries.'
    : 'Share experiences, ask questions, and connect with the TMS community.';

  await resend.emails.send({
    from: LOGIN_FROM,
    to: opts.to,
    subject: isPortal
      ? 'Your TMS List Doctor Portal login link'
      : 'Your TMS List Community login link',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f9fafb;">Your TMS List ${isPortal ? 'portal' : 'community'} login link — expires in 15 minutes.</div>
<div style="max-width:480px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">TMS List</h1>
    <p style="color:${brandColor};margin:8px 0 0;font-weight:600;">${brandLabel}</p>
  </div>
  <div style="background:#ffffff;border:1px solid ${brandColorLight};border-radius:12px;padding:32px;text-align:center;">
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">${description}</p>
    <a href="${opts.magicUrl}" style="display:inline-block;background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">${ctaLabel}</a>
    <p style="color:#9ca3af;font-size:13px;margin-top:24px;">If you didn't request this link, you can safely ignore this email.</p>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">${footerNote}</p>
</div>
</body></html>`,
    replyTo: FOUNDER_EMAIL,
  });
}

interface PasswordResetEmailOptions {
  to: string;
  resetUrl: string;
  userName?: string;
}

export async function sendPasswordResetEmail(opts: PasswordResetEmailOptions) {
  const resend = getResend();
  if (!resend) {
    console.error('[email] RESEND_API_KEY not set — cannot send password reset');
    return;
  }

  const greeting = opts.userName ? `Hi ${opts.userName},` : 'Hi,';

  await resend.emails.send({
    from: LOGIN_FROM,
    to: opts.to,
    subject: 'Reset your TMS List Doctor Portal password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f9fafb;">Reset your TMS List password — this link expires in 15 minutes.</div>
<div style="max-width:480px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">TMS List</h1>
    <p style="color:#059669;margin:8px 0 0;font-weight:600;">Doctor Portal</p>
  </div>
  <div style="background:#ffffff;border:1px solid #d1fae5;border-radius:12px;padding:32px;text-align:center;">
    <p style="color:#374151;font-size:16px;margin:0 0 8px;">${greeting}</p>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">We received a request to reset your password. Click the button below to set a new one. This link expires in 15 minutes.</p>
    <a href="${opts.resetUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
    <p style="color:#9ca3af;font-size:13px;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">Need help? Reply to this email or contact ${FOUNDER_EMAIL}</p>
</div>
</body></html>`,
    replyTo: FOUNDER_EMAIL,
  });
}

interface EmailVerificationEmailOptions {
  to: string;
  userName: string;
  verificationUrl: string;
}

export async function sendEmailVerificationEmail(opts: EmailVerificationEmailOptions) {
  const resend = getResend();
  if (!resend) {
    console.error('[email] RESEND_API_KEY not set — cannot send email verification');
    return;
  }

  await resend.emails.send({
    from: LOGIN_FROM,
    to: opts.to,
    subject: 'Verify your email — TMS List Doctor Portal',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f9fafb;">Please verify your email address to activate your TMS List Doctor Portal account.</div>
<div style="max-width:480px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">TMS List</h1>
    <p style="color:#059669;margin:8px 0 0;font-weight:600;">Doctor Portal</p>
  </div>
  <div style="background:#ffffff;border:1px solid #d1fae5;border-radius:12px;padding:32px;text-align:center;">
    <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hi ${opts.userName},</p>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Thanks for signing up for the TMS List Doctor Portal! Please verify your email address to activate your account.</p>
    <a href="${opts.verificationUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Verify Email Address</a>
    <p style="color:#9ca3af;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you didn't create a TMS List account, please ignore this email.</p>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">Need help? Contact ${FOUNDER_EMAIL}</p>
</div>
</body></html>`,
    replyTo: FOUNDER_EMAIL,
  });
}

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

// ── PATIENT CONFIRMATION AUTORESPONDER ─────────────

export async function sendPatientConfirmation(data: {
  to: string;
  name: string;
  leadType?: string;
  clinicName?: string;
  sourceUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return null;

  const typeConfig: Record<string, { label: string; accent: string; body: string; ctaText: string; ctaUrl: string }> = {
    contact: {
      label: 'Message Received',
      accent: '#4f46e5',
      body: "We've received your message and will get back to you within one business day. In the meantime, feel free to explore our clinic directory to learn more about TMS therapy options.",
      ctaText: 'Browse TMS Clinics',
      ctaUrl: `${SITE_URL}/us/`,
    },
    callback_request: {
      label: 'Callback Requested',
      accent: '#7c3aed',
      body: `We've received your callback request${data.clinicName ? ` for ${data.clinicName}` : ''}. A specialist will reach out to you within 1–2 business days at the number you provided.`,
      ctaText: 'Find a Clinic Now',
      ctaUrl: `${SITE_URL}/map/`,
    },
    appointment_request: {
      label: 'Appointment Request Received',
      accent: '#059669',
      body: `Your appointment request${data.clinicName ? ` for ${data.clinicName}` : ''} has been submitted. The clinic will contact you shortly to confirm a date and time.`,
      ctaText: 'Track Your Enquiry',
      ctaUrl: `${SITE_URL}/portal/leads`,
    },
    newsletter: {
      label: 'Welcome to TMS List',
      accent: '#4f46e5',
      body: "You're now subscribed to TMS List updates. You'll receive the latest TMS therapy news, clinic openings, and patient resources right in your inbox.",
      ctaText: 'Take the Candidacy Quiz',
      ctaUrl: `${SITE_URL}/quiz/am-i-a-candidate/`,
    },
    lead_magnet: {
      label: 'Guide on its Way',
      accent: '#0284c7',
      body: "Thank you for your interest in TMS therapy! Your free guide is on its way to your inbox. While you wait, check if you might be a candidate for TMS with our quick quiz.",
      ctaText: 'Take the 2-Min Quiz',
      ctaUrl: `${SITE_URL}/quiz/am-i-a-candidate/`,
    },
    enquiry: {
      label: 'Enquiry Received',
      accent: '#7c3aed',
      body: "We've received your enquiry and will connect you with a verified TMS specialist shortly. A specialist will reach out within 1–2 business days.",
      ctaText: 'Browse Clinics',
      ctaUrl: `${SITE_URL}/us/`,
    },
  };

  const config = typeConfig[data.leadType || ''] || typeConfig['contact'];
  const greeting = data.name ? `Hi ${data.name}` : 'Hi there';

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `${config.label} — TMS List`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="background:${config.accent};padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:20px;font-weight:700;color:white;">TMS List</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:13px;color:white;">${config.label}</p>
  </div>
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;padding:32px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">${greeting},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">${config.body}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${config.ctaUrl}" style="display:inline-block;background:${config.accent};color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">${config.ctaText}</a>
    </div>
    ${data.clinicName ? `<p style="color:#64748b;font-size:13px;margin:0;">Requested clinic: <strong>${data.clinicName}</strong></p>` : ''}
  </div>
  <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:20px;">
    TMS List | <a href="${SITE_URL}/unsubscribe" style="color:#94a3b8;">Unsubscribe</a> | <a href="${SITE_URL}/legal/privacy-policy/" style="color:#94a3b8;">Privacy Policy</a>
  </p>
</div>
</body></html>`,
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
