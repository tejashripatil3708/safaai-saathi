import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Phone, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';
import { translations, Language } from '../core/localization';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSendOtp = () => {
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

    // Instant demo OTP dispatch
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setOtpCode(''); // Let user type 123456
    }, 400);
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

    // Strict validation: must match official demo OTP '123456'
    if (cleanOtp !== '123456') {
      setError(
        lang === 'gu'
          ? 'અમાન્ય OTP કોડ! કૃપા કરી સાચો કોડ (123456) દાખલ કરો.'
          : 'Invalid OTP code! Please enter the correct code (123456).'
      );
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
      
      onVerified(formattedPhone);
      onClose();
    }, 300);
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
                {lang === 'gu' ? 'દરેક ફરિયાદ માટે OTP ચકાસણી જરૂરી છે' : 'Mandatory OTP verification on every report'}
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
                  className="w-full h-14 pl-14 pr-11 rounded-[20px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-base font-semibold tracking-wide text-[#14201A]"
                />
                <Phone className="absolute right-4 w-5 h-5 text-[#74897A]" />
              </div>
            </div>

            <div className="bg-[#E4F1DF]/70 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#1B7A3F]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold block">
                  {lang === 'gu' ? 'સત્તાવાર સંચાર હેતુ:' : 'Resolution Communication:'}
                </span>
                <span className="text-[11px] text-[#14201A]/80 mt-0.5 block">
                  {lang === 'gu'
                    ? 'તમારો નંબર સુરક્ષિત રીતે ફરિયાદ સાથે જોડવામાં આવશે જેથી નગરપાલિકા અધિકારીઓ ફરિયાદ નિવારણ માટે સંપર્ક કરી શકે.'
                    : 'Your number is securely attached to this ticket so municipal officers can reach you regarding resolution updates.'}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-[#B3261E] bg-[#FFEBD9] px-3.5 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || phoneNumber.trim().length < 10}
              className="w-full h-14 rounded-full bg-[#111A14] hover:bg-black text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#6DB36F]" />
              ) : (
                <span>{lang === 'gu' ? 'OTP મેળવો' : 'Send Verification OTP'}</span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
                className="w-full h-14 text-center tracking-[0.5em] text-2xl font-bold rounded-[20px] bg-white border-2 border-[#1B7A3F] focus:outline-none text-[#14201A]"
              />
              <div className="mt-2 text-center text-xs text-[#566259]">
                {lang === 'gu' ? 'ચકાસણી OTP:' : 'Verification OTP:'}{' '}
                <strong className="text-[#1B7A3F] font-mono text-sm">123456</strong>
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-[#B3261E] bg-[#FFEBD9] px-3.5 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.trim().length !== 6}
              className="w-full h-14 rounded-full bg-[#1B7A3F] hover:bg-[#156031] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-40"
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
