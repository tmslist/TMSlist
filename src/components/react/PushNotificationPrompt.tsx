import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'tmslist_push_dismissed';
const ENABLED_KEY = 'tmslist_push_enabled';

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show for portal users (check if on portal page)
    if (!window.location.pathname.startsWith('/portal')) return;

    // Check if browser supports notifications
    if (!('Notification' in window)) return;

    // Already granted or denied at browser level
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    // User already dismissed or enabled
    if (localStorage.getItem(DISMISSED_KEY) || localStorage.getItem(ENABLED_KEY)) return;

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleEnable() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(ENABLED_KEY, 'true');
        new Notification('TMS List Notifications', {
          body: 'You will now receive notifications about new reviews and leads.',
          icon: '/favicon.svg',
        });
      }
    } catch {
      // Permission request failed
    }
    setShow(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[190] w-full max-w-md px-4 animate-in slide-in-from-top">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">Enable Notifications</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Get notified about new reviews and leads for your clinic.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
