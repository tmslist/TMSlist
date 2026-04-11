import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { clinics, reviews, leads, users } from '../../../db/schema';
import { eq, desc, avg, count } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Look up user to get clinicId
    const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    const user = userRows[0];

    if (!user || !user.clinicId) {
      return new Response(JSON.stringify({ needsClaim: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clinicId = user.clinicId;

    // Fetch clinic info, reviews, leads, and stats in parallel
    const [clinicRows, recentReviews, recentLeads, reviewStats, leadStats] = await Promise.all([
      db.select({
        id: clinics.id,
        name: clinics.name,
        city: clinics.city,
        state: clinics.state,
        verified: clinics.verified,
        description: clinics.description,
        phone: clinics.phone,
        website: clinics.website,
        email: clinics.email,
        machines: clinics.machines,
        specialties: clinics.specialties,
        insurances: clinics.insurances,
        openingHours: clinics.openingHours,
        media: clinics.media,
        availability: clinics.availability,
        pricing: clinics.pricing,
      }).from(clinics).where(eq(clinics.id, clinicId)).limit(1),

      db.select().from(reviews)
        .where(eq(reviews.clinicId, clinicId))
        .orderBy(desc(reviews.createdAt))
        .limit(5),

      db.select().from(leads)
        .where(eq(leads.clinicId, clinicId))
        .orderBy(desc(leads.createdAt))
        .limit(5),

      db.select({
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
      }).from(reviews).where(eq(reviews.clinicId, clinicId)),

      db.select({
        leadCount: count(leads.id),
      }).from(leads).where(eq(leads.clinicId, clinicId)),
    ]);

    const clinic = clinicRows[0];
    if (!clinic) {
      return new Response(JSON.stringify({ needsClaim: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate missing profile fields
    const missingFields: { key: string; label: string; priority: 'high' | 'medium' }[] = [];
    if (!clinic.media?.logo_url) missingFields.push({ key: 'logo_url', label: 'Brand Logo', priority: 'high' });
    if (!clinic.media?.hero_image_url) missingFields.push({ key: 'hero_image_url', label: 'Clinic Hero Image', priority: 'high' });
    if (!clinic.media?.gallery_urls?.length) missingFields.push({ key: 'gallery_urls', label: 'Clinic Photos', priority: 'high' });
    if (!clinic.description) missingFields.push({ key: 'description', label: 'Clinic Description', priority: 'high' });
    if (!clinic.phone) missingFields.push({ key: 'phone', label: 'Phone Number', priority: 'high' });
    if (!clinic.website) missingFields.push({ key: 'website', label: 'Website', priority: 'medium' });
    if (!clinic.email) missingFields.push({ key: 'email', label: 'Email Address', priority: 'medium' });
    if (!clinic.machines?.length) missingFields.push({ key: 'machines', label: 'TMS Machines', priority: 'medium' });
    if (!clinic.specialties?.length) missingFields.push({ key: 'specialties', label: 'Specialties', priority: 'medium' });
    if (!clinic.insurances?.length) missingFields.push({ key: 'insurances', label: 'Insurance Accepted', priority: 'medium' });
    if (!clinic.openingHours?.length) missingFields.push({ key: 'openingHours', label: 'Opening Hours', priority: 'medium' });

    const totalFields = 11;
    const completedFields = totalFields - missingFields.length;
    const completionPct = Math.round((completedFields / totalFields) * 100);

    return new Response(JSON.stringify({
      clinic: { id: clinic.id, name: clinic.name, city: clinic.city, state: clinic.state, verified: clinic.verified },
      recentReviews,
      recentLeads,
      stats: {
        reviewCount: reviewStats[0]?.reviewCount || 0,
        avgRating: reviewStats[0]?.avgRating ? parseFloat(String(reviewStats[0].avgRating)) : 0,
        leadCount: leadStats[0]?.leadCount || 0,
      },
      profileCompletion: {
        percentage: completionPct,
        missingFields,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal dashboard error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load dashboard' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
