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

export default function PostHogLoader() {
  useEffect(() => {
    if (!KEY) return;
    // Don't capture dev traffic
    if (import.meta.env.DEV) return;

    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      session_recording: {
        maskAllInputs: true,
        blockClass: 'ph-no-capture',
      },
    });
  }, []);

  return null;
}
