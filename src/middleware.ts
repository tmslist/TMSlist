import { defineMiddleware } from 'astro:middleware';

const SUPPORTED_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'IN'];

export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();

    // Prevent caching on portal/admin pages to avoid stale auth state
    const pathname = context.url.pathname;
    if (pathname.startsWith('/portal/') || pathname.startsWith('/admin/')) {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
    }

    // Skip non-HTML responses for geo cookie logic
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    // Check if cookie already set
    const existingCookie = context.cookies.get('x-country');
    if (existingCookie?.value) return response;

    // Detect country from Vercel's geo header (automatically provided on Vercel)
    let country = context.request.headers.get('x-vercel-ip-country')?.toUpperCase() || 'US';

    // Normalize: if not a supported country, default to US
    if (!SUPPORTED_COUNTRIES.includes(country)) {
        country = 'US';
    }

    // Set cookie for client-side geo detection (1 year, accessible from JS)
    context.cookies.set('x-country', country, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
    });

    return response;
});
