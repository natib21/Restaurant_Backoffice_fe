import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useBulkServeReadyItemsMutation, type OrderItem } from '@/api/Queries/orderQuery';
import { cn } from '@/lib/utils';

interface BulkServeButtonProps {
  orderId: string;
  items?: OrderItem[];
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const BulkServeButton: React.FC<BulkServeButtonProps> = ({
  orderId,
  items = [],
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const { mutate: bulkServe, isPending } = useBulkServeReadyItemsMutation();

  const readyItems = items.filter(
    (item) => (item.status || 'pending').toLowerCase() === 'ready'
  );

  if (readyItems.length === 0) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        bulkServe({ orderId });
      }}
      disabled={isPending}
      className={cn(
        'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs transition-all animate-bounce',
        className
      )}
      style={{ animationIterationCount: 2 }}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      <span>
        Serve All Ready ({readyItems.length})
      </span>
    </Button>
  );
};

export default BulkServeButton;
