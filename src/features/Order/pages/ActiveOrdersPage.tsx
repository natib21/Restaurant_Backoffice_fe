import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../app/store';
import {
  Bell,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  ReceiptText,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCard from '../Components/OrderCard';
import OrdersEmptyState from '../Components/OrdersEmptyState';
import { useSocket } from '@/lib/Socket';
import { playOrderSound } from '@/features/Order/lib/soundPlayer';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import RightSideModal from '@/components/ui/RightSideModal';
import { toast } from 'sonner';

// Hooks
import { useCurrentBranchOrAllOrdersQuery } from '../../../api/Queries/orderQuery';
import { useMyMerchantQuery } from '../../../api/Queries/merchantQueries';
import OrderDetailsContent from '../Components/OrderDetailsPanel';
import { cn } from '@/lib/utils';

const ActiveOrdersPage = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'preparing' | 'ready' | 'completed'
  >('all');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );
  const { data: response, isLoading } =
    useCurrentBranchOrAllOrdersQuery(currentBranchId);
  const { data: merchantData } = useMyMerchantQuery();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (response?.orders) setOrders(response.orders);
  }, [response]);

  // ────────────────────────────────────────────────
  // Socket logic — with merchant settings check
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Read merchant notification settings (with safe fallbacks)
    const merchant = (merchantData as any) ?? {};
    const notifySettings = merchant?.settings?.notifications ?? {};
    const soundEnabled = notifySettings.orderSoundEnabled !== false; // default true
    const soundChoice: string | undefined = notifySettings.newOrderSound;

    const handleOrderEvent = (incoming: any) => {
      const orderId = incoming._id || incoming.orderId;
      const branchId = incoming.branch?._id || incoming.branch;
      if (currentBranchId && branchId !== currentBranchId) return;

      if (incoming.status === 'pending') {
        // ── Merchant sound check ──────────────────────────────
        if (soundEnabled) {
          const soundFile = soundChoice && soundChoice !== 'default'
            ? `/sounds/${soundChoice}.mp3`
            : undefined;
          playOrderSound({ soundFile });
        }

        // ── Visual toast cue (always fires, even if sound is off or fails) ──
        const orderLabel = incoming.orderNumber || `#${(incoming._id || '').slice(-6)}`;
        toast(
          `🛎️  New Order ${orderLabel}`,
          {
            description: incoming.customerName
              ? `From: ${incoming.customerName}`
              : `Table ${incoming.tableNumber || '—'}`,
            duration: 5000,
          }
        );
      }

      setOrders((prev) => {
        const existingIndex = prev.findIndex(
          (o) => (o._id || o.id) === orderId
        );
        if (existingIndex !== -1) {
          return prev.map((order, idx) =>
            idx === existingIndex ? { ...order, ...incoming } : order
          );
        }
        return [{ ...incoming, isNew: true }, ...prev];
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    socket.on('order:create', handleOrderEvent);
    socket.on('order-updated', handleOrderEvent);
    socket.on('order:status-updated', handleOrderEvent);

    return () => {
      socket.off('order:create', handleOrderEvent);
      socket.off('order-updated', handleOrderEvent);
      socket.off('order:status-updated', handleOrderEvent);
    };
  }, [socket, currentBranchId, queryClient, merchantData]);

  const stats = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) =>
        ['completed', 'served'].includes(o.status)
      ).length,
    }),
    [orders]
  );

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed')
      return ['completed', 'served'].includes(o.status);
    return o.status === activeTab;
  });

  const selectedOrder = orders.find((o) => (o._id || o.id) === selectedOrderId);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium text-center">
          Loading live kitchen feed...
        </p>
      </div>
    );
  }

  return (
    <div className=" space-y-6 sm:space-y-8 bg-[#fafafa] min-h-screen">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Kitchen Display System
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            All Orders
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <StatCard
            label="Pending"
            value={stats.pending}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            label="In Kitchen"
            value={stats.preparing}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            label="Ready"
            value={stats.ready}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="text-slate-600"
            bg="bg-slate-50"
          />
        </div>
      </div>

      {/* Filter Tabs – scrollable on mobile */}
      <div className="relative group">
        {/* The Container */}
        <div className="flex gap-2 border-b pb-3 overflow-x-auto scrollbar-none sm:scrollbar-thin scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {(['all', 'pending', 'preparing', 'ready', 'completed'] as const).map(
            (tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'capitalize font-bold rounded-full px-5 py-2 whitespace-nowrap flex-shrink-0 transition-all text-xs sm:text-sm',
                  activeTab === tab
                    ? 'shadow-md shadow-primary/20 scale-105'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {tab}
              </Button>
            )
          )}
        </div>

        {/* Mobile Gradient Fade (Optional: indicates there is more to scroll) */}
        <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* Orders Grid – responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id || order.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <OrderCard
                order={order}
                onClick={() => setSelectedOrderId(order._id || order.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredOrders.length === 0 && (
        <OrdersEmptyState
          icon={
            <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-emerald-500" />
          }
          title="All Caught Up!"
          description="No orders found in this category."
        />
      )}
      <RightSideModal
        title={
          selectedOrder ? `Order ${selectedOrder.orderNumber}` : 'Order Details'
        }
        description="Manage items and status updates"
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
        footer={
          <div className="flex w-full gap-3 px-1">
            <Button
              variant="outline"
              className="flex-1 text-sm sm:text-base"
              onClick={() => window.print()}
            >
              <ReceiptText className="mr-1.5 sm:mr-2 h-4 w-4" /> Print
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base">
              Mark as Served
            </Button>
          </div>
        }
      >
        {selectedOrderId ? (
          <OrderDetailsContent orderId={selectedOrderId} />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </RightSideModal>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) => (
  <div
    className={`${bg} px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border min-w-[100px] sm:min-w-[110px] flex-shrink-0`}
  >
    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5 sm:mb-1">
      {label}
    </p>
    <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default ActiveOrdersPage;
