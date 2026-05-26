import type { APIRoute } from 'astro';
import { getAllClinics } from '../utils/dataHelpers';

export const GET: APIRoute = async () => {
  const base = 'https://tmslist.com';
  const now = new Date().toISOString().split('T')[0];
  const clinics = await getAllClinics();

  const urls = clinics.map(clinic => {
    if (!clinic.slug) return '';
    const loc = `${base}/clinic/${clinic.slug}/`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
