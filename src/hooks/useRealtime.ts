import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';

interface NotificationEvent {
  type: string;
  title: string;
  message?: string | null;
  createdAt: string;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationEvent) => void;
}

export function useRealtimeNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, onNotification } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/notifications/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;

        // Ignore heartbeat messages
        if (data.type === 'connected' || data.type === 'heartbeat') {
          return;
        }

        // Update last notification for UI
        setLastNotification(data);

        // Invalidate notifications query to trigger refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.portal.notifications() });

        // Call custom notification handler
        onNotification?.(data);

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message || undefined,
            icon: '/favicon.ico',
          });
        }
      } catch {
        // Ignore parse errors (heartbeat comments)
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Exponential backoff for reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };
  }, [enabled, queryClient, onNotification]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    isConnected,
    lastNotification,
    reconnect: connect,
    disconnect,
    requestPermission,
  };
}

// Hook for managing notification badge count
export function useNotificationBadge() {
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: queryKeys.portal.notifications(),
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=100');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      return data.notifications as Array<{
        id: string;
        type: string;
        title: string;
        message: string | null;
        read: boolean;
        createdAt: string;
      }>;
    },
    staleTime: 0,
    refetchInterval: 60000, // Poll every minute as fallback
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return { unreadCount, notifications };
}