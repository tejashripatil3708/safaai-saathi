import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  Lock,
  Wrench,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Complaint } from '../types';
import { Language, translations } from '../core/localization';
import { StorageService } from '../services/storageService';

interface WhatsAppChatSimulationModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  lang: Language;
  onSimulateWorkerClean?: () => void;
}

export const WhatsAppChatSimulationModal: React.FC<WhatsAppChatSimulationModalProps> = ({
  isOpen,
  complaint,
  onClose,
  lang,
  onSimulateWorkerClean,
}) => {
  const [copied, setCopied] = useState(false);
  const [cleanedSimulated, setCleanedSimulated] = useState(false);

  if (!isOpen || !complaint) return null;

  const t = translations[lang];
  const catGu = complaint.categoryCustomTitle || translations.gu.categories[complaint.category] || complaint.category;
  const catEn = complaint.categoryCustomTitle || translations.en.categories[complaint.category] || complaint.category;

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?ticket=${complaint.ticketId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWorkerClean = () => {
    setCleanedSimulated(true);
    const demoCleanedPhoto = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80';
    StorageService.adminResolveComplaint(
      complaint.id,
      demoCleanedPhoto,
      'Sanitation crew cleaned garbage heap and disinfected corner with lime powder.',
      'Kishore Solanki (Ward Sanitation Worker #14)'
    );
    if (onSimulateWorkerClean) {
      onSimulateWorkerClean();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#ECE5DD] dark:bg-[#0B141A] rounded-[28px] overflow-hidden shadow-2xl flex flex-col h-[90vh] max-h-[720px] border border-[#25D366]/40">
        
        {/* WhatsApp App Header Bar */}
        <div className="bg-[#075E54] dark:bg-[#202C33] text-white px-3.5 py-2.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="relative">
              <img
                src="./logo.png"
                alt="Bot Avatar"
                className="w-10 h-10 rounded-full object-cover bg-white border border-white/50"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#075E54]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">Safai Saathi Bot</span>
                <span className="bg-[#25D366] text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  ✓
                </span>
              </div>
              <span className="text-[11px] text-[#A8E5CB]">
                {lang === 'gu' ? 'ઓનલાઇન • સરકારી બોટ' : 'online • Official Bot'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/90">
            <Video className="w-5 h-5 opacity-80 cursor-pointer" />
            <Phone className="w-4 h-4 opacity-80 cursor-pointer" />
            <MoreVertical className="w-5 h-5 opacity-80 cursor-pointer" />
          </div>
        </div>

        {/* Chat Wallpaper Area */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 relative select-text">
          {/* Encryption Notice */}
          <div className="self-center bg-[#FFEECD] dark:bg-[#182229] text-[#54656F] dark:text-[#8696A0] px-3.5 py-1.5 rounded-lg text-[10px] text-center max-w-[280px] shadow-xs flex items-center gap-1.5 leading-snug">
            <Lock className="w-3 h-3 shrink-0 text-[#8696A0]" />
            <span>Messages are end-to-end encrypted. No one outside of this chat can read them.</span>
          </div>

          {/* Date Stamp */}
          <div className="self-center bg-white/80 dark:bg-[#182229]/80 backdrop-blur-sm text-[#54656F] dark:text-[#8696A0] px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-xs">
            TODAY
          </div>

          {/* Incoming Message Bubble from Safai Saathi Bot */}
          <div className="self-start max-w-[92%] sm:max-w-[85%] bg-white dark:bg-[#202C33] rounded-2xl rounded-tl-none p-3 shadow-sm border border-[#E9EDEF] dark:border-transparent flex flex-col gap-2">
            
            {/* Header with Government Seal */}
            <div className="border-b border-[#E9EDEF] dark:border-[#2A3942] pb-2">
              <span className="text-[10px] font-bold text-[#075E54] dark:text-[#25D366] uppercase tracking-wider block">
                🏛️ પંચમહાલ જિલ્લા સ્વચ્છતા સમિતિ - ગોધરા
              </span>
              <h4 className="text-xs font-bold text-[#111A14] dark:text-[#E9EDEF] mt-0.5">
                ✅ ફરિયાદ સ્વીકૃતિ રસીદ (Official Ticket)
              </h4>
            </div>

            {/* Photo Attachment if available */}
            {complaint.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-[#E9EDEF] dark:border-[#2A3942] relative aspect-[16/10] bg-neutral-900">
                <img
                  src={complaint.photoUrl}
                  alt="Complaint Evidence"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#25D366]" />
                  <span>GPS Verified Live Snapshot</span>
                </div>
              </div>
            )}

            {/* Ticket Text Body */}
            <div className="text-[11px] leading-relaxed text-[#111A14] dark:text-[#D1D7DB] flex flex-col gap-1 font-sans">
              <div>
                <span className="font-bold">📋 ટિકિટ ક્રમાંક / Ticket ID: </span>
                <span className="font-mono font-bold text-[#075E54] dark:text-[#25D366] bg-[#E8F8F0] dark:bg-[#111B21] px-1.5 py-0.5 rounded">
                  {complaint.ticketId}
                </span>
              </div>

              <div>
                <span className="font-bold">📌 સ્થિતિ / Status: </span>
                <span className="text-[#1B7A3F] font-semibold">નોંધાયેલ / RECEIVED</span>
              </div>

              <div>
                <span className="font-bold">⚠️ સમસ્યા / Category: </span>
                <span>{catGu} / {catEn}</span>
              </div>

              <div>
                <span className="font-bold">📍 વિસ્તાર / Address: </span>
                <span>{complaint.address || 'Godhra, Panchmahal'}</span>
              </div>

              <div>
                <span className="font-bold">👨‍💼 વોર્ડ સુપરવાઇઝર: </span>
                <span>{complaint.assignedName || 'Ward Inspector'} ({complaint.assignedPhone || '02672-242000'})</span>
              </div>

              <div>
                <span className="font-bold">⏱️ નિરાકરણ સમય (SLA): </span>
                <span className="text-[#B34A0B] font-semibold">૨૪ કલાક / 24 Hours</span>
              </div>

              <div className="mt-1 pt-1 border-t border-dashed border-[#E9EDEF] dark:border-[#2A3942] text-[10px] text-[#54656F] dark:text-[#8696A0]">
                _૨૪ કલાકમાં ઉકેલ ન આવે તો આપોઆપ ચીફ ઓફિસર અને DDO કચેરીને એસ્કેલેટ થશે._
              </div>
            </div>

            {/* Bubble Footer with Timestamp & Read Receipt Checkmarks */}
            <div className="flex items-center justify-end gap-1 pt-1 self-end text-[10px] text-[#54656F] dark:text-[#8696A0]">
              <span>{currentTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
            </div>
          </div>

          {/* Follow-up Bot Message about Cross-Verification */}
          <div className="self-start max-w-[85%] bg-white dark:bg-[#202C33] rounded-2xl rounded-tl-none p-2.5 shadow-sm border border-[#E9EDEF] dark:border-transparent text-[11px] text-[#111A14] dark:text-[#D1D7DB]">
            <p>
              🤖 {lang === 'gu'
                ? 'સફાઈ કર્મચારી દ્વારા સ્થળ સાફ કરવામાં આવે ત્યારે આપને આ જ વોટ્સએપ પર ચકાસણી (Cross-Verify) ફોટો અને લિંક મળશે.'
                : 'When the municipal sanitation team cleans this spot, you will receive a verification photo right here on WhatsApp.'}
            </p>
            <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-[#54656F] dark:text-[#8696A0]">
              <span>{currentTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
            </div>
          </div>

          {/* If Cleaned Was Simulated */}
          {cleanedSimulated && (
            <div className="self-start max-w-[85%] bg-[#F5EEFF] dark:bg-[#261533] border border-[#9333EA]/30 rounded-2xl rounded-tl-none p-2.5 shadow-sm text-[11px] text-[#6B21A8] dark:text-[#E9D5FF] animate-in zoom-in-95">
              <span className="font-bold block">🔔 અપડેટ: સફાઈ કર્મચારીએ સ્થળ સાફ કર્યું!</span>
              <p className="mt-1">
                સફાઈ કાર્યકર કિશોર સોલંકી દ્વારા કચરાનો ઢગલો સાફ કરી લાઈવ ફોટો અપલોડ કરેલ છે. કૃપા કરી એપમાં જઈ ક્રોસ-વેરિફિકેશન (Cross-Verify) કરો.
              </p>
              <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-[#6B21A8]/60">
                <span>{currentTime}</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
              </div>
            </div>
          )}
        </div>

        {/* Interactive Bottom Actions Bar */}
        <div className="p-3 bg-white dark:bg-[#202C33] border-t border-[#E9EDEF] dark:border-[#2A3942] flex flex-col gap-2 shrink-0">
          {!cleanedSimulated && (
            <button
              onClick={handleWorkerClean}
              className="w-full py-2.5 px-3 rounded-xl bg-[#E4F1DF] dark:bg-[#1A3324] hover:bg-[#d8eed2] text-[#1B7A3F] dark:text-[#6DB36F] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 border border-[#B5CF8A]"
            >
              <Wrench className="w-4 h-4" />
              <span>{lang === 'gu' ? '⚙️ ટેસ્ટ: સફાઈ કાર્યકર સફાઈ પૂર્ણ કરે તે સિમ્યુલેટ કરો' : '⚙️ Test: Simulate Worker Cleaned Spot'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 rounded-xl bg-[#F3F6F2] dark:bg-[#111B21] text-[#14201A] dark:text-[#E9EDEF] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 border border-[#DCE5D9]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#1B7A3F]" /> : <Copy className="w-3.5 h-3.5 text-[#566259]" />}
              <span>{copied ? (lang === 'gu' ? 'લિંક કોપી થઈ!' : 'Copied!') : (lang === 'gu' ? 'ટિકિટ લિંક કોપી' : 'Copy Ticket Link')}</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#054C44] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'gu' ? 'પૂર્ણ / એપ પર પાછા ફરો' : 'Done & Return to App'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
