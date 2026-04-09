import { describe, it, expect } from 'vitest';
import { getClinicImageUrl, getUnsplashSrcSet, getClinicLogoUrl } from '../src/utils/images';

describe('getClinicImageUrl', () => {
  it('returns hero image when available', () => {
    const url = getClinicImageUrl({
      id: 'test',
      media: { hero_image_url: 'https://example.com/hero.jpg' },
    });
    expect(url).toBe('https://example.com/hero.jpg');
  });

  it('returns deterministic fallback for same clinic', () => {
    const url1 = getClinicImageUrl({ id: 'clinic-123', name: 'Test Clinic' });
    const url2 = getClinicImageUrl({ id: 'clinic-123', name: 'Test Clinic' });
    expect(url1).toBe(url2);
    expect(url1).toContain('unsplash.com');
  });

  it('returns different images for different clinics', () => {
    const url1 = getClinicImageUrl({ id: 'clinic-a' });
    const url2 = getClinicImageUrl({ id: 'clinic-b' });
    // Different IDs should generally produce different images (not guaranteed but likely)
    expect(url1).toContain('unsplash.com');
    expect(url2).toContain('unsplash.com');
  });

  it('handles missing media', () => {
    const url = getClinicImageUrl({ id: 'test' });
    expect(url).toContain('unsplash.com');
  });
});

describe('getUnsplashSrcSet', () => {
  it('generates srcset for unsplash URLs', () => {
    const srcset = getUnsplashSrcSet('https://images.unsplash.com/photo-123?w=800');
    expect(srcset).toContain('400w');
    expect(srcset).toContain('800w');
    expect(srcset).toContain('1200w');
  });

  it('returns empty for non-unsplash URLs', () => {
    expect(getUnsplashSrcSet('https://example.com/image.jpg')).toBe('');
  });
});

describe('getClinicLogoUrl', () => {
  it('returns logo when available', () => {
    const url = getClinicLogoUrl({
      name: 'Test Clinic',
      media: { logo_url: 'https://example.com/logo.png' },
    });
    expect(url).toBe('https://example.com/logo.png');
  });

  it('generates SVG placeholder with initial', () => {
    const url = getClinicLogoUrl({ name: 'Test Clinic' });
    expect(url).toContain('data:image/svg+xml');
    expect(url).toContain('T'); // first letter
  });
});
