/**
 * Seed countries and regions for international expansion.
 * Usage: DATABASE_URL=... npx tsx scripts/seed-international.ts
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { countries, regions } from '../src/db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', phonePrefix: '+1', locale: 'en', enabled: true, sortOrder: 1 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', phonePrefix: '+44', locale: 'en', enabled: false, sortOrder: 2 },
  { code: 'CA', name: 'Canada', currency: 'CAD', phonePrefix: '+1', locale: 'en', enabled: false, sortOrder: 3 },
  { code: 'AU', name: 'Australia', currency: 'AUD', phonePrefix: '+61', locale: 'en', enabled: false, sortOrder: 4 },
  { code: 'DE', name: 'Germany', currency: 'EUR', phonePrefix: '+49', locale: 'de', enabled: false, sortOrder: 5 },
  { code: 'FR', name: 'France', currency: 'EUR', phonePrefix: '+33', locale: 'fr', enabled: false, sortOrder: 6 },
  { code: 'ES', name: 'Spain', currency: 'EUR', phonePrefix: '+34', locale: 'es', enabled: false, sortOrder: 7 },
  { code: 'IT', name: 'Italy', currency: 'EUR', phonePrefix: '+39', locale: 'it', enabled: false, sortOrder: 8 },
  { code: 'JP', name: 'Japan', currency: 'JPY', phonePrefix: '+81', locale: 'ja', enabled: false, sortOrder: 9 },
  { code: 'BR', name: 'Brazil', currency: 'BRL', phonePrefix: '+55', locale: 'pt', enabled: false, sortOrder: 10 },
  { code: 'IN', name: 'India', currency: 'INR', phonePrefix: '+91', locale: 'en', enabled: false, sortOrder: 11 },
  { code: 'MX', name: 'Mexico', currency: 'MXN', phonePrefix: '+52', locale: 'es', enabled: false, sortOrder: 12 },
  { code: 'KR', name: 'South Korea', currency: 'KRW', phonePrefix: '+82', locale: 'ko', enabled: false, sortOrder: 13 },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', phonePrefix: '+31', locale: 'nl', enabled: false, sortOrder: 14 },
  { code: 'SE', name: 'Sweden', currency: 'SEK', phonePrefix: '+46', locale: 'sv', enabled: false, sortOrder: 15 },
];

// US states as regions
const US_STATES: [string, string][] = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
  ['DC','District of Columbia'],
];

// UK regions
const UK_REGIONS: [string, string][] = [
  ['ENG','England'],['SCT','Scotland'],['WLS','Wales'],['NIR','Northern Ireland'],
  ['LDN','London'],['SE','South East'],['SW','South West'],['WM','West Midlands'],
  ['EM','East Midlands'],['EE','East of England'],['NW','North West'],['NE','North East'],
  ['YH','Yorkshire and the Humber'],
];

// Canadian provinces
const CA_PROVINCES: [string, string][] = [
  ['ON','Ontario'],['QC','Quebec'],['BC','British Columbia'],['AB','Alberta'],
  ['MB','Manitoba'],['SK','Saskatchewan'],['NS','Nova Scotia'],['NB','New Brunswick'],
  ['NL','Newfoundland and Labrador'],['PE','Prince Edward Island'],['NT','Northwest Territories'],
  ['YT','Yukon'],['NU','Nunavut'],
];

// Australian states
const AU_STATES: [string, string][] = [
  ['NSW','New South Wales'],['VIC','Victoria'],['QLD','Queensland'],['WA','Western Australia'],
  ['SA','South Australia'],['TAS','Tasmania'],['ACT','Australian Capital Territory'],['NT','Northern Territory'],
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  console.log('Seeding countries...');
  await db.insert(countries).values(COUNTRIES).onConflictDoNothing();
  console.log(`✓ ${COUNTRIES.length} countries`);

  const allRegions: { countryCode: string; code: string; name: string; slug: string }[] = [];

  for (const [code, name] of US_STATES) {
    allRegions.push({ countryCode: 'US', code, name, slug: slugify(name) });
  }
  for (const [code, name] of UK_REGIONS) {
    allRegions.push({ countryCode: 'GB', code, name, slug: slugify(name) });
  }
  for (const [code, name] of CA_PROVINCES) {
    allRegions.push({ countryCode: 'CA', code, name, slug: slugify(name) });
  }
  for (const [code, name] of AU_STATES) {
    allRegions.push({ countryCode: 'AU', code, name, slug: slugify(name) });
  }

  console.log('Seeding regions...');
  const BATCH = 50;
  for (let i = 0; i < allRegions.length; i += BATCH) {
    await db.insert(regions).values(allRegions.slice(i, i + BATCH)).onConflictDoNothing();
  }
  console.log(`✓ ${allRegions.length} regions`);

  console.log('\n✅ International seed complete!');
}

main().catch(console.error);
