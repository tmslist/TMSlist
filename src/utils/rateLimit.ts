import { Ratelimit } from '@upstash/ratelimit';
import { apiRateLimit, formRateLimit, redis } from './redis';

/**
 * Lightweight in-memory sliding window rate limiter.
 * Used as fallback when Upstash Redis is unavailable.
 * PER-INSTANCE memory — works correctly for single-tenant/serverless with one cold start per instance.
 * For multi-instance deployments, Upstash Redis is required for true distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp when window expires
}

const store = new Map<string, RateLimitEntry>();

/**
 * Parse a window string like "15 m", "1 h", "5 m" into milliseconds.
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(m|min|h|s|ms)$/);
  if (!match) return 60_000; // default 1 minute
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1_000;
    case 'm':
    case 'min': return value * 60_000;
    case 'h': return value * 3_600_000;
    default: return 60_000;
  }
}

/**
 * Sliding window rate limit check.
 * @param key - Unique identifier (IP, email, etc.)
 * @param maxRequests - Max requests allowed in the window
 * @param window - Window duration (e.g. "15 m", "1 h", "5 m")
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  window: string
): { success: boolean; remaining: number; reset: number } {
  const windowMs = parseWindow(window);
  const now = Date.now();

  // Clean up expired entries periodically (lightweight — every ~50 calls)
  if (Math.random() < 0.02) {
    const cutoff = now - windowMs;
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= cutoff) store.delete(k);
    }
  }

  const entry = store.get(key);
  const windowStart = now - windowMs;

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: maxRequests - 1, reset: resetAt };
  }

  if (entry.resetAt > now && entry.count >= maxRequests) {
    // Over limit
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  // Within window, under limit
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, reset: entry.resetAt };
}

// PLACEHOLDER_MARKER_clinicMatcher
/**
 * Symptom-to-Clinic Matcher
 * Rule-based matching algorithm for patient-to-clinic recommendations.
 */

export interface MatchInput {
  symptoms: string[];
  severity: 1 | 2 | 3;
  treatmentHistory: string[];
  insurance: string;
  location: { city: string; state: string };
  preference: 'in-person' | 'telehealth' | 'no-preference';
}

export interface ClinicProfile {
  clinicId: string;
  name: string;
  slug: string;
  specialty: string[];
  machines: string[];
  insurances: string[];
  location: { city: string; state: string };
  hasTelehealth: boolean;
  avgRating: number;
  hasAvailability: boolean;
  healthScore: number;
  isVerified: boolean;
  description?: string;
}

export interface MatchResult {
  clinicId: string;
  name: string;
  slug: string;
  matchScore: number;
  matchReasons: string[];
  distance: string;
  hasAvailability: boolean;
  rating: number;
}

const SYMPTOM_SPECIALTIES: Record<string, string[]> = {
  depression: ['depression', 'mood-disorders', 'treatment-resistant-depression'],
  anxiety: ['anxiety', 'mood-disorders', 'panic-disorder'],
  ocd: ['ocd', 'anxiety'],
  ptsd: ['ptsd', 'trauma', 'anxiety'],
  insomnia: ['insomnia', 'sleep-disorders', 'depression'],
  'brain fog': ['cognitive-issues', 'depression', 'fibromyalgia'],
  migraines: ['migraines', 'headache', 'pain'],
};

const MACHINE_SPECIALTIES: Record<string, string[]> = {
  'brainsway': ['ocd', 'smoking-cessation', 'anxiety'],
  'deep-tms': ['ocd', 'treatment-resistant-depression', 'ptsd'],
  'magstim': ['depression', 'anxiety'],
  'neurostar': ['depression'],
  'tms': ['depression', 'anxiety'],
};

const TREATMENT_RESISTANT_KEYWORDS = ['treatment-resistant', 'treatment resistant', 'refractory', 'difficult-to-treat'];

const WEIGHTS = { SYMPTOM_MATCH: 0.35, INSURANCE_MATCH: 0.25, LOCATION: 0.20, PREFERENCE: 0.10, QUALITY_SIGNAL: 0.10 };

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
}

function calculateSymptomScore(symptoms: string[], clinic: ClinicProfile, severity: 1 | 2 | 3): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const normalizedSymptoms = symptoms.map(normalize);

  for (const symptom of normalizedSymptoms) {
    const relevantSpecialties = SYMPTOM_SPECIALTIES[symptom] || [symptom];
    for (const specialty of clinic.specialty) {
      const normalizedClinicSpec = normalize(specialty);
      if (relevantSpecialties.some(rs => normalizedClinicSpec.includes(rs) || rs.includes(normalizedClinicSpec))) {
        score += 40;
        break;
      }
    }
  }

  for (const machine of clinic.machines || []) {
    const normalizedMachine = normalize(machine);
    const machineSpecs = MACHINE_SPECIALTIES[normalizedMachine] || [normalizedMachine];
    for (const symptom of normalizedSymptoms) {
      if (machineSpecs.includes(symptom)) { score += 15; break; }
    }
    if (normalizedSymptoms.includes('ocd') && (normalizedMachine.includes('brainsway') || normalizedMachine.includes('deep'))) {
      score += 20;
      reasons.push('Offers BrainsWay Deep TMS for OCD');
    }
  }

  if (severity === 3) {
    const desc = clinic.description?.toLowerCase() || '';
    if (TREATMENT_RESISTANT_KEYWORDS.some(kw => desc.includes(kw))) {
      score += 30;
      reasons.push('Specializes in treatment-resistant depression');
    }
  }

  score = Math.min(100, score);
  if (score >= 80) {
    const matchedConditions = normalizedSymptoms.filter(symptom =>
      clinic.specialty.some(spec => normalize(spec).includes(symptom) || symptom.includes(normalize(spec)))
    );
    if (matchedConditions.length > 0) {
      reasons.push(`Specializes in ${matchedConditions.slice(0, 2).join(' and ')} treatment`);
    }
  }
  return { score, reasons: [...new Set(reasons)] };
}

function calculateInsuranceScore(patientInsurance: string, clinic: ClinicProfile): { score: number; reasons: string[] } {
  if (!patientInsurance) return { score: 50, reasons: [] };

  const normalizedPatient = normalize(patientInsurance);
  const clinicInsurances = clinic.insurances.map(i => normalize(i));

  for (const clinicInsurance of clinicInsurances) {
    if (clinicInsurance.includes(normalizedPatient) || normalizedPatient.includes(clinicInsurance)) {
      return { score: 100, reasons: [`Accepts ${patientInsurance}`] };
    }
    const variations: Record<string, string[]> = {
      'bluecross': ['bcbs', 'blue cross', 'blue cross blue shield', 'anthem'],
      'bcbs': ['bluecross', 'blue cross', 'blue cross blue shield', 'anthem'],
      'aetna': ['aetna'], 'cigna': ['cigna'], 'united': ['united', 'unitedhealthcare', 'uhc'],
      'unitedhealthcare': ['united', 'unitedhealthcare', 'uhc'], 'kaiser': ['kaiser'],
      'humana': ['humana'], 'medicare': ['medicare'], 'medicaid': ['medicaid'],
    };
    for (const [key, aliases] of Object.entries(variations)) {
      if (normalizedPatient.includes(key) || aliases.some(a => normalizedPatient.includes(a))) {
        if (clinicInsurance.includes(key) || aliases.some(a => clinicInsurance.includes(a))) {
          return { score: 100, reasons: [`Accepts ${patientInsurance}`] };
        }
      }
    }
  }
  return { score: 0, reasons: ['Does not accept this insurance'] };
}

function calculateLocationScore(patientLocation: { city: string; state: string }, clinicLocation: { city: string; state: string }): { score: number; distance: string } {
  if (normalize(patientLocation.city) === normalize(clinicLocation.city)) return { score: 100, distance: 'Same city' };
  if (normalize(patientLocation.state) === normalize(clinicLocation.state)) return { score: 50, distance: `In ${clinicLocation.state}` };

  const nearbyStates: Record<string, string[]> = {
    'CA': ['NV', 'AZ', 'OR'], 'TX': ['OK', 'NM', 'LA', 'AR'],
    'NY': ['NJ', 'CT', 'PA', 'MA'], 'FL': ['GA', 'AL'],
    'IL': ['IN', 'WI', 'IA', 'MO'], 'PA': ['NJ', 'NY', 'DE', 'MD', 'WV'],
    'OH': ['IN', 'KY', 'WV', 'MI', 'PA'], 'GA': ['FL', 'AL', 'TN', 'NC', 'SC'],
  };

  const nearby = nearbyStates[patientLocation.state] || [];
  if (nearby.includes(clinicLocation.state)) return { score: 30, distance: `Nearby (${clinicLocation.state})` };
  return { score: 0, distance: `${clinicLocation.state}` };
}

function calculatePreferenceScore(preference: 'in-person' | 'telehealth' | 'no-preference', clinic: ClinicProfile): { score: number; reasons: string[] } {
  if (preference === 'no-preference') return { score: 100, reasons: [] };
  if (preference === 'telehealth') {
    if (clinic.hasTelehealth) return { score: 100, reasons: ['Offers telehealth consultations'] };
    return { score: 0, reasons: [] };
  }
  return { score: clinic.hasTelehealth ? 70 : 100, reasons: [] };
}

function calculateQualityScore(clinic: ClinicProfile): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (clinic.isVerified) { score += 10; reasons.push('Verified clinic'); }
  if (clinic.healthScore > 70) score += 5;
  if (clinic.avgRating > 4.5) { score += 5; reasons.push(`${clinic.avgRating.toFixed(1)} star rating`); }
  else if (clinic.avgRating > 4.0) score += 3;
  return { score: Math.min(100, score), reasons };
}

export function calculateMatch(input: MatchInput, clinic: ClinicProfile): MatchResult {
  const symptomResult = calculateSymptomScore(input.symptoms, clinic, input.severity);
  const insuranceResult = calculateInsuranceScore(input.insurance, clinic);
  const locationResult = calculateLocationScore(input.location, clinic.location);
  const preferenceResult = calculatePreferenceScore(input.preference, clinic);
  const qualityResult = calculateQualityScore(clinic);

  const rawScore = symptomResult.score * WEIGHTS.SYMPTOM_MATCH + insuranceResult.score * WEIGHTS.INSURANCE_MATCH +
    locationResult.score * WEIGHTS.LOCATION + preferenceResult.score * WEIGHTS.PREFERENCE + qualityResult.score * WEIGHTS.QUALITY_SIGNAL;

  const matchScore = Math.round(Math.min(100, rawScore));
  const allReasons = [...symptomResult.reasons, ...insuranceResult.reasons, ...preferenceResult.reasons, ...qualityResult.reasons].slice(0, 4);

  return { clinicId: clinic.clinicId, name: clinic.name, slug: clinic.slug, matchScore, matchReasons: allReasons, distance: locationResult.distance, hasAvailability: clinic.hasAvailability, rating: clinic.avgRating };
}

export function rankClinics(input: MatchInput, clinics: ClinicProfile[], limit = 10): MatchResult[] {
  return clinics.map(clinic => calculateMatch(input, clinic)).filter(r => r.matchScore >= 20).sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

const matchCache = new Map<string, { results: MatchResult[]; expiresAt: number }>();

function getCacheKey(input: MatchInput): string {
  return JSON.stringify({ symptoms: input.symptoms.sort(), severity: input.severity, insurance: input.insurance, location: input.location, preference: input.preference });
}

export function getCachedMatches(input: MatchInput): MatchResult[] | null {
  const key = getCacheKey(input);
  const cached = matchCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.results;
  matchCache.delete(key);
  return null;
}

export function setCachedMatches(input: MatchInput, results: MatchResult[]): void {
  matchCache.set(getCacheKey(input), { results, expiresAt: Date.now() + 60 * 60 * 1000 });
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of matchCache.entries()) {
    if (value.expiresAt <= now) matchCache.delete(key);
  }
}, 5 * 60 * 1000);
// ENDOF_clinicMatcher

/**
 * Strict rate limit by a custom identifier (email, IP, etc.).
 * Tries Upstash Redis first, falls back to in-memory if Redis is unavailable.
 * Returns null if allowed, or a 429 Response if blocked.
 *
 * Production note: in-memory fallback is PER-INSTANCE and resets on every
 * serverless cold start, effectively disabling rate limiting under load.
 * In production we therefore require Redis and fail closed (HTTP 503) if
 * Upstash is not configured. Set UPSTASH_REDIS_REST_URL + _TOKEN, or set
 * `ALLOW_INMEMORY_RATELIMIT=true` to opt in to the fallback explicitly.
 */
export async function strictRateLimit(
  identifier: string,
  maxRequests: number,
  window: string,
  prefix: string,
): Promise<Response | null> {
  const r = redis();
  if (!r) {
    const isProd = process.env.NODE_ENV === 'production';
    const allowFallback = process.env.ALLOW_INMEMORY_RATELIMIT === 'true';
    if (isProd && !allowFallback) {
      console.error('[ratelimit] Redis not configured in production — refusing request');
      return new Response(JSON.stringify({
        error: 'Rate limiter not configured. Service unavailable.',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
    // Fallback: in-memory rate limiter (per-instance, best-effort)
    const result = inMemoryRateLimit(`${prefix}:${identifier}`, maxRequests, window);
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': retryAfter.toString(),
        },
      });
    }
    return null;
  }

  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(maxRequests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });

  const { success, limit, reset } = await limiter.limit(identifier);

  if (!success) {
    return new Response(JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  return null;
}

/**
 * Check rate limit for a request. Returns null if allowed, or a Response if blocked.
 * Uses Redis if available, falls back to in-memory.
 */
export async function checkRateLimit(
  request: Request,
  type: 'api' | 'form' = 'api'
): Promise<Response | null> {
  const limiter = type === 'form' ? formRateLimit() : apiRateLimit();
  if (!limiter) {
    // Fallback: in-memory rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const window = type === 'form' ? '1 m' : '1 m';
    const maxReq = type === 'form' ? 5 : 60;
    const result = inMemoryRateLimit(`${type}:${ip}`, maxReq, window);
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: 'Too many requests',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      });
    }
    return null;
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return new Response(JSON.stringify({
      error: 'Too many requests',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  return null;
}

/** Extract client IP from request headers. */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
