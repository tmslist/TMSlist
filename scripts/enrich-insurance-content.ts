/**
 * Enriches insurance markdown files with visual HTML stat cards and FAQs.
 * Run: npx tsx scripts/enrich-insurance-content.ts
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src/content/insurance');

const INSURANCE_META: Record<string, {
  typicalCost?: string;
  faqs: { question: string; answer: string }[];
}> = {
  'medicare': {
    typicalCost: '$400-$800',
    faqs: [
      { question: 'Does Medicare Part B cover TMS?', answer: 'Yes. Medicare Part B covers TMS for treatment-resistant depression nationwide. You pay 20% coinsurance after your annual deductible.' },
      { question: 'Do I need prior authorization with Medicare?', answer: 'Yes. Your TMS clinic submits documentation including your diagnosis, failed medication trials, and treatment plan. Approval typically takes 1-2 weeks.' },
      { question: 'Does Medicare cover TMS for OCD or anxiety?', answer: 'Medicare coverage for OCD TMS is evolving — some Medicare Administrative Contractors cover it. Anxiety-only TMS is generally not covered.' },
    ]
  },
  'medicaid': {
    typicalCost: '$0-$100',
    faqs: [
      { question: 'Does Medicaid cover TMS in my state?', answer: 'Medicaid TMS coverage varies by state. Over 30 states now provide some level of coverage, typically through managed care plans. Contact your state Medicaid office or your TMS clinic for specifics.' },
      { question: 'What documentation is needed?', answer: 'Similar to commercial insurance: MDD diagnosis, 2-4 failed medication trials, PHQ-9 scores, and a letter of medical necessity from your psychiatrist.' },
    ]
  },
  'bluecross-blueshield': {
    typicalCost: '$500-$2,500',
    faqs: [
      { question: 'Does BCBS cover TMS?', answer: 'Yes, most BCBS plans cover TMS for treatment-resistant depression. Policies vary by state affiliate. Prior authorization is required.' },
      { question: 'How many sessions does BCBS approve?', answer: 'Typically 36 sessions for standard TMS. Some plans authorize in two phases (first 18, then remaining 18 after review).' },
    ]
  },
  'aetna': {
    typicalCost: '$500-$2,000',
    faqs: [
      { question: 'Does Aetna cover TMS therapy?', answer: 'Yes. Aetna covers TMS for treatment-resistant depression with prior authorization. Their policy requires documentation of 2+ failed antidepressant trials.' },
      { question: "What is Aetna's approval process?", answer: "Prior auth required. Submit diagnosis, medication history, PHQ-9 scores, and treatment plan. Decisions typically take 5-15 business days." },
    ]
  },
  'cigna': {
    typicalCost: '$500-$2,500',
    faqs: [
      { question: 'Does Cigna cover TMS?', answer: 'Yes, Cigna covers TMS for treatment-resistant major depressive disorder. Prior authorization and documentation of failed medication trials are required.' },
      { question: 'How do I get Cigna to approve TMS?', answer: 'Work with your TMS clinic to submit prior auth with your diagnosis, 2+ failed medication trials, current PHQ-9 score, and proposed treatment plan.' },
    ]
  },
  'united-healthcare': {
    typicalCost: '$500-$3,000',
    faqs: [
      { question: 'Does UnitedHealthcare cover TMS?', answer: 'Yes, UHC covers TMS for treatment-resistant depression. Prior auth is required. Their medical policy requires at least 2 failed antidepressant trials.' },
      { question: "What if UHC denies my TMS claim?", answer: "Appeal. TMS denial overturn rates are 60-70% on appeal. Request a peer-to-peer review where your psychiatrist speaks directly with UHC's medical director." },
    ]
  },
  'humana': {
    typicalCost: '$500-$2,000',
    faqs: [
      { question: 'Does Humana cover TMS?', answer: 'Yes. Humana covers TMS for treatment-resistant MDD with prior authorization and documented medication failures.' },
    ]
  },
  'kaiser': {
    typicalCost: '$500-$1,500',
    faqs: [
      { question: 'Does Kaiser offer TMS?', answer: 'Yes, though availability varies by region. Kaiser may provide TMS through their own facilities or refer to contracted providers. Internal referral from your Kaiser psychiatrist is typically needed.' },
    ]
  },
  'tricare': {
    typicalCost: '$0-$500',
    faqs: [
      { question: 'Does TRICARE cover TMS for service members?', answer: 'Yes. TRICARE covers TMS for treatment-resistant depression for active duty, retirees, and dependents. Prior authorization is required.' },
      { question: 'Can I get TMS at a VA facility with TRICARE?', answer: 'TMS through the VA uses VA benefits, not TRICARE. If you have both, check which pathway offers better coverage for your situation.' },
    ]
  },
  'self-pay-financing': {
    typicalCost: '$6,000-$12,000',
    faqs: [
      { question: 'How much does TMS cost without insurance?', answer: 'A full course (36 sessions) typically costs $6,000-$12,000. Per-session rates range from $200-$400. Many clinics offer package discounts.' },
      { question: 'What financing options are available?', answer: 'CareCredit, Prosper Healthcare Lending, and clinic payment plans are common. HSA and FSA funds can be used. Some clinics offer sliding scale rates.' },
    ]
  },
  'prior-authorization-guide': {
    faqs: [
      { question: 'How long does TMS prior auth take?', answer: 'Typically 5-15 business days for initial decisions. Expedited reviews (24-72 hours) are available for urgent cases.' },
      { question: 'What if my prior auth is denied?', answer: 'Appeal immediately. Request a peer-to-peer review, submit additional documentation, and if needed, file for external review. TMS denial overturn rates are 60-70%.' },
    ]
  },
  'denied-coverage-appeals': {
    faqs: [
      { question: 'How do I appeal a TMS denial?', answer: 'Start with an internal appeal, including additional clinical documentation. Request a peer-to-peer review. If internal appeals fail, file for external review through your state insurance department.' },
      { question: 'What are the chances of overturning a denial?', answer: 'TMS denial overturn rates are approximately 60-70% when appealed with proper documentation.' },
    ]
  },
};

function enrichFile(filename: string) {
  const slug = filename.replace('.md', '');
  const meta = INSURANCE_META[slug];

  const filepath = path.join(DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.log(`⚠ Could not parse ${filename}`);
    return;
  }

  let frontmatter = fmMatch[1];
  const body = fmMatch[2];

  // Add typicalCost and faqs to frontmatter
  if (meta) {
    if (!frontmatter.includes('typicalCost:') && meta.typicalCost) {
      frontmatter += `\ntypicalCost: "${meta.typicalCost}"`;
    }
    if (!frontmatter.includes('faqs:') && meta.faqs.length > 0) {
      frontmatter += '\nfaqs:';
      for (const faq of meta.faqs) {
        frontmatter += `\n  - question: "${faq.question.replace(/"/g, '\\"')}"`;
        frontmatter += `\n    answer: "${faq.answer.replace(/"/g, '\\"')}"`;
      }
    }
  }

  // Extract insurer name
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const coversTmsMatch = frontmatter.match(/coversTms:\s*(true|false)/);
  const priorAuthMatch = frontmatter.match(/priorAuthRequired:\s*(true|false)/);

  const title = titleMatch?.[1] || slug;
  const coversTms = coversTmsMatch?.[1] !== 'false';
  const priorAuth = priorAuthMatch?.[1] !== 'false';
  const typicalCost = meta?.typicalCost || '$500-$3,000';

  // Build stat cards
  const statCards = `
<div class="not-prose mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
  <div class="${coversTms ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} border rounded-xl p-5 text-center">
    <div class="text-2xl font-bold ${coversTms ? 'text-emerald-700' : 'text-amber-700'} font-display">${coversTms ? 'Yes' : 'Varies'}</div>
    <div class="text-xs ${coversTms ? 'text-emerald-600' : 'text-amber-600'} mt-1">Covers TMS</div>
  </div>
  <div class="${priorAuth ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} border rounded-xl p-5 text-center">
    <div class="text-2xl font-bold ${priorAuth ? 'text-amber-700' : 'text-emerald-700'} font-display">${priorAuth ? 'Required' : 'Not Required'}</div>
    <div class="text-xs ${priorAuth ? 'text-amber-600' : 'text-emerald-600'} mt-1">Prior Authorization</div>
  </div>
  <div class="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
    <div class="text-2xl font-bold text-blue-700 font-display">${typicalCost}</div>
    <div class="text-xs text-blue-600 mt-1">Typical patient cost</div>
  </div>
</div>
`;

  // Insert stat cards after first heading
  let enrichedBody = body;
  const firstHeadingMatch = enrichedBody.match(/\n(## .+)\n/);
  if (firstHeadingMatch) {
    const idx = enrichedBody.indexOf(firstHeadingMatch[0]);
    enrichedBody = enrichedBody.slice(0, idx) + '\n' + statCards + enrichedBody.slice(idx);
  }

  const newContent = `---\n${frontmatter}\n---\n${enrichedBody}`;
  fs.writeFileSync(filepath, newContent, 'utf-8');
  console.log(`✅ Enriched ${filename}`);
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
for (const file of files) {
  enrichFile(file);
}
console.log('\nDone! All insurance files enriched.');
