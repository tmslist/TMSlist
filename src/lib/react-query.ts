import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// Create a singleton query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for type-safe invalidation
export const queryKeys = {
  // Portal
  portal: {
    all: ['portal'] as const,
    dashboard: () => [...queryKeys.portal.all, 'dashboard'] as const,
    clinic: () => [...queryKeys.portal.all, 'clinic'] as const,
    leads: () => [...queryKeys.portal.all, 'leads'] as const,
    reviews: () => [...queryKeys.portal.all, 'reviews'] as const,
    analytics: () => [...queryKeys.portal.all, 'analytics'] as const,
    notifications: () => [...queryKeys.portal.all, 'notifications'] as const,
    subscription: () => [...queryKeys.portal.all, 'subscription'] as const,
  },
  // Doctor
  doctor: {
    all: ['doctor'] as const,
    dashboard: () => [...queryKeys.doctor.all, 'dashboard'] as const,
    profile: () => [...queryKeys.doctor.all, 'profile'] as const,
    appointments: () => [...queryKeys.doctor.all, 'appointments'] as const,
    earnings: () => [...queryKeys.doctor.all, 'earnings'] as const,
    leads: () => [...queryKeys.doctor.all, 'leads'] as const,
    reviews: () => [...queryKeys.doctor.all, 'reviews'] as const,
    availability: () => [...queryKeys.doctor.all, 'availability'] as const,
  },
} as const;

// Hook for using query client in components
export function useQueryClient() {
  return queryClient;
}

// Prefetch helper for SSR
export function prefetchQuery(queryKey: readonly unknown[], fetcher: () => Promise<unknown>) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: fetcher,
  });
}