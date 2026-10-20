import { ChevronLeft, Phone, Video, MoreVertical, CheckCircle2 } from 'lucide-react';
import { BLUE_DART_AVATAR_URL } from './BlueDartLogo';

interface WhatsAppHeaderProps {
  onBack?: () => void;
  onRestart?: () => void;
  onOpenInfo?: () => void;
  isTyping?: boolean;
}

export function WhatsAppHeader({
  onBack,
  onRestart,
  onOpenInfo,
  isTyping = false,
}: WhatsAppHeaderProps) {
  return (
    <div 
      id="whatsapp-header"
      className="relative z-20 bg-[#005C4B] text-white px-2.5 py-2 flex items-center justify-between shadow-xs select-none shrink-0"
    >
      {/* Left section: Back button + Avatar + Business Info */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {onBack && (
          <button
            id="btn-whatsapp-back"
            onClick={onBack}
            className="p-1 -ml-1 hover:bg-black/15 rounded-full transition-colors flex items-center justify-center text-white cursor-pointer"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* WhatsApp Profile Picture (DP) & Info */}
        <div 
          className="flex items-center gap-2.5 min-w-0 cursor-pointer" 
          onClick={onOpenInfo}
        >
          <div 
            id="whatsapp-dp-avatar"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-xs p-1 ring-1 ring-black/10 shrink-0"
            title="Blue Dart Express Profile"
          >
            <img
              src={BLUE_DART_AVATAR_URL}
              alt="Blue Dart Express DP"
              className="w-full h-full object-contain select-none"
              loading="eager"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h2 className="font-semibold text-[13.5px] leading-tight text-white truncate tracking-tight">
                Blue Dart Express
              </h2>
              {/* WhatsApp Official Green/Cyan Verified Checkmark */}
              <div 
                className="w-3.5 h-3.5 rounded-full bg-[#25D366] flex items-center justify-center shrink-0"
                title="Verified Official Business"
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-[#25D366] text-white stroke-[2.5]" />
              </div>
            </div>
            <p className="text-[10.5px] text-[#A9DFBF] leading-tight truncate">
              {isTyping ? (
                <span className="font-medium animate-pulse text-white">typing…</span>
              ) : (
                <span>Official Business Account</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right section: Video, Call, 3-dots Menu */}
      <div className="flex items-center gap-2 text-white/95 pr-0.5">
        <button 
          className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Toll-Free Call 1860 233 1234"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button 
          className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Video Assistance"
        >
          <Video className="w-4 h-4" />
        </button>
        <button 
          onClick={onRestart}
          className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Restart Conversation"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
