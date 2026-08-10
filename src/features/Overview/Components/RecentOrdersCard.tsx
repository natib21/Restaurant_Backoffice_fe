// src/features/Overview/Components/RecentOrdersCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import type { Order } from '@/api/Queries/orderQuery';

interface Props {
  orders: Order[];
  loading: boolean;
}

const STATUS_STYLES: Record<Order['status'], string> = {
  pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted:   'bg-blue-100 text-blue-700 border-blue-200',
  preparing:  'bg-orange-100 text-orange-700 border-orange-200',
  ready:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  served:     'bg-teal-100 text-teal-700 border-teal-200',
  completed:  'bg-gray-100 text-gray-600 border-gray-200',
  canceled:   'bg-rose-100 text-rose-600 border-rose-200',
};

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n);

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' });
};

export const RecentOrdersCard = ({ orders, loading }: Props) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-primary" />
        Recent Orders
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      {loading ? (
        <div className="px-6 pb-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground py-8">
          No orders yet today
        </div>
      ) : (
        <ul className="divide-y">
          {orders.slice(0, 8).map((order) => (
            <li
              key={order._id}
              className="px-6 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
            >
              {/* Order number */}
              <span className="text-xs font-mono font-bold text-primary shrink-0 w-20 truncate">
                {order.orderNumber}
              </span>

              {/* Customer + table */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
                  {' · '}
                  {formatTime(order.placedAt)}
                </p>
              </div>

              {/* Amount */}
              <span className="text-sm font-semibold tabular-nums shrink-0">
                {formatETB(order.totalAmount)}
              </span>

              {/* Status */}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                  STATUS_STYLES[order.status]
                }`}
              >
                {order.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);
