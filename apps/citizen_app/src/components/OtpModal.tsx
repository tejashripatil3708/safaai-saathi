import React, { useState } from 'react';
import { X, ShieldCheck, Phone, CheckCircle2, RefreshCw } from 'lucide-react';
import { translations, Language } from '../core/localization';
import { StorageService } from '../services/storageService';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phoneNumber: string) => void;
  lang: Language;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  lang,
}) => {
  const t = translations[lang];
  const [phoneNumber, setPhoneNumber] = useState(StorageService.getVerifiedPhone() || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError(lang === 'gu' ? 'કૃપા કરી ૧૦ આંકડાનો માન્ય નંબર દાખલ કરો' : 'Please enter a valid 10-digit phone number');
      return;
    }
    setError(null);
    setLoading(true);

    // Simulate OTP dispatch (with test OTP 123456)
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      // Pre-fill demo OTP for fast hackathon judging
      setOtpCode('123456');
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim().length !== 6) {
      setError(lang === 'gu' ? 'કૃપા કરી ૬ આંકડાનો OTP દાખલ કરો' : 'Please enter 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber}`;
      StorageService.setVerifiedPhone(formattedPhone);
      onVerified(formattedPhone);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-5 border border-[#DCE5D9]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#14201A]">
                {lang === 'gu' ? 'મોબાઇલ ઓટીપી ચકાસણી' : 'Citizen Phone Verification'}
              </h3>
              <p className="text-xs text-[#566259]">
                {lang === 'gu' ? 'ફરિયાદ સબમિશન અને વોટ્સએપ અપડેટ માટે' : 'For official ticket updates on WhatsApp'}
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

        {/* Form Body */}
        {!otpSent ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14201A] uppercase tracking-wider mb-2">
                {t.phoneLabel}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-semibold text-[#566259]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber.replace('+91', '').trim()}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full h-14 pl-14 pr-4 rounded-[20px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-base font-semibold tracking-wide text-[#14201A]"
                />
                <Phone className="absolute right-4 w-5 h-5 text-[#74897A]" />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-[#B3261E] bg-[#FFEBD9] px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <div className="bg-[#E4F1DF]/70 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#1B7A3F]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {lang === 'gu'
                  ? 'ફરિયાદ નોંધાયા બાદ તમને આપોઆપ ટિકિટ અને અધિકારીનું સ્ટેટસ વોટ્સએપ પર મળશે.'
                  : 'Automated ticket ID & inspector progress will be dispatched to this WhatsApp number.'}
              </span>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full h-14 rounded-full bg-[#111A14] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#6DB36F]" />
              ) : (
                <span>{t.sendOtp}</span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#14201A] uppercase tracking-wider">
                  {t.enterOtp}
                </label>
                <button
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-semibold text-[#1B7A3F] hover:underline"
                >
                  {lang === 'gu' ? 'નંબર બદલો' : 'Change Phone'}
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full h-14 text-center tracking-[0.5em] text-2xl font-bold rounded-[20px] bg-white border-2 border-[#1B7A3F] focus:outline-none text-[#14201A]"
              />
              <p className="text-xs text-[#566259] text-center mt-2">
                {lang === 'gu' ? 'ડેમો OTP:' : 'Demo OTP:'} <strong className="text-[#1B7A3F]">123456</strong>
              </p>
            </div>

            {error && (
              <p className="text-xs font-medium text-[#B3261E] bg-[#FFEBD9] px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full h-14 rounded-full bg-[#1B7A3F] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
              ) : (
                <span>{t.verifyOtp}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
