import React, { useState } from 'react';
import { X, CheckCircle, MessageSquare, Copy, Share2, MapPin, Bot, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../core/localization';
import { Complaint } from '../types';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  lang: Language;
}

export const getBilingualCategory = (complaint: Complaint): { gu: string; en: string } => {
  if (complaint.categoryCustomTitle) {
    return {
      gu: complaint.categoryCustomTitle,
      en: complaint.categoryCustomTitle,
    };
  }
  const gu = translations.gu.categories[complaint.category] || complaint.category;
  const en = translations.en.categories[complaint.category] || complaint.category;
  return { gu, en };
};

export const generateBilingualWhatsAppMessage = (complaint: Complaint): string => {
  const { gu: categoryGu, en: categoryEn } = getBilingualCategory(complaint);
  const trackUrl = `${window.location.origin}${window.location.pathname}?ticket=${complaint.ticketId}`;
  const dateStr = new Date(complaint.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
`*🌱 પંચમહાલ ગોધરા સ્વચ્છતા સાથી - અધિકૃત ફરિયાદ ટિકિટ*
*Panchmahal Godhra Sanitation Grievance Ticket*
━━━━━━━━━━━━━━━━━━━━━
📋 *ટિકિટ ક્રમાંક / Ticket ID:* ${complaint.ticketId}
📌 *સ્થિતિ / Status:* નોંધાયેલ / RECEIVED (Admin Portal Notified)
⚠️ *સમસ્યા / Category:*
   🇬🇺 ${categoryGu}
   🇬🇧 ${categoryEn}
${complaint.description ? `📝 *વિગત / Description:* ${complaint.description}\n` : ''}📍 *સરનામું / Address:* ${complaint.address || 'Godhra, Panchmahal'}
🕒 *તારીખ / Date & Time:* ${dateStr}
🗺️ *જીપીએસ / GPS:* ${complaint.location.lat.toFixed(5)}, ${complaint.location.lng.toFixed(5)}
🌐 *ગૂગલ મેપ્સ / Map:* https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}
━━━━━━━━━━━━━━━━━━━━━
🔗 *લાઈવ સ્ટેટસ લિંક / Live Track Complaint:*
${trackUrl}

⚡ *SLA નિરાકરણ સમય / Resolution SLA:* 24 Hours / ૨૪ કલાક
_નોંધ: ૨૪ કલાકમાં નિકાલ ન થવા પર ચીફ ઓફિસર/DDO કચેરીને ઓટો-એસ્કેલેટ થશે._
_Note: If unresolved within 24h, automatically escalated to Chief Officer & DDO._`
  );
};

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  complaint,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !complaint) return null;

  const { gu: categoryGu, en: categoryEn } = getBilingualCategory(complaint);
  const whatsappMessage = generateBilingualWhatsAppMessage(complaint);

  // Clean citizen phone
  let cleanCitizenPhone = complaint.phone ? complaint.phone.replace(/[^0-9]/g, '') : '';
  if (cleanCitizenPhone.length === 10) cleanCitizenPhone = '91' + cleanCitizenPhone;

  // wa.me URL
  const generalShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#16221B] rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-4 border border-[#DCE5D9] dark:border-[#2A3B31]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9] dark:border-[#2A3B31]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#128C7E] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14201A] dark:text-[#EAF2E6]">
                {lang === 'gu' ? 'સ્વયંસંચાલિત વોટ્સએપ બોટ ડિસ્પેચ' : 'Automated WhatsApp Bot'}
              </h3>
              <p className="text-xs text-[#566259] dark:text-[#9DB0A2]">
                {lang === 'gu' ? 'ટિકિટ આપના વોટ્સએપ પર મોકલાઈ છે' : 'Ticket delivered directly to your WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E9F1E6] dark:bg-[#203126] flex items-center justify-center text-[#566259]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Bot Direct Delivery Status Banner */}
        <div className="bg-[#E4F1DF] dark:bg-[#1A3825] p-3.5 rounded-2xl border border-[#1B7A3F]/30 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[#1B7A3F] dark:text-[#6DB36F]">
              {lang === 'gu' ? 'વોટ્સએપ પર ટિકિટ મોકલાઈ ગઈ છે!' : 'Ticket Dispatched to WhatsApp!'}
            </h4>
            <p className="text-[11px] text-[#14201A]/80 dark:text-[#EAF2E6]/80 mt-0.5 leading-relaxed">
              {lang === 'gu'
                ? `આપના નંબર ${complaint.phone || ''} પર ટિકિટ અને અધિકારી વિગતો ડિલીવર કરવામાં આવી છે.`
                : `Official receipt and SLA tracking delivered directly to ${complaint.phone || 'your phone'}.`}
            </p>
          </div>
        </div>

        {/* Automated Bot Features Highlights */}
        <div className="bg-[#F3F6F2] dark:bg-[#1E2D24] p-3.5 rounded-2xl flex flex-col gap-2.5 text-xs text-[#14201A] dark:text-[#EAF2E6] border border-[#DCE5D9] dark:border-[#2A3B31]">
          {/* Feature 1: Worker Cleaning Alert */}
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#1B7A3F] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[11px]">
                {lang === 'gu' ? '૧. સફાઈ પૂર્ણ થયા બાદ ચકાસણી મેસેજ' : '1. Worker Cleaning Cross-Verification'}
              </strong>
              <span className="text-[10px] text-[#566259] dark:text-[#9DB0A2] leading-tight block">
                {lang === 'gu'
                  ? 'કર્મચારી સફાઈ કરશે ત્યારે વોટ્સએપ પર ફોટો સાથે પૂછવામાં આવશે (હા / ના).'
                  : 'You will receive photo proof on WhatsApp asking if the spot is cleaned.'}
              </span>
            </div>
          </div>

          {/* Feature 2: 72-Hour Escalation */}
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[11px]">
                {lang === 'gu' ? '૨. ૭૨ કલાકમાં નિરાકરણ ન થાય તો અધિકારી નંબર' : '2. 72-Hour Direct Authority Contacts'}
              </strong>
              <span className="text-[10px] text-[#566259] dark:text-[#9DB0A2] leading-tight block">
                {lang === 'gu'
                  ? 'જો ૭૨ કલાકમાં ઉકેલ ન આવે, તો ઇન્સ્પેક્ટર, ચીફ ઓફિસર અને DDO નંબર સીધા વોટ્સએપ પર મળશે.'
                  : 'If unresolved within 72h, Inspector, Chief Officer & DDO numbers are sent directly to your WhatsApp.'}
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Summary Card */}
        <div className="bg-[#F3F6F2] dark:bg-[#1E2D24] p-3.5 rounded-[20px] border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#566259] dark:text-[#9DB0A2] uppercase tracking-wider">
              {t.ticketId}
            </span>
            <span className="text-xs font-mono font-bold text-[#1B7A3F] dark:text-[#6DB36F] bg-[#E4F1DF] dark:bg-[#1A3324] px-2 py-0.5 rounded-full">
              {complaint.ticketId}
            </span>
          </div>

          <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6] truncate">
            {categoryGu} / {categoryEn}
          </p>

          <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#1B7A3F]" />
            <span className="truncate">{complaint.address || 'Godhra, Panchmahal'}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Button 1: Open / View in WhatsApp */}
          <button
            onClick={() => openUrl(generalShareUrl)}
            className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{lang === 'gu' ? 'વોટ્સએપ ખોલો / Open WhatsApp' : 'Open in WhatsApp'}</span>
          </button>

          {/* Button 2: Copy bilingual ticket message */}
          <button
            onClick={handleCopy}
            className="w-full h-10 rounded-full border border-[#74897A] dark:border-[#5F7A68] text-[#14201A] dark:text-[#EAF2E6] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F3F6F2] dark:hover:bg-[#1E2E23] active:scale-95 transition"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#1B7A3F]" />
                <span className="text-[#1B7A3F] dark:text-[#6DB36F]">
                  {lang === 'gu' ? 'કોપી થઈ ગયું!' : 'Copied to Clipboard!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#566259]" />
                <span>{lang === 'gu' ? 'દ્વિભાષી ટિકિટ ટેક્સ્ટ કોપી કરો' : 'Copy Bilingual Ticket Text'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
