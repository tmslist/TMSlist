'use client';

import { useState, useEffect, useRef } from 'react';
import { TMSProvider, useTMS } from './TMSContext';
import { TMSCanvas } from './TMSCanvas';
import { TMSControlsPanel } from './TMSControlsPanel';
import { MEPWaveform } from './MEPWaveform';
import { SessionTimeline } from './SessionTimeline';
import { CoilHeatGauge } from './CoilHeatGauge';
import { DosimetryDisplay } from './DosimetryDisplay';
import { PulsePatternWaveform } from './PulsePatternWaveform';
import { ProtocolComparison } from './ProtocolComparison';
import { ContraindicationsModal } from './ContraindicationsModal';
import { ActivityLog } from './ActivityLog';
import { SessionCountdown } from './SessionCountdown';
import { AchievementBadges } from './AchievementBadges';
import { InsuranceEstimator } from './InsuranceEstimator';
import { FirstTimeTour } from './FirstTimeTour';
import { EFieldGauge } from './EFieldGauge';
import { NeuronCounter } from './NeuronCounter';
import {
  useNarration,
  pulseNarrations,
  intensityNarrations,
  regionNarrations,
  achievementNarrations,
} from '../../../hooks/useNarration';
import { useAchievements } from '../../../hooks/useAchievements';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { protocols } from '../../../data/tmsProtocols';
import { useToneGenerator } from '../../../hooks/useToneGenerator';

interface TMSViewerProps {
  compact?: boolean;
}

function TMSViewerInner({ compact = false }: TMSViewerProps) {
  const { state, dispatch } = useTMS();
  const { fireClick } = useToneGenerator();
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<{ emoji: string; name: string } | null>(null);
  const [showTour, setShowTour] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('controls');
  const protocolsSelectedRef = useRef<Set<string>>(new Set());
  const prevRegionRef = useRef<string | null>(null);
  const hasAppliedURLRef = useRef(false);
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const narration = useNarration();
  const { addEntry, clear: clearNarration } = narration;

  useEffect(() => {
    setMounted(true);
  }, []);

  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => setInView(e.isIntersecting)),
      { threshold: 0.05 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView && state.isPlaying) {
      dispatch({ type: 'TOGGLE_PLAY' });
    }
  }, [inView, state.isPlaying, dispatch]);

  useEffect(() => {
    if (state.selectedProtocol?.name) {
      protocolsSelectedRef.current.add(state.selectedProtocol.name);
    }
  }, [state.selectedProtocol]);

  useEffect(() => {
    if (hasAppliedURLRef.current) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const proto = params.get('proto');
      const hz = params.get('hz');
      const mt = params.get('mt');
      if (proto || hz || mt) {
        if (proto) {
          const p = protocols.find(pr => pr.name === proto);
          if (p) dispatch({ type: 'SELECT_PROTOCOL', protocol: p });
        }
        if (hz) {
          const f = parseFloat(hz);
          if (!isNaN(f)) dispatch({ type: 'SET_FREQUENCY', frequency: f });
        }
        if (mt) {
          const i = parseInt(mt);
          if (!isNaN(i)) dispatch({ type: 'SET_INTENSITY', intensity: i });
        }
      }
    } catch {
      // ignore
    }
    hasAppliedURLRef.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!hasAppliedURLRef.current) return;
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    urlDebounceRef.current = setTimeout(() => {
      try {
        const params = new URLSearchParams();
        if (state.selectedProtocol?.name) params.set('proto', state.selectedProtocol.name);
        params.set('hz', String(state.frequency));
        params.set('mt', String(state.intensity));
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      } catch {
        // ignore
      }
    }, 300);
  }, [state.selectedProtocol, state.frequency, state.intensity]);

  const { allBadges, resetBadges } = useAchievements(
    state.pulseCount,
    state.isPlaying,
    state.selectedProtocol?.name ?? null,
    state.hoveredRegion?.name ?? null,
    protocolsSelectedRef.current,
  );

  const earnedIdsRef = useRef<Set<string>>(new Set(allBadges.filter(b => b.earned).map(b => b.id)));
  useEffect(() => {
    const currentEarned = new Set(allBadges.filter(b => b.earned).map(b => b.id));
    for (const badge of allBadges) {
      if (badge.earned && !earnedIdsRef.current.has(badge.id)) {
        setNewlyEarnedBadge({ emoji: badge.emoji, name: badge.name });
        setShowAchievementModal(true);
        setTimeout(() => setShowAchievementModal(false), 3500);
        addEntry(
          achievementNarrations(badge.name, 'clinical').clinical,
          achievementNarrations(badge.name, 'patient').patient,
          'achievement',
        );
      }
    }
    earnedIdsRef.current = currentEarned;
  }, [allBadges, addEntry]);

  const prevPlayingRef = useRef(false);
  useEffect(() => {
    if (state.isPlaying && !prevPlayingRef.current) {
      const isTBS = state.selectedProtocol?.pulsePattern === 'tbs-burst' ||
                    state.selectedProtocol?.pulsePattern === 'ctbs';
      const { clinical, patient } = pulseNarrations(
        state.frequency, state.intensity,
        state.hoveredRegion?.name ?? 'left DLPFC',
        isTBS, 'patient',
      );
      const { clinical: c, patient: p } = intensityNarrations(
        state.intensity,
        state.hoveredRegion?.name ?? 'DLPFC',
        'patient',
      );
      addEntry(clinical, patient, 'pulse');
      addEntry(c, p, 'info');
    }
    prevPlayingRef.current = state.isPlaying;
  }, [state.isPlaying, addEntry, state.frequency, state.intensity, state.selectedProtocol, state.hoveredRegion]);

  const prevProtoRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.selectedProtocol && prevProtoRef.current !== state.selectedProtocol.name) {
      const n = state.selectedProtocol;
      const clinical = `Protocol: ${n.name} — ${n.frequencyDisplay}, ${n.intensityDisplay}, ${n.pulsesDisplay}. Evidence: ${n.evidence}.`;
      const patient = `${n.name} — delivers ${n.pulsesDisplay} over ${n.duration} with ${n.evidence.toLowerCase()} clinical evidence.`;
      addEntry(clinical, patient, 'protocol');
    }
    prevProtoRef.current = state.selectedProtocol?.name ?? null;
  }, [state.selectedProtocol, addEntry]);

  useEffect(() => {
    if (state.hoveredRegion && state.hoveredRegion.name !== prevRegionRef.current) {
      const { clinical, patient } = regionNarrations(
        state.hoveredRegion.name,
        state.hoveredRegion.clinicalNote,
        'patient',
      );
      addEntry(clinical, patient, 'region');
    }
    prevRegionRef.current = state.hoveredRegion?.name ?? null;
  }, [state.hoveredRegion, addEntry]);

  const prevPulseRef = useRef(state.pulseCount);
  useEffect(() => {
    const milestones = [100, 500, 1000, 2000, 3000, 5000];
    for (const m of milestones) {
      if (prevPulseRef.current < m && state.pulseCount >= m) {
        const clinical = `Milestone: ${m.toLocaleString()} cumulative pulses delivered.`;
        const patient = `${m.toLocaleString()} pulses — ${Math.round(m / (state.frequency || 10))} seconds of stimulation!`;
        addEntry(clinical, patient, 'pulse');
      }
    }
    prevPulseRef.current = state.pulseCount;
  }, [state.pulseCount, state.frequency, addEntry]);

  useKeyboardShortcuts({
    onPlayToggle: () => {
      if (!state.isPlaying) fireClick();
      dispatch({ type: 'TOGGLE_PLAY' });
    },
    onReset: () => {
      dispatch({ type: 'STOP_PLAYING' });
      dispatch({ type: 'RESET_PULSE_COUNT' });
      clearNarration();
    },
    onSelectProtocol: (p) => dispatch({ type: 'SELECT_PROTOCOL', protocol: p }),
    onFrequencyUp: () => dispatch({ type: 'SET_FREQUENCY', frequency: Math.min(state.frequency + 0.5, 50) }),
    onFrequencyDown: () => dispatch({ type: 'SET_FREQUENCY', frequency: Math.max(state.frequency - 0.5, 0.5) }),
    onIntensityUp: () => dispatch({ type: 'SET_INTENSITY', intensity: Math.min(state.intensity + 5, 140) }),
    onIntensityDown: () => dispatch({ type: 'SET_INTENSITY', intensity: Math.max(state.intensity - 5, 60) }),
  });

  if (compact) {
    return (
      <div className="w-full flex flex-col gap-3">
        <div><TMSCanvas compact /></div>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-700/30">
            <MEPWaveform intensityPct={state.intensity} pulseCount={state.pulseCount} isPlaying={state.isPlaying} />
          </div>
          <div className="p-3"><TMSControlsPanel /></div>
        </div>
      </div>
    );
  }

  const handlePlayToggle = () => {
    if (!state.isPlaying) fireClick();
    dispatch({ type: 'TOGGLE_PLAY' });
  };
  const handleReset = () => {
    dispatch({ type: 'STOP_PLAYING' });
    dispatch({ type: 'RESET_PULSE_COUNT' });
    clearNarration();
  };
  const handleRestartTour = () => {
    try { localStorage.removeItem('tms-tour-v4'); } catch { /* ignore */ }
    setShowTour(true);
  };

  const presets = [
    { protoName: 'Standard rTMS',        label: 'Depression', sub: '10 Hz · 36 sessions' },
    { protoName: 'Theta Burst (iTBS)',   label: 'iTBS',       sub: '50 Hz · 3 min' },
    { protoName: 'Deep TMS (BrainsWay)', label: 'OCD',        sub: 'H-coil · 29 sessions' },
  ];

  const freqFillPct = ((state.frequency - 0.5) / (50 - 0.5)) * 100;
  const intFillPct = ((state.intensity - 60) / (140 - 60)) * 100;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'controls', label: 'Controls' },
    { id: 'monitors', label: 'Monitors' },
    { id: 'session',  label: 'Session' },
    { id: 'compare',  label: 'Compare' },
    { id: 'tools',    label: 'Tools' },
    { id: 'help',     label: 'Help' },
  ];

  return (
    <>
      {/* First-time tour */}
      {showTour && (
        <FirstTimeTour onComplete={() => setShowTour(false)} />
      )}

      {/* Achievement toast */}
      {showAchievementModal && newlyEarnedBadge && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-amber-500/90 border border-amber-400/50 backdrop-blur-xl text-white rounded-xl px-5 py-3 shadow-2xl shadow-amber-500/30 animate-[slideInRight_0.4s_cubic-bezier(0.32,0.72,0,1)] flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 shrink-0" dangerouslySetInnerHTML={{ __html: newlyEarnedBadge.emoji }} />
            <div>
              <div className="text-xs font-bold">{newlyEarnedBadge.name}</div>
              <div className="text-[10px] text-amber-100/80">Achievement unlocked!</div>
            </div>
          </div>
        </div>
      )}

      {/* Safety modal */}
      {showSafetyModal && (
        <ContraindicationsModal onDismiss={() => setShowSafetyModal(false)} />
      )}

      {/* MAIN — parchment frame holding a dark instrument */}
      <div
        ref={containerRef}
        className={`w-full transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, var(--paper) 0%, var(--paper2) 100%)',
            border: '1px solid var(--line)',
            borderRadius: 24,
            padding: 6,
            boxShadow:
              '0 24px 60px -24px rgba(10,22,40,0.18), 0 4px 12px -6px rgba(10,22,40,0.06)',
          }}
        >
          {/* Parchment header */}
          <header
            className="flex items-center justify-between flex-wrap gap-3"
            style={{ padding: '14px 18px 12px' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(201,101,74,0.10)',
                  border: '1px solid rgba(201,101,74,0.22)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9654A" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3
                  className="serif"
                  style={{ fontSize: '1.5rem', color: 'var(--ink)', margin: 0, lineHeight: 1.05 }}
                >
                  TMS <span className="italic" style={{ color: 'var(--warm)' }}>Simulator</span>
                </h3>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: 'var(--muted)',
                    marginTop: 2,
                  }}
                >
                  Educational instrument · not for treatment
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSafetyModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 transition-all"
                style={{
                  padding: '6px 12px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(202,138,4,0.08)',
                  border: '1px solid rgba(202,138,4,0.25)',
                  color: '#A16207',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.667 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.333.19 3 1.73 3z" />
                </svg>
                Safety check
              </button>
              <button
                onClick={handleRestartTour}
                className="inline-flex items-center gap-1.5 transition-all"
                style={{
                  padding: '6px 12px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tour
              </button>
            </div>
          </header>

          {/* Dark instrument body */}
          <div
            style={{
              background: 'linear-gradient(180deg, #0A1628 0%, #0E1A2E 100%)',
              borderRadius: 18,
              padding: 16,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Scenario row */}
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(251,250,247,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Scenario
                </span>
                <span style={{ fontSize: 10, color: 'rgba(251,250,247,0.30)' }}>loads protocol + region</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presets.map(({ protoName, label, sub }) => {
                  const proto = protocols.find(p => p.name === protoName);
                  const isActive = state.selectedProtocol?.name === protoName;
                  return (
                    <button
                      key={protoName}
                      onClick={() => proto && dispatch({ type: 'SELECT_PROTOCOL', protocol: proto })}
                      className="text-left transition-all"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: isActive ? 'rgba(201,101,74,0.18)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(201,101,74,0.55)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isActive
                          ? 'inset 0 0 0 1px rgba(201,101,74,0.20), 0 0 24px -8px rgba(201,101,74,0.40)'
                          : 'none',
                      }}
                      aria-pressed={isActive}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#D4806A' : 'rgba(251,250,247,0.95)' }}>{label}</div>
                      <div style={{ fontSize: 10, marginTop: 2, color: isActive ? 'rgba(212,128,106,0.7)' : 'rgba(255,255,255,0.5)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>{sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN STAGE: 2-column on desktop — Canvas left, Console right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
              {/* Stage (left) */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="relative">
                  <TMSCanvas inView={inView} />

                  {/* Region pill — top right */}
                  <div
                    className="absolute top-3 right-3 hidden sm:flex items-center gap-2"
                    style={{
                      background: 'rgba(10,22,40,0.65)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(201,101,74,0.30)',
                      borderRadius: 10,
                      padding: '5px 10px',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#D4806A',
                        boxShadow: '0 0 6px rgba(212,128,106,0.6)',
                      }}
                    />
                    <div style={{ lineHeight: 1.1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#FBFAF7' }}>
                        {state.hoveredRegion?.name ?? 'Left DLPFC'}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(251,250,247,0.55)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
                        {state.hoveredRegion?.brodmannArea ?? 'BA 46/9'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transport rail — under canvas, full-width */}
                <div
                  className="flex items-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: 8,
                  }}
                >
                  <button
                    onClick={handlePlayToggle}
                    className="inline-flex items-center justify-center gap-2 transition-all"
                    style={{
                      flex: '1 1 auto',
                      minHeight: 40,
                      padding: '0 18px',
                      borderRadius: 10,
                      background: state.isPlaying ? '#1E2A3B' : '#C9654A',
                      color: '#FBFAF7',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: state.isPlaying
                        ? 'inset 0 0 0 1px rgba(201,101,74,0.5)'
                        : '0 4px 14px -4px rgba(201,101,74,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                    aria-label={state.isPlaying ? 'Stop pulses' : 'Fire pulses'}
                  >
                    {state.isPlaying ? (
                      <>
                        <span className="w-2 h-2 rounded-full" style={{ background: '#D4806A', boxShadow: '0 0 6px rgba(212,128,106,0.8)' }} />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        <span>Fire pulses</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center transition-all"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(251,250,247,0.7)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    aria-label="Reset"
                    title="Reset (R)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <div
                    className="hidden sm:flex flex-col items-center justify-center px-4"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', minWidth: 110 }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(251,250,247,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Pulses
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: 16, fontWeight: 700, color: '#FBFAF7', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
                    >
                      {state.pulseCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Console (right) */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                <BrandedSlider
                  label="Frequency"
                  unit="Hz"
                  value={state.frequency}
                  fillPct={freqFillPct}
                  min={0.5}
                  max={50}
                  step={0.5}
                  marks={['0.5', '10 · std', '50']}
                  onChange={v => dispatch({ type: 'SET_FREQUENCY', frequency: v })}
                  ariaLabel="Pulse frequency in Hz"
                />
                <BrandedSlider
                  label="Intensity"
                  unit="% MT"
                  value={state.intensity}
                  fillPct={intFillPct}
                  min={60}
                  max={140}
                  step={5}
                  marks={['60', '100 · MT', '140']}
                  onChange={v => dispatch({ type: 'SET_INTENSITY', intensity: v })}
                  ariaLabel="Stimulation intensity, percent of motor threshold"
                />

                {/* Live readouts grid */}
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Pulses"  sublabel="cumulative" value={state.pulseCount.toLocaleString()} accent="#D4806A" />
                  <Metric label="E-field" sublabel="cortex V/m" value={`${Math.round(state.intensity * 0.7)}`} accent="#C9654A" />
                  <Metric label="Neurons" sublabel="activated"  value={`${(Math.min(state.pulseCount * 8, 999_999) / 1000).toFixed(1)}k`} accent="#3FB950" />
                  <Metric label="Session" sublabel="duration"   value={state.selectedProtocol?.duration?.split(' ')[0] ?? '—'} accent="#D29922" />
                </div>

                {/* Hint strip */}
                <div
                  className="flex items-center justify-center gap-2 flex-wrap"
                  style={{
                    fontSize: 10,
                    color: 'rgba(251,250,247,0.45)',
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                  }}
                >
                  <span>Press</span>
                  <kbd style={kbdStyle}>Space</kbd>
                  <span>to fire ·</span>
                  <kbd style={kbdStyle}>R</kbd>
                  <span>reset</span>
                </div>
              </div>
            </div>

            {/* TABBED INSTRUMENT PANELS */}
            <div role="tablist" aria-label="Simulator panels" className="tms-tabs mb-3">
              {TABS.map(t => (
                <button
                  key={t.id}
                  role="tab"
                  className="tms-tab"
                  aria-selected={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div role="tabpanel">
              {activeTab === 'controls' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card>
                    <CardTitle title="Full controls" hint="All protocols, coil angle / depth, region detail" />
                    <TMSControlsPanel />
                  </Card>
                  <Card>
                    <CardTitle title="Coil heat & dosimetry" />
                    <CoilHeatGauge />
                    <div
                      className="mt-2 grid grid-cols-2 gap-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}
                    >
                      <DosimetryDisplay />
                      <SessionCountdown />
                    </div>
                  </Card>
                </div>
              )}
              {activeTab === 'monitors' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card>
                    <CardTitle title="MEP waveform" hint="Motor evoked potential — amplitude grows with intensity above MT" />
                    <MEPWaveform intensityPct={state.intensity} pulseCount={state.pulseCount} isPlaying={state.isPlaying} />
                  </Card>
                  <Card>
                    <CardTitle title="E-field & neurons" />
                    <div className="grid grid-cols-2 gap-3">
                      <NeuronCounter />
                      <EFieldGauge />
                    </div>
                  </Card>
                  <Card span2>
                    <CardTitle title="Narration" hint="Plain-language commentary on what the instrument is doing" />
                    <ActivityLog
                      entries={narration.entries}
                      level={narration.level}
                      getText={narration.getText}
                      onLevelChange={narration.setLevel}
                    />
                  </Card>
                </div>
              )}
              {activeTab === 'session' && (
                <div className="space-y-3">
                  <Card>
                    <CardTitle title="Treatment course" hint="Where you are in a typical multi-week protocol" />
                    <SessionTimeline />
                  </Card>
                  <Card>
                    <CardTitle title="Pulse pattern" hint="Time-domain view of how this protocol fires" />
                    <PulsePatternWaveform />
                  </Card>
                </div>
              )}
              {activeTab === 'compare' && (
                <Card>
                  <CardTitle title="Compare protocols" hint="Side-by-side parameters across all six protocols" />
                  <ProtocolComparison />
                </Card>
              )}
              {activeTab === 'tools' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card>
                    <CardTitle title="Insurance & cost" hint="Estimate based on typical insurance coverage" />
                    <InsuranceEstimator embedded />
                  </Card>
                  <Card>
                    <CardTitle title="Achievements" hint="Track exploration milestones" />
                    <AchievementBadges badges={allBadges} onReset={resetBadges} embedded />
                  </Card>
                </div>
              )}
              {activeTab === 'help' && (
                <Card>
                  <CardTitle title="Keyboard shortcuts" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2.5">
                    {[
                      ['Space', 'Play / Stop'], ['R', 'Reset'],
                      ['1–6', 'Switch protocol'], ['↑↓', 'Frequency'],
                      ['⇧↑↓', 'Intensity'], ['Esc', 'Close dialogs'],
                    ].map(([key, action]) => (
                      <div key={key} className="flex items-center gap-2">
                        <kbd
                          style={{
                            padding: '2px 8px',
                            borderRadius: 5,
                            background: 'rgba(201,101,74,0.14)',
                            border: '1px solid rgba(201,101,74,0.30)',
                            color: '#D4806A',
                            fontSize: 10,
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            fontWeight: 700,
                          }}
                        >
                          {key}
                        </kbd>
                        <span style={{ fontSize: 12, color: 'rgba(251,250,247,0.7)' }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helper components ───────────────────────────────────────────────────

type TabId = 'controls' | 'monitors' | 'session' | 'compare' | 'tools' | 'help';

const kbdStyle: React.CSSProperties = {
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(201,101,74,0.14)',
  border: '1px solid rgba(201,101,74,0.30)',
  color: '#D4806A',
  fontSize: 10,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
};

function Metric({ label, sublabel, value, accent }: { label: string; sublabel?: string; value: string; accent: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(251,250,247,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {sublabel && (
          <span style={{ fontSize: 9, color: 'rgba(251,250,247,0.30)' }}>{sublabel}</span>
        )}
      </div>
      <div
        className="tabular-nums"
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: accent,
          marginTop: 2,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BrandedSlider({
  label,
  unit,
  value,
  fillPct,
  min,
  max,
  step,
  marks,
  onChange,
  ariaLabel,
}: {
  label: string;
  unit: string;
  value: number;
  fillPct: number;
  min: number;
  max: number;
  step: number;
  marks: string[];
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '12px 14px 14px',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(251,250,247,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span
          className="tabular-nums"
          style={{ fontSize: 13, fontWeight: 700, color: '#D4806A', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
        >
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        className="tms-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-label={ariaLabel}
        style={{ ['--tms-slider-fill' as never]: `${fillPct}%` }}
      />
      <div className="flex justify-between mt-2" style={{ fontSize: 9, color: 'rgba(251,250,247,0.35)', fontWeight: 500 }}>
        {marks.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

function Card({ children, span2 = false }: { children: React.ReactNode; span2?: boolean }) {
  return (
    <div
      className={span2 ? 'lg:col-span-2' : ''}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(251,250,247,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </span>
      {hint && <span style={{ fontSize: 10, color: 'rgba(251,250,247,0.4)' }}>{hint}</span>}
    </div>
  );
}

export default function TMSViewer(props: TMSViewerProps) {
  return (
    <TMSProvider>
      <TMSViewerInner {...props} />
    </TMSProvider>
  );
}
