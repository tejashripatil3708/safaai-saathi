import React from 'react';
import { Ward } from '../types';
import { Language } from '../core/localization';
import { MapPin, Globe, Bell, Volume2, VolumeX } from 'lucide-react';

interface GlassTopBarProps {
  ward: Ward;
  lang: Language;
  onToggleLang: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const GlassTopBar: React.FC<GlassTopBarProps> = ({
  ward,
  lang,
  onToggleLang,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 z-30 pointer-events-auto">
      <div className="h-16 rounded-full bg-white/85 backdrop-blur-md px-3.5 flex items-center justify-between shadow-elev2 border border-white/60">
        {/* Left: Round 48 Place Icon + Two-line title */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 text-left active:scale-95 transition"
        >
          <div className="w-10 h-10 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center shrink-0 shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-1">
            <h2 className="text-xs font-bold text-[#14201A] truncate max-w-[150px] sm:max-w-[200px]">
              {lang === 'gu' ? ward.nameGu : ward.name}
            </h2>
            <p className="text-[10px] text-[#566259] font-medium truncate">
              {ward.code} • {ward.type === 'urban' ? 'Godhra Nagarpalika' : 'Gram Panchayat'}
            </p>
          </div>
        </button>

        {/* Right: Round action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sound alert toggle */}
          <button
            onClick={onToggleSound}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 ${
              soundEnabled
                ? 'bg-[#E4F1DF] text-[#1B7A3F]'
                : 'bg-[#F3F6F2] text-[#566259]'
            }`}
            title={soundEnabled ? 'Arrival chime on' : 'Arrival chime muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={onToggleLang}
            className="h-9 px-3 rounded-full bg-[#111A14] hover:bg-black text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#6DB36F]" />
            <span>{lang === 'gu' ? 'EN' : 'ગુજ'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
