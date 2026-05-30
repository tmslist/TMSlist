import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, doctors, reviews, leads, questions, treatments, users, siteSettings } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Return site stats and admin config
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const [
      clinicCount,
      doctorCount,
      reviewCount,
      leadCount,
      questionCount,
      treatmentCount,
      userCount,
      verifiedClinicCount,
      pendingReviewCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(clinics),
      db.select({ count: sql<number>`count(*)` }).from(doctors),
      db.select({ count: sql<number>`count(*)` }).from(reviews),
      db.select({ count: sql<number>`count(*)` }).from(leads),
      db.select({ count: sql<number>`count(*)` }).from(questions),
      db.select({ count: sql<number>`count(*)` }).from(treatments),
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(clinics).where(sql`${clinics.verified} = true`),
      db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.verified} = false`),
    ]);

    // Fetch all site settings
    const allSettings = await db.select().from(siteSettings);
    const settingsMap: Record<string, unknown> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }

    return json({
      stats: {
        clinics: Number(clinicCount[0]?.count ?? 0),
        verifiedClinics: Number(verifiedClinicCount[0]?.count ?? 0),
        doctors: Number(doctorCount[0]?.count ?? 0),
        reviews: Number(reviewCount[0]?.count ?? 0),
        pendingReviews: Number(pendingReviewCount[0]?.count ?? 0),
        leads: Number(leadCount[0]?.count ?? 0),
        questions: Number(questionCount[0]?.count ?? 0),
        treatments: Number(treatmentCount[0]?.count ?? 0),
        users: Number(userCount[0]?.count ?? 0),
      },
      settings: settingsMap,
    });
  } catch (err) {
    console.error('Admin settings error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Allowlist of site-settings keys writable from the admin panel.
// Anything not on this list is rejected so a compromised admin client
// or sloppy POST body can't pollute the table with arbitrary keys.
const ALLOWED_SETTING_KEYS = new Set([
  'site_name', 'site_url', 'site_tagline', 'site_description', 'site_logo_url',
  'support_email', 'contact_email', 'contact_phone',
  'meta_title_suffix', 'default_og_image',
  'analytics_enabled', 'posthog_key', 'gtm_id',
  // Tracking codes (admin → /admin/tracking). Keep both raw IDs and full snippets.
  'tracking_ga4_id', 'tracking_gtm_id', 'tracking_meta_pixel_id',
  'tracking_google_site_verification', 'tracking_bing_site_verification',
  'tracking_head_code', 'tracking_body_open_code', 'tracking_body_close_code',
  'tracking_enabled',
  'feature_flags', 'experiments_enabled',
  'maintenance_mode', 'maintenance_message',
  'newsletter_provider', 'newsletter_from_email', 'newsletter_from_name',
  'lead_magnet_enabled', 'callback_modal_enabled',
  'social_facebook', 'social_twitter', 'social_instagram', 'social_linkedin', 'social_youtube',
  'business_address', 'business_hours',
  'consent_banner_enabled', 'consent_banner_text',
  'review_auto_approve_threshold',
  'ranking_weights',
  // Branding & Identity
  'branding_site_name', 'branding_tagline', 'branding_primary_color', 'branding_logo_url',
  // Social URL variants (Settings page sends these)
  'social_twitter_url', 'social_facebook_url', 'social_linkedin_url',
  'social_instagram_url', 'social_youtube_url',
  // Analytics & Tracking variants (Settings page sends these)
  'analytics_ga4_id', 'analytics_gsc_url', 'analytics_fb_pixel_id',
  'analytics_hotjar_id', 'analytics_hubspot_embed',
  // SEO Defaults
  'seo_default_title', 'seo_default_description', 'seo_default_og_image', 'seo_canonical_base_url',
  // Cookie & Privacy
  'cookie_banner_enabled', 'cookie_consent_text', 'cookie_privacy_url',
  // Sitemap & Crawling
  'sitemap_enabled', 'robots_txt',
  // Email
  'from_email', 'reply_to_email',
  'meta_title_template', 'meta_description',
]);

// Save settings to siteSettings table
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, unknown> };

    if (!settings || typeof settings !== 'object') {
      return json({ error: 'Invalid settings payload' }, 400);
    }

    const now = new Date();
    const entries = Object.entries(settings).filter(([k]) => ALLOWED_SETTING_KEYS.has(k));
    const rejected = Object.keys(settings).filter(k => !ALLOWED_SETTING_KEYS.has(k));

    if (entries.length === 0) {
      return json({ error: 'No allowed settings keys in payload', rejected }, 400);
    }

    for (const [key, value] of entries) {
      await db
        .insert(siteSettings)
        .values({
          key,
          value: value as any,
          updatedBy: session!.userId,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: {
            value: value as any,
            updatedBy: session!.userId,
            updatedAt: now,
          },
        });
    }

    return json({ success: true, updated: entries.length, rejected });
  } catch (err) {
    console.error('Settings save error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
