'use client';

import { useRef, useCallback } from 'react';

/**
 * Web Audio API TMS coil click synthesis.
 * Chain: OscillatorNode(120Hz square) → GainNode(attack/decay envelope) → BiquadFilter(highpass) → destination
 * Lazy-initializes AudioContext on first call to comply with autoplay policy.
 */
export function useToneGenerator() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const fireClick = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = ensureContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Oscillator — square wave at 120Hz mimics TMS coil discharge
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);

    // Gain envelope: fast attack (1ms), quick decay (18ms)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.019);

    // Highpass filter — remove low rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 80;

    // Slight reverb tail via convolver simulation
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.08;

    osc.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(ctx.destination);
    filter.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }, [ensureContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { fireClick, setEnabled };
}
