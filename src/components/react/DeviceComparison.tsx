'use client';

import { useState } from 'react';

interface Device {
  name: string;
  manufacturer: string;
  coilType: string;
  type: 'rTMS' | 'dTMS' | 'Navigated' | 'Robotic';
  fdaIndications: string[];
  sessions: string;
  price: string;
  insuranceCoverage: 'Excellent' | 'Good' | 'Limited';
  pulseRate: string;
  targeting: string;
  sedation: boolean;
  pros: string[];
  cons: string[];
}

const devices: Device[] = [
  {
    name: 'NeuroStar',
    manufacturer: 'Neuronetics (NASDAQ: STIM)',
    coilType: 'Figure-8 Coil',
    type: 'rTMS',
    fdaIndications: ['MDD', 'OCD'],
    sessions: '36 sessions over 6-9 weeks',
    price: '$250–$400/session',
    insuranceCoverage: 'Excellent',
    pulseRate: 'Up to 6,000 pulses/session',
    targeting: 'Standard positioning',
    sedation: false,
    pros: ['Largest installed base (1,800+ systems)', 'Excellent insurance coverage', 'FDA-cleared for OCD', 'Robust clinical trial data'],
    cons: ['Requires daily clinic visits', 'Standard figure-8 coil reaches surface only'],
  },
  {
    name: 'BrainsWay Deep TMS',
    manufacturer: 'BrainsWay Ltd.',
    coilType: 'H1/H2/H3 Coils (patented)',
    type: 'dTMS',
    fdaIndications: ['MDD', 'OCD', 'Smoking cessation'],
    sessions: '36 sessions over 6-9 weeks',
    price: '$300–$450/session',
    insuranceCoverage: 'Good',
    pulseRate: 'Up to 1,980 pulses/session',
    targeting: 'Deep brain structures',
    sedation: false,
    pros: ['H1 coil reaches DLPFC and ACC', 'FDA-cleared for 3 indications', 'Deeper penetration than figure-8', 'No MRI required'],
    cons: ['Higher per-session cost', 'Less insurance coverage than NeuroStar', 'Requires trained technicians for H-coils'],
  },
  {
    name: 'MagVenture TMS',
    manufacturer: 'Magstim Limited',
    coilType: 'Figure-8, Cool Coil, Dolphin',
    type: 'rTMS',
    fdaIndications: ['MDD'],
    sessions: '36 sessions over 6-9 weeks',
    price: '$250–$380/session',
    insuranceCoverage: 'Good',
    pulseRate: 'Up to 6,000 pulses/session',
    targeting: 'Standard + navigated',
    sedation: false,
    pros: ['Widely used in Europe & US', 'Dolphin coil for pain-free treatment', 'FDA-cleared, CE-marked', 'Multiple coil options'],
    cons: ['Less insurance coverage in some states', 'No OCD clearance in US (only EU)'],
  },
  {
    name: 'Nexstim SmartFocus',
    manufacturer: 'Nexstim Plc',
    coilType: 'SmartFocus Navigated TMS',
    type: 'Navigated',
    fdaIndications: ['MDD', 'Severe depression (FDA breakthrough device)'],
    sessions: 'Variable based on targeting',
    price: '$350–$500/session',
    insuranceCoverage: 'Limited',
    pulseRate: 'Up to 3,000 pulses/session',
    targeting: 'MRI-navigated, neuronavigated',
    sedation: false,
    pros: ['MRI-based 3D brain mapping', 'Precision targeting to mm accuracy', 'Customized per patient anatomy', 'Best for research protocols'],
    cons: ['Highest cost per session', 'Insurance rarely covers', 'Longer setup time', 'Requires MRI integration'],
  },
  {
    name: 'Magstim Rapid²',
    manufacturer: 'Magstim',
    coilType: 'Figure-8, Double Cone',
    type: 'rTMS',
    fdaIndications: ['MDD'],
    sessions: '36 sessions over 6-9 weeks',
    price: '$250–$375/session',
    insuranceCoverage: 'Good',
    pulseRate: 'Up to 100 Hz (rapid)',
    targeting: 'Standard positioning',
    sedation: false,
    pros: ['Fastest pulse rate available', 'Compact system footprint', 'Used extensively in research', 'Good for theta burst protocols'],
    cons: ['No OCD indication', 'Smaller installed base in US', 'Limited reimbursement codes'],
  },
  {
    name: 'CloudTMS',
    manufacturer: 'CloudTMS (BrainsNation)',
    coilType: 'Figure-8 Coil',
    type: 'rTMS',
    fdaIndications: ['MDD'],
    sessions: '36 sessions over 6-9 weeks',
    price: '$200–$300/session',
    insuranceCoverage: 'Limited',
    pulseRate: 'Up to 30 Hz',
    targeting: 'Standard positioning',
    sedation: false,
    pros: ['Lower cost device', 'FDA-cleared', 'Cloud-based treatment tracking', 'Growing US presence'],
    cons: ['Limited insurance coverage', 'Fewer FDA indications', 'Smaller clinical data set', 'Newer to market'],
  },
  {
    name: 'Apollo TMS',
    manufacturer: 'NuSpine / Advanced TMS',
    coilType: 'Figure-8 Coil',
    type: 'rTMS',
    fdaIndications: ['MDD'],
    sessions: '36 sessions over 6-9 weeks',
    price: '$225–$350/session',
    insuranceCoverage: 'Good',
    pulseRate: 'Up to 5,000 pulses/session',
    targeting: 'Standard positioning',
    sedation: false,
    pros: ['Competitive pricing', 'FDA-cleared', 'Growing clinic network', 'Solid support infrastructure'],
    cons: ['Newer device, less clinical history', 'No OCD clearance'],
  },
];

const coverageColors: Record<string, string> = {
  'Excellent': 'bg-emerald-100 text-emerald-700',
  'Good': 'bg-amber-100 text-amber-700',
  'Limited': 'bg-slate-100 text-slate-600',
};

const typeColors: Record<string, string> = {
  'rTMS': 'bg-violet-50 text-violet-700',
  'dTMS': 'bg-cyan-50 text-cyan-700',
  'Navigated': 'bg-emerald-50 text-emerald-700',
  'Robotic': 'bg-amber-50 text-amber-700',
};

export default function DeviceComparison() {
  const [selected, setSelected] = useState<Device | null>(devices[0]);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? devices : devices.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visible.map(device => (
          <button
            key={device.name}
            onClick={() => setSelected(device)}
            className={`text-left rounded-2xl p-5 border transition-all ${
              selected?.name === device.name
                ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-200'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-lg">🧠</div>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${coverageColors[device.insuranceCoverage]}`}>
                {device.insuranceCoverage} coverage
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">{device.name}</h4>
            <p className="text-xs text-slate-400 mb-2">{device.manufacturer}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[device.type]}`}>{device.type}</span>
            <p className="text-xs text-slate-500 mt-2">{device.price}</p>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAll(!showAll)}
        className="text-sm text-violet-600 font-semibold hover:text-violet-700 transition-colors"
      >
        {showAll ? 'Show fewer devices' : `Show all ${devices.length} devices →`}
      </button>

      {/* Comparison Table */}
      {selected && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 pr-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-1/4">Specification</th>
                {devices.map(d => (
                  <th key={d.name} className={`text-center py-3 px-3 font-bold text-xs ${d.name === selected.name ? 'text-violet-600' : 'text-slate-700'}`}>
                    {d.name}
                    {d.name === selected.name && ' ★'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Type', key: 'type', render: (v: string) => `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[v] || ''}">${v}</span>` },
                { label: 'FDA Indications', key: 'fdaIndications', render: (v: string[]) => v.join(', ') },
                { label: 'Coil Type', key: 'coilType' },
                { label: 'Price/Session', key: 'price' },
                { label: 'Insurance', key: 'insuranceCoverage', render: (v: string) => `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${coverageColors[v]}">${v}</span>` },
                { label: 'Sessions', key: 'sessions' },
                { label: 'Pulse Rate', key: 'pulseRate' },
                { label: 'Targeting', key: 'targeting' },
              ].map(row => (
                <tr key={row.label} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 pr-4 text-xs font-semibold text-slate-500">{row.label}</td>
                  {devices.map(d => {
                    const val = (d as Record<string, unknown>)[row.key] as string | string[];
                    return (
                      <td key={d.name} className={`py-3 px-3 text-center text-xs ${d.name === selected.name ? 'bg-violet-50/30' : 'text-slate-600'}`}>
                        {row.render ? (row.render as (v: unknown) => string)(val as unknown) : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-lg shrink-0">🧠</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{selected.manufacturer}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">FDA Clearances</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.fdaIndications.map(ind => (
                  <span key={ind} className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{ind}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Coverage</p>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${coverageColors[selected.insuranceCoverage]}`}>{selected.insuranceCoverage}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Pros</p>
              <ul className="space-y-1">
                {selected.pros.map(p => (
                  <li key={p} className="text-xs text-slate-600 flex items-start gap-1.5"><span className="text-emerald-500">✓</span>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Cons</p>
              <ul className="space-y-1">
                {selected.cons.map(c => (
                  <li key={c} className="text-xs text-slate-600 flex items-start gap-1.5"><span className="text-rose-400">−</span>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}