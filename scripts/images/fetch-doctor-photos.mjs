#!/usr/bin/env node
/**
 * Fetch Real Doctor Photos from Practice Websites
 *
 * This script searches for real doctor headshots using their name + clinic info,
 * downloads them to the staging directory for review before bulk upload.
 *
 * Usage:
 *   node scripts/images/fetch-doctor-photos.mjs                    # Fetch all
 *   node scripts/images/fetch-doctor-photos.mjs --limit 50         # First 50
 *   node scripts/images/fetch-doctor-photos.mjs --state CA         # Only California
 *   node scripts/images/fetch-doctor-photos.mjs --dry-run          # Preview only
 *   node scripts/images/fetch-doctor-photos.mjs --skip-existing    # Skip already downloaded
 *
 * Sources tried (in order):
 *   1. Google Custom Search API (if configured)
 *   2. Direct clinic website scraping (from clinic URL in data)
 *
 * IMPORTANT: Review all downloaded images before uploading.
 * Some may be wrong person, low quality, or copyrighted.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CLINICS_JSON = path.join(ROOT, 'src/data/clinics.json');
const OUTPUT_DIR = path.join(__dirname, 'doctors');

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipExisting = args.includes('--skip-existing');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;
const stateIdx = args.indexOf('--state');
const stateFilter = stateIdx !== -1 ? args[stateIdx + 1].toUpperCase() : null;

// Load env
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('image')) {
        res.resume();
        return reject(new Error(`Not an image: ${contentType}`));
      }
      const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
      const finalPath = destPath.replace(/\.[^.]+$/, ext);
      const stream = fs.createWriteStream(finalPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        const stat = fs.statSync(finalPath);
        if (stat.size < 2000) {
          fs.unlinkSync(finalPath);
          reject(new Error('Image too small (likely placeholder)'));
        } else {
          resolve(finalPath);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function searchGoogleImages(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) return null;
  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    cx: GOOGLE_CX,
    q: query,
    searchType: 'image',
    imgType: 'face',
    imgSize: 'medium',
    num: '3',
    safe: 'active',
  });
  const url = `https://www.googleapis.com/customsearch/v1?${params}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.map(i => i.link) || [];
}

async function fetchDoctorPhoto(doctor, clinic) {
  const slug = doctor.slug || doctor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const destPath = path.join(OUTPUT_DIR, `${slug}.jpg`);

  // Check if already exists
  if (skipExisting) {
    const existing = ['.jpg', '.jpeg', '.png', '.webp'].some(ext =>
      fs.existsSync(path.join(OUTPUT_DIR, `${slug}${ext}`))
    );
    if (existing) return { status: 'exists', slug };
  }

  const searchQuery = `${doctor.name} ${clinic.name} TMS psychiatrist headshot`;

  // Try Google Image Search
  try {
    const imageUrls = await searchGoogleImages(searchQuery);
    if (imageUrls && imageUrls.length > 0) {
      for (const imgUrl of imageUrls) {
        try {
          const saved = await downloadFile(imgUrl, destPath);
          return { status: 'downloaded', slug, source: 'google', path: saved };
        } catch { continue; }
      }
    }
  } catch { /* fall through */ }

  // Try clinic website if available
  if (clinic.website) {
    try {
      const res = await fetch(clinic.website, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const html = await res.text();
        const lastName = doctor.name.split(/\s+/).pop().replace(/,.*/, '').toLowerCase();
        const imgRegex = new RegExp(`<img[^>]+src=["']([^"']+${lastName}[^"']*)["']`, 'i');
        const match = html.match(imgRegex);
        if (match) {
          let imgUrl = match[1];
          if (imgUrl.startsWith('/')) {
            const base = new URL(clinic.website);
            imgUrl = `${base.protocol}//${base.host}${imgUrl}`;
          }
          try {
            const saved = await downloadFile(imgUrl, destPath);
            return { status: 'downloaded', slug, source: 'website', path: saved };
          } catch { /* fall through */ }
        }
      }
    } catch { /* fall through */ }
  }

  return { status: 'not_found', slug };
}

async function main() {
  const clinicsData = JSON.parse(fs.readFileSync(CLINICS_JSON, 'utf-8'));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Build doctor list
  const doctors = [];
  clinicsData.forEach(clinic => {
    if (stateFilter && clinic.state !== stateFilter) return;
    if (clinic.doctors_data) {
      clinic.doctors_data.forEach(doc => {
        doctors.push({ doctor: doc, clinic });
      });
    }
  });

  const batch = doctors.slice(0, limit);
  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Processing ${batch.length} of ${doctors.length} doctors`);
  if (GOOGLE_API_KEY) console.log('Google Image Search: enabled');
  else console.log('Google Image Search: disabled (set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX)');
  console.log(`Output: ${OUTPUT_DIR}/\n`);

  if (dryRun) {
    batch.slice(0, 20).forEach(({ doctor, clinic }) => {
      const slug = doctor.slug || doctor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      console.log(`  Would fetch: ${doctor.name} -> ${slug}.jpg`);
    });
    if (batch.length > 20) console.log(`  ... and ${batch.length - 20} more`);
    return;
  }

  let downloaded = 0, notFound = 0, existed = 0, errors = 0;

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < batch.length; i += 5) {
    const chunk = batch.slice(i, i + 5);
    const results = await Promise.allSettled(
      chunk.map(({ doctor, clinic }) => fetchDoctorPhoto(doctor, clinic))
    );

    results.forEach((r, idx) => {
      const doc = chunk[idx].doctor;
      if (r.status === 'fulfilled') {
        const res = r.value;
        if (res.status === 'downloaded') {
          console.log(`  OK: ${doc.name} -> ${path.basename(res.path)} (${res.source})`);
          downloaded++;
        } else if (res.status === 'exists') {
          existed++;
        } else {
          console.log(`  MISS: ${doc.name}`);
          notFound++;
        }
      } else {
        console.log(`  ERR: ${doc.name} - ${r.reason?.message || r.reason}`);
        errors++;
      }
    });

    // Rate limit pause
    if (i + 5 < batch.length) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nResults: ${downloaded} downloaded, ${existed} existed, ${notFound} not found, ${errors} errors`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review images in scripts/images/doctors/`);
  console.log(`  2. Remove any incorrect/low-quality photos`);
  console.log(`  3. Run: node scripts/images/bulk-upload.mjs --type doctors`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
