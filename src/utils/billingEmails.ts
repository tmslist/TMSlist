import { Resend } from 'resend';

const API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

function getResend() {
  if (!API_KEY) return null;
  return new Resend(API_KEY);
}

const BILLING_FROM = 'TMS List <billing@tmslist.com>';
const ADMIN_EMAIL = 'brandingpioneers@gmail.com';
const FOUNDER_EMAIL = 'arush.thapar@rainmindz.com';

const PLAN_NAMES: Record<string, string> = {
  pro: 'Pro',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const PLAN_PRICES: Record<string, string> = {
  pro: '$18/mo',
  premium: '$30/mo',
  enterprise: '$60/mo',
};

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    'Full clinic listing with devices, insurance & doctor profiles',
    'Lead SMS + email notifications',
    'Analytics dashboard',
    'Respond to patient reviews',
    '"Pro" badge on your listing',
    'Priority in search results',
  ],
  premium: [
    'Everything in Pro',
    'Featured placement on city/state pages',
    'Advanced analytics with competitor insights',
    '"Premium Verified" badge',
    'AI-matched lead routing',
    'Photo gallery (up to 20 images)',
    'Priority support',
  ],
  enterprise: [
    'Everything in Premium',
    'Multi-location management',
    'API access for integrations',
    'White-label performance reports',
    'Dedicated account manager',
    'Custom branding options',
    'Bulk lead export',
  ],
};

function baseHtml(content: string, title: string, subtitle?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:28px;font-weight:800;color:#0A1628;margin:0;">TMS List</h1>
    ${subtitle ? `<p style="color:#7C3AED;margin:8px 0 0;font-weight:600;font-size:14px;">${subtitle}</p>` : ''}
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
    ${content}
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
    TMS List | ATZ Medappz Pvt Ltd | <a href="${SITE_URL}/legal/privacy-policy/" style="color:#9ca3af;">Privacy Policy</a> | <a href="${SITE_URL}/portal/billing" style="color:#9ca3af;">Manage Billing</a>
  </p>
</div>
</body></html>`;
}

function ctaButton(url: string, text: string, color = '#7C3AED'): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">${text}</a>
  </div>`;
}

function featureList(features: string[]): string {
  return `<ul style="margin:16px 0;padding-left:24px;color:#374151;font-size:15px;line-height:1.8;">${features.map(f => `<li>${f}</li>`).join('')}</ul>`;
}

// ── SUBSCRIPTION ACTIVATED ─────────────────────────────────

export async function sendSubscriptionActivated(data: {
  to: string;
  clinicName: string;
  plan: string;
  trialEndDays?: number;
  billingPortalUrl?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.error('[billing-email] RESEND_API_KEY not set');
    return;
  }

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const planPrice = PLAN_PRICES[data.plan] || '';
  const features = PLAN_FEATURES[data.plan] || [];
  const trialText = data.trialEndDays ? `You have <strong>${data.trialEndDays} days</strong> on a free trial before your first payment.` : '';
  const subject = `Welcome to TMS List ${planName}! 🎉`;

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Welcome, ${data.clinicName}!</h2>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">
      Your <strong>${planName}</strong> subscription is now active. Here's what's included:
    </p>
    ${featureList(features)}
    ${trialText ? `<p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0;color:#166534;font-size:15px;">${trialText}</p>` : ''}
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      Your card will be charged <strong>${planPrice}</strong> after your trial ends. You can cancel anytime before then at no cost.
    </p>
    ${ctaButton(data.billingPortalUrl || `${SITE_URL}/portal/billing`, 'View Your Dashboard')}
    <p style="color:#64748b;font-size:13px;margin:0;">Questions? Reply to this email or contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#7C3AED;">${FOUNDER_EMAIL}</a></p>
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Subscription Activated'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── TRIAL ENDING REMINDER ─────────────────────────────────

export async function sendTrialEndingReminder(data: {
  to: string;
  clinicName: string;
  plan: string;
  trialEndDate: Date;
  daysRemaining: number;
  billingPortalUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const planPrice = PLAN_PRICES[data.plan] || '';
  const endDate = data.trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const subject = `Your TMS List ${planName} trial ends in ${data.daysRemaining} days`;

  const urgency = data.daysRemaining <= 3 ? 'important' : 'reminder';
  const urgencyStyle = data.daysRemaining <= 3
    ? 'background:#fef2f2;border:1px solid #fecaca;color:#991b1b;'
    : 'background:#fef9c3;border:1px solid #fde047;color:#854d0e;';
  const urgencyLabel = data.daysRemaining <= 3 ? '⚠️ Action Required' : '⏰ Trial Ending Soon';

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Don't lose access, ${data.clinicName}!</h2>
    <div style="${urgencyStyle}border-radius:8px;padding:16px;margin:0 0 24px;font-size:15px;">
      <strong>${urgencyLabel}</strong> — Your ${planName} free trial ends on <strong>${endDate}</strong>. After that, you'll be charged <strong>${planPrice}</strong>.
    </div>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      If you don't want to continue, please cancel before the trial ends and you won't be charged.
    </p>
    ${ctaButton(data.billingPortalUrl || `${SITE_URL}/portal/billing`, 'Manage Subscription')}
    <p style="color:#64748b;font-size:13px;margin:0;">Need help? Contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#7C3AED;">${FOUNDER_EMAIL}</a></p>
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Trial Ending'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── TRIAL CONVERTED (FIRST PAYMENT) ───────────────────────

export async function sendTrialConverted(data: {
  to: string;
  clinicName: string;
  plan: string;
  amount: number;
  currency: string;
  nextBillingDate: Date;
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const amountStr = data.currency === 'inr' ? `₹${data.amount.toLocaleString()}` : `$${(data.amount / 100).toFixed(2)}`;
  const nextDate = data.nextBillingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const subject = `Your first TMS List ${planName} payment was successful`;

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Payment confirmed! 💳</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${data.clinicName},</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="color:#166534;font-size:14px;margin:0 0 8px;font-weight:600;">Amount charged</p>
      <p style="color:#15803d;font-size:32px;font-weight:800;margin:0;">${amountStr}</p>
      <p style="color:#166534;font-size:13px;margin:8px 0 0;">${planName} plan — TMS List</p>
    </div>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      Your next payment will be on <strong>${nextDate}</strong>. You can view your billing history anytime in your portal.
    </p>
    ${ctaButton(`${SITE_URL}/portal/billing`, 'View Billing Dashboard')}
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Payment Confirmed'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── PAYMENT FAILED ────────────────────────────────────────

export async function sendPaymentFailed(data: {
  to: string;
  clinicName: string;
  plan: string;
  failureMessage?: string;
  amount?: number;
  currency?: string;
  retryDate?: Date;
  billingPortalUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const amountStr = data.amount
    ? (data.currency === 'inr' ? `₹${data.amount.toLocaleString()}` : `$${(data.amount / 100).toFixed(2)}`)
    : null;
  const retryText = data.retryDate
    ? `We'll retry payment on <strong>${data.retryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.`
    : 'Please update your payment method to avoid service interruption.';
  const subject = 'Action required: TMS List payment failed';

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Payment failed — Action needed ⚠️</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${data.clinicName},</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="color:#991b1b;font-size:15px;margin:0 0 12px;"><strong>Your ${planName} subscription payment${amountStr ? ` of ${amountStr}` : ''} failed.</strong></p>
      ${data.failureMessage ? `<p style="color:#b91c1c;font-size:14px;margin:0;">Reason: ${data.failureMessage}</p>` : ''}
    </div>
    <p style="color:#374151;font-size:15px;margin:0 0 8px;">${retryText}</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      If payment fails again, your subscription will be paused and you'll lose access to ${planName} features.
    </p>
    ${ctaButton(data.billingPortalUrl || `${SITE_URL}/portal/billing`, 'Update Payment Method', '#dc2626')}
    <p style="color:#64748b;font-size:13px;margin:0;">Need help? Contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#7C3AED;">${FOUNDER_EMAIL}</a></p>
  `;

  // Send to clinic owner
  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Payment Failed'),
    replyTo: FOUNDER_EMAIL,
  });

  // Also notify admin
  const adminSubject = `[TMS List] Payment failed — ${data.clinicName} (${data.to})`;
  await resend.emails.send({
    from: BILLING_FROM,
    to: ADMIN_EMAIL,
    subject: adminSubject,
    html: baseHtml(`<p style="color:#374151;font-size:15px;">Payment failed for <strong>${data.clinicName}</strong> (${data.to}) on ${planName} plan.</p>
      ${amountStr ? `<p style="color:#374151;font-size:15px;"><strong>Amount:</strong> ${amountStr}</p>` : ''}
      ${data.failureMessage ? `<p style="color:#374151;font-size:15px;"><strong>Reason:</strong> ${data.failureMessage}</p>` : ''}
      <p><a href="${SITE_URL}/portal/billing">View in billing portal</a></p>`, adminSubject, 'Admin Alert'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── SUBSCRIPTION RECOVERED ───────────────────────────────

export async function sendSubscriptionRecovered(data: {
  to: string;
  clinicName: string;
  plan: string;
  nextBillingDate: Date;
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const nextDate = data.nextBillingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const subject = 'Your TMS List subscription is active again ✓';

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Subscription restored! 🎉</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${data.clinicName},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      Great news — your <strong>${planName}</strong> subscription is active again. Your payment was successful and all ${planName} features are restored.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      Next billing date: <strong>${nextDate}</strong>
    </p>
    ${ctaButton(`${SITE_URL}/portal/dashboard`, 'Go to Dashboard')}
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Subscription Active'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── SUBSCRIPTION CANCELED ────────────────────────────────

export async function sendSubscriptionCanceled(data: {
  to: string;
  clinicName: string;
  plan: string;
  effectiveDate: Date;
  featuresLost?: string[];
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const endDate = data.effectiveDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const subject = 'Your TMS List subscription has been canceled';

  const featuresText = data.featuresLost && data.featuresLost.length > 0
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="color:#991b1b;font-size:14px;font-weight:600;margin:0 0 8px;">Features you'll lose access to:</p>
        <ul style="color:#b91c1c;font-size:14px;margin:0;padding-left:20px;">${data.featuresLost.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>`
    : '';

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Subscription canceled</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${data.clinicName},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      Your <strong>${planName}</strong> subscription has been canceled. You have access until <strong>${endDate}</strong>.
    </p>
    ${featuresText}
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      You can reactivate your subscription anytime — your listing will revert to the free tier after the access period ends.
    </p>
    ${ctaButton(`${SITE_URL}/pricing`, 'Reactivate Subscription')}
    <p style="color:#64748b;font-size:13px;margin:0;">Questions? Contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#7C3AED;">${FOUNDER_EMAIL}</a></p>
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Subscription Canceled'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── PLAN UPGRADED ─────────────────────────────────────────

export async function sendPlanUpgraded(data: {
  to: string;
  clinicName: string;
  fromPlan: string;
  toPlan: string;
  effectiveDate: Date;
  amount: number;
  currency: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const fromName = PLAN_NAMES[data.fromPlan] || data.fromPlan;
  const toName = PLAN_NAMES[data.toPlan] || data.toPlan;
  const newFeatures = PLAN_FEATURES[data.toPlan] || [];
  const amountStr = data.currency === 'inr' ? `₹${data.amount.toLocaleString()}/mo` : `$${(data.amount / 100).toFixed(2)}/mo`;
  const subject = `You've been upgraded to TMS List ${toName}! ✨`;

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Upgrade confirmed, ${data.clinicName}! 🎊</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">You've been upgraded from <strong>${fromName}</strong> to <strong>${toName}</strong>.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="color:#166534;font-size:16px;font-weight:600;margin:0;">New monthly charge: <strong>${amountStr}</strong></p>
      <p style="color:#166534;font-size:14px;margin:8px 0 0;">Effective immediately</p>
    </div>
    <p style="color:#374151;font-size:15px;margin:0 0 16px;"><strong>Your new ${toName} features:</strong></p>
    ${featureList(newFeatures)}
    ${ctaButton(`${SITE_URL}/portal/dashboard`, 'Explore Your New Features')}
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Plan Upgraded'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── PAYMENT METHOD EXPIRING ───────────────────────────────

export async function sendPaymentMethodExpiring(data: {
  to: string;
  clinicName: string;
  plan: string;
  expiryMonth: number;
  expiryYear: number;
  billingPortalUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const expiryStr = `${String(data.expiryMonth).padStart(2, '0')}/${data.expiryYear}`;
  const subject = 'Update your payment method — card expiring soon';

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Update your payment method ⚠️</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${data.clinicName},</p>
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="color:#854d0e;font-size:15px;margin:0 0 8px;"><strong>The card on file for your ${planName} subscription expires soon (${expiryStr}).</strong></p>
      <p style="color:#a16207;font-size:14px;margin:0;">Please update your payment method to avoid any service interruption.</p>
    </div>
    ${ctaButton(data.billingPortalUrl || `${SITE_URL}/portal/billing`, 'Update Payment Method', '#d97706')}
    <p style="color:#64748b;font-size:13px;margin:0;">Need help? Contact <a href="mailto:${FOUNDER_EMAIL}" style="color:#7C3AED;">${FOUNDER_EMAIL}</a></p>
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Payment Method Expiring'),
    replyTo: FOUNDER_EMAIL,
  });
}

// ── RECURRING PAYMENT RECEIPT ─────────────────────────────

export async function sendPaymentSucceeded(data: {
  to: string;
  clinicName: string;
  plan: string;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  nextBillingDate: Date;
  invoiceUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const planName = PLAN_NAMES[data.plan] || data.plan;
  const amountStr = data.currency === 'inr' ? `₹${data.amount.toLocaleString()}` : `$${(data.amount / 100).toFixed(2)}`;
  const periodStart = data.periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const periodEnd = data.periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const subject = `TMS List ${planName} payment — ${amountStr} charged`;

  const content = `
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">Payment receipt 📄</h2>
    <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${data.clinicName},</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;">TMS List ${planName} — Billing Period</p>
      <p style="color:#111827;font-size:14px;margin:0 0 16px;">${periodStart} – ${periodEnd}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <p style="color:#374151;font-size:15px;margin:0;"><strong>Total</strong></p>
        <p style="color:#111827;font-size:20px;font-weight:700;margin:0;">${amountStr}</p>
      </div>
    </div>
    <p style="color:#374151;font-size:14px;margin:0 0 24px;">Next payment on <strong>${data.nextBillingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.</p>
    ${data.invoiceUrl ? `<p style="text-align:center;"><a href="${data.invoiceUrl}" style="color:#7C3AED;font-size:14px;">Download invoice</a></p>` : ''}
  `;

  await resend.emails.send({
    from: BILLING_FROM,
    to: data.to,
    subject,
    html: baseHtml(content, subject, 'Payment Receipt'),
    replyTo: FOUNDER_EMAIL,
  });
}