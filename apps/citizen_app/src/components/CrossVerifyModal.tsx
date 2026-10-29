import React, { useState } from 'react';
import { X, CheckCircle2, AlertOctagon, Camera, Sparkles, Send, ShieldCheck, ArrowRight } from 'lucide-react';
import { Complaint } from '../types';
import { Language, translations } from '../core/localization';
import { CameraModal } from './CameraModal';
import { LocationCoords } from '../services/simulationService';
import confetti from 'canvas-confetti';

interface CrossVerifyModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  mode: 'confirm_clean' | 'reject_clean' | 'reopen';
  onClose: () => void;
  lang: Language;
  onSuccess: (complaintId: string, isConfirmed: boolean, photoUrl: string, note?: string) => void;
}

export const CrossVerifyModal: React.FC<CrossVerifyModalProps> = ({
  isOpen,
  complaint,
  mode,
  onClose,
  lang,
  onSuccess,
}) => {
  const t = translations[lang];
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !complaint) return null;

  const isConfirm = mode === 'confirm_clean';
  const isReject = mode === 'reject_clean';
  const isReopen = mode === 'reopen';

  const handlePhotoCaptured = (dataUrl: string, _coords: LocationCoords) => {
    setPhotoUrl(dataUrl);
    setError(null);
    setIsCameraOpen(false);
  };

  const handleSubmit = () => {
    if (!photoUrl) {
      setError(
        lang === 'gu'
          ? 'ચકાસણી માટે કેમેરાથી પુરાવો ફોટો પાડવો ફરજિયાત છે.'
          : 'Live camera proof photo is mandatory for verification.'
      );
      return;
    }

    if ((isReject || isReopen) && !note.trim()) {
      setError(
        lang === 'gu'
          ? 'કૃપા કરીને ગંદકી કેમ બાકી છે તેનું કારણ લખો.'
          : 'Please describe why the issue is still unresolved.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (isConfirm) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1B7A3F', '#6DB36F', '#25D366'],
        });
      }
      onSuccess(complaint.id, isConfirm, photoUrl, note.trim() || undefined);
      onClose();
    }, 400);
  };

  const getTitle = () => {
    if (isConfirm) return lang === 'gu' ? 'સફાઈ થઈ ગયાની પુષ્ટિ' : 'Confirm Spot Cleaned';
    if (isReject) return lang === 'gu' ? 'સફાઈ અસંતોષ - વિરોધ નોંધાવો' : 'Report Spot Still Unclean';
    return lang === 'gu' ? 'ફરિયાદ ફરીથી ખોલો' : 'Reopen Grievance Ticket';
  };

  const getSubtitle = () => {
    if (isConfirm) {
      return lang === 'gu'
        ? 'કૃપા કરીને સાફ થયેલા સ્થળનો તાજો લાઈવ ફોટો પાડી સફાઈની પુષ્ટિ કરો.'
        : 'Please take a live photo proof of the cleaned area to confirm resolution.';
    }
    if (isReject) {
      return lang === 'gu'
        ? 'કર્મચારી દ્વારા મૂકેલ દાવો ખોટો છે? હજુ રહેલી ગંદકીનો ફોટો પાડી કારણ જણાવો.'
        : 'If the spot is still dirty, take live photo proof and explain what was missed.';
    }
    return lang === 'gu'
      ? 'જો અગાઉ ઉકેલાયેલ જગ્યાએ ફરી કચરો કે ગંદકી થઈ હોય, તો તાજો ફોટો પાડી ટિકિટ ફરી ખોલો.'
      : 'If garbage persists or has recurred, provide fresh live photo proof to reopen.';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md max-h-[92vh] bg-white dark:bg-[#16221B] rounded-t-[32px] sm:rounded-[28px] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 border border-[#DCE5D9] dark:border-[#2A3B31]">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9] dark:border-[#2A3B31]">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isConfirm
                    ? 'bg-[#E4F1DF] text-[#1B7A3F]'
                    : 'bg-[#FFE4E6] text-[#BE123C]'
                }`}
              >
                {isConfirm ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#14201A] dark:text-[#EAF2E6]">
                  {getTitle()}
                </h3>
                <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2]">
                  {complaint.ticketId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#E9F1E6] dark:bg-[#1E2D24] flex items-center justify-center text-[#566259]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#566259] dark:text-[#9DB0A2] leading-relaxed">
            {getSubtitle()}
          </p>

          {/* Photo Capture Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6] flex items-center justify-between">
              <span>{lang === 'gu' ? 'તાજો લાઈવ ફોટો પુરાવો (ફરજિયાત)' : 'Fresh Live Photo Proof (Mandatory)'}</span>
              <span className="text-[10px] text-[#1B7A3F] font-bold">Live GPS Tagged</span>
            </label>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#1B7A3F] h-48 group">
                <img src={photoUrl} alt="Captured verification" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'gu' ? 'ફરી પાડો' : 'Retake'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition active:scale-[0.99] ${
                  isConfirm
                    ? 'border-[#1B7A3F]/50 bg-[#E4F1DF]/30 hover:bg-[#E4F1DF]/50 text-[#1B7A3F]'
                    : 'border-[#BE123C]/50 bg-[#FFE4E6]/30 hover:bg-[#FFE4E6]/50 text-[#BE123C]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#16221B] shadow flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">
                  {isConfirm
                    ? lang === 'gu'
                      ? 'સાફ થયેલી જગ્યાનો ફોટો પાડો'
                      : 'Take Photo of Cleaned Area'
                    : lang === 'gu'
                    ? 'બાકી રહેલી ગંદકીનો ફોટો પાડો'
                    : 'Take Photo of Unclean Spot'}
                </span>
                <span className="text-[10px] opacity-75">
                  {lang === 'gu' ? 'ગેલેરી અપલોડ માન્ય નથી (કેમેરા ઓન્લી)' : 'Camera only • No gallery'}
                </span>
              </button>
            )}
          </div>

          {/* Reason / Note Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
              {isConfirm
                ? lang === 'gu'
                  ? 'અભિપ્રાય / નોંધ (વૈકલ્પિક)'
                  : 'Feedback Note (Optional)'
                : lang === 'gu'
                ? 'ગંદકી કેમ બાકી છે તેનું કારણ (ફરજિયાત)'
                : 'Reason why spot is still dirty (Mandatory)'}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={e => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                isConfirm
                  ? lang === 'gu'
                    ? 'સફાઈ અંગે તમારો સંતોષ લખો...'
                    : 'Add any cleaning appreciation or note...'
                  : lang === 'gu'
                  ? 'દા.ત. અડધો કચરો ઉપાડ્યો નથી, ગટર હજુ બંધ છે...'
                  : 'e.g. Garbage was left on the corner, open gutter untouched...'
              }
              className="w-full p-3 rounded-2xl bg-[#F3F6F2] dark:bg-[#1E2D24] border border-[#74897A] dark:border-[#5F7A68] text-xs text-[#14201A] dark:text-[#EAF2E6] focus:outline-none focus:border-[#1B7A3F]"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#B3261E] bg-[#FFEBD9] p-3 rounded-xl">
              ⚠️ {error}
            </p>
          )}

          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full h-14 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-50 ${
              isConfirm
                ? 'bg-[#1B7A3F] hover:bg-[#156031]'
                : 'bg-[#BE123C] hover:bg-[#9F0F32]'
            }`}
          >
            <span>
              {isSubmitting
                ? lang === 'gu'
                  ? 'નોંધાઈ રહ્યું છે...'
                  : 'Recording...'
                : isConfirm
                ? lang === 'gu'
                  ? 'સફાઈ પૂર્ણ છે - ટિકિટ બંધ કરો'
                  : 'Confirm Resolution & Close Ticket'
                : isReject
                ? lang === 'gu'
                  ? 'વિરોધ નોંધાવો - ફરિયાદ ફરીથી ખોલો'
                  : 'Dispute & Reopen Ticket'
                : lang === 'gu'
                ? 'ફરિયાદ ફરીથી સક્રિય કરો'
                : 'Reopen Grievance Ticket'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Live Camera */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        lang={lang}
      />
    </>
  );
};
