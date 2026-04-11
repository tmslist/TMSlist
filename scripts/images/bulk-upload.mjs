#!/usr/bin/env node
/**
 * Bulk Upload Script for TMS Clinic & Doctor Images
 *
 * Usage:
 *   node scripts/images/bulk-upload.mjs --type doctors       # Upload all doctor headshots
 *   node scripts/images/bulk-upload.mjs --type clinics       # Upload clinic hero images
 *   node scripts/images/bulk-upload.mjs --type logos         # Upload clinic logos
 *   node scripts/images/bulk-upload.mjs --type gallery       # Upload clinic gallery images
 *   node scripts/images/bulk-upload.mjs --type doctors --dry-run  # Preview without uploading
 *   node scripts/images/bulk-upload.mjs --type all           # Upload everything
 *
 * Directory structure:
 *   scripts/images/doctors/{doctor-slug}.{jpg,png,webp}
 *   scripts/images/clinics/{clinic-slug}.{jpg,png,webp}
 *   scripts/images/logos/{clinic-slug}.{jpg,png,webp}
 *   scripts/images/gallery/{clinic-slug}_1.{jpg,png,webp}
 *   scripts/images/gallery/{clinic-slug}_2.{jpg,png,webp}
 *
 * The script will:
 *   1. Scan the staging directory for images
 *   2. Match them to entries in clinics.json by slug
 *   3. Upload to Cloudinary
 *   4. Update clinics.json with the new URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CLINICS_JSON = path.join(ROOT, 'src/data/clinics.json');

// Parse args
const args = process.argv.slice(2);
const typeIdx = args.indexOf('--type');
const type = typeIdx !== -1 ? args[typeIdx + 1] : null;
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

const VALID_TYPES = ['doctors', 'clinics', 'logos', 'gallery', 'all'];
if (!type || !VALID_TYPES.includes(type)) {
  console.error('Usage: node bulk-upload.mjs --type <doctors|clinics|logos|gallery|all> [--dry-run] [--limit N]');
  process.exit(1);
}

// Load env
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

// Configure Cloudinary
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME && !dryRun) {
  console.error('Missing CLOUDINARY_CLOUD_NAME. Set Cloudinary env vars in .env or run with --dry-run');
  process.exit(1);
}

if (!dryRun) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Supported image extensions
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

function scanImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .map(f => ({
      file: f,
      slug: path.basename(f, path.extname(f)),
      fullPath: path.join(dir, f),
    }));
}

async function uploadImage(imagePath, folder, publicId, transformation) {
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).slice(1);
  const mime = ext === 'jpg' ? 'jpeg' : ext;

  const result = await cloudinary.uploader.upload(
    `data:image/${mime};base64,${buffer.toString('base64')}`,
    {
      folder,
      public_id: publicId,
      transformation,
      quality: 'auto:good',
      format: 'auto',
      exif: false,
      overwrite: true,
    }
  );
  return result.secure_url;
}

const TRANSFORMS = {
  doctor: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  hero: [{ width: 1200, height: 750, crop: 'fill', gravity: 'auto' }],
  logo: [{ width: 200, height: 200, crop: 'fill', gravity: 'auto' }],
  gallery: [{ width: 800, height: 600, crop: 'fill', gravity: 'auto' }],
};

async function processType(uploadType, clinicsData, doctorMap, clinicMap) {
  const stagingDir = path.join(__dirname, uploadType);
  const images = scanImages(stagingDir).slice(0, limit);

  if (images.length === 0) {
    console.log(`\n  No ${uploadType} images found in ${stagingDir}/`);
    return { uploaded: 0, skipped: 0, failed: 0 };
  }

  console.log(`\n  Found ${images.length} ${uploadType} images\n`);

  let uploaded = 0, skipped = 0, failed = 0;

  for (const img of images) {
    if (uploadType === 'doctors') {
      const entry = doctorMap.get(img.slug);
      if (!entry) { console.log(`    SKIP: No match for "${img.slug}"`); skipped++; continue; }
      const doctor = clinicsData[entry.clinicIdx].doctors_data[entry.doctorIdx];
      console.log(`    ${dryRun ? '[DRY] ' : ''}${doctor.name} (${img.file})`);
      if (!dryRun) {
        try {
          const url = await uploadImage(img.fullPath, 'tmslist/doctors', img.slug, TRANSFORMS.doctor);
          clinicsData[entry.clinicIdx].doctors_data[entry.doctorIdx].image_url = url;
          uploaded++;
          console.log(`      -> ${url}`);
        } catch (err) { console.error(`      FAILED: ${err.message}`); failed++; }
      } else { uploaded++; }

    } else if (uploadType === 'clinics') {
      const clinicIdx = clinicMap.get(img.slug);
      if (clinicIdx === undefined) { console.log(`    SKIP: No match for "${img.slug}"`); skipped++; continue; }
      const clinic = clinicsData[clinicIdx];
      console.log(`    ${dryRun ? '[DRY] ' : ''}${clinic.name} — hero (${img.file})`);
      if (!dryRun) {
        try {
          const url = await uploadImage(img.fullPath, `tmslist/clinics/${img.slug}`, `hero-${Date.now()}`, TRANSFORMS.hero);
          clinicsData[clinicIdx].hero_image_url = url;
          uploaded++;
          console.log(`      -> ${url}`);
        } catch (err) { console.error(`      FAILED: ${err.message}`); failed++; }
      } else { uploaded++; }

    } else if (uploadType === 'logos') {
      const clinicIdx = clinicMap.get(img.slug);
      if (clinicIdx === undefined) { console.log(`    SKIP: No match for "${img.slug}"`); skipped++; continue; }
      const clinic = clinicsData[clinicIdx];
      console.log(`    ${dryRun ? '[DRY] ' : ''}${clinic.name} — logo (${img.file})`);
      if (!dryRun) {
        try {
          const url = await uploadImage(img.fullPath, `tmslist/clinics/${img.slug}`, 'logo', TRANSFORMS.logo);
          clinicsData[clinicIdx].logo_url = url;
          uploaded++;
          console.log(`      -> ${url}`);
        } catch (err) { console.error(`      FAILED: ${err.message}`); failed++; }
      } else { uploaded++; }

    } else if (uploadType === 'gallery') {
      // Gallery files: {clinic-slug}_1.jpg, {clinic-slug}_2.jpg, etc.
      const match = img.slug.match(/^(.+)_(\d+)$/);
      const clinicSlug = match ? match[1] : img.slug;
      const photoNum = match ? match[2] : '1';
      const clinicIdx = clinicMap.get(clinicSlug);
      if (clinicIdx === undefined) { console.log(`    SKIP: No match for "${clinicSlug}"`); skipped++; continue; }
      const clinic = clinicsData[clinicIdx];
      console.log(`    ${dryRun ? '[DRY] ' : ''}${clinic.name} — gallery #${photoNum} (${img.file})`);
      if (!dryRun) {
        try {
          const url = await uploadImage(img.fullPath, `tmslist/clinics/${clinicSlug}/gallery`, `photo-${photoNum}`, TRANSFORMS.gallery);
          if (!clinicsData[clinicIdx].gallery_urls) clinicsData[clinicIdx].gallery_urls = [];
          clinicsData[clinicIdx].gallery_urls.push(url);
          uploaded++;
          console.log(`      -> ${url}`);
        } catch (err) { console.error(`      FAILED: ${err.message}`); failed++; }
      } else { uploaded++; }
    }
  }

  return { uploaded, skipped, failed };
}

async function main() {
  const clinicsData = JSON.parse(fs.readFileSync(CLINICS_JSON, 'utf-8'));

  // Build lookup maps
  const doctorMap = new Map();
  const clinicMap = new Map();

  clinicsData.forEach((clinic, ci) => {
    const clinicSlug = clinic.slug || clinic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    clinicMap.set(clinicSlug, ci);
    if (clinic.doctors_data) {
      clinic.doctors_data.forEach((doc, di) => {
        const docSlug = doc.slug || doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        doctorMap.set(docSlug, { clinicIdx: ci, doctorIdx: di });
      });
    }
  });

  const types = type === 'all' ? ['doctors', 'clinics', 'logos', 'gallery'] : [type];
  let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Bulk Image Upload\n${'='.repeat(40)}`);

  for (const t of types) {
    console.log(`\n--- ${t.toUpperCase()} ---`);
    const result = await processType(t, clinicsData, doctorMap, clinicMap);
    totalUploaded += result.uploaded;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  // Save updated clinics.json
  if (!dryRun && totalUploaded > 0) {
    fs.writeFileSync(CLINICS_JSON, JSON.stringify(clinicsData, null, 2));
    console.log(`\nUpdated clinics.json`);
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Total: ${totalUploaded} uploaded, ${totalSkipped} skipped, ${totalFailed} failed`);

  if (totalUploaded === 0 && totalSkipped === 0 && totalFailed === 0) {
    console.log(`\nNo images found. Place files in the staging directories:`);
    console.log(`  scripts/images/doctors/{doctor-slug}.jpg       — Doctor headshots`);
    console.log(`  scripts/images/clinics/{clinic-slug}.jpg       — Clinic hero/exterior`);
    console.log(`  scripts/images/logos/{clinic-slug}.jpg         — Clinic logos`);
    console.log(`  scripts/images/gallery/{clinic-slug}_1.jpg     — Gallery photos`);
    console.log(`\nSee doctors-manifest.csv and clinics-manifest.csv for all slugs.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
