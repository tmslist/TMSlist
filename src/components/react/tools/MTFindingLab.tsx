'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BoltIcon, ChartIcon, CheckCircleIcon } from '../Icons';

type Phase = 'position' | 'threshold' | 'amplitude' | 'complete';

interface MotorPoint {
  x: number; // normalized 0-1 within brain cross-section
  y: number;
  label: string;
  area: string;
}

// Anatomical motor cortex map (M1 hand area relative positions on lateral brain cross-section)
const MOTOR_MAP: MotorPoint[] = [
  { x: 0.20, y: 0.38, label: 'Thumb/Fingers', area: 'M1 - Hand' },
  { x: 0.25, y: 0.42, label: 'Wrist', area: 'M1 - Upper limb' },
  { x: 0.30, y: 0.48, label: 'Elbow', area: 'M1 - Upper limb' },
  { x: 0.18, y: 0.50, label: 'Shoulder', area: 'M1 - Shoulder' },
  { x: 0.22, y: 0.55, label: 'Trunk', area: 'M1 - Trunk' },
  { x: 0.35, y: 0.40, label: 'Face/ jaw', area: 'M1 - Face' },
  { x: 0.40, y: 0.35, label: 'Eyebrow', area: 'M1 - Face' },
];

// Brain cross-section SVG path (simplified lateral view)
const BRAIN_PATH = "M 0.50 0.05 C 0.80 0.05 0.95 0.25 0.95 0.50 C 0.95 0.75 0.85 0.90 0.60 0.95 C 0.35 1.00 0.10 0.85 0.05 0.55 C 0.02 0.30 0.20 0.05 0.50 0.05 Z";

function generateEMGPoint(t: number, intensity: number, threshold: number, position: { x: number; y: number }, target: { x: number; y: number }, hasMEP: boolean): number {
  // Noise floor
  const noise = (Math.random() - 0.5) * 8;

  if (!hasMEP) return noise;

  // Distance from coil to target (closer = stronger signal)
  const dist = Math.sqrt((position.x - target.x) ** 2 + (position.y - target.y) ** 2);
  const proximityBonus = Math.max(0, 1 - dist * 2) * 40;

  // Intensity factor (below threshold = weak signal)
  const intensityFactor = Math.max(0, (intensity - threshold + 50) / 50);

  // MEP waveform: sharp positive peak then negative trough (MEP shape)
  const phase = (t % 0.15) / 0.15; // 150ms MEP window
  let mep = 0;

  if (phase < 0.25) {
    // Rising phase
    mep = Math.sin(phase / 0.25 * Math.PI) * 20 * intensityFactor;
  } else if (phase < 0.5) {
    // Positive peak
    mep = 35 * intensityFactor;
  } else if (phase < 0.8) {
    // Negative trough
    mep = -20 * intensityFactor * (1 - (phase - 0.5) / 0.3);
  } else {
    // Recovery
    mep = -5 * intensityFactor * (1 - (phase - 0.8) / 0.2);
  }

  return noise + mep + proximityBonus * intensityFactor;
}

function generateEMGWaveform(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  intensity: number,
  threshold: number,
  coilPos: { x: number; y: number },
  target: { x: number; y: number },
  hasMEP: boolean,
  time: number,
  showMarkers: boolean
) {
  const width = canvas.width;
  const height = canvas.height;
  const signalRange = 80; // ±80 µV display range

  ctx.clearRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;

  // Zero line
  const zeroY = height / 2;
  ctx.beginPath();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.moveTo(0, zeroY);
  ctx.lineTo(width, zeroY);
  ctx.stroke();

  // Horizontal grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 4]);
  for (let v = -signalRange; v <= signalRange; v += 20) {
    const y = zeroY - (v / signalRange) * (height / 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // MEP threshold lines
  if (showMarkers) {
    // Suprathreshold line
    const supY = zeroY - (50 / signalRange) * (height / 2);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, supY);
    ctx.lineTo(width, supY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#06b6d4';
    ctx.font = '10px monospace';
    ctx.fillText('50µV threshold', width - 100, supY - 4);

    // RMT line
    const rmtY = zeroY - (100 / signalRange) * (height / 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, rmtY);
    ctx.lineTo(width, rmtY);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('RMT (100µV)', width - 90, rmtY - 4);
  }

  // Draw waveform
  const points: { x: number; y: number; v: number }[] = [];
  const windowMs = 150; // display 150ms window
  const pixelPerMs = width / windowMs;

  for (let px = 0; px < width; px++) {
    const t = (px / pixelPerMs / 1000) + time;
    const v = generateEMGPoint(t, intensity, threshold, coilPos, target, hasMEP);
    const y = zeroY - (v / signalRange) * (height / 2);
    points.push({ x: px, y, v });
  }

  // Filled area
  ctx.beginPath();
  ctx.moveTo(points[0].x, zeroY);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, zeroY);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
  grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.25)');
  grad.addColorStop(1, 'rgba(34, 211, 238, 0.15)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Positive peak marker
  if (hasMEP && intensity > threshold) {
    const peaks = points.filter(p => p.v > 40);
    if (peaks.length > 0) {
      const mid = peaks[Math.floor(peaks.length / 2)];
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(mid.x, zeroY);
      ctx.lineTo(mid.x, mid.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${Math.round(mid.v)}µV`, mid.x + 4, mid.y - 6);
    }
  }

  // Labels
  ctx.fillStyle = '#64748b';
  ctx.font = '10px monospace';
  ctx.fillText(`+${signalRange}µV`, 4, 12);
  ctx.fillText(`-${signalRange}µV`, 4, height - 6);
  ctx.fillText(`0µV`, 4, zeroY - 4);
}

export default function MTFindingLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('position');
  const [intensity, setIntensity] = useState(30); // % of max output
  const [selectedTarget, setSelectedTarget] = useState<MotorPoint | null>(null);
  const [coilPos, setCoilPos] = useState({ x: 0.3, y: 0.45 }); // normalized
  const [foundRMT, setFoundRMT] = useState<number | null>(null);
  const [foundAMT, setFoundAMT] = useState<number | null>(null);
  const [rmtStep, setRmtStep] = useState<'searching' | 'motorfound' | 'threshold' | 'confirmed'>('searching');
  const [trialCount, setTrialCount] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const [lastResponse, setLastResponse] = useState<'none' | 'twitch' | 'strong'>('none');

  const svgSize = 300;
  const svgPad = 20;
  const brainW = svgSize - svgPad * 2;
  const brainH = svgSize - svgPad * 2;

  const toSvgX = (v: number) => svgPad + v * brainW;
  const toSvgY = (v: number) => svgPad + v * brainH;

  const svgToNorm = (px: number, py: number) => ({
    x: (px - svgPad) / brainW,
    y: (py - svgPad) / brainH,
  });

  // Compute actual MT based on position proximity to motor hotspot
  const getComputedMT = useCallback(() => {
    if (!selectedTarget) return 90; // no target = approximate threshold
    const dx = Math.abs(coilPos.x - selectedTarget.x);
    const dy = Math.abs(coilPos.y - selectedTarget.y);
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Closer = lower MT needed
    const baseMT = 45;
    const distFactor = Math.min(dist * 80, 45);
    return Math.round(baseMT + distFactor);
  }, [coilPos, selectedTarget]);

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (phase !== 'position') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const norm = svgToNorm(px, py);

    // Check if within brain ellipse
    const cx = 0.5, cy = 0.5;
    const rx = 0.42, ry = 0.38;
    const insideBrain = ((norm.x - cx) / rx) ** 2 + ((norm.y - cy) / ry) ** 2 <= 1;

    if (insideBrain) {
      setCoilPos(norm);
      // Find nearest motor point
      let nearest = MOTOR_MAP[0];
      let minDist = Infinity;
      MOTOR_MAP.forEach(mp => {
        const d = Math.sqrt((mp.x - norm.x) ** 2 + (mp.y - norm.y) ** 2);
        if (d < minDist) { minDist = d; nearest = mp; }
      });
      if (minDist < 0.15) {
        setSelectedTarget(nearest);
      }
    }
  };

  const firePulse = () => {
    const computedMT = getComputedMT();
    const intensityEquivalent = intensity * 1.3; // convert 30-100% to approximate MT%
    const hasMEP = intensityEquivalent >= computedMT - 5;
    const isStrong = intensityEquivalent >= computedMT + 5;

    setPulseCount(p => p + 1);
    setTrialCount(t => t + 1);

    if (phase === 'threshold') {
      if (isStrong) {
        setLastResponse('strong');
        setRmtStep('threshold');
      } else if (hasMEP) {
        setLastResponse('twitch');
        setRmtStep('threshold');
      } else {
        setLastResponse('none');
      }
    }
  };

  const confirmRMT = () => {
    const computedMT = getComputedMT();
    setFoundRMT(computedMT);
    setRmtStep('confirmed');
    setPhase('amplitude');
  };

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const animate = () => {
      const ctx2 = canvas.getContext('2d');
      if (!ctx2) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx2.scale(dpr, dpr);

      const computedMT = getComputedMT();
      const intensityEquiv = intensity * 1.3;

      generateEMGWaveform(
        canvas,
        ctx2,
        intensityEquiv,
        computedMT,
        coilPos,
        selectedTarget || { x: 0.5, y: 0.5 },
        phase !== 'position',
        timeRef.current,
        phase === 'amplitude' || phase === 'complete'
      );

      timeRef.current += 0.016;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, intensity, coilPos, selectedTarget, getComputedMT]);

  const computedMT = getComputedMT();
  const intensityEquiv = Math.round(intensity * 1.3);

  return (
    <div className="space-y-8">
      {/* Phase progress */}
      <div className="flex items-center gap-2">
        {(['position', 'threshold', 'amplitude', 'complete'] as Phase[]).map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <button
              onClick={() => { if (p === 'complete' || (p === 'threshold' && foundRMT)) setPhase(p); }}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                phase === p
                  ? p === 'complete' ? 'bg-emerald-500 text-white' : 'bg-cyan-600 text-white'
                  : ['threshold', 'amplitude', 'complete'].includes(phase) || p === 'complete' && foundRMT
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {phase === p && i < 3 ? [<BoltIcon key="b" className="w-4 h-4" />, <ChartIcon key="c" className="w-4 h-4" />, <CheckCircleIcon key="cc" className="w-4 h-4" />][i] : i + 1}
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {['Find Spot', 'Find MT', 'Amplitude', 'Done'][i]}
            </span>
            {i < 3 && <div className="w-6 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Main layout: SVG brain + EMG canvas side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Brain SVG */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">
              {phase === 'position' ? 'Step 1: Find Motor Hotspot' : 'Coil Position'}
            </h3>
            {selectedTarget && (
              <span className="text-xs font-semibold px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full">
                Target: {selectedTarget.label}
              </span>
            )}
          </div>

          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className={`w-full rounded-2xl border ${selectedTarget ? 'border-cyan-300' : 'border-slate-200'} bg-slate-50 cursor-crosshair`}
            onClick={handleSVGClick}
          >
            {/* Brain outline */}
            <ellipse
              cx={toSvgX(0.5)} cy={toSvgY(0.5)}
              rx={brainW * 0.42} ry={brainH * 0.38}
              fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"
            />

            {/* Motor cortex zones (colored regions) */}
            {MOTOR_MAP.map(mp => (
              <g key={mp.label}>
                <circle
                  cx={toSvgX(mp.x)} cy={toSvgY(mp.y)}
                  r={mp === selectedTarget ? 12 : 8}
                  fill={mp === selectedTarget ? '#06b6d4' : '#cbd5e1'}
                  opacity={mp === selectedTarget ? 0.8 : 0.4}
                  stroke={mp === selectedTarget ? '#0891b2' : '#94a3b8'}
                  strokeWidth="1.5"
                />
                <text
                  x={toSvgX(mp.x)} y={toSvgY(mp.y) + 16}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {mp.label}
                </text>
              </g>
            ))}

            {/* Coil indicator */}
            {phase !== 'position' && (
              <g>
                <circle
                  cx={toSvgX(coilPos.x)} cy={toSvgY(coilPos.y)}
                  r="16" fill="#7c3aed" opacity="0.3"
                />
                <path
                  d="M12 2L4 14h6l-1 8 8-10h-6l1-8z"
                  fill="#7c3aed"
                  transform={`translate(${toSvgX(coilPos.x) - 12}, ${toSvgY(coilPos.y) - 12}) scale(1)`}
                />
              </g>
            )}

            {/* Labels */}
            <text x={toSvgX(0.5)} y={toSvgY(0.1)} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">FRONTAL</text>
            <text x={toSvgX(0.05)} y={toSvgY(0.5)} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600" transform={`rotate(-90, ${toSvgX(0.05)}, ${toSvgY(0.5)})`}>TEMPORAL</text>
            <text x={toSvgX(0.9)} y={toSvgY(0.5)} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600" transform={`rotate(90, ${toSvgX(0.9)}, ${toSvgY(0.5)})`}>OCCIPITAL</text>
            <text x={toSvgX(0.5)} y={toSvgY(0.93)} textAnchor="middle" fontSize="9" fill="#94a3b2" fontWeight="600">MOTOR CORTEX</text>
          </svg>

          {/* Instructions */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            {phase === 'position' && (
              <>
                <p className="text-sm text-slate-600">
                  Click on the brain to place the coil over the motor cortex. Target the <strong>Thumb/Fingers</strong> area for standard MT measurement.
                </p>
                <button
                  onClick={() => setPhase('threshold')}
                  disabled={!selectedTarget}
                  className="mt-3 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Continue to MT Finding →
                </button>
              </>
            )}
            {phase === 'threshold' && (
              <p className="text-sm text-slate-600">
                Coil is over <strong>{selectedTarget?.label || 'motor cortex'}</strong>. Increase intensity and fire pulses to find when thumb twitches.
              </p>
            )}
          </div>
        </div>

        {/* Right: EMG Canvas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Live EMG Signal</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className={`flex items-center gap-1 ${phase !== 'position' ? 'text-emerald-400' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${phase !== 'position' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                {phase === 'position' ? 'EMG idle' : 'Acquiring'}
              </span>
              {pulseCount > 0 && (
                <span className="text-slate-400">{pulseCount} pulses fired</span>
              )}
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full rounded-xl border border-slate-700 bg-slate-900"
            style={{ height: '240px' }}
          />

          {/* Intensity control */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stimulator Output</span>
              <span className="text-2xl font-bold text-cyan-400">{intensity}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              value={intensity}
              onChange={e => setIntensity(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>20%</span>
              <span>~{intensityEquiv}% MT</span>
              <span>100%</span>
            </div>

            {phase === 'threshold' && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={firePulse}
                  className="flex-1 px-6 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30 text-sm flex items-center justify-center gap-2"
                >
                  <BoltIcon className="w-5 h-5" /> Fire Pulse
                </button>
                {lastResponse !== 'none' && (
                  <button
                    onClick={confirmRMT}
                    className="px-6 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors text-sm"
                  >
                    Confirm MT
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Response indicator */}
          {phase === 'threshold' && (
            <div className={`rounded-xl p-4 border transition-all ${
              lastResponse === 'strong' ? 'bg-emerald-50 border-emerald-200' :
              lastResponse === 'twitch' ? 'bg-amber-50 border-amber-200' :
              'bg-slate-50 border-slate-100'
            }`}>
              {lastResponse === 'strong' && (
                <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 flex-shrink-0 text-emerald-500" /> Strong motor response — clear MEP detected at {intensityEquiv}% MT equivalent. Reduce slightly to find true threshold.</p>
              )}
              {lastResponse === 'twitch' && (
                <p className="text-sm text-amber-700 font-semibold flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 flex-shrink-0 text-amber-500" /> Small twitch — close to threshold. Try increasing intensity by 5% to confirm.</p>
              )}
              {lastResponse === 'none' && (
                <p className="text-sm text-slate-500">No response at {intensityEquiv}% MT. Increase intensity or adjust coil position.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {foundRMT && (
        <div className="bg-slate-950 rounded-2xl p-8">
          <div className="text-center mb-6">
            <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Motor Threshold Found</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Resting MT (RMT)</p>
              <p className="text-4xl font-bold text-cyan-400 mt-1">{foundRMT}%</p>
              <p className="text-xs text-slate-400 mt-1">of max output</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Treatment Intensity</p>
              <p className="text-4xl font-bold text-violet-400 mt-1">{Math.round(foundRMT * 1.2)}%</p>
              <p className="text-xs text-slate-400 mt-1">120% MT (standard)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Pulses Fired</p>
              <p className="text-4xl font-bold text-amber-400 mt-1">{trialCount}</p>
              <p className="text-xs text-slate-400 mt-1">to determine MT</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Target Area</p>
              <p className="text-lg font-bold text-white mt-1">{selectedTarget?.label || 'M1 Hand'}</p>
              <p className="text-xs text-slate-400 mt-1">{selectedTarget?.area}</p>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400">
              Clinical note: RMT of {foundRMT}% is {foundRMT < 40 ? 'low' : foundRMT > 55 ? 'elevated' : 'within normal range'} (normal: 40-55%).
              Treatment at 120% MT = {Math.round(foundRMT * 1.2)}% device output.
            </p>
          </div>
        </div>
      )}

      {/* Phase 3: Amplitude measurement */}
      {phase === 'amplitude' && (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <p className="text-sm font-bold text-slate-700 mb-2">Bilateral Stimulation Note</p>
          <p className="text-sm text-slate-500">For treatment, TMS often uses both hemispheres — left DLPFC (excitatory) + right DLPFC (inhibitory, optional). The MT found on the left motor cortex applies to both sides at similar intensity.</p>
          <button onClick={() => setPhase('complete')} className="mt-4 px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors text-sm">
            View Treatment Protocol →
          </button>
        </div>
      )}
    </div>
  );
}