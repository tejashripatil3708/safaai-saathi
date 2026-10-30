export type WardType = 'urban' | 'rural';

export interface Ward {
  id: string;
  name: string;
  nameGu: string;
  code: string;
  type: WardType;
  center: {
    lat: number;
    lng: number;
  };
  radiusM: number;
  routeId: string;
  inspectorId: string;
  inspectorName: string;
  inspectorPhone: string;
  escalationTo: string;
  escalationName: string;
  escalationPhone: string;
}

export type VanStatus = 'idle' | 'on_shift' | 'offline';

export interface VanLocation {
  lat: number;
  lng: number;
  updatedAt: string;
  speedKmph: number;
}

export interface Van {
  id: string;
  plateNo: string;
  routeId: string;
  status: VanStatus;
  lastLocation: VanLocation;
  currentTripId: string;
  batteryPct?: number;
  driverName?: string;
  driverPhone?: string;
}

export interface Route {
  id: string;
  name: string;
  wardIds: string[];
  scheduledStartTime: string;
}

export interface WardDone {
  wardId: string;
  doneAt: string;
  flagged: boolean;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  t: string;
}

export interface Trip {
  id: string;
  vanId: string;
  routeId: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  wardsDone: WardDone[];
  alertedWardIds: string[];
  gpsTrail: GpsPoint[];
  mockLocationDetected: boolean;
}

export type ComplaintCategory =
  | 'garbage_dump'
  | 'open_gutter'
  | 'missed_collection'
  | 'dead_animal'
  | 'public_toilet'
  | 'construction_debris'
  | 'hazardous_waste'
  | 'other';

export type ComplaintStatus = 
  | 'received' 
  | 'assigned' 
  | 'in_progress' 
  | 'pending_verification' 
  | 'resolved' 
  | 'auto_resolved' 
  | 'escalated' 
  | 'reopened' 
  | 'queued';

export interface Complaint {
  id: string;
  ticketId: string;
  deviceId: string;
  syncStatus?: 'synced' | 'pending_sync';
  phone?: string;
  category: ComplaintCategory;
  categoryCustomTitle?: string;
  description?: string;
  address: string;
  photoUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  wardId: string;
  createdAt: string;
  status: ComplaintStatus;
  assignedTo: string;
  assignedName?: string;
  assignedPhone?: string;
  escalationLevel: number;
  escalatedToName?: string;
  escalatedToPhone?: string;
  // Resolution & Cross-Verification fields
  resolvedPhotoUrl?: string;
  resolvedAt?: string;
  resolvedNote?: string;
  // Admin & Worker cleaning submission
  adminResolvedPhotoUrl?: string;
  adminResolvedAt?: string;
  adminResolvedNote?: string;
  workerName?: string;
  autoResolveDeadline?: string;
  // Citizen verification responses
  citizenVerifiedAt?: string;
  citizenVerifiedStatus?: 'confirmed' | 'rejected';
  citizenRejectReason?: string;
  citizenRejectPhotoUrl?: string;
  // Reopening
  reopenedAt?: string;
  reopenReason?: string;
  reopenPhotoUrl?: string;
  mergedInto?: string;
  note?: string;
  slaDeadline?: string;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface Staff {
  id: string;
  authUid: string;
  name: string;
  role: 'inspector' | 'chief_officer' | 'tdo' | 'ddo';
  wardIds: string[];
  talukaId: string;
  phone: string;
}

export interface CitizenAddress {
  addressText: string;
  location?: {
    lat: number;
    lng: number;
  };
  wardId: string;
  updatedAt: string;
}

export interface CitizenCollectionFeedback {
  id: string;
  wardId: string;
  date: string;
  deviceId: string;
  syncStatus?: 'synced' | 'pending_sync';
  hadGarbage: boolean;
  collectionStatus: 'collected' | 'missed_by_van' | 'no_garbage_today';
  reason?: string;
  note?: string;
  timestamp: string;
}

export interface SanitationTip {
  id: string;
  icon: string;
  titleEn: string;
  titleGu: string;
  descEn: string;
  descGu: string;
  category: 'segregation' | 'gutter' | 'schedule' | 'health';
  badgeGu: string;
  badgeEn: string;
}
