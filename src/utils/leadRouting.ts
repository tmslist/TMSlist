/**
 * Intelligent Lead Routing Engine
 * Routes leads to the best-matched clinic based on specialty, availability,
 * conversion history, and response time.
 */

import { db } from '../db';
import { leads, clinics } from '../db/schema';
import { eq, desc, and, gte, lt } from 'drizzle-orm';
import { getCached, setCache } from './redis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  type: string;
  city?: string | null;
  state?: string | null;
  insurance?: string | null;
  symptoms?: string[];
  createdAt: Date;
  clinicId?: string | null;
  name?: string | null;
  email?: string | null;
  message?: string | null;
}

export interface ClinicCapacity {
  clinicId: string;
  name: string;
  specialty: string[];
  location: { city: string; state: string };
  avgRating: number;
  conversionRate: number;    // leads → appointments (historical)
  responseTimeHours: number; // avg hours to respond
  isVerified: boolean;
  hasAvailability: boolean;
  insurances: string[];
  subscriptionTier: string;
  leadCount30d: number;      // leads in last 30 days
}

export interface RoutingDecision {
  primaryClinicId: string | null;
  secondaryClinicIds: string[];
  reason: string;
  score: number;             // 0-100 match quality
  signals: { signal: string; contribution: number }[];
}

export interface ColdLead {
  lead: Lead;
  hoursSinceCreated: number;
  lastActivity?: Date;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SYMPTOM_SPECIALTY_MAP: Record<string, string[]> = {
  depression: ['depression', 'mood', 'tms', 'mental_health'],
  anxiety: ['anxiety', 'mental_health', 'tms'],
  ocd: ['ocd', 'brainsway', 'deep_tms'],
  ptsd: ['ptsd', 'trauma', 'mental_health'],
  insomnia: ['insomnia', 'sleep', 'mental_health'],
  migraines: ['migraine', 'neurology', 'headache'],
  'treatment-resistant': ['treatment_resistant', 'tms'],
};

const SPECIALIST_LEAD_TYPES = ['specialist_enquiry', 'appointment_request'];
const TMS_LEAD_TYPES = ['lead_magnet', 'callback_request', 'contact'];

// ── Core Routing ──────────────────────────────────────────────────────────────

/**
 * Route a lead to the best-matched clinic.
 */
export async function routeLead(lead: Lead): Promise<RoutingDecision> {
  // If lead already has a clinic assignment, preserve it
  if (lead.clinicId) {
    return {
      primaryClinicId: lead.clinicId,
      secondaryClinicIds: [],
      reason: 'Lead already assigned to a clinic',
      score: 100,
      signals: [],
    };
  }

  // Get all active clinics with their capacity data
  const activeClinics = await getActiveClinics();

  if (activeClinics.length === 0) {
    return {
      primaryClinicId: null,
      secondaryClinicIds: [],
      reason: 'No active clinics found',
      score: 0,
      signals: [],
    };
  }

  // Filter by availability first
  const availableClinics = activeClinics.filter((c) => c.hasAvailability);

  // Score each clinic
  const scored = availableClinics.map((clinic) => {
    const signals: { signal: string; contribution: number }[] = [];
    let score = 0;

    // Specialty match (40%)
    const specialtyScore = calculateSpecialtyMatch(lead, clinic);
    score += specialtyScore * 0.4;
    if (specialtyScore > 0) signals.push({ signal: 'Specialty match', contribution: specialtyScore * 0.4 });

    // Availability (25%)
    if (clinic.hasAvailability) {
      score += 25;
      signals.push({ signal: 'Available now', contribution: 25 });
    }

    // Conversion rate (20%)
    if (clinic.conversionRate > 0) {
      const convScore = Math.min(clinic.conversionRate * 50, 20); // 40%+ conv = max
      score += convScore;
      signals.push({ signal: `${Math.round(clinic.conversionRate * 100)}% historical conversion`, contribution: convScore });
    }

    // Response time (15%)
    if (clinic.responseTimeHours <= 24) {
      score += 15;
      signals.push({ signal: 'Responds within 24h', contribution: 15 });
    } else if (clinic.responseTimeHours <= 48) {
      score += 8;
      signals.push({ signal: 'Responds within 48h', contribution: 8 });
    }

    // Verification bonus (included in score, cap at 100)
    if (clinic.isVerified) {
      score += 5;
    }

    return { clinic, score: Math.min(score, 100), signals };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  const secondaries = scored.slice(1, 4).map((s) => s.clinic.clinicId);

  const reason = generateRoutingReason(lead, top.clinic, top.signals);

  return {
    primaryClinicId: top.clinic.clinicId,
    secondaryClinicIds: secondaries,
    reason,
    score: top.score,
    signals: top.signals,
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

async function getActiveClinics(): Promise<ClinicCapacity[]> {
  const cacheKey = 'active_clinics_capacity';
  const cached = await getCached<ClinicCapacity[]>(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const result = await db.select().from(clinics).where(eq(clinics.isFeatured, true)).limit(100);

    // Get lead conversion rates (simple: appointments / total leads per clinic in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);

    const withMetrics = result.map((clinic) => {
      const avail = clinic.availability as any;
      return {
        clinicId: clinic.id,
        name: clinic.name || 'Unknown Clinic',
        specialty: (clinic.specialties as string[]) || [],
        location: {
          city: clinic.city || '',
          state: clinic.state || '',
        },
        avgRating: Number(clinic.ratingAvg || 0),
        conversionRate: 0.3, // placeholder — implement actual calculation
        responseTimeHours: 24, // placeholder — implement actual tracking
        isVerified: clinic.verified || false,
        hasAvailability: Boolean(avail?.openings && Object.keys(avail.openings).length > 0),
        insurances: (clinic.insurances as string[]) || [],
        subscriptionTier: (clinic.subscriptionPlan as string) || 'verified',
        leadCount30d: 0, // placeholder
      };
    });

    await setCache(cacheKey, withMetrics, 600); // 10-minute cache
    return withMetrics;
  } catch {
    return [];
  }
}

function calculateSpecialtyMatch(lead: Lead, clinic: ClinicCapacity): number {
  let score = 0;

  // Lead type → expected specialty
  if (SPECIALIST_LEAD_TYPES.includes(lead.type)) {
    // Appointment/specialist requests → TMS clinics
    if (clinic.specialty.some((s) => ['tms', 'mental_health', 'depression'].includes(s))) {
      score += 40;
    }
  }

  if (TMS_LEAD_TYPES.includes(lead.type)) {
    if (clinic.specialty.some((s) => ['tms'].includes(s))) {
      score += 40;
    }
  }

  // Insurance match bonus
  if (lead.insurance && clinic.insurances.length > 0) {
    const insuranceMatch = clinic.insurances.some((i) =>
      i.toLowerCase().includes(lead.insurance!.toLowerCase())
    );
    if (insuranceMatch) score += 10;
  }

  // Location bonus
  if (lead.city && clinic.location.city) {
    if (lead.city.toLowerCase() === clinic.location.city.toLowerCase()) {
      score += 15;
    }
  }

  return Math.min(score, 50); // cap at 50
}

function generateRoutingReason(lead: Lead, clinic: ClinicCapacity, signals: { signal: string; contribution: number }[]): string {
  const topSignal = signals.sort((a, b) => b.contribution - a.contribution)[0];
  if (topSignal) {
    return `${topSignal.signal} — routing to ${clinic.name}`;
  }
  return `Best available match for ${lead.type} lead`;
}

// ── Cold Lead Detection ───────────────────────────────────────────────────────

/**
 * Get leads with no response in the last 24 hours.
 */
export async function getColdLeads(hours: number = 24): Promise<ColdLead[]> {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);

  try {
    const result = await db
      .select()
      .from(leads)
      .where(and(
        gte(leads.createdAt, cutoff),
        eq(leads.clinicId, null as any) // unassigned leads
      ))
      .orderBy(desc(leads.createdAt))
      .limit(50);

    return result.map((lead) => ({
      lead: lead as unknown as Lead,
      hoursSinceCreated: Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 3600000),
    }));
  } catch {
    return [];
  }
}

// ── Routing Analytics ─────────────────────────────────────────────────────────

export interface RoutingAnalytics {
  clinicId: string;
  leadsReceived: number;
  leadsConverted: number;
  conversionRate: number;
  avgResponseTimeHours: number;
  topSignal: string;
}

export async function getRoutingAnalytics(clinicId: string): Promise<RoutingAnalytics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);

  try {
    const result = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.clinicId, clinicId as any),
        gte(leads.createdAt, thirtyDaysAgo)
      ))
      .orderBy(desc(leads.createdAt))
      .limit(100);

    const leadsReceived = result.length;
    const appointments = result.filter((l) => l.type === 'appointment_request').length;
    const conversionRate = leadsReceived > 0 ? appointments / leadsReceived : 0;

    return {
      clinicId,
      leadsReceived,
      leadsConverted: appointments,
      conversionRate,
      avgResponseTimeHours: 24, // placeholder
      topSignal: 'General match',
    };
  } catch {
    return {
      clinicId,
      leadsReceived: 0,
      leadsConverted: 0,
      conversionRate: 0,
      avgResponseTimeHours: 0,
      topSignal: 'Unknown',
    };
  }
}