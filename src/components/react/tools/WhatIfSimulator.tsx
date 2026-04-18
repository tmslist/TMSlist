'use client';

import { useState } from 'react';
import { protocols } from '../../../data/tmsProtocols';
import {
  CheckCircleIcon,
  WarningIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  CalendarIcon,
} from '../Icons';

type ParamKey = 'frequencyHz' | 'intensityPct' | 'pulses' | 'sessionsTotal';

const PARAM_RANGES: Record<ParamKey, { min: number; max: number; step: number; unit: string }> = {
  frequencyHz: { min: 1, max: 20, step: 1, unit: 'Hz' },
  intensityPct: { min: 80, max: 140, step: 5, unit: '% MT' },
  pulses: { min: 100, max: 6000, step: 100, unit: 'pulses' },
  sessionsTotal: { min: 10, max: 60, step: 5, unit: 'sessions' },
};

export default function WhatIfSimulator() {
  const [param, setParam] = useState<ParamKey>('frequencyHz');
  const [value, setValue] = useState(10);
  const [protocolName, setProtocolName] = useState('Standard rTMS');

  const protocol = protocols.find(p => p.name === protocolName) || protocols[0];
  const range = PARAM_RANGES[param];

  const baselineValue = protocol[param] as number;
  const change = value - baselineValue;
  const pctChange = baselineValue > 0 ? Math.round((change / baselineValue) * 100) : 0;

  // Simulate predicted outcomes
  const getPredictedOutcome = () => {
    if (param === 'frequencyHz') {
      if (value > 15) return { label: 'Increased seizure risk', severity: 'high', detail: 'Frequencies above 15Hz significantly increase seizure risk. Most protocols cap at 10Hz for safety.' };
      if (value > 10) return { label: 'Higher efficacy (theoretical)', severity: 'medium', detail: 'Higher frequency may increase excitatory effect, but evidence for >10Hz is limited. SAINT uses 10Hz.' };
      if (value < 5) return { label: 'May switch to inhibitory effect', severity: 'low', detail: '1Hz is established as low-frequency/inhibitory. 5Hz is borderline.' };
      return { label: 'Standard excitatory range', severity: 'low', detail: '5-10Hz is the evidence-supported range for excitatory rTMS to DLPFC.' };
    }
    if (param === 'intensityPct') {
      if (value > 130) return { label: 'Elevated discomfort & risk', severity: 'high', detail: 'Above 130% MT, scalp pain and facial twitching become common. Rare seizure risk increases.' };
      if (value > 120) return { label: 'Standard clinical range', severity: 'low', detail: '120% MT is the most common intensity. Slightly higher may increase efficacy but also side effects.' };
      if (value < 100) return { label: 'May be subtherapeutic', severity: 'medium', detail: 'Below motor threshold, cortical activation may be insufficient for therapeutic effect.' };
      return { label: 'Safe effective range', severity: 'low', detail: '100-120% MT is well-established as effective.' };
    }
    if (param === 'pulses') {
      const pct = (value / protocol.pulses) * 100;
      if (pct > 150) return { label: 'Significantly longer session', severity: 'medium', detail: `Doubled pulse count means ~${Math.round((value - protocol.pulses) / 60)} extra minutes. Diminishing returns likely.` };
      if (pct < 50) return { label: 'Sub-therapeutic dose likely', severity: 'high', detail: 'Less than half the standard dose is unlikely to achieve clinical effect.' };
      return { label: 'Dose within acceptable range', severity: 'low', detail: 'Pulse count within evidence-supported range.' };
    }
    if (param === 'sessionsTotal') {
      if (value > 50) return { label: 'Extended protocol (SNT-like)', severity: 'medium', detail: '40+ sessions is intensive but mirrors SAINT protocol. Insurance unlikely to cover.' };
      if (value < 20) return { label: 'Possibly insufficient', severity: 'high', detail: 'Clinical trials used 20-36 sessions. Fewer than 20 may not achieve full effect.' };
      return { label: 'Within standard range', severity: 'low', detail: `${value} sessions is within or above the standard 36-session protocol.` };
    }
    return { label: 'Neutral', severity: 'low', detail: 'Parameter change is within normal range.' };
  };

  const outcome = getPredictedOutcome();

  const severityConfig = {
    low: { bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700', icon: <CheckCircleIcon size={24} /> },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700', icon: <WarningIcon size={24} /> },
    high: { bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700', icon: <AlertCircleIcon size={24} /> },
  }[outcome.severity];

  // Activation estimation
  const estimateActivation = () => {
    const freqFactor = param === 'frequencyHz' ? value / 10 : 1;
    const intensityFactor = param === 'intensityPct' ? (value - 80) / 40 : 0.5;
    const pulseFactor = param === 'pulses' ? value / protocol.pulses : 1;
    const baseActivation = 35000;
    return Math.round(baseActivation * freqFactor * intensityFactor * pulseFactor);
  };

  const activation = estimateActivation();

  return (
    <div className="space-y-8">
      {/* Protocol selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Protocol</label>
        <div className="flex flex-wrap gap-2">
          {protocols.map(p => (
            <button
              key={p.name}
              onClick={() => setProtocolName(p.name)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                protocolName === p.name
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {p.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Adjust Parameter</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PARAM_RANGES) as ParamKey[]).map(p => (
            <button
              key={p}
              onClick={() => { setParam(p); setValue(protocol[p] as number); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                param === p
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {p === 'frequencyHz' ? 'Frequency (Hz)' :
               p === 'intensityPct' ? 'Intensity (% MT)' :
               p === 'pulses' ? 'Pulses/Session' :
               'Sessions Total'}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter slider */}
      <div className="bg-slate-950 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Value</p>
            <p className="text-4xl font-bold text-white mt-1">
              {value}<span className="text-lg text-slate-400 ml-1">{range.unit}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Baseline</p>
            <p className="text-2xl font-bold text-slate-500 mt-1">
              {baselineValue}<span className="text-sm ml-1">{range.unit}</span>
            </p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={value}
            onChange={e => setValue(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-3"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{range.min} {range.unit}</span>
          <span>{range.max} {range.unit}</span>
        </div>

        {pctChange !== 0 && (
          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
            pctChange > 0 ? 'bg-cyan-900/50 text-cyan-400' : 'bg-amber-900/50 text-amber-400'
          }`}>
            {pctChange > 0 ? '↑' : '↓'} {Math.abs(pctChange)}% from baseline
          </div>
        )}
      </div>

      {/* Predicted outcome */}
      <div className={`rounded-xl p-5 border ${severityConfig.bg} ${severityConfig.border}`}>
        <div className="flex items-start gap-3">
          {severityConfig.icon}
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${severityConfig.color} mb-1`}>Predicted Outcome</p>
            <p className="text-sm font-bold text-slate-800">{outcome.label}</p>
            <p className="text-sm text-slate-600 mt-1">{outcome.detail}</p>
          </div>
        </div>
      </div>

      {/* Activation estimate */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Estimated Cortical Activation</p>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-bold text-violet-600">~{activation.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mb-1.5">neurons/session</p>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Baseline for {protocol.name.split('(')[0].trim()}: ~{Math.round((35000 * ((protocol.intensityPct - 80) / 40) * (protocol.frequencyHz / 10) * (protocol.pulses / protocol.pulses))).toLocaleString()} neurons/session
        </p>
      </div>

      {/* What-if comparison */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">How would this change affect outcomes?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Efficacy', icon: <TrendingUpIcon size={24} className="text-violet-600" />, impact: param === 'frequencyHz' ? (value > 10 ? '+' : value < 5 ? '-' : '+') : param === 'intensityPct' ? (value > 100 ? '+' : '-') : param === 'pulses' ? (value > protocol.pulses ? '+' : '-') : param === 'sessionsTotal' ? (value >= 36 ? '+' : '-') : '~' },
            { label: 'Side Effects', icon: <WarningIcon size={24} className="text-amber-600" />, impact: param === 'intensityPct' ? (value > 120 ? '+' : value < 100 ? '-' : '~') : param === 'frequencyHz' ? (value > 15 ? '+' : '~') : '~' },
            { label: 'Session Duration', icon: <CalendarIcon size={24} className="text-cyan-600" />, impact: param === 'pulses' ? (value > protocol.pulses ? '+' : value < protocol.pulses ? '-' : '~') : '~' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
              <span className="text-2xl flex justify-center">{item.icon}</span>
              <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              <p className={`text-xl font-bold mt-2 ${item.impact === '+' ? 'text-red-500' : item.impact === '-' ? 'text-amber-500' : 'text-slate-500'}`}>
                {item.impact === '+' ? '↑ Increase' : item.impact === '-' ? '↓ Decrease' : '≈ No change'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Link to simulation */}
      <div className="bg-violet-50 rounded-xl p-5 border border-violet-100 text-center">
        <p className="text-sm font-bold text-violet-700 mb-2">See it in action</p>
        <p className="text-xs text-slate-500 mb-4">Test these parameters in the full TMS simulation with a 3D brain model.</p>
        <a
          href={`/simulation/?protocol=${encodeURIComponent(protocol.name)}&freq=${param === 'frequencyHz' ? value : protocol.frequencyHz}&intensity=${param === 'intensityPct' ? value : protocol.intensityPct}`}
          className="inline-block px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
        >
          Open in Simulation →
        </a>
      </div>
    </div>
  );
}