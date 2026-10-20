import React, { useState } from 'react';
import { Sparkles, Send, CornerDownLeft, MessageSquare, ArrowRight } from 'lucide-react';
import { SuggestedReplyState } from '../types';

interface SuggestedReplyPanelProps {
  replyState: SuggestedReplyState | null;
  onSendReply: (text: string) => void;
  isTyping: boolean;
}

export function SuggestedReplyPanel({
  replyState,
  onSendReply,
  isTyping,
}: SuggestedReplyPanelProps) {
  const [customText, setCustomText] = useState('');

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customText.trim() || isTyping) return;
    onSendReply(customText.trim());
    setCustomText('');
  };

  const handleOptionClick = (text: string) => {
    if (isTyping) return;
    onSendReply(text);
  };

  const primaryText = replyState?.primaryReply || replyState?.options?.[0]?.label;
  const secondaryOptions = replyState?.options?.filter(
    (opt) => opt.label !== primaryText
  ) || [];

  return (
    <div 
      id="prototype-suggested-reply-panel"
      className="p-3.5 bg-gradient-to-br from-blue-50/80 via-slate-50 to-amber-50/40 border-2 border-blue-200/80 rounded-2xl shadow-xs mb-4 transition-all"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#002878]"></span>
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#002878] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Test Actions
          </span>
        </div>
        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#002878] border border-blue-200">
          Interactive Helper
        </span>
      </div>

      {/* Step / Context Hint */}
      {replyState?.stepDescription && (
        <p className="text-[11px] text-slate-600 mb-2.5 font-medium leading-tight">
          {replyState.stepDescription}
        </p>
      )}

      {/* Quick Action Chips */}
      <div className="space-y-1.5 mb-3">
        {primaryText && (
          <button
            onClick={() => handleOptionClick(primaryText)}
            disabled={isTyping}
            className="w-full text-left py-2 px-3 bg-[#002878] hover:bg-[#001f5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-between group disabled:opacity-50 cursor-pointer"
          >
            <span className="truncate pr-1">{primaryText}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </button>
        )}

        {secondaryOptions.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(opt.label)}
            disabled={isTyping}
            className="w-full text-left py-1.5 px-2.5 bg-white hover:bg-slate-100/90 active:bg-slate-200 border border-slate-200/90 text-slate-800 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-between group disabled:opacity-50 cursor-pointer"
          >
            <span className="truncate pr-1">{opt.label}</span>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-600 shrink-0">
              Select ↵
            </span>
          </button>
        ))}
      </div>

      {/* Custom manual message input */}
      <form onSubmit={handleManualSubmit} className="relative flex items-center">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Or type custom test reply (e.g. AWB #)..."
          disabled={isTyping}
          className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-3 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002878] focus:border-[#002878] transition-all shadow-2xs disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!customText.trim() || isTyping}
          className="absolute right-1 p-1 text-slate-400 hover:text-[#002878] disabled:opacity-30 transition-colors cursor-pointer"
          title="Send reply"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
