import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { like } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const CAMPAIGN_PREFIX = 'campaign_';

interface CampaignData {
  name: string;
  slug: string;
  headline: string;
  description: string;
  targetState?: string;
  targetCondition?: string;
  ctaText: string;
  active: boolean;
  createdAt: string;
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(like(siteSettings.key, `${CAMPAIGN_PREFIX}%`));

    const campaigns = rows.map((r) => ({
      key: r.key,
      ...(r.value as CampaignData),
    }));

    return new Response(JSON.stringify({ campaigns }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Campaign list error:', err);
    return new Response(JSON.stringify({ error: 'Failed to list campaigns' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await request.json();
    const { name, slug, headline, description, targetState, targetCondition, ctaText, active } = body;

    if (!name || !slug || !headline) {
      return new Response(
        JSON.stringify({ error: 'name, slug, and headline are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const key = `${CAMPAIGN_PREFIX}${cleanSlug}`;

    const campaignData: CampaignData = {
      name,
      slug: cleanSlug,
      headline,
      description: description || '',
      targetState: targetState || undefined,
      targetCondition: targetCondition || undefined,
      ctaText: ctaText || 'Find a Provider',
      active: active !== false,
      createdAt: new Date().toISOString(),
    };

    await db
      .insert(siteSettings)
      .values({
        key,
        value: campaignData as any,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: campaignData as any,
          updatedAt: new Date(),
        },
      });

    return new Response(
      JSON.stringify({ success: true, campaign: { key, ...campaignData } }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Campaign create error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create campaign' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
