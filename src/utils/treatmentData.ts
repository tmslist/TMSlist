// Shared treatment metadata for pSEO pages (location × treatment).
// Consumed by /us/[state]/[city]/[treatment]/, /us/[state]/[treatment]/,
// and the international country/region/city/treatment routes.

export interface TreatmentMeta {
    brainArea: string;
    protocol: string;
    sessions: string;
    successRate: string;
    fdaCleared: boolean;
    yearCleared?: string;
    howItWorks: string;
    whoQualifies: string;
    devices: string;
    costRange: string;
}

export const TREATMENT_DATA: Record<string, TreatmentMeta> = {
    'depression': { brainArea: 'left dorsolateral prefrontal cortex (DLPFC)', protocol: 'high-frequency (10-20 Hz) stimulation', sessions: '36 sessions over 6 weeks', successRate: '50-60% response, 30-35% remission', fdaCleared: true, yearCleared: '2008', howItWorks: 'Depression often involves underactivity in the left prefrontal cortex. TMS delivers focused magnetic pulses to this region, gradually restoring normal neural activity and mood regulation.', whoQualifies: 'Patients with Major Depressive Disorder who have not responded adequately to at least 2 antidepressant medications.', devices: 'NeuroStar, BrainsWay Deep TMS, MagVenture', costRange: '$200-$400 per session' },
    'anxiety': { brainArea: 'right dorsolateral prefrontal cortex (DLPFC)', protocol: 'low-frequency (1 Hz) inhibitory stimulation', sessions: '20-30 sessions over 4-6 weeks', successRate: '40-50% response', fdaCleared: false, howItWorks: 'Anxiety disorders are associated with overactivity in the right prefrontal cortex and amygdala. Low-frequency TMS to the right DLPFC reduces this hyperactivity, helping regulate the fear and worry response.', whoQualifies: 'Patients with Generalized Anxiety Disorder or Social Anxiety who have not responded to medication and/or therapy.', devices: 'NeuroStar, MagVenture, BrainsWay', costRange: '$200-$400 per session' },
    'ocd': { brainArea: 'medial prefrontal cortex (mPFC) and anterior cingulate cortex (ACC)', protocol: 'BrainsWay Deep TMS with H7 coil', sessions: '29 sessions over 6 weeks', successRate: '45-55% response', fdaCleared: true, yearCleared: '2018', howItWorks: 'OCD involves hyperactivity in the cortico-striatal-thalamic circuit. Deep TMS targets the medial prefrontal cortex to modulate this circuit, reducing the intensity of obsessive thoughts and compulsive behaviors.', whoQualifies: 'Patients with OCD who have not responded adequately to SSRI medication and/or CBT/ERP therapy.', devices: 'BrainsWay Deep TMS (H7 coil)', costRange: '$250-$500 per session' },
    'ptsd': { brainArea: 'right dorsolateral prefrontal cortex (DLPFC)', protocol: 'high-frequency or theta burst stimulation', sessions: '20-30 sessions over 4-6 weeks', successRate: '40-50% response', fdaCleared: false, howItWorks: 'PTSD involves dysregulation of the fear processing network, particularly hyperactivity in the amygdala and underactivity in the prefrontal cortex. TMS helps rebalance these circuits, reducing hypervigilance and intrusive memories.', whoQualifies: 'Patients with PTSD who have not responded to trauma-focused therapy and/or medication.', devices: 'NeuroStar, BrainsWay, MagVenture', costRange: '$200-$400 per session' },
    'smoking-cessation': { brainArea: 'bilateral insula and prefrontal cortex', protocol: 'BrainsWay Deep TMS with H4 coil', sessions: '18 sessions over 6 weeks', successRate: '30-40% quit rate', fdaCleared: true, yearCleared: '2020', howItWorks: 'The insula plays a key role in addiction cravings and interoceptive awareness. Deep TMS targeting the bilateral insula disrupts craving circuits, reducing the urge to smoke.', whoQualifies: 'Adult smokers who want to quit and have tried other cessation methods.', devices: 'BrainsWay Deep TMS (H4 coil)', costRange: '$250-$500 per session' },
    'bipolar': { brainArea: 'right dorsolateral prefrontal cortex (DLPFC)', protocol: 'low-frequency (1 Hz) inhibitory stimulation', sessions: '20-30 sessions over 4-6 weeks', successRate: '35-45% response', fdaCleared: false, howItWorks: 'Bipolar depression involves mood circuit dysregulation. Low-frequency TMS to the right DLPFC is used to minimize manic switching risk while alleviating depressive symptoms.', whoQualifies: 'Patients in the depressive phase of bipolar disorder who have not responded to mood stabilizers.', devices: 'NeuroStar, MagVenture', costRange: '$200-$400 per session' },
    'migraines': { brainArea: 'occipital cortex', protocol: 'single-pulse TMS (sTMS)', sessions: 'as needed (acute) or daily (preventive)', successRate: '35-45% reduction in frequency', fdaCleared: true, yearCleared: '2013', howItWorks: 'Single-pulse TMS disrupts cortical spreading depression — the electrical wave that triggers migraine aura and pain. It can abort acute attacks and reduce frequency when used preventively.', whoQualifies: 'Patients with migraine with or without aura who have not responded adequately to preventive medications.', devices: 'eNeura SpringTMS (portable, FDA-cleared for home use)', costRange: 'Device rental or purchase; $200-$300/month' },
    'chronic-pain': { brainArea: 'primary motor cortex (M1)', protocol: 'high-frequency (10-20 Hz) stimulation', sessions: '10-20 sessions', successRate: '30-50% pain reduction', fdaCleared: false, howItWorks: 'Chronic pain involves central sensitization and maladaptive changes in pain processing circuits. High-frequency TMS to the motor cortex activates descending pain inhibition pathways, reducing pain perception.', whoQualifies: 'Patients with chronic neuropathic pain, fibromyalgia, or complex regional pain syndrome who have not responded to conventional pain management.', devices: 'MagVenture, Magstim, NeuroStar', costRange: '$200-$400 per session' },
};

export function getTreatmentMeta(slug: string, conditionName: string): TreatmentMeta {
    return TREATMENT_DATA[slug] || {
        brainArea: 'dorsolateral prefrontal cortex (DLPFC)',
        protocol: 'repetitive TMS (rTMS)',
        sessions: '20-36 sessions over 4-6 weeks',
        successRate: 'varies by condition',
        fdaCleared: false,
        howItWorks: `TMS uses focused magnetic pulses to stimulate specific brain regions involved in ${conditionName.toLowerCase()}. By modulating neural activity in these areas, TMS can help restore normal brain function and reduce symptoms.`,
        whoQualifies: `Patients with ${conditionName.toLowerCase()} who have not responded adequately to conventional treatments including medication and therapy.`,
        devices: 'NeuroStar, BrainsWay, MagVenture',
        costRange: '$200-$400 per session',
    };
}

// High-volume conditions to include in sitemap. Limiting the cartesian
// product keeps us under the 50k-URL sitemap limit while covering
// the highest-intent search keywords.
export const PSEO_PRIORITY_TREATMENTS = [
    'depression',
    'anxiety',
    'ocd',
    'ptsd',
    'bipolar',
    'migraines',
    'chronic-pain',
    'smoking-cessation',
];
