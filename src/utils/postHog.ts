/**
 * PostHog analytics integration.
 * Initializes the PostHog client with session recording and heatmaps enabled.
 *
 * Setup:
 *   1. Create a free PostHog project at https://app.posthog.com
 *   2. Add POSTHOG_API_KEY, POSTHOG_HOST, and PUBLIC_POSTHOG_KEY to your environment
 *   3. Heatmaps and session recordings will auto-capture for all page visits
 *
 * Self-hosting option (full privacy, no data leaving your servers):
 *   Deploy PostHog on a $4/mo Hetzner VPS:
 *     docker run -d --restart always \
 *       -v ph_postgres:/var/lib/postgresql/data \
 *       -p 8080:8000 \
 *       posthog/posthog:latest
 *   Then set POSTHOG_HOST=https://your-vps-ip:8080
 */

import posthog from 'posthog-js';

const API_KEY = import.meta.env.POSTHOG_API_KEY;
const HOST = import.meta.env.POSTHOG_HOST || 'https://app.posthog.com';
const KEY = import.meta.env.NEXT_PUBLIC_POSTHOG_KEY || import.meta.env.PUBLIC_POSTHOG_KEY;

export function initPostHog() {
  if (typeof window === 'undefined' || !KEY || !API_KEY) return;

  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,        // auto-capture pageviews
    capture_dead_clicks: true,     // rage-click detection
    session_recording: {
      // Mask sensitive fields for privacy
      maskAllInputs: true,
      maskTextSelector: '.mask-ph',
    },
    bootstrap: {
      featureFlags: {
        'heatmaps-enabled': true,
      },
    },
    loaded: (ph) => {
      // Disable in development to avoid polluting production data
      if (import.meta.env.DEV) {
        ph.opt_out_capturing();
      }
    },
  });
}

export function captureEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(name, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}