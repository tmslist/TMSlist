#!/usr/bin/env node
/**
 * Scrape Hero + Logo Images from Verified Clinic Websites
 *
 * Reads from src/data/verified-clinics.ts (real clinics with real URLs).
 * Scrapes each clinic's website for og:image (hero) and team/staff pages (doctor headshots).
 *
 * Usage:
 *   node scripts/images/scrape-verified.mjs                     # Scrape all verified clinics
 *   node scripts/images/scrape-verified.mjs --limit 10          # First 10 only
 *   node scripts/images/scrape-verified.mjs --dry-run            # Preview only
 *   node scripts/images/scrape-verified.mjs --skip-existing      # Skip already done
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(__dirname, 'clinics');
const LOGOS_DIR = path.join(__dirname, 'logos');
const DOCTORS_DIR = path.join(__dirname, 'doctors');
const RESULTS_FILE = path.join(__dirname, 'scraped-verified-results.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipExisting = args.includes('--skip-existing');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function resolveUrl(base, url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) {
    try {
      const u = new URL(base);
      return `${u.protocol}//${u.host}${url}`;
    } catch { return null; }
  }
  return null;
}

function fetchHtml(url) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) return resolve(null);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
      timeout: 15000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(null);
      const ct = res.headers['content-type'] || '';
      if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return resolve(null);
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data.slice(0, 50000)));
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function downloadImage(url, destBase, opts = {}) {
  const { minSize = 5000, timeout = 15000 } = opts;
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http') || url.startsWith('data:')) return reject(new Error('invalid url'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
      },
      timeout,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, destBase, opts).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const ct = res.headers['content-type'] || '';
      if (!ct.includes('image')) return reject(new Error(`Not image: ${ct}`));
      const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : '.jpg';
      const finalPath = destBase + ext;
      const stream = fs.createWriteStream(finalPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        const stat = fs.statSync(finalPath);
        if (stat.size < minSize) {
          fs.unlinkSync(finalPath);
          return reject(new Error(`Too small (${stat.size}B)`));
        }
        resolve(finalPath);
      });
      stream.on('error', () => reject(new Error('Stream error')));
    });
    req.on('error', err => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function findHeroImage(html, clinic) {
  const keywords = ['hero', 'banner', 'header', 'clinic', 'building', 'office', 'exterior', 'lobby'];
  const imgMatches = [...html.matchAll(/<img[^>]+>/gi)];
  let best = null;
  let bestWidth = 0;

  for (const match of imgMatches) {
    const tag = match[0];
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    const dataSrcMatch = tag.match(/data-src=["']([^"']+)["']/i);
    const src = srcMatch?.[1] || dataSrcMatch?.[1];
    if (!src) continue;

    const alt = (tag.match(/alt=["']([^"']+)["']/i)?.[1] || '').toLowerCase();
    const cls = (tag.match(/class=["']([^"']+)["']/i)?.[1] || '').toLowerCase();
    const widthMatch = tag.match(/width=["']?(\d+)/i);
    const width = parseInt(widthMatch?.[1] || '0');

    if (width < 600 && bestWidth >= 600) continue;

    const text = (alt + ' ' + cls).toLowerCase();
    const hits = keywords.filter(k => text.includes(k)).length;
    if (hits > 0 || width >= 1200) {
      if (width > bestWidth) {
        best = resolveUrl(clinic.website, src);
        bestWidth = width;
      }
    }
  }
  return best;
}

function findTeamPages(html, baseUrl) {
  const patterns = [
    '/team', '/staff', '/providers', '/doctors', '/our-team',
    '/about-us', '/about-us/team', '/meet-our-team', '/clinical-team',
    '/medical-team', '/healthcare-team', '/care-team',
  ];
  const found = [];
  for (const p of patterns) {
    if (html.includes(p) || html.includes(p.replace(/\//g, ''))) {
      const u = resolveUrl(baseUrl, p);
      if (u) found.push(u);
    }
  }
  return found;
}

function findDoctorPhotosOnPage(html, teamUrl, clinicSlug, doctors) {
  const results = [];
  if (!doctors || doctors.length === 0) return results;

  const imgTags = [...html.matchAll(/<img[^>]+>/gi)];

  for (const doctor of doctors) {
    const lastName = doctor.name.split(' ').pop().toLowerCase();

    for (const match of imgTags) {
      const tag = match[0];
      const idx = match.index;
      const window = 400;
      const start = Math.max(0, idx - window);
      const end = Math.min(html.length, idx + tag.length + window);
      const surrounding = html.slice(start, end).toLowerCase();

      if (!surrounding.includes(lastName)) continue;

      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const dataSrcMatch = tag.match(/data-src=["']([^"']+)["']/i);
      const lazyMatch = tag.match(/data-lazy-src=["']([^"']+)["']/i);
      const src = srcMatch?.[1] || dataSrcMatch?.[1] || lazyMatch?.[1];
      if (!src) continue;

      const resolved = resolveUrl(teamUrl, src);
      if (!resolved) continue;
      if (/\b(icon|logo|spinner|loader|arrow|chevron|star|check|bg|favicon|apple-touch)\b/.test(resolved)) continue;

      const slug = `${clinicSlug}-${lastName}`;
      results.push({ doctor: doctor.name, slug, url: resolved });
      break; // one photo per doctor
    }
  }
  return results;
}

// ── Scrape one clinic ─────────────────────────────────────────────────────────

async function scrapeClinicImages(clinic) {
  const result = {
    hero_url: null, hero_path: null,
    logo_url: null, logo_path: null,
    doctor_photos: [],
  };

  const html = await fetchHtml(clinic.website);
  if (!html) return result;

  // 1. OG image → hero
  let ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) result.hero_url = resolveUrl(clinic.website, ogMatch[1]);

  // 2. Twitter card fallback
  if (!result.hero_url) {
    ogMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (ogMatch) result.hero_url = resolveUrl(clinic.website, ogMatch[1]);
  }

  // 3. Large hero image on page
  if (!result.hero_url) {
    result.hero_url = findHeroImage(html, clinic);
  }

  // Download hero
  if (result.hero_url) {
    try {
      result.hero_path = await downloadImage(result.hero_url, path.join(OUTPUT_DIR, `${clinic.slug}-hero`), { minSize: 15000 });
    } catch { result.hero_path = null; }
  }

  // 4. Look for team/staff pages for doctor headshots
  const teamUrls = findTeamPages(html, clinic.website);
  for (const teamUrl of teamUrls) {
    if (result.doctor_photos.length >= (clinic.doctors?.length || 0)) break;
    try {
      const teamHtml = await fetchHtml(teamUrl);
      if (teamHtml) {
        const photos = findDoctorPhotosOnPage(teamHtml, teamUrl, clinic.slug, clinic.doctors);
        for (const photo of photos) {
          try {
            const saved = await downloadImage(photo.url, path.join(DOCTORS_DIR, photo.slug), { minSize: 3000 });
            if (saved) {
              result.doctor_photos.push({ name: photo.doctor, slug: photo.slug, path: saved });
            }
          } catch { /* non-fatal */ }
        }
      }
    } catch { /* non-fatal */ }
    break; // one team page per clinic
  }

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// ── Parse verified-clinics.ts ────────────────────────────────────────────────

function parseVerifiedClinics() {
  const content = fs.readFileSync(path.join(ROOT, 'src/data/verified-clinics.ts'), 'utf-8');
  const allClinics = [];

  // Split by state arrays to avoid cross-block matching
  const STATE_ARRAY_RE = /export const [A-Z_]+_CLINICS: VerifiedClinic\[\] = \[/g;
  let lastEnd = 0;
  let m;
  while ((m = STATE_ARRAY_RE.exec(content)) !== null) {
    const start = m.index + m[0].length;
    const nextArr = content.indexOf('export const', start);
    const end = nextArr === -1 ? content.length : nextArr;
    const block = content.slice(start, end);

    // Parse individual clinic objects using balanced brace matching
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
          if (name && slug && website) {
            const clinic = { name, slug, website };
            const doctorsMatch = obj.match(/doctors:\s*\[([\s\S]*?)\]/);
            if (doctorsMatch) {
              const docNames = [...doctorsMatch[1].matchAll(/name:\s+"([^"]+)"/g)].map(d => ({ name: d[1] }));
              if (docNames.length > 0) clinic.doctors = docNames;
            }
            allClinics.push(clinic);
          }
          objStart = -1;
        }
      }
    }
    lastEnd = end;
  }
  return allClinics;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  fs.mkdirSync(DOCTORS_DIR, { recursive: true });

  const allClinics = parseVerifiedClinics();
  const batch = allClinics.slice(0, limit);

  console.log(`\n🔍 Scraping verified clinic websites`);
  console.log(`   Found ${allClinics.length} verified clinics with websites`);
  console.log(`   Processing ${batch.length} (dry run: ${dryRun})\n`);

  if (dryRun) {
    batch.forEach(c => {
      const docCount = c.doctors?.length || 0;
      console.log(`  [DRY] ${c.name} — ${c.website}${docCount ? ` (${docCount} doctors)` : ''}`);
    });
    return;
  }

  let results = {};
  if (fs.existsSync(RESULTS_FILE)) {
    results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  }

  let heroes = 0, docPhotos = 0, skipped = 0, errors = 0;

  for (let i = 0; i < batch.length; i++) {
    const clinic = batch[i];
    process.stdout.write(`[${i + 1}/${batch.length}] ${clinic.name}... `);

    if (skipExisting && results[clinic.slug]?.hero_downloaded) {
      console.log('skipped (already done)');
      skipped++;
      continue;
    }

    try {
      const r = await scrapeClinicImages(clinic);

      if (r.hero_path) {
        console.log(`✓ hero → ${path.basename(r.hero_path)}`);
        heroes++;
      } else {
        console.log('✗ no hero');
      }

      if (r.doctor_photos.length > 0) {
        for (const dp of r.doctor_photos) {
          console.log(`  👤 ${dp.name} → ${path.basename(dp.path)}`);
          docPhotos++;
        }
      }

      results[clinic.slug] = {
        name: clinic.name,
        hero_url: r.hero_url,
        hero_downloaded: !!r.hero_path,
        hero_path: r.hero_path,
        doctor_photos: r.doctor_photos,
        scraped_at: new Date().toISOString(),
      };
    } catch (err) {
      console.log(`✗ ${err.message}`);
      errors++;
      results[clinic.slug] = { error: String(err), scraped_at: new Date().toISOString() };
    }

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    if (i < batch.length - 1) await sleep; // polite delay
  }

  const vals = Object.values(results);
  const withHeroes = vals.filter(r => r.hero_downloaded).length;
  const withDocPhotos = vals.filter(r => r.doctor_photos?.length > 0).length;

  console.log(`\n✅ Done: ${heroes}/${batch.length} heroes, ${docPhotos} doctor photos`);
  console.log(`   ${withHeroes} total heroes, ${withDocPhotos} clinics with doctor photos saved`);
  console.log(`   Results: ${RESULTS_FILE}`);
  console.log(`\nNext: Review images in scripts/images/clinics/ and scripts/images/doctors/`);
  console.log(`Then: node scripts/images/bulk-upload.mjs --type all`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
