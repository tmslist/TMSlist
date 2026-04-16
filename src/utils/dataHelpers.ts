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
    US: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#B22234"/><rect y="39" width="512" height="39" fill="#fff"/><rect y="117" width="512" height="39" fill="#fff"/><rect y="196" width="512" height="39" fill="#fff"/><rect y="274" width="512" height="39" fill="#fff"/><rect y="353" width="512" height="39" fill="#fff"/><rect y="432" width="512" height="39" fill="#fff"/><rect width="205" height="274" fill="#3C3B6E"/></svg>',
    GB: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#012169"/><path d="M0 0L512 512M512 0L0 512" stroke="#fff" stroke-width="85"/><path d="M0 0L512 512M512 0L0 512" stroke="#C8102E" stroke-width="55"/><path d="M256 0V512M0 256H512" stroke="#fff" stroke-width="85"/><path d="M256 0V512M0 256H512" stroke="#C8102E" stroke-width="55"/></svg>',
    CA: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="170" height="512" fill="#FF0000"/><rect x="170" width="172" height="512" fill="#fff"/><rect x="342" width="170" height="512" fill="#FF0000"/><path d="M256 170L310 256 256 342 202 256Z" fill="#FF0000"/><path d="M256 214L278 256 256 298 234 256Z" fill="#fff"/><path d="M202 192H310V320H202Z" fill="#FF0000"/><path d="M224 214H288V298H224Z" fill="#fff"/></svg>',
    AU: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#00008B"/><path d="M0 0L0 256L256 256Z" fill="#012169"/><path d="M85 0L85 171L256 171Z" fill="#fff"/><path d="M0 57L0 114L171 114Z" fill="#fff"/><path d="M0 0L57 57L0 114Z" fill="#c8102e"/><path d="M28 0L28 57L85 57Z" fill="#c8102e"/><path d="M0 28L57 28L0 85Z" fill="#c8102e"/><path d="M0 0L256 256M0 256L256 0" stroke="#fff" stroke-width="19"/><path d="M0 0L256 256M0 256L256 0" stroke="#c8102e" stroke-width="10"/></svg>',
    DE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="171" fill="#000"/><rect y="171" width="512" height="171" fill="#D00"/><rect y="341" width="512" height="171" fill="#FFCE00"/></svg>',
    IN: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="171" fill="#FF9933"/><rect y="171" width="512" height="171" fill="#fff"/><rect y="341" width="512" height="171" fill="#138808"/><circle cx="256" cy="256" r="51" fill="none" stroke="#000080" stroke-width="17"/></svg>',
    FR: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="171" height="512" fill="#002395"/><rect x="171" width="170" height="512" fill="#fff"/><rect x="341" width="171" height="512" fill="#ED2939"/></svg>',
    JP: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#fff"/><circle cx="256" cy="256" r="154" fill="#BC002D"/></svg>',
    KR: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#fff"/><circle cx="256" cy="256" r="128" fill="#C60C30"/><path d="M256 128A128 128 0 00256 384" fill="#003478"/></svg>',
    BR: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#229E45"/><polygon points="256,26 486,256 256,486 26,256" fill="#F7E900"/><circle cx="256" cy="256" r="77" fill="#2B49A3"/><path d="M256 205C231 205 211 225 211 250C211 256 225 279 256 305C287 279 301 256 301 250C301 225 281 205 256 205Z" fill="#fff"/></svg>',
    ES: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="128" fill="#AA151B"/><rect y="128" width="512" height="256" fill="#F1BF00"/><rect y="384" width="512" height="128" fill="#AA151B"/></svg>',
    IT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="171" height="512" fill="#009246"/><rect x="171" width="170" height="512" fill="#fff"/><rect x="341" width="171" height="512" fill="#CE2B37"/></svg>',
    NL: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="171" fill="#AE1C28"/><rect y="171" width="512" height="171" fill="#fff"/><rect y="341" width="512" height="171" fill="#21468B"/></svg>',
    SG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="171" fill="#ED2939"/><rect y="171" width="512" height="171" fill="#fff"/><rect y="341" width="512" height="171" fill="#ED2939"/><polygon points="256,86 296,206 426,206 324,280 364,399 256,325 148,399 188,280 86,206 216,206" fill="#fff"/></svg>',
    AE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="128" fill="#00732F"/><rect y="128" width="512" height="256" fill="#fff"/><rect y="384" width="512" height="128" fill="#000"/><rect width="85" height="512" fill="#FF0000"/></svg>',
    NZ: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#00247D"/><path d="M0 0L0 256L256 256Z" fill="#CC142B"/><path d="M0 0L0 171L171 171Z" fill="#fff"/><path d="M0 0L57 57L0 114Z" fill="#CC142B"/><path d="M28 0L28 57L85 57Z" fill="#CC142B"/><path d="M0 28L57 28L0 85Z" fill="#CC142B"/><path d="M0 0L256 256M0 256L256 0" stroke="#fff" stroke-width="19"/><path d="M0 0L256 256M0 256L256 0" stroke="#CC142B" stroke-width="10"/></svg>',
    ZA: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="102" fill="#007749"/><rect y="102" width="512" height="103" fill="#fff"/><rect y="205" width="512" height="103" fill="#DE3831"/><rect y="308" width="512" height="102" fill="#002395"/><rect y="410" width="512" height="102" fill="#000"/><path d="M0 0L256 256L512 0" fill="none" stroke="#FFB612" stroke-width="26"/></svg>',
    SE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="512" fill="#006AA7"/><rect width="102" height="512" x="154" fill="#FECC00"/><rect height="102" width="512" y="205" fill="#FECC00"/></svg>',
    IE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="170" height="512" fill="#169B62"/><rect x="171" width="170" height="512" fill="#fff"/><rect x="342" width="170" height="512" fill="#FF883E"/></svg>',
    IL: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="512" height="171" fill="#fff"/><rect y="171" width="512" height="171" fill="#0038B8"/><rect y="341" width="512" height="171" fill="#fff"/><path d="M256 220L230 280H282Z" fill="none" stroke="#0038B8" stroke-width="8"/><path d="M256 280L230 220" stroke="#0038B8" stroke-width="8"/></svg>',
    MX: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline-block w-4 h-3 align-middle rounded-sm overflow-hidden"><rect width="171" height="512" fill="#006341"/><rect x="171" width="170" height="512" fill="#fff"/><rect x="341" width="171" height="512" fill="#CE1126"/><path d="M256 140L276 210 350 210 290 255 310 325 256 280 202 325 222 255 162 210 236 210Z" fill="#6D3F0A"/></svg>',
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

/** Returns true if the URL looks like a generic hardcoded stock fallback (Unsplash or Picsum). */
function isStockFallback(url: string): boolean {
    return url.includes('images.unsplash.com') || url.includes('picsum.photos');
}

export function getClinicPhoto(clinic: Clinic): string {
    const { hero_image_url } = clinic;
    // Only use stored image if it's a real upload (not a stock fallback)
    if (hero_image_url && !isStockFallback(hero_image_url)) {
        return hero_image_url;
    }
    return getClinicImageUrl({ id: clinic.id, name: clinic.name, media: clinic.media });
}

export function getDoctorPhoto(doctor: { name?: string; image_url?: string; imageUrl?: string; slug?: string }): string {
    return doctor.image_url || doctor.imageUrl
        || (() => {
            const name = doctor.name || 'Doctor';
            const seed = Math.abs(
                ((hashStr: string) => {
                    let h = 5381;
                    for (let i = 0; i < hashStr.length; i++) {
                        h = ((h << 5) + h) + hashStr.charCodeAt(i);
                        h = h & h;
                    }
                    return h;
                })(name)
            );
            return `https://picsum.photos/seed/${seed + 999999}/200/200`;
        })();
}

export function hasRealClinicImage(clinic: { hero_image_url?: string; media?: { hero_image_url?: string } }): boolean {
    const url = clinic.hero_image_url || clinic.media?.hero_image_url;
    if (!url) return false;
    return !url.includes('unsplash.com');
}
