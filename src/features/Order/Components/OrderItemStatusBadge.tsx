import React from 'react';
import { Clock, ChefHat, CheckCircle2, XCircle, Bell, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ItemStatus } from '@/api/Queries/orderQuery';

interface OrderItemStatusBadgeProps {
  status?: ItemStatus | string;
  requiresKitchen?: boolean;
  className?: string;
}

export const OrderItemStatusBadge: React.FC<OrderItemStatusBadgeProps> = ({
  status = 'pending',
  requiresKitchen = true,
  className,
}) => {
  const normStatus = (status || 'pending').toLowerCase();

  switch (normStatus) {
    case 'ready':
      return (
        <Badge
          className={cn(
            'bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-2 py-0.5 shadow-xs flex items-center gap-1 animate-pulse',
            className
          )}
        >
          <Bell className="h-3 w-3" />
          Ready for Pickup
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge
          className={cn(
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-semibold text-[10px] px-2 py-0.5 flex items-center gap-1 border',
            className
          )}
        >
          <ChefHat className="h-3 w-3 text-blue-500 animate-spin" style={{ animationDuration: '4s' }} />
          In Kitchen
        </Badge>
      );
    case 'served':
      return (
        <Badge
          className={cn(
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-[10px] px-2 py-0.5 flex items-center gap-1 border',
            className
          )}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Served
        </Badge>
      );
    case 'void':
      return (
        <Badge
          className={cn(
            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-semibold text-[10px] px-2 py-0.5 flex items-center gap-1 border line-through',
            className
          )}
        >
          <XCircle className="h-3 w-3 text-rose-500" />
          Voided
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800 font-medium text-[10px] px-2 py-0.5 flex items-center gap-1',
            className
          )}
        >
          <Clock className="h-3 w-3 text-slate-400" />
          Pending
        </Badge>
      );
  }
};
