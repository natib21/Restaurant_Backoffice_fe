import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../app/store';
import {
  Bell,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  ReceiptText,
  Clock,
  ChefHat,
  PackageCheck,
  Truck,
  TrendingUp,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/Socket';
import { playOrderSound, isSoundEnabled, setSoundEnabled as setStoredSoundEnabled } from '@/features/Order/lib/soundPlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RightSideModal from '@/components/ui/RightSideModal';
import { toast } from 'sonner';

// Queries & Components
import {
  useCurrentBranchOrAllOrdersQuery,
  useUpdateOrderStatusMutation,
  type Order,
} from '../../../api/Queries/orderQuery';
import { useMyMerchantQuery } from '../../../api/Queries/merchantQueries';
import OrderDetailsContent from '../Components/OrderDetailsPanel';
import OrderCard, { type OrderCardData } from '../Components/OrderCard';
import OrderKanbanBoard from '../Components/OrderKanbanBoard';
import OrderTableView from '../Components/OrderTableView';
import OrderFilterBar, { type OrderFilterState } from '../Components/OrderFilterBar';
import PayOrderModal from '../Components/PayOrderModal';
import CancelOrderModal from '../Components/CancelOrderModal';
import AddItemsModal from '../Components/AddItemsModal';
import OrdersEmptyState from '../Components/OrdersEmptyState';
import { cn } from '@/lib/utils';

const ActiveOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  const { data: response, isLoading } =
    useCurrentBranchOrAllOrdersQuery(currentBranchId);
  const { data: merchantData } = useMyMerchantQuery();

  const [orders, setOrders] = useState<OrderCardData[]>([]);

  // Modals state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<OrderCardData | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<OrderCardData | null>(null);
  const [addingItemsOrder, setAddingItemsOrder] = useState<OrderCardData | null>(null);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isSoundEnabled());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter State
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    orderType: 'all',
    status: 'all',
    paymentStatus: 'all',
    urgency: 'all',
    sortBy: 'newest',
    viewMode: 'kanban',
  });

  const { mutate: updateStatus } = useUpdateOrderStatusMutation();

  // Sync API response to state (filter to active orders: pending through served/delivered)
  useEffect(() => {
    if (response?.orders) {
      const activeList = (response.orders as any[]).filter(
        (o) => o.status !== 'completed' && o.status !== 'canceled' && o.status !== 'cancelled'
      );
      setOrders(activeList);
    }
  }, [response]);

  // Read merchant sound config on load
  useEffect(() => {
    const merchant = (merchantData as any) ?? {};
    const notifySettings = merchant?.settings?.notifications ?? {};
    if (notifySettings.orderSoundEnabled !== undefined) {
      setSoundEnabled(notifySettings.orderSoundEnabled !== false);
    }
  }, [merchantData]);

  // ────────────────────────────────────────────────
  // Real-Time Socket Listeners (Aligned with Guide)
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Join branch room if branch is active
    if (currentBranchId) {
      socket.emit('setup:session', { branchId: currentBranchId });
      socket.emit('join:branch', { branchId: currentBranchId });
    }

    const handleOrderEvent = (incoming: any) => {
      const orderData = incoming.order || incoming;
      const orderId = orderData._id || orderData.orderId || orderData.id || incoming.orderId;
      const branchId = orderData.branch?._id || orderData.branch || incoming.branchId;
      if (currentBranchId && branchId && branchId !== currentBranchId) return;

      const newStatus = incoming.newStatus || orderData.status;

      setOrders((prev) => {
        const existingIndex = prev.findIndex(
          (o) => (o._id || o.id) === orderId
        );
        // If order became completed or canceled, remove from active list
        if (newStatus === 'completed' || newStatus === 'canceled' || newStatus === 'cancelled') {
          return prev.filter((o) => (o._id || o.id) !== orderId);
        }

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

    const handleTicketEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    };

    socket.on('order:create', handleOrderEvent);
    socket.on('order:created', handleOrderEvent);
    socket.on('order:new', handleOrderEvent);
    socket.on('order-updated', handleOrderEvent);
    socket.on('order:status-updated', handleOrderEvent);
    socket.on('order:status-changed', handleOrderEvent);
    socket.on('ticket:updated', handleTicketEvent);
    socket.on('ticket:created', handleTicketEvent);
    socket.on('ticket:status-changed', handleTicketEvent);

    return () => {
      socket.off('order:create', handleOrderEvent);
      socket.off('order:created', handleOrderEvent);
      socket.off('order:new', handleOrderEvent);
      socket.off('order-updated', handleOrderEvent);
      socket.off('order:status-updated', handleOrderEvent);
      socket.off('order:status-changed', handleOrderEvent);
      socket.off('ticket:updated', handleTicketEvent);
      socket.off('ticket:created', handleTicketEvent);
      socket.off('ticket:status-changed', handleTicketEvent);
    };
  }, [socket, currentBranchId, queryClient, soundEnabled]);

  // ────────────────────────────────────────────────
  // State Machine Action Handlers
  // ────────────────────────────────────────────────
  const handleAcceptOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'accepted' });
    },
    [updateStatus]
  );

  const handlePrepareOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'preparing' });
    },
    [updateStatus]
  );

  const handleReadyOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'ready' });
    },
    [updateStatus]
  );

  const handleServeOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'served' });
    },
    [updateStatus]
  );

  const handleDispatchOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'out_for_delivery' });
    },
    [updateStatus]
  );

  const handleDeliverOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'delivered' });
    },
    [updateStatus]
  );

  const handleCompleteOrder = useCallback(
    (orderId: string) => {
      updateStatus({ orderId, status: 'completed' });
    },
    [updateStatus]
  );

  // ────────────────────────────────────────────────
  // Live KPI Summary Metrics (Active Orders Queue)
  // ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const kitchen = orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    const servedOrDispatched = orders.filter((o) =>
      ['served', 'out_for_delivery', 'delivered'].includes(o.status)
    ).length;
    const totalVolume = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    return {
      totalActive: orders.length,
      pending,
      kitchen,
      ready,
      servedOrDispatched,
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
      served: orders.filter((o) => o.status === 'served').length,
      out_for_delivery: orders.filter((o) => o.status === 'out_for_delivery').length,
    }),
    [orders, stats]
  );

  const ACTIVE_STATUS_OPTIONS = useMemo(
    () => [
      { key: 'all', label: 'All Active' },
      { key: 'pending', label: 'Pending' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'preparing', label: 'Cooking' },
      { key: 'ready', label: 'Ready' },
      { key: 'served', label: 'Served' },
      { key: 'out_for_delivery', label: 'Dispatched' },
    ],
    []
  );

  // ────────────────────────────────────────────────
  // Filter & Sort Pipeline
  // ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Search query
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchesNum = order.orderNumber?.toLowerCase().includes(q);
          const matchesCustomer = order.customerName?.toLowerCase().includes(q);
          const matchesPhone = order.customerPhone?.toLowerCase().includes(q);
          const tableNum =
            typeof order.table === 'object'
              ? order.table?.tableNumber
              : order.tableNumber || (order.table as string);
          const matchesTable = tableNum?.toLowerCase().includes(q);
          const matchesAddress = order.location?.formattedAddress
            ?.toLowerCase()
            .includes(q);

          if (
            !matchesNum &&
            !matchesCustomer &&
            !matchesPhone &&
            !matchesTable &&
            !matchesAddress
          ) {
            return false;
          }
        }

        // Order Type
        if (
          filters.orderType !== 'all' &&
          order.orderType?.toLowerCase() !== filters.orderType
        ) {
          return false;
        }

        // Status filter
        if (filters.status !== 'all' && order.status !== filters.status) {
          return false;
        }

        // Payment status
        if (
          filters.paymentStatus !== 'all' &&
          order.paymentStatus !== filters.paymentStatus
        ) {
          return false;
        }

        // Urgency filter (>20 mins)
        if (filters.urgency === 'urgent') {
          const elapsed =
            (now - new Date(order.placedAt).getTime()) / (1000 * 60);
          if (elapsed < 20) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return (
            new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
          );
        }
        if (filters.sortBy === 'oldest') {
          return (
            new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
          );
        }
        if (filters.sortBy === 'amount_high') {
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        if (filters.sortBy === 'amount_low') {
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        }
        if (filters.sortBy === 'urgency') {
          return (
            new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
          );
        }
        return 0;
      });
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
    });
  };

  const handleTestChime = () => {
    playOrderSound();
    toast.success('Audio notification chime played');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header & Live KPI Ribbons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Active Orders Board
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-mono font-bold bg-primary/10 text-primary rounded-full">
              {stats.totalActive} Live
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time kitchen & service order management queue (Pending through Served).
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
            className="text-xs h-9 gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Acceptance
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              {stats.pending}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cooking in Kitchen
            </p>
            <p className="text-xl font-black text-purple-600 mt-0.5">
              {stats.kitchen}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
            <ChefHat className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ready for Service
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {stats.ready}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <PackageCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Served & Dispatched
            </p>
            <p className="text-xl font-black text-teal-600 mt-0.5">
              {stats.servedOrDispatched}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs col-span-2 md:col-span-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Queue Volume
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

      {/* 2. Advanced Filter Bar */}
      <OrderFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        statusCounts={statusCounts}
        totalCount={orders.length}
        statusOptions={ACTIVE_STATUS_OPTIONS}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled((prev) => {
            const next = !prev;
            setStoredSoundEnabled(next);
            return next;
          });
        }}
        onTestSound={handleTestChime}
      />

      {/* 3. Orders Views: Kanban, Grid, or Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Loading Live Orders...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <OrdersEmptyState activeTab={filters.status} />
      ) : filters.viewMode === 'kanban' ? (
        <OrderKanbanBoard
          orders={filteredOrders}
          mode="active"
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
          onAddItems={(ord) => setAddingItemsOrder(ord)}
        />
      ) : filters.viewMode === 'table' ? (
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
          onAddItems={(ord) => setAddingItemsOrder(ord)}
        />
      ) : (
        /* Grid View */
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
              onAddItems={(ord) => setAddingItemsOrder(ord)}
            />
          ))}
        </div>
      )}

      {/* 4. Right Side Order Details Drawer */}
      <RightSideModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Order Details"
      >
        {selectedOrderId && <OrderDetailsContent orderId={selectedOrderId} />}
      </RightSideModal>

      {/* 5. Senior Quick Action Modals */}
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

      <AddItemsModal
        isOpen={!!addingItemsOrder}
        onClose={() => setAddingItemsOrder(null)}
        order={addingItemsOrder as any}
      />
    </div>
  );
};

export default ActiveOrdersPage;
