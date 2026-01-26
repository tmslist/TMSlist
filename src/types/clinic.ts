import type { Doctor } from './doctor';

export enum ClinicMachine {
    NeuroStar = 'NeuroStar',
    BrainsWay = 'BrainsWay',
    MagVenture = 'MagVenture',
    CloudTMS = 'CloudTMS',
    Apollo = 'Apollo',
    Magstim = 'Magstim',
    Nexstim = 'Nexstim'
}

export enum ClinicTreatment {
    Depression = 'Depression',
    Anxiety = 'Anxiety',
    OCD = 'OCD',
    PTSD = 'PTSD',
    SmokingCessation = 'Smoking Cessation',
    ChronicPain = 'Chronic Pain'
}

export enum ClinicInsurance {
    Medicare = 'Medicare',
    Medicaid = 'Medicaid',
    BlueCross = 'BlueCross',
    Aetna = 'Aetna',
    Cigna = 'Cigna',
    UnitedHealthcare = 'UnitedHealthcare',
    Tricare = 'Tricare',
    CashSelfPay = 'Cash/Self-Pay'
}

export interface Clinic {
    id: string;
    name: string;
    slug: string;

    // Location
    address: string;
    city: string;
    state: string; // 2-letter code
    zip: string;
    geo: {
        lat: number;
        lng: number;
    };

    // Contact
    phone: string;
    website: string;
    email?: string;

    // Tech & Treatments
    machines: ClinicMachine[];
    specialties: ClinicTreatment[];

    // Financial
    insurances: ClinicInsurance[];

    // Media
    logo_url: string;
    hero_image_url: string;
    gallery_urls: string[];

    // Meta
    rating: number | {
        aggregate: number;
        count: number;
        sentiment_summary: string;
    };

    review_count: number;
    verified: boolean;
    is_featured: boolean;

    // Rich Content Extensions (Preserved from Phase 2)
    description?: string;
    doctors?: Doctor[];
}
