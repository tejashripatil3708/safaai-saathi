import React, { useState } from 'react';
import {
  X,
  Phone,
  Clock,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Sparkles,
  Check,
  AlertOctagon,
  RefreshCw,
  BellRing,
  Wrench,
  MessageCircle,
} from 'lucide-react';
import { Complaint, Ward } from '../types';
import { Language, translations } from '../core/localization';
import { StatusChip } from './StatusChip';
import { SEED_WARDS } from '../core/seedData';
import { CONSTANTS } from '../core/constants';
import { StorageService } from '../services/storageService';
import { CrossVerifyModal } from './CrossVerifyModal';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  lang: Language;
  onComplaintUpdated?: (updated: Complaint) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  lang,
  onComplaintUpdated,
}) => {
  const t = translations[lang];
  const [crossVerifyMode, setCrossVerifyMode] = useState<'confirm_clean' | 'reject_clean' | 'reopen' | null>(null);
  const [simulating, setSimulating] = useState(false);

  if (!complaint) return null;

  const ward = SEED_WARDS.find(w => w.id === complaint.wardId) || SEED_WARDS[0];
  const categoryName = (t.categories as any)[complaint.category] || complaint.category;

  const createdAtTime = new Date(complaint.createdAt).getTime();
  const hoursSinceCreated = (Date.now() - createdAtTime) / (3600 * 1000);

  // 24-48-72h SLA checks
  const isSlaBreached24h =
    complaint.status === 'escalated' ||
    complaint.escalationLevel > 0 ||
    hoursSinceCreated >= 24;

  const isSlaBreached72h = hoursSinceCreated >= 72 || complaint.escalationLevel >= 3;

  const inspectorPhone = ward.inspectorPhone || '+91 94260 12341';
  const chiefOfficerPhone = ward.escalationPhone || CONSTANTS.CHIEF_OFFICER_PHONE;
  const ddoPhone = CONSTANTS.DDO_OFFICE_PHONE;

  // Handle Worker Simulation for Hackathon / Testing
  const handleSimulateWorkerClean = () => {
    setSimulating(true);
    setTimeout(() => {
      // Sample high-res clean street photo for demonstration
      const demoCleanedPhoto = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80';
      StorageService.adminResolveComplaint(
        complaint.id,
        demoCleanedPhoto,
        'Sanitation crew cleaned garbage heap and disinfected corner with lime powder.',
        'Kishore Solanki (Godhra Swachhata Worker #14)'
      );
      setSimulating(false);
      const updatedList = StorageService.getComplaints();
      const target = updatedList.find(c => c.id === complaint.id);
      if (target && onComplaintUpdated) {
        onComplaintUpdated(target);
      }
    }, 600);
  };

  // Handle citizen verification response
  const handleCrossVerifySuccess = (
    complaintId: string,
    isConfirmed: boolean,
    photoUrl: string,
    note?: string
  ) => {
    if (crossVerifyMode === 'reopen') {
      StorageService.reopenComplaint(complaintId, photoUrl, note);
    } else {
      StorageService.citizenVerifyResolution(complaintId, isConfirmed, photoUrl, note);
    }

    const updatedList = StorageService.getComplaints();
    const target = updatedList.find(c => c.id === complaint.id);
    if (target && onComplaintUpdated) {
      onComplaintUpdated(target);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md max-h-[92vh] bg-white dark:bg-[#16221B] rounded-t-[32px] sm:rounded-[28px] overflow-y-auto shadow-2xl flex flex-col border border-[#DCE5D9] dark:border-[#2A3B31]">
          {/* Top Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#16221B]/95 backdrop-blur-md px-6 py-4 border-b border-[#DCE5D9] dark:border-[#2A3B31] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="./logo.svg"
                alt="Logo"
                className="w-9 h-9 rounded-xl object-cover shadow-sm bg-white border border-[#DCE5D9]"
              />
              <div>
                <span className="text-[11px] font-mono font-bold text-[#1B7A3F] dark:text-[#6DB36F] bg-[#E4F1DF] dark:bg-[#1F3A2A] px-2.5 py-0.5 rounded-full">
                  {complaint.ticketId}
                </span>
                <h3 className="text-base font-bold text-[#14201A] dark:text-[#EAF2E6] mt-1">
                  {complaint.categoryCustomTitle || categoryName}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#E9F1E6] dark:bg-[#1E2D24] flex items-center justify-center text-[#566259] dark:text-[#9DB0A2]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 flex flex-col gap-5">
            {/* Status & Timing */}
            <div className="flex items-center justify-between bg-[#F3F6F2] dark:bg-[#1E2D24] p-3.5 rounded-2xl border border-[#DCE5D9] dark:border-[#2A3B31]">
              <StatusChip
                status={complaint.status}
                lang={lang}
                escalationLevel={complaint.escalationLevel}
              />
              <div className="flex items-center gap-1.5 text-xs text-[#566259] dark:text-[#9DB0A2]">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* 1. CITIZEN CROSS-VERIFICATION CARD (When Worker Marked Cleaned) */}
            {complaint.status === 'pending_verification' && (
              <div className="p-4 rounded-[24px] bg-[#F5EEFF] dark:bg-[#2A163B] border-2 border-[#9333EA] flex flex-col gap-3.5 animate-in zoom-in-95">
                <div className="flex items-start gap-2.5">
                  <BellRing className="w-5 h-5 text-[#9333EA] dark:text-[#D8B4FE] shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-[#6B21A8] dark:text-[#E9D5FF]">
                      {t.crossVerify.workerCleanedBanner}
                    </h4>
                    <p className="text-[11px] text-[#6B21A8]/80 dark:text-[#E9D5FF]/80 mt-0.5 leading-relaxed">
                      {t.crossVerify.workerCleanedSubtitle}
                    </p>
                  </div>
                </div>

                {/* Worker Proof Photo */}
                {complaint.adminResolvedPhotoUrl && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#6B21A8] dark:text-[#E9D5FF]">
                      {t.crossVerify.workerProofTitle}
                    </span>
                    <div className="rounded-2xl overflow-hidden border border-[#9333EA]/40 h-44 relative">
                      <img
                        src={complaint.adminResolvedPhotoUrl}
                        alt="Worker Cleaning Proof"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[10px] flex items-center justify-between">
                        <span>{complaint.workerName || 'Municipal Sanitation Team'}</span>
                        <span>{complaint.adminResolvedAt ? new Date(complaint.adminResolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Cleaned'}</span>
                      </div>
                    </div>
                    {complaint.adminResolvedNote && (
                      <p className="text-[11px] italic text-[#566259] dark:text-[#D8B4FE] mt-0.5">
                        "{complaint.adminResolvedNote}"
                      </p>
                    )}
                  </div>
                )}

                {/* 24-hour Auto Resolve Notice */}
                <div className="bg-white/80 dark:bg-[#16221B]/80 p-2.5 rounded-xl text-[10px] text-[#6B21A8] dark:text-[#D8B4FE] leading-tight">
                  ⏱️ {t.crossVerify.autoResolveNote}
                </div>

                {/* Interactive Verification Buttons (Yes / No) */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setCrossVerifyMode('confirm_clean')}
                    className="h-12 px-3 rounded-full bg-[#1B7A3F] hover:bg-[#156031] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{lang === 'gu' ? 'હા, સફાઈ થઈ ગઈ' : 'Yes, Cleaned'}</span>
                  </button>

                  <button
                    onClick={() => setCrossVerifyMode('reject_clean')}
                    className="h-12 px-3 rounded-full bg-[#BE123C] hover:bg-[#9F0F32] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
                  >
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>{lang === 'gu' ? 'ના, હજુ ગંદકી છે' : 'No, Still Dirty'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. RESOLVED / AUTO-RESOLVED / REOPEN BUTTON */}
            {(complaint.status === 'resolved' || complaint.status === 'auto_resolved') && (
              <div className="flex flex-col gap-2.5">
                {complaint.status === 'auto_resolved' && (
                  <div className="p-3 bg-[#E0F2FE] dark:bg-[#0C324E] text-[#0369A1] dark:text-[#7DD3FC] rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{t.crossVerify.autoResolvedBadge}</span>
                  </div>
                )}

                {/* Reopen Ticket CTA Button */}
                <button
                  onClick={() => setCrossVerifyMode('reopen')}
                  className="w-full h-12 rounded-full border-2 border-[#BE123C] bg-white dark:bg-[#16221B] hover:bg-[#FFE4E6]/20 text-[#BE123C] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.crossVerify.reopenTicketBtn}</span>
                </button>
              </div>
            )}

            {/* 3. SIMULATE WORKER CLEANED BUTTON (For Hackathon Judges / Testing) */}
            {complaint.status !== 'resolved' &&
              complaint.status !== 'auto_resolved' &&
              complaint.status !== 'pending_verification' && (
                <button
                  onClick={handleSimulateWorkerClean}
                  disabled={simulating}
                  className="w-full h-11 rounded-2xl bg-[#F3F6F2] dark:bg-[#1E2D24] hover:bg-[#E9F1E6] text-[#566259] dark:text-[#A0B2A5] text-xs font-semibold flex items-center justify-center gap-2 border border-[#DCE5D9] dark:border-[#2A3B31] active:scale-95 transition"
                >
                  <Wrench className="w-4 h-4 text-[#1B7A3F]" />
                  <span>{simulating ? 'સિમ્યુલેટ થઈ રહ્યું છે...' : t.crossVerify.simulateWorkerBtn}</span>
                </button>
              )}

            {/* Address / Location Details */}
            {complaint.address && (
              <div className="p-3 bg-[#E9F1E6] dark:bg-[#1E2D24] rounded-2xl flex items-start gap-2 text-xs text-[#14201A] dark:text-[#EAF2E6]">
                <MapPin className="w-4 h-4 text-[#1B7A3F] dark:text-[#6DB36F] shrink-0 mt-0.5" />
                <div>
                  <strong>{lang === 'gu' ? 'સ્થળ / સરનામું:' : 'Location Address:'}</strong>
                  <p className="mt-0.5 text-[#566259] dark:text-[#9DB0A2]">{complaint.address}</p>
                </div>
              </div>
            )}

            {/* Detailed Description */}
            {complaint.description && (
              <div className="p-3 bg-[#F3F6F2] dark:bg-[#1E2D24] rounded-2xl text-xs text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]">
                <div className="flex items-center gap-1.5 font-bold text-[#1B7A3F] dark:text-[#6DB36F] mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'gu' ? 'વિગતવાર માહિતી:' : 'Detailed Description:'}</span>
                </div>
                <p className="text-[#566259] dark:text-[#9DB0A2] leading-relaxed">{complaint.description}</p>
              </div>
            )}

            {/* Photos Area: Before & After Comparison if Resolved */}
            {(complaint.status === 'resolved' || complaint.status === 'auto_resolved') &&
            complaint.resolvedPhotoUrl ? (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-[#1B7A3F] dark:text-[#6DB36F] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.markResolved.beforeAfter}</span>
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Before */}
                  <div className="rounded-2xl overflow-hidden border border-[#DCE5D9] dark:border-[#2A3B31] relative">
                    <img src={complaint.photoUrl} alt="Before" className="w-full h-32 object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 bg-black/75 px-2 py-0.5 rounded-md text-[10px] text-white">
                      Before
                    </span>
                  </div>
                  {/* After */}
                  <div className="rounded-2xl overflow-hidden border-2 border-[#1B7A3F] relative">
                    <img src={complaint.resolvedPhotoUrl} alt="After" className="w-full h-32 object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 bg-[#1B7A3F] text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                      ✓ Cleaned
                    </span>
                  </div>
                </div>
                {complaint.resolvedNote && (
                  <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2] italic mt-1">
                    "{complaint.resolvedNote}"
                  </p>
                )}
              </div>
            ) : complaint.photoUrl ? (
              <div className="rounded-2xl overflow-hidden border border-[#DCE5D9] dark:border-[#2A3B31] shadow-sm relative">
                <img
                  src={complaint.photoUrl}
                  alt="Complaint verification"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#6DB36F]" />
                    {complaint.location.lat.toFixed(4)}, {complaint.location.lng.toFixed(4)}
                  </span>
                  <span className="text-[#6DB36F] font-semibold">Live GPS Verified</span>
                </div>
              </div>
            ) : null}

            {/* 4. 72-HOUR SLA BREACH ESCALATION CARD WITH DIRECT NUMBERS */}
            {isSlaBreached72h ? (
              <div className="p-4 rounded-[24px] bg-[#FFE4E6] dark:bg-[#3E1419] border-2 border-[#E11D48] flex flex-col gap-3 animate-pulse">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#BE123C] dark:text-[#FDA4AF]">
                      {t.crossVerify.sla72Title}
                    </h4>
                    <p className="text-[11px] text-[#881337] dark:text-[#FECDD3] mt-0.5 leading-relaxed">
                      {t.crossVerify.sla72Subtitle}
                    </p>
                  </div>
                </div>

                {/* Direct Authority Contacts */}
                <div className="flex flex-col gap-2 pt-1">
                  {/* Ward Inspector */}
                  <div className="bg-white/90 dark:bg-[#16221B] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
                        {ward.inspectorName || 'Rajesh Parmar (Ward Inspector)'}
                      </p>
                      <p className="text-[11px] font-mono text-[#566259]">{inspectorPhone}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${inspectorPhone.replace(/\D/g, '')}`}
                        className="w-8 h-8 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${inspectorPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Chief Officer GNP */}
                  <div className="bg-white/90 dark:bg-[#16221B] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
                        Smt. Vaishali Patel (Chief Officer GNP)
                      </p>
                      <p className="text-[11px] font-mono text-[#566259]">{chiefOfficerPhone}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${chiefOfficerPhone.replace(/\D/g, '')}`}
                        className="w-8 h-8 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${chiefOfficerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* DDO Helpline */}
                  <div className="bg-white/90 dark:bg-[#16221B] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
                        {lang === 'gu' ? 'જિલ્લા વિકાસ અધિકારી ફરિયાદ સેલ' : 'DDO Grievance Helpline'}
                      </p>
                      <p className="text-[11px] font-mono text-[#566259]">{ddoPhone}</p>
                    </div>
                    <a
                      href={`tel:${ddoPhone.replace(/\D/g, '')}`}
                      className="w-8 h-8 rounded-full bg-[#E11D48] text-white flex items-center justify-center active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : isSlaBreached24h ? (
              /* Standard 24h SLA Breach */
              <div className="p-4 rounded-[24px] bg-[#FFEBD9] dark:bg-[#3A2414] border-2 border-[#F0873A] flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-[#B34A0B] dark:text-[#F5A15F] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#B34A0B] dark:text-[#F5A15F]">
                      {t.authorityContactsTitle}
                    </h4>
                    <p className="text-[11px] text-[#14201A]/80 dark:text-[#EAF2E6]/80 mt-0.5 leading-relaxed">
                      {t.authorityNotice}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-[#16221B]/80 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
                      {ward.inspectorName}
                    </p>
                    <p className="text-xs font-mono text-[#566259] dark:text-[#9DB0A2]">{inspectorPhone}</p>
                  </div>
                  <a
                    href={`tel:${inspectorPhone.replace(/\s+/g, '')}`}
                    className="px-4 py-2 rounded-full bg-[#111A14] dark:bg-[#F2F7EE] text-white dark:text-[#111A14] text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.callOfficer}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#E4F1DF] dark:bg-[#1F3A2A] rounded-2xl flex items-center gap-2 text-xs text-[#1B7A3F] dark:text-[#6DB36F]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'gu'
                    ? 'ફરિયાદ ૨૪ કલાકની સત્તાવાર સમયમર્યાદામાં સક્રિય છે.'
                    : 'Ticket is currently within the active 24-hour SLA window.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Verification / Reopen Modal */}
      {crossVerifyMode && (
        <CrossVerifyModal
          isOpen={Boolean(crossVerifyMode)}
          complaint={complaint}
          mode={crossVerifyMode}
          onClose={() => setCrossVerifyMode(null)}
          lang={lang}
          onSuccess={handleCrossVerifySuccess}
        />
      )}
    </>
  );
};
