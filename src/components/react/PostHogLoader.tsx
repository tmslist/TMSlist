/**
 * PostHog loader — initializes session recording and heatmaps.
 * Must be a client component so it loads after hydration.
 *
 * Env vars needed:
 *   PUBLIC_POSTHOG_KEY   — your PostHog project key (public, safe to expose)
 *   PUBLIC_POSTHOG_HOST  — optional, defaults to https://us.i.posthog.com
 *
 * Self-hosting (recommended for privacy):
 *   docker run -d --restart always \
 *     -v ph_postgres:/var/lib/postgresql/data \
 *     -p 8080:8000 \
 *     posthog/posthog:latest
 *   Then set PUBLIC_POSTHOG_HOST=https://your-vps-ip:8080
 */
import { useEffect } from 'react';
import posthog from 'posthog-js';

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY || '';
const HOST = import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

function initPostHog() {
  if (initialized || !KEY) return;
  initialized = true;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    session_recording: {
      maskAllInputs: true,
      blockClass: 'ph-no-capture',
    },
  });
}

export default function PostHogLoader() {
  useEffect(() => {
    if (!KEY) return;
    if (import.meta.env.DEV) return;

    if (localStorage.getItem('cookie_consent') === 'accepted') {
      initPostHog();
      return;
    }

    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === 'accepted') initPostHog();
    };
    window.addEventListener('cookie-consent', onConsent);
    return () => window.removeEventListener('cookie-consent', onConsent);
  }, []);

  return null;
}
