import { useEffect } from 'react';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const STORAGE_KEY = 'tmslist_utm';

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landingPage?: string;
  capturedAt?: string;
}

/** Retrieve stored UTM data for attaching to lead submissions */
export function getUTMData(): UTMData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UTMData;
  } catch {
    // ignore
  }
  return {};
}

export default function UTMCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const data: UTMData = {};
      let hasUTM = false;

      for (const key of UTM_KEYS) {
        const val = url.searchParams.get(key);
        if (val) {
          data[key] = val;
          hasUTM = true;
        }
      }

      // Capture referrer
      if (document.referrer) {
        try {
          const ref = new URL(document.referrer);
          if (ref.hostname !== window.location.hostname) {
            data.referrer = document.referrer;
            hasUTM = true;
          }
        } catch {
          // malformed referrer, skip
        }
      }

      // Only store if we have UTM params or referrer, and no existing data
      if (hasUTM) {
        const existing = getUTMData();
        // Don't overwrite if already captured this session (first touch wins)
        if (!existing.capturedAt) {
          data.landingPage = window.location.pathname;
          data.capturedAt = new Date().toISOString();
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      }
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  // Invisible component — renders nothing
  return null;
}
