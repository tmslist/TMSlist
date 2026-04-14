import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reviews, clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { escapeHtml } from '../../../utils/sanitize';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sendReviewNotification } from '../../../utils/email';
import { z } from 'zod';

export const prerender = false;

const publicReviewSchema = z.object({
  clinicId: z.string().uuid(),
  clinicName: z.string().max(200).optional(),
  doctorName: z.string().max(100).optional().or(z.literal('')),
  treatmentType: z.string().max(100).optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(50).max(2000),
  patientName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
});

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = publicReviewSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => i.message).join(', ');
      return new Response(JSON.stringify({ error: 'Validation failed: ' + issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;

    // Verify clinic exists and get clinic email
    const [clinic] = await db.select({ id: clinics.id, name: clinics.name, email: clinics.email })
      .from(clinics).where(eq(clinics.id, data.clinicId)).limit(1);

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate (same email + same clinic) to prevent spam
    if (data.email) {
      const existing = await db.select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.userEmail, data.email.toLowerCase()))
        .limit(1);
      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: 'You have already submitted a review for this clinic.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Insert review — unapproved by default, needs moderation
    const [review] = await db.insert(reviews).values({
      clinicId: data.clinicId,
      userName: escapeHtml(data.patientName),
      userEmail: data.email ? data.email.toLowerCase() : null,
      rating: data.rating,
      title: data.doctorName ? escapeHtml(`Treatment by ${data.doctorName}`) : null,
      body: escapeHtml(data.reviewText),
      verified: false,
      approved: false,
      source: 'tmslist',
    }).returning();

    // Send notification to clinic admin (fire-and-forget)
    if (clinic.email) {
      sendReviewNotification({
        clinicEmail: clinic.email,
        clinicName: clinic.name,
        reviewerName: data.patientName,
        rating: data.rating,
      }).catch((err) => console.error("[bg-task] Review notification failed:", err?.message));
    }

    return new Response(JSON.stringify({ success: true, id: review?.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Review submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
