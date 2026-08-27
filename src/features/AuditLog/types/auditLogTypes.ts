// src/features/AuditLog/types/auditLogTypes.ts

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditOutcome = 'success' | 'failure' | 'partial';

export type AuditAction =
  // CRUD
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  // Auth
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'TOKEN_REFRESH'
  // Order
  | 'ORDER_STATUS_CHANGE'
  | 'ORDER_CANCEL'
  | 'PAYMENT_RECEIVED'
  | 'REFUND_ISSUED'
  // Kitchen
  | 'TICKET_CREATED'
  | 'TICKET_STATUS_CHANGE'
  | 'TICKET_ASSIGNED'
  // Inventory
  | 'INVENTORY_ADJUST'
  | 'INVENTORY_BATCH_ADJUST'
  | 'STOCK_ALERT'
  // User Management
  | 'ROLE_ASSIGN'
  | 'ROLE_REVOKE'
  | 'TASK_ASSIGN'
  | 'USER_SUSPEND'
  | 'USER_ACTIVATE'
  // Merchant/Branch
  | 'MERCHANT_APPROVE'
  | 'MERCHANT_SUSPEND'
  | 'BRANCH_CREATE'
  | 'BRANCH_SUSPEND'
  // Menu
  | 'MENU_PUBLISH'
  | 'MENU_UNPUBLISH'
  | 'PRICE_CHANGE'
  // Reports
  | 'REPORT_ACCESS'
  | 'REPORT_EXPORT';

export type ResourceType =
  // Core
  | 'User'
  | 'Role'
  | 'Merchant'
  | 'Branch'
  // Operations
  | 'Order'
  | 'Menu'
  | 'Table'
  | 'Payment'
  | 'Subscription'
  // Kitchen
  | 'KitchenTicket'
  | 'KitchenStation'
  // Inventory
  | 'Ingredient'
  | 'Supplier'
  | 'Recipe'
  | 'PurchaseOrder'
  // Other
  | 'Invitation'
  | 'AuditLog'
  | 'ExportJob';

export interface AuditLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogUser {
  _id: string;
  name: string;
  email: string;
  role?: {
    _id?: string;
    name: string;
    isSystemRole?: boolean;
  };
}

export interface AuditLogMerchantRef {
  _id: string;
  name?: string;
  businessName?: string;
}

export interface AuditLogBranchRef {
  _id: string;
  name?: string;
}

export interface AuditLog {
  _id: string;
  user: AuditLogUser | null;
  merchant: string | AuditLogMerchantRef;
  branch?: string | AuditLogBranchRef;
  action: AuditAction | string;
  resource: ResourceType | string;
  resourceId: string | null;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | string;
  endpoint: string;
  statusCode: number;
  correlationId?: string;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  duration?: number;
  changes?: AuditLogChange[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogsResponse {
  status: string;
  data: {
    logs: AuditLog[];
    pagination: AuditPagination;
  };
}

export interface SingleAuditLogResponse {
  status: string;
  data: {
    log: AuditLog;
  };
}

export interface ResourceHistoryResponse {
  status: string;
  results?: number;
  data: {
    logs: AuditLog[];
  };
}

export interface CorrelatedLogsResponse {
  status: string;
  results?: number;
  data: {
    logs: AuditLog[];
  };
}

export interface AuditStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byOutcome: {
    success: number;
    failure: number;
    partial: number;
  };
  topUsers: Array<{
    _id: string;
    name: string;
    email: string;
    actionCount: number;
  }>;
  recentCritical: Array<{
    _id: string;
    action: string;
    resource: string;
    user?: { name: string; email?: string } | null;
    createdAt: string;
  }>;
}

export interface AuditStatsResponse {
  status: string;
  data: {
    stats: AuditStats;
  };
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  branchId?: string;
  userId?: string;
  resource?: string;
  action?: string;
  severity?: AuditSeverity | 'all' | '';
  outcome?: AuditOutcome | 'all' | '';
  startDate?: string;
  endDate?: string;
  correlationId?: string;
  sortBy?: string;
  search?: string;
}
