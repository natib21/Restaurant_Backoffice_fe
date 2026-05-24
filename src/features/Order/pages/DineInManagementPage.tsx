// src/pages/DineInManagementPage.tsx  (or wherever you place it)
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../app/store';
import { Utensils, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/Socket';
import { Button } from '@/components/ui/button';
import RightSideModal from '@/components/ui/RightSideModal';
import OrdersEmptyState from '../Components/OrdersEmptyState';
import { useCurrentBranchOrAllOrdersQuery } from '../../../api/Queries/orderQuery';

import OrderCard from '../Components/OrderCard';
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
    className={`flex flex-col p-4 rounded-2xl min-w-[120px] ${bg} border border-black/5`}
  >
    <span className={`text-sm font-bold uppercase opacity-70 ${color}`}>
      {label}
    </span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);

const DineInManagementPage = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: response, isLoading } =
    useCurrentBranchOrAllOrdersQuery(currentBranchId);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  // Sync from query
  useEffect(() => {
    if (response?.orders) {
      setAllOrders(response.orders);
    }
  }, [response]);

  // Filter dine-in orders
  const dineIns = useMemo(() => {
    return allOrders.filter(
      (order) => order.orderType?.toLowerCase() === 'dine_in'
    );
  }, [allOrders]);
  console.log(dineIns);

  useEffect(() => {
    if (!socket) return;

    const handleOrderEvent = (payload: any) => {
      console.log(payload);
      if (
        currentBranchId &&
        payload.branch &&
        (payload.branch?._id || payload.branch) !== currentBranchId
      )
        return;

      const isDineIn = payload.orderType?.toLowerCase() === 'dine_in';

      if (!isDineIn) return;

      setAllOrders((prev) => {
        const orderId = payload._id || payload.id;
        const idx = prev.findIndex((o) => (o._id || o.id) === orderId);
        if (idx !== -1) {
          return prev.map((o, i) => (i === idx ? { ...o, ...payload } : o));
        }
        return [{ ...payload, isNew: true }, ...prev];
      });

      queryClient.invalidateQueries({ queryKey: ['orders', currentBranchId] });
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

  // Stats & Tab Filtering — common dine-in statuses
  const stats = useMemo(() => {
    const active = dineIns.filter((o) =>
      ['seated', 'ordered', 'preparing', 'ready', 'served', 'billing'].includes(
        o.status?.toLowerCase()
      )
    ).length;

    const completed = dineIns.filter((o) =>
      ['paid', 'closed', 'completed'].includes(o.status?.toLowerCase())
    ).length;

    return { active, completed };
  }, [dineIns]);

  const filteredDineIns = useMemo(() => {
    return dineIns.filter((o) => {
      const status = o.status?.toLowerCase() || '';
      if (activeTab === 'active') {
        return [
          'seated',
          'ordered',
          'preparing',
          'ready',
          'served',
          'billing',
        ].includes(status);
      }
      return ['paid', 'closed', 'completed'].includes(status);
    });
  }, [dineIns, activeTab]);

  const selectedOrder = dineIns.find(
    (o) => (o._id || o.id) === selectedOrderId
  );

  if (isLoading && allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">
          Loading dine-in orders...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-[#fafafa] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Utensils className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Table Service
            </span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Dine-In Orders
          </h1>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          <StatCard
            label="Active Tables"
            value={stats.active}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>
      </div>

      <div className="flex gap-2 border-b pb-4 overflow-x-auto">
        {(['active', 'completed'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="capitalize font-bold rounded-full px-6"
          >
            {tab === 'active' ? 'In Service' : 'Settled'}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDineIns.map((order) => (
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

      {filteredDineIns.length === 0 && (
        <OrdersEmptyState
          icon={
            activeTab === 'active' ? (
              <Clock className="h-16 w-16 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            )
          }
          title={
            activeTab === 'active'
              ? 'No Active Dine-In Orders'
              : 'No Recent Settled Tables'
          }
          description={
            activeTab === 'active'
              ? 'No tables are currently in service or awaiting food.'
              : 'Settled and paid dine-in orders will appear here.'
          }
        />
      )}

      <RightSideModal
        title={
          selectedOrder
            ? `Table ${selectedOrder.tableNumber || '?'} • Order ${selectedOrder.orderNumber || '—'}`
            : 'Dine-In Details'
        }
        description="Table info, items, server & status"
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      >
        <div className="py-4 space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-sm font-bold text-muted-foreground mb-2">
              Table & Customer
            </p>
            <p className="font-bold">
              Table {selectedOrder?.tableNumber || '—'}
            </p>
            <p className="text-sm">
              Guests: {selectedOrder?.guestCount || '?'}
            </p>
            {selectedOrder?.serverName && (
              <p className="text-sm">Server: {selectedOrder.serverName}</p>
            )}
          </div>

          {/* Add items list, total, split bill options, etc. here later */}
          <Button className="w-full">Update Status / Print Check</Button>
        </div>
      </RightSideModal>
    </div>
  );
};

export default DineInManagementPage;
