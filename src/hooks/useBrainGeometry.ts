import { useMemo } from 'react';
import * as THREE from 'three';

/** Creates an anatomical hemisphere brain shape.
 *  Uses a custom BufferGeometry approximating a lateral brain cross-section
 *  with gyri/sulci topology. Scaled to match the brain outline. */
export function useBrainGeometry(): THREE.BufferGeometry {
  return useMemo(() => {
    // Build brain hemisphere as revolution of a sagittal profile
    // Profile traces the lateral brain outline: frontal pole → parietal → occipital → cerebellum → temporal pole
    const profilePoints: THREE.Vector2[] = [];

    // 1. Frontal pole (anterior, most rounded)
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const angle = t * Math.PI * 0.55;
      profilePoints.push(
        new THREE.Vector2(0.82 + Math.sin(angle) * 0.18, 0.28 + t * 0.38),
      );
    }

    // 2. Superior aspect (top dome)
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const angle = t * Math.PI * 0.45;
      profilePoints.push(
        new THREE.Vector2(1.0 + Math.sin(angle) * 0.1, 0.66 + t * 0.16),
      );
    }

    // 3. Occipital (posterior, distinct bulge)
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      profilePoints.push(new THREE.Vector2(1.08 - t * 0.22, 0.82 + t * 0.12));
    }

    // 4. Cerebellum tucked beneath occipital
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      profilePoints.push(new THREE.Vector2(0.88 - t * 0.28, 0.94 - t * 0.22));
    }

    // 5. Temporal/pole area (inferior anterior, narrowing toward the front)
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      profilePoints.push(new THREE.Vector2(0.58 - t * 0.38, 0.72 - t * 0.44));
    }

    // Close at center
    profilePoints.push(new THREE.Vector2(0.18, 0.28));

    // Lathe around Y axis creates a full brain — but we want hemisphere shape
    // Use half lathe (0 to PI) to get a proper hemisphere profile
    const latheGeo = new THREE.LatheGeometry(profilePoints, 64, 0, Math.PI);
    latheGeo.scale(1.1, 0.9, 0.85);
    return latheGeo;
  }, []);
}