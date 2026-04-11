#!/usr/bin/env node
/**
 * Fetch Real Clinic Photos from Practice Websites & Google
 *
 * Usage:
 *   node scripts/images/fetch-clinic-photos.mjs                    # Fetch all
 *   node scripts/images/fetch-clinic-photos.mjs --limit 50         # First 50
 *   node scripts/images/fetch-clinic-photos.mjs --state CA         # Only California
 *   node scripts/images/fetch-clinic-photos.mjs --dry-run          # Preview only
 *   node scripts/images/fetch-clinic-photos.mjs --skip-existing    # Skip already downloaded
 *
 * Sources tried (in order):
 *   1. Clinic website OG image / hero image
 *   2. Google Custom Search API (if configured)
 *
 * IMPORTANT: Review all downloaded images before uploading.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CLINICS_JSON = path.join(ROOT, 'src/data/clinics.json');
const OUTPUT_DIR = path.join(__dirname, 'clinics');

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
        if (stat.size < 5000) {
          fs.unlinkSync(finalPath);
          reject(new Error('Image too small (likely icon/placeholder)'));
        } else {
          resolve(finalPath);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchOGImage(websiteUrl) {
  const res = await fetch(websiteUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Try OG image first
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) {
    let url = ogMatch[1];
    if (url.startsWith('/')) {
      const base = new URL(websiteUrl);
      url = `${base.protocol}//${base.host}${url}`;
    }
    return url;
  }

  // Try large hero image
  const heroMatch = html.match(/<img[^>]+src=["']([^"']+(?:hero|banner|header|clinic|office|building)[^"']*)["']/i);
  if (heroMatch) {
    let url = heroMatch[1];
    if (url.startsWith('/')) {
      const base = new URL(websiteUrl);
      url = `${base.protocol}//${base.host}${url}`;
    }
    return url;
  }

  return null;
}

async function searchGoogleImages(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) return null;
  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    cx: GOOGLE_CX,
    q: query,
    searchType: 'image',
    imgSize: 'large',
    num: '3',
    safe: 'active',
  });
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.map(i => i.link) || [];
}

async function fetchClinicPhoto(clinic) {
  const slug = clinic.slug || clinic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const destPath = path.join(OUTPUT_DIR, `${slug}.jpg`);

  if (skipExisting) {
    const existing = ['.jpg', '.jpeg', '.png', '.webp'].some(ext =>
      fs.existsSync(path.join(OUTPUT_DIR, `${slug}${ext}`))
    );
    if (existing) return { status: 'exists', slug };
  }

  // Try clinic website OG image
  if (clinic.website) {
    try {
      const ogUrl = await fetchOGImage(clinic.website);
      if (ogUrl) {
        try {
          const saved = await downloadFile(ogUrl, destPath);
          return { status: 'downloaded', slug, source: 'website', path: saved };
        } catch { /* fall through */ }
      }
    } catch { /* fall through */ }
  }

  // Try Google search
  const query = `${clinic.name} ${clinic.city || ''} ${clinic.state || ''} TMS clinic exterior`;
  try {
    const urls = await searchGoogleImages(query);
    if (urls) {
      for (const url of urls) {
        try {
          const saved = await downloadFile(url, destPath);
          return { status: 'downloaded', slug, source: 'google', path: saved };
        } catch { continue; }
      }
    }
  } catch { /* fall through */ }

  return { status: 'not_found', slug };
}

async function main() {
  const clinicsData = JSON.parse(fs.readFileSync(CLINICS_JSON, 'utf-8'));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let clinics = clinicsData;
  if (stateFilter) clinics = clinics.filter(c => c.state === stateFilter);
  const batch = clinics.slice(0, limit);

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Processing ${batch.length} of ${clinics.length} clinics`);
  if (GOOGLE_API_KEY) console.log('Google Image Search: enabled');
  else console.log('Google Image Search: disabled (set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX)');
  console.log(`Output: ${OUTPUT_DIR}/\n`);

  if (dryRun) {
    batch.slice(0, 20).forEach(clinic => {
      const slug = clinic.slug || clinic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      console.log(`  Would fetch: ${clinic.name} -> ${slug}.jpg`);
    });
    if (batch.length > 20) console.log(`  ... and ${batch.length - 20} more`);
    return;
  }

  let downloaded = 0, notFound = 0, existed = 0, errors = 0;

  for (let i = 0; i < batch.length; i += 5) {
    const chunk = batch.slice(i, i + 5);
    const results = await Promise.allSettled(
      chunk.map(clinic => fetchClinicPhoto(clinic))
    );

    results.forEach((r, idx) => {
      const clinic = chunk[idx];
      if (r.status === 'fulfilled') {
        const res = r.value;
        if (res.status === 'downloaded') {
          console.log(`  OK: ${clinic.name} -> ${path.basename(res.path)} (${res.source})`);
          downloaded++;
        } else if (res.status === 'exists') {
          existed++;
        } else {
          console.log(`  MISS: ${clinic.name}`);
          notFound++;
        }
      } else {
        console.log(`  ERR: ${clinic.name} - ${r.reason?.message || r.reason}`);
        errors++;
      }
    });

    if (i + 5 < batch.length) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nResults: ${downloaded} downloaded, ${existed} existed, ${notFound} not found, ${errors} errors`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review images in scripts/images/clinics/`);
  console.log(`  2. Remove any incorrect/low-quality photos`);
  console.log(`  3. Run: node scripts/images/bulk-upload.mjs --type clinics`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
