import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RotateCcw, Utensils, ChefHat, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatOrderItemName } from '../lib/orderUtils';
import { OrderItemStatusBadge } from './OrderItemStatusBadge';
import { VoidItemModal } from './VoidItemModal';
import {
  useUpdateOrderItemStatusMutation,
  type OrderItem,
} from '@/api/Queries/orderQuery';

interface OrderItemRowProps {
  orderId: string;
  item: OrderItem;
  readOnly?: boolean;
  className?: string;
  onRefresh?: () => void;
}

export const OrderItemRow: React.FC<OrderItemRowProps> = ({
  orderId,
  item,
  readOnly = false,
  className,
  onRefresh,
}) => {
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderItemStatusMutation();

  const itemId = item._id || (item as any).id;
  const status = (item.status || 'pending').toLowerCase();
  const isReady = status === 'ready';
  const isServed = status === 'served';
  const isVoid = status === 'void';
  const isPending = status === 'pending';
  const isInProgress = status === 'in_progress';

  const itemTotal =
    item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1);

  const handleServe = () => {
    if (!itemId) return;
    updateStatus(
      { orderId, itemId, status: 'served' },
      { onSuccess: () => onRefresh?.() }
    );
  };

  const handleSetReady = () => {
    if (!itemId) return;
    updateStatus(
      { orderId, itemId, status: 'ready' },
      { onSuccess: () => onRefresh?.() }
    );
  };

  const formatServedTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    try {
      return new Date(timeStr).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div
      className={cn(
        'p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors border-b last:border-b-0',
        isVoid && 'opacity-60 bg-rose-50/20 dark:bg-rose-950/10',
        className
      )}
    >
      {/* Left side: Quantity, Name, Badges, Notes */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5',
            isVoid
              ? 'bg-muted text-muted-foreground line-through'
              : isServed
              ? 'bg-emerald-600 text-white'
              : isReady
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {item.quantity}x
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'font-bold text-sm text-foreground leading-snug',
                isVoid && 'line-through text-muted-foreground'
              )}
            >
              {formatOrderItemName(item)}
            </span>

            {/* Item Workflow Status Badge */}
            <OrderItemStatusBadge
              status={item.status}
              requiresKitchen={item.requiresKitchen}
            />

            {/* Direct Service (No kitchen) Tag */}
            {item.requiresKitchen === false && (
              <Badge
                variant="outline"
                className="text-[10px] bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                Direct Serve
              </Badge>
            )}

            {/* Replacement Badges */}
            {item.replacedItemId && (
              <Badge
                variant="outline"
                className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 font-bold flex items-center gap-0.5"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Replacement
              </Badge>
            )}
            {item.replacementItemId && (
              <span className="text-[10px] text-muted-foreground italic">
                (Replaced by new dish)
              </span>
            )}
          </div>

          {/* Unit Price & Modifiers */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            {item.unitPrice ? (
              <span>ETB {Number(item.unitPrice).toFixed(2)} each</span>
            ) : null}
          </div>

          {item.modifiers && item.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.modifiers.map((m: any, mIdx: number) => (
                <span
                  key={mIdx}
                  className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium"
                >
                  + {m.name} ({m.price ? `ETB ${m.price}` : 'Free'})
                </span>
              ))}
            </div>
          )}

          {/* Special Instructions / Notes */}
          {item.notes && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic bg-amber-500/10 px-2 py-0.5 rounded-md inline-block">
              Note: "{item.notes}"
            </p>
          )}

          {/* Served Details Log */}
          {isServed && item.servedAt && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium pt-0.5">
              <CheckCircle2 className="h-3 w-3" />
              Served at {formatServedTime(item.servedAt)}
              {item.servedVia && (
                <span className="capitalize">({item.servedVia})</span>
              )}
              {typeof item.servedBy === 'object' && item.servedBy?.fullName && (
                <span>by {item.servedBy.fullName}</span>
              )}
            </p>
          )}

          {/* Voided Details Log */}
          {isVoid && item.voidReason && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 pt-0.5">
              <XCircle className="h-3 w-3 shrink-0" />
              Reason: "{item.voidReason}"
              {item.voidedAt && (
                <span className="text-muted-foreground text-[10px]">
                  ({formatServedTime(item.voidedAt)})
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Price & Interactive Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
        <div className="text-left sm:text-right">
          <span
            className={cn(
              'font-mono font-bold text-sm text-foreground',
              isVoid && 'line-through text-muted-foreground'
            )}
          >
            ETB {Number(itemTotal).toFixed(2)}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            {/* Quick Serve Action for Ready Items */}
            {isReady && (
              <Button
                size="sm"
                onClick={handleServe}
                disabled={isUpdating}
                className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1"
                title="Mark this item as served to customer"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Serve
              </Button>
            )}

            {/* Quick Mark Ready (Optional helper for waiters/service) */}
            {(isInProgress || isPending) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSetReady}
                disabled={isUpdating}
                className="h-7 px-2 text-[11px] font-semibold rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30"
                title="Mark item ready"
              >
                Mark Ready
              </Button>
            )}

            {/* Void Item Button (can void pending, in-progress, ready, or served items) */}
            {!isVoid && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVoidModalOpen(true)}
                className="h-7 px-2 text-[11px] font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                title="Void this item from order"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Void
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Void Modal Dialog */}
      <VoidItemModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        orderId={orderId}
        item={item}
        onSuccess={() => onRefresh?.()}
      />
    </div>
  );
};

export default OrderItemRow;
