'use client';

import { useState, useEffect } from 'react';

interface TourStep {
  title: string;
  description: string;
  tip?: string;
}

const STEPS: TourStep[] = [
  {
    title: 'What is TMS?',
    description: 'Transcranial Magnetic Stimulation uses a magnetic coil to induce small electrical currents in specific brain regions — without surgery or medication. FDA-cleared for depression, OCD, and smoking cessation.',
  },
  {
    title: 'Pick a scenario',
    description: 'Use the Quick Start row to load a real clinical protocol — Depression, iTBS, or OCD. The 3D model and controls update instantly with the right frequency, intensity, and target region.',
    tip: 'Drag the brain to rotate · scroll to zoom · hover any region to see what it does.',
  },
  {
    title: 'Fire the coil',
    description: 'Press Space (or the Fire Pulses button in Controls) to start the simulation. Watch magnetic rings propagate from the coil into the cortex, and neurons fire in real time.',
    tip: 'Adjust frequency and intensity sliders to see the e-field heatmap shift from cool to hot.',
  },
  {
    title: 'Watch the data',
    description: 'Switch to the Stats tab to see live MEP waveforms, neuron counts, e-field gauges, and a session-narration log — in either patient-friendly or clinical language.',
  },
];

const STORAGE_KEY = 'tms-tour-v4';

export function FirstTimeTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
      else onComplete();
    } catch {
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc to close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      onComplete();
    }, 250);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  if (!visible) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-250 ${closing ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(8px)' }}
      />

      <div
        className={`relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 transition-all duration-250 ${
          closing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--warm)' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink2)' }}>TMS Simulator</div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--warm)' }}>Step {step + 1} of {STEPS.length}</div>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--paper2)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              aria-label="Skip tour"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: '2px', background: 'var(--paper2)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'var(--warm)' }}
            />
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <h3 id="tour-title" className="serif font-semibold mb-2.5" style={{ color: 'var(--ink)', fontSize: '1.5rem', lineHeight: 1.2 }}>
              {current.title}
            </h3>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'var(--ink2)' }}>
              {current.description}
            </p>

            {current.tip && (
              <div
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{ background: 'rgba(201,101,74,0.08)', border: '1px solid rgba(201,101,74,0.25)' }}
              >
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--warm)' }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
                  <span className="font-semibold" style={{ color: 'var(--warm)' }}>Tip · </span>{current.tip}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 pb-5 pt-1" style={{ borderTop: '1px solid var(--line)' }}>
            <div className="flex items-center gap-1.5 pt-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    height: '6px',
                    width: i === step ? '20px' : '6px',
                    background: i === step ? 'var(--warm)' : i < step ? 'var(--ink2)' : 'var(--paper2)',
                    border: i > step ? '1px solid var(--line)' : 'none',
                  }}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-4">
              <button
                onClick={dismiss}
                className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                Skip
              </button>
              <button
                onClick={prev}
                disabled={step === 0}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: step === 0 ? 'rgba(10,22,40,0.25)' : 'var(--ink)',
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                }}
                aria-label="Previous step"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all text-white"
                style={{ background: 'var(--ink)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--ink2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; }}
              >
                {isLast ? 'Start exploring' : 'Next'}
                {!isLast && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
