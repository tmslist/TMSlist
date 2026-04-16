import { useState, useEffect } from 'react';

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resource, setResource] = useState('tms-buyers-guide');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('exit_intent_shown')) return;
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal')) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) {
        setShow(true);
        localStorage.setItem('exit_intent_shown', String(Date.now()));
        document.removeEventListener('mouseleave', handler);
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'lead_magnet', name, email, sourceUrl: window.location.href, metadata: { resource, subscribed: true } }),
    });
    // Trigger PDF download
    const link = document.createElement('a');
    link.href = `/downloads/${resource}.pdf`;
    link.download = `${resource}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSubmitted(true);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShow(false)}>
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        {submitted ? (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox!</h3>
            <p className="text-gray-500">Your guide is on its way. Check your email for the full download too.</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Free Resource</p>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Before you go — get our free guide</h3>
              <p className="text-gray-500 text-sm">Choose your guide and we'll email it to you instantly.</p>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { val: 'insurance-checklist', label: 'Insurance Coverage Checklist', sub: 'Step-by-step to get TMS covered' },
                { val: 'tms-buyers-guide', label: "TMS Buyer's Guide", sub: 'Complete guide to choosing a provider' },
                { val: 'tms-vs-medication', label: 'TMS vs Medication Chart', sub: 'Side-by-side comparison' },
              ].map(r => (
                <label key={r.val} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${resource === r.val ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}>
                  <input type="radio" name="exit-resource" value={r.val} checked={resource === r.val} onChange={() => setResource(r.val)} className="mt-0.5" />
                  <div>
                    <div className="text-gray-900">{r.label}</div>
                    <div className="text-xs text-gray-400">{r.sub}</div>
                  </div>
                </label>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              <button type="submit" className="w-full px-4 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700">Send My Free Guide</button>
              <p className="text-xs text-gray-400 text-center">No spam. Unsubscribe anytime.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
