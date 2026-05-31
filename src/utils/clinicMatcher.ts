/**
 * Clinic Matcher — AI Symptom-to-Treatment Matching
 * Matches patient symptoms to the best-suited clinics.
 * Rule-based scoring (no external AI needed for v1).
 */

import { db } from '../db';
import { clinics } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getCached, setCache } from './redis';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  specialty: string[];
  machines: string[];
  insurances: string[];
  location: { city: string; state: string };
  hasTelehealth: boolean;
  avgRating: number;
  hasAvailability: boolean;
  healthScore: number;
  isVerified: boolean;
  description?: string | null;
  heroImage?: string | null;
}

export interface ClinicMatch {
  clinicId: string;
  name: string;
  matchScore: number;
  matchReasons: string[];
  distance: string;
  hasAvailability: boolean;
  rating: number;
  isVerified: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SYMPTOM_SPECIALTY_MAP: Record<string, string[]> = {
  depression: ['depression', 'mood', 'mental_health', 'tms'],
  anxiety: ['anxiety', 'mental_health', 'tms'],
  ocd: ['ocd', 'brainsway', 'deep_tms'],
  ptsd: ['ptsd', 'trauma', 'mental_health'],
  insomnia: ['insomnia', 'sleep', 'mental_health'],
  'brain fog': ['brain_fog', 'cognitive', 'mental_health'],
  migraines: ['migraine', 'neurology', 'headache'],
};

const PREMIUM_DEVICES = ['NeuroStar', 'BrainsWay', 'MagVenture', 'Deep TMS', 'Theta Burst'];

const TELEHEALTH_INDICATORS = ['telehealth', 'virtual', 'online', 'video'];

// ── Core Matching ─────────────────────────────────────────────────────────────

export async function findClinicMatches(input: MatchInput, limit: number = 5): Promise<ClinicMatch[]> {
  const cacheKey = `clinic_matches:${JSON.stringify(input).slice(0, 200)}`;
  const cached = await getCached<ClinicMatch[]>(cacheKey).catch(() => null);
  if (cached) return cached.slice(0, limit);

  // Get all active clinics
  const activeClinics = await getActiveClinics();

  // Score each clinic
  const scored = activeClinics.map((clinic) => calculateMatch(input, clinic));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top matches
  const matches = scored.slice(0, limit).map((s) => ({
    clinicId: s.clinic.clinicId,
    name: s.clinic.name,
    matchScore: s.score,
    matchReasons: s.reasons,
    distance: calculateDistance(input.location, s.clinic.location),
    hasAvailability: s.clinic.hasAvailability,
    rating: s.clinic.avgRating,
    isVerified: s.clinic.isVerified,
  }));

  await setCache(cacheKey, matches, 3600); // 1-hour cache
  return matches;
}

// ── Helper Functions ───────────────────────────────────────────────────────────

async function getActiveClinics(): Promise<ClinicProfile[]> {
  try {
    const result = await db.select().from(clinics).where(eq(clinics.verified, true)).limit(100);

    return result.map((clinic) => {
      const avail = clinic.availability as any;
      const desc = clinic.description || '';

      // Check for telehealth indicators in description
      const hasTelehealth = TELEHEALTH_INDICATORS.some((ind) =>
        desc.toLowerCase().includes(ind) || (clinic.specialties as string[])?.some((s) => s.toLowerCase().includes(ind))
      );

      return {
        clinicId: clinic.id,
        name: clinic.name || 'Clinic',
        specialty: (clinic.specialties as string[]) || [],
        machines: (clinic.machines as string[]) || [],
        insurances: (clinic.insurances as string[]) || [],
        location: {
          city: clinic.city || '',
          state: clinic.state || '',
        },
        hasTelehealth,
        avgRating: Number(clinic.ratingAvg || 0),
        hasAvailability: Boolean(avail?.openings && Object.keys(avail.openings).length > 0),
        healthScore: calculateClinicHealthScore(clinic),
        isVerified: clinic.verified || false,
        description: clinic.description,
        heroImage: (clinic.media as any)?.hero_image_url,
      };
    });
  } catch {
    return [];
  }
}

interface ScoredClinic {
  clinic: ClinicProfile;
  score: number;
  reasons: string[];
}

function calculateMatch(input: MatchInput, clinic: ClinicProfile): ScoredClinic {
  let score = 0;
  const reasons: string[] = [];

  // 1. Symptom match (35%)
  const symptomScore = calculateSymptomMatch(input.symptoms, clinic);
  score += symptomScore * 0.35;
  if (symptomScore > 0) reasons.push(getSymptomMatchReason(input.symptoms, clinic));

  // 2. Insurance match (25%)
  const insuranceScore = calculateInsuranceMatch(input.insurance, clinic);
  score += insuranceScore * 0.25;
  if (insuranceScore > 0) reasons.push(`Accepts ${input.insurance}`);

  // 3. Location (20%)
  const locationScore = calculateLocationScore(input.location, clinic);
  score += locationScore * 0.20;
  if (locationScore >= 1) reasons.push('In your area');

  // 4. Preference match (10%)
  if (input.preference === 'telehealth' && clinic.hasTelehealth) {
    score += 10;
    reasons.push('Offers telehealth');
  } else if (input.preference === 'in-person' && !clinic.hasTelehealth) {
    score += 5; // Slight bonus for in-person preference
    reasons.push('In-person visits available');
  }

  // 5. Quality signals (10%)
  if (clinic.isVerified) {
    score += 5;
  }
  if (clinic.avgRating >= 4.5) {
    score += 3;
    reasons.push(`${clinic.avgRating.toFixed(1)}★ rating`);
  }
  if (clinic.healthScore >= 70) {
    score += 2;
  }

  // 6. Severity + treatment history bonus
  if (input.severity === 3 && !input.treatmentHistory.includes('none')) {
    // Treatment-resistant — check for advanced devices
    const hasAdvancedDevice = clinic.machines.some((m) =>
      PREMIUM_DEVICES.some((d) => m.toLowerCase().includes(d.toLowerCase()))
    );
    if (hasAdvancedDevice) {
      score += 15;
      reasons.push('Offers advanced TMS technology');
    }
  }

  // 7. Availability bonus
  if (clinic.hasAvailability) {
    score += 5;
    reasons.push('Available now');
  }

  return {
    clinic,
    score: Math.min(Math.round(score), 100),
    reasons: [...new Set(reasons)].slice(0, 4), // Dedupe, max 4 reasons
  };
}

function calculateSymptomMatch(symptoms: string[], clinic: ClinicProfile): number {
  let score = 0;

  for (const symptom of symptoms) {
    const symptomKey = symptom.toLowerCase();
    const relatedSpecialties = SYMPTOM_SPECIALTY_MAP[symptomKey] || [symptomKey];

    // Check if clinic specialty matches
    const hasMatch = clinic.specialty.some((s) =>
      relatedSpecialties.some((rs) => s.toLowerCase().includes(rs))
    );

    if (hasMatch) {
      score += 30;
    } else {
      // Partial match
      const partialMatch = clinic.specialty.some((s) =>
        relatedSpecialties.some((rs) => s.toLowerCase().includes(rs.split('_')[0]))
      );
      if (partialMatch) score += 15;
    }
  }

  return Math.min(score, 40);
}

function getSymptomMatchReason(symptoms: string[], clinic: ClinicProfile): string {
  const symptomKey = symptoms[0]?.toLowerCase();
  const relatedSpecialties = SYMPTOM_SPECIALTY_MAP[symptomKey] || [symptomKey];

  const matched = clinic.specialty.find((s) =>
    relatedSpecialties.some((rs) => s.toLowerCase().includes(rs))
  );

  if (matched) {
    return `Specializes in ${matched.replace(/_/g, ' ')}`;
  }
  return `Treats ${symptoms[0]}`;
}

function calculateInsuranceMatch(insurance: string, clinic: ClinicProfile): number {
  if (!insurance || insurance.length < 3) return 0;

  const match = clinic.insurances.some((i) =>
    i.toLowerCase().includes(insurance.toLowerCase()) ||
    insurance.toLowerCase().includes(i.toLowerCase())
  );

  return match ? 25 : 0;
}

function calculateLocationScore(input: { city: string; state: string }, clinic: ClinicProfile): number {
  if (!input.city && !input.state) return 0.5; // No location preference

  let score = 0;

  // Same city = 1.0
  if (input.city && clinic.location.city &&
      input.city.toLowerCase() === clinic.location.city.toLowerCase()) {
    score = 1.0;
  }
  // Same state = 0.6
  else if (input.state && clinic.location.state &&
           input.state.toLowerCase() === clinic.location.state.toLowerCase()) {
    score = 0.6;
  }

  return score;
}

function calculateDistance(from: { city: string; state: string }, to: { city: string; state: string }): string {
  if (!from.city && !from.state) return '';
  if (from.city?.toLowerCase() === to.city?.toLowerCase()) return 'In your city';
  if (from.state?.toLowerCase() === to.state?.toLowerCase()) return 'In your state';
  return 'Nearby';
}

function calculateClinicHealthScore(clinic: any): number {
  let score = 0;
  if (clinic.verified) score += 20;
  if ((clinic.ratingAvg || 0) >= 4.5) score += 25;
  else if ((clinic.ratingAvg || 0) >= 4.0) score += 20;
  if ((clinic.reviewCount || 0) >= 10) score += 15;
  return Math.min(score, 100);
}