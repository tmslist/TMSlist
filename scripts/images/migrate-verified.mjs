#!/usr/bin/env node
/**
 * Migrate Verified Clinic Data into clinics.json + Inject Scraped Hero Images
 *
 * This script:
 *   1. Merges real data from verified-clinics.ts into clinics.json
 *      (websites, phones, verified=true, doctors)
 *   2. Adds the 11 missing verified clinics
 *   3. Injects scraped hero image paths and generates Cloudinary upload plan
 *   4. Writes enriched clinics.json + an upload manifest
 *
 * Usage:
 *   node scripts/images/migrate-verified.mjs --dry-run     # Preview changes
 *   node scripts/images/migrate-verified.mjs               # Apply changes
 *   node scripts/images/bulk-upload.mjs --type clinics     # Upload heroes to Cloudinary
 *   node scripts/images/bulk-upload.mjs --type doctors     # Upload doctor photos
 *
 * Requires: .env with CLOUDINARY_* vars for upload step.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CLINICS_JSON = path.join(ROOT, 'src/data/clinics.json');
const VERIFIED_TS = path.join(ROOT, 'src/data/verified-clinics.ts');
const SCRAPED_RESULTS = path.join(__dirname, 'scraped-verified-results.json');
const UPLOAD_MANIFEST = path.join(__dirname, 'upload-manifest.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// ── Parse verified clinics from TypeScript ─────────────────────────────────────

function parseVerifiedClinics() {
  const content = fs.readFileSync(VERIFIED_TS, 'utf-8');
  const allClinics = [];
  const STATE_ARRAY_RE = /export const [A-Z_]+_CLINICS: VerifiedClinic\[\] = \[/g;
  let m;
  while ((m = STATE_ARRAY_RE.exec(content)) !== null) {
    const start = m.index + m[0].length;
    const nextArr = content.indexOf('export const', start);
    const end = nextArr === -1 ? content.length : nextArr;
    const block = content.slice(start, end);
    let depth = 0, objStart = -1;
    for (let i = 0; i < block.length; i++) {
      if (block[i] === '{') { if (depth === 0) objStart = i; depth++; }
      else if (block[i] === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const obj = block.slice(objStart, i + 1);
          const name = obj.match(/name:\s+"([^"]+)"/)?.[1];
          const slug = obj.match(/slug:\s+"([^"]+)"/)?.[1];
          const website = obj.match(/website:\s+"([^"]+)"/)?.[1];
          const phone = obj.match(/phone:\s+"([^"]+)"/)?.[1];
          const verified = true;
          if (name && slug && website) {
            const clinic = { name, slug, website, phone, verified };
            const doctorsMatch = obj.match(/doctors:\s*\[([\s\S]*?)\]/);
            if (doctorsMatch) {
              clinic.doctors = [...doctorsMatch[1].matchAll(/name:\s+"([^"]+)"/g)]
                .map(d => d[1]);
            }
            // Extract full object for address
            const addrMatch = obj.match(/address:\s*\{([\s\S]*?)\}/);
            if (addrMatch) {
              clinic.address = {
                street: addrMatch[1].match(/street:\s+"([^"]+)"/)?.[1] || '',
                city: addrMatch[1].match(/city:\s+"([^"]+)"/)?.[1] || '',
                state: addrMatch[1].match(/state:\s+"([^"]+)"/)?.[1] || '',
                zip: addrMatch[1].match(/zip:\s+"([^"]+)"/)?.[1] || '',
              };
            }
            allClinics.push(clinic);
          }
          objStart = -1;
        }
      }
    }
  }
  return allClinics;
}

// ── Load scraped results ────────────────────────────────────────────────────────

function loadScrapedResults() {
  if (!fs.existsSync(SCRAPED_RESULTS)) return {};
  return JSON.parse(fs.readFileSync(SCRAPED_RESULTS, 'utf-8'));
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 Migrating verified data into clinics.json\n`);
  if (dryRun) console.log('  [DRY RUN] — no files will be modified\n');

  const clinics = JSON.parse(fs.readFileSync(CLINICS_JSON, 'utf-8'));
  const verified = parseVerifiedClinics();
  const scraped = loadScrapedResults();

  // Build slug lookup for clinics.json
  const slugMap = new Map();
  clinics.forEach((c, i) => slugMap.set(c.slug, i));

  const addedClinics = [];
  let enriched = 0;
  let skipped = 0;

  for (const v of verified) {
    const idx = slugMap.get(v.slug);
    if (idx !== undefined) {
      // Enrich existing clinic with verified data
      const c = clinics[idx];
      if (v.website && !c.website) {
        c.website = v.website;
        if (dryRun) console.log(`  [ENRICH] ${v.slug}: add website`);
      }
      if (v.phone && !c.phone) c.phone = v.phone;
      c.verified = true; // always mark verified

      // Add doctors if not present
      if (v.doctors?.length > 0) {
        const existingDocs = new Set((c.doctors_data || c.doctors || []).map(d => d.name));
        for (const docName of v.doctors) {
          if (!existingDocs.has(docName)) {
            if (!c.doctors_data) c.doctors_data = [];
            c.doctors_data.push({ name: docName, source: 'verified' });
          }
        }
      }

      // Inject scraped hero path
      const scrapedResult = scraped[v.slug];
      if (scrapedResult?.hero_path) {
        const localPath = scrapedResult.hero_path; // e.g. scripts/images/clinics/xxx-hero.jpg
        const filename = path.basename(localPath);
        c._pending_hero_upload = filename;
        if (dryRun) console.log(`  [HERO] ${v.slug}: will upload ${filename}`);
      }

      enriched++;
    } else {
      // Add missing clinic
      const missing = {
        name: v.name,
        slug: v.slug,
        address: v.address?.street || '',
        city: v.address?.city || '',
        state: v.address?.state || '',
        zip: v.address?.zip || '',
        phone: v.phone || null,
        website: v.website,
        provider_type: 'tms_center',
        country: 'US',
        verified: true,
        is_featured: true,
        geo: null,
        hero_image_url: null,
        logo_url: null,
        gallery_urls: [],
        description: null,
        description_long: null,
        machines: [],
        specialties: [],
        insurances: [],
        rating: null,
        review_count: 0,
        doctors_data: v.doctors?.map(name => ({ name, source: 'verified' })) || [],
        _pending_hero_upload: scraped[v.slug]?.hero_path
          ? path.basename(scraped[v.slug].hero_path)
          : null,
      };
      addedClinics.push(missing);
      if (dryRun) console.log(`  [ADD] ${v.slug}: new clinic`);
    }
  }

  // Summary of missing (no hero scraped)
  const noHero = verified.filter(v => {
    const idx = slugMap.get(v.slug);
    return idx !== undefined && !scraped[v.slug]?.hero_path;
  });

  console.log(`  Verified clinics total: ${verified.length}`);
  console.log(`  Enriched in clinics.json: ${enriched}`);
  console.log(`  Added as new: ${addedClinics.length}`);
  console.log(`  Already have scraped hero: ${Object.values(scraped).filter(r => r.hero_path).length}`);
  console.log(`  No hero scraped (will use DiceBear/fallback): ${noHero.length}`);

  if (dryRun) {
    console.log(`\n  Run without --dry-run to apply these changes.`);
    return;
  }

  // Apply changes
  for (const c of addedClinics) delete c._pending_hero_upload;
  clinics.push(...addedClinics);
  fs.writeFileSync(CLINICS_JSON, JSON.stringify(clinics, null, 2));

  // Write upload manifest for bulk-upload.mjs to use
  const manifest = [];
  for (const [slug, result] of Object.entries(scraped)) {
    if (result.hero_path) {
      manifest.push({
        type: 'clinic_hero',
        slug,
        localPath: result.hero_path,
        status: 'pending_upload',
      });
    }
    for (const dp of (result.doctor_photos || [])) {
      manifest.push({
        type: 'doctor_photo',
        slug,
        doctorName: dp.name,
        localPath: dp.path,
        status: 'pending_upload',
      });
    }
  }

  fs.writeFileSync(UPLOAD_MANIFEST, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Applied: enriched ${enriched} clinics, added ${addedClinics.length} new`);
  console.log(`   clinics.json updated`);
  console.log(`   Upload manifest: ${UPLOAD_MANIFEST} (${manifest.length} items)`);
  console.log(`\n📤 Next step: node scripts/images/bulk-upload.mjs --type all`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
