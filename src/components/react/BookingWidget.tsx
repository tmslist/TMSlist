import { useState, useEffect } from 'react';

interface Props {
  clinicId: string;
  clinicName: string;
  clinicPhone?: string;
}

export default function BookingWidget({ clinicId, clinicName, clinicPhone }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [condition, setCondition] = useState('');
  const [message, setMessage] = useState('');
  const [insurance, setInsurance] = useState('');
  const [minDate, setMinDate] = useState('');

  // Set min date client-side to avoid SSR staleness
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Track as analytics event (fire-and-forget but log failures)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, event: 'lead_submit' }),
      }).catch((err) => console.warn('[analytics] tracking failed:', err?.message));

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'specialist_enquiry',
          name,
          email,
          phone,
          clinicId,
          clinicName,
          message: [
            `Appointment Request`,
            `Preferred Date: ${preferredDate || 'Flexible'}`,
            `Preferred Time: ${preferredTime}`,
            condition ? `Condition: ${condition}` : null,
            insurance ? `Insurance: ${insurance}` : null,
            message ? `Note: ${message}` : null,
          ].filter(Boolean).join('\n'),
          sourceUrl: window.location.href,
          metadata: {
            formType: 'appointment_request',
            formPage: window.location.pathname,
            preferredDate,
            preferredTime,
            condition,
            insurance,
          },
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.details || errData.error || 'Something went wrong. Please try again or call the clinic directly.');
        setLoading(false);
        return;
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Request Appointment
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
        <svg className="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-bold text-emerald-900 mb-1">Request Sent!</h3>
        <p className="text-sm text-emerald-700">
          {clinicName} will contact you shortly to confirm your appointment.
        </p>
        {clinicPhone && (
          <p className="text-xs text-emerald-600 mt-3">
            Need to speak sooner? <button type="button" onClick={() => document.dispatchEvent(new CustomEvent('open-callback-modal', { detail: { clinicName, clinicId } }))} className="font-bold underline cursor-pointer">Request a callback</button>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--ink)]">Request Appointment</h3>
        <button onClick={() => setIsOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink2)] text-sm">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="bw-name" className="block text-xs font-medium text-[var(--ink2)] mb-1">Full Name *</label>
          <input type="text" id="bw-name" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="bw-email" className="block text-xs font-medium text-[var(--ink2)] mb-1">Email *</label>
            <input type="email" id="bw-email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]" />
          </div>
          <div>
            <label htmlFor="bw-phone" className="block text-xs font-medium text-[var(--ink2)] mb-1">Phone</label>
            <input type="tel" id="bw-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="bw-date" className="block text-xs font-medium text-[var(--ink2)] mb-1">Preferred Date</label>
            <input type="date" id="bw-date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
              min={minDate}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]" />
          </div>
          <div>
            <label htmlFor="bw-time" className="block text-xs font-medium text-[var(--ink2)] mb-1">Preferred Time</label>
            <select id="bw-time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]">
              <option value="morning">Morning (9-12)</option>
              <option value="afternoon">Afternoon (12-4)</option>
              <option value="evening">Evening (4-7)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="bw-condition" className="block text-xs font-medium text-[var(--ink2)] mb-1">Primary Condition</label>
          <select id="bw-condition" value={condition} onChange={e => setCondition(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.15)]">
            <option value="">Primary Condition (optional)</option>
            <option value="Depression">Depression (MDD)</option>
            <option value="OCD">OCD</option>
            <option value="Anxiety">Anxiety</option>
            <option value="PTSD">PTSD</option>
            <option value="Bipolar">Bipolar Depression</option>
            <option value="Smoking">Smoking Cessation</option>
            <option value="Chronic Pain">Chronic Pain / Fibromyalgia</option>
            <option value="Tinnitus">Tinnitus</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="bw-insurance" className="block text-xs font-medium text-[var(--ink2)] mb-1">Insurance Provider</label>
          <input type="text" id="bw-insurance" value={insurance} onChange={e => setInsurance(e.target.value)} placeholder="Insurance Provider (optional)"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]" />
        </div>

        <div>
          <label htmlFor="bw-notes" className="block text-xs font-medium text-[var(--ink2)] mb-1">Additional Notes</label>
          <textarea id="bw-notes" value={message} onChange={e => setMessage(e.target.value)} placeholder="Additional notes (optional)" rows={2}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] text-sm focus:border-[rgba(10,22,40,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)] resize-none" />
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
          {loading ? 'Sending...' : 'Send Appointment Request'}
        </button>

        <p className="text-[10px] text-[var(--muted)] text-center">
          By submitting, you agree to our <a href="/legal/privacy-policy/" className="underline">Privacy Policy</a>.
          This is a request — the clinic will contact you to confirm.
        </p>
      </form>
    </div>
  );
}
