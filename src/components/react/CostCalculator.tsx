'use client';

import { useState } from 'react';
import { DollarIcon, BuildingIcon, InstitutionIcon, HospitalIcon } from './Icons';

type InsuranceStatus = 'none' | 'medicare' | 'medicaid' | 'private' | 'out-of-pocket';
type InsurancePlan = 'bcbs' | 'aetna' | 'cigna' | 'united' | 'kaiser' | 'humana' | 'other';

interface CostBreakdown {
  sessionCount: number;
  sessionRate: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  deductibleRemaining: number;
  copayPerSession: number;
  totalWithFinancing: number;
  monthlyPayment: number;
}

const STATE_AVERAGE: Record<string, number> = {
  'CA': 350, 'TX': 290, 'NY': 380, 'FL': 310, 'IL': 300,
  'PA': 295, 'OH': 275, 'GA': 280, 'NC': 270, 'MI': 285,
  'NJ': 360, 'VA': 300, 'WA': 340, 'MA': 370, 'AZ': 295,
  'CO': 320, 'TN': 265, 'MO': 260, 'WI': 280, 'MN': 310,
  'default': 300,
};

const INSURANCE_COVERAGE_RATES: Record<string, number> = {
  medicare: 0.80,
  medicaid: 0.70,
  bcbs: 0.75,
  aetna: 0.70,
  cigna: 0.72,
  united: 0.70,
  kaiser: 0.80,
  humana: 0.68,
  other: 0.65,
};

export default function CostCalculator() {
  const [state, setState] = useState('default');
  const [insuranceStatus, setInsuranceStatus] = useState<InsuranceStatus>('none');
  const [insurancePlan, setInsurancePlan] = useState<InsurancePlan>('bcbs');
  const [deductible, setDeductible] = useState(0);
  const [deductibleMet, setDeductibleMet] = useState(0);
  const [sessions, setSessions] = useState(36);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const sessionRate = STATE_AVERAGE[state] ?? STATE_AVERAGE['default'];
  const totalBeforeInsurance = sessionRate * sessions;
  const remaining = Math.max(0, deductible - deductibleMet);

  const coverageRate = insuranceStatus === 'none'
    ? 0
    : insuranceStatus === 'medicare'
    ? INSURANCE_COVERAGE_RATES['medicare']
    : insuranceStatus === 'medicaid'
    ? INSURANCE_COVERAGE_RATES['medicaid']
    : INSURANCE_COVERAGE_RATES[insurancePlan] ?? 0.70;

  const patientRate = 1 - coverageRate;
  const afterDeductible = Math.max(0, totalBeforeInsurance - remaining);
  const covered = afterDeductible * coverageRate;
  const patientOOP = afterDeductible * patientRate;
  const finalCost = remaining + patientOOP;

  const monthlyPayments = [6, 12, 24];
  const financing = monthlyPayments.map(months => ({
    months,
    monthly: Math.ceil(finalCost / months),
    total: Math.ceil(finalCost / months) * months,
    interest: 0,
  }));

  return (
    <div className="space-y-8">
      {/* State Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Your State</label>
        <select
          value={state}
          onChange={e => setState(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
        >
          <option value="default">Average (all states)</option>
          {Object.keys(STATE_AVERAGE).filter(s => s !== 'default').sort().map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">Average per-session rate: <span className="font-semibold text-violet-600">${sessionRate}</span></p>
      </div>

      {/* Insurance Status */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Insurance Coverage</label>
        <div className="grid grid-cols-2 gap-3">
          {(['none', 'private', 'medicare', 'medicaid'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setInsuranceStatus(opt)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                insuranceStatus === opt
                  ? 'bg-violet-50 border-violet-300 text-violet-700 ring-1 ring-violet-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {opt === 'none' ? '💰 Self-Pay' : opt === 'private' ? '🏢 Private Insurance' : opt === 'medicare' ? '🏛️ Medicare' : '🏥 Medicaid'}
            </button>
          ))}
        </div>
      </div>

      {/* Insurance Plan */}
      {insuranceStatus === 'private' && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Your Plan</label>
          <select
            value={insurancePlan}
            onChange={e => setInsurancePlan(e.target.value as InsurancePlan)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          >
            <option value="bcbs">Blue Cross Blue Shield</option>
            <option value="aetna">Aetna</option>
            <option value="cigna">Cigna</option>
            <option value="united">UnitedHealthcare</option>
            <option value="kaiser">Kaiser Permanente</option>
            <option value="humana">Humana</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Average coverage rate: <span className="font-semibold text-emerald-600">{Math.round(coverageRate * 100)}%</span>
          </p>
        </div>
      )}

      {/* Deductible */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Annual Deductible</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              value={deductible}
              onChange={e => setDeductible(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Deductible Already Met</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              value={deductibleMet}
              onChange={e => setDeductibleMet(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Sessions</label>
        <input
          type="range"
          min={1}
          max={60}
          value={sessions}
          onChange={e => setSessions(Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>1</span>
          <span className="font-semibold text-violet-600">{sessions} sessions</span>
          <span>60</span>
        </div>
      </div>

      {/* Results */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Your Estimated Cost</h3>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs text-violet-600 font-semibold hover:text-violet-700"
          >
            {showBreakdown ? 'Hide' : 'Show'} Breakdown
          </button>
        </div>

        {showBreakdown && (
          <div className="space-y-2 mb-6 pb-4 border-b border-slate-200 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total before insurance</span><span className="font-medium">${totalBeforeInsurance.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Remaining deductible</span><span className="font-medium">${remaining.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Insurance covers ({(coverageRate * 100).toFixed(0)}%)</span><span className="font-medium text-emerald-600">−${Math.round(covered).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Patient responsibility</span><span className="font-medium text-rose-600">${Math.round(patientOOP).toLocaleString()}</span></div>
          </div>
        )}

        <div className="text-center">
          <div className="text-5xl font-bold text-slate-900 mb-1">${Math.round(finalCost).toLocaleString()}</div>
          <div className="text-sm text-slate-500">Total out-of-pocket</div>
        </div>

        {insuranceStatus !== 'none' && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-center">
            <span className="text-sm font-semibold text-emerald-700">
              Insurance saves you ~${Math.round(totalBeforeInsurance - finalCost).toLocaleString()}
            </span>
          </div>
        )}

        {/* Financing */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Plans (0% interest)</p>
          <div className="grid grid-cols-3 gap-2">
            {financing.map(f => (
              <div key={f.months} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                <div className="text-lg font-bold text-slate-900">${f.monthly}</div>
                <div className="text-xs text-slate-400">/{f.months} mo</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400">Estimates based on average market rates. Actual costs vary by clinic, device, and insurance contract. Always verify with your provider.</p>
    </div>
  );
}