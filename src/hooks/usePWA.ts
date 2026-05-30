import { useEffect, useState } from 'react';

export type PWAInstallPrompt = {
  deferredPrompt: BeforeInstallPromptEvent;
  platforms: string[];
};

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    // Offline detection
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      return outcome === 'accepted';
    } catch {
      return false;
    }
  };

  return {
    installPrompt,
    isInstalled,
    isOffline,
    install,
    canInstall: !!installPrompt,
  };
}

// Sync manager for background data sync
export function useBackgroundSync() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register for background sync
        return (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('portal-data-sync');
      }).catch(console.error);
    }
  }, []);
}

// Periodic sync for data updates
export function usePeriodicSync(intervalMs = 5 * 60 * 1000) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const doSync = () => {
      navigator.serviceWorker.ready.then((registration) => {
        // Send message to service worker to trigger sync
        if (registration.active) {
          registration.active.postMessage({ type: 'PERIODIC_SYNC' });
        }
      }).catch(console.error);
    };

    const interval = setInterval(doSync, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
}