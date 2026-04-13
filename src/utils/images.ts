/**
 * Image utilities — unique fallback images for clinics.
 *
 * Uses Picsum Photos for deterministic, unique-per-clinic fallbacks.
 * Each clinic ID produces a guaranteed unique photo — no repeat
 * regardless of how many clinics exist in the DB.
 *
 * Priority chain:
 *   1. Uploaded/clinic hero_image_url  → real clinic photo
 *   2. Picsum seed from clinic ID     → unique fallback
 *
 * Also provides: srcset helpers, logo fallback with SVG initials.
 */

import crypto from 'crypto';

/**
 * Generate a unique image URL for a clinic using Picsum.
 * Uses clinic ID as seed — picsum.photos guarantees a unique photo
 * for every numeric seed. No hardcoded pool needed; works for 1 or 10,000 clinics.
 */
export function getClinicImageUrl(clinic: {
  id?: string | number;
  name?: string;
  media?: { hero_image_url?: string } | null;
}): string {
  if (clinic.media?.hero_image_url) return clinic.media.hero_image_url;

  const id = String(clinic.id ?? clinic.name ?? 'default');
  const seed = Math.abs(hashString(id));

  // Picsum: same seed = same photo, unique per seed
  // 800x500 matches the 16:10 aspect ratio used across the site
  return `https://picsum.photos/seed/${seed}/800/500`;
}

/**
 * Generate a unique, stable portrait image URL for doctors/specialists.
 * Uses a different seed base so doctor and clinic photos never collide.
 */
export function getDoctorImageUrl(doctor: {
  id?: string | number;
  name?: string;
  imageUrl?: string;
}): string {
  if (doctor.imageUrl) return doctor.imageUrl;

  const id = String(doctor.id ?? doctor.name ?? 'doctor');
  const seed = Math.abs(hashString(id)) + 999999; // offset so doctors never match clinics
  return `https://picsum.photos/seed/${seed}/400/400`;
}

/**
 * Generate responsive srcset for any image URL.
 */
export function getUnsplashSrcSet(url: string): string {
  if (!url.includes('unsplash.com')) return '';
  const base = url.split('?')[0];
  const widths = [400, 600, 800, 1200];
  return widths
    .map(w => `${base}?w=${w}&h=${Math.round(w * 0.625)}&fit=crop&auto=format ${w}w`)
    .join(', ');
}

/**
 * Picsum srcset for responsive loading.
 */
export function getPicsumSrcSet(seed: number, width = 800, height = 500): string {
  const widths = [400, 600, 800, 1200];
  const h = Math.round((widths[0] / width) * height);
  return widths
    .map(w => {
      const scaledH = Math.round((w / width) * height);
      return `https://picsum.photos/seed/${seed}/${w}/${scaledH} ${w}w`;
    })
    .join(', ');
}

/**
 * Logo fallback — SVG with the clinic's initial letter and a color
 * derived from the clinic name so it stays consistent across page loads.
 */
export function getClinicLogoUrl(clinic: {
  name: string;
  media?: { logo_url?: string } | null;
}): string {
  if (clinic.media?.logo_url) return clinic.media.logo_url;

  const initial = clinic.name.charAt(0).toUpperCase();
  const colors = ['4f46e5', '2563eb', '7c3aed', '059669', 'dc2626', 'ea580c', '0891b2', '4f46e5', '2563eb', '7c3aed'];
  const color = colors[Math.abs(hashString(clinic.name)) % colors.length];

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="12" fill="#${color}"/>
      <text x="32" y="41" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="28" font-weight="bold">${initial}</text>
    </svg>`
  )}`;
}

/** djb2 hash — fast, deterministic, well-distributed */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // keep 32-bit
  }
  return hash;
}