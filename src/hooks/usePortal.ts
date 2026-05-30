import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';

// ============================================================================
// Types
// ============================================================================

export interface Clinic {
  id: string;
  name: string;
  city: string;
  state: string;
  verified: boolean;
}

export interface DashboardData {
  needsClaim?: boolean;
  clinic?: Clinic;
  stats?: {
    reviewCount: number;
    avgRating: number;
    leadCount: number;
  };
  profileCompletion?: {
    percentage: number;
    missingFields: Array<{ key: string; label: string; priority: 'high' | 'medium' }>;
  };
  recentReviews?: Array<{
    id: string;
    userName: string;
    rating: number;
    title: string | null;
    body: string;
    approved: boolean;
    createdAt: string;
  }>;
  recentLeads?: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    createdAt: string;
  }>;
}

export interface ClinicData {
  id: string;
  name: string;
  description: string | null;
  descriptionLong: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  machines: string[] | null;
  specialties: string[] | null;
  insurances: string[] | null;
  openingHours: string[] | null;
  availability: {
    accepting_new_patients?: boolean;
    wait_time_weeks?: number;
    same_week_available?: boolean;
    evening_hours?: boolean;
    weekend_hours?: boolean;
    telehealth_consults?: boolean;
    virtual_followups?: boolean;
    home_visits?: boolean;
  } | null;
  pricing: {
    price_range?: 'budget' | 'moderate' | 'premium';
    session_price_min?: number;
    session_price_max?: number;
    full_course_price?: number;
    free_consultation?: boolean;
    payment_plans?: boolean;
    accepts_insurance?: boolean;
    cash_discount?: boolean;
  } | null;
  media: {
    hero_image_url?: string;
    logo_url?: string;
    gallery_urls?: string[];
    video_url?: string;
  } | null;
}

export interface Subscription {
  plan: 'free' | 'pro' | 'premium' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  razorpaySubscriptionId: string | null;
  billingCurrency: string;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  type: string;
  createdAt: string;
  read: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/portal/login';
      throw new Error('Unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

export function usePortalDashboard() {
  return useQuery({
    queryKey: queryKeys.portal.dashboard(),
    queryFn: () => fetchJSON<DashboardData>('/api/portal/dashboard'),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function usePortalClinic() {
  return useQuery({
    queryKey: queryKeys.portal.clinic(),
    queryFn: () => fetchJSON<ClinicData>('/api/portal/clinic'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ClinicData>) =>
      fetchJSON('/api/portal/clinic', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.clinic() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.dashboard() });
    },
  });
}

// ============================================================================
// Subscription Hooks
// ============================================================================

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.portal.subscription(),
    queryFn: () => fetchJSON<{
      plan: string;
      status: string | null;
      currentPeriodEnd: string | null;
      stripeSubscriptionId: string | null;
      razorpaySubscriptionId: string | null;
      currency: string;
    }>('/api/payments/portal'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpgradeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: string) =>
      fetchJSON<{ checkoutUrl: string }>('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      throw error;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJSON('/api/payments/portal', {
        method: 'PUT',
        body: JSON.stringify({ action: 'cancel' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.subscription() });
    },
  });
}

// ============================================================================
// Leads Hooks
// ============================================================================

export function usePortalLeads(limit = 20) {
  return useQuery({
    queryKey: queryKeys.portal.leads(),
    queryFn: () => fetchJSON<{ data: Lead[] }>(`/api/portal/leads?limit=${limit}`),
    select: (data) => data.data,
  });
}

export function useMarkLeadRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) =>
      fetchJSON(`/api/portal/leads`, {
        method: 'PUT',
        body: JSON.stringify({ id: leadId, read: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.leads() });
    },
  });
}

// ============================================================================
// Reviews Hooks
// ============================================================================

export function usePortalReviews(limit = 20) {
  return useQuery({
    queryKey: queryKeys.portal.reviews(),
    queryFn: () => fetchJSON<{ reviews: Review[] }>(`/api/portal/reviews?limit=${limit}`),
    select: (data) => data.reviews,
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) =>
      fetchJSON(`/api/portal/reviews`, {
        method: 'PUT',
        body: JSON.stringify({ id: reviewId, approved: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.reviews() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.dashboard() });
    },
  });
}

// ============================================================================
// Notifications Hooks
// ============================================================================

export function useNotifications(limit = 10) {
  return useQuery({
    queryKey: queryKeys.portal.notifications(),
    queryFn: () => fetchJSON<{ notifications: Notification[] }>(`/api/notifications?limit=${limit}`),
    select: (data) => data.notifications,
    refetchInterval: 1000 * 60, // Poll every minute as fallback
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchJSON('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ id: notificationId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.notifications() });
    },
  });
}

// ============================================================================
// Claim Clinic Hooks
// ============================================================================

export function useSearchClinics(query: string) {
  return useQuery({
    queryKey: ['clinic-search', query],
    queryFn: () =>
      fetchJSON<{ clinics: Array<{ id: string; slug: string; name: string; city: string; state: string; address: string | null }> }>(
        `/api/portal/claim?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length >= 2,
    staleTime: 0,
  });
}

export function useClaimClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clinicId: string) =>
      fetchJSON<{ success: boolean; directClaim?: boolean; clinicSlug?: string }>('/api/portal/claim', {
        method: 'POST',
        body: JSON.stringify({ clinicId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.dashboard() });
    },
  });
}

// ============================================================================
// Analytics Hooks
// ============================================================================

export function usePortalAnalytics() {
  return useQuery({
    queryKey: queryKeys.portal.analytics(),
    queryFn: () => fetchJSON('/api/portal/analytics'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}