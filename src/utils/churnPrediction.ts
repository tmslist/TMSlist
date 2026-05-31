/**
 * Churn Prediction Engine
 * Identifies at-risk clinics before they cancel.
 * Uses rule-based scoring — no ML needed for v1.
 */

import { db } from '../db';
import { clinics, leads, users } from '../db/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { getCached, setCache } from './redis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClinicEngagement {
  clinicId: string;
  lastLoginAt: Date | null;
  loginFrequency30d: number;
  leadResponseTimeHours: number;
  profileUpdatedAt: Date | null;
  leadVolumeTrend: number;    // % change in leads vs 30 days ago
  revenueTrend: number;       // % change in subscription revenue vs 30 days ago
  healthScore: number;
  subscriptionTier: string;
  hasActiveLeads: boolean;
}

export interface ChurnRiskSignal {
  signal: string;
  weight: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface ChurnRiskScore {
  clinicId: string;
  riskScore: number;           // 0-100 (higher = more likely to churn)
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  signals: ChurnRiskSignal[];
  recommendedActions: {
    type: 'email' | 'discount' | 'call' | 'feature_highlight';
    message: string;
    priority: 'immediate' | 'this_week' | 'this_month';
  }[];
}

// ── Signal Weights ───────────────────────────────────────────────────────────

const SIGNAL_WEIGHTS = {
  noLogin14Days: 30,
  decliningLoginFrequency: 15,
  leadResponseSlow: 20,
  profileNotUpdated60Days: 15,
  leadVolumeDeclining: 10,
  revenueDeclining: 15,
  healthScoreLow: 10,
  atRiskLead: 5,
};

// ── Calculate Risk ───────────────────────────────────────────────────────────

export async function calculateChurnRisk(clinicId: string): Promise<ChurnRiskScore> {
  const cacheKey = `churn_risk:${clinicId}`;
  const cached = await getCached<ChurnRiskScore>(cacheKey).catch(() => null);
  if (cached) return cached;

  // Get clinic data
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
  if (!clinic) {
    return createEmptyRisk(clinicId);
  }

  const signals: ChurnRiskSignal[] = [];
  let riskScore = 0;

  // 1. No login in 14+ days → +30
  // (Placeholder - actual implementation needs login tracking)
  // For now, use health score staleness as proxy
  const healthScoreAge = getHealthScoreAge(clinic);
  if (healthScoreAge > 60) {
    riskScore += SIGNAL_WEIGHTS.noLogin14Days;
    signals.push({
      signal: 'No profile update in 60+ days',
      weight: SIGNAL_WEIGHTS.noLogin14Days,
      severity: 'critical',
    });
  } else if (healthScoreAge > 30) {
    riskScore += SIGNAL_WEIGHTS.noLogin14Days * 0.5;
    signals.push({
      signal: 'Profile not updated in 30+ days',
      weight: SIGNAL_WEIGHTS.noLogin14Days * 0.5,
      severity: 'warning',
    });
  }

  // 2. Health score < 50 → +10
  const healthScore = calculateSimpleHealthScore(clinic);
  if (healthScore < 50) {
    riskScore += SIGNAL_WEIGHTS.healthScoreLow;
    signals.push({
      signal: `Low health score (${healthScore}/100)`,
      weight: SIGNAL_WEIGHTS.healthScoreLow,
      severity: 'warning',
    });
  }

  // 3. Lead volume declining (placeholder - would need historical data)
  const leadVolumeDecline = 0; // Placeholder
  if (leadVolumeDecline > 20) {
    riskScore += SIGNAL_WEIGHTS.leadVolumeDeclining;
    signals.push({
      signal: 'Lead volume declining 20%+',
      weight: SIGNAL_WEIGHTS.leadVolumeDeclining,
      severity: 'warning',
    });
  }

  // 4. Not verified → +5 (risk factor, not direct churn driver)
  if (!clinic.verified) {
    riskScore += SIGNAL_WEIGHTS.atRiskLead;
    signals.push({
      signal: 'Clinic not verified',
      weight: SIGNAL_WEIGHTS.atRiskLead,
      severity: 'info',
    });
  }

  // 5. Low subscription tier → mild risk factor
  const tierRisk: Record<string, number> = { verified: 0, pro: 0, premium: -5, enterprise: -10 };
  riskScore += tierRisk[clinic.subscriptionPlan as string] || 0;

  // Cap at 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine risk level
  let riskLevel: ChurnRiskScore['riskLevel'];
  if (riskScore >= 50) riskLevel = 'critical';
  else if (riskScore >= 30) riskLevel = 'high';
  else if (riskScore >= 15) riskLevel = 'medium';
  else riskLevel = 'low';

  // Generate recommended actions
  const recommendedActions = generateActions(riskLevel, signals, clinicId);

  const result: ChurnRiskScore = {
    clinicId,
    riskScore,
    riskLevel,
    signals,
    recommendedActions,
  };

  await setCache(cacheKey, result, 1800); // 30-minute cache
  return result;
}

export async function getAllAtRiskClinics(limit: number = 20): Promise<{ clinicId: string; riskScore: number; riskLevel: string }[]> {
  const cacheKey = 'at_risk_clinics';
  const cached = await getCached<{ clinicId: string; riskScore: number; riskLevel: string }[]>(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    // Get all verified clinics and score them
    const allClinics = await db.select({
      id: clinics.id,
      name: clinics.name,
      verified: clinics.verified,
      ratingAvg: clinics.ratingAvg,
      reviewCount: clinics.reviewCount,
      subscriptionPlan: clinics.subscriptionPlan,
      updatedAt: clinics.updatedAt,
    }).from(clinics).where(eq(clinics.verified, true)).limit(100);

    const scored = allClinics.map((clinic) => {
      const score = calculateSimpleHealthScore(clinic);
      return {
        clinicId: clinic.id,
        riskScore: Math.max(0, 100 - score),
        riskLevel: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
      };
    });

    // Sort by risk (highest first) and filter to at-risk
    const atRisk = scored
      .filter((c) => c.riskScore > 20)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);

    await setCache(cacheKey, atRisk, 1800);
    return atRisk;
  } catch {
    return [];
  }
}

export async function logRetentionAction(
  clinicId: string,
  actionType: string,
  result: 'success' | 'failed'
): Promise<void> {
  const cacheKey = `retention_action:${clinicId}`;
  const actions = await getCached<{ type: string; result: string; timestamp: string }[]>(cacheKey).catch(() => null) || [];

  actions.push({
    type: actionType,
    result,
    timestamp: new Date().toISOString(),
  });

  // Keep last 10 actions
  if (actions.length > 10) actions.shift();
  await setCache(cacheKey, actions, 86400 * 30);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calculateSimpleHealthScore(clinic: any): number {
  let score = 0;
  if (clinic.verified) score += 20;
  if ((clinic.ratingAvg || 0) >= 4.5) score += 25;
  else if ((clinic.ratingAvg || 0) >= 4.0) score += 20;
  else if ((clinic.ratingAvg || 0) >= 3.5) score += 15;
  if ((clinic.reviewCount || 0) >= 10) score += 15;
  else if ((clinic.reviewCount || 0) >= 5) score += 10;
  if (clinic.subscriptionPlan === 'premium' || clinic.subscriptionPlan === 'enterprise') score += 20;
  else if (clinic.subscriptionPlan === 'pro') score += 10;
  return Math.min(score, 100);
}

function getHealthScoreAge(clinic: any): number {
  if (!clinic.updatedAt) return 999;
  const days = (Date.now() - new Date(clinic.updatedAt).getTime()) / (86400 * 1000);
  return Math.round(days);
}

function generateActions(
  riskLevel: ChurnRiskScore['riskLevel'],
  signals: ChurnRiskSignal[],
  clinicId: string
): ChurnRiskScore['recommendedActions'] {
  const actions: ChurnRiskScore['recommendedActions'] = [];

  if (riskLevel === 'critical') {
    actions.push({
      type: 'call',
      message: 'Schedule an onboarding call to understand concerns',
      priority: 'immediate',
    });
    actions.push({
      type: 'discount',
      message: 'Offer a 20% discount on next month to reduce immediate churn risk',
      priority: 'immediate',
    });
  } else if (riskLevel === 'high') {
    actions.push({
      type: 'email',
      message: 'Send re-engagement email highlighting recent platform improvements',
      priority: 'this_week',
    });
  }

  // Add signal-specific actions
  for (const signal of signals) {
    if (signal.signal.includes('health score')) {
      actions.push({
        type: 'feature_highlight',
        message: 'Share health score improvement tips and potential lead impact',
        priority: 'this_week',
      });
    }
    if (signal.signal.includes('update')) {
      actions.push({
        type: 'email',
        message: 'Send profile update checklist to make it easy',
        priority: 'this_week',
      });
    }
  }

  actions.push({
    type: 'feature_highlight',
    message: 'Highlight new features or improvements since last login',
    priority: 'this_month',
  });

  return actions.slice(0, 4); // Max 4 actions
}

function createEmptyRisk(clinicId: string): ChurnRiskScore {
  return {
    clinicId,
    riskScore: 0,
    riskLevel: 'low',
    signals: [],
    recommendedActions: [],
  };
}