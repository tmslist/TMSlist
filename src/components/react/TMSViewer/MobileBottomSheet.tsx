'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { SettingsIcon, ChartIcon } from '../Icons';

interface MobileBottomSheetProps {
  controls: ReactNode;
  monitor: ReactNode;
  fab: ReactNode; // The fire button
}

type Tab = 'controls' | 'monitor';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'controls', label: 'Controls', icon: <SettingsIcon size={16} /> },
  { id: 'monitor', label: 'Stats', icon: <ChartIcon size={16} /> },
];

const SPRING_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export function MobileBottomSheet({ controls, monitor }: MobileBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('controls');
  const [expanded, setExpanded] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const open = () => setExpanded(true);
  const close = () => setExpanded(false);
  const toggle = () => setExpanded(e => !e);

  // Touch drag handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null || !sheetRef.current) return;
    const delta = e.touches[0].clientY - dragStart;
    if (delta > 50) close();
    setDragStart(e.touches[0].clientY);
  };

  const handleTouchEnd = () => setDragStart(null);

  const content = activeTab === 'controls' ? controls : monitor;

  return (
    <>
      {/* Floating bottom bar — always visible on mobile */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
        style={{ background: 'rgba(10,22,40,0.96)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(201,101,74,0.2)' }}
      >
        <div className="flex">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id && expanded;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id && expanded) close();
                  else if (activeTab === tab.id) open();
                  else { setActiveTab(tab.id); open(); }
                }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative"
                style={{ color: isActive ? '#D4806A' : 'rgba(251,250,247,0.6)' }}
                aria-pressed={isActive}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider">{tab.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: '#C9654A' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backdrop */}
      {expanded && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={close}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="lg:hidden fixed left-0 right-0 z-40 rounded-t-2xl transition-all overflow-hidden"
        style={{
          bottom: expanded ? 0 : '-70vh',
          maxHeight: '75vh',
          transition: `bottom 350ms ${SPRING_EASE}`,
          background: '#0A1628',
          borderTop: '1px solid rgba(201,101,74,0.25)',
        }}
      >
        {/* Drag handle */}
        <button
          onClick={close}
          className="w-full flex justify-center pt-2.5 pb-1"
          aria-label="Collapse panel"
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(251,250,247,0.25)' }} />
        </button>

        {/* Tab switcher inside sheet */}
        <div className="flex px-4" style={{ borderBottom: '1px solid rgba(201,101,74,0.18)' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2"
                style={{
                  borderColor: isActive ? '#C9654A' : 'transparent',
                  color: isActive ? '#D4806A' : 'rgba(251,250,247,0.5)',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-3 pb-safe custom-scrollbar" style={{ maxHeight: 'calc(75vh - 80px)' }}>
          {content}
        </div>
      </div>
    </>
  );
}
