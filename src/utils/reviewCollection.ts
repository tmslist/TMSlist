/**
 * Review collection utilities — email and SMS review requests.
 */

import { Resend } from 'resend';

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const TWILIO_SID = import.meta.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = import.meta.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = import.meta.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

/**
 * Send review request email to a patient.
 */
export async function sendReviewRequestEmail(data: {
  patientName: string;
  patientEmail: string;
  clinicName: string;
  clinicSlug: string;
}): Promise<boolean> {
  if (!RESEND_KEY) return false;

  const resend = new Resend(RESEND_KEY);
  const reviewUrl = `${SITE_URL}/clinic/${data.clinicSlug}#reviews`;

  try {
    await resend.emails.send({
      from: 'TMS List <reviews@tmslist.com>',
      to: data.patientEmail,
      subject: `How was your experience at ${data.clinicName}?`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4f46e5, #2563eb); color: white; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Your feedback matters</h1>
          </div>
          <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #334155;">Hi ${data.patientName},</p>
            <p style="color: #64748b; line-height: 1.6;">
              We hope your TMS treatment at <strong>${data.clinicName}</strong> has been a positive experience.
              Your review helps other patients find the right care and helps the clinic continue improving.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${reviewUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
                Leave a Review
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">
              It only takes 2 minutes. Your review is anonymous and helps others.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
            Sent by TMS List on behalf of ${data.clinicName}. <a href="${SITE_URL}" style="color: #94a3b8;">Unsubscribe</a>
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
 * Send SMS via Twilio.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return false;

  const cleanTo = to.replace(/[^\d+]/g, '');
  if (cleanTo.length < 10) return false;
  const formattedTo = cleanTo.startsWith('+') ? cleanTo : `+1${cleanTo}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
      },
      body: new URLSearchParams({ To: formattedTo, From: TWILIO_FROM, Body: body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Generate a QR code URL for in-clinic review collection.
 * Uses a free QR code API.
 */
export function getReviewQrCodeUrl(clinicSlug: string, size = 300): string {
  const reviewUrl = encodeURIComponent(`${SITE_URL}/clinic/${clinicSlug}#reviews`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${reviewUrl}&format=png&margin=10`;
}
