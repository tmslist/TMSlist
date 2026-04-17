/**
 * Blog Scheduler Generate — generates and writes markdown blog post files.
 *
 * POST /api/admin/blog-scheduler/generate
 * Body: { slug?: string, month?: number, all?: boolean }
 *   - all=true: generate ALL pending posts
 *   - month=N: generate posts for month N (1-12)
 *   - slug="...": generate a single post by slug
 */

import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export const prerender = false;

const BLOG_DIR = join(process.cwd(), 'src/content/blog');

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

const FALLBACK_TEMPLATES: Record<string, (post: any) => string> = {
  treatment_guide: (p) => `
## What Is ${p.condition || p.title.split('TMS for ')[1] || 'This Condition'}?

${p.description}

Transcranial magnetic stimulation (TMS) is a non-invasive procedure that uses magnetic fields to stimulate nerve cells in the brain. It has been FDA-cleared for major depressive disorder and is increasingly used off-label for a range of neuropsychiatric conditions.

## How Does TMS Work?

During a TMS session, an electromagnetic coil is placed against the scalp near the forehead. The device generates magnetic pulses that pass through the skull and stimulate targeted brain regions. The dorsolateral prefrontal cortex (DLPFC) is the most common target for mood disorders.

A typical TMS protocol involves 5 sessions per week for 4–6 weeks, with each session lasting 20–40 minutes. Newer accelerated protocols like Stanford's SAINT can compress treatment into 5 days with comparable or superior outcomes.

## Clinical Evidence

Clinical trials for TMS across various conditions have grown substantially. For most conditions, there is emerging or supportive evidence:

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

## What to Expect During Treatment

1. **Consultation** — Your TMS physician reviews your history and establishes a motor threshold.
2. **Mapping session** — The optimal stimulation target is identified using anatomical landmarks or neuronavigation.
3. **Acute phase** — 20–36 sessions over 6–9 weeks (standard protocol) or 1–2 weeks (accelerated).
4. **Maintenance** — Some patients benefit from periodic booster sessions.

Side effects are generally mild: scalp discomfort, transient headache, and brief facial twitching during stimulation. For patients with bipolar disorder, monitoring for manic symptoms is required.

## Finding a Provider

Use [TMS List](https://tmslist.com) to find certified TMS clinics near you. Ask about their experience with your specific condition, the device they use, and whether they offer neuronavigation.

## Frequently Asked Questions

**Is TMS covered by insurance for this condition?**
TMS is most consistently covered for treatment-resistant major depressive disorder. Coverage for off-label conditions like anxiety, PTSD, or chronic pain depends on your specific insurer and plan.

**How long does it take to see results?**
Most patients notice improvement within 2–3 weeks of starting treatment, particularly with accelerated protocols.

**Is TMS safe?**
TMS has an excellent safety profile. Unlike ECT, it does not require sedation and does not cause memory problems.

**Can I continue my medication during TMS?**
Yes. TMS is often used alongside ongoing medication regimens. Your prescribing physician will determine the best approach.

---

*This article is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider before starting any new treatment.*
`,
  insurance_guide: (p) => `
## Does Your Insurance Cover TMS Therapy?

${p.description}

Insurance coverage for TMS therapy varies significantly by insurer, plan type, and state of residence. This guide helps you understand the current coverage landscape and navigate the prior authorization process.

## Understanding TMS Coverage Requirements

Most commercial insurers and Medicare cover TMS therapy under specific conditions:

1. **Diagnosis requirement** — Most payers require a diagnosis of Major Depressive Disorder (MDD), typically confirmed by a PHQ-9 score of 14 or higher.
2. **Treatment resistance** — Insurers typically require documentation that 1–4 antidepressant medications have failed to produce adequate response.
3. **Medication intolerance** — Some plans accept documentation of intolerable side effects as an alternative.
4. **Provider qualification** — The treating physician must meet the payer's definition of a qualified TMS provider.

## Prior Authorization: The Critical Step

Virtually all insurers require prior authorization before TMS treatment begins. Your clinic will typically submit:

- Clinical history documenting depression diagnosis and treatment attempts
- PHQ-9 or equivalent depression scale scores
- Medication list with trial durations and reasons for discontinuation
- Referral from a psychiatrist or primary care physician
- Treatment protocol and expected number of sessions

## Medicare Coverage for TMS

Medicare Part B covers TMS when provided in an outpatient setting. Key requirements: physician supervision during all sessions, FDA-cleared TMS device, and documented treatment-resistant depression.

Medicare Advantage plans may have additional requirements — check your specific plan's medical policy.

## Out-of-Pocket Costs

| Payment Type | Cost per Session | Full Course (36 sessions) |
|---|---|---|
| Commercial Insurance (in-network) | $100–$400 copay | $3,600–$14,400 |
| Medicare Part B | 20% coinsurance | ~$3,000–$6,000 |
| Cash Pay | $300–$600 | $10,800–$21,600 |

Many clinics offer self-pay discounts or payment plans.

## What to Do If Your Claim Is Denied

1. **Peer-to-peer review** — Request a call between your TMS physician and the insurer's medical director.
2. **First-level appeal** — Submit clinical documentation supporting medical necessity.
3. **Second-level appeal** — Escalate with additional clinical literature.
4. **External review** — An independent review organization evaluates your case.
5. **State insurance commissioner** — As a last resort, file a complaint with your state's insurance department.

## Frequently Asked Questions

**How long does prior authorization take?**
Most insurers respond within 5–14 business days. Rush requests are sometimes available.

**Does Medicaid cover TMS?**
Medicaid coverage varies by state. Several state Medicaid programs cover TMS for treatment-resistant depression.

**Can I use an HSA or FSA for TMS?**
Yes. HSA and FSA funds can be used for TMS sessions, copayments, and deductibles.

**What CPT codes are used for TMS?**
90867 (treatment planning), 90868 (treatment delivery per session), 90869 (motor threshold determination).

---

*This article is for informational purposes only. Coverage policies change frequently. Confirm current requirements with your specific insurer.*
`,
  research_summary: (p) => `
## Latest Research on ${p.topic || p.title}

${p.description}

The field of transcranial magnetic stimulation (TMS) is advancing rapidly. This research summary synthesizes the latest clinical findings.

## Mechanism of Action

TMS works by inducing brief magnetic fields that generate small electrical currents in targeted brain regions. Unlike medications, which affect neurotransmitter systems globally, TMS provides targeted, localized neuromodulation.

Recent neuroimaging studies have shown that successful TMS treatment is associated with:

- Increased connectivity between the prefrontal cortex and limbic structures
- Normalization of default mode network activity
- Changes in GABA and glutamate levels measurable by MRS
- Structural changes in cortical thickness after repeated stimulation

## Clinical Outcomes

Recent meta-analyses and systematic reviews have demonstrated:

- **Response rates** of 50–60% for TMS in treatment-resistant depression
- **Remission rates** of 30–40% for standard TMS protocols
- Accelerated protocols (SAINT, accelerated rTMS) achieving 70–90% remission rates
- Sustained benefits at 6- and 12-month follow-ups for most responders

## Safety Profile

TMS maintains an excellent safety profile across conditions. The most common adverse events are:

- Scalp discomfort at the stimulation site (reported in 10–40% of patients)
- Transient headaches (typically resolve within the first week)
- Rare cases of seizure (estimated <0.01% with appropriate protocols)

For special populations (pregnant patients, adolescents, elderly), safety data continues to accumulate with reassuring results.

## Clinical Implications

1. **Personalized targeting** — Neuronavigation for individually mapped cortical targets may improve outcomes.
2. **Accelerated protocols** — Shorter, higher-frequency protocols offer comparable or superior results.
3. **Maintenance strategies** — Booster sessions and ongoing maintenance TMS sustain gains.
4. **Combination approaches** — TMS + psychotherapy or medication may outperform monotherapy.

## What This Means for Patients

- Evidence supports TMS as effective for treatment-resistant depression and several other conditions.
- Not all clinics are equal — look for clinics with experienced physicians and neuronavigation.
- Combination approaches may work better than TMS alone.
- Maintenance sessions may be needed — plan for this possibility.

## Looking Ahead

Several exciting developments are on the horizon:

- **Personalized protocols** based on genetics and neuroimaging
- **Closed-loop TMS** that adjusts stimulation in real time
- **New FDA indications** for additional conditions
- **Home TMS devices** in clinical trials

---

*This article summarizes recent research and is for informational purposes only. Not medical advice — consult your healthcare provider.*
`,
};

function buildMarkdown(post: any, content: string): string {
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
    content.trim(),
  ].join('\n');
}

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { slug, month, all: generateAll } = body;

    const manifest = await getManifest();
    const existingSlugs = getExistingSlugs();

    let toGenerate = manifest.filter((p: any) => {
      if (!existingSlugs.has(p.slug)) return true;
      // Regenerate if it already exists (force refresh)
      return false;
    });

    if (slug) {
      toGenerate = toGenerate.filter((p: any) => p.slug === slug);
    } else if (month) {
      toGenerate = toGenerate.filter((p: any) => new Date(p.publishDate).getMonth() + 1 === month);
    } else if (!generateAll) {
      return new Response(JSON.stringify({ error: 'Provide slug, month, or all=true' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (toGenerate.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        generated: 0,
        skipped: 0,
        message: 'All posts already generated.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const results: Array<{ slug: string; title: string; status: string; error?: string }> = [];

    for (const post of toGenerate) {
      const type = post.type || 'treatment_guide';
      const templateFn = FALLBACK_TEMPLATES[type] || FALLBACK_TEMPLATES.treatment_guide;
      const content = templateFn(post);
      const markdown = buildMarkdown(post, content);
      const filepath = join(BLOG_DIR, `${post.slug}.md`);

      try {
        writeFileSync(filepath, markdown, 'utf8');
        results.push({ slug: post.slug, title: post.title, status: 'generated' });
      } catch (err: any) {
        results.push({ slug: post.slug, title: post.title, status: 'error', error: err.message });
      }
    }

    const generated = results.filter(r => r.status === 'generated').length;
    const errors = results.filter(r => r.status === 'error').length;

    return new Response(JSON.stringify({
      success: errors === 0,
      generated,
      errors,
      results,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Blog scheduler generate error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
