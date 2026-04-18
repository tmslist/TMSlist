'use client';

import { useState } from 'react';

// Card data structure
interface ScienceCard {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  colorClass: string;
  frontIcon: React.ReactNode;
  backContent: string;
  exploreMore: string[];
}

// Card data with all 6 cards
const scienceCards: ScienceCard[] = [
  {
    id: 'magnetic-induction',
    title: 'Magnetic Induction',
    subtitle: "Faraday's Law",
    color: '#06b6d4', // cyan
    colorClass: 'cyan',
    frontIcon: (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        {/* TMS Coil */}
        <g transform="translate(10, 20)">
          <ellipse cx="25" cy="25" rx="22" ry="18" fill="none" stroke="#06b6d4" strokeWidth="3" />
          <ellipse cx="75" cy="25" rx="22" ry="18" fill="none" stroke="#06b6d4" strokeWidth="3" />
          <path d="M3 25 Q25 40 47 25" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <path d="M53 25 Q75 40 97 25" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="25" cy="25" r="4" fill="#06b6d4" className="animate-pulse" />
          <circle cx="75" cy="25" r="4" fill="#06b6d4" className="animate-pulse" />
        </g>
        {/* Field lines */}
        <g stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.8">
          <path d="M60 45 C60 55, 50 65, 50 80" className="animate-[dash_1.5s_linear_infinite]" strokeDasharray="4 3" />
          <path d="M60 45 C65 58, 60 68, 60 80" className="animate-[dash_1.5s_linear_infinite_0.2s]" strokeDasharray="4 3" />
          <path d="M60 45 C70 55, 75 65, 70 80" className="animate-[dash_1.5s_linear_infinite_0.4s]" strokeDasharray="4 3" />
          <path d="M60 45 C55 58, 45 70, 45 80" className="animate-[dash_1.5s_linear_infinite_0.6s]" strokeDasharray="4 3" />
          <path d="M60 45 C72 52, 85 62, 80 80" className="animate-[dash_1.5s_linear_infinite_0.8s]" strokeDasharray="4 3" />
        </g>
        {/* Skull cross-section */}
        <g transform="translate(35, 70)">
          <ellipse cx="25" cy="15" rx="25" ry="12" fill="none" stroke="#94a3b8" strokeWidth="2" />
          <ellipse cx="25" cy="15" rx="20" ry="9" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
          <ellipse cx="25" cy="15" rx="15" ry="6" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
        </g>
      </svg>
    ),
    backContent: "A changing magnetic field (dB/dt) induces an electric current in conductive tissue via Faraday's law. TMS uses a rapidly switching magnetic field (~50 µs rise time) to create induced currents in the cortex. The induced current density of ~100 A/m² is sufficient to depolarize layer II/III pyramidal neurons.",
    exploreMore: [
      "The magnetic pulse peaks at 1-2 Tesla, comparable to MRI strength",
      "Field strength decays with distance following inverse square law",
      "Coil geometry determines focality and penetration depth"
    ]
  },
  {
    id: 'neuron-activation',
    title: 'Neuron Activation',
    subtitle: 'Excitatory vs Inhibitory',
    color: '#8b5cf6', // violet
    colorClass: 'violet',
    frontIcon: (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        {/* Neuron body */}
        <ellipse cx="60" cy="30" rx="18" ry="14" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
        <ellipse cx="60" cy="30" rx="8" ry="6" fill="#8b5cf6" opacity="0.3" />
        {/* Dendrites */}
        <path d="M45 22 Q30 15 20 8" stroke="#8b5cf6" strokeWidth="2" fill="none" />
        <path d="M48 28 Q35 25 25 22" stroke="#8b5cf6" strokeWidth="2" fill="none" />
        <path d="M75 22 Q90 15 100 8" stroke="#8b5cf6" strokeWidth="2" fill="none" />
        <path d="M72 28 Q85 25 95 22" stroke="#8b5cf6" strokeWidth="2" fill="none" />
        {/* Axon */}
        <path d="M60 44 L60 65 Q60 75 70 80 L90 85" stroke="#8b5cf6" strokeWidth="2.5" fill="none" />
        {/* Axon terminals */}
        <circle cx="90" cy="85" r="3" fill="#10b981" />
        <circle cx="95" cy="90" r="2" fill="#10b981" />
        <circle cx="85" cy="88" r="2" fill="#10b981" />
        {/* Action potential waveform */}
        <g transform="translate(5, 50)">
          <path d="M0 35 L15 35 L20 35 L25 10 L30 45 L35 35 L50 35 L55 35 L60 10 L65 45 L70 35 L85 35"
                stroke="#10b981" strokeWidth="2" fill="none" className="animate-pulse" />
        </g>
        {/* Frequency labels */}
        <text x="8" y="68" fontSize="8" fill="#10b981" fontWeight="bold">10Hz</text>
        <text x="8" y="78" fontSize="7" fill="#64748b">↑Glutamate</text>
        <text x="78" y="68" fontSize="8" fill="#f43f5e" fontWeight="bold">1Hz</text>
        <text x="78" y="78" fontSize="7" fill="#64748b">↑GABA</text>
      </svg>
    ),
    backContent: "TMS activates both excitatory pyramidal neurons (Type I) and inhibitory interneurons (Type II). High-frequency stimulation (≥5Hz) increases glutamate release and promotes calcium influx, leading to LTP-like changes. Low-frequency (≤1Hz) suppresses cortical excitability via GABA-B receptor activation.",
    exploreMore: [
      "Excitatory protocols: 5Hz, 10Hz, 20Hz for activation",
      "Inhibitory protocols: 1Hz for suppression",
      "Theta burst (iTBS) uses 50Hz bursts at 5Hz intervals"
    ]
  },
  {
    id: 'neurotransmitter-effects',
    title: 'Neurotransmitter Effects',
    subtitle: 'Multi-System Modulation',
    color: '#10b981', // emerald
    colorClass: 'emerald',
    frontIcon: (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        {/* Central synapse */}
        <ellipse cx="60" cy="50" rx="20" ry="15" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
        {/* Vesicles releasing */}
        <circle cx="45" cy="42" r="5" fill="#8b5cf6" className="animate-pulse" />
        <circle cx="55" cy="38" r="4" fill="#10b981" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
        <circle cx="65" cy="40" r="5" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
        <circle cx="50" cy="50" r="4" fill="#f59e0b" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
        {/* Neurotransmitter paths */}
        <path d="M45 47 Q50 55 60 58 Q70 61 75 58" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        <path d="M55 42 Q58 50 60 55" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        <path d="M65 45 Q67 52 65 58" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        <path d="M50 54 Q55 58 60 60 Q65 62 70 60" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        {/* Labels */}
        <g fontSize="7" fontWeight="bold">
          <text x="30" y="20" fill="#8b5cf6">GLUTAMATE</text>
          <text x="30" y="28" fill="#8b5cf6" fontSize="5" fontWeight="normal">Excitatory</text>
          <text x="70" y="20" fill="#10b981">GABA</text>
          <text x="70" y="28" fill="#10b981" fontSize="5" fontWeight="normal">Inhibitory</text>
          <text x="15" y="60" fill="#06b6d4">5-HT</text>
          <text x="15" y="68" fill="#06b6d4" fontSize="5" fontWeight="normal">Serotonin</text>
          <text x="85" y="60" fill="#f59e0b">DA</text>
          <text x="85" y="68" fill="#f59e0b" fontSize="5" fontWeight="normal">Dopamine</text>
        </g>
        {/* Receptors on post-synaptic */}
        <rect x="52" y="58" width="4" height="6" fill="#8b5cf6" rx="1" />
        <rect x="58" y="58" width="4" height="6" fill="#10b981" rx="1" />
        <rect x="64" y="58" width="4" height="6" fill="#06b6d4" rx="1" />
      </svg>
    ),
    backContent: "TMS modulates multiple neurotransmitter systems: Glutamate (primary excitatory), GABA (primary inhibitory), Serotonin (5-HT1A upregulation), Dopamine (mesolimbic pathway), Norepinephrine (LC activation). Effects are frequency-dependent and cumulative across sessions.",
    exploreMore: [
      "Glutamate is the primary excitatory neurotransmitter in cortex",
      "Dopamine release correlates with mood improvement",
      "Serotonin modulation may enhance antidepressant effects"
    ]
  },
  {
    id: 'network-effects',
    title: 'Network Effects',
    subtitle: 'Thalamo-Cortical Pathways',
    color: '#f59e0b', // amber
    colorClass: 'amber',
    frontIcon: (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        {/* Brain outline */}
        <ellipse cx="60" cy="35" rx="40" ry="28" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        {/* Network nodes */}
        <circle cx="60" cy="25" r="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" />
        <text x="56" y="28" fontSize="6" fill="#f59e0b" fontWeight="bold">DLPFC</text>
        <circle cx="40" cy="35" r="6" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
        <circle cx="80" cy="35" r="6" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        <circle cx="60" cy="50" r="5" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
        <text x="56" y="52" fontSize="5" fill="#06b6d4">Thal</text>
        {/* Network connections */}
        <g stroke="#475569" strokeWidth="1.5" fill="none">
          <path d="M52 30 Q45 32 42 34" />
          <path d="M68 30 Q75 32 78 34" />
          <path d="M60 33 L60 45" />
        </g>
        <g stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" className="animate-pulse">
          <path d="M52 30 Q48 38 55 45" strokeDasharray="2 2" />
          <path d="M68 30 Q72 38 65 45" strokeDasharray="2 2" />
          <path d="M40 38 Q45 45 55 48" strokeDasharray="2 2" />
          <path d="M80 38 Q75 45 65 48" strokeDasharray="2 2" />
        </g>
        {/* Subcortical structures */}
        <g transform="translate(35, 70)">
          <ellipse cx="25" cy="10" rx="20" ry="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          <circle cx="15" cy="10" r="3" fill="#10b981" opacity="0.6" />
          <circle cx="25" cy="10" r="3" fill="#8b5cf6" opacity="0.6" />
          <circle cx="35" cy="10" r="3" fill="#f59e0b" opacity="0.6" />
          <text x="10" y="25" fontSize="5" fill="#64748b">Striatum</text>
        </g>
      </svg>
    ),
    backContent: "Local stimulation triggers distant network effects via thalamo-cortical and cortico-cortical pathways. DLPFC stimulation modulates the default mode network (DMN), salience network, and frontostriatal circuits — the same networks implicated in depression.",
    exploreMore: [
      "Default Mode Network (DMN) shows decreased connectivity in depression",
      "Salience network switching between DMN and CEN is impaired in MDD",
      "fMRI studies show lasting connectivity changes after TMS"
    ]
  },
  {
    id: 'neuroplasticity',
    title: 'Neuroplasticity',
    subtitle: 'LTP / LTD Mechanisms',
    color: '#ec4899', // pink
    colorClass: 'pink',
    frontIcon: (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        {/* Synapse illustration */}
        <g transform="translate(20, 25)">
          {/* Pre-synaptic */}
          <ellipse cx="15" cy="10" rx="12" ry="10" fill="#1e293b" stroke="#ec4899" strokeWidth="2" />
          <circle cx="12" cy="8" r="2" fill="#ec4899" className="animate-pulse" />
          <circle cx="18" cy="12" r="2" fill="#ec4899" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
          {/* Synaptic cleft */}
          <line x1="27" y1="10" x2="33" y2="10" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
          {/* Post-synaptic */}
          <ellipse cx="40" cy="10" rx="12" ry="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
          <ellipse cx="43" cy="10" rx="6" ry="4" fill="#8b5cf6" opacity="0.3" />
          {/* NMDA receptors */}
          <rect x="35" y="5" width="3" height="6" fill="#06b6d4" rx="1" />
          <rect x="40" y="5" width="3" height="6" fill="#06b6d4" rx="1" />
        </g>
        {/* BDNF molecule */}
        <g transform="translate(75, 35)">
          <circle cx="10" cy="10" r="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          <text x="6" y="13" fontSize="6" fill="#10b981" fontWeight="bold">BDNF</text>
        </g>
        {/* LTP arrow going up */}
        <g transform="translate(5, 60)">
          <path d="M5 20 L5 5 L0 10 M5 5 L10 10" stroke="#10b981" strokeWidth="2" fill="none" />
          <text x="0" y="28" fontSize="6" fill="#10b981" fontWeight="bold">LTP</text>
        </g>
        {/* LTD arrow going down */}
        <g transform="translate(20, 60)">
          <path d="M5 5 L5 20 L0 15 M5 20 L10 15" stroke="#f43f5e" strokeWidth="2" fill="none" />
          <text x="0" y="28" fontSize="6" fill="#f43f5e" fontWeight="bold">LTD</text>
        </g>
        {/* Session counter */}
        <g transform="translate(45, 70)">
          <rect x="0" y="0" width="50" height="20" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <text x="5" y="8" fontSize="5" fill="#64748b">Sessions</text>
          <g fill="#10b981">
            <rect x="5" y="12" width="6" height="6" rx="1" className="animate-pulse" />
            <rect x="13" y="12" width="6" height="6" rx="1" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            <rect x="21" y="12" width="6" height="6" rx="1" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
            <rect x="29" y="12" width="6" height="6" rx="1" opacity="0.3" />
            <rect x="37" y="12" width="6" height="6" rx="1" opacity="0.3" />
          </g>
        </g>
        {/* Ca2+ influx arrows */}
        <path d="M55 45 Q50 50 48 55" stroke="#f59e0b" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
        <text x="52" y="42" fontSize="5" fill="#f59e0b">Ca2+</text>
        <defs>
          <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 5 2.5, 0 5" fill="#f59e0b" />
          </marker>
        </defs>
      </svg>
    ),
    backContent: "Repeated TMS sessions induce long-term potentiation (LTP) via NMDA receptor activation and BDNF release. BDNF (Brain-Derived Neurotrophic Factor) is essential for synaptic strengthening. Cumulative sessions over 4-6 weeks produce measurable cortical excitability changes detectable on EEG and fMRI.",
    exploreMore: [
      "BDNF levels increase in serum after successful TMS treatment",
      "NMDA receptor antagonists block TMS-induced plasticity",
      "Theta burst protocols produce similar effects in shorter time"
    ]
  },
  {
    id: 'clinical-mechanisms',
    title: 'Clinical Mechanisms',
    subtitle: 'Region-Specific Treatment',
    color: '#6366f1', // indigo
    colorClass: 'indigo',
    frontIcon: (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        {/* Brain regions */}
        <ellipse cx="60" cy="40" rx="35" ry="30" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        {/* DLPFC - Left */}
        <g className="animate-pulse">
          <ellipse cx="35" cy="25" rx="12" ry="10" fill="#1e293b" stroke="#6366f1" strokeWidth="2.5" />
          <text x="27" y="28" fontSize="5" fill="#6366f1" fontWeight="bold">DLPFC</text>
        </g>
        {/* Amygdala - bilateral */}
        <g className="animate-pulse" style={{ animationDelay: '0.3s' }}>
          <ellipse cx="40" cy="50" rx="6" ry="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
          <text x="32" y="60" fontSize="4" fill="#f43f5e">Amyg</text>
        </g>
        <g className="animate-pulse" style={{ animationDelay: '0.4s' }}>
          <ellipse cx="80" cy="50" rx="6" ry="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
        </g>
        {/* ACC */}
        <g className="animate-pulse" style={{ animationDelay: '0.5s' }}>
          <ellipse cx="60" cy="22" rx="8" ry="5" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
          <text x="55" y="35" fontSize="4" fill="#f59e0b">ACC</text>
        </g>
        {/* Treatment labels */}
        <g transform="translate(0, 75)">
          <rect x="0" y="0" width="38" height="18" rx="3" fill="#1e293b" stroke="#6366f1" strokeWidth="1" />
          <text x="4" y="8" fontSize="5" fill="#6366f1" fontWeight="bold">Depression</text>
          <text x="4" y="15" fontSize="4" fill="#64748b">L-DLPFC 10Hz</text>
        </g>
        <g transform="translate(42, 75)">
          <rect x="0" y="0" width="38" height="18" rx="3" fill="#1e293b" stroke="#f43f5e" strokeWidth="1" />
          <text x="4" y="8" fontSize="5" fill="#f43f5e" fontWeight="bold">PTSD</text>
          <text x="4" y="15" fontSize="4" fill="#64748b">Amygdala reg</text>
        </g>
        <g transform="translate(82, 75)">
          <rect x="0" y="0" width="38" height="18" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
          <text x="4" y="8" fontSize="5" fill="#f59e0b" fontWeight="bold">OCD</text>
          <text x="4" y="15" fontSize="4" fill="#64748b">ACC + dmPFC</text>
        </g>
      </svg>
    ),
    backContent: "Depression: Left DLPFC hyperactivation → normalize via high-frequency rTMS. OCD: hyperactive ACC → inhibitory deep TMS. PTSD: hyperactive amygdala → regulatory stimulation. Each condition has distinct network targets validated by fMRI studies.",
    exploreMore: [
      "FDA cleared for MDD, OCD, and smoking cessation",
      "Investigational for PTSD, bipolar depression, and anxiety",
      "Target selection based on circuit-level dysfunction"
    ]
  }
];

interface CardProps {
  card: ScienceCard;
  index: number;
}

function ScienceCardComponent({ card, index }: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex-shrink-0 w-[280px]">
      {/* Card flip container */}
      <div
        className="relative h-[220px] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        {/* Card inner that flips */}
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="glass-panel h-full rounded-2xl p-4 flex flex-col">
              {/* Color accent bar */}
              <div
                className="h-1 rounded-full mb-3"
                style={{ backgroundColor: card.color }}
              />
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{card.title}</h3>
                  <p className="text-[10px] text-slate-400">{card.subtitle}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={card.color}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              {/* SVG Illustration */}
              <div className="flex-1 flex items-center justify-center">
                {card.frontIcon}
              </div>
              {/* Tap hint */}
              <p className="text-[9px] text-slate-500 text-center mt-1">Tap to flip</p>
            </div>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="glass-panel h-full rounded-2xl p-4 flex flex-col">
              {/* Color accent bar */}
              <div
                className="h-1 rounded-full mb-3"
                style={{ backgroundColor: card.color }}
              />
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-white">{card.title}</h3>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  {card.backContent}
                </p>
              </div>
              {/* Tap to flip back */}
              <p className="text-[9px] text-slate-500 text-center mt-2">Tap to flip back</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explore More expandable section */}
      <div className="mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-300 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Explore More
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1.5 pl-2 border-l border-slate-700">
            {card.exploreMore.map((item, i) => (
              <p key={i} className="text-[9px] text-slate-500 leading-relaxed flex items-start gap-1.5">
                <span style={{ color: card.color }} className="shrink-0">-</span>
                {item}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TMSScienceCards() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white">TMS Science</h2>
          <p className="text-[10px] text-slate-400">Interactive explanations of TMS mechanisms</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">{activeIndex + 1}</span>
          <span className="text-[10px] text-slate-600">/</span>
          <span className="text-[10px] text-slate-500">{scienceCards.length}</span>
        </div>
      </div>

      {/* Horizontal scrollable card deck */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

        {/* Cards container */}
        <div
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollLeft = container.scrollLeft;
            const cardWidth = 284; // 280px + 4px gap
            const newIndex = Math.round(scrollLeft / cardWidth);
            if (newIndex !== activeIndex) {
              setActiveIndex(newIndex);
            }
          }}
        >
          {scienceCards.map((card, index) => (
            <div key={card.id} className="snap-start">
              <ScienceCardComponent card={card} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-2">
        {scienceCards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => {
              setActiveIndex(index);
              const container = document.querySelector('.overflow-x-auto');
              if (container) {
                const cardWidth = 284;
                container.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
              }
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              activeIndex === index
                ? 'bg-violet-500 w-4'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
            style={{
              backgroundColor: activeIndex === index ? card.color : undefined,
            }}
            aria-label={`Go to card ${index + 1}: ${card.title}`}
          />
        ))}
      </div>

      {/* Current card info */}
      <div className="text-center">
        <p className="text-[10px] text-slate-500">
          Showing: <span className="text-slate-300 font-medium">{scienceCards[activeIndex]?.title}</span>
        </p>
      </div>
    </div>
  );
}
