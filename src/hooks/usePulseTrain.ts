'use client';

import { useRef, useCallback, useEffect } from 'react';

export type PulsePattern = 'continuous' | 'tbs-burst' | 'ctbs' | 'single';

interface PulseTrainOptions {
  frequencyHz: number; // 0.5–50
  pattern: PulsePattern;
  onPulse: (timestamp: number, pulseIndex: number) => void;
  onComplete?: () => void;
}

interface PulseTrainReturn {
  start: (pulseCount?: number) => void;
  stop: () => void;
  isRunning: boolean;
  pulseCount: number;
}

/**
 * Timing state machine for TMS pulse trains.
 *
 * Patterns:
 *  - continuous: fire at 1/frequencyHz intervals (e.g. 10Hz = every 100ms)
 *  - tbs-burst: 3 pulses at 50Hz every 200ms (iTBS: 10 bursts of 2s on / 8s off)
 *  - ctbs: 3 pulses at 50Hz every 200ms, continuous
 *  - single: fire once
 */
export function usePulseTrain({
  frequencyHz,
  pattern,
  onPulse,
  onComplete,
}: PulseTrainOptions): PulseTrainReturn {
  const runningRef = useRef(false);
  const pulseIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPulsesRef = useRef(Infinity);
  const lastPulseRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = useCallback(() => {
    if (!runningRef.current || pulseIndexRef.current >= totalPulsesRef.current) {
      runningRef.current = false;
      onComplete?.();
      return;
    }

    const now = performance.now();
    let delay: number;

    if (pattern === 'tbs-burst' || pattern === 'ctbs') {
      // Theta burst: 3 pulses at 50Hz (20ms apart) every 200ms
      const burstOffset = (pulseIndexRef.current % 3) * 20;
      delay = burstOffset;
    } else if (pattern === 'single') {
      delay = 0;
    } else {
      // Continuous: interval = 1000 / frequencyHz
      delay = Math.max(1000 / frequencyHz - (now - lastPulseRef.current), 0);
    }

    timerRef.current = setTimeout(() => {
      if (!runningRef.current) return;
      pulseIndexRef.current++;
      lastPulseRef.current = performance.now();
      onPulse(lastPulseRef.current, pulseIndexRef.current);
      scheduleNext();
    }, delay);
  }, [frequencyHz, pattern, onPulse, onComplete]);

  const start = useCallback((pulseCount = Infinity) => {
    runningRef.current = true;
    pulseIndexRef.current = 0;
    lastPulseRef.current = 0;
    totalPulsesRef.current = pulseCount;
    clearTimer();

    if (pattern === 'single') {
      const ts = performance.now();
      pulseIndexRef.current = 1;
      onPulse(ts, 1);
      runningRef.current = false;
      onComplete?.();
    } else if (pattern === 'tbs-burst' || pattern === 'ctbs') {
      // Schedule first burst immediately
      const burstFire = (burstIndex: number) => {
        if (!runningRef.current || burstIndex >= (pulseCount / 3)) {
          runningRef.current = false;
          onComplete?.();
          return;
        }
        // Fire 3 pulses at 50Hz
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (!runningRef.current) return;
            pulseIndexRef.current++;
            onPulse(performance.now(), pulseIndexRef.current);
          }, i * 20);
        }
        const interval = pattern === 'tbs-burst' ? 2000 : 200; // off-time for iTBS, continuous for cTBS
        setTimeout(() => burstFire(burstIndex + 1), interval);
      };
      burstFire(0);
    } else {
      // Continuous
      scheduleNext();
    }
  }, [pattern, onPulse, onComplete, scheduleNext, frequencyHz]);

  const stop = useCallback(() => {
    runningRef.current = false;
    clearTimer();
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    start,
    stop,
    isRunning: runningRef.current,
    pulseCount: pulseIndexRef.current,
  };
}
