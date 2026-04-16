import { useState, useEffect } from 'react';

interface ChecklistItem {
  key: string;
  label: string;
  sublabel: string;
  href: string;
  icon: string;
  color: ColorKey;
}

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-100', border: 'border-indigo-100', hover: 'hover:bg-indigo-100', text: 'text-indigo-600' },
  amber: { bg: 'bg-amber-100', border: 'border-amber-100', hover: 'hover:bg-amber-100', text: 'text-amber-500' },
  rose: { bg: 'bg-rose-100', border: 'border-rose-100', hover: 'hover:bg-rose-100', text: 'text-rose-500' },
  violet: { bg: 'bg-violet-100', border: 'border-violet-100', hover: 'hover:bg-violet-100', text: 'text-violet-500' },
} as const;
type ColorKey = keyof typeof COLOR_MAP;

const CHECKLIST: ChecklistItem[] = [
  {
    key: 'profile',
    label: 'Complete your profile',
    sublabel: 'Add your name so the community knows you',
    href: '/account/profile',
    icon: 'user',
    color: 'indigo',
  },
  {
    key: 'reviews',
    label: 'Write a review',
    sublabel: 'Help others find the right clinic',
    href: '/account/reviews',
    icon: 'star',
    color: 'amber',
  },
  {
    key: 'saved',
    label: 'Save clinics',
    sublabel: 'Bookmark clinics you\'re considering',
    href: '/account/saved',
    icon: 'heart',
    color: 'rose',
  },
  {
    key: 'community',
    label: 'Join the community',
    sublabel: 'Ask questions, share your journey',
    href: '/community',
    icon: 'chat',
    color: 'violet',
  },
];

export default function OnboardingToast() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'welcome' | 'checklist'>('welcome');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [nextAction, setNextAction] = useState<ChecklistItem | null>(null);

  useEffect(() => {
    // Only show once per session
    const shown = sessionStorage.getItem('onboarding_shown');
    if (shown) return;

    fetch('/api/patient/me')
      .then(r => r.ok ? r.json() : null)
      .then(async (d) => {
        const user = d?.user;
        if (!user) return;

        // Check profile completion
        const profileDone = !!(user.name && user.name.length > 1);

        // Check reviews and saved in parallel
        const [reviewsData, savedData] = await Promise.all([
          fetch('/api/patient/reviews').then(r => r.ok ? r.json() : { reviews: [] }),
          fetch('/api/patient/saved-clinics').then(r => r.ok ? r.json() : { data: [] }),
        ]);

        const reviewsDone = (reviewsData.reviews || []).length > 0;
        const savedDone = (savedData.data || []).length > 0;

        const doneMap: Record<string, boolean> = {
          profile: profileDone,
          reviews: reviewsDone,
          saved: savedDone,
          community: false, // can't detect community participation cheaply
        };

        setDone(doneMap);

        const remaining = CHECKLIST.filter(item => !doneMap[item.key]);
        if (remaining.length === 0) return; // nothing to suggest

        setNextAction(remaining[0]);

        // Small delay before showing
        setTimeout(() => {
          sessionStorage.setItem('onboarding_shown', '1');
          setVisible(true);
        }, 1500);
      })
      .catch((err: unknown) => console.warn('[OnboardingToast] failed:', err instanceof Error ? err.message : err));
  }, []);

  if (!visible) return null;

  const doneCount = Object.values(done).filter(Boolean).length;
  const total = CHECKLIST.length;

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-80 max-w-[calc(100vw-3rem)]">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  {step === 'welcome' ? `Welcome to TMS List!` : 'Your next step'}
                </h3>
                {step === 'welcome' && (
                  <p className="text-indigo-200 text-xs mt-0.5">
                    {doneCount}/{total} complete · {total - doneCount} to go
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          {step === 'welcome' && (
            <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {step === 'welcome' && nextAction && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {doneCount === 0
                  ? 'Get started by doing one of these:'
                  : `Next up: ${nextAction.label}`}
              </p>
              <a
                href={nextAction.href}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 ${COLOR_MAP[nextAction.color as ColorKey]?.border || 'border-indigo-100'} ${COLOR_MAP[nextAction.color as ColorKey]?.bg || 'bg-indigo-50'} ${COLOR_MAP[nextAction.color as ColorKey]?.hover || 'hover:bg-indigo-100'} transition-all group`}
              >
                <div className={`w-10 h-10 rounded-xl ${COLOR_MAP[nextAction.color as ColorKey]?.bg || 'bg-indigo-100'} flex items-center justify-center shrink-0`}>
                  {nextAction.icon === 'user' && (
                    <svg className={`w-5 h-5 ${COLOR_MAP[nextAction.color as ColorKey]?.text || 'text-indigo-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  )}
                  {nextAction.icon === 'star' && (
                    <svg className={`w-5 h-5 ${COLOR_MAP[nextAction.color as ColorKey]?.text || 'text-indigo-500'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>
                  )}
                  {nextAction.icon === 'heart' && (
                    <svg className={`w-5 h-5 ${COLOR_MAP[nextAction.color as ColorKey]?.text || 'text-indigo-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  )}
                  {nextAction.icon === 'chat' && (
                    <svg className={`w-5 h-5 ${COLOR_MAP[nextAction.color as ColorKey]?.text || 'text-indigo-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a11.841 11.841 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{nextAction.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{nextAction.sublabel}</p>
                </div>
                <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>

              {doneCount < total - 1 && (
                <button
                  onClick={() => setStep('checklist')}
                  className="w-full mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium text-center"
                >
                  See all {total - doneCount} remaining tasks →
                </button>
              )}
            </div>
          )}

          {step === 'checklist' && (
            <div className="space-y-2">
              {CHECKLIST.map(item => {
                const isDone = done[item.key];
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                      isDone
                        ? 'bg-emerald-50 border border-emerald-100 opacity-60'
                        : 'bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-emerald-100' : 'bg-white border border-gray-200 group-hover:border-indigo-200'
                    }`}>
                      {isDone ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-400`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>{item.label}</p>
                    </div>
                    {!isDone && (
                      <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </a>
                );
              })}
              <button
                onClick={() => setStep('welcome')}
                className="w-full mt-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium text-center"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}