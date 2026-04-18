'use client';

import { useCallback } from 'react';
import type { Vector3 } from 'three';

export interface EFieldResult {
  /** Field strength at a given world-space point, normalized 0–1 */
  getStrengthAt: (px: number, py: number, pz: number) => number;
  /** World-space positions of peak activation (hot spots) */
  hotSpots: [number, number, number][];
  /** Current normalized intensity (1.0 = 100% MT) */
  normalizedIntensity: number;
  /** MT threshold depth rings (d where I/d² = threshold) */
  thresholdDepths: { threshold: number; distance: number }[];
}

const EPS = 0.25; // prevents div-by-zero near coil

function inverseSquare(intensityNorm: number, dist: number): number {
  return intensityNorm / (dist * dist + EPS);
}

/**
 * Dipole refinement: E-field is stronger along the coil axis direction.
 * We approximate coil axis as pointing toward the brain center from coil position.
 */
function dipole(
  intensityNorm: number,
  coilPos: [number, number, number],
  point: [number, number, number],
): number {
  const dx = point[0] - coilPos[0];
  const dy = point[1] - coilPos[1];
  const dz = point[2] - coilPos[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < 0.01) return intensityNorm;

  // Normalize direction
  const nx = dx / dist;
  const ny = dy / dist;
  const nz = dz / dist;

  // Simulated coil axis (points from coil toward brain origin)
  // For typical TMS setups the coil is angled ~45° from vertical
  const ax = 0.3, ay = 0.85, az = 0.42;
  const aLen = Math.sqrt(ax * ax + ay * ay + az * az);

  // Cosine of angle between coil axis and point direction
  const cosTheta = (dx * ax + dy * ay + dz * az) / (dist * aLen);

  // Dipole falloff: k * I * |cos(θ)| / d³
  const k = 0.8;
  const field = k * intensityNorm * Math.abs(cosTheta) / (dist * dist * dist + 0.1);

  return Math.min(field, 2.0); // clamp to avoid extreme values
}

export function useTMSPhysics() {
  const compute = useCallback(
    (
      coilPos: [number, number, number],
      intensityPct: number, // e.g. 120 = 120% MT
    ): EFieldResult => {
      const intensityNorm = intensityPct / 100;

      const getStrengthAt = (px: number, py: number, pz: number): number => {
        const dist = Math.sqrt(
          (px - coilPos[0]) ** 2 +
          (py - coilPos[1]) ** 2 +
          (pz - coilPos[2]) ** 2,
        );
        // Combine inverse-square and dipole for more realistic field
        const invSq = inverseSquare(intensityNorm, dist);
        const dip = dipole(intensityNorm, coilPos, [px, py, pz]);
        const combined = invSq * 0.6 + dip * 0.4;
        return Math.min(combined * 0.5, 1.0);
      };

      // Compute hot spots near the brain surface by sampling around coil
      const hotSpots: [number, number, number][] = [];
      const dirs = 8;
      for (let i = 0; i < dirs; i++) {
        const angle = (i / dirs) * Math.PI * 2;
        const dist = 0.55 + (i % 3) * 0.05;
        hotSpots.push([
          coilPos[0] + Math.cos(angle) * dist * 0.3,
          coilPos[1] + dist,
          coilPos[2] + Math.sin(angle) * dist * 0.2,
        ]);
      }

      // MT threshold ring depths: solve d = sqrt(I / threshold)
      const thresholdDepths = [80, 100, 120].map((thresh) => ({
        threshold: thresh,
        distance: Math.sqrt(intensityNorm / (thresh / 100)),
      }));

      return { getStrengthAt, hotSpots, normalizedIntensity: intensityNorm, thresholdDepths };
    },
    [],
  );

  return { compute };
}
