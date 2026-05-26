'use client';

import { Suspense, useRef, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TMSBrain } from './TMSBrain';
import { TMSNavigationTrail } from './TMSNavigationTrail';
import { TMSHeadOutline } from './TMSHeadOutline';
import { TMSProvider, useTMS } from './TMSContext';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { usePulseTrain } from '../../../hooks/usePulseTrain';
import { useToneGenerator } from '../../../hooks/useToneGenerator';

const RING_POOL_SIZE = 5;
const RING_DURATION = 0.4;
const PARTICLE_COUNT = 40;
const WAVE_DURATION = 0.6;

interface ParticleState {
  active: boolean;
  startTime: number;
  origin: [number, number, number];
}

function TMSVisualization() {
  const { state, dispatch } = useTMS();
  const reducedMotion = useReducedMotion();
  const { fireClick } = useToneGenerator();

  const coilGroupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const ringStates = useRef<{ active: boolean; startTime: number }[]>(
    Array.from({ length: RING_POOL_SIZE }, () => ({ active: false, startTime: 0 })),
  );
  const emissiveRef = useRef(0.6);
  const coilBobRef = useRef({ phase: 0, emissiveTarget: 0.6 });

  // Neuron wave particle pool
  const particleStates = useRef<ParticleState[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      startTime: 0,
      origin: [0, 0, 0],
    })),
  );
  const particleMeshRefs = useRef<THREE.Mesh[]>([]);
  const particleMatRefs = useRef<THREE.MeshBasicMaterial[]>([]);

  // OrbitControls ref for drag interaction
  const orbitRef = useRef<any>(null);
  const isDraggingRef = useRef(false);

  const handlePulse = useCallback(() => {
    dispatch({ type: 'INCREMENT_PULSE' });
    fireClick();

    if (reducedMotion) return;

    // Find inactive ring slot
    const idx = ringStates.current.findIndex(r => !r.active);
    if (idx === -1) return;

    ringStates.current[idx] = { active: true, startTime: performance.now() };
    coilBobRef.current.emissiveTarget = 3.0;

    if (ringRefs.current[idx]) {
      const mesh = ringRefs.current[idx];
      const dir = new THREE.Vector3(
        -state.coilPosition[0],
        -state.coilPosition[1],
        -state.coilPosition[2],
      ).normalize();

      mesh.position.set(
        state.coilPosition[0] + dir.x * 0.1,
        state.coilPosition[1] + dir.y * 0.1,
        state.coilPosition[2] + dir.z * 0.1,
      );
      mesh.lookAt(
        state.coilPosition[0] + dir.x * 10,
        state.coilPosition[1] + dir.y * 10,
        state.coilPosition[2] + dir.z * 10,
      );
      mesh.scale.setScalar(1);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8;
      mat.transparent = true;
    }

    // Fire neuron wave
    const count = 15 + Math.floor(Math.random() * 6);
    let spawned = 0;
    for (let i = 0; i < PARTICLE_COUNT && spawned < count; i++) {
      if (!particleStates.current[i].active) {
        const jitter = 0.12;
        particleStates.current[i] = {
          active: true,
          startTime: performance.now(),
          origin: [
            state.coilPosition[0] + (Math.random() - 0.5) * jitter,
            state.coilPosition[1] + (Math.random() - 0.5) * jitter,
            state.coilPosition[2] + (Math.random() - 0.5) * jitter,
          ],
        };
        spawned++;
      }
    }
  }, [dispatch, fireClick, reducedMotion, state.coilPosition]);

  const handleComplete = useCallback(() => {
    dispatch({ type: 'STOP_PLAYING' });
  }, [dispatch]);

  const { start, stop } = usePulseTrain({
    frequencyHz: state.frequency,
    pattern: state.selectedProtocol?.pulsePattern ?? 'continuous',
    onPulse: () => {
      // onPulse signature differs — handle within
      handlePulse();
    },
    onComplete: handleComplete,
  });

  // Use onPulse correctly with timestamp/pulseIndex
  const { start: startP, stop: stopP } = usePulseTrain({
    frequencyHz: state.frequency,
    pattern: state.selectedProtocol?.pulsePattern ?? 'continuous',
    onPulse: (_ts, _idx) => handlePulse(),
    onComplete: handleComplete,
  });

  // React to play/stop state
  useEffect(() => {
    if (state.isPlaying) {
      dispatch({ type: 'RESET_PULSE_COUNT' });
      startP(Infinity);
    } else {
      stopP();
    }
  }, [state.isPlaying, startP, stopP, dispatch]);

  // Update neuron particles every frame
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Coil bob
    if (coilGroupRef.current && !reducedMotion) {
      coilGroupRef.current.position.x = state.coilPosition[0];
      coilGroupRef.current.position.z = state.coilPosition[2];
      coilGroupRef.current.position.y = state.coilPosition[1] + Math.sin(t * 1.5) * 0.04;
      coilGroupRef.current.lookAt(0, state.coilPosition[1] * 0.5, 0);
    }

    // Lerp emissive
    const em = coilBobRef.current;
    emissiveRef.current += (em.emissiveTarget - emissiveRef.current) * 0.12;
    em.emissiveTarget += (0.6 - em.emissiveTarget) * 0.08;

    // Animate rings
    const now = performance.now();
    ringStates.current.forEach((ring, idx) => {
      if (!ring.active || !ringRefs.current[idx]) return;
      const elapsed = (now - ring.startTime) / 1000;
      const progress = elapsed / RING_DURATION;

      if (progress >= 1) {
        ring.active = false;
        const mat = ringRefs.current[idx].material as THREE.MeshBasicMaterial;
        mat.opacity = 0;
        ringRefs.current[idx].scale.setScalar(1);
      } else {
        const scale = 1 + progress * 3.5;
        const opacity = 0.8 * (1 - progress * progress);
        ringRefs.current[idx].scale.setScalar(scale);
        const mat = ringRefs.current[idx].material as THREE.MeshBasicMaterial;
        mat.opacity = opacity;
      }
    });

    // Animate neuron wave particles
    particleStates.current.forEach((p, i) => {
      const mesh = particleMeshRefs.current[i];
      const mat = particleMatRefs.current[i];
      if (!mesh || !mat) return;

      if (!p.active) {
        mesh.visible = false;
        return;
      }

      const elapsed = (now - p.startTime) / 1000;
      const progress = Math.min(elapsed / WAVE_DURATION, 1);

      if (progress >= 1) {
        p.active = false;
        mesh.visible = false;
        mat.opacity = 0;
        return;
      }

      const expandRadius = progress * 0.5;
      const dir = new THREE.Vector3(
        mesh.position.x - p.origin[0],
        mesh.position.y - p.origin[1],
        mesh.position.z - p.origin[2],
      );
      if (dir.length() > 0.001) {
        dir.normalize();
      } else {
        dir.set(1, 0, 0);
      }

      mesh.position.set(
        p.origin[0] + dir.x * expandRadius,
        p.origin[1] + dir.y * expandRadius,
        p.origin[2] + dir.z * expandRadius,
      );

      const scale = Math.min(progress * 4, 0.05 - progress * 0.03);
      mesh.scale.setScalar(Math.max(scale, 0.001));
      mesh.visible = true;
      mat.color.set('#ffffff');
      mat.opacity = (1 - progress) * 0.9;
      mat.transparent = true;
      mat.blending = THREE.AdditiveBlending;
    });

    // Temporarily disable orbit controls during drag
    if (orbitRef.current) {
      orbitRef.current.enabled = !isDraggingRef.current;
    }
  });

  // Handle drag start/move/end on invisible drag mesh
  const handleDragStart = useCallback(() => {
    if (state.coilTarget === 'free') {
      isDraggingRef.current = true;
    }
  }, [state.coilTarget]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 3, 3]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, -1, -3]} intensity={0.5} color="#C9654A" />
      <pointLight position={state.coilPosition} intensity={0.9} color="#C9654A" />

      <TMSHeadOutline />
      <TMSBrain />
      <TMSNavigationTrail />

      {/* Neuron wave particles */}
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh
          key={`np-${i}`}
          ref={el => {
            if (el) particleMeshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            ref={el => {
              if (el) particleMatRefs.current[i] = el;
            }}
            color="#ffffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Coil */}
      <group ref={coilGroupRef} position={state.coilPosition}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.18, 0.1, 0]}>
          <torusGeometry args={[0.2, 0.04, 12, 32]} />
          <meshStandardMaterial
            color="#1E2A3B"
            metalness={0.9}
            roughness={0.1}
            emissive="#1E2A3B"
            emissiveIntensity={emissiveRef.current}
          />
        </mesh>
        <mesh position={[0.18, 0.1, 0]}>
          <torusGeometry args={[0.2, 0.04, 12, 32]} />
          <meshStandardMaterial
            color="#C9654A"
            metalness={0.9}
            roughness={0.1}
            emissive="#C9654A"
            emissiveIntensity={emissiveRef.current}
          />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.36, 12]} />
          <meshStandardMaterial color="#0A1628" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Ring wave pool */}
      {Array.from({ length: RING_POOL_SIZE }, (_, i) => (
        <mesh key={`ring-${i}`} ref={el => { if (el) ringRefs.current[i] = el; }}>
          <torusGeometry args={[0.3, 0.015, 8, 64]} />
          <meshBasicMaterial color="#C9654A" transparent opacity={0} />
        </mesh>
      ))}

      <OrbitControls
        ref={orbitRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.72}
        autoRotate={!state.isPlaying && !reducedMotion && !isDraggingRef.current}
        autoRotateSpeed={0.4}
      />
    </>
  );
}

interface TMSCanvasProps {
  /** When false, pause the canvas frame loop (perf + battery when off-screen). */
  inView?: boolean;
  /** Compact variant for embedded usage. */
  compact?: boolean;
}

export function TMSCanvas({ inView = true, compact = false }: TMSCanvasProps = {}) {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const { state } = useTMS();
  // Pause when off-screen or reduced-motion is on
  const frameloop = (!inView || reducedMotion) ? 'demand' : 'always';

  return (
    <div
      role="img"
      aria-label="Interactive 3D model of a transcranial magnetic stimulation coil and brain. Use the controls panel to adjust frequency, intensity, and target region. Drag to rotate, scroll to zoom."
      className="relative w-full overflow-hidden"
      style={{
        height: compact ? '360px' : '560px',
        background:
          'radial-gradient(ellipse at 50% 100%, rgba(201,101,74,0.10), transparent 65%), linear-gradient(180deg, #0A1628 0%, #0F1B30 100%)',
        borderRadius: 16,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(201,101,74,0.12), 0 12px 30px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* Subtle scanline overlay for instrument feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'overlay',
          opacity: 0.6,
        }}
      />
      {/* Corner brackets — subtle viewport markers */}
      <CornerBrackets />

      {!mounted && (
        <div className="absolute inset-0 flex items-center justify-center z-10" role="status" aria-label="Loading simulation engine">
          <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C9654A', borderTopColor: 'transparent' }}></div>
             <div className="text-white/50 text-xs font-medium tracking-widest uppercase">Loading instrument</div>
          </div>
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 45 }}
        onCreated={() => setMounted(true)}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={frameloop}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <TMSVisualization />
        </Suspense>
      </Canvas>

      {/* Status badge — top-left */}
      <div className="absolute top-3 left-3 flex items-center gap-2"
        style={{
          background: 'rgba(10,22,40,0.65)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(201,101,74,0.30)',
          borderRadius: 10,
          padding: '5px 10px',
        }}
      >
        <span
          className={reducedMotion ? '' : 'animate-pulse'}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: reducedMotion ? 'none' : '0 0 8px rgba(34,197,94,0.6)',
          }}
        />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(251,250,247,0.80)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          Live Stage
        </span>
        {state.coilTarget === 'free' && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#D4806A',
              background: 'rgba(201,101,74,0.15)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid rgba(201,101,74,0.35)',
              marginLeft: 4,
              letterSpacing: '0.06em',
            }}
          >
            FREE TARGET
          </span>
        )}
      </div>

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center flex-wrap gap-3"
          style={{
            background: 'rgba(10,22,40,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '5px 10px',
          }}
        >
          <LegendDot color="#C9654A" label="Coil pulse" />
          <LegendDot color="#FBFAF7" label="Neuron wave" />
          <LegendDot color="#D4806A" label="Field rings" />
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'rgba(251,250,247,0.45)',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            letterSpacing: '0.05em',
          }}
        >
          drag · scroll · click
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}66` }} />
      <span style={{ fontSize: 10, color: 'rgba(251,250,247,0.65)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function CornerBrackets() {
  const c = 'rgba(201,101,74,0.28)';
  const arms = 14;
  const w = 1.5;
  const positions: { top?: number; right?: number; bottom?: number; left?: number; rotate: number }[] = [
    { top: 8, left: 8, rotate: 0 },
    { top: 8, right: 8, rotate: 90 },
    { bottom: 8, right: 8, rotate: 180 },
    { bottom: 8, left: 8, rotate: 270 },
  ];
  return (
    <>
      {positions.map((p, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: p.top,
            right: p.right,
            bottom: p.bottom,
            left: p.left,
            width: arms,
            height: arms,
            transform: `rotate(${p.rotate}deg)`,
            borderLeft: `${w}px solid ${c}`,
            borderTop: `${w}px solid ${c}`,
          }}
        />
      ))}
    </>
  );
}