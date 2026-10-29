import React from 'react';
import { ComplaintStatus } from '../types';
import { Language, translations } from '../core/localization';
import { Inbox, UserCheck, CheckCircle2, AlertTriangle, CloudOff, BellRing, Sparkles, RefreshCw, Clock } from 'lucide-react';

interface StatusChipProps {
  status: ComplaintStatus;
  lang: Language;
  escalationLevel?: number;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  lang,
  escalationLevel = 0,
  className = '',
}) => {
  const t = translations[lang];

  const getStyle = () => {
    switch (status) {
      case 'received':
        return {
          bg: 'bg-[#FFF1D1] dark:bg-[#382B12]',
          text: 'text-[#8A5A00] dark:text-[#F3C465]',
          icon: <Inbox className="w-3.5 h-3.5" />,
          label: t.status.received,
        };
      case 'assigned':
        return {
          bg: 'bg-[#E3EDFF] dark:bg-[#13274F]',
          text: 'text-[#1D4FB8] dark:text-[#8CB4FA]',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          label: t.status.assigned,
        };
      case 'in_progress':
        return {
          bg: 'bg-[#FFF4E5] dark:bg-[#3D260F]',
          text: 'text-[#B45309] dark:text-[#FBBF24]',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: t.status.in_progress,
        };
      case 'pending_verification':
        return {
          bg: 'bg-[#F3E8FF] dark:bg-[#321B4F]',
          text: 'text-[#6B21A8] dark:text-[#D8B4FE]',
          icon: <BellRing className="w-3.5 h-3.5 animate-pulse" />,
          label: t.status.pending_verification,
        };
      case 'resolved':
        return {
          bg: 'bg-[#DDF3E4] dark:bg-[#143B22]',
          text: 'text-[#146B3A] dark:text-[#72D59B]',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: t.status.resolved,
        };
      case 'auto_resolved':
        return {
          bg: 'bg-[#E0F2FE] dark:bg-[#0C324E]',
          text: 'text-[#0369A1] dark:text-[#7DD3FC]',
          icon: <Sparkles className="w-3.5 h-3.5" />,
          label: t.status.auto_resolved,
        };
      case 'reopened':
        return {
          bg: 'bg-[#FFE4E6] dark:bg-[#4C121A]',
          text: 'text-[#BE123C] dark:text-[#FDA4AF]',
          icon: <RefreshCw className="w-3.5 h-3.5" />,
          label: t.status.reopened,
        };
      case 'escalated':
        return {
          bg: 'bg-[#FDE3E0] dark:bg-[#451614]',
          text: 'text-[#B3261E] dark:text-[#F87171]',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: escalationLevel >= 3
            ? (lang === 'gu' ? '🚨 ૭૨h DDO એસ્કેલેટ' : '🚨 72h DDO Escalated')
            : escalationLevel > 1 
            ? (lang === 'gu' ? 'DDO કચેરીને એસ્કેલેટ' : 'Escalated to DDO')
            : t.status.escalated,
        };
      case 'queued':
      default:
        return {
          bg: 'bg-[#E9F1E6] dark:bg-[#1C2C20]',
          text: 'text-[#566259] dark:text-[#A0B2A5]',
          icon: <CloudOff className="w-3.5 h-3.5" />,
          label: t.status.queued,
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} ${className}`}
    >
      {style.icon}
      <span>{style.label}</span>
    </span>
  );
};
