import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../../app/store';
import { setOrderSidebarOpen } from '../layoutSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  X,
  Truck,
  Table2,
  Clock,
  ShoppingBag,
  UserPlus,
  Search,
  CheckCircle2,
  Timer,
  LayoutGrid,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';

// Hooks
import {
  useCurrentBranchOrAllOrdersQuery,
  useUpdateOrderStatusMutation,
} from '../../../api/Queries/orderQuery';
import { useSocket } from '@/lib/Socket';
import { useGetMeQuery } from '@/api/Queries/authQueries';

/* -------------------------------------------------------------------------- */
/* Helper Component                                                           */
/* -------------------------------------------------------------------------- */
const FilterTab = ({
  active,
  onClick,
  icon,
  label,
  count = 0,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'relative flex flex-col items-center justify-center min-w-[52px] sm:min-w-[46px] py-2 rounded-xl border transition-all gap-1',
      active
        ? 'bg-primary border-primary text-primary-foreground shadow-md scale-105'
        : 'bg-background border-border text-muted-foreground hover:border-primary/50'
    )}
  >
    {count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-background">
        {count}
      </span>
    )}
    {icon}
    <span className="text-[9px] font-black uppercase tracking-tighter">
      {label}
    </span>
  </button>
);

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export const OrderSidebar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const queryClient = useQueryClient();

  // Local UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'pending' | 'served' | 'completed' | 'mine'
  >('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Redux & Queries
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );
  const { data: userData } = useGetMeQuery();
  const {
    data: response,
    isLoading,
    isFetching,
  } = useCurrentBranchOrAllOrdersQuery(currentBranchId);

  const currentUser = userData?.data?.user || userData;
  const ordersFromApi = response?.orders || [];

  const { mutate: updateStatus } = useUpdateOrderStatusMutation();

  // Robust ID Sync from URL
  useEffect(() => {
    const id = location.pathname.split('/').pop();
    // Ensure we don't set 'orders' as the ID if the path is just /orders
    if (id && id !== 'orders') {
      setSelectedId(id);
    }
  }, [location.pathname]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync API data
  useEffect(() => {
    setOrders(ordersFromApi);
  }, []);

  /* ---------------------------------- Socket Logic --------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const handleOrderEvent = (payload: any) => {
      const incomingId = payload._id || payload.orderId || payload.id;
      if (!incomingId) return;

      setOrders((prevOrders) => {
        const existingIndex = prevOrders.findIndex(
          (o) => (o._id || o.id) === incomingId
        );

        if (existingIndex !== -1) {
          return prevOrders.map((order, idx) =>
            idx === existingIndex
              ? { ...order, ...payload, isNew: true }
              : order
          );
        }
        return [{ ...payload, isNew: true }, ...prevOrders];
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
  }, [socket, queryClient]);

  /* ---------------------------------- Filter Logic ---------------------------------- */
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table?.tableNumber?.toString().includes(searchQuery);

      const matchesFilter = () => {
        switch (activeFilter) {
          case 'mine':
            const creatorId = order.placedBy?._id || order.placedBy;
            return creatorId === currentUser?._id;
          case 'pending':
            return order.status === 'pending';
          case 'served':
            return order.status === 'ready' || order.status === 'served';
          case 'completed':
            return order.status === 'completed' || order.status === 'delivered';
          default:
            return order.status !== 'cancelled';
        }
      };

      return matchesSearch && matchesFilter();
    });
  }, [orders, searchQuery, activeFilter, currentUser]);

  /* ---------------------------------- Filter Logic ---------------------------------- */
  const counts = useMemo(
    () => ({
      all: orders.filter((o) => o.status !== 'cancelled').length,
      mine: orders.filter(
        (o) => (o.placedBy?._id || o.placedBy) === currentUser?._id
      ).length,
      pending: orders.filter((o) => o.status === 'pending').length,
      served: orders.filter((o) => ['ready', 'served'].includes(o.status))
        .length,
      completed: orders.filter((o) =>
        ['completed', 'delivered'].includes(o.status)
      ).length,
    }),
    [orders, currentUser]
  );

  /* ---------------------------------- Helpers ---------------------------------- */
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      accepted: 'bg-blue-500/10 text-blue-600 border-blue-200',
      preparing: 'bg-orange-500/10 text-orange-600 border-orange-200',
      ready: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600 border-gray-200';
  };

  const handleQuickJoin = (
    e: React.MouseEvent,
    orderId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    const statusMap: Record<string, string> = {
      pending: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
    };
    const nextStatus = statusMap[currentStatus];
    if (nextStatus) {
      updateStatus({ orderId, status: nextStatus as any });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, isNew: false } : o))
      );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setOrderSidebarOpen(false))}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
          )}

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r shadow-2xl w-full lg:w-[320px] lg:relative lg:shadow-none"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest">
                  Orders
                </h2>
              </div>
              {isMobile && (
                <button
                  onClick={() => dispatch(setOrderSidebarOpen(false))}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search & Filters */}
            <div className="p-3 border-b space-y-3 bg-muted/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search table or ID..."
                  className="pl-9 h-10 text-xs bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                <FilterTab
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                  icon={<LayoutGrid size={14} />}
                  label="All"
                  count={counts.all}
                />
                <FilterTab
                  active={activeFilter === 'mine'}
                  onClick={() => setActiveFilter('mine')}
                  icon={<UserIcon size={14} />}
                  label="Mine"
                  count={counts.mine}
                />
                <FilterTab
                  active={activeFilter === 'pending'}
                  onClick={() => setActiveFilter('pending')}
                  icon={<Timer size={14} />}
                  label="New"
                  count={counts.pending}
                />
                <FilterTab
                  active={activeFilter === 'served'}
                  onClick={() => setActiveFilter('served')}
                  icon={<Truck size={14} />}
                  label="Served"
                  count={counts.served}
                />
                <FilterTab
                  active={activeFilter === 'completed'}
                  onClick={() => setActiveFilter('completed')}
                  icon={<CheckCircle2 size={14} />}
                  label="Done"
                  count={counts.completed}
                />
              </div>
            </div>

            {/* Order List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {(isLoading || isFetching) && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                  <Clock className="h-8 w-8 animate-spin text-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Updating Orders...
                  </span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30 gap-3">
                  <Package className="h-12 w-12" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Empty Kitchen
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {filteredOrders.map((order) => {
                    const id = order._id || order.id;
                    const isActive = selectedId === id;

                    return (
                      <motion.button
                        key={id}
                        layout
                        onClick={() => {
                          setSelectedId(id); // Immediate UI response
                          navigate(`/orders/${id}`);
                          if (isMobile) dispatch(setOrderSidebarOpen(false));
                        }}
                        className={cn(
                          'group relative p-4 text-left transition-all duration-200 border-l-4',
                          isActive
                            ? 'bg-primary/[0.06] border-primary'
                            : 'hover:bg-muted/40 border-transparent',
                          order.isNew && 'bg-amber-500/5'
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black uppercase tracking-tighter">
                                {order.table?.tableNumber
                                  ? `Table ${order.table.tableNumber}`
                                  : order.orderType?.replace('_', ' ')}
                              </span>
                              <Badge
                                className={cn(
                                  'text-[8px] h-4 px-1.5 uppercase font-black border',
                                  getStatusStyles(order.status)
                                )}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <h4 className="text-[10px] font-mono text-muted-foreground/70">
                              #{order.orderNumber}
                            </h4>
                          </div>

                          <button
                            onClick={(e) =>
                              handleQuickJoin(e, id, order.status)
                            }
                            className="p-1.5 bg-primary text-primary-foreground rounded-md shadow-sm hover:scale-110 active:scale-95 transition-all"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          <div className="flex items-center gap-1.5">
                            {order.orderType === 'dine_in' ? (
                              <Table2 size={12} />
                            ) : (
                              <Truck size={12} />
                            )}
                            <span className="opacity-80">
                              {order.orderType?.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                            <Clock size={10} />
                            {order.placedAt
                              ? formatDistanceToNow(new Date(order.placedAt), {
                                  addSuffix: true,
                                })
                              : 'Just now'}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
