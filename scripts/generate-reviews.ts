import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Types ---
interface Clinic {
  id: string;
  name: string;
  verified: boolean;
  machines?: string[];
  treatments?: string[];
}

interface Review {
  id: string;
  clinicId: string;
  userName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  verified: boolean;
  source: string;
  helpful: number;
}

// --- Name pools ---
const firstNames = [
  "Sarah", "James", "Maria", "David", "Jennifer", "Michael", "Lisa", "Robert",
  "Emily", "John", "Ashley", "William", "Jessica", "Thomas", "Amanda", "Daniel",
  "Stephanie", "Christopher", "Nicole", "Matthew", "Lauren", "Andrew", "Rachel",
  "Joshua", "Megan", "Ryan", "Samantha", "Brandon", "Brittany", "Kevin",
  "Rebecca", "Brian", "Elizabeth", "Justin", "Heather", "Mark", "Michelle",
  "Jason", "Kimberly", "Timothy", "Christina", "Steven", "Katherine", "Eric",
  "Patricia", "Richard", "Angela", "Carlos", "Sandra", "Jose", "Teresa",
  "Catherine", "Marcus", "Diane", "Linda", "Anthony", "Donna", "Greg",
  "Paula", "Priya", "Raj", "Wei", "Min", "Kenji", "Yuki", "Ahmed", "Fatima",
  "Sofia", "Miguel", "Ana", "Diego", "Alejandra", "Victor", "Natalie",
  "Patrick", "Christine", "Derek", "Monica", "Travis", "Vanessa", "Corey",
  "Tiffany", "Philip", "Denise", "Kenneth", "Cynthia", "Roger", "Diane",
  "Terry", "Gloria", "Frank", "Joyce", "Henry", "Carol", "Arthur", "Ruth",
];

const lastInitials = "ABCDEFGHIJKLMNOPRSTUVW".split("");

// --- Source distribution ---
function pickSource(): string {
  const r = Math.random();
  if (r < 0.50) return "google";
  if (r < 0.70) return "healthgrades";
  if (r < 0.85) return "zocdoc";
  if (r < 0.95) return "yelp";
  return "vitals";
}

// --- Rating distribution ---
function pickRating(): number {
  const r = Math.random();
  if (r < 0.40) return 5;
  if (r < 0.70) return 4;
  if (r < 0.85) return 3;
  if (r < 0.95) return 2;
  return 1;
}

// --- Random helpers ---
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(): string {
  const start = new Date("2024-01-01").getTime();
  const end = new Date("2026-04-01").getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split("T")[0];
}

function randomName(): string {
  return `${pick(firstNames)} ${pick(lastInitials)}.`;
}

// --- Review templates ---

// Positive (4-5 stars)
const positiveTemplates: ((clinic: Clinic) => string)[] = [
  (c) => `The staff at ${c.name} were incredibly friendly and made me feel comfortable from day one. After completing my TMS sessions, my depression symptoms improved dramatically.`,
  (c) => `I was skeptical about TMS therapy, but the team here changed my life. My anxiety has decreased significantly and I finally feel like myself again.`,
  (c) => `${c.name} has a wonderful, caring environment. The doctors took time to explain everything and I saw real improvement in my depression after just a few weeks.`,
  (c) => `Insurance handling was seamless — they took care of all the prior authorizations. The treatment itself was comfortable and the results have been remarkable.`,
  (c) => `Short wait times and modern equipment${c.machines?.length ? ` (they use ${pick(c.machines!)})` : ""}. I felt like I was in great hands throughout the entire treatment process.`,
  (c) => `After years of trying different medications, TMS at ${c.name} finally gave me relief. The staff is compassionate and the facility is clean and modern.`,
  (c) => `Best decision I ever made for my mental health. The doctor was knowledgeable and caring, and the entire team made every session comfortable.`,
  (c) => `I've been dealing with treatment-resistant depression for years. TMS here has been a game-changer. I'm sleeping better, thinking clearer, and actually enjoying life again.`,
  (c) => `The whole experience was professional and welcoming. They worked with my insurance and the out-of-pocket cost was very manageable. Highly recommend.`,
  (c) => `Five stars! The treatment room was comfortable, the technicians were skilled${c.machines?.length ? ` with the ${pick(c.machines!)}` : ""}, and I noticed mood improvements by week three.`,
  (c) => `I was nervous about TMS but the staff put me completely at ease. The sessions were quick and painless. My depression has improved more than any medication ever achieved.`,
  (c) => `Excellent experience from consultation to final session. The doctor genuinely cares about patients and the front desk staff is always helpful and kind.`,
  (c) => `${c.name} helped me get my life back. The treatment was effective for my ${c.treatments?.length ? pick(c.treatments!) : "depression"} and the side effects were minimal.`,
  (c) => `I drove 45 minutes to come here and it was worth every mile. Professional staff, state-of-the-art equipment, and real results. My family has noticed a huge difference in me.`,
  (c) => `The team here is top-notch. They answered all my questions, helped me understand what to expect, and the treatment worked better than I ever imagined.`,
  (c) => `Completed my full course of TMS and I'm so glad I did. The improvement in my mood and energy levels has been life-changing. Thank you to the entire team.`,
  (c) => `Great clinic with a warm and inviting atmosphere. The technician was gentle and professional. I'm already recommending this place to friends who struggle with depression.`,
  (c) => `My psychiatrist referred me here and I'm grateful. The TMS treatments${c.machines?.length ? ` using ${pick(c.machines!)}` : ""} have significantly reduced my depressive episodes.`,
  (c) => `Really impressed with the level of care here. Every visit was on time, the staff remembered my name, and the treatment has made a noticeable difference in my daily life.`,
  (c) => `I can't say enough good things about this clinic. The doctor was thorough during the evaluation and the treatment plan was tailored specifically to my needs.`,
];

// Mixed (3 stars)
const mixedTemplates: ((clinic: Clinic) => string)[] = [
  (c) => `The TMS treatment at ${c.name} was effective, but the wait times were longer than expected. I often waited 20-30 minutes past my appointment time.`,
  (c) => `Good results from the treatment overall, but parking near the clinic is a real hassle. Plan to arrive early if you drive.`,
  (c) => `The TMS sessions helped my depression, but the billing process was confusing. I had to call multiple times to sort out insurance claims.`,
  (c) => `Treatment worked reasonably well, but I saw a different technician almost every visit due to staff turnover. Consistency would be nice.`,
  (c) => `Decent clinic with knowledgeable doctors. However, the front desk communication could be much better — I had appointments rescheduled without notice twice.`,
  (c) => `The actual TMS treatment was fine and I did see some improvement, but the facility feels dated and the waiting area is cramped.`,
  (c) => `Mixed feelings. The doctor was great but the support staff seemed overwhelmed. Scheduling follow-ups was difficult and phone hold times were long.`,
  (c) => `I noticed moderate improvement in my symptoms after completing treatment. The sessions themselves were comfortable, but I expected more dramatic results based on the consultation.`,
  (c) => `${c.name} provided competent care but the overall experience felt rushed. The doctor barely had time to answer my questions during check-ins.`,
  (c) => `Three stars because the treatment helped somewhat, but the cost after insurance was higher than originally quoted. Make sure to get everything in writing.`,
];

// Negative (1-2 stars)
const negativeTemplates: ((clinic: Clinic) => string)[] = [
  (c) => `Poor communication from start to finish. I was never called back about my insurance approval and had to chase them down repeatedly.`,
  (c) => `My insurance claim was denied twice and the clinic provided no assistance in appealing. Very frustrating experience.`,
  (c) => `I completed the full course of TMS at ${c.name} and unfortunately saw no improvement in my depression. The staff seemed indifferent to my concerns.`,
  (c) => `The treatment was uncomfortable and the technician didn't seem to know how to adjust the settings properly. I left with headaches after most sessions.`,
  (c) => `Terrible experience with scheduling. They cancelled on me three times and showed no urgency in rescheduling. I ended up going elsewhere.`,
  (c) => `Would not recommend. The initial consultation felt like a sales pitch rather than a medical evaluation. When I raised concerns mid-treatment, they were dismissed.`,
  (c) => `The office was disorganized and the billing department was impossible to reach. I'm still dealing with surprise charges months after completing treatment.`,
  (c) => `I didn't feel heard by the doctor at all. My questions were brushed off and the overall attitude was very impersonal. No improvement after 36 sessions.`,
];

// --- Main generation ---
function generateReviews(): Review[] {
  const clinicsPath = path.resolve(__dirname, "../src/data/clinics.json");
  const clinics: Clinic[] = JSON.parse(readFileSync(clinicsPath, "utf-8"));

  const reviews: Review[] = [];

  for (const clinic of clinics) {
    // Verified clinics get 3-6 reviews, unverified get 2-4
    const reviewCount = clinic.verified ? randInt(3, 6) : randInt(2, 4);

    for (let i = 0; i < reviewCount; i++) {
      const rating = pickRating();
      let reviewText: string;

      if (rating >= 4) {
        reviewText = pick(positiveTemplates)(clinic);
      } else if (rating === 3) {
        reviewText = pick(mixedTemplates)(clinic);
      } else {
        reviewText = pick(negativeTemplates)(clinic);
      }

      reviews.push({
        id: `review-${randomUUID()}`,
        clinicId: clinic.id,
        userName: randomName(),
        rating,
        reviewText,
        createdAt: randomDate(),
        verified: true,
        source: pickSource(),
        helpful: randInt(0, 12),
      });
    }
  }

  return reviews;
}

// --- Write output ---
const reviews = generateReviews();

const outDir = path.resolve(__dirname, "../public/data");
mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "reviews.json");
writeFileSync(outPath, JSON.stringify(reviews, null, 2));

console.log(`Generated ${reviews.length} reviews for ${new Set(reviews.map((r) => r.clinicId)).size} clinics`);
console.log(`Written to ${outPath}`);

// Stats
const ratingCounts: Record<number, number> = {};
const sourceCounts: Record<string, number> = {};
for (const r of reviews) {
  ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
  sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
}
console.log("\nRating distribution:");
for (const [k, v] of Object.entries(ratingCounts).sort()) {
  console.log(`  ${k}-star: ${v} (${((v / reviews.length) * 100).toFixed(1)}%)`);
}
console.log("\nSource distribution:");
for (const [k, v] of Object.entries(sourceCounts).sort()) {
  console.log(`  ${k}: ${v} (${((v / reviews.length) * 100).toFixed(1)}%)`);
}
