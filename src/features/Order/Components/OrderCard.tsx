import React from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  Truck,
  XCircle,
  Timer,
  UtensilsCrossed,
  MapPin,
  ChevronRight,
  Plus,
  CreditCard,
  ChefHat,
  Send,
  Phone,
  Check,
  QrCode,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatOrderItemName } from '../lib/orderUtils';
import BulkServeButton from './BulkServeButton';

export interface OrderCardData {
  _id?: string;
  id?: string;
  orderNumber: string;
  orderType: 'dine_in' | 'delivery' | 'takeaway';
  branch?: {
    _id?: string;
    name?: string;
  } | string;
  table?: {
    _id?: string;
    tableNumber?: string;
  } | string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    _id?: string;
    name?: string | null;
    menuItem?: any;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    notes?: string;
  }>;
  itemCount?: number;
  subtotal?: number;
  totalAmount: number;
  deliveryFee?: number;
  location?: {
    formattedAddress?: string;
    city?: string;
    wereda?: string;
    subCity?: string;
    specificArea?: string;
    building?: string;
  };
  deliveryNotes?: string;
  status:
    | 'pending'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'served'
    | 'completed'
    | 'canceled'
    | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  paymentDetails?: {
    method?: string;
    bankName?: string;
  };
  placedAt: string;
  acceptedAt?: string;
  readyAt?: string;
  servedAt?: string;
  completedAt?: string;
  isNew?: boolean;
  assignedWaiter?: { _id: string; fullName: string } | null;
  source?: string;
  channel?: string;
  isQrOrder?: boolean;
}

interface OrderCardProps {
  order: OrderCardData;
  isSelected?: boolean;
  onClick?: () => void;
  onAccept?: (orderId: string) => void;
  onPrepare?: (orderId: string) => void;
  onReady?: (orderId: string) => void;
  onServe?: (orderId: string) => void;
  onDispatch?: (orderId: string) => void;
  onDeliver?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onPay?: (order: OrderCardData) => void;
  onCancel?: (order: OrderCardData) => void;
  onAddItems?: (order: OrderCardData) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
  onAccept,
  onPrepare,
  onReady,
  onServe,
  onDispatch,
  onDeliver,
  onComplete,
  onPay,
  onCancel,
  onAddItems,
}) => {
  const orderId = order._id || order.id || '';

  // Safe time calculation
  const placedDate = React.useMemo(() => {
    try {
      return new Date(order.placedAt);
    } catch {
      return new Date();
    }
  }, [order.placedAt]);

  const [currentTime, setCurrentTime] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(placedDate, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  }, [placedDate, currentTime]);

  // Elapsed minutes for kitchen urgency
  const elapsedMinutes = React.useMemo(() => {
    try {
      return Math.floor((currentTime - placedDate.getTime()) / (1000 * 60));
    } catch {
      return 0;
    }
  }, [placedDate, currentTime]);

  const isUrgent =
    !['completed', 'canceled', 'cancelled', 'served', 'delivered'].includes(
      order.status
    ) && elapsedMinutes >= 20;

  const items = order.items || [];
  const totalItemCount =
    order.itemCount ?? items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  // Status visual themes
  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
      icon: Timer,
    },
    accepted: {
      label: 'Accepted',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20',
      icon: Clock,
    },
    preparing: {
      label: 'In Kitchen',
      bg: 'bg-orange-500/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/20',
      icon: ChefHat,
    },
    ready: {
      label: 'Ready',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      icon: Package,
    },
    out_for_delivery: {
      label: 'On the Way',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-500/20',
      icon: Truck,
    },
    delivered: {
      label: 'Delivered',
      bg: 'bg-teal-500/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-500/20',
      icon: CheckCircle2,
    },
    served: {
      label: 'Served',
      bg: 'bg-purple-500/10',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
      icon: CheckCircle2,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-500/10',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-500/20',
      icon: CheckCircle2,
    },
    canceled: {
      label: 'Canceled',
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      icon: XCircle,
    },
    cancelled: {
      label: 'Canceled',
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      icon: XCircle,
    },
  };

  const currentStatusConfig =
    statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = currentStatusConfig.icon;

  const tableNumber =
    typeof order.table === 'object'
      ? order.table?.tableNumber
      : order.tableNumber || (order.table as string);

  const isPaid = order.paymentStatus === 'paid';
  const isCanceled =
    order.status === 'canceled' || order.status === 'cancelled';

  const isCustomerOrQr =
    order.source === 'qr' ||
    order.source === 'web' ||
    order.source === 'customer' ||
    order.channel === 'qr' ||
    order.channel === 'web' ||
    order.isQrOrder === true ||
    (typeof (order as any).orderChannel === 'string' &&
      ((order as any).orderChannel.includes('qr') || (order as any).orderChannel.includes('web'))) ||
    (typeof (order as any).notes === 'string' && (order as any).notes.toLowerCase().includes('qr'));

  const statusBorderClass =
    order.status === 'pending'
      ? 'border-l-4 border-l-amber-500'
      : order.status === 'accepted'
      ? 'border-l-4 border-l-blue-500'
      : order.status === 'preparing'
      ? 'border-l-4 border-l-purple-500'
      : order.status === 'ready'
      ? 'border-l-4 border-l-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30'
      : order.status === 'served' || order.status === 'delivered'
      ? 'border-l-4 border-l-slate-400'
      : 'border-l-4 border-l-border';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:border-primary/40',
        statusBorderClass,
        isSelected && 'ring-2 ring-primary border-primary bg-primary/[0.02]',
        isUrgent && 'border-l-4 border-l-red-500 animate-pulse bg-red-500/[0.03] ring-1 ring-red-500/30'
      )}
    >
      {/* Top Meta Line: Order Number, Order Type, Elapsed Time */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              {order.orderNumber}
            </span>

            {/* Type badge */}
            {order.orderType === 'dine_in' && (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold px-2 py-0"
              >
                <UtensilsCrossed className="h-3 w-3 mr-1" />
                Table {tableNumber || '—'}
              </Badge>
            )}

            {order.orderType === 'delivery' && (
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-semibold px-2 py-0"
              >
                <Truck className="h-3 w-3 mr-1" />
                Delivery
              </Badge>
            )}

            {order.orderType === 'takeaway' && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold px-2 py-0"
              >
                <Package className="h-3 w-3 mr-1" />
                Takeaway
              </Badge>
            )}

            {/* QR / Online Order badge */}
            {isCustomerOrQr && (
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[10px] font-semibold px-1.5 py-0"
              >
                <QrCode className="h-3 w-3 mr-1" />
                QR Order
              </Badge>
            )}
          </div>

          {/* Time & Urgency */}
          <div className="flex items-center gap-1.5 text-right">
            {isUrgent && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] animate-pulse">
                {elapsedMinutes}m wait
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>
        </div>

        {/* Customer & Location */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {order.customerName || 'Walk-in Customer'}
            </span>
            {order.customerPhone && (
              <span className="text-[11px] opacity-75">
                • {order.customerPhone}
              </span>
            )}
          </div>

          {/* Payment Status Pill */}
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
              isPaid
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            )}
          >
            {isPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>

        {/* Delivery Address snippet (if delivery) */}
        {order.orderType === 'delivery' && order.location && (
          <div className="flex items-start gap-1 text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded-md mb-2.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
            <span className="truncate">
              {order.location.formattedAddress ||
                [
                  order.location.specificArea,
                  order.location.subCity,
                  order.location.city,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                'Delivery Address'}
            </span>
          </div>
        )}

        {/* Items Preview */}
        <div className="bg-muted/20 rounded-lg p-2 mb-3 border border-border/50 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1 border-b border-border/40">
            <span>{totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}</span>
            <span className="font-mono text-foreground font-bold">
              ETB {(order.totalAmount || 0).toLocaleString()}
            </span>
          </div>

          {items.slice(0, 3).map((item, idx) => {
            const itemName = formatOrderItemName(item);
            return (
              <div
                key={item._id || idx}
                className="flex items-center justify-between text-xs text-foreground/90"
              >
                <span className="truncate pr-2">
                  <span className="font-mono font-bold text-primary mr-1">
                    {item.quantity}x
                  </span>
                  {itemName}
                </span>
                {item.notes && (
                  <span className="text-[10px] text-amber-600 italic shrink-0">
                    "{item.notes}"
                  </span>
                )}
              </div>
            );
          })}

          {items.length > 3 && (
            <p className="text-[10px] text-muted-foreground italic pt-0.5">
              +{items.length - 3} more items...
            </p>
          )}
        </div>
      </div>

      {/* Footer: Status Badge + Action Triggers */}
      <div className="pt-2 border-t flex items-center justify-between gap-2">
        {/* Status Badge */}
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
            currentStatusConfig.bg,
            currentStatusConfig.text,
            currentStatusConfig.border
          )}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {currentStatusConfig.label}
        </Badge>

        {/* Quick Transition Action Buttons */}
        <div
          className="flex items-center gap-1.5 flex-wrap justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Serve ready or direct items */}
          {items && items.length > 0 && (
            <BulkServeButton
              orderId={orderId}
              items={items}
              className="h-7 text-xs px-2"
            />
          )}

          {/* 1. When status is 'pending': Show Accept and Prepare buttons */}
          {order.status === 'pending' && onAccept && (
            <Button
              size="sm"
              onClick={() => onAccept(orderId)}
              title="Accept order"
              className="h-7 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
          )}

          {order.status === 'pending' && onPrepare && (
            <Button
              size="sm"
              onClick={() => onPrepare(orderId)}
              title="Send to kitchen to prepare"
              className="h-7 px-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1 shadow-xs"
            >
              <ChefHat className="h-3 w-3" />
              Prepare
            </Button>
          )}

          {/* 2. When status is 'accepted': Show Prepare button to dispatch to kitchen */}
          {order.status === 'accepted' && onPrepare && (
            <Button
              size="sm"
              onClick={() => onPrepare(orderId)}
              title="Send to kitchen to prepare"
              className="h-7 px-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1 shadow-xs"
            >
              <ChefHat className="h-3 w-3" />
              Prepare
            </Button>
          )}

          {/* 3. When status is 'preparing': Accept and Prepare buttons disappear! Show in-kitchen cooking indicator */}
          {order.status === 'preparing' && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-md">
              <ChefHat className="h-3 w-3 animate-pulse text-orange-500" />
              <span>Cooking in Kitchen</span>
            </div>
          )}

          {/* 4. When status is 'ready': Show Serve button (or Dispatch for delivery) */}
          {order.status === 'ready' && (
            <>
              {order.orderType === 'delivery' ? (
                (onDispatch || onDeliver) && (
                  <Button
                    size="sm"
                    onClick={() => (onDispatch || onDeliver)?.(orderId)}
                    title="Dispatch order for delivery"
                    className="h-7 px-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1 shadow-xs"
                  >
                    <Truck className="h-3 w-3" />
                    Dispatch
                  </Button>
                )
              ) : (
                onServe && (
                  <Button
                    size="sm"
                    onClick={() => onServe(orderId)}
                    title="Mark as served to table/customer"
                    className="h-7 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs"
                  >
                    <UtensilsCrossed className="h-3 w-3" />
                    Serve
                  </Button>
                )
              )}
            </>
          )}

          {/* 5. When status is ready, served, or delivered and unpaid: Pay & Settle button appears */}
          {(order.status === 'ready' ||
            order.status === 'served' ||
            order.status === 'delivered') &&
            !isPaid &&
            !isCanceled &&
            onPay && (
              <Button
                size="sm"
                onClick={() => onPay(order)}
                title="Settle payment"
                className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
              >
                <CreditCard className="h-3 w-3" />
                Pay & Settle
              </Button>
            )}

          {/* 6. When status is served or delivered and already paid: Complete button appears */}
          {(order.status === 'served' || order.status === 'delivered') &&
            isPaid &&
            onComplete && (
              <Button
                size="sm"
                onClick={() => onComplete(orderId)}
                title="Complete order"
                className="h-7 px-2 text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white gap-1 shadow-xs"
              >
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Button>
            )}

          {/* Add Items (Pending / Accepted / Preparing) */}
          {onAddItems &&
            ['pending', 'accepted', 'preparing'].includes(order.status) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddItems(order)}
                title="Add items to order"
                className="h-7 px-1.5 text-xs hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}

          {/* Cancel button for any non-terminal order */}
          {!isCanceled &&
            order.status !== 'completed' &&
            order.status !== 'served' &&
            onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(order)}
                title="Cancel order"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
};
export default OrderCard;
