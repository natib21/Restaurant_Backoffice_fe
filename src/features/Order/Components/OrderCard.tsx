// src/features/Orders/components/OrderCard.tsx
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
  Utensils,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: {
    _id?: string;
    id?: string;
    orderNumber: string;
    orderType: 'dine_in' | 'delivery' | 'takeaway';
    branch?: {
      _id: string;
      name: string;
    };
    table?: {
      _id: string;
      tableNumber: string;
    };
    customerName?: string;
    itemCount: number; // Based on your JSON
    totalAmount: number; // Based on your JSON
    status:
      | 'pending'
      | 'accepted'
      | 'preparing'
      | 'ready'
      | 'served'
      | 'completed'
      | 'cancelled'
      | 'out_for_delivery';
    placedAt: string;
    paymentStatus: 'paid' | 'unpaid';
  };
  showCompletedTime?: boolean;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showCompletedTime = false,
  onClick,
}) => {
  // Safe date parsing
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(order.placedAt), { addSuffix: true });
    } catch (e) {
      return 'Just now';
    }
  }, [order.placedAt]);

  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-slate-100 text-slate-700',
      icon: Timer,
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-blue-100 text-blue-700',
      icon: Clock,
    },
    preparing: {
      label: 'Preparing',
      color: 'bg-orange-100 text-orange-700',
      icon: AlertCircle,
    },
    ready: {
      label: 'Ready',
      color: 'bg-yellow-100 text-yellow-700',
      icon: Package,
    },
    served: {
      label: 'Served',
      color: 'bg-indigo-100 text-indigo-700',
      icon: CheckCircle2,
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-700',
      icon: XCircle,
    },
    out_for_delivery: {
      label: 'On Way',
      color: 'bg-purple-100 text-purple-700',
      icon: Truck,
    },
  };

  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  console.log(order);
  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-white border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all hover:shadow-xl hover:border-primary/40 active:scale-[0.98]',
        order.status === 'ready' &&
          'ring-2 ring-yellow-400 ring-offset-2 shadow-yellow-100',
        order.status === 'pending' && 'border-amber-200 bg-amber-50/30'
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {order.orderNumber}
            </span>
            {order.paymentStatus === 'unpaid' && (
              <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                UNPAID
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
            {/* Table Mapping */}
            {order.table?.tableNumber ? (
              <div className="flex items-center gap-1 text-primary">
                <Utensils className="h-3.5 w-3.5" />
                <span>Table {order.table.tableNumber}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 capitalize">
                {order.orderType === 'delivery' ? (
                  <Truck className="h-3.5 w-3.5" />
                ) : (
                  <Package className="h-3.5 w-3.5" />
                )}
                <span>{order.orderType.replace('_', ' ')}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span className="truncate max-w-[100px]">
                {order.customerName}
              </span>
            </div>
            {order.branch?.name && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-bold text-[10px] uppercase">
                <MapPin className="h-3 w-3" />
                <span>{order.branch.name}</span>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm',
            config.color
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {config.label}
        </div>
      </div>

      {/* Body Info */}
      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            Items
          </p>
          <p className="text-sm font-bold text-slate-700">
            {order.itemCount} {order.itemCount === 1 ? 'Item' : 'Items'}
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            Elapsed
          </p>
          <p className="text-sm font-bold text-slate-700">{timeAgo}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          {order.status === 'pending' && (
            <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold animate-pulse">
              <AlertCircle className="h-3 w-3" /> NEW ORDER
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
            Total Amount
          </p>
          <p className="text-xl font-black text-primary tracking-tight">
            ETB {order.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
