'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTMS } from './TMSContext';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useBrainGeometry } from '../../../hooks/useBrainGeometry';
import { findNearestRegion } from '../../../data/brainRegions';
import vertexShader from '../../../shaders/efield.vert.glsl?raw';
import fragmentShader from '../../../shaders/efield.frag.glsl?raw';

// Shared scale constants for all brain geometry
const BRAIN_SCALE: [number, number, number] = [1.1, 0.9, 0.85];
const HOVER_SCALE: [number, number, number] = [1.15, 0.95, 0.9];

const FOLD_SEED = [
  [0.3, 0.1], [0.7, 0.2], [-0.4, 0.3], [0.1, -0.5],
  [-0.6, 0.1], [0.5, -0.4], [-0.2, 0.6], [0.8, -0.2],
  [-0.5, -0.3], [0.4, 0.7], [-0.8, 0.5], [0.2, -0.7],
];

function buildFoldLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  baseRadius: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < 20; i++) {
    const t = i / 20;
    const angle = Math.acos(
      Math.max(-1, Math.min(1, start.dot(end))),
    );
    let mid: THREE.Vector3;
    if (angle < 0.001) {
      mid = start.clone().lerp(end, t);
    } else {
      mid = start
        .clone()
        .multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle))
        .add(end.clone().multiplyScalar(Math.sin(t * angle) / Math.sin(angle)));
    }
    mid.normalize().multiplyScalar(baseRadius * (0.97 + Math.random() * 0.06));
    if (i === 0) positions.push(mid.x, mid.y, mid.z);
    positions.push(mid.x, mid.y, mid.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), 3),
  );
  return geo;
}

function useSulcalFolds() {
  return useMemo(() => {
    const folds: THREE.BufferGeometry[] = [];
    for (const [az, el] of FOLD_SEED) {
      const azRad = az * Math.PI;
      const elRad = el * Math.PI;
      const start = new THREE.Vector3(
        Math.cos(elRad) * Math.cos(azRad),
        Math.sin(elRad),
        Math.cos(elRad) * Math.sin(azRad),
      );
      const end = start.clone().multiplyScalar(-1);
      folds.push(buildFoldLine(start, end, 0.95));
    }
    return folds;
  }, []);
}

/** Inline comparison fragment shader — orange E-field */
const comparisonFrag = `
precision highp float;
varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 uCoilPosition;
uniform float uIntensity;
uniform float uTime;

void main() {
  vec3 pos = normalize(position);
  vec3 coil = normalize(uCoilPosition);
  float dist = distance(pos, coil);
  float field = uIntensity * exp(-dist * 4.0);
  field = pow(field, 1.2);
  vec3 orangeColor = vec3(0.976, 0.451, 0.086);
  gl_FragColor = vec4(orangeColor * field * 0.6, field * 0.5);
}
`;

export function TMSBrain() {
  const { state, dispatch } = useTMS();
  const heatmapRef = useRef<THREE.Mesh>(null);
  const compareHeatmapRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();
  const { camera } = useThree();

  const brainGeo = useBrainGeometry();
  const sulcalFolds = useSulcalFolds();

  const ring80Ref = useRef<THREE.Mesh>(null);
  const ring100Ref = useRef<THREE.Mesh>(null);
  const ring120Ref = useRef<THREE.Mesh>(null);
  const invisibleRef = useRef<THREE.Mesh>(null);
  const lastHoverRef = useRef<string | null>(null);

  // Compute adjusted coil position from angle and depth
  const adjustedCoilPos = useMemo((): [number, number, number] => {
    const [x, y, z] = state.coilPosition;
    const angleRad = (state.coilAngle * Math.PI) / 180;
    const depthScale = 1 - state.coilDepth * 0.3;
    const scaleFactor = 1 - state.coilDepth * 0.15;
    return [
      x * Math.cos(angleRad) * scaleFactor,
      y * scaleFactor,
      z * scaleFactor + Math.sin(angleRad) * x * 0.5,
    ];
  }, [state.coilPosition, state.coilAngle, state.coilDepth]);

  // Comparison coil position — offset right DLPFC
  const comparisonCoilPos = useMemo((): [number, number, number] => {
    if (!state.comparisonProtocol) return adjustedCoilPos;
    return [
      state.coilPosition[0] + 1.0,
      state.coilPosition[1] + 0.95,
      state.coilPosition[2] + 0.05,
    ];
  }, [state.comparisonProtocol, state.coilPosition]);

  const handlePointerMove = useCallback(
    (e: THREE.Event) => {
      const point = (e as unknown as { point: THREE.Vector3 }).point;
      if (!point) return;

      const len = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
      const surfacePoint: [number, number, number] = [
        (point.x / len) * BRAIN_SCALE[0],
        (point.y / len) * BRAIN_SCALE[1],
        (point.z / len) * BRAIN_SCALE[2],
      ];

      // Free mode: allow drag
      if (state.coilTarget === 'free' && invisibleRef.current) {
        const newPos: [number, number, number] = [
          (point.x / len) * HOVER_SCALE[0] + 0.05,
          (point.y / len) * HOVER_SCALE[1] * 0.95,
          (point.z / len) * HOVER_SCALE[2] * 0.88,
        ];
        dispatch({ type: 'SET_COIL_POSITION', position: newPos });
      }

      const region = findNearestRegion(surfacePoint);
      const regionId = region?.id ?? null;
      if (regionId !== lastHoverRef.current) {
        lastHoverRef.current = regionId;
        dispatch({ type: 'SET_HOVERED_REGION', region });
      }
    },
    [dispatch, state.coilTarget],
  );

  const handlePointerLeave = useCallback(() => {
    lastHoverRef.current = null;
    dispatch({ type: 'SET_HOVERED_REGION', region: null });
  }, [dispatch]);

  const thresholdRings = useMemo(
    () => [
      { ref: ring80Ref, pct: 80, distance: Math.sqrt(state.intensity / 80) },
      { ref: ring100Ref, pct: 100, distance: Math.sqrt(state.intensity / 100) },
      { ref: ring120Ref, pct: 120, distance: Math.sqrt(state.intensity / 120) },
    ],
    [state.intensity],
  );

  const uniforms = useMemo(
    () => ({
      uCoilPosition: { value: new THREE.Vector3() },
      uIntensity: { value: 1.0 },
      uTime: { value: 0 },
    }),
    [],
  );

  const compareUniforms = useMemo(
    () => ({
      uCoilPosition: { value: new THREE.Vector3() },
      uIntensity: { value: 0.8 },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (heatmapRef.current) {
      const mat = heatmapRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uCoilPosition.value.set(...adjustedCoilPos);
      mat.uniforms.uIntensity.value = Math.min(state.intensity / 100, 1.4);
      mat.uniforms.uTime.value = reducedMotion ? 0 : clock.getElapsedTime();
    }

    if (compareHeatmapRef.current && state.showComparisonField) {
      const mat = compareHeatmapRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uCoilPosition.value.set(...comparisonCoilPos);
      const compIntensity = (state.comparisonProtocol?.intensityPct ?? 100) / 100;
      mat.uniforms.uIntensity.value = Math.min(compIntensity, 1.4);
      mat.uniforms.uTime.value = reducedMotion ? 0 : clock.getElapsedTime();
    }

    const coilPos = adjustedCoilPos;
    const direction = new THREE.Vector3(-coilPos[0], -coilPos[1], -coilPos[2]).normalize();
    thresholdRings.forEach(({ ref, distance }) => {
      if (ref.current) {
        ref.current.position.set(
          coilPos[0] + direction.x * distance,
          coilPos[1] + direction.y * distance,
          coilPos[2] + direction.z * distance,
        );
        ref.current.lookAt(coilPos[0], coilPos[1], coilPos[2]);
      }
    });
  });

  return (
    <group>
      {/* Base brain mesh */}
      <mesh geometry={brainGeo}>
        <MeshDistortMaterial
          color="#e9c8f5"
          distort={0.22}
          speed={reducedMotion ? 0 : 0.4}
          roughness={0.55}
          metalness={0.08}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Sulcal fold lines */}
      {sulcalFolds.map((geo, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial
            color="#c4a0e0"
            transparent
            opacity={0.06}
            depthWrite={false}
          />
        </lineSegments>
      ))}

      {/* Primary E-field heatmap — DoubleSide so back-facing surface also shows field */}
      <mesh ref={heatmapRef} geometry={brainGeo}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Comparison E-field heatmap (orange) */}
      {state.showComparisonField && (
        <mesh ref={compareHeatmapRef} geometry={brainGeo}>
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={comparisonFrag}
            uniforms={compareUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
          />
        </mesh>
      )}

      {/* Invisible hover/drag mesh */}
      <mesh
        ref={invisibleRef}
        scale={HOVER_SCALE}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Motor threshold rings */}
      {thresholdRings.map(({ ref, pct }) => (
        <mesh key={pct} ref={ref}>
          <torusGeometry args={[0.06, 0.008, 8, 48]} />
          <meshBasicMaterial
            color={pct === 80 ? '#22d3ee' : pct === 100 ? '#a78bfa' : '#f97316'}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Brain outline wireframe */}
      <mesh scale={BRAIN_SCALE.map((s) => s * 1.01) as [number, number, number]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#e9c8f5"
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
    </group>
  );
}