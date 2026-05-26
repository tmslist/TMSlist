import { useState, useEffect } from 'react';

const ALL_RESOURCES = [
  { slug: 'tms-buyers-guide',                    label: "TMS Buyer's Guide",               sub: 'Choose the right provider',         audience: 'patient' },
  { slug: 'insurance-checklist',                 label: 'Insurance Coverage Checklist',    sub: 'Get TMS covered, step-by-step',     audience: 'patient' },
  { slug: 'tms-vs-medication',                   label: 'TMS vs Medication',               sub: 'Side-by-side comparison',           audience: 'patient' },
  { slug: 'tms-billing-cpt-codes-2026',          label: 'Billing & CPT Codes 2026',        sub: 'Reimbursement reference',           audience: 'provider' },
  { slug: 'tms-prior-authorization-template-kit',label: 'Prior Auth Template Kit',         sub: 'Approval-ready letter templates',   audience: 'provider' },
  { slug: 'tms-patient-acquisition-playbook',    label: 'Patient Acquisition Playbook',    sub: 'Channels, scripts, funnels',        audience: 'provider' },
  { slug: 'starting-a-tms-clinic-business-plan', label: 'Starting a TMS Clinic',           sub: 'Full business plan + pro-forma',    audience: 'provider' },
  { slug: 'tms-patient-outcome-tracking-system', label: 'Outcome Tracking System',         sub: 'PHQ-9 / GAD-7 workflow',            audience: 'provider' },
  { slug: 'tms-technician-training-checklist',   label: 'Technician Training Checklist',   sub: 'Onboard new techs faster',          audience: 'provider' },
  { slug: 'tms-state-regulations-guide-2026',    label: 'State Regulations Guide 2026',    sub: 'Compliance by state',               audience: 'provider' },
  { slug: 'building-tms-referral-network',       label: 'Building a Referral Network',     sub: 'Outreach scripts + CRM cadence',    audience: 'provider' },
];

const PATIENT_GUIDES = ['insurance-checklist', 'tms-buyers-guide', 'tms-vs-medication'];

const isLocalhost = () => typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/.test(window.location.hostname);

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resource, setResource] = useState('tms-buyers-guide');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dev = isLocalhost();
    if (!dev && localStorage.getItem('exit_intent_shown')) return;
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal')) return;

    // Dev affordance: ?exit=1 forces it open immediately
    if (dev && new URLSearchParams(window.location.search).get('exit') === '1') {
      setShow(true);
      return;
    }

    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) {
        setShow(true);
        if (!dev) localStorage.setItem('exit_intent_shown', String(Date.now()));
        document.removeEventListener('mouseleave', handler);
        window.posthog?.capture('exit_intent_shown', { path: window.location.pathname });
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const guideTypeMap: Record<string, string> = {
      'insurance-checklist': 'insurance-checklist',
      'tms-buyers-guide': 'buyers-guide',
      'tms-vs-medication': 'vs-medication',
    };
    await fetch('/api/funnel/enter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segment: 'lead_magnet',
        name, email,
        guide_type: guideTypeMap[resource] || resource,
        source: 'exit-intent-popup',
      }),
    });
    window.posthog?.capture('lead_magnet_downloaded', { resource, guide_type: guideTypeMap[resource] || resource, email });

    if (PATIENT_GUIDES.includes(resource)) {
      const link = document.createElement('a');
      link.href = `/downloads/${resource}.pdf`;
      link.download = `${resource}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Open the resource page in a new tab so the cross-promo state stays visible
      window.open(`/resources/${resource}/`, '_blank', 'noopener');
    }
    setSubmitted(true);
  }

  if (!show) return null;

  const remaining = ALL_RESOURCES.filter(r => r.slug !== resource);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => setShow(false)}>
      <div className="relative bg-white rounded-2xl shadow-2xl p-7 max-w-lg w-full my-8" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShow(false)} aria-label="Close" className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--ink2)] text-lg">✕</button>
        {submitted ? (
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 text-2xl mb-3">✓</div>
              <h3 className="text-xl font-semibold text-[var(--ink)] mb-1">Check your inbox</h3>
              <p className="text-[var(--muted)] text-sm">Your guide is on its way. {PATIENT_GUIDES.includes(resource) ? 'The PDF should be downloading now.' : 'We just opened the full resource page in a new tab.'}</p>
            </div>
            <div className="border-t border-[var(--line)] pt-4">
              <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-3">Grab the rest of the library</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {remaining.map(r => (
                  <a
                    key={r.slug}
                    href={PATIENT_GUIDES.includes(r.slug) ? `/downloads/${r.slug}.pdf` : `/resources/${r.slug}/`}
                    target={PATIENT_GUIDES.includes(r.slug) ? undefined : '_blank'}
                    rel="noopener"
                    className="block p-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--ink2)] hover:bg-[rgba(10,22,40,0.04)] transition-all"
                  >
                    <div className="text-xs font-semibold text-[var(--ink)] leading-tight">{r.label}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">{r.sub}</div>
                  </a>
                ))}
              </div>
              <a href="/resources/" className="block text-center mt-4 text-sm font-semibold text-[var(--accent)] hover:underline">
                See all free resources →
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-1">Free Resource</p>
              <h3 className="text-xl font-semibold text-[var(--ink)] mb-1">Before you go — get our free guide</h3>
              <p className="text-[var(--muted)] text-sm">Pick one to download now. We'll send links to the rest after.</p>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { val: 'insurance-checklist', label: 'Insurance Coverage Checklist', sub: 'Step-by-step to get TMS covered' },
                { val: 'tms-buyers-guide', label: "TMS Buyer's Guide", sub: 'Complete guide to choosing a provider' },
                { val: 'tms-vs-medication', label: 'TMS vs Medication Chart', sub: 'Side-by-side comparison' },
              ].map(r => (
                <label key={r.val} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${resource === r.val ? 'border-[var(--ink2)] bg-[rgba(10,22,40,0.08)]' : 'border-[var(--line)] hover:border-[rgba(10,22,40,0.2)]'}`}>
                  <input type="radio" name="exit-resource" value={r.val} checked={resource === r.val} onChange={() => setResource(r.val)} className="mt-0.5" />
                  <div>
                    <div className="text-[var(--ink)]">{r.label}</div>
                    <div className="text-xs text-[var(--muted)]">{r.sub}</div>
                  </div>
                </label>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-2.5 border border-[var(--line)] rounded-lg text-sm" />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-2.5 border border-[var(--line)] rounded-lg text-sm" />
              <button type="submit" className="w-full px-4 py-3 bg-[var(--ink)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--ink2)]">Send My Free Guide</button>
              <p className="text-[11px] text-[var(--muted)] text-center">No spam. Unsubscribe anytime. You'll see the full library next.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
