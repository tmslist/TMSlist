import clinicsData from '../data/clinics.json';
import { type Clinic, ClinicMachine } from '../types/clinic';

// Cast the JSON import to our strict type
const allClinics = clinicsData as unknown as Clinic[];

export const STATE_NAMES: Record<string, string> = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'DC': 'District of Columbia'
};


export function getAllClinics(): Clinic[] {
    return allClinics;
}

export function getClinicsByState(stateCode: string): Clinic[] {
    return allClinics.filter(c => c.state === stateCode.toUpperCase());
}

export function getClinicsByMachine(machine: ClinicMachine): Clinic[] {
    return allClinics.filter(c => c.machines.includes(machine));
}

export function getClinicBySlug(slug: string): Clinic | undefined {
    return allClinics.find(c => c.slug === slug);
}

// Helper to get slug from state code for URL generation
export function getStateSlug(stateCode: string): string {
    const name = STATE_NAMES[stateCode.toUpperCase()];
    return name ? name.toLowerCase().replace(/\s+/g, '-') : stateCode.toLowerCase();
}

// Helper to get state code from slug
export function getStateCodeFromSlug(slug: string): string | undefined {
    return Object.keys(STATE_NAMES).find(code => getStateSlug(code) === slug);
}
