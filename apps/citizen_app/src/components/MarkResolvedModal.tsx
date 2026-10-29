import React, { useState } from 'react';
import { X, CheckCircle, Camera, Check, Sparkles, AlertCircle } from 'lucide-react';
import { translations, Language } from '../core/localization';
import { Complaint } from '../types';
import { CameraModal } from './CameraModal';
import { LocationCoords } from '../services/simulationService';
import confetti from 'canvas-confetti';

interface MarkResolvedModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  onResolved: (complaintId: string, resolvedPhotoUrl: string, note?: string) => void;
  lang: Language;
}

export const MarkResolvedModal: React.FC<MarkResolvedModalProps> = ({
  isOpen,
  complaint,
  onClose,
  onResolved,
  lang,
}) => {
  const t = translations[lang];
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string | null>(null);
  const [resolvedNote, setResolvedNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !complaint) return null;

  const handleCapture = (dataUrl: string, _location: LocationCoords) => {
    setResolvedPhotoUrl(dataUrl);
    setError(null);
  };

  const handleConfirm = () => {
    if (!resolvedPhotoUrl) {
      setError(
        lang === 'gu'
          ? 'કૃપા કરી સફાઈ થયેલ સ્થળનો તાજો લાઈવ ફોટો પાડો'
          : 'Please take a live photo of the cleaned area as proof of resolution'
      );
      return;
    }

    onResolved(complaint.id, resolvedPhotoUrl, resolvedNote.trim() || undefined);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1B7A3F', '#6DB36F', '#B5CF8A'],
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md bg-white dark:bg-[#16221B] rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-4 border border-[#DCE5D9] dark:border-[#2A3B31]">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9] dark:border-[#2A3B31]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] text-[#1B7A3F] dark:text-[#6DB36F] flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#14201A] dark:text-[#EAF2E6]">
                  {t.markResolved.title}
                </h3>
                <p className="text-xs text-[#566259] dark:text-[#9DB0A2]">
                  {complaint.ticketId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#E9F1E6] dark:bg-[#1E2D24] flex items-center justify-center text-[#566259] dark:text-[#9DB0A2]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#566259] dark:text-[#9DB0A2] leading-relaxed">
            {t.markResolved.subtitle}
          </p>

          {/* Photo Capture Area */}
          <div>
            <label className="block text-xs font-bold text-[#14201A] dark:text-[#EAF2E6] uppercase tracking-wider mb-2">
              {t.markResolved.takeResolvedPhoto} *
            </label>

            {resolvedPhotoUrl ? (
              <div className="relative rounded-[20px] overflow-hidden border-2 border-[#1B7A3F] shadow-sm aspect-[16/10] bg-neutral-900">
                <img src={resolvedPhotoUrl} alt="Cleaned Proof" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6DB36F]" />
                  <span>Cleaned Proof</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-white/90 text-[#111A14] font-bold text-xs flex items-center gap-1 shadow hover:bg-white active:scale-95 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t.retake}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="w-full h-32 rounded-[22px] border-2 border-dashed border-[#74897A] dark:border-[#5F7A68] hover:border-[#1B7A3F] bg-[#F3F6F2] dark:bg-[#1E2D24] flex flex-col items-center justify-center gap-2 text-[#14201A] dark:text-[#EAF2E6] transition active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center shadow-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#1B7A3F] dark:text-[#6DB36F]">
                  {t.markResolved.takeResolvedPhoto}
                </span>
              </button>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <textarea
              value={resolvedNote}
              onChange={e => setResolvedNote(e.target.value)}
              placeholder={t.markResolved.notePlaceholder}
              rows={2}
              className="w-full p-3 rounded-[16px] bg-white dark:bg-[#16221B] border-2 border-[#74897A] dark:border-[#5F7A68] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A] dark:text-[#EAF2E6]"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-[#FFEBD9] dark:bg-[#3A2414] text-[#B34A0B] dark:text-[#F5A15F] rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-13 rounded-full border border-[#74897A] dark:border-[#5F7A68] text-xs font-bold text-[#14201A] dark:text-[#EAF2E6] hover:bg-[#F3F6F2] dark:hover:bg-[#1E2D24] active:scale-95 transition"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 h-13 rounded-full bg-[#1B7A3F] hover:bg-[#146B3A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>{t.markResolved.confirmButton}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Viewfinder */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
        lang={lang}
      />
    </>
  );
};
