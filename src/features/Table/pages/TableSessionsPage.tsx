// src/features/Table/pages/TableSessionsPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  Clock,
  Utensils,
  ShoppingBag,
  ArrowRightLeft,
  Unlock,
  Users,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Coffee,
  Sparkles,
  ChevronRight,
  Eye,
  Activity,
  Receipt,
  DollarSign,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader, DataCard, type ColumnDef } from '@/components/Common';
import { DataViewSystem } from '@/components/Common';
import type {
  QuickFilterOption,
  AdvancedFilterField,
  GroupByOption,
  SortOption,
} from  '../../../components/Common/AdavanceFilter';
import { toast } from 'sonner';
import {
  useSessionsQuery,
  useFreeSessionMutation,
  type TableSession,
} from '../../../api/Queries/sessionQueries';
import {
  useChangeTableMutation,
  useTablesQuery,
  type Table,
} from '../../../api/Queries/tableQueries';
import { useBranchesQuery } from '../../../api/Queries/branchQueries';
import { useTranslation } from '@/locales/i18n';

const formatElapsedTime = (startedAt: string) => {
  try {
    const start = new Date(startedAt).getTime();
    if (isNaN(start)) return 'Just now';
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'}`;
    const hours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${hours}h ${remainingMins}m`;
  } catch {
    return 'Active';
  }
};

const getMinutesElapsed = (startedAt: string): number => {
  try {
    const start = new Date(startedAt).getTime();
    if (isNaN(start)) return 0;
    return Math.floor(Math.max(0, Date.now() - start) / 60000);
  } catch {
    return 0;
  }
};

export const TableSessionsPage: React.FC = () => {
  const { t } = useTranslation('table');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  const { data: branches = [] } = useBranchesQuery();
  const currentBranch = branches.find((b) => b._id === currentBranchId);
  const currentBranchName = currentBranch?.name || 'All Locations';

  const { data: rawSessions = [], isLoading, refetch } = useSessionsQuery({
    branchId: currentBranchId || undefined,
    status: 'active',
  });

  const { data: tables = [] } = useTablesQuery(currentBranchId);
  const freeSessionMutation = useFreeSessionMutation();
  const changeTableMutation = useChangeTableMutation();

  // Change Table Modal State
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);
  const [targetTableId, setTargetTableId] = useState('');
  const [moveReason, setMoveReason] = useState('');

  // Stats calculation
  const totalSessions = rawSessions.length;
  const orderedSessions = rawSessions.filter((s: TableSession) => (s.orders || []).length > 0);
  const browsingSessions = rawSessions.filter((s: TableSession) => (s.orders || []).length === 0);
  const totalBillValue = rawSessions.reduce((acc: number, s: TableSession) => {
    const sessionBill = (s.orders || []).reduce((sum: number, o: any) => sum + (o.totalPrice || o.totalAmount || 0), 0);
    return acc + sessionBill;
  }, 0);

  // Available destination tables for Move action
  const availableTargetTables = useMemo(() => {
    return tables.filter(
      (t: Table) =>
        t.status === 'available' ||
        (selectedSession && t._id === selectedSession.table?._id)
    );
  }, [tables, selectedSession]);

  const handleOpenMove = (session: TableSession) => {
    setSelectedSession(session);
    setTargetTableId('');
    setMoveReason('');
    setIsMoveOpen(true);
  };

  const handleExecuteMove = async () => {
    if (!selectedSession || !targetTableId) {
      toast.error('Please select a destination table');
      return;
    }

    const fromTableId = selectedSession.table?._id;

    if (!fromTableId) {
      toast.error('Current table reference is missing');
      return;
    }

    try {
      await changeTableMutation.mutateAsync({
        fromTableId,
        toTableId: targetTableId,
        reason: moveReason || 'Guest requested table change',
      });
      toast.success('Session and active orders moved successfully');
      setIsMoveOpen(false);
      setSelectedSession(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to move table session');
    }
  };

  const handleFreeSession = async (session: TableSession) => {
    const tableNum = session.table?.tableNumber || 'Table';

    if (
      !window.confirm(
        `Are you sure you want to end active dining session for Table ${tableNum}? This will free the table.`
      )
    ) {
      return;
    }

    try {
      await freeSessionMutation.mutateAsync(session._id);
      toast.success(`Session completed. Table ${tableNum} is now available.`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to free table session');
    }
  };

  // Quick Filters
  const quickFilters: QuickFilterOption<TableSession>[] = useMemo(
    () => [
      { key: 'all', label: 'All Active', count: totalSessions },
      {
        key: 'ordered',
        label: 'With Orders',
        count: orderedSessions.length,
        matcher: (s) => (s.orders || []).length > 0,
      },
      {
        key: 'browsing',
        label: 'Browsing Menu',
        count: browsingSessions.length,
        matcher: (s) => (s.orders || []).length === 0,
      },
      {
        key: 'extended',
        label: 'Long Stay (>45m)',
        count: rawSessions.filter((s: TableSession) => getMinutesElapsed(s.startedAt) >= 45).length,
        matcher: (s) => getMinutesElapsed(s.startedAt) >= 45,
      },
    ],
    [totalSessions, orderedSessions.length, browsingSessions.length, rawSessions]
  );

  // Advanced Filters
  const filterFields: AdvancedFilterField[] = [
    {
      id: 'sessionType',
      label: 'Session State',
      type: 'select',
      options: [
        { label: 'All Sessions', value: 'all' },
        { label: 'With Active Orders', value: 'ordered' },
        { label: 'Browsing Only', value: 'browsing' },
      ],
    },
  ];

  // Group By
  const groupByOptions: GroupByOption<TableSession>[] = [
    {
      id: 'hasOrders',
      label: 'Order Status',
      accessor: (s) => ((s.orders || []).length > 0 ? 'Active Orders Placed' : 'Browsing Menu'),
    },
  ];

  // Sort
  const sortOptions: SortOption<TableSession>[] = [
    { id: 'time_asc', label: 'Duration (Longest First)', field: 'startedAt', direction: 'asc' },
    { id: 'time_desc', label: 'Duration (Newest First)', field: 'startedAt', direction: 'desc' },
  ];

  // Columns for Table View
  const columns: ColumnDef<TableSession>[] = useMemo(
    () => [
      {
        id: 'table',
        header: 'Table / Session',
        accessorKey: 'table.tableNumber',
        sortable: true,
        cell: (session: TableSession) => {
          const tableNum = session.table?.tableNumber || 'N/A';
          const branchName = session.table?.branch?.name || currentBranchName;

          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {tableNum}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  Table {tableNum}
                </div>
                <div className="text-xs text-muted-foreground">{branchName}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: (session: TableSession) => {
          if (session.customer?.fullName) {
            return (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{session.customer.fullName}</span>
              </div>
            );
          }
          return <Badge variant="outline" className="text-[10px]">Guest / Anonymous</Badge>;
        },
      },
      {
        id: 'duration',
        header: 'Elapsed Time',
        cell: (session: TableSession) => {
          const mins = getMinutesElapsed(session.startedAt);
          const isExtended = mins >= 60;
          return (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isExtended
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{formatElapsedTime(session.startedAt)}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'orders',
        header: 'Active Orders',
        cell: (session: TableSession) => {
          const orders = session.orders || [];
          const billTotal = orders.reduce(
            (sum: number, o: any) => sum + (o.totalPrice || o.totalAmount || 0),
            0
          );

          if (orders.length === 0) {
            return (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <Coffee className="h-3 w-3" /> Browsing Menu
              </Badge>
            );
          }

          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{orders.length} Order(s)</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ETB {billTotal.toLocaleString()}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (session: TableSession) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => handleOpenMove(session)}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Move</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              onClick={() => handleFreeSession(session)}
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Free Table</span>
            </Button>
          </div>
        ),
      },
    ],
    [currentBranchName]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20">
      <PageHeader
        title="Live Seated Sessions"
        subtitle={`${currentBranchName} • Real-time guest seating, active dining, and running table checks`}
        breadcrumbText={tCommon('back')}
        breadcrumbAction={() => navigate(-1)}
      />

      {/* KPI Metric Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Active Sessions"
            value={totalSessions}
            subtitle="Occupied tables"
            icon={<Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          />
          <DataCard
            title="With Orders"
            value={orderedSessions.length}
            subtitle="Dining in progress"
            icon={<ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          />
          <DataCard
            title="Browsing Menu"
            value={browsingSessions.length}
            subtitle="Evaluating choices"
            icon={<Coffee className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          />
          <DataCard
            title="Live Session Volume"
            value={`ETB ${totalBillValue.toLocaleString()}`}
            subtitle="Running unbilled tabs"
            icon={<Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          />
        </div>
      </div>

      {/* DataView System (No tabs) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <DataViewSystem<TableSession>
          data={rawSessions}
          rowKey="_id"
          entityName="sessions"
          columns={columns}
          title="Active Table Sessions"
          subtitle="Monitor guest table occupancy, duration, orders, and transfer tables"
          searchPlaceholder="Search by table number or customer..."
          searchFields={['table.tableNumber', 'customer.fullName']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          supportedViewModes={['grid', 'table', 'list']}
          defaultViewMode="grid"
          presetStorageKey="table_sessions_view"
          isLoading={isLoading}
          renderCustomCard={(session: TableSession, isSelected, onSelect) => {
            const tableNum = session.table?.tableNumber || 'N/A';
            const branchName = session.table?.branch?.name || currentBranchName;
            const orders = session.orders || [];
            const billTotal = orders.reduce(
              (sum: number, o: any) => sum + (o.totalPrice || o.totalAmount || 0),
              0
            );
            const mins = getMinutesElapsed(session.startedAt);

            return (
              <Card
                key={session._id}
                className={`group overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all ${
                  isSelected ? 'ring-2 ring-primary border-primary' : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-lg">
                        {tableNum}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          Table {tableNum}
                        </h4>
                        <p className="text-xs text-muted-foreground">{branchName}</p>
                      </div>
                    </div>

                    <Badge
                      variant={mins >= 60 ? 'secondary' : 'outline'}
                      className="gap-1 text-xs font-semibold"
                    >
                      <Clock className="h-3 w-3" />
                      {formatElapsedTime(session.startedAt)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Customer
                      </span>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                        {session.customer?.fullName || 'Walk-in Guest'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Current Tab
                      </span>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {orders.length > 0 ? `ETB ${billTotal.toLocaleString()}` : 'Browsing'}
                      </div>
                    </div>
                  </div>

                  {orders.length > 0 && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Orders Placed: {orders.length} batch(es)
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => handleOpenMove(session)}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Move Table
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => handleFreeSession(session)}
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      Free Table
                    </Button>
                  </div>
                </div>
              </Card>
            );
          }}
        />
      </div>

      {/* Move Table Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Transfer Table Session
            </DialogTitle>
            <DialogDescription>
              Move active guests and orders from Table {selectedSession?.table?.tableNumber} to an available table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Destination Table
              </label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose an available table..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTargetTables.map((t: Table) => (
                    <SelectItem key={t._id} value={t._id}>
                      Table {t.tableNumber} • {t.section || 'Main Area'} ({t.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Reason for Move (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Guest requested outdoor seating, larger table"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteMove}
              disabled={!targetTableId || changeTableMutation.isPending}
            >
              {changeTableMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableSessionsPage;
