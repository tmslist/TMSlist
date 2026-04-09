import { eq, and, ilike, sql, desc, asc, arrayContains } from 'drizzle-orm';
import { db } from './index';
import { clinics, doctors, reviews, leads, questions } from './schema';
import type { NewReview, NewLead } from './schema';

// ── CLINIC QUERIES ──────────────────────────────

export async function getAllClinics(opts?: { verified?: boolean; limit?: number; offset?: number }) {
  const conditions = [];
  if (opts?.verified !== undefined) {
    conditions.push(eq(clinics.verified, opts.verified));
  }

  const query = db.select().from(clinics);
  const filtered = conditions.length > 0
    ? query.where(and(...conditions))
    : query;

  return filtered
    .orderBy(desc(clinics.ratingAvg))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
}

export async function getClinicBySlug(slug: string) {
  const results = await db.select().from(clinics).where(eq(clinics.slug, slug)).limit(1);
  return results[0] ?? null;
}

export async function getClinicsByState(stateCode: string, opts?: { limit?: number; offset?: number }) {
  return db.select().from(clinics)
    .where(and(eq(clinics.state, stateCode.toUpperCase()), eq(clinics.verified, true)))
    .orderBy(desc(clinics.ratingAvg))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
}

export async function getClinicsByCity(stateCode: string, cityName: string) {
  return db.select().from(clinics)
    .where(and(
      eq(clinics.state, stateCode.toUpperCase()),
      ilike(clinics.city, cityName),
      eq(clinics.verified, true),
    ))
    .orderBy(desc(clinics.ratingAvg));
}

export async function getClinicById(id: string) {
  const results = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  return results[0] ?? null;
}

export async function getUniqueStates() {
  const result = await db.selectDistinct({ state: clinics.state })
    .from(clinics)
    .where(eq(clinics.verified, true))
    .orderBy(asc(clinics.state));
  return result.map(r => r.state);
}

export async function getCitiesByState(stateCode: string) {
  const result = await db.selectDistinct({ city: clinics.city })
    .from(clinics)
    .where(and(eq(clinics.state, stateCode.toUpperCase()), eq(clinics.verified, true)))
    .orderBy(asc(clinics.city));
  return result.map(r => r.city);
}

export async function searchClinics(opts: {
  query?: string;
  state?: string;
  city?: string;
  country?: string;
  machines?: string[];
  insurances?: string[];
  specialties?: string[];
  verified?: boolean;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (opts.verified !== undefined) {
    conditions.push(eq(clinics.verified, opts.verified));
  }
  if (opts.country) {
    conditions.push(eq(clinics.country, opts.country.toUpperCase()));
  }
  if (opts.state) {
    conditions.push(eq(clinics.state, opts.state.toUpperCase()));
  }
  if (opts.city) {
    conditions.push(ilike(clinics.city, opts.city));
  }
  if (opts.query) {
    conditions.push(sql`(
      ${clinics.name} ILIKE ${'%' + opts.query + '%'} OR
      ${clinics.city} ILIKE ${'%' + opts.query + '%'} OR
      ${clinics.description} ILIKE ${'%' + opts.query + '%'}
    )`);
  }
  if (opts.machines?.length) {
    conditions.push(arrayContains(clinics.machines, opts.machines));
  }
  if (opts.insurances?.length) {
    conditions.push(arrayContains(clinics.insurances, opts.insurances));
  }
  if (opts.specialties?.length) {
    conditions.push(arrayContains(clinics.specialties, opts.specialties));
  }

  const query = db.select().from(clinics);
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;

  return filtered
    .orderBy(desc(clinics.isFeatured), desc(clinics.ratingAvg))
    .limit(opts.limit ?? 20)
    .offset(opts.offset ?? 0);
}

/**
 * Geo-proximity search: find clinics within a radius (miles) of a lat/lng point.
 * Uses Haversine formula since we don't have PostGIS extension yet.
 */
export async function searchClinicsNearby(opts: {
  lat: number;
  lng: number;
  radiusMiles?: number;
  limit?: number;
  offset?: number;
  verified?: boolean;
}) {
  const radiusMiles = opts.radiusMiles ?? 25;
  const conditions = [];

  if (opts.verified !== undefined) {
    conditions.push(eq(clinics.verified, opts.verified));
  }

  // Filter out clinics without coordinates
  conditions.push(sql`${clinics.lat} IS NOT NULL AND ${clinics.lng} IS NOT NULL`);
  conditions.push(sql`CAST(${clinics.lat} AS FLOAT) != 0`);

  // Haversine distance formula in SQL (returns miles)
  const distanceExpr = sql<number>`(
    3959 * acos(
      cos(radians(${opts.lat})) * cos(radians(CAST(${clinics.lat} AS FLOAT)))
      * cos(radians(CAST(${clinics.lng} AS FLOAT)) - radians(${opts.lng}))
      + sin(radians(${opts.lat})) * sin(radians(CAST(${clinics.lat} AS FLOAT)))
    )
  )`;

  conditions.push(sql`${distanceExpr} <= ${radiusMiles}`);

  const results = await db.select({
    clinic: clinics,
    distance: distanceExpr,
  })
    .from(clinics)
    .where(and(...conditions))
    .orderBy(sql`${distanceExpr}`)
    .limit(opts.limit ?? 20)
    .offset(opts.offset ?? 0);

  return results.map(r => ({
    ...r.clinic,
    distance: Math.round(r.distance * 10) / 10,
  }));
}

export async function getClinicCount(stateCode?: string) {
  const conditions = [eq(clinics.verified, true)];
  if (stateCode) conditions.push(eq(clinics.state, stateCode.toUpperCase()));

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(clinics)
    .where(and(...conditions));
  return Number(result[0]?.count ?? 0);
}

// ── DOCTOR QUERIES ──────────────────────────────

export async function getDoctorsByClinic(clinicId: string) {
  return db.select().from(doctors).where(eq(doctors.clinicId, clinicId));
}

export async function getDoctorBySlug(slug: string) {
  const results = await db.select().from(doctors).where(eq(doctors.slug, slug)).limit(1);
  return results[0] ?? null;
}

export async function getAllDoctors(opts?: { limit?: number; offset?: number }) {
  return db.select({
    doctor: doctors,
    clinicName: clinics.name,
    clinicSlug: clinics.slug,
    clinicCity: clinics.city,
    clinicState: clinics.state,
  })
    .from(doctors)
    .innerJoin(clinics, eq(doctors.clinicId, clinics.id))
    .where(eq(clinics.verified, true))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
}

export async function getDoctorCount() {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(doctors)
    .innerJoin(clinics, eq(doctors.clinicId, clinics.id))
    .where(eq(clinics.verified, true));
  return Number(result[0]?.count ?? 0);
}

// ── REVIEW QUERIES ──────────────────────────────

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

// Update denormalized rating on clinic after review insert
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

// ── LEAD QUERIES ──────────────────────────────

export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeads(opts?: {
  type?: string;
  limit?: number;
  offset?: number;
}) {
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

// ── QUESTION QUERIES ──────────────────────────────

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
