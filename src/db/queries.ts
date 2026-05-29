/**
 * Query layer — hybrid approach:
 *   READ operations → JSON files (zero DB cost, fast builds)
 *   WRITE operations → Postgres (reviews, leads, admin)
 */

import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
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

export async function updateLeadStatus(id: string, status: string) {
  const result = await db.update(leads)
    .set({ metadata: sql`COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('status', ${status})` })
    .where(eq(leads.id, id))
    .returning();
  return result[0];
}

export async function deleteLeads(ids: string[]) {
  return db.delete(leads).where(sql`${leads.id} = ANY(${ids})`);
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

// ── Newsletter Subscribers ──────────────────

export async function getNewsletterSubscribers(opts?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const { newsletterSubscribers } = await import('./schema');
  const conditions = [];
  if (opts?.status) {
    conditions.push(eq(newsletterSubscribers.status, opts.status));
  }
  const query = db.select().from(newsletterSubscribers);
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return filtered.orderBy(desc(newsletterSubscribers.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0);
}

export async function getNewsletterStats() {
  const { newsletterSubscribers } = await import('./schema');
  const [total, subscribed, unsubscribed, recentResult] = await Promise.all([
    db.select({ count: count() }).from(newsletterSubscribers),
    db.select({ count: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'subscribed')),
    db.select({ count: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'unsubscribed')),
    db.select({ count: count() }).from(newsletterSubscribers).where(
      sql`${newsletterSubscribers.createdAt} >= NOW() - INTERVAL '30 days'`
    ),
  ]);
  return {
    total: Number(total[0]?.count ?? 0),
    subscribed: Number(subscribed[0]?.count ?? 0),
    unsubscribed: Number(unsubscribed[0]?.count ?? 0),
    recentSignups: Number(recentResult[0]?.count ?? 0),
  };
}

export async function unsubscribeNewsletter(email: string) {
  const { newsletterSubscribers } = await import('./schema');
  return db.update(newsletterSubscribers)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date(), updatedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));
}

export async function resubscribeNewsletter(email: string) {
  const { newsletterSubscribers } = await import('./schema');
  return db.update(newsletterSubscribers)
    .set({ status: 'subscribed', unsubscribedAt: null, updatedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));
}

export async function addNewsletterSubscriber(data: { email: string; name?: string; source?: string; ipAddress?: string; userAgent?: string }) {
  const { newsletterSubscribers } = await import('./schema');
  const result = await db.insert(newsletterSubscribers).values({
    ...data,
    status: 'subscribed',
    confirmedAt: new Date(),
  }).onConflictDoUpdate({
    target: newsletterSubscribers.email,
    set: { status: 'subscribed', unsubscribedAt: null, updatedAt: new Date() },
  }).returning();
  return result[0];
}

// ── Email Stats ──────────────────

export async function getEmailStats() {
  const { emailLogs } = await import('./schema');
  const [total, delivered, opened, clicked, bounced, recentResult] = await Promise.all([
    db.select({ count: count() }).from(emailLogs),
    db.select({ count: count() }).from(emailLogs).where(
      sql`${emailLogs.status} IN ('delivered', 'opened', 'clicked')`
    ),
    db.select({ count: count() }).from(emailLogs).where(
      sql`${emailLogs.status} IN ('opened', 'clicked')`
    ),
    db.select({ count: count() }).from(emailLogs).where(eq(emailLogs.status, 'clicked')),
    db.select({ count: count() }).from(emailLogs).where(eq(emailLogs.status, 'bounced')),
    db.select({ count: count() }).from(emailLogs).where(
      sql`${emailLogs.sentAt} >= NOW() - INTERVAL '30 days'`
    ),
  ]);
  return {
    total: Number(total[0]?.count ?? 0),
    delivered: Number(delivered[0]?.count ?? 0),
    opened: Number(opened[0]?.count ?? 0),
    clicked: Number(clicked[0]?.count ?? 0),
    bounced: Number(bounced[0]?.count ?? 0),
    recentSends: Number(recentResult[0]?.count ?? 0),
  };
}

export async function getEmailLogsByCampaign(campaignId: string) {
  const { emailLogs } = await import('./schema');
  return db.select().from(emailLogs)
    .where(eq(emailLogs.campaignId, campaignId as any))
    .orderBy(desc(emailLogs.sentAt));
}

export async function logEmailSent(data: {
  campaignId?: string;
  campaignName?: string;
  recipientEmail: string;
  subject: string;
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  const { emailLogs } = await import('./schema');
  const result = await db.insert(emailLogs).values({
    ...data,
    sentAt: new Date(),
    status: data.status ?? 'sent',
  }).returning();
  return result[0];
}

export async function updateEmailStatus(id: string, status: string) {
  const { emailLogs } = await import('./schema');
  const updates: Record<string, Date> = { status } as Record<string, Date>;
  if (status === 'delivered') updates.deliveredAt = new Date();
  if (status === 'opened') updates.openedAt = new Date();
  if (status === 'clicked') updates.clickedAt = new Date();
  if (status === 'bounced') updates.bouncedAt = new Date();
  if (status === 'complained') updates.complainedAt = new Date();
  return db.update(emailLogs).set(updates as any).where(eq(emailLogs.id, id as any)).returning();
}

// ── Patient Enquiries ──────────────────

export async function getPatientEnquiries(opts?: {
  status?: string;
  doctorId?: string;
  assignedTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { patientEnquiries, doctors, clinics, users } = await import('./schema');
  const conditions = [];
  if (opts?.status) conditions.push(eq(patientEnquiries.status, opts.status));
  if (opts?.doctorId) conditions.push(eq(patientEnquiries.doctorId, opts.doctorId as any));
  if (opts?.assignedTo) conditions.push(eq(patientEnquiries.assignedTo, opts.assignedTo as any));
  if (opts?.search) {
    conditions.push(sql`(
      ${patientEnquiries.name} ILIKE ${'%' + opts.search + '%'} OR
      ${patientEnquiries.email} ILIKE ${'%' + opts.search + '%'} OR
      ${doctors.name} ILIKE ${'%' + opts.search + '%'}
    )`);
  }
  const query = db.select({
    enquiry: patientEnquiries,
    doctor: { id: doctors.id, name: doctors.name },
    clinic: { id: clinics.id, name: clinics.name },
    assignee: { id: users.id, name: users.name, email: users.email },
  })
    .from(patientEnquiries)
    .leftJoin(doctors, eq(patientEnquiries.doctorId, doctors.id))
    .leftJoin(clinics, eq(patientEnquiries.clinicId, clinics.id))
    .leftJoin(users, eq(patientEnquiries.assignedTo, users.id));
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return filtered.orderBy(desc(patientEnquiries.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0);
}

export async function getPatientEnquiryStats() {
  const { patientEnquiries } = await import('./schema');
  const [total, newCount, contacted, converted, assigned] = await Promise.all([
    db.select({ count: count() }).from(patientEnquiries).where(sql`${patientEnquiries.deletedAt} IS NULL`),
    db.select({ count: count() }).from(patientEnquiries).where(eq(patientEnquiries.status, 'new')),
    db.select({ count: count() }).from(patientEnquiries).where(eq(patientEnquiries.status, 'contacted')),
    db.select({ count: count() }).from(patientEnquiries).where(eq(patientEnquiries.status, 'converted')),
    db.select({ count: count() }).from(patientEnquiries).where(sql`${patientEnquiries.assignedTo} IS NOT NULL`),
  ]);
  return {
    total: Number(total[0]?.count ?? 0),
    new: Number(newCount[0]?.count ?? 0),
    contacted: Number(contacted[0]?.count ?? 0),
    converted: Number(converted[0]?.count ?? 0),
    unassigned: Number(total[0]?.count ?? 0) - Number(assigned[0]?.count ?? 0),
  };
}

export async function createPatientEnquiry(data: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  doctorId?: string;
  clinicId?: string;
  doctorName?: string;
  clinicName?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const { patientEnquiries } = await import('./schema');
  const result = await db.insert(patientEnquiries).values(data).returning();
  return result[0];
}

export async function updatePatientEnquiry(id: string, data: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  doctorId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  const { patientEnquiries } = await import('./schema');
  const result = await db.update(patientEnquiries)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(patientEnquiries.id, id as any))
    .returning();
  return result[0];
}

// ── Notifications ──────────────────

export async function getAdminNotifications(limit = 20) {
  const { notifications, users } = await import('./schema');
  return db.select({
    notification: notifications,
    user: { id: users.id, name: users.name, email: users.email },
  })
    .from(notifications)
    .leftJoin(users, eq(notifications.userId, users.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount() {
  const { notifications } = await import('./schema');
  const result = await db.select({ count: count() })
    .from(notifications)
    .where(eq(notifications.read, false));
  return Number(result[0]?.count ?? 0);
}

export async function markNotificationRead(id: string) {
  const { notifications } = await import('./schema');
  return db.update(notifications).set({ read: true }).where(eq(notifications.id, id as any)).returning();
}

export async function markAllNotificationsRead() {
  const { notifications } = await import('./schema');
  return db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
}

export async function createNotification(data: {
  userId?: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  const { notifications } = await import('./schema');
  const result = await db.insert(notifications).values(data).returning();
  return result[0];
}

// ── Admin Action Log ──────────────────

export async function logAdminAction(data: {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminActionLog } = await import('./schema');
  const result = await db.insert(adminActionLog).values(data).returning();
  return result[0];
}

export async function getAdminActionLog(opts?: {
  userId?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}) {
  const { adminActionLog, users } = await import('./schema');
  const conditions = [];
  if (opts?.userId) conditions.push(eq(adminActionLog.userId, opts.userId as any));
  if (opts?.entityType) conditions.push(eq(adminActionLog.entityType, opts.entityType));
  const query = db.select({
    log: adminActionLog,
    user: { id: users.id, name: users.name, email: users.email },
  })
    .from(adminActionLog)
    .leftJoin(users, eq(adminActionLog.userId, users.id));
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return filtered.orderBy(desc(adminActionLog.createdAt)).limit(opts?.limit ?? 100).offset(opts?.offset ?? 0);
}
