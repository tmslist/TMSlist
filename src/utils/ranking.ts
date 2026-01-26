import type { Clinic } from '../types/clinic';

export function calculateClinicScore(clinic: Clinic): number {
    let score = 0;

    // 1. Verification Bonus (Most Important)
    if (clinic.verified) score += 50;

    // 2. Data Completeness
    if (clinic.machines && clinic.machines.length > 0) score += 10;
    if (clinic.insurances && clinic.insurances.length > 0) score += 10;
    if (clinic.hero_image_url) score += 5;

    // 3. Social Proof
    if (clinic.rating) {
        score += (clinic.rating * 5); // 5.0 rating = +25 points
    }
    if (clinic.review_count > 20) score += 10;

    return score;
}
