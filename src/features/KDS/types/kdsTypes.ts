// src/features/KDS/types/kdsTypes.ts

export type KdsTicketStatus = 'pending' | 'accepted' | 'in_progress' | 'ready' | 'completed' | 'canceled';

export type KdsStationId = 'all' | 'grill' | 'salad' | 'fry' | 'prep' | 'expo' | string;

export interface KdsStation {
  _id: string;
  stationId: string;
  name: string;
  code: string;
  description?: string;
  displayOrder?: number;
  branchId?: string;
  color?: string;
  isActive: boolean;
  activeStaffCount?: number;
  status?: 'rush' | 'on_pace' | 'holding';
  avgTicketTimeSeconds?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateKitchenStationDto {
  name: string;
  code: string;
  description?: string;
  displayOrder?: number;
  color?: string;
  branchId?: string;
}

export interface UpdateKitchenStationDto {
  name?: string;
  code?: string;
  description?: string;
  displayOrder?: number;
  color?: string;
  isActive?: boolean;
}

export interface KdsTicketItemModifier {
  name: string;
  price?: number;
  option?: string;
}

export interface KdsTicketItem {
  _id: string;
  itemId: string;
  name: string;
  menuItemName?: string;
  quantity: number;
  notes?: string;
  modifiers?: KdsTicketItemModifier[];
  completed?: boolean;
  completedAt?: string;
  status?: string;
}

export interface KdsTicket {
  _id: string;
  ticketNumber: string; // e.g. "GRILL-42"
  orderId: string;
  orderNumber: string; // e.g. "ORD-2024-001"
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string; // e.g. "Table T-05"
  customerName?: string;
  branchId: string;
  stationId: string; // "grill" | "salad" | "fry" | "prep" | "expo"
  stationName: string;
  stationCode: string;
  status: KdsTicketStatus;
  priority: 'rush' | 'normal' | 'low';
  items: KdsTicketItem[];
  specialInstructions?: string;
  notes?: string;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  readyAt?: string;
  completedAt?: string;
  canceledAt?: string;
  cancelReason?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  targetPrepTimeSeconds?: number; // target time in seconds (e.g. 600)
}

export interface KdsStationMetrics {
  stationId: string;
  stationName: string;
  stationCode: string;
  status: 'rush' | 'on_pace' | 'holding';
  newCount: number; // pending
  workingCount: number; // accepted + in_progress
  readyCount: number; // ready
  totalActiveCount: number;
  avgTicketTimeSeconds: number; // average elapsed time
  ticketsCompletedToday: number;
}

export interface KdsAudioSettings {
  masterSoundEnabled: boolean;
  volume: number; // 0 to 100
  alertNewTicket: boolean;
  alertUrgentTicket: boolean;
  alertTicketReady: boolean;
  alertOrderReady: boolean;
  alertConnectionLost: boolean;
}

export type KdsActiveTab = 'orders' | 'history' | 'performance' | 'shift' | 'inventory' | 'stations';

export interface KdsStaffMember {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  stationId?: string;
  stationName?: string;
  shiftStart?: string;
  isActive: boolean;
  clockedIn: boolean;
  ticketsHandledToday?: number;
}

export interface KdsInventoryItem {
  _id: string;
  name: string;
  stationId: string;
  stationName: string;
  category: string;
  status: 'in_stock' | 'low_stock' | '86ed';
  currentStock: number;
  unit: string;
  minThreshold: number;
}
