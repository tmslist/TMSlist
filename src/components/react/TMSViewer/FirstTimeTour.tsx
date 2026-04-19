'use client';

import { useState, useEffect } from 'react';
import { UserIcon, ScientificIcon, FireIcon, ClipboardIcon, WarningIcon, ChartIcon } from '../Icons';

interface TourStep {
  title: string;
  description: string;
  tip?: string;
  stepLabel: string;
}

const STEPS: TourStep[] = [
  {
    stepLabel: 'Step 1 of 6',
    title: 'What is TMS?',
    description: 'Transcranial Magnetic Stimulation uses a magnetic coil to create electric currents in specific brain regions — activating or inhibiting neurons without surgery or medication.',
    tip: 'TMS is FDA-cleared for depression, OCD, and smoking cessation.',
  },
  {
    stepLabel: 'Step 2 of 6',
    title: 'The Brain Visualization',
    description: 'The 3D brain shows where stimulation is applied. Drag to rotate the brain. Hover over any region to see its name (Brodmann area), function, and clinical relevance.',
    tip: 'Try hovering over the left and right sides to see how DLPFC targeting differs.',
  },
  {
    stepLabel: 'Step 3 of 6',
    title: 'Fire Your First Pulse',
    description: 'Click the purple "Fire Pulses" button or press Space. Watch the ring wave propagate from the coil to the brain — each ring represents a magnetic pulse activating neurons.',
    tip: 'Start → Stop → Reset to start fresh. The pulse count shows how many times the coil has fired.',
  },
  {
    stepLabel: 'Step 4 of 6',
    title: 'Pick a Protocol',
    description: 'A "protocol" is a prescription: frequency, intensity, and pulse count. Standard rTMS (10Hz, 36 sessions) is most common. Theta burst (iTBS) is fastest — 600 pulses in just 3 minutes.',
    tip: 'Click any protocol to instantly load its parameters. The sliders then let you fine-tune.',
  },
  {
    stepLabel: 'Step 5 of 6',
    title: 'Read the E-Field Heatmap',
    description: 'The color on the brain surface shows electromagnetic field strength. Blue = weak (subthreshold), Green = therapeutic, Orange/Red = peak activation. Move the Frequency and Intensity sliders to see the field change.',
    tip: 'At 120% MT intensity, the field turns orange/red — the clinical treatment dose for depression.',
  },
  {
    stepLabel: 'Step 6 of 6',
    title: 'Watch Real-Time Feedback',
    description: 'The Monitor tab shows live MEP waveforms, pulse rate, neuron activation count, and E-field strength gauges. The Activity Log narrates every action in plain English — watch it update as you adjust parameters.',
    tip: 'Switch between Patient (👤) and Clinical (🔬) language in the Activity Log.',
  },
];

const STORAGE_KEY = 'tms-tour-v3';

export function FirstTimeTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dir, setDir] = useState<'in' | 'out'>('in');

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

  const dismiss = () => {
    setDir('out');
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      onComplete();
    }, 300);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  if (!visible) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${dir === 'out' ? 'opacity-0' : 'opacity-100'}`} />

      <div
        className={`relative z-10 w-full max-w-md mx-4 mb-8 sm:mb-0 transition-all duration-300 ${
          dir === 'out' ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <div className="bg-slate-900/98 backdrop-blur-2xl border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NeuroSim</span>
                <div className="text-[9px] text-cyan-500 font-medium">{current.stepLabel}</div>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
              aria-label="Skip tour"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-400"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <h3 className="text-lg font-bold text-white mb-2">{current.title}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{current.description}</p>

            {current.tip && (
              <div className="flex items-start gap-2 bg-cyan-500/8 border border-cyan-500/20 rounded-xl px-3 py-2.5">
                <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <p className="text-[10px] text-cyan-300/80 leading-relaxed">{current.tip}</p>
              </div>
            )}
          </div>

          {/* Quick-start checklist (shown on step 1 only) */}
          {step === 0 && (
            <div className="px-6 pb-2">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Start Checklist</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    '🔥 Fire pulses (Space key)',
                    '📋 Choose a protocol (1–6)',
                    '🔬 Hover the brain surface',
                    '📊 Switch to Monitor tab',
                    '⬆️⬇️ Adjust frequency/intensity',
                    '⚠️ Review safety checklist',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] text-slate-400">
                      <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation dots + footer */}
          <div className="flex items-center justify-between px-6 pb-5">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'w-5 bg-cyan-400' : i < step ? 'w-2 bg-violet-500' : 'w-2 bg-slate-700'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={dismiss}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800"
              >
                Skip all
              </button>
              <button
                onClick={prev}
                disabled={step === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                  step === 0
                    ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                    : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 text-white text-[11px] font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/25"
              >
                {step === STEPS.length - 1 ? 'Start Simulating' : 'Next'}
                {step < STEPS.length - 1 && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
