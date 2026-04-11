import { useState, useMemo } from 'react';

interface ClinicPricing {
  price_range?: 'budget' | 'moderate' | 'premium';
  session_price_min?: number;
  session_price_max?: number;
  full_course_price?: number;
  free_consultation?: boolean;
  accepts_insurance?: boolean;
}

interface Props {
  clinicPricing?: ClinicPricing;
}

const NATIONAL_AVG_MIN = 6000;
const NATIONAL_AVG_MAX = 12000;
const DEFAULT_SESSION_MIN = 200;
const DEFAULT_SESSION_MAX = 350;

export default function CostEstimator({ clinicPricing }: Props) {
  const [sessions, setSessions] = useState(36);
  const [hasInsurance, setHasInsurance] = useState(false);

  const sessionMin = clinicPricing?.session_price_min || DEFAULT_SESSION_MIN;
  const sessionMax = clinicPricing?.session_price_max || DEFAULT_SESSION_MAX;
  const acceptsInsurance = clinicPricing?.accepts_insurance ?? false;
  const freeConsult = clinicPricing?.free_consultation ?? false;

  const estimate = useMemo(() => {
    const totalMin = sessionMin * sessions;
    const totalMax = sessionMax * sessions;
    const insuranceDiscountFactor = 0.2; // Patients typically pay ~20% with insurance
    const insuredMin = Math.round(totalMin * insuranceDiscountFactor);
    const insuredMax = Math.round(totalMax * insuranceDiscountFactor);

    return {
      totalMin,
      totalMax,
      insuredMin,
      insuredMax,
      perSessionMin: sessionMin,
      perSessionMax: sessionMax,
    };
  }, [sessions, sessionMin, sessionMax]);

  const displayMin = hasInsurance && acceptsInsurance ? estimate.insuredMin : estimate.totalMin;
  const displayMax = hasInsurance && acceptsInsurance ? estimate.insuredMax : estimate.totalMax;

  const avgMid = (NATIONAL_AVG_MIN + NATIONAL_AVG_MAX) / 2;
  const estimateMid = (displayMin + displayMax) / 2;
  const comparison = estimateMid < avgMid * 0.9 ? 'below' : estimateMid > avgMid * 1.1 ? 'above' : 'average';

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          TMS Cost Estimator
        </h3>
        <p className="text-emerald-100 text-sm mt-1">Estimate your out-of-pocket costs</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Sessions Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">Number of Sessions</label>
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{sessions}</span>
          </div>
          <input
            type="range"
            min={1}
            max={36}
            value={sessions}
            onChange={(e) => setSessions(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 session</span>
            <span>36 sessions (full course)</span>
          </div>
        </div>

        {/* Insurance Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-700">I have insurance</span>
            {!acceptsInsurance && (
              <p className="text-[11px] text-slate-400 mt-0.5">This clinic has not confirmed insurance acceptance</p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hasInsurance}
            onClick={() => setHasInsurance(!hasInsurance)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              hasInsurance ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                hasInsurance ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Estimate Display */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Estimated Total Cost</div>
          <div className="text-3xl font-bold text-slate-900">
            {fmt(displayMin)} &ndash; {fmt(displayMax)}
          </div>
          {hasInsurance && acceptsInsurance && (
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Estimated with insurance (you may pay ~20% of total)
            </p>
          )}
          {hasInsurance && !acceptsInsurance && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              Insurance status not confirmed -- showing full price
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Per Session</div>
              <div className="text-sm font-bold text-slate-700">
                {fmt(estimate.perSessionMin)} &ndash; {fmt(estimate.perSessionMax)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Sessions</div>
              <div className="text-sm font-bold text-slate-700">{sessions}</div>
            </div>
          </div>
        </div>

        {/* National Average Comparison */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-white">
          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            comparison === 'below' ? 'bg-emerald-50 text-emerald-600' :
            comparison === 'above' ? 'bg-red-50 text-red-500' :
            'bg-blue-50 text-blue-500'
          }`}>
            {comparison === 'below' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            ) : comparison === 'above' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700">
              {comparison === 'below' ? 'Below' : comparison === 'above' ? 'Above' : 'Near'} National Average
            </div>
            <div className="text-xs text-slate-400">
              National average for a full TMS course: {fmt(NATIONAL_AVG_MIN)} &ndash; {fmt(NATIONAL_AVG_MAX)}
            </div>
          </div>
        </div>

        {/* Free Consultation Note */}
        {freeConsult && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            This clinic offers a free initial consultation
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          This is an estimate only and does not constitute a quote or guarantee of pricing.
          Actual costs vary based on your insurance plan, treatment protocol, and clinic policies.
          Contact the clinic directly for accurate pricing information.
        </p>
      </div>
    </div>
  );
}
