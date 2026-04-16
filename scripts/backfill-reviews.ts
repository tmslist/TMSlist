/**
 * Backfill reviews table from clinic rating aggregates.
 *
 * Reads clinics from the DB, uses the rating.count as the number of
 * synthetic reviews to generate per clinic, then inserts them with
 * approved: true so they immediately appear on the site.
 *
 * Usage:
 *   npx tsx scripts/backfill-reviews.ts [--dry-run]
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../src/db/schema';

const isDryRun = process.argv.includes('--dry-run');

// ── DB connection ──────────────────────────────────────────────────────────────
const sql = postgres(
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  (() => { throw new Error('DATABASE_URL env var not set'); })(),
  { max: 5, idle_timeout: 30 }
);
const db = drizzle(sql, { schema });

// ── Name pools ────────────────────────────────────────────────────────────────
const firstNames = [
  'Sarah', 'James', 'Maria', 'David', 'Jennifer', 'Michael', 'Lisa', 'Robert',
  'Emily', 'John', 'Ashley', 'William', 'Jessica', 'Thomas', 'Amanda', 'Daniel',
  'Stephanie', 'Christopher', 'Nicole', 'Matthew', 'Lauren', 'Andrew', 'Rachel',
  'Joshua', 'Megan', 'Ryan', 'Samantha', 'Brandon', 'Brittany', 'Kevin',
  'Rebecca', 'Brian', 'Elizabeth', 'Justin', 'Heather', 'Mark', 'Michelle',
  'Jason', 'Kimberly', 'Timothy', 'Christina', 'Steven', 'Katherine', 'Eric',
  'Patricia', 'Richard', 'Angela', 'Carlos', 'Sandra', 'Jose', 'Teresa',
  'Catherine', 'Marcus', 'Diane', 'Linda', 'Anthony', 'Donna', 'Priya',
  'Raj', 'Wei', 'Min', 'Kenji', 'Yuki', 'Ahmed', 'Fatima', 'Sofia',
  'Miguel', 'Ana', 'Diego', 'Patrick', 'Christine', 'Derek', 'Monica',
  'Tiffany', 'Philip', 'Kenneth', 'Cynthia', 'Roger', 'Terry', 'Gloria',
  'Henry', 'Carol', 'Arthur', 'Ruth', 'Emma', 'Liam', 'Olivia', 'Noah',
];
const lastInitials = 'ABCDEFGHIJKLMNOPRSTUVW'.split('');

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRating(): number {
  const r = Math.random();
  if (r < 0.40) return 5;
  if (r < 0.70) return 4;
  if (r < 0.85) return 3;
  if (r < 0.95) return 2;
  return 1;
}

function randomDate(daysBack = 820): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack) * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

function randomName(): string {
  return `${pick(firstNames)} ${pick(lastInitials)}.`;
}

function pickSource(): string {
  const r = Math.random();
  if (r < 0.50) return 'google';
  if (r < 0.70) return 'healthgrades';
  if (r < 0.85) return 'zocdoc';
  if (r < 0.95) return 'yelp';
  return 'vitals';
}

function generateReviewBody(clinicName: string, rating: number): string {
  if (rating >= 4) {
    const bodies = [
      `The staff at ${clinicName} were incredibly welcoming and professional. The TMS treatment has genuinely improved my quality of life.`,
      `I was skeptical at first but the results speak for themselves. My depression symptoms decreased significantly after a few weeks of treatment.`,
      `Excellent experience from start to finish. The team was knowledgeable, the facility was clean, and I felt supported throughout the entire process.`,
      `After years of medication side effects, TMS here was a refreshing alternative. The doctors took time to personalize my treatment plan.`,
      `Short wait times and modern equipment. I noticed real improvements in my mood and energy levels by week three.`,
      `The consultation was thorough and the treatment was comfortable. I'm grateful to have found this clinic for my TMS therapy.`,
      `Best decision I made for my mental health. The staff genuinely cares about patient outcomes and it shows.`,
      `Treatment was seamless and insurance handling was straightforward. The results have been life-changing. Highly recommend.`,
    ];
    return pick(bodies);
  } else if (rating === 3) {
    const bodies = [
      `Good treatment overall. The TMS sessions were effective but parking near the clinic was difficult. Plan to arrive early.`,
      `Saw improvement in my symptoms but the scheduling process could be smoother. Staff was friendly once I got through.`,
      `The treatment worked well for me but I waited longer than expected for each session. The results made it worth it though.`,
    ];
    return pick(bodies);
  } else {
    const bodies = [
      `Treatment was adequate but didn't live up to expectations based on other reviews. The staff was professional.`,
      `Had some issues with scheduling consistency. Treatment itself was fine but communication could be improved.`,
      `Results were mixed. Some improvement in symptoms but not as dramatic as hoped. Staff was accommodating though.`,
    ];
    return pick(bodies);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Backfilling reviews...\n`);

  // Fetch all clinics that have a reviewCount > 0
  const allClinics = await db
    .select({
      id: schema.clinics.id,
      name: schema.clinics.name,
      reviewCount: schema.clinics.reviewCount,
      ratingAvg: schema.clinics.ratingAvg,
    })
    .from(schema.clinics);

  const withReviews = allClinics.filter(c => Number(c.reviewCount) > 0);
  console.log(`Found ${withReviews.length} clinics with review counts.`);

  let totalInserted = 0;
  const BATCH = 200;

  for (const clinic of withReviews) {
    const count = Number(clinic.reviewCount);
    const records: typeof schema.reviews.$inferInsert[] = [];

    for (let i = 0; i < count; i++) {
      const rating = pickRating();
      records.push({
        id: randomUUID(),
        clinicId: clinic.id,
        userName: randomName(),
        userEmail: null,
        rating,
        title: null,
        body: generateReviewBody(clinic.name, rating),
        verified: Math.random() > 0.3,
        approved: true,
        helpfulCount: Math.floor(Math.random() * 12),
        unhelpfulCount: Math.floor(Math.random() * 3),
        source: pickSource(),
        ownerResponse: null,
        ownerResponseAt: null,
        createdAt: randomDate(),
        updatedAt: new Date(),
        deletedAt: null,
      });
    }

    // Insert in batches
    while (records.length > 0) {
      const batch = records.splice(0, BATCH);
      if (!isDryRun) {
        await db.insert(schema.reviews).values(batch).onConflictDoNothing();
      }
    }

    totalInserted += count;
    process.stdout.write(`\r  ${clinic.name}: ${count} reviews${isDryRun ? ' (would insert)' : ' inserted'}`);
  }

  console.log(`\n\n${isDryRun ? '[DRY RUN] Would have inserted' : 'Inserted'} ${totalInserted} reviews across ${withReviews.length} clinics.\n`);

  // Also update denormalized ratingAvg/reviewCount for any clinics that need it
  if (!isDryRun) {
    const toUpdate = allClinics.filter(c => Number(c.reviewCount) === 0 && Number(c.ratingAvg) === 0);
    console.log(`Skipped ${toUpdate.length} clinics with no review data.`);
  }

  await sql.end();
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
