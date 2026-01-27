import clinicsData from '../data/clinics.json';
import { type Clinic } from '../types/clinic';
import { STATE_NAMES } from './clinicData'; // Reusing state map if available, or we can move it here.

// Cast strictly
// Cast strictly
const allClinics = clinicsData as unknown as Clinic[];

export function getAllClinics(): Clinic[] {
    return allClinics;
}

// Emulate the 'operational' filter from RealClinic, but using the main 'verified' flag
export function getOperationalClinics(): Clinic[] {
    return allClinics.filter(c => c.verified);
}

// Helper to handle polymorphic specific rating structure
export function getClinicRating(clinic: Clinic): number {
    if (typeof clinic.rating === 'number') return clinic.rating;
    return clinic.rating?.aggregate || 0;
}

// Helper to get review count safely
export function getClinicReviewCount(clinic: Clinic): number {
    return clinic.review_count || (typeof clinic.rating === 'object' ? clinic.rating.count : 0);
}

// Helper for photo access (fallback to placeholder if needed, though most have logos/heroes)
export function getClinicPhoto(clinic: Clinic): string {
    if (clinic.hero_image_url) return clinic.hero_image_url;
    if (clinic.logo_url) return clinic.logo_url;
    return "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop";
}

export function getUniqueStates(): string[] {
    // Returns array of unique state codes e.g. ['CA', 'TX']
    return [...new Set(allClinics.filter(c => c.verified).map(c => c.state))];
}

export function getClinicsByState(stateCode: string): Clinic[] {
    return allClinics.filter(c => c.verified && c.state === stateCode.toUpperCase());
}

export function getClinicsByCity(stateCode: string, cityName: string): Clinic[] {
    return allClinics.filter(c =>
        c.verified &&
        c.state === stateCode.toUpperCase() &&
        c.city.toLowerCase() === cityName.toLowerCase()
    );
}

// Get total count of doctors across all verified clinics
export function getTotalDoctorCount(): number {
    return allClinics
        .filter(c => c.verified)
        .reduce((acc, clinic) => {
            const doctors = (clinic as any).doctors_data || clinic.doctors || [];
            return acc + doctors.length;
        }, 0);
}

// Get all doctors from verified clinics
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

