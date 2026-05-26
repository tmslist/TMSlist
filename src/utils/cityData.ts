/**
 * Static city master list — top 100+ US metros for comprehensive keyword targeting.
 * Used to generate pages for cities even if they have zero listed clinics in the DB.
 * Maps city names → { stateCode, stateSlug, citySlug, metro } for routing.
 */

import { getStateSlug } from './dataHelpers';

export interface CityEntry {
  city: string;       // Display name: "Los Angeles"
  citySlug: string;  // URL slug: "los-angeles"
  stateCode: string; // Two-letter: "CA"
  stateName: string; // Full name: "California"
  stateSlug: string; // URL slug: "california"
  metro: string;     // Metro area: "Los Angeles Metro"
  tier: 'top50' | 'secondary';
}

// Top 50 US metros + key secondary markets (alphabetical by slug for easy lookup)
const CITY_LIST: Omit<CityEntry, 'stateSlug'>[] = [
  // California
  { city: 'Los Angeles', citySlug: 'los-angeles', stateCode: 'CA', stateName: 'California', tier: 'top50' },
  { city: 'San Francisco', citySlug: 'san-francisco', stateCode: 'CA', stateName: 'California', tier: 'top50' },
  { city: 'San Diego', citySlug: 'san-diego', stateCode: 'CA', stateName: 'California', tier: 'top50' },
  { city: 'San Jose', citySlug: 'san-jose', stateCode: 'CA', stateName: 'California', tier: 'top50' },
  { city: 'Fresno', citySlug: 'fresno', stateCode: 'CA', stateName: 'California', tier: 'secondary' },
  { city: 'Sacramento', citySlug: 'sacramento', stateCode: 'CA', stateName: 'California', tier: 'top50' },
  { city: 'Oakland', citySlug: 'oakland', stateCode: 'CA', stateName: 'California', tier: 'secondary' },
  { city: 'Bakersfield', citySlug: 'bakersfield', stateCode: 'CA', stateName: 'California', tier: 'secondary' },
  // Texas
  { city: 'Houston', citySlug: 'houston', stateCode: 'TX', stateName: 'Texas', tier: 'top50' },
  { city: 'San Antonio', citySlug: 'san-antonio', stateCode: 'TX', stateName: 'Texas', tier: 'top50' },
  { city: 'Dallas', citySlug: 'dallas', stateCode: 'TX', stateName: 'Texas', tier: 'top50' },
  { city: 'Austin', citySlug: 'austin', stateCode: 'TX', stateName: 'Texas', tier: 'top50' },
  { city: 'Fort Worth', citySlug: 'fort-worth', stateCode: 'TX', stateName: 'Texas', tier: 'top50' },
  { city: 'El Paso', citySlug: 'el-paso', stateCode: 'TX', stateName: 'Texas', tier: 'secondary' },
  { city: 'Arlington', citySlug: 'arlington', stateCode: 'TX', stateName: 'Texas', tier: 'secondary' },
  { city: 'Corpus Christi', citySlug: 'corpus-christi', stateCode: 'TX', stateName: 'Texas', tier: 'secondary' },
  // Florida
  { city: 'Jacksonville', citySlug: 'jacksonville', stateCode: 'FL', stateName: 'Florida', tier: 'top50' },
  { city: 'Miami', citySlug: 'miami', stateCode: 'FL', stateName: 'Florida', tier: 'top50' },
  { city: 'Tampa', citySlug: 'tampa', stateCode: 'FL', stateName: 'Florida', tier: 'top50' },
  { city: 'Orlando', citySlug: 'orlando', stateCode: 'FL', stateName: 'Florida', tier: 'top50' },
  { city: 'St. Petersburg', citySlug: 'st-petersburg', stateCode: 'FL', stateName: 'Florida', tier: 'secondary' },
  // New York
  { city: 'New York City', citySlug: 'new-york', stateCode: 'NY', stateName: 'New York', tier: 'top50' },
  { city: 'Brooklyn', citySlug: 'brooklyn', stateCode: 'NY', stateName: 'New York', tier: 'top50' },
  { city: 'Queens', citySlug: 'queens', stateCode: 'NY', stateName: 'New York', tier: 'secondary' },
  { city: 'Buffalo', citySlug: 'buffalo', stateCode: 'NY', stateName: 'New York', tier: 'secondary' },
  { city: 'Rochester', citySlug: 'rochester', stateCode: 'NY', stateName: 'New York', tier: 'secondary' },
  // Illinois
  { city: 'Chicago', citySlug: 'chicago', stateCode: 'IL', stateName: 'Illinois', tier: 'top50' },
  { city: 'Aurora', citySlug: 'aurora', stateCode: 'IL', stateName: 'Illinois', tier: 'secondary' },
  { city: 'Naperville', citySlug: 'naperville', stateCode: 'IL', stateName: 'Illinois', tier: 'secondary' },
  // Pennsylvania
  { city: 'Philadelphia', citySlug: 'philadelphia', stateCode: 'PA', stateName: 'Pennsylvania', tier: 'top50' },
  { city: 'Pittsburgh', citySlug: 'pittsburgh', stateCode: 'PA', stateName: 'Pennsylvania', tier: 'top50' },
  // Ohio
  { city: 'Columbus', citySlug: 'columbus', stateCode: 'OH', stateName: 'Ohio', tier: 'top50' },
  { city: 'Cleveland', citySlug: 'cleveland', stateCode: 'OH', stateName: 'Ohio', tier: 'top50' },
  { city: 'Cincinnati', citySlug: 'cincinnati', stateCode: 'OH', stateName: 'Ohio', tier: 'top50' },
  { city: 'Toledo', citySlug: 'toledo', stateCode: 'OH', stateName: 'Ohio', tier: 'secondary' },
  // Georgia
  { city: 'Atlanta', citySlug: 'atlanta', stateCode: 'GA', stateName: 'Georgia', tier: 'top50' },
  { city: 'Augusta', citySlug: 'augusta', stateCode: 'GA', stateName: 'Georgia', tier: 'secondary' },
  // North Carolina
  { city: 'Charlotte', citySlug: 'charlotte', stateCode: 'NC', stateName: 'North Carolina', tier: 'top50' },
  { city: 'Raleigh', citySlug: 'raleigh', stateCode: 'NC', stateName: 'North Carolina', tier: 'top50' },
  { city: 'Durham', citySlug: 'durham', stateCode: 'NC', stateName: 'North Carolina', tier: 'top50' },
  // Michigan
  { city: 'Detroit', citySlug: 'detroit', stateCode: 'MI', stateName: 'Michigan', tier: 'top50' },
  { city: 'Grand Rapids', citySlug: 'grand-rapids', stateCode: 'MI', stateName: 'Michigan', tier: 'secondary' },
  // Washington
  { city: 'Seattle', citySlug: 'seattle', stateCode: 'WA', stateName: 'Washington', tier: 'top50' },
  { city: 'Tacoma', citySlug: 'tacoma', stateCode: 'WA', stateName: 'Washington', tier: 'secondary' },
  // Arizona
  { city: 'Phoenix', citySlug: 'phoenix', stateCode: 'AZ', stateName: 'Arizona', tier: 'top50' },
  { city: 'Tucson', citySlug: 'tucson', stateCode: 'AZ', stateName: 'Arizona', tier: 'secondary' },
  { city: 'Mesa', citySlug: 'mesa', stateCode: 'AZ', stateName: 'Arizona', tier: 'secondary' },
  // Colorado
  { city: 'Denver', citySlug: 'denver', stateCode: 'CO', stateName: 'Colorado', tier: 'top50' },
  { city: 'Colorado Springs', citySlug: 'colorado-springs', stateCode: 'CO', stateName: 'Colorado', tier: 'secondary' },
  // Massachusetts
  { city: 'Boston', citySlug: 'boston', stateCode: 'MA', stateName: 'Massachusetts', tier: 'top50' },
  { city: 'Worcester', citySlug: 'worcester', stateCode: 'MA', stateName: 'Massachusetts', tier: 'secondary' },
  // Tennessee
  { city: 'Nashville', citySlug: 'nashville', stateCode: 'TN', stateName: 'Tennessee', tier: 'top50' },
  { city: 'Memphis', citySlug: 'memphis', stateCode: 'TN', stateName: 'Tennessee', tier: 'top50' },
  { city: 'Knoxville', citySlug: 'knoxville', stateCode: 'TN', stateName: 'Tennessee', tier: 'secondary' },
  // Indiana
  { city: 'Indianapolis', citySlug: 'indianapolis', stateCode: 'IN', stateName: 'Indiana', tier: 'top50' },
  // Missouri
  { city: 'St. Louis', citySlug: 'st-louis', stateCode: 'MO', stateName: 'Missouri', tier: 'top50' },
  { city: 'Kansas City', citySlug: 'kansas-city', stateCode: 'MO', stateName: 'Missouri', tier: 'top50' },
  // Maryland
  { city: 'Baltimore', citySlug: 'baltimore', stateCode: 'MD', stateName: 'Maryland', tier: 'top50' },
  // Wisconsin
  { city: 'Milwaukee', citySlug: 'milwaukee', stateCode: 'WI', stateName: 'Wisconsin', tier: 'top50' },
  // Nevada
  { city: 'Las Vegas', citySlug: 'las-vegas', stateCode: 'NV', stateName: 'Nevada', tier: 'top50' },
  { city: 'Reno', citySlug: 'reno', stateCode: 'NV', stateName: 'Nevada', tier: 'secondary' },
  // Oregon
  { city: 'Portland', citySlug: 'portland', stateCode: 'OR', stateName: 'Oregon', tier: 'top50' },
  // Oklahoma
  { city: 'Oklahoma City', citySlug: 'oklahoma-city', stateCode: 'OK', stateName: 'Oklahoma', tier: 'secondary' },
  { city: 'Tulsa', citySlug: 'tulsa', stateCode: 'OK', stateName: 'Oklahoma', tier: 'secondary' },
  // Connecticut
  { city: 'Hartford', citySlug: 'hartford', stateCode: 'CT', stateName: 'Connecticut', tier: 'secondary' },
  // Iowa
  { city: 'Des Moines', citySlug: 'des-moines', stateCode: 'IA', stateName: 'Iowa', tier: 'secondary' },
  // Minnesota
  { city: 'Minneapolis', citySlug: 'minneapolis', stateCode: 'MN', stateName: 'Minnesota', tier: 'top50' },
  { city: 'St. Paul', citySlug: 'st-paul', stateCode: 'MN', stateName: 'Minnesota', tier: 'secondary' },
  // Kentucky
  { city: 'Louisville', citySlug: 'louisville', stateCode: 'KY', stateName: 'Kentucky', tier: 'secondary' },
  { city: 'Lexington', citySlug: 'lexington', stateCode: 'KY', stateName: 'Kentucky', tier: 'secondary' },
  // Louisiana
  { city: 'New Orleans', citySlug: 'new-orleans', stateCode: 'LA', stateName: 'Louisiana', tier: 'secondary' },
  { city: 'Baton Rouge', citySlug: 'baton-rouge', stateCode: 'LA', stateName: 'Louisiana', tier: 'secondary' },
  // Alabama
  { city: 'Birmingham', citySlug: 'birmingham', stateCode: 'AL', stateName: 'Alabama', tier: 'secondary' },
  { city: 'Mobile', citySlug: 'mobile', stateCode: 'AL', stateName: 'Alabama', tier: 'secondary' },
  // South Carolina
  { city: 'Charleston', citySlug: 'charleston', stateCode: 'SC', stateName: 'South Carolina', tier: 'secondary' },
  { city: 'Columbia', citySlug: 'columbia', stateCode: 'SC', stateName: 'South Carolina', tier: 'secondary' },
  // Utah
  { city: 'Salt Lake City', citySlug: 'salt-lake-city', stateCode: 'UT', stateName: 'Utah', tier: 'secondary' },
  { city: 'Provo', citySlug: 'provo', stateCode: 'UT', stateName: 'Utah', tier: 'secondary' },
  // Virginia
  { city: 'Virginia Beach', citySlug: 'virginia-beach', stateCode: 'VA', stateName: 'Virginia', tier: 'top50' },
  { city: 'Richmond', citySlug: 'richmond', stateCode: 'VA', stateName: 'Virginia', tier: 'secondary' },
  // New Jersey
  { city: 'Newark', citySlug: 'newark', stateCode: 'NJ', stateName: 'New Jersey', tier: 'secondary' },
  { city: 'Jersey City', citySlug: 'jersey-city', stateCode: 'NJ', stateName: 'New Jersey', tier: 'secondary' },
  // Kansas
  { city: 'Wichita', citySlug: 'wichita', stateCode: 'KS', stateName: 'Kansas', tier: 'secondary' },
  // Nebraska
  { city: 'Omaha', citySlug: 'omaha', stateCode: 'NE', stateName: 'Nebraska', tier: 'secondary' },
  // Arkansas
  { city: 'Little Rock', citySlug: 'little-rock', stateCode: 'AR', stateName: 'Arkansas', tier: 'secondary' },
  // Mississippi
  { city: 'Jackson', citySlug: 'jackson', stateCode: 'MS', stateName: 'Mississippi', tier: 'secondary' },
  // New Mexico
  { city: 'Albuquerque', citySlug: 'albuquerque', stateCode: 'NM', stateName: 'New Mexico', tier: 'secondary' },
  // Hawaii
  { city: 'Honolulu', citySlug: 'honolulu', stateCode: 'HI', stateName: 'Hawaii', tier: 'secondary' },
  // Idaho
  { city: 'Boise', citySlug: 'boise', stateCode: 'ID', stateName: 'Idaho', tier: 'secondary' },
  // Montana
  { city: 'Billings', citySlug: 'billings', stateCode: 'MT', stateName: 'Montana', tier: 'secondary' },
  // Wyoming
  { city: 'Cheyenne', citySlug: 'cheyenne', stateCode: 'WY', stateName: 'Wyoming', tier: 'secondary' },
  // West Virginia
  { city: 'Charleston', citySlug: 'charleston-wv', stateCode: 'WV', stateName: 'West Virginia', tier: 'secondary' },
  // Alaska
  { city: 'Anchorage', citySlug: 'anchorage', stateCode: 'AK', stateName: 'Alaska', tier: 'secondary' },
  // Delaware
  { city: 'Wilmington', citySlug: 'wilmington', stateCode: 'DE', stateName: 'Delaware', tier: 'secondary' },
  // District of Columbia
  { city: 'Washington', citySlug: 'washington-dc', stateCode: 'DC', stateName: 'District of Columbia', tier: 'top50' },
  // Rhode Island
  { city: 'Providence', citySlug: 'providence', stateCode: 'RI', stateName: 'Rhode Island', tier: 'secondary' },
  // Vermont
  { city: 'Burlington', citySlug: 'burlington', stateCode: 'VT', stateName: 'Vermont', tier: 'secondary' },
  // New Hampshire
  { city: 'Manchester', citySlug: 'manchester', stateCode: 'NH', stateName: 'New Hampshire', tier: 'secondary' },
  // Maine
  { city: 'Portland', citySlug: 'portland-me', stateCode: 'ME', stateName: 'Maine', tier: 'secondary' },
];

// Build full entries with stateSlug
export const TARGET_CITIES: CityEntry[] = CITY_LIST.map(c => ({
  ...c,
  stateSlug: getStateSlug(c.stateCode),
}));

// Lookup helpers
export function getCityBySlug(citySlug: string): CityEntry | undefined {
  return TARGET_CITIES.find(c => c.citySlug === citySlug);
}

export function getCitiesByState(stateCode: string): CityEntry[] {
  return TARGET_CITIES.filter(c => c.stateCode === stateCode);
}

export function getTop50Cities(): CityEntry[] {
  return TARGET_CITIES.filter(c => c.tier === 'top50');
}

export const PROVIDER_TYPES = [
  { slug: 'psychiatrists', label: 'Psychiatrists', singular: 'Psychiatrist', description: 'Board-certified psychiatrists specializing in TMS therapy', schemaType: 'Psychiatrist' },
  { slug: 'psychologists', label: 'Psychologists', singular: 'Psychologist', description: 'Licensed clinical psychologists with TMS training', schemaType: 'Psychologist' },
  { slug: 'therapists', label: 'Therapists', singular: 'Therapist', description: 'Licensed therapists and counselors for TMS support', schemaType: 'Therapist' },
] as const;

export type ProviderTypeSlug = 'psychiatrists' | 'psychologists' | 'therapists';