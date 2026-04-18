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
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  'Theta Burst (iTBS)': {
    label: 'Likely Covered',
    pct: 75,
    note: 'FDA-cleared 2018. Coverage expanding rapidly — many plans now cover.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  'Deep TMS (BrainsWay)': {
    label: 'Partial Coverage',
    pct: 55,
    note: 'FDA-cleared but requires prior auth and medical necessity documentation.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20 border-amber-500/30',
  },
  'SNT (Stanford Protocol)': {
    label: 'Not Typically Covered',
    pct: 10,
    note: 'Not FDA-cleared (off-label). Typically self-pay. Ask about research trials.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20 border-rose-500/30',
  },
  'Low-Frequency (1Hz)': {
    label: 'Likely Covered',
    pct: 70,
    note: 'FDA-cleared 2012. Coverage varies — good option for anxious depression.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  'cTBS (Ldtn)': {
    label: 'Not Typically Covered',
    pct: 15,
    note: 'Research-only status. May be available through clinical trials.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20 border-rose-500/30',
  },
};

const ESTIMATED_COPAY = {
  covered: { min: 20, max: 60 },
  self_pay: { min: 250, max: 500 },
};

export function InsuranceEstimator() {
  const { state } = useTMS();
  const [expanded, setExpanded] = useState(false);
  const [zip, setZip] = useState('');

  const protoName = state.selectedProtocol?.name ?? protocols[0].name;
  const coverage = COVERAGE_DATA[protoName] ?? COVERAGE_DATA['Standard rTMS'];
  const sessions = state.selectedProtocol?.sessionsTotal ?? 36;
  const selfPayTotal = sessions * ESTIMATED_COPAY.self_pay.max;
  const insuredCostRange = sessions * ESTIMATED_COPAY.covered.max;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Insurance Estimator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold ${coverage.color}`}>{coverage.label}</span>
          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Coverage bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400">Insurance coverage likelihood</span>
              <span className={`text-[10px] font-bold ${coverage.color}`}>{coverage.pct}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  coverage.pct >= 70 ? 'bg-emerald-500' :
                  coverage.pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${coverage.pct}%` }}
              />
            </div>
          </div>

          {/* Protocol selector */}
          <div>
            <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Protocol</div>
            <select
              className="w-full text-[10px] bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1.5 text-slate-300"
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
              <div className="text-[9px] font-semibold text-emerald-400 mb-0.5">With Insurance</div>
              <div className="text-sm font-bold text-white">
                ${ESTIMATED_COPAY.covered.min}–${insuredCostRange.toLocaleString()}
              </div>
              <div className="text-[8px] text-emerald-400/60">total for {sessions} sessions</div>
            </div>
            <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-2.5">
              <div className="text-[9px] font-semibold text-slate-400 mb-0.5">Self-Pay Total</div>
              <div className="text-sm font-bold text-white">
                ${selfPayTotal.toLocaleString()}
              </div>
              <div className="text-[8px] text-slate-500">${ESTIMATED_COPAY.self_pay.max}/session × {sessions}</div>
            </div>
          </div>

          <p className="text-[9px] text-slate-500 leading-relaxed">
            {coverage.note} Coverage varies by plan. Most require prior authorization.
          </p>
        </div>
      )}
    </div>
  );
}
