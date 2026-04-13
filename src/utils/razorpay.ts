const KEY_ID = import.meta.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = import.meta.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

function getRazorpay() {
  if (!KEY_ID || !KEY_SECRET) return null;
  // Lazily import to avoid build errors when package not installed
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

export function getRazorpayClient() {
  return getRazorpay();
}

export async function createRazorpayCustomer(opts: {
  email: string;
  name: string;
  phone?: string;
}) {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error('Razorpay not configured');

  const customer = await razorpay.customers.create({
    email: opts.email,
    name: opts.name,
    phone: opts.phone,
  });

  return customer;
}

export async function createRazorpaySubscription(opts: {
  planId: string;
  customerId: string;
  email: string;
  clinicId: string;
  notifyId?: string;
  notifyEmail?: string;
}) {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error('Razorpay not configured');

  const subscription = await razorpay.subscriptions.create({
    plan_id: opts.planId,
    customer_id: opts.customerId,
    notify_info: {
      notify_id: opts.notifyId,
      notify_email: opts.notifyEmail,
    },
    total_count: 12, // annual billing, billed monthly
    quantity: 1,
    metadata: {
      clinicId: opts.clinicId,
      email: opts.email,
    },
  });

  return subscription;
}

export async function cancelRazorpaySubscription(subscriptionId: string) {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error('Razorpay not configured');
  return razorpay.subscriptions.cancel(subscriptionId);
}

export async function getRazorpaySubscription(subscriptionId: string) {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error('Razorpay not configured');
  return razorpay.subscriptions.fetch(subscriptionId);
}

export function verifyRazorpayWebhookSignature(body: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === signature;
}