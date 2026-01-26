// Alternative Treatment Options (Spravato, Ketamine, etc.)
// These are complementary or alternative treatments to TMS

export interface AlternativeTreatment {
    slug: string;
    name: string;
    fullName: string;
    description: string;
    fdaApproved: boolean;
    conditions: string[];
    howItWorks: string;
    sessionDuration: string;
    treatmentCourse: string;
    insuranceCoverage: string;
}

export const ALTERNATIVE_TREATMENTS: AlternativeTreatment[] = [
    {
        slug: 'spravato',
        name: 'Spravato',
        fullName: 'Spravato (Esketamine Nasal Spray)',
        description: 'FDA-approved nasal spray for treatment-resistant depression and major depressive disorder with suicidal thoughts.',
        fdaApproved: true,
        conditions: ['Treatment-Resistant Depression', 'Major Depressive Disorder with Suicidal Ideation'],
        howItWorks: 'Spravato works on glutamate, a different brain chemical than traditional antidepressants. It can provide rapid relief of depression symptoms.',
        sessionDuration: '2 hours (including monitoring)',
        treatmentCourse: 'Twice weekly for 4 weeks, then weekly for 4 weeks, then weekly or every 2 weeks',
        insuranceCoverage: 'Covered by many insurance plans including Medicare'
    },
    {
        slug: 'ketamine-infusion',
        name: 'Ketamine Infusion',
        fullName: 'IV Ketamine Infusion Therapy',
        description: 'Off-label use of ketamine administered intravenously for rapid relief of depression, anxiety, and chronic pain.',
        fdaApproved: false,
        conditions: ['Treatment-Resistant Depression', 'Anxiety', 'PTSD', 'Chronic Pain', 'Suicidal Ideation'],
        howItWorks: 'Ketamine rapidly increases glutamate transmission, promoting new neural connections and providing fast-acting antidepressant effects.',
        sessionDuration: '40-60 minutes',
        treatmentCourse: '6 infusions over 2-3 weeks, then maintenance as needed',
        insuranceCoverage: 'Typically self-pay ($400-$800 per session)'
    },
    {
        slug: 'ketamine-lozenges',
        name: 'At-Home Ketamine',
        fullName: 'Sublingual Ketamine (Lozenges/Troches)',
        description: 'Oral ketamine taken at home under medical supervision via telehealth for depression and anxiety.',
        fdaApproved: false,
        conditions: ['Depression', 'Anxiety', 'PTSD'],
        howItWorks: 'Same mechanism as IV ketamine but with slower absorption through sublingual administration.',
        sessionDuration: '1-2 hours at home',
        treatmentCourse: '2-3 times per week for several weeks',
        insuranceCoverage: 'Self-pay ($200-$400/month typically)'
    },
    {
        slug: 'ect',
        name: 'ECT',
        fullName: 'Electroconvulsive Therapy (ECT)',
        description: 'Highly effective treatment for severe depression using controlled electrical currents under anesthesia.',
        fdaApproved: true,
        conditions: ['Severe Depression', 'Catatonia', 'Treatment-Resistant Depression', 'Bipolar Disorder'],
        howItWorks: 'Brief electrical pulses cause a controlled seizure that creates changes in brain chemistry, often providing rapid relief.',
        sessionDuration: '15-30 minutes (plus recovery)',
        treatmentCourse: '2-3 times per week for 6-12 sessions',
        insuranceCoverage: 'Covered by most insurance plans'
    },
    {
        slug: 'vagus-nerve-stimulation',
        name: 'VNS',
        fullName: 'Vagus Nerve Stimulation (VNS)',
        description: 'Implanted device that sends electrical pulses to the vagus nerve to treat depression.',
        fdaApproved: true,
        conditions: ['Treatment-Resistant Depression', 'Epilepsy'],
        howItWorks: 'A device implanted under the skin sends regular electrical impulses to the brain via the vagus nerve.',
        sessionDuration: 'Continuous (implanted device)',
        treatmentCourse: 'Permanent implant with adjustable settings',
        insuranceCoverage: 'Covered by some insurance plans'
    },
    {
        slug: 'psilocybin-therapy',
        name: 'Psilocybin Therapy',
        fullName: 'Psilocybin-Assisted Therapy',
        description: 'Emerging treatment using psilocybin (magic mushrooms) combined with psychotherapy for depression.',
        fdaApproved: false,
        conditions: ['Treatment-Resistant Depression', 'End-of-Life Anxiety', 'PTSD'],
        howItWorks: 'Psilocybin promotes neuroplasticity and combined with therapy can create lasting changes in perspective and mood.',
        sessionDuration: '6-8 hours (full session)',
        treatmentCourse: '1-3 sessions with preparation and integration therapy',
        insuranceCoverage: 'Not covered (available in clinical trials and some states)'
    }
];

export function getTreatmentBySlug(slug: string): AlternativeTreatment | undefined {
    return ALTERNATIVE_TREATMENTS.find(t => t.slug === slug);
}
