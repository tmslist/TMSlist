/**
 * Clinic Benchmark Utility
 * Compare a clinic's performance against similar clinics by size and location.
 */

import { db } from '../db';
import { clinics } from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getCached, setCache } from './redis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BenchmarkData {
  clinicId: string;
  percentile: number;          // "You're in the top X%"
  avgLeadsPerWeek: number;
  yourLeadsPerWeek: number;
  comparisonClinics: {
    name: string;
    healthScore: number;
    leadVolumeWeekly: number;
    location: string;
  }[];
  gapToNextTier: number;       // health score points needed to rank up
}

// ── Get Benchmark Data ────────────────────────────────────────────────────────

export async function getBenchmarkData(clinicId: string): Promise<BenchmarkData> {
  const cacheKey = `benchmark:${clinicId}`;
  const cached = await getCached<BenchmarkData>(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    // Get this clinic
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    if (!clinic) {
      return createEmptyBenchmark(clinicId);
    }

    const city = clinic.city;
    const state = clinic.state;

    // Get similar clinics (same city, or same state if not enough in city)
    const similarQuery = `
      SELECT id, name, city, state, rating_avg, review_count,
             subscription_plan,
             (COALESCE((metadata->>'health_score')::int, 0)) as health_score
      FROM clinics
      WHERE verified = true
        AND city = $1
        AND id != $2
      ORDER BY health_score DESC
      LIMIT 10
    `;

    let similarClinics: any[] = [];
    try {
      const result = await db.execute(sql.raw(similarQuery), [city, clinicId]);
      similarClinics = result.rows || [];
    } catch {
      // Fallback: just get any verified clinics
      const result = await db.select({
        id: clinics.id,
        name: clinics.name,
        city: clinics.city,
        state: clinics.state,
        ratingAvg: clinics.ratingAvg,
      })
        .from(clinics)
        .where(eq(clinics.verified, true))
        .limit(10);
      similarClinics = result;
    }

    // Calculate health scores for comparison
    const withScores = similarClinics.map((c: any) => ({
      name: c.name || 'Clinic',
      healthScore: calculateSimpleHealthScore(c),
      leadVolumeWeekly: Math.floor(Math.random() * 20) + 5, // placeholder
      location: `${c.city || ''}, ${c.state || ''}`.trim(),
    }));

    // Sort by health score
    withScores.sort((a: any, b: any) => b.healthScore - a.healthScore);

    // Find percentile
    const thisScore = calculateSimpleHealthScore(clinic as any);
    const allScores = [...withScores.map((c: any) => c.healthScore), thisScore].sort((a, b) => b - a);
    const rank = allScores.indexOf(thisScore);
    const percentile = Math.round(((allScores.length - rank - 1) / allScores.length) * 100);

    // Calculate gap to next tier
    const nextUp = withScores.find((c: any) => c.healthScore > thisScore);
    const gapToNextTier = nextUp ? nextUp.healthScore - thisScore : 0;

    // Avg leads (placeholder — real implementation uses leads table)
    const avgLeadsPerWeek = Math.round(
      withScores.reduce((sum: number, c: any) => sum + c.leadVolumeWeekly, 0) / Math.max(withScores.length, 1)
    );

    const result: BenchmarkData = {
      clinicId,
      percentile: Math.max(percentile, 10),
      avgLeadsPerWeek,
      yourLeadsPerWeek: Math.floor(Math.random() * 30) + 3, // placeholder
      comparisonClinics: withScores.slice(0, 5),
      gapToNextTier,
    };

    await setCache(cacheKey, result, 3600); // 1-hour cache
    return result;
  } catch (err) {
    console.error('Benchmark error:', err);
    return createEmptyBenchmark(clinicId);
  }
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
  return Math.min(score, 100);
}

function createEmptyBenchmark(clinicId: string): BenchmarkData {
  return {
    clinicId,
    percentile: 50,
    avgLeadsPerWeek: 10,
    yourLeadsPerWeek: 5,
    comparisonClinics: [],
    gapToNextTier: 0,
  };
}