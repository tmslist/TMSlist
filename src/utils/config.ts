export const SITE_URL = import.meta.env.SITE_URL || 'https://tmslist.com';

export const config = {
  siteName: 'TMS List',
  siteUrl: SITE_URL,
  defaultDescription: 'Find FDA-cleared TMS therapy clinics near you. Compare verified providers, read reviews, and start your depression treatment journey.',
  defaultImage: '/images/tms-og-image.png',
} as const;
