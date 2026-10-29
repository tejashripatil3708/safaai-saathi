import React, { useState, useEffect } from 'react';
import { Ward } from '../types';
import { Language, translations } from '../core/localization';
import { SEED_WARDS } from '../core/seedData';
import { StorageService } from '../services/storageService';
import { GeoService } from '../services/simulationService';
import { MapPin, Globe, Phone, Shield, Check, Navigation, Building2, Download, Smartphone } from 'lucide-react';
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
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
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

  const selectedWard = SEED_WARDS.find(w => w.id === currentWardId) || SEED_WARDS[0];
  const verifiedPhone = StorageService.getVerifiedPhone();

  const handleGpsAutoMatch = () => {
    setGpsDetecting(true);
    setGpsMessage(null);

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
            setGpsMessage(
              lang === 'gu'
                ? `GPS દ્વારા '${matchedWard.nameGu}' સફળતાપૂર્વક મેચ થયું.`
                : `Matched to '${matchedWard.name}' via GPS.`
            );
          }
        },
        _err => {
          setGpsDetecting(false);
          setGpsMessage(
            lang === 'gu'
              ? 'GPS લોકેશન મળ્યું નથી. કૃપા કરી નીચેની યાદીમાંથી વોર્ડ પસંદ કરો.'
              : 'GPS unavailable. Please select your ward manually below.'
          );
        },
        { timeout: 6000 }
      );
    } else {
      setGpsDetecting(false);
      setGpsMessage('Geolocation not supported by this browser.');
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
          {lang === 'gu' ? 'વોર્ડ અને ભાષા સેટિંગ્સ' : 'Ward selection & preferences'}
        </p>
      </div>

      {/* Language Toggle Card */}
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

      {/* Download / Install App Card */}
      <div className="bg-gradient-to-br from-[#111A14] to-[#1E2D24] text-white p-5 rounded-[28px] shadow-elev2 flex flex-col gap-3 border border-[#6DB36F]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#6DB36F]" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'gu' ? 'એપ્લિકેશન ડાઉનલોડ / ઇન્સ્ટોલ કરો' : 'Install Standalone Mobile App'}
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1B7A3F] text-white">
            PWA / APK
          </span>
        </div>

        <p className="text-xs text-[#DCE5D9] leading-relaxed">
          {lang === 'gu'
            ? 'આ એપ્લિકેશનને તમારા ફોનની હોમ સ્ક્રીન પર સીધી ઇન્સ્ટોલ કરો જેથી ઈન્ટરનેટ ધીમું હોય ત્યારે પણ ઝડપથી ખુલે.'
            : 'Install directly to your mobile home screen for instantaneous loading, full screen, and offline alerts.'}
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

      {/* Ward Selection & Auto-Match */}
      <div className="bg-white p-5 rounded-[28px] border border-[#DCE5D9] shadow-elev1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1B7A3F]" />
            <h3 className="text-sm font-bold text-[#14201A]">
              {t.changeWard}
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E4F1DF] text-[#1B7A3F]">
            {selectedWard.code}
          </span>
        </div>

        {/* GPS Auto-Match Button */}
        <button
          onClick={handleGpsAutoMatch}
          disabled={gpsDetecting}
          className="h-12 px-4 rounded-full bg-[#E4F1DF] hover:bg-[#D4E8CE] text-[#1B7A3F] font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
        >
          <Navigation className={`w-4 h-4 ${gpsDetecting ? 'animate-spin' : ''}`} />
          <span>{gpsDetecting ? 'Detecting Location...' : t.autoDetectGps}</span>
        </button>

        {gpsMessage && (
          <p className="text-xs p-2.5 rounded-xl bg-[#F3F6F2] text-[#14201A] font-medium border border-[#DCE5D9]">
            {gpsMessage}
          </p>
        )}

        {/* Ward List */}
        <div className="flex flex-col gap-2 mt-1">
          {SEED_WARDS.map(w => {
            const isSelected = w.id === currentWardId;
            return (
              <button
                key={w.id}
                onClick={() => onWardChange(w.id)}
                className={`p-3.5 rounded-2xl text-left border transition active:scale-[0.99] flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#111A14] text-white border-[#111A14] shadow'
                    : 'bg-[#F3F6F2] text-[#14201A] border-[#DCE5D9] hover:bg-[#E9F1E6]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">
                      {lang === 'gu' ? w.nameGu : w.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : w.type === 'urban'
                          ? 'bg-[#E3EDFF] text-[#1D4FB8]'
                          : 'bg-[#FFEBD9] text-[#B34A0B]'
                      }`}
                    >
                      {w.type === 'urban' ? t.ward : t.gramPanchayat}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? 'text-white/70' : 'text-[#566259]'
                    }`}
                  >
                    {lang === 'gu' ? 'ઇન્સ્પેક્ટર:' : 'Inspector:'} {w.inspectorName} ({w.inspectorPhone})
                  </p>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#6DB36F] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Citizen Info & Helpline */}
      <div className="bg-[#E4F1DF]/80 p-5 rounded-[28px] border border-[#1B7A3F]/30 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#1B7A3F]">
          <Shield className="w-5 h-5" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {lang === 'gu' ? 'જિલ્લા પંચાયત & નગરપાલિકા સહાય' : 'District Governance & Support'}
          </h4>
        </div>
        <p className="text-xs text-[#14201A] leading-relaxed">
          {lang === 'gu'
            ? 'સ્વચ્છતા સાથી એ પંચમહાલ જિલ્લા વિકાસ અધિકારી (DDO) અને ગોધરા નગરપાલિકાનું સત્તાવાર નાગરિક નિરીક્ષણ પ્લેટફોર્મ છે.'
            : 'Official citizen monitoring portal powered by District Development Office (DDO) Panchmahal Godhra.'}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#1B7A3F]/20 text-xs font-bold text-[#14201A]">
          <span>{lang === 'gu' ? 'ટોલ-ફ્રી હેલ્પલાઇન:' : 'Toll-Free Helpline:'}</span>
          <a href={`tel:${CONSTANTS.GODHRA_HELPLINE}`} className="text-[#1B7A3F] font-mono hover:underline">
            {CONSTANTS.GODHRA_HELPLINE}
          </a>
        </div>
      </div>
    </div>
  );
};
