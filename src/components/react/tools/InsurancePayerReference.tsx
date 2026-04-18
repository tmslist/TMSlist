'use client';

import { useState } from 'react';

interface CPTCode {
  code: string;
  description: string;
  rate: string;
  sessions: string;
  payerCoverage: string;
  notes: string;
}

const CPT_CODES: CPTCode[] = [
  {
    code: '90867',
    description: 'Therapeutic repetitive TMS, initial delivery',
    rate: '$350–$650',
    sessions: 'Per session',
    payerCoverage: 'Medicare + Most insurers',
    notes: 'Used for the first session including motor threshold mapping. Billable once per treatment course.',
  },
  {
    code: '90868',
    description: 'Therapeutic repetitive TMS, subsequent delivery',
    rate: '$200–$450',
    sessions: 'Per session',
    payerCoverage: 'Medicare + Most insurers',
    notes: 'All sessions after the initial mapping. The majority of billing is under this code.',
  },
  {
    code: '90869',
    description: 'Motor threshold determination for TMS',
    rate: '$75–$150',
    sessions: 'Per determination',
    payerCoverage: 'Variable',
    notes: 'May be billed separately or bundled. Some payers require separate documentation of MT procedure.',
  },
];

const INSURERS = [
  {
    name: 'Aetna',
    logo: 'Aetna',
    coverage: 'Covered with prior auth for MDD failing 1 medication trial. Requires PHQ-9 documentation.',
    criteria: ['MDD diagnosis', 'Failed 1 adequate medication trial', 'PHQ-9 ≥ 10 or equivalent', 'No substance dependence'],
    priorAuthDays: '5–10 business days',
    notes: 'May require peer-to-peer review. 36-session limit per course.',
  },
  {
    name: 'United Healthcare',
    logo: 'UHC',
    coverage: 'Covered for TRD (treatment-resistant depression) after 2 medication trials.',
    criteria: ['TRD: 2+ failed medication trials', 'PHQ-9 documentation', 'No ECT in last 6 months (varies)'],
    priorAuthDays: '5–15 business days',
    notes: 'Does not cover iTBS as non-inferior in their review. Standard rTMS only.',
  },
  {
    name: 'Cigna',
    logo: 'Cigna',
    coverage: 'Covered for MDD after 4 weeks of medication at therapeutic dose.',
    criteria: ['Documented MDD', 'Adequate medication trial (4+ weeks)', 'PHQ-9 or MADRS scores', 'Psychiatric evaluation'],
    priorAuthDays: '7–14 business days',
    notes: 'Pre-authorization required. 30 sessions covered.',
  },
  {
    name: 'Blue Cross Blue Shield',
    logo: 'BCBS',
    coverage: 'Coverage varies by state plan. Most cover rTMS for MDD.',
    criteria: ['Treatment-resistant depression definition varies by plan', 'Documented failed medications', 'Psychiatric authorization'],
    priorAuthDays: '5–21 business days',
    notes: 'Extremely variable by state. Check specific state plan requirements. Some states mandate coverage.',
  },
  {
    name: 'Humana',
    logo: 'Humana',
    coverage: 'Covered with prior authorization for TRD.',
    criteria: ['TRD (2+ failed medications)', 'PHQ-9 ≥ 15', 'Outpatient psychiatric setting required'],
    priorAuthDays: '7–10 business days',
    notes: 'Requires treatment to be in outpatient setting. Inpatient not covered.',
  },
  {
    name: 'Kaiser Permanente',
    logo: 'Kaiser',
    coverage: 'Covered through their system. External TMS providers often out-of-network.',
    criteria: ['Referral from Kaiser psychiatrist required', 'Failure of 2+ medications', 'Regional formulary approval'],
    priorAuthDays: 'Varies by region',
    notes: 'Many Kaiser regions have TMS coordinators. External providers typically require prior authorization from Kaiser.',
  },
  {
    name: 'Medicare Part B',
    logo: 'Medicare',
    coverage: 'Covered under Part B. 80% after deductible.',
    criteria: ['MDD diagnosis', 'Failed or intolerant to antidepressant medication', 'Signed consent', 'Physician supervision'],
    priorAuthDays: 'No prior auth but medical necessity documentation required',
    notes: 'Patient responsible for 20%. Physician must be enrolled in Medicare. Covers standard rTMS (90867/90868).',
  },
  {
    name: 'Medicare Advantage',
    logo: 'Medicare Advantage',
    coverage: 'Varies by plan. Most follow Medicare guidelines with prior auth.',
    criteria: ['Follows Medicare Part B rules', 'Additional plan-specific criteria may apply'],
    priorAuthDays: '5–14 business days',
    notes: 'Some plans have more restrictive criteria than original Medicare. Check specific plan.',
  },
];

const PRIOR_AUTH_TEMPLATE = `PRIOR AUTHORIZATION REQUEST — TRANSCRANIAL MAGNETIC STIMULATION (TMS)

Patient Information:
- Name: ___________
- DOB: ___________
- Insurance ID: ___________
- Member ID: ___________

Provider Information:
- Provider: ___________
- NPI: ___________
- Tax ID: ___________
- Practice: ___________
- Phone: ___________

Request:
- CPT Codes: 90867, 90868 (or 90869 for motor threshold)
- Diagnosis: F32.1 Major Depressive Disorder, single episode, moderate
- Treatment: Repetitive Transcranial Magnetic Stimulation (rTMS)
- Protocol: High-frequency rTMS (10Hz), 36 sessions
- Site: Left DLPFC

Clinical Justification:
- Primary diagnosis: Major Depressive Disorder, treatment-resistant
- Prior treatments failed (document medication trials with dates, doses, response):
  1. [Medication 1] - [Date] - [Dose] - [Outcome]
  2. [Medication 2] - [Date] - [Dose] - [Outcome]
- PHQ-9 score: _____ (baseline)
- GAD-7 score: _____ (baseline)
- Psychiatric evaluation date: ___________
- Patient has capacity to consent to TMS treatment

Expected outcome:
- Reduction in PHQ-9 score by ≥50%
- Improved functional capacity
- Reduced medication dependence (goal, not guaranteed)

Requested sessions: 36 (standard course)
Estimated cost per session: $___
Estimated total: $___

Please contact [Provider] at [Phone] for any additional information.`;

export default function InsurancePayerReference() {
  const [selectedInsurer, setSelectedInsurer] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const insurer = INSURERS.find(i => i.name === selectedInsurer);

  const copyTemplate = () => {
    navigator.clipboard.writeText(PRIOR_AUTH_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* CPT Codes Table */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-4">CPT Codes for TMS</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['CPT', 'Description', 'Rate', 'Payer Coverage', 'Notes'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CPT_CODES.map(code => (
                <tr key={code.code} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <span className="font-mono font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded">{code.code}</span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-800">{code.description}</td>
                  <td className="py-3 pr-4 text-cyan-600 font-semibold">{code.rate}</td>
                  <td className="py-3 pr-4 text-emerald-600 text-xs font-semibold">{code.payerCoverage}</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{code.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insurance Payer Selector */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-4">Insurance Payer Coverage Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INSURERS.map(ins => (
            <button
              key={ins.name}
              onClick={() => setSelectedInsurer(selectedInsurer === ins.name ? null : ins.name)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedInsurer === ins.name
                  ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-300'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <p className="text-sm font-bold text-slate-800">{ins.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected insurer detail */}
      {insurer && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-800">{insurer.name} Coverage</h4>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
              Prior auth: {insurer.priorAuthDays}
            </span>
          </div>
          <p className="text-sm text-slate-600">{insurer.coverage}</p>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Coverage Criteria</p>
            <ul className="space-y-1.5">
              {insurer.criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-violet-500 mt-0.5">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {insurer.notes && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-bold text-amber-700 mb-1">Note</p>
              <p className="text-sm text-slate-600">{insurer.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Prior auth template */}
      <div>
        <button
          onClick={() => setShowTemplate(!showTemplate)}
          className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-2"
        >
          <svg className={`w-4 h-4 transition-transform ${showTemplate ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
          </svg>
          Prior Authorization Letter Template
        </button>
        {showTemplate && (
          <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3 flex items-center justify-between border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-500">PA Letter Template</p>
              <button
                onClick={copyTemplate}
                className="text-xs font-semibold px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
              >
                {copiedTemplate ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="px-5 py-4 text-xs text-slate-600 font-mono whitespace-pre-wrap bg-white max-h-80 overflow-y-auto">
              {PRIOR_AUTH_TEMPLATE}
            </pre>
          </div>
        )}
      </div>

      {/* Coverage disclaimer */}
      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500">
          <strong>Disclaimer:</strong> Coverage information is based on publicly available payer policies and is subject to change. Always verify current coverage requirements directly with the payer. TMSList is not responsible for coverage decisions. This tool is for educational purposes only.
        </p>
      </div>
    </div>
  );
}