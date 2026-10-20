import React, { useState } from 'react';
import { Wifi, Signal } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  onRestart?: () => void;
  title?: string;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [currentTime] = useState<string>('09:41');

  return (
    <div 
      id="iphone-device-frame"
      className="w-[360px] sm:w-[385px] h-[640px] sm:h-[685px] bg-slate-900 rounded-[48px] p-3 shadow-[0_16px_50px_rgba(0,0,0,0.32)] relative border-4 border-slate-800 shrink-0 transition-all duration-300 select-none flex flex-col"
    >
      {/* Top Dynamic Island / Notch */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-30 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800/80 mr-3" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#1c2438]" />
      </div>

      {/* Inner Phone Screen */}
      <div className="w-full h-full bg-[#ECE5DD] rounded-[40px] overflow-hidden flex flex-col relative shadow-inner">
        {/* Status Bar */}
        <div className="relative z-30 h-7 bg-[#005C4B] px-6 flex items-center justify-between text-white shrink-0 select-none pt-0.5">
          {/* Time */}
          <span className="text-[11px] font-semibold tracking-tight text-white/95 pl-1">
            {currentTime}
          </span>

          {/* Icons */}
          <div className="flex items-center gap-1.5 text-white/95 pr-1">
            <Signal className="w-2.5 h-2.5 fill-current stroke-none" />
            <span className="text-[8.5px] font-bold tracking-tighter">5G</span>
            <Wifi className="w-2.5 h-2.5 stroke-[2.2]" />
            <div className="flex items-center">
              <div className="w-3.5 h-1.5 border-[1.2px] border-white rounded-[2px] p-[0.5px] flex items-center">
                <div className="h-full w-full bg-white rounded-[0.5px]" />
              </div>
              <div className="w-[1px] h-1 bg-white rounded-r-xs" />
            </div>
          </div>
        </div>

        {/* Main App Canvas */}
        <div className="relative flex-1 flex flex-col overflow-hidden bg-[#ECE5DD]">
          {children}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="relative z-30 h-3 bg-[#F0F2F5] flex items-center justify-center shrink-0">
          <div className="w-24 h-1 bg-slate-400/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}

