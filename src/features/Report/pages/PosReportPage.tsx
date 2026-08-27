import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
    Calculator,
  CreditCard,
  Smartphone,
  Percent,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Users,
  Store,
  CheckCircle2,
  XCircle,
  Download,
  Receipt,
} from 'lucide-react';
import { format, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import {
  PageHeader,
  DataCard,
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type BulkAction,
  type KanbanColumnConfig,
  type SavedPreset,
} from '@/components/Common';
import { Badge } from '@/components/ui/badge';

type PosSessionRow = {
  _id: string;
  sessionId: string;
  openedAt: string;
  closedAt?: string;
  cashier: string;
  branch: string;
  ordersCount: number;
  salesTotal: number;
  cashIn: number;
  cashOut: number;
  cardTotal: number;
  mobileTotal: number;
  discounts: number;
  netTotal: number;
  tips: number;
  openingFloat: number;
  closingBalance: number;
  variance: number;
};

const BRANCH_OPTIONS = ['Main Branch', 'Downtown', 'Airport Lounge', 'Riverside'];
const CASHIER_OPTIONS = ['Abebe Bekele', 'Sara Mengistu', 'Tigist Abebe', 'Michael Tekle', 'Helen Debebe'];

const generateMockPosData = (): PosSessionRow[] => {
  const now = new Date();
  const data: PosSessionRow[] = [];

  for (let i = 0; i < 20; i++) {
    const openedAt = new Date(now.getTime() - i * 8 * 60 * 60 * 1000 - Math.random() * 4 * 60 * 60 * 1000);
    const isClosed = i % 3 !== 0;
    const closedAt = isClosed ? new Date(openedAt.getTime() + (4 + Math.random() * 6) * 60 * 60 * 1000) : undefined;

    const ordersCount = Math.floor(15 + Math.random() * 60);
    const salesTotal = Math.round((ordersCount * (120 + Math.random() * 280)) * 100) / 100;
    const discounts = Math.round((salesTotal * (0.02 + Math.random() * 0.08)) * 100) / 100;
    const tips = Math.round((salesTotal * (0.03 + Math.random() * 0.07)) * 100) / 100;
    const cardTotal = Math.round((salesTotal * (0.25 + Math.random() * 0.3)) * 100) / 100;
    const mobileTotal = Math.round((salesTotal * (0.15 + Math.random() * 0.25)) * 100) / 100;
    const cashIn = Math.round((salesTotal - cardTotal - mobileTotal) * 100) / 100;
    const cashOut = Math.round((500 + Math.random() * 2500) * 100) / 100;
    const netTotal = Math.round((salesTotal - discounts) * 100) / 100;
    const openingFloat = 5000;
    const expectedClosing = openingFloat + cashIn - cashOut + tips;
    const closingBalance = Math.round((expectedClosing + (Math.random() - 0.5) * 300) * 100) / 100;
    const variance = Math.round((closingBalance - expectedClosing) * 100) / 100;

    data.push({
      _id: `pos-session-${i + 1}`,
      sessionId: `POS-${String(2024 - Math.floor(i / 5)).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
      openedAt: openedAt.toISOString(),
      closedAt: closedAt?.toISOString(),
      cashier: CASHIER_OPTIONS[i % CASHIER_OPTIONS.length],
      branch: BRANCH_OPTIONS[i % BRANCH_OPTIONS.length],
      ordersCount,
      salesTotal,
      cashIn,
      cashOut,
      cardTotal,
      mobileTotal,
      discounts,
      netTotal,
      tips,
      openingFloat,
      closingBalance,
      variance,
    });
  }
  return data;
};

const PosReportPage: React.FC = () => {
  const sessions = useMemo(() => generateMockPosData(), []);
  const isLoading = false;

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalSales = sessions.reduce((s, r) => s + r.salesTotal, 0);
    const totalNet = sessions.reduce((s, r) => s + r.netTotal, 0);
    const totalTips = sessions.reduce((s, r) => s + r.tips, 0);
    return { totalSessions, totalSales, totalNet, totalTips };
  }, [sessions]);

  const openMatcher = (r: PosSessionRow) => !r.closedAt;
  const closedMatcher = (r: PosSessionRow) => !!r.closedAt;
  const todayMatcher = (r: PosSessionRow) => isToday(new Date(r.openedAt));
  const yesterdayMatcher = (r: PosSessionRow) => isYesterday(new Date(r.openedAt));
  const thisWeekMatcher = (r: PosSessionRow) => {
    const d = new Date(r.openedAt);
    return isWithinInterval(d, { start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
  };
  const cashierFilterMatcher = (r: PosSessionRow) => r.cashier === CASHIER_OPTIONS[0];

  const quickFilters: QuickFilterOption<PosSessionRow>[] = [
    { key: 'all', label: 'All Sessions', count: sessions.length, icon: <Receipt className="h-3.5 w-3.5" /> },
    { key: 'open', label: 'Open', count: sessions.filter(openMatcher).length, icon: <Clock className="h-3.5 w-3.5" />, color: 'amber', matcher: openMatcher },
    { key: 'closed', label: 'Closed', count: sessions.filter(closedMatcher).length, icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'emerald', matcher: closedMatcher },
    { key: 'today', label: 'Today', count: sessions.filter(todayMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: todayMatcher },
    { key: 'yesterday', label: 'Yesterday', count: sessions.filter(yesterdayMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: yesterdayMatcher },
    { key: 'this-week', label: 'This Week', count: sessions.filter(thisWeekMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: thisWeekMatcher },
    { key: 'cashier-filter', label: `${CASHIER_OPTIONS[0]}`, count: sessions.filter(cashierFilterMatcher).length, icon: <Users className="h-3.5 w-3.5" />, matcher: cashierFilterMatcher },
  ];

  const filterFields: AdvancedFilterField[] = [
    { id: 'status', label: 'Status', type: 'multi-select', options: [
      { label: 'Open', value: 'open' }, { label: 'Closed', value: 'closed' },
    ]},
    { id: 'cashier', label: 'Cashier', type: 'multi-select', options: CASHIER_OPTIONS.map(c => ({ label: c, value: c })) },
    { id: 'branch', label: 'Branch', type: 'multi-select', options: BRANCH_OPTIONS.map(b => ({ label: b, value: b })) },
    { id: 'salesTotal', label: 'Sales Total', type: 'number-range', min: 0, max: 1000000, step: 100, prefix: 'ETB' },
    { id: 'openedAt', label: 'Opened Date', type: 'date-range' },
    { id: 'closedAt', label: 'Closed Date', type: 'date-range' },
    { id: 'ordersCount', label: 'Orders Count', type: 'number-range', min: 0, max: 1000, step: 1 },
  ];

  const groupByOptions: GroupByOption<PosSessionRow>[] = [
    { id: 'cashier', label: 'By Cashier', accessor: (r) => r.cashier || 'N/A', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'branch', label: 'By Branch', accessor: (r) => r.branch || 'N/A', icon: <Store className="h-3.5 w-3.5" /> },
    { id: 'day', label: 'By Day', accessor: (r) => format(new Date(r.openedAt), 'EEEE, MMM d'), icon: <Calendar className="h-3.5 w-3.5" /> },
  ];

  const sortOptions: SortOption<PosSessionRow>[] = [
    { id: 'sessionId', label: 'Session ID', field: 'sessionId' },
    { id: 'openedDesc', label: 'Opened (Newest)', field: 'openedAt', direction: 'desc' },
    { id: 'openedAsc', label: 'Opened (Oldest)', field: 'openedAt', direction: 'asc' },
    { id: 'salesDesc', label: 'Sales (High to Low)', field: 'salesTotal', direction: 'desc' },
    { id: 'netDesc', label: 'Net Total (High to Low)', field: 'netTotal', direction: 'desc' },
    { id: 'ordersDesc', label: 'Orders (Most)', field: 'ordersCount', direction: 'desc' },
    { id: 'varianceDesc', label: 'Variance (Largest)', field: 'variance', direction: 'desc' },
  ];

  const kanbanColumns: KanbanColumnConfig<PosSessionRow>[] = [
    {
      id: 'open',
      title: 'Open Sessions',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Clock className="h-4 w-4" />,
      matcher: openMatcher,
    },
    {
      id: 'closed',
      title: 'Closed Sessions',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      matcher: closedMatcher,
    },
  ];

  const initialPresets: SavedPreset[] = [
    {
      id: 'preset-open-sessions',
      name: 'Open Sessions Watch',
      isSystem: true,
      filters: { quickFilter: 'open', viewMode: 'table', sortField: 'openedAt', sortDirection: 'desc' },
    },
    {
      id: 'preset-daily-reconcile',
      name: 'Daily Reconciliation',
      isSystem: true,
      filters: { quickFilter: 'today', groupBy: 'branch', viewMode: 'table' },
    },
    {
      id: 'preset-weekly-summary',
      name: 'Weekly Sales Summary',
      isSystem: true,
      filters: { quickFilter: 'this-week', sortField: 'salesTotal', sortDirection: 'desc', viewMode: 'table' },
    },
  ];

  const bulkActions: BulkAction<PosSessionRow>[] = [
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Session ID,Opened At,Closed At,Cashier,Branch,Orders,Sales Total,Cash In,Cash Out,Card Total,Mobile Total,Discounts,Net Total,Tips,Opening Float,Closing Balance,Variance';
        const rows = selectedRows.map((r) =>
          [
            r.sessionId,
            r.openedAt ? format(new Date(r.openedAt), 'yyyy-MM-dd HH:mm') : '',
            r.closedAt ? format(new Date(r.closedAt), 'yyyy-MM-dd HH:mm') : '',
            r.cashier,
            r.branch,
            r.ordersCount,
            r.salesTotal.toFixed(2),
            r.cashIn.toFixed(2),
            r.cashOut.toFixed(2),
            r.cardTotal.toFixed(2),
            r.mobileTotal.toFixed(2),
            r.discounts.toFixed(2),
            r.netTotal.toFixed(2),
            r.tips.toFixed(2),
            r.openingFloat.toFixed(2),
            r.closingBalance.toFixed(2),
            r.variance.toFixed(2),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `POS_Sessions_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Export successful', { description: `${selectedRows.length} POS sessions exported to CSV` });
        clearSelection();
      },
    },
  ];

  const columns: ColumnDef<PosSessionRow>[] = [
    {
      id: 'session',
      header: 'Session',
      sortable: true,
      accessorKey: 'sessionId',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white">{r.sessionId}</p>
            <p className="text-[10px] text-slate-500">{r.branch || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'opened',
      header: 'Opened',
      sortable: true,
      accessorKey: 'openedAt',
      cell: (r) => (
        <div className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div>
            <p className="font-medium">{format(new Date(r.openedAt), 'MMM d, yyyy')}</p>
            <p className="text-[10px]">{format(new Date(r.openedAt), 'HH:mm')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'closed',
      header: 'Closed',
      sortable: true,
      accessorKey: 'closedAt',
      cell: (r) => {
        if (!r.closedAt) {
          return (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1">
              <Clock className="h-3 w-3" />
              Open
            </Badge>
          );
        }
        return (
          <div className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-medium">{format(new Date(r.closedAt), 'MMM d, yyyy')}</p>
              <p className="text-[10px]">{format(new Date(r.closedAt), 'HH:mm')}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'cashier',
      header: 'Cashier',
      sortable: true,
      cell: (r) => (
        <div>
          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{r.cashier || 'N/A'}</p>
          <p className="text-[10px] text-slate-500">{r.ordersCount} orders</p>
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      sortable: true,
      cell: (r) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{r.branch || 'N/A'}</span>
      ),
    },
    {
      id: 'orders',
      header: 'Orders',
      sortable: true,
      accessorKey: 'ordersCount',
      cell: (r) => (
        <Badge variant="outline" className="font-mono text-[10px] font-bold">
          {r.ordersCount}
        </Badge>
      ),
    },
    {
      id: 'cashIn',
      header: 'Cash In',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          +ETB {r.cashIn.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'cashOut',
      header: 'Cash Out',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">
          -ETB {r.cashOut.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'card',
      header: 'Card',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1 text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-400">
          <CreditCard className="h-3.5 w-3.5" />
          {r.cardTotal.toFixed(2)}
        </div>
      ),
    },
    {
      id: 'mobile',
      header: 'Mobile',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1 text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
          <Smartphone className="h-3.5 w-3.5" />
          {r.mobileTotal.toFixed(2)}
        </div>
      ),
    },
    {
      id: 'discounts',
      header: 'Discounts',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1 text-xs font-mono text-amber-700 dark:text-amber-400">
          <Percent className="h-3.5 w-3.5" />
          <span className="font-semibold">-{r.discounts.toFixed(2)}</span>
        </div>
      ),
    },
    {
      id: 'net',
      header: 'Net',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {r.netTotal.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'tips',
      header: 'Tips',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          +{r.tips.toFixed(2)}
        </div>
      ),
    },
    {
      id: 'balance',
      header: 'Balance',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {r.closingBalance.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'variance',
      header: 'Variance',
      sortable: true,
      cell: (r) => {
        const isPositive = r.variance >= 0;
        const isZero = Math.abs(r.variance) < 0.01;
        return (
          <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
            isZero ? 'text-slate-500' : isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            {isZero ? null : isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{isPositive ? '+' : ''}{r.variance.toFixed(2)}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="POS Sessions Report"
        subtitle="Reconcile cashier shifts, track per-session revenue, payment mix, and variance analysis"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Sessions"
            value={isLoading ? '...' : stats.totalSessions}
            icon={<Calculator className="h-5 w-5" />}
            theme="primary"
            subtitle="Recorded POS sessions"
            isLoading={isLoading}
          />
          <DataCard
            title="Total Sales"
            value={isLoading ? '...' : `ETB ${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme="purple"
            subtitle="Gross sales before discounts"
            isLoading={isLoading}
          />
          <DataCard
            title="Net Total"
            value={isLoading ? '...' : `ETB ${stats.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<TrendingUp className="h-5 w-5" />}
            theme="emerald"
            subtitle="Revenue after discounts applied"
            isLoading={isLoading}
          />
          <DataCard
            title="Tips Collected"
            value={isLoading ? '...' : `ETB ${stats.totalTips.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<FileSpreadsheet className="h-5 w-5" />}
            theme="amber"
            subtitle="Cashier gratuities across sessions"
            isLoading={isLoading}
          />
        </div>

        <DataViewSystem<PosSessionRow>
          data={sessions}
          rowKey="_id"
          entityName="POS Sessions"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<Receipt className="h-8 w-8 text-slate-400" />}
          emptyTitle="No POS sessions found"
          emptyDescription="POS sessions will appear here once cashiers open and close shifts."
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search session ID, cashier, branch..."
          searchFields={['sessionId', 'cashier', 'branch']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="openedAt"
          defaultSortDirection="desc"
          presetStorageKey="posReport"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="closedAt"
          exportFileName="POS_Sessions"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default PosReportPage;
