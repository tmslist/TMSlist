// Brodmann area definitions for TMS-relevant brain regions.
// Centroid coordinates in brain-space (brain radius ~1, centered at origin).

export interface BrainRegion {
  id: string;
  name: string;
  brodmannArea: string;
  centroid: [number, number, number];
  clinicalNote: string;
  conditions: string[];
  coilTarget: 'left-dlpfc' | 'right-dlpfc' | 'motor' | 'other';
}

export const brainRegions: BrainRegion[] = [
  {
    id: 'left-dlpfc',
    name: 'Left DLPFC',
    brodmannArea: 'BA9 / BA46',
    centroid: [-0.5, 0.75, 0.35],
    clinicalNote: 'Dorsolateral prefrontal cortex. Primary target for depression. Regulates mood, executive function, and emotional processing.',
    conditions: ['Major Depressive Disorder', 'Treatment-Resistant Depression', 'Anxiety'],
    coilTarget: 'left-dlpfc',
  },
  {
    id: 'right-dlpfc',
    name: 'Right DLPFC',
    brodmannArea: 'BA9 / BA46',
    centroid: [0.5, 0.75, 0.35],
    clinicalNote: 'Right DLPFC. Low-frequency stimulation here can reduce anxiety and rumination via interhemispheric modulation.',
    conditions: ['Anxiety', 'Anxious Depression', 'PTSD', 'OCD'],
    coilTarget: 'right-dlpfc',
  },
  {
    id: 'left-motor',
    name: 'Left Motor Cortex',
    brodmannArea: 'BA4',
    centroid: [-0.75, 0.3, 0.55],
    clinicalNote: 'Primary motor cortex. TMS here produces Motor Evoked Potentials (MEPs) — the gold standard for determining motor threshold.',
    conditions: ['Stroke Rehabilitation', 'Chronic Pain', 'Movement Disorders'],
    coilTarget: 'motor',
  },
  {
    id: 'right-motor',
    name: 'Right Motor Cortex',
    brodmannArea: 'BA4',
    centroid: [0.75, 0.3, 0.55],
    clinicalNote: 'Right motor cortex. Stimulation can modulate right-side motor function and pain processing.',
    conditions: ['Chronic Pain', 'Stroke Rehabilitation'],
    coilTarget: 'motor',
  },
  {
    id: 'mPFC',
    name: 'mPFC / ACC',
    brodmannArea: 'BA24 / BA32',
    centroid: [0, 0.85, -0.25],
    clinicalNote: 'Medial prefrontal cortex and anterior cingulate cortex. Key nodes in the default mode network; involved in emotional and cognitive control.',
    conditions: ['Depression', 'PTSD', 'Chronic Pain', 'Anxiety'],
    coilTarget: 'other',
  },
  {
    id: 'left-precuneus',
    name: 'Left Precuneus',
    brodmannArea: 'BA7',
    centroid: [-0.35, 0.6, -0.55],
    clinicalNote: 'Precuneus. Part of the default mode network; involved in self-referential processing and consciousness.',
    conditions: ['Depression', 'Schizophrenia (negative symptoms)', 'Consciousness research'],
    coilTarget: 'other',
  },
  {
    id: 'left-insula',
    name: 'Left Insula',
    brodmannArea: 'BA13',
    centroid: [-0.6, 0.15, 0.35],
    clinicalNote: 'Insula. Interoceptive awareness, emotional processing, and salience detection. Deep structure — best targeted with dTMS H-coil.',
    conditions: ['Anxiety', 'OCD', 'Addiction', 'Chronic Pain'],
    coilTarget: 'other',
  },
  {
    id: 'dorsal-acc',
    name: 'Dorsal ACC',
    brodmannArea: 'BA32',
    centroid: [0.2, 0.78, 0.1],
    clinicalNote: 'Dorsal anterior cingulate cortex. Cognitive control, error monitoring, and pain perception.',
    conditions: ['Chronic Pain', 'Depression', 'ADHD', 'OCD'],
    coilTarget: 'other',
  },
];

export function findNearestRegion(coilPos: [number, number, number]): BrainRegion | null {
  let nearest: BrainRegion | null = null;
  let minDist = Infinity;

  for (const region of brainRegions) {
    const dx = coilPos[0] - region.centroid[0];
    const dy = coilPos[1] - region.centroid[1];
    const dz = coilPos[2] - region.centroid[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      nearest = region;
    }
  }

  // Only return if within reasonable distance threshold
  return minDist < 0.7 ? nearest : null;
}
