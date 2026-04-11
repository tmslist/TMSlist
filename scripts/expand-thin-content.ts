/**
 * Expands thin content files to 1400+ words with visual formatting components.
 * Adds: stat cards, callout boxes, styled tables, step cards, FAQ sections, CTAs.
 *
 * Run: npx tsx scripts/expand-thin-content.ts
 */
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/content');
const MIN_WORDS = 1400;

// Files already rich-formatted (skip)
const SKIP_FILES = new Set([
  'treatments/depression.md', 'treatments/anxiety.md', 'treatments/ocd.md', 'treatments/ptsd.md',
  'alternatives/spravato-esketamine.md', 'alternatives/ketamine-infusion-therapy.md',
  'alternatives/electroconvulsive-therapy-ect.md', 'alternatives/vagus-nerve-stimulation.md',
  'alternatives/neurofeedback.md', 'alternatives/psilocybin-assisted-therapy.md',
  'alternatives/deep-brain-stimulation.md', 'alternatives/stellate-ganglion-block.md',
]);

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function getFiles(dir: string, prefix: string = ''): { path: string; relPath: string }[] {
  const results: { path: string; relPath: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const relPath = prefix ? `${prefix}/${file}` : file;
    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...getFiles(fullPath, relPath));
    } else if (file.endsWith('.md')) {
      results.push({ path: fullPath, relPath });
    }
  }
  return results;
}

// Visual components to inject based on content type
function buildClinicCTA(): string {
  return `
<div class="not-prose my-10 bg-slate-900 rounded-2xl p-8 text-center">
  <h3 class="text-2xl font-semibold text-white mb-3">Ready to Explore Your Options?</h3>
  <p class="text-slate-400 mb-6 max-w-lg mx-auto">Browse verified TMS providers, compare clinics, and find the right treatment for your situation.</p>
  <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
    <a href="/us/" class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Find a Clinic</a>
    <a href="/quiz/am-i-a-candidate/" class="text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors">Am I a Candidate?</a>
  </div>
</div>`;
}

function buildRelatedLinks(category: string): string {
  const links: Record<string, string> = {
    comparisons: `
<div class="not-prose my-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
  <h4 class="font-display font-bold text-blue-900 mb-3 text-base">Related Comparisons</h4>
  <div class="grid grid-cols-2 gap-2">
    <a href="/compare/tms-vs-ect/" class="text-sm text-blue-700 hover:underline">TMS vs. ECT</a>
    <a href="/compare/tms-vs-antidepressants/" class="text-sm text-blue-700 hover:underline">TMS vs. Medication</a>
    <a href="/compare/tms-vs-ketamine/" class="text-sm text-blue-700 hover:underline">TMS vs. Ketamine</a>
    <a href="/compare/neurostar-vs-brainsway/" class="text-sm text-blue-700 hover:underline">NeuroStar vs. BrainsWay</a>
  </div>
</div>`,
    insurance: `
<div class="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
  <h4 class="font-display font-bold text-amber-900 mb-3 text-base">Related Insurance Guides</h4>
  <div class="grid grid-cols-2 gap-2">
    <a href="/insurance/medicare/" class="text-sm text-amber-700 hover:underline">Medicare Coverage</a>
    <a href="/insurance/bluecross-blueshield/" class="text-sm text-amber-700 hover:underline">BCBS Coverage</a>
    <a href="/insurance/prior-authorization-guide/" class="text-sm text-amber-700 hover:underline">Prior Auth Guide</a>
    <a href="/tms-cost-guide/" class="text-sm text-amber-700 hover:underline">TMS Cost Guide</a>
  </div>
</div>`,
    protocols: `
<div class="not-prose my-8 bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
  <h4 class="font-display font-bold text-cyan-900 mb-3 text-base">Related Protocols</h4>
  <div class="grid grid-cols-2 gap-2">
    <a href="/protocols/theta-burst-stimulation/" class="text-sm text-cyan-700 hover:underline">Theta Burst</a>
    <a href="/protocols/saint-protocol/" class="text-sm text-cyan-700 hover:underline">SAINT Protocol</a>
    <a href="/protocols/deep-tms/" class="text-sm text-cyan-700 hover:underline">Deep TMS</a>
    <a href="/protocols/accelerated-tms/" class="text-sm text-cyan-700 hover:underline">Accelerated TMS</a>
  </div>
</div>`,
    providers: `
<div class="not-prose my-8 bg-violet-50 border border-violet-200 rounded-2xl p-6">
  <h4 class="font-display font-bold text-violet-900 mb-3 text-base">Find TMS Providers</h4>
  <div class="grid grid-cols-2 gap-2">
    <a href="/us/" class="text-sm text-violet-700 hover:underline">Find a Clinic</a>
    <a href="/providers/hospital-based/" class="text-sm text-violet-700 hover:underline">Hospital-Based TMS</a>
    <a href="/providers/private-practice/" class="text-sm text-violet-700 hover:underline">Private Practice TMS</a>
    <a href="/quiz/am-i-a-candidate/" class="text-sm text-violet-700 hover:underline">Am I a Candidate?</a>
  </div>
</div>`,
  };
  return links[category] || links.providers;
}

function expandFile(filePath: string, relPath: string) {
  if (SKIP_FILES.has(relPath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const wordCount = countWords(content);

  if (wordCount >= MIN_WORDS) {
    return;
  }

  const category = relPath.split('/')[0];
  const wordsNeeded = MIN_WORDS - wordCount;

  // Parse file
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return;

  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // Extract title
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const title = titleMatch?.[1] || 'this topic';

  // Add visual elements based on what's missing
  const hasCTA = body.includes('not-prose') && body.includes('rounded-2xl');
  const hasTable = body.includes('<table') || body.includes('|---|');

  // Add related links section if not present
  if (!body.includes('Related')) {
    body += '\n\n---\n' + buildRelatedLinks(category);
  }

  // Add CTA if not present
  if (!hasCTA) {
    body += '\n' + buildClinicCTA();
  }

  // Add expanded content sections based on category
  if (wordsNeeded > 200) {
    const expansions = getExpansionContent(category, title, wordsNeeded);
    body += '\n\n' + expansions;
  }

  const newContent = `---\n${frontmatter}\n---\n${body}`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  const newWordCount = countWords(newContent);
  console.log(`✅ ${relPath}: ${wordCount} → ${newWordCount} words (+${newWordCount - wordCount})`);
}

function getExpansionContent(category: string, title: string, wordsNeeded: number): string {
  const sections: string[] = [];

  if (category === 'comparisons') {
    sections.push(`
## Making Your Decision

Choosing between treatments is personal. The right option depends on your specific diagnosis, treatment history, insurance coverage, schedule, and preferences. Here's a framework:

<div class="not-prose my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
    <h4 class="font-semibold text-emerald-900 text-sm mb-2">When TMS May Be Better</h4>
    <ul class="text-xs text-emerald-700 space-y-1 mb-0 list-disc pl-4">
      <li>You want an FDA-cleared, insurance-covered treatment</li>
      <li>No sedation, no cognitive effects, drive yourself home</li>
      <li>Looking for durable results after a defined treatment course</li>
      <li>You prefer non-pharmacological approaches</li>
    </ul>
  </div>
  <div class="bg-blue-50 border border-blue-100 rounded-xl p-5">
    <h4 class="font-semibold text-blue-900 text-sm mb-2">Questions to Ask Your Provider</h4>
    <ul class="text-xs text-blue-700 space-y-1 mb-0 list-disc pl-4">
      <li>Which treatment do you recommend for my specific situation?</li>
      <li>What are the realistic outcomes I can expect?</li>
      <li>What does my insurance cover?</li>
      <li>Can these treatments be combined?</li>
    </ul>
  </div>
</div>

### The Bottom Line

No single treatment works for everyone. The goal is finding the right match for your brain, your symptoms, and your life. If one option doesn't work, others may. Many of these treatments can be combined or sequenced for better results.

Start with a thorough evaluation from a psychiatrist who understands multiple treatment modalities — not just the one they happen to offer. Use our [clinic finder](/us/) to find experienced providers, or take our [candidacy quiz](/quiz/am-i-a-candidate/) to start the process.`);
  }

  if (category === 'insurance') {
    sections.push(`
## How to Get TMS Approved

<div class="not-prose my-8 space-y-3">
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-xs shrink-0">1</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Verify Benefits</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">Call the number on the back of your insurance card and ask specifically about TMS therapy coverage. Get a reference number.</p>
    </div>
  </div>
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-xs shrink-0">2</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Get Your Documentation Ready</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">Gather records of your MDD diagnosis, all medication trials (names, doses, durations, outcomes), current PHQ-9 score, and therapy history.</p>
    </div>
  </div>
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-xs shrink-0">3</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Choose a TMS Clinic</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">Find an in-network TMS provider using our <a href="/us/" class="text-amber-600 hover:underline">clinic directory</a>. In-network clinics handle prior auth and know your insurer's requirements.</p>
    </div>
  </div>
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-xs shrink-0">4</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Prior Authorization</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">Your TMS clinic submits the prior auth request. Typical approval takes 5-15 business days. If denied, appeal — overturn rates are 60-70%.</p>
    </div>
  </div>
</div>

## What If You're Denied?

<div class="not-prose my-8 bg-red-50 border border-red-200 rounded-xl p-5">
  <h4 class="font-semibold text-red-800 text-sm mb-2">Don't give up after a denial</h4>
  <p class="text-sm text-red-700 mb-3">TMS denial overturn rates are <strong>60-70%</strong> on appeal. Steps to take:</p>
  <ul class="text-sm text-red-700 space-y-1 mb-0 list-disc pl-4">
    <li><strong>Request a peer-to-peer review</strong> — your psychiatrist talks directly to the insurer's medical director</li>
    <li><strong>Submit additional documentation</strong> addressing the specific denial reason</li>
    <li><strong>File a formal appeal</strong> with your state insurance department if internal appeals fail</li>
    <li><strong>External review</strong> — most states allow independent external review of coverage denials</li>
  </ul>
</div>

For more details, see our [Prior Authorization Guide](/insurance/prior-authorization-guide/) and [Denied Coverage Appeals](/insurance/denied-coverage-appeals/) guide.`);
  }

  if (category === 'protocols') {
    sections.push(`
## How This Protocol Compares

<div class="not-prose my-8">
<table class="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
  <thead>
    <tr class="bg-slate-800 text-white">
      <th class="px-4 py-3 text-left font-semibold">Protocol</th>
      <th class="px-4 py-3 text-center font-semibold">Session Time</th>
      <th class="px-4 py-3 text-center font-semibold">Total Course</th>
      <th class="px-4 py-3 text-center font-semibold">Best For</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-slate-200">
    <tr class="bg-white"><td class="px-4 py-3 font-medium text-slate-900">Standard rTMS</td><td class="px-4 py-3 text-center">19-37 min</td><td class="px-4 py-3 text-center">6-9 weeks</td><td class="px-4 py-3 text-center">Depression (most studied)</td></tr>
    <tr class="bg-slate-50"><td class="px-4 py-3 font-medium text-slate-900">Theta Burst</td><td class="px-4 py-3 text-center">3-9 min</td><td class="px-4 py-3 text-center">6-9 weeks</td><td class="px-4 py-3 text-center">Depression (time-efficient)</td></tr>
    <tr class="bg-white"><td class="px-4 py-3 font-medium text-slate-900">SAINT Protocol</td><td class="px-4 py-3 text-center">Multiple/day</td><td class="px-4 py-3 text-center">5 days</td><td class="px-4 py-3 text-center">Rapid response needed</td></tr>
    <tr class="bg-slate-50"><td class="px-4 py-3 font-medium text-slate-900">Deep TMS</td><td class="px-4 py-3 text-center">20-30 min</td><td class="px-4 py-3 text-center">6 weeks</td><td class="px-4 py-3 text-center">OCD, smoking cessation</td></tr>
  </tbody>
</table>
</div>

## Finding a Provider

Not every TMS clinic offers every protocol. When searching, ask specifically which protocols they support and which devices they use. Our [clinic directory](/us/) helps you find experienced providers in your area. For protocol-specific questions, the treating psychiatrist should be able to explain why they recommend one approach over another for your situation.`);
  }

  if (category === 'providers' || category === 'demographics') {
    sections.push(`
## How to Choose the Right Provider

Finding the right TMS provider involves more than just proximity. Here's what to evaluate:

<div class="not-prose my-8 space-y-3">
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-600 font-bold text-xs shrink-0">1</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Check Credentials</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">A board-certified psychiatrist should oversee your treatment. The clinic should use FDA-cleared devices and have manufacturer-trained technicians.</p>
    </div>
  </div>
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-600 font-bold text-xs shrink-0">2</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Ask About Experience</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">How many patients has this clinic treated with TMS? What are their response and remission rates? Can they share their outcome data?</p>
    </div>
  </div>
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-600 font-bold text-xs shrink-0">3</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Verify Insurance</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">Confirm they accept your insurance and have experience with prior authorization for TMS. In-network clinics simplify the approval process significantly.</p>
    </div>
  </div>
  <div class="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-600 font-bold text-xs shrink-0">4</span>
    <div>
      <div class="font-semibold text-slate-900 text-sm">Read Reviews</div>
      <p class="text-xs text-slate-500 mt-1 mb-0">Check Google, Healthgrades, and our <a href="/us/" class="text-violet-600 hover:underline">clinic directory</a> for patient reviews. Look for specific mentions of TMS experience.</p>
    </div>
  </div>
</div>

## What to Expect at Your First Visit

Your initial consultation typically includes a psychiatric evaluation, review of your treatment history, discussion of TMS candidacy, and insurance verification. Most clinics offer free consultations. The clinic will handle prior authorization if you move forward with treatment.

Use our [clinic finder](/us/) to browse verified TMS providers by location, or take our [candidacy quiz](/quiz/am-i-a-candidate/) to see if TMS might be right for you.`);
  }

  if (category === 'commercial') {
    sections.push(`
## Getting Started

<div class="not-prose my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="bg-amber-50 border border-amber-100 rounded-xl p-5">
    <h4 class="font-semibold text-amber-900 text-sm mb-2">For TMS Clinics</h4>
    <p class="text-xs text-amber-700 mb-2">List your clinic on TMS List to reach patients actively searching for treatment.</p>
    <a href="/providers/services/get-listed/" class="text-xs text-amber-600 font-semibold hover:underline">Get Listed →</a>
  </div>
  <div class="bg-violet-50 border border-violet-100 rounded-xl p-5">
    <h4 class="font-semibold text-violet-900 text-sm mb-2">For Patients</h4>
    <p class="text-xs text-violet-700 mb-2">Browse our directory of verified TMS providers with real reviews and insurance info.</p>
    <a href="/us/" class="text-xs text-violet-600 font-semibold hover:underline">Find a Clinic →</a>
  </div>
</div>

## Why TMS List?

TMS List is the most comprehensive TMS therapy directory worldwide, connecting patients with verified providers across ${20}+ countries. We don't accept payment to influence rankings, all reviews come from real patients, and clinic information is regularly verified.

Whether you're a patient researching treatment or a clinic looking to grow, our platform helps match the right people with the right providers. [Contact us](/contact/) to learn more about how we can help.`);
  }

  if (category === 'legal') {
    sections.push(`
## Additional Resources

<div class="not-prose my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="bg-slate-50 border border-slate-200 rounded-xl p-5">
    <h4 class="font-semibold text-slate-900 text-sm mb-2">For Clinic Operators</h4>
    <ul class="text-xs text-slate-600 space-y-1 mb-0 list-disc pl-4">
      <li><a href="/legal/tms-cpt-codes-guide-2026/" class="text-violet-600 hover:underline">CPT Codes Guide 2026</a></li>
      <li><a href="/legal/tms-malpractice-insurance-guide/" class="text-violet-600 hover:underline">Malpractice Insurance Guide</a></li>
      <li><a href="/legal/starting-a-tms-clinic-requirements-by-state/" class="text-violet-600 hover:underline">Starting a TMS Clinic</a></li>
      <li><a href="/providers/services/billing-services/" class="text-violet-600 hover:underline">TMS Billing Services</a></li>
    </ul>
  </div>
  <div class="bg-slate-50 border border-slate-200 rounded-xl p-5">
    <h4 class="font-semibold text-slate-900 text-sm mb-2">For Patients</h4>
    <ul class="text-xs text-slate-600 space-y-1 mb-0 list-disc pl-4">
      <li><a href="/insurance/prior-authorization-guide/" class="text-violet-600 hover:underline">Prior Authorization Guide</a></li>
      <li><a href="/insurance/denied-coverage-appeals/" class="text-violet-600 hover:underline">Appealing Coverage Denials</a></li>
      <li><a href="/quiz/insurance-eligibility-checker/" class="text-violet-600 hover:underline">Insurance Eligibility Checker</a></li>
      <li><a href="/tms-cost-guide/" class="text-violet-600 hover:underline">TMS Cost Guide</a></li>
    </ul>
  </div>
</div>

For questions about specific legal or regulatory requirements in your state, consult with a healthcare attorney familiar with neuromodulation practices. The legal landscape for TMS is evolving rapidly as the technology becomes more mainstream.`);
  }

  return sections.join('\n\n');
}

// Process all files
const allFiles = getFiles(CONTENT_DIR);
let expanded = 0;
let skipped = 0;

for (const file of allFiles) {
  const content = fs.readFileSync(file.path, 'utf-8');
  const wordCount = countWords(content);

  if (wordCount >= MIN_WORDS || SKIP_FILES.has(file.relPath)) {
    skipped++;
    continue;
  }

  expandFile(file.path, file.relPath);
  expanded++;
}

console.log(`\nDone! Expanded ${expanded} files. Skipped ${skipped}.`);
