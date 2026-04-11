/**
 * Contact Info Enrichment
 *
 * Attempts to find website URLs for clinics missing contact info
 * by trying common URL patterns based on clinic name.
 *
 * Usage: npx tsx scripts/enrich-contacts.ts
 * Options:
 *   --dry-run    Preview without writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLINICS_PATH = path.join(__dirname, '..', 'src', 'data', 'clinics.json');

function slugifyForUrl(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function slugifyDashed(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Extract core clinic name (remove common suffixes)
function coreName(name: string): string {
  return name
    .replace(/\s*(TMS|Therapy|Center|Clinic|Treatment|Mental Health|Depression|LLC|Inc|PLLC|MD|Practice|Private)\s*/gi, ' ')
    .replace(/\s*(Dr\.?\s+\w+)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function extractPhoneFromWebsite(websiteUrl: string): Promise<string | null> {
  try {
    const response = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const html = await response.text();

    // Look for tel: links
    const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
    if (telMatch?.[1]) {
      const phone = telMatch[1].replace(/[^\d+()-\s]/g, '').trim();
      if (phone.length >= 10) return phone;
    }

    // Look for phone patterns in text
    const phonePattern = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneMatches = html.match(phonePattern);
    if (phoneMatches && phoneMatches.length > 0) {
      // Return the first valid-looking phone
      return phoneMatches[0].trim();
    }

    return null;
  } catch {
    return null;
  }
}

interface Clinic {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  contact?: {
    phone?: string;
    website_url?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('=== Contact Info Enrichment Pipeline ===\n');
  if (dryRun) console.log('DRY RUN\n');

  const rawData = fs.readFileSync(CLINICS_PATH, 'utf-8');
  const clinics: Clinic[] = JSON.parse(rawData);

  const targetClinics = clinics.filter(c =>
    !c.contact?.website_url || c.contact.website_url.trim() === '' || c.contact.website_url === '#'
  );

  console.log(`Found ${targetClinics.length} clinics missing website URLs\n`);

  let websitesFound = 0;
  let phonesFound = 0;
  let errors = 0;

  for (let i = 0; i < targetClinics.length; i++) {
    const clinic = targetClinics[i];
    const progress = `[${i + 1}/${targetClinics.length}]`;

    try {
      // Generate candidate URLs from clinic name
      const core = coreName(clinic.name);
      const nameSlug = slugifyForUrl(clinic.name);
      const nameDashed = slugifyDashed(clinic.name);
      const coreSlug = slugifyForUrl(core);

      const candidateUrls = [
        `https://www.${nameSlug}.com`,
        `https://${nameSlug}.com`,
        `https://www.${coreSlug}.com`,
        `https://${coreSlug}.com`,
        `https://www.${nameDashed}.com`,
        `https://${nameDashed}.com`,
      ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

      let foundUrl: string | null = null;

      for (const url of candidateUrls) {
        if (await checkUrl(url)) {
          foundUrl = url;
          break;
        }
      }

      if (foundUrl) {
        if (!clinic.contact) clinic.contact = {};
        clinic.contact.website_url = foundUrl;
        websitesFound++;
        console.log(`${progress} ${clinic.name} - WEBSITE: ${foundUrl}`);

        // Try to extract phone from the found website
        if (!clinic.contact.phone || clinic.contact.phone.trim() === '') {
          const phone = await extractPhoneFromWebsite(foundUrl);
          if (phone) {
            clinic.contact.phone = phone;
            phonesFound++;
            console.log(`  → PHONE: ${phone}`);
          }
        }
      } else {
        console.log(`${progress} ${clinic.name} - No website found`);
      }
    } catch (err) {
      errors++;
      console.error(`${progress} ERROR: ${clinic.name}:`, err);
    }
  }

  if (!dryRun) {
    const clinicMap = new Map(targetClinics.map(c => [c.id, c]));
    for (let i = 0; i < clinics.length; i++) {
      const updated = clinicMap.get(clinics[i].id);
      if (updated) clinics[i] = updated;
    }
    fs.writeFileSync(CLINICS_PATH, JSON.stringify(clinics, null, 2), 'utf-8');
    console.log(`\nWritten to ${CLINICS_PATH}`);
  }

  console.log('\n=== Contact Enrichment Complete ===');
  console.log(`Clinics checked:    ${targetClinics.length}`);
  console.log(`Websites found:     ${websitesFound}`);
  console.log(`Phones found:       ${phonesFound}`);
  console.log(`Errors:             ${errors}`);
}

main().catch(console.error);
