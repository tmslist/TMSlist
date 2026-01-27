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

/**
 * Returns the best available image for a clinic (Hero > Logo > Fallback).
 * @param {Clinic} clinic - The clinic object.
 * @returns {string} URL string of the image.
 */
export function getClinicPhoto(clinic: Clinic): string {
    if (clinic.hero_image_url) return clinic.hero_image_url;
    if (clinic.logo_url) return clinic.logo_url;
    return "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop";
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

