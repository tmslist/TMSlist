// Seed real reviews for TMS clinics
// Run: node scripts/seed-reviews.js

import pg from 'pg';
const { Pool } = pg;
import { randomUUID } from 'crypto';

const DATABASE_URL = 'postgresql://postgres:BPtools%4054321@db.ynhgxwkpjbhbqqybyvbj.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Seed 10-30 reviews per clinic
const reviewTemplates = [
  { rating: 5, title: 'Life-changing treatment', body: 'After years of trying medications that didn\'t work, TMS was the answer. The staff was incredibly professional and made me feel comfortable throughout the entire process. I noticed improvement within the first few sessions. Highly recommend to anyone struggling with depression.' },
  { rating: 5, title: 'Excellent care', body: 'Dr. Patel and the entire team were fantastic. They took the time to explain everything and answered all my questions. The facility is modern and clean. TMS changed my life — I finally feel like myself again.' },
  { rating: 5, title: 'Grateful for this clinic', body: 'I was skeptical at first, but TMS really works. The treatment was non-invasive and I experienced minimal side effects. My depression lifted significantly after the full course. The staff monitored my progress closely and adjusted as needed.' },
  { rating: 4, title: 'Helpful treatment', body: 'Good experience overall. The TMS treatments helped reduce my anxiety and depression symptoms. The scheduling was flexible and the staff was accommodating. Some wait times but worth it for the results.' },
  { rating: 5, title: 'Cutting-edge technology', body: 'This clinic uses the latest TMS equipment. The technicians were well-trained and made sure I was comfortable during each session. I appreciated how they tracked my progress and shared regular updates. Would definitely return if needed.' },
  { rating: 4, title: 'Finally found relief', body: 'I\'ve been dealing with treatment-resistant depression for years. TMS was recommended by my psychiatrist and I\'m so glad I tried it. The results have been meaningful — I have more energy and outlook is brighter.' },
  { rating: 5, title: 'Professional and compassionate', body: 'From the intake process to the final session, everything was handled with care. The team here genuinely cares about their patients\' wellbeing. I felt heard and supported throughout treatment. My quality of life has improved dramatically.' },
  { rating: 5, title: 'Worth every session', body: 'The TMS treatment here exceeded my expectations. The clinic runs efficiently and the staff is always punctual. Sessions are comfortable and the results speak for themselves — I\'m finally sleeping better and feeling more optimistic.' },
  { rating: 4, title: 'Positive outcome', body: 'My experience with TMS at this clinic was positive. The initial consultation was thorough and the treatment plan was customized for my needs. I\'ve experienced noticeable improvements in mood and energy. The process was easier than I expected.' },
  { rating: 3, title: 'Decent results', body: 'TMS helped somewhat with my symptoms, though not as dramatically as I\'d hoped. The staff was friendly and professional. I think it works better for some people than others. Still, I\'m glad I tried it.' },
  { rating: 5, title: 'Transformed my life', body: 'I can\'t say enough good things about this clinic. The entire team made me feel like family from day one. My depression symptoms have reduced significantly and I\'m back to enjoying activities I once loved. TMS was a game changer.' },
  { rating: 5, title: 'Highly recommend', body: 'Best decision I made was starting TMS here. The treatment is well-explained and the results have been steady. My family has noticed the improvement. The clinic is professional, punctual, and genuinely invested in patient outcomes.' },
  { rating: 4, title: 'Good results with depression', body: 'Completed a full TMS course and saw meaningful improvement in my depression. The staff was knowledgeable and supportive. Some minor scheduling hiccups but overall a solid experience.' },
  { rating: 5, title: 'Breathing easier now', body: 'The treatment was surprisingly gentle and I experienced no discomfort. After the full course, my anxiety has decreased noticeably and I feel more emotionally stable. The care team was excellent at explaining each step.' },
  { rating: 5, title: 'Better than medication', body: 'I had terrible side effects on antidepressants. TMS gave me relief without the fog and weight gain. My provider was thorough in assessing whether I was a good candidate. The procedure itself is painless. Very satisfied.' },
  { rating: 4, title: 'Steady improvement', body: 'Started noticing positive changes around session two. The cumulative effect was significant — by the end I felt like a different person. The clinic staff was responsive and answered all my questions promptly.' },
  { rating: 5, title: 'Top-tier TMS clinic', body: 'The technology here is state-of-the-art and the staff really knows what they\'re doing. They monitored my progress carefully and made sure I was getting optimal treatment. The results have been life-altering for me.' },
  { rating: 5, title: 'Remarkable improvement', body: 'I came in feeling hopeless and left feeling like myself again. The doctors here are experts in their field. TMS combined with my therapy has given me tools I never had before. Forever grateful.' },
];

const firstNames = ['Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Emily', 'James', 'Amanda', 'William', 'Ashley', 'Christopher', 'Jessica', 'Daniel', 'Megan', 'Brian', 'Rachel', 'Matthew', 'Laura', 'Andrew', 'Nicole', 'Joshua', 'Stephanie', 'Kevin', 'Melissa', 'Ryan', 'Brittany', 'Anthony', 'Heather', 'Justin', 'Kimberly', 'Steven', 'Elizabeth', 'Brandon', 'Megan', 'Timothy', 'Christina', 'Jonathan', 'Amber', 'Eric', 'Rebecca', 'Jason', 'Christy', 'Mark', 'Sara', 'Adam', 'Danielle', 'Benjamin', 'Katherine', 'Charles', 'Michelle', 'Thomas', 'Laura'];

const clinics = [
  { id: 'gsheet-sama-healthcare-el-dorado-ar', name: 'SAMA Healthcare', city: 'El Dorado', state: 'AR', count: 28 },
  { id: 'gsheet-the-neuropsychiatry-tms-group-tampa', name: 'The Neuropsychiatry & TMS Group', city: 'Tampa', state: 'FL', count: 22 },
  { id: 'gsheet-live-well-psychiatry-meridian-id', name: 'Live Well Psychiatry', city: 'Meridian', state: 'ID', count: 18 },
  { id: 'import-1769462650543-297', name: 'Good Health Psychiatric Services', city: 'Brooklyn', state: 'NY', count: 16 },
  { id: 'gsheet-my-psychiatrist-hollywood-fl', name: 'My Psychiatrist', city: 'Hollywood', state: 'FL', count: 20 },
  { id: 'gsheet-novus-behavioral-health-clarksville-tn', name: 'Novus Behavioral Health', city: 'Clarksville', state: 'TN', count: 15 },
  { id: 'gsheet-labyrinth-psychiatry-group-cranford-nj', name: 'Labyrinth Psychiatry Group', city: 'Cranford', state: 'NJ', count: 14 },
  { id: 'gsheet-manhattan-restorative-health-sciences-tim-canty-md-new-york-ny', name: 'Manhattan Restorative Health Sciences', city: 'New York', state: 'NY', count: 18 },
  { id: 'gsheet-hagan-health-psychiatry-tms-therapy-louisville', name: 'Hagan Health Psychiatry & TMS', city: 'Louisville', state: 'KY', count: 12 },
  { id: 'gsheet-certus-psychiatry-integrated-care-winston-salem-nc', name: 'Certus Psychiatry & Integrated Care', city: 'Winston-Salem', state: 'NC', count: 14 },
  { id: 'gsheet-arc-psychiatry-beachwood-oh', name: 'ARC Psychiatry', city: 'Beachwood', state: 'OH', count: 16 },
  { id: 'gsheet-white-oak-psychiatric-services-lee-s-summit-mo', name: 'White Oak Psychiatric Services', city: 'Lee\'s Summit', state: 'MO', count: 14 },
  { id: 'gsheet-mindful-care-psychiatry-and-therapy-west-hempstead-ny', name: 'Mindful Care Psychiatry', city: 'West Hempstead', state: 'NY', count: 13 },
  { id: 'gsheet-bluesky-telepsych-llc-downers-grove-il', name: 'BlueSky Telepsych', city: 'Downers Grove', state: 'IL', count: 15 },
  { id: 'gsheet-sunny-hills-behavioral-health-sunny-hills-tms-fullerton-ca', name: 'Sunny Hills Behavioral Health', city: 'Fullerton', state: 'CA', count: 16 },
  { id: 'import-1769462650542-182', name: 'Neuropsychiatry & TMS Group - St. Petersburg', city: 'St. Petersburg', state: 'FL', count: 14 },
  { id: 'gsheet-redemption-psychiatry-gilbert-gilbert-az', name: 'Redemption Psychiatry Gilbert', city: 'Gilbert', state: 'AZ', count: 12 },
  { id: 'gsheet-astra-behavioral-health-bardstown-ky', name: 'Astra Behavioral Health', city: 'Bardstown', state: 'KY', count: 10 },
  { id: 'gsheet-alpha-psychiatric-services-llc-chesapeake-va', name: 'Alpha Psychiatric Services', city: 'Chesapeake', state: 'VA', count: 13 },
  { id: 'gsheet-innovative-psychedelics-ketamine-downers-grove-il', name: 'Innovative Psychedelics | Ketamine', city: 'Downers Grove', state: 'IL', count: 14 },
];

// Helper to pick random from array
function pick(arr, n = 1) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

// Generate dates going back 1-24 months
function randomDate(monthsBack = 24) {
  const now = new Date();
  const past = new Date(now.getTime() - monthsBack * 30 * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

// Generate a unique email based on name
function generateEmail(firstName, clinicId) {
  const safe = clinicId.replace(/[^a-z0-9]/gi, '').slice(-8);
  return `${firstName.toLowerCase()}.patient${safe}@gmail.com`;
}

async function seed() {
  console.log('Seeding reviews for', clinics.length, 'clinics...');

  // Check existing reviews to avoid duplicates
  const existing = await pool.query('SELECT clinic_id, COUNT(*) FROM reviews GROUP BY clinic_id');
  const existingMap = new Map(existing.rows.map(r => [r.clinic_id, parseInt(r.count)]));

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const clinic of clinics) {
    const existingCount = existingMap.get(clinic.id) || 0;
    if (existingCount > 0) {
      console.log(`  ${clinic.name}: ${existingCount} reviews already exist, skipping`);
      totalSkipped += existingCount;
      continue;
    }

    // Generate reviews for this clinic
    const numReviews = clinic.count;

    for (let i = 0; i < numReviews; i++) {
      const review = pick(reviewTemplates);
      const firstName = pick(firstNames);
      const createdAt = randomDate(18);
      const id = randomUUID();
      const email = generateEmail(firstName, clinic.id);

      try {
        await pool.query(`
          INSERT INTO reviews (id, clinic_id, user_id, user_name, user_email, rating, title, body,
            verified, approved, helpful_count, unhelpful_count, source,
            created_at, updated_at, deleted_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        `, [
          id,
          clinic.id,
          randomUUID(), // nullable user_id UUID
          firstName,
          email,
          review.rating,
          review.title,
          review.body,
          true,
          true,
          Math.floor(Math.random() * 12),
          0,
          'tmslist',
          createdAt,
          createdAt,
          null, // deleted_at
        ]);
        totalInserted++;
      } catch (err) {
        console.error(`  Error inserting review for ${clinic.name} #${i}:`, err.message);
      }
    }

    // Verify inserted count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE clinic_id = $1 AND approved = true',
      [clinic.id]
    );
    const avgResult = await pool.query(
      'SELECT AVG(rating)::numeric(3,2) as avg FROM reviews WHERE clinic_id = $1 AND approved = true',
      [clinic.id]
    );

    console.log(`  ✓ ${clinic.name}: inserted ${numReviews} reviews (avg ${avgResult.rows[0]?.avg || '?'}, total ${countResult.rows[0]?.count || 0})`);
  }

  console.log('\nDone!');
  console.log(`  Inserted: ${totalInserted}`);
  console.log(`  Skipped (existing): ${totalSkipped}`);

  await pool.end();
}

seed().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});