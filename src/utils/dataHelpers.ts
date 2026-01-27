import clinicsData from '../data/clinics.json';
import userSubmittedClinics from '../data/user-submitted-clinics.json';
import { type Clinic } from '../types/clinic';
import { STATE_NAMES } from './clinicData'; // Reusing state map if available, or we can move it here.

// Cast strictly and merge all clinic sources
const mainClinics = clinicsData as unknown as Clinic[];
const submittedClinics = userSubmittedClinics as unknown as Clinic[];

// Merge all clinics - user submissions are added to the main list
const allClinics: Clinic[] = [...mainClinics, ...submittedClinics];

/**
 * Returns all clinics from both verified and user-submitted sources.
 * @returns {Clinic[]} Array of all clinic objects.
 */
export function getAllClinics(): Clinic[] {
    return allClinics;
}

/**
 * Returns only verified operational clinics.
 * Using the 'verified' flag as the source of truth.
 * @returns {Clinic[]} Array of verified clinic objects.
 */
export function getOperationalClinics(): Clinic[] {
    return allClinics.filter(c => c.verified);
}

/**
 * Safely extracts the rating number from a clinic object.
 * Handles both number and object rating structures.
 * @param {Clinic} clinic - The clinic object.
 * @returns {number} The aggregate rating or 0 if missing.
 */
export function getClinicRating(clinic: Clinic): number {
    if (typeof clinic.rating === 'number') return clinic.rating;
    return clinic.rating?.aggregate || 0;
}

/**
 * Safely extracts the review count from a clinic object.
 * @param {Clinic} clinic - The clinic object.
 * @returns {number} Total number of reviews.
 */
export function getClinicReviewCount(clinic: Clinic): number {
    return clinic.review_count || (typeof clinic.rating === 'object' ? clinic.rating.count : 0);
}

const CLINIC_IMAGE_POOL = [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop", // Modern waiting room
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop", // Bright hospital corridor
    "https://images.unsplash.com/photo-1516549655169-df83a092dd14?w=800&h=500&fit=crop", // Medical equipment
    "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&h=500&fit=crop", // Abstract medical blue
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop", // Clean medical office
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=500&fit=crop", // Modern clinic exterior
    "https://images.unsplash.com/photo-1516574187841-693083f69382?w=800&h=500&fit=crop", // Doctor consultation
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop", // Research lab style
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop", // Original default (Chair)
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop", // White clean reception
    "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&h=500&fit=crop", // Blue medical texture
    "https://images.unsplash.com/photo-1576091160550-217358c7e618?w=800&h=500&fit=crop", // Microscope/Tech
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&h=500&fit=crop", // Relaxing therapy room
    "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&h=500&fit=crop", // Green plants in clinic
    "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&h=500&fit=crop", // Neurologist office
    "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&h=500&fit=crop"  // Bright window view
];

/**
 * Returns the best available image for a clinic (Hero > Logo > Deterministic Pool).
 * Uses a hash of the clinic ID or Name to consistently select the same random image
 * from the pool for a given clinic, preventing the "same image everywhere" issue.
 * @param {Clinic} clinic - The clinic object.
 * @returns {string} URL string of the image.
 */
export function getClinicPhoto(clinic: Clinic): string {
    if (clinic.hero_image_url) return clinic.hero_image_url;
    
    // Deterministic hash based on clinic ID or Name
    const str = clinic.id || clinic.name || "default";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Positive modulo to get index
    const index = Math.abs(hash) % CLINIC_IMAGE_POOL.length;
    return CLINIC_IMAGE_POOL[index];
}

/**
 * Returns a list of unique state codes where verified clinics exist.
 * @returns {string[]} Array of state codes (e.g., ['CA', 'TX']).
 */
export function getUniqueStates(): string[] {
    // Returns array of unique state codes e.g. ['CA', 'TX']
    return [...new Set(allClinics.filter(c => c.verified).map(c => c.state))];
}

/**
 * Filters verified clinics by state code.
 * @param {string} stateCode - The 2-letter state code.
 * @returns {Clinic[]} Array of clinics in that state.
 */
export function getClinicsByState(stateCode: string): Clinic[] {
    return allClinics.filter(c => c.verified && c.state === stateCode.toUpperCase());
}

/**
 * Filters verified clinics by city within a specific state.
 * @param {string} stateCode - The 2-letter state code.
 * @param {string} cityName - The city name (case-insensitive).
 * @returns {Clinic[]} Array of clinics in that city.
 */
export function getClinicsByCity(stateCode: string, cityName: string): Clinic[] {
    return allClinics.filter(c =>
        c.verified &&
        c.state === stateCode.toUpperCase() &&
        c.city.toLowerCase() === cityName.toLowerCase()
    );
}

/**
 * Calculates the total number of doctors across all verified clinics.
 * @returns {number} Total count of doctors.
 */
export function getTotalDoctorCount(): number {
    return allClinics
        .filter(c => c.verified)
        .reduce((acc, clinic) => {
            const doctors = (clinic as any).doctors_data || clinic.doctors || [];
            return acc + doctors.length;
        }, 0);
}

/**
 * Retrieves a flattened list of all doctors from verified clinics.
 * @returns {any[]} Array of doctor objects with their associated clinic attached.
 */
export function getAllDoctors(): any[] {
    const doctors: any[] = [];
    allClinics
        .filter(c => c.verified)
        .forEach(clinic => {
            const clinicDoctors = (clinic as any).doctors_data || clinic.doctors || [];
            clinicDoctors.forEach((doc: any) => {
                doctors.push({ ...doc, clinic });
            });
        });
    return doctors;
}

// Keeping the existing helpers for slug compatibility while moving forward
export { STATE_NAMES, getStateSlug, getStateCodeFromSlug } from './clinicData';

