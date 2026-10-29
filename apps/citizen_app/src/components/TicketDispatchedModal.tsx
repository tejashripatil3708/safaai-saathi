import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Copy, Check, Clock, MapPin, UserCheck, Bot } from 'lucide-react';
import { Complaint } from '../types';
import { Language } from '../core/localization';
import { WhatsAppDispatchService, WhatsAppDispatchResult } from '../services/whatsappDispatchService';

interface TicketDispatchedModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  dispatchResult: WhatsAppDispatchResult | null;
  onClose: () => void;
  lang: Language;
}

export const TicketDispatchedModal: React.FC<TicketDispatchedModalProps> = ({
  isOpen,
  complaint,
  dispatchResult,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  if (!isOpen || !complaint) return null;

  const fullText = dispatchResult?.fullMessageText || WhatsAppDispatchService.formatBilingualTicketMessage(complaint);
  const recipient = dispatchResult?.recipientPhone || complaint.phone || '+91 98765 43210';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-[#DCE5D9] animate-in slide-in-from-bottom duration-300">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-[#087F78] via-[#075E66] to-[#043E44] text-white p-6 relative overflow-hidden text-center flex flex-col items-center">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#A8E5CB]/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#F5B544]/20 rounded-full blur-2xl" />

          {/* Official App Logo */}
          <div className="relative mb-3">
            <img
              src="./logo.svg"
              alt="Safai Saathi Official Seal"
              className="w-16 h-16 rounded-2xl shadow-xl border-2 border-white/80 object-cover bg-white"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#A8E5CB]" />
            <span>{lang === 'gu' ? 'નોંધણી સફળ' : 'Registered & Dispatched'}</span>
          </span>

          <h2 className="text-xl font-bold tracking-tight text-white">
            {lang === 'gu' ? 'ફરિયાદ સફળતાપૂર્વક નોંધાઈ ગઈ છે!' : 'Complaint Registered Successfully!'}
          </h2>
          <p className="text-xs text-[#EAF2E6]/90 mt-1 max-w-xs leading-relaxed">
            {lang === 'gu'
              ? 'અધિકૃત ટિકિટ આપના વોટ્સએપ પર સીધી મોકલી દેવામાં આવી છે.'
              : 'Official grievance ticket dispatched directly to your WhatsApp.'}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 max-h-[calc(92vh-220px)]">
          {/* WhatsApp Direct Bot Confirmation Box */}
          <div className="p-4 rounded-2xl bg-[#E8F8F0] border border-[#25D366]/40 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111A14]">
                    {lang === 'gu' ? 'વોટ્સએપ બોટ ડિસ્પેચ' : 'WhatsApp Bot Dispatched'}
                  </h4>
                  <p className="text-[11px] text-[#075E66] font-semibold">
                    {recipient}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#25D366]/20 text-[#0f5c29] text-[10px] font-bold">
                ● Live Sent
              </span>
            </div>
            <p className="text-[11px] text-[#334E3F] leading-snug">
              {lang === 'gu'
                ? 'સફાઈ સાથી ક્લાઉડ બોટ દ્વારા આ ટિકિટનો સંપૂર્ણ મેસેજ આપના વોટ્સએપ નંબર પર મોકલાઈ ગયો છે.'
                : 'Full official receipt was dispatched directly to your registered WhatsApp number.'}
            </p>
          </div>

          {/* Ticket Key Info Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#F3F6F2] border border-[#DCE5D9]">
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'ટિકિટ ક્રમાંક' : 'Ticket ID'}
              </span>
              <span className="text-xs font-mono font-bold text-[#14201A] mt-0.5 block truncate">
                {complaint.ticketId}
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

            <div className="p-3 rounded-2xl bg-[#F3F6F2] border border-[#DCE5D9]">
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'સ્થળ / સરનામું' : 'Location'}
              </span>
              <span className="text-xs font-bold text-[#14201A] mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#74897A] shrink-0" />
                <span className="truncate">{complaint.address || 'Godhra'}</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3F6F2] border border-[#DCE5D9]">
              <span className="text-[10px] font-bold text-[#566259] uppercase tracking-wider block">
                {lang === 'gu' ? 'સોંપાયેલ અધિકારી' : 'Ward Inspector'}
              </span>
              <span className="text-xs font-bold text-[#14201A] mt-0.5 flex items-center gap-1 truncate">
                <UserCheck className="w-3.5 h-3.5 text-[#1B7A3F] shrink-0" />
                <span className="truncate">{complaint.assignedName || 'Ward Staff'}</span>
              </span>
            </div>
          </div>

          {/* Full Message Preview (Accordion) */}
          <div className="rounded-2xl border border-[#DCE5D9] overflow-hidden bg-white">
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="w-full px-4 py-3 bg-[#F8FAF7] flex items-center justify-between text-left hover:bg-[#F0F4EE] transition"
            >
              <span className="text-xs font-bold text-[#14201A]">
                {showFullText
                  ? (lang === 'gu' ? '▼ વોટ્સએપ મેસેજ છુપાવો' : '▼ Hide Dispatched WhatsApp Message')
                  : (lang === 'gu' ? '▶ મોકલેલ સંપૂર્ણ વોટ્સએપ મેસેજ જુઓ' : '▶ View Full Dispatched WhatsApp Message')}
              </span>
              <span className="text-[11px] text-[#1B7A3F] font-semibold">
                {showFullText ? 'Close' : 'View'}
              </span>
            </button>

            {showFullText && (
              <div className="p-3.5 bg-[#FAFBF9] border-t border-[#DCE5D9] flex flex-col gap-2.5">
                <pre className="text-[11px] leading-relaxed text-[#14201A] font-sans whitespace-pre-wrap bg-white p-3 rounded-xl border border-[#E4EAE1] max-h-48 overflow-y-auto select-all">
                  {fullText}
                </pre>
                <button
                  onClick={handleCopy}
                  className="self-end px-3 py-1.5 rounded-full bg-[#E9F1E6] hover:bg-[#DCE5D9] text-[#14201A] text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1B7A3F]" />
                      <span>{lang === 'gu' ? 'કોપી થઈ ગયું!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#566259]" />
                      <span>{lang === 'gu' ? 'મેસેજ કોપી કરો' : 'Copy Message Text'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Bot Automation Reassurance */}
          <div className="p-3.5 rounded-2xl bg-[#E4F1DF]/70 border border-[#DCE5D9] flex items-start gap-2.5 text-xs text-[#1B7A3F]">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold block">
                {lang === 'gu' ? 'આગળની પ્રક્રિયા:' : 'Next Automation Steps:'}
              </span>
              <span className="text-[11px] text-[#14201A]/80 mt-0.5 block">
                {lang === 'gu'
                  ? 'વોર્ડ સફાઈ કર્મચારી સ્થળ પર પહોંચી સફાઈ કરશે, ત્યારે આપને વોટ્સએપ પર ક્રોસ-ચકાસણી (Cross-Verify) ની લિંક મળશે.'
                  : 'When the municipal sanitation worker completes the cleanup, you will receive a photo verification link on your WhatsApp.'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Single "Done" button */}
        <div className="p-4 bg-white border-t border-[#DCE5D9]">
          <button
            onClick={onClose}
            className="w-full h-13 py-3.5 rounded-full bg-[#111A14] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <span>{lang === 'gu' ? 'પૂર્ણ / આગળ વધો' : 'Done & Return to Map'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
