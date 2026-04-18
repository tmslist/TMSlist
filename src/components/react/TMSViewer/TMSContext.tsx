'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { TMSProtocol } from '../../../data/tmsProtocols';
import type { BrainRegion } from '../../../data/brainRegions';

// ---------- State ----------

export interface TMSState {
  coilPosition: [number, number, number];
  coilTarget: 'left-dlpfc' | 'right-dlpfc' | 'motor' | 'free';
  coilAngle: number; // degrees, 0 = perpendicular, 45 = tilted
  coilDepth: number; // 0 = surface, 0.5 = deeper toward center
  frequency: number;
  intensity: number;
  pulseCount: number;
  isPlaying: boolean;
  selectedProtocol: TMSProtocol | null;
  hoveredRegion: BrainRegion | null;
  /** Secondary protocol for side-by-side comparison */
  comparisonProtocol: TMSProtocol | null;
  /** Whether to render both E-fields simultaneously */
  showComparisonField: boolean;
}

const DEFAULT_COIL_POSITIONS: Record<string, [number, number, number]> = {
  'left-dlpfc':  [-0.5, 1.05, 0.4],
  'right-dlpfc': [0.5, 1.05, 0.4],
  'motor':       [-0.75, 0.7, 0.55],
};

const initialState: TMSState = {
  coilPosition: DEFAULT_COIL_POSITIONS['left-dlpfc'],
  coilTarget: 'left-dlpfc',
  coilAngle: 0,
  coilDepth: 0,
  frequency: 10,
  intensity: 120,
  pulseCount: 0,
  isPlaying: false,
  selectedProtocol: null,
  hoveredRegion: null,
  comparisonProtocol: null,
  showComparisonField: false,
};

// ---------- Actions ----------

type Action =
  | { type: 'SET_COIL_TARGET'; target: TMSState['coilTarget'] }
  | { type: 'SET_COIL_POSITION'; position: [number, number, number] }
  | { type: 'SET_COIL_ANGLE'; angle: number }
  | { type: 'SET_COIL_DEPTH'; depth: number }
  | { type: 'SET_FREQUENCY'; frequency: number }
  | { type: 'SET_INTENSITY'; intensity: number }
  | { type: 'SELECT_PROTOCOL'; protocol: TMSProtocol }
  | { type: 'SELECT_COMPARISON_PROTOCOL'; protocol: TMSProtocol | null }
  | { type: 'TOGGLE_COMPARISON_FIELD' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'START_PLAYING' }
  | { type: 'STOP_PLAYING' }
  | { type: 'INCREMENT_PULSE' }
  | { type: 'RESET_PULSE_COUNT' }
  | { type: 'SET_HOVERED_REGION'; region: BrainRegion | null };

function reducer(state: TMSState, action: Action): TMSState {
  switch (action.type) {
    case 'SET_COIL_TARGET':
      return { ...state, coilTarget: action.target, coilPosition: DEFAULT_COIL_POSITIONS[action.target] ?? state.coilPosition };
    case 'SET_COIL_POSITION':
      return { ...state, coilPosition: action.position, coilTarget: 'free' };
    case 'SET_COIL_ANGLE':
      return { ...state, coilAngle: action.angle };
    case 'SET_COIL_DEPTH':
      return { ...state, coilDepth: action.depth };
    case 'SET_FREQUENCY':
      return { ...state, frequency: action.frequency };
    case 'SET_INTENSITY':
      return { ...state, intensity: action.intensity };
    case 'SELECT_PROTOCOL':
      return {
        ...state,
        selectedProtocol: action.protocol,
        frequency: action.protocol.frequencyHz,
        intensity: action.protocol.intensityPct,
      };
    case 'SELECT_COMPARISON_PROTOCOL':
      return { ...state, comparisonProtocol: action.protocol };
    case 'TOGGLE_COMPARISON_FIELD':
      return { ...state, showComparisonField: !state.showComparisonField };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'START_PLAYING':
      return { ...state, isPlaying: true };
    case 'STOP_PLAYING':
      return { ...state, isPlaying: false };
    case 'INCREMENT_PULSE':
      return { ...state, pulseCount: state.pulseCount + 1 };
    case 'RESET_PULSE_COUNT':
      return { ...state, pulseCount: 0 };
    case 'SET_HOVERED_REGION':
      return { ...state, hoveredRegion: action.region };
    default:
      return state;
  }
}

// ---------- Context ----------

interface TMSContextValue {
  state: TMSState;
  dispatch: React.Dispatch<Action>;
}

const TMSContext = createContext<TMSContextValue | null>(null);

export function TMSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <TMSContext.Provider value={{ state, dispatch }}>{children}</TMSContext.Provider>;
}

export function useTMS(): TMSContextValue {
  const ctx = useContext(TMSContext);
  if (!ctx) throw new Error('useTMS must be used inside TMSProvider');
  return ctx;
}