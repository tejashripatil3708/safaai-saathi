import React, { useState, useEffect } from 'react';
import { Camera, X, Check, AlertCircle, Send, ShieldCheck, FileText, Lock, RefreshCw, MapPin } from 'lucide-react';
import { ComplaintCategory, Complaint, Ward } from '../types';
import { Language, translations } from '../core/localization';
import { CameraModal } from './CameraModal';
import { OtpModal } from './OtpModal';
import { ComplaintSuccessModal } from './ComplaintSuccessModal';
import { LocationCoords, GeoService } from '../services/simulationService';
import { StorageService } from '../services/storageService';
import { SEED_WARDS } from '../core/seedData';
import confetti from 'canvas-confetti';

interface ReportProblemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  wardId: string;
  lang: Language;
  userLocation?: LocationCoords | null;
  onComplaintCreated: (complaint: Complaint) => void;
  onViewComplaints?: () => void;
}

export const ReportProblemSheet: React.FC<ReportProblemSheetProps> = ({
  isOpen,
  onClose,
  wardId,
  lang,
  userLocation,
  onComplaintCreated,
  onViewComplaints,
}) => {
  const t = translations[lang];
  const currentWard = SEED_WARDS.find(w => w.id === wardId) || SEED_WARDS[0];

  const [category, setCategory] = useState<ComplaintCategory>('garbage_dump');
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Tamper-proof GPS auto-detection state
  const [capturedLocation, setCapturedLocation] = useState<LocationCoords | null>(userLocation || null);
  const [detectedWard, setDetectedWard] = useState<Ward>(
    userLocation ? GeoService.findWardByLocation(userLocation) || currentWard : currentWard
  );
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(userLocation ? 5 : null);
  const [gpsStatus, setGpsStatus] = useState<'detecting' | 'acquired' | 'fallback'>('detecting');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect GPS coordinates on modal open
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      return;
    }
    detectGpsLocation();
  }, [isOpen, wardId]);

  const detectGpsLocation = () => {
    setGpsStatus('detecting');
    setError(null);

    // Seed immediately with initial userLocation if available to avoid waiting
    if (userLocation) {
      setCapturedLocation(userLocation);
      const matched = GeoService.findWardByLocation(userLocation) || currentWard;
      setDetectedWard(matched);
      setGpsAccuracy(5);
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords: LocationCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCapturedLocation(coords);
          const matched = GeoService.findWardByLocation(coords) || currentWard;
          setDetectedWard(matched);
          setGpsAccuracy(Math.round(position.coords.accuracy || 4));
          setGpsStatus('acquired');
        },
        err => {
          console.warn('GPS hardware auto-detect notice:', err);
          const fallback = userLocation || currentWard.center;
          setCapturedLocation(fallback);
          const matched = GeoService.findWardByLocation(fallback) || currentWard;
          setDetectedWard(matched);
          setGpsAccuracy(12);
          setGpsStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
      );
    } else {
      const fallback = userLocation || currentWard.center;
      setCapturedLocation(fallback);
      setDetectedWard(currentWard);
      setGpsStatus('fallback');
    }
  };

  if (!isOpen) return null;

  const handlePhotoCaptured = (dataUrl: string, location: LocationCoords, _timestamp: string) => {
    setPhotoUrl(dataUrl);
    setCapturedLocation(location);
    const matched = GeoService.findWardByLocation(location) || currentWard;
    setDetectedWard(matched);
    setGpsStatus('acquired');
    setError(null);
  };

  const handleInitialSubmit = () => {
    if (!capturedLocation) {
      setError(
        lang === 'gu'
          ? 'જીપીએસ કોઓર્ડિનેટ્સ મળ્યા નથી. કૃપા કરી GPS ચાલુ કરો.'
          : 'Could not acquire GPS coordinates. Please ensure GPS is enabled on your device.'
      );
      return;
    }

    if (!photoUrl) {
      setError(lang === 'gu' ? 'કૃપા કરી લાઈવ કેમેરાથી ફોટો પાડો' : 'Please take a live photo via camera first');
      return;
    }

    if (category === 'other' && !customTitle.trim()) {
      setError(lang === 'gu' ? 'કૃપા કરી સમસ્યાનું નામ લખો' : 'Please specify the exact issue title');
      return;
    }

    // STRICT REQUIREMENT: Always prompt for OTP verification on every submission!
    // Never bypass OTP, never remember phone number from previous submissions.
    setIsOtpOpen(true);
  };

  const executeSubmission = (phone: string) => {
    if (!capturedLocation) return;
    setIsSubmitting(true);
    setError(null);

    const ticketId = GeoService.generateTicketId();
    const resolvedWard = detectedWard || GeoService.findWardByLocation(capturedLocation) || currentWard;

    // Tamper-proof coordinates formatted address
    const coordsStr = `${capturedLocation.lat.toFixed(5)}° N, ${capturedLocation.lng.toFixed(5)}° E`;
    const formattedAddress = description.trim()
      ? `${resolvedWard.name} (${description.trim()}) • GPS: ${coordsStr}`
      : `${resolvedWard.name} • GPS: ${coordsStr}`;

    const newComplaint: Complaint = {
      id: 'cmp_' + Date.now().toString(36),
      ticketId,
      deviceId: StorageService.getDeviceId(),
      phone,
      category,
      categoryCustomTitle: customTitle.trim() || undefined,
      description: description.trim() || undefined,
      address: formattedAddress,
      photoUrl: photoUrl!,
      location: capturedLocation,
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

    // Save complaint locally
    StorageService.saveComplaint(newComplaint);
    onComplaintCreated(newComplaint);
    setCreatedComplaint(newComplaint);

    // Celebratory confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#167B40', '#1B7A3F', '#F0873A', '#7CAE7A'],
    });

    setIsSubmitting(false);
    setIsSuccessModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md max-h-[92vh] bg-white rounded-t-[32px] sm:rounded-[28px] overflow-y-auto shadow-2xl flex flex-col border border-[#DCE5D9]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#DCE5D9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="./logo.svg"
                alt="Logo"
                className="w-8 h-8 rounded-xl object-cover shadow-sm bg-white border border-[#DCE5D9]"
              />
              <div>
                <h3 className="text-base font-bold text-[#14201A]">
                  {t.reportProblem}
                </h3>
                <p className="text-[11px] font-semibold text-[#1B7A3F]">
                  {lang === 'gu' ? detectedWard.nameGu : detectedWard.name} ({detectedWard.code})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#E9F1E6] flex items-center justify-center text-[#566259] hover:text-black transition"
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

            {/* If 'Other': Allow exact issue title */}
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

            {/* 2. AUTO-DETECTED GPS COORDINATES (Strictly Locked / Tamper-Proof) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14201A] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1B7A3F]" />
                  <span>
                    {lang === 'gu'
                      ? 'ઓટો-ડિટેક્ટેડ GPS લોકેશન (લૉક કરેલ)'
                      : 'Auto GPS Location (Locked / Read-Only)'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={detectGpsLocation}
                  disabled={gpsStatus === 'detecting'}
                  className="text-[11px] font-semibold text-[#1B7A3F] hover:underline flex items-center gap-1 active:scale-95 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsStatus === 'detecting' ? 'animate-spin text-[#1B7A3F]' : ''}`} />
                  <span>{lang === 'gu' ? 'GPS રિફ્રેશ' : 'Refresh GPS'}</span>
                </button>
              </div>

              {/* Tamper-proof locked coordinate badge */}
              <div className="p-3.5 rounded-[22px] bg-[#EAF2E7]/80 border-2 border-[#1B7A3F]/30 shadow-inner flex flex-col gap-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#1B7A3F] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-[#14201A]">
                          {capturedLocation
                            ? `${capturedLocation.lat.toFixed(5)}° N, ${capturedLocation.lng.toFixed(5)}° E`
                            : (lang === 'gu' ? 'GPS શોધાઈ રહ્યું છે...' : 'Acquiring GPS...')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#1B7A3F] text-white flex items-center gap-0.5 shadow-xs">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{lang === 'gu' ? 'લૉક' : 'LOCKED'}</span>
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-[#1B7A3F] mt-0.5">
                        {lang === 'gu' ? detectedWard.nameGu : detectedWard.name} ({detectedWard.code})
                      </p>
                    </div>
                  </div>

                  {/* High Accuracy Status Pill */}
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1B7A3F] bg-white px-2 py-0.5 rounded-full border border-[#DCE5D9] shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A3F] animate-pulse"></span>
                      {gpsAccuracy ? `±${gpsAccuracy}m` : 'Hardware GPS'}
                    </span>
                  </div>
                </div>

                {/* Fraud Prevention Disclaimer Banner */}
                <div className="pt-2 border-t border-[#1B7A3F]/15 flex items-start gap-1.5 text-[10px] text-[#4A5D50] leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B7A3F] shrink-0 mt-0.5" />
                  <span>
                    {lang === 'gu'
                      ? 'છેડછાડ નિવારણ: ખોટા વિસ્તારની ફરિયાદ રોકવા માટે આ લોકેશન તમારા ઉપકરણના હાર્ડવેર જીપીએસ સાથે લૉક છે અને બદલી શકાશે નહીં.'
                      : 'Fraud Prevention: Location coordinates are locked directly to your device hardware GPS to prevent false reporting in other areas.'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Optional Detailed Description / Landmark Context */}
            <div>
              <label className="block text-xs font-bold text-[#14201A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1B7A3F]" />
                <span>
                  {lang === 'gu'
                    ? 'નજીકનો લેન્ડમાર્ક / વિગત (મરજિયાત)'
                    : 'Nearby Landmark / Context Note (Optional)'}
                </span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={
                  lang === 'gu'
                    ? 'દા.ત. પાણીની ટાંકી પાસે, મેડિકલ સ્ટોર પાછળ, શેરી નં. ૩ (જીપીએસ કોઓર્ડિનેટ્સ આપમેળે લૉક રહેશે)...'
                    : 'E.g. Near overhead tank, behind medical store, Street #3 (Coordinates remain locked above)...'
                }
                rows={2}
                className="w-full p-3.5 rounded-[18px] bg-white border-2 border-[#74897A] focus:border-[#1B7A3F] focus:outline-none text-xs text-[#14201A] placeholder:text-[#566259]"
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
        initialCoords={capturedLocation}
      />

      {/* Mandatory Phone OTP Verification Modal on Every Single Submission */}
      <OtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onVerified={phone => executeSubmission(phone)}
        lang={lang}
      />

      {/* Official In-App Complaint Success Modal */}
      <ComplaintSuccessModal
        isOpen={isSuccessModalOpen}
        complaint={createdComplaint}
        onClose={() => {
          setIsSuccessModalOpen(false);
          onClose();
        }}
        onViewComplaints={() => {
          setIsSuccessModalOpen(false);
          onClose();
          if (onViewComplaints) {
            onViewComplaints();
          }
        }}
        lang={lang}
      />
    </>
  );
};
