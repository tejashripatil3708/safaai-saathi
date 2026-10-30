import React, { useState } from 'react';
import { Language, translations } from '../core/localization';
import { StorageService } from '../services/storageService';
import { GeoService } from '../services/simulationService';
import { AppTheme } from '../types';
import { Globe, Shield, Check, Navigation, Home, Moon, Sun, Monitor, HelpCircle, Sparkles } from 'lucide-react';

interface SettingsViewProps {
  currentWardId: string;
  onWardChange: (wardId: string) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenIntro: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentWardId,
  onWardChange,
  lang,
  onLanguageChange,
  theme,
  onThemeChange,
  onOpenIntro,
}) => {
  const t = translations[lang];

  const [addressInput, setAddressInput] = useState(StorageService.getCitizenAddress());
  const [addressSavedMsg, setAddressSavedMsg] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const handleSaveAddress = () => {
    if (!addressInput.trim()) return;
    StorageService.setCitizenAddress(addressInput.trim());
    setAddressSavedMsg(true);
    setTimeout(() => setAddressSavedMsg(false), 2500);
  };

  const handleGpsAutoMatch = () => {
    setGpsDetecting(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          const realAddr = await GeoService.reverseGeocode(coords);
          const matchedWard = GeoService.findWardByLocation(coords);
          setGpsDetecting(false);

          if (matchedWard) {
            onWardChange(matchedWard.id);
          }
          const detectedArea = realAddr || (matchedWard ? `${matchedWard.name.split('-')[1]?.trim() || matchedWard.name}, Godhra` : 'Polan Bazar, Godhra');
          setAddressInput(detectedArea);
          StorageService.setCitizenAddress(detectedArea, matchedWard?.id);
          setAddressSavedMsg(true);
          setTimeout(() => setAddressSavedMsg(false), 3500);
        },
        _err => {
          setGpsDetecting(false);
          alert(
            lang === 'gu'
              ? 'GPS લોકેશન મેળવી શકાયું નથી. કૃપા કરી નીચે તમારું સરનામું લખો.'
              : 'GPS unavailable. Please type your street/house address manually.'
          );
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsDetecting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-5 pb-28 gap-5 max-w-lg mx-auto">
      {/* Title */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#14201A] dark:text-[#EAF2E6] tracking-tight">
            {t.settings}
          </h1>
          <p className="text-xs text-[#566259] dark:text-[#9DB0A2] mt-1">
            {lang === 'gu' ? 'સરનામું, થીમ અને પસંદગીઓ' : 'Residence address, theme & preferences'}
          </p>
        </div>
        <img
          src="./logo.png"
          alt="Safaai Saathi"
          className="w-12 h-12 rounded-2xl shadow-sm border border-[#DCE5D9] dark:border-[#2A3B31] object-cover bg-white"
        />
      </div>

      {/* 1. Address / Locality Setup */}
      <div className="bg-white dark:bg-[#16221B] p-5 rounded-[28px] border border-[#DCE5D9] dark:border-[#2A3B31] shadow-elev1 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#1B7A3F] dark:text-[#6DB36F]" />
            <h3 className="text-sm font-bold text-[#14201A] dark:text-[#EAF2E6]">
              {t.myAddressTitle}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#1B7A3F] dark:text-[#6DB36F] bg-[#E4F1DF] dark:bg-[#1F3A2A] px-2.5 py-0.5 rounded-full">
            Godhra Citizen
          </span>
        </div>

        <p className="text-xs text-[#566259] dark:text-[#9DB0A2]">
          {lang === 'gu'
            ? 'તમારું ઘર અથવા શેરીનું સરનામું ઉમેરો જેથી કચરા કલેક્શન અને ફરિયાદ નિવારણ ચોક્કસ થાય.'
            : 'Add your home or street address to route sanitation vehicles and complaints accurately.'}
        </p>

        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            placeholder={t.addressPlaceholder}
            className="w-full h-13 px-4 rounded-[18px] bg-white dark:bg-[#0E1612] border-2 border-[#74897A] dark:border-[#5F7A68] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A] dark:text-[#EAF2E6]"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSaveAddress}
              className="flex-1 h-11 rounded-full bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] text-xs font-bold active:scale-95 transition shadow"
            >
              {t.saveAddress}
            </button>

            <button
              onClick={handleGpsAutoMatch}
              disabled={gpsDetecting}
              className="h-11 px-4 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
              title="Detect via GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} />
              <span>{gpsDetecting ? 'Detecting...' : t.autoDetectGps}</span>
            </button>
          </div>

          {addressSavedMsg && (
            <p className="text-xs p-2.5 rounded-xl bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{t.addressSaved}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Theme Setting Card (Dark / Light / System) */}
      <div className="bg-white dark:bg-[#16221B] p-5 rounded-[28px] border border-[#DCE5D9] dark:border-[#2A3B31] shadow-elev1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-[#6DB36F]" />
          ) : theme === 'light' ? (
            <Sun className="w-5 h-5 text-[#F0873A]" />
          ) : (
            <Monitor className="w-5 h-5 text-[#1B7A3F]" />
          )}
          <h3 className="text-sm font-bold text-[#14201A] dark:text-[#EAF2E6]">
            {t.theme.title}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-1">
          {/* Light */}
          <button
            onClick={() => onThemeChange('light')}
            className={`h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              theme === 'light'
                ? 'bg-[#111A14] text-white shadow'
                : 'bg-[#F3F6F2] dark:bg-[#1E2D24] text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#6DB36F]" />}
          </button>

          {/* Dark */}
          <button
            onClick={() => onThemeChange('dark')}
            className={`h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              theme === 'dark'
                ? 'bg-[#6DB36F] text-[#111A14] shadow'
                : 'bg-[#F3F6F2] dark:bg-[#1E2D24] text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#111A14]" />}
          </button>

          {/* System */}
          <button
            onClick={() => onThemeChange('system')}
            className={`h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              theme === 'system'
                ? 'bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] shadow'
                : 'bg-[#F3F6F2] dark:bg-[#1E2D24] text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>System</span>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#6DB36F]" />}
          </button>
        </div>
      </div>

      {/* 3. Language Toggle Card */}
      <div className="bg-white dark:bg-[#16221B] p-5 rounded-[28px] border border-[#DCE5D9] dark:border-[#2A3B31] shadow-elev1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#1B7A3F] dark:text-[#6DB36F]" />
          <h3 className="text-sm font-bold text-[#14201A] dark:text-[#EAF2E6]">
            {lang === 'gu' ? 'એપ્લિકેશન ભાષા / Language' : 'Application Language'}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => onLanguageChange('gu')}
            className={`h-12 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              lang === 'gu'
                ? 'bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] shadow'
                : 'bg-[#F3F6F2] dark:bg-[#1E2D24] text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]'
            }`}
          >
            <span>ગુજરાતી (Gujarati)</span>
            {lang === 'gu' && <Check className="w-4 h-4 text-[#6DB36F]" />}
          </button>

          <button
            onClick={() => onLanguageChange('en')}
            className={`h-12 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              lang === 'en'
                ? 'bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] shadow'
                : 'bg-[#F3F6F2] dark:bg-[#1E2D24] text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]'
            }`}
          >
            <span>English</span>
            {lang === 'en' && <Check className="w-4 h-4 text-[#6DB36F]" />}
          </button>
        </div>
      </div>

      {/* 4. App Introduction Replay Option */}
      <button
        onClick={onOpenIntro}
        className="bg-white dark:bg-[#16221B] p-4 rounded-[24px] border border-[#DCE5D9] dark:border-[#2A3B31] shadow-elev1 flex items-center justify-between text-left hover:border-[#1B7A3F]/50 transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
              {t.intro.revisitIntro}
            </h4>
            <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2]">
              {lang === 'gu' ? 'એપ્લિકેશનના મુખ્ય ફિચર્સનો પરિચય' : 'View the guided feature walkthrough'}
            </p>
          </div>
        </div>
      </button>

      {/* 5. Municipal Authority Governance Note */}
      <div className="bg-[#E4F1DF]/80 dark:bg-[#1F3A2A]/80 p-5 rounded-[28px] border border-[#1B7A3F]/30 dark:border-[#6DB36F]/30 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[#1B7A3F] dark:text-[#6DB36F]">
          <Shield className="w-5 h-5" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {lang === 'gu' ? 'પંચમહાલ જિલ્લા વહીવટી તંત્ર' : 'District Administration Panchmahal'}
          </h4>
        </div>
        <p className="text-xs text-[#14201A] dark:text-[#EAF2E6] leading-relaxed">
          {lang === 'gu'
            ? 'સ્વચ્છતા સાથી એ ગોધરા નગરપાલિકા અને જિલ્લા પંચાયતનું સત્તાવાર પ્લેટફોર્મ છે. તમામ ફરિયાદો ૨૪-૪૮ કલાકના SLA હેઠળ મોનિટર થાય છે.'
            : 'Official civic platform for Godhra Nagarpalika and District Panchayat. All tickets are bound by a 24-48 hour resolution SLA.'}
        </p>
      </div>

      {/* 6. Demo Environment & Cloud Sync Status (Transparency for Hackathon Jury) */}
      <div className="bg-[#F3F6F2] dark:bg-[#1A261F] p-4 rounded-[24px] border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#566259] dark:text-[#9DB0A2]">
            {lang === 'gu' ? 'ડેમો સ્થિતિ અને ક્લાઉડ કનેક્શન' : 'Demo Mode & Cloud Sync Status'}
          </span>
          <span className="text-[10px] font-mono font-bold bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] px-2 py-0.5 rounded-full">
            safai-saathi-panchmahal
          </span>
        </div>
        <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2] leading-relaxed">
          {lang === 'gu'
            ? 'લાઇવ GPS, કેમેરા વૉટરમાર્ક અને ઑફલાઇન સંગ્રહ ઉપકરણ પર કાર્યરત છે. મૂલ્યાંકન સરળતા માટે OTP (123456) અને વાન માર્ગ સિમ્યુલેટેડ છે.'
            : 'Live GPS, camera watermarks, and offline storage run on-device. Evaluation OTP (123456) and van routes are simulated for reproducible hackathon judging.'}
        </p>
      </div>
    </div>
  );
};
