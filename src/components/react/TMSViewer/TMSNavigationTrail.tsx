'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTMS } from './TMSContext';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const TRAIL_LENGTH = 50;

export function TMSNavigationTrail() {
  const { state } = useTMS();
  const reducedMotion = useReducedMotion();
  const pointsRef = useRef<THREE.Points | null>(null);

  // Circular buffer of positions
  const positions = useRef<[number, number, number][]>([]);
  const currentIndex = useRef(0);
  const filled = useRef(false);

  // Initialize buffer
  useMemo(() => {
    positions.current = Array.from({ length: TRAIL_LENGTH }, () => state.coilPosition);
    currentIndex.current = 0;
    filled.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posArray = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), []);
  const alphaArray = useMemo(() => new Float32Array(TRAIL_LENGTH), []);

  useFrame(() => {
    if (reducedMotion || state.coilTarget !== 'free') return;

    // Only update every few frames to avoid GC
    const now = positions.current;
    const last = now[(currentIndex.current - 1 + TRAIL_LENGTH) % TRAIL_LENGTH];
    const dx = state.coilPosition[0] - last[0];
    const dy = state.coilPosition[1] - last[1];
    const dz = state.coilPosition[2] - last[2];
    const moved = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (moved > 0.005) {
      now[currentIndex.current] = [...state.coilPosition];
      currentIndex.current = (currentIndex.current + 1) % TRAIL_LENGTH;
      if (currentIndex.current === 0) filled.current = true;
    }

    const count = filled.current ? TRAIL_LENGTH : currentIndex.current;
    for (let i = 0; i < count; i++) {
      const bufIdx = filled.current
        ? (currentIndex.current + i) % TRAIL_LENGTH
        : i;
      const age = filled.current
        ? (TRAIL_LENGTH - i) / TRAIL_LENGTH
        : count > 0 ? i / count : 0;
      const p = now[bufIdx];
      posArray[i * 3] = p[0];
      posArray[i * 3 + 1] = p[1];
      posArray[i * 3 + 2] = p[2];
      alphaArray[i] = Math.pow(age, 0.6); // ease-out fade
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      geo.setAttribute('position', new THREE.BufferAttribute(posArray.slice(0, count * 3), 3));
      geo.setAttribute('alpha', new THREE.BufferAttribute(alphaArray.slice(0, count), 1));
      geo.attributes.position.needsUpdate = true;
      geo.attributes.alpha.needsUpdate = true;
      geo.setDrawRange(0, count);
    }
  });

  if (reducedMotion || state.coilTarget !== 'free') return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.04}
        vertexAlpha
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#22d3ee"
      />
    </points>
  );
}
