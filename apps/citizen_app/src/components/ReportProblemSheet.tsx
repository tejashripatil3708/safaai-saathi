import React, { useState } from 'react';
import { Camera, X, Check, AlertCircle, Send, MapPin, ShieldCheck, FileText, MapPinned } from 'lucide-react';
import { ComplaintCategory, Complaint } from '../types';
import { Language, translations } from '../core/localization';
import { CameraModal } from './CameraModal';
import { OtpModal } from './OtpModal';
import { WhatsAppDispatchModal, generateBilingualWhatsAppMessage } from './WhatsAppDispatchModal';
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
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(StorageService.getCitizenAddress());
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<LocationCoords | null>(null);

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

  const handleInitialSubmit = () => {
    if (!photoUrl || !capturedLocation) {
      setError(lang === 'gu' ? 'કૃપા કરી લાઈવ કેમેરાથી ફોટો પાડો' : 'Please take a live photo via camera first');
      return;
    }

    if (!address.trim()) {
      setError(lang === 'gu' ? 'કૃપા કરી ઘર/વિસ્તારનું સરનામું દાખલ કરો' : 'Please provide the street/area address');
      return;
    }

    if (category === 'other' && !customTitle.trim()) {
      setError(lang === 'gu' ? 'કૃપા કરી સમસ્યાનું નામ લખો' : 'Please specify the exact issue title');
      return;
    }

    // Check if phone number is verified; if not, enforce OTP verification first!
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

    // Save citizen address for future convenience
    StorageService.setCitizenAddress(address.trim(), resolvedWard.id);

    const newComplaint: Complaint = {
      id: 'cmp_' + Date.now().toString(36),
      ticketId,
      deviceId: StorageService.getDeviceId(),
      phone,
      category,
      categoryCustomTitle: customTitle.trim() || undefined,
      description: description.trim() || undefined,
      address: address.trim(),
      photoUrl: photoUrl!,
      location: capturedLocation || currentWard.center,
      wardId: resolvedWard.id,
      createdAt: new Date().toISOString(),
      status: 'received',
      assignedTo: resolvedWard.inspectorId,
      assignedName: resolvedWard.inspectorName,
      assignedPhone: resolvedWard.inspectorPhone,
      escalationLevel: 0,
      note: description.trim() || undefined,
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };

    setTimeout(() => {
      StorageService.saveComplaint(newComplaint);
      onComplaintCreated(newComplaint);
      setIsSubmitting(false);
      setCreatedComplaint(newComplaint);

      // Celebratory feedback
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#1B7A3F', '#6DB36F', '#F0873A', '#B5CF8A'],
      });

      // Automatically launch WhatsApp with the bilingual ticket
      try {
        const waMsg = generateBilingualWhatsAppMessage(newComplaint);
        const waUrl = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
      } catch (_e) {
        // Fallback handled by WhatsAppDispatchModal
      }

      // Prompt opening WhatsApp ticket immediately
      setIsWhatsAppOpen(true);
    }, 400);
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
                {address || (lang === 'gu' ? currentWard.nameGu : currentWard.name)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#E9F1E6] flex items-center justify-center text-[#566259]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 flex flex-col gap-5">
            {/* 1. Category Grid */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2.5">
                {t.category} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(t.categories).map(([catKey, catLabel]) => {
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey as ComplaintCategory)}
                      className={`min-h-[46px] px-3 py-2 rounded-[18px] text-[11px] font-semibold text-left flex items-center justify-between transition active:scale-95 ${
                        isSelected
                          ? 'bg-[#F0873A] text-[#111A14] ring-2 ring-[#111A14] font-bold shadow-sm'
                          : 'bg-[#F3F6F2] text-[#14201A] border border-[#DCE5D9] hover:bg-[#E9F1E6]'
                      }`}
                    >
                      <span className="leading-tight line-clamp-2">{catLabel}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#111A14]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If 'Other' or any category: Allow exact issue title */}
            {category === 'other' && (
              <div>
                <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2">
                  {t.exactIssueLabel} *
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder={t.exactIssuePlaceholder}
                  className="w-full h-12 px-4 rounded-[18px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A]"
                />
              </div>
            )}

            {/* 2. Optional Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1B7A3F]" />
                <span>{t.detailedDescLabel}</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.detailedDescPlaceholder}
                rows={2}
                className="w-full p-3.5 rounded-[18px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A] placeholder:text-[#566259]"
              />
            </div>

            {/* 3. Address / Landmark Input */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPinned className="w-3.5 h-3.5 text-[#1B7A3F]" />
                <span>{t.myAddressTitle} *</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={t.addressPlaceholder}
                className="w-full h-12 px-4 rounded-[18px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A]"
              />
            </div>

            {/* 4. Live Camera Viewfinder Snapshot */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2">
                {t.takePhoto} (Live Camera Only) *
              </label>

              {photoUrl ? (
                <div className="relative rounded-[24px] overflow-hidden border-2 border-[#1B7A3F] shadow-md aspect-[16/10] bg-neutral-900">
                  <img src={photoUrl} alt="Live Inspection" className="w-full h-full object-cover" />
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
                  className="w-full h-32 rounded-[24px] border-2 border-dashed border-[#74897A] hover:border-[#1B7A3F] bg-[#F3F6F2] hover:bg-[#E4F1DF]/40 flex flex-col items-center justify-center gap-2 text-[#14201A] transition active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center shadow-sm">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#1B7A3F]">
                    {lang === 'gu' ? 'લાઈવ કેમેરા પરવાનગી અને ફોટો' : 'Request Camera & Take Live Photo'}
                  </span>
                  <span className="text-[10px] text-[#566259]">
                    {lang === 'gu' ? 'ગેલેરી ફોટો સ્વીકાર્ય નથી' : 'Gallery upload strictly disabled'}
                  </span>
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[#FFEBD9] text-[#B34A0B] rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Anti-fraud reassurance */}
            <div className="p-3 bg-[#E4F1DF] rounded-2xl flex items-center gap-2 text-xs text-[#1B7A3F]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'gu'
                  ? 'ફરિયાદ સીધી પંચમહાલ એડમિન પોર્ટલ અને વોર્ડ સ્ટાફને મોકલાશે.'
                  : 'Tickets route directly to the Municipal Administrative Dashboard.'}
              </span>
            </div>

            {/* Submit Pill CTA */}
            <button
              onClick={handleInitialSubmit}
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-[#111A14] hover:bg-black text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSubmitting ? (lang === 'gu' ? 'નોંધાઈ રહ્યું છે...' : 'Submitting...') : t.submit}</span>
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

      {/* Mandatory Phone OTP Verification Modal */}
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
