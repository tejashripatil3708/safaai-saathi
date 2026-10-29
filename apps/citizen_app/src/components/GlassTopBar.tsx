import React, { useState, useEffect } from 'react';
import { Ward } from '../types';
import { Language } from '../core/localization';
import { StorageService } from '../services/storageService';
import { MapPin, Globe, Volume2, VolumeX, Download, X, Smartphone, PackageCheck, ExternalLink } from 'lucide-react';

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
  const citizenAddress = StorageService.getCitizenAddress();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowModal(false);
      }
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos) {
        alert(
          lang === 'gu'
            ? 'એપ ઇન્સ્ટોલ કરવા માટે Safari માં Share બટન (⎙) દબાવી "Add to Home Screen" પસંદ કરો.'
            : 'To install the app, tap the Share button in Safari and select "Add to Home Screen".'
        );
      } else {
        alert(
          lang === 'gu'
            ? 'Chrome મેનુ (⋮) માં "Install App" અથવા "Add to Home Screen" દબાવો.'
            : 'Open Chrome menu (⋮) and tap "Install app" or "Add to Home screen".'
        );
      }
    }
  };

  return (
    <>
      <header className="absolute top-4 left-4 right-4 z-30 pointer-events-auto">
        <div className="h-16 rounded-full bg-white/85 backdrop-blur-md px-3.5 flex items-center justify-between shadow-elev2 border border-white/60">
          {/* Left: Place Icon + Address/Area */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 text-left active:scale-95 transition min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center shrink-0 shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 pr-1">
              <h2 className="text-xs font-bold text-[#14201A] truncate max-w-[130px] sm:max-w-[180px]">
                {citizenAddress || (lang === 'gu' ? ward.nameGu : ward.name)}
              </h2>
              <p className="text-[10px] text-[#566259] font-medium truncate">
                Godhra • Panchmahal District
              </p>
            </div>
          </button>

          {/* Right: Sound Alert + Language Switcher + Download/Install App */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="w-9 h-9 rounded-full bg-[#E4F1DF] text-[#1B7A3F] hover:bg-[#d5ebce] flex items-center justify-center transition active:scale-90 shadow-sm"
              title={lang === 'gu' ? 'એપ ડાઉનલોડ / ઇન્સ્ટોલ કરો' : 'Install / Download App'}
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleSound}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 ${
                soundEnabled
                  ? 'bg-[#E4F1DF] text-[#1B7A3F]'
                  : 'bg-[#F3F6F2] text-[#566259]'
              }`}
              title={soundEnabled ? 'Arrival sound on' : 'Arrival sound muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

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

      {/* Download / Install Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#16221B] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9F1E6] dark:border-[#2A3B31]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center font-bold">
                  🌱
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14201A] dark:text-[#EAF2E6]">
                    {lang === 'gu' ? 'સફાઈ સાથી ડાઉનલોડ' : 'Download Safai Saathi'}
                  </h3>
                  <p className="text-[10px] text-[#566259] dark:text-[#9DB0A2]">
                    Panchmahal Godhra Citizen App
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6F2] dark:bg-[#203126] flex items-center justify-center text-[#566259]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Install to device */}
            <button
              onClick={handleInstallClick}
              className="w-full p-3.5 rounded-2xl bg-[#1B7A3F] hover:bg-[#156031] text-white flex items-center gap-3 active:scale-[0.98] transition shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">
                  {lang === 'gu' ? 'મોબાઇલમાં ઇન્સ્ટોલ કરો' : 'Install to Home Screen'}
                </div>
                <div className="text-[10px] text-white/80 mt-0.5 truncate">
                  {lang === 'gu' ? 'PWA એપ તરીકે સેવ કરો' : 'Runs like a native mobile app'}
                </div>
              </div>
            </button>

            {/* Option 2: Download Offline ZIP */}
            <a
              href="./safai-saathi-web-app.zip"
              download="safai-saathi-web-app.zip"
              className="w-full p-3.5 rounded-2xl bg-[#F3F6F2] dark:bg-[#1E2E23] hover:bg-[#E9F1E6] text-[#14201A] dark:text-[#EAF2E6] flex items-center gap-3 active:scale-[0.98] transition border border-[#DCE5D9] dark:border-[#2A3B31]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E4F1DF] dark:bg-[#2A4433] text-[#1B7A3F] flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">
                  {lang === 'gu' ? 'ઓફલાઇન ZIP ડાઉનલોડ કરો' : 'Download Offline App ZIP'}
                </div>
                <div className="text-[10px] text-[#566259] dark:text-[#9DB0A2] mt-0.5">
                  164 KB • Ready to host anywhere
                </div>
              </div>
              <Download className="w-4 h-4 text-[#74897A]" />
            </a>

            {/* Hint for browser menu install */}
            <div className="bg-[#E9F1E6]/60 dark:bg-[#1A281F] p-3 rounded-xl text-[11px] text-[#566259] dark:text-[#9DB0A2] leading-relaxed">
              💡 {lang === 'gu'
                ? 'ક્રોમ બ્રાઉઝરના મેનુ (⋮) માં "Install App" અથવા "Add to Home screen" દબાવીને પણ ઇન્સ્ટોલ કરી શકાય છે.'
                : 'You can also tap the Chrome menu (⋮) and choose "Install Safai Saathi" or "Add to Home screen".'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
