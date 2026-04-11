import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics } from '../../../db/schema';
import { eq, isNull } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const allClinics = await db
      .select({
        slug: clinics.slug,
        state: clinics.state,
        city: clinics.city,
        country: clinics.country,
        verified: clinics.verified,
        isFeatured: clinics.isFeatured,
        updatedAt: clinics.updatedAt,
      })
      .from(clinics)
      .where(isNull(clinics.deletedAt));

    const urls = allClinics.map(clinic => {
      const priority = clinic.isFeatured ? '0.9' : clinic.verified ? '0.8' : '0.6';
      const changefreq = clinic.isFeatured ? 'daily' : clinic.verified ? 'weekly' : 'monthly';
      const stateSlug = clinic.state.toLowerCase().replace(/\s+/g, '-');
      const citySlug = clinic.city.toLowerCase().replace(/\s+/g, '-');
      const countryPrefix = (clinic.country || 'US').toLowerCase();
      const lastmod = clinic.updatedAt ? new Date(clinic.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      return `  <url>
    <loc>https://tmslist.com/${countryPrefix}/${stateSlug}/${citySlug}/${clinic.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Sitemap clinics error:', err);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
};
