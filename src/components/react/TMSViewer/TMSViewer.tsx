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
import { SidebarTabs } from './SidebarTabs';
import { MobileBottomSheet } from './MobileBottomSheet';
import { FirstTimeTour } from './FirstTimeTour';
import { PulseRateMeter } from './PulseRateMeter';
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
  const [showComparison, setShowComparison] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(true);
  const [mounted, setMounted] = useState(false);
  const protocolsSelectedRef = useRef<Set<string>>(new Set());
  const prevRegionRef = useRef<string | null>(null);
  const hasAppliedURLRef = useRef(false);
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const narration = useNarration();
  const { addEntry, clear: clearNarration } = narration;

  // Entrance animation trigger
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track selected protocols for achievement
  useEffect(() => {
    if (state.selectedProtocol?.name) {
      protocolsSelectedRef.current.add(state.selectedProtocol.name);
    }
  }, [state.selectedProtocol]);

  // URL persistence — read params on mount
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
    } catch {}
    hasAppliedURLRef.current = true;
  }, [dispatch]);

  // Write URL with debounce
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
      } catch {}
    }, 300);
  }, [state.selectedProtocol, state.frequency, state.intensity]);

  // Achievement tracking
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
        setNewlyEarnedBadge(badge.emoji + ' ' + badge.name);
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

  // Narration effects
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

  // Keyboard shortcuts
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
          <div className="p-3 border-b border-slate-700/30">
            <MEPWaveform intensityPct={state.intensity} pulseCount={state.pulseCount} isPlaying={state.isPlaying} />
          </div>
          <div className="p-3"><TMSControlsPanel /></div>
        </div>
      </div>
    );
  }

  // ---- Tab content builders ----

  const controlsTab = (
    <>
      <button
        onClick={() => setShowSafetyModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-xl hover:bg-amber-500/20 transition-colors group"
      >
        <span className="text-amber-400 text-base">⚠️</span>
        <div className="flex-1 text-left">
          <div className="text-[11px] font-semibold text-amber-300">Safety Pre-Screening</div>
          <div className="text-[9px] text-amber-400/60">Review contraindications before use</div>
        </div>
        <svg className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="glass-panel rounded-2xl p-4">
        <TMSControlsPanel />
      </div>

      <CoilHeatGauge />
    </>
  );

  const monitorTab = (
    <>
      <MEPWaveform intensityPct={state.intensity} pulseCount={state.pulseCount} isPlaying={state.isPlaying} />

      {/* Advanced gauges row */}
      <div className="grid grid-cols-2 gap-3">
        <PulseRateMeter />
        <EFieldGauge />
      </div>

      <NeuronCounter />

      <div className="glass-panel rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DosimetryDisplay />
          <SessionCountdown />
        </div>
      </div>

      <PulsePatternWaveform />

      <ActivityLog
        entries={narration.entries}
        level={narration.level}
        getText={narration.getText}
        onLevelChange={narration.setLevel}
      />
    </>
  );

  const referenceTab = (
    <>
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Protocol Comparison</span>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              showComparison
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showComparison ? 'Hide' : 'Compare'}
          </button>
        </div>
        {showComparison && <ProtocolComparison />}
      </div>

      <InsuranceEstimator />
      <AchievementBadges badges={allBadges} onReset={resetBadges} />

      <div className="glass-panel rounded-xl px-4 py-3">
        <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Keyboard Shortcuts</div>
        <div className="grid grid-cols-2 gap-1">
          {[
            ['Space', 'Play/Stop'], ['R', 'Reset'],
            ['1–6', 'Protocols'], ['↑↓', 'Frequency'],
            ['⇧↑↓', 'Intensity'],
          ].map(([key, action]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/50 rounded text-[9px] font-mono text-slate-400 shrink-0">{key}</kbd>
              <span className="text-[9px] text-slate-500">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const efieldLegend = (
    <div className="glass-panel rounded-xl px-4 py-3 mb-2">
      <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">E-Field Heatmap</div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500">Weak</span>
        <div className="flex-1 h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-green-400 via-yellow-400 to-orange-500" />
        <span className="text-[9px] text-slate-500">Strong</span>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-slate-600">0 V/m</span>
        <span className="text-[8px] text-slate-600">~80 V/m</span>
      </div>
    </div>
  );

  // Mobile-only tab content (simpler, optimized for touch)
  const mobileControlsTab = (
    <>
      <button
        onClick={() => setShowSafetyModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-xl"
      >
        <span className="text-amber-400 text-base">⚠️</span>
        <div className="flex-1 text-left">
          <div className="text-[11px] font-semibold text-amber-300">Safety Pre-Screening</div>
        </div>
      </button>
      <div className="glass-panel rounded-2xl p-4"><TMSControlsPanel /></div>
      <CoilHeatGauge />
    </>
  );

  const mobileMonitorTab = (
    <>
      <MEPWaveform intensityPct={state.intensity} pulseCount={state.pulseCount} isPlaying={state.isPlaying} />
      <div className="grid grid-cols-2 gap-3">
        <PulseRateMeter />
        <EFieldGauge />
      </div>
      <NeuronCounter />
      <div className="glass-panel rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <DosimetryDisplay />
          <SessionCountdown />
        </div>
      </div>
      <PulsePatternWaveform />
      <ActivityLog entries={narration.entries} level={narration.level} getText={narration.getText} onLevelChange={narration.setLevel} />
    </>
  );

  const mobileReferenceTab = (
    <>
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Protocol Comparison</span>
          <button onClick={() => setShowComparison(!showComparison)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${showComparison ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-slate-800/80 border border-slate-700/50 text-slate-400'}`}>
            {showComparison ? 'Hide' : 'Compare'}
          </button>
        </div>
        {showComparison && <ProtocolComparison />}
      </div>
      <InsuranceEstimator />
      <AchievementBadges badges={allBadges} onReset={resetBadges} />
    </>
  );

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
            <span className="text-xl">{newlyEarnedBadge.split(' ')[0]}</span>
            <div>
              <div className="text-xs font-bold">{newlyEarnedBadge.replace(/^[^\s]+\s/, '')}</div>
              <div className="text-[10px] text-amber-100/80">Achievement unlocked!</div>
            </div>
          </div>
        </div>
      )}

      {/* Safety modal */}
      {showSafetyModal && (
        <ContraindicationsModal onDismiss={() => setShowSafetyModal(false)} />
      )}

      {/* Main content */}
      <div
        ref={containerRef}
        className={`w-full overflow-y-visible transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {/* Live narration strip — always visible above everything */}
        <div className="glass-panel rounded-2xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${state.isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Live Narration</span>
            <button
              onClick={() => narration.setLevel(narration.level === 'patient' ? 'clinical' : 'patient')}
              className="ml-auto text-[9px] font-medium px-2 py-0.5 rounded border border-slate-700/50 text-slate-500 hover:text-slate-200 hover:border-slate-600 transition-colors"
            >
              {narration.level === 'patient' ? '👤 Patient' : '🔬 Clinical'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-[96px] overflow-y-auto custom-scrollbar">
            {narration.entries.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic">Press Space or tap "Fire Pulses" to begin. Hover the brain to identify regions.</p>
            ) : (
              narration.entries.slice(0, 4).map(entry => {
                const styles: Record<string, string> = {
                  pulse: 'text-cyan-300', region: 'text-violet-300', protocol: 'text-emerald-300',
                  warning: 'text-amber-300', achievement: 'text-amber-400', info: 'text-slate-400',
                };
                const icons: Record<string, string> = {
                  pulse: '⚡', region: '🧠', protocol: '📋', warning: '⚠️', achievement: '🏆', info: '·',
                };
                return (
                  <div key={entry.id} className="flex items-start gap-1.5">
                    <span className={`text-[10px] shrink-0 mt-0.5 ${styles[entry.type]}`}>{icons[entry.type]}</span>
                    <p className={`text-[10px] leading-relaxed ${styles[entry.type]}`}>{narration.getText(entry)}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product brand header — desktop only */}
        <div className="hidden lg:flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400 tracking-tight">
            NeuroSim TMS
          </span>
          <div className="ml-2 h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] lg:items-start gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            <TMSCanvas />

            {/* Quick context strip */}
            <div className="glass-panel rounded-2xl px-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Target</div>
                    <div className="text-[11px] font-semibold text-slate-200 truncate">
                      {state.hoveredRegion?.name ?? 'Left DLPFC'}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      {state.hoveredRegion?.brodmannArea ?? 'BA 46/9'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Protocol</div>
                    <div className="text-[11px] font-semibold text-slate-200 truncate">
                      {state.selectedProtocol?.name ?? 'Standard rTMS'}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {state.frequency} Hz · {state.intensity}% MT
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session timeline */}
            <SessionTimeline />

            {/* Pulse pattern waveform */}
            <PulsePatternWaveform />
          </div>

          {/* Desktop sidebar — tabbed, grows with content, scrolls internally */}
          <div className="hidden lg:flex flex-col glass-panel rounded-2xl self-start">
            <div className="flex flex-col h-full p-3 overflow-y-auto custom-scrollbar">
              <SidebarTabs
                controls={controlsTab}
                monitor={monitorTab}
                reference={referenceTab}
                efieldLegend={efieldLegend}
              />
            </div>
          </div>
        </div>

        {/* Mobile bottom sheet */}
        <MobileBottomSheet
          controls={mobileControlsTab}
          monitor={mobileMonitorTab}
          reference={mobileReferenceTab}
          fab={null}
        />

        {/* Bottom hint */}
        <div className="flex items-center justify-center gap-3 mt-3 pb-4">
          <span className="text-slate-600 text-[10px]">Drag to rotate</span>
          <span className="text-slate-600 text-[10px]">·</span>
          <span className="text-slate-600 text-[10px]">Hover brain for region</span>
          <span className="text-slate-600 text-[10px]">·</span>
          <span className="text-cyan-600 text-[10px]">Space to fire</span>
        </div>
      </div>
    </>
  );
}

export default function TMSViewer(props: TMSViewerProps) {
  return (
    <TMSProvider>
      <TMSViewerInner {...props} />
    </TMSProvider>
  );
}
