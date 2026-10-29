import React from 'react';
import { ComplaintStatus } from '../types';
import { Language, translations } from '../core/localization';
import { Inbox, UserCheck, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';

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
          bg: 'bg-[#FFF1D1]',
          text: 'text-[#8A5A00]',
          icon: <Inbox className="w-3.5 h-3.5" />,
          label: t.status.received,
        };
      case 'assigned':
        return {
          bg: 'bg-[#E3EDFF]',
          text: 'text-[#1D4FB8]',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          label: t.status.assigned,
        };
      case 'resolved':
        return {
          bg: 'bg-[#DDF3E4]',
          text: 'text-[#146B3A]',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: t.status.resolved,
        };
      case 'escalated':
        return {
          bg: 'bg-[#FDE3E0]',
          text: 'text-[#B3261E]',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: escalationLevel > 1 
            ? (lang === 'gu' ? 'DDO કચેરીને એસ્કેલેટ' : 'Escalated to DDO')
            : t.status.escalated,
        };
      case 'queued':
      default:
        return {
          bg: 'bg-[#E9F1E6]',
          text: 'text-[#566259]',
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
