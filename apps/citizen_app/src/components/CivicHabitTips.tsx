import React from 'react';
import { SEED_TIPS } from '../core/seedData';
import { Language, translations } from '../core/localization';
import { Recycle, Droplets, BellRing, ShieldAlert, Sparkles } from 'lucide-react';

interface CivicHabitTipsProps {
  lang: Language;
}

export const CivicHabitTips: React.FC<CivicHabitTipsProps> = ({ lang }) => {
  const t = translations[lang];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Recycle':
        return <Recycle className="w-5 h-5 text-[#1B7A3F]" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-[#2F6FDE]" />;
      case 'BellRing':
        return <BellRing className="w-5 h-5 text-[#F0873A]" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-[#1B7A3F]" />;
    }
  };

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1B7A3F]" />
          <h3 className="text-sm font-bold text-[#14201A] uppercase tracking-wide">
            {t.habitsTitle}
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#566259]">
          Panchmahal DDO
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
        {SEED_TIPS.map(tip => (
          <div
            key={tip.id}
            className="shrink-0 w-[280px] snap-start bg-white p-4 rounded-[24px] border border-[#DCE5D9] shadow-elev1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-full bg-[#E4F1DF] flex items-center justify-center">
                  {getIcon(tip.icon)}
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9F1E6] text-[#1B7A3F]">
                  {lang === 'gu' ? tip.badgeGu : tip.badgeEn}
                </span>
              </div>
              <h4 className="text-xs font-bold text-[#14201A] leading-snug line-clamp-2">
                {lang === 'gu' ? tip.titleGu : tip.titleEn}
              </h4>
              <p className="text-[11px] text-[#566259] mt-1.5 leading-relaxed line-clamp-3">
                {lang === 'gu' ? tip.descGu : tip.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
