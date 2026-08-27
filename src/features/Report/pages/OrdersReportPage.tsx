import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@/api/Queries/orderQuery';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  UtensilsCrossed,
  Package,
  Truck,
  CreditCard,
  Wallet,
  Calendar,
  Hash,
  User,
  Download,
  FileSpreadsheet,
  ClipboardList,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

const CUSTOMER_NAMES = [
  'Abebe Kebede', 'Sara Ahmed', 'Martha Bekele', 'Daniel Tadesse',
  'Helen Haile', 'Yared Tesfaye', 'Mikayla Solomon', 'Tigist Girma',
  'Bekele Mengistu', 'Selamawit Dereje',
];

const TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'BAR', 'OUT'];

const MENU_ITEMS = ['Coffee', 'Cappuccino', 'Pasta', 'Pizza Margherita', 'Chicken Salad', 'Beef Burger', 'Club Sandwich', 'Latte'];

const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const now = new Date();
  const statuses: Order['status'][] = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'canceled'];
  const paymentStatuses: Order['paymentStatus'][] = ['paid', 'unpaid'];
  const orderTypes: Order['orderType'][] = ['dine_in', 'takeaway', 'delivery'];

  for (let i = 0; i < 20; i++) {
    const placedAt = new Date(now);
    placedAt.setDate(placedAt.getDate() - Math.floor(Math.random() * 14));
    placedAt.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60));

    const itemCount = Math.floor(Math.random() * 6) + 1;
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const qty = Math.floor(Math.random() * 3) + 1;
      const price = Math.round((Math.random() * 300 + 50) * 100) / 100;
      items.push({
        menuItem: `menu-${j}`,
        name: MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)],
        quantity: qty,
        unitPrice: price,
        totalPrice: Math.round(qty * price * 100) / 100,
      });
    }
    const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
    const totalAmount = Math.round((subtotal + subtotal * 0.15) * 100) / 100;

    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    orders.push({
      _id: `order-${String(i + 1).padStart(4, '0')}`,
      orderNumber: `ORD-${String(2024000 + i + 1)}`,
      merchant: 'merchant-1',
      customer: `cust-${i}`,
      customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
      customerPhone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
      table: orderType === 'dine_in' ? `table-${i}` : undefined,
      tableNumber: orderType === 'dine_in' ? TABLES[Math.floor(Math.random() * TABLES.length)] : undefined,
      orderType,
      items,
      subtotal,
      totalAmount,
      status,
      paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      placedAt: placedAt.toISOString(),
      placedBy: { firstName: 'Staff', lastName: `${i + 1}` },
      itemCount,
    });
  }
  return orders.sort((a, b) => parseISO(b.placedAt).getTime() - parseISO(a.placedAt).getTime());
};

const MOCK_ORDERS: Order[] = generateMockOrders();

const getStatusBadge = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">Pending</Badge>;
    case 'accepted':
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">Accepted</Badge>;
    case 'preparing':
      return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold">Preparing</Badge>;
    case 'ready':
      return <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] font-bold">Ready</Badge>;
    case 'served':
      return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">Served</Badge>;
    case 'completed':
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">Completed</Badge>;
    case 'canceled':
      return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentBadge = (status: Order['paymentStatus']) => {
  if (status === 'paid') {
    return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>;
  }
  return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1"><Clock className="h-3 w-3" />Unpaid</Badge>;
};

const getOrderTypeBadge = (type: Order['orderType']) => {
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

const OrdersReportPage: React.FC = () => {
  const navigate = useNavigate();
  const orders: Order[] = MOCK_ORDERS || [];

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const cancelled = orders.filter((o) => o.status === 'canceled').length;
    const revenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { total, completed, cancelled, revenue };
  }, [orders]);

  const completedMatcher = (o: Order) => o.status === 'completed';
  const canceledMatcher = (o: Order) => o.status === 'canceled';
  const pendingMatcher = (o: Order) => o.status === 'pending';
  const dineInMatcher = (o: Order) => o.orderType === 'dine_in';
  const takeawayMatcher = (o: Order) => o.orderType === 'takeaway';
  const deliveryMatcher = (o: Order) => o.orderType === 'delivery';
  const paidMatcher = (o: Order) => o.paymentStatus === 'paid';
  const unpaidMatcher = (o: Order) => o.paymentStatus === 'unpaid';

  const quickFilters: QuickFilterOption<Order>[] = useMemo(() => [
    { key: 'all', label: 'All Orders', count: orders.length, icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { key: 'completed', label: 'Completed', count: orders.filter(completedMatcher).length, icon: <CheckCircle2 className="h-3.5 w-3.5" />, matcher: completedMatcher },
    { key: 'canceled', label: 'Canceled', count: orders.filter(canceledMatcher).length, icon: <XCircle className="h-3.5 w-3.5" />, matcher: canceledMatcher },
    { key: 'pending', label: 'Pending', count: orders.filter(pendingMatcher).length, icon: <Clock className="h-3.5 w-3.5" />, matcher: pendingMatcher },
    { key: 'dine-in', label: 'Dine-In', count: orders.filter(dineInMatcher).length, icon: <UtensilsCrossed className="h-3.5 w-3.5" />, matcher: dineInMatcher },
    { key: 'takeaway', label: 'Takeaway', count: orders.filter(takeawayMatcher).length, icon: <Package className="h-3.5 w-3.5" />, matcher: takeawayMatcher },
    { key: 'delivery', label: 'Delivery', count: orders.filter(deliveryMatcher).length, icon: <Truck className="h-3.5 w-3.5" />, matcher: deliveryMatcher },
    { key: 'paid', label: 'Paid', count: orders.filter(paidMatcher).length, icon: <CreditCard className="h-3.5 w-3.5" />, matcher: paidMatcher },
    { key: 'unpaid', label: 'Unpaid', count: orders.filter(unpaidMatcher).length, icon: <Wallet className="h-3.5 w-3.5" />, color: 'amber', matcher: unpaidMatcher },
  ], [orders]);

  const filterFields: AdvancedFilterField[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'multi-select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Ready', value: 'ready' },
        { label: 'Served', value: 'served' },
        { label: 'Completed', value: 'completed' },
        { label: 'Canceled', value: 'canceled' },
      ],
    },
    {
      id: 'orderType',
      label: 'Order Type',
      type: 'multi-select',
      options: [
        { label: 'Dine-In', value: 'dine_in' },
        { label: 'Takeaway', value: 'takeaway' },
        { label: 'Delivery', value: 'delivery' },
      ],
    },
    {
      id: 'paymentStatus',
      label: 'Payment',
      type: 'multi-select',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
      ],
    },
    {
      id: 'totalAmount',
      label: 'Total Amount',
      type: 'number-range',
      min: 0,
      max: 100000,
      step: 50,
      prefix: 'ETB',
    },
    {
      id: 'placedAt',
      label: 'Placed At',
      type: 'date-range',
    },
  ], []);

  const groupByOptions: GroupByOption<Order>[] = useMemo(() => [
    {
      id: 'status',
      label: 'By Status',
      accessor: (o) => {
        const map: Record<string, string> = { pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', served: 'Served', completed: 'Completed', canceled: 'Canceled' };
        return map[o.status] || o.status || 'N/A';
      },
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    {
      id: 'orderType',
      label: 'By Order Type',
      accessor: (o) => {
        const map: Record<string, string> = { dine_in: 'Dine-In', takeaway: 'Takeaway', delivery: 'Delivery' };
        return map[o.orderType] || o.orderType || 'N/A';
      },
      icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    },
    {
      id: 'paymentStatus',
      label: 'By Payment',
      accessor: (o) => {
        const map: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid' };
        return map[o.paymentStatus] || o.paymentStatus || 'N/A';
      },
      icon: <CreditCard className="h-3.5 w-3.5" />,
    },
  ], []);

  const sortOptions: SortOption<Order>[] = useMemo(() => [
    { id: 'placedDesc', label: 'Placed (Newest)', field: 'placedAt', direction: 'desc' },
    { id: 'placedAsc', label: 'Placed (Oldest)', field: 'placedAt', direction: 'asc' },
    { id: 'totalDesc', label: 'Total (High to Low)', field: 'totalAmount', direction: 'desc' },
    { id: 'totalAsc', label: 'Total (Low to High)', field: 'totalAmount', direction: 'asc' },
    { id: 'orderNumber', label: 'Order #', field: 'orderNumber' },
  ], []);

  const kanbanColumns: KanbanColumnConfig<Order>[] = useMemo(() => [
    {
      id: 'pending',
      title: 'Pending',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Clock className="h-4 w-4" />,
      matcher: (o) => o.status === 'pending',
    },
    {
      id: 'accepted',
      title: 'Accepted',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      matcher: (o) => o.status === 'accepted',
    },
    {
      id: 'preparing',
      title: 'Preparing',
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      matcher: (o) => o.status === 'preparing',
    },
    {
      id: 'ready',
      title: 'Ready',
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      icon: <Package className="h-4 w-4" />,
      matcher: (o) => o.status === 'ready',
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      matcher: (o) => o.status === 'served' || o.status === 'completed',
    },
    {
      id: 'canceled',
      title: 'Canceled',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <XCircle className="h-4 w-4" />,
      matcher: (o) => o.status === 'canceled',
    },
  ], []);

  const initialPresets: SavedPreset[] = useMemo(() => [
    {
      id: 'preset-completed-orders',
      name: 'Completed This Period',
      isSystem: true,
      filters: { quickFilter: 'completed', sortField: 'placedAt', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-unpaid-watch',
      name: 'Unpaid Watchlist',
      isSystem: true,
      filters: { quickFilter: 'unpaid', sortField: 'totalAmount', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-kanban-status',
      name: 'Status Kanban',
      isSystem: true,
      filters: { groupBy: 'status', viewMode: 'kanban' },
    },
  ], []);

  const bulkActions: BulkAction<Order>[] = useMemo(() => [
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Order #,Customer,Type,Table,Items,Status,Payment,Total,Placed At';
        const rows = selectedRows.map((o) =>
          [
            o.orderNumber || 'N/A',
            o.customerName || 'N/A',
            o.orderType || 'N/A',
            o.tableNumber || '-',
            o.itemCount || o.items?.length || 0,
            o.status || 'N/A',
            o.paymentStatus || 'N/A',
            (o.totalAmount || 0).toFixed(2),
            o.placedAt ? format(parseISO(o.placedAt), 'yyyy-MM-dd HH:mm') : 'N/A',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `OrdersReport_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Orders exported', { description: `${selectedRows.length} orders exported to CSV` });
        clearSelection();
      },
    },
    {
      id: 'export-summary',
      label: 'Export Summary',
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Order #,Customer,Total,Payment,Status,Date';
        const rows = selectedRows.map((o) =>
          [
            o.orderNumber || 'N/A',
            o.customerName || 'N/A',
            (o.totalAmount || 0).toFixed(2),
            o.paymentStatus || 'N/A',
            o.status || 'N/A',
            o.placedAt ? format(parseISO(o.placedAt), 'yyyy-MM-dd') : 'N/A',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Orders_Summary_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Summary exported', { description: `${selectedRows.length} orders exported` });
        clearSelection();
      },
    },
  ], []);

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      id: 'orderNumber',
      header: 'Order #',
      sortable: true,
      cell: (o) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
            <Hash className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white font-mono">{o.orderNumber || 'N/A'}</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {o.placedAt ? format(parseISO(o.placedAt), 'MMM d') : 'N/A'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (o) => (
        <div>
          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <User className="h-3 w-3 text-slate-400" />
            {o.customerName || 'N/A'}
          </p>
          {o.customerPhone && (
            <p className="text-[10px] text-slate-500 font-mono">{o.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      sortable: true,
      cell: (o) => getOrderTypeBadge(o.orderType),
    },
    {
      id: 'table',
      header: 'Table',
      sortable: true,
      cell: (o) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {o.tableNumber || '-'}
        </span>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: (o) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {o.itemCount || o.items?.length || 0} item{(o.itemCount || o.items?.length || 0) !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (o) => getStatusBadge(o.status),
    },
    {
      id: 'payment',
      header: 'Payment',
      sortable: true,
      cell: (o) => getPaymentBadge(o.paymentStatus),
    },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      cell: (o) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {(o.totalAmount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'placedAt',
      header: 'Placed At',
      sortable: true,
      cell: (o) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          <p className="font-medium">{o.placedAt ? format(parseISO(o.placedAt), 'MMM d, yyyy') : 'N/A'}</p>
          <p className="text-[10px] text-slate-500">{o.placedAt ? format(parseISO(o.placedAt), 'HH:mm') : ''}</p>
        </div>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Orders Report"
        subtitle="Comprehensive order history with status, payment, and fulfillment tracking"
        breadcrumbText="Reports"
        breadcrumbAction={() => navigate('/reports')}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Orders"
            value={stats.total.toLocaleString()}
            icon={<ShoppingBag className="h-5 w-5" />}
            theme="primary"
            subtitle="All orders in the period"
          />
          <DataCard
            title="Completed"
            value={stats.completed.toLocaleString()}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Successfully fulfilled"
          />
          <DataCard
            title="Cancelled"
            value={stats.cancelled.toLocaleString()}
            icon={<XCircle className="h-5 w-5" />}
            theme="rose"
            subtitle="Voided or rejected orders"
          />
          <DataCard
            title="Revenue"
            value={`ETB ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Wallet className="h-5 w-5" />}
            theme="purple"
            subtitle="From completed orders only"
          />
        </div>

        <DataViewSystem<Order>
          data={orders}
          rowKey="_id"
          entityName="Orders"
          columns={columns}
          isLoading={false}
          loadingRowsCount={8}
          emptyIcon={<ClipboardList className="h-8 w-8 text-slate-400" />}
          emptyTitle="No orders found"
          emptyDescription="Try adjusting your filters to see more results."
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search order #, customer name, phone..."
          searchFields={['orderNumber', 'customerName', 'customerPhone']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="placedAt"
          defaultSortDirection="desc"
          presetStorageKey="ordersReport"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="status"
          exportFileName="OrdersReport"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default OrdersReportPage;
