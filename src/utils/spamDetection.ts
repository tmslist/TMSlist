// Comprehensive disposable email domain list
export const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'mailinator.com', 'guerrillamail.com',
  '10minutemail.com', 'fakeinbox.com', 'trashmail.com', 'yopmail.com',
  'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
  'mintemail.com', 'mailnesia.com', 'temp-mail.org', 'getnada.com',
  'dispostable.com', 'mailcatch.com', 'spamgourmet.com', 'mytrashmail.com',
  'mt2009.com', 'mt2014.com', 'thankyou2010.com', 'trash2009.com',
  '010710.sh', '0815.ru', '0x00.name', '10mail.org', '126.com',
  '33mail.com', 'anonbox.net', 'antispam.de', 'binkmail.com',
]);

/**
 * Check if an email domain is a known disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Calculate a spam score (0-100) for a lead based on email, name, and message.
 * Thresholds: 0-29 = clean, 30-69 = suspicious, 70+ = spam.
 */
export function calculateSpamScore(params: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  message?: string | null;
}): number {
  let score = 0;

  // Disposable email = immediate spam
  if (params.email && isDisposableEmail(params.email)) {
    score += 100;
  }

  // Bot pattern: very short random-looking email (e.g., abcdefghijk@t.com)
  if (params.email) {
    const localPart = params.email.split('@')[0] || '';
    if (/^[a-z]{10,}$/i.test(localPart)) score += 30;
  }

  // Empty name + empty phone + empty message = suspicious
  if (!params.name && !params.phone && !params.message) score += 40;

  // Very short message
  if (params.message && params.message.length < 10) score += 20;

  // Suspicious keywords in message
  const suspiciousPatterns = [
    /\b(buy now|click here|limited time|act now)\b/i,
    /\b(viagra|cialis|casino|lottery|winner)\b/i,
  ];
  for (const pattern of suspiciousPatterns) {
    if (params.message && pattern.test(params.message)) score += 25;
  }

  // Multiple URLs in message
  if (params.message) {
    const urlCount = (params.message.match(/https?:\/\/[^\s]+/gi) || []).length;
    if (urlCount > 2) score += 30;
  }

  return Math.min(score, 100);
}

export type SpamLevel = 'clean' | 'suspicious' | 'spam';

export function getSpamLevel(score: number): SpamLevel {
  if (score >= 70) return 'spam';
  if (score >= 30) return 'suspicious';
  return 'clean';
}
