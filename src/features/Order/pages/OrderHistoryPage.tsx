// src/features/Order/pages/OrderHistoryPage.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCompletedOrdersQuery,
  type Order,
} from '@/api/Queries/orderQuery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  UtensilsCrossed,
  Truck,
  Package,
  User,
  FileText,
  Download,
} from 'lucide-react';
import {
  PageHeader,
  DataCard,
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type BulkAction,
  type KanbanColumnConfig,
} from '@/components/Common';
import { toast } from 'sonner';

const OrderHistoryPage = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useCompletedOrdersQuery();
  const orders: Order[] = data?.orders || [];
  const summary = data?.summary;

  // Computed counts and metrics
  const completedCount = useMemo(
    () => orders.filter((o) => o.status === 'completed').length,
    [orders]
  );
  const canceledCount = useMemo(
    () => orders.filter((o) => o.status === 'canceled').length,
    [orders]
  );
  const dineInCount = useMemo(
    () => orders.filter((o) => o.orderType === 'dine_in').length,
    [orders]
  );
  const deliveryCount = useMemo(
    () => orders.filter((o) => o.orderType === 'delivery').length,
    [orders]
  );
  const takeawayCount = useMemo(
    () => orders.filter((o) => o.orderType === 'takeaway').length,
    [orders]
  );
  const totalRevenue = useMemo(
    () =>
      summary?.totalRevenue ??
      orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [orders, summary]
  );

  const getOrderTypeIcon = (type: Order['orderType']) => {
    switch (type) {
      case 'dine_in':
        return <UtensilsCrossed className="h-3.5 w-3.5" />;
      case 'delivery':
        return <Truck className="h-3.5 w-3.5" />;
      case 'takeaway':
      default:
        return <Package className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-bold text-[10px]">
            <XCircle className="h-3 w-3 mr-1" />
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] capitalize">
            {status}
          </Badge>
        );
    }
  };

  // Quick Filters Configuration
  const quickFilters: QuickFilterOption[] = [
    { 
      key: 'all', 
      label: 'All Orders', 
      count: orders.length,
      icon: <ShoppingBag className="h-3.5 w-3.5" />
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      count: completedCount, 
      icon: <CheckCircle2 className="h-3.5 w-3.5" /> 
    },
    { 
      key: 'canceled', 
      label: 'Canceled', 
      count: canceledCount, 
      icon: <XCircle className="h-3.5 w-3.5" /> 
    },
    { 
      key: 'dine_in', 
      label: 'Dine-In', 
      count: dineInCount, 
      icon: <UtensilsCrossed className="h-3.5 w-3.5" /> 
    },
    { 
      key: 'delivery', 
      label: 'Delivery', 
      count: deliveryCount, 
      icon: <Truck className="h-3.5 w-3.5" /> 
    },
    { 
      key: 'takeaway', 
      label: 'Takeaway', 
      count: takeawayCount, 
      icon: <Package className="h-3.5 w-3.5" /> 
    },
  ];

  // Advanced Filters Configuration
  const filterFields: AdvancedFilterField[] = [
    {
      id: 'orderType',
      label: 'Order Type',
      type: 'multi-select',
      options: [
        { label: 'Dine-In', value: 'dine_in' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Takeaway', value: 'takeaway' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'status-pills',
      options: [
        { label: 'Completed', value: 'completed', color: 'emerald' },
        { label: 'Canceled', value: 'canceled', color: 'rose' },
      ],
    },
    {
      id: 'totalAmount',
      label: 'Order Amount',
      type: 'number-range',
      min: 0,
      max: 10000,
      step: 50,
      prefix: 'ETB',
      description: 'Filter by total order amount range',
    },
    {
      id: 'itemCount',
      label: 'Number of Items',
      type: 'number-range',
      min: 1,
      max: 50,
      step: 1,
      description: 'Filter by number of items in order',
    },
    {
      id: 'dateRange',
      label: 'Order Date',
      type: 'date-range',
    },
  ];

  // Bulk Actions Configuration
  const bulkActions: BulkAction<Order>[] = [
    {
      id: 'export-selected',
      label: 'Export Selected',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedOrders, clearSelection) => {
        const csv = selectedOrders.map(o => 
          `${o.orderNumber},${o.customerName},${o.totalAmount},${o.status}`
        ).join('\n');
        const blob = new Blob([`Order #,Customer,Amount,Status\n${csv}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${selectedOrders.length} orders`);
        clearSelection();
      },
    },
    {
      id: 'print-receipts',
      label: 'Print Receipts',
      icon: <FileText className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedOrders, clearSelection) => {
        toast.info(`Preparing ${selectedOrders.length} receipts for printing...`);
        // Add your print logic here
        clearSelection();
      },
    },
  ];

  // Kanban Columns Configuration
  const kanbanColumns: KanbanColumnConfig<Order>[] = [
    {
      id: 'completed',
      title: 'Completed',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      matcher: (order) => order.status === 'completed',
    },
    {
      id: 'canceled',
      title: 'Canceled',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <XCircle className="h-4 w-4" />,
      matcher: (order) => order.status === 'canceled',
    },
  ];

  // Table Columns Definition
  const columns: ColumnDef<Order>[] = [
    {
      id: 'orderNumber',
      header: 'Order #',
      sortable: true,
      accessorKey: 'orderNumber',
      cell: (order) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
            #{order.orderNumber?.slice(-4) || '—'}
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white">
              {order.orderNumber}
            </p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {order.placedAt ? new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'customerName',
      header: 'Customer / Table',
      sortable: true,
      cell: (order) => (
        <div>
          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {order.customerName || 'Walk-in Customer'}
          </p>
          {order.tableNumber && (
            <p className="text-[10px] text-slate-500">Table #{order.tableNumber}</p>
          )}
        </div>
      ),
    },
    {
      id: 'orderType',
      header: 'Fulfillment',
      sortable: true,
      cell: (order) => (
        <Badge
          variant="outline"
          className="gap-1 capitalize text-xs font-medium bg-slate-50 dark:bg-slate-800/60"
        >
          {getOrderTypeIcon(order.orderType)}
          {order.orderType?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: (order) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {order.items?.length || order.itemCount || 0} item(s)
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Total Paid',
      sortable: true,
      cell: (order) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {(order.totalAmount || order.subtotal || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Order Status',
      sortable: true,
      cell: (order) => getStatusBadge(order.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (order) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 rounded-xl text-slate-600 hover:text-slate-900"
            onClick={() => navigate(`/orders/${order._id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Order History"
        subtitle="Review past completed transactions, fulfillment receipts, and archived records"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Standard DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DataCard
            title="Total Historical Orders"
            value={isLoading ? '...' : orders.length}
            icon={<ShoppingBag className="h-5 w-5" />}
            theme="primary"
            subtitle="Fulfilled orders in record"
            isLoading={isLoading}
          />

          <DataCard
            title="Total Settled Revenue"
            value={isLoading ? '...' : `ETB ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Completed transaction earnings"
            isLoading={isLoading}
          />

          <DataCard
            title="Canceled Orders"
            value={isLoading ? '...' : canceledCount}
            icon={<XCircle className="h-5 w-5" />}
            theme="rose"
            subtitle="Voided or abandoned tickets"
            isLoading={isLoading}
          />
        </div>

        {/* Advanced DataViewSystem */}
        <DataViewSystem<Order>
          // Data & Identity
          data={orders}
          rowKey="_id"
          entityName="orders"
          
          // Table Configuration
          columns={columns}
          
          // Loading & Empty States
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<ShoppingBag className="h-8 w-8" />}
          emptyTitle="No order records found"
          emptyDescription="Completed customer orders will appear here once finalized."
          
          // View Modes
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          
          // Search Configuration
          searchable={true}
          searchPlaceholder="Search order #, customer, or table..."
          searchFields={['orderNumber', 'customerName', 'tableNumber']}
          
          // Quick Filters
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          
          // Advanced Filters
          filterFields={filterFields}
          
          // Grouping Options
          groupByOptions={[
            { 
              id: 'orderType', 
              label: 'By Order Type', 
              accessor: 'orderType',
              icon: <Package className="h-3.5 w-3.5" />
            },
            { 
              id: 'status', 
              label: 'By Status', 
              accessor: 'status',
              icon: <CheckCircle2 className="h-3.5 w-3.5" />
            },
          ]}
          
          // Sorting Options
          sortOptions={[
            { id: 'orderNumber', label: 'Order Number', field: 'orderNumber' },
            { id: 'date', label: 'Date (Newest)', field: 'placedAt', direction: 'desc' },
            { id: 'amount', label: 'Amount (High to Low)', field: 'totalAmount', direction: 'desc' },
            { id: 'customer', label: 'Customer Name', field: 'customerName' },
          ]}
          defaultSortField="placedAt"
          defaultSortDirection="desc"
          
          // Presets
          presetStorageKey="orderHistory"
          initialPresets={[
            {
              id: 'preset-today',
              name: 'Today\'s Orders',
              isSystem: true,
              filters: {
                quickFilter: 'all',
                advanced: { 
                  dateRange: { 
                    from: new Date().toISOString().split('T')[0], 
                    to: new Date().toISOString().split('T')[0] 
                  } 
                },
              },
            },
            {
              id: 'preset-high-value',
              name: 'High Value Orders',
              isSystem: true,
              filters: {
                quickFilter: 'completed',
                advanced: { totalAmount: { min: 500 } },
                sortField: 'totalAmount',
                sortDirection: 'desc',
              },
            },
          ]}
          
          // Selection & Bulk Actions
          selectable={true}
          bulkActions={bulkActions}
          
          // Item Click Handler
          onItemClick={(order) => navigate(`/orders/${order._id}`)}
          
          // Custom Card Rendering for Grid View
          renderCustomCard={(order, isSelected, onSelect) => (
            <div 
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </div>
              
              {/* Order Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
                  #{order.orderNumber?.slice(-4) || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {order.placedAt ? new Date(order.placedAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
              
              {/* Order Details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {order.customerName || 'Walk-in'}
                  </span>
                  {order.tableNumber && (
                    <span className="text-slate-500">Table #{order.tableNumber}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1 text-xs">
                    {getOrderTypeIcon(order.orderType)}
                    {order.orderType?.replace('_', ' ')}
                  </Badge>
                  {getStatusBadge(order.status)}
                </div>
              </div>
              
              {/* Order Total */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {order.items?.length || order.itemCount || 0} item(s)
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  ETB {(order.totalAmount || order.subtotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          
          // Kanban Configuration
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="status"
          
          // Export Configuration
          exportFileName="order_history"
          
          // Pagination
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default OrderHistoryPage;
