'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { SettingsIcon, ChartIcon, DocumentIcon } from '../Icons';

interface MobileBottomSheetProps {
  controls: ReactNode;
  monitor: ReactNode;
  reference: ReactNode;
  fab: ReactNode; // The fire button
}

type Tab = 'controls' | 'monitor' | 'reference';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'controls', label: 'Controls', icon: <SettingsIcon size={16} /> },
  { id: 'monitor', label: 'Monitor', icon: <ChartIcon size={16} /> },
  { id: 'reference', label: 'Reference', icon: <DocumentIcon size={16} /> },
];

const SPRING_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export function MobileBottomSheet({ controls, monitor, reference }: MobileBottomSheetProps) {
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

  const content = activeTab === 'controls' ? controls
    : activeTab === 'monitor' ? monitor
    : reference;

  return (
    <>
      {/* Floating bottom bar — always visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 safe-area-bottom">
        {/* Mini tab buttons */}
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (activeTab === tab.id && expanded) close();
                else if (activeTab === tab.id) open();
                else { setActiveTab(tab.id); open(); }
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative ${
                activeTab === tab.id && expanded
                  ? 'text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="text-[8px] font-semibold uppercase tracking-wider">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {expanded && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="lg:hidden fixed left-0 right-0 z-40 bg-slate-900/97 backdrop-blur-xl border-t border-slate-700/50 rounded-t-2xl transition-all overflow-hidden"
        style={{
          bottom: expanded ? 0 : '-70vh',
          maxHeight: '75vh',
          transition: `bottom 350ms ${SPRING_EASE}`,
        }}
      >
        {/* Drag handle */}
        <button
          onClick={close}
          className="w-full flex justify-center pt-2.5 pb-1"
          aria-label="Collapse panel"
        >
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </button>

        {/* Tab switcher inside sheet */}
        <div className="flex border-b border-slate-800 px-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-500'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-3 pb-safe" style={{ maxHeight: 'calc(75vh - 80px)' }}>
          {content}
        </div>
      </div>
    </>
  );
}
