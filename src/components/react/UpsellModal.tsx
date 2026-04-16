import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentPlan: string;
  requiredPlan: string;
}

const PLAN_DISPLAY: Record<string, { name: string; price: string; color: string }> = {
  free: { name: 'Free', price: '$0/mo', color: 'text-slate-600' },
  pro: { name: 'Pro', price: '$18/mo', color: 'text-blue-600' },
  premium: { name: 'Premium', price: '$30/mo', color: 'text-violet-600' },
  enterprise: { name: 'Enterprise', price: '$60/mo', color: 'text-slate-900' },
};

const FEATURE_HINTS: Record<string, string> = {
  analytics: 'Track patient leads, phone clicks, and competitor insights',
  leadDashboard: 'View and manage all incoming patient enquiries in one place',
  multiLocation: 'Manage unlimited clinic locations under one account',
  chatbot: 'AI-powered 24/7 patient chat on your listing',
  featuredPlacement: 'Appear at the top of search results in your city',
  apiAccess: 'Build custom integrations with your existing tools',
};

export default function UpsellModal({ isOpen, onClose, feature, currentPlan, requiredPlan }: Props) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const current = PLAN_DISPLAY[currentPlan] ?? PLAN_DISPLAY.free;
  const required = PLAN_DISPLAY[requiredPlan] ?? PLAN_DISPLAY.pro;
  const hint = FEATURE_HINTS[feature] ?? 'Unlock advanced features for your clinic';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscribe?plan=${requiredPlan}&redirect=${encodeURIComponent(window.location.pathname)}`);
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        window.location.href = `/pricing/?plan=${requiredPlan}`;
      }
    } catch {
      window.location.href = `/pricing/?plan=${requiredPlan}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Unlock {required.name}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{hint}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className={`font-semibold ${current.color}`}>{current.name} plan</span>
            <span className="text-slate-400">
              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <span className={`font-semibold ${required.color}`}>{required.name} plan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }} />
            </div>
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {['analytics', 'leadDashboard', 'featuredPlacement'].filter(f =>
            ['pro', 'premium', 'enterprise'].includes(requiredPlan)
          ).map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {FEATURE_HINTS[f] ?? f}
            </div>
          ))}
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {loading ? 'Redirecting...' : `Upgrade to ${required.name} — ${required.price}`}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
