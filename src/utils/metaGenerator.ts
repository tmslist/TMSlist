export function clinicMetaTitle(clinic: { name: string; city: string; state: string }): string {
  return `${clinic.name} - TMS Therapy in ${clinic.city}, ${clinic.state} | TMS List`;
}

export function clinicMetaDescription(clinic: { name: string; city: string; state: string; ratingAvg?: string; reviewCount?: number; machines?: string[] }): string {
  const parts = [`Find TMS therapy at ${clinic.name} in ${clinic.city}, ${clinic.state}.`];
  if (Number(clinic.ratingAvg) > 0) parts.push(`Rated ${Number(clinic.ratingAvg).toFixed(1)}/5 from ${clinic.reviewCount} reviews.`);
  if (clinic.machines?.length) parts.push(`Equipment: ${clinic.machines.slice(0, 3).join(', ')}.`);
  parts.push('Book a consultation today.');
  return parts.join(' ').slice(0, 160);
}

export function stateMetaTitle(state: string, clinicCount: number): string {
  return `${clinicCount} TMS Clinics in ${state} - Find TMS Therapy Near You | TMS List`;
}

export function stateMetaDescription(state: string, clinicCount: number, topCities: string[]): string {
  return `Compare ${clinicCount} TMS therapy clinics in ${state}. Top cities: ${topCities.slice(0, 4).join(', ')}. Read reviews, compare prices, and book consultations.`.slice(0, 160);
}

export function cityMetaTitle(city: string, state: string, clinicCount: number): string {
  return `${clinicCount} TMS Clinics in ${city}, ${state} - Reviews & Pricing | TMS List`;
}

export function cityMetaDescription(city: string, state: string, clinicCount: number): string {
  return `Find the best TMS therapy clinic in ${city}, ${state}. Compare ${clinicCount} providers, read patient reviews, check insurance coverage, and book consultations.`.slice(0, 160);
}

export function doctorMetaTitle(doctor: { name: string; credential?: string; city?: string; state?: string }): string {
  const cred = doctor.credential ? `, ${doctor.credential}` : '';
  return `${doctor.name}${cred} - TMS Specialist${doctor.city ? ` in ${doctor.city}, ${doctor.state}` : ''} | TMS List`;
}

export function doctorMetaDescription(doctor: { name: string; bio?: string; specialties?: string[] }): string {
  if (doctor.bio) return doctor.bio.slice(0, 155) + (doctor.bio.length > 155 ? '...' : '');
  return `Learn about ${doctor.name}, a TMS therapy specialist. ${doctor.specialties?.length ? `Specialties: ${doctor.specialties.slice(0, 3).join(', ')}.` : ''} View credentials and book a consultation.`.slice(0, 160);
}

export function treatmentMetaTitle(name: string): string {
  return `TMS for ${name} - How It Works, Success Rates & Research | TMS List`;
}

export function treatmentMetaDescription(name: string, successRate?: string): string {
  return `Learn about TMS therapy for ${name}. ${successRate ? `Success rate: ${successRate}. ` : ''}Understand how it works, what to expect, FDA approval status, and find clinics near you.`.slice(0, 160);
}
