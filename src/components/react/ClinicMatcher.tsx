'use client';

import { useState } from 'react';

interface MatchResult {
  clinicId: string;
  name: string;
  slug: string;
  matchScore: number;
  matchReasons: string[];
  distance: string;
  hasAvailability: boolean;
  rating: number;
}

interface FormData {
  symptoms: string[];
  severity: number | null;
  treatmentHistory: string[];
  insurance: string;
  city: string;
  state: string;
  preference: 'in-person' | 'telehealth' | 'no-preference';
}

const SYMPTOMS = [
  { value: 'depression', label: 'Depression' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'ocd', label: 'OCD' },
  { value: 'ptsd', label: 'PTSD' },
  { value: 'insomnia', label: 'Insomnia' },
  { value: 'brain fog', label: 'Brain Fog' },
  { value: 'migraines', label: 'Migraines' },
  { value: 'other', label: 'Other' },
];

const TREATMENTS = [
  { value: 'medication', label: 'Medication' },
  { value: 'therapy', label: 'Talk Therapy' },
  { value: 'none', label: 'None yet' },
  { value: 'other', label: 'Other' },
];

const INSURANCE_OPTIONS = [
  { value: '', label: 'Self-Pay / No Insurance' },
  { value: 'BCBS', label: 'Blue Cross Blue Shield' },
  { value: 'Aetna', label: 'Aetna' },
  { value: 'Cigna', label: 'Cigna' },
  { value: 'UnitedHealthcare', label: 'UnitedHealthcare' },
  { value: 'Kaiser', label: 'Kaiser Permanente' },
  { value: 'Humana', label: 'Humana' },
  { value: 'Medicare', label: 'Medicare' },
  { value: 'Medicaid', label: 'Medicaid' },
  { value: 'other', label: 'Other Insurance' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const STEPS = ['Symptoms', 'Severity', 'Treatment History', 'Insurance', 'Location', 'Results'];

export default function ClinicMatcher() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    symptoms: [],
    severity: null,
    treatmentHistory: [],
    insurance: '',
    city: '',
    state: '',
    preference: 'no-preference',
  });
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSymptom = (value: string) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(value)
        ? prev.symptoms.filter(s => s !== value)
        : [...prev.symptoms, value],
    }));
  };

  const toggleTreatment = (value: string) => {
    setForm(prev => ({
      ...prev,
      treatmentHistory: prev.treatmentHistory.includes(value)
        ? prev.treatmentHistory.filter(t => t !== value)
        : [...prev.treatmentHistory, value],
    }));
  };

  const handleSubmit = async () => {
    if (!form.symptoms.length || !form.severity || !form.city || !form.state) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: form.symptoms,
          severity: form.severity,
          treatmentHistory: form.treatmentHistory,
          insurance: form.insurance,
          location: { city: form.city, state: form.state },
          preference: form.preference,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();
      setResults(data.matches || []);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.symptoms.length > 0;
      case 1: return form.severity !== null;
      case 2: return true;
      case 3: return true;
      case 4: return form.city.length > 0 && form.state.length > 0;
      default: return true;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-[var(--ink2)]';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-[var(--paper2)]';
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--ink)] px-6 py-4">
        <h3 className="text-white font-bold text-lg">Find Your TMS Match</h3>
        <p className="text-[rgba(10,22,40,0.2)] text-sm mt-0.5">Answer a few questions to get personalized recommendations</p>
      </div>

      {/* Progress */}
      <div className="px-6 py-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          {STEPS.map((name, i) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= step ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper2)] text-[var(--muted)]'
              }`}>
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-[var(--ink)]' : 'bg-[var(--line)]'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">{STEPS[step]}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 0 && (
          <div>
            <h4 className="text-lg font-bold text-[var(--ink)] mb-2">What symptoms are you experiencing?</h4>
            <p className="text-sm text-[var(--muted)] mb-4">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {SYMPTOMS.map(symptom => (
                <button
                  key={symptom.value}
                  onClick={() => toggleSymptom(symptom.value)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    form.symptoms.includes(symptom.value)
                      ? 'bg-[rgba(10,22,40,0.08)] border-[rgba(10,22,40,0.2)] text-[var(--accent)] ring-1 ring-[rgba(10,22,40,0.2)]'
                      : 'bg-white border-[var(--line)] text-[var(--ink2)] hover:border-[rgba(10,22,40,0.2)]'
                  }`}
                >
                  {symptom.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h4 className="text-lg font-bold text-[var(--ink)] mb-2">How severe are your symptoms?</h4>
            <p className="text-sm text-[var(--muted)] mb-4">This helps us recommend appropriate treatment intensity</p>
            <div className="space-y-3">
              {[
                { value: 1, label: 'Mild', desc: 'Manageable with minor impact on daily life' },
                { value: 2, label: 'Moderate', desc: 'Noticeably affecting work, relationships, or daily activities' },
                { value: 3, label: 'Severe', desc: 'Significantly impacting quality of life, not responding to current treatment' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, severity: opt.value }))}
                  className={`w-full px-4 py-4 rounded-xl border text-left transition-all ${
                    form.severity === opt.value
                      ? 'bg-[rgba(10,22,40,0.08)] border-[rgba(10,22,40,0.2)] ring-1 ring-[rgba(10,22,40,0.2)]'
                      : 'bg-white border-[var(--line)] hover:border-[rgba(10,22,40,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      form.severity === opt.value ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper2)] text-[var(--ink2)]'
                    }`}>
                      {opt.value}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--ink)]">{opt.label}</div>
                      <div className="text-xs text-[var(--muted)]">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 className="text-lg font-bold text-[var(--ink)] mb-2">What treatments have you tried?</h4>
            <p className="text-sm text-[var(--muted)] mb-4">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {TREATMENTS.map(treatment => (
                <button
                  key={treatment.value}
                  onClick={() => toggleTreatment(treatment.value)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    form.treatmentHistory.includes(treatment.value)
                      ? 'bg-[rgba(10,22,40,0.08)] border-[rgba(10,22,40,0.2)] text-[var(--accent)] ring-1 ring-[rgba(10,22,40,0.2)]'
                      : 'bg-white border-[var(--line)] text-[var(--ink2)] hover:border-[rgba(10,22,40,0.2)]'
                  }`}
                >
                  {treatment.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="text-lg font-bold text-[var(--ink)] mb-2">Do you have insurance?</h4>
            <p className="text-sm text-[var(--muted)] mb-4">We'll match you with clinics that accept your plan</p>
            <select
              value={form.insurance}
              onChange={e => setForm(prev => ({ ...prev, insurance: e.target.value }))}
              className="w-full px-4 py-3 border border-[var(--line)] rounded-xl text-[var(--ink)] bg-white focus:ring-2 focus:ring-[rgba(10,22,40,0.15)] focus:border-[var(--ink2)] outline-none"
            >
              {INSURANCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-bold text-[var(--ink)] mb-2">Location</h4>
              <p className="text-sm text-[var(--muted)] mb-4">Enter your city and state</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--ink2)] mb-1.5">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Los Angeles"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(10,22,40,0.15)] focus:border-[var(--ink2)]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ink2)] mb-1.5">State</label>
                <select
                  value={form.state}
                  onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[rgba(10,22,40,0.15)] focus:border-[var(--ink2)]"
                >
                  <option value="">Select</option>
                  {US_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--ink2)] mb-3">Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'in-person', label: 'In-Person' },
                  { value: 'telehealth', label: 'Telehealth' },
                  { value: 'no-preference', label: 'No Preference' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(prev => ({ ...prev, preference: opt.value as any }))}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.preference === opt.value
                        ? 'bg-[rgba(10,22,40,0.08)] border-[rgba(10,22,40,0.2)] text-[var(--accent)]'
                        : 'bg-white border-[var(--line)] text-[var(--ink2)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-[var(--ink)]">Your Top Matches</h4>
              <button onClick={() => { setStep(0); setResults([]); }} className="text-sm text-[var(--accent)] font-semibold">
                Start Over
              </button>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--muted)]">No matches found. Try broadening your search.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.slice(0, 3).map((match, i) => (
                  <div key={match.clinicId} className="bg-white rounded-xl border border-[var(--line)] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-bold text-[var(--ink)]">{match.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          {match.distance && (
                            <span className="text-xs text-[var(--muted)]">{match.distance}</span>
                          )}
                          {match.rating > 0 && (
                            <>
                              <span className="text-[var(--line)]">|</span>
                              <span className="text-xs text-[var(--muted)]">{match.rating.toFixed(1)} stars</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`${getScoreBg(match.matchScore)} rounded-full px-3 py-1.5 text-center ml-3`}>
                        <div className={`text-xl font-bold ${getScoreColor(match.matchScore)}`}>{match.matchScore}%</div>
                        <div className="text-xs text-[var(--muted)]">match</div>
                      </div>
                    </div>

                    {match.matchReasons.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {match.matchReasons.slice(0, 3).map((reason, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-[var(--ink2)]">
                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {reason}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <a
                        href={`/clinic/${match.slug}`}
                        className="flex-1 py-2 px-4 bg-[var(--ink)] hover:bg-[var(--ink2)] text-white text-sm font-semibold rounded-lg text-center transition-colors"
                      >
                        View Clinic
                      </a>
                      {match.hasAvailability && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                          Accepting Patients
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <p className="text-xs text-[var(--muted)] text-center">
                  Showing top {Math.min(3, results.length)} of {results.length} matches
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      {step < 5 && (
        <div className="px-6 py-4 border-t border-[var(--line)] flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 text-sm font-medium text-[var(--ink2)] hover:text-[var(--ink)] transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-[var(--ink)] hover:bg-[var(--ink2)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="px-6 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Finding Matches...' : 'Find My Matches'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}