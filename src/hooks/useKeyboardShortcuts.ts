'use client';

import { useEffect } from 'react';
import { protocols } from '../data/tmsProtocols';

interface ShortcutHandlers {
  onPlayToggle: () => void;
  onReset: () => void;
  onSelectProtocol: (protocol: (typeof protocols)[0]) => void;
  onFrequencyUp: () => void;
  onFrequencyDown: () => void;
  onIntensityUp: () => void;
  onIntensityDown: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          handlers.onPlayToggle();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handlers.onReset();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          e.preventDefault();
          const idx = parseInt(e.key) - 1;
          if (protocols[idx]) handlers.onSelectProtocol(protocols[idx]);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) handlers.onIntensityUp();
          else handlers.onFrequencyUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) handlers.onIntensityDown();
          else handlers.onFrequencyDown();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlers]);
}
