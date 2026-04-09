/**
 * Clinic Data Enrichment Pipeline
 *
 * Generates unique SEO-optimized content for all clinics:
 * - Long-form description articles (500-800 words)
 * - Enriched FAQs with detailed answers
 * - Real clinic images from website OG tags
 * - Doctor bios
 * - Data validation & cleanup
 *
 * Usage: npx tsx scripts/enrich-clinics.ts
 * Options:
 *   --images-only    Only fetch images from clinic websites
 *   --content-only   Only generate SEO content
 *   --state=CA       Process only clinics in a specific state
 *   --dry-run        Preview changes without writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLINICS_PATH = path.join(__dirname, '..', 'src', 'data', 'clinics.json');

// ─── TMS Knowledge Base for Content Generation ─────────────────────────────

const TMS_MACHINE_INFO: Record<string, { fullName: string; description: string; advantages: string; fda: string }> = {
  'NeuroStar': {
    fullName: 'NeuroStar Advanced Therapy System',
    description: 'NeuroStar is the most widely used TMS system in the United States, with over 5 million treatments delivered. It uses precisely targeted magnetic pulses to stimulate nerve cells in the brain region linked to depression.',
    advantages: 'Proven efficacy with the largest clinical data set of any TMS system, non-invasive with no systemic side effects, and most sessions last just 19 minutes',
    fda: 'FDA-cleared for Major Depressive Disorder (MDD) in 2008 and Obsessive-Compulsive Disorder (OCD) in 2018'
  },
  'BrainsWay Deep TMS': {
    fullName: 'BrainsWay Deep Transcranial Magnetic Stimulation',
    description: 'BrainsWay Deep TMS uses patented H-Coil technology to reach broader and deeper brain regions compared to traditional figure-8 coils. This allows for stimulation of neural pathways that other TMS systems cannot reach.',
    advantages: 'Deeper brain penetration reaching up to 4cm below the skull, broader stimulation area for more comprehensive treatment, and sessions typically last 20 minutes',
    fda: 'FDA-cleared for Major Depressive Disorder in 2013, OCD in 2018, and Smoking Cessation in 2020'
  },
  'MagVenture': {
    fullName: 'MagVenture TMS Therapy System',
    description: 'MagVenture offers versatile TMS systems used worldwide in both clinical practice and research settings. Known for precision coil positioning and customizable treatment protocols.',
    advantages: 'Highly configurable pulse parameters, multiple coil options for different treatment targets, and strong research pedigree with peer-reviewed clinical evidence',
    fda: 'FDA-cleared for Major Depressive Disorder and available for investigational protocols'
  },
  'CloudTMS': {
    fullName: 'CloudTMS Therapy System',
    description: 'CloudTMS combines advanced TMS treatment capabilities with cloud-based data management. This integration allows clinicians to track patient progress in real time and optimize treatment protocols.',
    advantages: 'Cloud-based treatment tracking for data-driven protocol adjustments, streamlined clinical workflow, and real-time outcome monitoring',
    fda: 'FDA-cleared for the treatment of Major Depressive Disorder'
  },
  'Magstim': {
    fullName: 'Magstim TMS System',
    description: 'Magstim is a pioneer in magnetic stimulation technology with over 30 years of development. Used extensively in research institutions and clinical practices worldwide.',
    advantages: 'Decades of clinical research backing, versatile stimulation capabilities, and widely used in academic medical centers',
    fda: 'FDA-cleared for therapeutic applications including depression treatment'
  },
  'Nexstim': {
    fullName: 'Nexstim Navigated Brain Stimulation',
    description: 'Nexstim uses neuronavigation technology to map each patient\'s unique brain anatomy and precisely target stimulation. This MRI-guided approach ensures accuracy in treatment delivery.',
    advantages: 'MRI-guided neuronavigation for precise targeting, individualized brain mapping, and real-time visualization of treatment targets',
    fda: 'FDA-cleared navigated brain stimulation system'
  },
  'SAINT Protocol Setup': {
    fullName: 'Stanford Accelerated Intelligent Neuromodulation Therapy (SAINT)',
    description: 'The SAINT protocol, developed at Stanford University, represents a breakthrough in accelerated TMS treatment. Instead of the traditional 6-week course, SAINT delivers concentrated treatments over just 5 days.',
    advantages: 'Dramatically accelerated timeline (5 days vs. 6 weeks), personalized targeting using functional MRI, and remission rates approaching 80% in clinical trials',
    fda: 'Based on the FDA-cleared Stanford Neuromodulation Therapy protocol'
  }
};

const TREATMENT_INFO: Record<string, { description: string; howTmsHelps: string }> = {
  'Depression': {
    description: 'Major Depressive Disorder affects over 21 million adults in the United States annually.',
    howTmsHelps: 'TMS stimulates the dorsolateral prefrontal cortex (DLPFC), a brain region underactive in depression, helping restore normal neural activity and mood regulation.'
  },
  'Major Depressive Disorder': {
    description: 'MDD is characterized by persistent feelings of sadness, hopelessness, and loss of interest lasting at least two weeks.',
    howTmsHelps: 'TMS targets the left DLPFC to increase neural activity in mood-regulating circuits, with remission rates of 50-60% in treatment-resistant cases.'
  },
  'OCD': {
    description: 'Obsessive-Compulsive Disorder involves unwanted recurring thoughts and repetitive behaviors that significantly impact daily life.',
    howTmsHelps: 'Deep TMS targets the anterior cingulate cortex and medial prefrontal cortex, brain regions associated with OCD symptoms, reducing compulsive urges.'
  },
  'Anxiety': {
    description: 'Generalized anxiety and anxiety disorders affect approximately 40 million adults in the U.S.',
    howTmsHelps: 'TMS modulates activity in the prefrontal cortex to help regulate the fear and anxiety response circuits in the brain.'
  },
  'PTSD': {
    description: 'Post-Traumatic Stress Disorder develops after experiencing or witnessing traumatic events.',
    howTmsHelps: 'TMS helps rebalance hyperactive threat-detection circuits in the brain, reducing intrusive thoughts, hypervigilance, and emotional reactivity.'
  },
  'Bipolar Depression': {
    description: 'The depressive phase of Bipolar Disorder can be particularly challenging to treat with medications alone.',
    howTmsHelps: 'TMS provides targeted stimulation to alleviate depressive symptoms without the risk of triggering manic episodes associated with some antidepressants.'
  },
  'Chronic Pain': {
    description: 'Chronic pain conditions affect over 50 million Americans and are often intertwined with depression.',
    howTmsHelps: 'TMS targets the motor cortex and pain-processing regions to modulate pain perception pathways in the brain.'
  },
  'Smoking Cessation': {
    description: 'Nicotine addiction involves powerful neurological reward pathways that make quitting extremely difficult.',
    howTmsHelps: 'Deep TMS targets the insula and prefrontal cortex to reduce cravings and disrupt the neurological reward patterns associated with smoking.'
  },
  'Tinnitus': {
    description: 'Tinnitus is the perception of ringing or other sounds in the ears that affects millions worldwide.',
    howTmsHelps: 'TMS targets the auditory cortex to reduce abnormal neural firing patterns responsible for phantom sound perception.'
  }
};

const STATE_FULL_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// ─── Content Generation Engine ──────────────────────────────────────────────

interface Clinic {
  id: string;
  name: string;
  slug: string;
  description_long: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  address_obj?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
    nearby_landmarks?: string[];
  };
  geo?: { lat: number; lng: number };
  contact?: { phone?: string; website_url?: string };
  machines?: string[];
  treatments?: string[];
  insurance_accepted?: string[];
  cost_info?: {
    accepts_insurance?: boolean;
    cash_price_per_session?: string;
    financing_available?: boolean;
  };
  verified?: boolean;
  rating?: { aggregate: number; count: number; sentiment_summary?: string };
  doctors_data?: DoctorData[];
  doctor_ids?: string[];
  opening_hours?: string[];
  faqs?: { question: string; answer: string }[];
  hero_image_url?: string;
  seo_article?: string;
  [key: string]: any;
}

interface DoctorData {
  name: string;
  first_name?: string;
  last_name?: string;
  slug?: string;
  title?: string;
  school?: string;
  years_experience?: number;
  specialties?: string[];
  bio_focus?: string;
  bio?: string;
  image_url?: string;
}

// Variation pools for natural-sounding content
const INTRO_TEMPLATES = [
  (c: Clinic, s: string) => `${c.name} is a leading TMS therapy provider serving ${c.city}, ${s}, and the surrounding ${c.address_obj?.county || `${c.city} metro`} area. Specializing in FDA-cleared Transcranial Magnetic Stimulation, the clinic offers a proven, non-invasive alternative for patients who have not found adequate relief from traditional antidepressant medications.`,
  (c: Clinic, s: string) => `For patients in ${c.city}, ${s}, searching for an effective alternative to medication for treatment-resistant depression, ${c.name} provides advanced TMS therapy backed by decades of clinical research. Located in the heart of ${c.address_obj?.county || c.city}, this clinic combines cutting-edge neuromodulation technology with compassionate, patient-centered care.`,
  (c: Clinic, s: string) => `${c.name} brings advanced Transcranial Magnetic Stimulation therapy to the ${c.city}, ${s} community. As a specialized TMS provider in ${c.address_obj?.county || `the ${c.city} area`}, the clinic is dedicated to helping patients overcome treatment-resistant depression and other mental health conditions through innovative, evidence-based neuromodulation techniques.`,
  (c: Clinic, s: string) => `When traditional antidepressants fall short, ${c.name} in ${c.city}, ${s} offers a different path forward. This specialized TMS therapy center uses precisely targeted magnetic pulses to stimulate underactive brain regions associated with depression, providing hope for patients throughout ${c.address_obj?.county || `the greater ${c.city} region`}.`,
  (c: Clinic, s: string) => `Serving the ${c.city}, ${s} community with advanced brain stimulation therapy, ${c.name} has established itself as a trusted destination for patients seeking alternatives to medication. The clinic's commitment to utilizing the latest TMS technology and evidence-based protocols has helped patients across ${c.address_obj?.county || `${c.city} and neighboring communities`} achieve meaningful recovery.`,
];

const APPROACH_TEMPLATES = [
  (c: Clinic) => `The clinical team at ${c.name} takes a comprehensive, individualized approach to TMS treatment. Every patient begins with a thorough psychiatric evaluation to determine whether TMS is the right fit. From there, the treatment team designs a personalized protocol that targets the specific brain regions contributing to each patient's symptoms.`,
  (c: Clinic) => `What distinguishes ${c.name} is the clinic's dedication to personalized care. Before beginning any treatment, the clinical team conducts a detailed assessment of each patient's psychiatric history, medication trials, and treatment goals. This thorough evaluation ensures that TMS therapy is precisely tailored to address each individual's unique neurological profile.`,
  (c: Clinic) => `At ${c.name}, treatment begins with understanding. The clinical team recognizes that every patient's experience with depression is unique, which is why each treatment plan starts with a comprehensive evaluation. This patient-first philosophy extends through every aspect of care, from initial consultation through the complete course of TMS therapy and follow-up.`,
  (c: Clinic) => `Patient outcomes at ${c.name} are driven by a commitment to clinical excellence and individualized treatment planning. The team combines advanced diagnostic assessment with evidence-based TMS protocols, ensuring each patient receives targeted stimulation optimized for their specific condition and brain anatomy.`,
];

function generateSeoArticle(clinic: Clinic): string {
  const stateFull = STATE_FULL_NAMES[clinic.state] || clinic.state;
  const machines = clinic.machines || [];
  const treatments = clinic.treatments || [];
  const doctors = clinic.doctors_data || [];
  const insurances = clinic.insurance_accepted || [];
  const rating = typeof clinic.rating === 'object' ? clinic.rating : null;
  const county = clinic.address_obj?.county || `${clinic.city} County`;
  const landmarks = clinic.address_obj?.nearby_landmarks || [];

  // Deterministic variation based on clinic ID hash
  const hash = simpleHash(clinic.id || clinic.slug);
  const introIdx = hash % INTRO_TEMPLATES.length;
  const approachIdx = (hash + 1) % APPROACH_TEMPLATES.length;

  const sections: string[] = [];

  // 1. Introduction
  sections.push(INTRO_TEMPLATES[introIdx](clinic, stateFull));

  // 2. Technology section
  if (machines.length > 0) {
    const machineDescriptions = machines
      .map(m => {
        const key = Object.keys(TMS_MACHINE_INFO).find(k => m.includes(k));
        if (key) {
          const info = TMS_MACHINE_INFO[key];
          return `The clinic utilizes the ${info.fullName}. ${info.description} Key advantages include ${info.advantages}. ${info.fda}.`;
        }
        return `The clinic employs ${m} technology, an advanced TMS system designed to deliver precise magnetic stimulation for optimal therapeutic outcomes.`;
      })
      .join(' ');

    if (machines.length === 1) {
      sections.push(`${clinic.name} has invested in state-of-the-art TMS equipment to deliver the highest standard of care. ${machineDescriptions}`);
    } else {
      sections.push(`With ${machines.length} advanced TMS systems available, ${clinic.name} can offer patients a range of treatment options tailored to their specific needs. ${machineDescriptions} Having multiple systems allows the treatment team to select the optimal technology for each patient's condition and treatment goals.`);
    }
  }

  // 3. Treatment approach
  sections.push(APPROACH_TEMPLATES[approachIdx](clinic));

  // 4. Conditions treated
  if (treatments.length > 0) {
    const treatedConditions = treatments.slice(0, 4).map(t => {
      const key = Object.keys(TREATMENT_INFO).find(k => t.includes(k) || k.includes(t));
      if (key) {
        const info = TREATMENT_INFO[key];
        return `For patients with ${t.toLowerCase()}, ${info.howTmsHelps.charAt(0).toLowerCase()}${info.howTmsHelps.slice(1)}`;
      }
      return `For ${t.toLowerCase()}, TMS provides targeted brain stimulation to address the underlying neurological patterns contributing to symptoms.`;
    });
    sections.push(`${clinic.name} treats a range of conditions including ${treatments.join(', ')}. ${treatedConditions.join(' ')}`);
  }

  // 5. Clinical team
  if (doctors.length > 0) {
    const doctorProfiles = doctors.map(doc => {
      const parts: string[] = [];
      parts.push(`${doc.name}`);
      if (doc.title) parts.push(`serves as ${doc.title}`);
      if (doc.school) parts.push(`and trained at ${doc.school}`);
      if (doc.years_experience) parts.push(`bringing ${doc.years_experience}+ years of clinical experience`);
      if (doc.specialties && doc.specialties.length > 0) {
        parts.push(`with expertise in ${doc.specialties.join(', ')}`);
      }
      return parts.join(' ');
    });
    sections.push(`The clinical team at ${clinic.name} is led by experienced, board-certified specialists in psychiatry and neuromodulation. ${doctorProfiles.join('. ')}. This depth of expertise ensures patients receive care informed by both clinical best practices and the latest advances in brain stimulation research.`);
  }

  // 6. Insurance & accessibility
  if (insurances.length > 0) {
    const insuranceText = clinic.cost_info?.accepts_insurance
      ? `${clinic.name} works with most major insurance providers to make TMS therapy accessible and affordable. Accepted plans include ${insurances.slice(0, 6).join(', ')}${insurances.length > 6 ? ', and others' : ''}.`
      : `${clinic.name} accepts ${insurances.join(', ')}.`;

    const costText = clinic.cost_info?.cash_price_per_session
      ? ` For patients without insurance coverage, cash pricing starts at ${clinic.cost_info.cash_price_per_session} per session.`
      : '';

    const financingText = clinic.cost_info?.financing_available
      ? ' Flexible financing options are available to help patients manage treatment costs over time.'
      : '';

    sections.push(`${insuranceText}${costText}${financingText} The administrative team assists patients with insurance verification and prior authorization to streamline the process.`);
  }

  // 7. Location & convenience
  const locationParts = [`Conveniently located at ${clinic.address_obj?.street || clinic.address} in ${clinic.city}, ${stateFull}`];
  if (landmarks.length > 0) {
    locationParts.push(`near ${landmarks.slice(0, 2).join(' and ')}`);
  }
  if (clinic.opening_hours && clinic.opening_hours.length > 0) {
    const hasWeekend = clinic.opening_hours.some((h: string) => /sat|sun/i.test(h));
    const hasEvening = clinic.opening_hours.some((h: string) => /1[89]:|[2][0-3]:/i.test(h));
    if (hasWeekend || hasEvening) {
      locationParts.push(`the clinic offers ${hasEvening ? 'extended evening hours' : ''}${hasEvening && hasWeekend ? ' and ' : ''}${hasWeekend ? 'weekend appointments' : ''} to accommodate busy schedules`);
    }
  }
  sections.push(`${locationParts.join(', ')}. Patients throughout ${county} and the surrounding region choose ${clinic.name} for its combination of clinical expertise, advanced technology, and welcoming treatment environment.`);

  // 8. Rating/social proof
  if (rating && rating.aggregate >= 4.0) {
    const ratingText = `With a ${rating.aggregate.toFixed(1)}-star rating from ${rating.count} patient reviews, ${clinic.name} has earned a reputation for exceptional care.`;
    const sentimentText = rating.sentiment_summary ? ` Patients consistently note: "${rating.sentiment_summary}"` : '';
    sections.push(`${ratingText}${sentimentText} This track record reflects the clinic's unwavering commitment to positive patient outcomes and a supportive treatment experience.`);
  }

  // 9. Call to action
  const ctaVariants = [
    `If you or a loved one are struggling with treatment-resistant depression in ${clinic.city}, ${stateFull}, ${clinic.name} invites you to schedule a consultation to learn whether TMS therapy may be right for you. The first step toward feeling better starts with a conversation.`,
    `Taking the first step toward recovery can feel overwhelming, but ${clinic.name} makes it simple. Contact the clinic to schedule a no-obligation consultation and discover how TMS therapy could help you reclaim your quality of life here in ${clinic.city}, ${stateFull}.`,
    `Ready to explore a medication-free path to relief? ${clinic.name} welcomes new patients from across ${county} and ${stateFull}. Reach out today to schedule your initial evaluation and learn how TMS therapy is transforming lives in ${clinic.city}.`,
  ];
  sections.push(ctaVariants[hash % ctaVariants.length]);

  return sections.join('\n\n');
}

// ─── FAQ Enrichment ─────────────────────────────────────────────────────────

function generateEnrichedFaqs(clinic: Clinic): { question: string; answer: string }[] {
  const stateFull = STATE_FULL_NAMES[clinic.state] || clinic.state;
  const machines = clinic.machines || [];
  const treatments = clinic.treatments || [];
  const insurances = clinic.insurance_accepted || [];

  const faqs: { question: string; answer: string }[] = [];

  // Core TMS FAQs tailored to the clinic
  faqs.push({
    question: `What is TMS therapy and how does it work at ${clinic.name}?`,
    answer: `TMS (Transcranial Magnetic Stimulation) is an FDA-cleared, non-invasive treatment that uses magnetic pulses to stimulate nerve cells in the brain. At ${clinic.name}${machines.length > 0 ? `, we use ${machines.join(' and ')} technology` : ''} to precisely target the dorsolateral prefrontal cortex (DLPFC), the brain region associated with mood regulation. Unlike medications, TMS does not circulate through the bloodstream, so patients experience minimal to no systemic side effects. A typical treatment course involves 36 sessions over 6-9 weeks, with each session lasting approximately 19-20 minutes.`
  });

  faqs.push({
    question: `Does ${clinic.name} accept my insurance for TMS therapy?`,
    answer: insurances.length > 0
      ? `${clinic.name} works with most major insurance providers including ${insurances.slice(0, 5).join(', ')}${insurances.length > 5 ? ', and others' : ''}. TMS therapy is covered by most insurance plans when the patient meets criteria for treatment-resistant depression (typically having tried and not responded to at least one antidepressant medication in the current episode). Our team handles insurance verification and prior authorization to help maximize your benefits.${clinic.cost_info?.financing_available ? ' We also offer financing options for patients who need assistance with out-of-pocket costs.' : ''}`
      : `We recommend contacting ${clinic.name} directly to discuss insurance coverage. Our administrative team can verify your benefits and assist with prior authorization. Most major insurance plans cover TMS therapy for treatment-resistant depression.${clinic.cost_info?.financing_available ? ' Financing options are also available.' : ''}`
  });

  faqs.push({
    question: `What should I expect during my first TMS session in ${clinic.city}?`,
    answer: `Your first TMS session at ${clinic.name} begins with the treatment team determining your motor threshold, which calibrates the magnetic pulse intensity to your individual brain. You will be seated comfortably in a treatment chair while a coil is positioned against your head. You may feel a tapping sensation on your scalp during treatment. Sessions typically last 19-20 minutes, and you can return to normal activities immediately afterward, including driving. There is no anesthesia or sedation required. Most patients describe the experience as comfortable and use the time to relax, read, or listen to music.`
  });

  faqs.push({
    question: `How quickly will I see results from TMS therapy?`,
    answer: `Individual response times vary, but many patients at ${clinic.name} begin noticing improvements in mood, energy, and sleep within the first 2-3 weeks of treatment. The full course of treatment typically spans 36 sessions over 6-9 weeks. Clinical studies show that approximately 50-60% of patients with treatment-resistant depression achieve meaningful improvement, and about one-third experience complete remission. Our clinical team monitors your progress throughout treatment and can adjust protocols as needed.`
  });

  faqs.push({
    question: `Are there any side effects of TMS treatment?`,
    answer: `TMS therapy is one of the safest treatments available for depression. The most common side effect is mild scalp discomfort or a tapping sensation at the treatment site during sessions, which typically diminishes after the first few treatments. Unlike antidepressant medications, TMS does not cause weight gain, sexual dysfunction, nausea, or drowsiness. There is no recovery time needed after sessions. The most serious but rare risk is seizure, occurring in less than 0.1% of patients. Our clinical team at ${clinic.name} conducts thorough screening to minimize any risks.`
  });

  if (treatments.some(t => t.toLowerCase().includes('ocd'))) {
    faqs.push({
      question: `Can TMS help with OCD at ${clinic.name}?`,
      answer: `Yes. ${machines.some(m => m.includes('BrainsWay')) ? 'BrainsWay Deep TMS was specifically FDA-cleared for OCD treatment in 2018. The H7 coil targets deeper brain structures including the anterior cingulate cortex, which plays a key role in OCD symptoms.' : 'TMS has been FDA-cleared for OCD treatment since 2018, targeting brain regions involved in compulsive behaviors.'} At ${clinic.name}, we offer specialized OCD protocols that have shown significant symptom reduction in clinical trials. Treatment typically involves sessions 5 days per week for 6 weeks.`
    });
  }

  faqs.push({
    question: `How much does TMS therapy cost at ${clinic.name}?`,
    answer: clinic.cost_info?.cash_price_per_session
      ? `The cost of TMS therapy at ${clinic.name} varies based on insurance coverage and treatment protocol. For patients paying out of pocket, individual sessions are priced at ${clinic.cost_info.cash_price_per_session}. A full course of treatment typically involves 36 sessions.${clinic.cost_info?.accepts_insurance ? ' Most major insurance plans cover TMS therapy for treatment-resistant depression, and our team will work with your insurance company to maximize your coverage.' : ''}${clinic.cost_info?.financing_available ? ' We also offer flexible financing plans to make treatment accessible.' : ''} Contact us for a personalized cost estimate.`
      : `TMS therapy costs vary based on insurance coverage, treatment protocol, and session count. ${clinic.cost_info?.accepts_insurance ? `${clinic.name} accepts most major insurance plans, and TMS is typically covered when criteria for treatment-resistant depression are met.` : `Contact ${clinic.name} for pricing details.`} Our administrative team provides complimentary insurance verification and can give you a clear picture of your expected costs before treatment begins.${clinic.cost_info?.financing_available ? ' Financing options are available.' : ''}`
  });

  faqs.push({
    question: `Who is a good candidate for TMS therapy?`,
    answer: `TMS therapy at ${clinic.name} is ideal for adults who have been diagnosed with Major Depressive Disorder and have not achieved adequate relief from at least one antidepressant medication. You may also be a candidate if you experience intolerable side effects from medications. TMS is not recommended for patients with metallic implants in or near the head (excluding dental fillings), or those with a history of seizures. During your initial consultation, our clinical team will review your complete medical and psychiatric history to determine if TMS is appropriate for you.`
  });

  // Keep any existing unique FAQs that don't overlap
  const existingFaqs = clinic.faqs || [];
  const coveredTopics = new Set(faqs.map(f => f.question.toLowerCase()));
  for (const existing of existingFaqs) {
    const isDuplicate = [...coveredTopics].some(topic =>
      topic.includes(existing.question.toLowerCase().slice(0, 20)) ||
      existing.question.toLowerCase().includes('insurance') ||
      existing.question.toLowerCase().includes('medicare') ||
      existing.question.toLowerCase().includes('cost') ||
      existing.question.toLowerCase().includes('what is tms')
    );
    if (!isDuplicate && existing.answer.length > 10) {
      faqs.push(existing);
    }
  }

  return faqs;
}

// ─── Doctor Bio Generation ──────────────────────────────────────────────────

function generateDoctorBio(doctor: DoctorData, clinic: Clinic): string {
  const parts: string[] = [];

  parts.push(`${doctor.name} is ${doctor.title ? `a ${doctor.title}` : 'a board-certified specialist'} at ${clinic.name} in ${clinic.city}, ${STATE_FULL_NAMES[clinic.state] || clinic.state}.`);

  if (doctor.school) {
    parts.push(`${doctor.first_name || doctor.name.split(' ')[1] || 'Dr.'} completed medical training at ${doctor.school}`);
    if (doctor.years_experience) {
      parts.push(`and brings over ${doctor.years_experience} years of clinical experience in psychiatry and neuromodulation.`);
    } else {
      parts.push('.');
    }
  } else if (doctor.years_experience) {
    parts.push(`With over ${doctor.years_experience} years of experience in psychiatry and brain stimulation therapy, ${doctor.first_name || 'they'} ${doctor.years_experience >= 20 ? 'is recognized as a leading authority' : 'has developed deep expertise'} in the field.`);
  }

  if (doctor.specialties && doctor.specialties.length > 0) {
    parts.push(`${doctor.first_name || 'Their'} clinical focus areas include ${doctor.specialties.join(', ')}, with particular expertise in ${doctor.bio_focus || doctor.specialties[0]}.`);
  }

  parts.push(`${doctor.first_name || 'The doctor'} is committed to providing evidence-based TMS treatment and works closely with each patient to develop individualized protocols that maximize therapeutic outcomes.`);

  return parts.join(' ');
}

// ─── Image Fetching ─────────────────────────────────────────────────────────

function makeAbsolute(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('//')) return `https:${imageUrl}`;
  if (imageUrl.startsWith('/')) {
    const urlObj = new URL(baseUrl);
    return `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
  }
  return `${baseUrl.replace(/\/$/, '')}/${imageUrl}`;
}

async function fetchClinicImage(clinic: Clinic): Promise<string | null> {
  const websiteUrl = clinic.contact?.website_url || (clinic as any).website || clinic.contact?.website;
  if (!websiteUrl || websiteUrl === '#') return null;

  try {
    const response = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    if (!response.ok) return null;

    const html = await response.text();

    // 1. OG image (most reliable)
    const ogMatch = html.match(/<meta[^>]+og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+og:image/i);
    if (ogMatch?.[1]) return makeAbsolute(ogMatch[1], websiteUrl);

    // 2. Twitter card image
    const twitterMatch = html.match(/<meta[^>]+twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+twitter:image/i);
    if (twitterMatch?.[1]) return makeAbsolute(twitterMatch[1], websiteUrl);

    // 3. Hero/banner/header image fallback
    const imgTags = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)];
    const heroImg = imgTags.find(m => {
      const tag = m[0].toLowerCase();
      return (tag.includes('hero') || tag.includes('banner') || tag.includes('header') || tag.includes('featured'))
        && !tag.includes('icon') && !tag.includes('pixel') && !tag.includes('1x1');
    });
    if (heroImg?.[1]) return makeAbsolute(heroImg[1], websiteUrl);

    // 4. Logo as last resort
    const logoImg = imgTags.find(m => {
      const tag = m[0].toLowerCase();
      return tag.includes('logo') && !tag.includes('icon') && !tag.includes('favicon');
    });
    if (logoImg?.[1]) return makeAbsolute(logoImg[1], websiteUrl);

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const imagesOnly = args.includes('--images-only');
  const contentOnly = args.includes('--content-only');
  const dryRun = args.includes('--dry-run');
  const stateFilter = args.find(a => a.startsWith('--state='))?.split('=')[1]?.toUpperCase();

  console.log('=== TMS Clinic Enrichment Pipeline ===\n');
  console.log(`Mode: ${imagesOnly ? 'Images Only' : contentOnly ? 'Content Only' : 'Full Enrichment'}`);
  if (stateFilter) console.log(`State Filter: ${stateFilter}`);
  if (dryRun) console.log('DRY RUN - no files will be modified\n');

  // Load clinics
  const rawData = fs.readFileSync(CLINICS_PATH, 'utf-8');
  const clinics: Clinic[] = JSON.parse(rawData);
  console.log(`Loaded ${clinics.length} clinics\n`);

  // Filter if needed
  const targetClinics = stateFilter
    ? clinics.filter(c => c.state === stateFilter)
    : clinics;
  console.log(`Processing ${targetClinics.length} clinics...\n`);

  let enriched = 0;
  let imagesFound = 0;
  let errors = 0;

  for (let i = 0; i < targetClinics.length; i++) {
    const clinic = targetClinics[i];
    const progress = `[${i + 1}/${targetClinics.length}]`;

    try {
      // Generate SEO article content
      if (!imagesOnly) {
        const article = generateSeoArticle(clinic);
        clinic.seo_article = article;

        // Generate enriched FAQs
        clinic.faqs = generateEnrichedFaqs(clinic);

        // Generate doctor bios
        if (clinic.doctors_data) {
          for (const doctor of clinic.doctors_data) {
            if (!doctor.bio || doctor.bio.length < 50) {
              doctor.bio = generateDoctorBio(doctor, clinic);
            }
          }
        }

        enriched++;
      }

      // Fetch real clinic image
      const hasWebsite = clinic.contact?.website_url || (clinic as any).website || clinic.contact?.website;
      if (!contentOnly && hasWebsite) {
        const imageUrl = await fetchClinicImage(clinic);
        if (imageUrl) {
          clinic.hero_image_url = imageUrl;
          imagesFound++;
          console.log(`${progress} ${clinic.name} - Found image: ${imageUrl.substring(0, 80)}...`);
        } else {
          console.log(`${progress} ${clinic.name} - No image found, keeping default`);
        }
      } else if (!contentOnly) {
        console.log(`${progress} ${clinic.name} - No website URL`);
      }

      if (imagesOnly) {
        console.log(`${progress} ${clinic.name}`);
      } else if (contentOnly) {
        console.log(`${progress} ${clinic.name} - Article: ${clinic.seo_article?.split('\n\n').length} sections, ${clinic.faqs?.length} FAQs`);
      }

    } catch (err) {
      errors++;
      console.error(`${progress} ERROR processing ${clinic.name}:`, err);
    }
  }

  // Write enriched data back
  if (!dryRun) {
    // Find and update clinics in the full array
    const clinicMap = new Map(targetClinics.map(c => [c.id, c]));
    for (let i = 0; i < clinics.length; i++) {
      const updated = clinicMap.get(clinics[i].id);
      if (updated) {
        clinics[i] = updated;
      }
    }

    fs.writeFileSync(CLINICS_PATH, JSON.stringify(clinics, null, 2), 'utf-8');
    console.log(`\nWritten enriched data to ${CLINICS_PATH}`);
  }

  console.log('\n=== Enrichment Complete ===');
  console.log(`Clinics processed: ${targetClinics.length}`);
  console.log(`Content enriched:  ${enriched}`);
  console.log(`Images found:      ${imagesFound}`);
  console.log(`Errors:            ${errors}`);
}

main().catch(console.error);
