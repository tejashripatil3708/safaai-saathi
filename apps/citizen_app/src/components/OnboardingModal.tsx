import React, { useState } from 'react';
import { translations, Language } from '../core/localization';
import { StorageService } from '../services/storageService';
import { Sparkles, MapPin, Camera, Clock, ArrowRight, CheckCircle2, Shield, Navigation, Globe, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];
  const [currentStep, setCurrentStep] = useState(0);
  const [addressInput, setAddressInput] = useState(StorageService.getCitizenAddress());

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (addressInput.trim()) {
      StorageService.setCitizenAddress(addressInput.trim());
    }
    StorageService.setHasSeenIntro(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1B7A3F', '#6DB36F', '#F0873A'],
    });
    onClose();
  };

  const handleSkip = () => {
    StorageService.setHasSeenIntro(true);
    onClose();
  };

  const handleGpsDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        _pos => {
          setAddressInput('Polan Bazar / Station Road, Godhra');
          StorageService.setCitizenAddress('Polan Bazar / Station Road, Godhra');
        },
        _err => {}
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#16221B] rounded-[32px] overflow-hidden shadow-2xl border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col justify-between min-h-[520px]">
        {/* Top Header & Language Toggle & Skip */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F]">
              {t.intro.badge}
            </span>
            {/* Gujarati <-> English Language Switcher */}
            <button
              onClick={onToggleLang}
              className="h-7 px-2.5 rounded-full bg-[#111A14] hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
              title="Switch Language / ભાષા બદલો"
            >
              <Globe className="w-3 h-3 text-[#6DB36F]" />
              <span>{lang === 'gu' ? 'EN' : 'ગુજ'}</span>
            </button>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-[#566259] dark:text-[#9DB0A2] hover:underline"
          >
            {t.intro.skip}
          </button>
        </div>

        {/* Carousel Content Body */}
        <div className="px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
          {currentStep === 0 && (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-24 h-24 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] flex items-center justify-center text-5xl shadow-sm">
                🌱
              </div>
              <h2 className="text-2xl font-bold text-[#14201A] dark:text-[#EAF2E6] leading-tight">
                {t.intro.welcomeTitle}
              </h2>
              <p className="text-xs text-[#566259] dark:text-[#9DB0A2] max-w-xs leading-relaxed">
                {t.intro.welcomeSubtitle}
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] flex items-center justify-center">
                <MapPin className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-[#14201A] dark:text-[#EAF2E6] leading-tight">
                {t.intro.slide1Title}
              </h2>
              <p className="text-xs text-[#566259] dark:text-[#9DB0A2] max-w-xs leading-relaxed">
                {t.intro.slide1Desc}
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-[#FFEBD9] dark:bg-[#3A2414] text-[#F0873A] flex items-center justify-center">
                <Camera className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-[#14201A] dark:text-[#EAF2E6] leading-tight">
                {t.intro.slide2Title}
              </h2>
              <p className="text-xs text-[#566259] dark:text-[#9DB0A2] max-w-xs leading-relaxed">
                {t.intro.slide2Desc}
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 w-full">
              <div className="w-16 h-16 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-[#14201A] dark:text-[#EAF2E6]">
                {t.intro.slide3Title}
              </h2>
              <p className="text-xs text-[#566259] dark:text-[#9DB0A2] max-w-xs leading-relaxed mb-1">
                {t.intro.slide3Desc}
              </p>

              {/* Quick Address Setup */}
              <div className="w-full bg-[#F3F6F2] dark:bg-[#1E2D24] p-3.5 rounded-2xl border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col gap-2 text-left">
                <label className="text-[11px] font-bold text-[#14201A] dark:text-[#EAF2E6] flex items-center justify-between">
                  <span>{t.myAddressTitle}</span>
                  <button
                    type="button"
                    onClick={handleGpsDetect}
                    className="text-[10px] text-[#1B7A3F] dark:text-[#6DB36F] font-bold flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>GPS Auto</span>
                  </button>
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  placeholder={t.addressPlaceholder}
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-[#16221B] border border-[#74897A] dark:border-[#5F7A68] text-xs text-[#14201A] dark:text-[#EAF2E6] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stepper Dots & Next Button */}
        <div className="p-6 pt-0 flex flex-col gap-4">
          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === idx
                    ? 'w-6 bg-[#1B7A3F] dark:bg-[#6DB36F]'
                    : 'w-2 bg-[#DCE5D9] dark:bg-[#2A3B31]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full h-14 rounded-full bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] font-bold text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
          >
            <span>{currentStep === totalSteps - 1 ? t.intro.startNow : t.intro.next}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
