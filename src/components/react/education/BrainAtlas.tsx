'use client';

import { useState, useRef, useCallback } from 'react';
import { useTMS } from '../TMSViewer/TMSContext';
import { protocols } from '../../../data/tmsProtocols';

// ─── Types ───────────────────────────────────────────────────────────────────

type BrainView = 'lateral' | 'medial';
type EvidenceLevel = 'fda' | 'evidence' | 'research';

interface AtlasRegion {
  id: string;
  name: string;
  brodmannArea: string;
  function: string;
  clinicalNote: string;
  tmsIndication: string;
  evidenceLevel: EvidenceLevel;
  coilTarget: 'left-dlpfc' | 'right-dlpfc' | 'motor' | 'other';
  // SVG path for lateral view
  lateralPath: string;
  // SVG path for medial view (may be same or different)
  medialPath: string;
  // Approximate centroid for label placement
  labelX: number;
  labelY: number;
}

// ─── Color Palette ───────────────────────────────────────────────────────────

const EVIDENCE_COLORS: Record<EvidenceLevel, { fill: string; fillHover: string; stroke: string; glow: string }> = {
  fda: {
    fill: 'rgba(16, 185, 129, 0.55)',
    fillHover: 'rgba(16, 185, 129, 0.85)',
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  evidence: {
    fill: 'rgba(139, 92, 246, 0.55)',
    fillHover: 'rgba(139, 92, 246, 0.85)',
    stroke: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  research: {
    fill: 'rgba(245, 158, 11, 0.55)',
    fillHover: 'rgba(245, 158, 11, 0.85)',
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
};

// ─── Atlas Region Data ────────────────────────────────────────────────────────

const ATLAS_REGIONS: AtlasRegion[] = [
  // ── Lateral View ──────────────────────────────────────────────────────────
  {
    id: 'left-dlpfc',
    name: 'Left DLPFC',
    brodmannArea: 'BA 9 / BA 46',
    function: 'Executive function, working memory, emotional regulation, decision-making',
    clinicalNote: 'Primary TMS target for depression. High-frequency stimulation increases mood regulatory network activity.',
    tmsIndication: 'Major Depressive Disorder, Treatment-Resistant Depression, Anxiety',
    evidenceLevel: 'fda',
    coilTarget: 'left-dlpfc',
    lateralPath: 'M 95 55 C 115 42, 142 40, 160 55 C 170 63, 172 78, 168 95 C 162 115, 148 128, 130 133 C 110 137, 88 130, 76 118 C 62 104, 60 82, 68 66 C 74 58, 84 51, 95 55 Z',
    medialPath: '',
    labelX: 118,
    labelY: 82,
  },
  {
    id: 'motor-cortex',
    name: 'Motor Cortex (M1)',
    brodmannArea: 'BA 4',
    function: 'Voluntary motor control, movement planning, motor memory',
    clinicalNote: 'Gold standard for motor threshold determination. Single pulses produce Motor Evoked Potentials (MEPs).',
    tmsIndication: 'Stroke Rehabilitation, Chronic Pain, Movement Disorders',
    evidenceLevel: 'fda',
    coilTarget: 'motor',
    lateralPath: 'M 70 115 C 82 108, 98 108, 110 116 C 118 122, 120 132, 116 144 C 110 158, 94 165, 78 162 C 62 158, 54 145, 56 130 C 58 120, 64 114, 70 115 Z',
    medialPath: '',
    labelX: 88,
    labelY: 138,
  },
  {
    id: 'premotor',
    name: 'Premotor Cortex',
    brodmannArea: 'BA 6',
    function: 'Movement preparation, sensory-guided movement, motor learning',
    clinicalNote: 'Adjacent to M1; involved in motor learning and planning. Can be targeted for motor recovery protocols.',
    tmsIndication: 'Stroke Rehabilitation, Parkinson\'s Disease',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: 'M 66 105 C 76 96, 92 95, 104 103 C 112 110, 114 122, 110 134 C 106 144, 94 150, 80 148 C 66 146, 58 134, 60 120 C 62 110, 64 106, 66 105 Z',
    medialPath: '',
    labelX: 82,
    labelY: 122,
  },
  {
    id: 'somatosensory',
    name: 'Somatosensory Cortex',
    brodmannArea: 'BA 1 / BA 2 / BA 3',
    function: 'Touch, pressure, temperature, body position sense (proprioception)',
    clinicalNote: 'Primary sensory cortex. Can be used for pain processing studies and chronic pain interventions.',
    tmsIndication: 'Chronic Pain, Fibromyalgia, Neuropathic Pain',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: 'M 62 125 C 70 117, 84 118, 96 126 C 106 134, 108 148, 100 160 C 90 172, 70 172, 58 162 C 48 152, 48 138, 54 128 C 58 124, 60 124, 62 125 Z',
    medialPath: '',
    labelX: 74,
    labelY: 148,
  },
  {
    id: 'wernicke',
    name: 'Wernicke\'s Area',
    brodmannArea: 'BA 22 / BA 42',
    function: 'Language comprehension, speech perception, semantic processing',
    clinicalNote: 'Located in posterior superior temporal gyrus. Critical for language understanding.',
    tmsIndication: 'Language Recovery Post-Stroke, Aphasia',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: 'M 148 115 C 162 112, 174 118, 178 130 C 182 142, 176 156, 162 162 C 148 166, 132 160, 126 148 C 120 136, 128 118, 140 114 C 144 113, 146 114, 148 115 Z',
    medialPath: '',
    labelX: 154,
    labelY: 140,
  },
  {
    id: 'broca',
    name: 'Broca\'s Area',
    brodmannArea: 'BA 44 / BA 45',
    function: 'Speech production, grammar, sentence formation, verbal fluency',
    clinicalNote: 'Inferior frontal gyrus. Key target for language production studies and aphasia recovery.',
    tmsIndication: 'Post-Stroke Aphasia, Speech Fluency',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: 'M 140 95 C 154 90, 166 96, 170 110 C 173 122, 168 136, 156 142 C 144 148, 128 144, 122 132 C 116 120, 122 104, 134 98 C 137 96, 139 95, 140 95 Z',
    medialPath: '',
    labelX: 148,
    labelY: 118,
  },
  {
    id: 'ifg',
    name: 'Inferior Frontal Gyrus',
    brodmannArea: 'BA 47 / BA 45',
    function: 'Language processing, sentence comprehension, cognitive control',
    clinicalNote: 'Part of the language network and cognitive control circuits. Overlaps with Broca\'s area.',
    tmsIndication: 'Depression (cognitive symptoms), OCD, Addiction',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: 'M 148 80 C 160 74, 172 80, 174 94 C 176 108, 168 120, 154 124 C 140 128, 126 120, 122 106 C 118 92, 128 80, 142 78 C 145 77, 147 78, 148 80 Z',
    medialPath: '',
    labelX: 150,
    labelY: 98,
  },
  {
    id: 'ofc',
    name: 'Orbitofrontal Cortex',
    brodmannArea: 'BA 11 / BA 47',
    function: 'Reward processing, decision-making, emotion regulation, impulse control',
    clinicalNote: 'Located on the ventral surface; part of reward and emotional circuits. Deep structure.',
    tmsIndication: 'Depression, Addiction, OCD, Eating Disorders',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: 'M 120 128 C 132 124, 148 126, 156 136 C 162 144, 160 156, 148 162 C 134 168, 116 164, 108 154 C 100 144, 104 132, 116 128 C 118 127, 119 127, 120 128 Z',
    medialPath: '',
    labelX: 132,
    labelY: 146,
  },
  {
    id: 'temporal-pole',
    name: 'Temporal Pole',
    brodmannArea: 'BA 38',
    function: 'Emotional processing, social cognition, semantic memory, person recognition',
    clinicalNote: 'Anterior tip of the temporal lobe. Involved in emotional and social processing.',
    tmsIndication: 'Depression, Social Anxiety, PTSD',
    evidenceLevel: 'research',
    coilTarget: 'other',
    lateralPath: 'M 160 138 C 172 136, 182 142, 184 154 C 186 166, 178 178, 164 182 C 150 186, 136 178, 134 164 C 132 150, 142 140, 156 138 C 158 137, 159 137, 160 138 Z',
    medialPath: '',
    labelX: 160,
    labelY: 160,
  },
  // ── Medial View ────────────────────────────────────────────────────────────
  {
    id: 'acc',
    name: 'Anterior Cingulate Cortex',
    brodmannArea: 'BA 24 / BA 32',
    function: 'Error detection, conflict monitoring, emotional processing, pain perception',
    clinicalNote: 'Key node of the cognitive control and salience networks. Hyperactivity linked to rumination.',
    tmsIndication: 'Depression, Chronic Pain, PTSD, ADHD, OCD',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 175 70 C 185 65, 198 68, 202 80 C 205 92, 200 108, 188 116 C 176 124, 162 120, 158 108 C 154 96, 160 80, 172 72 C 174 70, 175 69, 175 70 Z',
    labelX: 180,
    labelY: 92,
  },
  {
    id: 'pcc',
    name: 'Posterior Cingulate Cortex',
    brodmannArea: 'BA 23 / BA 31',
    function: 'Default mode network hub, autobiographical memory, spatial orientation, self-referential thinking',
    clinicalNote: 'Central hub of the DMN. Overactive in depression; targeted to modulate rumination and self-focus.',
    tmsIndication: 'Depression, Schizophrenia, Alzheimer\'s Disease',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 175 118 C 188 116, 200 122, 202 136 C 204 150, 196 162, 182 166 C 168 170, 154 164, 152 150 C 150 136, 158 120, 172 118 C 174 117, 175 117, 175 118 Z',
    labelX: 178,
    labelY: 142,
  },
  {
    id: 'mpfc',
    name: 'Medial Prefrontal Cortex',
    brodmannArea: 'BA 10 / BA 11',
    function: 'Self-referential processing, prospection, reward valuation, social cognition',
    clinicalNote: 'Anterior prefrontal cortex. Central to DMN and social cognition. Critical for emotional regulation.',
    tmsIndication: 'Depression, Social Anxiety, PTSD',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 168 48 C 182 44, 198 50, 200 64 C 202 78, 192 90, 178 92 C 164 94, 150 84, 150 70 C 150 56, 158 48, 168 48 Z',
    labelX: 176,
    labelY: 68,
  },
  {
    id: 'orbitofrontal-medial',
    name: 'Orbitofrontal Cortex',
    brodmannArea: 'BA 11 / BA 47',
    function: 'Reward processing, decision-making, emotion regulation, impulse control',
    clinicalNote: 'Located on the ventral surface of the frontal lobe. Key target for addiction and OCD.',
    tmsIndication: 'OCD, Addiction, Depression, Eating Disorders',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 148 88 C 160 82, 176 86, 180 100 C 183 114, 174 128, 160 132 C 146 136, 132 128, 130 114 C 128 100, 136 90, 148 88 Z',
    labelX: 155,
    labelY: 108,
  },
  {
    id: 'subcallosal-acc',
    name: 'Subcallosal ACC',
    brodmannArea: 'BA 25',
    function: 'Emotional processing, autonomic regulation, reward processing, pain modulation',
    clinicalNote: 'Located below the corpus callosum. Intensive stimulation here (Sustenia) shows promise for TRD.',
    tmsIndication: 'Treatment-Resistant Depression',
    evidenceLevel: 'research',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 162 100 C 174 96, 186 100, 188 112 C 190 124, 182 134, 170 136 C 158 138, 146 130, 146 118 C 146 106, 152 102, 162 100 Z',
    labelX: 168,
    labelY: 116,
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    brodmannArea: 'BA 27 / BA 28',
    function: 'Memory consolidation, spatial navigation, pattern separation, emotional memory',
    clinicalNote: 'Critical for memory. Atrophied in chronic depression. Deep target — dTMS H-coil preferred.',
    tmsIndication: 'Depression (memory symptoms), PTSD, Alzheimer\'s Disease',
    evidenceLevel: 'research',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 130 130 C 142 124, 158 128, 162 142 C 165 156, 155 168, 140 170 C 124 172, 110 162, 110 148 C 110 134, 118 130, 130 130 Z',
    labelX: 138,
    labelY: 150,
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    brodmannArea: 'BA 34 / BA 36',
    function: 'Fear processing, emotional learning, threat detection, reward processing',
    clinicalNote: 'Hyperactive in anxiety and PTSD. Right-sided stimulation can reduce amygdala reactivity.',
    tmsIndication: 'PTSD, Anxiety, Depression, Fear Disorders',
    evidenceLevel: 'research',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 148 126 C 158 120, 170 124, 172 136 C 173 148, 164 158, 152 160 C 140 162, 130 154, 130 142 C 130 130, 138 126, 148 126 Z',
    labelX: 152,
    labelY: 142,
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    brodmannArea: 'BA Pulvinar / MD',
    function: 'Sensory relay, pain processing, sleep/wake regulation, motor coordination',
    clinicalNote: 'Central relay station of the brain. Involved in pain and consciousness. Deep brain target.',
    tmsIndication: 'Chronic Pain, Parkinson\'s Disease, Disorders of Consciousness',
    evidenceLevel: 'research',
    coilTarget: 'other',
    lateralPath: '',
    medialPath: 'M 160 106 C 172 100, 186 106, 188 120 C 190 134, 180 146, 166 148 C 152 150, 140 140, 140 126 C 140 112, 148 106, 160 106 Z',
    labelX: 164,
    labelY: 126,
  },
];

// ─── SVG Brain Outline Paths ──────────────────────────────────────────────────
// Hand-crafted paths approximating a human brain in lateral and medial views

const LATERAL_BRAIN_OUTLINE = `
  M 60 60
  C 80 35, 130 30, 165 50
  C 190 65, 195 90, 188 120
  C 182 150, 160 175, 130 178
  C 100 180, 65 165, 50 138
  C 40 120, 45 90, 55 72
  C 58 66, 60 62, 60 60 Z
`;

const MEDIAL_BRAIN_OUTLINE = `
  M 170 42
  C 188 38, 205 48, 206 68
  C 208 90, 200 115, 188 132
  C 176 148, 158 158, 138 160
  C 118 162, 100 155, 90 140
  C 82 128, 80 110, 85 95
  C 90 80, 105 68, 125 62
  C 145 56, 162 50, 170 42 Z
`;

// ─── Pulse Animation Component ───────────────────────────────────────────────

function PulseRipple({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={12} fill="none" stroke={color} strokeWidth={2} opacity={0.9}>
        <animate attributeName="r" from={6} to={28} dur="0.8s" repeatCount="1" />
        <animate attributeName="opacity" from={0.9} to={0} dur="0.8s" repeatCount="1" />
      </circle>
      <circle cx={cx} cy={cy} r={8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6}>
        <animate attributeName="r" from={4} to={22} dur="0.8s" begin="0.15s" repeatCount="1" />
        <animate attributeName="opacity" from={0.6} to={0} dur="0.8s" begin="0.15s" repeatCount="1" />
      </circle>
    </>
  );
}

// ─── Tooltip Component ───────────────────────────────────────────────────────

interface TooltipState {
  region: AtlasRegion;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
}

function RegionTooltip({ tooltip, view }: { tooltip: TooltipState | null; view: BrainView }) {
  if (!tooltip) return null;
  const { region, pageX, pageY } = tooltip;
  const colors = EVIDENCE_COLORS[region.evidenceLevel];

  const protocolSuggestion = protocols.find(p =>
    region.evidenceLevel === 'fda'
      ? p.evidence === 'Strong'
      : region.evidenceLevel === 'evidence'
      ? p.evidence === 'Moderate' || p.evidence === 'Strong'
      : true
  );

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: Math.min(pageX + 14, window.innerWidth - 320),
        top: Math.max(pageY - 10, 10),
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 w-72 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">{region.name}</h4>
            <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
              style={{ color: colors.stroke, borderColor: colors.stroke, backgroundColor: `${colors.stroke}15` }}>
              {region.brodmannArea}
            </span>
          </div>
          <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: colors.stroke }} />
        </div>

        {/* Function */}
        <p className="text-[10px] text-slate-300 leading-relaxed mb-3">{region.function}</p>

        {/* Clinical Note */}
        <p className="text-[10px] text-slate-400 leading-relaxed mb-3 italic">{region.clinicalNote}</p>

        {/* TMS Indication */}
        <div className="bg-slate-800/60 rounded-xl p-2.5 mb-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">TMS Indication</p>
          <p className="text-[10px] text-slate-300 leading-relaxed">{region.tmsIndication}</p>
        </div>

        {/* Protocol suggestion */}
        {protocolSuggestion && (
          <div className="bg-emerald-900/30 border border-emerald-800/30 rounded-xl p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1">Suggested Protocol</p>
            <p className="text-[10px] text-emerald-400 font-medium">{protocolSuggestion.name}</p>
          </div>
        )}

        {/* Evidence badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: colors.stroke }}>
            {region.evidenceLevel === 'fda' ? 'FDA-Cleared Target' : region.evidenceLevel === 'evidence' ? 'Evidence-Supported' : 'Research / Emerging'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BrainAtlas() {
  const { dispatch } = useTMS();
  const [view, setView] = useState<BrainView>('lateral');
  const [hoveredRegion, setHoveredRegion] = useState<AtlasRegion | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<AtlasRegion | null>(null);
  const [pulse, setPulse] = useState<{ cx: number; cy: number; color: string } | null>(null);
  const [connectToSim, setConnectToSim] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleRegionClick = useCallback((region: AtlasRegion, event: React.MouseEvent) => {
    setSelectedRegion(region);

    // Pulse animation
    const svg = svgRef.current;
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      const colors = EVIDENCE_COLORS[region.evidenceLevel];
      setPulse({ cx: svgP.x, cy: svgP.y, color: colors.stroke });
      setTimeout(() => setPulse(null), 900);
    }

    // Dispatch to TMSContext if connecting to simulation
    if (connectToSim) {
      dispatch({ type: 'SET_COIL_TARGET', target: region.coilTarget });
    }
  }, [connectToSim, dispatch]);

  const handleRegionMouseEnter = useCallback((region: AtlasRegion, event: React.MouseEvent) => {
    setHoveredRegion(region);
    setTooltip({
      region,
      x: event.clientX,
      y: event.clientY,
      pageX: event.clientX,
      pageY: event.clientY,
    });
  }, []);

  const handleRegionMouseMove = useCallback((region: AtlasRegion, event: React.MouseEvent) => {
    setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY, pageX: event.clientX, pageY: event.clientY } : null);
  }, []);

  const handleRegionMouseLeave = useCallback(() => {
    setHoveredRegion(null);
    setTooltip(null);
  }, []);

  const handleFlipView = useCallback(() => {
    setIsFlipping(true);
    setTimeout(() => {
      setView(v => v === 'lateral' ? 'medial' : 'lateral');
      setSelectedRegion(null);
      setHoveredRegion(null);
      setTooltip(null);
      setTimeout(() => setIsFlipping(false), 50);
    }, 200);
  }, []);

  const visibleRegions = ATLAS_REGIONS.filter(r =>
    view === 'lateral' ? r.lateralPath : r.medialPath
  );

  return (
    <div className="relative w-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {/* View Toggle */}
        <div className="inline-flex bg-slate-800/60 rounded-xl p-1 border border-slate-700/30">
          <button
            onClick={() => view !== 'lateral' && handleFlipView()}
            className={`px-4 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              view === 'lateral'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lateral View
          </button>
          <button
            onClick={() => view !== 'medial' && handleFlipView()}
            className={`px-4 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              view === 'medial'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Medial View
          </button>
        </div>

        {/* Connect to simulation */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={connectToSim}
              onChange={e => setConnectToSim(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${connectToSim ? 'bg-violet-600' : 'bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${connectToSim ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
            Connect to TMS Simulation
          </span>
        </label>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EVIDENCE_COLORS.fda.fill, border: `1px solid ${EVIDENCE_COLORS.fda.stroke}` }} />
          <span className="text-[10px] text-slate-400">FDA-Cleared Target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EVIDENCE_COLORS.evidence.fill, border: `1px solid ${EVIDENCE_COLORS.evidence.stroke}` }} />
          <span className="text-[10px] text-slate-400">Evidence-Supported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EVIDENCE_COLORS.research.fill, border: `1px solid ${EVIDENCE_COLORS.research.stroke}` }} />
          <span className="text-[10px] text-slate-400">Research / Emerging</span>
        </div>
      </div>

      {/* SVG Brain Atlas */}
      <div className="relative bg-slate-900/40 rounded-2xl border border-slate-800/50 p-6 overflow-hidden">
        {/* Background grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className={`relative transition-all duration-200 ${isFlipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <svg
            ref={svgRef}
            viewBox="0 0 240 200"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxHeight: '480px' }}
          >
            <defs>
              {/* Brain region glow filter */}
              <filter id="regionGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Drop shadow for brain outline */}
              <filter id="brainShadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
              </filter>

              {/* Pulse glow */}
              <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient for brain fill */}
              <radialGradient id="brainGradient" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#475569" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.5" />
              </radialGradient>
            </defs>

            {/* Brain outline */}
            <path
              d={view === 'lateral' ? LATERAL_BRAIN_OUTLINE : MEDIAL_BRAIN_OUTLINE}
              fill="url(#brainGradient)"
              stroke="#334155"
              strokeWidth={1.5}
              filter="url(#brainShadow)"
            />

            {/* Brain region paths */}
            {visibleRegions.map(region => {
              const colors = EVIDENCE_COLORS[region.evidenceLevel];
              const path = view === 'lateral' ? region.lateralPath : region.medialPath;
              const isHovered = hoveredRegion?.id === region.id;
              const isSelected = selectedRegion?.id === region.id;

              return (
                <g key={region.id}>
                  {/* Hover/select glow */}
                  {(isHovered || isSelected) && (
                    <path
                      d={path}
                      fill="none"
                      stroke={colors.glow}
                      strokeWidth={4}
                      filter="url(#regionGlow)"
                      opacity={0.7}
                    />
                  )}
                  {/* Main region path */}
                  <path
                    d={path}
                    fill={isHovered ? colors.fillHover : colors.fill}
                    stroke={isSelected ? '#ffffff' : colors.stroke}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    className="cursor-pointer transition-all duration-150"
                    onClick={(e) => handleRegionClick(region, e)}
                    onMouseEnter={(e) => handleRegionMouseEnter(region, e)}
                    onMouseMove={(e) => handleRegionMouseMove(region, e)}
                    onMouseLeave={handleRegionMouseLeave}
                  />
                  {/* Micro label */}
                  <text
                    x={region.labelX}
                    y={region.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: '7px',
                      fontWeight: 700,
                      fill: isHovered || isSelected ? '#ffffff' : 'rgba(255,255,255,0.65)',
                      fontFamily: 'inherit',
                      letterSpacing: '-0.02em',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {region.name.split(' ')[0]}
                    {region.name.split(' ').slice(1).map((w, i) => (
                      <tspan key={i} x={region.labelX} dy={i === 0 ? '1em' : '1em'}>
                        {w}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}

            {/* Pulse ripple animation */}
            {pulse && <PulseRipple cx={pulse.cx} cy={pulse.cy} color={pulse.color} />}

            {/* Orientation labels */}
            <text x={10} y={15} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>Anterior</text>
            <text x={10} y={188} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>Posterior</text>
            {view === 'lateral' && (
              <>
                <text x={10} y={10} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>Dorsal</text>
                <text x={210} y={188} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>Ventral</text>
                <text x={215} y={15} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>L</text>
                <text x={15} y={15} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>R</text>
              </>
            )}
            {view === 'medial' && (
              <>
                <text x={215} y={15} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>Medial</text>
                <text x={215} y={188} style={{ fontSize: '7px', fill: '#475569', fontFamily: 'inherit' }}>Medial</text>
              </>
            )}
          </svg>
        </div>

        {/* Selected Region Info Panel */}
        {selectedRegion && (
          <div className="mt-4 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/40 p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: EVIDENCE_COLORS[selectedRegion.evidenceLevel].stroke }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">{selectedRegion.name}</h4>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      color: EVIDENCE_COLORS[selectedRegion.evidenceLevel].stroke,
                      borderColor: EVIDENCE_COLORS[selectedRegion.evidenceLevel].stroke,
                      backgroundColor: `${EVIDENCE_COLORS[selectedRegion.evidenceLevel].stroke}15`,
                    }}>
                    {selectedRegion.brodmannArea}
                  </span>
                  {connectToSim && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 border border-violet-700/30">
                      TMS Simulation Linked
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{selectedRegion.clinicalNote}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    {selectedRegion.evidenceLevel === 'fda' ? 'FDA-Cleared Target' : selectedRegion.evidenceLevel === 'evidence' ? 'Evidence-Supported' : 'Research / Emerging'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <RegionTooltip tooltip={tooltip} view={view} />
    </div>
  );
}
