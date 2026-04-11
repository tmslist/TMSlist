export interface Badge {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export function calculateBadges(clinic: {
  ratingAvg?: string;
  reviewCount?: number;
  verified?: boolean;
  isFeatured?: boolean;
  availability?: {
    accepting_new_patients?: boolean;
    same_week_available?: boolean;
    telehealth_consults?: boolean;
  };
  createdAt?: string;
}): Badge[] {
  const badges: Badge[] = [];

  const rating = Number(clinic.ratingAvg);
  if (rating >= 4.5 && (clinic.reviewCount ?? 0) >= 5) {
    badges.push({
      id: 'top-rated',
      label: 'Top Rated',
      icon: '⭐',
      color: 'bg-amber-100 text-amber-800',
      description: 'Rated 4.5+ with 5+ reviews',
    });
  }
  if ((clinic.reviewCount ?? 0) >= 20) {
    badges.push({
      id: 'most-reviewed',
      label: 'Most Reviewed',
      icon: '💬',
      color: 'bg-blue-100 text-blue-800',
      description: '20+ patient reviews',
    });
  }
  if (clinic.verified) {
    badges.push({
      id: 'verified',
      label: 'Verified',
      icon: '✓',
      color: 'bg-emerald-100 text-emerald-800',
      description: 'Verified clinic listing',
    });
  }
  if (clinic.isFeatured) {
    badges.push({
      id: 'featured',
      label: 'Featured',
      icon: '★',
      color: 'bg-violet-100 text-violet-800',
      description: 'Featured provider',
    });
  }
  if (clinic.availability?.accepting_new_patients) {
    badges.push({
      id: 'accepting',
      label: 'Accepting Patients',
      icon: '🟢',
      color: 'bg-green-100 text-green-800',
      description: 'Currently accepting new patients',
    });
  }
  if (clinic.availability?.same_week_available) {
    badges.push({
      id: 'fast',
      label: 'Quick Availability',
      icon: '⚡',
      color: 'bg-cyan-100 text-cyan-800',
      description: 'Appointments available this week',
    });
  }
  if (clinic.availability?.telehealth_consults) {
    badges.push({
      id: 'telehealth',
      label: 'Telehealth',
      icon: '📹',
      color: 'bg-indigo-100 text-indigo-800',
      description: 'Virtual consultations available',
    });
  }

  return badges;
}
