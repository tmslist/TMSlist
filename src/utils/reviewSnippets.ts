/**
 * Generates a deterministic review summary snippet for a clinic
 * based on its attributes (rating, machines, specialties, review count).
 * Falls back gracefully when no real reviews exist.
 */

interface ClinicSnippetInput {
  name: string;
  rating?: number;
  reviewCount?: number;
  machines?: string[];
  insurances?: string[];
  verified?: boolean;
  city?: string;
  state?: string;
}

const POSITIVE_TEMPLATES = [
  "Patients praise the {feature} and professional care team.",
  "Highly rated for {feature} and compassionate staff.",
  "Known for {feature} with consistently positive outcomes.",
  "Patients highlight {feature} and thorough consultations.",
  "Top marks for {feature} and welcoming environment.",
  "Recommended for {feature} and attentive treatment approach.",
  "Valued for {feature} and clear communication throughout treatment.",
  "Patients appreciate the {feature} and follow-up care.",
];

const FEATURES_BY_MACHINE: Record<string, string> = {
  NeuroStar: "advanced NeuroStar technology",
  BrainsWay: "deep TMS with BrainsWay",
  MagVenture: "precise MagVenture protocols",
  CloudTMS: "data-driven CloudTMS monitoring",
  Nexstim: "targeted Nexstim navigation",
  Apollo: "innovative Apollo TMS therapy",
  Magstim: "reliable Magstim treatments",
};

const GENERIC_FEATURES = [
  "personalized treatment plans",
  "short wait times",
  "friendly and knowledgeable staff",
  "comfortable treatment environment",
  "flexible scheduling options",
  "thorough initial evaluations",
  "insurance coordination support",
  "convenient location",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getReviewSnippet(clinic: ClinicSnippetInput): string | null {
  const rating = clinic.rating || 0;
  const reviewCount = clinic.reviewCount || 0;

  // Only show snippets for clinics with decent ratings
  if (rating < 3.5 || reviewCount < 3) return null;

  const hash = hashString(clinic.name || 'clinic');

  // Pick a feature based on machines or generic
  let feature: string;
  if (clinic.machines && clinic.machines.length > 0) {
    const primaryMachine = clinic.machines[0];
    feature = FEATURES_BY_MACHINE[primaryMachine] || GENERIC_FEATURES[hash % GENERIC_FEATURES.length];
  } else {
    feature = GENERIC_FEATURES[hash % GENERIC_FEATURES.length];
  }

  const template = POSITIVE_TEMPLATES[hash % POSITIVE_TEMPLATES.length];
  return template.replace("{feature}", feature);
}

export function getSnippetSentiment(rating: number): 'excellent' | 'good' | 'neutral' {
  if (rating >= 4.5) return 'excellent';
  if (rating >= 3.5) return 'good';
  return 'neutral';
}
