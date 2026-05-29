import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.ts';

export const prerender = false;

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  element?: string;
  recommendation: string;
  status: 'open' | 'fixed';
}

interface PageAudit {
  url: string;
  score: number;
  issues: AuditIssue[];
  scannedAt: string;
}

// In-memory store for audits (persists during server runtime)
const auditStore = new Map<string, PageAudit>();

function parseAuditIssues(
  html: string,
  url: string
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Title tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!titleMatch) {
    issues.push({
      type: 'error',
      category: 'Title',
      message: 'Title tag is missing',
      element: '<title>',
      recommendation: 'Add a unique, descriptive title tag for this page.',
      status: 'open',
    });
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 30) {
      issues.push({
        type: 'warning',
        category: 'Title',
        message: `Title tag is ${title.length} characters (recommended: 50-60)`,
        element: `<title>${title}</title>`,
        recommendation: 'Expand title to 50-60 characters for clarity.',
        status: 'open',
      });
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'Title',
        message: `Title tag is ${title.length} characters (recommended: 50-60)`,
        element: `<title>${title}</title>`,
        recommendation: 'Shorten title to 50-60 characters.',
        status: 'open',
      });
    }
  }

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDescAltMatch = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDesc = metaDescMatch?.[1] ?? metaDescAltMatch?.[1];

  if (!metaDesc) {
    issues.push({
      type: 'error',
      category: 'Meta Tags',
      message: 'Meta description is missing',
      element: '<meta name="description">',
      recommendation: 'Add a meta description between 120-160 characters.',
      status: 'open',
    });
  } else if (metaDesc.length < 120) {
    issues.push({
      type: 'warning',
      category: 'Meta Tags',
      message: `Meta description is ${metaDesc.length} characters (recommended: 120-160)`,
      element: `<meta name="description">`,
      recommendation: 'Expand meta description to between 120-160 characters.',
      status: 'open',
    });
  } else if (metaDesc.length > 160) {
    issues.push({
      type: 'info',
      category: 'Meta Tags',
      message: `Meta description is ${metaDesc.length} characters (recommended: 120-160)`,
      element: `<meta name="description">`,
      recommendation: 'Trim meta description to 120-160 characters.',
      status: 'open',
    });
  }

  // H1 tags
  const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gi);
  const h1Count = h1Matches ? h1Matches.length : 0;
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      category: 'Headings',
      message: 'No H1 tag found',
      element: '<h1>',
      recommendation: 'Add exactly one H1 tag describing the page content.',
      status: 'open',
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'error',
      category: 'Headings',
      message: `Multiple H1 tags found (${h1Count})`,
      element: '<h1>',
      recommendation: 'Each page should have exactly one H1 tag.',
      status: 'open',
    });
  }

  // Open Graph image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const ogImageAltMatch = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
  if (!ogImageMatch && !ogImageAltMatch) {
    issues.push({
      type: 'warning',
      category: 'Open Graph',
      message: 'og:image meta tag is missing',
      element: '<meta property="og:image">',
      recommendation: 'Add an og:image tag for social sharing.',
      status: 'open',
    });
  }

  // Canonical tag
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (!canonicalMatch) {
    issues.push({
      type: 'warning',
      category: 'Links',
      message: 'Canonical tag is missing',
      element: '<link rel="canonical">',
      recommendation: 'Add a canonical tag to prevent duplicate content issues.',
      status: 'open',
    });
  }

  // Robots meta
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const robotsAltMatch = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/i);
  const robotsContent = robotsMatch?.[1] ?? robotsAltMatch?.[1];

  if (robotsContent && robotsContent.toLowerCase().includes('noindex')) {
    issues.push({
      type: 'info',
      category: 'Indexing',
      message: 'Page is set to noindex',
      element: '<meta name="robots">',
      recommendation: 'Remove noindex if this page should be indexed.',
      status: 'open',
    });
  }

  // Structured data (JSON-LD)
  const hasSchema = html.includes('application/ld+json');
  if (!hasSchema) {
    issues.push({
      type: 'info',
      category: 'Schema',
      message: 'Missing structured data (JSON-LD)',
      element: '<script type="application/ld+json">',
      recommendation: 'Add structured data for better search visibility.',
      status: 'open',
    });
  }

  // Images missing alt
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imgsWithoutAlt = imgMatches.filter(img => {
    const altMatch = img.match(/\balt=["']([^"']*)["']/i);
    return !altMatch || altMatch[1].trim() === '';
  });
  if (imgsWithoutAlt.length > 0) {
    issues.push({
      type: 'warning',
      category: 'Images',
      message: `${imgsWithoutAlt.length} image(s) missing alt attributes`,
      element: '<img>',
      recommendation: 'Add descriptive alt text to all images.',
      status: 'open',
    });
  }

  return issues;
}

function calculateScore(issues: AuditIssue[]): number {
  const errorWeight = 15;
  const warningWeight = 5;
  const infoWeight = 2;

  const totalDeduction = issues.reduce((sum, issue) => {
    if (issue.type === 'error') return sum + errorWeight;
    if (issue.type === 'warning') return sum + warningWeight;
    return sum + infoWeight;
  }, 0);

  return Math.max(0, 100 - totalDeduction);
}

async function runAudit(targetUrl: string): Promise<PageAudit> {
  const urlToFetch = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

  let html: string;
  try {
    const response = await fetch(urlToFetch, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TMSListSEOAuditor/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    html = await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err instanceof Error ? err.message : String(err)}`);
  }

  const issues = parseAuditIssues(html, targetUrl);
  const score = calculateScore(issues);

  return {
    url: targetUrl,
    score,
    issues,
    scannedAt: new Date().toISOString(),
  };
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const audits = Array.from(auditStore.values()).sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  );

  return new Response(JSON.stringify({ data: audits }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audit = await runAudit(url);

    // Store in memory with URL as key (overwrites previous scan of same URL)
    auditStore.set(url, audit);

    return new Response(JSON.stringify({ data: audit }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('SEO audit error:', err);
    const message = err instanceof Error ? err.message : 'Audit failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
