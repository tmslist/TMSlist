import { type Clinic } from '../types/clinic';
import type { Clinic as DbClinic } from '../db/schema';
import * as queries from '../db/queries';

// ── DB → TEMPLATE MAPPER ──────────────────────────────
// Maps Drizzle DB rows to the legacy Clinic interface used in all templates.
// This avoids touching 40+ .astro files during migration.

export function mapDbClinic(row: DbClinic): Clinic {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        provider_type: row.providerType as any,
        address: row.address || '',
        city: row.city,
        state: row.state,
        zip: row.zip || '',
        country: row.country,
        geo: {
            lat: row.lat ? parseFloat(row.lat) : 0,
            lng: row.lng ? parseFloat(row.lng) : 0,
        },
        phone: row.phone || '',
        website: row.website || '',
        email: row.email || undefined,
        machines: row.machines || [],
        specialties: row.specialties || [],
        insurances: row.insurances || [],
        accessibility: row.accessibility as any,
        availability: row.availability as any,
        pricing: row.pricing as any,
        hero_image_url: (row.media as any)?.hero_image_url || undefined,
        logo_url: (row.media as any)?.logo_url || undefined,
        gallery_urls: (row.media as any)?.gallery_urls || undefined,
        media: row.media as any,
        rating: parseFloat(row.ratingAvg || '0'),
        review_count: row.reviewCount,
        verified: row.verified,
        is_featured: row.isFeatured,
        description: row.description || undefined,
        description_long: row.descriptionLong || undefined,
        google_business_profile: row.googleProfile as any,
        faqs: row.faqs as any,
        created_by: row.createdBy as any,
        opening_hours: row.openingHours || undefined,
        doctors_data: (row as any).doctors_data || [],
    } as Clinic;
}

// ── COUNTRY METADATA (static — fine to keep here) ──────

export const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    IN: 'India',
    FR: 'France',
    JP: 'Japan',
    KR: 'South Korea',
    BR: 'Brazil',
    ES: 'Spain',
    IT: 'Italy',
    NL: 'Netherlands',
    SG: 'Singapore',
    AE: 'United Arab Emirates',
    NZ: 'New Zealand',
    ZA: 'South Africa',
    SE: 'Sweden',
    IE: 'Ireland',
    IL: 'Israel',
    MX: 'Mexico',
};

export const COUNTRY_FLAGS: Record<string, string> = {
    US: '\u{1F1FA}\u{1F1F8}',
    GB: '\u{1F1EC}\u{1F1E7}',
    CA: '\u{1F1E8}\u{1F1E6}',
    AU: '\u{1F1E6}\u{1F1FA}',
    DE: '\u{1F1E9}\u{1F1EA}',
    IN: '\u{1F1EE}\u{1F1F3}',
    FR: '\u{1F1EB}\u{1F1F7}',
    JP: '\u{1F1EF}\u{1F1F5}',
    KR: '\u{1F1F0}\u{1F1F7}',
    BR: '\u{1F1E7}\u{1F1F7}',
    ES: '\u{1F1EA}\u{1F1F8}',
    IT: '\u{1F1EE}\u{1F1F9}',
    NL: '\u{1F1F3}\u{1F1F1}',
    SG: '\u{1F1F8}\u{1F1EC}',
    AE: '\u{1F1E6}\u{1F1EA}',
    NZ: '\u{1F1F3}\u{1F1FF}',
    ZA: '\u{1F1FF}\u{1F1E6}',
    SE: '\u{1F1F8}\u{1F1EA}',
    IE: '\u{1F1EE}\u{1F1EA}',
    IL: '\u{1F1EE}\u{1F1F1}',
    MX: '\u{1F1F2}\u{1F1FD}',
};

export const COUNTRY_URL_PREFIXES: Record<string, string> = {
    US: 'us',
    GB: 'uk',
    CA: 'ca',
    AU: 'au',
    DE: 'de',
    IN: 'in',
    FR: 'fr',
    JP: 'jp',
    KR: 'kr',
    BR: 'br',
    ES: 'es',
    IT: 'it',
    NL: 'nl',
    SG: 'sg',
    AE: 'ae',
    NZ: 'nz',
    ZA: 'za',
    SE: 'se',
    IE: 'ie',
    IL: 'il',
    MX: 'mx',
};

// ── STATE NAMES (static reference data) ──────

export const STATE_NAMES: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
};

export function getStateSlug(stateCode: string): string {
    const name = STATE_NAMES[stateCode.toUpperCase()];
    return name ? name.toLowerCase().replace(/\s+/g, '-') : stateCode.toLowerCase();
}

export function getStateCodeFromSlug(slug: string): string | undefined {
    return Object.keys(STATE_NAMES).find(code => getStateSlug(code) === slug);
}

// ── ASYNC DATA FUNCTIONS (DB-backed) ──────────────────

export async function getAllClinics(): Promise<Clinic[]> {
    const rows = await queries.getAllVerifiedClinics();
    return rows.map(mapDbClinic);
}

export async function getOperationalClinics(): Promise<Clinic[]> {
    const rows = await queries.getAllVerifiedClinics();
    return rows.map(mapDbClinic);
}

export async function getClinicsByMachine(machine: string): Promise<Clinic[]> {
    const rows = await queries.getClinicsByMachine(machine);
    return rows.map(mapDbClinic);
}

export async function getClinicsByState(stateCode: string): Promise<Clinic[]> {
    const rows = await queries.getClinicsByState(stateCode, { limit: 1000 });
    return rows.map(mapDbClinic);
}

export async function getClinicsByCity(stateCode: string, cityName: string): Promise<Clinic[]> {
    const rows = await queries.getClinicsByCity(stateCode, cityName);
    return rows.map(mapDbClinic);
}

export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
    const row = await queries.getClinicBySlug(slug);
    return row ? mapDbClinic(row) : null;
}

export async function getUniqueStates(): Promise<string[]> {
    return queries.getUniqueStates();
}

export async function getClinicsByCountry(countryCode: string): Promise<Clinic[]> {
    const rows = await queries.getClinicsByCountry(countryCode, { limit: 1000 });
    return rows.map(mapDbClinic);
}

export async function getClinicsByCountryAndRegion(countryCode: string, region: string): Promise<Clinic[]> {
    const rows = await queries.getClinicsByCountryAndRegion(countryCode, region);
    return rows.map(mapDbClinic);
}

export async function getClinicsByCountryRegionCity(countryCode: string, region: string, city: string): Promise<Clinic[]> {
    const rows = await queries.getClinicsByCountryRegionCity(countryCode, region, city);
    return rows.map(mapDbClinic);
}

export async function getUniqueCountries(): Promise<string[]> {
    return queries.getUniqueCountries();
}

export async function getRegionsByCountry(countryCode: string): Promise<string[]> {
    return queries.getRegionsForCountry(countryCode);
}

export async function getCitiesByState(stateCode: string): Promise<string[]> {
    return queries.getCitiesByState(stateCode);
}

export async function getTotalDoctorCount(): Promise<number> {
    return queries.getDoctorCount();
}

export async function getAllDoctors(): Promise<any[]> {
    const rows = await queries.getAllDoctors({ limit: 5000 });
    return rows.map(r => ({
        ...r.doctor,
        clinic: {
            name: r.clinicName,
            slug: r.clinicSlug,
            city: r.clinicCity,
            state: r.clinicState,
        },
    }));
}

export async function buildInternationalDirectory() {
    const countryCodes = await queries.getUniqueCountries();
    const result = [];

    for (const countryCode of countryCodes) {
        const countryClinics = await queries.getClinicsByCountry(countryCode, { limit: 1000 });
        const regionSet = [...new Set(countryClinics.map(c => c.state).filter(Boolean))].sort();

        result.push({
            code: countryCode,
            name: COUNTRY_NAMES[countryCode] || countryCode,
            flag: COUNTRY_FLAGS[countryCode] || '',
            urlPrefix: COUNTRY_URL_PREFIXES[countryCode] || countryCode.toLowerCase(),
            clinicCount: countryClinics.length,
            regions: regionSet.map(region => {
                const regionClinics = countryClinics.filter(c => c.state === region);
                const cities = [...new Set(regionClinics.map(c => c.city).filter(Boolean))].sort();
                return {
                    name: region,
                    slug: region.toLowerCase().replace(/\s+/g, '-'),
                    clinicCount: regionClinics.length,
                    cities: cities.map(city => ({
                        name: city,
                        slug: city.toLowerCase().replace(/\s+/g, '-'),
                        count: regionClinics.filter(c => c.city === city).length,
                    })),
                };
            }),
        });
    }

    return result;
}

// ── PURE HELPER FUNCTIONS (no data source needed) ──────

import { getClinicImageUrl } from './images';

export function getClinicRating(clinic: Clinic): number {
    if (typeof clinic.rating === 'number') return clinic.rating;
    return clinic.rating?.aggregate || 0;
}

export function getClinicReviewCount(clinic: Clinic): number {
    return clinic.review_count || (typeof clinic.rating === 'object' ? clinic.rating.count : 0);
}

export function getClinicPhoto(clinic: Clinic): string {
    if (clinic.hero_image_url) return clinic.hero_image_url;
    return getClinicImageUrl({ id: clinic.id, name: clinic.name, media: clinic.media });
}

export function getDoctorPhoto(doctor: { name?: string; image_url?: string; imageUrl?: string; slug?: string }): string {
    const img = doctor.image_url || doctor.imageUrl;
    if (img) return img;
    const name = doctor.name || 'Doctor';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=200`;
}

export function hasRealClinicImage(clinic: { hero_image_url?: string; media?: { hero_image_url?: string } }): boolean {
    const url = clinic.hero_image_url || clinic.media?.hero_image_url;
    if (!url) return false;
    return !url.includes('unsplash.com');
}
