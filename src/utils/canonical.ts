const SITE_URL = 'https://tmslist.com';

export function getCanonicalUrl(path: string): string {
  // Remove trailing slashes (except root), remove query params, lowercase
  let clean = path.split('?')[0].toLowerCase().replace(/\/+$/, '') || '/';
  return `${SITE_URL}${clean}`;
}

export function getAlternateUrls(path: string): { hreflang: string; href: string }[] {
  const countryPrefixes: Record<string, string> = {
    '/us': 'en-US',
    '/uk': 'en-GB',
    '/ca': 'en-CA',
    '/au': 'en-AU',
    '/de': 'de-DE',
    '/fr': 'fr-FR',
    '/es': 'es-ES',
    '/it': 'it-IT',
    '/nl': 'nl-NL',
    '/se': 'sv-SE',
    '/jp': 'ja-JP',
    '/kr': 'ko-KR',
    '/in': 'en-IN',
    '/mx': 'es-MX',
    '/nz': 'en-NZ',
    '/sg': 'en-SG',
    '/ae': 'ar-AE',
    '/za': 'en-ZA',
    '/ie': 'en-IE',
    '/il': 'he-IL',
  };

  const results: { hreflang: string; href: string }[] = [];
  for (const [prefix, hreflang] of Object.entries(countryPrefixes)) {
    results.push({ hreflang, href: `${SITE_URL}${prefix}` });
  }
  results.push({ hreflang: 'x-default', href: `${SITE_URL}/us` });
  return results;
}
