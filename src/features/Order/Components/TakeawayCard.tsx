// src/components/TakeawayCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, Banknote, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { formatOrderItemName } from '../lib/orderUtils';
interface TakeawayCardProps {
  order: any; // replace with your proper Order type when you have one
  onClick: () => void;
}

const statusStyles: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100 border-yellow-300',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bg: 'bg-blue-100 border-blue-300',
  },
  preparing: {
    label: 'Preparing',
    color: 'text-orange-700',
    bg: 'bg-orange-100 border-orange-300',
  },
  ready: {
    label: 'Ready',
    color: 'text-green-700',
    bg: 'bg-green-100 border-green-300',
  },
  awaiting_pickup: {
    label: 'Ready for Pickup',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100 border-emerald-300',
  },
  picked_up: {
    label: 'Picked Up',
    color: 'text-purple-700',
    bg: 'bg-purple-100 border-purple-300',
  },
  collected: {
    label: 'Collected',
    color: 'text-gray-700',
    bg: 'bg-gray-200 border-gray-400',
  },
  completed: {
    label: 'Completed',
    color: 'text-gray-700',
    bg: 'bg-gray-200 border-gray-400',
  },
};

const TakeawayCard: React.FC<TakeawayCardProps> = ({ order, onClick }) => {
  const status = order.status?.toLowerCase() || 'pending';
  const style = statusStyles[status] || {
    label: status,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  };

  // Optional: show how long ago the order was placed
  const timeAgo = order.createdAt
    ? format(new Date(order.createdAt), 'HH:mm') +
      ' • ' +
      formatDistanceToNow(new Date(order.createdAt))
    : '—';

  // Example: estimated ready time (if your backend sends it)
  const readyTime = order.estimatedReadyTime
    ? format(new Date(order.estimatedReadyTime), 'HH:mm')
    : null;

  const itemCount = order.items?.length || 0;
  const firstItem = order.items?.[0] ? formatOrderItemName(order.items[0]) : '—';

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow duration-200 border-2',
        style.bg,
        status === 'ready' || status === 'awaiting_pickup'
          ? 'border-green-400 shadow-green-100'
          : ''
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">
              #{order.orderNumber || '—'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{timeAgo}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'px-3 py-1 text-xs font-semibold',
              style.color,
              style.bg.replace('bg-', 'border-').replace('100', '300')
            )}
          >
            {style.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Customer */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {order.customerName || 'Customer'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{order.customerPhone || '—'}</span>
        </div>

        {/* Items summary */}
        <div className="flex items-start gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </p>
            <p className="text-muted-foreground line-clamp-1">
              {firstItem}
              {itemCount > 1 ? ` + ${itemCount - 1} more` : ''}
            </p>
          </div>
        </div>

        {/* Price & Ready time */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center gap-1.5 font-bold text-base">
            <Banknote className="h-4 w-4" />
            {order.totalAmount?.toFixed(2) || '—'} ETB
          </div>

          {readyTime && (
            <div className="flex items-center gap-1.5 text-sm text-green-700">
              <Clock className="h-3.5 w-3.5" />
              Ready by {readyTime}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TakeawayCard;
