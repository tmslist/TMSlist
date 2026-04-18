// Single source of truth for TMS protocol definitions.
// Shared by TMSViewer and ProtocolExplorer.

export interface TMSProtocol {
  name: string;
  fullName: string;
  type: 'rTMS' | 'dTMS' | 'iTBS' | 'cTBS' | 'Accelerated' | 'SNT';
  frequencyHz: number;
  frequencyDisplay: string;
  intensityPct: number;
  intensityDisplay: string;
  pulses: number;
  pulsesDisplay: string;
  duration: string;
  sessionsTotal: number;
  sessionsPerDay: string | number;
  fdaCleared: string;
  evidence: 'Strong' | 'Moderate' | 'Emerging';
  indication: string;
  pros: string[];
  cons: string[];
  badge?: string;
  pulsePattern: 'continuous' | 'tbs-burst' | 'ctbs' | 'single';
}

export const protocols: TMSProtocol[] = [
  {
    name: 'Standard rTMS',
    fullName: 'High-Frequency rTMS (10Hz)',
    type: 'rTMS',
    frequencyHz: 10,
    frequencyDisplay: '10 Hz',
    intensityPct: 120,
    intensityDisplay: '120% MT',
    pulses: 3000,
    pulsesDisplay: '3,000 per session',
    duration: '37 min/session',
    sessionsTotal: 36,
    sessionsPerDay: 1,
    fdaCleared: '2008 (MDD)',
    evidence: 'Strong',
    indication: 'Major Depression',
    pros: ['Most studied protocol', 'Wide insurance coverage', 'Well-understood safety profile'],
    cons: ['Daily visits for 6+ weeks', 'Moderate dropout rate (~20%)'],
    pulsePattern: 'continuous',
  },
  {
    name: 'Theta Burst (iTBS)',
    fullName: 'Intermittent Theta Burst Stimulation',
    type: 'iTBS',
    frequencyHz: 50,
    frequencyDisplay: '50 Hz bursts',
    intensityPct: 80,
    intensityDisplay: '80% MT',
    pulses: 600,
    pulsesDisplay: '600 pulses',
    duration: '3 min/session',
    sessionsTotal: 30,
    sessionsPerDay: 1,
    fdaCleared: '2018 (MDD)',
    evidence: 'Strong',
    indication: 'MDD (treatment-resistant)',
    pros: ['3-minute sessions', 'Non-inferior to 10Hz in clinical trials', 'FDA-cleared equivalent efficacy'],
    cons: ['80% MT threshold must be precisely set', 'Still requires daily visits'],
    badge: 'Popular',
    pulsePattern: 'tbs-burst',
  },
  {
    name: 'Deep TMS (BrainsWay)',
    fullName: 'High-Frequency Deep TMS (H1 Coil)',
    type: 'dTMS',
    frequencyHz: 10,
    frequencyDisplay: '10 Hz',
    intensityPct: 120,
    intensityDisplay: '120% MT',
    pulses: 1980,
    pulsesDisplay: '1,980 pulses',
    duration: '20 min/session',
    sessionsTotal: 36,
    sessionsPerDay: 1,
    fdaCleared: '2013 (MDD), 2020 (OCD)',
    evidence: 'Strong',
    indication: 'MDD, OCD',
    pros: ['Reaches deeper brain structures (DLPFC)', 'Broader network activation', 'FDA-cleared for OCD'],
    cons: ['Higher cost per session', 'Requires specialized H1 coil device'],
    pulsePattern: 'continuous',
  },
  {
    name: 'SNT (Stanford Protocol)',
    fullName: 'Stanford Accelerated Intelligent Neuromodulation Therapy (SAINT)',
    type: 'Accelerated',
    frequencyHz: 10,
    frequencyDisplay: '10 Hz',
    intensityPct: 90,
    intensityDisplay: '90% MT',
    pulses: 1800,
    pulsesDisplay: '1,800 per session',
    duration: '10 min/session',
    sessionsTotal: 50,
    sessionsPerDay: '10 (5 days/week)',
    fdaCleared: 'Not yet cleared',
    evidence: 'Emerging',
    indication: 'Treatment-resistant MDD',
    pros: ['~90% remission rate in SAINT trials', 'Completed in ~2 weeks', 'Works on patients who failed 5+ meds'],
    cons: ['Not FDA-cleared (off-label)', 'Intensive: 10 sessions/day', 'Limited availability', 'Insurance typically does not cover'],
    badge: 'High Efficacy',
    pulsePattern: 'continuous',
  },
  {
    name: 'Low-Frequency (1Hz)',
    fullName: 'Low-Frequency rTMS Right DLPFC',
    type: 'rTMS',
    frequencyHz: 1,
    frequencyDisplay: '1 Hz',
    intensityPct: 100,
    intensityDisplay: '100% MT',
    pulses: 1200,
    pulsesDisplay: '1,200 pulses',
    duration: '20 min/session',
    sessionsTotal: 30,
    sessionsPerDay: 1,
    fdaCleared: '2012 (MDD)',
    evidence: 'Moderate',
    indication: 'MDD (especially with anxiety)',
    pros: ['Right-sided (avoidsomania risk)', 'May be safer for bipolar patients', 'Good for anxious depression'],
    cons: ['Less robust efficacy data than 10Hz', 'Longer session than iTBS'],
    pulsePattern: 'continuous',
  },
  {
    name: 'cTBS (Ldtn)',
    fullName: 'Continuous Theta Burst / Left DLPFC',
    type: 'cTBS',
    frequencyHz: 50,
    frequencyDisplay: '50 Hz bursts',
    intensityPct: 100,
    intensityDisplay: '100% MT',
    pulses: 600,
    pulsesDisplay: '600 pulses',
    duration: '3.5 min/session',
    sessionsTotal: 30,
    sessionsPerDay: 1,
    fdaCleared: 'Research only',
    evidence: 'Emerging',
    indication: 'MDD (investigational)',
    pros: ['Fast application', 'Right-sided inhibitory approach', 'Emerging evidence for working memory'],
    cons: ['Not FDA-cleared', 'Less clinical data than iTBS', 'Variable response rates'],
    pulsePattern: 'ctbs',
  },
];

export const protocolTypeColors: Record<string, string> = {
  rTMS: 'bg-violet-100 text-violet-700',
  dTMS: 'bg-cyan-100 text-cyan-700',
  iTBS: 'bg-emerald-100 text-emerald-700',
  cTBS: 'bg-amber-100 text-amber-700',
  Accelerated: 'bg-fuchsia-100 text-fuchsia-700',
  SNT: 'bg-rose-100 text-rose-700',
};

export const evidenceColors: Record<string, string> = {
  Strong: 'bg-emerald-100 text-emerald-700',
  Moderate: 'bg-amber-100 text-amber-700',
  Emerging: 'bg-blue-100 text-blue-700',
};
