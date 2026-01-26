import clinicsData from '../data/clinics.json';
import { type Clinic } from '../types/clinic';
import { STATE_NAMES } from './clinicData'; // Reusing state map if available, or we can move it here.

// Cast strictly
const allClinics = clinicsData as unknown as Clinic[];

export function getAllClinics(): Clinic[] {
    return allClinics;
}

export function getUniqueStates(): string[] {
    // Returns array of unique state codes e.g. ['CA', 'TX']
    return [...new Set(allClinics.map(c => c.state))];
}

export function getClinicsByState(stateCode: string): Clinic[] {
    return allClinics.filter(c => c.state === stateCode.toUpperCase());
}

export function getClinicsByCity(stateCode: string, cityName: string): Clinic[] {
    return allClinics.filter(c =>
        c.state === stateCode.toUpperCase() &&
        c.city.toLowerCase() === cityName.toLowerCase()
    );
}

// Keeping the existing helpers for slug compatibility while moving forward
export { STATE_NAMES, getStateSlug, getStateCodeFromSlug } from './clinicData';
