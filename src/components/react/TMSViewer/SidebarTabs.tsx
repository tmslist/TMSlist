'use client';

import { useState, type ReactNode } from 'react';
import { SettingsIcon, ChartIcon, DocumentIcon } from '../Icons';
import type React from 'react';

export type TabId = 'controls' | 'monitor' | 'reference';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'controls', label: 'Controls', icon: <SettingsIcon size={16} /> },
  { id: 'monitor', label: 'Monitor', icon: <ChartIcon size={16} /> },
  { id: 'reference', label: 'Reference', icon: <DocumentIcon size={16} /> },
];

interface SidebarTabsProps {
  controls: ReactNode;
  monitor: ReactNode;
  reference: ReactNode;
  efieldLegend: ReactNode;
}

export function SidebarTabs({ controls, monitor, reference, efieldLegend }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('controls');

  return (
    <div className="flex flex-col h-full">
      {/* E-field legend — always visible above tabs */}
      {efieldLegend}

      {/* Tab bar */}
      <div className="flex border-b border-slate-700/50 mt-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 bg-slate-700/40'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
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
        {activeTab === 'reference' && reference}
      </div>
    </div>
  );
}
