/**
 * Seed script: Migrates clinics.json + user-submitted-clinics.json into Neon Postgres
 * Usage: DATABASE_URL=... npx tsx scripts/seed.ts
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clinics, doctors, questions, treatments } from '../src/db/schema';
import clinicsData from '../src/data/clinics.json';
import userSubmittedClinics from '../src/data/user-submitted-clinics.json';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Normalize provider type to match enum
function normalizeProviderType(type?: string): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    'Psychiatrist (MD/DO)': 'psychiatrist',
    'Dedicated TMS Center': 'tms_center',
    'Hospital / Medical Center': 'hospital',
    'Neurologist': 'neurologist',
    'Mental Health Clinic': 'mental_health_clinic',
    'Primary Care / Family Practice': 'primary_care',
    'Psychiatric Nurse Practitioner': 'nurse_practitioner',
  };
  return map[type] || null;
}

// Extract numeric rating from various formats
function extractRating(rating: unknown): string {
  if (typeof rating === 'number') return rating.toFixed(2);
  if (typeof rating === 'object' && rating && 'aggregate' in rating) {
    return ((rating as { aggregate: number }).aggregate || 0).toFixed(2);
  }
  return '0.00';
}

function extractReviewCount(clinic: Record<string, unknown>): number {
  if (typeof clinic.review_count === 'number') return clinic.review_count;
  if (typeof clinic.rating === 'object' && clinic.rating && 'count' in (clinic.rating as object)) {
    return (clinic.rating as { count: number }).count || 0;
  }
  return 0;
}

// Generate a slug if missing
function generateSlug(name: string, city: string): string {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedClinics() {
  const allRaw = [
    ...(clinicsData as Record<string, unknown>[]),
    ...(userSubmittedClinics as Record<string, unknown>[]),
  ];

  console.log(`Processing ${allRaw.length} clinics...`);

  // Deduplicate by slug
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  for (const c of allRaw) {
    const slug = (c.slug as string) || generateSlug(c.name as string, c.city as string);
    if (!seen.has(slug)) {
      seen.add(slug);
      unique.push({ ...c, slug });
    }
  }

  console.log(`${unique.length} unique clinics after dedup (removed ${allRaw.length - unique.length} dupes)`);

  // Batch insert clinics
  const BATCH_SIZE = 50;
  let clinicCount = 0;
  let doctorCount = 0;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);

    const clinicRows = batch.map((c: Record<string, unknown>) => {
      const geo = c.geo as { lat?: number; lng?: number } | undefined;
      const addressObj = c.address_obj as Record<string, string> | undefined;
      const contact = c.contact as Record<string, string> | undefined;
      const media = c.media as Record<string, unknown> | undefined;
      const costInfo = c.cost_info as Record<string, unknown> | undefined;

      return {
        slug: c.slug as string,
        name: c.name as string,
        providerType: normalizeProviderType(c.provider_type as string) as any,
        address: (c.address as string) || addressObj?.street || null,
        city: (c.city as string) || addressObj?.city || 'Unknown',
        state: (c.state as string) || addressObj?.state || 'XX',
        zip: (c.zip as string) || addressObj?.zip || null,
        lat: geo?.lat?.toString() || null,
        lng: geo?.lng?.toString() || null,
        phone: (c.phone as string) || contact?.phone || null,
        website: (c.website as string) || contact?.website_url || null,
        email: (c.email as string) || null,
        machines: (c.machines as string[]) || [],
        specialties: (c.specialties as string[]) || (c.treatments as string[]) || [],
        insurances: (c.insurances as string[]) || (c.insurance_accepted as string[]) || [],
        openingHours: (c.opening_hours as string[]) || [],
        accessibility: (c.accessibility as Record<string, unknown>) || null,
        availability: (c.availability as Record<string, unknown>) || null,
        pricing: (c.pricing as Record<string, unknown>) || (costInfo ? {
          accepts_insurance: costInfo.accepts_insurance,
          session_price_min: costInfo.cash_price_per_session ? parseInt(costInfo.cash_price_per_session as string) : undefined,
          payment_plans: costInfo.financing_available,
        } : null),
        media: media || (c.hero_image_url || c.logo_url ? {
          hero_image_url: c.hero_image_url as string,
          logo_url: c.logo_url as string,
          gallery_urls: c.gallery_urls as string[],
        } : null),
        googleProfile: (c.google_business_profile as Record<string, unknown>) || null,
        faqs: (c.faqs as { question: string; answer: string }[]) || null,
        createdBy: (c.created_by as Record<string, unknown>) || null,
        description: (c.description as string) || null,
        descriptionLong: (c.description_long as string) || null,
        verified: Boolean(c.verified),
        isFeatured: Boolean(c.is_featured),
        ratingAvg: extractRating(c.rating),
        reviewCount: extractReviewCount(c),
      };
    });

    try {
      const inserted = await db.insert(clinics).values(clinicRows).returning({ id: clinics.id, slug: clinics.slug });
      clinicCount += inserted.length;

      // Insert doctors for this batch
      const doctorRows: {
        clinicId: string;
        slug: string | null;
        name: string;
        firstName: string | null;
        lastName: string | null;
        credential: string | null;
        title: string | null;
        school: string | null;
        yearsExperience: number | null;
        specialties: string[] | null;
        bio: string | null;
        imageUrl: string | null;
      }[] = [];

      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        const clinicId = inserted[j]?.id;
        if (!clinicId) continue;

        const docList = (c.doctors_data as Record<string, unknown>[]) || (c.doctors as Record<string, unknown>[]) || [];
        for (const doc of docList) {
          const docName = (doc.name as string) || `${doc.first_name || ''} ${doc.last_name || ''}`.trim();
          if (!docName) continue;

          doctorRows.push({
            clinicId,
            slug: (doc.slug as string) || null,
            name: docName,
            firstName: (doc.first_name as string) || null,
            lastName: (doc.last_name as string) || null,
            credential: (doc.credential as string) || null,
            title: (doc.title as string) || null,
            school: (doc.school as string) || null,
            yearsExperience: (doc.years_experience as number) || null,
            specialties: (doc.specialties as string[]) || null,
            bio: (doc.bio as string) || (doc.bio_focus as string) || null,
            imageUrl: (doc.image_url as string) || (doc.image as string) || null,
          });
        }
      }

      if (doctorRows.length > 0) {
        await db.insert(doctors).values(doctorRows);
        doctorCount += doctorRows.length;
      }
    } catch (err) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, err);
    }

    process.stdout.write(`\r  Inserted ${clinicCount} clinics, ${doctorCount} doctors...`);
  }

  console.log(`\n✓ Seeded ${clinicCount} clinics and ${doctorCount} doctors`);
}

async function seedQuestions() {
  try {
    const qData = JSON.parse(
      readFileSync(resolve(__dirname, '../src/data/questions-comprehensive.json'), 'utf-8')
    );

    if (!Array.isArray(qData)) {
      console.log('Questions data is not an array, skipping');
      return;
    }

    const rows = qData.map((q: Record<string, unknown>, i: number) => ({
      slug: (q.slug as string) || `question-${i}`,
      category: (q.category as string) || 'general',
      question: (q.question as string) || '',
      answer: (q.answer as string) || '',
      relatedSlugs: (q.related_slugs as string[]) || [],
      sortOrder: i,
    }));

    const BATCH = 50;
    let count = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      await db.insert(questions).values(batch);
      count += batch.length;
    }
    console.log(`✓ Seeded ${count} questions`);
  } catch (err) {
    console.log('Skipping questions seed:', (err as Error).message);
  }
}

async function seedTreatments() {
  try {
    const { alternativeTreatments } = await import('../src/data/alternative-treatments');
    const rows = alternativeTreatments.map((t: Record<string, unknown>) => ({
      slug: t.slug as string,
      name: t.name as string,
      fullName: (t.fullName as string) || null,
      description: (t.description as string) || null,
      fdaApproved: Boolean(t.fdaApproved),
      conditions: (t.conditions as string[]) || [],
      howItWorks: (t.howItWorks as string) || null,
      sessionDuration: (t.sessionDuration as string) || null,
      treatmentCourse: (t.treatmentCourse as string) || null,
      insuranceCoverage: (t.insuranceCoverage as string) || null,
    }));

    await db.insert(treatments).values(rows);
    console.log(`✓ Seeded ${rows.length} treatments`);
  } catch (err) {
    console.log('Skipping treatments seed:', (err as Error).message);
  }
}

async function main() {
  console.log('🚀 Starting database seed...\n');

  await seedClinics();
  await seedQuestions();
  await seedTreatments();

  console.log('\n✅ Seed complete!');
}

main().catch(console.error);
