'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { TMSState } from '../components/react/TMSViewer/TMSContext';
import { protocols } from '../data/tmsProtocols';

export interface URLState {
  protocol?: string;
  frequency?: number;
  intensity?: number;
  pulseCount?: number;
}

export function encodeURL(state: TMSState): URLState {
  const proto = protocols.find(p => p.name === state.selectedProtocol?.name);
  return {
    protocol: proto?.name,
    frequency: state.frequency,
    intensity: state.intensity,
    pulseCount: state.pulseCount > 0 ? state.pulseCount : undefined,
  };
}

export function applyURLParams(
  params: URLState,
  dispatch: React.Dispatch<any>,
) {
  if (params.protocol) {
    const p = protocols.find(proto => proto.name === params.protocol);
    if (p) dispatch({ type: 'SELECT_PROTOCOL', protocol: p });
  }
  if (params.frequency !== undefined) {
    dispatch({ type: 'SET_FREQUENCY', frequency: params.frequency });
  }
  if (params.intensity !== undefined) {
    dispatch({ type: 'SET_INTENSITY', intensity: params.intensity });
  }
}

export function buildShareURL(state: TMSState): string {
  if (typeof window === 'undefined') return '';
  const encoded = encodeURL(state);
  const params = new URLSearchParams();
  if (encoded.protocol) params.set('proto', encoded.protocol);
  if (encoded.frequency !== undefined) params.set('hz', String(encoded.frequency));
  if (encoded.intensity !== undefined) params.set('mt', String(encoded.intensity));
  return `${window.location.origin}/simulation?${params.toString()}`;
}

// Hook: reads URL on mount and applies to dispatch
export function useURLPersistence(dispatch: React.Dispatch<any>, hasApplied: boolean, setHasApplied: () => void) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (hasApplied) return;
    const proto = searchParams.get('proto');
    const hz = searchParams.get('hz');
    const mt = searchParams.get('mt');

    if (proto || hz || mt) {
      if (proto) {
        const p = protocols.find(pr => pr.name === proto);
        if (p) dispatch({ type: 'SELECT_PROTOCOL', protocol: p });
      }
      if (hz) {
        const f = parseFloat(hz);
        if (!isNaN(f)) dispatch({ type: 'SET_FREQUENCY', frequency: f });
      }
      if (mt) {
        const i = parseInt(mt);
        if (!isNaN(i)) dispatch({ type: 'SET_INTENSITY', intensity: i });
      }
      setHasApplied();
    } else {
      setHasApplied();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
}
