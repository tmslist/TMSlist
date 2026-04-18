import type { APIRoute } from 'astro';
import { getAllDoctors } from '../utils/dataHelpers';

export const GET: APIRoute = async () => {
  const base = 'https://tmslist.com';
  const doctors = await getAllDoctors();

  const urls = doctors.map(doctor => {
    if (!doctor.slug) return '';
    return `  <url>
    <loc>${base}/specialist/${doctor.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};