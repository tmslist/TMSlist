/**
 * Blog Scheduler API — exposes the scheduled posts manifest to the admin panel
 * and handles on-demand generation (writing .md files to src/content/blog/).
 *
 * GET  /api/admin/blog-scheduler         → returns manifest + generation status
 * POST /api/admin/blog-scheduler/generate → generates markdown files for upcoming posts
 * POST /api/admin/blog-scheduler/trigger-rebuild → signals a site rebuild
 */

import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export const prerender = false;

const BLOG_DIR = join(process.cwd(), 'src/content/blog');

// Dynamically import the manifest so we get fresh reads on each call
async function getManifest() {
  try {
    const mod = await import('../../../scripts/blog-scheduler-manifest.js')
      .catch(() => import('../../../scripts/blog-scheduler-manifest.ts'));
    return mod.SCHEDULED_POSTS as any[];
  } catch {
    return [];
  }
}

function getExistingSlugs(): Set<string> {
  try {
    return new Set(readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
  } catch {
    return new Set();
  }
}

function buildMarkdown(post: {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  category: string;
  author: string;
  image: string;
  tags: string[];
  content: string;
}): string {
  return [
    '---',
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `description: "${(post.description || '').replace(/"/g, '\\"')}"`,
    `publishDate: ${post.publishDate}`,
    `category: ${post.category || 'research'}`,
    `author: ${post.author || 'TMS List Editorial Team'}`,
    `image: "${post.image || ''}"`,
    `tags: [${(post.tags || []).map((t: string) => `"${t}"`).join(', ')}]`,
    '---',
    '',
    post.content,
    '',
    '*This article is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider.*',
  ].join('\n');
}

const FALLBACK_CONTENT: Record<string, string> = {
  treatment_guide: (condition: string) => `
## What Is ${condition}?

Transcranial magnetic stimulation (TMS) is a non-invasive procedure that uses magnetic fields to stimulate nerve cells in the brain. It has been FDA-cleared for major depressive disorder and is increasingly used off-label for a range of neuropsychiatric conditions.

## How Does TMS Work?

During a TMS session, an electromagnetic coil is placed against the scalp near the forehead. The device generates magnetic pulses that pass through the skull and stimulate targeted brain regions. The dorsolateral prefrontal cortex (DLPFC) is the most common target for mood disorders.

A typical TMS protocol involves 5 sessions per week for 4–6 weeks, with each session lasting 20–40 minutes. Newer accelerated protocols can compress treatment into 5 days with comparable outcomes.

## Clinical Evidence

Clinical trials for TMS across various conditions have grown substantially. For most conditions, there is emerging or supportive evidence:

- **Major Depressive Disorder** — Strong evidence, FDA cleared
- **OCD** — Moderate evidence, FDA cleared (Deep TMS)
- **Migraine** — Moderate evidence, FDA cleared (sTMS)
- **Anxiety, PTSD, Chronic Pain** — Emerging evidence, off-label

*Note: FDA clearance status is current as of 2026. Off-label use is legal when prescribed by a qualified physician.*

## What to Expect During Treatment

1. **Consultation** — Your TMS physician reviews your history and establishes a motor threshold.
2. **Mapping session** — The optimal stimulation target is identified.
3. **Acute phase** — 20–36 sessions over 6–9 weeks (standard protocol).
4. **Maintenance** — Some patients benefit from periodic booster sessions.

Side effects are generally mild and include scalp discomfort, transient headache, and brief facial twitching during stimulation.

## Finding a Provider

Use [TMS List](https://tmslist.com) to find certified TMS clinics near you. Not all clinics offer every protocol — ask about their experience with your specific condition.

## Frequently Asked Questions

**Is TMS covered by insurance?**
TMS is most consistently covered for treatment-resistant major depressive disorder. Coverage for off-label conditions varies by insurer and plan. Check our insurance guide for details.

**How long does it take to see results?**
Most patients notice improvement within 2–3 weeks of starting treatment.

**Is TMS safe?**
TMS has an excellent safety profile. Unlike ECT, it does not require sedation and does not cause memory problems.
`,
  insurance_guide: (insurance: string) => `
## Does ${insurance} Cover TMS Therapy?

Insurance coverage for TMS therapy varies significantly by insurer, plan type, and state. This guide helps you understand the current coverage landscape.

## Coverage Requirements

Most commercial insurers and Medicare cover TMS under specific conditions:

1. **Diagnosis** — Major Depressive Disorder (MDD), typically PHQ-9 score of 14 or higher
2. **Treatment resistance** — Documentation that 1–4 antidepressants have failed
3. **Medication intolerance** — As an alternative to treatment resistance
4. **Qualified provider** — The treating physician must meet payer requirements

## Prior Authorization

Virtually all insurers require prior authorization before TMS begins. Your clinic will typically submit:

- Clinical history documenting depression diagnosis and treatment attempts
- PHQ-9 scores and medication list with trial durations
- Referral from a psychiatrist or primary care physician
- Proposed treatment protocol and number of sessions

## Medicare Coverage

Medicare Part B covers TMS when provided in an outpatient setting with physician supervision and an FDA-cleared device.

## Out-of-Pocket Costs

| Payment Type | Cost per Session | Full Course (36 sessions) |
|---|---|---|
| Commercial Insurance (in-network) | $100–$400 copay | $3,600–$14,400 |
| Medicare Part B | 20% coinsurance | ~$3,000–$6,000 |
| Cash Pay | $300–$600 | $10,800–$21,600 |

Many clinics offer self-pay discounts or payment plans.

## Appealing a Denial

1. **Peer-to-peer review** — Request a call between your physician and the insurer's medical director.
2. **First-level appeal** — Submit clinical documentation supporting medical necessity.
3. **Second-level appeal** — Escalate with additional clinical literature.
4. **External review** — An independent review organization evaluates your case.

## Frequently Asked Questions

**How long does prior authorization take?**
Most insurers respond within 5–14 business days. Rush requests are sometimes available.

**Can I use an HSA or FSA for TMS?**
Yes. TMS is a medically necessary treatment. HSA and FSA funds cover sessions, copayments, and deductibles.
`,
  research_summary: (topic: string) => `
## ${topic}: Research Update

The field of transcranial magnetic stimulation (TMS) is advancing rapidly. This research summary synthesizes the latest clinical findings.

## Key Findings

TMS works by inducing brief magnetic fields that generate small electrical currents in targeted brain regions. Unlike medications, which affect neurotransmitter systems globally, TMS provides targeted, localized neuromodulation.

Recent neuroimaging studies have shown that successful TMS treatment is associated with:

- Increased connectivity between the prefrontal cortex and limbic structures
- Normalization of default mode network activity
- Changes in GABA and glutamate levels measurable by MRS
- Structural changes in cortical thickness after repeated stimulation

## Clinical Outcomes

Recent meta-analyses demonstrate:

- **Response rates** of 50–60% for TMS in treatment-resistant depression
- **Remission rates** of 30–40% for standard TMS protocols
- Accelerated protocols achieving 70–90% remission rates in trials
- Sustained benefits at 6- and 12-month follow-ups

## Safety

TMS maintains an excellent safety profile. Common adverse events include:

- Scalp discomfort at the stimulation site (10–40% of patients)
- Transient headaches (typically resolve within the first week)
- Rare cases of seizure (<0.01% with appropriate protocols)

## Clinical Implications

1. **Personalized targeting** — Neuronavigation may improve outcomes
2. **Accelerated protocols** — Comparable or superior results to standard protocols
3. **Maintenance strategies** — Booster sessions sustain gains
4. **Combination approaches** — TMS + psychotherapy may outperform monotherapy

## What This Means for Patients

- Evidence supports TMS as effective for treatment-resistant depression and several other conditions
- Not all clinics are equal — look for experienced physicians and neuronavigation
- Combination approaches may work better than TMS alone
`,
};

// GET — return manifest + status
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const manifest = await getManifest();
    const existingSlugs = getExistingSlugs();
    const now = new Date();

    const posts = manifest.map((post) => {
      const exists = existingSlugs.has(post.slug);
      const publishDate = new Date(post.publishDate);
      const isPast = publishDate <= now;

      let status: string;
      if (exists) {
        status = isPast ? 'published' : 'scheduled';
      } else {
        status = isPast ? 'pending_publish' : 'scheduled_pending';
      }

      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        publishDate: post.publishDate,
        category: post.category,
        author: post.author,
        status,
        exists,
      };
    });

    // Group by month for display
    const byMonth: Record<string, typeof posts> = {};
    for (const post of posts) {
      const d = new Date(post.publishDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(post);
    }

    const summary = {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      scheduled: posts.filter(p => ['scheduled', 'scheduled_pending'].includes(p.status)).length,
      pending: posts.filter(p => p.status === 'pending_publish').length,
      generated: posts.filter(p => p.exists).length,
    };

    return new Response(JSON.stringify({ posts, byMonth, summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Blog scheduler GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
