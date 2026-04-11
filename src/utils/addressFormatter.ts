const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC',
};

export function normalizeState(input: string): string {
  const lower = input.trim().toLowerCase();
  if (lower.length === 2) return lower.toUpperCase();
  return STATE_MAP[lower] || input.trim().toUpperCase();
}

export function normalizeCity(city: string): string {
  return city.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function normalizeZip(zip: string): string {
  const match = zip.match(/(\d{5})/);
  return match ? match[1] : zip.trim();
}

export function formatFullAddress(clinic: { address?: string; city: string; state: string; zip?: string; country?: string }): string {
  const parts = [];
  if (clinic.address) parts.push(clinic.address);
  parts.push(`${normalizeCity(clinic.city)}, ${normalizeState(clinic.state)}`);
  if (clinic.zip) parts.push(normalizeZip(clinic.zip));
  if (clinic.country && clinic.country !== 'US') parts.push(clinic.country);
  return parts.join(', ');
}
