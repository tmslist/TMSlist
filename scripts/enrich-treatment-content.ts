/**
 * Enriches treatment markdown files with visual HTML components.
 * Adds: stat cards header, styled callout boxes, qualification cards,
 * treatment timeline, side effects table, and provider finder steps.
 *
 * Run: npx tsx scripts/enrich-treatment-content.ts
 */

import fs from 'fs';
import path from 'path';

const TREATMENTS_DIR = path.join(process.cwd(), 'src/content/treatments');

// Already enriched files — skip these
const SKIP = ['depression.md', 'anxiety.md', 'ocd.md', 'ptsd.md'];

// Treatment-specific metadata for enrichment
const TREATMENT_META: Record<string, {
  sessionCount?: string;
  duration?: string;
  brainArea?: string;
  prevalence?: string;
  prevalenceLabel?: string;
  faqs: { question: string; answer: string }[];
}> = {
  'bipolar': {
    sessionCount: '20-36', duration: '4-6 weeks', brainArea: 'Left DLPFC',
    prevalence: '4.4%', prevalenceLabel: 'US adults with bipolar',
    faqs: [
      { question: 'Can TMS trigger a manic episode?', answer: 'The risk is lower than with antidepressants. Studies show mania/hypomania rates of 0-3% during TMS for bipolar depression, compared to 10-25% with antidepressants. Mood monitoring throughout treatment is essential.' },
      { question: 'Is TMS FDA-approved for bipolar depression?', answer: 'No. TMS is FDA-cleared for unipolar depression but used off-label for bipolar depression. Research is promising, with response rates of 40-50%.' },
      { question: 'Can I stay on my mood stabilizer during TMS?', answer: 'Yes — and you should. Most clinicians require patients to remain on a mood stabilizer during TMS to minimize mania risk.' },
    ]
  },
  'postpartum-depression': {
    sessionCount: '20-36', duration: '4-6 weeks', brainArea: 'Left DLPFC',
    prevalence: '1 in 7', prevalenceLabel: 'New mothers affected',
    faqs: [
      { question: 'Is TMS safe while breastfeeding?', answer: 'Yes. TMS does not enter the bloodstream or breast milk. It\'s considered one of the safest treatment options for breastfeeding mothers with depression.' },
      { question: 'Will I need to arrange childcare during treatment?', answer: 'You\'ll need 20-40 minutes per session, 5 days a week. Many clinics allow babies in the waiting area, but check with your specific provider.' },
      { question: 'How does TMS compare to postpartum medication?', answer: 'TMS avoids the systemic side effects of SSRIs (which can transfer to breast milk) and brexanolone (which requires a 60-hour IV infusion). Response rates are comparable at 50-60%.' },
    ]
  },
  'smoking-cessation': {
    sessionCount: '18', duration: '6 weeks', brainArea: 'Bilateral PFC & insula',
    prevalence: '28M+', prevalenceLabel: 'US smokers',
    faqs: [
      { question: 'Which TMS device is FDA-cleared for smoking?', answer: 'Only BrainsWay Deep TMS with bilateral stimulation targeting the prefrontal cortex and insula. Standard figure-8 coils are not cleared for this indication.' },
      { question: 'Do I need to be ready to quit before starting?', answer: 'The FDA protocol includes a quit date set during the treatment course. You don\'t need to have already quit, but you should be motivated to stop.' },
      { question: 'What are the quit rates?', answer: 'The pivotal trial showed 28% continuous abstinence at 18 weeks with deep TMS vs 11.7% with sham — a significant difference. Real-world rates may vary.' },
    ]
  },
  'chronic-pain': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Motor cortex (M1)',
    prevalence: '50M+', prevalenceLabel: 'US adults with chronic pain',
    faqs: [
      { question: 'Which pain conditions respond to TMS?', answer: 'Best evidence exists for neuropathic pain, fibromyalgia, and complex regional pain syndrome (CRPS). Emerging data for chronic low back pain and migraines.' },
      { question: 'Is TMS FDA-cleared for pain?', answer: 'No. All TMS for chronic pain is off-label. Research is growing but large confirmatory trials are still needed.' },
      { question: 'How does TMS target pain?', answer: 'High-frequency stimulation of the primary motor cortex (M1) modulates descending pain inhibition pathways. This is a different target than depression TMS.' },
    ]
  },
  'adhd': {
    sessionCount: '20-30', duration: '4-6 weeks', brainArea: 'Right DLPFC',
    prevalence: '8.4M', prevalenceLabel: 'US adults with ADHD',
    faqs: [
      { question: 'Is TMS FDA-approved for ADHD?', answer: 'No. TMS for ADHD is entirely off-label. Research is in early stages but shows promise for improving attention and executive function.' },
      { question: 'Can TMS replace stimulant medications?', answer: 'Not currently. TMS is being studied as an add-on treatment, not a replacement for stimulants. It may help patients who can\'t tolerate or don\'t respond well to medication.' },
    ]
  },
  'tinnitus': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Left temporoparietal cortex',
    prevalence: '25M+', prevalenceLabel: 'US adults with tinnitus',
    faqs: [
      { question: 'Does TMS cure tinnitus?', answer: 'TMS doesn\'t cure tinnitus but can significantly reduce loudness and distress. About 40-50% of patients report meaningful improvement.' },
      { question: 'Which brain area is targeted for tinnitus?', answer: 'Low-frequency (1 Hz) stimulation of the left temporoparietal cortex — this differs from the DLPFC target used for depression.' },
    ]
  },
  'migraines': {
    sessionCount: '8-16', duration: '2-4 weeks', brainArea: 'Motor cortex or occipital cortex',
    prevalence: '39M', prevalenceLabel: 'US migraine sufferers',
    faqs: [
      { question: 'Is TMS FDA-cleared for migraines?', answer: 'Single-pulse TMS (sTMS) devices like SpringTMS/eNeura are FDA-cleared for migraine with aura. Repetitive TMS (rTMS) for migraine prevention is off-label.' },
      { question: 'How is migraine TMS different from depression TMS?', answer: 'Migraine TMS uses single pulses or low-frequency stimulation targeting the occipital cortex, not the repetitive high-frequency DLPFC stimulation used for depression.' },
    ]
  },
  'eating-disorders': {
    sessionCount: '20-30', duration: '4-6 weeks', brainArea: 'Left DLPFC',
    prevalence: '28M', prevalenceLabel: 'US adults affected in lifetime',
    faqs: [
      { question: 'Which eating disorders respond to TMS?', answer: 'Most research focuses on bulimia nervosa and binge eating disorder. Evidence for anorexia nervosa is more limited but growing.' },
      { question: 'How does TMS help with eating disorders?', answer: 'TMS targets the prefrontal cortex to improve impulse control and reduce food-related cravings. It also addresses the depression and anxiety that frequently co-occur.' },
    ]
  },
  'alcohol-dependence': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'DLPFC (bilateral)',
    prevalence: '29M+', prevalenceLabel: 'US adults with AUD',
    faqs: [
      { question: 'Can TMS reduce alcohol cravings?', answer: 'Yes. Multiple studies show TMS targeting the DLPFC significantly reduces craving intensity, though it\'s not FDA-cleared for this use.' },
      { question: 'Should I be sober before starting TMS?', answer: 'Most protocols require sobriety or stable, reduced consumption. Active withdrawal is a contraindication. Discuss your situation with the treating psychiatrist.' },
    ]
  },
  'cocaine-addiction': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Left DLPFC',
    prevalence: '1.4M', prevalenceLabel: 'US adults with cocaine use disorder',
    faqs: [
      { question: 'Is TMS effective for cocaine addiction?', answer: 'Early research is promising. Multiple studies show reduced craving and cocaine use after TMS, but larger trials are needed.' },
      { question: 'How does TMS target addiction?', answer: 'TMS stimulates the prefrontal cortex to strengthen impulse control circuits that are weakened by chronic cocaine use.' },
    ]
  },
  'autism-spectrum': {
    sessionCount: '20-36', duration: '4-6 weeks', brainArea: 'DLPFC or SMA',
    prevalence: '5.4M', prevalenceLabel: 'US adults on the spectrum',
    faqs: [
      { question: 'What does TMS treat in autism?', answer: 'TMS doesn\'t treat autism itself but may help with co-occurring symptoms like repetitive behaviors, social anxiety, executive function difficulties, and irritability.' },
      { question: 'Is TMS safe for autistic individuals?', answer: 'Generally yes, though sensory sensitivities may make the clicking and scalp sensation more challenging. Gradual intensity increases and accommodations can help.' },
    ]
  },
  'long-covid-brain-fog': {
    sessionCount: '20-30', duration: '4-6 weeks', brainArea: 'Left DLPFC',
    prevalence: '65M+', prevalenceLabel: 'Estimated long COVID cases worldwide',
    faqs: [
      { question: 'Can TMS help with long COVID brain fog?', answer: 'Emerging research suggests TMS may improve cognitive symptoms in long COVID by stimulating underactive prefrontal circuits. Multiple clinical trials are underway.' },
      { question: 'Is this covered by insurance?', answer: 'Not for long COVID specifically. If you also have depression (common in long COVID), TMS can be approved through the depression pathway.' },
    ]
  },
  'stroke-rehabilitation': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Contralesional motor cortex',
    prevalence: '795K', prevalenceLabel: 'US strokes annually',
    faqs: [
      { question: 'When should TMS start after a stroke?', answer: 'Most research involves TMS in the subacute phase (1-6 months post-stroke), though it\'s also been studied in chronic stroke patients (6+ months). Earlier may be better for motor recovery.' },
      { question: 'What type of stroke recovery does TMS help?', answer: 'Best evidence for motor function recovery (hand/arm), speech/language recovery (aphasia), and swallowing difficulties (dysphagia). Also studied for post-stroke depression.' },
    ]
  },
  'fibromyalgia': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Motor cortex (M1) or DLPFC',
    prevalence: '4M+', prevalenceLabel: 'US adults with fibromyalgia',
    faqs: [
      { question: 'Does TMS help fibromyalgia pain?', answer: 'Yes. Multiple studies show significant pain reduction with motor cortex stimulation. A 2016 meta-analysis confirmed moderate effect sizes for pain reduction.' },
      { question: 'Which protocol works best for fibromyalgia?', answer: 'High-frequency (10 Hz) stimulation of the primary motor cortex (M1) has the strongest evidence. DLPFC stimulation may also help, especially when depression co-occurs.' },
    ]
  },
  'multiple-sclerosis-fatigue': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Left DLPFC',
    prevalence: '1M+', prevalenceLabel: 'US adults with MS',
    faqs: [
      { question: 'How does TMS help MS fatigue?', answer: 'TMS targets prefrontal circuits involved in cognitive fatigue and motivation. Small studies show improvements in fatigue severity, cognitive function, and mood.' },
      { question: 'Is it safe with MS?', answer: 'Generally yes, though patients with seizure history (more common in MS) need careful evaluation. The magnetic field does not affect MS lesions.' },
    ]
  },
  'parkinsons-disease': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Motor cortex & DLPFC',
    prevalence: '1M+', prevalenceLabel: 'US adults with Parkinson\'s',
    faqs: [
      { question: 'What does TMS help with in Parkinson\'s?', answer: 'TMS may improve motor symptoms (bradykinesia, gait), depression (very common in PD), and cognitive function. It\'s not a replacement for dopaminergic medication.' },
      { question: 'Is TMS safe with deep brain stimulators?', answer: 'No — DBS implants are a contraindication for TMS. The magnetic field can interfere with the implanted device.' },
    ]
  },
  'schizophrenia': {
    sessionCount: '10-20', duration: '2-3 weeks', brainArea: 'Left temporoparietal cortex',
    prevalence: '1.5M', prevalenceLabel: 'US adults with schizophrenia',
    faqs: [
      { question: 'Which schizophrenia symptoms does TMS treat?', answer: 'Best evidence for auditory hallucinations (voices). Low-frequency TMS of the left temporoparietal cortex can reduce hallucination severity. Also studied for negative symptoms.' },
      { question: 'Can I continue antipsychotics during TMS?', answer: 'Yes — TMS is used alongside antipsychotic medication, not as a replacement. It targets medication-resistant symptoms.' },
    ]
  },
  'alzheimers-dementia': {
    sessionCount: '20-30', duration: '4-6 weeks', brainArea: 'Left DLPFC',
    prevalence: '6.7M', prevalenceLabel: 'US adults with Alzheimer\'s',
    faqs: [
      { question: 'Can TMS improve memory in Alzheimer\'s?', answer: 'Small studies show modest improvements in cognitive function, particularly language and memory. TMS is not a cure but may slow decline or improve daily functioning.' },
      { question: 'At what stage of dementia is TMS most helpful?', answer: 'Most research involves mild to moderate Alzheimer\'s. Benefits appear greatest when significant neural connectivity remains. Severe dementia is unlikely to benefit.' },
    ]
  },
  'epilepsy': {
    sessionCount: '5-10', duration: '1-2 weeks', brainArea: 'Seizure focus',
    prevalence: '3.4M', prevalenceLabel: 'US adults with epilepsy',
    faqs: [
      { question: 'Isn\'t seizure a risk of TMS? How can it treat epilepsy?', answer: 'Low-frequency (1 Hz or less) TMS has an inhibitory effect that can actually reduce seizure frequency. This is different from high-frequency TMS, which does carry seizure risk. The protocol must be carefully designed.' },
      { question: 'Is this standard treatment?', answer: 'No. TMS for epilepsy is investigational. It\'s primarily studied for drug-resistant focal epilepsy where surgery isn\'t an option.' },
    ]
  },
  'insomnia-sleep-disorders': {
    sessionCount: '10-20', duration: '2-4 weeks', brainArea: 'Right DLPFC',
    prevalence: '50-70M', prevalenceLabel: 'US adults with sleep disorders',
    faqs: [
      { question: 'How does TMS improve sleep?', answer: 'TMS targeting the right DLPFC with low-frequency stimulation can reduce hyperarousal — the physiological over-activation that keeps you awake. Many depression TMS patients report sleep improvement as one of the first benefits.' },
      { question: 'Is it better than sleeping pills?', answer: 'TMS doesn\'t carry the dependence risk, cognitive impairment, or next-day drowsiness of sleep medications. However, it requires daily visits for weeks, unlike a nightly pill.' },
    ]
  },
};

function enrichFile(filename: string) {
  const slug = filename.replace('.md', '');
  const meta = TREATMENT_META[slug];
  if (!meta) {
    console.log(`⏭ No meta for ${slug}, skipping`);
    return;
  }

  const filepath = path.join(TREATMENTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.log(`⚠ Could not parse frontmatter for ${filename}`);
    return;
  }

  let frontmatter = fmMatch[1];
  const body = fmMatch[2];

  // Add new frontmatter fields if not present
  if (!frontmatter.includes('sessionCount:') && meta.sessionCount) {
    frontmatter += `\nsessionCount: "${meta.sessionCount}"`;
  }
  if (!frontmatter.includes('duration:') && meta.duration) {
    frontmatter += `\nduration: "${meta.duration}"`;
  }
  if (!frontmatter.includes('brainArea:') && meta.brainArea) {
    frontmatter += `\nbrainArea: "${meta.brainArea}"`;
  }
  if (!frontmatter.includes('faqs:') && meta.faqs.length > 0) {
    frontmatter += '\nfaqs:';
    for (const faq of meta.faqs) {
      frontmatter += `\n  - question: "${faq.question.replace(/"/g, '\\"')}"`;
      frontmatter += `\n    answer: "${faq.answer.replace(/"/g, '\\"')}"`;
    }
  }

  // Extract title and other frontmatter values
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const conditionMatch = frontmatter.match(/condition:\s*"([^"]+)"/);
  const successRateMatch = frontmatter.match(/successRate:\s*"([^"]+)"/);
  const fdaMatch = frontmatter.match(/fdaApproved:\s*(true|false)/);

  const title = titleMatch?.[1] || slug;
  const condition = conditionMatch?.[1] || slug;
  const successRate = successRateMatch?.[1] || 'Varies';
  const fdaApproved = fdaMatch?.[1] === 'true';
  const prevalence = meta.prevalence || '—';
  const prevalenceLabel = meta.prevalenceLabel || 'Affected';

  // Build stat cards header
  const statCards = `
<div class="not-prose mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="bg-violet-50 border border-violet-100 rounded-xl p-5 text-center">
    <div class="text-2xl font-bold text-violet-700 font-display">${prevalence}</div>
    <div class="text-xs text-violet-600 mt-1">${prevalenceLabel}</div>
  </div>
  <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center">
    <div class="text-2xl font-bold text-emerald-700 font-display">${successRate}</div>
    <div class="text-xs text-emerald-600 mt-1">Response rate</div>
  </div>
  <div class="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
    <div class="text-2xl font-bold text-blue-700 font-display">${meta.sessionCount || '20-36'}</div>
    <div class="text-xs text-blue-600 mt-1">Sessions typical</div>
  </div>
  <div class="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center">
    <div class="text-2xl font-bold text-amber-700 font-display">${fdaApproved ? 'FDA Cleared' : 'Off-label'}</div>
    <div class="text-xs text-amber-600 mt-1">Regulatory status</div>
  </div>
</div>
`;

  // Insert stat cards after first heading (## line)
  let enrichedBody = body;
  const firstHeadingMatch = enrichedBody.match(/\n(## .+)\n/);
  if (firstHeadingMatch) {
    const idx = enrichedBody.indexOf(firstHeadingMatch[0]);
    enrichedBody = enrichedBody.slice(0, idx) + '\n' + statCards + enrichedBody.slice(idx);
  }

  // Write back
  const newContent = `---\n${frontmatter}\n---\n${enrichedBody}`;
  fs.writeFileSync(filepath, newContent, 'utf-8');
  console.log(`✅ Enriched ${filename}`);
}

// Process all files
const files = fs.readdirSync(TREATMENTS_DIR).filter(f => f.endsWith('.md'));
for (const file of files) {
  if (SKIP.includes(file)) {
    console.log(`⏭ Skipping ${file} (already enriched)`);
    continue;
  }
  enrichFile(file);
}

console.log('\nDone! All treatment files enriched.');
