import React, { useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  Package, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Truck, 
  Plane,
  QrCode,
  Download
} from 'lucide-react';
import { PickupBooking, ShipmentTracking } from '../types';
import { BlueDartLogo } from './BlueDartLogo';

interface ShipmentReceiptModalProps {
  pickup?: PickupBooking | null;
  tracking?: ShipmentTracking | null;
  onClose: () => void;
}

export function ShipmentReceiptModal({ pickup, tracking, onClose }: ShipmentReceiptModalProps) {
  const awbOrRef = pickup?.pickupId || tracking?.awbNumber || 'BD-PU-982410';
  const serviceType = pickup?.serviceType || tracking?.serviceType || 'Apex (Air Express)';
  const weight = pickup?.weight || tracking?.weight || '1.2 kg';

  return (
    <div 
      id="shipment-receipt-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="shipment-receipt-modal"
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <BlueDartLogo size="sm" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                Official Consignment Docket
              </div>
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {awbOrRef}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.print?.()}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: High Density Logistics Consignment Layout */}
        <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <span className="font-bold">Booking Authenticated in Blue Dart COSMAT II System.</span> Scheduled for secure doorstep pickup and connection to nearest aviation linehaul flight.
            </div>
          </div>

          {/* Barcode Docket Visual */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Blue Dart Air Waybill Barcode
            </div>
            <div className="flex items-center justify-center gap-[3px] h-12 w-full max-w-[260px] mx-auto overflow-hidden my-1">
              {[2, 4, 1, 3, 2, 4, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 4, 2].map((w, i) => (
                <div 
                  key={i} 
                  className="bg-slate-900 h-full rounded-[0.5px]" 
                  style={{ width: `${w * 1.8}px` }} 
                />
              ))}
            </div>
            <span className="font-mono text-xs font-bold tracking-widest text-slate-800">
              * {awbOrRef} *
            </span>
          </div>

          {/* Shipper & Consignee Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#002878]" />
                Shipper / Sender
              </div>
              <p className="font-bold text-slate-900 text-xs">{pickup?.contactName || 'Kalyan Kumar'}</p>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                {pickup?.pickupAddress?.houseNo || 'Flat 402, Sai Residency'}, {pickup?.pickupAddress?.street || '12th Main Road, HAL 2nd Stage'}
              </p>
              <p className="text-[11px] text-slate-600">
                {pickup?.pickupAddress?.city || 'Bengaluru'} - {pickup?.pickupAddress?.pincode || '560038'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">{pickup?.contactMobile || '+91 98450 12345'}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Truck className="w-3 h-3 text-[#ED1C24]" />
                Consignee / Destination
              </div>
              <p className="font-bold text-slate-900 text-xs">Destination Delivery Hub</p>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                {pickup?.destinationCity || 'Bandra Kurla Complex, Mumbai'}
              </p>
              <p className="text-[11px] text-slate-600">
                PIN: {pickup?.destinationPincode || '400051'}
              </p>
              <span className="inline-block mt-1 text-[9.5px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                BOM-BLR Linehaul Express
              </span>
            </div>
          </div>

          {/* Consignment Specs */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              Consignment Specifications
            </div>
            <div className="divide-y divide-slate-100 text-[11px]">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Service Category:</span>
                <span className="font-bold text-[#002878]">{serviceType}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Package Type:</span>
                <span className="font-semibold text-slate-800">{pickup?.packageTypeLabel || 'Standard Parcel'}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Actual Weight:</span>
                <span className="font-semibold text-slate-800">{weight}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Pickup Date & Window:</span>
                <span className="font-semibold text-slate-800">
                  {pickup?.pickupDate || 'Tomorrow'} • {pickup?.pickupTimeSlot || '10:00 AM - 01:00 PM'}
                </span>
              </div>
              <div className="p-2.5 flex justify-between bg-slate-50/70 font-semibold">
                <span className="text-slate-700">Estimated Freight Charges:</span>
                <span className="font-bold text-slate-900 text-xs">₹{pickup?.estimatedCost || 280} (Prepaid / UPI)</span>
              </div>
            </div>
          </div>

          {/* Assigned Executive & Security instructions */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-800 block">Pickup Executive</span>
              <span className="font-bold text-xs text-sky-950">Sunil K. (+91 98201 11234)</span>
              <span className="text-[10px] text-slate-500 block">Identity Badge ID: BD-COURIER-4091</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold bg-[#002878] text-white px-2 py-1 rounded-md">
                Verified Safe
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <div className="text-[10px] text-slate-500">
            For support call 1860 233 1234
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#002878] hover:bg-[#001f5c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Docket
          </button>
        </div>
      </div>
    </div>
  );
}
