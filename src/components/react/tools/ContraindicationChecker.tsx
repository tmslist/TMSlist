'use client';

import { useState } from 'react';
import { contraindications, getContraindicationResult } from '../../../data/contraindications';
import { protocols } from '../../../data/tmsProtocols';
import { CheckCircleIcon, WarningIcon, HospitalIcon, BanIcon, CheckIcon } from '../Icons';

type Status = 'safe' | 'caution' | 'consult' | 'not-recommended';

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; message: string }> = {
  safe: {
    label: 'Clear for TMS',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircleIcon size={40} className="text-emerald-600" />,
    message: 'No contraindications detected. You appear to be a suitable candidate for TMS therapy.',
  },
  caution: {
    label: 'Proceed with Caution',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <WarningIcon size={40} className="text-amber-600" />,
    message: 'Some precautions apply. Discuss these with your physician before starting TMS treatment.',
  },
  consult: {
    label: 'Consult Physician Required',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <HospitalIcon size={40} className="text-orange-600" />,
    message: 'Relative contraindications detected. A physician must evaluate the risk vs. benefit before proceeding.',
  },
  'not-recommended': {
    label: 'Not Recommended',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <BanIcon size={40} className="text-red-600" />,
    message: 'Absolute or severe contraindications detected. TMS is not recommended without extensive physician review.',
  },
};

const MEDICATION_CHECKLIST = [
  { name: 'Bupropion (Wellbutrin)', risk: 'moderate', detail: 'May lower seizure threshold. Discuss with physician.' },
  { name: 'Tramadol', risk: 'high', detail: 'Significantly lowers seizure threshold. Often contraindicated.' },
  { name: 'Clomipramine', risk: 'moderate', detail: 'May increase seizure risk during TMS.' },
  { name: 'Antipsychotics (clozapine)', risk: 'high', detail: 'Significant seizure risk elevation.' },
  { name: 'Other TCAs (amitriptyline)', risk: 'low', detail: 'Minor elevation in seizure threshold.' },
  { name: 'Antibiotics (fluoroquinolones)', risk: 'moderate', detail: 'Can lower seizure threshold temporarily.' },
];

const IMPLANT_CHECKLIST = [
  { name: 'Aneurysm clips (brain)', risk: 'absolute', detail: 'Metal in brain is an absolute contraindication for TMS.' },
  { name: 'Deep brain stimulator', risk: 'absolute', detail: 'Electronic brain implants are an absolute contraindication.' },
  { name: 'Cochlear implant', risk: 'relative', detail: 'Metallic device near treatment area requires careful evaluation.' },
  { name: 'Pacemaker', risk: 'relative', detail: 'Cardiac devices require cardiology consultation before TMS.' },
  { name: 'Vagus nerve stimulator', risk: 'relative', detail: 'Interaction with implanted stimulation device possible.' },
  { name: 'Intracranial electrodes', risk: 'absolute', detail: 'Active electrodes in brain are an absolute contraindication.' },
  { name: 'Metallic dental implants', risk: 'none', detail: 'Generally safe — TMS is not applied to oral cavity.' },
];

const severityBadge: Record<string, string> = {
  none: 'bg-emerald-100 text-emerald-700',
  low: 'bg-slate-100 text-slate-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  absolute: 'bg-red-200 text-red-800',
  relative: 'bg-orange-100 text-orange-700',
  caution: 'bg-amber-100 text-amber-700',
};

export default function ContraindicationChecker() {
  const [ciAnswers, setCiAnswers] = useState<Record<string, boolean>>({});
  const [medChecked, setMedChecked] = useState<Record<string, boolean>>({});
  const [implantChecked, setImplantChecked] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(0); // 0=main ci, 1=meds, 2=implants, 3=result
  const [protocolFilter, setProtocolFilter] = useState('all');

  const ciResult = getContraindicationResult(ciAnswers);
  const medConcerns = Object.entries(medChecked).filter(([_, v]) => v);
  const implantConcerns = Object.entries(implantChecked).filter(([_, v]) => v);

  // Determine final status
  const hasAbsolute = ciResult.concerns.some(c => c.includes('Absolute'));
  const hasRelative = ciResult.concerns.some(c => c.includes('Relative'));
  const hasPrecaution = ciResult.concerns.some(c => c.includes('Precaution'));
  const hasMedHigh = medConcerns.some(([name]) => {
    const med = MEDICATION_CHECKLIST.find(m => m.name === name);
    return med?.risk === 'high';
  });
  const hasImplantAbs = implantConcerns.some(([name]) => {
    const imp = IMPLANT_CHECKLIST.find(i => i.name === name);
    return imp?.risk === 'absolute';
  });

  let finalStatus: Status = 'safe';
  if (hasAbsolute || hasImplantAbs) finalStatus = 'not-recommended';
  else if (hasRelative || hasMedHigh) finalStatus = 'consult';
  else if (hasPrecaution || medConcerns.length > 0) finalStatus = 'caution';

  const config = STATUS_CONFIG[finalStatus];

  const safeProtocols = protocols.filter(p => {
    if (finalStatus === 'safe') return true;
    if (finalStatus === 'caution') return true;
    if (finalStatus === 'consult') return p.evidence !== 'Emerging';
    return false;
  });

  return (
    <div className="space-y-8">
      {/* Step progress */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                step === s
                  ? 'bg-violet-600 text-white'
                  : s < step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {s < step ? <CheckIcon size={14} className="text-white" /> : s + 1}
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {['General', 'Medications', 'Implants', 'Result'][s]}
            </span>
            {s < 3 && <div className="w-6 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: General contraindications */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">General Health Check</h3>
          <p className="text-sm text-slate-500">Answer each question honestly. This is for educational purposes — always discuss with your physician.</p>
          <div className="space-y-3">
            {contraindications.map(ci => (
              <div key={ci.id} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setCiAnswers(prev => ({ ...prev, [ci.id]: !prev[ci.id] }))}
                    className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      ciAnswers[ci.id]
                        ? ci.severity === 'absolute' ? 'bg-red-500 border-red-500'
                          : ci.severity === 'relative' ? 'bg-orange-500 border-orange-500'
                          : 'bg-amber-500 border-amber-500'
                        : 'border-slate-200 hover:border-violet-400'
                    }`}
                  >
                    {ciAnswers[ci.id] && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-800">{ci.question}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityBadge[ci.severity]}`}>
                        {ci.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{ci.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors">
            Next: Medications →
          </button>
        </div>
      )}

      {/* Step 1: Medications */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Medication Review</h3>
          <p className="text-sm text-slate-500">Check any medications you are currently taking that may affect TMS safety.</p>
          <div className="space-y-2">
            {MEDICATION_CHECKLIST.map(med => (
              <div key={med.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <button
                  onClick={() => setMedChecked(prev => ({ ...prev, [med.name]: !prev[med.name] }))}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    medChecked[med.name] ? 'bg-amber-500 border-amber-500' : 'border-slate-200'
                  }`}
                >
                  {medChecked[med.name] && <CheckIcon size={12} className="text-white" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{med.name}</p>
                  <p className="text-xs text-slate-400">{med.detail}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityBadge[med.risk]}`}>
                  {med.risk} risk
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors">← Back</button>
            <button onClick={() => setStep(2)} className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors">Next: Implants →</button>
          </div>
        </div>
      )}

      {/* Step 2: Implants */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Implants & Devices</h3>
          <p className="text-sm text-slate-500">Check any metal or electronic devices in or near your head and body.</p>
          <div className="space-y-2">
            {IMPLANT_CHECKLIST.map(imp => (
              <div key={imp.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <button
                  onClick={() => setImplantChecked(prev => ({ ...prev, [imp.name]: !prev[imp.name] }))}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    implantChecked[imp.name]
                      ? imp.risk === 'absolute' ? 'bg-red-500 border-red-500'
                        : imp.risk === 'high' ? 'bg-red-400 border-red-400'
                        : 'bg-orange-500 border-orange-500'
                      : 'border-slate-200'
                  }`}
                >
                  {implantChecked[imp.name] && <CheckIcon size={12} className="text-white" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{imp.name}</p>
                  <p className="text-xs text-slate-400">{imp.detail}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityBadge[imp.risk]}`}>
                  {imp.risk}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors">View Result →</button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Status card */}
          <div className={`rounded-2xl p-8 border ${config.bg} ${config.border}`}>
            <div className="flex items-center gap-4 mb-4">
              {config.icon}
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${config.color} mb-1`}>TMS Eligibility Assessment</p>
                <p className="text-2xl font-bold text-slate-900">{config.label}</p>
              </div>
            </div>
            <p className="text-slate-700">{config.message}</p>
          </div>

          {/* Concerns summary */}
          {ciResult.concerns.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-sm font-bold text-slate-700 mb-3">Identified Concerns</p>
              <ul className="space-y-2">
                {ciResult.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {c.replace('Absolute contraindication: ', '').replace('Relative contraindication: ', '').replace('Precaution: ', '')}
                  </li>
                ))}
                {medConcerns.map(([name]) => {
                  const med = MEDICATION_CHECKLIST.find(m => m.name === name);
                  return (
                    <li key={name} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-amber-500 mt-0.5">•</span>
                      Medication: {name} — {med?.detail}
                    </li>
                  );
                })}
                {implantConcerns.map(([name]) => {
                  const imp = IMPLANT_CHECKLIST.find(i => i.name === name);
                  return (
                    <li key={name} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-red-500 mt-0.5">•</span>
                      Implant: {name} — {imp?.detail}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Protocol recommendations */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">Recommended Protocols (if cleared)</p>
            <div className="space-y-2">
              {safeProtocols.map(p => (
                <div key={p.name} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.evidence === 'Strong' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.evidence}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.indication} · {p.duration} · {p.pulsesDisplay}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
              Start Over
            </button>
            <a href="/quiz/am-i-a-candidate/" className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors">
              Take Full Eligibility Quiz →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}