import { inArray } from 'drizzle-orm';
import { db } from '../db';
import { siteSettings } from '../db/schema';

export interface TrackingSettings {
  enabled: boolean;
  ga4Id: string;
  gtmId: string;
  metaPixelId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  headCode: string;
  bodyOpenCode: string;
  bodyCloseCode: string;
}

const TRACKING_KEYS = [
  'tracking_enabled',
  'tracking_ga4_id',
  'tracking_gtm_id',
  'tracking_meta_pixel_id',
  'tracking_google_site_verification',
  'tracking_bing_site_verification',
  'tracking_head_code',
  'tracking_body_open_code',
  'tracking_body_close_code',
];

const empty: TrackingSettings = {
  enabled: true,
  ga4Id: '', gtmId: '', metaPixelId: '',
  googleSiteVerification: '', bingSiteVerification: '',
  headCode: '', bodyOpenCode: '', bodyCloseCode: '',
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export async function getTrackingSettings(): Promise<TrackingSettings> {
  try {
    const rows = await db.select().from(siteSettings).where(inArray(siteSettings.key, TRACKING_KEYS));
    const map: Record<string, unknown> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      enabled: map.tracking_enabled !== false,
      ga4Id: str(map.tracking_ga4_id).trim(),
      gtmId: str(map.tracking_gtm_id).trim(),
      metaPixelId: str(map.tracking_meta_pixel_id).trim(),
      googleSiteVerification: str(map.tracking_google_site_verification).trim(),
      bingSiteVerification: str(map.tracking_bing_site_verification).trim(),
      headCode: str(map.tracking_head_code),
      bodyOpenCode: str(map.tracking_body_open_code),
      bodyCloseCode: str(map.tracking_body_close_code),
    };
  } catch (err) {
    console.error('[tracking] failed to load settings', err);
    return empty;
  }
}
