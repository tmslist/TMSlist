const fs = require('fs');

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const images = {
  basics: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=500',
  cost: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=800&h=500',
  medical: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&h=500',
  brain: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500',
  therapy: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500',
  compare: 'https://images.unsplash.com/photo-1579154204845-c131e44d66f3?w=800&h=500',
};

// Load existing
const dbPath = __dirname + '/../src/data/questions-comprehensive.json';
let questions = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
console.log(`Starting with ${questions.length} questions`);

// === COMPARISON QUESTIONS (60) ===
const comparisons = [
  ["TMS", "Ketamine"], ["TMS", "ECT"], ["TMS", "medication"], ["TMS", "antidepressants"],
  ["TMS", "SSRIs"], ["TMS", "therapy"], ["TMS", "CBT"], ["Deep TMS", "rTMS"],
  ["NeuroStar", "BrainsWay"], ["TMS", "Spravato"], ["TMS", "Lexapro"],
  ["TMS", "Zoloft"], ["TMS", "Prozac"], ["TMS", "Wellbutrin"], ["TMS", "Cymbalta"],
  ["TMS", "Effexor"], ["TMS", "Paxil"], ["TMS", "Celexa"], ["TMS", "vagus nerve stimulation"],
  ["TMS", "DBS"], ["NeuroStar", "MagVenture"], ["NeuroStar", "Mag & More"],
  ["BrainsWay", "MagVenture"], ["figure-8 coil", "H-coil"],
];

comparisonQuestions = [
  "Can I do TMS and medication together?", "Can I do TMS and therapy together?",
  "Is TMS better than ECT?", "Is TMS better than medication?",
  "Should I try TMS or Ketamine first?", "Should I try TMS or ECT first?",
  "Which TMS device is best?", "Which TMS machine should I choose?",
];

comparisons.forEach(([a, b]) => {
  const q = `${a} vs ${b}: Which is better?`;
  if (!questions.find(ex => ex.slug === slug(q))) {
    questions.push({
      id: `comparison-${questions.length + 1}`,
      question: q,
      category: 'comparisons',
      slug: slug(q),
      keywords: [a, b, 'comparison', 'vs'],
      quickAnswer: `${q} - Evidence-based comparison to help you choose the right depression treatment.`,
      fullAnswer: `## ${a} vs ${b}: Which is Better?\n\n**Direct Comparison**\n\nBoth ${a} and ${b} have their place in mental health treatment. The optimal choice depends on your specific symptoms, medical history, timeline, and insurance coverage.\n\n**Key Consideration Factors:**\n\n- **Mechanism of Action**: How each treatment works\n- **Timeline**: Speed to results\n- **Side Effects**: Safety profile\n- **Insurance Coverage**: Out-of-pocket costs\n- **Convenience**: Treatment schedule\n- **Durability**: How long results last\n\n**Making Your Decision**\n\nConsult with a board-certified psychiatrist who specializes in treatment-resistant depression. They can evaluate your full history and recommend the most appropriate approach. Many patients benefit from sequential or combination treatments.\n\n**Next Steps**\n\nUse our directory to find specialists who offer multiple treatment modalities and can provide personalized guidance.`,
      imageUrl: images.compare,
      relatedQuestions: [],
      citations: [{title: 'Comparative Treatment Studies', url: 'https://pubmed.ncbi.nlm.nih.gov'}]
    });
  }
});

comparisonQuestions.forEach(q => {
  if (!questions.find(ex => ex.question === q)) {
    questions. push({
      id: `comparison-q-${questions.length + 1}`,
      question: q,
      category: 'comparisons',
      slug: slug(q),
      keywords: q.split(' ').slice(0, 5),
      quickAnswer: `${q} - Expert guidance on choosing between depression treatment options.`,
      fullAnswer: `## ${q}\n\nThis is a crucial question when considering treatment options for depression. The answer depends on multiple factors unique to your situation.\n\n**Factors to Consider:**\n- Severity of symptoms\n- Previous treatment history\n- Timeline needs (rapid vs gradual improvement)\n- Insurance coverage\n- Personal preferences\n- Medical contraindications\n\nConsult with a psychiatrist experienced in multiple treatment modalities for personalized recommendations.`,
      imageUrl: images.compare,
      relatedQuestions: [],
      citations: [{title: 'Treatment Decision Making', url: 'https://pubmed.ncbi.nlm.nih.gov'}]
    });
  }
});

// === CONDITION-SPECIFIC QUESTIONS (80) ===
const conditions = [
  'depression', 'major depressive disorder', 'treatment-resistant depression',
  'anxiety', 'generalized anxiety disorder', 'panic disorder', 'social anxiety',
  'OCD', 'obsessive-compulsive disorder', 'PTSD', 'post-traumatic stress disorder',
  'bipolar disorder', 'bipolar depression', 'seasonal affective disorder', 'SAD',
  'postpartum depression', 'peripartum depression', 'chronic pain', 'fibromyalgia',
  'migraines', 'tinnitus', 'stroke recovery', 'Parkinson', 'Alzheimer',
  'ADHD', 'autism spectrum disorder', 'eating disorders', 'anorexia', 'bulimia',
  'smoking cessation', 'nicotine addiction', 'alcohol addiction', 'substance abuse',
  'insomnia', 'sleep disorders', 'chronic fatigue syndrome', 'long COVID',
  'brain fog', 'cognitive decline', 'memory problems'
];

conditions.forEach((cond) => {
  const questions_for_cond = [
    `Can TMS treat ${cond}?`,
    `Does TMS work for ${cond}?`,
    `Is TMS effective for ${cond}?`,
  ];
  
  questions_for_cond.forEach(q => {
    if (!questions.find(ex => ex.slug === slug(q))) {
      questions.push({
        id: `condition-${questions.length + 1}`,
        question: q,
        category: 'conditions',
        slug: slug(q),
        keywords: ['TMS', cond, 'treatment'],
        quickAnswer: `${q} Learn about TMS effectiveness for ${cond} based on FDA clearances and clinical research.`,
        fullAnswer: `## TMS for ${cond.charAt(0).toUpperCase() + cond.slice(1)}\n\n**FDA Clearance Status**\n\nTMS is FDA-cleared for major depressive disorder (2008) and OCD (2018). Research continues for other conditions.\n\n**Current Evidence**\n\nClinical trials have investigated TMS for ${cond}, with varying results. Effectiveness depends on:\n- Specific brain targets used\n- Treatment protocols and parameters\n- Patient selection criteria\n- Combination with other therapies\n\n**Treatment Considerations**\n\nIf you're considering TMS for ${cond}, consult with a psychiatrist experienced in neuromodulation therapies. Insurance coverage may vary for off-label uses.\n\n**Research & Clinical Trials**\n\nOngoing studies continue to explore TMS applications for ${cond}. Check clinicaltrials.gov for current research opportunities.`,
        imageUrl: images.medical,
        relatedQuestions: [],
        citations: [{title: `TMS Research for ${cond}`, url: 'https://clinicaltrials.gov'}]
      });
    }
  });
});

// === TECHNOLOGY & DEVICE QUESTIONS (50) ===
const devices = ['NeuroStar', 'BrainsWay', 'MagVenture', 'CloudTMS', 'Mag & More', 'Neuronetics', 'MagStim'];
const techBases = [
  'What TMS machines are FDA approved?', 'What is the best TMS device?',
  'What is figure-8 coil?', 'What is H-coil?', 'What is Deep TMS?',
  'How do TMS machines work?', 'What is the difference between TMS devices?',
  'Which TMS coil is better?', 'What is bilateral TMS?',
];

devices.forEach(d => {
  [`What is ${d}?`, `How does ${d} work?`, `Is ${d} FDA approved?`, `Where can I find ${d} clinics?`].forEach(q => {
    if (!questions.find(ex => ex.slug === slug(q))) {
      questions.push({
        id: `tech-${questions.length + 1}`,
        question: q,
        category: 'technology',
        slug: slug(q),
        keywords: [d, 'TMS', 'device', 'technology'],
        quickAnswer: `${q} - Learn about ${d} TMS technology, FDA clearances, and where to find treatment.`,
        fullAnswer: `## ${d} TMS System\n\n**Overview**\n\n${d} is a major TMS device manufacturer with FDA-cleared systems for depression treatment. The technology uses electromagnetic induction to stimulate brain regions associated with mood regulation.\n\n**Technical Specifications:**\n- Coil design and magnetic field characteristics\n- Treatment protocols and parameters\n- Session duration and intensity\n- FDA clearances and approved indications\n\n**Finding ${d} Providers**\n\nUse our clinic directory to locate providers offering ${d} treatment in your area. Filter by device type, insurance accepted, and location.\n\n**Clinical Evidence**\n\nAll FDA-cleared TMS devices have demonstrated efficacy in rigorous clinical trials. Device selection often depends on clinic availability and insurance coverage rather than significant outcome differences.`,
        imageUrl: images.brain,
        relatedQuestions: [],
        citations: [{title: 'FDA Medical Device Database', url: 'https://www.fda.gov/medical-devices'}]
      });
    }
  });
});

techBases.forEach(q => {
  if (!questions.find(ex => ex.question === q)) {
    questions.push({
      id: `tech-base-${questions.length + 1}`,
      question: q,
      category: 'technology',
      slug: slug(q),
      keywords: q.split(' ').slice(0, 4),
      quickAnswer: `${q} - Comprehensive guide to TMS technology and devices.`,
      fullAnswer: `## ${q}\n\n**TMS Technology Overview**\n\nMultiple TMS systems have received FDA clearance, each with unique technical specifications but similar clinical outcomes.\n\n**Key Technical Considerations:**\n- Coil design (figure-8 vs H-coil)\n- Magnetic field depth and focus\n- Pulse frequency and intensity\n- Treatment duration\n- FDA clearances\n\n**Making Your Choice**\n\nThe "best" device depends on your condition, insurance coverage, and local clinic availability. All FDA-cleared devices have proven efficacy.\n\nConsult with TMS providers to understand which systems they offer and why.`,
      imageUrl: images.brain,
      relatedQuestions: [],
      citations: [{title: 'TMS Device Technology', url: 'https://www.fda.gov/medical-devices'}]
    });
  }
});

console.log(`\n✅ Final database: ${questions.length} questions`);
console.log(`- Categories: basics, cost, comparisons, conditions, technology`);

fs.writeFileSync(dbPath, JSON.stringify(questions, null, 2));
console.log(`Wrote to questions-comprehensive.json`);
