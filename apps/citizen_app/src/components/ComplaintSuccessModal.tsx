import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, Clock, MapPin, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Complaint } from '../types';
import { Language, translations } from '../core/localization';

interface ComplaintSuccessModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  onViewComplaints: () => void;
  lang: Language;
}

export const ComplaintSuccessModal: React.FC<ComplaintSuccessModalProps> = ({
  isOpen,
  complaint,
  onClose,
  onViewComplaints,
  lang,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !complaint) return null;

  const t = translations[lang];
  const catGu = complaint.categoryCustomTitle || translations.gu.categories[complaint.category] || complaint.category;
  const catEn = complaint.categoryCustomTitle || translations.en.categories[complaint.category] || complaint.category;

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(complaint.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-[#DCE5D9] animate-in slide-in-from-bottom duration-300">
        
        {/* Top Header Card with App Logo */}
        <div className="bg-gradient-to-br from-[#167B40] via-[#0E5C2E] to-[#0A4421] text-white p-6 relative overflow-hidden text-center flex flex-col items-center">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#7CAE7A]/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#F0873A]/20 rounded-full blur-2xl" />

          {/* Official App Logo */}
          <div className="relative mb-3">
            <img
              src="./logo.svg"
              alt="Safai Saathi Official Seal"
              className="w-16 h-16 rounded-2xl shadow-xl border-2 border-white/80 object-cover bg-white"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center shadow-md border-2 border-white">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#A8E5CB]" />
            <span>{lang === 'gu' ? 'ફરિયાદ સ્વીકૃત' : 'Grievance Registered'}</span>
          </span>

          <h2 className="text-xl font-bold tracking-tight text-white">
            {lang === 'gu' ? 'ફરિયાદ સફળતાપૂર્વક નોંધાઈ ગઈ છે!' : 'Complaint Registered Successfully!'}
          </h2>
          <p className="text-xs text-[#EAF2E6]/90 mt-1 max-w-xs leading-relaxed">
            {lang === 'gu'
              ? 'અધિકૃત ટિકિટ જનરેટ થઈ ગઈ છે અને વોર્ડ સુપરવાઇઝરને સોંપાઈ છે.'
              : 'Official municipal ticket generated & dispatched to ward inspector.'}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 max-h-[calc(92vh-220px)]">
          {/* Ticket ID Pill Card with Copy */}
          <div className="p-4 rounded-2xl bg-[#E8F8F0] border border-[#1B7A3F]/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'અધિકૃત ટિકિટ ક્રમાંક' : 'Official Ticket ID'}
              </span>
              <span className="text-base font-mono font-bold text-[#14201A] mt-0.5 block">
                {complaint.ticketId}
              </span>
            </div>

            <button
              onClick={handleCopyTicket}
              className="px-3 py-1.5 rounded-full bg-white text-[#1B7A3F] hover:bg-[#DCE5D9] text-xs font-bold flex items-center gap-1.5 shadow-xs border border-[#1B7A3F]/20 active:scale-95 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'gu' ? 'કોપી થયું!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'gu' ? 'કોપી' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          {/* Photo Preview Thumbnail */}
          {complaint.photoUrl && (
            <div className="rounded-2xl overflow-hidden border border-[#DCE5D9] relative aspect-[16/9] bg-neutral-900 shadow-xs">
              <img
                src={complaint.photoUrl}
                alt="Captured Issue Evidence"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6DB36F]" />
                <span>GPS Live Photo Verified</span>
              </div>
            </div>
          )}

          {/* Key Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#F3F6F2] border border-[#DCE5D9]">
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'સમસ્યા' : 'Category'}
              </span>
              <span className="text-xs font-bold text-[#14201A] mt-0.5 block truncate">
                {catGu}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3F6F2] border border-[#DCE5D9]">
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'નિરાકરણ મર્યાદા (SLA)' : 'Resolution SLA'}
              </span>
              <span className="text-xs font-bold text-[#1B7A3F] mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>24 Hours</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#EAF2E7] border border-[#1B7A3F]/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#1B7A3F] uppercase tracking-wider block">
                  {lang === 'gu' ? 'GPS લોકેશન' : 'GPS Location'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#1B7A3F] text-white px-1.5 py-0.5 rounded-full">
                  🔒 LOCKED
                </span>
              </div>
              <span className="text-xs font-bold text-[#14201A] mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#1B7A3F] shrink-0" />
                <span className="truncate">{complaint.address || 'Godhra'}</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3F6F2] border border-[#DCE5D9]">
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'સોંપાયેલ અધિકારી' : 'Ward Inspector'}
              </span>
              <span className="text-xs font-bold text-[#14201A] mt-0.5 flex items-center gap-1 truncate">
                <UserCheck className="w-3.5 h-3.5 text-[#1B7A3F] shrink-0" />
                <span className="truncate">{complaint.assignedName || 'Ward Supervisor'}</span>
              </span>
            </div>
          </div>

          {/* Citizen Cross-Verification Explanation */}
          <div className="p-3.5 rounded-2xl bg-[#E4F1DF]/80 border border-[#DCE5D9] flex items-start gap-2.5 text-xs text-[#1B7A3F]">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold block">
                {lang === 'gu' ? 'આગળની પ્રક્રિયા (Cross-Verification):' : 'Next Step (Cross-Verification):'}
              </span>
              <span className="text-[11px] text-[#14201A]/80 mt-0.5 block leading-relaxed">
                {lang === 'gu'
                  ? 'વોર્ડ સફાઈ કાર્યકર સ્થળ પર પહોંચી સફાઈ કરશે અને ક્લીનિંગ ફોટો અપલોડ કરશે. ત્યારબાદ આપ "મારી ફરિયાદો" ટેબમાંથી લાઈવ કેમેરા દ્વારા સફાઈની ખરાઈ (Cross-Verify) કરી શકશો.'
                  : 'Municipal sanitation crew will clean the spot and upload proof. You can then cross-verify the cleanup with camera proof under "My Complaints".'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-[#DCE5D9] flex items-center gap-2.5">
          <button
            onClick={onViewComplaints}
            className="flex-1 h-12 rounded-full bg-[#1B7A3F] hover:bg-[#156031] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <span>{lang === 'gu' ? 'મારી ફરિયાદો જુઓ' : 'View in My Complaints'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-full bg-[#111A14] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <span>{lang === 'gu' ? 'નકશા પર પાછા ફરો' : 'Return to Map'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
