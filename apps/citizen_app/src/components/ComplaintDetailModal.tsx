import React from 'react';
import { X, Phone, Clock, MapPin, AlertTriangle, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Complaint, Ward } from '../types';
import { Language, translations } from '../core/localization';
import { StatusChip } from './StatusChip';
import { SEED_WARDS } from '../core/seedData';
import { CONSTANTS } from '../core/constants';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  lang: Language;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  lang,
}) => {
  const t = translations[lang];

  if (!complaint) return null;

  const ward = SEED_WARDS.find(w => w.id === complaint.wardId) || SEED_WARDS[0];
  const categoryName = (t.categories as any)[complaint.category] || complaint.category;

  // Has it breached SLA (escalated or > 24 hours)?
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] bg-white rounded-t-[32px] sm:rounded-[28px] overflow-y-auto shadow-2xl flex flex-col border border-[#DCE5D9]">
        {/* Top Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#DCE5D9] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold text-[#1B7A3F] bg-[#E4F1DF] px-2.5 py-0.5 rounded-full">
              {complaint.ticketId}
            </span>
            <h3 className="text-base font-bold text-[#14201A] mt-1">
              {complaint.categoryCustomTitle || categoryName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E9F1E6] flex items-center justify-center text-[#566259]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Status & Timing */}
          <div className="flex items-center justify-between bg-[#F3F6F2] p-3.5 rounded-2xl border border-[#DCE5D9]">
            <StatusChip
              status={complaint.status}
              lang={lang}
              escalationLevel={complaint.escalationLevel}
            />
            <div className="flex items-center gap-1.5 text-xs text-[#566259]">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Address / Location Details */}
          {complaint.address && (
            <div className="p-3 bg-[#E9F1E6] rounded-2xl flex items-start gap-2 text-xs text-[#14201A]">
              <MapPin className="w-4 h-4 text-[#1B7A3F] shrink-0 mt-0.5" />
              <div>
                <strong>{lang === 'gu' ? 'સ્થળ / સરનામું:' : 'Location Address:'}</strong>
                <p className="mt-0.5 text-[#566259]">{complaint.address}</p>
              </div>
            </div>
          )}

          {/* Description if provided */}
          {complaint.description && (
            <div className="p-3 bg-[#F3F6F2] rounded-2xl text-xs text-[#14201A] border border-[#DCE5D9]">
              <div className="flex items-center gap-1.5 font-bold text-[#1B7A3F] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? 'વિગતવાર માહિતી:' : 'Detailed Description:'}</span>
              </div>
              <p className="text-[#566259] leading-relaxed">{complaint.description}</p>
            </div>
          )}

          {/* Captured Live Photo */}
          {complaint.photoUrl && (
            <div className="rounded-2xl overflow-hidden border border-[#DCE5D9] shadow-sm relative">
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
          )}

          {/* Status Progression Timeline */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#14201A] uppercase tracking-wider">
              {lang === 'gu' ? 'નિવારણ પ્રગતિ ટાઇમલાઇન' : 'Resolution Progress Timeline'}
            </h4>
            <div className="flex flex-col gap-3 relative pl-4 border-l-2 border-[#1B7A3F]/30 ml-2">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-[#1B7A3F]" />
                <p className="text-xs font-bold text-[#14201A]">{t.timeline.step1}</p>
                <p className="text-[11px] text-[#566259]">
                  {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div
                  className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ${
                    complaint.status !== 'received' ? 'bg-[#1B7A3F]' : 'bg-[#DCE5D9]'
                  }`}
                />
                <p className="text-xs font-bold text-[#14201A]">{t.timeline.step2}</p>
                <p className="text-[11px] text-[#566259]">
                  {lang === 'gu' ? 'સ્થાનિક સફાઈ નિરીક્ષકને સોંપાયેલ' : 'Assigned to Ward Sanitation Staff'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div
                  className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ${
                    complaint.status === 'resolved' ? 'bg-[#1B7A3F]' : 'bg-[#DCE5D9]'
                  }`}
                />
                <p className="text-xs font-bold text-[#14201A]">{t.timeline.step3}</p>
                <p className="text-[11px] text-[#566259]">
                  {lang === 'gu' ? 'સ્થળ સફાઈ અને નિકાલ કામગીરી' : 'Sanitation team action underway'}
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div
                  className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ${
                    complaint.status === 'resolved' ? 'bg-[#1B7A3F]' : 'bg-[#DCE5D9]'
                  }`}
                />
                <p className="text-xs font-bold text-[#14201A]">{t.timeline.step4}</p>
                {complaint.resolvedAt && (
                  <p className="text-[11px] text-[#1B7A3F] font-semibold">
                    {new Date(complaint.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Authority Contacts: ONLY REVEALED IF TICKET IS NOT RESOLVED WITHIN SLA (24h/escalated) */}
          {isSlaBreached ? (
            <div className="p-4 rounded-[24px] bg-[#FFEBD9] border-2 border-[#F0873A] flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#B34A0B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#B34A0B]">
                    {t.authorityContactsTitle}
                  </h4>
                  <p className="text-[11px] text-[#14201A]/80 mt-0.5 leading-relaxed">
                    {t.authorityNotice}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#14201A]">{authorityName}</p>
                  <p className="text-xs font-mono text-[#566259]">{authorityPhone}</p>
                </div>
                <a
                  href={`tel:${authorityPhone.replace(/\s+/g, '')}`}
                  className="px-4 py-2 rounded-full bg-[#111A14] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t.callOfficer}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#E4F1DF] rounded-2xl flex items-center gap-2 text-xs text-[#1B7A3F]">
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
  );
};
