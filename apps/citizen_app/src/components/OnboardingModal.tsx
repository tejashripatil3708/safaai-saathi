import React, { useState, useEffect } from 'react';
import { translations, Language } from '../core/localization';
import { StorageService } from '../services/storageService';
import { GeoService } from '../services/simulationService';
import { Sparkles, MapPin, Camera, Clock, ArrowRight, ArrowLeft, CheckCircle2, Shield, Navigation, Globe, X } from 'lucide-react';
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Always reset to the very first slide whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setAddressInput(StorageService.getCitizenAddress());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
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
        async pos => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const realAddr = await GeoService.reverseGeocode(coords);
          const matchedWard = GeoService.findWardByLocation(coords);
          const finalAddr = realAddr || (matchedWard ? `${matchedWard.name.split('-')[1]?.trim() || matchedWard.name}, Godhra` : 'Polan Bazar / Station Road, Godhra');
          setAddressInput(finalAddr);
          StorageService.setCitizenAddress(finalAddr, matchedWard?.id);
        },
        _err => {
          setAddressInput('Polan Bazar / Station Road, Godhra');
          StorageService.setCitizenAddress('Polan Bazar / Station Road, Godhra');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -50) {
      // Swiped right -> prev
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div 
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="w-full max-w-md bg-white dark:bg-[#16221B] rounded-[32px] overflow-hidden shadow-2xl border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col justify-between min-h-[520px]"
      >
        {/* Top Header & Language Toggle & Skip */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F]">
              {t.intro.badge} ({currentStep + 1}/{totalSteps})
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

        {/* Carousel Content Body - Scrollable */}
        <div className="px-6 py-4 flex-1 flex flex-col items-center justify-center text-center overflow-y-auto max-h-[380px]">
          {currentStep === 0 && (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
              <img
                src="./logo.png"
                alt="Safaai Saathi"
                className="w-24 h-24 rounded-3xl shadow-lg border-2 border-white object-cover bg-white"
              />
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

        {/* Stepper Dots & Navigation Buttons */}
        <div className="p-6 pt-0 flex flex-col gap-4">
          {/* Clickable Stepper Dots */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                  currentStep === idx
                    ? 'w-7 bg-[#1B7A3F] dark:bg-[#6DB36F]'
                    : 'w-2.5 bg-[#DCE5D9] dark:bg-[#2A3B31] hover:bg-[#74897A]'
                }`}
                title={`Go to step ${idx + 1}`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons: Back + Next */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="h-14 px-5 rounded-full bg-[#F3F6F2] dark:bg-[#1E2D24] text-[#14201A] dark:text-[#EAF2E6] font-bold text-sm flex items-center justify-center gap-1.5 border border-[#DCE5D9] dark:border-[#2A3B31] active:scale-95 transition hover:bg-[#E4F1DF] dark:hover:bg-[#2A3B31]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'gu' ? 'પાછળ' : 'Back'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-14 rounded-full bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] font-bold text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition hover:opacity-90"
            >
              <span>{currentStep === totalSteps - 1 ? t.intro.startNow : t.intro.next}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
