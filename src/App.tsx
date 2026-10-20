import React, { useState, useRef, useCallback } from 'react';
import { WorkflowType, PickupBooking, ShipmentTracking, SuggestedReplyState } from './types';
import { PhoneFrame } from './components/PhoneFrame';
import { WhatsAppHeader } from './components/WhatsAppHeader';
import { WhatsAppChat } from './components/WhatsAppChat';
import { SuggestedReplyPanel } from './components/SuggestedReplyPanel';
import { ShipmentReceiptModal } from './components/ShipmentReceiptModal';
import { BlueDartLogo } from './components/BlueDartLogo';
import { 
  Package, 
  Truck, 
  RotateCcw, 
  ExternalLink,
  PhoneCall,
  AlertTriangle,
  Building,
  FileText,
  Calendar,
  ShieldCheck,
  Plane,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('track_shipment');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatKey, setChatKey] = useState<number>(0);
  const [suggestedReplyState, setSuggestedReplyState] = useState<SuggestedReplyState | null>(null);
  const [pickupBooking, setPickupBooking] = useState<PickupBooking | null>(null);
  const [activeTracking, setActiveTracking] = useState<ShipmentTracking | null>(null);
  const [showDocketModal, setShowDocketModal] = useState<boolean>(false);

  const sendMessageRef = useRef<((text: string) => void) | null>(null);

  const handleRegisterSendMessage = useCallback((sender: (text: string) => void) => {
    sendMessageRef.current = sender;
  }, []);

  const handleExternalSend = useCallback((text: string) => {
    if (sendMessageRef.current) {
      sendMessageRef.current(text);
    }
  }, []);

  // Quick switch between flows
  const handleSelectWorkflow = (workflow: WorkflowType) => {
    setActiveWorkflow(workflow);
    if (sendMessageRef.current) {
      if (workflow === 'track_shipment') {
        sendMessageRef.current('Track Shipment');
      } else if (workflow === 'schedule_pickup') {
        sendMessageRef.current('Book a Courier Pickup');
      } else if (workflow === 'ndr_reschedule') {
        sendMessageRef.current('Reschedule Failed Delivery');
      } else if (workflow === 'nearest_store') {
        sendMessageRef.current('Find Nearest Store');
      } else if (workflow === 'missed_call_ivr') {
        setChatKey((k) => k + 1);
      }
    }
  };

  // Restart conversation
  const handleRestart = () => {
    setChatKey((k) => k + 1);
  };

  return (
    <div className="w-full min-h-screen lg:h-screen bg-slate-100 flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden font-sans text-slate-800 antialiased">
      {/* Left Column: Blue Dart Logistics Prototype Controls & Live State */}
      <aside 
        id="prototype-control-sidebar"
        className="w-full lg:w-[410px] xl:w-[440px] bg-white border-r border-slate-200 p-4 lg:p-6 flex flex-col justify-between shadow-lg z-20 shrink-0 select-none overflow-y-auto lg:h-full"
      >
        <div>
          {/* Brand Header */}
          <div className="mb-4 border-b border-slate-100 pb-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex items-center justify-between">
              <img
                src="/blue_dart_logo_tight.svg"
                alt="Blue Dart"
                className="h-10 sm:h-11 w-auto object-contain select-none max-w-[250px]"
              />
              <div className="flex flex-col items-end">
                <span className="text-[10px] bg-blue-50 text-[#065dac] font-bold px-2 py-0.5 rounded-full border border-blue-200/80">
                  Official
                </span>
                <span className="text-[8.5px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                  Support API
                </span>
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-3 flex items-center justify-between">
              <span>Conversational Prototype</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/60">
                Official Business API
              </span>
            </div>
          </div>

          {/* Simulated Entry Origin Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#002878] flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-[#002878]" />
                Customer Entry Journey
              </span>
              <span className="text-[9.5px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                Missed Call & IVR Hand-off
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              User dials Blue Dart customer care toll-free line or requests instant WhatsApp assistance to track packages, schedule pickups, or resolve delivery exceptions.
            </p>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Interactive Customer Flows
            </h1>
            <span className="text-[10px] font-medium text-slate-400">Click to switch</span>
          </div>

          {/* Flow 1: Track Shipment */}
          <div
            id="sidebar-flow-track"
            onClick={() => handleSelectWorkflow('track_shipment')}
            className={`border rounded-xl p-3 mb-2.5 transition-all cursor-pointer relative ${
              activeWorkflow === 'track_shipment'
                ? 'border-2 border-[#002878] bg-blue-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#002878] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                Flow 1
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Waybill Tracking</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#002878]" />
              <span>Track Shipment & Milestones</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Instant AWB milestone tracker → Out for delivery status, rider contact & e-POD receipt.
            </p>
          </div>

          {/* Flow 2: Schedule Courier Pickup */}
          <div
            id="sidebar-flow-pickup"
            onClick={() => handleSelectWorkflow('schedule_pickup')}
            className={`border rounded-xl p-3 mb-2.5 transition-all cursor-pointer relative ${
              activeWorkflow === 'schedule_pickup'
                ? 'border-2 border-emerald-600 bg-emerald-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                Flow 2
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Doorstep Pickup</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Schedule a Courier Pickup</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Select parcel type → Pincode check → Date & 3-hour time slot → Barcode docket generation.
            </p>
          </div>

          {/* Flow 3: NDR Reschedule */}
          <div
            id="sidebar-flow-ndr"
            onClick={() => handleSelectWorkflow('ndr_reschedule')}
            className={`border rounded-xl p-3 mb-2.5 transition-all cursor-pointer relative ${
              activeWorkflow === 'ndr_reschedule'
                ? 'border-2 border-rose-600 bg-rose-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                Flow 3
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Exception Management</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>NDR Delivery Reattempt / Reschedule</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Failed delivery attempt alert → Reattempt date & slot, store self-pickup, or security drop.
            </p>
          </div>

          {/* Flow 4: Store Locator */}
          <div
            id="sidebar-flow-store"
            onClick={() => handleSelectWorkflow('nearest_store')}
            className={`border rounded-xl p-3 mb-4 transition-all cursor-pointer relative ${
              activeWorkflow === 'nearest_store'
                ? 'border-2 border-amber-500 bg-amber-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                Flow 4
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Retail Hubs</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-600" />
              <span>Locate Nearest Blue Dart Centre</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Find closest express counters by GPS/pincode → Hours, flight cutoffs & drop-off tokens.
            </p>
          </div>

          {/* Prototype Suggested Reply Panel (Aids evaluator) */}
          <SuggestedReplyPanel
            replyState={suggestedReplyState}
            onSendReply={handleExternalSend}
            isTyping={isTyping}
          />

          {/* Active Logistics Docket Quick View */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#002878]" />
                Active Logistics Docket
              </span>
              <span className="font-mono text-[10px] font-bold text-[#002878]">
                {pickupBooking?.pickupId || activeTracking?.awbNumber || 'BD-849201934'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2 leading-tight">
              {pickupBooking?.status === 'confirmed'
                ? `Doorstep collection booked for ${pickupBooking.pickupDate || 'Tomorrow'} (${pickupBooking.pickupTimeSlot})`
                : activeTracking
                ? `${activeTracking.packageDescription} • ${activeTracking.statusLabel}`
                : 'Waybill docket ready for verification.'}
            </p>
            <button
              onClick={() => setShowDocketModal(true)}
              className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-[#002878] border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            >
              <FileText className="w-3 h-3" />
              <span>Open Official Consignment Docket</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
          <button
            id="btn-sidebar-restart"
            onClick={handleRestart}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Conversation</span>
          </button>
          <button
            onClick={() => handleSelectWorkflow('missed_call_ivr')}
            className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#002878] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Simulate Missed Call entry"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Simulate Call</span>
          </button>
        </div>
      </aside>

      {/* Right Column: Interactive Phone Stage (Authentic WhatsApp Experience) */}
      <main className="flex-1 min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-y-auto">
        <PhoneFrame title="Blue Dart Express WhatsApp Assistant">
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#ECE5DD]">
            <WhatsAppHeader
              onRestart={handleRestart}
              isTyping={isTyping}
            />
            <WhatsAppChat
              key={`bluedart-chat-${chatKey}`}
              initialWorkflow={activeWorkflow}
              onUpdateSuggestedReplies={setSuggestedReplyState}
              onUpdatePickupBooking={setPickupBooking}
              onUpdateActiveTracking={setActiveTracking}
              registerExternalSender={handleRegisterSendMessage}
              onOpenDocketModal={() => setShowDocketModal(true)}
            />
          </div>
        </PhoneFrame>
      </main>

      {/* Official Blue Dart Consignment Docket Modal */}
      {showDocketModal && (
        <ShipmentReceiptModal
          pickup={pickupBooking}
          tracking={activeTracking}
          onClose={() => setShowDocketModal(false)}
        />
      )}
    </div>
  );
}
