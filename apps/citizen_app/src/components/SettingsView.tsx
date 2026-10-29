import React, { useState, useEffect } from 'react';
import { Language, translations } from '../core/localization';
import { StorageService } from '../services/storageService';
import { GeoService } from '../services/simulationService';
import { SEED_WARDS } from '../core/seedData';
import { Globe, Shield, Check, Navigation, Home, Download, Smartphone, MapPin } from 'lucide-react';
import { CONSTANTS } from '../core/constants';

interface SettingsViewProps {
  currentWardId: string;
  onWardChange: (wardId: string) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentWardId,
  onWardChange,
  lang,
  onLanguageChange,
}) => {
  const t = translations[lang];

  const [addressInput, setAddressInput] = useState(StorageService.getCitizenAddress());
  const [addressSavedMsg, setAddressSavedMsg] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

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
        pos => {
          const matchedWard = GeoService.findWardByLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsDetecting(false);
          if (matchedWard) {
            onWardChange(matchedWard.id);
            const detectedArea = `${matchedWard.name.split('-')[1]?.trim() || matchedWard.name}, Godhra`;
            setAddressInput(detectedArea);
            StorageService.setCitizenAddress(detectedArea, matchedWard.id);
            setAddressSavedMsg(true);
            setTimeout(() => setAddressSavedMsg(false), 3000);
          }
        },
        _err => {
          setGpsDetecting(false);
          alert(
            lang === 'gu'
              ? 'GPS લોકેશન મેળવી શકાયું નથી. કૃપા કરી નીચે તમારું સરનામું લખો.'
              : 'GPS unavailable. Please type your street/house address manually.'
          );
        },
        { timeout: 6000 }
      );
    } else {
      setGpsDetecting(false);
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert(
        lang === 'gu'
          ? 'તમારા બ્રાઉઝર મેનૂમાંથી "Add to Home Screen" અથવા "Install" પર ક્લિક કરો.'
          : 'Tap your browser menu (⋮) and select "Add to Home screen" or "Install App".'
      );
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-5 pb-28 gap-5 max-w-lg mx-auto">
      {/* Title */}
      <div className="pt-2">
        <h1 className="text-3xl font-light text-[#14201A] tracking-tight">
          {t.settings}
        </h1>
        <p className="text-xs text-[#566259] mt-1">
          {lang === 'gu' ? 'સરનામું અને સામાન્ય પસંદગીઓ' : 'Residence address & preferences'}
        </p>
      </div>

      {/* 1. Address / Locality Setup (No raw ward dropdown) */}
      <div className="bg-white p-5 rounded-[28px] border border-[#DCE5D9] shadow-elev1 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#1B7A3F]" />
            <h3 className="text-sm font-bold text-[#14201A]">
              {t.myAddressTitle}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#1B7A3F] bg-[#E4F1DF] px-2.5 py-0.5 rounded-full">
            Godhra Citizen
          </span>
        </div>

        <p className="text-xs text-[#566259]">
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
            className="w-full h-13 px-4 rounded-[18px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A]"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSaveAddress}
              className="flex-1 h-11 rounded-full bg-[#111A14] text-white text-xs font-bold active:scale-95 transition shadow"
            >
              {t.saveAddress}
            </button>

            <button
              onClick={handleGpsAutoMatch}
              disabled={gpsDetecting}
              className="h-11 px-4 rounded-full bg-[#E4F1DF] text-[#1B7A3F] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
              title="Detect via GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} />
              <span>{gpsDetecting ? 'Detecting...' : t.autoDetectGps}</span>
            </button>
          </div>

          {addressSavedMsg && (
            <p className="text-xs p-2.5 rounded-xl bg-[#E4F1DF] text-[#1B7A3F] font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{t.addressSaved}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Language Toggle Card */}
      <div className="bg-white p-5 rounded-[28px] border border-[#DCE5D9] shadow-elev1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#1B7A3F]" />
          <h3 className="text-sm font-bold text-[#14201A]">
            {lang === 'gu' ? 'એપ્લિકેશન ભાષા / Language' : 'Application Language'}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => onLanguageChange('gu')}
            className={`h-12 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              lang === 'gu'
                ? 'bg-[#111A14] text-white shadow'
                : 'bg-[#F3F6F2] text-[#14201A] border border-[#DCE5D9]'
            }`}
          >
            <span>ગુજરાતી (Gujarati)</span>
            {lang === 'gu' && <Check className="w-4 h-4 text-[#6DB36F]" />}
          </button>

          <button
            onClick={() => onLanguageChange('en')}
            className={`h-12 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              lang === 'en'
                ? 'bg-[#111A14] text-white shadow'
                : 'bg-[#F3F6F2] text-[#14201A] border border-[#DCE5D9]'
            }`}
          >
            <span>English</span>
            {lang === 'en' && <Check className="w-4 h-4 text-[#6DB36F]" />}
          </button>
        </div>
      </div>

      {/* 3. Download / Install App Card */}
      <div className="bg-gradient-to-br from-[#111A14] to-[#1E2D24] text-white p-5 rounded-[28px] shadow-elev2 flex flex-col gap-3 border border-[#6DB36F]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#6DB36F]" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'gu' ? 'એપ્લિકેશન ડાઉનલોડ / ઇન્સ્ટોલ કરો' : 'Install Standalone Mobile App'}
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1B7A3F] text-white">
            PWA / Mobile
          </span>
        </div>

        <p className="text-xs text-[#DCE5D9] leading-relaxed">
          {lang === 'gu'
            ? 'આ એપ્લિકેશનને તમારા ફોનની હોમ સ્ક્રીન પર સીધી ઇન્સ્ટોલ કરો જેથી ઈન્ટરનેટ ધીમું હોય ત્યારે પણ ઝડપથી ખુલે.'
            : 'Install directly to your mobile home screen for instantaneous loading and offline access.'}
        </p>

        <button
          onClick={handleInstallApp}
          className="h-12 rounded-full bg-[#6DB36F] hover:bg-[#5FA361] text-[#111A14] font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
        >
          <Download className="w-4 h-4 text-[#111A14]" />
          <span>
            {isAppInstalled
              ? (lang === 'gu' ? '✓ એપ ઇન્સ્ટોલ કરેલ છે' : '✓ App Installed')
              : (lang === 'gu' ? 'મોબાઇલમાં ઇન્સ્ટોલ કરો' : 'Install App to Phone')}
          </span>
        </button>
      </div>

      {/* 4. Municipal Authority Governance Note (No personal inspector phone numbers) */}
      <div className="bg-[#E4F1DF]/80 p-5 rounded-[28px] border border-[#1B7A3F]/30 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[#1B7A3F]">
          <Shield className="w-5 h-5" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {lang === 'gu' ? 'પંચમહાલ જિલ્લા વહીવટી તંત્ર' : 'District Administration Panchmahal'}
          </h4>
        </div>
        <p className="text-xs text-[#14201A] leading-relaxed">
          {lang === 'gu'
            ? 'સ્વચ્છતા સાથી એ ગોધરા નગરપાલિકા અને જિલ્લા પંચાયતનું સત્તાવાર પ્લેટફોર્મ છે. તમામ ફરિયાદો ૨૪-૪૮ કલાકના SLA હેઠળ મોનિટર થાય છે.'
            : 'Official civic platform for Godhra Nagarpalika and District Panchayat. All tickets are bound by a 24-48 hour resolution SLA.'}
        </p>
      </div>
    </div>
  );
};
