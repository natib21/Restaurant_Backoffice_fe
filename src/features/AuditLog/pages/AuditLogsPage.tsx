// src/features/AuditLog/pages/AuditLogsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  History,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Download,
  RotateCcw,
  Eye,
  GitBranch,
  Clock,
  User,
  Copy,
  Check,
  Terminal,
  Activity,
  Layers,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  PageHeader,
  DataTable,
  type ColumnDef,
  type SortDirection,
} from '@/components/Common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAuditLogsQuery,
  useAuditStatsQuery,
  useExportAuditLogsMutation,
  useAuditPermissions,
  type AuditLog,
  type AuditLogQueryParams,
  type AuditSeverity,
} from '@/api/Queries/auditLogQueries';
import { AuditSeverityBadge } from '../components/AuditSeverityBadge';
import { AuditOutcomeBadge } from '../components/AuditOutcomeBadge';
import { AuditActionBadge } from '../components/AuditActionBadge';
import { AuditStatsCards } from '../components/AuditStatsCards';
import { AuditAdvancedFilterBar } from '../components/AuditAdvancedFilterBar';
import { AuditLogDetailDrawer } from '../components/AuditLogDetailDrawer';
import { ResourceHistoryModal } from '../components/ResourceHistoryModal';
import { CorrelatedLogsModal } from '../components/CorrelatedLogsModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ActiveTabType = 'all' | 'critical' | 'failures' | 'auth';

export const AuditLogsPage: React.FC = () => {
  const permissions = useAuditPermissions();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<ActiveTabType>('all');

  // Filter State
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    page: 1,
    limit: 20,
    sortBy: '-createdAt',
  });

  // Modals / Drawer State
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedLogData, setSelectedLogData] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Resource History Modal
  const [historyTarget, setHistoryTarget] = useState<{ resource: string; id: string } | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Correlated Logs Modal
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);
  const [isCorrelationOpen, setIsCorrelationOpen] = useState(false);

  // Copied State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Queries
  const {
    data: logsResponse,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    refetch: refetchLogs,
    isError: isLogsError,
    error: logsError,
  } = useAuditLogsQuery(filters);

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useAuditStatsQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const exportMutation = useExportAuditLogsMutation();

  const logs = logsResponse?.logs || [];
  const pagination = logsResponse?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  // Handle Tab Switch
  const handleTabChange = (tabValue: string) => {
    const tab = tabValue as ActiveTabType;
    setActiveTab(tab);

    switch (tab) {
      case 'critical':
        setFilters((prev) => ({
          ...prev,
          severity: 'critical',
          outcome: undefined,
          action: undefined,
          page: 1,
        }));
        break;
      case 'failures':
        setFilters((prev) => ({
          ...prev,
          outcome: 'failure',
          severity: undefined,
          action: undefined,
          page: 1,
        }));
        break;
      case 'auth':
        setFilters((prev) => ({
          ...prev,
          action: 'LOGIN',
          severity: undefined,
          outcome: undefined,
          page: 1,
        }));
        break;
      case 'all':
      default:
        setFilters((prev) => ({
          ...prev,
          severity: undefined,
          outcome: undefined,
          action: undefined,
          page: 1,
        }));
        break;
    }
  };

  const handleFilterUpdate = (newFilters: Partial<AuditLogQueryParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: '-createdAt',
    });
    setActiveTab('all');
  };

  const handleRefresh = () => {
    refetchLogs();
    refetchStats();
    toast.success('Audit trail refreshed');
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  // Row Inspection
  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLogId(log._id);
    setSelectedLogData(log);
    setIsDetailOpen(true);
  };

  const handleOpenResourceHistory = (resource: string, resourceId: string) => {
    setHistoryTarget({ resource, id: resourceId });
    setIsHistoryOpen(true);
  };

  const handleOpenCorrelation = (correlationId: string) => {
    setSelectedCorrelationId(correlationId);
    setIsCorrelationOpen(true);
  };

  // Sorting
  const handleSortChange = (columnId: string, direction: SortDirection) => {
    if (!direction) {
      setFilters((prev) => ({ ...prev, sortBy: '-createdAt' }));
      return;
    }
    const prefix = direction === 'desc' ? '-' : '';
    setFilters((prev) => ({ ...prev, sortBy: `${prefix}${columnId}` }));
  };

  // Client-side quick filter for search if backend doesn't filter full text
  const displayedLogs = useMemo(() => {
    if (!filters.search) return logs;
    const query = filters.search.toLowerCase();
    return logs.filter((log) => {
      const actor = `${log.user?.name || ''} ${log.user?.email || ''}`.toLowerCase();
      const endpoint = (log.endpoint || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const resource = (log.resource || '').toLowerCase();
      const resId = (log.resourceId || '').toLowerCase();
      return (
        actor.includes(query) ||
        endpoint.includes(query) ||
        action.includes(query) ||
        resource.includes(query) ||
        resId.includes(query)
      );
    });
  }, [logs, filters.search]);

  // Define Columns for the Data Table
  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      width: '180px',
      cell: (log) => {
        const date = log.createdAt ? new Date(log.createdAt) : null;
        return (
          <div className="flex flex-col text-xs font-mono">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {date ? format(date, 'MMM dd, yyyy') : '—'}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date ? format(date, 'HH:mm:ss.SSS') : '—'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'user',
      header: 'Operator',
      width: '200px',
      cell: (log) => {
        if (!log.user) {
          return (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span>System Worker</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-800">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {log.user.name?.[0] || log.user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                {log.user.name || 'User'}
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{log.user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'action',
      header: 'Action & Method',
      sortable: true,
      cell: (log) => <AuditActionBadge action={log.action} method={log.method} />,
    },
    {
      id: 'resource',
      header: 'Target Resource',
      sortable: true,
      cell: (log) => {
        const hasResId = Boolean(log.resourceId);
        return (
          <div className="flex flex-col text-xs font-mono gap-0.5">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-semibold text-[11px] bg-slate-50 dark:bg-slate-800 px-1.5 py-0.2">
                {log.resource}
              </Badge>
              {hasResId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenResourceHistory(log.resource as string, log.resourceId as string);
                  }}
                  className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                  title="View Change History for this resource"
                >
                  <History className="h-3 w-3" />
                  <span>History</span>
                </button>
              )}
            </div>
            {hasResId && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="truncate max-w-[120px]" title={log.resourceId!}>
                  #{log.resourceId}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(log.resourceId!, 'Resource ID');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {copiedId === log.resourceId ? (
                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'severity',
      header: 'Severity & Outcome',
      cell: (log) => (
        <div className="flex flex-col gap-1 items-start">
          <AuditSeverityBadge severity={log.severity} />
          <AuditOutcomeBadge outcome={log.outcome} statusCode={log.statusCode} />
        </div>
      ),
    },
    {
      id: 'duration',
      header: 'Metrics / IP',
      sortable: true,
      cell: (log) => (
        <div className="flex flex-col text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {log.duration !== undefined ? `${log.duration}ms` : '—'}
            </span>
            {log.statusCode && (
              <span className={`text-[10px] ${log.statusCode >= 400 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                ({log.statusCode})
              </span>
            )}
          </div>
          <span className="truncate max-w-[110px] text-slate-400">{log.ip || '—'}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '100px',
      cell: (log) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {log.correlationId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenCorrelation(log.correlationId!)}
              className="h-7 w-7 p-0 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              title="Trace Request Flow"
            >
              <GitBranch className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDetail(log)}
            className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inspect</span>
          </Button>
        </div>
      ),
    },
  ];

  // If user lacks permission to list audit logs
  if (!permissions.isLoading && !permissions.canList) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Audit Trail & System Logs"
          subtitle="Enterprise governance, security monitoring, and distributed transaction logs"
        />

        <div className="max-w-2xl mx-auto text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-rose-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You do not have the required permission (<code className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">audit.logs.list</code>) to view the merchant audit logs. Please contact your restaurant administrator or account owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Audit Logs & Activity Trail"
        subtitle="Enterprise audit trail, security monitoring, and distributed request tracing"
        badge={
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Immutable Trail</span>
          </Badge>
        }
        actions={[
          {
            label: 'Refresh',
            icon: <RotateCcw className={`h-3.5 w-3.5 ${isLogsFetching ? 'animate-spin' : ''}`} />,
            onClick: handleRefresh,
            variant: 'outline',
          },
          ...(permissions.canExport
            ? [
                {
                  label: exportMutation.isPending ? 'Exporting...' : 'Export Logs (CSV)',
                  icon: <Download className="h-3.5 w-3.5" />,
                  onClick: handleExport,
                  variant: 'default' as const,
                  disabled: exportMutation.isPending,
                },
              ]
            : []),
        ]}
      />

      {/* Aggregate Statistics Cards */}
      {permissions.canViewStats && (
        <AuditStatsCards
          stats={stats ?? null}
          isLoading={isStatsLoading}
          onFilterCritical={() => handleTabChange('critical')}
          onFilterFailures={() => handleTabChange('failures')}
        />
      )}

      {/* Quick View Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-2xl shadow-2xs">
            <TabsTrigger value="all" className="text-xs font-semibold rounded-xl gap-1.5 px-3 py-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>All Logs</span>
            </TabsTrigger>
            <TabsTrigger value="critical" className="text-xs font-semibold rounded-xl gap-1.5 px-3 py-1.5 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Critical Alerts</span>
              {stats?.bySeverity?.critical ? (
                <Badge className="h-4 px-1 text-[10px] bg-rose-500 text-white rounded-full">
                  {stats.bySeverity.critical}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="failures" className="text-xs font-semibold rounded-xl gap-1.5 px-3 py-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Failures</span>
              {stats?.byOutcome?.failure ? (
                <Badge className="h-4 px-1 text-[10px] bg-amber-500 text-white rounded-full">
                  {stats.byOutcome.failure}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="auth" className="text-xs font-semibold rounded-xl gap-1.5 px-3 py-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Auth & Logins</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-xs text-slate-500 flex items-center gap-2 self-end sm:self-auto font-mono">
          <span>Total Records:</span>
          <strong className="text-slate-800 dark:text-slate-200 font-bold">{pagination.total.toLocaleString()}</strong>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <AuditAdvancedFilterBar
        filters={filters}
        onFilterChange={handleFilterUpdate}
        onReset={handleResetFilters}
        onExport={permissions.canExport ? handleExport : undefined}
        isExporting={exportMutation.isPending}
        canExport={permissions.canExport}
      />

      {/* Main Audit Logs DataTable */}
      <DataTable
        data={displayedLogs}
        columns={columns}
        isLoading={isLogsLoading}
        onRowClick={handleOpenDetail}
        emptyTitle="No Audit Logs Found"
        emptyDescription="No operations or security events match the current filter criteria."
        emptyIcon={<History className="h-8 w-8 text-slate-300 mx-auto mb-2" />}
        paginated={true}
        pageSize={filters.limit || 20}
        currentPage={filters.page || 1}
        totalCount={pagination.total}
        onPageChange={(page) => handleFilterUpdate({ page })}
        onPageSizeChange={(limit) => handleFilterUpdate({ limit, page: 1 })}
        onSortChange={handleSortChange}
        initialSortColumn="createdAt"
        initialSortDirection="desc"
      />

      {/* Log Detail Drawer */}
      <AuditLogDetailDrawer
        logId={selectedLogId}
        initialLog={selectedLogData}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onOpenResourceHistory={handleOpenResourceHistory}
        onOpenCorrelation={handleOpenCorrelation}
      />

      {/* Resource History Modal */}
      <ResourceHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        resource={historyTarget?.resource || null}
        resourceId={historyTarget?.id || null}
        onViewLogDetail={(logId) => {
          setSelectedLogId(logId);
          setIsDetailOpen(true);
        }}
      />

      {/* Correlated Logs Modal (Distributed Request Tracing) */}
      <CorrelatedLogsModal
        open={isCorrelationOpen}
        onOpenChange={setIsCorrelationOpen}
        correlationId={selectedCorrelationId}
        onViewLogDetail={(logId) => {
          setSelectedLogId(logId);
          setIsDetailOpen(true);
        }}
      />
    </div>
  );
};
export default AuditLogsPage;
