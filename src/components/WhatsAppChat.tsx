import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Smile, 
  MapPin, 
  Mic, 
  CheckCheck, 
  ShieldCheck, 
  ChevronDown, 
  List, 
  X, 
  CornerDownLeft,
  Search 
} from 'lucide-react';
import { 
  ChatMessage, 
  ShipmentTracking, 
  PickupBooking, 
  NDRCase, 
  BlueDartStore, 
  WorkflowType, 
  SuggestedReplyState,
  PackageType
} from '../types';
import { 
  SAMPLE_SHIPMENTS, 
  BLUE_DART_STORES, 
  DEFAULT_INITIAL_PICKUP,
  DEFAULT_SAMPLE_NDR 
} from '../data/bluedartData';
import { ShipmentReceiptModal } from './ShipmentReceiptModal';

interface WhatsAppChatProps {
  key?: React.Key;
  initialWorkflow?: WorkflowType;
  onUpdateSuggestedReplies?: (state: SuggestedReplyState | null) => void;
  onUpdatePickupBooking?: (booking: PickupBooking) => void;
  onUpdateActiveTracking?: (tracking: ShipmentTracking | null) => void;
  registerExternalSender?: (sender: (text: string) => void) => void;
  onOpenDocketModal?: () => void;
}

interface BottomSheetConfig {
  title: string;
  subtitle?: string;
  options: {
    id?: string;
    title: string;
    description?: string;
    badge?: string;
  }[];
  onSelect: (optionTitle: string) => void;
}

// ---------------------------------------------------------------------------
// Realistic WhatsApp Text Message Formatters (WhatsApp-Supported Message Formatting)
// ---------------------------------------------------------------------------

function formatShipmentTrackingText(shipment: ShipmentTracking): string {
  const isFailed = shipment.status === 'failed_attempt';
  const isDelivered = shipment.status === 'delivered';
  const isOutForDelivery = shipment.status === 'out_for_delivery';
  const isInTransit = shipment.status === 'in_transit';

  let statusEmoji = '📦';
  if (isOutForDelivery) statusEmoji = '🚚';
  else if (isFailed) statusEmoji = '⚠️';
  else if (isDelivered) statusEmoji = '✅';
  else if (isInTransit) statusEmoji = '✈️';

  let text = `📦 *Blue Dart Express - Shipment Tracking*\n\n`;
  text += `*AWB Number:* *${shipment.awbNumber}*\n`;
  text += `*Delivery Status:* ${statusEmoji} *${shipment.statusLabel}*\n\n`;

  if (isFailed && shipment.failureReason) {
    text += `• *Reason:* ${shipment.failureReason}\n`;
    text += `• *Attempted:* ${shipment.lastUpdated}\n`;
  } else if (isDelivered && shipment.podDeliveredTime) {
    text += `• *Delivered on:* ${shipment.podDeliveredTime}\n`;
    if (shipment.podSignedBy) {
      text += `• *Received by:* ${shipment.podSignedBy}\n`;
    }
  } else {
    text += `• *Expected Delivery:* ${shipment.expectedDelivery}\n`;
    text += `• *Last Update:* ${shipment.lastUpdated}\n`;
  }

  text += `\n📍 *Route:* ${shipment.origin} ➔ ${shipment.destination}\n`;
  text += `📦 *Consignment:* ${shipment.serviceType} • ${shipment.weight} (${shipment.packageDescription})\n`;

  if (shipment.courierAssociate && isOutForDelivery) {
    text += `\n👤 *Delivery Associate:* ${shipment.courierAssociate.name} (${shipment.courierAssociate.phone})\n`;
    if (shipment.courierAssociate.vehicleNumber) {
      text += `🚗 *Vehicle:* ${shipment.courierAssociate.vehicleNumber}\n`;
    }
  } else if (shipment.courierAssociate && isFailed) {
    text += `\n👤 *Associate:* ${shipment.courierAssociate.name} (${shipment.courierAssociate.phone})\n`;
  }

  if (shipment.milestones && shipment.milestones.length > 0) {
    text += `\n📋 *Milestone Updates:*\n`;
    const recentMilestones = shipment.milestones.slice(-3);
    recentMilestones.forEach((m) => {
      const mark = m.current ? '▶' : m.completed ? '✓' : '•';
      text += `${mark} ${m.date}, ${m.time} - ${m.status}\n`;
    });
  }

  return text;
}

function formatPickupReviewText(booking: PickupBooking): string {
  let text = `📋 *Courier Pickup Booking Summary*\n\n`;
  text += `Please review your booking details before confirmation:\n\n`;
  text += `📦 *Consignment Details:*\n`;
  text += `• *Package Type:* ${booking.packageTypeLabel}\n`;
  text += `• *Estimated Weight:* ${booking.weight}\n`;
  text += `• *Service:* ${booking.serviceType || 'Apex (Air Express)'}\n`;
  text += `• *Destination:* ${booking.destinationCity || 'Mumbai (400051)'}\n`;
  text += `• *Estimated Freight:* ₹${booking.estimatedCost}\n\n`;
  text += `📍 *Doorstep Collection Address:*\n`;
  if (booking.pickupAddress) {
    text += `${booking.pickupAddress.houseNo}, ${booking.pickupAddress.street}, ${booking.pickupAddress.city} - ${booking.pickupAddress.pincode}\n\n`;
  } else {
    text += `Flat 402, Sai Residency, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038\n\n`;
  }
  text += `🗓️ *Pickup Schedule:*\n`;
  text += `• *Date:* ${booking.pickupDate || 'Tomorrow (29 Sep 2026)'}\n`;
  text += `• *Window:* ${booking.pickupTimeSlot || '10:00 AM - 01:00 PM'}\n\n`;
  text += `Tap *Confirm Courier Pickup* below to schedule your collection:`;
  return text;
}

function formatPickupConfirmedText(booking: PickupBooking): string {
  let text = `🎉 *Doorstep Courier Pickup Scheduled!*\n\n`;
  text += `*Booking Reference ID:* *${booking.pickupId || 'BD-PU-982410'}*\n`;
  text += `*Delivery Status:* ✅ Scheduled for Collection\n\n`;
  text += `📦 *Shipment Summary:*\n`;
  text += `• *Package Type:* ${booking.packageTypeLabel}\n`;
  text += `• *Weight:* ${booking.weight}\n`;
  text += `• *Service:* ${booking.serviceType || 'Apex (Air Express)'}\n`;
  text += `• *Destination:* ${booking.destinationCity || 'Mumbai (400051)'}\n`;
  text += `• *Estimated Freight:* ₹${booking.estimatedCost}\n\n`;
  text += `📍 *Doorstep Address:*\n`;
  if (booking.pickupAddress) {
    text += `${booking.pickupAddress.houseNo}, ${booking.pickupAddress.street}, ${booking.pickupAddress.city} - ${booking.pickupAddress.pincode}\n\n`;
  } else {
    text += `Flat 402, Sai Residency, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038\n\n`;
  }
  text += `🗓️ *Pickup Arrival Window:*\n`;
  text += `*${booking.pickupDate}* between *${booking.pickupTimeSlot}*\n\n`;
  text += `👤 *Assigned Courier Executive:*\n`;
  text += `*Sunil K.* (+91 98201 11234) • Route #12\n\n`;
  text += `Our executive will carry official tamper-evident security flyers and print your barcode shipping label upon collection.`;
  return text;
}

function formatNDRAlertText(ndr: NDRCase): string {
  let text = `⚠️ *Blue Dart Delivery Exception Alert*\n\n`;
  text += `*AWB Number:* *${ndr.awbNumber}*\n`;
  text += `*Delivery Status:* ⚠️ Delivery Attempt Failed (Customer Unavailable)\n\n`;
  text += `• *Reason:* ${ndr.reason}\n`;
  text += `• *Attempted:* ${ndr.attemptTime}, ${ndr.attemptDate}\n`;
  text += `• *Delivery Address:* ${ndr.originalAddress || '12th Main Road, HAL 2nd Stage, Indiranagar'}\n\n`;
  text += `Please choose an option below to resolve this delivery:`;
  return text;
}

function formatNDRConfirmationText(ndr: NDRCase): string {
  if (ndr.deliveryOption === 'self_pickup') {
    let text = `🏬 *Package Held for Self-Pickup*\n\n`;
    text += `*Ticket ID:* *${ndr.ticketId || 'BD-HOLD-10294'}*\n`;
    text += `*AWB Number:* *#${ndr.awbNumber}*\n`;
    text += `*Delivery Status:* ✅ Secured at Express Centre\n\n`;
    text += `📍 *Pickup Location:*\n`;
    text += `*${ndr.selfPickupStoreName || 'Blue Dart Express Centre - Indiranagar'}*\n`;
    text += `100 Feet Road, Indiranagar, Bengaluru - 560038\n\n`;
    text += `⏰ *Counter Timings:* Mon-Sat 08:30 AM - 09:00 PM\n`;
    text += `🔐 *Pickup Claim Code:* *${ndr.otp || '4821'}*\n\n`;
    text += `Please present a valid photo ID and this claim code at the counter to collect your parcel at your convenience.`;
    return text;
  }

  if (ndr.deliveryOption === 'neighbor_security') {
    let text = `🏢 *Authorized Gate / Security Drop-off*\n\n`;
    text += `*Ticket ID:* *${ndr.ticketId || 'BD-GATE-91823'}*\n`;
    text += `*AWB Number:* *#${ndr.awbNumber}*\n`;
    text += `*Delivery Status:* ✅ Special Delivery Instruction Logged\n\n`;
    text += `📍 *Delivery Target:*\n`;
    text += `*Building Security Guard / Main Gate (Gate A)*\n`;
    text += `Sai Residency, 12th Main Road, Indiranagar\n\n`;
    text += `🔐 *Verification OTP:* *${ndr.otp || '5934'}*\n\n`;
    text += `Our rider will hand over the consignment to building security during tomorrow morning's delivery route. Digital signature and proof-of-delivery photo will be recorded upon handover.`;
    return text;
  }

  // Rescheduled delivery reattempt confirmation:
  const cleanDate = (ndr.reattemptDate || 'Tomorrow (29 Sep)').replace(/^hold\s+for\s+/i, '');
  const cleanSlot = ndr.reattemptSlot || 'Morning (09:30 AM - 01:00 PM)';

  let text = `🎉 *Delivery Reattempt Confirmed & Scheduled!*\n\n`;
  text += `*Ticket ID:* *${ndr.ticketId || 'BD-NDR-82914'}*\n`;
  text += `*AWB Number:* *#${ndr.awbNumber}*\n`;
  text += `*Delivery Status:* ✅ Reattempt Scheduled\n\n`;
  text += `🗓️ *Rescheduled Delivery Window:*\n`;
  text += `• *Reattempt Date:* *${cleanDate}*\n`;
  text += `• *Time Window:* *${cleanSlot}*\n\n`;
  text += `📍 *Delivery Address:*\n`;
  text += `${ndr.originalAddress || '12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038'}\n\n`;
  text += `🔐 *Verification OTP:* *${ndr.otp || '5934'}*\n\n`;
  text += `Please share this 4-digit OTP with your Blue Dart delivery executive upon delivery. The associate has been notified on their hand-held terminal.`;
  return text;
}

function formatNDRReviewText(ndr: NDRCase, dateStr?: string, slotStr?: string): string {
  const rawDate = dateStr || ndr.reattemptDate || 'Tomorrow (29 Sep)';
  const date = rawDate.replace(/^hold\s+for\s+/i, '');
  const slot = slotStr || ndr.reattemptSlot || 'Morning (09:30 AM - 01:00 PM)';
  let text = `📋 *Delivery Reattempt Review Summary*\n\n`;
  text += `Please review and confirm your rescheduled delivery details:\n\n`;
  text += `• *AWB Number:* *#${ndr.awbNumber}*\n`;
  text += `• *Consignee:* ${ndr.recipientName || 'Kalyan Kumar'}\n`;
  text += `• *Delivery Address:* ${ndr.originalAddress || '12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038'}\n`;
  text += `• *Rescheduled Reattempt Date:* *${date}*\n`;
  text += `• *Time Window:* *${slot}*\n`;
  text += `• *Assigned Hub:* Indiranagar Distribution Station\n\n`;
  text += `Tap *Confirm Delivery Reattempt* below to finalize your schedule:`;
  return text;
}

function formatStoreListText(stores: BlueDartStore[], locationTitle?: string): string {
  const locHeading = locationTitle ? ` - ${locationTitle}` : ' - Bengaluru';
  let text = `📍 *Nearby Blue Dart Express Centres${locHeading}*\n\n`;
  text += `Here are the closest service stations to your location:\n\n`;
  stores.forEach((st, idx) => {
    text += `*${idx + 1}. ${st.name}* (${st.distanceKm} km)\n`;
    text += `• Address: ${st.address}\n`;
    text += `• Timings: ${st.timings}\n`;
    text += `• Contact: ${st.phone}\n`;
    text += `• Services: ${st.type}\n\n`;
  });
  text += `Select a centre below to generate a priority counter drop-off token:`;
  return text;
}

function formatStoreDropoffConfirmationText(store: BlueDartStore, tokenId: string): string {
  let text = `🎉 *Priority Counter Drop-off Booked!*\n\n`;
  text += `*Pass Reference ID:* *${tokenId}*\n`;
  text += `*Delivery Status:* ✅ Priority Drop-off Pass Active\n\n`;
  text += `📍 *Selected Blue Dart Service Centre:*\n`;
  text += `*${store.name}*\n`;
  text += `• *Address:* ${store.address}, ${store.city} - ${store.pincode}\n`;
  text += `• *Distance:* ${store.distanceKm} km from your location\n`;
  text += `• *Counter Timings:* ${store.timings}\n`;
  text += `• *Contact Phone:* ${store.phone}\n`;
  if (store.cutoffTime) {
    text += `• *Same-Day Flight Cut-off:* ${store.cutoffTime}\n`;
  }
  text += `\n⏰ *Pass Validity:* Valid today until counter close\n\n`;
  text += `✨ *Priority Drop-off Instructions:*\n`;
  text += `1. Show this *Token ID (${tokenId})* directly at Counter #1 to bypass waiting lines.\n`;
  text += `2. Free official tamper-evident security flyers and shipping labels will be provided.\n`;
  text += `3. Instant digital consignment receipt & Waybill tracking link will be sent to your WhatsApp right after handover.\n\n`;
  text += `Need to track or schedule anything else today?`;
  return text;
}

function getStoresForLocation(query: string): BlueDartStore[] {
  const lower = query.toLowerCase();

  // Indiranagar / East Bengaluru
  if (lower.includes('indiranagar') || lower.includes('560038') || lower.includes('hal') || lower.includes('domlur')) {
    return [
      {
        id: 'store-indiranagar',
        name: 'Blue Dart Express Centre - Indiranagar',
        type: 'Express Centre',
        address: 'No. 542, 100 Feet Road, Near CMH Junction, Indiranagar',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        pincode: '560038',
        distanceKm: 0.8,
        phone: '+91 80 2520 1840',
        timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
        services: ['Same-Day Domestic Booking', 'Air Express (Apex)', 'Document Drop-off', 'Self-Pickup Counter'],
        cutoffTime: 'Same-day flights cutoff: 07:30 PM',
      },
      {
        id: 'store-domlur',
        name: 'Blue Dart Service Station - Domlur',
        type: 'Hub / Service Station',
        address: 'Old Airport Road, Near Domlur Flyover, Domlur',
        locality: 'Domlur',
        city: 'Bengaluru',
        pincode: '560071',
        distanceKm: 1.9,
        phone: '+91 80 2535 2210',
        timings: 'Mon-Sat: 09:00 AM - 08:30 PM | Sun: Closed',
        services: ['Apex Air Express', 'Heavy Cargo Drop-off', 'Digital POD Billing'],
        cutoffTime: 'Flight cutoff: 07:00 PM',
      },
      {
        id: 'store-ulsoor',
        name: 'Blue Dart Retail Counter - Ulsoor',
        type: 'Retail Counter',
        address: 'Kensington Road, Near Trinity Metro Station, Ulsoor',
        locality: 'Ulsoor',
        city: 'Bengaluru',
        pincode: '560008',
        distanceKm: 2.7,
        phone: '+91 80 2559 8812',
        timings: 'Mon-Sat: 09:30 AM - 08:00 PM | Sun: Closed',
        services: ['Doc Express', 'Quick Drop-off', 'Packaging Box Supply'],
        cutoffTime: 'Flight cutoff: 06:30 PM',
      },
    ];
  }

  // Koramangala / South Bengaluru
  if (lower.includes('koramangala') || lower.includes('560034') || lower.includes('hsr') || lower.includes('btm') || lower.includes('south')) {
    return [
      {
        id: 'store-koramangala',
        name: 'Blue Dart Service Station - Koramangala',
        type: 'Hub / Service Station',
        address: 'Plot 78, 80 Feet Main Road, 4th Block, Koramangala',
        locality: 'Koramangala',
        city: 'Bengaluru',
        pincode: '560034',
        distanceKm: 0.6,
        phone: '+91 80 2553 4901',
        timings: 'Mon-Sat: 08:00 AM - 09:30 PM | Sun: 09:30 AM - 05:00 PM',
        services: ['Heavy Parcel / Surface Cargo', 'Apex Air Express', 'Self-Pickup Counter', 'Packaging Assistance'],
        cutoffTime: 'Same-day flights cutoff: 08:00 PM',
      },
      {
        id: 'store-hsr',
        name: 'Blue Dart Express Centre - HSR Layout',
        type: 'Express Centre',
        address: '27th Main Road, Sector 1, HSR Layout',
        locality: 'HSR Layout',
        city: 'Bengaluru',
        pincode: '560102',
        distanceKm: 2.3,
        phone: '+91 80 2258 4110',
        timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
        services: ['E-Commerce Returns', 'Apex Air Express', 'International Priority'],
        cutoffTime: 'Flight cutoff: 07:30 PM',
      },
      {
        id: 'store-btm',
        name: 'Blue Dart Retail Counter - BTM Layout',
        type: 'Retail Counter',
        address: 'Outer Ring Road, Near Udupi Garden Signal, BTM 2nd Stage',
        locality: 'BTM Layout',
        city: 'Bengaluru',
        pincode: '560076',
        distanceKm: 3.5,
        phone: '+91 80 2668 1900',
        timings: 'Mon-Sat: 09:00 AM - 08:00 PM | Sun: Closed',
        services: ['Doc Express', 'Domestic Express', 'Packing Boxes'],
        cutoffTime: 'Flight cutoff: 06:45 PM',
      },
    ];
  }

  // Whitefield / Tech Corridor
  if (lower.includes('whitefield') || lower.includes('560066') || lower.includes('itpl') || lower.includes('marathahalli')) {
    return [
      {
        id: 'store-whitefield',
        name: 'Blue Dart Express Hub - Whitefield',
        type: 'Hub / Service Station',
        address: 'Building 3, ITPL Main Road, Near Hope Farm, Whitefield',
        locality: 'Whitefield',
        city: 'Bengaluru',
        pincode: '560066',
        distanceKm: 0.9,
        phone: '+91 80 2841 5560',
        timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 03:00 PM',
        services: ['Corporate Logistics', 'Surface Express Cargo', 'Critical Spares Delivery'],
        cutoffTime: 'Same-day flights cutoff: 07:45 PM',
      },
      {
        id: 'store-marathahalli',
        name: 'Blue Dart Service Station - Marathahalli',
        type: 'Hub / Service Station',
        address: 'Outer Ring Road, Near Innovative Multiplex, Marathahalli',
        locality: 'Marathahalli',
        city: 'Bengaluru',
        pincode: '560037',
        distanceKm: 3.4,
        phone: '+91 80 2523 9012',
        timings: 'Mon-Sat: 09:00 AM - 08:30 PM | Sun: Closed',
        services: ['Air Express', 'Surface Cargo', 'Tamper-Evident Flyers'],
        cutoffTime: 'Flight cutoff: 07:15 PM',
      },
      {
        id: 'store-brookfield',
        name: 'Blue Dart Retail Counter - Brookfield',
        type: 'Retail Counter',
        address: 'ITPL Main Road, Near Kundalahalli Gate, Brookfield',
        locality: 'Brookfield',
        city: 'Bengaluru',
        pincode: '560037',
        distanceKm: 2.1,
        phone: '+91 80 2854 3320',
        timings: 'Mon-Sat: 09:30 AM - 08:00 PM | Sun: Closed',
        services: ['Doc Express', 'Quick Drop-off', 'Prepaid Label Scanning'],
        cutoffTime: 'Flight cutoff: 06:30 PM',
      },
    ];
  }

  // Central Bengaluru / MG Road
  if (lower.includes('mg road') || lower.includes('560001') || lower.includes('cbd') || lower.includes('brigade') || lower.includes('richmond')) {
    return [
      {
        id: 'store-mg-road',
        name: 'Blue Dart Retail Counter - MG Road',
        type: 'Retail Counter',
        address: 'Shop 14, Barton Centre, 84 M.G. Road',
        locality: 'Central Business District',
        city: 'Bengaluru',
        pincode: '560001',
        distanceKm: 0.5,
        phone: '+91 80 2558 9200',
        timings: 'Mon-Sat: 09:00 AM - 08:00 PM | Sun: Closed',
        services: ['Doc Express', 'International Priority (DHL)', 'Quick Drop-off'],
        cutoffTime: 'Flight cutoff: 06:30 PM',
      },
      {
        id: 'store-richmond',
        name: 'Blue Dart Express Centre - Richmond Town',
        type: 'Express Centre',
        address: 'No. 22, Langford Road, Opposite Hockey Stadium, Richmond Town',
        locality: 'Richmond Town',
        city: 'Bengaluru',
        pincode: '560025',
        distanceKm: 1.7,
        phone: '+91 80 2221 4455',
        timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
        services: ['Apex Air Express', 'Surface Cargo', 'Self-Pickup Counter'],
        cutoffTime: 'Flight cutoff: 07:30 PM',
      },
      {
        id: 'store-indiranagar',
        name: 'Blue Dart Express Centre - Indiranagar',
        type: 'Express Centre',
        address: 'No. 542, 100 Feet Road, Near CMH Junction, Indiranagar',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        pincode: '560038',
        distanceKm: 4.2,
        phone: '+91 80 2520 1840',
        timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
        services: ['Same-Day Domestic Booking', 'Air Express (Apex)', 'Document Drop-off'],
        cutoffTime: 'Flight cutoff: 07:30 PM',
      },
    ];
  }

  // Mumbai / BKC / Bandra
  if (lower.includes('mumbai') || lower.includes('bkc') || lower.includes('bandra') || lower.includes('400051')) {
    return [
      {
        id: 'store-mumbai-bkc',
        name: 'Blue Dart Express Centre - BKC Hub',
        type: 'Express Centre',
        address: 'Unit 102, Platina Building, G-Block, Bandra Kurla Complex',
        locality: 'Bandra Kurla Complex',
        city: 'Mumbai',
        pincode: '400051',
        distanceKm: 0.7,
        phone: '+91 22 2652 8900',
        timings: 'Mon-Sat: 08:00 AM - 09:30 PM | Sun: 10:00 AM - 05:00 PM',
        services: ['Apex Air Express', 'Corporate Desk', 'Critical Freight', 'Security Flyer Packaging'],
        cutoffTime: 'Same-day flights cutoff: 08:30 PM',
      },
      {
        id: 'store-mumbai-bandra',
        name: 'Blue Dart Service Station - Bandra West',
        type: 'Hub / Service Station',
        address: 'Hill Road, Opposite St. Josephs Convent, Bandra West',
        locality: 'Bandra West',
        city: 'Mumbai',
        pincode: '400050',
        distanceKm: 2.4,
        phone: '+91 22 2640 1120',
        timings: 'Mon-Sat: 09:00 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
        services: ['Priority Air Drop-off', 'International Shipping', 'Self-Pickup Counter'],
        cutoffTime: 'Flight cutoff: 07:45 PM',
      },
      {
        id: 'store-mumbai-airport',
        name: 'Blue Dart Aviation Cargo Gateway - Santacruz',
        type: 'Hub / Service Station',
        address: 'Air Cargo Complex, Terminal 1B Road, Santacruz East',
        locality: 'Santacruz',
        city: 'Mumbai',
        pincode: '400099',
        distanceKm: 3.9,
        phone: '+91 22 2615 7000',
        timings: 'Open 24 Hours / 7 Days a Week',
        services: ['24x7 Night Express Drop-off', 'Boeing 757 Direct Linehaul', 'Urgent Medical Logistics'],
        cutoffTime: 'Late night flight cutoff: 11:00 PM',
      },
    ];
  }

  // New Delhi / Connaught Place
  if (lower.includes('delhi') || lower.includes('cp') || lower.includes('connaught') || lower.includes('110001')) {
    return [
      {
        id: 'store-delhi-cp',
        name: 'Blue Dart Express Centre - Connaught Place',
        type: 'Express Centre',
        address: 'Radial Road 4, Inner Circle, Block E, Connaught Place',
        locality: 'Connaught Place',
        city: 'New Delhi',
        pincode: '110001',
        distanceKm: 0.6,
        phone: '+91 11 2332 5400',
        timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
        services: ['Apex Air Express', 'Embassy & Visa Documents', 'Tamper-Evident Flyers'],
        cutoffTime: 'Same-day flights cutoff: 08:00 PM',
      },
      {
        id: 'store-delhi-nehru-place',
        name: 'Blue Dart Service Station - Nehru Place',
        type: 'Hub / Service Station',
        address: 'Commercial Tower A, Financial District, Nehru Place',
        locality: 'Nehru Place',
        city: 'New Delhi',
        pincode: '110019',
        distanceKm: 4.5,
        phone: '+91 11 2644 8920',
        timings: 'Mon-Sat: 09:00 AM - 08:30 PM | Sun: Closed',
        services: ['Tech Logistics', 'Surface Express', 'Corporate Bulk Drop-off'],
        cutoffTime: 'Flight cutoff: 07:30 PM',
      },
      {
        id: 'store-delhi-karol-bagh',
        name: 'Blue Dart Retail Counter - Karol Bagh',
        type: 'Retail Counter',
        address: 'Pusa Road, Near Karol Bagh Metro Station, Karol Bagh',
        locality: 'Karol Bagh',
        city: 'New Delhi',
        pincode: '110005',
        distanceKm: 3.8,
        phone: '+91 11 2575 3300',
        timings: 'Mon-Sat: 09:30 AM - 08:00 PM | Sun: Closed',
        services: ['Doc Express', 'Quick Drop-off Counter', 'Packaging Boxes'],
        cutoffTime: 'Flight cutoff: 06:45 PM',
      },
    ];
  }

  // Any custom query/city/area/pincode:
  const cleanLoc = query.replace(/[📍•]/g, '').trim() || 'Your Area';
  return [
    {
      id: `store-custom-1`,
      name: `Blue Dart Express Centre - ${cleanLoc}`,
      type: 'Express Centre',
      address: `Main Commercial High Street, Near Central Junction, ${cleanLoc}`,
      locality: cleanLoc,
      city: cleanLoc,
      pincode: /\d{6}/.test(query) ? query.match(/\d{6}/)![0] : '560001',
      distanceKm: 0.9,
      phone: '+91 1860 233 1234',
      timings: 'Mon-Sat: 08:30 AM - 09:00 PM | Sun: 10:00 AM - 04:00 PM',
      services: ['Apex Air Express', 'Doc Express', 'Tamper-Evident Flyers', 'Priority Counter'],
      cutoffTime: 'Same-day flights cutoff: 07:30 PM',
    },
    {
      id: `store-custom-2`,
      name: `Blue Dart Service Station - ${cleanLoc} Hub`,
      type: 'Hub / Service Station',
      address: `Industrial Service Area, Ring Road Sector, ${cleanLoc}`,
      locality: cleanLoc,
      city: cleanLoc,
      pincode: /\d{6}/.test(query) ? query.match(/\d{6}/)![0] : '560001',
      distanceKm: 2.4,
      phone: '+91 1860 233 1234',
      timings: 'Mon-Sat: 09:00 AM - 08:30 PM | Sun: Closed',
      services: ['Surface Express Cargo', 'Air Express (Apex)', 'Heavy Consignments'],
      cutoffTime: 'Flight cutoff: 07:00 PM',
    },
    {
      id: `store-custom-3`,
      name: `Blue Dart Retail Counter - ${cleanLoc} Market`,
      type: 'Retail Counter',
      address: `Station Road, Opposite City Mall, ${cleanLoc}`,
      locality: cleanLoc,
      city: cleanLoc,
      pincode: /\d{6}/.test(query) ? query.match(/\d{6}/)![0] : '560001',
      distanceKm: 3.8,
      phone: '+91 1860 233 1234',
      timings: 'Mon-Sat: 09:30 AM - 08:00 PM | Sun: Closed',
      services: ['Quick Drop-off', 'Document Courier', 'Packaging Supplies'],
      cutoffTime: 'Flight cutoff: 06:30 PM',
    },
  ];
}

function getLocationTitle(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('indiranagar') || lower.includes('560038')) return 'Indiranagar, Bengaluru';
  if (lower.includes('koramangala') || lower.includes('560034')) return 'Koramangala, Bengaluru';
  if (lower.includes('whitefield') || lower.includes('560066')) return 'Whitefield, Bengaluru';
  if (lower.includes('mg road') || lower.includes('560001')) return 'MG Road / CBD, Bengaluru';
  if (lower.includes('mumbai') || lower.includes('bkc') || lower.includes('400051')) return 'BKC, Mumbai';
  if (lower.includes('delhi') || lower.includes('cp') || lower.includes('110001')) return 'Connaught Place, New Delhi';
  return query.replace(/[📍•]/g, '').trim() || 'Your Location';
}

function renderWhatsAppFormattedText(rawText: string) {
  return rawText.split('\n').map((line, lineIdx) => {
    if (line === '') {
      return <div key={lineIdx} className="h-2" />;
    }

    // Split by *bold*
    const boldParts = line.split(/(\*[^*]+\*)/g);

    return (
      <div key={lineIdx} className="min-h-[1.15rem]">
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('*') && bPart.endsWith('*') && bPart.length >= 2) {
            const inner = bPart.slice(1, -1);
            return (
              <strong key={bIdx} className="font-bold text-slate-900">
                {renderItalicSegments(inner)}
              </strong>
            );
          }
          return <React.Fragment key={bIdx}>{renderItalicSegments(bPart)}</React.Fragment>;
        })}
      </div>
    );
  });
}

function renderItalicSegments(text: string) {
  const italicParts = text.split(/(_[^_]+_)/g);
  return italicParts.map((iPart, iIdx) => {
    if (iPart.startsWith('_') && iPart.endsWith('_') && iPart.length >= 2) {
      return (
        <em key={iIdx} className="italic text-slate-600">
          {iPart.slice(1, -1)}
        </em>
      );
    }
    return <span key={iIdx}>{iPart}</span>;
  });
}

// ---------------------------------------------------------------------------
// Main WhatsApp Chat Component
// ---------------------------------------------------------------------------

export function WhatsAppChat({
  initialWorkflow = 'track_shipment',
  onUpdateSuggestedReplies,
  onUpdatePickupBooking,
  onUpdateActiveTracking,
  registerExternalSender,
  onOpenDocketModal,
}: WhatsAppChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [pickup, setPickup] = useState<PickupBooking>(DEFAULT_INITIAL_PICKUP);
  const [activeTracking, setActiveTracking] = useState<ShipmentTracking | null>(SAMPLE_SHIPMENTS['849201934']);
  const [activeNdr, setActiveNdr] = useState<NDRCase>(DEFAULT_SAMPLE_NDR);
  const [showDocketModal, setShowDocketModal] = useState<boolean>(false);
  const [displayedStores, setDisplayedStores] = useState<BlueDartStore[]>(BLUE_DART_STORES);
  const [searchedLocation, setSearchedLocation] = useState<string>('Bengaluru');
  
  // WhatsApp Bottom Sheet Picker State
  const [bottomSheet, setBottomSheet] = useState<BottomSheetConfig | null>(null);
  const [selectedSheetOption, setSelectedSheetOption] = useState<string | null>(null);
  const [sheetSearchQuery, setSheetSearchQuery] = useState<string>('');

  // Conversation stages
  const [step, setStep] = useState<
    | 'welcome_menu'
    | 'tracking_input'
    | 'tracking_view'
    | 'pickup_package_select'
    | 'pickup_weight_input'
    | 'pickup_address_confirm'
    | 'pickup_dest_pincode'
    | 'pickup_date_select'
    | 'pickup_slot_select'
    | 'pickup_contact_confirm'
    | 'pickup_review'
    | 'pickup_confirmed'
    | 'ndr_alert_view'
    | 'ndr_reattempt_date'
    | 'ndr_reattempt_slot'
    | 'ndr_reattempt_review'
    | 'ndr_neighbor_details'
    | 'ndr_store_select'
    | 'ndr_confirmed'
    | 'store_search'
    | 'store_view'
    | 'store_dropoff_confirm'
    | 'rate_calculator'
  >('welcome_menu');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    onUpdatePickupBooking?.(pickup);
  }, [pickup, onUpdatePickupBooking]);

  useEffect(() => {
    onUpdateActiveTracking?.(activeTracking);
  }, [activeTracking, onUpdateActiveTracking]);

  // Initial welcome sequence
  useEffect(() => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let initialBotMsg: ChatMessage;

    if (initialWorkflow === 'missed_call_ivr') {
      initialBotMsg = {
        id: 'msg-missed-call-bot',
        sender: 'bot',
        timestamp: timeNow,
        text: '📞 Hello! Thank you for calling Blue Dart Customer Care (1860 233 1234).\n\nTo skip phone wait times, our automated WhatsApp Assistant is ready to help you instantly.\n\nWhat can we assist you with today?',
        type: 'text',
        quickReplies: ['Track Shipment', 'Book a Courier Pickup', 'Reschedule Failed Delivery', 'Find Nearest Store'],
      };
    } else if (initialWorkflow === 'ndr_reschedule') {
      initialBotMsg = {
        id: 'msg-ndr-init-bot',
        sender: 'bot',
        timestamp: timeNow,
        text: formatNDRAlertText(DEFAULT_SAMPLE_NDR),
        type: 'text',
        quickReplies: ['Reschedule Delivery Date & Slot', 'Hold for Self-Pickup at Store', 'Leave with Security/Neighbor'],
      };
      setStep('ndr_alert_view');
      setMessages([initialBotMsg]);
      return;
    } else {
      initialBotMsg = {
        id: 'msg-welcome-bot',
        sender: 'bot',
        timestamp: timeNow,
        text: '👋 Welcome to *Blue Dart Express*!\n\nSouth Asia’s premier express air and integrated logistics service.\n\nHow can we help you today?',
        type: 'text',
        quickReplies: ['Track Shipment', 'Book a Courier Pickup', 'Reschedule Failed Delivery', 'Find Nearest Store'],
      };
    }

    setMessages([
      {
        id: 'msg-entry-user',
        sender: 'user',
        timestamp: timeNow,
        text: initialWorkflow === 'missed_call_ivr' ? '📞 Call from +91 98450 12345' : 'Hi Blue Dart',
      },
      initialBotMsg,
    ]);
    setStep('welcome_menu');
  }, [initialWorkflow]);

  // Update Suggested Reply Panel for sidebar
  useEffect(() => {
    let replyState: SuggestedReplyState | null = null;

    if (step === 'welcome_menu') {
      replyState = {
        stepDescription: 'Select a primary Blue Dart logistics service to begin:',
        primaryReply: 'Track Shipment',
        options: [
          { label: 'Track Shipment' },
          { label: 'Book a Courier Pickup' },
          { label: 'Reschedule Failed Delivery' },
          { label: 'Find Nearest Store' },
        ],
      };
    } else if (step === 'tracking_input') {
      replyState = {
        stepDescription: 'Tap a sample Waybill (AWB) or enter your tracking number:',
        primaryReply: 'Track 849201934 (Out for Delivery)',
        options: [
          { label: 'Track 849201934 (Out for Delivery)' },
          { label: 'Track 729184019 (Failed Attempt / NDR)' },
          { label: 'Track 592810482 (In Flight Transit)' },
          { label: 'Track 301984210 (Delivered)' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'tracking_view') {
      replyState = {
        stepDescription: 'Shipment tracking details loaded. Choose next action:',
        primaryReply: 'Book a Courier Pickup',
        options: [
          { label: 'Book a Courier Pickup' },
          { label: 'Find Nearest Store' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'pickup_package_select') {
      replyState = {
        stepDescription: 'Select Package Type (Document or Parcel):',
        primaryReply: 'Document',
        options: [
          { label: 'Document' },
          { label: 'Parcel' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'pickup_weight_input') {
      replyState = {
        stepDescription: 'Enter shipment weight (0.1 kg to 19.9 kg):',
        primaryReply: '0.5 kg',
        options: [
          { label: '0.5 kg' },
          { label: '1.0 kg' },
          { label: '2.5 kg' },
          { label: '5.0 kg' },
          { label: '20 kg (Test Overweight)' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'pickup_address_confirm') {
      replyState = {
        stepDescription: 'Confirm doorstep pickup address for courier collection:',
        primaryReply: 'Confirm Current Address',
        options: [
          { label: 'Confirm Current Address' },
          { label: 'Change Pickup Pincode' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'pickup_date_select') {
      replyState = {
        stepDescription: 'Select your preferred courier collection date:',
        primaryReply: 'Tomorrow (29 Sep 2026)',
        options: [
          { label: 'Tomorrow (29 Sep 2026)' },
          { label: 'Today (Evening Collection)' },
          { label: 'Day After Tomorrow' },
        ],
      };
    } else if (step === 'pickup_slot_select') {
      replyState = {
        stepDescription: 'Select a 3-hour doorstep pickup time window:',
        primaryReply: 'Morning (10:00 AM - 01:00 PM)',
        options: [
          { label: 'Morning (10:00 AM - 01:00 PM)' },
          { label: 'Afternoon (02:00 PM - 05:00 PM)' },
          { label: 'Evening (05:30 PM - 08:30 PM)' },
        ],
      };
    } else if (step === 'pickup_review') {
      replyState = {
        stepDescription: 'Review pickup summary and confirm booking:',
        primaryReply: 'Confirm Courier Pickup',
        options: [
          { label: 'Confirm Courier Pickup' },
          { label: 'Change Pickup Time Slot' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'pickup_confirmed') {
      replyState = {
        stepDescription: 'Pickup scheduled! Waybill reference generated:',
        primaryReply: 'Track Another Shipment',
        options: [
          { label: 'Track Another Shipment' },
          { label: 'Find Nearest Store' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'ndr_alert_view') {
      replyState = {
        stepDescription: 'Select how you want to resolve the failed delivery attempt:',
        primaryReply: 'Reschedule Delivery Date & Slot',
        options: [
          { label: 'Reschedule Delivery Date & Slot' },
          { label: 'Hold for Self-Pickup at Store' },
          { label: 'Leave with Security/Neighbor' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'ndr_reattempt_date') {
      replyState = {
        stepDescription: 'Choose reattempt delivery date:',
        primaryReply: 'Tomorrow (29 Sep)',
        options: [
          { label: 'Tomorrow (29 Sep)' },
          { label: 'Day After Tomorrow (30 Sep)' },
          { label: 'Saturday (03 Oct)' },
        ],
      };
    } else if (step === 'ndr_reattempt_slot') {
      replyState = {
        stepDescription: 'Choose delivery reattempt time window:',
        primaryReply: 'Morning (09:30 AM - 01:00 PM)',
        options: [
          { label: 'Morning (09:30 AM - 01:00 PM)' },
          { label: 'Afternoon (02:00 PM - 05:30 PM)' },
          { label: 'Evening (06:00 PM - 08:30 PM)' },
        ],
      };
    } else if (step === 'ndr_reattempt_review') {
      replyState = {
        stepDescription: 'Review and confirm delivery reattempt schedule:',
        primaryReply: 'Confirm Delivery Reattempt',
        options: [
          { label: 'Confirm Delivery Reattempt' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'ndr_confirmed') {
      replyState = {
        stepDescription: 'Reattempt confirmed with verification OTP:',
        primaryReply: 'Track Status of Reattempt',
        options: [
          { label: 'Track Status of Reattempt' },
          { label: 'Book a Courier Pickup' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'store_search') {
      replyState = {
        stepDescription: 'Choose or enter your location to view closest Blue Dart centres:',
        primaryReply: 'Indiranagar / East Bengaluru (560038)',
        options: [
          { label: 'Indiranagar / East Bengaluru (560038)' },
          { label: 'Koramangala / South Bengaluru (560034)' },
          { label: 'Whitefield Tech Corridor (560066)' },
          { label: 'Mumbai - BKC / Bandra (400051)' },
          { label: 'Delhi - Connaught Place (110001)' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'store_view') {
      const topStore = displayedStores[0] || BLUE_DART_STORES[0];
      const dropoffReply = `Book Drop-off at ${topStore.name.replace('Blue Dart ', '')}`;
      replyState = {
        stepDescription: 'Select a nearby centre to book a priority counter drop-off token:',
        primaryReply: dropoffReply,
        options: [
          { label: dropoffReply },
          { label: 'Change Location' },
          { label: 'Track Shipment' },
          { label: 'Book a Courier Pickup' },
          { label: 'Back to Main Menu' },
        ],
      };
    } else if (step === 'store_dropoff_confirm') {
      replyState = {
        stepDescription: 'Priority drop-off pass confirmed! What would you like to do next?',
        primaryReply: 'Find Another Store',
        options: [
          { label: 'Find Another Store' },
          { label: 'Track Shipment' },
          { label: 'Book a Courier Pickup' },
          { label: 'Back to Main Menu' },
        ],
      };
    }

    onUpdateSuggestedReplies?.(replyState);
  }, [step, onUpdateSuggestedReplies]);

  // Core handler for all conversational incoming messages
  const handleSendMessage = useCallback((textToSend: string) => {
    if (!textToSend.trim()) return;

    // Close any open bottom sheet
    setBottomSheet(null);

    const trimmed = textToSend.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      timestamp: timeNow,
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Process Intent & Respond after realistic typing delay
    setTimeout(() => {
      setIsTyping(false);
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const lower = trimmed.toLowerCase();

      // Navigation back to Main Menu
      if (lower.includes('back') || lower === 'main menu' || lower === 'menu') {
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: 'Here is what I can help you with today:',
          type: 'text',
          quickReplies: ['Track Shipment', 'Book a Courier Pickup', 'Reschedule Failed Delivery', 'Find Nearest Store'],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('welcome_menu');
        return;
      }

      // FLOW 1: Track Shipment
      if (
        lower === 'track shipment' || 
        lower.startsWith('track') || 
        /\b\d{8,11}\b/.test(lower) || 
        step === 'tracking_input'
      ) {
        const awbMatch = trimmed.match(/\d{9}/) || trimmed.match(/\d{8,10}/);
        const awb = awbMatch ? awbMatch[0] : null;

        if (awb && SAMPLE_SHIPMENTS[awb]) {
          const shipment = SAMPLE_SHIPMENTS[awb];
          setActiveTracking(shipment);
          const isFailed = shipment.status === 'failed_attempt';
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: 'bot',
            timestamp: botTimestamp,
            text: formatShipmentTrackingText(shipment),
            type: 'text',
            quickReplies: isFailed
              ? ['Reschedule Delivery Date & Slot', 'Find Nearest Store']
              : ['Book a Courier Pickup', 'Find Nearest Store'],
          };
          setMessages((prev) => [...prev, reply]);
          setStep('tracking_view');
          return;
        }

        if (!awb || !SAMPLE_SHIPMENTS[awb]) {
          if (awb) {
            const dynamicShipment: ShipmentTracking = {
              awbNumber: awb,
              senderName: 'Registered Merchant Partner',
              recipientName: 'Kalyan Kumar',
              origin: 'Mumbai Hub',
              destination: 'Bengaluru (560038)',
              status: 'in_transit',
              statusLabel: 'In Flight Linehaul BD-Air',
              statusColor: 'text-sky-600 bg-sky-50 border-sky-200',
              serviceType: 'Apex (Air Express)',
              packageDescription: 'Express Secure Consignment',
              weight: '1.2 kg',
              pieces: 1,
              expectedDelivery: 'Tomorrow by 01:00 PM',
              lastUpdated: 'Connecting Flights, BOM-BLR',
              milestones: [
                { status: 'Booked & Manifested', time: '10:00 AM', date: 'Today', location: 'Mumbai Gateway', completed: true },
                { status: 'Departed Mumbai Airport', time: '02:30 PM', date: 'Today', location: 'Linehaul Boeing 757', completed: true, current: true },
                { status: 'Expected Arrival Indiranagar Station', time: '07:00 PM', date: 'Today', location: 'Bengaluru Hub', completed: false },
                { status: 'Out for Delivery', time: '09:30 AM', date: 'Tomorrow', location: 'Local Delivery Area', completed: false },
              ],
            };
            setActiveTracking(dynamicShipment);
            const reply: ChatMessage = {
              id: `msg-${Date.now()}-bot`,
              sender: 'bot',
              timestamp: botTimestamp,
              text: formatShipmentTrackingText(dynamicShipment),
              type: 'text',
              quickReplies: ['Book a Courier Pickup', 'Find Nearest Store'],
            };
            setMessages((prev) => [...prev, reply]);
            setStep('tracking_view');
            return;
          }

          // Show tracking prompt with List Message / Attached Buttons
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: 'bot',
            timestamp: botTimestamp,
            text: '🔍 Please choose one of our demonstration Waybill shipments below, or type your custom 9-digit AWB number:',
            listButtonLabel: 'Select Waybill to Track',
            listOptions: [
              { id: '849201934', title: 'Track 849201934 (Out for Delivery)', description: 'Apple Electronics • Expected today by 4:30 PM', badge: 'Active' },
              { id: '729184019', title: 'Track 729184019 (Failed Attempt / NDR)', description: 'Zara Consignment • Premises Closed', badge: 'Exception' },
              { id: '592810482', title: 'Track 592810482 (In Flight Transit)', description: 'Dell Logistics • Boeing 757 Linehaul', badge: 'Air Express' },
              { id: '301984210', title: 'Track 301984210 (Delivered)', description: 'Amazon Prime • Signed via OTP', badge: 'Completed' },
            ],
            quickReplies: [
              'Track 849201934 (Out for Delivery)',
              'Track 729184019 (Failed Attempt / NDR)',
              'Track 592810482 (In Flight Transit)',
            ],
          };
          setMessages((prev) => [...prev, reply]);
          setStep('tracking_input');
          return;
        }
      }

      // FLOW 2: Schedule Courier Pickup
      if (lower.includes('book a courier pickup') || lower.includes('schedule pickup') || lower.includes('send courier')) {
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: '📦 *Doorstep Courier Pickup Booking*\n\nBlue Dart will collect your package directly from your home or office with tamper-evident flyer bags.\n\nPlease select the *Package Type*:',
          listButtonLabel: 'Choose Package Type',
          listOptions: [
            { id: 'document', title: 'Document', description: 'Letters, documents, and paper consignments' },
            { id: 'parcel', title: 'Parcel', description: 'Boxes, merchandise, and general goods' },
          ],
          quickReplies: [
            'Document',
            'Parcel',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_package_select');
        return;
      }

      // Pickup Step: Package Type Selection
      if (step === 'pickup_package_select') {
        let pkgLabel: 'Document' | 'Parcel' = 'Parcel';
        let pkgType: PackageType = 'parcel';

        if (lower.includes('doc')) {
          pkgType = 'document';
          pkgLabel = 'Document';
        } else {
          pkgType = 'parcel';
          pkgLabel = 'Parcel';
        }

        setPickup((prev) => ({
          ...prev,
          packageType: pkgType,
          packageTypeLabel: pkgLabel,
        }));

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: `✅ Package Type: *${pkgLabel}*\n\nPlease enter the *Weight (kg)* of your shipment:\n_(Allowed weight: 0.1 kg to 19.9 kg)_`,
          quickReplies: [
            '0.5 kg',
            '1.0 kg',
            '2.5 kg',
            '5.0 kg',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_weight_input');
        return;
      }

      // Pickup Step: Weight Input & Validation (0.1 kg - 19.9 kg)
      if (step === 'pickup_weight_input') {
        if (lower.includes('store') || lower.includes('find nearest')) {
          handleSendMessage('Find Nearest Store');
          return;
        }

        const weightMatch = trimmed.match(/(\d+(\.\d+)?)/);
        const enteredWeight = weightMatch ? parseFloat(weightMatch[0]) : null;

        if (enteredWeight === null || enteredWeight < 0.1) {
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: 'bot',
            timestamp: botTimestamp,
            text: '⚠️ Minimum weight is *0.1 kg*. Please enter a valid weight between *0.1 kg* and *19.9 kg*:',
            quickReplies: ['0.5 kg', '1.0 kg', '2.5 kg', '5.0 kg'],
          };
          setMessages((prev) => [...prev, reply]);
          return;
        }

        if (enteredWeight >= 20) {
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: 'bot',
            timestamp: botTimestamp,
            text: 'WhatsApp bookings are for parcels under 20 kg. Please visit a Blue Dart store.',
            quickReplies: [
              'Find Nearest Store',
              '0.5 kg',
              '1.0 kg',
              '5.0 kg',
            ],
          };
          setMessages((prev) => [...prev, reply]);
          return;
        }

        // Valid weight: 0.1 kg to 19.9 kg
        const weightStr = `${enteredWeight} kg`;
        const baseCost = pickup.packageType === 'document'
          ? 160 + (enteredWeight > 0.5 ? Math.ceil((enteredWeight - 0.5) / 0.5) * 40 : 0)
          : 200 + Math.ceil(enteredWeight) * 50;

        setPickup((prev) => ({
          ...prev,
          weight: weightStr,
          weightEstimateKg: enteredWeight,
          estimatedCost: baseCost,
        }));

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: `✅ Package Type: *${pickup.packageTypeLabel}*\n⚖️ Weight: *${weightStr}*\n\nPlease confirm your pickup doorstep address:\n\n📍 *Flat 402, Sai Residency, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038*`,
          quickReplies: ['Confirm Current Address', 'Change Pickup Pincode', 'Back to Main Menu'],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_address_confirm');
        return;
      }

      // Pickup Step: Address Confirm -> Confirmation message comes directly!
      if (
        step === 'pickup_address_confirm' || 
        lower.includes('confirm current address') || 
        (step === 'pickup_address_confirm' && (lower.includes('confirm') || lower.includes('yes')))
      ) {
        if (lower.includes('change')) {
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: 'bot',
            timestamp: botTimestamp,
            text: 'Please enter your new 6-digit pickup pincode or full pickup address in Bengaluru:',
            quickReplies: ['560038 (Indiranagar)', '560034 (Koramangala)', '560066 (Whitefield)', 'Back to Main Menu'],
          };
          setMessages((prev) => [...prev, reply]);
          return;
        }

        const serviceName = pickup.packageType === 'document' ? 'Doc Express' : 'Apex (Air Express)';
        const destCity = pickup.destinationCity || 'Bandra Kurla Complex, Mumbai';
        const destPin = pickup.destinationPincode || '400051';
        const cost = pickup.estimatedCost || (pickup.packageType === 'document' ? 160 : 250);

        setPickup((prev) => ({
          ...prev,
          serviceType: serviceName,
          destinationCity: destCity,
          destinationPincode: destPin,
          estimatedCost: cost,
          pickupAddress: {
            pincode: '560038',
            houseNo: 'Flat 402, Sai Residency',
            street: '12th Main Road, HAL 2nd Stage, Indiranagar',
            landmark: 'Opp. BDA Complex',
            city: 'Bengaluru',
            state: 'Karnataka',
          },
        }));

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: `✅ *Doorstep Pickup Address Confirmed!*\n\n📍 *Doorstep Collection Address:*\n*Flat 402, Sai Residency, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038*\n• Consignor: Kalyan Kumar (+91 98450 12345)\n\n📋 *Shipment Rate & Service Quote:*\n• *Package Type:* ${pickup.packageTypeLabel}\n• *Weight:* ${pickup.weight || '0.5 kg'}\n• *Route:* Bengaluru (560038) ➔ ${destCity} (${destPin})\n• *Service:* ${serviceName}\n• *Estimated Freight:* ₹${cost}\n\nWhich day should our courier executive arrive for pickup?`,
          listButtonLabel: 'Select Collection Date',
          listOptions: [
            { id: 'tomorrow', title: 'Tomorrow (29 Sep 2026)', description: 'Standard Doorstep Slot Available', badge: 'Recommended' },
            { id: 'today', title: 'Today (Evening Collection)', description: 'Express Same-Day Slot (Before 8 PM)', badge: 'Fastest' },
            { id: 'dayafter', title: 'Day After Tomorrow (30 Sep)', description: 'Advance Planned Pickup', badge: 'Scheduled' },
          ],
          quickReplies: [
            'Tomorrow (29 Sep 2026)',
            'Today (Evening Collection)',
            'Day After Tomorrow',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_date_select');
        return;
      }

      // Pickup Step: Date select
      if (step === 'pickup_date_select') {
        let selectedDate = 'Tomorrow (29 Sep 2026)';
        if (lower.includes('today')) {
          selectedDate = 'Today (28 Sep 2026)';
        } else if (lower.includes('day after')) {
          selectedDate = 'Day After Tomorrow (30 Sep 2026)';
        }

        setPickup((prev) => ({ ...prev, pickupDate: selectedDate }));

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: `🗓️ Collection Date: *${selectedDate}*\n\nPlease choose a 3-hour doorstep pickup time window:`,
          listButtonLabel: 'Select 3-Hour Time Window',
          listOptions: [
            { id: 'morning', title: 'Morning (10:00 AM - 01:00 PM)', description: 'First delivery route & airport connection', badge: 'Popular' },
            { id: 'afternoon', title: 'Afternoon (02:00 PM - 05:00 PM)', description: 'Post-lunch office & residential collection', badge: 'Standard' },
            { id: 'evening', title: 'Evening (05:30 PM - 08:30 PM)', description: 'Late evening pickup before night flight departure', badge: 'Apex Air' },
          ],
          quickReplies: [
            'Morning (10:00 AM - 01:00 PM)',
            'Afternoon (02:00 PM - 05:00 PM)',
            'Evening (05:30 PM - 08:30 PM)',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_slot_select');
        return;
      }

      // Pickup Step: Slot select -> Review
      if (step === 'pickup_slot_select') {
        let slot = '10:00 AM - 01:00 PM';
        if (lower.includes('afternoon') || lower.includes('2')) {
          slot = '02:00 PM - 05:00 PM';
        } else if (lower.includes('evening') || lower.includes('5')) {
          slot = '05:30 PM - 08:30 PM';
        }

        const updatedPickup: PickupBooking = {
          ...pickup,
          pickupTimeSlot: slot,
          status: 'reviewing',
        };
        setPickup(updatedPickup);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatPickupReviewText(updatedPickup),
          type: 'text',
          quickReplies: ['Confirm Courier Pickup', 'Change Pickup Time Slot', 'Back to Main Menu'],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_review');
        return;
      }

      // Pickup Step: Confirm Review
      if (step === 'pickup_review' || lower.includes('confirm courier pickup')) {
        const pickupId = `BD-PU-${Math.floor(100000 + Math.random() * 900000)}`;
        const confirmedBooking: PickupBooking = {
          ...pickup,
          pickupId,
          status: 'confirmed',
          assignedExecutive: {
            name: 'Sunil K.',
            mobile: '+91 98201 11234',
            vehicleNo: 'KA-03-EM-8102',
          },
        };
        setPickup(confirmedBooking);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatPickupConfirmedText(confirmedBooking),
          type: 'text',
          quickReplies: [
            'Track Another Shipment',
            'Find Nearest Store',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('pickup_confirmed');
        return;
      }

      // FLOW 3 - Step 4: Confirm Delivery Reattempt
      if (
        (step === 'ndr_reattempt_review' || lower.includes('confirm delivery reattempt')) &&
        !lower.includes('reschedule')
      ) {
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const resolvedNdr: NDRCase = {
          ...activeNdr,
          otp: otpCode,
          ticketId: `BD-NDR-${Math.floor(10000 + Math.random() * 90000)}`,
          status: 'resolved',
          deliveryOption: 'reattempt',
        };
        setActiveNdr(resolvedNdr);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatNDRConfirmationText(resolvedNdr),
          type: 'text',
          quickReplies: [
            'Track Status of Reattempt',
            'Book a Courier Pickup',
            'Find Nearest Store',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_confirmed');
        return;
      }

      // FLOW 3 - Step 1: Reschedule Delivery Date & Slot chosen
      if (
        lower.includes('reschedule delivery date') || 
        lower.includes('date & slot') || 
        lower.includes('date and slot') || 
        lower.includes('pick a reattempt date') ||
        lower.includes('change delivery date') ||
        (step === 'ndr_alert_view' && lower.includes('reschedule'))
      ) {
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: '🗓️ Which date would you like us to reattempt delivery to *12th Main Road, HAL 2nd Stage, Indiranagar*?',
          listButtonLabel: 'Choose Reattempt Date',
          listOptions: [
            { id: 'tomorrow', title: 'Tomorrow (29 Sep)', description: 'Next scheduled delivery run', badge: 'Fastest' },
            { id: 'dayafter', title: 'Day After Tomorrow (30 Sep)', description: 'Preferred weekday delivery', badge: 'Available' },
            { id: 'saturday', title: 'Saturday (03 Oct)', description: 'Weekend residential delivery', badge: 'Weekend' },
          ],
          quickReplies: [
            'Tomorrow (29 Sep)',
            'Day After Tomorrow (30 Sep)',
            'Saturday (03 Oct)',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_reattempt_date');
        return;
      }

      // FLOW 3 - Step 2: Date chosen -> ask for time slot
      if (step === 'ndr_reattempt_date') {
        const dateStr = trimmed.replace(/^hold\s+for\s+/i, '');
        setActiveNdr((prev) => ({ ...prev, reattemptDate: dateStr }));

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: `Great, reattempt date set for *${dateStr}*.\n\nPlease select your preferred delivery time window:`,
          listButtonLabel: 'Choose Reattempt Time Window',
          listOptions: [
            { id: 'morning', title: 'Morning (09:30 AM - 01:00 PM)', description: 'Early morning residential run', badge: 'Morning' },
            { id: 'afternoon', title: 'Afternoon (02:00 PM - 05:30 PM)', description: 'Standard afternoon delivery', badge: 'Afternoon' },
            { id: 'evening', title: 'Evening (06:00 PM - 08:30 PM)', description: 'Late evening after office return', badge: 'Evening' },
          ],
          quickReplies: [
            'Morning (09:30 AM - 01:00 PM)',
            'Afternoon (02:00 PM - 05:30 PM)',
            'Evening (06:00 PM - 08:30 PM)',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_reattempt_slot');
        return;
      }

      // FLOW 3 - Step 3: Slot chosen -> Ask for confirmation (Review)
      if (step === 'ndr_reattempt_slot') {
        const slotStr = trimmed;
        const cleanDate = (activeNdr.reattemptDate || 'Tomorrow (29 Sep)').replace(/^hold\s+for\s+/i, '');
        const updatedNdr: NDRCase = {
          ...activeNdr,
          reattemptDate: cleanDate,
          reattemptSlot: slotStr,
        };
        setActiveNdr(updatedNdr);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatNDRReviewText(updatedNdr, cleanDate, slotStr),
          type: 'text',
          quickReplies: [
            'Confirm Delivery Reattempt',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_reattempt_review');
        return;
      }

      // FLOW 3: Initial NDR Exception Alert
      if (
        (lower.includes('reschedule failed delivery') || 
        lower.includes('failed delivery') ||
        lower.includes('ndr') || 
        lower.includes('failed attempt')) &&
        !lower.includes('date') &&
        !lower.includes('slot') &&
        !lower.includes('confirm')
      ) {
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatNDRAlertText(activeNdr),
          type: 'text',
          quickReplies: [
            'Reschedule Delivery Date & Slot',
            'Hold for Self-Pickup at Store',
            'Leave with Security/Neighbor',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_alert_view');
        return;
      }

      // NDR Option: Hold for Self-Pickup at Store
      if (lower.includes('hold for self-pickup') || lower.includes('self-pickup')) {
        const store = BLUE_DART_STORES[0]; // Indiranagar
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const resolvedNdr: NDRCase = {
          ...activeNdr,
          selfPickupStoreId: store.id,
          selfPickupStoreName: store.name,
          otp: otpCode,
          ticketId: `BD-HOLD-${Math.floor(10000 + Math.random() * 90000)}`,
          status: 'resolved',
          deliveryOption: 'self_pickup',
        };
        setActiveNdr(resolvedNdr);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatNDRConfirmationText(resolvedNdr),
          type: 'text',
          quickReplies: [
            'Track Status of Reattempt',
            'Find Nearest Store',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_confirmed');
        return;
      }

      // NDR Option: Leave with Security / Neighbor
      if (lower.includes('neighbor') || lower.includes('security')) {
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const resolvedNdr: NDRCase = {
          ...activeNdr,
          deliveryOption: 'neighbor_security',
          neighborDetails: {
            name: 'Building Security Guard / Main Gate',
            unitOrFlat: 'Sai Residency Gate A',
          },
          otp: otpCode,
          ticketId: `BD-GATE-${Math.floor(10000 + Math.random() * 90000)}`,
          status: 'resolved',
        };
        setActiveNdr(resolvedNdr);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatNDRConfirmationText(resolvedNdr),
          type: 'text',
          quickReplies: [
            'Track Status of Reattempt',
            'Book a Courier Pickup',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('ndr_confirmed');
        return;
      }

      // FLOW 4 - Step 3: Store Drop-off Confirmation
      if (
        lower.includes('book drop-off') || 
        lower.includes('select centre to book') ||
        (step === 'store_view' && (lower.includes('centre') || lower.includes('station') || lower.includes('counter') || lower.includes('hub')))
      ) {
        let chosenStore = displayedStores.find(
          (st) => lower.includes(st.name.toLowerCase()) || 
                  lower.includes(st.locality.toLowerCase()) || 
                  (st.id && lower.includes(st.id.toLowerCase()))
        );
        if (!chosenStore && displayedStores.length > 0) {
          chosenStore = displayedStores[0];
        }
        if (!chosenStore) {
          chosenStore = BLUE_DART_STORES[0];
        }

        const tokenId = `BD-DROP-${Math.floor(1000 + Math.random() * 9000)}`;
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatStoreDropoffConfirmationText(chosenStore, tokenId),
          type: 'text',
          quickReplies: [
            'Track Shipment',
            'Book a Courier Pickup',
            'Find Another Store',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('store_dropoff_confirm');
        return;
      }

      // FLOW 4 - Step 1: Find Nearest Blue Dart Store -> Ask Location First
      if (
        lower.includes('nearest store') || 
        lower.includes('find nearest') || 
        lower.includes('store locator') || 
        lower.includes('locate store') || 
        lower.includes('change location') || 
        lower.includes('find another store')
      ) {
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: `📍 *Locate Nearest Blue Dart Express Centre*\n\nPlease share your current location, area, or pincode so we can show you the closest service stations and priority counters:\n\n_Select a popular hub below or enter any area, city name, or 6-digit pincode:_`,
          type: 'text',
          listButtonLabel: 'Select City / Area',
          listOptions: [
            { id: 'loc-indiranagar', title: 'Indiranagar / East Bengaluru (560038)', description: '100 Ft Rd, CMH Rd, HAL 2nd Stage', badge: 'Bengaluru' },
            { id: 'loc-koramangala', title: 'Koramangala / South Bengaluru (560034)', description: '80 Ft Rd, Sony World Signal, 4th Block', badge: 'Bengaluru' },
            { id: 'loc-whitefield', title: 'Whitefield Tech Corridor (560066)', description: 'ITPL Main Rd, Hope Farm, EPIP Zone', badge: 'Bengaluru' },
            { id: 'loc-mgroad', title: 'MG Road / CBD Bengaluru (560001)', description: 'Barton Centre, Brigade Rd, Residency Rd', badge: 'Bengaluru' },
            { id: 'loc-hsr', title: 'HSR Layout / Sector 1 (560102)', description: '27th Main Rd, Sector 1 to 7 Hub', badge: 'Bengaluru' },
            { id: 'loc-jayanagar', title: 'Jayanagar / South Bengaluru (560041)', description: '4th Block Complex, 11th Main', badge: 'Bengaluru' },
            { id: 'loc-ecity', title: 'Electronic City Phase 1 (560100)', description: 'Hosur Main Road, Tech Park Zone', badge: 'Bengaluru' },
            { id: 'loc-mumbai-bkc', title: 'Mumbai - BKC / Bandra (400051)', description: 'Bandra Kurla Complex, G-Block Hub', badge: 'Mumbai' },
            { id: 'loc-mumbai-andheri', title: 'Mumbai - Andheri East (400093)', description: 'MIDC Central Rd, Chakala Hub', badge: 'Mumbai' },
            { id: 'loc-delhi-cp', title: 'Delhi - Connaught Place (110001)', description: 'Inner Circle, Barakhamba Road', badge: 'New Delhi' },
            { id: 'loc-delhi-nehru', title: 'Delhi - Nehru Place (110019)', description: 'Financial District, Outer Ring Rd', badge: 'New Delhi' },
            { id: 'loc-gurgaon', title: 'Gurgaon - Cyber City (122002)', description: 'DLF Phase 2 & 3, Golf Course Rd', badge: 'NCR' },
            { id: 'loc-hyderabad', title: 'Hyderabad - HITEC City (500081)', description: 'Madhapur, Cyber Towers, Financial District', badge: 'Hyderabad' },
            { id: 'loc-chennai', title: 'Chennai - Guindy Industrial (600032)', description: 'Inner Ring Road, Kathipara Junction', badge: 'Chennai' },
            { id: 'loc-pune', title: 'Pune - Hinjewadi Phase 1 (411057)', description: 'Rajiv Gandhi Infotech Park', badge: 'Pune' },
            { id: 'loc-kolkata', title: 'Kolkata - Salt Lake Sector V (700091)', description: 'Electronic Complex, Bidhan Nagar', badge: 'Kolkata' },
          ],
          quickReplies: [
            'Indiranagar / East Bengaluru (560038)',
            'Koramangala / South Bengaluru (560034)',
            'Whitefield Tech Corridor (560066)',
            'Mumbai - BKC / Bandra (400051)',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('store_search');
        return;
      }

      // FLOW 4 - Step 2: Location provided -> Show nearby stores for that location
      if (step === 'store_search') {
        const stores = getStoresForLocation(trimmed);
        const locTitle = getLocationTitle(trimmed);
        setDisplayedStores(stores);
        setSearchedLocation(locTitle);

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          timestamp: botTimestamp,
          text: formatStoreListText(stores, locTitle),
          type: 'text',
          listButtonLabel: 'Select Centre to Book Drop-off',
          listOptions: stores.map((st) => ({
            id: st.id,
            title: `Book Drop-off at ${st.name}`,
            description: `${st.address} • Open till ${st.timings.includes('09:00 PM') ? '9 PM' : '8 PM'}`,
            badge: `${st.distanceKm} km`,
          })),
          quickReplies: [
            `Book Drop-off at ${stores[0].name.replace('Blue Dart ', '')}`,
            'Change Location',
            'Track Shipment',
            'Back to Main Menu',
          ],
        };
        setMessages((prev) => [...prev, reply]);
        setStep('store_view');
        return;
      }

      // Default fallback conversational reply
      const fallbackReply: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        timestamp: botTimestamp,
        text: `I understood: "${trimmed}".\n\nI can help you track any AWB number, schedule a doorstep pickup, reschedule an attempted delivery, or locate your nearest Blue Dart Express retail counter.`,
        type: 'text',
        quickReplies: ['Track Shipment', 'Book a Courier Pickup', 'Reschedule Failed Delivery', 'Find Nearest Store'],
      };
      setMessages((prev) => [...prev, fallbackReply]);
      setStep('welcome_menu');
    }, 450);
  }, [step, pickup, activeNdr, displayedStores]);

  // Register external sender so sidebar clicks can send messages directly
  useEffect(() => {
    registerExternalSender?.(handleSendMessage);
  }, [registerExternalSender, handleSendMessage]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const text = inputText;
    setInputText('');
    handleSendMessage(text);
  };

  // Open Bottom Sheet for List Message
  const handleOpenListPicker = (msg: ChatMessage) => {
    if (!msg.listOptions || msg.listOptions.length === 0) return;
    setSheetSearchQuery('');
    setSelectedSheetOption(msg.listOptions[0].title);
    setBottomSheet({
      title: msg.listButtonLabel || 'Select an Option',
      options: msg.listOptions,
      onSelect: (selectedTitle) => {
        handleSendMessage(selectedTitle);
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden select-text">
      {/* WhatsApp Chat Wallpaper Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.055] z-0"
        style={{
          backgroundImage: `radial-gradient(#002878 1.5px, transparent 1.5px), radial-gradient(#002878 1.5px, #EFEAE2 1.5px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* Messages Scroll Area */}
      <div 
        id="whatsapp-messages-scroll-area"
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative z-10 scrollbar-none"
      >
        {/* End-to-end encryption security notice badge */}
        <div className="flex justify-center my-1 select-none">
          <div className="bg-[#FFEECD] text-[#54656F] text-[10px] px-3 py-1 rounded-lg max-w-[280px] text-center shadow-2xs leading-snug border border-[#FFD885]/40 flex items-center gap-1 justify-center">
            <ShieldCheck className="w-3 h-3 text-[#B58500] shrink-0" />
            <span>Messages are end-to-end encrypted with Blue Dart Verified Business API.</span>
          </div>
        </div>

        {/* Date separator badge */}
        <div className="flex justify-center my-1 select-none">
          <span className="bg-white/90 text-slate-500 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-md shadow-2xs">
            Today
          </span>
        </div>

        {/* Message stream */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              {/* Message Bubble Container */}
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 relative shadow-xs text-xs sm:text-[13px] leading-relaxed overflow-hidden ${
                  isUser
                    ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs'
                    : 'bg-white text-slate-900 rounded-tl-xs border border-slate-100'
                }`}
              >
                {/* Bubble Text with native WhatsApp formatting */}
                {msg.text && (
                  <div className="whitespace-pre-line break-words text-slate-800">
                    {renderWhatsAppFormattedText(msg.text)}
                  </div>
                )}

                {/* Bubble Timestamp and Read Receipts */}
                <div
                  className={`flex items-center justify-end gap-1 text-[9.5px] mt-1 select-none ${
                    isUser ? 'text-[#53bdeb]' : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-500 font-medium">{msg.timestamp}</span>
                  {isUser && (
                    <CheckCheck className="w-3.5 h-3.5 stroke-[2.2] text-[#53bdeb]" />
                  )}
                </div>

                {/* WhatsApp Interactive List Button Attached to Bubble */}
                {msg.listButtonLabel && msg.listOptions && (
                  <div className="border-t border-[#E9EDEF] -mx-3 -mb-3 mt-2 bg-[#F7F8FA] hover:bg-[#F0F2F5] transition-colors">
                    <button
                      onClick={() => handleOpenListPicker(msg)}
                      className="w-full py-2.5 px-3 text-center text-[12.5px] font-semibold text-[#00A884] flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      <List className="w-4 h-4 text-[#00A884]" />
                      <span>{msg.listButtonLabel}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#00A884]/70 ml-0.5" />
                    </button>
                  </div>
                )}

                {/* WhatsApp Interactive Attached Action Buttons (WhatsApp Business API Style) */}
                {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && !msg.listButtonLabel && (
                  <div className="border-t border-[#E9EDEF] -mx-3 -mb-3 mt-2.5 divide-y divide-[#E9EDEF] bg-[#F7F8FA]">
                    {msg.quickReplies.map((replyText, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(replyText)}
                        disabled={isTyping}
                        className="w-full py-2.5 px-3 text-center text-[12.5px] font-semibold text-[#00A884] hover:bg-slate-100/90 active:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none disabled:opacity-50"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#00A884]/60" />
                        <span>{replyText}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex items-center gap-1.5 p-3 bg-white rounded-2xl rounded-tl-xs shadow-xs w-16 border border-slate-100 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Input Bar */}
      <div 
        id="whatsapp-input-bar"
        className="relative z-20 bg-[#F0F2F5] px-2 py-2 flex items-center gap-1.5 border-t border-slate-200 select-none shrink-0"
      >
        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          title="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('Find Nearest Store')}
          className="p-1.5 text-slate-500 hover:text-[#002878] transition-colors cursor-pointer"
          title="Share Location / Store Finder"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Input Text Form */}
        <form onSubmit={handleInputSubmit} className="flex-1 flex items-center min-w-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or AWB number..."
            className="w-full bg-white rounded-full py-1.5 px-3.5 text-xs sm:text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002878] border border-slate-200 shadow-inner"
          />
        </form>

        {/* Send or Mic Button */}
        {inputText.trim() ? (
          <button
            onClick={handleInputSubmit}
            className="w-8 h-8 rounded-full bg-[#005C4B] hover:bg-[#004a3c] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            title="Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* WhatsApp List Picker Bottom Sheet (Native WhatsApp Interactive UX) */}
      {bottomSheet && (
        <div 
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-2xs flex flex-col justify-end animate-fadeIn select-none"
          onClick={() => setBottomSheet(null)}
        >
          <div 
            className="bg-white rounded-t-2xl max-h-[75%] flex flex-col shadow-2xl border-t border-slate-200 animate-slideUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle */}
            <div className="w-9 h-1 bg-slate-300 rounded-full mx-auto my-2" />

            {/* Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  {bottomSheet.title}
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Select an option or search to send to chat
                </p>
              </div>
              <button
                onClick={() => setBottomSheet(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Search Bar inside Bottom Sheet */}
            <div className="px-3 py-2 bg-[#F7F8FA] border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={sheetSearchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setSheetSearchQuery(q);
                    const qLower = q.trim().toLowerCase();
                    const match = bottomSheet.options.find(
                      (o) =>
                        o.title.toLowerCase().includes(qLower) ||
                        (o.description && o.description.toLowerCase().includes(qLower))
                    );
                    if (match) {
                      setSelectedSheetOption(match.title);
                    } else if (q.trim()) {
                      setSelectedSheetOption(q.trim());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmedQ = sheetSearchQuery.trim();
                      if (selectedSheetOption) {
                        bottomSheet.onSelect(selectedSheetOption);
                      } else if (trimmedQ) {
                        bottomSheet.onSelect(trimmedQ);
                      }
                    }
                  }}
                  placeholder={
                    bottomSheet.title.toLowerCase().includes('city') || 
                    bottomSheet.title.toLowerCase().includes('area') || 
                    bottomSheet.title.toLowerCase().includes('location')
                      ? "Search city, area, locality, or 6-digit pincode..."
                      : "Search options..."
                  }
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8.5 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00A884] focus:border-[#00A884] shadow-2xs"
                />
                {sheetSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSearchQuery('');
                      if (bottomSheet.options.length > 0) {
                        setSelectedSheetOption(bottomSheet.options[0].title);
                      }
                    }}
                    className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Options List */}
            <div className="p-2 overflow-y-auto space-y-1.5 divide-y divide-slate-100/80 max-h-[320px]">
              {/* Dynamic Custom Location Search Option if typed query doesn't exactly equal an option */}
              {(() => {
                const q = sheetSearchQuery.trim();
                const qLower = q.toLowerCase();
                const exactMatch = bottomSheet.options.some((o) => o.title.toLowerCase() === qLower);

                if (q && !exactMatch) {
                  const isCustomSelected = selectedSheetOption === q;
                  return (
                    <div
                      onClick={() => {
                        setSelectedSheetOption(q);
                        bottomSheet.onSelect(q);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between mb-1.5 ${
                        isCustomSelected
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                          : 'bg-emerald-50/50 border-dashed border-[#00A884]/60 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00A884] shrink-0" />
                          <span className="font-bold text-xs text-emerald-950 truncate">
                            Use location: "{q}"
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                            Search
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Find closest Blue Dart express counters near "{q}"
                        </p>
                      </div>
                      <div className="shrink-0 pl-1">
                        <div className="w-5 h-5 rounded-full bg-[#00A884] text-white flex items-center justify-center">
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {(() => {
                const qLower = sheetSearchQuery.trim().toLowerCase();
                const filtered = qLower
                  ? bottomSheet.options.filter(
                      (opt) =>
                        opt.title.toLowerCase().includes(qLower) ||
                        (opt.description && opt.description.toLowerCase().includes(qLower)) ||
                        (opt.badge && opt.badge.toLowerCase().includes(qLower))
                    )
                  : bottomSheet.options;

                if (filtered.length === 0 && !sheetSearchQuery.trim()) {
                  return (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No options available
                    </div>
                  );
                }

                if (filtered.length === 0 && sheetSearchQuery.trim()) {
                  return (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No preset locations matching "{sheetSearchQuery.trim()}". Tap the custom option above to search!
                    </div>
                  );
                }

                return filtered.map((opt, idx) => {
                  const isSelected = selectedSheetOption === opt.title;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSheetOption(opt.title)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                        isSelected ? 'bg-emerald-50/70 border border-emerald-300' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-xs ${isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}>
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {opt.description}
                          </p>
                        )}
                      </div>

                      {/* Radio Button */}
                      <div className="shrink-0 pl-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#00A884] bg-[#00A884]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bottom Sheet CTA Button */}
            <div className="p-3 border-t border-slate-100 bg-[#F7F8FA]">
              <button
                onClick={() => {
                  const target = selectedSheetOption || (sheetSearchQuery.trim() ? sheetSearchQuery.trim() : null);
                  if (target) {
                    bottomSheet.onSelect(target);
                  }
                }}
                disabled={!selectedSheetOption && !sheetSearchQuery.trim()}
                className="w-full py-2.5 px-4 bg-[#00A884] hover:bg-[#008f6f] active:bg-[#007b5f] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Consignment Docket Modal */}
      {showDocketModal && (
        <ShipmentReceiptModal
          pickup={pickup}
          tracking={activeTracking}
          onClose={() => setShowDocketModal(false)}
        />
      )}
    </div>
  );
}
