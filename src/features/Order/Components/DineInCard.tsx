// src/components/DineInCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, UtensilsCrossed, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatOrderItemName } from '../lib/orderUtils';
// import { formatOrderItemName } from '../lib/orderUtils';

interface DineInCardProps {
  order: any;
  onClick: () => void;
}

const statusStyles: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  seated: {
    label: 'Seated',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  ordered: {
    label: 'Ordered',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
  },
  preparing: {
    label: 'Preparing',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
  },
  ready: {
    label: 'Ready',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
  served: {
    label: 'Served',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  billing: {
    label: 'Billing',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  paid: {
    label: 'Paid',
    color: 'text-gray-700',
    bg: 'bg-gray-100 border-gray-300',
  },
  closed: {
    label: 'Closed',
    color: 'text-gray-700',
    bg: 'bg-gray-100 border-gray-300',
  },
};

const DineInCard: React.FC<DineInCardProps> = ({ order, onClick }) => {
  const status = order.status?.toLowerCase() || 'seated';
  const style = statusStyles[status] || {
    label: status,
    color: 'text-gray-700',
    bg: 'bg-gray-50',
  };

  const timeDisplay = order.createdAt
    ? format(new Date(order.createdAt), 'HH:mm')
    : '—';

  const itemCount = order.items?.length || 0;
  const firstItem = order.items?.[0] ? formatOrderItemName(order.items[0]) : '—';

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow duration-200 border-2',
        style.bg,
        status === 'ready' || status === 'served'
          ? 'border-green-400 shadow-green-100'
          : status === 'preparing'
            ? 'border-orange-400'
            : ''
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">
              Table {order.tableNumber || '?'}
              {order.orderNumber && ` • #${order.orderNumber}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeDisplay}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'px-3 py-1 text-xs font-semibold',
              style.color,
              style.bg
            )}
          >
            {style.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Guests & Server */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{order.guestCount || '?'} guests</span>
          </div>
          {order.serverName && (
            <span className="text-muted-foreground">
              Server: {order.serverName}
            </span>
          )}
        </div>

        {/* Items summary */}
        <div className="flex items-start gap-2 text-sm">
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground mt-0.5" />
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

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center gap-1.5 font-bold text-base">
            <Banknote className="h-4 w-4" />
            {order.totalAmount?.toFixed(2) || '—'} ETB
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DineInCard;
