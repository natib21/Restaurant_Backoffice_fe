// src/components/layout/OrderSidebar.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../../app/store';
import { setOrderSidebarOpen } from '../../../components/Layout/layoutSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  X,
  Truck,
  Table2,
  Clock,
  ChevronRight,
  Timer,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// RTK Query Hook
import { useActiveOrdersQuery } from '../../../api/Queries/orderQuery';

// Your existing sound manager already handles pending alerts
// No need to duplicate sound logic here

export const OrderSidebar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch real active orders (pending → ready)
  const { data: orders = [], isLoading, isError } = useActiveOrdersQuery();

  const currentOrderId = location.pathname.split('/').pop();

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in':
        return <Table2 className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      case 'takeaway':
        return <Package className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      accepted: 'bg-blue-500/10 text-blue-600 border-blue-200',
      preparing: 'bg-orange-500/10 text-orange-600 border-orange-200',
      ready: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600 border-gray-200';
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => dispatch(setOrderSidebarOpen(false))}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r shadow-2xl',
              'w-full lg:w-[320px] lg:max-w-[360px] max-w-[100vw]',
              'lg:relative lg:z-auto lg:border-l-0 lg:shadow-none'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground leading-none">
                    Orders
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {isLoading ? 'Loading...' : `${orders.length} active`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => dispatch(setOrderSidebarOpen(false))}
                className="p-2 rounded-lg hover:bg-muted lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-muted/30 rounded-lg" />
                    <div className="h-20 bg-muted/30 rounded-lg" />
                  </div>
                </div>
              ) : isError ? (
                <div className="p-12 text-center text-destructive">
                  Failed to load orders
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-base font-medium text-muted-foreground">
                    All caught up!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No active orders right now
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {orders.map((order: any) => {
                    const isSelected = currentOrderId === order._id;

                    return (
                      <button
                        key={order._id}
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className={cn(
                          'group relative flex flex-col gap-3 p-5 text-left transition-all duration-200',
                          'hover:bg-muted/40',
                          isSelected && 'bg-primary/[0.03]'
                        )}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}

                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-primary">
                                {order.orderNumber}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'capitalize px-1.5 py-0 text-[10px] leading-4 h-5',
                                  getStatusStyles(order.status)
                                )}
                              >
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-[15px] leading-tight text-foreground">
                              {order.customerName ||
                                order.tableNumber ||
                                'Guest Order'}
                            </h4>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-sm text-foreground">
                              ${order.totalAmount.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              {order.items?.length || 0} items
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            {getOrderTypeIcon(order.orderType)}
                            <span className="capitalize">
                              {order.orderType.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(order.placedAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                          <ChevronRight className="h-4 w-4 text-primary/50" />
                        </div>
                      </button>
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
