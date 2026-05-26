import { defineMiddleware } from 'astro:middleware';
import { validateSessionStrict, hasRole } from './utils/auth';

const SUPPORTED_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'IN', 'FR', 'JP', 'KR', 'BR', 'ES', 'IT', 'NL', 'SG', 'AE', 'NZ', 'ZA', 'SE', 'IE', 'IL', 'MX'];

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

export const onRequest = defineMiddleware(async (context, next) => {
    const pathname = context.url.pathname;

    // ── Strict auth gate for admin API ──────────────────────────────
    // Every /api/admin/* request must present a session that is BOTH a
    // valid JWT AND backed by a row in the `sessions` allowlist. This
    // means logout / invalidateAllUserSessions actually revokes the
    // cookie before its 7-day JWT expiry. Endpoint-level role checks
    // remain in place for defense in depth.
    if (pathname.startsWith('/api/admin/')) {
        const session = await validateSessionStrict(context.request);
        if (!session) {
            return json({ error: 'Unauthorized' }, 401);
        }
        if (!hasRole(session, 'admin', 'editor')) {
            return json({ error: 'Forbidden' }, 403);
        }
        // Block impersonation cookies from hitting destructive admin APIs
        // (impersonation gives the impersonator the target user's role; we
        // refuse to use that elevated role on admin mutation endpoints).
        if (session.isImpersonation && context.request.method !== 'GET') {
            return json({ error: 'Impersonation cannot mutate admin resources' }, 403);
        }
    }

    // Skip geo cookie logic for prerendered pages — request headers and
    // response cookies are meaningless at build time and would be baked
    // into static HTML. Bail out *before* next() so render-time access
    // never trips the prerender header warning.
    if (context.isPrerendered) {
        return await next();
    }

    const response = await next();

    // Prevent caching on portal/admin pages to avoid stale auth state
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
