/**
 * Clinic Engagement Tracking
 * Tracks suggestion interactions for churn prediction and health score actionability.
 * Uses Redis for fast read/write; falls back to in-memory Map for dev environments.
 */

import { redisClient, getCached, setCache } from './redis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SuggestionAction {
  clinicId: string;
  suggestionType: 'phone' | 'hours' | 'verify' | 'photos' | 'reviews' | 'description' | 'insurance' | 'faq';
  action: 'clicked' | 'completed' | 'dismissed';
  timestamp: Date;
}

export interface EngagementScore {
  clinicId: string;
  suggestionActionRate: number; // 0-100: % of suggestions acted on
  lastActionAt: Date | null;
  totalActions: number;
  score: number; // combined engagement score 0-100
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTION_TYPE_MAP: Record<string, string[]> = {
  phone: ['Add phone number', 'add phone number', 'phone number'],
  hours: ['opening hours', 'Add opening hours'],
  verify: ['Verify your clinic', 'verify your clinic'],
  photos: ['Add photos', 'profile photo', 'photos', 'gallery'],
  reviews: ['Respond to patient reviews', 'leave reviews'],
  description: ['description', 'detailed description'],
  insurance: ['insurance providers', 'insurance'],
  faq: ['Add FAQs', 'FAQs'],
};

// ── Logging ────────────────────────────────────────────────────────────────────

/**
 * Log when a clinic takes action on a health score suggestion.
 */
export async function logSuggestionAction(
  clinicId: string,
  suggestionText: string
): Promise<void> {
  const suggestionType = detectSuggestionType(suggestionText);
  if (!suggestionType) return;

  const action: SuggestionAction = {
    clinicId,
    suggestionType,
    action: 'clicked',
    timestamp: new Date(),
  };

  const cacheKey = `clinic_engagement:${clinicId}`;
  const existing = await getCached<{
    actions: SuggestionAction[];
    suggestionShown: Record<string, string>;
  }>(cacheKey).catch(() => null);

  const data = existing || { actions: [], suggestionShown: {} };
  data.actions.push(action);

  // Keep last 30 actions max
  if (data.actions.length > 30) {
    data.actions = data.actions.slice(-30);
  }

  await setCache(cacheKey, data, 86400 * 30); // 30-day retention
}

/**
 * Get the rate at which a clinic acts on suggestions (0-100).
 */
export async function getSuggestionActionRate(clinicId: string): Promise<number> {
  const cacheKey = `clinic_engagement:${clinicId}`;
  const data = await getCached<{ actions: SuggestionAction[] }>(cacheKey).catch(() => null);

  if (!data || data.actions.length === 0) return 0;

  // Rate = (completed / shown) × 100
  // For now, use action density as proxy
  const recentActions = data.actions.filter((a) => {
    const age = Date.now() - new Date(a.timestamp).getTime();
    return age < 30 * 86400 * 1000; // last 30 days
  });

  if (recentActions.length === 0) return 0;

  // Higher density = higher engagement rate
  const density = Math.min(recentActions.length / 10, 1);
  return Math.round(density * 100);
}

/**
 * Get recent suggestion actions for a clinic.
 */
export async function getRecentSuggestionActions(
  clinicId: string,
  days: number = 30
): Promise<SuggestionAction[]> {
  const cacheKey = `clinic_engagement:${clinicId}`;
  const data = await getCached<{ actions: SuggestionAction[] }>(cacheKey).catch(() => null);

  if (!data) return [];

  const cutoff = Date.now() - days * 86400 * 1000;
  return data.actions.filter((a) => new Date(a.timestamp).getTime() > cutoff);
}

/**
 * Combined engagement score for a clinic (0-100).
 * Combines suggestion action rate with recency weighting.
 */
export async function getEngagementScore(clinicId: string): Promise<EngagementScore> {
  const cacheKey = `clinic_engagement:${clinicId}`;
  const data = await getCached<{ actions: SuggestionAction[] }>(cacheKey).catch(() => null);

  const recentActions = data?.actions || [];
  const lastActionAt = recentActions.length > 0
    ? new Date(Math.max(...recentActions.map((a) => new Date(a.timestamp).getTime())))
    : null;

  const suggestionActionRate = await getSuggestionActionRate(clinicId);
  const totalActions = recentActions.length;

  // Combined score: action rate (70%) + recency bonus (30%)
  let score = suggestionActionRate * 0.7;
  if (lastActionAt) {
    const daysSince = (Date.now() - lastActionAt.getTime()) / (86400 * 1000);
    if (daysSince < 7) score += 30;
    else if (daysSince < 14) score += 20;
    else if (daysSince < 30) score += 10;
    else if (daysSince < 60) score += 5;
  }

  return {
    clinicId,
    suggestionActionRate,
    lastActionAt,
    totalActions,
    score: Math.min(Math.round(score), 100),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectSuggestionType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(SUGGESTION_TYPE_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) return type;
  }
  return null;
}

/**
 * Map a health score suggestion text to an actionable CTA.
 */
export function mapSuggestionToCTA(suggestion: string): {
  ctaLabel: string;
  ctaUrl: string;
} {
  const type = detectSuggestionType(suggestion);
  switch (type) {
    case 'phone':
      return { ctaLabel: 'Add phone number', ctaUrl: '/portal/settings?field=phone' };
    case 'hours':
      return { ctaLabel: 'Add opening hours', ctaUrl: '/portal/settings?field=hours' };
    case 'verify':
      return { ctaLabel: 'Verify your clinic', ctaUrl: '/portal/claim' };
    case 'photos':
      return { ctaLabel: 'Add photos', ctaUrl: '/portal/gallery' };
    case 'reviews':
      return { ctaLabel: 'Respond to reviews', ctaUrl: '/portal/reviews' };
    case 'description':
      return { ctaLabel: 'Add description', ctaUrl: '/portal/clinic' };
    case 'insurance':
      return { ctaLabel: 'Add insurance', ctaUrl: '/portal/settings?field=insurance' };
    case 'faq':
      return { ctaLabel: 'Add FAQs', ctaUrl: '/portal/clinic?field=faq' };
    default:
      return { ctaLabel: 'Take action', ctaUrl: '/portal/dashboard' };
  }
}