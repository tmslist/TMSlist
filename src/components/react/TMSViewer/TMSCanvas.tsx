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
      <pointLight position={[-3, -1, -3]} intensity={0.5} color="#a78bfa" />
      <pointLight position={state.coilPosition} intensity={0.9} color="#22d3ee" />

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
            color="#06b6d4"
            metalness={0.9}
            roughness={0.1}
            emissive="#06b6d4"
            emissiveIntensity={emissiveRef.current}
          />
        </mesh>
        <mesh position={[0.18, 0.1, 0]}>
          <torusGeometry args={[0.2, 0.04, 12, 32]} />
          <meshStandardMaterial
            color="#8b5cf6"
            metalness={0.9}
            roughness={0.1}
            emissive="#8b5cf6"
            emissiveIntensity={emissiveRef.current}
          />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.36, 12]} />
          <meshStandardMaterial color="#6366f1" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Ring wave pool */}
      {Array.from({ length: RING_POOL_SIZE }, (_, i) => (
        <mesh key={`ring-${i}`} ref={el => { if (el) ringRefs.current[i] = el; }}>
          <torusGeometry args={[0.3, 0.015, 8, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0} />
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

export function TMSCanvas() {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const { state } = useTMS();

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl shadow-black/20"
      style={{ height: '640px' }}
    >
      {!mounted && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
             <div className="text-slate-400 text-sm font-medium tracking-wide">Loading simulation engine…</div>
          </div>
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 45 }}
        onCreated={() => setMounted(true)}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <TMSVisualization />
        </Suspense>
      </Canvas>

      {/* Status badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-600/50 rounded-lg px-3 py-1.5 shadow-lg">
        <div className={`w-2 h-2 rounded-full ${reducedMotion ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`} />
        <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase">TMS Simulation Engine</span>
        {state.coilTarget === 'free' && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 ml-1">
            FREE TARGET
          </span>
        )}
      </div>
    </div>
  );
}