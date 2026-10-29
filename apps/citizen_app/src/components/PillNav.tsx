import React from 'react';
import { Map, Inbox, Settings } from 'lucide-react';
import { Language } from '../core/localization';

export type NavTab = 'map' | 'complaints' | 'settings';

interface PillNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  complaintsCount: number;
  lang: Language;
}

export const PillNav: React.FC<PillNavProps> = ({
  currentTab,
  onSelectTab,
  complaintsCount,
}) => {
  return (
    <nav className="fixed bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
      <div className="h-16 bg-white dark:bg-[#16221B] rounded-full shadow-elev2 border border-[#DCE5D9] dark:border-[#2A3B31] p-1.5 flex items-center gap-2 pointer-events-auto">
        {/* 1. Map Tab */}
        <button
          onClick={() => onSelectTab('map')}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
            currentTab === 'map'
              ? 'bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] shadow-md'
              : 'text-[#566259] dark:text-[#9DB0A2] hover:bg-[#F3F6F2] dark:hover:bg-[#1E2D24]'
          }`}
          aria-label="Map"
        >
          <Map className="w-6 h-6" />
        </button>

        {/* 2. Complaints Tab with Badge */}
        <button
          onClick={() => onSelectTab('complaints')}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
            currentTab === 'complaints'
              ? 'bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] shadow-md'
              : 'text-[#566259] dark:text-[#9DB0A2] hover:bg-[#F3F6F2] dark:hover:bg-[#1E2D24]'
          }`}
          aria-label="My Complaints"
        >
          <Inbox className="w-6 h-6" />
          {complaintsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#B34A0B] text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-[#16221B] shadow">
              {complaintsCount}
            </span>
          )}
        </button>

        {/* 3. Settings Tab */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
            currentTab === 'settings'
              ? 'bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] shadow-md'
              : 'text-[#566259] dark:text-[#9DB0A2] hover:bg-[#F3F6F2] dark:hover:bg-[#1E2D24]'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};
