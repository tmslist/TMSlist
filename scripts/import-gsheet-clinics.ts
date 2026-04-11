/**
 * Import clinics from Google Sheets CSV export into clinics.json
 *
 * Source: Google Maps/Places data with 17K+ rows (10K unique by place_id)
 * Deduplicates by place_id, then by name+address against existing clinics.json
 * Maps Google Maps fields to our canonical clinic schema.
 *
 * Usage: npx tsx scripts/import-gsheet-clinics.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, 'data/gsheet-clinics-raw.csv');
const CLINICS_PATH = path.resolve(__dirname, '../src/data/clinics.json');

// ── Helpers ──────────────────────────────────

function generateSlug(name: string, city: string, state: string): string {
  return `${name}-${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function normalizeProviderType(subtypes: string, category: string): string | null {
  const combined = `${subtypes} ${category}`.toLowerCase();
  if (combined.includes('tms') || combined.includes('transcranial')) return 'Dedicated TMS Center';
  if (combined.includes('psychiatri')) return 'Psychiatrist (MD/DO)';
  if (combined.includes('neurolog')) return 'Neurologist';
  if (combined.includes('hospital') || combined.includes('medical center')) return 'Hospital / Medical Center';
  if (combined.includes('mental health')) return 'Mental Health Clinic';
  if (combined.includes('primary care') || combined.includes('family')) return 'Primary Care / Family Practice';
  if (combined.includes('nurse practitioner')) return 'Psychiatric Nurse Practitioner';
  return null;
}

function parseWorkingHours(hoursStr: string): string[] {
  if (!hoursStr) return [];
  try {
    // Format: {"Monday": "9 AM-5 PM", ...} or CSV-compatible format
    const parsed = JSON.parse(hoursStr.replace(/'/g, '"'));
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([day, hours]) => `${day}: ${hours}`);
    }
  } catch {
    // Try CSV-compatible format: "Monday: 9AM-5PM | Tuesday: ..."
    if (hoursStr.includes('|')) {
      return hoursStr.split('|').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function cleanPhone(phone: string): string | null {
  if (!phone) return null;
  // Keep the formatted phone number
  return phone.trim() || null;
}

function cleanUrl(url: string): string | null {
  if (!url) return null;
  let cleaned = url.trim();
  if (cleaned && !cleaned.startsWith('http')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned || null;
}

// ── Main Import ──────────────────────────────────

// Simple CSV parser that handles quoted fields with commas/newlines
function parseCSV(content: string): Record<string, string>[] {
  const results: Record<string, string>[] = [];
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip carriage returns
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length === 0) return [];

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        fields.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field);
    return fields;
  };

  const headers = parseRow(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    results.push(row);
  }
  return results;
}

function main() {
  console.log('📥 Loading CSV data...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`  Raw rows: ${rows.length}`);

  // Step 1: Dedup by place_id
  const byPlaceId = new Map<string, Record<string, string>>();
  for (const row of rows) {
    const pid = row.place_id;
    if (pid && !byPlaceId.has(pid)) {
      byPlaceId.set(pid, row);
    }
  }
  const deduped = Array.from(byPlaceId.values());
  console.log(`  After place_id dedup: ${deduped.length}`);

  // Step 2: Load existing clinics
  const existing: Record<string, any>[] = JSON.parse(fs.readFileSync(CLINICS_PATH, 'utf-8'));
  const existingSlugs = new Set(existing.map(c => c.slug));
  const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));
  const existingAddresses = new Set(
    existing
      .filter(c => c.address && c.city)
      .map(c => `${c.address.toLowerCase().trim()}|${c.city.toLowerCase().trim()}`)
  );
  console.log(`  Existing clinics: ${existing.length}`);

  // Step 3: Filter to valid, non-duplicate entries
  const newClinics: Record<string, any>[] = [];
  let skippedDuplicate = 0;
  let skippedNoData = 0;

  for (const row of deduped) {
    const name = row.name?.trim();
    const city = row.city?.trim();
    const stateCode = row.state_code?.trim();

    // Must have basic info
    if (!name || !city || !stateCode) {
      skippedNoData++;
      continue;
    }

    // Skip if business is closed
    if (row.business_status && row.business_status !== 'OPERATIONAL') {
      skippedNoData++;
      continue;
    }

    // Check for duplicates
    const nameLower = name.toLowerCase();
    const streetLower = (row.street || '').toLowerCase().trim();
    const cityLower = city.toLowerCase();

    if (existingNames.has(nameLower)) {
      skippedDuplicate++;
      continue;
    }
    if (streetLower && `${streetLower}|${cityLower}` in existingAddresses) {
      skippedDuplicate++;
      continue;
    }

    // Generate unique slug
    let slug = generateSlug(name, city, stateCode);
    let slugSuffix = 0;
    while (existingSlugs.has(slug)) {
      slugSuffix++;
      slug = generateSlug(name, city, stateCode) + `-${slugSuffix}`;
    }
    existingSlugs.add(slug);
    existingNames.add(nameLower);

    // Parse rating
    const ratingNum = parseFloat(row.rating) || 0;
    const reviewCount = parseInt(row.reviews) || 0;

    // Parse working hours
    let openingHours = parseWorkingHours(row.working_hours || '');
    if (!openingHours.length && row.working_hours_csv_compatible) {
      openingHours = parseWorkingHours(row.working_hours_csv_compatible);
    }

    // Build clinic object in canonical schema
    const clinic: Record<string, any> = {
      id: `gsheet-${slug}`,
      name,
      slug,
      description: row.description || row.about || null,
      description_long: null,
      provider_type: normalizeProviderType(row.subtypes || '', row.category || ''),
      address: row.street || row.address || null,
      city,
      state: row.state || stateCode,
      zip: row.postal_code || null,
      country: 'US',
      geo: {
        lat: parseFloat(row.latitude) || null,
        lng: parseFloat(row.longitude) || null,
      },
      phone: cleanPhone(row.phone || row.company_phone || ''),
      website: cleanUrl(row.website || ''),
      email: row.email || null,
      machines: [],
      specialties: row.subtypes ? row.subtypes.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      insurances: [],
      opening_hours: openingHours,
      rating: {
        aggregate: ratingNum,
        count: reviewCount,
        sentiment_summary: '',
      },
      verified: row.verified === 'True' || row.verified === 'true',
      is_featured: false,
      doctors_data: [],
      hero_image_url: row.photo || null,
      logo_url: row.logo || null,
      gallery_urls: [],
      media: null,
      accessibility: null,
      availability: null,
      pricing: null,
      google_business_profile: {
        place_id: row.place_id || null,
        reviews_url: row.reviews_link || null,
      },
      faqs: [],
      created_by: null,
    };

    // Add contact person if available
    if (row.full_name && row.full_name.trim()) {
      const doctor: Record<string, any> = {
        name: row.full_name.trim(),
        first_name: row.first_name?.trim() || null,
        last_name: row.last_name?.trim() || null,
        slug: generateSlug(row.full_name.trim(), city, stateCode),
        credential: row.title?.trim() || null,
        title: row.title?.trim() || null,
        bio: null,
        image_url: null,
        specialties: [],
      };
      clinic.doctors_data = [doctor];
    }

    // Add social media to description if no description
    const socials: string[] = [];
    if (row.company_linkedin) socials.push(row.company_linkedin);
    if (row.company_facebook) socials.push(row.company_facebook);
    if (row.company_instagram) socials.push(row.company_instagram);

    newClinics.push(clinic);
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`  New clinics to add: ${newClinics.length}`);
  console.log(`  Skipped (duplicate): ${skippedDuplicate}`);
  console.log(`  Skipped (missing data): ${skippedNoData}`);

  // Step 4: Merge and write
  const merged = [...existing, ...newClinics];
  console.log(`  Total after merge: ${merged.length}`);

  fs.writeFileSync(CLINICS_PATH, JSON.stringify(merged, null, 2));
  console.log(`\n✅ Written to ${CLINICS_PATH}`);

  // Stats on new data quality
  const withPhone = newClinics.filter(c => c.phone).length;
  const withWebsite = newClinics.filter(c => c.website).length;
  const withRating = newClinics.filter(c => c.rating.aggregate > 0).length;
  const withGeo = newClinics.filter(c => c.geo.lat && c.geo.lng).length;
  const withDoctors = newClinics.filter(c => c.doctors_data.length > 0).length;
  const withEmail = newClinics.filter(c => c.email).length;
  const withHours = newClinics.filter(c => c.opening_hours.length > 0).length;
  const withPhoto = newClinics.filter(c => c.hero_image_url).length;

  console.log(`\n📈 New Clinic Data Coverage:`);
  console.log(`  Phone:    ${withPhone}/${newClinics.length} (${Math.round(withPhone/newClinics.length*100)}%)`);
  console.log(`  Website:  ${withWebsite}/${newClinics.length} (${Math.round(withWebsite/newClinics.length*100)}%)`);
  console.log(`  Rating:   ${withRating}/${newClinics.length} (${Math.round(withRating/newClinics.length*100)}%)`);
  console.log(`  Geo:      ${withGeo}/${newClinics.length} (${Math.round(withGeo/newClinics.length*100)}%)`);
  console.log(`  Email:    ${withEmail}/${newClinics.length} (${Math.round(withEmail/newClinics.length*100)}%)`);
  console.log(`  Doctors:  ${withDoctors}/${newClinics.length} (${Math.round(withDoctors/newClinics.length*100)}%)`);
  console.log(`  Hours:    ${withHours}/${newClinics.length} (${Math.round(withHours/newClinics.length*100)}%)`);
  console.log(`  Photo:    ${withPhoto}/${newClinics.length} (${Math.round(withPhoto/newClinics.length*100)}%)`);

  // State distribution
  const stateDist: Record<string, number> = {};
  for (const c of newClinics) {
    const st = c.state?.length === 2 ? c.state : 'OTHER';
    stateDist[st] = (stateDist[st] || 0) + 1;
  }
  console.log(`\n🗺️  State Coverage (top 15):`);
  const sorted = Object.entries(stateDist).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [st, count] of sorted) {
    console.log(`  ${st}: ${count}`);
  }
}

main();
