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

    // Read ?country= param for local dev override (e.g. ?country=IN)
    // geo.js handles all timezone-based detection client-side
    const urlCountry = context.url.searchParams.get('country')?.toUpperCase();
    if (urlCountry && SUPPORTED_COUNTRIES.includes(urlCountry)) {
        context.cookies.set('x-country', urlCountry, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: false,
            secure: false, // localhost
            sameSite: 'lax',
        });
        return response;
    }

    // geo.js sets the cookie client-side via timezone detection
    // On Vercel, x-vercel-ip-country header would also be used if available
    const vercelCountry = context.request.headers.get('x-vercel-ip-country')?.toUpperCase();
    if (vercelCountry && SUPPORTED_COUNTRIES.includes(vercelCountry)) {
        context.cookies.set('x-country', vercelCountry, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
    }

    return response;
});
