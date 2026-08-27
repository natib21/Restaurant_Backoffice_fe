import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Calendar,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  Package,
  Truck,
  Download,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { format, isToday, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';
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

type SalesRow = {
  _id: string;
  date: string;
  branch: string;
  orderCount: number;
  revenue: number;
  discounts: number;
  tips: number;
  netRevenue: number;
  aov: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile';
  orderType: 'dine_in' | 'takeaway' | 'delivery';
};

const BRANCHES = ['Main Branch', 'Downtown', 'Airport', 'Mall Location'];
const PAYMENT_METHODS: SalesRow['paymentMethod'][] = ['cash', 'card', 'transfer', 'mobile'];
const ORDER_TYPES: SalesRow['orderType'][] = ['dine_in', 'takeaway', 'delivery'];

const generateMockSalesData = (): SalesRow[] => {
  const rows: SalesRow[] = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const orderCount = Math.floor(Math.random() * 80) + 10;
    const aov = Math.round((Math.random() * 400 + 150) * 100) / 100;
    const revenue = Math.round(orderCount * aov * 100) / 100;
    const discounts = Math.round(revenue * (Math.random() * 0.1) * 100) / 100;
    const tips = Math.round(revenue * (Math.random() * 0.08) * 100) / 100;
    const netRevenue = Math.round((revenue - discounts + tips) * 100) / 100;
    rows.push({
      _id: `sales-${i + 1}`,
      date: date.toISOString(),
      branch: BRANCHES[Math.floor(Math.random() * BRANCHES.length)],
      orderCount,
      revenue,
      discounts,
      tips,
      netRevenue,
      aov,
      paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
      orderType: ORDER_TYPES[Math.floor(Math.random() * ORDER_TYPES.length)],
    });
  }
  return rows.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
};

const MOCK_SALES_DATA: SalesRow[] = generateMockSalesData();

const getPaymentBadge = (method: SalesRow['paymentMethod']) => {
  switch (method) {
    case 'cash':
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">Cash</Badge>;
    case 'card':
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">Card</Badge>;
    case 'transfer':
      return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold">Transfer</Badge>;
    case 'mobile':
      return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">Mobile</Badge>;
    default:
      return <Badge variant="outline">{method}</Badge>;
  }
};

const getOrderTypeBadge = (type: SalesRow['orderType']) => {
  switch (type) {
    case 'dine_in':
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">Dine-In</Badge>;
    case 'takeaway':
      return <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] font-bold">Takeaway</Badge>;
    case 'delivery':
      return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold">Delivery</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const SalesReportPage: React.FC = () => {
  const navigate = useNavigate();
  const salesData = MOCK_SALES_DATA;

  const stats = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = salesData.reduce((sum, r) => sum + r.orderCount, 0);
    const totalNet = salesData.reduce((sum, r) => sum + r.netRevenue, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, totalNet, avgOrderValue };
  }, [salesData]);

  const todayMatcher = (r: SalesRow) => isToday(parseISO(r.date));
  const weekMatcher = (r: SalesRow) => isAfter(parseISO(r.date), startOfWeek(new Date(), { weekStartsOn: 1 }));
  const monthMatcher = (r: SalesRow) => isAfter(parseISO(r.date), startOfMonth(new Date()));
  const dineInMatcher = (r: SalesRow) => r.orderType === 'dine_in';
  const takeawayMatcher = (r: SalesRow) => r.orderType === 'takeaway';
  const deliveryMatcher = (r: SalesRow) => r.orderType === 'delivery';

  const quickFilters: QuickFilterOption<SalesRow>[] = useMemo(() => [
    { key: 'all', label: 'All Sales', count: salesData.length, icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'today', label: 'Today', count: salesData.filter(todayMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: todayMatcher },
    { key: 'this-week', label: 'This Week', count: salesData.filter(weekMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: weekMatcher },
    { key: 'this-month', label: 'This Month', count: salesData.filter(monthMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: monthMatcher },
    { key: 'dine-in', label: 'Dine-In', count: salesData.filter(dineInMatcher).length, icon: <UtensilsCrossed className="h-3.5 w-3.5" />, matcher: dineInMatcher },
    { key: 'takeaway', label: 'Takeaway', count: salesData.filter(takeawayMatcher).length, icon: <Package className="h-3.5 w-3.5" />, matcher: takeawayMatcher },
    { key: 'delivery', label: 'Delivery', count: salesData.filter(deliveryMatcher).length, icon: <Truck className="h-3.5 w-3.5" />, matcher: deliveryMatcher },
  ], [salesData]);

  const filterFields: AdvancedFilterField[] = useMemo(() => [
    { id: 'branch', label: 'Branch', type: 'multi-select', options: BRANCHES.map((b) => ({ label: b, value: b })) },
    { id: 'paymentMethod', label: 'Payment Method', type: 'multi-select', options: PAYMENT_METHODS.map((p) => ({ label: p.charAt(0).toUpperCase() + p.slice(1), value: p })) },
    { id: 'orderType', label: 'Order Type', type: 'multi-select', options: [
      { label: 'Dine-In', value: 'dine_in' },
      { label: 'Takeaway', value: 'takeaway' },
      { label: 'Delivery', value: 'delivery' },
    ]},
    { id: 'revenue', label: 'Revenue Range', type: 'number-range', min: 0, max: 1000000, step: 100, prefix: 'ETB' },
    { id: 'date', label: 'Sale Date', type: 'date-range' },
  ], []);

  const groupByOptions: GroupByOption<SalesRow>[] = useMemo(() => [
    { id: 'orderType', label: 'By Order Type', accessor: (r) => {
      const map: Record<string, string> = { dine_in: 'Dine-In', takeaway: 'Takeaway', delivery: 'Delivery' };
      return map[r.orderType] || r.orderType || 'N/A';
    }, icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
    { id: 'paymentMethod', label: 'By Payment', accessor: (r) => r.paymentMethod?.charAt(0).toUpperCase() + r.paymentMethod?.slice(1) || 'N/A', icon: <CreditCard className="h-3.5 w-3.5" /> },
    { id: 'branch', label: 'By Branch', accessor: (r) => r.branch || 'N/A', icon: <Banknote className="h-3.5 w-3.5" /> },
  ], []);

  const sortOptions: SortOption<SalesRow>[] = useMemo(() => [
    { id: 'dateDesc', label: 'Date (Newest)', field: 'date', direction: 'desc' },
    { id: 'dateAsc', label: 'Date (Oldest)', field: 'date', direction: 'asc' },
    { id: 'revenueDesc', label: 'Revenue (High to Low)', field: 'revenue', direction: 'desc' },
    { id: 'revenueAsc', label: 'Revenue (Low to High)', field: 'revenue', direction: 'asc' },
    { id: 'ordersDesc', label: 'Order Count (High to Low)', field: 'orderCount', direction: 'desc' },
    { id: 'netDesc', label: 'Net Revenue (High to Low)', field: 'netRevenue', direction: 'desc' },
    { id: 'aovDesc', label: 'AOV (High to Low)', field: 'aov', direction: 'desc' },
  ], []);

  const kanbanColumns: KanbanColumnConfig<SalesRow>[] = useMemo(() => [
    {
      id: 'dine_in',
      title: 'Dine-In',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      matcher: (r) => r.orderType === 'dine_in',
    },
    {
      id: 'takeaway',
      title: 'Takeaway',
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      icon: <Package className="h-4 w-4" />,
      matcher: (r) => r.orderType === 'takeaway',
    },
    {
      id: 'delivery',
      title: 'Delivery',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <Truck className="h-4 w-4" />,
      matcher: (r) => r.orderType === 'delivery',
    },
  ], []);

  const initialPresets: SavedPreset[] = useMemo(() => [
    {
      id: 'preset-monthly-sales',
      name: 'Monthly Overview',
      isSystem: true,
      filters: { quickFilter: 'this-month', groupBy: 'orderType', viewMode: 'table', sortField: 'date', sortDirection: 'desc' },
    },
    {
      id: 'preset-delivery-focus',
      name: 'Delivery Focus',
      isSystem: true,
      filters: { quickFilter: 'delivery', sortField: 'revenue', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-top-branches',
      name: 'Top Branches',
      isSystem: true,
      filters: { groupBy: 'branch', sortField: 'netRevenue', sortDirection: 'desc', viewMode: 'kanban' },
    },
  ], []);

  const bulkActions: BulkAction<SalesRow>[] = useMemo(() => [
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Date,Branch,Order Count,Revenue,Discounts,Tips,Net Revenue,AOV,Payment Method,Order Type';
        const rows = selectedRows.map((r) =>
          [
            format(parseISO(r.date), 'yyyy-MM-dd'),
            r.branch || 'N/A',
            r.orderCount,
            r.revenue.toFixed(2),
            r.discounts.toFixed(2),
            r.tips.toFixed(2),
            r.netRevenue.toFixed(2),
            r.aov.toFixed(2),
            r.paymentMethod || 'N/A',
            r.orderType || 'N/A',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SalesReport_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Sales report exported', { description: `${selectedRows.length} rows exported to CSV` });
        clearSelection();
      },
    },
    {
      id: 'export-accounting',
      label: 'Export for Accounting',
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Date,Branch,Revenue,Discounts,Tips,Net Revenue';
        const rows = selectedRows.map((r) =>
          [
            format(parseISO(r.date), 'yyyy-MM-dd'),
            r.branch || 'N/A',
            r.revenue.toFixed(2),
            r.discounts.toFixed(2),
            r.tips.toFixed(2),
            r.netRevenue.toFixed(2),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Accounting_Sales_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Accounting export downloaded', { description: `${selectedRows.length} rows exported` });
        clearSelection();
      },
    },
  ], []);

  const columns: ColumnDef<SalesRow>[] = useMemo(() => [
    {
      id: 'date',
      header: 'Date',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white">{format(parseISO(r.date), 'MMM d, yyyy')}</p>
            <p className="text-[10px] text-slate-500">{r.branch || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'orderCount',
      header: 'Order Count',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{r.orderCount}</span>
        </div>
      ),
    },
    {
      id: 'revenue',
      header: 'Revenue',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ETB {r.revenue.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'discounts',
      header: 'Discounts',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
          -ETB {r.discounts.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'tips',
      header: 'Tips',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          +ETB {r.tips.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'netRevenue',
      header: 'Net Revenue',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {r.netRevenue.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'aov',
      header: 'AOV',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            ETB {r.aov.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      id: 'paymentMethod',
      header: 'Payment Method',
      sortable: true,
      cell: (r) => getPaymentBadge(r.paymentMethod),
    },
    {
      id: 'orderType',
      header: 'Order Type',
      sortable: true,
      cell: (r) => getOrderTypeBadge(r.orderType),
    },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Sales Report"
        subtitle="Track daily revenue, order patterns, and payment performance across branches"
        breadcrumbText="Reports"
        breadcrumbAction={() => navigate('/reports')}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Revenue"
            value={`ETB ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme="emerald"
            subtitle="Gross sales before adjustments"
          />
          <DataCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            icon={<ShoppingCart className="h-5 w-5" />}
            theme="primary"
            subtitle="All orders across all channels"
          />
          <DataCard
            title="Avg Order Value"
            value={`ETB ${stats.avgOrderValue.toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            theme="indigo"
            subtitle="Average spent per transaction"
          />
          <DataCard
            title="Net Revenue"
            value={`ETB ${stats.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Wallet className="h-5 w-5" />}
            theme="purple"
            subtitle="Revenue - Discounts + Tips"
          />
        </div>

        <DataViewSystem<SalesRow>
          data={salesData}
          rowKey="_id"
          entityName="Sales Records"
          columns={columns}
          isLoading={false}
          loadingRowsCount={8}
          emptyIcon={<BarChart3 className="h-8 w-8 text-slate-400" />}
          emptyTitle="No sales records found"
          emptyDescription="Adjust your filters or check back later for new sales data."
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search branch, payment method, order type..."
          searchFields={['branch', 'paymentMethod', 'orderType']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="date"
          defaultSortDirection="desc"
          presetStorageKey="salesReport"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="orderType"
          exportFileName="SalesReport"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default SalesReportPage;
