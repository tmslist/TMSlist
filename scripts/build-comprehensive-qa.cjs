const fs = require('fs');

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const images = {
  basics: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=500',
  cost: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=800&h=500',
  medical: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&h=500',
  brain: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500',
  therapy: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500',
};

const questions = [];

// Load existing expanded questions as base
const expandedPath = __dirname + '/../src/data/questions-expanded.json';
if (fs.existsSync(expandedPath)) {
  const existing = JSON.parse(fs.readFileSync(expandedPath, 'utf-8'));
  questions.push(...existing);
  console.log(`Loaded ${existing.length} existing questions`);
}

// TMS BASICS questions
const basicsQs = [
  "What is TMS therapy", "How does TMS work", "Is TMS FDA approved", "Does TMS hurt",
  "What does TMS feel like", "How long does a TMS session last", "How many TMS sessions do I need",
  "What are the side effects of TMS", "Is TMS safe", "Can TMS cause seizures",
  "What is the success rate of TMS", "How effective is TMS for depression", 
  "Does TMS work immediately", "How long do TMS results last", "What is Deep TMS",
  "What is rTMS", "What is the difference between TMS and Deep TMS",
  "Can I drive after TMS treatment", "Can I work during TMS treatment",
  "What should I expect during my first TMS session", "Who is a good candidate for TMS",
  "Who should not get TMS", "What are the contraindications for TMS",
  "Is TMS permanent", "Can TMS make depression worse", "What is treatment-resistant depression",
  "Is TMS painful", "What happens if I miss a TMS session", "Can I stop TMS early",
  "What is TMS maintenance therapy", "How often do I need TMS maintenance",
  "Can I get TMS more than once", "Can TMS cause brain damage",
  "Is there an age limit for TMS", "Can elderly patients get TMS", "Can teenagers get TMS",
  "Is TMS FDA approved for children", "What is accelerated TMS", "What is SAINT protocol",
  "What is theta burst stimulation", "How is TMS different from ECT"
];

basicsQs.forEach((q, i) => {
  const qtext = q.endsWith('?') ? q : q + '?';
  if (!questions.find(existing => existing.question === qtext)) {
    questions.push({
      id: `basics-${questions.length + 1}`,
      question: qtext,
      category: 'basics',
      slug: slug(q),
      keywords: q.split(' ').slice(0, 4),
      quickAnswer: `${qtext} TMS is an FDA-cleared, non-invasive brain stimulation treatment primarily used for depression. Learn more about this evidence-based therapy.`,
      fullAnswer: `## ${qtext}\n\nTranscranial Magnetic Stimulation (TMS) is a revolutionary non-invasive treatment for depression and other mental health conditions. ${qtext} is one of the most frequently asked questions.\n\n**Key Points:**\n- FDA-cleared since 2008 for treatment-resistant depression\n- 50-60% response rate in clinical trials\n- No systemic side effects (no weight gain, sexual dysfunction)\n- Outpatient procedure, 19-37 minutes per session\n- Full course typically 36 sessions over 4-6 weeks\n\n**How It Works:**\nTMS uses focused magnetic pulses to stimulate underactive brain regions associated with mood regulation, promoting neuroplastic changes.\n\nConsult with a board-certif psychiatrist to determine if TMS is appropriate for your situation.`,
      imageUrl: images.basics,
      relatedQuestions: [],
      citations: [{title: 'FDA TMS Information', url: 'https://www.fda.gov/medical-devices'}]
    });
  }
});

// COST & INSURANCE questions
const insurers = ['Medicare', 'Medicaid', 'Blue Cross Blue Shield', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Humana', 'Anthem', 'Kaiser Permanente'];
const costBase = ["How much does TMS cost", "What is the average cost of TMS",  
  "How much is TMS per session", "Does insurance cover TMS", "What is the out-of-pocket cost for TMS",
  "Are there payment plans for TMS", "Can I use FSA for TMS", "Can I use HSA for TMS"];

costBase.forEach(q => {
  const qtext = q.endsWith('?') ? q : q + '?';
  if (!questions.find(ex => ex.question === qtext)) {
    questions.push({
      id: `cost-${questions.length + 1}`,
      question: qtext,
      category: 'cost',
      slug: slug(q),
      keywords: ['TMS cost', 'insurance', 'price'],
      quickAnswer: `${qtext} TMS typically costs $10,000-$15,000 full course. Most major insurance plans cover TMS for treatment-resistant depression.`,
      fullAnswer: `## ${qtext}\n\n**Cost Breakdown:**\n- Without insurance: $10,000-$15,000 full course\n- Per session: $300-$500\n- With insurance: typically $500-$3,000 out-of-pocket\n\n**Insurance Coverage:**\nMost major insurers cover TMS for treatment-resistant depression after failing 4+ medications.\n\n**Payment Options:**\n- CareCredit financing\n- Payment plans at most clinics\n- FSA/HSA eligible\n\nContact clinics in your area for specific pricing.`,
      imageUrl: images.cost,
      relatedQuestions: [],
      citations: [{title: 'TMS Insurance Guide', url: 'https://www.clinicaltmssociety.org/insurance'}]
    });
  }
});

insurers.forEach(ins => {
  [`Does ${ins} cover TMS?`, `How to get ${ins} to cover TMS?`].forEach(q => {
    if (!questions.find(ex => ex.question === q)) {
      questions.push({
        id: `insurance-${questions.length + 1}`,
        question: q,
        category: 'cost',
        slug: slug(q),
        keywords: [ins, 'TMS', 'insurance', 'coverage'],
        quickAnswer: `${q} Yes, ${ins} typically covers TMS for FDA-approved conditions with prior authorization.`,
        fullAnswer: `## ${ins} TMS Coverage\n\n**Coverage Status:**\n${ins} provides coverage for TMS therapy when medically necessary for treatment-resistant depression.\n\n**Requirements:**\n- Diagnosis of Major Depressive Disorder\n- Failed 4+ antidepressant trials\n- Psychiatric evaluation\n- Prior authorization\n\n**Process:**\nYour TMS clinic typically handles the authorization process. Approval usually takes 7-14 business days.`,
        imageUrl: images.cost,
        relatedQuestions: [],
        citations: [{title: `${ins} Policy`, url: 'https://www.clinicaltmssociety.org/insurance'}]
      });
    }
  });
});

console.log(`Generated ${questions.length} total questions`);
fs.writeFileSync(__dirname + '/../src/data/questions-comprehensive.json', JSON.stringify(questions, null, 2));
console.log(`Wrote to questions-comprehensive.json`);
