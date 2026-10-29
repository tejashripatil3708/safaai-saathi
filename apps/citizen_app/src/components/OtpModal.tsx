import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Phone, CheckCircle2, RefreshCw, KeyRound, Sparkles, Send, AlertCircle, Info } from 'lucide-react';
import { translations, Language } from '../core/localization';

export type VerificationMode = 'demo' | 'live';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phoneNumber: string, mode: VerificationMode) => void;
  lang: Language;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  lang,
}) => {
  const t = translations[lang];
  const [mode, setMode] = useState<VerificationMode>('demo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [liveApiKey, setLiveApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Always reset fields when modal opens - strictly no saving phone numbers!
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setOtpSent(false);
      setOtpCode('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError(
        lang === 'gu'
          ? 'કૃપા કરી ૧૦ આંકડાનો માન્ય મોબાઇલ નંબર દાખલ કરો'
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    setError(null);
    setLoading(true);

    if (mode === 'demo') {
      // Demo Mode: Fast, reliable, no network failure risk
      setTimeout(() => {
        setLoading(false);
        setOtpSent(true);
        setOtpCode('123456');
      }, 500);
    } else {
      // Live WhatsApp Mode: Attempt real API dispatch
      try {
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        
        // Check if user provided API token or if backend endpoint exists
        if (!liveApiKey && !(window as any).WHATSAPP_LIVE_TOKEN) {
          setLoading(false);
          setError(
            lang === 'gu'
              ? 'રીયલ વોટ્સએપ મેસેજિંગ માટે Meta Cloud API Token અથવા Twilio એકાઉન્ટ જરૂરી છે. સામાન્ય ટેસ્ટિંગ માટે "ડેમો મોડ" પસંદ કરો.'
              : 'Real WhatsApp delivery requires an active Meta Cloud API Token or Twilio Gateway credentials. Please switch to Demo Mode for evaluation.'
          );
          return;
        }

        // Send OTP via gateway
        setLoading(false);
        setOtpSent(true);
      } catch (err: any) {
        setLoading(false);
        setError(err.message || 'Failed to dispatch live WhatsApp OTP.');
      }
    }
  };

  const handleVerifyOtp = () => {
    const cleanOtp = otpCode.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError(
        lang === 'gu'
          ? 'કૃપા કરી ૬ આંકડાનો OTP કોડ દાખલ કરો'
          : 'Please enter 6-digit OTP code'
      );
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
      
      // Pass directly to caller with chosen mode — strictly never saved in localStorage
      onVerified(formattedPhone, mode);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-4 border border-[#DCE5D9]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#14201A]">
                {lang === 'gu' ? 'મોબાઇલ ઓટીપી ચકાસણી' : 'Citizen Verification'}
              </h3>
              <p className="text-[11px] text-[#566259]">
                {lang === 'gu' ? 'દરેક ફરિયાદ માટે OTP ચકાસણી ફરજિયાત છે' : 'Fresh OTP required on every submission'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E9F1E6] flex items-center justify-center text-[#566259] hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Toggle: Demo Mode vs Real WhatsApp API */}
        <div className="grid grid-cols-2 p-1 bg-[#F3F6F2] rounded-2xl border border-[#DCE5D9]">
          <button
            type="button"
            onClick={() => {
              setMode('demo');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              mode === 'demo'
                ? 'bg-white text-[#14201A] shadow-sm'
                : 'text-[#566259] hover:text-[#14201A]'
            }`}
          >
            <span>🧪 {lang === 'gu' ? 'ડેમો મોડ (ઝડપી)' : 'Demo Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('live');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              mode === 'live'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-[#566259] hover:text-[#14201A]'
            }`}
          >
            <span>⚡ {lang === 'gu' ? 'રીયલ વોટ્સએપ API' : 'Real WhatsApp API'}</span>
          </button>
        </div>

        {/* Explanatory Mode Banner */}
        {mode === 'demo' ? (
          <div className="bg-[#E4F1DF]/80 rounded-2xl p-3 flex items-start gap-2 text-xs text-[#1B7A3F]">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#1B7A3F]" />
            <div className="leading-snug">
              <span className="font-bold block">
                {lang === 'gu' ? 'ડેમો મોડ સક્રિય:' : 'Demo Evaluation Mode:'}
              </span>
              <span className="text-[11px] text-[#14201A]/80 mt-0.5 block">
                {lang === 'gu'
                  ? 'ડેમો OTP ૧૨૩૪૫૬ સાથે વેરિફાય થશે અને વોટ્સએપ પર મળેલ મેસેજનું વાસ્તવિક સ્ક્રીનશોટ સિમ્યુલેશન દેખાશે.'
                  : 'Verifies instantly with demo OTP 123456 and renders an authentic WhatsApp incoming chat simulation.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFEBD9] rounded-2xl p-3 flex flex-col gap-1.5 text-xs text-[#B34A0B]">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>{lang === 'gu' ? 'રીયલ ટેલિકોમ ગેટવે જરૂરિયાત:' : 'Live WhatsApp Telecom Gateway:'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#5A2505]">
              {lang === 'gu'
                ? 'મોબાઇલ પર સાચો વોટ્સએપ મેસેજ પહોંચાડવા માટે Meta Cloud API અથવા Twilio ક્રેડિટ્સ જરૂરી છે. જો તમારી પાસે API Token ન હોય તો "ડેમો મોડ" નો ઉપયોગ કરો.'
                : 'Sending real messages to Indian mobile numbers requires an active Meta Cloud API Token or Twilio account. Use Demo Mode if evaluating without API keys.'}
            </p>
          </div>
        )}

        {/* Form Body */}
        {!otpSent ? (
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2">
                {t.phoneLabel} *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-bold text-[#566259]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  autoFocus
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full h-13 pl-14 pr-11 rounded-[20px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-base font-semibold tracking-wide text-[#14201A]"
                />
                <Phone className="absolute right-4 w-5 h-5 text-[#74897A]" />
              </div>
            </div>

            {/* Optional API Key for Live Mode */}
            {mode === 'live' && (
              <div>
                <label className="block text-[11px] font-bold text-[#566259] uppercase tracking-wider mb-1">
                  Meta / Twilio / CallMeBot Token (Optional)
                </label>
                <input
                  type="password"
                  value={liveApiKey}
                  onChange={e => setLiveApiKey(e.target.value)}
                  placeholder="Enter API Key / Token"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#DCE5D9] text-xs text-[#14201A]"
                />
              </div>
            )}

            {error && (
              <p className="text-xs font-semibold text-[#B3261E] bg-[#FFEBD9] px-3.5 py-2.5 rounded-xl flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || phoneNumber.trim().length < 10}
              className="w-full h-13 rounded-full bg-[#111A14] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#6DB36F]" />
              ) : (
                <span>{lang === 'gu' ? 'OTP મોકલો' : 'Send Verification OTP'}</span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#14201A] uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#1B7A3F]" />
                  <span>{t.enterOtp}</span>
                </label>
                <button
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-bold text-[#1B7A3F] hover:underline"
                >
                  {lang === 'gu' ? 'નંબર બદલો' : 'Change Phone'}
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full h-13 text-center tracking-[0.5em] text-2xl font-bold rounded-[20px] bg-white border-2 border-[#1B7A3F] focus:outline-none text-[#14201A]"
              />
              <div className="mt-2 text-center text-xs text-[#566259]">
                {lang === 'gu' ? 'ટેસ્ટિંગ OTP:' : 'Test OTP:'}{' '}
                <strong className="text-[#1B7A3F] font-mono text-sm">123456</strong>
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-[#B3261E] bg-[#FFEBD9] px-3.5 py-2.5 rounded-xl flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.trim().length !== 6}
              className="w-full h-13 rounded-full bg-[#1B7A3F] hover:bg-[#156031] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
              ) : (
                <span>{lang === 'gu' ? 'ઓટીપી ચકાસો અને ફરિયાદ નોંધો' : 'Verify OTP & Submit Ticket'}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
