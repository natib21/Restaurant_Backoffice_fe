import React from 'react';
import { OrderCard, type OrderCardData } from './OrderCard';
import {
  Timer,
  Clock,
  ChefHat,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Inbox,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrderKanbanBoardProps {
  orders: OrderCardData[];
  mode?: 'active' | 'all';
  onSelectOrder: (orderId: string) => void;
  onAcceptOrder: (orderId: string) => void;
  onPrepareOrder: (orderId: string) => void;
  onReadyOrder: (orderId: string) => void;
  onServeOrder: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
  onDeliverOrder: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onPayOrder: (order: OrderCardData) => void;
  onCancelOrder: (order: OrderCardData) => void;
  onAddItems: (order: OrderCardData) => void;
}

interface ColumnConfig {
  id: string;
  title: string;
  statuses: string[];
  icon: any;
  color: string;
  badgeBg: string;
}

const ACTIVE_KANBAN_COLUMNS: ColumnConfig[] = [
  {
    id: 'pending',
    title: 'Pending',
    statuses: ['pending'],
    icon: Timer,
    color: 'border-t-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-600',
  },
  {
    id: 'accepted',
    title: 'Accepted',
    statuses: ['accepted'],
    icon: Clock,
    color: 'border-t-blue-500',
    badgeBg: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'preparing',
    title: 'Cooking',
    statuses: ['preparing'],
    icon: ChefHat,
    color: 'border-t-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-600',
  },
  {
    id: 'ready',
    title: 'Ready',
    statuses: ['ready'],
    icon: PackageCheck,
    color: 'border-t-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    id: 'served_dispatched',
    title: 'Served & Dispatched',
    statuses: ['served', 'out_for_delivery', 'delivered'],
    icon: CheckCircle2,
    color: 'border-t-teal-500',
    badgeBg: 'bg-teal-500/10 text-teal-600',
  },
];

const ALL_KANBAN_COLUMNS: ColumnConfig[] = [
  ...ACTIVE_KANBAN_COLUMNS,
  {
    id: 'completed',
    title: 'Completed',
    statuses: ['completed'],
    icon: CheckCircle2,
    color: 'border-t-emerald-600',
    badgeBg: 'bg-emerald-600/10 text-emerald-700',
  },
  {
    id: 'canceled',
    title: 'Canceled',
    statuses: ['canceled', 'cancelled'],
    icon: XCircle,
    color: 'border-t-rose-500',
    badgeBg: 'bg-rose-500/10 text-rose-600',
  },
];

export const OrderKanbanBoard: React.FC<OrderKanbanBoardProps> = ({
  orders,
  mode = 'active',
  onSelectOrder,
  onAcceptOrder,
  onPrepareOrder,
  onReadyOrder,
  onServeOrder,
  onDispatchOrder,
  onDeliverOrder,
  onCompleteOrder,
  onPayOrder,
  onCancelOrder,
  onAddItems,
}) => {
  const columns = mode === 'all' ? ALL_KANBAN_COLUMNS : ACTIVE_KANBAN_COLUMNS;
  const gridColsClass =
    mode === 'all'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5 items-start'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start';

  return (
    <div className={gridColsClass}>
      {columns.map((col) => {
        const columnOrders = orders.filter((o) =>
          col.statuses.includes(o.status)
        );
        const totalAmount = columnOrders.reduce(
          (sum, o) => sum + (o.totalAmount || 0),
          0
        );
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className={cn(
              'flex flex-col bg-muted/20 border rounded-xl overflow-hidden min-h-[500px]',
              'border-t-4',
              col.color
            )}
          >
            {/* Column Header */}
            <div className="p-3 bg-card border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  {col.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn('text-xs font-mono font-bold px-2 py-0', col.badgeBg)}
                >
                  {columnOrders.length}
                </Badge>
              </div>
            </div>

            {/* Column Revenue Total (if orders exist) */}
            {columnOrders.length > 0 && (
              <div className="px-3 py-1 bg-muted/40 text-[10px] font-mono text-muted-foreground flex justify-between border-b">
                <span>Active Value:</span>
                <span className="font-semibold text-foreground">
                  ETB {totalAmount.toLocaleString()}
                </span>
              </div>
            )}

            {/* Column Cards Stream */}
            <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin">
              {columnOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground p-4">
                  <Inbox className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium">No orders in this stage</p>
                </div>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard
                    key={order._id || order.id}
                    order={order}
                    onClick={() => onSelectOrder(order._id || order.id || '')}
                    onAccept={onAcceptOrder}
                    onPrepare={onPrepareOrder}
                    onReady={onReadyOrder}
                    onServe={onServeOrder}
                    onDispatch={onDispatchOrder}
                    onDeliver={onDeliverOrder}
                    onComplete={onCompleteOrder}
                    onPay={onPayOrder}
                    onCancel={onCancelOrder}
                    onAddItems={onAddItems}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default OrderKanbanBoard;
