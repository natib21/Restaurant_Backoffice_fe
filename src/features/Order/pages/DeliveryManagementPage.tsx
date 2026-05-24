import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../app/store';
import {
  Truck,
  Loader2,
  CheckCircle2,
  ReceiptText,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/Socket';
import { Button } from '@/components/ui/button';
import RightSideModal from '@/components/ui/RightSideModal';
import OrdersEmptyState from '../Components/OrdersEmptyState';
import { useCurrentBranchOrAllOrdersQuery } from '../../../api/Queries/orderQuery';
import OrderCard from '../Components/OrderCard';
import { cn } from '@/lib/utils';

const DeliveryManagementPage = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // Updated Tabs to reflect Delivery lifecycle
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed'
  >('all');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null
  );

  const { data: response, isLoading } =
    useCurrentBranchOrAllOrdersQuery(currentBranchId);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  useEffect(() => {
    if (response?.orders) setAllOrders(response.orders);
  }, [response]);

  // Filter only Delivery type orders
  const deliveries = useMemo(() => {
    return allOrders.filter(
      (order) => order.orderType?.toLowerCase() === 'delivery'
    );
  }, [allOrders]);

  // Socket logic
  useEffect(() => {
    if (!socket) return;
    const handleOrderEvent = (payload: any) => {
      const branchId = payload.branch?._id || payload.branch;
      if (currentBranchId && branchId !== currentBranchId) return;
      if (payload.orderType?.toLowerCase() !== 'delivery') return;

      setAllOrders((prev) => {
        const orderId = payload._id || payload.id;
        const idx = prev.findIndex((o) => (o._id || o.id) === orderId);
        if (idx !== -1) {
          return prev.map((o, i) => (i === idx ? { ...o, ...payload } : o));
        }
        return [{ ...payload, isNew: true }, ...prev];
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
  }, [socket, currentBranchId, queryClient]);

  // Delivery-specific Stats
  const stats = useMemo(
    () => ({
      pending: deliveries.filter((o) => o.status === 'pending').length,
      preparing: deliveries.filter((o) => o.status === 'preparing').length,
      onTheWay: deliveries.filter((o) => o.status === 'out_for_delivery')
        .length,
      completed: deliveries.filter((o) =>
        ['completed', 'delivered'].includes(o.status)
      ).length,
    }),
    [deliveries]
  );

  // Tab Filtering logic
  const filteredDeliveries = useMemo(() => {
    if (activeTab === 'all') return deliveries;
    if (activeTab === 'completed')
      return deliveries.filter((d) =>
        ['completed', 'delivered'].includes(d.status)
      );
    return deliveries.filter((d) => d.status === activeTab);
  }, [deliveries, activeTab]);

  const selectedDelivery = deliveries.find(
    (d) => (d._id || d.id) === selectedDeliveryId
  );

  if (isLoading && allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">
          Syncing delivery logistics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 bg-[#fafafa] min-h-screen">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Logistics Control
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Deliveries
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
            label="Preparing"
            value={stats.preparing}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            label="On Way"
            value={stats.onTheWay}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <StatCard
            label="History"
            value={stats.completed}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>
      </div>

      {/* Responsive Filter Tabs */}
      <div className="relative group">
        <div className="flex gap-2 border-b pb-3 overflow-x-auto scrollbar-none sm:scrollbar-thin scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {(
            [
              'all',
              'pending',
              'preparing',
              'ready',
              'out_for_delivery',
              'completed',
            ] as const
          ).map((tab) => (
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
              {tab.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDeliveries.map((delivery) => (
            <motion.div
              key={delivery._id || delivery.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <OrderCard
                order={delivery}
                onClick={() =>
                  setSelectedDeliveryId(delivery._id || delivery.id)
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDeliveries.length === 0 && (
        <OrdersEmptyState
          icon={
            <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-emerald-500" />
          }
          title="Clear Dashboard"
          description={`No ${activeTab !== 'all' ? activeTab.replace(/_/g, ' ') : ''} deliveries at the moment.`}
        />
      )}

      {/* Right Side Modal */}
      <RightSideModal
        title={
          selectedDelivery
            ? `Delivery #${selectedDelivery.orderNumber}`
            : 'Loading...'
        }
        description="Delivery tracking and customer info"
        open={!!selectedDeliveryId}
        onOpenChange={(open) => !open && setSelectedDeliveryId(null)}
        footer={
          <div className="flex w-full gap-3 px-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.print()}
            >
              <ReceiptText className="mr-2 h-4 w-4" /> Receipt
            </Button>
            <Button className="flex-1 bg-slate-900">
              <MapPin className="mr-2 h-4 w-4" /> Track Driver
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
              Customer Information
            </h4>
            <p className="font-bold text-lg">
              {selectedDelivery?.customerName || 'Walk-in Customer'}
            </p>
            <p className="text-slate-600 font-medium">
              {selectedDelivery?.customerPhone || 'No phone provided'}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {selectedDelivery?.deliveryAddress || 'Address details missing'}
              </span>
            </div>
          </div>
          {/* Add your OrderDetailsContent here or a simplified delivery view */}
        </div>
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
    className={`${bg} px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border min-w-[100px] sm:min-w-[110px] flex-shrink-0 transition-all hover:shadow-sm`}
  >
    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5 sm:mb-1">
      {label}
    </p>
    <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default DeliveryManagementPage;
