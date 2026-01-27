/**
 * Filter Options for TMS List
 * Comprehensive arrays for building filter UIs
 */

import { ClinicMachine, ClinicTreatment, ClinicInsurance } from '../types/clinic';

// ============================================
// TMS DEVICES - Grouped by Category
// ============================================
export const TMS_DEVICE_CATEGORIES = {
    major: {
        label: 'Major FDA-Cleared Systems',
        options: [
            { value: ClinicMachine.NeuroStar, label: 'NeuroStar (Neuronetics)' },
            { value: ClinicMachine.BrainsWay, label: 'BrainsWay Deep TMS' },
            { value: ClinicMachine.MagVenture, label: 'MagVenture MagPro' },
            { value: ClinicMachine.CloudTMS, label: 'CloudTMS' },
            { value: ClinicMachine.Magstim, label: 'Magstim' },
            { value: ClinicMachine.Nexstim, label: 'Nexstim Navigated' },
            { value: ClinicMachine.Apollo, label: 'Apollo' },
        ]
    },
    additional: {
        label: 'Additional Devices',
        options: [
            { value: ClinicMachine.eNeura, label: 'eNeura Spring TMS' },
            { value: ClinicMachine.Neurosoft, label: 'Neurosoft' },
            { value: ClinicMachine.Deymed, label: 'Deymed' },
            { value: ClinicMachine.MAGMore, label: 'MAG & More' },
            { value: ClinicMachine.Remed, label: 'Remed' },
            { value: ClinicMachine.Yingchi, label: 'Yingchi' },
            { value: ClinicMachine.NeoSync, label: 'NeoSync EEG-TMS' },
            { value: ClinicMachine.AxilumRobotics, label: 'Axilum Robotics' },
            { value: ClinicMachine.Soterix, label: 'Soterix' },
            { value: ClinicMachine.Other, label: 'Other' },
        ]
    }
};

export const ALL_TMS_DEVICES = Object.values(TMS_DEVICE_CATEGORIES).flatMap(cat => cat.options);

// ============================================
// INSURANCE - Grouped by Type
// ============================================
export const INSURANCE_CATEGORIES = {
    government_medicare: {
        label: 'Medicare',
        options: [
            { value: ClinicInsurance.Medicare, label: 'Medicare (Original)' },
            { value: ClinicInsurance.MedicarePartB, label: 'Medicare Part B' },
            { value: ClinicInsurance.MedicareAdvantage, label: 'Medicare Advantage' },
            { value: ClinicInsurance.MedicareSupplement, label: 'Medigap' },
        ]
    },
    government_medicaid: {
        label: 'Medicaid',
        options: [
            { value: ClinicInsurance.Medicaid, label: 'Medicaid' },
            { value: ClinicInsurance.MediCal, label: 'Medi-Cal (CA)' },
        ]
    },
    military: {
        label: 'Military & Veterans',
        options: [
            { value: ClinicInsurance.Tricare, label: 'Tricare' },
            { value: ClinicInsurance.TricarePrime, label: 'Tricare Prime' },
            { value: ClinicInsurance.TricareSelect, label: 'Tricare Select' },
            { value: ClinicInsurance.TricareForLife, label: 'Tricare For Life' },
            { value: ClinicInsurance.TricareReserveSelect, label: 'Tricare Reserve Select' },
            { value: ClinicInsurance.TriWest, label: 'TriWest' },
            { value: ClinicInsurance.VAHealthcare, label: 'VA Healthcare' },
            { value: ClinicInsurance.CHAMPVA, label: 'CHAMPVA' },
        ]
    },
    aca: {
        label: 'ACA / Marketplace',
        options: [
            { value: ClinicInsurance.ACAMarketplace, label: 'ACA Marketplace' },
            { value: ClinicInsurance.CoveredCalifornia, label: 'Covered California' },
            { value: ClinicInsurance.NYStateOfHealth, label: 'NY State of Health' },
            { value: ClinicInsurance.HealthCareCov, label: 'HealthCare.gov Plan' },
        ]
    },
    national: {
        label: 'Major National Carriers',
        options: [
            { value: ClinicInsurance.UnitedHealthcare, label: 'UnitedHealthcare' },
            { value: ClinicInsurance.BlueCrossBlueShield, label: 'Blue Cross Blue Shield' },
            { value: ClinicInsurance.Aetna, label: 'Aetna' },
            { value: ClinicInsurance.Cigna, label: 'Cigna' },
            { value: ClinicInsurance.Humana, label: 'Humana' },
            { value: ClinicInsurance.KaiserPermanente, label: 'Kaiser Permanente' },
            { value: ClinicInsurance.Anthem, label: 'Anthem' },
        ]
    },
    regional_west: {
        label: 'Regional - West',
        options: [
            { value: ClinicInsurance.HealthNet, label: 'Health Net' },
            { value: ClinicInsurance.PremeraBlueCross, label: 'Premera Blue Cross' },
            { value: ClinicInsurance.RegenceBlueCross, label: 'Regence Blue Cross' },
            { value: ClinicInsurance.SelectHealth, label: 'SelectHealth' },
            { value: ClinicInsurance.MolinaHealthcare, label: 'Molina Healthcare' },
            { value: ClinicInsurance.LACarePlus, label: 'L.A. Care' },
        ]
    },
    regional_northeast: {
        label: 'Regional - Northeast',
        options: [
            { value: ClinicInsurance.EmblemHealth, label: 'EmblemHealth' },
            { value: ClinicInsurance.HorizonBCBS, label: 'Horizon BCBS' },
            { value: ClinicInsurance.IndependenceBlueCross, label: 'Independence Blue Cross' },
            { value: ClinicInsurance.HighmarkBCBS, label: 'Highmark BCBS' },
            { value: ClinicInsurance.CareFirst, label: 'CareFirst BCBS' },
            { value: ClinicInsurance.TuftHealth, label: 'Tufts Health' },
            { value: ClinicInsurance.HarvardPilgrim, label: 'Harvard Pilgrim' },
        ]
    },
    regional_southeast: {
        label: 'Regional - Southeast',
        options: [
            { value: ClinicInsurance.FloridaBlue, label: 'Florida Blue' },
            { value: ClinicInsurance.BlueCrossNC, label: 'Blue Cross NC' },
            { value: ClinicInsurance.Amerigroup, label: 'Amerigroup' },
            { value: ClinicInsurance.CareSource, label: 'CareSource' },
            { value: ClinicInsurance.WellCare, label: 'WellCare' },
        ]
    },
    employer_union: {
        label: 'Employer / Union Plans',
        options: [
            { value: ClinicInsurance.FEHB, label: 'Federal Employee (FEHB)' },
            { value: ClinicInsurance.GEHA, label: 'GEHA' },
            { value: ClinicInsurance.Teamsters, label: 'Teamsters' },
            { value: ClinicInsurance.SEIU, label: 'SEIU' },
            { value: ClinicInsurance.IBEW, label: 'IBEW' },
        ]
    },
    behavioral: {
        label: 'Behavioral Health Networks',
        options: [
            { value: ClinicInsurance.Magellan, label: 'Magellan Health' },
            { value: ClinicInsurance.BeaconHealth, label: 'Beacon Health' },
            { value: ClinicInsurance.Optum, label: 'Optum Behavioral' },
            { value: ClinicInsurance.ComPsych, label: 'ComPsych' },
            { value: ClinicInsurance.NewDirections, label: 'New Directions' },
        ]
    },
    payment: {
        label: 'Payment Options',
        options: [
            { value: ClinicInsurance.CashSelfPay, label: 'Cash / Self-Pay' },
            { value: ClinicInsurance.SlidingScale, label: 'Sliding Scale' },
            { value: ClinicInsurance.FinancingAvailable, label: 'Financing Available' },
            { value: ClinicInsurance.OutOfNetwork, label: 'Out-of-Network' },
            { value: ClinicInsurance.CareCredit, label: 'CareCredit' },
            { value: ClinicInsurance.HSA_FSA, label: 'HSA/FSA Accepted' },
            { value: ClinicInsurance.SuperBill, label: 'Superbill Provided' },
        ]
    }
};

export const ALL_INSURANCES = Object.values(INSURANCE_CATEGORIES).flatMap(cat => cat.options);

// ============================================
// CONDITIONS TREATED
// ============================================
export const CONDITION_CATEGORIES = {
    fda_cleared: {
        label: 'FDA-Cleared Indications',
        options: [
            { value: ClinicTreatment.Depression, label: 'Depression' },
            { value: ClinicTreatment.MajorDepressiveDisorder, label: 'Major Depressive Disorder' },
            { value: ClinicTreatment.TreatmentResistantDepression, label: 'Treatment-Resistant Depression' },
            { value: ClinicTreatment.OCD, label: 'OCD' },
            { value: ClinicTreatment.AnxiousDepression, label: 'Anxious Depression' },
        ]
    },
    off_label: {
        label: 'Off-Label / Research',
        options: [
            { value: ClinicTreatment.Anxiety, label: 'Anxiety' },
            { value: ClinicTreatment.PTSD, label: 'PTSD' },
            { value: ClinicTreatment.BipolarDepression, label: 'Bipolar Depression' },
            { value: ClinicTreatment.SmokingCessation, label: 'Smoking Cessation' },
            { value: ClinicTreatment.SubstanceAbuse, label: 'Substance Use Disorder' },
            { value: ClinicTreatment.ChronicPain, label: 'Chronic Pain' },
            { value: ClinicTreatment.Fibromyalgia, label: 'Fibromyalgia' },
            { value: ClinicTreatment.Migraine, label: 'Migraine' },
            { value: ClinicTreatment.Tinnitus, label: 'Tinnitus' },
            { value: ClinicTreatment.Autism, label: 'Autism Spectrum' },
            { value: ClinicTreatment.ADHD, label: 'ADHD' },
            { value: ClinicTreatment.Schizophrenia, label: 'Schizophrenia' },
            { value: ClinicTreatment.StrokeRehab, label: 'Stroke Rehabilitation' },
        ]
    }
};

export const ALL_CONDITIONS = Object.values(CONDITION_CATEGORIES).flatMap(cat => cat.options);

// ============================================
// ACCESSIBILITY & INCLUSIVITY FILTERS
// ============================================
export const ACCESSIBILITY_FILTERS = [
    { key: 'lgbtq_friendly', label: 'LGBTQ+ Friendly', icon: '🏳️‍🌈' },
    { key: 'lgbtq_owned', label: 'LGBTQ+ Owned', icon: '🏳️‍🌈' },
    { key: 'bipoc_owned', label: 'BIPOC Owned', icon: '✊🏿' },
    { key: 'veteran_friendly', label: 'Veteran Friendly', icon: '🎖️' },
    { key: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
    { key: 'spanish_speaking', label: 'Spanish Speaking', icon: '🇪🇸' },
    { key: 'multilingual', label: 'Multilingual Staff', icon: '🌐' },
    { key: 'sensory_friendly', label: 'Sensory Friendly', icon: '🧠' },
    { key: 'trauma_informed', label: 'Trauma-Informed Care', icon: '💜' },
];

// ============================================
// AVAILABILITY FILTERS
// ============================================
export const AVAILABILITY_FILTERS = [
    { key: 'accepting_new_patients', label: 'Accepting New Patients', icon: '✅' },
    { key: 'same_week_available', label: 'Same Week Availability', icon: '⚡' },
    { key: 'evening_hours', label: 'Evening Hours', icon: '🌙' },
    { key: 'weekend_hours', label: 'Weekend Hours', icon: '📅' },
    { key: 'telehealth_consults', label: 'Telehealth Consults', icon: '💻' },
    { key: 'virtual_followups', label: 'Virtual Follow-ups', icon: '📱' },
];

// ============================================
// PRICE RANGE OPTIONS
// ============================================
export const PRICE_RANGE_OPTIONS = [
    { value: 'budget', label: 'Budget-Friendly', description: 'Under $200/session' },
    { value: 'moderate', label: 'Moderate', description: '$200-$400/session' },
    { value: 'premium', label: 'Premium', description: '$400+/session' },
];

// ============================================
// PRICING FILTERS
// ============================================
export const PRICING_FILTERS = [
    { key: 'free_consultation', label: 'Free Consultation', icon: '🆓' },
    { key: 'payment_plans', label: 'Payment Plans', icon: '💳' },
    { key: 'accepts_insurance', label: 'Accepts Insurance', icon: '🏥' },
    { key: 'cash_discount', label: 'Cash Discount', icon: '💵' },
];

// ============================================
// LANGUAGES (Common in US)
// ============================================
export const LANGUAGES = [
    'English',
    'Spanish',
    'Mandarin',
    'Cantonese',
    'Tagalog',
    'Vietnamese',
    'Korean',
    'Arabic',
    'Russian',
    'Portuguese',
    'French',
    'Hindi',
    'Urdu',
    'Farsi',
    'Japanese',
    'Polish',
    'German',
    'Italian',
    'Sign Language (ASL)',
];

// ============================================
// US STATES
// ============================================
export const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'Washington DC' },
    { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];
