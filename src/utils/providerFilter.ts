/**
 * Provider type filtering for doctors_data embedded in clinics.
 * Filters the doctors array by title/credential keywords.
 */

export interface DoctorWithClinic {
  name: string;
  slug: string;
  title: string;
  school?: string;
  years_experience?: number;
  bio?: string;
  specialties?: string[];
  clinic: Record<string, any>;
  [key: string]: any;
}

/**
 * Filter embedded doctors by provider type based on title keywords.
 * These keywords are derived from the actual doctor title data in clinics.json.
 */
export function filterDoctorsByType(
  doctors: DoctorWithClinic[],
  providerType: 'psychiatrists' | 'psychologists' | 'therapists'
): DoctorWithClinic[] {
  const titleLower = (t: string) => (t || '').toLowerCase();

  switch (providerType) {
    case 'psychiatrists':
      // Board-certified psychiatrists, medical directors, MDs in psychiatry
      return doctors.filter(d => {
        const t = titleLower(d.title);
        return t.includes('psychiatrist') || t.includes('md') && t.includes('psych');
      });

    case 'psychologists':
      // Licensed psychologists, clinical psychologists, PsyD, PhD in psychology
      return doctors.filter(d => {
        const t = titleLower(d.title);
        return t.includes('psychologist') || t.includes('psyd') || t.includes('phd') && (t.includes('psych') || t.includes('clinical'));
      });

    case 'therapists':
      // Licensed therapists, counselors, LCSW, LMFT, psychiatric nurse practitioners
      return doctors.filter(d => {
        const t = titleLower(d.title);
        return (
          t.includes('therapist') ||
          t.includes('counselor') ||
          t.includes('lcsw') ||
          t.includes('lmft') ||
          t.includes('lpcc') ||
          t.includes('nurse practitioner') ||
          t.includes('aprn')
        );
      });

    default:
      return doctors;
  }
}

/**
 * Get keyword density data for SEO content generation.
 * Returns city-specific variations of key phrases.
 */
export function getProviderSEOContent(
  providerType: 'psychiatrists' | 'psychologists' | 'therapists',
  cityName: string,
  stateName: string
) {
  const provider = {
    psychiatrists: {
      singular: 'psychiatrist',
      plural: 'psychiatrists',
      article: 'a',
      credential: 'board-certified',
      description: 'psychiatrist specializing in TMS therapy',
      conditions: ['treatment-resistant depression', 'anxiety disorders', 'OCD', 'PTSD'],
    },
    psychologists: {
      singular: 'psychologist',
      plural: 'psychologists',
      article: 'a',
      credential: 'licensed clinical',
      description: 'psychologist experienced in TMS treatment',
      conditions: ['depression', 'anxiety', 'cognitive behavioral therapy combined with TMS'],
    },
    therapists: {
      singular: 'therapist',
      plural: 'therapists',
      article: 'a',
      credential: 'licensed',
      description: 'therapist providing TMS-compatible mental health care',
      conditions: ['depression', 'anxiety', 'trauma therapy alongside TMS'],
    },
  }[providerType];

  return {
    ...provider,
    cityName,
    stateName,
    metaTitle: `Best ${provider.plural} in ${cityName}, ${stateName} | TMS Specialists`,
    metaDescription: `Find ${provider.plural} with TMS therapy training in ${cityName}, ${stateName}. Compare credentials, patient reviews, and treatment approaches. Book a consultation today.`,
    h1: `Best ${provider.plural} in ${cityName}`,
    faqSchema: [
      {
        question: `How do I find a ${provider.singular} who offers TMS therapy in ${cityName}?`,
        answer: `TMS List features ${provider.plural} in ${cityName}, ${stateName} who specialize in Transcranial Magnetic Stimulation. Browse verified providers, compare credentials, and book consultations directly.`,
      },
      {
        question: `What credentials should a ${provider.singular} have for TMS treatment?`,
        answer: `Look for ${provider.singular} with specific training in neuromodulation, board certifications in their specialty, and experience with the specific TMS protocol being used.`,
      },
      {
        question: `Does insurance cover TMS therapy with a ${provider.singular} in ${cityName}?`,
        answer: `Most major insurance plans, including Medicare, cover TMS therapy when provided by qualifying ${provider.plural}. Contact your insurance provider and the ${provider.singular}'s office to verify coverage.`,
      },
      {
        question: `How is a ${provider.singular} different from other mental health providers for TMS?`,
        answer: `${provider.singular} with TMS training can diagnose mental health conditions, prescribe medications if needed, and oversee the full TMS treatment protocol. They work with the clinical team to monitor progress and adjust treatment as needed.`,
      },
      {
        question: `What's the difference between TMS provided by a ${provider.singular} vs. a TMS center?`,
        answer: `${provider.singular} focus on the psychiatric evaluation, diagnosis, and medication management aspects of care, while TMS centers provide the actual TMS sessions. Many clinics have both on the same team.`,
      },
    ],
  };
}