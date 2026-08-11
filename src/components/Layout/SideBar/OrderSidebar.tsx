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
      'relative flex flex-col items-center justify-center min-w-[50px] sm:min-w-[44px] py-1.5 rounded-md border text-xs font-medium transition-colors gap-0.5',
      active
        ? 'bg-primary border-primary text-primary-foreground font-semibold shadow-xs'
        : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50'
    )}
  >
    {count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white ring-2 ring-card">
        {count}
      </span>
    )}
    {icon}
    <span className="text-[10px] leading-none uppercase tracking-tight">
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

  const currentUser = (userData as any)?.data?.user || userData;
  const ordersFromApi = useMemo(() => response?.orders || [], [response?.orders]);

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

  // Clear orders when branch changes
  useEffect(() => {
    setOrders([]);
  }, [currentBranchId]);

  // Sync API data
  useEffect(() => {
    setOrders(ordersFromApi);
  }, [ordersFromApi]);

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
          case 'mine': {
            const creatorId = order.placedBy?._id || order.placedBy;
            return creatorId === currentUser?._id;
          }
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
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      accepted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      preparing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      ready: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };
    return styles[status] || 'bg-muted text-muted-foreground border-border';
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
              className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40"
            />
          )}

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border/80 shadow-xl w-full lg:w-[310px] lg:relative lg:shadow-none"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-card">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Orders Queue
                </h2>
              </div>
              {isMobile && (
                <button
                  onClick={() => dispatch(setOrderSidebarOpen(false))}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search & Filters */}
            <div className="p-3 border-b border-border/70 space-y-2.5 bg-muted/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search table or ID..."
                  className="pl-8 h-8 text-xs bg-card border-border/80 focus-visible:ring-1 focus-visible:ring-ring rounded-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <FilterTab
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                  icon={<LayoutGrid size={13} />}
                  label="All"
                  count={counts.all}
                />
                <FilterTab
                  active={activeFilter === 'mine'}
                  onClick={() => setActiveFilter('mine')}
                  icon={<UserIcon size={13} />}
                  label="Mine"
                  count={counts.mine}
                />
                <FilterTab
                  active={activeFilter === 'pending'}
                  onClick={() => setActiveFilter('pending')}
                  icon={<Timer size={13} />}
                  label="New"
                  count={counts.pending}
                />
                <FilterTab
                  active={activeFilter === 'served'}
                  onClick={() => setActiveFilter('served')}
                  icon={<Truck size={13} />}
                  label="Served"
                  count={counts.served}
                />
                <FilterTab
                  active={activeFilter === 'completed'}
                  onClick={() => setActiveFilter('completed')}
                  icon={<CheckCircle2 size={13} />}
                  label="Done"
                  count={counts.completed}
                />
              </div>
            </div>

            {/* Order List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {(isLoading || isFetching) && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <Clock className="h-6 w-6 animate-spin text-primary/60" />
                  <span className="text-xs font-medium">
                    Updating Orders...
                  </span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60 gap-2">
                  <Package className="h-10 w-10 stroke-1" />
                  <p className="text-xs font-medium">
                    No orders found
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/40">
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
                          'group relative p-3 text-left transition-colors border-l-2',
                          isActive
                            ? 'bg-primary/5 border-l-primary'
                            : 'hover:bg-muted/40 border-l-transparent',
                          order.isNew && 'bg-amber-500/5'
                        )}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {order.table?.tableNumber
                                  ? `Table ${order.table.tableNumber}`
                                  : order.orderType?.replace('_', ' ')}
                              </span>
                              <Badge
                                className={cn(
                                  'text-[9px] h-4 px-1.5 uppercase font-medium border-0',
                                  getStatusStyles(order.status)
                                )}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              #{order.orderNumber}
                            </p>
                          </div>

                          <button
                            onClick={(e) =>
                              handleQuickJoin(e, id, order.status)
                            }
                            title="Advance order status"
                            className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                          <div className="flex items-center gap-1">
                            {order.orderType === 'dine_in' ? (
                              <Table2 size={11} />
                            ) : (
                              <Truck size={11} />
                            )}
                            <span className="capitalize">
                              {order.orderType?.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
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
