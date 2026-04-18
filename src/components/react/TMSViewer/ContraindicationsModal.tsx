'use client';

import { useState } from 'react';
import { useTMS } from './TMSContext';
import { WarningIcon } from '../Icons';
import { contraindications, getContraindicationResult } from '../../../data/contraindications';

export function ContraindicationsModal() {
  const { dispatch } = useTMS();
  const [open, setOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<ReturnType<typeof getContraindicationResult> | null>(null);

  if (!open) return null;

  const handleToggle = (id: string) => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    setResult(null);
  };

  const handleCheck = () => {
    setResult(getContraindicationResult(answers));
  };

  const handleDismiss = () => {
    setOpen(false);
    dispatch({ type: 'TOGGLE_PLAY' });
  };

  const resultColors = {
    safe: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', label: 'Likely Safe to Proceed' },
    caution: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', label: 'Proceed with Caution' },
    consult: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-300', label: 'Consult Your Physician' },
    'not-recommended': { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300', label: 'Not Recommended' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚠️</span>
              <h2 className="text-lg font-bold text-white">Safety Pre-Screening</h2>
            </div>
            <p className="text-xs text-slate-400">Answer these questions before starting a TMS session.</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Questions */}
          {!result && contraindications.map(ci => (
            <div key={ci.id} className="flex items-start gap-3">
              <button
                onClick={() => handleToggle(ci.id)}
                className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  answers[ci.id]
                    ? ci.severity === 'absolute' ? 'bg-rose-500 border-rose-500' :
                      ci.severity === 'relative' ? 'bg-orange-500 border-orange-500' :
                      'bg-amber-500 border-amber-500'
                    : 'border-slate-500 hover:border-slate-400'
                }`}
              >
                {answers[ci.id] && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div>
                <p className="text-sm text-slate-200">{ci.question}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{ci.detail}</p>
              </div>
            </div>
          ))}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 border ${resultColors[result.status].bg} ${resultColors[result.status].border}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Assessment</div>
              <div className={`text-sm font-bold ${resultColors[result.status].text} mb-2`}>
                {resultColors[result.status].label}
              </div>
              {result.concerns.length > 0 && (
                <ul className="space-y-1">
                  {result.concerns.map((c, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0 mt-0.5">•</span>{c.replace('Absolute contraindication: ', '').replace('Relative contraindication: ', '').replace('Precaution: ', '')}
                    </li>
                  ))}
                </ul>
              )}
              {result.status === 'safe' && (
                <p className="text-xs text-slate-300 mt-1">
                  Based on your answers, you may be a candidate for TMS. This is not medical advice — your physician will make the final determination.
                </p>
              )}
              <p className="text-[10px] text-slate-500 mt-2">
                This checklist is educational only. Always consult a qualified TMS physician.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!result ? (
              <>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-400 text-sm hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheck}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 border border-violet-500 text-white text-sm font-semibold hover:bg-violet-500 transition-all"
                >
                  Check Eligibility
                </button>
              </>
            ) : (
              <button
                onClick={handleDismiss}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  result.status === 'not-recommended'
                    ? 'bg-rose-600 text-white cursor-not-allowed opacity-50'
                    : result.status === 'consult'
                    ? 'bg-orange-600 text-white'
                    : result.status === 'caution'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {result.status === 'not-recommended' ? 'Close' : 'Proceed to Simulation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
