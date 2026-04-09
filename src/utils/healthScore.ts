/**
 * Clinic Health Score Algorithm
 *
 * Proprietary scoring system (0-100) rating clinics across 6 dimensions:
 * 1. Review Quality (25 pts) — avg rating + volume
 * 2. Profile Completeness (20 pts) — fields filled out
 * 3. Technology (15 pts) — number and quality of TMS devices
 * 4. Insurance Breadth (15 pts) — number of accepted insurances
 * 5. Responsiveness (15 pts) — lead response time, review replies
 * 6. Verification Status (10 pts) — verified + featured + subscription tier
 */

interface ClinicScoreInput {
  ratingAvg: number;
  reviewCount: number;
  verified: boolean;
  isFeatured: boolean;
  // Profile fields
  phone: string | null;
  website: string | null;
  email: string | null;
  description: string | null;
  descriptionLong: string | null;
  // Arrays
  machines: string[] | null;
  specialties: string[] | null;
  insurances: string[] | null;
  openingHours: string[] | null;
  // JSONB
  accessibility: Record<string, unknown> | null;
  availability: Record<string, unknown> | null;
  pricing: Record<string, unknown> | null;
  media: { hero_image_url?: string; gallery_urls?: string[] } | null;
  faqs: unknown[] | null;
  // Optional engagement data
  hasOwnerResponses?: boolean;
  subscriptionTier?: string | null;
}

export interface HealthScoreResult {
  total: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  breakdown: {
    reviewQuality: number;
    profileCompleteness: number;
    technology: number;
    insuranceBreadth: number;
    responsiveness: number;
    verification: number;
  };
  suggestions: string[];
}

export function calculateHealthScore(clinic: ClinicScoreInput): HealthScoreResult {
  const suggestions: string[] = [];

  // 1. Review Quality (0-25)
  let reviewQuality = 0;
  if (clinic.ratingAvg >= 4.5) reviewQuality += 15;
  else if (clinic.ratingAvg >= 4.0) reviewQuality += 12;
  else if (clinic.ratingAvg >= 3.5) reviewQuality += 8;
  else if (clinic.ratingAvg >= 3.0) reviewQuality += 5;
  else if (clinic.ratingAvg > 0) reviewQuality += 2;

  if (clinic.reviewCount >= 50) reviewQuality += 10;
  else if (clinic.reviewCount >= 20) reviewQuality += 8;
  else if (clinic.reviewCount >= 10) reviewQuality += 5;
  else if (clinic.reviewCount >= 3) reviewQuality += 3;
  else suggestions.push('Encourage patients to leave reviews to boost your score');

  // 2. Profile Completeness (0-20)
  let profileCompleteness = 0;
  const profileFields = [
    { field: clinic.phone, pts: 2, name: 'phone number' },
    { field: clinic.website, pts: 2, name: 'website' },
    { field: clinic.email, pts: 2, name: 'email' },
    { field: clinic.description, pts: 2, name: 'description' },
    { field: clinic.descriptionLong, pts: 2, name: 'detailed description' },
    { field: clinic.openingHours?.length, pts: 2, name: 'opening hours' },
    { field: clinic.media?.hero_image_url, pts: 2, name: 'profile photo' },
    { field: clinic.accessibility && Object.keys(clinic.accessibility).length > 0, pts: 2, name: 'accessibility info' },
    { field: clinic.availability && Object.keys(clinic.availability).length > 0, pts: 2, name: 'availability info' },
    { field: clinic.pricing && Object.keys(clinic.pricing).length > 0, pts: 2, name: 'pricing info' },
  ];

  for (const { field, pts, name } of profileFields) {
    if (field) profileCompleteness += pts;
    else suggestions.push(`Add ${name} to improve your profile`);
  }
  profileCompleteness = Math.min(profileCompleteness, 20);

  // 3. Technology (0-15)
  let technology = 0;
  const machineCount = clinic.machines?.length || 0;
  if (machineCount >= 3) technology = 15;
  else if (machineCount >= 2) technology = 12;
  else if (machineCount >= 1) technology = 8;
  else suggestions.push('List your TMS devices to showcase your technology');

  // Bonus for premium devices
  const premiumDevices = ['NeuroStar', 'BrainsWay', 'MagVenture'];
  const hasPremium = clinic.machines?.some(m => premiumDevices.some(p => m.includes(p)));
  if (hasPremium && technology < 15) technology = Math.min(technology + 3, 15);

  // 4. Insurance Breadth (0-15)
  let insuranceBreadth = 0;
  const insCount = clinic.insurances?.length || 0;
  if (insCount >= 10) insuranceBreadth = 15;
  else if (insCount >= 7) insuranceBreadth = 12;
  else if (insCount >= 4) insuranceBreadth = 9;
  else if (insCount >= 2) insuranceBreadth = 5;
  else if (insCount >= 1) insuranceBreadth = 3;
  else suggestions.push('Add accepted insurance providers to attract more patients');

  // 5. Responsiveness (0-15)
  let responsiveness = 5; // Base score
  if (clinic.hasOwnerResponses) responsiveness += 5;
  else suggestions.push('Respond to patient reviews to show you care');
  if (clinic.faqs && clinic.faqs.length >= 3) responsiveness += 5;
  else suggestions.push('Add FAQs to help patients find answers quickly');

  // 6. Verification (0-10)
  let verification = 0;
  if (clinic.verified) verification += 5;
  else suggestions.push('Verify your clinic to earn a trust badge');
  if (clinic.isFeatured) verification += 3;
  if (clinic.subscriptionTier === 'premium' || clinic.subscriptionTier === 'enterprise') verification += 2;
  else if (clinic.subscriptionTier === 'pro') verification += 1;

  const total = Math.min(reviewQuality + profileCompleteness + technology + insuranceBreadth + responsiveness + verification, 100);

  let grade: HealthScoreResult['grade'];
  if (total >= 90) grade = 'A+';
  else if (total >= 80) grade = 'A';
  else if (total >= 70) grade = 'B+';
  else if (total >= 60) grade = 'B';
  else if (total >= 50) grade = 'C+';
  else if (total >= 40) grade = 'C';
  else if (total >= 25) grade = 'D';
  else grade = 'F';

  return {
    total,
    grade,
    breakdown: {
      reviewQuality,
      profileCompleteness,
      technology,
      insuranceBreadth,
      responsiveness,
      verification,
    },
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
  };
}

/**
 * Get the color for a health score grade.
 */
export function getGradeColor(grade: HealthScoreResult['grade']): string {
  switch (grade) {
    case 'A+': case 'A': return '#059669'; // emerald
    case 'B+': case 'B': return '#2563eb'; // blue
    case 'C+': case 'C': return '#d97706'; // amber
    case 'D': case 'F': return '#dc2626'; // red
  }
}
