'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { SettingsIcon, ChartIcon } from '../Icons';
import type React from 'react';

export type TabId = 'controls' | 'monitor';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'controls', label: 'Controls', icon: <SettingsIcon size={16} /> },
  { id: 'monitor', label: 'Stats', icon: <ChartIcon size={16} /> },
];

const STORAGE_KEY = 'tms-sim-active-tab';

interface SidebarTabsProps {
  controls: ReactNode;
  monitor: ReactNode;
  efieldLegend: ReactNode;
}

export function SidebarTabs({ controls, monitor, efieldLegend }: SidebarTabsProps) {
  const [activeTab, setActiveTabState] = useState<TabId>('controls');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'controls' || saved === 'monitor') setActiveTabState(saved);
    } catch {}
  }, []);

  const setActiveTab = (id: TabId) => {
    setActiveTabState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      {/* E-field legend — always visible above tabs */}
      {efieldLegend}

      {/* Tab bar */}
      <div className="flex border-b mt-2" style={{ borderColor: 'rgba(201,101,74,0.2)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-[#C9654A] text-[#D4806A]'
                : 'border-transparent text-white/45 hover:text-white/75'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — scrollable with animation */}
      <div key={activeTab} className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-2 animate-entrance">
        {activeTab === 'controls' && controls}
        {activeTab === 'monitor' && monitor}
      </div>
    </div>
  );
}
