import React, { useState } from 'react';
import { Camera, X, Check, AlertCircle, Send, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { ComplaintCategory, Complaint } from '../types';
import { Language, translations } from '../core/localization';
import { CameraModal } from './CameraModal';
import { OtpModal } from './OtpModal';
import { WhatsAppDispatchModal } from './WhatsAppDispatchModal';
import { LocationCoords, GeoService } from '../services/simulationService';
import { StorageService } from '../services/storageService';
import { SEED_WARDS } from '../core/seedData';
import confetti from 'canvas-confetti';

interface ReportProblemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  wardId: string;
  lang: Language;
  onComplaintCreated: (complaint: Complaint) => void;
}

export const ReportProblemSheet: React.FC<ReportProblemSheetProps> = ({
  isOpen,
  onClose,
  wardId,
  lang,
  onComplaintCreated,
}) => {
  const t = translations[lang];

  const [category, setCategory] = useState<ComplaintCategory>('garbage_dump');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<LocationCoords | null>(null);
  const [note, setNote] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentWard = SEED_WARDS.find(w => w.id === wardId) || SEED_WARDS[0];

  const handlePhotoCaptured = (dataUrl: string, location: LocationCoords, _timestamp: string) => {
    setPhotoUrl(dataUrl);
    setCapturedLocation(location);
    setError(null);
  };

  const handleSubmitAttempt = () => {
    if (!photoUrl || !capturedLocation) {
      setError(lang === 'gu' ? 'કૃપા કરી લાઈવ કેમેરાથી ફોટો પાડો' : 'Please take a live photo via camera first');
      return;
    }

    // Require OTP if phone is not verified yet
    const verifiedPhone = StorageService.getVerifiedPhone();
    if (!verifiedPhone) {
      setIsOtpOpen(true);
      return;
    }

    executeSubmission(verifiedPhone);
  };

  const executeSubmission = (phone: string) => {
    setIsSubmitting(true);
    setError(null);

    const ticketId = GeoService.generateTicketId();
    const resolvedWard = GeoService.findWardByLocation(capturedLocation || currentWard.center) || currentWard;

    const newComplaint: Complaint = {
      id: 'cmp_' + Date.now().toString(36),
      ticketId,
      deviceId: StorageService.getDeviceId(),
      phone,
      category,
      photoUrl: photoUrl!,
      location: capturedLocation || currentWard.center,
      wardId: resolvedWard.id,
      createdAt: new Date().toISOString(),
      status: 'received',
      assignedTo: resolvedWard.inspectorId,
      assignedName: resolvedWard.inspectorName,
      assignedPhone: resolvedWard.inspectorPhone,
      escalationLevel: 0,
      note: note.trim() || undefined,
    };

    setTimeout(() => {
      StorageService.saveComplaint(newComplaint);
      onComplaintCreated(newComplaint);
      setIsSubmitting(false);
      setCreatedComplaint(newComplaint);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#1B7A3F', '#6DB36F', '#F0873A', '#B5CF8A'],
      });

      // Open WhatsApp Dispatch dialog immediately
      setIsWhatsAppOpen(true);
    }, 600);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md max-h-[92vh] bg-white rounded-t-[32px] sm:rounded-[28px] overflow-y-auto shadow-2xl flex flex-col border border-[#DCE5D9]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#DCE5D9] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#14201A]">
                {t.reportProblem}
              </h3>
              <p className="text-xs text-[#566259]">
                {lang === 'gu' ? currentWard.nameGu : currentWard.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#E9F1E6] flex items-center justify-center text-[#566259]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 flex flex-col gap-5">
            {/* 1. Category Chips (PRD 0.3) */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2.5">
                {t.category}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(t.categories).map(([catKey, catLabel]) => {
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey as ComplaintCategory)}
                      className={`min-h-[48px] px-3.5 py-2.5 rounded-full text-xs font-semibold text-left flex items-center justify-between transition active:scale-95 ${
                        isSelected
                          ? 'bg-[#F0873A] text-[#111A14] ring-2 ring-[#111A14] font-bold shadow-sm'
                          : 'bg-[#F3F6F2] text-[#14201A] border border-[#DCE5D9] hover:bg-[#E9F1E6]'
                      }`}
                    >
                      <span className="truncate">{catLabel}</span>
                      {isSelected && <Check className="w-4 h-4 shrink-0 ml-1 text-[#111A14]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Camera-Only Viewfinder Capture */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2">
                {t.takePhoto} *
              </label>

              {photoUrl ? (
                <div className="relative rounded-[24px] overflow-hidden border-2 border-[#1B7A3F] shadow-md aspect-[16/10] bg-neutral-900">
                  <img src={photoUrl} alt="Inspection Photo" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#6DB36F]" />
                    <span>{t.verified}</span>
                  </div>
                  <button
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
                  className="w-full h-36 rounded-[24px] border-2 border-dashed border-[#74897A] hover:border-[#1B7A3F] bg-[#F3F6F2] hover:bg-[#E4F1DF]/40 flex flex-col items-center justify-center gap-2 text-[#14201A] transition active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center shadow-sm">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-[#1B7A3F]">
                    {lang === 'gu' ? 'લાઈવ કેમેરાથી ફોટો પાડો' : 'Open Live Camera'}
                  </span>
                  <span className="text-[11px] text-[#566259]">
                    {lang === 'gu' ? 'ગેલેરી ફોટો માન્ય નથી' : 'Strict camera capture only (no gallery)'}
                  </span>
                </button>
              )}
            </div>

            {/* 3. Note */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2">
                {lang === 'gu' ? 'લેન્ડમાર્ક / સરનામું' : 'Landmark / Address details'}
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t.notePlaceholder}
                rows={2}
                className="w-full p-3.5 rounded-[20px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A] placeholder:text-[#566259]"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[#FFEBD9] text-[#B34A0B] rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verification badge */}
            <div className="p-3 bg-[#E4F1DF] rounded-2xl flex items-center gap-2 text-xs text-[#1B7A3F]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'gu'
                  ? 'ઓટોમેટિક જીપીએસ અને ટાઈમસ્ટેમ્પ દ્વારા માન્યતા પ્રાપ્ત થશે.'
                  : 'Tamper-proof hardware GPS & timestamp are recorded.'}
              </span>
            </div>

            {/* Submit Pill CTA (DESIGN.md 4.1) */}
            <button
              onClick={handleSubmitAttempt}
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-[#111A14] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSubmitting ? (lang === 'gu' ? 'નોંધાઈ રહ્યું છે...' : 'Registering...') : t.submit}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        lang={lang}
      />

      {/* Phone OTP Modal */}
      <OtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onVerified={phone => executeSubmission(phone)}
        lang={lang}
      />

      {/* WhatsApp Ticket Allotment Modal */}
      <WhatsAppDispatchModal
        isOpen={isWhatsAppOpen}
        complaint={createdComplaint}
        onClose={() => {
          setIsWhatsAppOpen(false);
          onClose();
        }}
        lang={lang}
      />
    </>
  );
};
