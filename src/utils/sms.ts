/**
 * SMS notifications via Twilio.
 * Falls back gracefully when env vars are not set.
 */

const TWILIO_SID = import.meta.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = import.meta.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = import.meta.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;

async function sendSms(to: string, body: string): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return false;

  // Clean phone number
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
      body: new URLSearchParams({
        To: formattedTo,
        From: TWILIO_FROM,
        Body: body,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send lead notification SMS to clinic.
 */
export async function sendLeadSms(data: {
  clinicPhone: string;
  clinicName: string;
  patientName: string;
  patientPhone?: string;
  condition?: string;
}) {
  const message = [
    `[TMS List] New Lead`,
    `Patient: ${data.patientName}`,
    data.patientPhone ? `Phone: ${data.patientPhone}` : null,
    data.condition ? `Condition: ${data.condition}` : null,
    ``,
    `Reply ASAP — fast response = higher conversion.`,
    `View dashboard: tmslist.com/owner/dashboard`,
  ].filter(Boolean).join('\n');

  return sendSms(data.clinicPhone, message);
}

/**
 * Send review notification SMS to clinic.
 */
export async function sendReviewSms(data: {
  clinicPhone: string;
  clinicName: string;
  rating: number;
  reviewerName: string;
}) {
  const stars = '[star]'.repeat(data.rating) + '[empty]'.repeat(5 - data.rating);
  const message = `${stars} New ${data.rating}-star review for ${data.clinicName} from ${data.reviewerName}. View: tmslist.com/owner/dashboard`;
  return sendSms(data.clinicPhone, message);
}

/**
 * Send appointment reminder SMS to patient.
 */
export async function sendAppointmentReminder(data: {
  patientPhone: string;
  clinicName: string;
  dateTime: string;
}) {
  const message = `TMS List Reminder: Your appointment at ${data.clinicName} is ${data.dateTime}. Questions? Reply to this message.`;
  return sendSms(data.patientPhone, message);
}
