// src/api/Queries/auditLogQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { useGetMeQuery } from './authQueries';
import type {
  AuditLog,
  AuditLogsResponse,
  SingleAuditLogResponse,
  ResourceHistoryResponse,
  CorrelatedLogsResponse,
  AuditStatsResponse,
  AuditStats,
  AuditLogQueryParams,
} from '@/features/AuditLog/types/auditLogTypes';

export * from '@/features/AuditLog/types/auditLogTypes';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
export const isValidObjectId = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return OBJECT_ID_REGEX.test(id.trim());
};

// ============================================================================
// 1. QUERY AUDIT LOGS (LIST VIEW)
// Endpoint: GET /v1/audit-logs
// RBAC Task: audit.logs.list
// ============================================================================

export const fetchAuditLogs = async (
  params: AuditLogQueryParams = {}
): Promise<{ logs: AuditLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
  const queryParams: Record<string, any> = {};

  if (params.page && params.page > 0) queryParams.page = params.page;
  if (params.limit && params.limit > 0) queryParams.limit = Math.min(params.limit, 100);

  if (params.branchId && isValidObjectId(params.branchId)) {
    queryParams.branchId = params.branchId;
  }
  if (params.userId && isValidObjectId(params.userId)) {
    queryParams.userId = params.userId;
  }
  if (params.resource && params.resource !== 'all') {
    queryParams.resource = params.resource;
  }
  if (params.action && params.action !== 'all') {
    queryParams.action = params.action;
  }
  if (params.severity && params.severity !== 'all') {
    queryParams.severity = params.severity;
  }
  if (params.outcome && params.outcome !== 'all') {
    queryParams.outcome = params.outcome;
  }
  if (params.startDate) {
    queryParams.startDate = params.startDate;
  }
  if (params.endDate) {
    queryParams.endDate = params.endDate;
  }
  if (params.correlationId && params.correlationId.trim()) {
    queryParams.correlationId = params.correlationId.trim();
  }
  if (params.sortBy) {
    queryParams.sortBy = params.sortBy;
  }

  const res = await api.get<AuditLogsResponse>('/v1/audit-logs', {
    params: queryParams,
  });

  const data = res.data?.data;
  return {
    logs: Array.isArray(data?.logs) ? data.logs : [],
    pagination: data?.pagination || {
      total: Array.isArray(data?.logs) ? data.logs.length : 0,
      page: params.page || 1,
      limit: params.limit || 50,
      totalPages: 1,
    },
  };
};

export const useAuditLogsQuery = (params: AuditLogQueryParams = {}) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// ============================================================================
// 2. GET SINGLE AUDIT LOG (DETAIL VIEW)
// Endpoint: GET /v1/audit-logs/:id
// RBAC Task: audit.logs.view
// ============================================================================

export const fetchAuditLogById = async (id: string): Promise<AuditLog | null> => {
  if (!id || !isValidObjectId(id)) {
    throw new Error('Valid Audit Log ID is required');
  }
  const res = await api.get<SingleAuditLogResponse>(`/v1/audit-logs/${id}`);
  return res.data?.data?.log || null;
};

export const useAuditLogDetailQuery = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['audit-log-detail', id],
    queryFn: () => fetchAuditLogById(id!),
    enabled: Boolean(id && isValidObjectId(id)),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// ============================================================================
// 3. GET RESOURCE HISTORY
// Endpoint: GET /v1/audit-logs/resource/:resource/:id
// RBAC Task: audit.logs.resource-history
// ============================================================================

export const fetchResourceHistory = async (
  resource: string,
  id: string
): Promise<AuditLog[]> => {
  if (!resource || !id || !isValidObjectId(id)) {
    throw new Error('Resource and valid Resource ID are required');
  }
  const res = await api.get<ResourceHistoryResponse>(
    `/v1/audit-logs/resource/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`
  );
  return Array.isArray(res.data?.data?.logs) ? res.data.data.logs : [];
};

export const useResourceHistoryQuery = (
  resource: string | null | undefined,
  id: string | null | undefined
) => {
  const isEnabled = Boolean(resource && id && isValidObjectId(id));
  return useQuery({
    queryKey: ['audit-resource-history', resource, id],
    queryFn: () => fetchResourceHistory(resource!, id!),
    enabled: isEnabled,
    staleTime: 1000 * 60,
    retry: 1,
  });
};

// ============================================================================
// 4. GET CORRELATED LOGS (REQUEST TRACING)
// Endpoint: GET /v1/audit-logs/correlation/:correlationId
// RBAC Task: audit.logs.correlation
// ============================================================================

export const fetchCorrelatedLogs = async (correlationId: string): Promise<AuditLog[]> => {
  if (!correlationId || !correlationId.trim()) {
    throw new Error('Correlation ID is required');
  }
  const res = await api.get<CorrelatedLogsResponse>(
    `/v1/audit-logs/correlation/${encodeURIComponent(correlationId.trim())}`
  );
  return Array.isArray(res.data?.data?.logs) ? res.data.data.logs : [];
};

export const useCorrelatedLogsQuery = (correlationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['audit-correlated-logs', correlationId],
    queryFn: () => fetchCorrelatedLogs(correlationId!),
    enabled: Boolean(correlationId && correlationId.trim().length > 0),
    staleTime: 1000 * 60,
    retry: 1,
  });
};

// ============================================================================
// 5. GET AUDIT STATISTICS
// Endpoint: GET /v1/audit-logs/stats
// RBAC Task: audit.logs.stats
// ============================================================================

export const fetchAuditStats = async (
  params: { startDate?: string; endDate?: string } = {}
): Promise<AuditStats | null> => {
  const queryParams: Record<string, any> = {};
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;

  const res = await api.get<AuditStatsResponse>('/v1/audit-logs/stats', {
    params: queryParams,
  });
  return res.data?.data?.stats || null;
};

export const useAuditStatsQuery = (
  params: { startDate?: string; endDate?: string } = {}
) => {
  return useQuery({
    queryKey: ['audit-stats', params],
    queryFn: () => fetchAuditStats(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// ============================================================================
// 6. EXPORT AUDIT LOGS (CSV)
// Endpoint: GET /v1/audit-logs/export
// RBAC Task: audit.logs.export
// ============================================================================

export const exportAuditLogsCsv = async (
  params: AuditLogQueryParams = {}
): Promise<Blob> => {
  const queryParams: Record<string, any> = {};

  if (params.branchId && isValidObjectId(params.branchId)) queryParams.branchId = params.branchId;
  if (params.userId && isValidObjectId(params.userId)) queryParams.userId = params.userId;
  if (params.resource && params.resource !== 'all') queryParams.resource = params.resource;
  if (params.action && params.action !== 'all') queryParams.action = params.action;
  if (params.severity && params.severity !== 'all') queryParams.severity = params.severity;
  if (params.outcome && params.outcome !== 'all') queryParams.outcome = params.outcome;
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  if (params.correlationId && params.correlationId.trim()) queryParams.correlationId = params.correlationId.trim();

  const res = await api.get('/v1/audit-logs/export', {
    params: queryParams,
    responseType: 'blob',
  });

  return res.data;
};

export const useExportAuditLogsMutation = () => {
  return useMutation({
    mutationFn: (params: AuditLogQueryParams) => exportAuditLogsCsv(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `audit-logs-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      const message = err.response?.data?.message || 'Failed to export audit logs';
      toast.error(message);
    },
  });
};

// ============================================================================
// 7. AUDIT PERMISSIONS HOOK
// RBAC tasks: audit.logs.list, audit.logs.view, audit.logs.resource-history,
//             audit.logs.correlation, audit.logs.export, audit.logs.stats
// ============================================================================

export interface AuditPermissions {
  canList: boolean;
  canView: boolean;
  canViewHistory: boolean;
  canViewCorrelation: boolean;
  canExport: boolean;
  canViewStats: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
}

export const useAuditPermissions = (): AuditPermissions => {
  const { data: user, isLoading } = useGetMeQuery();

  if (isLoading || !user) {
    return {
      canList: true, // Optimistic default while loading
      canView: true,
      canViewHistory: true,
      canViewCorrelation: true,
      canExport: true,
      canViewStats: true,
      isSuperAdmin: false,
      isLoading,
    };
  }

  const role = user.role;
  const roleName = (role?.name || '').toUpperCase();
  const isSuperAdmin =
    roleName === 'SUPER_ADMIN' ||
    roleName === 'SUPER-ADMIN' ||
    roleName === 'SUPERADMIN' ||
    roleName === 'MERCHANT-ADMIN' ||
    roleName === 'MERCHANT_ADMIN' ||
    roleName === 'OWNER' ||
    roleName === 'ADMIN';

  // Super Admin automatically has full access
  if (isSuperAdmin) {
    return {
      canList: true,
      canView: true,
      canViewHistory: true,
      canViewCorrelation: true,
      canExport: true,
      canViewStats: true,
      isSuperAdmin: true,
      isLoading: false,
    };
  }

  const tasks = Array.isArray(role?.tasks) ? role.tasks : [];
  const taskNames = new Set(
    tasks.map((t: any) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean)
  );

  const hasTask = (taskName: string): boolean => {
    if (taskNames.has(taskName)) return true;
    // Check by endpoint pattern if available
    const hasMatchingEndpoint = tasks.some((t: any) => {
      if (typeof t === 'object' && t?.endpoint) {
        return t.endpoint.includes('audit-log') || t.endpoint.includes('audit');
      }
      return false;
    });
    return hasMatchingEndpoint;
  };

  return {
    canList: isSuperAdmin || hasTask('audit.logs.list') || taskNames.size === 0,
    canView: isSuperAdmin || hasTask('audit.logs.view') || taskNames.size === 0,
    canViewHistory: isSuperAdmin || hasTask('audit.logs.resource-history') || taskNames.size === 0,
    canViewCorrelation: isSuperAdmin || hasTask('audit.logs.correlation') || taskNames.size === 0,
    canExport: isSuperAdmin || hasTask('audit.logs.export') || taskNames.size === 0,
    canViewStats: isSuperAdmin || hasTask('audit.logs.stats') || taskNames.size === 0,
    isSuperAdmin,
    isLoading: false,
  };
};
