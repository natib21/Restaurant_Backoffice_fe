import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles, Utensils } from 'lucide-react';
import { useBulkServeReadyItemsMutation, useUpdateOrderItemStatusMutation, type OrderItem } from '@/api/Queries/orderQuery';
import { cn } from '@/lib/utils';

interface BulkServeButtonProps {
  orderId: string;
  items?: any[];
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}

export const BulkServeButton: React.FC<BulkServeButtonProps> = ({
  orderId,
  items = [],
  variant = 'default',
  size = 'sm',
  className,
  onSuccess,
}) => {
  const { mutate: bulkServe, isPending } = useBulkServeReadyItemsMutation();

  const readyItems = items.filter(
    (item) => (item.status || 'pending').toLowerCase() === 'ready'
  );

  const directPendingItems = items.filter(
    (item) => item.requiresKitchen === false && (item.status || 'pending').toLowerCase() === 'pending'
  );

  const totalServable = readyItems.length + directPendingItems.length;

  if (totalServable === 0) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        bulkServe(
          { orderId },
          {
            onSuccess: () => {
              onSuccess?.();
            },
          }
        );
      }}
      disabled={isPending}
      className={cn(
        'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs transition-all',
        readyItems.length > 0 && 'animate-pulse',
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      <span>
        {readyItems.length > 0
          ? `Serve Ready Items (${readyItems.length})`
          : `Serve Direct Items (${directPendingItems.length})`}
      </span>
    </Button>
  );
};

export default BulkServeButton;
