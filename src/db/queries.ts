/**
 * Query layer — hybrid approach:
 *   READ operations → JSON files (zero DB cost, fast builds)
 *   WRITE operations → Postgres (reviews, leads, admin)
 */

import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './index';
import { clinics, reviews, leads, questions, treatments, countries, regions, doctors } from './schema';
import type { NewReview, NewLead } from './schema';

// ── READ QUERIES → Delegated to JSON Data Provider ──────────────────
// All clinic/doctor/filter/geo reads come from JSON files at build time.
// This eliminates DB data transfer costs entirely for SSG builds.

export {
  getAllClinics,
  getAllVerifiedClinics,
  getClinicBySlug,
  getClinicsByState,
  getClinicsByCity,
  getClinicById,
  getUniqueStates,
  getCitiesByState,
  searchClinics,
  searchClinicsNearby,
  getClinicCount,
  getTotalClinicCount,
  getDoctorsByClinic,
  getDoctorBySlug,
  getAllDoctors,
  getDoctorCount,
  getClinicsByCountry,
  getClinicsByCountryAndRegion,
  getClinicsByCountryRegionCity,
  getUniqueCountries,
  getRegionsForCountry,
  getCitiesForRegion,
  getClinicsByMachine,
  getClinicsBySpecialty,
  getClinicsByInsurance,
  getAllClinicsAdmin,
} from '../utils/jsonData';

// ── WRITE QUERIES → Postgres ──────────────────

// Reviews
export async function getReviewsByClinic(clinicId: string, opts?: { approved?: boolean; limit?: number }) {
  const conditions = [eq(reviews.clinicId, clinicId)];
  if (opts?.approved !== undefined) {
    conditions.push(eq(reviews.approved, opts.approved));
  }

  return db.select().from(reviews)
    .where(and(...conditions))
    .orderBy(desc(reviews.createdAt))
    .limit(opts?.limit ?? 50);
}

export async function createReview(data: NewReview) {
  const result = await db.insert(reviews).values(data).returning();
  return result[0];
}

export async function updateClinicRating(clinicId: string) {
  const result = await db.select({
    avg: sql<number>`avg(${reviews.rating})`,
    count: sql<number>`count(*)`,
  })
    .from(reviews)
    .where(and(eq(reviews.clinicId, clinicId), eq(reviews.approved, true)));

  const avg = result[0]?.avg ?? 0;
  const count = Number(result[0]?.count ?? 0);

  await db.update(clinics)
    .set({ ratingAvg: avg.toFixed(2), reviewCount: count, updatedAt: new Date() })
    .where(eq(clinics.id, clinicId));
}

// Leads
export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeads(opts?: { type?: string; limit?: number; offset?: number }) {
  const conditions = [];
  if (opts?.type) {
    conditions.push(eq(leads.type, opts.type as any));
  }

  const query = db.select().from(leads);
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;

  return filtered
    .orderBy(desc(leads.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
}

export async function getLeadStats() {
  const result = await db.select({
    type: leads.type,
    count: sql<number>`count(*)`,
  })
    .from(leads)
    .groupBy(leads.type);

  const stats: Record<string, number> = {};
  for (const row of result) {
    stats[row.type] = Number(row.count);
  }
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}

// Questions (also from DB for now — small table)
export async function getQuestionBySlug(slug: string) {
  const results = await db.select().from(questions).where(eq(questions.slug, slug)).limit(1);
  return results[0] ?? null;
}

export async function getQuestionsByCategory(category: string) {
  return db.select().from(questions)
    .where(eq(questions.category, category))
    .orderBy(asc(questions.sortOrder));
}

export async function getQuestionCategories() {
  const result = await db.selectDistinct({ category: questions.category })
    .from(questions)
    .orderBy(asc(questions.category));
  return result.map(r => r.category);
}

export async function getAllQuestions(opts?: { limit?: number; offset?: number }) {
  return db.select().from(questions)
    .orderBy(asc(questions.sortOrder))
    .limit(opts?.limit ?? 500)
    .offset(opts?.offset ?? 0);
}

// Treatments
export async function getAllTreatments() {
  return db.select().from(treatments);
}

export async function getTreatmentBySlug(slug: string) {
  const results = await db.select().from(treatments).where(eq(treatments.slug, slug)).limit(1);
  return results[0] ?? null;
}

// Country/Region from DB
export async function getEnabledCountries() {
  return db.select().from(countries)
    .where(eq(countries.enabled, true))
    .orderBy(asc(countries.sortOrder));
}

export async function getRegionsByCountry(countryCode: string) {
  return db.select().from(regions)
    .where(eq(regions.countryCode, countryCode.toUpperCase()))
    .orderBy(asc(regions.name));
}

// Admin
export async function getAllReviewsAdmin(opts?: { limit?: number; offset?: number }) {
  return db.select({
    review: reviews,
    clinicName: clinics.name,
    clinicSlug: clinics.slug,
  })
    .from(reviews)
    .innerJoin(clinics, eq(reviews.clinicId, clinics.id))
    .orderBy(desc(reviews.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
}

export async function getDashboardStats() {
  // Clinic/doctor counts from JSON, review/lead counts from DB
  const { getDoctorCount: getDocCount, getTotalClinicCount: getClinicTotal } = await import('../utils/jsonData');

  const [clinicCount, doctorCount, reviewResult, leadResult] = await Promise.all([
    getClinicTotal(),
    getDocCount(),
    db.select({ count: sql<number>`count(*)` }).from(reviews),
    db.select({ count: sql<number>`count(*)` }).from(leads),
  ]);

  return {
    clinics: clinicCount,
    doctors: doctorCount,
    reviews: Number(reviewResult[0]?.count ?? 0),
    leads: Number(leadResult[0]?.count ?? 0),
  };
}
