'use client';

import { useState } from 'react';
import { useTMS } from './TMSContext';
import { protocols } from '../../../data/tmsProtocols';

interface CoverageResult {
  label: string;
  pct: number;
  note: string;
  color: string;
  bg: string;
}

const COVERAGE_DATA: Record<string, CoverageResult> = {
  'Standard rTMS': {
    label: 'Likely Covered',
    pct: 85,
    note: 'FDA-cleared since 2008. Most major insurers cover with prior auth.',
    color: 'text-[var(--accent2)]',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  'Theta Burst (iTBS)': {
    label: 'Likely Covered',
    pct: 75,
    note: 'FDA-cleared 2018. Coverage expanding rapidly — many plans now cover.',
    color: 'text-[var(--accent2)]',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  'Deep TMS (BrainsWay)': {
    label: 'Partial Coverage',
    pct: 55,
    note: 'FDA-cleared but requires prior auth and medical necessity documentation.',
    color: 'text-[var(--warm)]',
    bg: 'bg-[#C9654A]/20/20 border-amber-500/30',
  },
  'SNT (Stanford Protocol)': {
    label: 'Not Typically Covered',
    pct: 10,
    note: 'Not FDA-cleared (off-label). Typically self-pay. Ask about research trials.',
    color: 'text-[var(--warm)]',
    bg: 'bg-[#C9654A]/20/20 border-[rgba(10,22,40,0.2)]/30',
  },
  'Low-Frequency (1Hz)': {
    label: 'Likely Covered',
    pct: 70,
    note: 'FDA-cleared 2012. Coverage varies — good option for anxious depression.',
    color: 'text-[var(--accent2)]',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  'cTBS (Ldtn)': {
    label: 'Not Typically Covered',
    pct: 15,
    note: 'Research-only status. May be available through clinical trials.',
    color: 'text-[var(--warm)]',
    bg: 'bg-[#C9654A]/20/20 border-[rgba(10,22,40,0.2)]/30',
  },
};

const ESTIMATED_COPAY = {
  covered: { min: 20, max: 60 },
  self_pay: { min: 250, max: 500 },
};

interface InsuranceEstimatorProps {
  /** When true, omit the outer card chrome and toggle (parent provides them). */
  embedded?: boolean;
}

export function InsuranceEstimator({ embedded = false }: InsuranceEstimatorProps = {}) {
  const { state } = useTMS();
  const [expanded, setExpanded] = useState(false);
  const [zip, setZip] = useState('');

  const protoName = state.selectedProtocol?.name ?? protocols[0].name;
  const coverage = COVERAGE_DATA[protoName] ?? COVERAGE_DATA['Standard rTMS'];
  const sessions = state.selectedProtocol?.sessionsTotal ?? 36;
  const selfPayTotal = sessions * ESTIMATED_COPAY.self_pay.max;
  const insuredCostRange = sessions * ESTIMATED_COPAY.covered.max;

  if (embedded) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-white/55">Coverage likelihood</span>
          <span className={`text-[10px] font-bold ${coverage.color}`}>{coverage.label} · {coverage.pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${coverage.pct}%`,
              background: coverage.pct >= 70 ? '#22c55e' : coverage.pct >= 40 ? '#D29922' : '#C9654A',
            }}
          />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-white/45 uppercase tracking-wider mb-1.5">Protocol</div>
          <select
            className="w-full text-[10px] rounded-lg px-2 py-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(251,250,247,0.85)' }}
            value={protoName}
            onChange={() => {}}
          >
            {protocols.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="text-[9px] font-semibold mb-0.5" style={{ color: '#4ade80' }}>With insurance</div>
            <div className="text-sm font-bold text-white">${ESTIMATED_COPAY.covered.min}–${insuredCostRange.toLocaleString()}</div>
            <div className="text-[8px] text-white/50">total for {sessions} sessions</div>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-[9px] font-semibold text-white/55 mb-0.5">Self-pay total</div>
            <div className="text-sm font-bold text-white">${selfPayTotal.toLocaleString()}</div>
            <div className="text-[8px] text-white/40">${ESTIMATED_COPAY.self_pay.max}/session × {sessions}</div>
          </div>
        </div>
        <p className="text-[9px] text-white/55 leading-relaxed">{coverage.note} Coverage varies by plan. Most require prior authorization.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--paper2)]/60 backdrop-blur-sm border border-[var(--line)]/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--paper2)]/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Insurance Estimator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold ${coverage.color}`}>{coverage.label}</span>
          <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Coverage bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/40">Insurance coverage likelihood</span>
              <span className={`text-[10px] font-bold ${coverage.color}`}>{coverage.pct}%</span>
            </div>
            <div className="h-2 bg-[var(--paper2)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  coverage.pct >= 70 ? 'bg-emerald-500' :
                  coverage.pct >= 40 ? 'bg-[#C9654A]/20' : 'bg-[#C9654A]/20'
                }`}
                style={{ width: `${coverage.pct}%` }}
              />
            </div>
          </div>

          {/* Protocol selector */}
          <div>
            <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Protocol</div>
            <select
              className="w-full text-[10px] bg-[var(--paper2)] border border-[var(--line)]/50 rounded-lg px-2 py-1.5 text-white/40"
              value={protoName}
              onChange={e => {
                const p = protocols.find(pr => pr.name === e.target.value);
                if (p) { /* dispatch would go here if controlled */ }
              }}
            >
              {protocols.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Cost estimates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
              <div className="text-[9px] font-semibold text-[var(--accent2)] mb-0.5">With Insurance</div>
              <div className="text-sm font-bold text-white">
                ${ESTIMATED_COPAY.covered.min}–${insuredCostRange.toLocaleString()}
              </div>
              <div className="text-[8px] text-[rgba(30,42,59,0.60)]">total for {sessions} sessions</div>
            </div>
            <div className="bg-[var(--paper2)]/50 border border-[var(--line)]/30 rounded-lg p-2.5">
              <div className="text-[9px] font-semibold text-white/40 mb-0.5">Self-Pay Total</div>
              <div className="text-sm font-bold text-white">
                ${selfPayTotal.toLocaleString()}
              </div>
              <div className="text-[8px] text-white/40">${ESTIMATED_COPAY.self_pay.max}/session × {sessions}</div>
            </div>
          </div>

          <p className="text-[9px] text-white/40 leading-relaxed">
            {coverage.note} Coverage varies by plan. Most require prior authorization.
          </p>
        </div>
      )}
    </div>
  );
}
