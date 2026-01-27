// Script to generate comprehensive Q&A database
const fs = require('fs');

const fullQuestions = [
  // Cost & Insurance (continuing from 5)
  {
    id: "does-insurance-cover-tms",
    question: "Does insurance cover TMS?",
    category: "cost",
    slug: "does-insurance-cover-tms",
    keywords: ["TMS insurance coverage", "insurance for TMS", "TMS coverage"],
    quickAnswer: "Yes, most major insurance plans cover TMS therapy for FDA-approved conditions like treatment-resistant depression. Coverage typically requires documentation that you've tried and failed at least 4 antidepressant medications.",
    fullAnswer: "Insurance coverage for TMS has dramatically improved since 2011. Major insurers now recognize TMS as a medically necessary treatment for treatment-resistant depression.\n\n**Coverage Requirements**:\nMost insurers require:\n- Diagnosis of Major Depressive Disorder (MDD)\n- Failed trials of 4+ antidepressants from different classes\n- Current depressive episode documented by PHQ-9 or similar\n- Evaluation by a psychiatrist\n- No contraindications (metal implants near head)\n\n**Major Insurers Covering TMS**:\n- Medicare/Medicaid (most states)\n- Blue Cross Blue Shield\n- Aetna\n- Cigna\n- UnitedHealthcare\n- Humana\n- Anthem\n\n**Prior Authorization Process**:\nYour TMS clinic typically handles this. They'll submit medical records, medication history, and psychiatric evaluation. Approval usually takes 7-14 days.\n\n**Out-of-Pocket Costs**:\nWith insurance, expect: $500-$3,000 total depending on deductible and co-insurance.",
    imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=500&fit=crop",
    relatedQuestions: ["how-much-does-tms-cost", "does-medicare-cover-tms", "tms-prior-authorization"],
    citations: [
      {title: "Clinical TMS Society Insurance Database", url: "https://www.clinicaltmssociety.org/insurance"}
    ]
  },
  {
    id: "does-medicare-cover-tms",
    question: "Does Medicare cover TMS?",
    category: "cost",
    slug: "does-medicare-cover-tms",
    keywords: ["Medicare TMS", "Medicare coverage", "TMS seniors"],
    quickAnswer: "Yes, Medicare Part B covers TMS therapy for treatment-resistant depression. Patients must meet specific criteria including failure of at least one antidepressant trial and evaluation by a psychiatrist.",
    fullAnswer: "Medicare has covered TMS since 2011 under Part B (Medical Insurance). This is excellent news for seniors struggling with depression.\n\n**Medicare Coverage Criteria**:\n- Age 18 or older\n- Diagnosis of treatment-resistant depression\n- Failed at least ONE adequate antidepressant trial\n- No psychotic features\n- Not currently benefiting from ECT\n\n**What Medicare Pays**:\nMedicare covers 80% of the approved amount after you meet your Part B deductible ($240 in 2024). You're responsible for:\n- Part B deductible\n- 20% coinsurance\n\nTotal out-of-pocket: typically $2,000-$4,000 for full course\n\n**Medicare Advantage Plans**:\nMany Medicare Advantage plans offer even better coverage with lower copays. Check your specific plan.\n\n**Finding Medicare-Approved Providers**:\nEnsure your clinic accepts Medicare assignment to avoid balance billing.",
    imageUrl: "https://images.unsplash.com/photo-1576765608866-5b51046452be?w=800&h=500&fit=crop",
    relatedQuestions: ["does-insurance-cover-tms", "how-much-does-tms-cost", "medicare-tms-requirements"],
    citations: [
      {title: "Medicare Coverage of TMS", url: "https://www.medicare.gov/coverage/transcranial-magnetic-stimulation-tms"}
    ]
  },
  {
    id: "tms-vs-ketamine",
    question: "TMS vs Ketamine: Which is better?",
    category: "comparisons",
    slug: "tms-vs-ketamine",
    keywords: ["TMS ketamine comparison", "ketamine vs TMS", "alternative depression treatments"],
    quickAnswer: "TMS and Ketamine work differently. TMS uses magnetic pulses and requires daily sessions for 4-6 weeks, while Ketamine is administered via infusion and can provide rapid relief. Both are FDA-cleared for depression, and the choice depends on individual needs, timeline, and medical history.",
    fullAnswer: "Both TMS and Ketamine are revolutionary depression treatments, but they work through entirely different mechanisms.\n\n**TMS (Transcranial Magnetic Stimulation)**:\n- Mechanism: Magnetic brain stimulation\n- Timeline: 20-30 sessions over 4-6 weeks\n- Onset: Gradual improvement by week 3-4\n- Duration: Effects can last 12+ months\n- Side Effects: Minimal (scalp discomfort, rare headache)\n- Insurance: Widely covered\n\n**Ketamine Therapy**:\n- Mechanism: NMDA receptor antagonist (IV infusion)\n- Timeline: 6-8 infusions over 2-4 weeks\n- Onset: Often within hours or days\n- Duration: Typically 2-6 weeks, requires maintenance\n- Side Effects: Dissociation during infusion, nausea\n- Insurance: Limited coverage (improving)\n\n**Which Is Better?**\n\n**Choose TMS if you**:\n- Want long-lasting results\n- Prefer non-medication approach\n- Have insurance coverage\n- Can commit to daily visits\n\n**Choose Ketamine if you**:\n- Need rapid relief (suicidal ideation)\n- Haven't responded to TMS\n- Can afford out-of-pocket costs\n- Willing to do maintenance\n\n**Can You Do Both?**\nYes, some patients combine treatments under medical supervision.",
    imageUrl: "https://images.unsplash.com/photo-1579154204845-c131e44d66f3?w=800&h=500&fit=crop",
    relatedQuestions: ["tms-vs-ect", "what-is-ketamine-therapy", "tms-effectiveness"],
    citations: [
      {title: "Comparative Efficacy of TMS and Ketamine", url: "https://pubmed.ncbi.nlm.nih.gov/34218378/"}
    ]
  }
];

console.log('Generated', fullQuestions.length, 'questions');
console.log(JSON.stringify(fullQuestions, null, 2));
