// src/features/AuditLog/components/AuditAdvancedFilterBar.tsx
import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  Download,
  Calendar,
  Layers,
  Activity,
  User,
  Building2,
  GitBranch,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranchesQuery } from '@/api/Queries/branchQueries';
import { useMerchantStaffQuery } from '@/api/Queries/merchantQueries';
import type { AuditLogQueryParams, AuditSeverity, AuditOutcome } from '../types/auditLogTypes';
import { subDays, subHours, startOfDay, endOfDay, format } from 'date-fns';

interface AuditAdvancedFilterBarProps {
  filters: AuditLogQueryParams;
  onFilterChange: (newFilters: Partial<AuditLogQueryParams>) => void;
  onReset: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  canExport?: boolean;
}

const RESOURCE_OPTIONS = [
  { label: 'All Resources', value: 'all' },
  { label: 'Orders', value: 'Order' },
  { label: 'Users', value: 'User' },
  { label: 'Roles & Permissions', value: 'Role' },
  { label: 'Payments', value: 'Payment' },
  { label: 'Menu & Items', value: 'Menu' },
  { label: 'Floor Tables', value: 'Table' },
  { label: 'Kitchen Tickets', value: 'KitchenTicket' },
  { label: 'Kitchen Stations', value: 'KitchenStation' },
  { label: 'Ingredients', value: 'Ingredient' },
  { label: 'Suppliers', value: 'Supplier' },
  { label: 'Recipes', value: 'Recipe' },
  { label: 'Purchase Orders', value: 'PurchaseOrder' },
  { label: 'Branches', value: 'Branch' },
  { label: 'Merchant Settings', value: 'Merchant' },
  { label: 'Subscriptions', value: 'Subscription' },
  { label: 'Invitations', value: 'Invitation' },
  { label: 'Export Jobs', value: 'ExportJob' },
];

const ACTION_OPTIONS = [
  { label: 'All Actions', value: 'all' },
  // CRUD
  { label: 'CREATE', value: 'CREATE' },
  { label: 'UPDATE', value: 'UPDATE' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'READ', value: 'READ' },
  // Auth
  { label: 'LOGIN', value: 'LOGIN' },
  { label: 'LOGOUT', value: 'LOGOUT' },
  { label: 'PASSWORD_CHANGE', value: 'PASSWORD_CHANGE' },
  { label: 'TOKEN_REFRESH', value: 'TOKEN_REFRESH' },
  // Order
  { label: 'ORDER_STATUS_CHANGE', value: 'ORDER_STATUS_CHANGE' },
  { label: 'ORDER_CANCEL', value: 'ORDER_CANCEL' },
  { label: 'PAYMENT_RECEIVED', value: 'PAYMENT_RECEIVED' },
  { label: 'REFUND_ISSUED', value: 'REFUND_ISSUED' },
  // Kitchen
  { label: 'TICKET_CREATED', value: 'TICKET_CREATED' },
  { label: 'TICKET_STATUS_CHANGE', value: 'TICKET_STATUS_CHANGE' },
  { label: 'TICKET_ASSIGNED', value: 'TICKET_ASSIGNED' },
  // Inventory
  { label: 'INVENTORY_ADJUST', value: 'INVENTORY_ADJUST' },
  { label: 'INVENTORY_BATCH_ADJUST', value: 'INVENTORY_BATCH_ADJUST' },
  { label: 'STOCK_ALERT', value: 'STOCK_ALERT' },
  // User Management
  { label: 'ROLE_ASSIGN', value: 'ROLE_ASSIGN' },
  { label: 'ROLE_REVOKE', value: 'ROLE_REVOKE' },
  { label: 'TASK_ASSIGN', value: 'TASK_ASSIGN' },
  { label: 'USER_SUSPEND', value: 'USER_SUSPEND' },
  { label: 'USER_ACTIVATE', value: 'USER_ACTIVATE' },
  // Menu & Reports
  { label: 'MENU_PUBLISH', value: 'MENU_PUBLISH' },
  { label: 'PRICE_CHANGE', value: 'PRICE_CHANGE' },
  { label: 'REPORT_ACCESS', value: 'REPORT_ACCESS' },
  { label: 'REPORT_EXPORT', value: 'REPORT_EXPORT' },
];

const SEVERITY_OPTIONS = [
  { label: 'All Severities', value: 'all' },
  { label: 'Critical Only', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const OUTCOME_OPTIONS = [
  { label: 'All Outcomes', value: 'all' },
  { label: 'Success Only', value: 'success' },
  { label: 'Failure Only', value: 'failure' },
  { label: 'Partial', value: 'partial' },
];

const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Custom Range', value: 'custom' },
];

export const AuditAdvancedFilterBar: React.FC<AuditAdvancedFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  isExporting = false,
  canExport = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedDatePreset, setSelectedDatePreset] = useState('all');

  const { data: branches = [] } = useBranchesQuery();
  const { data: staffUsers = [] } = useMerchantStaffQuery();

  const handleDatePresetChange = (preset: string) => {
    setSelectedDatePreset(preset);
    const now = new Date();

    switch (preset) {
      case 'today':
        onFilterChange({
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
          page: 1,
        });
        break;
      case '24h':
        onFilterChange({
          startDate: subHours(now, 24).toISOString(),
          endDate: now.toISOString(),
          page: 1,
        });
        break;
      case '7d':
        onFilterChange({
          startDate: subDays(now, 7).toISOString(),
          endDate: now.toISOString(),
          page: 1,
        });
        break;
      case '30d':
        onFilterChange({
          startDate: subDays(now, 30).toISOString(),
          endDate: now.toISOString(),
          page: 1,
        });
        break;
      case 'all':
      default:
        onFilterChange({
          startDate: undefined,
          endDate: undefined,
          page: 1,
        });
        break;
    }
  };

  // Count active advanced filters
  const activeCount = [
    filters.resource && filters.resource !== 'all',
    filters.action && filters.action !== 'all',
    filters.severity && filters.severity !== 'all',
    filters.outcome && filters.outcome !== 'all',
    filters.branchId,
    filters.userId,
    filters.correlationId,
    filters.startDate || filters.endDate,
  ].filter(Boolean).length;

  const isFiltered = Boolean(filters.search) || activeCount > 0;

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-2xs space-y-3">
      {/* Primary Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Search & Quick Dropdowns */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search actions, endpoints, users..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="pl-9 pr-8 h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-xl focus-visible:bg-white dark:focus-visible:bg-slate-900"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '', page: 1 })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Resource Filter */}
          <div className="w-[150px]">
            <Select
              value={filters.resource || 'all'}
              onValueChange={(val) => onFilterChange({ resource: val === 'all' ? undefined : val, page: 1 })}
            >
              <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {RESOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Filter */}
          <div className="w-[130px]">
            <Select
              value={(filters.severity as string) || 'all'}
              onValueChange={(val) =>
                onFilterChange({ severity: val === 'all' ? undefined : (val as AuditSeverity), page: 1 })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outcome Filter */}
          <div className="w-[130px]">
            <Select
              value={(filters.outcome as string) || 'all'}
              onValueChange={(val) =>
                onFilterChange({ outcome: val === 'all' ? undefined : (val as AuditOutcome), page: 1 })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Actions: Advanced Toggle, Reset, Export */}
        <div className="flex items-center gap-2 justify-end">
          {/* Advanced Filter Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={`h-9 text-xs font-semibold rounded-xl border-slate-200/80 dark:border-slate-700/80 gap-1.5 transition-all ${
              activeCount > 0
                ? 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-primary text-white">
                {activeCount}
              </Badge>
            )}
            {expanded ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
          </Button>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDatePreset('all');
                onReset();
              }}
              className="h-9 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl gap-1 px-2.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          {/* Export CSV Button */}
          {canExport && onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isExporting}
              className="h-9 text-xs font-semibold rounded-xl border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 gap-1.5 shadow-2xs hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {expanded && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in-50 duration-150">
          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Specific Action</span>
            </label>
            <Select
              value={filters.action || 'all'}
              onValueChange={(val) => onFilterChange({ action: val === 'all' ? undefined : val, page: 1 })}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-lg">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>Branch</span>
            </label>
            <Select
              value={filters.branchId || 'all'}
              onValueChange={(val) => onFilterChange({ branchId: val === 'all' ? undefined : val, page: 1 })}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-lg">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Branches
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b._id} value={b._id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator / User Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Operator / User</span>
            </label>
            <Select
              value={filters.userId || 'all'}
              onValueChange={(val) => onFilterChange({ userId: val === 'all' ? undefined : val, page: 1 })}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-lg">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all" className="text-xs">
                  All Operators
                </SelectItem>
                {staffUsers.map((u: any) => (
                  <SelectItem key={u._id} value={u._id} className="text-xs">
                    {u.firstName ? `${u.firstName} ${u.lastName}` : u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Preset Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Timeframe</span>
            </label>
            <Select value={selectedDatePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-lg">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Correlation ID Input */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>Correlation ID (Distributed Trace)</span>
            </label>
            <div className="relative">
              <Input
                placeholder="e.g. req-123e4567-e89b-12d3-a456-426614174000"
                value={filters.correlationId || ''}
                onChange={(e) => onFilterChange({ correlationId: e.target.value.trim() || undefined, page: 1 })}
                className="h-8 text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-lg"
              />
              {filters.correlationId && (
                <button
                  onClick={() => onFilterChange({ correlationId: undefined, page: 1 })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Range if preset is custom */}
          {selectedDatePreset === 'custom' && (
            <div className="space-y-1 sm:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate ? format(new Date(filters.startDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) =>
                    onFilterChange({
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      page: 1,
                    })
                  }
                  className="h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate ? format(new Date(filters.endDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) =>
                    onFilterChange({
                      endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      page: 1,
                    })
                  }
                  className="h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
