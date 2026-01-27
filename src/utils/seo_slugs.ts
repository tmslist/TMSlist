// Centralized definitions for site taxonomy and routing

export const CORE_PAGES = [
    { slug: 'about-us', title: 'About Us' },
    { slug: 'how-we-rank-clinics', title: 'How We Rank Clinics' },
    { slug: 'verify-your-clinic', title: 'Verify Your Clinic' },
    { slug: 'editorial-policy', title: 'Editorial Policy' },
    { slug: 'contact', title: 'Contact Us' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-of-service', title: 'Terms of Service' },
    { slug: 'careers', title: 'Careers' },
    { slug: 'sitemap-html', title: 'HTML Sitemap' },
    { slug: 'advertise', title: 'Advertise With Us' },
    { slug: 'claim-listing', title: 'Claim Your Listing' },
    { slug: 'report-incorrect-info', title: 'Report Incorrect Info' },
    { slug: 'accessibility-statement', title: 'Accessibility Statement' },
];

export const TECHNOLOGY_SLUGS = [
    { slug: 'neurostar', title: 'NeuroStar Advanced Therapy' },
    { slug: 'brainsway-deep-tms', title: 'BrainsWay Deep TMS' },
    { slug: 'magventure', title: 'MagVenture TMS' },
    { slug: 'cloudtms', title: 'CloudTMS' },
    { slug: 'nexstim', title: 'Nexstim SmartFocus' },
    { slug: 'magstim', title: 'Magstim TMS' },
    { slug: 'apollo-tms', title: 'Apollo TMS' },
    { slug: 'dtms-vs-rtms', title: 'Deep TMS vs rTMS' },
    { slug: 'theta-burst-stimulation', title: 'Theta Burst Stimulation (TBS)' },
    { slug: 'used-tms-machines-for-sale', title: 'Used TMS Machines for Sale' },
];

export const INSURANCE_SLUGS = [
    { slug: 'medicare', title: 'Medicare Coverage for TMS' },
    { slug: 'medicaid', title: 'Medicaid Coverage for TMS' },
    { slug: 'tricare', title: 'Tricare & Veterans Benefits' },
    { slug: 'bluecross-blueshield', title: 'Blue Cross Blue Shield TMS Coverage' },
    { slug: 'aetna', title: 'Aetna TMS Coverage' },
    { slug: 'cigna', title: 'Cigna TMS Coverage' },
    { slug: 'united-healthcare', title: 'UnitedHealthcare TMS Coverage' },
    { slug: 'kaiser-permanente', title: 'Kaiser Permanente TMS Coverage' },
    { slug: 'humana', title: 'Humana TMS Coverage' },
    { slug: 'california-medi-cal-tms-coverage', title: 'California Medi-Cal TMS Coverage' },
    { slug: 'florida-medicare-novitas-tms', title: 'Florida Medicare (Novitas) TMS Rules' },
    { slug: 'texas-medicaid-tms-rules', title: 'Texas Medicaid TMS Rules' },
    { slug: 'new-york-medicaid-tms', title: 'New York Medicaid TMS Rules' },
    { slug: 'illinois-bluecross-tms-policy', title: 'Illinois BCBS TMS Policy' },
    { slug: 'pennsylvania-medicare-tms', title: 'Pennsylvania Medicare TMS' },
    { slug: 'ohio-medicaid-tms', title: 'Ohio Medicaid TMS' },
    { slug: 'michigan-blue-care-network-tms', title: 'Michigan Blue Care Network TMS' },
    { slug: 'georgia-medicaid-tms', title: 'Georgia Medicaid TMS' },
    { slug: 'north-carolina-medicaid-tms', title: 'North Carolina Medicaid TMS' },
];

export const TREATMENT_SLUGS = [
    { slug: 'depression', title: 'TMS for Major Depressive Disorder' },
    { slug: 'anxiety', title: 'TMS for Anxiety' },
    { slug: 'ocd', title: 'TMS for OCD' },
    { slug: 'ptsd', title: 'TMS for PTSD' },
    { slug: 'smoking-cessation', title: 'TMS for Smoking Cessation' },
    { slug: 'bipolar', title: 'TMS for Bipolar Depression' },
    { slug: 'postpartum-depression', title: 'TMS for Postpartum Depression' },
    { slug: 'chronic-pain', title: 'TMS for Chronic Pain' },
    { slug: 'tinnitus', title: 'TMS for Tinnitus' },
    { slug: 'migraines', title: 'TMS for Migraines' },
    { slug: 'adhd', title: 'TMS for ADHD' },
    { slug: 'autism-spectrum', title: 'TMS for Autism Spectrum' },
    { slug: 'long-covid-brain-fog', title: 'TMS for Long COVID Brain Fog' },
    { slug: 'stroke-rehabilitation', title: 'TMS for Stroke Rehab' },
    { slug: 'parkinsons-disease', title: 'TMS for Parkinsons' },
    { slug: 'alzheimers-dementia', title: 'TMS for Alzheimers & Dementia' },
    { slug: 'fibromyalgia', title: 'TMS for Fibromyalgia' },
    { slug: 'eating-disorders', title: 'TMS for Eating Disorders' },
    { slug: 'insomnia-sleep-disorders', title: 'TMS for Insomnia' },
    { slug: 'cocaine-addiction', title: 'TMS for Addiction' },
    { slug: 'alcohol-dependence', title: 'TMS for Alcohol Dependence' },
    { slug: 'schizophrenia', title: 'TMS for Schizophrenia' },
    { slug: 'multiple-sclerosis-fatigue', title: 'TMS for MS Fatigue' },
    { slug: 'epilepsy', title: 'TMS for Epilepsy' },
];

export const COMPARE_SLUGS = [
    { slug: 'tms-vs-ect', title: 'TMS vs ECT' },
    { slug: 'tms-vs-ketamine', title: 'TMS vs Ketamine/Spravato' },
    { slug: 'tms-vs-antidepressants', title: 'TMS vs Antidepressants' },
    { slug: 'tms-vs-cbt', title: 'TMS vs CBT' },
    { slug: 'neurostar-vs-brainsway', title: 'NeuroStar vs BrainsWay' },
    { slug: 'magventure-vs-neurostar', title: 'MagVenture vs NeuroStar' },
];

export const PROVIDER_SLUGS = [
    { slug: 'female-psychiatrists', title: 'Female Psychiatrists Offering TMS' },
    { slug: 'male-psychiatrists', title: 'Male Psychiatrists Offering TMS' },
    { slug: 'spanish-speaking-tms', title: 'Spanish Speaking TMS Providers' },
    { slug: 'hindi-speaking-tms', title: 'Hindi Speaking TMS Providers' },
    { slug: 'mandarin-speaking-tms', title: 'Mandarin Speaking TMS Providers' },
    { slug: 'weekend-appointments', title: 'TMS Clinics Open on Weekends' },
    { slug: 'evening-hours', title: 'TMS Clinics with Evening Hours' },
    { slug: 'walk-ins-welcome', title: 'Walk-in TMS Clinics' },
    { slug: 'hospital-based', title: 'Hospital Based TMS' },
    { slug: 'private-practice', title: 'Private Practice TMS' },
    { slug: 'luxury-rehab-centers', title: 'Luxury TMS Centers' },
];

export const DEMOGRAPHIC_SLUGS = [
    { slug: 'geriatric-tms', title: 'TMS for Elderly Patients' },
    { slug: 'pediatric-adolescent', title: 'TMS for Teens & Adolescents' },
    { slug: 'pregnancy-postpartum', title: 'TMS During Pregnancy & Postpartum' },
    { slug: 'executives-professionals', title: 'TMS for Executives' },
    { slug: 'military-veterans', title: 'TMS for Veterans' },
    { slug: 'lgbtq-friendly-tms', title: 'LGBTQ+ Friendly TMS' },
    { slug: 'first-responders', title: 'TMS for First Responders' },
    { slug: 'students', title: 'TMS for Students' },
];

export const NEAR_ME_SLUGS = [
    { slug: 'pediatric-tms', title: 'Pediatric TMS Near Me' },
    { slug: 'tms-for-veterans', title: 'TMS for Veterans Near Me' },
    { slug: 'tms-for-pregnancy', title: 'TMS for Pregnancy Near Me' },
    { slug: 'cheap-tms-therapy', title: 'Affordable TMS Therapy Near Me' },
    { slug: 'cash-pay-tms', title: 'Cash Pay TMS Near Me' },
];

export const PROTOCOL_SLUGS = [
    { slug: 'saint-protocol', title: 'SAINT Protocol (Stanford Neuromodulation)' },
    { slug: 'theta-burst-stimulation', title: 'Theta Burst Stimulation (iTBS)' },
    { slug: 'neuronavigation', title: 'Neuronavigation (MRI-Guided)' },
    { slug: 'accelerated-tms', title: 'Accelerated TMS' },
    { slug: 'deep-tms', title: 'Deep TMS (H-Coil)' },
    { slug: 'fmri-guided-tms', title: 'fMRI Guided TMS' },
    { slug: 'eeg-synchronized-tms', title: 'EEG Synchronized TMS' },
    { slug: 'maintenance-tms', title: 'Maintenance TMS' },
    { slug: 'off-label-tms', title: 'Off-Label TMS Guide' },
];

export const BLOG_SLUGS = [
    { slug: 'tms-success-rates-2026', title: 'TMS Success Rates 2026' },
    { slug: 'tms-side-effects-headache', title: 'TMS Side Effects: Headaches' },
    { slug: 'does-tms-cause-memory-loss', title: 'Does TMS Cause Memory Loss?' },
    { slug: 'tms-vs-medication', title: 'TMS vs Medication' },
    { slug: 'how-to-prepare-for-tms', title: 'How to Prepare for TMS' },
    { slug: 'what-is-mapping-session', title: 'What is a Mapping Session?' },
    { slug: 'tms-for-adolescents', title: 'TMS for Adolescents Guide' },
    { slug: 'can-i-drive-after-tms', title: 'Can I Drive After TMS?' },
    { slug: 'tms-and-alcohol', title: 'TMS and Alcohol' },
    { slug: 'how-long-does-tms-last', title: 'How Long Does TMS Last?' },
];

export const COMMERCIAL_SLUGS = [
    { slug: 'get-listed', title: 'Get Listed' },
    { slug: 'advertising', title: 'Advertising with TMS List' },
    { slug: 'marketing-services', title: 'TMS Marketing Services' },
    { slug: 'seo-for-tms', title: 'SEO for TMS Clinics' },
    { slug: 'google-ads-for-tms', title: 'Google Ads for TMS' },
    { slug: 'website-design', title: 'TMS Website Design' },
    { slug: 'reputation-management', title: 'Reputation Management' },
    { slug: 'insurance-credentialing', title: 'Insurance Credentialing' },
    { slug: 'billing-services', title: 'Billing Services' },
    { slug: 'technician-training', title: 'Technician Training' },
    { slug: 'tms-consulting', title: 'TMS Consulting' },
];

export const LEGAL_SLUGS = [
    { slug: 'tms-malpractice-insurance-guide', title: 'TMS Malpractice Insurance Guide' },
    { slug: 'starting-a-tms-clinic-requirements-by-state', title: 'Starting a TMS Clinic: State Requirements' },
    { slug: 'who-can-administer-tms-by-state', title: 'Who Can Administer TMS by State' },
    { slug: 'tms-cpt-codes-guide-2026', title: 'TMS CPT Codes 2026' },
    { slug: 'single-case-agreements-tms', title: 'Single Case Agreements for TMS' },
];

export const RESEARCH_SLUGS = [
    { slug: 'clinical-trials', title: 'Current Clinical Trials' },
    { slug: 'fda-clearance-history', title: 'FDA Clearance History' },
];

export const STORIES_SLUGS = [
    { slug: 'patient-video-testimonials', title: 'Patient Video Testimonials' },
    { slug: 'celebrities-who-used-tms', title: 'Celebrities Who Used TMS' },
];

export const UTILITY_SLUGS = [
    { slug: 'am-i-a-candidate', title: 'Am I a Candidate?' },
    { slug: 'depression-severity-test', title: 'Depression Severity Test (PHQ-9)' },
    { slug: 'insurance-eligibility-checker', title: 'Insurance Eligibility Checker' },
];
