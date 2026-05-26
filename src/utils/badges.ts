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
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-amber-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      color: 'bg-amber-100 text-amber-800',
      description: 'Rated 4.5+ with 5+ reviews',
    });
  }
  if ((clinic.reviewCount ?? 0) >= 20) {
    badges.push({
      id: 'most-reviewed',
      label: 'Most Reviewed',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-[var(--ink2)]"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
      color: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
      description: '20+ patient reviews',
    });
  }
  if (clinic.verified) {
    badges.push({
      id: 'verified',
      label: 'Verified',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M5 13l4 4L19 7"/></svg>',
      color: 'bg-emerald-100 text-emerald-800',
      description: 'Verified clinic listing',
    });
  }
  if (clinic.isFeatured) {
    badges.push({
      id: 'featured',
      label: 'Featured',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-[var(--warm)]"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      color: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
      description: 'Featured provider',
    });
  }
  if (clinic.availability?.accepting_new_patients) {
    badges.push({
      id: 'accepting',
      label: 'Accepting Patients',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-green-500"><circle cx="12" cy="12" r="10"/></svg>',
      color: 'bg-green-100 text-green-800',
      description: 'Currently accepting new patients',
    });
  }
  if (clinic.availability?.same_week_available) {
    badges.push({
      id: 'fast',
      label: 'Quick Availability',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-[var(--ink2)]"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
      color: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
      description: 'Appointments available this week',
    });
  }
  if (clinic.availability?.telehealth_consults) {
    badges.push({
      id: 'telehealth',
      label: 'Telehealth',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-[var(--warm)]"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>',
      color: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
      description: 'Virtual consultations available',
    });
  }

  return badges;
}
