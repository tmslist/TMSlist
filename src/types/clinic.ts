import type { Doctor } from './doctor';

// ============================================
// TMS DEVICES - All Major Manufacturers
// ============================================
export enum ClinicMachine {
    // Major FDA-Cleared Systems
    NeuroStar = 'NeuroStar',               // Neuronetics - most common
    BrainsWay = 'BrainsWay',               // Deep TMS with H-coil
    MagVenture = 'MagVenture',             // MagPro systems
    CloudTMS = 'CloudTMS',                  // Cloud-based platform
    Magstim = 'Magstim',                    // UK-based, research standard
    Nexstim = 'Nexstim',                    // Navigated TMS
    Apollo = 'Apollo',                       // Apollo Healthcare

    // Additional Devices
    eNeura = 'eNeura',                       // Spring TMS for migraine
    Neurosoft = 'Neurosoft',                 // Russian manufacturer
    Deymed = 'Deymed',                       // European
    MAGMore = 'MAG & More',                  // German
    Remed = 'Remed',                         // Russian/Asian markets
    Yingchi = 'Yingchi',                     // Chinese manufacturer
    NeoSync = 'NeoSync',                     // EEG-synchronized TMS
    AxilumRobotics = 'Axilum Robotics',      // Robotic TMS
    Soterix = 'Soterix',                     // HD-tDCS/TMS hybrid

    // Generic/Other
    Other = 'Other'
}

// ============================================
// CONDITIONS TREATED
// ============================================
export enum ClinicTreatment {
    // FDA-Cleared Indications
    Depression = 'Depression',
    MajorDepressiveDisorder = 'Major Depressive Disorder',
    TreatmentResistantDepression = 'Treatment-Resistant Depression',
    OCD = 'OCD',
    AnxiousDepression = 'Anxious Depression',

    // Off-Label / Research
    Anxiety = 'Anxiety',
    PTSD = 'PTSD',
    BipolarDepression = 'Bipolar Depression',
    SmokingCessation = 'Smoking Cessation',
    SubstanceAbuse = 'Substance Use Disorder',
    ChronicPain = 'Chronic Pain',
    Fibromyalgia = 'Fibromyalgia',
    Migraine = 'Migraine',
    Tinnitus = 'Tinnitus',
    Autism = 'Autism Spectrum',
    ADHD = 'ADHD',
    Schizophrenia = 'Schizophrenia (Negative Symptoms)',
    StrokeRehab = 'Stroke Rehabilitation'
}

// ============================================
// INSURANCE PROVIDERS - Comprehensive US List
// ============================================
export enum ClinicInsurance {
    // ----- GOVERNMENT PROGRAMS -----
    // Medicare
    Medicare = 'Medicare',
    MedicarePartB = 'Medicare Part B',
    MedicareAdvantage = 'Medicare Advantage',
    MedicareSupplement = 'Medicare Supplement (Medigap)',

    // Medicaid
    Medicaid = 'Medicaid',
    MediCal = 'Medi-Cal (California)',

    // Military & Veterans
    Tricare = 'Tricare',
    TricarePrime = 'Tricare Prime',
    TricareSelect = 'Tricare Select',
    TricareForLife = 'Tricare For Life',
    TricareReserveSelect = 'Tricare Reserve Select',
    TriWest = 'TriWest Healthcare Alliance',
    VAHealthcare = 'VA Healthcare',
    CHAMPVA = 'CHAMPVA',

    // ACA Marketplace
    ACAMarketplace = 'ACA Marketplace Plan',
    CoveredCalifornia = 'Covered California',
    NYStateOfHealth = 'NY State of Health',
    HealthCareCov = 'HealthCare.gov Plan',

    // ----- MAJOR NATIONAL CARRIERS -----
    UnitedHealthcare = 'UnitedHealthcare',
    UHCOptum = 'UHC Optum',
    BlueCrossBlueShield = 'Blue Cross Blue Shield',
    BCBS = 'BCBS',
    Aetna = 'Aetna',
    AetnaCVS = 'Aetna CVS Health',
    Cigna = 'Cigna',
    CignaEvernorth = 'Cigna Evernorth',
    Humana = 'Humana',
    KaiserPermanente = 'Kaiser Permanente',
    Anthem = 'Anthem',
    AnthemBCBS = 'Anthem Blue Cross Blue Shield',

    // ----- REGIONAL CARRIERS -----
    // West
    HealthNet = 'Health Net',
    PacificSource = 'PacificSource',
    PremeraBlueCross = 'Premera Blue Cross',
    RegenceBlueCross = 'Regence Blue Cross',
    SelectHealth = 'SelectHealth',
    MolinaHealthcare = 'Molina Healthcare',
    LACarePlus = 'L.A. Care Health Plan',
    HealthPlanNevada = 'Health Plan of Nevada',

    // Midwest
    HealthPartners = 'HealthPartners',
    Priority_Health = 'Priority Health',
    MercyCare = 'MercyCare',
    BCBSIL = 'BCBS Illinois',
    BCBSMN = 'BCBS Minnesota',

    // Northeast
    EmblemHealth = 'EmblemHealth',
    HorizonBCBS = 'Horizon Blue Cross Blue Shield',
    IndependenceBlueCross = 'Independence Blue Cross',
    HighmarkBCBS = 'Highmark BCBS',
    CareFirst = 'CareFirst BCBS',
    CapitalBlueCross = 'Capital Blue Cross',
    CDPHP = 'CDPHP',
    MvpHealth = 'MVP Health Care',
    TuftHealth = 'Tufts Health Plan',
    HarvardPilgrim = 'Harvard Pilgrim',
    BlueCrossMA = 'Blue Cross Blue Shield MA',
    ConnectiCare = 'ConnectiCare',

    // Southeast
    FloridaBlue = 'Florida Blue',
    BCBSFL = 'BCBS Florida',
    BlueCrossNC = 'Blue Cross NC',
    BCBSTX = 'BCBS Texas',
    Amerigroup = 'Amerigroup',
    CareSource = 'CareSource',
    WellCare = 'WellCare',

    // Southwest  
    BlueCrossAZ = 'Blue Cross Blue Shield AZ',
    BCBSNM = 'BCBS New Mexico',

    // ----- EMPLOYER/UNION PLANS -----
    FEHB = 'FEHB (Federal Employee)',
    GEHA = 'GEHA',
    NALC = 'NALC Health',
    Teamsters = 'Teamsters',
    SEIU = 'SEIU',
    IBEW = 'IBEW',
    AFTPlus = 'AFT+',

    // ----- SPECIALTY/OTHER -----
    CenteneCorp = 'Centene',
    Magellan = 'Magellan Health',
    BeaconHealth = 'Beacon Health Options',
    ComPsych = 'ComPsych',
    Optum = 'Optum Behavioral Health',
    NewDirections = 'New Directions Behavioral Health',
    FirstHealth = 'First Health Network',
    MultiPlan = 'MultiPlan/PHCS',

    // ----- PAYMENT OPTIONS -----
    CashSelfPay = 'Cash/Self-Pay',
    SlidingScale = 'Sliding Scale Fee',
    FinancingAvailable = 'Financing Available',
    OutOfNetwork = 'Out-of-Network Reimbursement',
    CareCredit = 'CareCredit',
    Prosper = 'Prosper Healthcare Lending',
    HSA_FSA = 'HSA/FSA Accepted',
    SuperBill = 'Superbill Provided'
}

// ============================================
// ACCESSIBILITY & INCLUSIVITY
// ============================================
export interface ClinicAccessibility {
    wheelchair_accessible?: boolean;
    lgbtq_friendly?: boolean;
    lgbtq_owned?: boolean;
    bipoc_owned?: boolean;
    veteran_friendly?: boolean;
    spanish_speaking?: boolean;
    multilingual?: boolean;
    languages_spoken?: string[];
    sensory_friendly?: boolean;  // Autism/sensory sensitivities
    trauma_informed?: boolean;
}

// ============================================
// AVAILABILITY
// ============================================
export interface ClinicAvailability {
    accepting_new_patients?: boolean;
    wait_time_weeks?: number;
    same_week_available?: boolean;
    evening_hours?: boolean;
    weekend_hours?: boolean;
    telehealth_consults?: boolean;
    virtual_followups?: boolean;
    home_visits?: boolean;  // For portable TMS
}

// ============================================
// PRICING
// ============================================
export interface ClinicPricing {
    price_range?: 'budget' | 'moderate' | 'premium';
    session_price_min?: number;
    session_price_max?: number;
    full_course_price?: number;  // 36 sessions
    free_consultation?: boolean;
    payment_plans?: boolean;
    accepts_insurance?: boolean;
    cash_discount?: boolean;
}

// ============================================
// CREATOR ATTRIBUTION
// ============================================
export interface CreatedBy {
    name: string;
    email?: string;
    submitted_at: string;
    source: 'website_form' | 'admin' | 'import' | 'api';
}

// ============================================
// GOOGLE BUSINESS PROFILE
// ============================================
export interface GoogleBusinessProfile {
    place_id?: string;
    embed_url?: string;
    reviews_url?: string;
}

// ============================================
// MEDIA
// ============================================
export interface ClinicMedia {
    hero_image_url?: string;
    logo_url?: string;
    gallery_urls?: string[];
    video_url?: string;
}

// ============================================
// PROVIDER TYPE
// ============================================
export enum ClinicProviderType {
    Psychiatrist = 'Psychiatrist (MD/DO)',
    TMSCenter = 'Dedicated TMS Center',
    Hospital = 'Hospital / Medical Center',
    Neurologist = 'Neurologist',
    MentalHealthClinic = 'Mental Health Clinic',
    PrimaryCare = 'Primary Care / Family Practice',
    NursePractitioner = 'Psychiatric Nurse Practitioner'
}

// ============================================
// MAIN CLINIC INTERFACE
// ============================================
export interface Clinic {
    id: string;
    name: string;
    slug: string;
    provider_type?: ClinicProviderType; // New field

    // Location
    address: string;
    city: string;
    state: string;
    zip: string;
    geo: {
        lat: number;
        lng: number;
    };

    // Contact
    phone: string;
    website: string;
    email?: string;

    // Technology & Treatments
    machines: ClinicMachine[] | string[];
    specialties: ClinicTreatment[] | string[];

    // Insurance & Payment
    insurances: ClinicInsurance[] | string[];

    // NEW: Expanded Filter Fields
    accessibility?: ClinicAccessibility;
    availability?: ClinicAvailability;
    pricing?: ClinicPricing;

    // Media
    logo_url?: string;
    hero_image_url?: string;
    gallery_urls?: string[];
    media?: ClinicMedia;

    // Ratings
    rating: number | {
        aggregate: number;
        count: number;
        sentiment_summary?: string;
    };
    review_count?: number;

    // Status
    verified: boolean;
    is_featured?: boolean;

    // Content
    description?: string;
    description_long?: string;
    doctors?: Doctor[];
    doctors_data?: any[];

    // Attribution
    created_by?: CreatedBy;

    // Google Business Profile
    google_business_profile?: GoogleBusinessProfile;

    // Legacy compatibility
    treatments?: string[];
    insurance_accepted?: string[];
    contact?: {
        phone?: string;
        website_url?: string;
    };
    address_obj?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        county?: string;
        nearby_landmarks?: string[];
    };
    opening_hours?: string[];
    faqs?: { question: string; answer: string }[];
    cost_info?: {
        accepts_insurance?: boolean;
        cash_price_per_session?: string;
        financing_available?: boolean;
    };
}

