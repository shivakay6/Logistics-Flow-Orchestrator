export type WorkflowType = 
  | 'track_shipment' 
  | 'schedule_pickup' 
  | 'ndr_reschedule' 
  | 'nearest_store' 
  | 'missed_call_ivr';

export interface Milestone {
  status: string;
  time: string;
  date: string;
  location: string;
  completed: boolean;
  current?: boolean;
}

export interface CourierAssociate {
  name: string;
  phone: string;
  vehicleNumber?: string;
  photoUrl?: string;
  rating?: number;
}

export interface ShipmentTracking {
  awbNumber: string;
  orderRef?: string;
  senderName: string;
  recipientName: string;
  origin: string;
  destination: string;
  status: 'booked' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_attempt';
  statusLabel: string;
  statusColor: string;
  serviceType: 'Apex (Air Express)' | 'Domestic Priority' | 'Surface Cargo' | 'Doc Express';
  packageDescription: string;
  weight: string;
  pieces: number;
  expectedDelivery: string;
  lastUpdated: string;
  milestones: Milestone[];
  courierAssociate?: CourierAssociate;
  podSignedBy?: string;
  podDeliveredTime?: string;
  failureReason?: string;
}

export type PackageType = 'document' | 'parcel';

export interface PickupAddress {
  pincode: string;
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
}

export interface PickupBooking {
  pickupId: string | null;
  serviceType: 'Apex (Air Express)' | 'Domestic Priority' | 'Surface Cargo' | 'Doc Express';
  packageType: PackageType;
  packageTypeLabel: string;
  weight: string;
  weightEstimateKg: number;
  destinationPincode: string;
  destinationCity?: string;
  pickupAddress: PickupAddress | null;
  pickupDate: string | null;
  pickupTimeSlot: string | null;
  contactName: string;
  contactMobile: string;
  specialInstructions?: string;
  estimatedCost: number;
  assignedExecutive?: {
    name: string;
    mobile: string;
    vehicleNo: string;
  };
  status: 'draft' | 'reviewing' | 'confirmed';
}

export interface NDRCase {
  awbNumber: string;
  recipientName: string;
  contactMobile: string;
  attemptDate: string;
  attemptTime: string;
  reason: string;
  originalAddress: string;
  reattemptDate?: string;
  reattemptSlot?: string;
  updatedAddress?: string;
  selfPickupStoreId?: string;
  selfPickupStoreName?: string;
  deliveryOption: 'reattempt' | 'self_pickup' | 'neighbor_security' | 'address_change';
  neighborDetails?: {
    name: string;
    unitOrFlat: string;
  };
  otp?: string;
  ticketId?: string;
  status: 'pending' | 'resolved';
}

export interface BlueDartStore {
  id: string;
  name: string;
  type: 'Express Centre' | 'Hub / Service Station' | 'Retail Counter';
  address: string;
  locality: string;
  city: string;
  pincode: string;
  distanceKm: number;
  phone: string;
  timings: string;
  services: string[];
  cutoffTime: string;
  mapCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SuggestedReplyOption {
  label: string;
  value?: string;
  primary?: boolean;
  icon?: string;
}

export interface SuggestedReplyState {
  title?: string;
  stepDescription?: string;
  primaryReply?: string;
  options: SuggestedReplyOption[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text?: string;
  type?: 
    | 'text' 
    | 'quick_replies' 
    | 'tracking_card' 
    | 'ndr_alert'
    | 'ndr_options'
    | 'ndr_confirmation'
    | 'pickup_package_select'
    | 'pickup_slot_select'
    | 'pickup_review'
    | 'pickup_confirmed'
    | 'store_list'
    | 'store_dropoff_confirm'
    | 'rate_calculator'
    | 'missed_call_welcome';
  quickReplies?: string[];
  listButtonLabel?: string;
  listOptions?: { title: string; description?: string; id?: string; badge?: string }[];
  trackingData?: ShipmentTracking;
  pickupData?: PickupBooking;
  ndrData?: NDRCase;
  storesData?: BlueDartStore[];
  selectedStore?: BlueDartStore;
  metadata?: Record<string, unknown>;
}
