import { useState } from 'react';

interface Props {
  clinicId: string;
  clinicName: string;
  clinicEmail?: string;
}

const CONDITIONS = ['Depression', 'Anxiety', 'OCD', 'PTSD', 'Other'];
const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (8am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 8pm)' },
];

export default function AppointmentRequest({ clinicId, clinicName, clinicEmail }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: 'morning',
    condition: '',
    insurance: '',
    message: '',
    consent: false,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) {
      setErrorMsg('Please agree to the consent before submitting.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/leads/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          clinicName,
          clinicEmail,
          ...form,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
        <p className="text-slate-500 mb-6">
          Your appointment request has been sent to <strong>{clinicName}</strong>.
        </p>

        <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3">
          <h4 className="text-sm font-bold text-slate-700">What to Expect Next</h4>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <p className="text-sm text-slate-600">The clinic will review your request within 1-2 business days.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <p className="text-sm text-slate-600">They will contact you by phone or email to confirm your appointment.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <p className="text-sm text-slate-600">Prepare any insurance cards and medication lists for your visit.</p>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition';
  const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-4">
        <h3 className="text-white font-bold text-lg">Request an Appointment</h3>
        <p className="text-violet-200 text-sm mt-0.5">{clinicName}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="John Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="(555) 123-4567"
            className={inputClass}
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Preferred Date</label>
            <input
              type="date"
              value={form.preferredDate}
              onChange={(e) => update('preferredDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Preferred Time</label>
            <select
              value={form.preferredTime}
              onChange={(e) => update('preferredTime', e.target.value)}
              className={inputClass}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className={labelClass}>Condition / Reason for Visit</label>
          <select
            value={form.condition}
            onChange={(e) => update('condition', e.target.value)}
            className={inputClass}
          >
            <option value="">Select a condition</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Insurance */}
        <div>
          <label className={labelClass}>Insurance Provider</label>
          <input
            type="text"
            value={form.insurance}
            onChange={(e) => update('insurance', e.target.value)}
            placeholder="e.g. Blue Cross Blue Shield"
            className={inputClass}
          />
        </div>

        {/* Message */}
        <div>
          <label className={labelClass}>Additional Message</label>
          <textarea
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            placeholder="Any additional information the clinic should know..."
            rows={3}
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update('consent', e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-xs text-slate-500 leading-relaxed">
            I consent to sharing my information with {clinicName} for the purpose of scheduling a consultation.
            I understand this is a request only and does not guarantee an appointment.
          </span>
        </label>

        {errorMsg && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {status === 'submitting' ? 'Sending Request...' : 'Send Appointment Request'}
        </button>
      </form>
    </div>
  );
}
