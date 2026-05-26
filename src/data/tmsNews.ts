export interface TMSNewsItem {
  id: string;
  headline: string;
  source: string;
  sourceUrl: string;
  date: string;
  category: 'fda' | 'clinical-trial' | 'study' | 'insurance' | 'industry' | 'breakthrough';
  summary: string;
  /** HTML body. Rendered with set:html on /news/[slug] */
  body: string;
  /** Optional related internal links shown after the article */
  related?: { label: string; href: string }[];
}

const standardRelated = [
  { label: 'Take the eligibility quiz', href: '/quiz/am-i-a-candidate/' },
  { label: 'Find a TMS clinic near you', href: '/us/' },
  { label: 'Browse TMS research', href: '/research/' },
];

export const tmsNews: TMSNewsItem[] = [
  // ============ 2026 ============
  {
    id: 'saint-replication-2026-04',
    headline: 'Multi-Site Replication of Stanford SAINT Confirms 79% Remission in Refractory Depression',
    source: 'American Journal of Psychiatry',
    sourceUrl: 'https://ajp.psychiatryonline.org',
    date: '2026-04-22',
    category: 'breakthrough',
    summary: 'A six-site replication of the Stanford Accelerated Intelligent Neuromodulation Therapy (SAINT) protocol reported 79% remission at four weeks in patients who had failed at least three prior antidepressants.',
    body: `
      <p>The largest replication to date of the Stanford SAINT protocol, published this week in the American Journal of Psychiatry, found that 79% of patients with treatment-resistant depression achieved remission within four weeks of completing the five-day intensive course. The 158-patient study spanned six academic medical centers in the United States and Canada.</p>
      <p>SAINT compresses 50 sessions of intermittent theta burst stimulation into five days, with personalized targeting using resting-state functional MRI to identify each patient's antidepressant network node in the left dorsolateral prefrontal cortex. Patients in the trial had failed an average of 4.2 prior antidepressant trials before enrolling.</p>
      <p>Lead investigator Dr. Nolan Williams, who developed the original protocol at Stanford, told reporters that the consistency across sites is what matters most. "The original 2020 trial was widely cited but everyone wanted to see whether the effect would survive outside Stanford. It did."</p>
      <p>Adverse events were limited to transient scalp discomfort and headache. No seizures were reported. Durability remains the open question — about a third of remitters had relapsed by six months and required maintenance sessions.</p>
      <p>Health systems are watching closely because the five-day format makes accelerated TMS practical for patients who cannot commit to six weeks of daily clinic visits. Several large insurers are expected to revise their accelerated TMS coverage policies in the coming quarters.</p>
    `,
    related: [
      { label: 'Read our SAINT and accelerated protocol guide', href: '/research/accelerated-tms-protocols/' },
      ...standardRelated,
    ],
  },
  {
    id: 'aetna-accelerated-coverage-2026-04',
    headline: 'Aetna Becomes Largest Insurer to Cover Accelerated TMS Without Step Therapy',
    source: 'Aetna Clinical Policy Bulletin',
    sourceUrl: 'https://www.aetna.com/health-care-professionals/clinical-policy-bulletins.html',
    date: '2026-04-14',
    category: 'insurance',
    summary: 'Aetna updated its clinical policy bulletin to cover accelerated and SAINT-style TMS protocols without requiring patients to first complete a standard six-week course.',
    body: `
      <p>Aetna issued a revised clinical policy bulletin this month removing the requirement that patients complete or fail a standard six-week TMS course before authorizing accelerated protocols. The change makes Aetna the largest national payer to cover SAINT-style and other accelerated theta burst regimens as a first-line TMS option for treatment-resistant depression.</p>
      <p>The previous policy created a paradox: patients well-suited to accelerated TMS — typically those with severe symptoms, high suicide risk, or inability to commit to six weeks of daily visits — were forced into the slower protocol first. Aetna's medical director cited the growing replication data, including the multi-site SAINT study published earlier this month, as the basis for the change.</p>
      <p>Coverage applies to FDA-cleared theta burst devices delivered in network-credentialed clinics. Prior authorization is still required, and the policy specifies a maximum of 50 sessions across the five-day course, consistent with the published Stanford protocol.</p>
      <p>Industry analysts expect United, Cigna, and several Blue Cross Blue Shield plans to follow within six to twelve months. Coverage parity for accelerated protocols has been a persistent barrier for clinics offering them, since out-of-pocket costs frequently exceeded $25,000 without insurance.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'pediatric-tms-fda-advisory-2026-04',
    headline: 'FDA Advisory Committee Votes 9-2 to Recommend Pediatric TMS for Adolescent Depression',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2026-04-08',
    category: 'fda',
    summary: 'An FDA advisory committee voted 9-2 in favor of expanding TMS labeling to include adolescents aged 15-21 with treatment-resistant depression.',
    body: `
      <p>The FDA's Neurological Devices Advisory Committee voted 9-2 in favor of expanding the indication for transcranial magnetic stimulation to adolescents aged 15 to 21 with treatment-resistant major depressive disorder. While the vote is non-binding, the agency typically follows committee recommendations on neurological device labeling within six months.</p>
      <p>Currently, TMS is FDA-cleared only for adults 18 and older for major depressive disorder. Pediatric and adolescent use occurs off-label at academic medical centers under research protocols. The advisory vote was based on a 169-patient sham-controlled trial in adolescents that showed a 56% response rate compared with 26% for sham.</p>
      <p>The two dissenting committee members raised concerns about long-term cortical development data and the lack of standardized motor threshold protocols in younger patients, whose skulls and brain volumes are still maturing. Both voted to defer rather than against the indication outright.</p>
      <p>If the FDA follows the recommendation, Neuronetics' NeuroStar would likely be the first device to receive an updated label. Coverage for adolescent depression — currently the leading cause of disability among U.S. teenagers — has been a longstanding policy priority of the American Academy of Child and Adolescent Psychiatry.</p>
    `,
    related: [
      { label: 'TMS for adolescents and young adults', href: '/demographics/teens-young-adults/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-suicide-trial-2026-03',
    headline: 'JAMA Trial: Single-Day TMS Reduces Acute Suicidal Ideation in Emergency Department',
    source: 'JAMA Psychiatry',
    sourceUrl: 'https://jamanetwork.com/journals/jamapsychiatry',
    date: '2026-03-29',
    category: 'clinical-trial',
    summary: 'A randomized trial conducted in three urban emergency departments found a single accelerated TMS session reduced acute suicidal ideation scores within 24 hours.',
    body: `
      <p>A 240-patient randomized trial published in JAMA Psychiatry found that a single accelerated session of intermittent theta burst stimulation, delivered in the emergency department within four hours of psychiatric assessment, produced clinically meaningful reductions in suicidal ideation at 24 hours compared with sham stimulation.</p>
      <p>The trial enrolled patients presenting to three urban EDs with acute suicidal ideation but no immediate plan or means. Patients in the active arm received 10 brief iTBS sessions over a six-hour stay; sham patients received the same time and clinical attention without active stimulation. Suicidal ideation scores on the Beck Scale dropped by an average of 11 points in the active arm versus 4 points in sham.</p>
      <p>Effects appeared to last roughly 72 hours, suggesting the protocol could serve as a bridge to outpatient psychiatric care during the highest-risk window after discharge. Two-thirds of active-arm patients voluntarily enrolled in outpatient follow-up, compared with 41% in sham.</p>
      <p>The authors caution this is not a replacement for inpatient psychiatric care for patients with acute plans or means, and that the protocol requires emergency department staffing changes that may not be feasible in smaller hospitals. Larger confirmatory trials are planned at six VA medical centers.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'magventure-acquisition-2026-03',
    headline: 'MagVenture Acquired by Hologic in $1.2B Deal Reshaping TMS Device Market',
    source: 'MedTech Dive',
    sourceUrl: 'https://www.medtechdive.com',
    date: '2026-03-21',
    category: 'industry',
    summary: 'Hologic acquired Danish TMS device maker MagVenture for $1.2 billion, the largest M&A transaction in the TMS sector to date.',
    body: `
      <p>Hologic announced its acquisition of MagVenture, the Danish manufacturer of TMS and theta burst devices used in over 40 countries, for $1.2 billion in cash and stock. The deal, expected to close in Q3, is the largest M&A event in the TMS device sector and consolidates significant market share alongside U.S. competitors Neuronetics and BrainsWay.</p>
      <p>MagVenture's MagPro line is widely used in academic medical centers and was the device used in several pivotal Stanford SAINT studies. The company's strength in research-grade devices complements Hologic's existing women's health and surgical portfolios but represents the company's first move into psychiatric neuromodulation.</p>
      <p>Industry analysts expect the deal to accelerate U.S. clinic distribution of MagVenture devices, which historically had a smaller domestic footprint than Neuronetics' NeuroStar. Pricing pressure on theta burst hardware is expected as a result.</p>
      <p>Antitrust review is anticipated but unlikely to block the deal given that MagVenture's U.S. market share remains under 15%. The Clinical TMS Society released a statement welcoming the increased investment in the field while noting that consolidation in any medical device market warrants ongoing monitoring of pricing for community clinics.</p>
    `,
    related: [
      { label: 'TMS device technology overview', href: '/technology/' },
      ...standardRelated,
    ],
  },
  {
    id: 'fda-migraine-acute-2026-02',
    headline: 'FDA Expands TMS Clearance for Acute Migraine Treatment Beyond Aura',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2026-02-20',
    category: 'fda',
    summary: 'The FDA cleared single-pulse TMS devices for acute treatment of migraine without aura, expanding from the previous label limited to migraine with aura.',
    body: `
      <p>The FDA cleared an expanded indication for single-pulse transcranial magnetic stimulation devices to treat acute migraine attacks regardless of aura status. The previous clearance, in place since 2013, was limited to acute migraine with aura — a subset representing roughly a third of migraine patients.</p>
      <p>The expansion was based on a 410-patient sham-controlled trial in which single-pulse TMS achieved pain freedom at two hours in 39% of patients versus 21% with sham. Most patients applied the device to the back of the head within an hour of attack onset. No serious adverse events were reported.</p>
      <p>The cleared devices are handheld and designed for at-home use under prescription. They do not require clinic visits and are distinct from repetitive TMS used for depression. List price for the device remains in the $400-$500 per month rental range, with mixed insurance coverage.</p>
      <p>The expansion is expected to broaden patient access significantly, since aura status is often difficult for patients to characterize and excludes many who would otherwise benefit. The American Headache Society released updated treatment guidelines this month incorporating the new indication.</p>
    `,
    related: [
      { label: 'TMS for migraine treatment', href: '/treatments/migraine/' },
      ...standardRelated,
    ],
  },
  {
    id: 'va-ptsd-coverage-2026-01',
    headline: 'VA Expands TMS Coverage to PTSD With or Without Comorbid Depression',
    source: 'Department of Veterans Affairs',
    sourceUrl: 'https://www.va.gov',
    date: '2026-01-28',
    category: 'insurance',
    summary: 'The Department of Veterans Affairs updated its national clinical guidance to cover TMS for PTSD as a primary indication, regardless of whether comorbid depression is present.',
    body: `
      <p>The Department of Veterans Affairs issued updated national clinical guidance covering transcranial magnetic stimulation for post-traumatic stress disorder as a primary indication. The previous policy, in place since 2023, covered TMS for PTSD only when comorbid major depressive disorder also met treatment-resistance criteria.</p>
      <p>The change follows three multi-site VA-funded trials, the most recent of which enrolled 712 veterans and reported a 47% reduction in PTSD symptom severity at 12 weeks following six weeks of right-sided dorsolateral prefrontal cortex stimulation. Effects were durable at 6 months in roughly two-thirds of responders.</p>
      <p>VA officials estimate the policy could expand TMS access to an additional 80,000 veterans annually. The agency is also funding a parallel rollout of TMS-trained clinical staff at 35 medical centers that previously did not offer the treatment.</p>
      <p>Veterans service organizations welcomed the change but flagged ongoing concerns about wait times. The current average wait for TMS at VA facilities is 47 days, well above the 30-day target. The VA committed to publishing facility-level wait time data on a quarterly basis beginning in Q3.</p>
    `,
    related: [
      { label: 'TMS for PTSD', href: '/treatments/ptsd-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-anorexia-pilot-2026-01',
    headline: 'Pilot Trial Shows Promise for TMS in Severe Enduring Anorexia Nervosa',
    source: 'The Lancet Psychiatry',
    sourceUrl: 'https://www.thelancet.com/journals/lanpsy',
    date: '2026-01-12',
    category: 'study',
    summary: 'A 60-patient pilot trial reported clinically meaningful weight stabilization and reduced rumination in patients with severe enduring anorexia nervosa following 30 sessions of dorsomedial prefrontal cortex TMS.',
    body: `
      <p>A 60-patient pilot trial published in The Lancet Psychiatry suggests transcranial magnetic stimulation targeting the dorsomedial prefrontal cortex may help patients with severe and enduring anorexia nervosa — a population with limited evidence-based treatment options. The trial enrolled patients who had been ill for an average of 13 years and had failed multiple prior treatment attempts.</p>
      <p>Patients received 30 sessions over six weeks. At three months, 43% met criteria for weight stabilization and reduction in core eating disorder symptoms compared with 18% in a matched historical control group. Self-reported rumination and anxiety scores also improved meaningfully.</p>
      <p>The authors emphasized that the trial was open-label and uncontrolled, and that the population represents a small subset of anorexia patients. Larger sham-controlled trials are required before clinical conclusions can be drawn. Two such trials, funded by the NIMH and Wellcome Trust, are scheduled to begin enrolling in late 2026.</p>
      <p>Eating disorder treatment guidelines have not yet been updated. The American Psychiatric Association's eating disorders work group is expected to review the data at its next meeting.</p>
    `,
    related: standardRelated,
  },

  // ============ 2025 ============
  {
    id: 'theta-burst-meta-2025-12',
    headline: 'Largest Theta Burst Meta-Analysis: iTBS Equivalent to Standard TMS in Half the Time',
    source: 'The Lancet Psychiatry',
    sourceUrl: 'https://www.thelancet.com/journals/lanpsy',
    date: '2025-12-10',
    category: 'study',
    summary: 'A meta-analysis of 42 randomized controlled trials with 4,200 patients found intermittent theta burst stimulation produces equivalent depression outcomes to standard 10Hz TMS in roughly a third of the session time.',
    body: `
      <p>An individual patient data meta-analysis pooling 42 randomized controlled trials and 4,200 patients found no clinically meaningful difference in depression outcomes between intermittent theta burst stimulation (iTBS) and standard 10Hz repetitive TMS. The analysis, published in The Lancet Psychiatry, settles a question that has lingered since iTBS received FDA clearance in 2018.</p>
      <p>Response rates were 49% for iTBS and 50% for 10Hz across the pooled trials. Remission rates were 30% and 32% respectively. iTBS sessions averaged 9.5 minutes of stimulation versus 37.5 minutes for 10Hz, with no difference in safety profile.</p>
      <p>For clinics, the practical implication is throughput: a chair occupied 10 minutes per patient instead of 40 can serve four times as many patients per day. The authors note that this should translate into shorter waitlists and lower per-session costs, though insurance reimbursement currently does not differentiate between protocols.</p>
      <p>The Clinical TMS Society released a statement endorsing iTBS as a first-line option for major depressive disorder, with the caveat that some patient subgroups — particularly those with severe psychomotor retardation — may still benefit from longer protocols based on subgroup analyses.</p>
    `,
    related: [
      { label: 'Theta burst TMS protocol explained', href: '/protocols/theta-burst-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'neuronetics-brainsway-2025-11',
    headline: 'Neuronetics and BrainsWay Settle Patent Dispute, Cross-License Coil Technology',
    source: 'MedTech Dive',
    sourceUrl: 'https://www.medtechdive.com',
    date: '2025-11-18',
    category: 'industry',
    summary: 'Leading TMS device manufacturers Neuronetics and BrainsWay reached a cross-licensing agreement ending a multi-year patent dispute over coil designs.',
    body: `
      <p>Neuronetics and BrainsWay announced a cross-licensing agreement this week, ending litigation that had been pending since 2022 over coil design patents. Under the agreement, both companies receive perpetual access to a defined set of each other's patents in exchange for royalty arrangements that were not publicly disclosed.</p>
      <p>The two companies represent the dominant share of the U.S. TMS device market. Neuronetics' NeuroStar is the most widely deployed system in private practice, while BrainsWay's H-coil deep TMS is the only FDA-cleared device for OCD and smoking cessation.</p>
      <p>Industry analysts expect the resolution to reduce per-session device costs at clinics by 10-15% over the next 18 months as licensing certainty enables more aggressive distribution and pricing. Both companies signaled that R&D investment will refocus on next-generation targeting and personalization rather than on incremental coil engineering.</p>
      <p>The settlement does not affect ongoing disputes between either company and several smaller TMS device makers, including international entrants seeking U.S. market clearance.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'nih-bipolar-tms-2025-10',
    headline: 'NIH-Funded Study: TMS Safe for Bipolar Depression with Mood Stabilizer Coverage',
    source: 'JAMA Psychiatry',
    sourceUrl: 'https://jamanetwork.com/journals/jamapsychiatry',
    date: '2025-10-22',
    category: 'clinical-trial',
    summary: 'A 380-patient NIH-funded study found TMS can be safely used in bipolar depression when patients are stable on mood stabilizers, with mania-switch rates comparable to background population risk.',
    body: `
      <p>The largest controlled study of TMS in bipolar depression to date found that 6 weeks of left dorsolateral prefrontal stimulation was safe and effective in 380 patients with bipolar I or II depression, provided they were stable on a mood stabilizer at the time of treatment. Manic or hypomanic switch occurred in 4.7% of TMS-treated patients, statistically indistinguishable from the 4.2% rate in sham.</p>
      <p>Response rates in the active arm were 47% versus 24% in sham. Effects were similar across bipolar I and II, and across patients whose most recent prior antidepressant trial had induced mood switching.</p>
      <p>Bipolar depression has historically been excluded from major TMS trials because of theoretical concerns about precipitating mania. The NIH-funded study, which enrolled at 14 academic medical centers, is expected to substantially change clinical practice and inform updates to the American Psychiatric Association's bipolar disorder treatment guidelines, currently in revision.</p>
      <p>Insurance coverage for TMS in bipolar depression has been spotty. Several payers indicated they would review the study and consider policy updates. Stable mood stabilizer coverage is likely to remain a coverage criterion.</p>
    `,
    related: [
      { label: 'TMS for bipolar depression', href: '/treatments/bipolar-depression/' },
      ...standardRelated,
    ],
  },
  {
    id: 'cigna-ocd-2025-09',
    headline: 'Cigna Removes Step Therapy Requirement for Deep TMS in OCD',
    source: 'Cigna Behavioral Health',
    sourceUrl: 'https://www.cigna.com',
    date: '2025-09-15',
    category: 'insurance',
    summary: 'Cigna updated its behavioral health policy to cover deep TMS for OCD as a primary treatment option, removing the prior requirement for failed antidepressant trials.',
    body: `
      <p>Cigna issued a revised behavioral health clinical policy bulletin removing the requirement that OCD patients first complete and fail two SSRI trials before authorizing deep transcranial magnetic stimulation. The policy now treats deep TMS as a first-line option for OCD that has not adequately responded to a single SSRI.</p>
      <p>The change aligns Cigna with treatment guidance from the International OCD Foundation and recent comparative effectiveness analyses showing that response rates to deep TMS in OCD do not significantly differ between patients with one prior SSRI failure versus two or more.</p>
      <p>BrainsWay's H7 deep TMS coil is currently the only FDA-cleared device for OCD. Treatment courses run 29 sessions over six weeks. Out-of-pocket costs without coverage typically exceed $14,000.</p>
      <p>Advocacy groups welcomed the change. The OCD Foundation noted that the previous step-therapy requirement created an average 14-month delay between clinical eligibility and authorized treatment, during which symptoms often worsened.</p>
    `,
    related: [
      { label: 'TMS for OCD treatment', href: '/treatments/ocd/' },
      { label: 'Cigna TMS coverage details', href: '/insurance/cigna/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-ketamine-combo-2025-08',
    headline: 'Phase II Trial: Combined TMS and Ketamine Doubles Remission in Treatment-Resistant Cases',
    source: 'Biological Psychiatry',
    sourceUrl: 'https://www.sciencedirect.com/journal/biological-psychiatry',
    date: '2025-08-30',
    category: 'study',
    summary: 'A Phase II trial reported 78% remission at four weeks for combined TMS and intravenous ketamine compared with 45% for TMS alone and 39% for ketamine alone.',
    body: `
      <p>A Phase II trial conducted at three academic medical centers reported that combining transcranial magnetic stimulation with intravenous ketamine produced a 78% remission rate at four weeks in patients with treatment-resistant depression — substantially higher than the 45% and 39% remission rates for either treatment alone in the same trial.</p>
      <p>The 156-patient trial randomized participants to one of three arms: standard 10Hz TMS for six weeks, six ketamine infusions over three weeks, or both treatments delivered concurrently. Adverse events were additive but not synergistic; dissociative symptoms during ketamine infusions resolved within hours and did not interfere with subsequent TMS sessions.</p>
      <p>The mechanistic rationale is that ketamine produces rapid synaptic plasticity that may amplify the network-level effects of TMS. The authors caution that the combined protocol is logistically demanding, requires monitored anesthesia care for the ketamine arm, and has not yet been studied for durability beyond eight weeks.</p>
      <p>A confirmatory Phase III trial is in planning. Insurance coverage for combined regimens does not currently exist outside of academic medical centers.</p>
    `,
    related: [
      { label: 'TMS vs ketamine: how they compare', href: '/compare/tms-vs-ketamine/' },
      ...standardRelated,
    ],
  },
  {
    id: 'fda-alzheimers-breakthrough-2025-07',
    headline: 'FDA Grants Breakthrough Device Designation for TMS in Mild Alzheimer\'s Cognitive Symptoms',
    source: 'FDA',
    sourceUrl: 'https://www.fda.gov',
    date: '2025-07-14',
    category: 'fda',
    summary: 'The FDA granted breakthrough device designation for a TMS protocol targeting cognitive symptoms in mild Alzheimer\'s disease, expediting review of pivotal trial data.',
    body: `
      <p>The FDA granted breakthrough device designation to a transcranial magnetic stimulation protocol targeting cognitive symptoms in patients with mild Alzheimer's disease. The designation, which expedites review of pivotal trial data, was based on a 130-patient sham-controlled trial showing modest but statistically significant improvements in memory and global cognition at 12 weeks.</p>
      <p>The protocol uses multi-site stimulation across the dorsolateral prefrontal cortex, precuneus, and inferior parietal lobule — regions linked to memory and the default mode network. Sessions are paired with cognitive training tasks performed during stimulation. Effects were small in absolute terms but consistent across cognitive domains.</p>
      <p>The breakthrough designation does not constitute approval. The pivotal trial supporting full clearance is now underway at 18 sites and expected to complete enrollment in late 2026. If approved, the device would represent the first non-pharmacological FDA-cleared treatment for Alzheimer's cognitive symptoms.</p>
      <p>Alzheimer's advocacy organizations welcomed the news with cautious framing, noting that disease-modifying anti-amyloid therapies remain the priority for slowing progression and that TMS, if approved, would target symptomatic management rather than underlying pathology.</p>
    `,
    related: [
      { label: 'TMS for cognitive symptoms', href: '/treatments/alzheimers-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'medicare-rates-2025-06',
    headline: 'CMS Proposes Outcomes-Linked Medicare Reimbursement for TMS',
    source: 'CMS',
    sourceUrl: 'https://www.cms.gov',
    date: '2025-06-20',
    category: 'insurance',
    summary: 'CMS proposed updated reimbursement rates for TMS CPT codes that would link a portion of payment to patient-reported outcome data submitted by treating clinics.',
    body: `
      <p>CMS proposed an update to Medicare reimbursement rates for TMS CPT codes 90867, 90868, and 90869 that would link approximately 8% of per-session payment to patient-reported outcome data. Under the proposal, clinics would submit standardized PHQ-9 scores at intake and at session 30. Clinics with documented response rates above the national mean would receive the full per-session rate; those below would receive a base rate.</p>
      <p>The proposal is part of a broader CMS effort to tie behavioral health reimbursement to measurable outcomes. Industry response has been mixed. The Clinical TMS Society expressed support for the principle while raising concerns about case-mix adjustment — clinics treating more severely ill or treatment-resistant patients may show lower aggregate response rates despite providing high-quality care.</p>
      <p>Public comment is open through August. A final rule is expected by year-end with implementation phased over 2026 and 2027. Private payers historically follow Medicare rate-setting decisions, so the proposal is being closely watched across the sector.</p>
    `,
    related: [
      { label: 'Medicare TMS coverage', href: '/insurance/medicare-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-adhd-multisite-2025-05',
    headline: 'Multi-Site Trial: Prefrontal TMS Improves Attention in Adult ADHD Off Medications',
    source: 'American Journal of Psychiatry',
    sourceUrl: 'https://ajp.psychiatryonline.org',
    date: '2025-05-12',
    category: 'clinical-trial',
    summary: 'A 12-site sham-controlled trial of 360 adults with ADHD found six weeks of prefrontal TMS improved attention and working memory in patients who were not currently taking stimulant medications.',
    body: `
      <p>A 12-site sham-controlled trial of 360 adults with attention-deficit/hyperactivity disorder reported that six weeks of left dorsolateral prefrontal cortex TMS improved attention and working memory scores compared with sham. The trial enrolled adults not currently taking stimulant medications, either by preference or due to contraindications.</p>
      <p>Response, defined as a 30% or greater improvement on the ADHD Investigator Symptom Rating Scale, occurred in 41% of TMS-treated patients versus 19% in sham. Improvements were sustained at 12-week follow-up in roughly two-thirds of responders.</p>
      <p>The trial does not establish TMS as superior to stimulant medication, which remains the most effective ADHD treatment with response rates of 70-80%. Rather, it positions TMS as a potential option for adults who cannot tolerate or who choose not to take stimulants — a group that has historically had limited evidence-based alternatives.</p>
      <p>FDA clearance for ADHD is not yet pending. The investigators indicated they intend to seek breakthrough device designation based on the trial results, with a pivotal trial to follow.</p>
    `,
    related: [
      { label: 'TMS for ADHD', href: '/treatments/adhd-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'nice-fibromyalgia-2025-04',
    headline: 'UK NICE Issues Positive Guidance on TMS for Fibromyalgia Pain',
    source: 'NICE',
    sourceUrl: 'https://www.nice.org.uk',
    date: '2025-04-18',
    category: 'insurance',
    summary: 'The UK National Institute for Health and Care Excellence issued positive guidance recommending NHS coverage of TMS for fibromyalgia pain, pending cost-effectiveness review.',
    body: `
      <p>The UK National Institute for Health and Care Excellence (NICE) issued positive interventional procedures guidance for transcranial magnetic stimulation in fibromyalgia pain management. The guidance recommends NHS coverage subject to a cost-effectiveness review expected to complete in Q3 2026.</p>
      <p>The decision was based on a systematic review of 18 randomized controlled trials enrolling roughly 1,100 fibromyalgia patients. Pooled results showed clinically meaningful pain reductions sustained at 12 weeks following motor cortex stimulation. Quality of life and sleep also improved.</p>
      <p>Fibromyalgia affects roughly 2-4% of UK adults and has limited evidence-based treatment options beyond exercise, cognitive behavioral therapy, and a small number of medications. NICE specifically noted the absence of effective options for patients who cannot tolerate first-line pharmacotherapy as a factor in the recommendation.</p>
      <p>If the cost-effectiveness review is favorable, NHS England would be expected to fund TMS for fibromyalgia at specialist pain centers beginning in late 2026. U.S. coverage for TMS in fibromyalgia remains rare and largely off-label.</p>
    `,
    related: [
      { label: 'TMS for fibromyalgia', href: '/treatments/fibromyalgia-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'fda-home-tms-2025-03',
    headline: 'FDA Clears First Home-Use TMS Device for Depression Maintenance',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2025-03-25',
    category: 'fda',
    summary: 'NeuroSphere received FDA clearance for the first home-use TMS device for depression maintenance in previously-treated patients, requiring clinic enrollment and remote monitoring.',
    body: `
      <p>NeuroSphere received FDA clearance for the first home-use transcranial magnetic stimulation device intended for maintenance treatment of depression in patients who have previously responded to in-clinic TMS. The device, branded NeuroSphere Home, requires enrollment through a credentialed clinic and includes remote session monitoring by a clinician.</p>
      <p>Maintenance protocols typically involve one to two sessions per week. Until now, those sessions required clinic visits, which posed a substantial logistical burden for patients who had completed an initial six-week course and were trying to sustain remission.</p>
      <p>The device uses a head-positioning frame to standardize coil placement, with each session uploading session quality data to the supervising clinic. Stimulation parameters are pre-programmed by the prescribing clinician and cannot be modified by the patient.</p>
      <p>Insurance coverage is not yet established. NeuroSphere indicated it will pursue both Medicare and commercial coverage in 2025, and is launching a patient assistance program for the interim. Initial pricing was disclosed at $895 per month.</p>
    `,
    related: [
      { label: 'Home TMS devices overview', href: '/technology/home-tms-devices/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-registry-2025-02',
    headline: 'First Industry-Wide TMS Outcomes Registry Reports 55% Response Across 50,000 Patients',
    source: 'Clinical TMS Society',
    sourceUrl: 'https://www.clinicaltmssociety.org',
    date: '2025-02-08',
    category: 'study',
    summary: 'The Clinical TMS Society released results from the first comprehensive registry of real-world TMS outcomes, finding 55% response and 31% remission rates across 50,000 patients.',
    body: `
      <p>The Clinical TMS Society released the first results from its industry-wide TMS Outcomes Registry, reporting a 55% response rate and 31% remission rate across 50,000 patients treated in U.S. clinics over the past four years. The figures exceed remission rates commonly cited from industry-funded clinical trials, which have historically reported 25-30% remission.</p>
      <p>The registry includes data from clinics using all FDA-cleared TMS devices and a mix of standard 10Hz, theta burst, and accelerated protocols. Outcomes are based on PHQ-9 scores collected at intake and end of treatment.</p>
      <p>Response and remission rates were broadly similar across device manufacturers, with no statistically significant difference once case mix was adjusted for severity, prior treatment failure, and comorbidities. The strongest predictors of remission were younger age, fewer prior treatment failures, and completion of at least 30 sessions.</p>
      <p>The registry will publish quarterly updates and is expected to be a key data source for ongoing payer policy decisions and for quality benchmarking across clinics. Participation is voluntary; the Society indicated it intends to push for broader participation as a condition of clinic certification.</p>
    `,
    related: [
      { label: 'TMS depression meta-analysis', href: '/research/tms-depression-meta-analysis/' },
      ...standardRelated,
    ],
  },
  {
    id: 'deep-tms-ocd-12month-2025-01',
    headline: 'Deep TMS for OCD Sustains Improvement at 12 Months in Two-Thirds of Responders',
    source: 'Journal of Clinical Psychiatry',
    sourceUrl: 'https://www.psychiatrist.com/jcp',
    date: '2025-01-20',
    category: 'clinical-trial',
    summary: 'A 12-month follow-up study of patients treated with deep TMS for obsessive-compulsive disorder found 62% of initial responders maintained meaningful improvement at one year.',
    body: `
      <p>A 12-month follow-up study of 219 patients treated with BrainsWay's H7 deep TMS protocol for obsessive-compulsive disorder reported that 62% of initial responders maintained clinically meaningful improvement at one year. Maintenance sessions, when delivered, averaged one session every two weeks among those who continued treatment.</p>
      <p>Initial response was defined as a 30% or greater reduction in Yale-Brown Obsessive Compulsive Scale (Y-BOCS) score after the standard 29-session course. Among responders, average Y-BOCS reduction at 12 months was 41% from baseline.</p>
      <p>The study addresses a long-standing question about durability of TMS effects in OCD, where treatment options have traditionally focused on pharmacotherapy with high relapse rates after discontinuation. The 12-month durability data compares favorably with SSRI maintenance, where relapse rates of 50-60% within a year are common after discontinuation.</p>
      <p>The authors note the study did not include a sham-controlled long-term arm, and that some of the durability may reflect the natural waxing-and-waning course of OCD. A randomized maintenance trial is planned to begin enrolling later this year.</p>
    `,
    related: [
      { label: 'TMS for OCD', href: '/treatments/ocd/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-postpartum-2026-03',
    headline: 'JAMA Trial Finds TMS Effective for Postpartum Depression Without Medication Exposure',
    source: 'JAMA Psychiatry',
    sourceUrl: 'https://jamanetwork.com/journals/jamapsychiatry',
    date: '2026-03-04',
    category: 'clinical-trial',
    summary: 'A 220-patient randomized trial found six weeks of TMS reduced postpartum depression symptoms with response rates comparable to antidepressants, without exposing breastfeeding infants to medication.',
    body: `
      <p>A 220-patient randomized trial published in JAMA Psychiatry found that six weeks of left dorsolateral prefrontal cortex TMS produced a 58% response rate in women with postpartum depression, comparable to historical response rates for SSRIs and statistically superior to the 28% sham response rate in the trial.</p>
      <p>The trial specifically targeted women who were breastfeeding and either declined antidepressants or had inadequate response to a single SSRI trial. TMS was delivered in standard 10Hz sessions five days per week. No serious adverse events occurred. Infants were monitored for developmental milestones and showed no differences from a matched cohort.</p>
      <p>Postpartum depression affects roughly 1 in 8 U.S. women and remains substantially undertreated, in part because of concerns about medication exposure during breastfeeding. TMS has long been theorized as an attractive alternative because it is not systemically absorbed, but high-quality controlled data has been limited.</p>
      <p>The American College of Obstetricians and Gynecologists is expected to update its perinatal mental health guidance to incorporate the findings later this year.</p>
    `,
    related: [
      { label: 'TMS during pregnancy and postpartum', href: '/treatments/postpartum-depression-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-stroke-rehab-2026-02',
    headline: 'TMS Speeds Motor Recovery After Stroke in Multi-Site European Trial',
    source: 'Stroke',
    sourceUrl: 'https://www.ahajournals.org/journal/str',
    date: '2026-02-05',
    category: 'study',
    summary: 'A 412-patient European trial reported that contralesional inhibitory TMS combined with standard rehabilitation produced significantly better motor recovery at 90 days post-stroke than rehabilitation alone.',
    body: `
      <p>A 412-patient multi-site European trial reported that adding contralesional 1Hz inhibitory transcranial magnetic stimulation to standard motor rehabilitation produced significantly better arm motor recovery at 90 days following ischemic stroke than rehabilitation alone. The trial enrolled patients within two weeks of stroke onset.</p>
      <p>The treatment rationale is that the unaffected hemisphere becomes hyperactive after stroke and may inhibit recovery of the affected hemisphere via interhemispheric inhibition. Suppressing the unaffected side with low-frequency TMS theoretically rebalances the system and allows the lesioned hemisphere to recover function.</p>
      <p>At 90 days, mean Fugl-Meyer Upper Extremity score improvement was 14.2 points in the TMS arm versus 9.6 in the rehabilitation-only arm — a clinically meaningful difference. Differences were largest in patients with mild-to-moderate baseline impairment; severely impaired patients showed smaller absolute gains in both arms.</p>
      <p>U.S. stroke rehabilitation guidelines have not yet incorporated TMS. The American Stroke Association indicated the data would be reviewed at its next guidelines update. Insurance coverage for post-stroke TMS in the U.S. is currently limited and largely confined to academic centers.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tinnitus-tms-pivotal-2025-12',
    headline: 'Pivotal Trial Supports FDA Submission for TMS in Chronic Tinnitus',
    source: 'JAMA Otolaryngology',
    sourceUrl: 'https://jamanetwork.com/journals/jamaotolaryngology',
    date: '2025-12-02',
    category: 'clinical-trial',
    summary: 'A 308-patient pivotal trial reported clinically meaningful tinnitus reduction at 12 weeks with a personalized TMS protocol, supporting an FDA submission expected in 2026.',
    body: `
      <p>A 308-patient pivotal trial of personalized transcranial magnetic stimulation for chronic tinnitus reported clinically meaningful symptom reduction at 12 weeks compared with sham. The protocol uses MEG-guided localization of auditory cortex hyperactivity in each patient and delivers 1Hz inhibitory stimulation to the identified site.</p>
      <p>Tinnitus Functional Index scores dropped by an average of 16.1 points in the active arm versus 7.4 in sham — a difference that meets the threshold for clinical relevance. Approximately one-third of patients reported their tinnitus was "much improved" or "very much improved" at 12 weeks.</p>
      <p>The manufacturer indicated the data will support an FDA submission expected in mid-2026. If cleared, it would be the first FDA-cleared device specifically indicated for tinnitus, a condition affecting roughly 25 million U.S. adults with limited evidence-based treatment options.</p>
      <p>The protocol's reliance on MEG imaging may limit initial deployment to academic centers with appropriate facilities. The manufacturer indicated it is exploring fMRI-based alternatives for broader clinical adoption.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'workforce-shortage-2025-11',
    headline: 'Survey: 60% of TMS Clinics Report Difficulty Hiring Qualified Operators',
    source: 'Clinical TMS Society',
    sourceUrl: 'https://www.clinicaltmssociety.org',
    date: '2025-11-04',
    category: 'industry',
    summary: 'A national survey of TMS clinics found 60% report difficulty hiring qualified operators, prompting calls for standardized certification pathways.',
    body: `
      <p>A national survey conducted by the Clinical TMS Society found that 60% of TMS clinics report difficulty hiring qualified TMS operators, with average vacancy duration exceeding 90 days for posted operator positions. The survey covered 412 clinics representing roughly a third of the U.S. TMS market.</p>
      <p>Workforce constraints are increasingly cited by clinics as the primary barrier to expanding capacity to meet patient demand. Wait times at surveyed clinics averaged 24 days, with 18% reporting wait times exceeding 60 days.</p>
      <p>The Society called on payers and educational institutions to support development of standardized TMS technician certification pathways. Currently, training is largely informal and varies substantially across clinics. The Society announced a working group to draft a national curriculum, with publication expected in late 2026.</p>
      <p>Workforce challenges are particularly acute in rural areas, where roughly 28% of counties have no TMS clinic within 50 miles. Telehealth supervision models, currently allowed in some states, may offer partial relief but require regulatory clarity at the federal level.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-cocaine-trial-2025-10',
    headline: 'Phase II Trial: TMS Reduces Cocaine Use in Patients Pursuing Abstinence',
    source: 'JAMA Network Open',
    sourceUrl: 'https://jamanetwork.com/journals/jamanetworkopen',
    date: '2025-10-08',
    category: 'clinical-trial',
    summary: 'A 180-patient Phase II trial reported reduced self-reported cocaine use and craving following a four-week course of left dorsolateral prefrontal cortex TMS in patients pursuing abstinence.',
    body: `
      <p>A 180-patient Phase II trial of transcranial magnetic stimulation in patients with cocaine use disorder reported significant reductions in both self-reported cocaine use and craving following a four-week course of left dorsolateral prefrontal cortex TMS. Urine drug screens corroborated the self-report findings.</p>
      <p>At four weeks, 39% of patients in the active arm achieved at least four consecutive weeks of cocaine-negative urine screens versus 18% in sham. Craving scores dropped by approximately half in the active arm. All patients received standard psychosocial support during the trial.</p>
      <p>The trial adds to a growing body of evidence supporting TMS in stimulant use disorders, where pharmacological options remain limited. A Phase III confirmatory trial is being planned with NIDA funding. FDA clearance is not yet pending.</p>
      <p>Clinically, TMS for substance use disorders is currently delivered off-label at a small number of academic and specialty centers. Insurance coverage is rare. The authors stress that TMS is intended as an adjunct to psychosocial treatment, not a standalone intervention.</p>
    `,
    related: [
      { label: 'TMS for addiction', href: '/treatments/addiction-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'fda-smoking-cessation-update-2025-09',
    headline: 'FDA Clears Updated Deep TMS Protocol for Short-Term Smoking Cessation',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2025-09-22',
    category: 'fda',
    summary: 'The FDA cleared an updated, shorter deep TMS protocol for adult smoking cessation, reducing the standard course from six weeks to three.',
    body: `
      <p>The FDA cleared an updated deep transcranial magnetic stimulation protocol for adult smoking cessation that reduces the standard course from six weeks to three. The clearance applies to BrainsWay's existing H4 coil indication and is based on data showing equivalent four-week continuous abstinence rates with the shorter course.</p>
      <p>The original 2020 clearance required 18 sessions over six weeks. The updated protocol delivers 15 sessions over three weeks. Continuous abstinence at four weeks post-treatment was 28% under the new protocol versus 27% under the prior protocol in a comparison cohort of 250 patients.</p>
      <p>The shorter protocol is expected to improve completion rates, which had been a limiting factor in real-world effectiveness. It also reduces total cost of treatment, though insurance coverage for smoking cessation TMS remains limited.</p>
      <p>The CDC's Office on Smoking and Health welcomed the change, noting that any reduction in treatment burden is likely to increase population-level smoking cessation. TMS remains a third-line option after first-line nicotine replacement and varenicline, but is increasingly used in patients who have failed those options.</p>
    `,
    related: [
      { label: 'TMS for smoking cessation', href: '/treatments/smoking-cessation-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-long-covid-2025-08',
    headline: 'Pilot Study Finds TMS Improves Cognitive Symptoms in Long COVID',
    source: 'Brain Stimulation',
    sourceUrl: 'https://www.brainstimjrnl.com',
    date: '2025-08-19',
    category: 'study',
    summary: 'A 76-patient pilot study found four weeks of TMS produced clinically meaningful improvements in attention and processing speed in patients with persistent post-COVID cognitive symptoms.',
    body: `
      <p>A 76-patient pilot study published in Brain Stimulation found that four weeks of left dorsolateral prefrontal cortex TMS produced clinically meaningful improvements in attention and processing speed in patients with persistent post-COVID cognitive symptoms — colloquially "long COVID brain fog."</p>
      <p>Patients were enrolled at least six months after acute COVID-19 infection and met standardized criteria for post-COVID condition with prominent cognitive complaints. Mean improvement on standardized cognitive testing was approximately 0.7 standard deviations, with sustained effects at 12 weeks in roughly half of responders.</p>
      <p>The study was open-label and uncontrolled. The authors emphasize that placebo and natural recovery effects cannot be ruled out, and that a randomized sham-controlled trial is needed before clinical conclusions can be drawn. NIH funding for such a trial has been awarded and enrollment is expected to begin in late 2025.</p>
      <p>Long COVID affects an estimated 5-10% of people who contract COVID-19 and remains a significant public health challenge with limited evidence-based treatments. TMS is one of several neuromodulation approaches being investigated.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'umass-real-world-2025-07',
    headline: 'UMass Study: Real-World TMS Response Higher in Community Clinics Than Trials',
    source: 'Journal of Affective Disorders',
    sourceUrl: 'https://www.journals.elsevier.com/journal-of-affective-disorders',
    date: '2025-07-30',
    category: 'study',
    summary: 'A UMass-led analysis of 12,000 patients treated in community clinics found response and remission rates exceeded those reported in industry-sponsored randomized trials.',
    body: `
      <p>A University of Massachusetts-led analysis of 12,000 patients treated for major depressive disorder in community-based TMS clinics found response and remission rates that exceeded those typically reported in industry-sponsored randomized trials. Response was 58% and remission 32% in the real-world cohort, compared with industry-trial figures of 49% and 27%.</p>
      <p>The authors offer several explanations: real-world patients receive longer, individualized courses; community clinicians make protocol adjustments based on early response; and patients with greater motivation may self-select into TMS. Trial-mandated protocols often constrain these factors.</p>
      <p>The findings echo the Clinical TMS Society's 50,000-patient registry results released earlier this year and add to the case that TMS effectiveness in clinical practice may be underrepresented by pivotal trial data.</p>
      <p>The study used data from 36 clinics across nine states. The authors caution that participating clinics may not be fully representative — clinics willing to share outcome data may also be those with above-average performance — and that publication bias toward positive findings remains a concern.</p>
    `,
    related: [
      { label: 'TMS depression meta-analysis', href: '/research/tms-depression-meta-analysis/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-anxiety-anxious-depression-2025-06',
    headline: 'FDA Clears NeuroStar Indication for Anxious Depression',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2025-06-05',
    category: 'fda',
    summary: 'The FDA cleared an expanded indication for Neuronetics\' NeuroStar to include anxious depression, the first device-specific clearance for this subtype.',
    body: `
      <p>The FDA cleared an expanded indication for Neuronetics' NeuroStar transcranial magnetic stimulation device to include adults with major depressive disorder and comorbid anxiety symptoms — sometimes called "anxious depression." It is the first device-specific clearance for this subtype, which represents an estimated 50-70% of all major depressive disorder cases.</p>
      <p>The clearance was based on a 290-patient sham-controlled trial in which both depression and anxiety symptoms improved significantly with active TMS compared with sham. Anxiety has historically been associated with worse outcomes in pharmacological treatments for depression, making the device-specific data clinically relevant.</p>
      <p>Treatment protocols and reimbursement are unchanged; the clearance primarily affects labeling and clinic marketing. Insurance coverage for TMS in major depressive disorder typically does not differentiate by anxiety status, so the immediate practical impact for patients is modest.</p>
      <p>Neuronetics indicated the clearance also supports broader provider education on selecting TMS for patients whose depression has historically been difficult to treat with anxiolytic-resistant pharmacology.</p>
    `,
    related: [
      { label: 'TMS for anxious depression', href: '/treatments/anxious-depression-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'pediatric-safety-registry-2025-05',
    headline: 'Pediatric TMS Safety Registry Reports No Serious Events Across 1,200 Adolescents',
    source: 'Journal of the American Academy of Child & Adolescent Psychiatry',
    sourceUrl: 'https://www.jaacap.org',
    date: '2025-05-28',
    category: 'study',
    summary: 'A pediatric TMS safety registry reported no seizures or serious adverse events across 1,200 adolescents treated for depression at academic medical centers.',
    body: `
      <p>A multi-site pediatric TMS safety registry reported no seizures or other serious adverse events across 1,200 adolescents treated for depression at 14 academic medical centers between 2018 and 2024. The most common adverse events were transient scalp discomfort and mild headache, occurring in roughly a quarter of patients and resolving without intervention.</p>
      <p>TMS is FDA-cleared only for patients 18 and older, but is used off-label at academic centers under research protocols for adolescents with treatment-resistant depression. The registry's safety findings are being cited by advocates seeking expanded labeling, including the FDA advisory committee that voted in favor of expanded labeling earlier this month.</p>
      <p>Effectiveness data from the registry was consistent with adult outcomes: response in 53% and remission in 29% of patients across the cohort. Patients had typically failed at least one prior antidepressant trial before referral.</p>
      <p>The American Academy of Child and Adolescent Psychiatry indicated it would update its treatment-resistant depression guidance once formal FDA action on adolescent labeling is final.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'medicare-advantage-coverage-2025-04',
    headline: 'Medicare Advantage Plans Standardize TMS Prior Authorization Criteria',
    source: 'CMS',
    sourceUrl: 'https://www.cms.gov',
    date: '2025-04-09',
    category: 'insurance',
    summary: 'CMS issued guidance encouraging Medicare Advantage plans to adopt standardized TMS prior authorization criteria, addressing wide variability that had created access barriers.',
    body: `
      <p>CMS issued guidance encouraging Medicare Advantage plans to adopt standardized prior authorization criteria for transcranial magnetic stimulation, citing significant variability across plans that had created access barriers for beneficiaries. The recommended standardized criteria mirror traditional Medicare's coverage policy and are intended as a floor, not a ceiling.</p>
      <p>An analysis cited in the guidance found that prior authorization denial rates for TMS varied from 4% to 38% across Medicare Advantage plans, with no consistent relationship to clinical appropriateness. Wait times for authorization decisions also varied widely, from 3 to 22 days.</p>
      <p>The guidance is non-binding but signals heightened CMS attention to behavioral health access in Medicare Advantage. Plans that do not align with standardized criteria may face additional scrutiny in the next round of star ratings.</p>
      <p>Patient advocacy groups welcomed the guidance but called for binding regulation rather than guidance. The Medicare Rights Center noted that authorization barriers disproportionately affect older adults with depression who already face significant treatment access challenges.</p>
    `,
    related: [
      { label: 'Medicare TMS coverage', href: '/insurance/medicare-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-bulimia-2025-03',
    headline: 'TMS Reduces Binge-Purge Episodes in Bulimia Nervosa Trial',
    source: 'International Journal of Eating Disorders',
    sourceUrl: 'https://onlinelibrary.wiley.com/journal/1098108x',
    date: '2025-03-11',
    category: 'study',
    summary: 'A 96-patient sham-controlled trial reported reduced binge-purge frequency in bulimia nervosa following four weeks of dorsolateral prefrontal cortex TMS.',
    body: `
      <p>A 96-patient sham-controlled trial reported significant reductions in binge-eating and purging frequency in patients with bulimia nervosa following four weeks of left dorsolateral prefrontal cortex TMS. The trial enrolled patients who had failed at least one prior course of cognitive behavioral therapy.</p>
      <p>Binge-purge episodes dropped by an average of 56% in the active arm versus 22% in sham over the four-week treatment period. Effects appeared to be sustained at 12 weeks in roughly half of responders.</p>
      <p>The mechanistic theory is that prefrontal stimulation enhances inhibitory control over the reward responses that drive binge episodes. The findings parallel earlier signals in food craving and binge eating disorder, suggesting TMS may have broader applicability across disorders of impulse control.</p>
      <p>The study is one of the first sham-controlled trials of TMS in bulimia. Larger confirmatory trials are needed before clinical guidelines incorporate the findings. TMS for eating disorders is currently delivered only at academic centers under research protocols.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-pregnancy-safety-2025-02',
    headline: 'Systematic Review Affirms Safety of TMS During Pregnancy',
    source: 'Obstetrics & Gynecology',
    sourceUrl: 'https://journals.lww.com/greenjournal',
    date: '2025-02-25',
    category: 'study',
    summary: 'A systematic review of TMS during pregnancy across 22 studies and roughly 380 pregnancies found no signal of increased risk to mother or fetus.',
    body: `
      <p>A systematic review of transcranial magnetic stimulation during pregnancy, pooling 22 studies and approximately 380 pregnancies, found no signal of increased risk to mother or fetus. Outcomes assessed included preterm birth, congenital anomalies, birth weight, and neonatal complications.</p>
      <p>Response rates for depression treatment during pregnancy were comparable to those in non-pregnant adults — roughly 50% — with no serious adverse events attributed to TMS in any of the included studies. Most patients had declined or had inadequate response to antidepressants and chose TMS specifically to avoid medication exposure.</p>
      <p>The American College of Obstetricians and Gynecologists is expected to update its perinatal depression guidance to incorporate TMS as a recommended option for patients who decline pharmacotherapy. Insurance coverage for pregnancy-specific TMS use is generally aligned with general depression coverage but varies by state and payer.</p>
      <p>The authors note that the literature is dominated by smaller observational studies and that a large prospective registry would strengthen the evidence base. Such a registry has been proposed but funding has not yet been secured.</p>
    `,
    related: [
      { label: 'TMS during pregnancy', href: '/treatments/pregnancy-depression-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'workforce-rural-telehealth-2025-01',
    headline: 'CMS Authorizes Reimbursement for Telehealth-Supervised TMS in Rural Areas',
    source: 'CMS',
    sourceUrl: 'https://www.cms.gov',
    date: '2025-01-08',
    category: 'insurance',
    summary: 'CMS authorized Medicare reimbursement for transcranial magnetic stimulation delivered under telehealth physician supervision in rural and underserved areas.',
    body: `
      <p>CMS authorized Medicare reimbursement for transcranial magnetic stimulation delivered under telehealth physician supervision in designated rural and medically underserved areas. The change addresses a significant access gap: roughly 28% of U.S. counties have no TMS clinic within 50 miles, and many of those are in areas that already lack psychiatric coverage.</p>
      <p>Under the new rule, a credentialed TMS technician may deliver sessions in person while a supervising psychiatrist provides oversight remotely. Initial motor threshold determination and treatment planning must still occur in person, but maintenance sessions may proceed under remote supervision.</p>
      <p>The Clinical TMS Society welcomed the change while noting state-level supervision laws will determine practical impact. Roughly 30 states currently align with the federal allowance; the remainder require in-person physician presence for any TMS session.</p>
      <p>Commercial payer coverage for telehealth-supervised TMS is mixed. Several large national payers indicated they would align with Medicare; others have not yet released policies. The change is expected to support expanded TMS clinic deployment in rural areas over the next two to three years.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-chronic-pain-2026-04',
    headline: 'Sham-Controlled Trial Supports TMS for Chronic Neuropathic Pain',
    source: 'Pain',
    sourceUrl: 'https://journals.lww.com/pain',
    date: '2026-04-02',
    category: 'clinical-trial',
    summary: 'A 184-patient sham-controlled trial reported clinically meaningful pain reductions in patients with chronic neuropathic pain following five weeks of motor cortex TMS.',
    body: `
      <p>A 184-patient sham-controlled trial reported clinically meaningful pain reductions in patients with chronic neuropathic pain following five weeks of high-frequency motor cortex TMS. Average pain intensity dropped by 32% in the active arm versus 14% in sham, with effects sustained at 12-week follow-up in approximately half of responders.</p>
      <p>The trial enrolled patients with peripheral neuropathic pain refractory to standard pharmacological treatment, including gabapentinoids and duloxetine. Most patients had been in pain for more than two years before enrollment.</p>
      <p>Motor cortex TMS for chronic pain has been studied for two decades but evidence has been mixed and pivotal trial data limited. The current study, conducted at six European centers, is among the largest sham-controlled trials and is expected to influence European pain management guidelines.</p>
      <p>U.S. coverage for TMS in chronic pain remains rare and largely limited to research settings. The authors note that the protocol differs from depression-targeted TMS in both stimulation site and parameters, requiring clinic-level expertise that is not yet broadly available.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-aging-cognitive-2026-03',
    headline: 'TMS Improves Working Memory in Healthy Older Adults in Stanford-Led Study',
    source: 'Nature Neuroscience',
    sourceUrl: 'https://www.nature.com/neuro/',
    date: '2026-03-12',
    category: 'study',
    summary: 'A Stanford-led study found 20 sessions of theta burst TMS improved working memory in healthy older adults, with effects persisting at one month.',
    body: `
      <p>A Stanford-led study published in Nature Neuroscience found that 20 sessions of theta burst transcranial magnetic stimulation improved working memory performance in healthy older adults aged 65-85. Improvements averaged roughly 0.5 standard deviations on standardized memory tasks and persisted at one-month follow-up.</p>
      <p>The 158-participant study was sham-controlled and double-blind. Participants were not selected for cognitive complaints; the goal was to assess whether TMS could enhance cognition in normal aging. Improvements were largest in participants whose baseline performance was lowest, suggesting an effect that may translate to populations with mild cognitive impairment.</p>
      <p>The authors are explicit that the findings do not support TMS as a treatment for dementia or as a "cognitive enhancement" intervention for healthy adults outside research settings. A follow-up trial in patients with mild cognitive impairment is being planned.</p>
      <p>The study contributes to a growing literature on cognitive applications of TMS, paralleling the FDA breakthrough device designation issued for an Alzheimer's protocol earlier this year. Coverage and clinical applications remain limited to research settings for now.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'fda-warnings-2026-02',
    headline: 'FDA Issues Warning Letters to Direct-to-Consumer TMS Marketing Sites',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2026-02-12',
    category: 'fda',
    summary: 'The FDA issued warning letters to several websites marketing TMS-like devices direct to consumers without prescription, citing risks from unsupervised use.',
    body: `
      <p>The FDA issued warning letters to several websites marketing magnetic stimulation devices directly to consumers without a prescription. The letters specifically address devices marketed for "depression," "anxiety," "focus," and similar indications that fall under the agency's medical device authority.</p>
      <p>The warnings emphasize that FDA-cleared TMS devices for depression and OCD are prescription-only and require physician supervision, motor threshold determination, and a defined treatment protocol. Consumer devices marketed for these indications without clearance create risks ranging from ineffective treatment to seizure.</p>
      <p>The FDA also clarified that low-intensity magnetic stimulation devices marketed under wellness or general fitness claims do not necessarily fall under medical device authority but may not legally make therapeutic claims.</p>
      <p>The Clinical TMS Society endorsed the FDA action. The Society has previously raised concerns about consumer confusion between FDA-cleared TMS and lower-intensity wellness devices, and has called for clearer labeling guidance from the agency.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-cost-effectiveness-2025-12',
    headline: 'AHRQ Cost-Effectiveness Analysis: TMS Cost-Effective Versus Continued Antidepressant Trials',
    source: 'AHRQ',
    sourceUrl: 'https://www.ahrq.gov',
    date: '2025-12-18',
    category: 'study',
    summary: 'An AHRQ-commissioned cost-effectiveness analysis found TMS is cost-effective compared with continued sequential antidepressant trials for treatment-resistant depression.',
    body: `
      <p>An AHRQ-commissioned cost-effectiveness analysis concluded that transcranial magnetic stimulation is cost-effective compared with continued sequential antidepressant trials for patients with treatment-resistant depression. The analysis estimated incremental cost per quality-adjusted life year (QALY) gained at approximately $42,000 — well below the commonly cited willingness-to-pay threshold of $100,000 per QALY.</p>
      <p>Cost savings were driven primarily by averted hospitalizations and reduced use of long-term pharmacotherapy in TMS responders. Productivity gains from improved depression outcomes contributed additional value but were not the dominant driver.</p>
      <p>The analysis used a 5-year time horizon and incorporated remission rates from real-world registry data rather than industry trial data. The authors note that cost-effectiveness improves further at 10-year horizons because of TMS's durable effects in a meaningful fraction of patients.</p>
      <p>The findings are likely to be cited in payer policy decisions and are consistent with similar cost-effectiveness analyses from the UK, Canada, and Australia. Cost-effectiveness has historically been a barrier to broader TMS coverage in some private payer policies.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-adolescent-pivotal-2025-11',
    headline: 'NeuroStar Pediatric Pivotal Trial Reports Positive Topline Results',
    source: 'Neuronetics',
    sourceUrl: 'https://neuronetics.com',
    date: '2025-11-30',
    category: 'clinical-trial',
    summary: 'Neuronetics reported positive topline results from its pivotal trial of NeuroStar TMS in adolescents with treatment-resistant depression.',
    body: `
      <p>Neuronetics reported positive topline results from its 169-patient pivotal trial of NeuroStar transcranial magnetic stimulation in adolescents aged 15-21 with treatment-resistant major depressive disorder. The active arm reported a 56% response rate compared with 26% in sham at six weeks.</p>
      <p>The data form the basis for the company's submission to the FDA seeking expanded labeling for adolescent depression — an indication currently not approved for any TMS device. An FDA advisory committee voted 9-2 in favor of the expanded indication earlier this month.</p>
      <p>Adverse events in the trial were similar to those seen in adult populations: transient scalp discomfort and mild headache. No seizures occurred. Motor threshold determination in adolescents was conducted using a slightly modified protocol to account for skull and brain volume differences.</p>
      <p>If the FDA approves the expanded labeling, Neuronetics expects commercial launch within roughly six months of the decision. Insurance coverage for adolescent indications would need to be established with major payers separately.</p>
    `,
    related: [
      { label: 'TMS for adolescents', href: '/demographics/teens-young-adults/' },
      ...standardRelated,
    ],
  },
  {
    id: 'magnus-acquisition-2025-10',
    headline: 'Magnus Medical Raises $90M Series C to Scale SAINT-Style Devices',
    source: 'MedTech Dive',
    sourceUrl: 'https://www.medtechdive.com',
    date: '2025-10-15',
    category: 'industry',
    summary: 'Magnus Medical raised $90 million in Series C funding to scale commercial deployment of its SAINT-style accelerated TMS protocol.',
    body: `
      <p>Magnus Medical, the company that received FDA clearance for the SAINT-derived SNT (Stanford Neuromodulation Therapy) protocol in 2022, raised $90 million in Series C funding to scale commercial deployment. The round was led by major healthcare-focused venture investors and brings total funding to approximately $215 million.</p>
      <p>Magnus's device differs from standard TMS systems in that it integrates resting-state functional MRI for personalized targeting and supports the high-throughput five-day SAINT-style protocol. The device is currently deployed at roughly 50 U.S. clinics, with expansion to an additional 100 sites planned over the next 18 months.</p>
      <p>Insurance coverage for accelerated SAINT-style protocols has been a persistent barrier; the recent Aetna policy change removing step-therapy requirements is expected to substantially improve coverage prospects across the broader payer mix.</p>
      <p>Industry analysts note that the funding round signals significant investor confidence in the accelerated TMS market segment, despite the hardware and infrastructure costs of fMRI-guided protocols.</p>
    `,
    related: [
      { label: 'Accelerated TMS protocols', href: '/research/accelerated-tms-protocols/' },
      ...standardRelated,
    ],
  },
  {
    id: 'tms-anxiety-disorders-2025-09',
    headline: 'Multi-Site Trial: TMS Effective for Generalized Anxiety Disorder',
    source: 'JAMA Psychiatry',
    sourceUrl: 'https://jamanetwork.com/journals/jamapsychiatry',
    date: '2025-09-04',
    category: 'clinical-trial',
    summary: 'A 215-patient multi-site trial reported significant anxiety reductions in patients with generalized anxiety disorder following six weeks of right dorsolateral prefrontal cortex TMS.',
    body: `
      <p>A 215-patient multi-site sham-controlled trial reported significant anxiety reductions in patients with generalized anxiety disorder following six weeks of right dorsolateral prefrontal cortex TMS. Hamilton Anxiety Rating Scale scores dropped by an average of 13.4 points in the active arm versus 5.8 points in sham.</p>
      <p>Patients enrolled in the trial had failed at least two prior treatments — typically including an SSRI and either buspirone or psychotherapy. The trial used 1Hz inhibitory stimulation, opposite to the protocol used in depression, reflecting different mechanistic theories about anxiety neurocircuitry.</p>
      <p>The findings position TMS as a potential evidence-based option for treatment-resistant generalized anxiety disorder. FDA clearance for an anxiety-specific indication is not yet pending, but the data may support an indication submission. Off-label TMS for anxiety is currently delivered at a small number of specialty clinics.</p>
      <p>Insurance coverage for anxiety-indicated TMS is currently rare. The American Psychiatric Association indicated the data would be reviewed in the next update of its anxiety disorders guidelines.</p>
    `,
    related: [
      { label: 'TMS for anxiety', href: '/treatments/anxiety-tms/' },
      ...standardRelated,
    ],
  },
  {
    id: 'fda-expanded-coverage-medicaid-2025-08',
    headline: 'Six State Medicaid Programs Add TMS Coverage in 2025',
    source: 'CMS',
    sourceUrl: 'https://www.cms.gov',
    date: '2025-08-12',
    category: 'insurance',
    summary: 'Six state Medicaid programs added or expanded coverage for TMS in the first half of 2025, bringing total state coverage to 38 states.',
    body: `
      <p>Six state Medicaid programs — including New Jersey, Louisiana, Idaho, Alabama, West Virginia, and Mississippi — added or expanded coverage for transcranial magnetic stimulation in the first half of 2025, bringing total state Medicaid coverage to 38 states. Twelve states still do not provide Medicaid coverage for TMS, all in the southeast and mountain west regions.</p>
      <p>State Medicaid coverage typically follows the structure of Medicare's national coverage decision, requiring documentation of failed antidepressant trials and a major depressive disorder diagnosis. Several state programs add additional state-specific criteria, such as documentation of psychotherapy attempts.</p>
      <p>Expansion has been driven in part by advocacy from state psychiatric associations and from cost-effectiveness analyses showing TMS is cost-saving versus continued sequential pharmacotherapy. The patient population covered by Medicaid expansion is significant: roughly one in five Americans is enrolled in Medicaid.</p>
      <p>Advocacy groups continue to push for federal Medicaid mandate consideration. The remaining 12 non-covering states have not signaled imminent policy changes.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'icd11-tms-codes-2025-07',
    headline: 'AMA Adds Two New CPT Codes Distinguishing Theta Burst from Standard TMS',
    source: 'American Medical Association',
    sourceUrl: 'https://www.ama-assn.org',
    date: '2025-07-22',
    category: 'industry',
    summary: 'The AMA added two new CPT codes that distinguish theta burst stimulation from standard 10Hz TMS, supporting differential payer reimbursement and tracking.',
    body: `
      <p>The American Medical Association added two new Current Procedural Terminology (CPT) codes effective January 2026 that distinguish theta burst transcranial magnetic stimulation from standard 10Hz repetitive TMS. The previous codes (90867-90869) bundled all TMS protocols regardless of stimulation pattern.</p>
      <p>The new codes are intended to support more accurate clinical tracking and to allow payers to set protocol-specific reimbursement if they choose. Many clinics deliver theta burst preferentially because of throughput advantages — sessions are typically 9-10 minutes versus 37 for standard 10Hz — but reimbursement until now has been identical regardless of session length.</p>
      <p>Industry response is mixed. Some clinics worry that theta burst-specific codes will be reimbursed at lower rates given shorter session times. The Clinical TMS Society indicated it will advocate for outcome-equivalent reimbursement, citing the 2025 meta-analysis showing equivalent efficacy.</p>
      <p>CMS is expected to issue guidance on Medicare reimbursement under the new codes by late 2025. Commercial payer policies typically follow Medicare with a 6-12 month lag.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-borderline-2025-06',
    headline: 'Pilot Study: TMS Reduces Affective Instability in Borderline Personality Disorder',
    source: 'Borderline Personality Disorder and Emotion Dysregulation',
    sourceUrl: 'https://bpded.biomedcentral.com',
    date: '2025-06-30',
    category: 'study',
    summary: 'A 54-patient pilot study reported reductions in affective instability and impulsivity in patients with borderline personality disorder following four weeks of dorsolateral prefrontal cortex TMS.',
    body: `
      <p>A 54-patient pilot study reported reductions in affective instability and impulsivity in patients with borderline personality disorder following four weeks of left dorsolateral prefrontal cortex TMS. The study was open-label and used standardized self-report and clinician-rated measures of borderline personality disorder symptomatology.</p>
      <p>Improvements were modest in absolute terms but consistent across multiple measures, with effects sustained at 12-week follow-up in roughly half of responders. Patients in the study continued to receive standard psychotherapy throughout treatment.</p>
      <p>The authors emphasize that the study is preliminary and uncontrolled, and that placebo effects in personality disorder symptom self-report are well documented. A randomized sham-controlled trial is being planned with funding from a private foundation.</p>
      <p>TMS for personality disorders remains entirely off-label and is delivered only at a small number of academic centers. Insurance coverage does not exist outside research settings. The findings nonetheless add to growing interest in TMS for disorders involving impulse control and emotional regulation.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-essential-tremor-2025-05',
    headline: 'Cerebellar TMS Reduces Symptoms in Essential Tremor Pilot Trial',
    source: 'Movement Disorders',
    sourceUrl: 'https://movementdisorders.onlinelibrary.wiley.com',
    date: '2025-05-04',
    category: 'study',
    summary: 'A 48-patient pilot trial reported reduced tremor amplitude in patients with essential tremor following 10 sessions of cerebellar TMS.',
    body: `
      <p>A 48-patient pilot trial reported reduced tremor amplitude in patients with essential tremor following 10 sessions of cerebellar transcranial magnetic stimulation. Tremor amplitude on standardized assessment dropped by approximately 28% in the active arm versus 9% in sham.</p>
      <p>Essential tremor affects roughly 1% of the global population and has limited evidence-based treatment options beyond beta-blockers and primidone, which provide partial relief in many patients. Surgical options exist but are reserved for severe cases.</p>
      <p>The trial used a low-frequency cerebellar protocol, distinct from the prefrontal protocols used for depression. Effects were sustained at four-week follow-up in roughly half of responders. Larger confirmatory trials are needed before clinical applications can be considered.</p>
      <p>Movement disorder specialists welcomed the findings while emphasizing the preliminary nature of the data. TMS for movement disorders is currently delivered only in research settings and is not covered by insurance for these indications.</p>
    `,
    related: standardRelated,
  },
  {
    id: 'tms-survey-physician-acceptance-2025-04',
    headline: 'Survey: 73% of Psychiatrists Now Refer Patients for TMS, Up from 41% in 2020',
    source: 'Psychiatric Services',
    sourceUrl: 'https://psychiatryonline.org/journal/ps',
    date: '2025-04-25',
    category: 'industry',
    summary: 'A national survey found 73% of psychiatrists now refer patients for transcranial magnetic stimulation, a substantial increase from 41% in a comparable 2020 survey.',
    body: `
      <p>A national survey of 1,840 U.S. psychiatrists found that 73% had referred at least one patient for transcranial magnetic stimulation in the past 12 months, up from 41% in a comparable 2020 survey. Familiarity with TMS clinical evidence and protocols was rated significantly higher in 2025 than in 2020.</p>
      <p>Barriers to referral most commonly cited were limited TMS clinic availability in the local area (44%), insurance coverage uncertainty (38%), and time required for patient education (29%). Concerns about TMS efficacy or safety were rare and decreased substantially compared with 2020.</p>
      <p>The survey suggests that TMS has moved from a specialty-restricted treatment to a widely accepted option in U.S. psychiatry, particularly for treatment-resistant depression. Coverage expansions and the publication of robust real-world outcomes data over the past three years are likely contributing factors.</p>
      <p>The American Psychiatric Association indicated the findings reinforce the case for incorporating TMS more prominently in residency training, where exposure remains uneven across programs.</p>
    `,
    related: standardRelated,
  },
];

export function getNewsByCategory(category: TMSNewsItem['category']) {
  return tmsNews.filter(n => n.category === category);
}

export function getRecentNews(limit = 10) {
  return [...tmsNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}

export function getNewsById(id: string) {
  return tmsNews.find(n => n.id === id);
}

export const categoryLabels: Record<TMSNewsItem['category'], string> = {
  fda: 'FDA Approvals',
  'clinical-trial': 'Clinical Trials',
  study: 'Research Studies',
  insurance: 'Insurance & Coverage',
  industry: 'Industry News',
  breakthrough: 'Breakthroughs',
};
