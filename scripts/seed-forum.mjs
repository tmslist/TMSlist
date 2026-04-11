/**
 * Seed forum categories directly — run with: node scripts/seed-forum.mjs
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';

// Load .env manually since dotenv may not be installed
const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [key, ...val] = l.split('=');
    return [key.trim(), val.join('=').trim().replace(/^["']|["']$/g, '')];
  })
);

const DATABASE_URL = envVars.DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const CATEGORIES = [
  { slug: 'treatment-experiences', name: 'Treatment Experiences', description: 'Share and read first-hand TMS therapy journeys', icon: '🧠', color: 'violet', sort_order: 1 },
  { slug: 'ask-a-specialist', name: 'Ask a Specialist', description: 'Get answers from verified TMS professionals', icon: '👨‍⚕️', color: 'emerald', sort_order: 2 },
  { slug: 'insurance-cost', name: 'Insurance & Cost', description: 'Navigate coverage, billing, and financial options', icon: '💰', color: 'amber', sort_order: 3 },
  { slug: 'side-effects-recovery', name: 'Side Effects & Recovery', description: 'What to expect during and after TMS treatment', icon: '💊', color: 'rose', sort_order: 4 },
  { slug: 'success-stories', name: 'Success Stories', description: 'Celebrate positive outcomes and milestones', icon: '🌟', color: 'yellow', sort_order: 5 },
  { slug: 'research-studies', name: 'Research & Studies', description: 'Discuss new findings and clinical data', icon: '📊', color: 'blue', sort_order: 6 },
  { slug: 'mental-health-support', name: 'Mental Health Support', description: 'Peer support and coping strategies', icon: '💚', color: 'teal', sort_order: 7 },
  { slug: 'events-workshops', name: 'Events & Workshops', description: 'Community meetups and educational events', icon: '📅', color: 'indigo', sort_order: 8 },
];

async function seed() {
  console.log('Seeding forum categories...');

  for (const cat of CATEGORIES) {
    await sql`
      INSERT INTO forum_categories (slug, name, description, icon, color, sort_order)
      VALUES (${cat.slug}, ${cat.name}, ${cat.description}, ${cat.icon}, ${cat.color}, ${cat.sort_order})
      ON CONFLICT (slug) DO NOTHING
    `;
    console.log(`  ✓ ${cat.icon} ${cat.name}`);
  }

  console.log('\nDone! 8 categories seeded.');
  await sql.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
