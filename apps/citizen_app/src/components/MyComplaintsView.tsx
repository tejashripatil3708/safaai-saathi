import React, { useState } from 'react';
import { Complaint } from '../types';
import { Language, translations } from '../core/localization';
import { StatusChip } from './StatusChip';
import { ComplaintDetailModal } from './ComplaintDetailModal';
import { MessageSquare, Clock, MapPin, ChevronRight, Inbox, PlusCircle } from 'lucide-react';

interface MyComplaintsViewProps {
  complaints: Complaint[];
  lang: Language;
  onOpenReport: () => void;
}

export const MyComplaintsView: React.FC<MyComplaintsViewProps> = ({
  complaints,
  lang,
  onOpenReport,
}) => {
  const t = translations[lang];
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  return (
    <div className="w-full flex-1 flex flex-col p-5 pb-28 gap-4 max-w-lg mx-auto">
      {/* Title Block (DESIGN.md 3.3) */}
      <div className="pt-2">
        <h1 className="text-3xl font-light text-[#14201A] tracking-tight">
          {t.myComplaints}
        </h1>
        <p className="text-xs text-[#566259] mt-1">
          {lang === 'gu'
            ? 'આપના મોબાઈલ દ્વારા નોંધાયેલ તમામ સ્વચ્છતા ફરિયાદો'
            : 'All sanitation tickets logged from this device'}
        </p>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-10 bg-white rounded-[28px] border border-[#DCE5D9] shadow-elev1">
          <div className="w-20 h-20 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center mb-4 text-3xl">
            🌱
          </div>
          <h3 className="text-base font-bold text-[#14201A]">
            {lang === 'gu' ? 'કોઈ સક્રિય ફરિયાદ નથી' : 'No Complaints Filed'}
          </h3>
          <p className="text-xs text-[#566259] max-w-xs mt-1 mb-6 leading-relaxed">
            {lang === 'gu'
              ? 'તમારા વિસ્તારમાં ગંદકી, કચરાનો ઢગલો કે ખુલ્લી ગટર હોય તો તરત ફોટો પાડી રિપોર્ટ કરો.'
              : 'Spot garbage dumps or clogged gutters? Report with instant live photo verification.'}
          </p>
          <button
            onClick={onOpenReport}
            className="h-12 px-6 rounded-full bg-[#111A14] text-white text-xs font-bold flex items-center gap-2 active:scale-95 transition shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.reportProblem}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {complaints.map(complaint => {
            const categoryName = (t.categories as any)[complaint.category] || complaint.category;
            return (
              <div
                key={complaint.id}
                onClick={() => setSelectedComplaint(complaint)}
                className="bg-white p-4 rounded-[28px] border border-[#DCE5D9] shadow-elev1 flex items-center gap-3.5 cursor-pointer hover:border-[#1B7A3F]/50 transition active:scale-[0.99]"
              >
                {/* 72x72 Thumbnail [DESIGN.md 4.8] */}
                <div className="w-[72px] h-[72px] rounded-[20px] overflow-hidden bg-[#F3F6F2] shrink-0 border border-[#DCE5D9]">
                  {complaint.photoUrl ? (
                    <img
                      src={complaint.photoUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🗑️
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#566259]">
                      {complaint.ticketId}
                    </span>
                    <span className="text-[10px] text-[#566259]">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#14201A] truncate mt-0.5 mb-1.5">
                    {categoryName}
                  </h4>

                  <div className="flex items-center justify-between">
                    <StatusChip
                      status={complaint.status}
                      lang={lang}
                      escalationLevel={complaint.escalationLevel}
                    />
                    <ChevronRight className="w-4 h-4 text-[#74897A]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        lang={lang}
      />
    </div>
  );
};
