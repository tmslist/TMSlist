/**
 * Image utilities — deterministic fallback pool + responsive helpers.
 * Replaces the old hardcoded Unsplash URLs in dataHelpers.ts with
 * a system that supports uploaded images (Vercel Blob) and fallbacks.
 */

const CLINIC_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a092dd14?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1516574187841-693083f69382?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1576091160550-217358c7e618?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&h=500&fit=crop",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * Get best image for a clinic with proper fallback chain.
 * Priority: uploaded hero → media.hero_image_url → deterministic pool fallback
 */
export function getClinicImageUrl(clinic: {
  id?: string;
  name?: string;
  media?: { hero_image_url?: string; logo_url?: string } | null;
}): string {
  // Check uploaded/stored images first
  if (clinic.media?.hero_image_url) return clinic.media.hero_image_url;

  // Deterministic fallback from pool
  const key = clinic.id || clinic.name || 'default';
  const index = Math.abs(hashString(key)) % CLINIC_IMAGE_POOL.length;
  return CLINIC_IMAGE_POOL[index];
}

/**
 * Generate responsive srcset for Unsplash images.
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
 * Get logo URL with fallback to first letter avatar.
 */
export function getClinicLogoUrl(clinic: {
  name: string;
  media?: { logo_url?: string } | null;
}): string {
  if (clinic.media?.logo_url) return clinic.media.logo_url;

  // Generate a simple SVG placeholder with the clinic initial
  const initial = clinic.name.charAt(0).toUpperCase();
  const colors = ['4f46e5', '2563eb', '7c3aed', '059669', 'dc2626', 'ea580c'];
  const color = colors[Math.abs(hashString(clinic.name)) % colors.length];

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#${color}"/><text x="32" y="40" text-anchor="middle" fill="white" font-family="system-ui" font-size="28" font-weight="bold">${initial}</text></svg>`
  )}`;
}
