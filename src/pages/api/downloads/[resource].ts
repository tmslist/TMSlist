import type { APIRoute } from 'astro';

// All available resources with their content
const RESOURCES: Record<string, { title: string; subtitle: string; sections: { title: string; content: string }[]; audience?: string }> = {
  'tms-buyers-guide': {
    title: "The Complete TMS Buyer\'s Guide",
    subtitle: "Everything you need to know before choosing a TMS provider",
    sections: [
      { title: "What is TMS Therapy?", content: "Transcranial Magnetic Stimulation (TMS) is a non-invasive procedure that uses magnetic fields to stimulate nerve cells in the brain to improve symptoms of depression. TMS is typically used when other treatments have not been effective." },
      { title: "How to Choose the Right Clinic", content: "Look for: board-certified psychiatrists overseeing treatment, FDA-cleared devices (NeuroStar, BrainsWay, MagVenture), transparent pricing, clean facility, positive patient reviews, and insurance billing support." },
      { title: "Questions to Ask Your Provider", content: "1. What device do you use? 2. Who supervises treatment? 3. How many patients have you treated? 4. What are your success rates? 5. Do you handle insurance pre-authorization? 6. What is included in the total cost?" },
      { title: "What to Expect", content: "A typical TMS course is 36 sessions over 6-9 weeks. Each session lasts 20-40 minutes. You remain awake and can resume normal activities immediately. Most patients describe the sensation as a tapping on the scalp." },
      { title: "Insurance Coverage", content: "Medicare, VA, Tricare, and most major insurance plans cover TMS for treatment-resistant depression. Most require: diagnosis of MDD, failure of 1-4 antidepressants, and prior authorization." },
      { title: "Red Flags", content: "Avoid clinics that: guarantee results, lack physician oversight, quote unusually low prices, refuse to show you the equipment, or pressure you to commit before consultation." },
    ],
  },
  'tms-vs-medication': {
    title: "TMS vs. Medication: An Honest Comparison",
    subtitle: "Compare treatment options side by side",
    sections: [
      { title: "Effectiveness", content: "TMS: 50-60% response rate, ~33% remission. Antidepressants: 40-60% response rate, ~30% remission. TMS works faster (weeks vs. months) for many patients." },
      { title: "Side Effects", content: "TMS: mild scalp discomfort, headache (usually resolves). Antidepressants: nausea, weight gain, sexual dysfunction, fatigue, insomnia — can be persistent." },
      { title: "Invasiveness", content: "TMS: completely non-invasive, no surgery, no anesthesia, no hospitalization. Antidepressants: oral medication, enters bloodstream systemically." },
      { title: "Cost", content: "TMS: $6,000-15,000 per course. Insurance often covers most. Antidepressants: $20-200/month. Long-term use adds up, plus management of side effects." },
      { title: "Time Commitment", content: "TMS: daily visits for 4-9 weeks. Antidepressants: daily pill, ongoing indefinitely." },
      { title: "Which Should You Choose?", content: "If medication side effects are unbearable, TMS is worth exploring. Many patients do both — TMS can help when medications stop working. Discuss with your psychiatrist." },
    ],
  },
  'insurance-checklist': {
    title: "TMS Insurance Pre-Authorization Checklist",
    subtitle: "Step-by-step guide to getting your treatment approved",
    sections: [
      { title: "Step 1: Confirm Diagnosis", content: "Ensure your chart shows Major Depressive Disorder (MDD) as primary diagnosis. Insurance typically requires this before approving TMS." },
      { title: "Step 2: Document Medication Failures", content: "Insurance requires proof you tried 1-4 antidepressants without adequate relief. Gather records of: medication names, doses tried, duration, and reasons discontinued." },
      { title: "Step 3: Get Your Clinic to Lead", content: "Reputable TMS clinics have dedicated insurance coordinators who handle pre-authorization. Ask your clinic if they handle this for you." },
      { title: "Step 4: Required Documents", content: "Prior authorization request, letter of medical necessity from your psychiatrist, medication history, PHQ-9 depression scores, and treatment plan." },
      { title: "Step 5: Follow Up", content: "Medicare: 1-3 days. Private insurance: 5-30 days. If denied: file an appeal within 30 days. Most denials are reversed on first appeal." },
      { title: "If Denied", content: "Request the denial in writing. File a formal appeal. Ask your doctor for a peer-to-peer review. Consider the clinic\'s cash-pay options as a backup plan." },
    ],
  },
  'tms-billing-cpt-codes-2026': {
    title: "TMS Billing & CPT Codes Guide 2026",
    subtitle: "What providers and patients need to know about TMS billing",
    sections: [
      { title: "CPT Codes", content: "90867 — TMS navigation (initial) | 90868 — TMS navigation (subsequent) | 90869 — TMS retreatment | CPT 90867 is used for the motor threshold mapping session." },
      { title: "ICD-10 Codes", content: "F32.1-F32.9 (Major depressive disorder, single episode) | F33.1-F33.9 (Major depressive disorder, recurrent) | F06.31 (Depression due to known physiological condition)" },
      { title: "Insurance Reimbursement", content: "Medicare reimbursement: ~$200-400/session | Commercial insurers vary: $150-500/session | Most patients need 36 sessions + mapping = 37 units total." },
      { title: "Authorization Tips", content: "Pre-authorization is required by most insurers. Document treatment-resistant depression clearly. Many insurers now cover theta burst (iTBS) under the same codes." },
      { title: "Self-Pay Pricing", content: "Self-pay patients typically pay $200-400/session. Package deals (36 sessions) can reduce per-session cost to $150-250. Always ask about cash discounts." },
    ],
  },
  'tms-patient-acquisition-playbook': {
    title: "TMS Clinic Patient Acquisition Playbook",
    subtitle: "Proven strategies to fill your TMS schedule",
    sections: [
      { title: "Build Your Referral Network", content: "Psychiatrists, therapists, PCPs, and OB/GYNs are your top referral sources. Offer them lunch-and-learns. Provide ROI data on their patients\' outcomes." },
      { title: "Optimize Your Online Presence", content: "Google Business Profile is critical. Respond to every review. Publish weekly content on your blog. TMSList.com is a key directory to claim and optimize." },
      { title: "Run Targeted Ads", content: "Meta ads targeting adults 25-65 interested in mental health. Google Search ads for: \"TMS clinic [city]\", \"depression treatment [city]\", \"medication-free depression treatment\"." },
      { title: "Leverage Insurance", content: "Being in-network with Medicare + major insurers unlocks 60%+ of your market. Credentialing takes 3-6 months — start now." },
      { title: "Patient Education", content: "Host free educational webinars monthly. Offer free consultations. Create content explaining what TMS is and isn\'t — most people still don\'t know about it." },
    ],
  },
  'tms-prior-authorization-template-kit': {
    title: "TMS Prior Authorization Template Kit",
    subtitle: "Ready-to-use templates for insurance approvals",
    sections: [
      { title: "Letter of Medical Necessity Template", content: "Include: patient name, DOB, diagnosis, medication history (list all trials with dates), current PHQ-9 score, why TMS is clinically appropriate, expected treatment outcomes, and physician signature." },
      { title: "Medication Trial Documentation", content: "Template: \"Patient has failed trials of [medication name], [dose], for [duration] (discontinued [date] due to [reason]). Document at least 2-4 medication failures with different drug classes." },
      { title: "Pre-Authorization Checklist", content: "□ Diagnosis code F32.1+ or F33.1+ | □ 2+ medication failures documented | □ PHQ-9 score ≥ 15 | □ No contraindications | □ Supervising physician credentials attached" },
      { title: "Appeal Letter Template", content: "State: \"This appeal is filed pursuant to [insurance name] grievance procedures.\" Cite the specific coverage criteria you meet. Include supporting clinical literature. Request peer-to-peer review." },
      { title: "HIPAA Authorization Template", content: "Include: patient authorization, purpose of disclosure, what information may be shared, expiration date, patient signature line, and clinic contact information." },
    ],
  },
  'starting-a-tms-clinic-business-plan': {
    title: "Starting a TMS Clinic: Business Plan Guide",
    subtitle: "From feasibility to profitability",
    sections: [
      { title: "Market Analysis", content: "Target market: 16 million Americans with treatment-resistant depression. ~3,000 TMS clinics currently in the US. Growth potential in suburban and rural areas underserved by psychiatry." },
      { title: "Equipment Costs", content: "NeuroStar: ~$75,000 | BrainsWay Deep TMS: ~$90,000 | MagVenture: ~$65,000 | Pre-owned equipment: 30-50% discount available. Lease options: $3,000-5,000/month." },
      { title: "Operational Costs", content: "Staff: psychiatrist oversight, TMS technician, front desk (~$200-350K/year for 2 FTE). Space: 500-800 sq ft for 2 chairs. Consumables: ~$50/patient. Revenue: $400-600/session average." },
      { title: "Revenue Model", content: "Break-even at ~4-6 patients/week at full capacity. Medicare reimbursement: ~$200-350/session. Self-pay: $200-400/session. 36-session protocol = $7,200-21,600 gross per patient." },
      { title: "Credentialing", content: "Medicare: 3-6 months to credential. Medicaid: varies by state. Commercial insurers: 2-5 months. Start all applications simultaneously to reduce delay." },
      { title: "Compliance Requirements", content: "HIPAA-compliant EMR, FDA-cleared devices only, physician supervision required, state medical board compliance, malpractice insurance ($500-2,000/year)." },
    ],
  },
  'tms-patient-outcome-tracking-system': {
    title: "TMS Patient Outcome Tracking System",
    subtitle: "Measure and demonstrate treatment results",
    sections: [
      { title: "PHQ-9 Tracking", content: "Administer PHQ-9 at: intake, week 1, week 4, week 6, end of treatment, and 1/3/6-month follow-ups. Target: 50% reduction or score < 10 = clinically meaningful improvement." },
      { title: "GAD-7 for Anxiety", content: "Track anxiety co-morbidity separately with GAD-7. TMS is now in trials for GAD — collecting this data positions your clinic for future insurance expansions." },
      { title: "Patient Satisfaction Surveys", content: "Use a standardized tool (e.g., NPS) monthly. Share aggregate results with referring providers. Publish anonymized outcome statistics on your website." },
      { title: "Side Effect Log", content: "Document headache severity (0-10 scale), scalp discomfort, any adverse events. Most side effects peak in week 1 and resolve. This data protects you in rare liability cases." },
      { title: "Using Data", content: "Outcome data drives insurance negotiations, referring physician confidence, patient trust, and research publications. Aim for published outcomes — it\'s the best marketing." },
    ],
  },
  'tms-technician-training-checklist': {
    title: "TMS Technician Training Checklist",
    subtitle: "Comprehensive guide for new TMS technicians",
    sections: [
      { title: "Day 1: Fundamentals", content: "□ Understand TMS physics (Faraday\'s law, magnetic field induction) | □ Learn anatomy of the prefrontal cortex | □ Watch 3 supervised patient sessions | □ Review FDA clearance documentation" },
      { title: "Week 1: Hands-On", content: "□ Perform motor threshold mapping on 5+ patients | □ Practice coil positioning | □ Master the device interface (model-specific) | □ Study emergency protocols" },
      { title: "Month 1: Competency", content: "□ Independently run 20+ sessions | □ Demonstrate accurate targeting | □ Handle patient questions confidently | □ Document in EMR correctly | □ Pass competency assessment" },
      { title: "Ongoing Skills", content: "Stay current on new protocols (theta burst, accelerated TMS). Attend annual conferences (Clinical TMS Society). Maintain CPR certification. Complete required continuing education." },
      { title: "Patient Communication", content: "Explain what TMS feels like before each session. Set realistic expectations about timeline. Check in on mood changes. Know when to escalate to the supervising physician." },
    ],
  },
  'tms-state-regulations-guide-2026': {
    title: "TMS State Regulations Guide 2026",
    subtitle: "Navigating TMS regulations across the United States",
    sections: [
      { title: "Federal Requirements", content: "TMS devices must be FDA-cleared. Treatment must be supervised by a licensed physician (MD or DO). Psychiatric evaluation required before treatment. Informed consent required." },
      { title: "State Variations", content: "CA: stricter informed consent requirements | TX: specific training requirements | NY: mental health parity compliance essential | FL: telehealth follow-up allowed | Most states follow federal guidelines closely." },
      { title: "Telehealth Rules", content: "Post-pandemic telehealth flexibilities vary by state. Initial consultation can often be telehealth. In-person visits required for mapping and treatment." },
      { title: "Mental Health Parity", content: "Federal law requires equal coverage for mental and physical health. If your state has strong parity laws (CA, NY, TX), leverage them in insurance appeals. Document discrimination." },
      { title: "Staying Compliant", content: "Join the Clinical TMS Society (clinicaltmssociety.org) for regulatory updates. Subscribe to your state medical board newsletter. Review FDA safety communications quarterly." },
    ],
  },
  'building-tms-referral-network': {
    title: "Building a TMS Referral Network",
    subtitle: "Strategies to build sustainable referral channels",
    sections: [
      { title: "Target Referral Sources", content: "Priority 1: Psychiatrists treating TRD patients | Priority 2: Psychologists/therapists | Priority 3: PCPs in your area | Priority 4: OB/GYNs (postpartum patients) | Priority 5: VA hospitals" },
      { title: "Outreach Methods", content: "Lunch-and-learns at their offices. Send personalized introduction letters with outcome data. Offer free in-services for their staff. Respond to referrals within 24 hours with outcome updates." },
      { title: "Value You Provide to Referrers", content: "Handle all insurance prior authorization. Send monthly outcome updates. Provide same-week consult scheduling. Send copies of all clinical notes. Make them look good to their patients." },
      { title: "Digital Presence for Referrers", content: "Create a \"For Providers\" page on your website. Offer a simple referral form. Provide referring physicians with branded patient education materials they can hand out." },
      { title: "Measuring Success", content: "Track: referral volume/month, referral source, conversion rate (referred → treated), time from referral to first appointment. Goal: 80%+ conversion on warm referrals." },
    ],
  },
  'tms-ocd-guide': {
    title: "TMS for OCD: Complete Treatment Guide",
    subtitle: "Deep TMS protocols, FDA clearance, and 2-year outcomes",
    sections: [
      { title: "FDA Clearance for OCD", content: "BrainsWay Deep TMS received FDA clearance for OCD in 2018. The only FDA-cleared TMS device for OCD. Standard rTMS also shows strong evidence but is used off-label." },
      { title: "How It Works", content: "OCD involves hyperactive circuits between the prefrontal cortex and anterior cingulate cortex. Deep TMS uses an H-coil to reach deeper brain structures more effectively than figure-8 coils." },
      { title: "The Protocol", content: "29 daily sessions over 6 weeks (standard protocol). Sessions are 18 minutes each. Patients typically show response by week 3-4. Many continue maintenance sessions weekly or biweekly." },
      { title: "2-Year Outcomes", content: "58% maintained improvement at 2 years. 42% achieved remission. Response rates are comparable to ERP (Exposure and Response Prevention) therapy — and they can be combined." },
      { title: "Combining with Therapy", content: "TMS + ERP (Cognitive Behavioral Therapy for OCD) shows the best outcomes. TMS reduces the anxiety that makes ERP difficult. Many clinics offer both simultaneously." },
      { title: "Insurance Coverage", content: "Most insurers cover TMS for OCD as an FDA-cleared indication. Pre-authorization required. Some insurers may still require depression diagnosis as primary. Appeal if denied." },
    ],
  },
  'tms-anxiety-guide': {
    title: "TMS for Anxiety: Treatment Guide",
    subtitle: "FDA breakthrough designation and what it means for patients",
    sections: [
      { title: "FDA Breakthrough Therapy Designation", content: "In 2024, TMS received Breakthrough Therapy Designation from the FDA for generalized anxiety disorder (GAD). This accelerates the path to full approval for anxiety indications." },
      { title: "How TMS Treats Anxiety", content: "Anxiety involves hyperconnectivity in prefrontal-striatal circuits. TMS to the right dlPFC can reduce this hyperactivity, calming the anxiety response without sedation or medication." },
      { title: "Evidence Base", content: "Multiple RCTs show significant anxiety reduction. Stanford study: 50%+ reduction in Hamilton Anxiety Scale scores. Works especially well for patients who have not responded to CBT or medication." },
      { title: "What to Expect", content: "Anxiety protocols often use lower stimulation intensity than depression protocols. Some patients feel immediate calming during sessions. Full effect typically seen by week 4-6." },
      { title: "Combined with Depression", content: "Many patients have both depression and anxiety. TMS can treat both simultaneously. The anxiety reduction often happens faster than depression improvement." },
      { title: "Insurance Status", content: "FDA clearance currently covers depression, OCD, and smoking cessation. Anxiety is off-label but increasingly covered. The Breakthrough Designation signals insurers will likely expand coverage soon." },
    ],
  },
  'tms-veterans-guide': {
    title: "TMS for Veterans & VA Coverage Guide",
    subtitle: "VA benefits, Community Care, and treating PTSD with TMS",
    sections: [
      { title: "VA Coverage for TMS", content: "The VA covers TMS for depression and OCD at VA medical centers that offer it. Coverage requires: failed medication trials, referral from VA psychiatrist, and meeting clinical criteria." },
      { title: "VA Community Care", content: "If your VA does not offer TMS, or if you cannot travel, you may qualify for Community Care. This allows you to receive TMS at a community provider at VA expense. Ask your VA care coordinator." },
      { title: "TMS for PTSD", content: "TMS is not FDA-cleared for PTSD but is used off-label with growing evidence. The Stanford Neuromodulation Therapy (SNT) protocol shows particular promise for PTSD. Many veterans see significant improvement." },
      { title: "How to Get a Referral", content: "Step 1: Talk to your VA psychiatrist about TMS. Step 2: If interested, they will assess clinical criteria. Step 3: They submit a referral to the TMS program. Step 4: Intake appointment and treatment planning." },
      { title: "Wait Times", content: "VA TMS programs have waitlists. Community Care can often get you seen faster. The MISSION Act gives veterans more choice — use it if you have a community TMS provider near you." },
      { title: "Telehealth Options", content: "Initial consultation can often be done via VA Video Connect. In-person visits required for mapping and treatment. Some follow-up appointments may be virtual depending on the program." },
    ],
  },
  'tms-pregnancy-guide': {
    title: "TMS During Pregnancy: Safety Guide",
    subtitle: "What the data shows for pregnant and breastfeeding mothers",
    sections: [
      { title: "The Safety Case", content: "TMS does not enter the bloodstream, making it uniquely suited for pregnant women. Unlike antidepressants, there is no fetal exposure to medication through placental transfer." },
      { title: "Evidence from Meta-Analysis", content: "A 2025 meta-analysis of 400+ pregnant patients found: no increase in miscarriage, no increase in birth defects, no increase in preterm labor, and no adverse fetal outcomes compared to controls." },
      { title: "ACOG & APA Position", content: "The American College of Obstetricians and Gynecologists recognizes TMS as a low-risk option. The American Psychiatric Association supports TMS as a first-line non-pharmacologic option for perinatal depression." },
      { title: "Breastfeeding", content: "TMS is fully compatible with breastfeeding. No medication enters breast milk. Women can breastfeed immediately after sessions. This is a major advantage over most antidepressants." },
      { title: "Practical Considerations", content: "Positioning: lying flat may be uncomfortable late in pregnancy — some clinics offer reclined chairs.Sessions can continue through all trimesters. Coordinate with your OB/GYN and psychiatrist." },
      { title: "When to Consider TMS", content: "If antidepressants were not effective or caused unacceptable side effects during pregnancy. If you want to avoid medication exposure. As a bridge during pregnancy when tapering off antidepressants." },
    ],
  },
  'tms-adolescent-guide': {
    title: "TMS for Adolescents: Parent\'s Guide",
    subtitle: "FDA status, age requirements, and what parents need to know",
    sections: [
      { title: "FDA Status for Minors", content: "TMS is FDA-cleared for depression in adults (18+). It is used off-label for adolescents (typically 15+) based on growing research. NeuroStar has FDA clearance for adolescents aged 15-21." },
      { title: "Evidence for Teens", content: "Multiple studies in adolescents show TMS is safe and effective for treatment-resistant depression. Response rates: 40-50%. Most common age range in studies: 13-21. Younger teens require pediatric expertise." },
      { title: "What Makes It Different for Teens", content: "Teen brains respond faster to TMS than adult brains due to greater neuroplasticity. Shorter treatment courses may be effective. Some teens need booster sessions as brains continue developing." },
      { title: "Parental Consent Required", content: "Both parents or guardians must consent. A pediatric psychiatrist must oversee treatment. Teens must be able to sit still for 20-40 minutes with the coil on their head." },
      { title: "Fitting Around School", content: "Many clinics offer early morning or after-school sessions. Accelerated protocols (5 days instead of 6 weeks) can reduce school disruption. Home-based maintenance is being studied." },
      { title: "Alternatives to Discuss", content: "CBT and DBT are first-line for adolescents. TMS is considered after therapy + medication fails. Family-based treatment should accompany TMS for best outcomes." },
    ],
  },
  'tms-maintenance-plan': {
    title: "TMS Maintenance & Long-Term Plan",
    subtitle: "Preventing relapse and extending your TMS results",
    sections: [
      { title: "Why Maintenance Matters", content: "Without maintenance, 30-50% of responders relapse within 6-12 months. Depression is chronic. Maintenance TMS is standard of care, not optional — plan for it from the start." },
      { title: "Maintenance Protocol Options", content: "Monthly booster sessions: most common, 1 session/month | As-needed: when PHQ-9 rises above threshold | Combination: monthly + as-needed boosters | Tapering schedule: reduce frequency gradually over 3-6 months" },
      { title: "Natural Maintenance Boosters", content: "Regular exercise: 30 min/day reduces relapse risk by 40% | Sleep hygiene: depression and sleep are tightly linked | Continuing therapy: CBT maintenance sessions | Social connection: isolation triggers relapse" },
      { title: "Early Warning Signs", content: "Track your mood weekly using PHQ-9. Warning signs: sleep changes, appetite shifts, withdrawing from people, pessimistic thinking returning. Intervene early — do not wait for full relapse." },
      { title: "Working with Your Clinic", content: "Ask your TMS provider about their maintenance protocol before ending acute treatment. Many clinics offer maintenance plans at reduced rates. Some offer remote check-ins between booster sessions." },
      { title: "Insurance for Maintenance", content: "Most insurers cover maintenance TMS. Medicare covers it. Some require prior auth for boosters. Keep documentation of acute phase outcomes to support maintenance authorization." },
    ],
  },
  'tms-cost-planning-guide': {
    title: "TMS Cost Planning Guide 2026",
    subtitle: "Understanding and reducing your TMS treatment costs",
    sections: [
      { title: "Total Cost Breakdown", content: "New patient consultation: $200-500 | Motor threshold mapping: $200-400 | Per session: $200-400 | Full course (36 sessions): $7,200-14,400 | Follow-up visits: $100-200 each" },
      { title: "Self-Pay vs Insurance", content: "Self-pay total: $7,000-20,000 (can be lower with packages). Insurance with deductible: you pay deductible first, then coinsurance (typically 20%). Insurance total out-of-pocket: $500-3,000 typically." },
      { title: "Reducing Costs", content: "Negotiate cash prices: most clinics offer 20-40% discounts for self-pay. Ask about package deals. Use FSA/HSA funds. Check if your clinic offers income-based sliding scale." },
      { title: "Insurance Tips", content: "Verify benefits before starting. Ask for a superbill to submit to your insurance. If in-network, costs are lower. If out-of-network, ask about single case agreements." },
      { title: "FSA and HSA", content: "TMS is an eligible medical expense under FSA and HSA. You can use pre-tax dollars. Most providers accept FSA/HSA cards. Save receipts for FSA reimbursement if needed." },
      { title: "Financing Options", content: "CareCredit: healthcare credit card with 0% intro offers. Some clinics offer in-house payment plans. Medical tourism: treatment in border cities can be 50% cheaper including travel." },
    ],
  },
  'tms-combination-therapy-guide': {
    title: "TMS Combination Therapy Guide",
    subtitle: "TMS + medication, ketamine, psychotherapy, and more",
    sections: [
      { title: "TMS + Antidepressants", content: "Standard practice. Most patients stay on their medication during TMS. Some slowly taper off after remission. Continuing meds provides a safety net during maintenance phase." },
      { title: "TMS + Ketamine", content: "Emerging combination. Ketamine provides rapid relief while TMS builds longer-term change. Some clinics offer same-day sequential treatment. Still experimental — discuss risks with your doctor." },
      { title: "TMS + CBT / Psychotherapy", content: "Strong evidence for combination. Therapy provides coping skills while TMS addresses neurobiology. Many clinics embed therapy into treatment plans. Best outcomes reported with combined treatment." },
      { title: "TMS + Spravato", content: "Used for severe treatment-resistant depression. Spravato works quickly; TMS builds durability. Combination is typically reserved for patients who have failed multiple monotherapies." },
      { title: "TMS + ECT", content: "Not typically done simultaneously. TMS may be used after ECT to maintain improvements. TMS is non-invasive and can be an alternative to ECT for some patients." },
      { title: "What to Discuss with Your Doctor", content: "What combination is right for your specific case? What is the sequencing? Will combination increase side effects? What are the costs and insurance implications of multiple treatments?" },
    ],
  },
};

// Generate HTML for a resource
function generateResourceHTML(resource: typeof RESOURCES[string]): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sectionsHtml = resource.sections.map(s => {
    return '<div class="section">' +
      '<h2>' + s.title + '</h2>' +
      '<p>' + s.content + '</p>' +
      '</div>';
  }).join('\n');

  const html = '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + resource.title + '</title>\n' +
    '<style>\n' +
    '  * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
    '  body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; color: #1e293b; line-height: 1.6; padding: 48px; max-width: 800px; margin: 0 auto; }\n' +
    '  .header { border-bottom: 3px solid #6366f1; padding-bottom: 24px; margin-bottom: 32px; }\n' +
    '  .header h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }\n' +
    '  .header p { color: #64748b; font-size: 14px; }\n' +
    '  .section { margin-bottom: 24px; }\n' +
    '  .section h2 { font-size: 16px; font-weight: 700; color: #4338ca; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }\n' +
    '  .section p { font-size: 14px; color: #475569; }\n' +
    '  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }\n' +
    '  @media print { body { padding: 0; } }\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div class="header">\n' +
    '  <h1>' + resource.title + '</h1>\n' +
    '  <p>' + resource.subtitle + ' \u2014 Updated ' + date + ' \u2014 Free resource from TMS List</p>\n' +
    '</div>\n' +
    sectionsHtml + '\n' +
    '<div class="footer">\n' +
    '  <p>Provided by TMS List \u2014 Find verified TMS clinics at tmslist.com</p>\n' +
    '  <p>This resource is for educational purposes only. Consult your healthcare provider for medical advice.</p>\n' +
    '</div>\n' +
    '</body>\n' +
    '</html>';

  return html;
}

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { resource } = params;
  if (!resource || !RESOURCES[resource]) {
    return new Response(JSON.stringify({ error: 'Resource not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = RESOURCES[resource];
  const html = generateResourceHTML(res);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${resource}.html"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
