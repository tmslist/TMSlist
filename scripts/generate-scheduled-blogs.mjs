#!/usr/bin/env node
/**
 * generate-scheduled-blogs.mjs
 *
 * Generates scheduled blog posts for May–December 2026 using the AI
 * blog-generation endpoint, writes markdown files to src/content/blog/,
 * and optionally triggers a Vercel redeployment via deploy hook.
 *
 * Usage:
 *   node scripts/generate-scheduled-blogs.mjs              # generate ALL posts
 *   node scripts/generate-scheduled-blogs.mjs --dry-run   # preview what would run
 *   node scripts/generate-scheduled-blogs.mjs --month=5    # only May 2026 posts
 *   node scripts/generate-scheduled-blogs.mjs --deploy     # also trigger Vercel rebuild
 *
 * Required env vars (optional — will prompt if missing):
 *   AI_API_URL   — your deployed site URL, e.g. https://tmslist.com
 *   VERCEL_DEPLOY_HOOK_URL — deploy hook URL from Vercel dashboard → Settings → Git
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'src/content/blog');

// ── Parse args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.startsWith('--') ? a.slice(2).split('=') : [a, true];
    return [k, v];
  })
);

const DRY_RUN = args['dry-run'] === true;
const MONTH_FILTER = args.month ? parseInt(args.month, 10) : null;
const SHOULD_DEPLOY = args.deploy === true;

const AI_API_URL = process.env.AI_API_URL || '';
const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK_URL || '';

// ── Load manifest ────────────────────────────────────────────────────────────────

let manifest;
try {
  const { SCHEDULED_POSTS } = await import('./blog-scheduler-manifest.js').catch(() =>
    import('./blog-scheduler-manifest.ts')
  );
  manifest = SCHEDULED_POSTS;
} catch {
  console.error('❌  Could not load scripts/blog-scheduler-manifest.ts');
  console.error('    Make sure you run this script from the project root.');
  process.exit(1);
}

// Filter by month if requested
const postsToGenerate = MONTH_FILTER
  ? manifest.filter((p) => new Date(p.publishDate).getMonth() + 1 === MONTH_FILTER)
  : manifest;

if (postsToGenerate.length === 0) {
  console.log(`\n  No posts scheduled for month ${MONTH_FILTER}.`);
  process.exit(0);
}

// ── Helper: HTTP fetch (works in Node.js 18+) ─────────────────────────────────

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Helper: generate AI content via deployed endpoint ──────────────────────────

async function generateContent(post) {
  if (!AI_API_URL) {
    // No API — generate a fallback skeleton so posts still get created
    console.warn(`\n  ⚠  AI_API_URL not set. Using fallback content for "${post.title}"`);
    return generateFallbackContent(post);
  }

  const payload = {
    type: post.type || 'treatment_guide',
    condition: post.condition || post.title,
    topic: post.topic || post.title,
    insurance: post.insurance || undefined,
    city: post.city || undefined,
    state: post.state || undefined,
    clinicCount: post.clinicCount || undefined,
  };

  // Remove undefined keys
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  try {
    const { status, body } = await fetchJson(`${AI_API_URL}/api/ai/blog-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TMSList-BlogScheduler/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (status === 401) {
      console.warn(`  ⚠  Unauthorized — check your admin session / API key`);
      return generateFallbackContent(post);
    }
    if (status !== 200 || !body.content) {
      console.warn(`  ⚠  AI endpoint returned ${status} — using fallback`);
      return generateFallbackContent(post);
    }

    return { content: htmlToMarkdown(body.content), slug: body.slug || post.slug };
  } catch (err) {
    console.warn(`  ⚠  AI fetch failed (${err.message}) — using fallback`);
    return generateFallbackContent(post);
  }
}

// ── Helper: convert basic HTML to Markdown ─────────────────────────────────────

function htmlToMarkdown(html) {
  if (!html) return '';
  return html
    // Headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, t) => `\n# ${stripTags(t)}\n`)
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, t) => `\n## ${stripTags(t)}\n`)
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_, t) => `\n### ${stripTags(t)}\n`)
    // Lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, t) => `- ${stripTags(t)}\n`)
    .replace(/<\/?ul[^>]*>/gi, '\n')
    .replace(/<\/?ol[^>]*>/gi, '\n')
    // Paragraphs & line breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, (_, t) => `\n${stripTags(t).trim()}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    // Bold / italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Links
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```')
    // Blockquote
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

// ── Helper: generate high-quality fallback content ───────────────────────────────

function generateFallbackContent(post) {
  const { title, description, slug, type, condition } = post;

  const contentMap = {
    treatment_guide: `
## What Is ${condition || title.split('TMS for ')[1] || 'This Condition'}?

${description}

Transcranial magnetic stimulation (TMS) is a non-invasive procedure that uses magnetic fields to stimulate nerve cells in the brain. It has been FDA-cleared for major depressive disorder and is increasingly used off-label for a range of neuropsychiatric conditions.

## How Does TMS Work for This Condition?

During a TMS session, an electromagnetic coil is placed against the scalp near the forehead. The device generates magnetic pulses that pass through the skull and stimulate the dorsolateral prefrontal cortex (DLPFC) — the brain region often underactive in depression and related conditions.

For many conditions beyond depression, TMS is applied to additional targets based on the symptom profile:

- **Motor cortex** — for pain conditions and motor recovery
- **Prefrontal cortex** — for anxiety, OCD, PTSD, and cognitive symptoms
- **Parietal cortex** — for attention and sensory processing symptoms

A typical TMS protocol involves 5 sessions per week for 4–6 weeks, with each session lasting 20–40 minutes. Newer accelerated protocols, like Stanford's SAINT, can compress treatment into 5 days with comparable or superior outcomes.

## Clinical Evidence

Clinical trials for TMS across various conditions have grown substantially. For most conditions discussed in this guide, there is emerging or supportive evidence, though FDA clearance varies:

| Condition | TMS Evidence | FDA Status |
|---|---|---|
| Major Depressive Disorder | Strong — multiple RCTs | ✅ Cleared |
| OCD | Moderate — pivotal trials | ✅ Cleared (Deep TMS) |
| Migraine | Moderate — RCTs | ✅ Cleared (sTMS) |
| Anxiety (GAD) | Emerging | Off-label |
| PTSD | Emerging | Off-label |
| Bipolar Depression | Limited — requires monitoring | Off-label |
| Chronic Pain | Moderate | Off-label |
| ADHD | Early-stage trials | Off-label |

*Note: FDA clearance status is current as of 2026. Off-label use is legal and common when prescribed by a qualified physician.*

## What to Expect During Treatment

1. **Consultation** — Your TMS physician will review your history, confirm diagnosis, and establish a motor threshold.
2. **Mapping session** — The optimal stimulation target is identified using either anatomical landmarks or neuronavigation.
3. **Acute phase** — 20–36 sessions over 6–9 weeks (standard protocol) or 1–2 weeks (accelerated protocol).
4. **Maintenance** — Some patients benefit from periodic booster sessions or ongoing maintenance TMS.

Side effects are generally mild and include:

- Scalp discomfort or headache (most common, usually resolves)
- Brief facial twitching during stimulation
- Fatigue after sessions (usually transient)
- For patients with bipolar disorder: monitoring for manic symptoms

## How to Find a Provider

Not all TMS clinics offer treatment for every condition. When searching for a provider:

- Ask if they have experience treating your specific condition
- Inquire about the device they use (different devices have different线圈 configurations)
- Check whether they offer neuronavigation for precise targeting
- Confirm their experience with accelerated protocols if you prefer those

Use [TMS List](https://tmslist.com) to find certified TMS clinics near you.

## Frequently Asked Questions

**Is TMS covered by insurance for this condition?**

Insurance coverage varies. TMS is most consistently covered for treatment-resistant major depressive disorder. Coverage for off-label conditions like anxiety, PTSD, or chronic pain depends on your specific insurer and plan. Check our [insurance guide](/blog/) for detailed information.

**How long does it take to see results?**

Most patients notice improvement within 2–3 weeks of starting treatment, though some feel better sooner, particularly with accelerated protocols.

**Is TMS safe?**

TMS has an excellent safety profile. Unlike electroconvulsive therapy (ECT), it does not require sedation and does not cause memory problems. The most common side effects are mild scalp discomfort and transient headaches.

**Can I continue my medication during TMS?**

Yes. TMS is often used alongside ongoing medication regimens. In fact, some patients continue antidepressants during TMS treatment. Your prescribing physician will determine the best approach for your situation.

---

*This article is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider before starting any new treatment. TMS List does not guarantee the accuracy or completeness of this content.*
`,
    insurance_guide: `
## Does Your Insurance Cover TMS Therapy?

${description}

Insurance coverage for TMS therapy varies significantly by insurer, plan type, and state of residence. This guide helps you understand the current coverage landscape and navigate the prior authorization process.

## Understanding TMS Coverage Requirements

Most commercial insurers and Medicare cover TMS therapy under specific conditions:

1. **Diagnosis requirement** — Most payers require a diagnosis of Major Depressive Disorder (MDD), typically confirmed by a PHQ-9 score of 14 or higher.
2. **Treatment resistance** — Insurers typically require documentation that 1–4 antidepressant medications have failed to produce adequate response.
3. **Medication intolerance** — Some plans accept documentation of intolerable side effects as an alternative to treatment resistance.
4. **Provider qualification** — The treating physician must meet the payer's definition of a qualified TMS provider.

## Prior Authorization: The Critical Step

Virtually all insurers require prior authorization before TMS treatment begins. Your clinic will typically submit:

- Clinical history documenting depression diagnosis and treatment attempts
- PHQ-9 or equivalent depression scale scores
- Medication list with trial durations and reasons for discontinuation
- Referral from a psychiatrist or primary care physician
- Treatment protocol and expected number of sessions

## Medicare Coverage for TMS

Medicare Part B covers TMS when provided in an outpatient setting. Key requirements:

- Physician supervision during all sessions
- FDA-cleared TMS device
- Documented treatment-resistant depression

Medicare Advantage plans may have additional requirements — check your specific plan's medical policy.

## Out-of-Pocket Costs

If insurance denies coverage or you are paying cash, here are typical cost ranges:

| Payment Type | Cost per Session | Full Course (36 sessions) |
|---|---|---|
| Commercial Insurance (in-network) | $100–$400 copay | $3,600–$14,400 (insurance pays rest) |
| Medicare Part B | 20% coinsurance after deductible | ~$3,000–$6,000 |
| Cash Pay | $300–$600 | $10,800–$21,600 |

Many clinics offer self-pay discounts or payment plans for uninsured or out-of-network patients.

## What to Do If Your Claim Is Denied

Insurance denials for TMS are common, especially for off-label conditions. The appeals process typically follows these steps:

1. **Peer-to-peer review** — Request a call between your TMS physician and the insurer's medical director.
2. **First-level appeal** — Submit clinical documentation supporting medical necessity.
3. **Second-level appeal** — If denied again, escalate with additional clinical literature.
4. **External review** — An independent review organization evaluates your case.
5. **State insurance commissioner** — As a last resort, file a complaint with your state's insurance department.

## Frequently Asked Questions

**How long does prior authorization take?**
Most insurers respond within 5–14 business days. Rush requests are sometimes available for urgent clinical situations.

**Does Medicaid cover TMS?**
Medicaid coverage for TMS varies by state. Several state Medicaid programs cover TMS for treatment-resistant depression, though prior authorization requirements can be stringent.

**Can I use an HSA or FSA for TMS?**
Yes. TMS is a medically necessary treatment for covered conditions. HSA and FSA funds can be used for TMS sessions, copayments, and deductibles.

**What CPT codes are used for TMS?**

| Code | Description |
|---|---|
| 90867 | TMS treatment planning (first session) |
| 90868 | TMS treatment delivery (each subsequent session) |
| 90869 | Motor threshold determination |

---

*This article is for informational purposes only. Coverage policies change frequently. Confirm current coverage requirements with your specific insurer before beginning treatment.*
`,
    research_summary: `
## Latest Research on ${post.topic || title}

${description}

The field of transcranial magnetic stimulation (TMS) is advancing rapidly. This research summary synthesizes the latest clinical findings relevant to ${post.topic || 'TMS therapy'}.

## Key Findings

### Mechanism of Action

TMS works by inducing brief magnetic fields that generate small electrical currents in targeted brain regions. Unlike medications, which affect neurotransmitter systems globally, TMS provides targeted, localized neuromodulation.

Recent neuroimaging studies have shown that successful TMS treatment is associated with:

- Increased connectivity between the prefrontal cortex and limbic structures
- Normalization of default mode network activity
- Changes in GABA and glutamate levels measurable by MRS
- Structural changes in cortical thickness after repeated stimulation

### Clinical Outcomes

Recent meta-analyses and systematic reviews have demonstrated:

- **Response rates** of 50–60% for TMS in treatment-resistant depression
- **Remission rates** of 30–40% for standard TMS protocols
- Accelerated protocols (SAINT,溪 accelerated rTMS) achieving 70–90% remission rates in trials
- Sustained benefits at 6- and 12-month follow-ups for most responders

### Safety Profile

TMS maintains an excellent safety profile across conditions. The most common adverse events are:

- Scalp discomfort at the stimulation site (reported in 10–40% of patients)
- Transient headaches (typically resolve within the first week)
- Rare cases of seizure (estimated <0.01% with appropriate protocols)

For special populations (pregnant patients, adolescents, elderly), safety data continues to accumulate with reassuring results.

## Clinical Implications

The research increasingly supports:

1. **Personalized targeting** — Using neuronavigation to individually map cortical targets may improve outcomes.
2. **Accelerated protocols** — Shorter, higher-frequency protocols offer comparable or superior results to standard protocols.
3. **Maintenance strategies** — Booster sessions and ongoing maintenance TMS appear to sustain gains.
4. **Combination approaches** — TMS + psychotherapy or TMS + medication may outperform monotherapy.

## What This Means for Patients

If you are considering TMS:

- **Evidence supports** TMS as an effective option for treatment-resistant depression and several other conditions.
- **Not all clinics are equal** — Look for clinics with experienced physicians and, ideally, neuronavigation capabilities.
- **It's not a one-time cure** — Some patients need maintenance sessions. Plan for this possibility.
- **Combination approaches may work better** — Discuss whether TMS + therapy or medication might be appropriate for you.

## Looking Ahead

Several exciting developments are on the horizon:

- **Personalized protocols** based on genetics and neuroimaging
- **Closed-loop TMS** that adjusts stimulation in real time based on brain activity
- **New FDA indications** for additional conditions including anxiety, OCD, and migraine
- **Home TMS devices** in clinical trials

---

*This article summarizes recent research and is for informational purposes only. It is not medical advice. Consult your healthcare provider for guidance specific to your situation.*
`,
  };

  const body = contentMap[type] || contentMap.treatment_guide;
  return { content: body, slug };
}

// ── Helper: build markdown file ─────────────────────────────────────────────────

function buildMarkdown(post, body) {
  const frontmatter = [
    '---',
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `description: "${(post.description || '').replace(/"/g, '\\"')}"`,
    `publishDate: ${post.publishDate}`,
    `category: ${post.category || 'research'}`,
    `author: ${post.author || 'TMS List Editorial Team'}`,
    `image: "${post.image || ''}"`,
    `tags: [${(post.tags || []).map((t) => `"${t}"`).join(', ')}]`,
    '---',
    '',
  ].join('\n');

  return frontmatter + body + '\n';
}

// ── Helper: trigger Vercel deploy ──────────────────────────────────────────────

async function triggerVercelDeploy() {
  if (!DEPLOY_HOOK) {
    console.log('\n  ℹ  VERCEL_DEPLOY_HOOK_URL not set — skipping deploy trigger');
    return;
  }

  console.log('\n  🔄  Triggering Vercel rebuild...');
  try {
    const res = await fetchJson(DEPLOY_HOOK, { method: 'POST' });
    if (res.status === 200 || res.status === 201) {
      console.log('  ✅  Vercel rebuild triggered successfully');
    } else {
      console.warn(`  ⚠  Vercel returned ${res.status} — check your deploy hook URL`);
    }
  } catch (err) {
    console.warn(`  ⚠  Could not trigger Vercel deploy: ${err.message}`);
  }
}

// ── Main: generate posts ───────────────────────────────────────────────────────

async function main() {
  console.log('\n📅  TMS List Blog Scheduler — May–December 2026\n');
  console.log(`   Posts to generate: ${postsToGenerate.length}`);
  if (DRY_RUN) console.log('   Mode: DRY RUN (no files will be written)\n');
  else console.log();

  // Check which files already exist
  const existingFiles = new Set(readdirSync(BLOG_DIR));
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of postsToGenerate) {
    const filename = `${post.slug}.md`;
    const filepath = join(BLOG_DIR, filename);

    if (existingFiles.has(filename)) {
      console.log(`  ⏭   [${post.publishDate}] ${filename} — already exists, skipping`);
      skipped++;
      continue;
    }

    process.stdout.write(`  📝  [${post.publishDate}] Generating "${post.title}"... `);

    if (DRY_RUN) {
      console.log('[DRY RUN]');
      continue;
    }

    try {
      const { content, slug } = await generateContent(post);
      const markdown = buildMarkdown({ ...post, slug }, content);
      writeFileSync(filepath, markdown, 'utf8');
      console.log(`✅`);
      created++;
    } catch (err) {
      console.error(`❌  Error: ${err.message}`);
      errors++;
    }
  }

  // Summary
  console.log('\n─────────────────────────────────────────────');
  console.log(`   Generated: ${created}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Errors:    ${errors}`);
  console.log('─────────────────────────────────────────────\n');

  if (created > 0 && SHOULD_DEPLOY) {
    await triggerVercelDeploy();
  }

  if (created > 0 && !SHOULD_DEPLOY) {
    console.log('   Run with --deploy to trigger a Vercel rebuild automatically.');
    console.log('   Or push the new files to GitHub to trigger a rebuild.\n');
  }
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
