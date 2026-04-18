'use client';

import { useState, useCallback, useRef } from 'react';

export type NarrationLevel = 'clinical' | 'patient';

export interface NarrationEntry {
  id: number;
  text: string;
  clinicalText: string;
  patientText: string;
  type: 'info' | 'pulse' | 'region' | 'warning' | 'achievement' | 'protocol';
  timestamp: number;
}

const PATIENT: NarrationLevel = 'patient';
const CLINICAL: NarrationLevel = 'clinical';

let _id = 0;
const nextId = () => ++_id;

export function useNarration() {
  const [entries, setEntries] = useState<NarrationEntry[]>([]);
  const [level, setLevel] = useState<NarrationLevel>(PATIENT);
  const maxEntries = 8;

  const addEntry = useCallback((
    clinicalText: string,
    patientText: string,
    type: NarrationEntry['type'] = 'info',
  ) => {
    setEntries(prev => {
      const entry: NarrationEntry = {
        id: nextId(),
        clinicalText,
        patientText,
        text: level === PATIENT ? patientText : clinicalText,
        type,
        timestamp: Date.now(),
      };
      const next = [entry, ...prev];
      return next.slice(0, maxEntries);
    });
  }, [level]);

  const clear = useCallback(() => setEntries([]), []);

  // Update texts when level changes
  const getText = useCallback((entry: NarrationEntry) => {
    return level === PATIENT ? entry.patientText : entry.clinicalText;
  }, [level]);

  return { entries, level, setLevel, addEntry, clear, getText };
}

// ---------- Pre-built narration helpers ----------

export function pulseNarrations(
  frequency: number,
  intensity: number,
  regionName: string,
  isTBS: boolean,
  level: NarrationLevel,
): { clinical: string; patient: string } {
  if (isTBS) {
    const bursts = Math.round(frequency / 3);
    return {
      clinical: `Theta burst firing: ${frequency}Hz within-burst, ${bursts} bursts/s, ${intensity}% MT intensity applied to ${regionName}.`,
      patient: `Theta burst — groups of 3 pulses at ${frequency}Hz, repeated ${bursts} times per second. Mimics the brain's natural 5Hz theta rhythm to boost neuroplasticity.`,
    };
  }
  if (frequency === 1) {
    return {
      clinical: `Low-frequency ${frequency}Hz stimulation to ${regionName} at ${intensity}% MT. Inhibitory protocol — suppresses cortical excitability via GABA-B mechanisms.`,
      patient: `Slow 1 pulse-per-second stimulation. This gentle pace lets neurons settle down — often used for the right side of the brain to reduce anxiety and rumination.`,
    };
  }
  if (frequency >= 10) {
    return {
      clinical: `High-frequency ${frequency}Hz rTMS at ${intensity}% MT over ${regionName}. Excitatory protocol — increases glutamate release and promotes BDNF-mediated neuroplasticity.`,
      patient: `${frequency} pulses per second! At ${intensity}% of your motor threshold, this excitatory protocol fires your ${regionName} neurons rapidly to lift mood and energy.`,
    };
  }
  return {
    clinical: `Firing ${frequency}Hz pulses at ${intensity}% MT over ${regionName}.`,
    patient: `${frequency} pulses per second at ${intensity}% intensity over ${regionName}.`,
  };
}

export function intensityNarrations(
  intensity: number,
  regionName: string,
  level: NarrationLevel,
): { clinical: string; patient: string } {
  if (intensity >= 120) {
    return {
      clinical: `${intensity}% MT — suprathreshold stimulation. E-field exceeds motor threshold; reliable cortical activation expected per Lioumis et al..`,
      patient: `${intensity}% of your motor threshold — strong enough to reliably activate cortical neurons and trigger measurable motor responses. Standard for most clinical protocols.`,
    };
  }
  if (intensity >= 100) {
    return {
      clinical: `${intensity}% MT — at motor threshold. Minimum intensity for reliable motor evoked potential generation. Consistent with FDA protocol guidelines.`,
      patient: `At your personal motor threshold — the minimum stimulation needed for a reliable treatment effect. Some patients feel this as a light tapping sensation on the scalp.`,
    };
  }
  if (intensity >= 80) {
    return {
      clinical: `${intensity}% MT — subthreshold for motor cortex but clinically therapeutic for DLPFC based on neuronavigated dose modeling.`,
      patient: `${intensity}% intensity — below what you'd feel in your hand muscle, but neuronavigation confirms the field still reaches your prefrontal cortex effectively.`,
    };
  }
  return {
    clinical: `${intensity}% MT — low intensity. May be used for tolerability assessment or pediatric protocols.`,
    patient: `${intensity}% intensity — a very gentle dose, typically used when building tolerance or for research protocols.`,
  };
}

export function regionNarrations(
  regionName: string,
  clinicalNote: string,
  level: NarrationLevel,
): { clinical: string; patient: string } {
  return {
    clinical: `${regionName}: ${clinicalNote}`,
    patient: `You're hovering over the ${regionName}. ${clinicalNote}`,
  };
}

export function achievementNarrations(
  badge: string,
  level: NarrationLevel,
): { clinical: string; patient: string } {
  const messages: Record<string, { clinical: string; patient: string }> = {
    'First Pulse': {
      clinical: 'Achievement unlocked: First Pulse. Session initiated.',
      patient: 'You fired your first pulse! Welcome to TMS simulation.',
    },
    '100 Pulses': {
      clinical: 'Achievement unlocked: 100 Pulses. Cumulative dose 1.2J at 120% MT.',
      patient: '100 pulses fired! That\'s about what a full theta burst session delivers.',
    },
    '1,000 Pulses': {
      clinical: 'Achievement unlocked: 1,000 Pulses. Approaching therapeutic dose threshold.',
      patient: '1,000 pulses — you\'ve completed roughly a third of a standard rTMS session!',
    },
    'All 6 Protocols': {
      clinical: 'Achievement unlocked: Protocol Explorer. All 6 TMS protocols tested.',
      patient: 'You\'ve tested every protocol! You now understand the full TMS toolkit.',
    },
    'Deep TMS': {
      clinical: 'Achievement unlocked: Deep Reach. Deep TMS (H1 coil) protocol activated.',
      patient: 'Deep TMS targets structures up to 4cm below the surface — beyond what standard coils can reach.',
    },
    'Theta Master': {
      clinical: 'Achievement unlocked: Theta Master. iTBS protocol mastered.',
      patient: 'Theta burst mastered! 600 pulses in 3 minutes — that\'s the power of neuroscience efficiency.',
    },
  };
  return messages[badge] ?? {
    clinical: `Achievement: ${badge}`,
    patient: `Achievement unlocked: ${badge}!`,
  };
}
