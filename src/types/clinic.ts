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

// NEW: Creator Attribution
export interface CreatedBy {
    name: string;
    email?: string;
    submitted_at: string; // ISO date string
    source: 'website_form' | 'admin' | 'import' | 'api';
}

// NEW: Google Business Profile Embed
export interface GoogleBusinessProfile {
    place_id?: string;
    embed_url?: string; // Google Maps embed URL
    reviews_url?: string; // Link to GBP reviews
}

// NEW: Media URLs (external hosting only)
export interface ClinicMedia {
    hero_image_url?: string;
    logo_url?: string;
    gallery_urls?: string[];
    video_url?: string; // YouTube or Vimeo URL
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
    machines: ClinicMachine[] | string[];
    specialties: ClinicTreatment[] | string[];

    // Financial
    insurances: ClinicInsurance[] | string[];

    // Media (URL-based)
    logo_url?: string;
    hero_image_url?: string;
    gallery_urls?: string[];
    media?: ClinicMedia;

    // Meta
    rating: number | {
        aggregate: number;
        count: number;
        sentiment_summary?: string;
    };

    review_count?: number;
    verified: boolean;
    is_featured?: boolean;

    // Rich Content Extensions
    description?: string;
    description_long?: string;
    doctors?: Doctor[];
    doctors_data?: any[];

    // NEW: Creator Attribution
    created_by?: CreatedBy;

    // NEW: Google Business Profile
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

