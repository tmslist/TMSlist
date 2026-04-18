'use client';

import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'tms-sim-badges';

export type BadgeId =
  | 'first-pulse'
  | 'hundred-pulses'
  | 'thousand-pulses'
  | 'all-protocols'
  | 'deep-tms'
  | 'theta-master'
  | 'navigator'
  | 'motor-cortex';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
}

const ALL_BADGES: Badge[] = [
  { id: 'first-pulse', name: 'First Pulse', description: 'Fired your first TMS pulse', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-400"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', earned: false },
  { id: 'hundred-pulses', name: '100 Pulses', description: 'Fired 100 pulses in one session', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-blue-400"><text x="2" y="16" font-size="14" font-weight="bold">100</text></svg>', earned: false },
  { id: 'thousand-pulses', name: '1,000 Pulses', description: 'Reached 1,000 pulses — therapeutic dose territory', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-orange-400"><path d="M12 23c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM3 13c4.97 0 9-4.03 9-9S7.97 4 3 4 3 8.03 3 13zm9-9c-4.97 0-9 4.03-9 9s4.03 9 9 9z"/></svg>', earned: false },
  { id: 'all-protocols', name: 'Protocol Explorer', description: 'Tested all 6 clinical protocols', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>', earned: false },
  { id: 'deep-tms', name: 'Deep Reach', description: 'Activated Deep TMS protocol', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-pink-400"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>', earned: false },
  { id: 'theta-master', name: 'Theta Master', description: 'Completed a full iTBS burst train', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-teal-400"><path stroke-linecap="round" stroke-linejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>', earned: false },
  { id: 'navigator', name: 'Navigator', description: 'Moved the coil to 5 different brain regions', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-400"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v4m0 4h4m-4 0h-4m5-5l2 2m-2-2l2-2"/></svg>', earned: false },
  { id: 'motor-cortex', name: 'Motor Mapping', description: 'Targeted the motor cortex region', emoji: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-cyan-400"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25v-3.435a2.652 2.652 0 00-.75-1.851l-2.94-2.94a2.652 2.652 0 00-1.851-.75L15 9m0 0l-3.5 3.5m-4.5 4.5L9 15m3.5-4.5l4.5-4.5"/></svg>', earned: false },
];

export function useAchievements(
  pulseCount: number,
  isPlaying: boolean,
  selectedProtocol: string | null,
  hoveredRegion: string | null,
  protocolsSelected: Set<string>,
) {
  const earnedRef = useRef<Set<BadgeId>>(new Set());
  const regionsVisitedRef = useRef<Set<string>>(new Set());
  const prevPulseRef = useRef(pulseCount);
  const prevProtocolRef = useRef<string | null>(null);
  const prevPlayingRef = useRef(isPlaying);
  const newlyEarnedRef = useRef<Badge[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids: BadgeId[] = JSON.parse(stored);
        ids.forEach(id => earnedRef.current.add(id));
      }
    } catch {}
  }, []);

  // Save to localStorage when earned
  const saveEarned = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...earnedRef.current]));
    } catch {}
  };

  const earn = (badge: Badge) => {
    if (earnedRef.current.has(badge.id)) return;
    earnedRef.current.add(badge.id);
    newlyEarnedRef.current.push({ ...badge, earned: true });
    saveEarned();
  };

  // Pulse-based badges
  if (prevPulseRef.current === 0 && pulseCount >= 1) {
    earn(ALL_BADGES.find(b => b.id === 'first-pulse')!);
  }
  if (prevPulseRef.current < 100 && pulseCount >= 100) {
    earn(ALL_BADGES.find(b => b.id === 'hundred-pulses')!);
  }
  if (prevPulseRef.current < 1000 && pulseCount >= 1000) {
    earn(ALL_BADGES.find(b => b.id === 'thousand-pulses')!);
  }

  // Protocol-based badges
  if (selectedProtocol && prevProtocolRef.current !== selectedProtocol) {
    if (selectedProtocol.includes('Deep TMS')) {
      earn(ALL_BADGES.find(b => b.id === 'deep-tms')!);
    }
    if (selectedProtocol.includes('Theta Burst')) {
      earn(ALL_BADGES.find(b => b.id === 'theta-master')!);
    }
  }

  // Region-based badges
  if (hoveredRegion) {
    regionsVisitedRef.current.add(hoveredRegion);
    if (regionsVisitedRef.current.size >= 5) {
      earn(ALL_BADGES.find(b => b.id === 'navigator')!);
    }
    if (hoveredRegion.includes('Motor')) {
      earn(ALL_BADGES.find(b => b.id === 'motor-cortex')!);
    }
  }

  // All protocols badge
  if (protocolsSelected.size >= 6) {
    earn(ALL_BADGES.find(b => b.id === 'all-protocols')!);
  }

  prevPulseRef.current = pulseCount;
  prevProtocolRef.current = selectedProtocol;
  prevPlayingRef.current = isPlaying;

  const allBadges = ALL_BADGES.map(b => ({
    ...b,
    earned: earnedRef.current.has(b.id),
  }));

  const earnedBadges = newlyEarnedRef.current;
  // Clear newly earned after returning
  newlyEarnedRef.current = [];

  return { allBadges, earnedBadges, resetBadges: () => {
    earnedRef.current.clear();
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }};
}
