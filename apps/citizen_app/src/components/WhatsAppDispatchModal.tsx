import React, { useState } from 'react';
import { X, CheckCircle, MessageSquare, Copy, ExternalLink, Share2, MapPin } from 'lucide-react';
import { translations, Language } from '../core/localization';
import { Complaint } from '../types';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  lang: Language;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  complaint,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !complaint) return null;

  const categoryName = complaint.categoryCustomTitle || (t.categories as any)[complaint.category] || complaint.category;

  const whatsappMessage = 
`*🌱 પંચમહાલ ગોધરા સ્વચ્છતા સાથી - અધિકૃત ફરિયાદ ટિકિટ*
*Panchmahal Godhra Sanitation Grievance Ticket*
--------------------------------
*ટિકિટ ક્રમાંક / Ticket ID:* ${complaint.ticketId}
*સ્થિતિ / Status:* RECEIVED (નોંધાયેલ - એડમિન પોર્ટલ પર મોકલેલ)
*સમસ્યા / Category:* ${categoryName}
${complaint.description ? `*વિગત / Description:* ${complaint.description}\n` : ''}*સરનામું / Address:* ${complaint.address || 'Godhra, Panchmahal'}
*તારીખ / Time:* ${new Date(complaint.createdAt).toLocaleString()}
*જીપીએસ લોકેશન / GPS:* ${complaint.location.lat.toFixed(5)}, ${complaint.location.lng.toFixed(5)}
--------------------------------
*લાઈવ ટ્રેકિંગ લિંક / Live Track Complaint:*
${window.location.origin}?ticket=${complaint.ticketId}

_નોંધ: ૨૪ કલાકમાં નિરાકરણ ન આવ્યે ચીફ ઓફિસર/DDO કચેરીને ઓટો-એસ્કેલેટ થશે._`;

  const encodedUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(encodedUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-5 border border-[#DCE5D9]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#128C7E] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14201A]">
                {t.trackOnWhatsApp}
              </h3>
              <p className="text-xs text-[#566259]">
                {t.ticketGenerated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E9F1E6] flex items-center justify-center text-[#566259]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Summary Card */}
        <div className="bg-[#F3F6F2] p-4 rounded-[20px] border border-[#DCE5D9] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566259] uppercase tracking-wider">
              {t.ticketId}
            </span>
            <span className="text-sm font-mono font-bold text-[#1B7A3F] bg-[#E4F1DF] px-2.5 py-0.5 rounded-full">
              {complaint.ticketId}
            </span>
          </div>

          <p className="text-sm font-semibold text-[#14201A]">
            {categoryName}
          </p>

          <p className="text-xs text-[#566259] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#1B7A3F]" />
            <span>{complaint.address || 'Godhra'}</span>
          </p>

          <p className="text-[11px] text-[#566259]">
            {new Date(complaint.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition"
          >
            <Share2 className="w-5 h-5" />
            <span>{t.sendToWhatsApp}</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full h-12 rounded-full border border-[#74897A] text-[#14201A] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#F3F6F2] active:scale-95 transition"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#1B7A3F]" />
                <span className="text-[#1B7A3F]">
                  {lang === 'gu' ? 'કોપી થઈ ગયું!' : 'Copied to Clipboard!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#566259]" />
                <span>{lang === 'gu' ? 'ટિકિટ મેસેજ કોપી કરો' : 'Copy Ticket Message'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
