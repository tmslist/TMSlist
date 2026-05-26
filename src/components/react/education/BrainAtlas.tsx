'use client';

import { useState, useRef, useCallback } from 'react';
import { useTMS } from '../TMSViewer/TMSContext';

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
  // Centroid + radius for organic blob (cleaner than overlapping bezier paths)
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  // Brain views this region is visible in
  views: BrainView[];
}

// Editorial palette evidence colors — terracotta primary, sage secondary, muted olive tertiary.
const EVIDENCE_COLORS: Record<
  EvidenceLevel,
  { fill: string; fillHover: string; stroke: string; glow: string; chipBg: string; chipFg: string; label: string }
> = {
  fda: {
    fill: 'rgba(201,101,74,0.45)',
    fillHover: 'rgba(201,101,74,0.75)',
    stroke: '#C9654A',
    glow: 'rgba(201,101,74,0.45)',
    chipBg: 'rgba(201,101,74,0.10)',
    chipFg: '#9B4A35',
    label: 'FDA-Cleared Target',
  },
  evidence: {
    fill: 'rgba(46,122,143,0.40)',
    fillHover: 'rgba(46,122,143,0.70)',
    stroke: '#2E7A8F',
    glow: 'rgba(46,122,143,0.45)',
    chipBg: 'rgba(46,122,143,0.10)',
    chipFg: '#1E5666',
    label: 'Evidence-Supported',
  },
  research: {
    fill: 'rgba(202,138,4,0.38)',
    fillHover: 'rgba(202,138,4,0.65)',
    stroke: '#CA8A04',
    glow: 'rgba(202,138,4,0.40)',
    chipBg: 'rgba(202,138,4,0.10)',
    chipFg: '#8C5F02',
    label: 'Research / Emerging',
  },
};

// Atlas regions positioned on a 240×200 viewBox.
// Lateral view: right-facing brain, anterior on the right.
// Medial view: midsagittal slice, anterior on the right.
const ATLAS_REGIONS: AtlasRegion[] = [
  // ─── Lateral surface (right-facing brain, anterior=right) ───
  {
    id: 'left-dlpfc',
    name: 'L-DLPFC',
    brodmannArea: 'BA 9 / 46',
    function: 'Executive function, working memory, emotional regulation',
    clinicalNote: 'Primary TMS target for depression. High-frequency rTMS modulates the cognitive control network.',
    tmsIndication: 'Major Depression, TRD, Anxiety',
    evidenceLevel: 'fda',
    coilTarget: 'left-dlpfc',
    cx: 168, cy: 70, rx: 22, ry: 16,
    views: ['lateral'],
  },
  {
    id: 'motor-cortex',
    name: 'Motor (M1)',
    brodmannArea: 'BA 4',
    function: 'Voluntary motor control, movement execution',
    clinicalNote: 'Gold standard for motor-threshold determination. A single pulse produces a Motor Evoked Potential (MEP).',
    tmsIndication: 'Stroke rehab, chronic pain, movement disorders',
    evidenceLevel: 'fda',
    coilTarget: 'motor',
    cx: 132, cy: 52, rx: 18, ry: 14,
    views: ['lateral'],
  },
  {
    id: 'premotor',
    name: 'Premotor',
    brodmannArea: 'BA 6',
    function: 'Movement preparation and motor learning',
    clinicalNote: 'Adjacent to M1. Targeted in motor-recovery and Parkinson\'s protocols.',
    tmsIndication: 'Stroke rehab, Parkinson\'s',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 148, cy: 56, rx: 14, ry: 12,
    views: ['lateral'],
  },
  {
    id: 'somatosensory',
    name: 'Somatosensory',
    brodmannArea: 'BA 1/2/3',
    function: 'Touch, pressure, proprioception',
    clinicalNote: 'Primary sensory cortex. Stimulated for chronic pain and fibromyalgia.',
    tmsIndication: 'Chronic pain, fibromyalgia',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 116, cy: 56, rx: 16, ry: 12,
    views: ['lateral'],
  },
  {
    id: 'broca',
    name: "Broca's",
    brodmannArea: 'BA 44/45',
    function: 'Speech production, grammar, verbal fluency',
    clinicalNote: 'Inferior frontal gyrus. Targeted for post-stroke aphasia and speech fluency.',
    tmsIndication: 'Aphasia, speech recovery',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 190, cy: 100, rx: 18, ry: 12,
    views: ['lateral'],
  },
  {
    id: 'wernicke',
    name: "Wernicke's",
    brodmannArea: 'BA 22 / 42',
    function: 'Language comprehension, speech perception',
    clinicalNote: 'Posterior superior temporal gyrus — critical for understanding language.',
    tmsIndication: 'Language recovery post-stroke',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 80, cy: 110, rx: 18, ry: 14,
    views: ['lateral'],
  },
  {
    id: 'temporal-pole',
    name: 'Temporal Pole',
    brodmannArea: 'BA 38',
    function: 'Emotional processing, social cognition, semantic memory',
    clinicalNote: 'Anterior temporal lobe. Studied for social anxiety and PTSD.',
    tmsIndication: 'Depression, social anxiety, PTSD',
    evidenceLevel: 'research',
    coilTarget: 'other',
    cx: 175, cy: 132, rx: 16, ry: 12,
    views: ['lateral'],
  },
  {
    id: 'ofc-lateral',
    name: 'Orbitofrontal',
    brodmannArea: 'BA 11 / 47',
    function: 'Reward processing, decision-making, impulse control',
    clinicalNote: 'Ventral surface of the frontal lobe. Targeted in addiction, OCD, and eating disorders.',
    tmsIndication: 'OCD, addiction, depression',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 200, cy: 130, rx: 14, ry: 10,
    views: ['lateral'],
  },
  // ─── Medial surface (midsagittal, anterior=right) ───
  {
    id: 'mpfc',
    name: 'mPFC',
    brodmannArea: 'BA 10 / 11',
    function: 'Self-referential processing, prospection, social cognition',
    clinicalNote: 'Hub of the default-mode network. Key node for emotional regulation.',
    tmsIndication: 'Depression, social anxiety, PTSD',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 180, cy: 60, rx: 18, ry: 14,
    views: ['medial'],
  },
  {
    id: 'acc',
    name: 'ACC',
    brodmannArea: 'BA 24 / 32',
    function: 'Conflict monitoring, error detection, pain perception',
    clinicalNote: 'Salience-network hub. Hyperactivity is linked to rumination in depression.',
    tmsIndication: 'Depression, chronic pain, OCD, ADHD',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 145, cy: 75, rx: 17, ry: 13,
    views: ['medial'],
  },
  {
    id: 'pcc',
    name: 'PCC',
    brodmannArea: 'BA 23 / 31',
    function: 'DMN hub, autobiographical memory, self-reference',
    clinicalNote: 'Central node of the default-mode network. Modulated to reduce rumination.',
    tmsIndication: 'Depression, schizophrenia, Alzheimer\'s',
    evidenceLevel: 'evidence',
    coilTarget: 'other',
    cx: 90, cy: 80, rx: 16, ry: 13,
    views: ['medial'],
  },
  {
    id: 'subcallosal-acc',
    name: 'Subcallosal ACC',
    brodmannArea: 'BA 25',
    function: 'Emotional + autonomic regulation, reward, pain modulation',
    clinicalNote: 'Below the corpus callosum. SAINT-style accelerated stimulation here shows promise for TRD.',
    tmsIndication: 'Treatment-resistant depression',
    evidenceLevel: 'research',
    coilTarget: 'other',
    cx: 158, cy: 105, rx: 14, ry: 10,
    views: ['medial'],
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    brodmannArea: 'Pulvinar / MD',
    function: 'Sensory relay, pain processing, sleep / wake regulation',
    clinicalNote: 'Central relay station. Deep target — typically reached only with H-coil dTMS.',
    tmsIndication: 'Chronic pain, Parkinson\'s, DOC',
    evidenceLevel: 'research',
    coilTarget: 'other',
    cx: 130, cy: 105, rx: 14, ry: 11,
    views: ['medial'],
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    brodmannArea: 'BA 27 / 28',
    function: 'Memory consolidation, spatial navigation',
    clinicalNote: 'Atrophied in chronic depression. Deep — H-coil preferred.',
    tmsIndication: 'Depression (memory), PTSD, Alzheimer\'s',
    evidenceLevel: 'research',
    coilTarget: 'other',
    cx: 100, cy: 130, rx: 17, ry: 11,
    views: ['medial'],
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    brodmannArea: 'BA 34 / 36',
    function: 'Fear processing, threat detection, emotional learning',
    clinicalNote: 'Hyperactive in anxiety and PTSD. Right-sided modulation can dampen reactivity.',
    tmsIndication: 'PTSD, anxiety, depression',
    evidenceLevel: 'research',
    coilTarget: 'other',
    cx: 142, cy: 130, rx: 13, ry: 10,
    views: ['medial'],
  },
];

// Brain outlines — clean ink-stroked silhouettes on a parchment field.
const LATERAL_BRAIN_OUTLINE = `
  M 50 80
  C 55 50, 80 32, 130 30
  C 175 30, 205 45, 215 75
  C 220 100, 215 130, 195 150
  C 175 168, 145 170, 115 165
  C 85 158, 60 140, 50 115
  C 45 105, 47 92, 50 80 Z
`;

const MEDIAL_BRAIN_OUTLINE = `
  M 40 100
  C 45 70, 70 45, 110 38
  C 155 32, 195 42, 210 65
  C 220 85, 218 115, 200 138
  C 180 158, 150 165, 120 162
  C 90 158, 60 145, 45 125
  C 38 115, 38 108, 40 100 Z
`;

// Sulcus details for visual richness on lateral view.
const LATERAL_SULCI = `
  M 80 70 C 100 75, 120 78, 145 72
  M 95 100 C 115 102, 140 100, 165 95
  M 70 130 C 95 132, 130 135, 175 128
`;

const MEDIAL_SULCI = `
  M 70 75 C 100 78, 140 82, 195 78
  M 60 110 C 100 112, 150 115, 200 110
`;

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

interface TooltipState {
  region: AtlasRegion;
  pageX: number;
  pageY: number;
}

function RegionTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;
  const { region, pageX, pageY } = tooltip;
  const colors = EVIDENCE_COLORS[region.evidenceLevel];

  const left = typeof window !== 'undefined' ? Math.min(pageX + 14, window.innerWidth - 320) : pageX + 14;
  const top = Math.max(pageY - 10, 10);

  return (
    <div className="fixed z-50 pointer-events-none" style={{ left, top }}>
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 16,
          width: 288,
          boxShadow: '0 12px 40px -8px rgba(10,22,40,0.18)',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0">
            <h4 className="serif" style={{ fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}>
              {region.name}
            </h4>
            <span
              style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                padding: '2px 8px',
                borderRadius: 9999,
                color: colors.chipFg,
                background: colors.chipBg,
                border: `1px solid ${colors.stroke}33`,
              }}
            >
              {region.brodmannArea}
            </span>
          </div>
          <span
            className="shrink-0"
            style={{ width: 8, height: 8, borderRadius: '50%', background: colors.stroke, marginTop: 6 }}
          />
        </div>

        <p style={{ fontSize: 11, color: 'var(--ink)', lineHeight: 1.55, margin: '0 0 8px' }}>{region.function}</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 10px', fontStyle: 'italic' }}>
          {region.clinicalNote}
        </p>

        <div style={{ background: 'var(--paper2)', borderRadius: 10, padding: 10 }}>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            TMS Indication
          </p>
          <p style={{ fontSize: 11, color: 'var(--ink)', marginTop: 2, lineHeight: 1.45 }}>{region.tmsIndication}</p>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.stroke }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: colors.chipFg,
            }}
          >
            {colors.label}
          </span>
        </div>
      </div>
    </div>
  );
}

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

  const handleRegionClick = useCallback(
    (region: AtlasRegion, event: React.MouseEvent) => {
      setSelectedRegion(region);
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
      if (connectToSim) {
        dispatch({ type: 'SET_COIL_TARGET', target: region.coilTarget });
      }
    },
    [connectToSim, dispatch]
  );

  const handleRegionMouseEnter = useCallback((region: AtlasRegion, event: React.MouseEvent) => {
    setHoveredRegion(region);
    setTooltip({ region, pageX: event.clientX, pageY: event.clientY });
  }, []);

  const handleRegionMouseMove = useCallback((_region: AtlasRegion, event: React.MouseEvent) => {
    setTooltip(prev => (prev ? { ...prev, pageX: event.clientX, pageY: event.clientY } : null));
  }, []);

  const handleRegionMouseLeave = useCallback(() => {
    setHoveredRegion(null);
    setTooltip(null);
  }, []);

  const handleFlipView = useCallback(() => {
    setIsFlipping(true);
    setTimeout(() => {
      setView(v => (v === 'lateral' ? 'medial' : 'lateral'));
      setSelectedRegion(null);
      setHoveredRegion(null);
      setTooltip(null);
      setTimeout(() => setIsFlipping(false), 50);
    }, 200);
  }, []);

  const visibleRegions = ATLAS_REGIONS.filter(r => r.views.includes(view));
  const sulciPath = view === 'lateral' ? LATERAL_SULCI : MEDIAL_SULCI;
  const brainPath = view === 'lateral' ? LATERAL_BRAIN_OUTLINE : MEDIAL_BRAIN_OUTLINE;

  return (
    <div className="relative w-full">
      {/* Controls bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div
          className="inline-flex p-1"
          style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 14 }}
        >
          {(['lateral', 'medial'] as BrainView[]).map(v => (
            <button
              key={v}
              onClick={() => view !== v && handleFlipView()}
              className="px-4 py-2 rounded-[10px] transition-all"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: view === v ? 'var(--ink)' : 'transparent',
                color: view === v ? '#FBFAF7' : 'var(--muted)',
                boxShadow: view === v ? '0 1px 2px rgba(10,22,40,0.20)' : 'none',
              }}
              aria-pressed={view === v}
            >
              {v === 'lateral' ? 'Lateral View' : 'Medial View'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={connectToSim}
              onChange={e => setConnectToSim(e.target.checked)}
              className="sr-only"
            />
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 9999,
                background: connectToSim ? 'var(--warm)' : 'var(--line)',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#FBFAF7',
                  marginTop: 3,
                  marginLeft: connectToSim ? 21 : 3,
                  boxShadow: '0 1px 3px rgba(10,22,40,0.25)',
                  transition: 'margin-left 0.15s ease',
                }}
              />
            </div>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--ink)',
            }}
          >
            Connect to TMS Simulator
          </span>
        </label>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {(['fda', 'evidence', 'research'] as EvidenceLevel[]).map(lvl => {
          const c = EVIDENCE_COLORS[lvl];
          return (
            <div key={lvl} className="flex items-center gap-1.5">
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: c.fill,
                  border: `1px solid ${c.stroke}`,
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{c.label}</span>
            </div>
          );
        })}
      </div>

      {/* SVG canvas */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(201,101,74,0.05), transparent 60%), var(--paper2)',
          border: '1px solid var(--line)',
          borderRadius: 20,
          padding: 24,
        }}
      >
        {/* Background dot grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.45 }}>
          <defs>
            <pattern id="brainGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill="rgba(10,22,40,0.10)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#brainGrid)" />
        </svg>

        <div className={`relative transition-all duration-200 ${isFlipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <svg
            ref={svgRef}
            viewBox="0 0 240 200"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxHeight: 480 }}
          >
            <defs>
              <filter id="regionGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="brainFill" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FBFAF7" />
                <stop offset="100%" stopColor="#F0EBDF" />
              </radialGradient>
            </defs>

            {/* Brain silhouette — soft fill, ink stroke */}
            <path
              d={brainPath}
              fill="url(#brainFill)"
              stroke="var(--ink)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />

            {/* Sulci — subtle ink hairlines */}
            <path d={sulciPath} fill="none" stroke="rgba(10,22,40,0.22)" strokeWidth={0.7} strokeLinecap="round" />

            {/* Region blobs */}
            {visibleRegions.map(region => {
              const colors = EVIDENCE_COLORS[region.evidenceLevel];
              const isHovered = hoveredRegion?.id === region.id;
              const isSelected = selectedRegion?.id === region.id;
              return (
                <g key={region.id}>
                  {(isHovered || isSelected) && (
                    <ellipse
                      cx={region.cx}
                      cy={region.cy}
                      rx={region.rx + 2}
                      ry={region.ry + 2}
                      fill="none"
                      stroke={colors.glow}
                      strokeWidth={4}
                      filter="url(#regionGlow)"
                      opacity={0.7}
                    />
                  )}
                  <ellipse
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    fill={isHovered ? colors.fillHover : colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? 1.6 : 1}
                    className="cursor-pointer transition-all duration-150"
                    onClick={e => handleRegionClick(region, e)}
                    onMouseEnter={e => handleRegionMouseEnter(region, e)}
                    onMouseMove={e => handleRegionMouseMove(region, e)}
                    onMouseLeave={handleRegionMouseLeave}
                  />
                  <text
                    x={region.cx}
                    y={region.cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: 6.5,
                      fontWeight: 700,
                      fill: 'var(--ink)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {region.name}
                  </text>
                </g>
              );
            })}

            {pulse && <PulseRipple cx={pulse.cx} cy={pulse.cy} color={pulse.color} />}

            {/* Orientation labels */}
            <g style={{ fontSize: 7, fontFamily: "'Plus Jakarta Sans', sans-serif", fill: 'rgba(10,22,40,0.45)' }}>
              <text x={228} y={14} textAnchor="end">Anterior</text>
              <text x={12} y={14}>Posterior</text>
              {view === 'lateral' && (
                <>
                  <text x={120} y={194} textAnchor="middle">Ventral</text>
                  <text x={120} y={10} textAnchor="middle">Dorsal</text>
                </>
              )}
              {view === 'medial' && (
                <>
                  <text x={120} y={194} textAnchor="middle">Inferior</text>
                  <text x={120} y={10} textAnchor="middle">Superior</text>
                </>
              )}
            </g>
          </svg>
        </div>

        {/* Selected region info panel */}
        {selectedRegion && (
          <div
            className="mt-4"
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 16,
              boxShadow: '0 4px 16px -8px rgba(10,22,40,0.12)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 mt-1.5"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: EVIDENCE_COLORS[selectedRegion.evidenceLevel].stroke,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
                    {selectedRegion.name}
                  </h4>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                      padding: '3px 8px',
                      borderRadius: 9999,
                      color: EVIDENCE_COLORS[selectedRegion.evidenceLevel].chipFg,
                      background: EVIDENCE_COLORS[selectedRegion.evidenceLevel].chipBg,
                      border: `1px solid ${EVIDENCE_COLORS[selectedRegion.evidenceLevel].stroke}33`,
                    }}
                  >
                    {selectedRegion.brodmannArea}
                  </span>
                  {connectToSim && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 9999,
                        background: 'rgba(201,101,74,0.10)',
                        color: '#9B4A35',
                        border: '1px solid rgba(201,101,74,0.30)',
                      }}
                    >
                      Sim linked
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink)', marginTop: 6, lineHeight: 1.55 }}>
                  {selectedRegion.clinicalNote}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: 8,
                    color: EVIDENCE_COLORS[selectedRegion.evidenceLevel].chipFg,
                  }}
                >
                  {EVIDENCE_COLORS[selectedRegion.evidenceLevel].label}
                </p>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1L13 13M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <RegionTooltip tooltip={tooltip} />
    </div>
  );
}
