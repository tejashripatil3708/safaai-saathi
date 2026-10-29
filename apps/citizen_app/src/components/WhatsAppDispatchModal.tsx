import React, { useState } from 'react';
import { X, CheckCircle, MessageSquare, Copy, ExternalLink, Share2, MapPin, Send, PhoneCall } from 'lucide-react';
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

  // General wa.me share link
  const generalShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  
  // Direct wa.me to citizen's own number (if 10-12 digits)
  const citizenDirectUrl = cleanCitizenPhone.length >= 10 
    ? `https://wa.me/${cleanCitizenPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : generalShareUrl;

  // Helpline wa.me (+91 94260 99001 GNP Control Room)
  const helplineUrl = `https://wa.me/919426099001?text=${encodeURIComponent(whatsappMessage)}`;

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
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14201A] dark:text-[#EAF2E6]">
                {lang === 'gu' ? 'વ્હોટ્સએપ ટિકિટ' : 'WhatsApp Ticket'}
              </h3>
              <p className="text-xs text-[#566259] dark:text-[#9DB0A2]">
                {t.ticketGenerated}
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

        {/* Ticket Summary Card */}
        <div className="bg-[#F3F6F2] dark:bg-[#1E2D24] p-4 rounded-[20px] border border-[#DCE5D9] dark:border-[#2A3B31] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566259] dark:text-[#9DB0A2] uppercase tracking-wider">
              {t.ticketId}
            </span>
            <span className="text-sm font-mono font-bold text-[#1B7A3F] dark:text-[#6DB36F] bg-[#E4F1DF] dark:bg-[#1A3324] px-2.5 py-0.5 rounded-full">
              {complaint.ticketId}
            </span>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold text-[#14201A] dark:text-[#EAF2E6]">
              {categoryGu}
            </p>
            <p className="text-[11px] text-[#566259] dark:text-[#9DB0A2]">
              {categoryEn}
            </p>
          </div>

          <p className="text-xs text-[#566259] dark:text-[#9DB0A2] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#1B7A3F]" />
            <span className="truncate">{complaint.address || 'Godhra, Panchmahal'}</span>
          </p>

          <p className="text-[10px] text-[#74897A] dark:text-[#8FA895]">
            {new Date(complaint.createdAt).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Button 1: Send / Open in WhatsApp */}
          <button
            onClick={() => openUrl(generalShareUrl)}
            className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{lang === 'gu' ? 'વ્હોટ્સએપ પર ટિકિટ મોકલો' : 'Send Ticket via WhatsApp'}</span>
          </button>

          {/* Button 2: Send to Godhra Swachhata Helpline */}
          <button
            onClick={() => openUrl(helplineUrl)}
            className="w-full h-11 rounded-full bg-[#111A14] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Send className="w-3.5 h-3.5 text-[#6DB36F]" />
            <span>
              {lang === 'gu' ? 'કંટ્રોલ રૂમ (+91 94260 99001) ને મોકલો' : 'Forward to Helpline (+91 94260 99001)'}
            </span>
          </button>

          {/* Button 3: Copy bilingual ticket message */}
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
