/**
 * Internationalization utilities.
 *
 * Currently the site is English-only. This module provides the infrastructure
 * for future translations without requiring changes to page templates.
 *
 * Usage in Astro pages:
 *   import { t, getLocaleFromPath } from '../utils/i18n';
 *   const locale = getLocaleFromPath(Astro.url.pathname);
 *   <h2>{t('browse_by_region', locale)}</h2>
 */

export type Locale = 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'pt-BR' | 'ja' | 'ko' | 'sv';

const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  us: 'en', uk: 'en', ca: 'en', au: 'en', nz: 'en', za: 'en',
  ie: 'en', sg: 'en', in: 'en', ae: 'en', il: 'en',
  de: 'de', fr: 'fr', es: 'es', it: 'it', nl: 'nl',
  br: 'pt-BR', mx: 'es', jp: 'ja', kr: 'ko', se: 'sv',
};

export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split('/')[1];
  return COUNTRY_TO_LOCALE[segment] || 'en';
}

// Translation strings — extend as translations are added
const translations: Record<string, Record<Locale, string>> = {
  browse_by_region: {
    en: 'Browse by Region',
    de: 'Nach Region durchsuchen',
    fr: 'Parcourir par région',
    es: 'Explorar por región',
    it: 'Sfoglia per regione',
    nl: 'Zoek op regio',
    'pt-BR': 'Navegar por região',
    ja: '地域で探す',
    ko: '지역별 검색',
    sv: 'Bläddra efter region',
  },
  top_rated_clinics: {
    en: 'Top Rated Clinics',
    de: 'Bestbewertete Kliniken',
    fr: 'Cliniques les mieux notées',
    es: 'Clínicas mejor valoradas',
    it: 'Cliniche più votate',
    nl: 'Best beoordeelde klinieken',
    'pt-BR': 'Clínicas mais bem avaliadas',
    ja: '最高評価のクリニック',
    ko: '최고 평점 클리닉',
    sv: 'Topprankade kliniker',
  },
  related_resources: {
    en: 'Related Resources',
    de: 'Verwandte Ressourcen',
    fr: 'Ressources associées',
    es: 'Recursos relacionados',
    it: 'Risorse correlate',
    nl: 'Gerelateerde bronnen',
    'pt-BR': 'Recursos relacionados',
    ja: '関連リソース',
    ko: '관련 자료',
    sv: 'Relaterade resurser',
  },
  find_tms_clinics: {
    en: 'Find TMS Clinics',
    de: 'TMS-Kliniken finden',
    fr: 'Trouver des cliniques TMS',
    es: 'Encontrar clínicas de TMS',
    it: 'Trova cliniche TMS',
    nl: 'TMS-klinieken vinden',
    'pt-BR': 'Encontrar clínicas de TMS',
    ja: 'TMSクリニックを探す',
    ko: 'TMS 클리닭 찾기',
    sv: 'Hitta TMS-kliniker',
  },
  view_clinic: {
    en: 'View Clinic',
    de: 'Klinik ansehen',
    fr: 'Voir la clinique',
    es: 'Ver clínica',
    it: 'Vedi clinica',
    nl: 'Bekijk kliniek',
    'pt-BR': 'Ver clínica',
    ja: 'クリニックを見る',
    ko: '클리닉 보기',
    sv: 'Visa klinik',
  },
  verified_clinic: {
    en: 'Verified Clinic',
    de: 'Verifizierte Klinik',
    fr: 'Clinique vérifiée',
    es: 'Clínica verificada',
    it: 'Clinica verificata',
    nl: 'Geverifieerde kliniek',
    'pt-BR': 'Clínica verificada',
    ja: '認証済みクリニック',
    ko: '인증 클리닉',
    sv: 'Verifierad klinik',
  },
  reviews: {
    en: 'reviews',
    de: 'Bewertungen',
    fr: 'avis',
    es: 'reseñas',
    it: 'recensioni',
    nl: 'beoordelingen',
    'pt-BR': 'avaliações',
    ja: 'レビュー',
    ko: '리뷰',
    sv: 'recensioner',
  },
  conditions_treated: {
    en: 'Conditions Treated with TMS',
    de: 'Mit TMS behandelte Erkrankungen',
    fr: 'Affections traitées par TMS',
    es: 'Condiciones tratadas con TMS',
    it: 'Condizioni trattate con TMS',
    nl: 'Aandoeningen behandeld met TMS',
    'pt-BR': 'Condições tratadas com TMS',
    ja: 'TMSで治療できる疾患',
    ko: 'TMS로 치료 가능한 질환',
    sv: 'Tillstånd som behandlas med TMS',
  },
  insurance_coverage: {
    en: 'Insurance Coverage',
    de: 'Versicherungsabdeckung',
    fr: 'Couverture d\'assurance',
    es: 'Cobertura de seguro',
    it: 'Copertura assicurativa',
    nl: 'Verzekeringsdekking',
    'pt-BR': 'Cobertura do seguro',
    ja: '保険適用',
    ko: '보험 적용',
    sv: 'Försäkringsskydd',
  },
  am_i_candidate: {
    en: 'Am I a Candidate?',
    de: 'Bin ich ein Kandidat?',
    fr: 'Suis-je éligible ?',
    es: '¿Soy candidato?',
    it: 'Sono un candidato?',
    nl: 'Kom ik in aanmerking?',
    'pt-BR': 'Sou um candidato?',
    ja: '私は候補者ですか？',
    ko: '나는 후보자인가요?',
    sv: 'Är jag en kandidat?',
  },
};

/**
 * Get translated string. Falls back to English if translation missing.
 */
export function t(key: string, locale: Locale = 'en'): string {
  return translations[key]?.[locale] || translations[key]?.en || key;
}

/**
 * Get all available translations for a key (for debugging/admin).
 */
export function getAllTranslations(key: string): Record<Locale, string> | undefined {
  return translations[key] as Record<Locale, string> | undefined;
}

/**
 * Format number with locale-appropriate separators.
 */
export function formatNumber(n: number, locale: Locale = 'en'): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
    it: 'it-IT', nl: 'nl-NL', 'pt-BR': 'pt-BR', ja: 'ja-JP',
    ko: 'ko-KR', sv: 'sv-SE',
  };
  return n.toLocaleString(localeMap[locale] || 'en-US');
}

/**
 * Get currency symbol for a country.
 */
export function getCurrencySymbol(countryCode: string): string {
  const map: Record<string, string> = {
    US: '$', CA: 'CA$', UK: '£', GB: '£', AU: 'A$', NZ: 'NZ$',
    DE: '€', FR: '€', ES: '€', IT: '€', NL: '€', IE: '€',
    BR: 'R$', MX: 'MX$', JP: '¥', KR: '₩', IN: '₹',
    SG: 'S$', AE: 'AED', IL: '₪', ZA: 'R', SE: 'kr',
  };
  return map[countryCode.toUpperCase()] || '$';
}
