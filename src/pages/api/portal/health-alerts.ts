import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { calculateHealthScore } from '../../../utils/healthScore';
import { mapSuggestionToCTA, logSuggestionAction } from '../../../utils/clinicEngagement';
import { getCached, setCache } from '../../../utils/redis';

export const prerender = false;

interface HealthAlertSuggestion {
  text: string;
  action: string;
  ctaLabel: string;
  ctaUrl: string;
  type: string;
}

interface HealthAlert {
  alert: boolean;
  score: number;
  previousScore: number;
  scoreChange: number;
  grade: string;
  suggestions: HealthAlertSuggestion[];
  upgradeNudge?: {
    title: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
  };
}

/**
 * Fetch health alerts for the authenticated clinic owner.
 * GET /api/portal/health-alerts
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'clinic_owner', 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.userId;

  try {
    // Get clinic ID from session (clinic owners have one associated clinic)
    const { db } = await import('../../../db');
    const { users } = await import('../../../db/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.clinicId) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clinicId = user.clinicId as string;

    // Check cache first (5-minute TTL)
    const cacheKey = `portal_health_alerts:${clinicId}`;
    const cached = await getCached<HealthAlert>(cacheKey).catch(() => null);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Fetch current clinic data
    const { clinics } = await import('../../../db/schema');
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate current health score
    const currentScore = calculateHealthScore({
      ratingAvg: Number(clinic.ratingAvg || 0),
      reviewCount: clinic.reviewCount || 0,
      verified: clinic.verified,
      isFeatured: clinic.isFeatured,
      phone: clinic.phone,
      website: clinic.website,
      email: clinic.email,
      description: clinic.description,
      descriptionLong: clinic.descriptionLong,
      machines: clinic.machines,
      specialties: clinic.specialties,
      insurances: clinic.insurances,
      openingHours: clinic.openingHours,
      accessibility: clinic.accessibility as any,
      availability: clinic.availability as any,
      pricing: clinic.pricing as any,
      media: clinic.media as any,
      faqs: clinic.faqs as any,
      subscriptionTier: clinic.subscriptionPlan as string | null,
      hasOwnerResponses: Boolean(clinic.ownerResponseRate && clinic.ownerResponseRate > 0),
    });

    // Get previous score from cache
    const prevKey = `health_score:previous:${clinicId}`;
    const previousScore = await getCached<number>(prevKey).catch(() => null) ?? currentScore.total;

    // Check which suggestions have been shown recently (7-day window)
    const shownKey = `health_alerts:recent:${clinicId}`;
    const recentlyShown = await getCached<string[]>(shownKey).catch(() => null) ?? [];

    // Filter suggestions that haven't been shown recently
    const availableSuggestions = currentScore.suggestions
      .filter((s) => !recentlyShown.includes(s))
      .slice(0, 5);

    // Map to actionable CTAs
    const suggestions: HealthAlertSuggestion[] = availableSuggestions.map((s) => {
      const cta = mapSuggestionToCTA(s);
      return {
        text: s,
        action: s,
        ctaLabel: cta.ctaLabel,
        ctaUrl: cta.ctaUrl,
        type: detectSuggestionType(s),
      };
    });

    // Determine if there's an alert condition
    const scoreDrop = previousScore - currentScore.total;
    const isAlert = scoreDrop > 10 || currentScore.total < 70;

    // Generate upgrade nudge based on profile state
    let upgradeNudge: HealthAlert['upgradeNudge'] | undefined;
    const photoCount = (clinic.media as any)?.gallery_urls?.length ?? 0;
    const hasHero = Boolean((clinic.media as any)?.hero_image_url);
    if (photoCount < 3 && !hasHero) {
      upgradeNudge = {
        title: 'Clinics with 3+ photos get 2x more leads',
        body: 'Adding photos to your listing significantly increases patient interest and booking rates.',
        ctaLabel: 'Add photos now',
        ctaUrl: '/portal/gallery',
      };
    } else if (!clinic.verified) {
      upgradeNudge = {
        title: 'Get verified to rank higher',
        body: 'Verified clinics appear at the top of search results and earn patient trust.',
        ctaLabel: 'Start verification',
        ctaUrl: '/portal/claim',
      };
    }

    const alert: HealthAlert = {
      alert: isAlert,
      score: currentScore.total,
      previousScore,
      scoreChange: scoreDrop,
      grade: currentScore.grade,
      suggestions,
      upgradeNudge,
    };

    // Cache result for 5 minutes
    await setCache(cacheKey, alert, 300);

    // Update previous score if it changed significantly
    if (Math.abs(scoreDrop) > 5) {
      await setCache(prevKey, currentScore.total, 86400 * 7); // 7-day retention
    }

    return new Response(JSON.stringify(alert), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('Health alerts error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Log when a user clicks a suggestion CTA.
 * POST /api/portal/health-alerts
 * Body: { clinicId, suggestionText }
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'clinic_owner', 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { clinicId, suggestionText } = body;

    if (!clinicId || !suggestionText) {
      return new Response(JSON.stringify({ error: 'clinicId and suggestionText required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the action
    await logSuggestionAction(clinicId, suggestionText);

    // Update recently-shown list
    const shownKey = `health_alerts:recent:${clinicId}`;
    const recent = await getCached<string[]>(shownKey).catch(() => []) ?? [];
    const updated = [...recent, suggestionText].slice(-10); // keep last 10
    await setCache(shownKey, updated, 86400 * 7);

    // Invalidate health alerts cache so next fetch gets fresh data
    const cacheKey = `portal_health_alerts:${clinicId}`;
    await setCache(cacheKey, null, -1); // delete

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Health alerts log error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectSuggestionType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('phone')) return 'phone';
  if (lower.includes('hours') || lower.includes('opening')) return 'hours';
  if (lower.includes('verify')) return 'verify';
  if (lower.includes('photo') || lower.includes('gallery')) return 'photos';
  if (lower.includes('review')) return 'reviews';
  if (lower.includes('description')) return 'description';
  if (lower.includes('insurance')) return 'insurance';
  if (lower.includes('faq')) return 'faq';
  return 'other';
}