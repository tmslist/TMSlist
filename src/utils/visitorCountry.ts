import type { AstroCookies } from 'astro';

export const SUPPORTED_COUNTRIES = [
    'US','GB','CA','AU','DE','IN','FR','JP','KR','BR','ES','IT','NL','SG','AE','NZ','ZA','SE','IE','IL','MX',
] as const;

export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

const SET = new Set<string>(SUPPORTED_COUNTRIES);

/**
 * Resolve the visitor's country for SSR pages.
 * Order: ?country= URL override → x-country cookie (set by middleware/geo.js) → 'US' fallback.
 * Always returns one of SUPPORTED_COUNTRIES.
 *
 * Pass `cookies = null` (or skip it) on prerendered pages — reading cookies
 * during prerender triggers Astro's request.headers warning and would only
 * bake in the build-time cookie state anyway. Prerendered pages get the
 * real country client-side via geo.js.
 */
export function getVisitorCountry(
    cookies: AstroCookies | null,
    url: URL,
): SupportedCountry {
    const urlCountry = url.searchParams.get('country')?.toUpperCase();
    if (urlCountry && SET.has(urlCountry)) return urlCountry as SupportedCountry;
    if (cookies) {
        const cookieCountry = cookies.get('x-country')?.value?.toUpperCase();
        if (cookieCountry && SET.has(cookieCountry)) return cookieCountry as SupportedCountry;
    }
    return 'US';
}
