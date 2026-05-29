import { TREATMENT_SLUGS, INSURANCE_SLUGS, COMPARE_SLUGS, DEMOGRAPHIC_SLUGS, PROTOCOL_SLUGS, RESEARCH_SLUGS, STORIES_SLUGS, TECHNOLOGY_SLUGS, UTILITY_SLUGS, TOOL_SLUGS, ALTERNATIVE_SLUGS, PROVIDER_SLUGS } from './seo_slugs';

const siteUrl = import.meta.env.SITE_URL || 'https://tmslist.com';

// ─── Organisation Schema ───────────────────────────────────────────────────────

export function buildOrganisationSchema(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://tmslist.com/#organization',
    'name': 'TMS List',
    'url': 'https://tmslist.com',
    'logo': 'https://tmslist.com/logotmslist.png',
    'description': 'The leading directory of TMS (Transcranial Magnetic Stimulation) therapy providers. Find verified TMS clinics, compare treatments, and learn about insurance coverage.',
    'sameAs': [
      'https://twitter.com/tmslist',
      'https://www.linkedin.com/company/tmslist',
      'https://www.facebook.com/tmslist',
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
      'url': 'https://tmslist.com/contact/',
      'areaServed': 'US',
    },
    'areaServed': {
      '@type': 'Country',
      'name': 'United States',
    },
    'knowsAbout': [
      {
        '@type': 'Thing',
        'name': 'Transcranial Magnetic Stimulation (TMS)',
        'description': 'A non-invasive neuromodulation technique using magnetic pulses to stimulate the brain',
      },
      {
        '@type': 'Thing',
        'name': 'Treatment-Resistant Depression',
        'description': 'Depression that has not responded to at least two antidepressant trials',
      },
    ],
  });
}

// ─── LocalBusiness Schema (Clinic Listings) ───────────────────────────────────

interface ClinicSchema {
  name: string;
  slug: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  website?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
}

export function buildLocalBusinessSchema(clinic: ClinicSchema): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    '@id': `${siteUrl}/clinic/${clinic.slug}/`,
    'name': clinic.name,
    'url': `${siteUrl}/clinic/${clinic.slug}/`,
  };

  if (clinic.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...clinic.address,
      addressCountry: clinic.address.addressCountry || 'US',
    };
  }

  if (clinic.telephone) schema.telephone = clinic.telephone;
  if (clinic.website) schema.url = clinic.website;
  if (clinic.image) schema.image = clinic.image;
  if (clinic.priceRange) schema.priceRange = clinic.priceRange;

  if (clinic.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingType: 'Clinic',
      ...clinic.aggregateRating,
    };
  }

  return JSON.stringify(schema);
}

// ─── Physician Schema (Doctor Listings) ───────────────────────────────────────

interface DoctorSchema {
  name: string;
  slug: string;
  jobTitle?: string;
  specialty?: string;
  hospital?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  image?: string;
  bio?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function buildPhysicianSchema(doctor: DoctorSchema): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': `${siteUrl}/doctor/${doctor.slug}/`,
    'name': doctor.name,
    'url': `${siteUrl}/doctor/${doctor.slug}/`,
  };

  if (doctor.jobTitle) {
    schema.jobTitle = doctor.jobTitle;
  }

  schema.medicalSpecialty = doctor.specialty || 'Psychiatry';

  if (doctor.hospital) {
    schema.hospital = {
      '@type': 'Hospital',
      name: doctor.hospital,
    };
  }

  if (doctor.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...doctor.address,
      addressCountry: doctor.address.addressCountry || 'US',
    };
  }

  if (doctor.telephone) schema.telephone = doctor.telephone;
  if (doctor.image) schema.image = doctor.image;
  if (doctor.bio) schema.description = doctor.bio;

  if (doctor.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingType: 'Doctor',
      ...doctor.aggregateRating,
    };
  }

  return JSON.stringify(schema);
}

// ─── MedicalCondition Schema (Treatment Pages) ────────────────────────────────

interface ConditionSchema {
  name: string;
  alternateName?: string;
  description: string;
  fdaCleared?: boolean;
  successRate?: string;
  responseRate?: string;
  brainArea?: string;
  sessions?: string;
  treatedBy?: string;
}

export function buildMedicalConditionSchema(condition: ConditionSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    '@id': `${siteUrl}/treatments/${condition.name.toLowerCase().replace(/\s+/g, '-')}/`,
    'name': condition.name,
    'alternateName': condition.alternateName,
    'description': condition.description,
    '可能的Treatment': {
      '@type': 'MedicalTherapy',
      'name': condition.treatedBy || 'Transcranial Magnetic Stimulation (TMS)',
      'description': 'Non-invasive brain stimulation using targeted magnetic pulses',
    },
    'signOrSymptom': condition.brainArea ? {
      '@type': 'AnatomicalStructure',
      'name': condition.brainArea,
      'description': 'Brain region targeted during TMS treatment',
    } : undefined,
    'status': condition.fdaCleared ? 'FDA Cleared' : 'Research Phase',
    'relevantTherapy': {
      '@type': 'MedicalTherapy',
      'name': condition.treatedBy || 'Transcranial Magnetic Stimulation (TMS)',
    },
  });
}

// ─── FAQPage Schema ────────────────────────────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQSchema(faqItems: FAQItem[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  });
}

// ─── ComparisonArticle Schema ────────────────────────────────────────────────

interface ComparisonSchema {
  treatmentA: string;
  treatmentB: string;
  description: string;
  winner?: string;
  verdict?: string;
  effectivenessA?: string;
  effectivenessB?: string;
  sideEffectsA?: string;
  sideEffectsB?: string;
  costA?: string;
  costB?: string;
  slug: string;
}

export function buildComparisonSchema(comparison: ComparisonSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${siteUrl}/compare/${comparison.slug}/`,
    'name': `${comparison.treatmentA} vs ${comparison.treatmentB}`,
    'description': comparison.description,
    'articleSection': 'Treatment Comparison',
    'about': [
      {
        '@type': 'Thing',
        'name': comparison.treatmentA,
        ...(comparison.effectivenessA && { description: comparison.effectivenessA }),
      },
      {
        '@type': 'Thing',
        'name': comparison.treatmentB,
        ...(comparison.effectivenessB && { description: comparison.effectivenessB }),
      },
    ],
    'review': {
      '@type': 'Review',
      'reviewRating': {
        '@type': 'Rating',
        'name': comparison.winner ? `${comparison.winner} Rated Higher` : 'Side-by-Side Comparison',
        'bestRating': 5,
        'worstRating': 1,
      },
      'reviewBody': comparison.verdict,
    },
  });
}

// ─── HowTo Schema (Quiz / Calculator Pages) ────────────────────────────────────

interface HowToStep {
  name: string;
  text: string;
}

interface HowToSchema {
  title: string;
  description: string;
  slug: string;
  steps: HowToStep[];
  estimatedTime?: string;
}

export function buildHowToSchema(howTo: HowToSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${siteUrl}/quiz/${howTo.slug}/`,
    'name': howTo.title,
    'description': howTo.description,
    'estimatedCost': {
      '@type': 'MonetaryAmount',
      'currency': 'USD',
      'value': '0',
    },
    'step': howTo.steps.map((step, i) => ({
      '@type': 'HowToStep',
      'position': i + 1,
      'name': step.name,
      'text': step.text,
    })),
    ...(howTo.estimatedTime && { totalTime: howTo.estimatedTime }),
  });
}

// ─── Review/AggregateRating Schema ─────────────────────────────────────────────

interface ReviewSchema {
  itemReviewed: string;
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
  reviewBody?: string;
}

export function buildReviewSchema(review: ReviewSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Review',
    'itemReviewed': {
      '@type': 'Thing',
      'name': review.itemReviewed,
    },
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': review.ratingValue,
      'bestRating': review.bestRating,
      'worstRating': review.worstRating,
    },
    'reviewBody': review.reviewBody,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': review.ratingValue,
      'reviewCount': review.reviewCount,
      'bestRating': review.bestRating,
      'worstRating': review.worstRating,
    },
  });
}

// ─── Article/ScholarlyArticle Schema ──────────────────────────────────────────

interface ArticleSchema {
  title: string;
  description: string;
  slug: string;
  authorName?: string;
  authorTitle?: string;
  datePublished?: string;
  dateModified?: string;
  publisher?: string;
  image?: string;
  isScholarly?: boolean;
}

export function buildArticleSchema(article: ArticleSchema): string {
  const type = article.isScholarly ? 'ScholarlyArticle' : 'Article';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${siteUrl}/research/${article.slug}/`,
    'headline': article.title,
    'description': article.description,
    'image': article.image,
    'datePublished': article.datePublished,
    'dateModified': article.dateModified,
    'author': article.authorName ? {
      '@type': 'Person',
      'name': article.authorName,
      ...(article.authorTitle && { jobTitle: article.authorTitle }),
    } : {
      '@type': 'Organization',
      'name': 'TMS List Medical Review Team',
    },
    'publisher': {
      '@type': 'Organization',
      'name': article.publisher || 'TMS List',
      'url': siteUrl,
    },
    'provider': {
      '@type': 'Organization',
      'name': 'TMS List',
      'url': siteUrl,
    },
    ...(article.isScholarly && {
      'genre': 'Medical Research',
      'about': {
        '@type': 'Thing',
        'name': 'Transcranial Magnetic Stimulation',
      },
    }),
  });
}

// ─── Product Schema (TMS Devices) ─────────────────────────────────────────────

interface ProductSchema {
  name: string;
  slug: string;
  description: string;
  manufacturer: string;
  image?: string;
  priceRange?: string;
  fdaCleared?: boolean;
  indications?: string[];
}

export function buildProductSchema(product: ProductSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/technology/${product.slug}/`,
    'name': product.name,
    'description': product.description,
    'image': product.image,
    'manufacturer': {
      '@type': 'Organization',
      'name': product.manufacturer,
    },
    'offers': product.priceRange ? {
      '@type': 'Offer',
      'priceCurrency': 'USD',
      'price': product.priceRange,
      'availability': 'https://schema.org/InStock',
    } : undefined,
    'additionalProperty': [
      {
        '@type': 'PropertyValue',
        'name': 'FDA Cleared',
        'value': product.fdaCleared ? 'Yes' : 'No',
      },
      ...(product.indications && product.indications.length > 0 ? [{
        '@type': 'PropertyValue' as const,
        'name': 'FDA Cleared Indications',
        'value': product.indications.join(', '),
      }] : []),
    ],
  });
}

// ─── BreadcrumbList Schema ─────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  });
}

// ─── ItemList Schema ───────────────────────────────────────────────────────────

interface ItemListEntry {
  name: string;
  url: string;
  position: number;
}

export function buildItemListSchema(listName: string, entries: ItemListEntry[], description: string): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': listName,
    'description': description,
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': entries.length,
      'itemListElement': entries.map((entry) => ({
        '@type': 'ListItem',
        'position': entry.position,
        'item': {
          '@type': 'Thing',
          'name': entry.name,
          'url': entry.url,
        },
      })),
    },
  });
}

// ─── InsurancePolicy Schema ────────────────────────────────────────────────────

interface InsurancePolicySchema {
  insurer: string;
  slug: string;
  description: string;
  coversTms: boolean;
  priorAuthRequired: boolean;
  typicalCost?: string;
}

export function buildInsurancePolicySchema(policy: InsurancePolicySchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'InsurancePolicy',
    '@id': `${siteUrl}/insurance/${policy.slug}/`,
    'name': `${policy.insurer} TMS Coverage`,
    'description': policy.description,
    'insuranceActivationMaxAge': '18',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${siteUrl}/insurance/${policy.slug}/`,
    },
    'additionalProperty': [
      {
        '@type': 'PropertyValue',
        'name': 'Covers TMS',
        'value': policy.coversTms ? 'Yes' : 'Varies by Plan',
      },
      {
        '@type': 'PropertyValue',
        'name': 'Prior Authorization Required',
        'value': policy.priorAuthRequired ? 'Yes' : 'No',
      },
      ...(policy.typicalCost ? [{
        '@type': 'PropertyValue' as const,
        'name': 'Typical Patient Cost',
        'value': policy.typicalCost,
      }] : []),
    ],
  });
}

// ─── DefinedTerm Schema (Glossary) ─────────────────────────────────────────────

interface DefinedTermSchema {
  term: string;
  definition: string;
  category?: string;
  relatedTerms?: string[];
}

export function buildDefinedTermSchema(definedTerm: DefinedTermSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': definedTerm.term,
    'description': definedTerm.definition,
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': 'TMS List Glossary of TMS Terminology',
      'url': `${siteUrl}/glossary/`,
    },
    ...(definedTerm.category && { 'termCode': definedTerm.category }),
  });
}

// ─── City Rankings Schema (Best TMS Cities) ────────────────────────────────────

interface CityRankingsSchema {
  city: string;
  state: string;
  description: string;
  slug: string;
  topClinics: { name: string; rating: number }[];
}

export function buildCityRankingsSchema(cityRankings: CityRankingsSchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${siteUrl}/best-tms-clinics/by-city/${cityRankings.slug}/`,
    'headline': `Best TMS Clinics in ${cityRankings.city}, ${cityRankings.state}`,
    'description': cityRankings.description,
    'articleSection': 'City Rankings',
    'about': {
      '@type': 'Place',
      'name': `${cityRankings.city}, ${cityRankings.state}`,
    },
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': cityRankings.topClinics.length,
      'itemListElement': cityRankings.topClinics.map((clinic, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'item': {
          '@type': 'MedicalOrganization',
          'name': clinic.name,
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': clinic.rating,
            'bestRating': 5,
            'worstRating': 1,
          },
        },
      })),
    },
  });
}

// ─── Story/Testimonial Schema ───────────────────────────────────────────────────

interface StorySchema {
  title: string;
  slug: string;
  description: string;
  authorName: string;
  condition: string;
  outcome?: string;
}

export function buildStorySchema(story: StorySchema): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${siteUrl}/stories/${story.slug}/`,
    'headline': story.title,
    'description': story.description,
    'articleSection': 'Patient Stories',
    'author': {
      '@type': 'Person',
      'name': story.authorName,
    },
    'review': {
      '@type': 'Review',
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': 5,
        'bestRating': 5,
        'worstRating': 1,
      },
      'reviewBody': story.outcome || story.description,
    },
    'mainEntity': {
      '@type': 'MedicalCondition',
      'name': story.condition,
    },
  });
}
