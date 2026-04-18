'use client';

import React, { useState } from 'react';
import {
  MagnetIcon,
  BoltIcon,
  PillIcon,
  RedCircleIcon,
  AmberCircleIcon,
  GreenCircleIcon,
  WarningIcon,
  ElderlyIcon,
  RepeatIcon,
  TargetIcon,
  TrophyIcon,
  SettingsIcon,
  DocumentIcon,
  CheckIcon,
  SparkleIcon,
  BrainIcon,
} from '../Icons';

type Treatment = 'tms' | 'ect' | 'medication';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const TREATMENTS: Array<{
  id: Treatment;
  name: string;
  fullName: string;
  icon: IconComponent;
  color: string;
  bg: string;
  border: string;
  accent: string;
  badge: string;
  badgeColor: string;
}> = [
  {
    id: 'tms' as Treatment,
    name: 'rTMS',
    fullName: 'Repetitive Transcranial Magnetic Stimulation',
    icon: MagnetIcon,
    color: '#4f46e5',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    accent: 'text-violet-600',
    badge: 'FDA Cleared',
    badgeColor: '#4f46e5',
  },
  {
    id: 'ect' as Treatment,
    name: 'ECT',
    fullName: 'Electroconvulsive Therapy',
    icon: BoltIcon,
    color: '#0891b2',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    accent: 'text-cyan-600',
    badge: 'Established',
    badgeColor: '#0891b2',
  },
  {
    id: 'medication' as Treatment,
    name: 'Medication',
    fullName: 'Antidepressant Pharmacotherapy',
    icon: PillIcon,
    color: '#059669',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
    badge: 'First-line',
    badgeColor: '#059669',
  },
];

const DIMENSIONS = [
  {
    key: 'efficacy',
    label: 'Clinical Efficacy',
    description: 'Response and remission rates in treatment-resistant depression',
    tms: { score: 85, label: '45-55% response', detail: 'Non-inferior to medications in TRD. iTBS equivalent to standard rTMS.' },
    ect: { score: 95, label: '70-90% response', detail: 'Highest efficacy of all treatments. Gold standard for severe TRD.' },
    medication: { score: 65, label: '35-50% response', detail: 'First-line effectiveness. Diminishes with each failed trial.' },
  },
  {
    key: 'speed',
    label: 'Speed of Response',
    description: 'How quickly patients notice symptom improvement',
    tms: { score: 50, label: '3-4 weeks', detail: 'Gradual improvement. Response typically by week 3-4.' },
    ect: { score: 95, label: '1-2 weeks', detail: 'Rapid response, often within days. ECT is the fastest-acting treatment.' },
    medication: { score: 40, label: '4-8 weeks', detail: 'Slow onset. Must wait 4-6 weeks to assess efficacy at each dose.' },
  },
  {
    key: 'sideEffects',
    label: 'Side Effect Burden',
    description: 'Short and long-term side effects profile',
    tms: { score: 92, label: 'Mild, transient', detail: 'Scalp discomfort, mild headache. No cognitive effects.' },
    ect: { score: 50, label: 'Significant short-term', detail: 'Memory disruption (anterograde/retrograde), confusion, anesthesia risk.' },
    medication: { score: 60, label: 'Moderate, chronic', detail: 'Sexual dysfunction, weight gain, nausea, discontinuation syndrome.' },
  },
  {
    key: 'commitment',
    label: 'Time Commitment',
    description: 'Duration and frequency of treatment course',
    tms: { score: 60, label: '36 sessions / 6 weeks', detail: 'Daily weekday visits, 20-37 min per session.' },
    ect: { score: 30, label: '6-12 treatments', detail: 'Fewer sessions but requires anesthesia, fasting, escort. Slower return to normal activity.' },
    medication: { score: 98, label: 'Daily, ongoing', detail: 'Take one pill per day. Can be integrated into normal life.' },
  },
  {
    key: 'cognitive',
    label: 'Cognitive Impact',
    description: 'Effect on memory, focus, and mental function',
    tms: { score: 95, label: 'No negative effect', detail: 'May improve cognitive function as depression lifts. No memory loss.' },
    ect: { score: 30, label: 'Significant impairment', detail: 'Retrograde amnesia can span months. May affect working memory for weeks.' },
    medication: { score: 70, label: 'Minimal impact', detail: 'Some anticholinergic effects possible. Generally cognitively neutral.' },
  },
  {
    key: 'invasiveness',
    label: 'Invasiveness',
    description: 'How physically invasive is the treatment',
    tms: { score: 95, label: 'Non-invasive', detail: 'Fully awake, outpatient. Coil placed on scalp. No anesthesia.' },
    ect: { score: 15, label: 'Highly invasive', detail: 'General anesthesia required. Muscle relaxants. Seizure induced under supervision.' },
    medication: { score: 90, label: 'Non-invasive', detail: 'Oral medication. No procedures required.' },
  },
  {
    key: 'maintenance',
    label: 'Maintenance Required',
    description: 'Long-term maintenance after initial treatment',
    tms: { score: 60, label: 'Tapering + optional maintenance', detail: '18% relapse at 6 months without maintenance. Booster sessions available.' },
    ect: { score: 75, label: 'Maintenance ECT often needed', detail: 'Relapse rate ~50% without maintenance. Monthly or biweekly continuation.' },
    medication: { score: 50, label: 'Continuous medication', detail: 'Discontinuation leads to high relapse rates. Long-term use often necessary.' },
  },
  {
    key: 'cost',
    label: 'Cost (Without Insurance)',
    description: 'Estimated out-of-pocket cost for full treatment course',
    tms: { score: 40, label: '$6,000–$12,000', detail: '~$200-350/session × 36 sessions. May be partially covered.' },
    ect: { score: 50, label: '$3,000–$10,000', detail: 'Anesthesia + facility + physician fees. Typically covered for severe TRD.' },
    medication: { score: 90, label: '$20–$200/month', detail: 'Generic SSRIs $10-30/mo. Newer agents $100-300/mo. Ongoing cost.' },
  },
];

const PATIENT_TYPES: Array<{
  id: string;
  label: string;
  recommendation: string;
  priority: string[];
  icon: IconComponent;
  severity: string;
}> = [
  {
    id: 'trd3',
    label: 'Failed 3+ Medications',
    recommendation: 'ECT has highest efficacy for this group. TMS is effective but may take longer. Consider ECT first if severe.',
    priority: ['ect', 'tms'],
    icon: RedCircleIcon,
    severity: 'high',
  },
  {
    id: 'trd1',
    label: 'Failed 1-2 Medications',
    recommendation: 'Both TMS and medication are appropriate. TMS offers faster response than switching medications. Consider TMS.',
    priority: ['tms', 'medication', 'ect'],
    icon: AmberCircleIcon,
    severity: 'medium',
  },
  {
    id: 'first',
    label: 'Treatment-Naive',
    recommendation: 'Medication is first-line. TMS or ECT rarely used at this stage unless patient refuses medication or has specific contraindications.',
    priority: ['medication', 'tms'],
    icon: GreenCircleIcon,
    severity: 'low',
  },
  {
    id: 'suicidal',
    label: 'Active Suicidal Ideation',
    recommendation: 'ECT is the most rapid and effective option for acute suicidality. TMS also effective but slower. Do not delay treatment.',
    priority: ['ect', 'tms'],
    icon: WarningIcon,
    severity: 'critical',
  },
  {
    id: 'elderly',
    label: 'Elderly / Frail',
    recommendation: 'TMS is safest for elderly — no anesthesia, no cognitive impact, excellent tolerability. ECT requires careful anesthesia evaluation.',
    priority: ['tms', 'medication'],
    icon: ElderlyIcon,
    severity: 'low',
  },
  {
    id: 'bipolar',
    label: 'Bipolar Depression',
    recommendation: 'TMS may be preferred over ECT (less mania risk). Lithium + TMS can be synergistic. ECT for treatment-resistant bipolar episodes.',
    priority: ['tms', 'medication', 'ect'],
    icon: RepeatIcon,
    severity: 'medium',
  },
];

export default function TMSECTComparator() {
  const [selected, setSelected] = useState<Set<Treatment>>(new Set(['tms']));
  const [patientType, setPatientType] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);

  const toggle = (t: Treatment) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size > 1) next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  };

  const patient = patientType ? PATIENT_TYPES.find(p => p.id === patientType) : null;

  return (
    <div className="space-y-10">
      {/* Treatment selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TREATMENTS.map(t => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className={`text-left rounded-2xl border p-6 transition-all ${
              selected.has(t.id)
                ? `${t.bg} ${t.border} ring-2 ring-offset-2`
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
            style={selected.has(t.id) ? { ringColor: t.color } : {}}
          >
            <div className="flex items-center justify-between mb-3">
              <t.icon size={28} className="text-3xl" />
              {selected.has(t.id) && (
                <CheckIcon size={20} className="text-emerald-500" />
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t.badge}</p>
            <h3 className="text-xl font-bold text-slate-900">{t.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.fullName}</p>
          </button>
        ))}
      </div>

      {/* Comparison dimensions */}
      <div className="space-y-4">
        {DIMENSIONS.map(dim => (
          <div key={dim.key} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-700">{dim.label}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{dim.description}</p>
            </div>
            <div className="divide-x divide-slate-50 grid grid-cols-3">
              {TREATMENTS.map(t => {
                const data = dim[t.id as keyof typeof dim] as typeof dim.tms;
                const isSelected = selected.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={`p-4 ${isSelected ? '' : 'opacity-40'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <t.icon size={18} className="text-lg" />
                      <span className="text-sm font-semibold text-slate-700">{t.name}</span>
                    </div>
                    {/* Score bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${data.score}%`,
                          background: isSelected ? t.color : '#94a3b8',
                        }}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${isSelected ? t.accent : 'text-slate-400'}`}>
                      {data.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{data.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Overall visual comparison */}
      {selected.size >= 2 && (
        <div className="bg-slate-950 rounded-2xl p-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 text-center">Head-to-Head Summary</p>
          <div className="space-y-4">
            {TREATMENTS.filter(t => selected.has(t.id)).map(t => (
              <div key={t.id} className="flex items-center gap-4">
                <t.icon size={24} className="text-2xl w-10 text-center" />
                <span className="text-sm font-bold text-white w-16">{t.name}</span>
                <div className="flex-1">
                  <div className="h-6 rounded-full overflow-hidden bg-slate-800">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-3"
                      style={{
                        width: `${DIMENSIONS.reduce((acc, d) => {
                          const data = d[t.id as keyof typeof d] as typeof d.tms;
                          return acc + data.score / DIMENSIONS.length;
                        }, 0)}%`,
                        background: t.color,
                        backgroundImage: `linear-gradient(90deg, ${t.color}00 0%, ${t.color} 100%)`,
                      }}
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        {Math.round(DIMENSIONS.reduce((acc, d) => {
                          const data = d[t.id as keyof typeof d] as typeof d.tms;
                          return acc + data.score / DIMENSIONS.length;
                        }, 0))}% overall
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Decision Framework */}
      <div className="border-t border-slate-200 pt-8">
        <button
          onClick={() => setShowDecision(!showDecision)}
          className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-violet-600 transition-colors"
        >
          <TargetIcon size={24} className="text-2xl" />
          {showDecision ? 'Hide Decision Framework' : 'Which treatment is right for me?'}
        </button>

        {showDecision && (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-slate-500">Select your situation to see personalized recommendations.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PATIENT_TYPES.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => setPatientType(pt.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    patientType === pt.id
                      ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-300'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <pt.icon size={20} className="text-xl" />
                    {pt.severity === 'critical' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">URGENT</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{pt.label}</p>
                </button>
              ))}
            </div>

            {patient && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-start gap-3 mb-4">
                  <patient.icon size={24} className="text-2xl mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{patient.label} — Recommendation</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{patient.recommendation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  {patient.priority.map((tId, i) => {
                    const t = TREATMENTS.find(tr => tr.id === tId)!;
                    const priorityLabels = ['1st Line', '2nd Line', 'Alternative'];
                    return (
                      <div key={tId} className={`rounded-xl p-4 ${t.bg} border ${t.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <t.icon size={20} className="text-xl" />
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {priorityLabels[i]}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{t.fullName}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <WarningIcon size={14} />
                    Important
                  </p>
                  <p className="text-xs text-slate-600">
                    This tool provides educational information only. Treatment decisions must be made with a qualified psychiatrist who understands your complete medical history. This is not a substitute for clinical evaluation.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key differences callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
          <p className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
            <CheckIcon size={16} />
            When to choose TMS over ECT
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• You want to avoid anesthesia and memory disruption</li>
            <li>• You can commit to daily visits for 6 weeks</li>
            <li>• You've had a good response to TMS before</li>
            <li>• You're elderly or have cardiac concerns</li>
            <li>• You want to remain fully functional during treatment</li>
          </ul>
        </div>
        <div className="bg-cyan-50 rounded-xl p-5 border border-cyan-100">
          <p className="text-sm font-bold text-cyan-700 mb-2 flex items-center gap-2">
            <BoltIcon size={16} />
            When to choose ECT over TMS
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• Acute suicidality or severe psychotic depression</li>
            <li>• Catatonia or severe psychomotor retardation</li>
            <li>• Failed multiple medication trials AND TMS</li>
            <li>• You need rapid response (weeks not months)</li>
            <li>• You're under psychiatric hospitalization</li>
          </ul>
        </div>
      </div>

      {/* Source references */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">References & Sources</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-500">
          {[
            'Kellner CH et al. ECT handbook 4th ed.',
            'Lefter B et al. TMS vs ECT meta-analysis, JECT',
            'McIntyre JS et al. APA Treatment Guidelines MDD',
            'Novartis MAOI/SNRI clinical trial data',
            'Cleeremans A et al. TMS neuroplasticity NEJM',
            'Rosenquist PB et al. Maintenance ECT JECT',
          ].map((ref, i) => (
            <p key={i}>• {ref}</p>
          ))}
        </div>
      </div>
    </div>
  );
}