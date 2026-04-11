import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { doctors } from '../../../db/schema';
import { isNotNull } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const allDoctors = await db
      .select({
        slug: doctors.slug,
        createdAt: doctors.createdAt,
      })
      .from(doctors)
      .where(isNotNull(doctors.slug));

    const urls = allDoctors.map(doctor => {
      const lastmod = doctor.createdAt ? new Date(doctor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      return `  <url>
    <loc>https://tmslist.com/doctor/${doctor.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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
    console.error('Sitemap doctors error:', err);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
};
