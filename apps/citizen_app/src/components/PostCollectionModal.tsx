import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ThumbsUp, AlertTriangle, Send } from 'lucide-react';
import { translations, Language } from '../core/localization';
import { StorageService } from '../services/storageService';
import { CitizenCollectionFeedback } from '../types';

interface PostCollectionModalProps {
  isOpen: boolean;
  wardId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
  lang: Language;
}

export const PostCollectionModal: React.FC<PostCollectionModalProps> = ({
  isOpen,
  wardId,
  onClose,
  onSubmitSuccess,
  lang,
}) => {
  const t = translations[lang];

  const [selection, setSelection] = useState<'yes' | 'no_garbage' | 'missed' | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectOption = (opt: 'yes' | 'no_garbage' | 'missed') => {
    setSelection(opt);
    if (opt === 'yes') {
      submitFeedback(true, 'collected');
    } else if (opt === 'no_garbage') {
      submitFeedback(false, 'no_garbage_today');
    }
  };

  const handleMissedSubmit = () => {
    const finalReason = selectedReason === 'other' ? customReason : selectedReason;
    submitFeedback(false, 'missed_by_van', finalReason, customReason);
  };

  const submitFeedback = (
    hadGarbage: boolean,
    collectionStatus: 'collected' | 'missed_by_van' | 'no_garbage_today',
    reason?: string,
    note?: string
  ) => {
    const record: CitizenCollectionFeedback = {
      id: 'fb_' + Date.now().toString(36),
      wardId,
      date: StorageService.getTodayKey(),
      deviceId: StorageService.getDeviceId(),
      hadGarbage,
      collectionStatus,
      reason,
      note,
      timestamp: new Date().toISOString(),
    };

    StorageService.saveFeedback(record);
    setSubmitted(true);

    setTimeout(() => {
      onSubmitSuccess();
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-5 border border-[#DCE5D9]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DCE5D9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#14201A]">
                {t.postVisitPromptTitle}
              </h3>
              <p className="text-xs text-[#566259]">
                {t.postVisitPromptSubtitle}
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

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#E4F1DF] text-[#1B7A3F] flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-[#14201A]">
              {t.feedbackThanks}
            </h4>
            <p className="text-xs text-[#566259]">
              {lang === 'gu'
                ? 'આ ડેટા સીધો DDO કચેરીના મોનિટરિંગ ડેશબોર્ડમાં નોંધાયો છે.'
                : 'Directly logged for municipal contractor performance audit.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selection !== 'missed' ? (
              <>
                {/* 1. Yes, handed over */}
                <button
                  onClick={() => handleSelectOption('yes')}
                  className="w-full p-4 rounded-[20px] bg-[#E4F1DF] hover:bg-[#D4E8CE] border border-[#1B7A3F]/30 text-left flex items-center justify-between transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1B7A3F] text-white flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1B7A3F]">
                        {t.yesGarbageGiven}
                      </h4>
                      <p className="text-xs text-[#14201A]/80">
                        {lang === 'gu' ? 'વાન આવી અને કચરો લઈ ગઈ' : 'Garbage van arrived and collected'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* 2. No garbage today */}
                <button
                  onClick={() => handleSelectOption('no_garbage')}
                  className="w-full p-4 rounded-[20px] bg-[#F3F6F2] hover:bg-[#E9F1E6] border border-[#DCE5D9] text-left flex items-center justify-between transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#74897A] text-white flex items-center justify-center">
                      <ThumbsUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#14201A]">
                        {t.noGarbageToday}
                      </h4>
                      <p className="text-xs text-[#566259]">
                        {lang === 'gu' ? 'આજે ઘરમાં કચરો નહોતો' : 'Household had no waste to dispose'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* 3. No, van missed */}
                <button
                  onClick={() => setSelection('missed')}
                  className="w-full p-4 rounded-[20px] bg-[#FFEBD9] hover:bg-[#FEDAC0] border border-[#F0873A]/40 text-left flex items-center justify-between transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B34A0B] text-white flex items-center justify-center">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#B34A0B]">
                        {t.noVanMissed}
                      </h4>
                      <p className="text-xs text-[#14201A]/80">
                        {lang === 'gu' ? 'વાન ઊભી ન રહી અથવા ચૂકી ગઈ' : 'Van did not stop or skipped street'}
                      </p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              /* Missed Reason Sub-form */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#14201A] uppercase tracking-wide">
                    {t.selectReason}
                  </span>
                  <button
                    onClick={() => setSelection(null)}
                    className="text-xs text-[#1B7A3F] font-semibold hover:underline"
                  >
                    {lang === 'gu' ? 'પાછા જાઓ' : 'Go Back'}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {Object.entries(t.reasons).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedReason(key)}
                      className={`p-3 rounded-[16px] text-xs font-medium text-left border transition ${
                        selectedReason === key
                          ? 'bg-[#F0873A] text-[#111A14] border-[#111A14] font-bold'
                          : 'bg-white text-[#14201A] border-[#DCE5D9] hover:bg-[#F3F6F2]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {selectedReason === 'other' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder={lang === 'gu' ? 'કારણ લખો...' : 'Enter your reason...'}
                    className="w-full h-12 px-4 rounded-xl border border-[#74897A] text-xs font-medium focus:outline-none focus:border-[#1B7A3F]"
                  />
                )}

                <button
                  onClick={handleMissedSubmit}
                  disabled={!selectedReason}
                  className="w-full h-13 mt-2 rounded-full bg-[#111A14] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.submitFeedback}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
