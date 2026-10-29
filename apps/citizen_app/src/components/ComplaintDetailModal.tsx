import React, { useState } from 'react';
import { X, Phone, Clock, MapPin, AlertTriangle, ShieldCheck, FileText, CheckCircle2, Sparkles, Check } from 'lucide-react';
import { Complaint, Ward } from '../types';
import { Language, translations } from '../core/localization';
import { StatusChip } from './StatusChip';
import { SEED_WARDS } from '../core/seedData';
import { CONSTANTS } from '../core/constants';
import { MarkResolvedModal } from './MarkResolvedModal';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  lang: Language;
  onComplaintResolved?: (complaintId: string, resolvedPhotoUrl: string, note?: string) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  lang,
  onComplaintResolved,
}) => {
  const t = translations[lang];
  const [isMarkResolvedOpen, setIsMarkResolvedOpen] = useState(false);

  if (!complaint) return null;

  const ward = SEED_WARDS.find(w => w.id === complaint.wardId) || SEED_WARDS[0];
  const categoryName = (t.categories as any)[complaint.category] || complaint.category;

  const isSlaBreached =
    complaint.status === 'escalated' ||
    complaint.escalationLevel > 0 ||
    Date.now() - new Date(complaint.createdAt).getTime() > 24 * 3600 * 1000;

  const authorityPhone =
    complaint.escalationLevel >= 2
      ? CONSTANTS.DDO_OFFICE_PHONE
      : ward.escalationPhone || CONSTANTS.CHIEF_OFFICER_PHONE;

  const authorityName =
    complaint.escalationLevel >= 2
      ? (lang === 'gu' ? 'જિલ્લા વિકાસ અધિકારી (DDO પંચમહાલ)' : 'District Development Officer (DDO)')
      : ward.escalationName;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-[#16221B] rounded-t-[32px] sm:rounded-[28px] overflow-y-auto shadow-2xl flex flex-col border border-[#DCE5D9] dark:border-[#2A3B31]">
          {/* Top Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#16221B]/95 backdrop-blur-md px-6 py-4 border-b border-[#DCE5D9] dark:border-[#2A3B31] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-[#1B7A3F] dark:text-[#6DB36F] bg-[#E4F1DF] dark:bg-[#1F3A2A] px-2.5 py-0.5 rounded-full">
                {complaint.ticketId}
              </span>
              <h3 className="text-base font-bold text-[#14201A] dark:text-[#EAF2E6] mt-1">
                {complaint.categoryCustomTitle || categoryName}
              </h3>
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

            {/* Mark as Resolved CTA if not yet resolved */}
            {complaint.status !== 'resolved' && (
              <button
                onClick={() => setIsMarkResolvedOpen(true)}
                className="w-full h-12 rounded-full bg-[#E4F1DF] dark:bg-[#1F3A2A] hover:bg-[#D4E8CE] text-[#1B7A3F] dark:text-[#6DB36F] text-xs font-bold flex items-center justify-center gap-2 border border-[#1B7A3F]/30 active:scale-95 transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.markResolved.button}</span>
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
            {complaint.status === 'resolved' && complaint.resolvedPhotoUrl ? (
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

            {/* Status Progression Timeline */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6] uppercase tracking-wider">
                {lang === 'gu' ? 'નિવારણ પ્રગતિ ટાઇમલાઇન' : 'Resolution Progress Timeline'}
              </h4>
              <div className="flex flex-col gap-3 relative pl-4 border-l-2 border-[#1B7A3F]/30 ml-2">
                <div className="relative">
                  <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-[#1B7A3F]" />
                  <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">{t.timeline.step1}</p>
                  <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2]">
                    {new Date(complaint.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="relative">
                  <div
                    className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ${
                      complaint.status !== 'received' ? 'bg-[#1B7A3F]' : 'bg-[#DCE5D9] dark:bg-[#2A3B31]'
                    }`}
                  />
                  <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">{t.timeline.step2}</p>
                  <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2]">
                    {lang === 'gu' ? 'વોર્ડ સ્ટાફ તપાસ' : 'Ward Staff Inspection'}
                  </p>
                </div>

                <div className="relative">
                  <div
                    className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ${
                      complaint.status === 'resolved' ? 'bg-[#1B7A3F]' : 'bg-[#DCE5D9] dark:bg-[#2A3B31]'
                    }`}
                  />
                  <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">{t.timeline.step3}</p>
                  <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2]">
                    {lang === 'gu' ? 'સ્થળ સફાઈ કામગીરી' : 'Sanitation Team Action'}
                  </p>
                </div>

                <div className="relative">
                  <div
                    className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ${
                      complaint.status === 'resolved' ? 'bg-[#1B7A3F]' : 'bg-[#DCE5D9] dark:bg-[#2A3B31]'
                    }`}
                  />
                  <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">{t.timeline.step4}</p>
                  {complaint.resolvedAt && (
                    <p className="text-[11px] text-[#1B7A3F] dark:text-[#6DB36F] font-semibold">
                      {new Date(complaint.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Authority Contacts: ONLY REVEALED IF TICKET IS NOT RESOLVED WITHIN SLA (24h/escalated) */}
            {isSlaBreached ? (
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
                    <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">{authorityName}</p>
                    <p className="text-xs font-mono text-[#566259] dark:text-[#9DB0A2]">{authorityPhone}</p>
                  </div>
                  <a
                    href={`tel:${authorityPhone.replace(/\s+/g, '')}`}
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
                    ? 'ફરિયાદ ૨૪ કલાકની સમયમર્યાદામાં ઉકેલવા સ્ટાફને સૂચના અપાઈ છે.'
                    : 'Ticket is currently within the active 24-hour SLA window.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mark Resolved Modal */}
      <MarkResolvedModal
        isOpen={isMarkResolvedOpen}
        complaint={complaint}
        onClose={() => setIsMarkResolvedOpen(false)}
        onResolved={(id, photoUrl, note) => {
          if (onComplaintResolved) {
            onComplaintResolved(id, photoUrl, note);
          }
        }}
        lang={lang}
      />
    </>
  );
};
