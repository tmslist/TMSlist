/**
 * Seed questions and treatments (run after main seed).
 * Usage: DATABASE_URL=... npx tsx scripts/seed-extras.ts
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { questions, treatments } from '../src/db/schema';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function seedQuestions() {
  try {
    const raw = readFileSync(resolve(__dirname, '../src/data/questions-comprehensive.json'), 'utf-8');
    const qData = JSON.parse(raw);

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
    console.error('Questions seed error:', (err as Error).message);
  }
}

async function seedTreatments() {
  try {
    const raw = readFileSync(resolve(__dirname, '../src/data/alternative-treatments.ts'), 'utf-8');

    // Extract the array from the TS file
    const match = raw.match(/export\s+const\s+alternativeTreatments\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      console.log('Could not parse alternative-treatments.ts');
      return;
    }

    // Use eval to parse the TS array literal (safe since it's our own file)
    const treatmentData = eval(match[1]);

    const rows = treatmentData.map((t: Record<string, unknown>) => ({
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
    console.error('Treatments seed error:', (err as Error).message);
  }
}

async function main() {
  console.log('Seeding questions and treatments...\n');
  await seedQuestions();
  await seedTreatments();
  console.log('\n✅ Done!');
}

main();
