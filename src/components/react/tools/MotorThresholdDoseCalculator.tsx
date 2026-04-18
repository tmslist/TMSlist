'use client';

import { useState } from 'react';
import { protocols } from '../../../data/tmsProtocols';
import { BrainIcon, WarningIcon, CheckIcon } from '../Icons';

type CoilType = 'figure8' | 'hcoil' | 'doble' | 'cool coil';

interface CoilInfo {
  name: string;
  penetrationDepth: string;
  focality: string;
  motorThresholdAdjustment: number;
}

const COILS: Record<CoilType, CoilInfo> = {
  figure8: { name: 'Figure-8 / Double Coil', penetrationDepth: '~1.5–2 cm', focality: 'High', motorThresholdAdjustment: 0 },
  hcoil: { name: 'H-Coil (BrainsWay Deep TMS)', penetrationDepth: '~3–4 cm', focality: 'Low', motorThresholdAdjustment: -5 },
  doble: { name: 'Double Cone Coil', penetrationDepth: '~2–2.5 cm', focality: 'Medium', motorThresholdAdjustment: -2 },
  'cool coil': { name: 'Cool Coil (NeuroStar)', penetrationDepth: '~1.5–2 cm', focality: 'High', motorThresholdAdjustment: 0 },
};

export default function MotorThresholdDoseCalculator() {
  const [restingMT, setRestingMT] = useState(42);
  const [activeMT, setActiveMT] = useState(38);
  const [coilType, setCoilType] = useState<CoilType>('figure8');
  const [protocolName, setProtocolName] = useState('Standard rTMS');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customIntensity, setCustomIntensity] = useState<number | null>(null);

  const coil = COILS[coilType];
  const protocol = protocols.find(p => p.name === protocolName) || protocols[0];

  // Calculate recommended intensity based on motor threshold + coil adjustment
  const recommendedIntensity = Math.round(restingMT * (protocol.intensityPct / 100) + coil.motorThresholdAdjustment);

  // Effective intensity as % MT
  const effectivePctMT = customIntensity
    ? Math.round((customIntensity / restingMT) * 100)
    : protocol.intensityPct + coil.motorThresholdAdjustment;

  // Total treatment time
  const treatmentMinutes = parseInt(protocol.duration) || 20;

  // Total pulses
  const totalPulses = protocol.pulses;

  // Dose per session (number of pulses × # sessions)
  const totalDosePulses = totalPulses * protocol.sessionsTotal;

  // Motor map insights
  const mapQuality = restingMT > 55 ? 'elevated' : restingMT < 35 ? 'low' : 'normal';

  const getMapAdvice = () => {
    if (mapQuality === 'elevated') return {
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'Elevated MT detected. Consider lower intensity or extended titration. Patients with high MT may benefit from iTBS or dTMS to achieve adequate cortical depth.',
    };
    if (mapQuality === 'low') return {
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'Low MT — standard parameters will likely be well-tolerated. Standard rTMS at 120% MT should be effective.',
    };
    return {
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'Normal MT range. Recommended dose should achieve optimal treatment depth without excessive cortical excitability.',
    };
  };

  const mapAdvice = getMapAdvice();

  return (
    <div className="space-y-8">
      {/* Input section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Motor Threshold
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Resting Motor Threshold (RMT) %</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={20}
                max={80}
                value={restingMT}
                onChange={e => setRestingMT(parseInt(e.target.value))}
                className="flex-1 accent-cyan-600"
              />
              <span className="w-14 text-center font-bold text-lg text-cyan-600">{restingMT}%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Active Motor Threshold (AMT) %</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={20}
                max={80}
                value={activeMT}
                onChange={e => setActiveMT(parseInt(e.target.value))}
                className="flex-1 accent-cyan-600"
              />
              <span className="w-14 text-center font-bold text-lg text-cyan-600">{activeMT}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">AMT ≈ RMT - 5 to -10% (AMT not available on all devices)</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            Protocol & Coil
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Treatment Protocol</label>
            <select
              value={protocolName}
              onChange={e => setProtocolName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            >
              {protocols.map(p => (
                <option key={p.name} value={p.name}>{p.name} — {p.indication}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Coil Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(COILS) as CoilType[]).map(ct => (
                <button
                  key={ct}
                  onClick={() => setCoilType(ct)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs ${
                    coilType === ct
                      ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-300'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <p className="font-bold text-slate-800">{COILS[ct].name.split(' (')[0]}</p>
                  <p className="text-slate-400 mt-0.5">Depth: {COILS[ct].penetrationDepth}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dose recommendation card */}
      <div className="bg-slate-950 rounded-2xl p-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Recommended Treatment Parameters</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Intensity</p>
            <p className="text-3xl font-bold text-white">{recommendedIntensity}%</p>
            <p className="text-xs text-slate-400 mt-1">of RMT</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Pulses / Session</p>
            <p className="text-3xl font-bold text-cyan-400">{protocol.pulses.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{protocol.duration}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Sessions</p>
            <p className="text-3xl font-bold text-emerald-400">{protocol.sessionsTotal}</p>
            <p className="text-xs text-slate-400 mt-1">total course</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Dose</p>
            <p className="text-3xl font-bold text-fuchsia-400">{totalDosePulses.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">total pulses</p>
          </div>
        </div>

        {/* Adjusted intensity explanation */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-slate-400">
            Based on {restingMT}% RMT → {protocol.intensityPct}% MT = {Math.round(restingMT * protocol.intensityPct / 100)}% device output
            {coil.motorThresholdAdjustment !== 0 && (
              <span className="text-amber-400"> {coil.motorThresholdAdjustment > 0 ? '+' : ''}{coil.motorThresholdAdjustment}% adjusted for {coil.name}</span>
            )}
            → <span className="text-cyan-400 font-bold">{recommendedIntensity}% MT ({Math.round(restingMT * recommendedIntensity / 100)}% device output)</span>
          </p>
        </div>
      </div>

      {/* Motor map advice */}
      <div className={`rounded-xl p-5 border ${mapAdvice.bg} ${mapAdvice.border}`}>
        <div className="flex items-start gap-3">
          <BrainIcon className="w-6 h-6 mt-0.5 shrink-0" />
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${mapAdvice.color} mb-1`}>Motor Map Assessment</p>
            <p className="text-sm text-slate-700">{mapAdvice.text}</p>
          </div>
        </div>
      </div>

      {/* Advanced: custom intensity override */}
      {showAdvanced && (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-3">Advanced: Custom Intensity Override</h4>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 shrink-0">Device Output %</span>
            <input
              type="range"
              min={20}
              max={110}
              value={customIntensity ?? Math.round(restingMT * recommendedIntensity / 100)}
              onChange={e => setCustomIntensity(parseInt(e.target.value))}
              className="flex-1 accent-violet-600"
            />
            <span className="w-16 text-center font-bold text-violet-600">
              {customIntensity ?? Math.round(restingMT * recommendedIntensity / 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 flex-wrap">
            Effective: ~{effectivePctMT}% MT — {effectivePctMT > 120 ? (
              <><WarningIcon className="w-3.5 h-3.5 inline text-amber-500" /> High — monitor for discomfort</>
            ) : effectivePctMT < 80 ? (
              <><WarningIcon className="w-3.5 h-3.5 inline text-amber-500" /> Low — may be subtherapeutic</>
            ) : (
              <><CheckIcon className="w-3.5 h-3.5 inline text-emerald-500" /> Within standard range</>
            )}
          </p>
        </div>
      )}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs font-semibold text-slate-400 hover:text-violet-600 transition-colors"
      >
        {showAdvanced ? 'Hide advanced options' : 'Show advanced options →'}
      </button>

      {/* Protocol comparison */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Protocol Comparison for This Patient</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Protocol', 'Intensity', 'Pulses', 'Duration', 'Sessions', 'Evidence'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {protocols.map(p => {
                const pulses = p.pulses;
                const intensity = Math.round(restingMT * p.intensityPct / 100);
                const dur = parseInt(p.duration) || 20;
                return (
                  <tr
                    key={p.name}
                    className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${protocolName === p.name ? 'bg-violet-50' : ''}`}
                    onClick={() => setProtocolName(p.name)}
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-800">{p.name.split('(')[0].trim()}</td>
                    <td className="py-3 pr-4 text-slate-600">{intensity}% MT</td>
                    <td className="py-3 pr-4 text-cyan-600 font-semibold">{pulses.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-600">{dur} min</td>
                    <td className="py-3 pr-4 text-slate-600">{p.sessionsTotal}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.evidence === 'Strong' ? 'bg-emerald-100 text-emerald-700' : p.evidence === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.evidence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}