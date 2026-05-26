// Brand logo registry — maps slugs to canonical domains and local logo files.
// Local files (in /public/logos/) are preferred. Domain enables a Clearbit/favicon
// fallback for brands without a hosted asset.

export interface BrandInfo {
  domain: string;
  name: string;
  /** Path under /public, e.g. /logos/aetna.svg. Preferred over remote sources. */
  logo?: string;
  /** Set true if the logo is white-on-transparent and needs inversion on light bg. */
  invertOnLight?: boolean;
}

const DEVICE_BRANDS: Record<string, BrandInfo> = {
  'neurostar':           { domain: 'neurostar.com',     name: 'NeuroStar',  logo: '/logos/neurostar.svg' },
  'brainsway':           { domain: 'brainsway.com',     name: 'BrainsWay',  logo: '/logos/brainsway.png' },
  'brainsway-deep-tms':  { domain: 'brainsway.com',     name: 'BrainsWay',  logo: '/logos/brainsway.png' },
  'magventure':          { domain: 'magventure.com',    name: 'MagVenture', logo: '/logos/magventure.svg', invertOnLight: true },
  'magstim':             { domain: 'magstim.com',       name: 'Magstim',    logo: '/logos/magstim.svg' },
  'cloudtms':            { domain: 'cloudtms.com',      name: 'CloudTMS' },
  'nexstim':             { domain: 'nexstim.com',       name: 'Nexstim',    logo: '/logos/nexstim.svg' },
  'apollo-tms':          { domain: 'magandmore.com',    name: 'Apollo TMS', logo: '/logos/apollo-tms.png' },
  'exomind':             { domain: 'btlaesthetics.com', name: 'Exomind' },
  'neurosoft':           { domain: 'neurosoft.com',     name: 'Neurosoft',  logo: '/logos/neurosoft.png' },
};

const INSURANCE_BRANDS: Record<string, BrandInfo> = {
  'medicare':              { domain: 'medicare.gov',           name: 'Medicare',           logo: '/logos/medicare.svg' },
  'medicaid':              { domain: 'medicaid.gov',           name: 'Medicaid',           logo: '/logos/medicaid.svg' },
  'tricare':               { domain: 'tricare.mil',            name: 'Tricare',            logo: '/logos/tricare.svg' },
  'bluecross-blueshield':  { domain: 'bcbs.com',               name: 'Blue Cross Blue Shield', logo: '/logos/bluecross-blueshield.svg' },
  'aetna':                 { domain: 'aetna.com',              name: 'Aetna',              logo: '/logos/aetna.svg' },
  'cigna':                 { domain: 'cigna.com',              name: 'Cigna',              logo: '/logos/cigna.png' },
  'united-healthcare':     { domain: 'uhc.com',                name: 'UnitedHealthcare',   logo: '/logos/united-healthcare.svg' },
  'kaiser-permanente':     { domain: 'kp.org',                 name: 'Kaiser Permanente',  logo: '/logos/kaiser-permanente.svg' },
  'humana':                { domain: 'humana.com',             name: 'Humana',             logo: '/logos/humana.svg' },
  'optum-uhc':             { domain: 'optum.com',              name: 'Optum',              logo: '/logos/optum.svg' },
  'anthem-bcbs':           { domain: 'anthem.com',             name: 'Anthem BCBS',        logo: '/logos/anthem-bcbs.svg' },
  'florida-bcbs':          { domain: 'floridablue.com',        name: 'Florida Blue' },
  'texas-bcbs':            { domain: 'bcbstx.com',             name: 'BCBS of Texas',      logo: '/logos/texas-bcbs.svg' },
  'illinois-bluecross-tms-policy': { domain: 'bcbsil.com',     name: 'BCBS of Illinois' },
  'michigan-blue-care-network-tms': { domain: 'mibluecrosscomplete.com', name: 'BCN Michigan' },
  'medicare-advantage':    { domain: 'medicare.gov',           name: 'Medicare Advantage', logo: '/logos/medicare.svg' },
  'workers-comp':          { domain: 'dol.gov',                name: 'Workers Compensation' },
  'hsa-fsa-tms':           { domain: 'hsabank.com',            name: 'HSA / FSA' },
};

const REGISTRY: Record<string, BrandInfo> = {
  ...DEVICE_BRANDS,
  ...INSURANCE_BRANDS,
};

export function getBrand(slug: string): BrandInfo | undefined {
  return REGISTRY[slug];
}

/**
 * Resolve a free-text machine or insurance name (e.g. "NeuroStar Advanced Therapy",
 * "Blue Cross Blue Shield of Texas", "BrainsWay Deep TMS") to a registry slug.
 * Returns the slug if matched, otherwise the input lowercased/slugified for fallback rendering.
 */
export function resolveBrandSlug(name: string): string {
  if (!name) return '';
  const lower = name.toLowerCase();

  // Ordered match list — longer/more specific patterns first
  const patterns: Array<[RegExp, string]> = [
    [/neurostar/, 'neurostar'],
    [/brainsway|deep\s*tms/, 'brainsway'],
    [/magventure|mag\s*venture/, 'magventure'],
    [/magstim|mag\s*stim/, 'magstim'],
    [/cloudtms|cloud\s*tms/, 'cloudtms'],
    [/nexstim/, 'nexstim'],
    [/apollo/, 'apollo-tms'],
    [/exomind/, 'exomind'],
    [/neurosoft/, 'neurosoft'],

    [/(florida\s*blue|bcbs.*florida|florida.*bcbs|bcbsfl)/, 'florida-bcbs'],
    [/(bcbs.*texas|texas.*bcbs|bcbstx|blue\s*cross.*texas)/, 'texas-bcbs'],
    [/(bcbs.*illinois|illinois.*bcbs|bcbsil)/, 'illinois-bluecross-tms-policy'],
    [/(michigan.*blue|blue\s*care.*network)/, 'michigan-blue-care-network-tms'],
    [/anthem/, 'anthem-bcbs'],
    [/(blue\s*cross|bcbs)/, 'bluecross-blueshield'],
    [/medicare\s*advantage/, 'medicare-advantage'],
    [/medicare/, 'medicare'],
    [/medicaid/, 'medicaid'],
    [/tricare/, 'tricare'],
    [/aetna/, 'aetna'],
    [/cigna/, 'cigna'],
    [/(unitedhealthcare|united\s*healthcare|uhc)/, 'united-healthcare'],
    [/kaiser/, 'kaiser-permanente'],
    [/humana/, 'humana'],
    [/optum/, 'optum-uhc'],
    [/(hsa|fsa)/, 'hsa-fsa-tms'],
    [/(workers.*comp)/, 'workers-comp'],
  ];

  for (const [re, slug] of patterns) {
    if (re.test(lower)) return slug;
  }
  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Remote logo URL via Clearbit (fallback for brands without a local asset). */
export function getLogoUrl(domain: string, size = 128): string {
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

export function getFaviconFallbackUrl(domain: string, size = 128): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}
