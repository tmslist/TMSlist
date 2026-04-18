import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const base = 'https://tmslist.com';
  const now = new Date().toISOString().split('T')[0];

  const sitemaps = [
    { loc: `${base}/sitemap-static.xml`, lastmod: now },
    { loc: `${base}/sitemap-locations.xml`, lastmod: now },
    { loc: `${base}/sitemap-clinics.xml`, lastmod: now },
    { loc: `${base}/sitemap-doctors.xml`, lastmod: now },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
              xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemaps.map(s => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};