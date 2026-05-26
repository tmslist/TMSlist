'use client';

import { useState, useEffect, useRef } from 'react';
import { useTMS } from './TMSContext';
import { contraindications, getContraindicationResult } from '../../../data/contraindications';

interface ContraindicationsModalProps {
  onDismiss?: () => void;
}

export function ContraindicationsModal({ onDismiss }: ContraindicationsModalProps = {}) {
  const { dispatch } = useTMS();
  const [open, setOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<ReturnType<typeof getContraindicationResult> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Esc to close + initial focus
  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    onDismiss?.();
  };

  const handleToggle = (id: string) => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    setResult(null);
  };

  const handleCheck = () => {
    setResult(getContraindicationResult(answers));
  };

  const handleProceed = () => {
    close();
    dispatch({ type: 'TOGGLE_PLAY' });
  };

  const resultStyles: Record<string, { color: string; bg: string; border: string; label: string; canProceed: boolean }> = {
    safe:              { color: '#16a34a', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.4)',  label: 'Likely safe to proceed', canProceed: true },
    caution:           { color: '#D29922', bg: 'rgba(210,153,34,0.10)', border: 'rgba(210,153,34,0.4)', label: 'Proceed with caution',   canProceed: true },
    consult:           { color: '#C9654A', bg: 'rgba(201,101,74,0.10)', border: 'rgba(201,101,74,0.4)', label: 'Consult your physician', canProceed: false },
    'not-recommended': { color: '#dc2626', bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.4)',  label: 'Not recommended',         canProceed: false },
  };
  const r = result ? resultStyles[result.status] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 flex items-start justify-between gap-4"
          style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)' }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(201,101,74,0.12)', color: 'var(--warm)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.667 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.333.19 3 1.73 3z" />
              </svg>
            </div>
            <div>
              <h2 id="safety-modal-title" className="serif font-semibold leading-tight" style={{ color: 'var(--ink)', fontSize: '1.25rem' }}>
                Safety pre-screening
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Answer these questions before starting a TMS session.
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={close}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--paper2)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
            aria-label="Close safety pre-screening"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-3">
          {/* Questions */}
          {!result && contraindications.map((ci) => {
            const checked = !!answers[ci.id];
            const sev = ci.severity;
            const checkedColor = sev === 'absolute' ? '#dc2626' : sev === 'relative' ? '#C9654A' : '#D29922';
            return (
              <button
                key={ci.id}
                type="button"
                onClick={() => handleToggle(ci.id)}
                className="w-full flex items-start gap-3 text-left rounded-xl p-3 transition-colors"
                style={{
                  background: checked ? 'rgba(201,101,74,0.06)' : 'transparent',
                  border: `1px solid ${checked ? 'rgba(201,101,74,0.25)' : 'var(--line)'}`,
                }}
              >
                <div
                  className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                  style={{
                    background: checked ? checkedColor : 'var(--paper2)',
                    border: checked ? `2px solid ${checkedColor}` : '2px solid var(--line)',
                  }}
                  aria-hidden="true"
                >
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--ink)' }}>{ci.question}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{ci.detail}</p>
                </div>
              </button>
            );
          })}

          {/* Result */}
          {result && r && (
            <div
              className="rounded-xl p-4"
              style={{ background: r.bg, border: `1px solid ${r.border}` }}
              role="alert"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                Assessment
              </div>
              <div className="text-sm font-bold mb-2" style={{ color: r.color }}>
                {r.label}
              </div>
              {result.concerns.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {result.concerns.map((c, i) => (
                    <li key={i} className="text-xs flex items-start gap-2 leading-relaxed" style={{ color: 'var(--ink2)' }}>
                      <span className="shrink-0 mt-0.5" style={{ color: r.color }}>•</span>
                      <span>{c.replace('Absolute contraindication: ', '').replace('Relative contraindication: ', '').replace('Precaution: ', '')}</span>
                    </li>
                  ))}
                </ul>
              )}
              {result.status === 'safe' && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
                  Based on your answers you may be a candidate for TMS. This is not medical advice — your physician will make the final determination.
                </p>
              )}
              <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                This checklist is educational only. Always consult a qualified TMS physician.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!result ? (
              <>
                <button
                  onClick={close}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--paper2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheck}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--ink)', color: 'white' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--ink2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; }}
                >
                  Check eligibility
                </button>
              </>
            ) : r?.canProceed ? (
              <>
                <button
                  onClick={() => { setResult(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'transparent' }}
                >
                  Edit answers
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
                  style={{ background: r.color }}
                >
                  Proceed to simulation
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setResult(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'transparent' }}
                >
                  Edit answers
                </button>
                <button
                  onClick={close}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: r.color }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
