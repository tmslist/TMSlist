import { useEffect, useRef, useState } from 'react';

interface ProofItem {
  name: string;
  city: string;
  timeAgo: string;
}

const SESSION_KEY = 'tmslist_social_proof_count';
const MAX_PER_SESSION = 5;
const SHOW_INTERVAL = 30_000; // 30 seconds
const DISMISS_AFTER = 5_000; // 5 seconds

export default function SocialProofToast() {
  const [current, setCurrent] = useState<ProofItem | null>(null);
  const [visible, setVisible] = useState(false);
  const feedRef = useRef<ProofItem[]>([]);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Don't show on admin/portal pages
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal')) {
      return;
    }

    // Check session limit
    const shown = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
    if (shown >= MAX_PER_SESSION) return;

    // Fetch social proof feed
    fetch('/api/clinics/social-proof-feed')
      .then((r) => r.json())
      .then((data: ProofItem[]) => {
        if (!data?.length) return;
        feedRef.current = data;
        indexRef.current = 0;

        // Show first one after a short delay
        const initialTimeout = setTimeout(() => showNext(), 8_000);

        // Then show periodically
        intervalRef.current = setInterval(() => {
          const count = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
          if (count >= MAX_PER_SESSION) {
            clearInterval(intervalRef.current);
            return;
          }
          showNext();
        }, SHOW_INTERVAL);

        return () => {
          clearTimeout(initialTimeout);
          clearInterval(intervalRef.current);
        };
      })
      .catch(() => {});

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  function showNext() {
    const feed = feedRef.current;
    if (!feed.length) return;

    const count = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
    if (count >= MAX_PER_SESSION) return;

    const item = feed[indexRef.current % feed.length];
    indexRef.current++;

    setCurrent(item);
    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, String(count + 1));

    // Auto-dismiss
    setTimeout(() => {
      setVisible(false);
    }, DISMISS_AFTER);
  }

  if (!current) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 z-[180] max-w-xs transition-all duration-500 ease-out ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium leading-snug">
            {current.name} from {current.city}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            enquired about TMS {current.timeAgo}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-gray-600 shrink-0 -mt-1 -mr-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
