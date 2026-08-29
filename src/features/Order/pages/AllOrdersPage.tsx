import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { type RootState } from '@/app/store';
import {
  useCurrentBranchOrAllDbOrdersQuery,
  useUpdateOrderStatusMutation,
} from '@/api/Queries/orderQuery';
import { useSocket } from '@/lib/Socket';
import { Button } from '@/components/ui/button';
import OrderFilterBar, { type OrderFilterState } from '../Components/OrderFilterBar';
import OrderTableView from '../Components/OrderTableView';
import OrderKanbanBoard from '../Components/OrderKanbanBoard';
import OrderCard from '../Components/OrderCard';
import RightSideModal from '@/components/ui/RightSideModal';
import OrderDetailsContent from '../Components/OrderDetailsPanel';
import PayOrderModal from '../Components/PayOrderModal';
import CancelOrderModal from '../Components/CancelOrderModal';
import OrdersEmptyState from '../Components/OrdersEmptyState';
import { filterAndSortOrders } from '../lib/orderFilterUtils';
import {
  Clock,
  Plus,
  Loader2,
  TrendingUp,
  Database,
  CheckCircle2,
  XCircle,
  Activity,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

export const AllOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // Filters & View State
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    orderType: 'all',
    status: 'all',
    paymentStatus: 'all',
    urgency: 'all',
    sortBy: 'newest',
    viewMode: 'table',
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<any | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<any | null>(null);
  const [, setAddingItemsOrder] = useState<any | null>(null);

  // API Queries (fetches all database orders)
  const { data: response, isLoading } =
    useCurrentBranchOrAllDbOrdersQuery(currentBranchId);
  const { mutate: updateStatus } = useUpdateOrderStatusMutation();

  // Sync API response to state
  useEffect(() => {
    if (response?.orders) {
      setOrders(response.orders as any);
    }
  }, [response]);

  // Real-Time Socket Listeners
  useEffect(() => {
    if (!socket) return;

    if (currentBranchId) {
      socket.emit('setup:session', { branchId: currentBranchId });
      socket.emit('join:branch', { branchId: currentBranchId });
    }

    const handleOrderEvent = (incoming: any) => {
      const orderData = incoming.order || incoming;
      const orderId =
        orderData._id || orderData.orderId || orderData.id || incoming.orderId;
      const branchId =
        orderData.branch?._id || orderData.branch || incoming.branchId;
      if (currentBranchId && branchId && branchId !== currentBranchId) return;

      const newStatus = incoming.newStatus || orderData.status;

      setOrders((prev) => {
        const existingIndex = prev.findIndex(
          (o) => (o._id || o.id) === orderId
        );
        if (existingIndex !== -1) {
          return prev.map((order, idx) =>
            idx === existingIndex
              ? { ...order, ...orderData, status: newStatus || order.status }
              : order
          );
        }
        return [{ ...orderData, isNew: true }, ...prev];
      });

      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    socket.on('order:create', handleOrderEvent);
    socket.on('order:created', handleOrderEvent);
    socket.on('order:new', handleOrderEvent);
    socket.on('order-updated', handleOrderEvent);
    socket.on('order:status-updated', handleOrderEvent);
    socket.on('order:status-changed', handleOrderEvent);

    return () => {
      socket.off('order:create', handleOrderEvent);
      socket.off('order:created', handleOrderEvent);
      socket.off('order:new', handleOrderEvent);
      socket.off('order-updated', handleOrderEvent);
      socket.off('order:status-updated', handleOrderEvent);
      socket.off('order:status-changed', handleOrderEvent);
    };
  }, [socket, currentBranchId, queryClient]);

  // State Action Handlers
  const handleAcceptOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'accepted' }),
    [updateStatus]
  );
  const handlePrepareOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'preparing' }),
    [updateStatus]
  );
  const handleReadyOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'ready' }),
    [updateStatus]
  );
  const handleServeOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'served' }),
    [updateStatus]
  );
  const handleDispatchOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'out_for_delivery' }),
    [updateStatus]
  );
  const handleDeliverOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'delivered' }),
    [updateStatus]
  );
  const handleCompleteOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'completed' }),
    [updateStatus]
  );

  // Live KPI Summary Metrics across ALL orders in DB
  const stats = useMemo(() => {
    const active = orders.filter(
      (o) =>
        o.status !== 'canceled' &&
        o.status !== 'cancelled' &&
        o.status !== 'completed'
    );
    const completed = orders.filter((o) => o.status === 'completed');
    const canceled = orders.filter(
      (o) => o.status === 'canceled' || o.status === 'cancelled'
    );
    const totalVolume = orders
      .filter((o) => o.status !== 'canceled' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrders: orders.length,
      totalActive: active.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      kitchen: orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length,
      ready: orders.filter((o) => o.status === 'ready').length,
      served: orders.filter((o) => o.status === 'served').length,
      dispatched: orders.filter((o) => ['out_for_delivery', 'delivered'].includes(o.status)).length,
      completed: completed.length,
      canceled: canceled.length,
      totalVolume,
    };
  }, [orders]);

  const statusCounts = useMemo(
    () => ({
      all: orders.length,
      pending: stats.pending,
      accepted: orders.filter((o) => o.status === 'accepted').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: stats.ready,
      served: stats.served,
      out_for_delivery: stats.dispatched,
      completed: stats.completed,
      canceled: stats.canceled,
    }),
    [orders, stats]
  );

  const ALL_STATUS_OPTIONS = useMemo(
    () => [
      { key: 'all', label: 'All Orders' },
      { key: 'pending', label: 'Pending' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'preparing', label: 'Cooking' },
      { key: 'ready', label: 'Ready' },
      { key: 'served', label: 'Served' },
      { key: 'out_for_delivery', label: 'Dispatched' },
      { key: 'completed', label: 'Completed' },
      { key: 'canceled', label: 'Canceled' },
    ],
    []
  );

  // Filter & Sort Pipeline using unified filter engine
  const filteredOrders = useMemo(() => {
    return filterAndSortOrders(orders, filters);
  }, [orders, filters]);

  const handleFilterChange = (updated: Partial<OrderFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      orderType: 'all',
      status: 'all',
      paymentStatus: 'all',
      urgency: 'all',
      sortBy: 'newest',
      viewMode: filters.viewMode,
      advancedFilters: {},
    });
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders available to export');
      return;
    }

    const headers = [
      'Order #',
      'Date & Time',
      'Customer',
      'Phone',
      'Type',
      'Status',
      'Payment Status',
      'Payment Method',
      'Items Count',
      'Total Amount (ETB)',
    ];

    const rows = filteredOrders.map((ord) => [
      `"${ord.orderNumber || ''}"`,
      `"${new Date(ord.placedAt || ord.createdAt).toLocaleString()}"`,
      `"${ord.customerName || 'Walk-in'}"`,
      `"${ord.customerPhone || ''}"`,
      `"${ord.orderType || 'dine_in'}"`,
      `"${ord.status || 'pending'}"`,
      `"${ord.paymentStatus || 'unpaid'}"`,
      `"${ord.paymentMethod || 'cash'}"`,
      ord.items?.length || 0,
      ord.totalAmount || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `All_Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported to CSV successfully');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header & DB KPI Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            All Orders Directory
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-mono font-bold bg-primary/10 text-primary rounded-full">
              {stats.totalOrders} in Database
            </span>
            {stats.totalActive > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 rounded-full">
                {stats.totalActive} Active
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete database of all restaurant orders across every lifecycle stage.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs h-9 gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/orders/new')}
            className="text-xs h-9 gap-1.5 font-bold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ['orders'] })
            }
            className="text-xs h-9 gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Database Orders
            </p>
            <p className="text-xl font-black text-foreground mt-0.5">
              {stats.totalOrders}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Database className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live Active Queue
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              {stats.totalActive}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Completed Orders
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {stats.completed}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Canceled Orders
            </p>
            <p className="text-xl font-black text-rose-600 mt-0.5">
              {stats.canceled}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
            <XCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs col-span-2 md:col-span-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Order Volume
            </p>
            <p className="text-xl font-black text-foreground font-mono mt-0.5">
              ETB {stats.totalVolume.toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <OrderFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        statusCounts={statusCounts}
        totalCount={orders.length}
        filteredCount={filteredOrders.length}
        statusOptions={ALL_STATUS_OPTIONS}
      />

      {/* 3. Orders Views: Table, Kanban, or Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Loading Orders Database...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <OrdersEmptyState activeTab={filters.status} />
      ) : filters.viewMode === 'kanban' ? (
        <OrderKanbanBoard
          orders={filteredOrders}
          mode="all"
          onSelectOrder={(id) => setSelectedOrderId(id)}
          onAcceptOrder={handleAcceptOrder}
          onPrepareOrder={handlePrepareOrder}
          onReadyOrder={handleReadyOrder}
          onServeOrder={handleServeOrder}
          onDispatchOrder={handleDispatchOrder}
          onDeliverOrder={handleDeliverOrder}
          onCompleteOrder={handleCompleteOrder}
          onPayOrder={(ord) => setPayingOrder(ord)}
          onCancelOrder={(ord) => setCancelingOrder(ord)}
          onAddItems={(ord) => {
            navigate('/orders/new', { state: { editOrder: ord } });
          }}
        />
      ) : filters.viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id || order.id}
              order={order}
              onClick={() => setSelectedOrderId(order._id || order.id || '')}
              onAccept={handleAcceptOrder}
              onPrepare={handlePrepareOrder}
              onReady={handleReadyOrder}
              onServe={handleServeOrder}
              onDispatch={handleDispatchOrder}
              onDeliver={handleDeliverOrder}
              onComplete={handleCompleteOrder}
              onPay={(ord) => setPayingOrder(ord)}
              onCancel={(ord) => setCancelingOrder(ord)}
              onAddItems={(ord) => {
                navigate('/orders/new', { state: { editOrder: ord } });
              }}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <OrderTableView
          orders={filteredOrders}
          onSelectOrder={(id) => setSelectedOrderId(id)}
          onAcceptOrder={handleAcceptOrder}
          onPrepareOrder={handlePrepareOrder}
          onReadyOrder={handleReadyOrder}
          onServeOrder={handleServeOrder}
          onDispatchOrder={handleDispatchOrder}
          onDeliverOrder={handleDeliverOrder}
          onCompleteOrder={handleCompleteOrder}
          onPayOrder={(ord) => setPayingOrder(ord)}
          onCancelOrder={(ord) => setCancelingOrder(ord)}
          onAddItems={(ord) => {
            navigate('/orders/new', { state: { editOrder: ord } });
          }}
        />
      )}

      {/* 4. Right Side Order Details Drawer */}
      <RightSideModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Order Details"
      >
        {selectedOrderId && <OrderDetailsContent orderId={selectedOrderId} />}
      </RightSideModal>

      {/* 5. Quick Action Modals */}
      <PayOrderModal
        isOpen={!!payingOrder}
        onClose={() => setPayingOrder(null)}
        order={payingOrder as any}
      />

      <CancelOrderModal
        isOpen={!!cancelingOrder}
        onClose={() => setCancelingOrder(null)}
        order={cancelingOrder as any}
      />
    </div>
  );
};

export default AllOrdersPage;
