'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTMS } from './TMSContext';

interface ParticleState {
  active: boolean;
  startTime: number;
  origin: [number, number, number];
}

const PARTICLE_COUNT = 40;
const WAVE_DURATION = 600; // ms

export interface NeuronWaveEffectHandle {
  fireWave: () => void;
}

interface Props {
  onReady?: (handle: NeuronWaveEffectHandle) => void;
}

export function NeuronWaveEffect({ onReady }: Props) {
  const { state } = useTMS();

  // Pool of particle states
  const particleStates = useRef<ParticleState[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      startTime: 0,
      origin: [0, 0, 0],
    })),
  );

  // Mesh refs
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const materialRefs = useRef<THREE.MeshBasicMaterial[]>([]);

  const fireWave = useCallback(() => {
    // Spawn 15-20 particles at the coil hotspot
    const count = 15 + Math.floor(Math.random() * 6);
    const coilPos = state.coilPosition;

    let spawned = 0;
    for (let i = 0; i < PARTICLE_COUNT && spawned < count; i++) {
      if (!particleStates.current[i].active) {
        // Add jitter around the coil position
        const jitter = 0.12;
        particleStates.current[i] = {
          active: true,
          startTime: performance.now(),
          origin: [
            coilPos[0] + (Math.random() - 0.5) * jitter,
            coilPos[1] + (Math.random() - 0.5) * jitter,
            coilPos[2] + (Math.random() - 0.5) * jitter,
          ],
        };
        spawned++;
      }
    }
  }, [state.coilPosition]);

  useEffect(() => {
    if (onReady) {
      onReady({ fireWave });
    }
  }, [onReady, fireWave]);

  // Store refs for frame-by-frame animation (called externally from useFrame)
  // This component renders the pool; animation happens in TMSCanvas
  // Expose mesh refs via a global ref registry

  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={el => {
            if (el) meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            ref={el => {
              if (el) materialRefs.current[i] = el;
            }}
            color="#00ffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// Export a helper to update particle positions from useFrame
export function updateNeuronParticles(
  meshRefs: React.MutableRefObject<THREE.Mesh[]>,
  materialRefs: React.MutableRefObject<THREE.MeshBasicMaterial[]>,
  particleStates: React.MutableRef<ParticleState[]>,
) {
  const now = performance.now();
  particleStates.current.forEach((p, i) => {
    const mesh = meshRefs.current[i];
    const mat = materialRefs.current[i];
    if (!mesh || !mat) return;

    if (!p.active) {
      mesh.visible = false;
      return;
    }

    const elapsed = now - p.startTime;
    const progress = elapsed / WAVE_DURATION;

    if (progress >= 1) {
      p.active = false;
      mesh.visible = false;
      mat.opacity = 0;
      return;
    }

    // Radial expansion from origin
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

    // Scale up then fade
    const scale = Math.min(progress * 4, 0.05 - progress * 0.03);
    mesh.scale.setScalar(Math.max(scale, 0.001));
    mesh.visible = true;

    // Bright white-cyan color
    mat.color.set('#ffffff');
    mat.opacity = (1 - progress) * 0.9;
    mat.transparent = true;
    mat.blending = THREE.AdditiveBlending;
  });
}