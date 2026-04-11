/**
 * Enriches comparison markdown files with visual HTML components.
 * Run: npx tsx scripts/enrich-comparison-content.ts
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src/content/comparisons');

const COMPARISON_META: Record<string, {
  treatmentA?: string;
  treatmentB?: string;
  verdict?: string;
  verdictWinner?: string;
  faqs: { question: string; answer: string }[];
}> = {
  'tms-vs-ect': {
    treatmentA: 'TMS', treatmentB: 'ECT',
    verdict: 'TMS is preferred for most treatment-resistant depression cases due to fewer side effects and no anesthesia requirement. ECT remains the gold standard for severe, life-threatening depression or when rapid response is critical.',
    verdictWinner: 'TMS for most patients',
    faqs: [
      { question: 'Which is more effective — TMS or ECT?', answer: 'ECT has higher remission rates (50-70%) compared to TMS (30-35%). However, TMS has far fewer side effects and no memory loss risk. The choice depends on severity and urgency.' },
      { question: 'Does TMS cause memory loss like ECT?', answer: 'No. TMS does not cause memory loss. ECT can cause temporary (and occasionally longer-lasting) memory difficulties, which is one of the main reasons patients prefer TMS.' },
    ]
  },
  'tms-vs-ketamine': {
    treatmentA: 'TMS', treatmentB: 'Ketamine',
    verdict: 'TMS offers longer-lasting results with a better-established safety profile. Ketamine works faster (hours vs weeks) but requires ongoing sessions to maintain benefits and has abuse potential.',
    verdictWinner: 'Depends on urgency',
    faqs: [
      { question: 'Which works faster?', answer: 'Ketamine can produce improvement within hours. TMS typically takes 2-3 weeks. For acute crisis situations, ketamine may be preferred; for sustained treatment, TMS has stronger durability data.' },
      { question: 'Can I do both?', answer: 'Yes. Some clinics combine TMS and ketamine for patients with severe treatment-resistant depression. Emerging evidence suggests the combination may be more effective than either alone.' },
    ]
  },
  'tms-vs-antidepressants': {
    treatmentA: 'TMS', treatmentB: 'Antidepressants',
    verdict: 'Antidepressants remain first-line treatment. TMS is recommended when 2+ medications have failed, offering comparable or better response rates without systemic side effects like weight gain, sexual dysfunction, or emotional blunting.',
    verdictWinner: 'TMS for treatment-resistant cases',
    faqs: [
      { question: "Should I try TMS before medication?", answer: "Typically no. Antidepressants are first-line because they're accessible, affordable, and effective for many. TMS is recommended after 2+ medication failures, though some patients choose it as a first option (usually self-pay)." },
      { question: 'Can I take medication during TMS?', answer: 'Yes — most patients continue their antidepressants during TMS. The combination may be more effective than either alone.' },
    ]
  },
  'tms-vs-cbt': {
    treatmentA: 'TMS', treatmentB: 'CBT',
    verdict: "CBT and TMS target depression through different mechanisms. CBT changes thought patterns; TMS changes brain activity. They're complementary, not competing — the best outcomes often come from combining both.",
    faqs: [
      { question: "Can I do therapy and TMS at the same time?", answer: "Absolutely. Many clinicians recommend combining TMS with therapy. TMS may actually make therapy more effective by improving the brain's capacity for learning and emotional processing." },
    ]
  },
  'neurostar-vs-brainsway': {
    treatmentA: 'NeuroStar', treatmentB: 'BrainsWay',
    verdict: 'Both are FDA-cleared and effective. NeuroStar uses a focused figure-8 coil (precise targeting), while BrainsWay uses an H-coil (broader, deeper stimulation). NeuroStar is more widely available; BrainsWay is the only option cleared for OCD.',
    faqs: [
      { question: "Which device has better outcomes?", answer: "Head-to-head studies show comparable depression outcomes. The choice often depends on what conditions you're treating (BrainsWay for OCD) and clinic availability." },
      { question: 'Does BrainsWay hurt more?', answer: 'Some patients report the H-coil sensation is more diffuse than the focused figure-8 coil. Neither is considered painful by most patients after the first few sessions.' },
    ]
  },
  'tms-vs-psychotherapy': {
    treatmentA: 'TMS', treatmentB: 'Psychotherapy',
    faqs: [
      { question: 'Is TMS a replacement for therapy?', answer: 'No. TMS addresses the neurological component of depression. Therapy addresses cognitive patterns, coping skills, and life circumstances. They work on different levels and complement each other.' },
    ]
  },
  'tms-vs-esketamine': {
    treatmentA: 'TMS', treatmentB: 'Esketamine (Spravato)',
    verdict: "Both are FDA-cleared for treatment-resistant depression. TMS has no abuse potential and doesn't require in-office monitoring. Spravato works faster but requires supervised administration and ongoing maintenance.",
    faqs: [
      { question: 'Which is easier to access?', answer: 'TMS is more widely available. Spravato requires REMS-certified clinics and 2-hour monitoring after each dose due to dissociation risk.' },
    ]
  },
  'deep-tms-vs-rtms': {
    treatmentA: 'Deep TMS', treatmentB: 'Standard rTMS',
    verdict: 'Standard rTMS is more widely available and has a longer track record. Deep TMS reaches deeper brain structures and is the only option for FDA-cleared OCD treatment. For depression, outcomes are comparable.',
    faqs: [
      { question: 'Is deep TMS better than standard TMS?', answer: 'Not necessarily better — different. Deep TMS reaches broader and deeper brain regions, which matters for OCD. For depression, both approaches have similar efficacy.' },
    ]
  },
  'tms-vs-vns': {
    treatmentA: 'TMS', treatmentB: 'VNS (Vagus Nerve Stimulation)',
    faqs: [
      { question: 'How are TMS and VNS different?', answer: 'TMS is non-invasive (external coil). VNS requires surgical implantation of a device. TMS works faster (weeks vs months for VNS). VNS is typically reserved for the most treatment-resistant cases.' },
    ]
  },
  'tms-vs-dbs': {
    treatmentA: 'TMS', treatmentB: 'DBS (Deep Brain Stimulation)',
    faqs: [
      { question: "When is DBS considered over TMS?", answer: "DBS is a last-resort surgical option for the most severe, treatment-resistant cases. TMS should be tried first as it's non-invasive and reversible. DBS involves permanent electrode implantation." },
    ]
  },
  'theta-burst-vs-standard-tms': {
    treatmentA: 'Theta Burst (iTBS)', treatmentB: 'Standard rTMS (10 Hz)',
    verdict: 'Both are equally effective for depression (proven in the THREE-D trial). Theta burst takes 3-9 minutes vs 19-37 for standard. Choose theta burst if session time matters; choose standard if your clinic has more experience with it.',
    verdictWinner: 'Equally effective',
    faqs: [
      { question: 'Is theta burst as effective as standard TMS?', answer: 'Yes. The THREE-D trial (2018, Lancet) showed iTBS was non-inferior to standard 10 Hz rTMS for treatment-resistant depression.' },
      { question: "Why would anyone choose the longer protocol?", answer: "Some clinics have more experience with standard rTMS. Some patients prefer the longer, gentler session. And some insurers haven't updated policies to cover theta burst yet." },
    ]
  },
};

function enrichFile(filename: string) {
  const slug = filename.replace('.md', '');
  const meta = COMPARISON_META[slug];

  const filepath = path.join(DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.log(`⚠ Could not parse ${filename}`);
    return;
  }

  let frontmatter = fmMatch[1];
  const body = fmMatch[2];

  if (meta) {
    if (!frontmatter.includes('treatmentA:') && meta.treatmentA) {
      frontmatter += `\ntreatmentA: "${meta.treatmentA}"`;
    }
    if (!frontmatter.includes('treatmentB:') && meta.treatmentB) {
      frontmatter += `\ntreatmentB: "${meta.treatmentB}"`;
    }
    if (!frontmatter.includes('verdict:') && meta.verdict) {
      frontmatter += `\nverdict: "${meta.verdict.replace(/"/g, '\\"')}"`;
    }
    if (!frontmatter.includes('verdictWinner:') && meta.verdictWinner) {
      frontmatter += `\nverdictWinner: "${meta.verdictWinner}"`;
    }
    if (!frontmatter.includes('faqs:') && meta.faqs.length > 0) {
      frontmatter += '\nfaqs:';
      for (const faq of meta.faqs) {
        frontmatter += `\n  - question: "${faq.question.replace(/"/g, '\\"')}"`;
        frontmatter += `\n    answer: "${faq.answer.replace(/"/g, '\\"')}"`;
      }
    }
  }

  const newContent = `---\n${frontmatter}\n---\n${body}`;
  fs.writeFileSync(filepath, newContent, 'utf-8');
  console.log(`✅ Enriched ${filename}`);
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
for (const file of files) {
  enrichFile(file);
}
console.log('\nDone! All comparison files enriched.');
