import { defineMiddleware } from 'astro:middleware';

const SUPPORTED_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'IN', 'FR', 'JP', 'KR', 'BR', 'ES', 'IT', 'NL', 'SG', 'AE', 'NZ', 'ZA', 'SE', 'IE', 'IL', 'MX'];

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
    if (existingCookie?.value && SUPPORTED_COUNTRIES.includes(existingCookie.value)) {
        return response;
    }

    // Detect country — priority: (1) ?country= query param (for local dev testing),
    // (2) x-vercel-ip-country header (on Vercel), (3) 'US' fallback
    let country = 'US';

    // Dev override: ?country=IN on any URL
    const urlCountry = context.url.searchParams.get('country')?.toUpperCase();
    if (urlCountry && SUPPORTED_COUNTRIES.includes(urlCountry)) {
        country = urlCountry;
    } else {
        // On Vercel: auto-injected geo header
        const vercelCountry = context.request.headers.get('x-vercel-ip-country')?.toUpperCase();
        if (vercelCountry && SUPPORTED_COUNTRIES.includes(vercelCountry)) {
            country = vercelCountry;
        }
    }

    // Set cookie for client-side geo detection (1 year, accessible from JS)
    context.cookies.set('x-country', country, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
        sameSite: 'lax',
    });

    return response;
});
