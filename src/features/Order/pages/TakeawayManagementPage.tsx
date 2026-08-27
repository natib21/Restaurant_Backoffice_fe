import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../app/store';
import {
  Package,
  Loader2,
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/Socket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RightSideModal from '@/components/ui/RightSideModal';
import OrdersEmptyState from '../Components/OrdersEmptyState';
import {
  useCurrentBranchOrAllOrdersQuery,
  useUpdateOrderStatusMutation,
} from '../../../api/Queries/orderQuery';
import OrderCard, { type OrderCardData } from '../Components/OrderCard';
import OrderKanbanBoard from '../Components/OrderKanbanBoard';
import OrderTableView from '../Components/OrderTableView';
import OrderFilterBar, { type OrderFilterState } from '../Components/OrderFilterBar';
import PayOrderModal from '../Components/PayOrderModal';
import CancelOrderModal from '../Components/CancelOrderModal';
import AddItemsModal from '../Components/AddItemsModal';
import OrderDetailsContent from '../Components/OrderDetailsPanel';
import { playOrderSound } from '@/features/Order/lib/soundPlayer';
import { toast } from 'sonner';

const TAKEAWAY_STATUS_OPTIONS = [
  { key: 'all', label: 'All Takeaways' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'In Kitchen' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'completed', label: 'Picked Up / Completed' },
];

const TakeawayManagementPage: React.FC = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  const { data: response, isLoading } =
    useCurrentBranchOrAllOrdersQuery(currentBranchId);
  const [allOrders, setAllOrders] = useState<OrderCardData[]>([]);

  // Modals
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<OrderCardData | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<OrderCardData | null>(null);
  const [addingItemsOrder, setAddingItemsOrder] = useState<OrderCardData | null>(null);
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
    orderType: 'takeaway',
    status: 'all',
    paymentStatus: 'all',
    urgency: 'all',
    sortBy: 'newest',
    viewMode: 'grid',
  });

  const { mutate: updateStatus } = useUpdateOrderStatusMutation();

  useEffect(() => {
    if (response?.orders) {
      setAllOrders(response.orders as any);
    }
  }, [response]);

  // Socket subscription for real-time takeaway events
  useEffect(() => {
    if (!socket) return;

    if (currentBranchId) {
      socket.emit('setup:session', { branchId: currentBranchId });
      socket.emit('join:branch', { branchId: currentBranchId });
    }

    const handleOrderEvent = (payload: any) => {
      const orderData = payload.order || payload;
      const branchId = orderData.branch?._id || orderData.branch || payload.branchId;
      if (currentBranchId && branchId && branchId !== currentBranchId) return;
      if (orderData.orderType?.toLowerCase() !== 'takeaway') return;

      setAllOrders((prev) => {
        const orderId = orderData._id || orderData.id || orderData.orderId;
        const idx = prev.findIndex((o) => (o._id || o.id) === orderId);
        if (idx !== -1) {
          return prev.map((o, i) => (i === idx ? { ...o, ...orderData } : o));
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

  // Filter only takeaway orders
  const takeaways = useMemo(() => {
    return allOrders.filter(
      (order) => order.orderType?.toLowerCase() === 'takeaway'
    );
  }, [allOrders]);

  // Takeaway KPI stats
  const stats = useMemo(() => {
    const active = takeaways.filter(
      (o) => o.status !== 'canceled' && o.status !== 'cancelled'
    );
    return {
      total: active.length,
      pending: takeaways.filter((o) => o.status === 'pending').length,
      kitchen: takeaways.filter((o) =>
        ['accepted', 'preparing'].includes(o.status)
      ).length,
      readyForPickup: takeaways.filter((o) => o.status === 'ready').length,
      completed: takeaways.filter((o) => o.status === 'completed').length,
      totalVolume: active.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
  }, [takeaways]);

  const statusCounts = useMemo(
    () => ({
      pending: stats.pending,
      accepted: takeaways.filter((o) => o.status === 'accepted').length,
      preparing: takeaways.filter((o) => o.status === 'preparing').length,
      ready: stats.readyForPickup,
      completed: stats.completed,
    }),
    [takeaways, stats]
  );

  // Transition Handlers
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
  const handleCompleteOrder = useCallback(
    (orderId: string) => updateStatus({ orderId, status: 'completed' }),
    [updateStatus]
  );

  // Filtered takeaways list
  const filteredTakeaways = useMemo(() => {
    return takeaways
      .filter((order) => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchesNum = order.orderNumber?.toLowerCase().includes(q);
          const matchesCustomer = order.customerName?.toLowerCase().includes(q);
          const matchesPhone = order.customerPhone?.toLowerCase().includes(q);

          if (!matchesNum && !matchesCustomer && !matchesPhone) {
            return false;
          }
        }

        if (filters.status !== 'all' && order.status !== filters.status) {
          return false;
        }

        if (
          filters.paymentStatus !== 'all' &&
          order.paymentStatus !== filters.paymentStatus
        ) {
          return false;
        }

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
        return 0;
      });
  }, [takeaways, filters]);

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header & KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-amber-600" />
            Takeaway Management
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 rounded-full">
              {stats.total} Active Takeaways
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customer pickup orders, counter handoffs, and packaging queues.
          </p>
        </div>

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

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ready for Pickup
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {stats.readyForPickup}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <PackageCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cooking in Kitchen
            </p>
            <p className="text-xl font-black text-orange-600 mt-0.5">
              {stats.kitchen}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-600">
            <ChefHat className="h-4 w-4" />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Approval
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
              Active Takeaway Value
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
        onFilterChange={(updated) => setFilters((p) => ({ ...p, ...updated }))}
        onResetFilters={() =>
          setFilters({
            search: '',
            orderType: 'takeaway',
            status: 'all',
            paymentStatus: 'all',
            urgency: 'all',
            sortBy: 'newest',
            viewMode: filters.viewMode,
          })
        }
        statusCounts={statusCounts}
        totalCount={takeaways.length}
        statusOptions={TAKEAWAY_STATUS_OPTIONS}
        allowedTypes={['takeaway']}
      />

      {/* 3. Takeaway Views */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Loading Takeaway Orders...
          </p>
        </div>
      ) : filteredTakeaways.length === 0 ? (
        <OrdersEmptyState activeTab={filters.status} />
      ) : filters.viewMode === 'kanban' ? (
        <OrderKanbanBoard
          orders={filteredTakeaways}
          onSelectOrder={(id) => setSelectedOrderId(id)}
          onAcceptOrder={handleAcceptOrder}
          onPrepareOrder={handlePrepareOrder}
          onReadyOrder={handleReadyOrder}
          onServeOrder={handleCompleteOrder}
          onDispatchOrder={() => {}}
          onDeliverOrder={() => {}}
          onPayOrder={(ord) => setPayingOrder(ord)}
          onCancelOrder={(ord) => setCancelingOrder(ord)}
          onAddItems={(ord) => setAddingItemsOrder(ord)}
        />
      ) : filters.viewMode === 'table' ? (
        <OrderTableView
          orders={filteredTakeaways}
          onSelectOrder={(id) => setSelectedOrderId(id)}
          onAcceptOrder={handleAcceptOrder}
          onPrepareOrder={handlePrepareOrder}
          onReadyOrder={handleReadyOrder}
          onServeOrder={handleCompleteOrder}
          onDispatchOrder={() => {}}
          onDeliverOrder={() => {}}
          onPayOrder={(ord) => setPayingOrder(ord)}
          onCancelOrder={(ord) => setCancelingOrder(ord)}
          onAddItems={(ord) => setAddingItemsOrder(ord)}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTakeaways.map((order) => (
            <OrderCard
              key={order._id || order.id}
              order={order}
              onClick={() => setSelectedOrderId(order._id || order.id || '')}
              onAccept={handleAcceptOrder}
              onPrepare={handlePrepareOrder}
              onReady={handleReadyOrder}
              onServe={handleCompleteOrder}
              onPay={(ord) => setPayingOrder(ord)}
              onCancel={(ord) => setCancelingOrder(ord)}
              onAddItems={(ord) => setAddingItemsOrder(ord)}
            />
          ))}
        </div>
      )}

      {/* 4. Details Drawer */}
      <RightSideModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Takeaway Order Details"
      >
        {selectedOrderId && <OrderDetailsContent orderId={selectedOrderId} />}
      </RightSideModal>

      {/* 5. Modals */}
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

export default TakeawayManagementPage;
