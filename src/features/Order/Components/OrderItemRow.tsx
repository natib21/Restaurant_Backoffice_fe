import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Utensils,
  ChefHat,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const navigate = useNavigate();
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isKdsInfoModalOpen, setIsKdsInfoModalOpen] = useState(false);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderItemStatusMutation();

  const itemId = item._id || (item as any).id;
  const status = (item.status || 'pending').toLowerCase();
  const requiresKitchen = item.requiresKitchen !== false;
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
            {!requiresKitchen && (
              <Badge
                variant="outline"
                className="text-[10px] bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                Direct Serve (No Kitchen)
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
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* 1. Kitchen Item Ready -> Serve Button */}
            {requiresKitchen && isReady && (
              <Button
                size="sm"
                onClick={handleServe}
                disabled={isUpdating}
                className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1"
                title="Mark this kitchen item as served to customer"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Mark Served
              </Button>
            )}

            {/* 2. Kitchen Item in pending/in_progress -> Go to KDS / Kitchen Queue */}
            {requiresKitchen && (isPending || isInProgress) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsKdsInfoModalOpen(true)}
                className="h-7 px-2 text-[11px] font-semibold rounded-lg text-primary border-primary/30 hover:bg-primary/5 gap-1"
                title="View item in Kitchen Display System (KDS)"
              >
                <ChefHat className="h-3.5 w-3.5" />
                <span>Go to KDS</span>
              </Button>
            )}

            {/* 3. Non-Kitchen Item (Direct Serve) -> Status dropdown selector & quick serve */}
            {!requiresKitchen && !isVoid && (
              <div className="flex items-center gap-1">
                {isPending && (
                  <Button
                    size="sm"
                    onClick={handleServe}
                    disabled={isUpdating}
                    className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1"
                    title="Direct serve non-kitchen item"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Mark Served
                  </Button>
                )}

                <select
                  value={status}
                  onChange={(e) => {
                    if (!itemId) return;
                    updateStatus(
                      { orderId, itemId, status: e.target.value as any },
                      { onSuccess: () => onRefresh?.() }
                    );
                  }}
                  disabled={isUpdating}
                  className="h-7 text-xs font-semibold rounded-lg bg-background border border-input px-2 py-0.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  title="Change non-kitchen item status"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                </select>
              </div>
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

      {/* Kitchen Preparation Required Modal */}
      <Dialog open={isKdsInfoModalOpen} onOpenChange={setIsKdsInfoModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-5">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <ChefHat className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Kitchen Preparation Required
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{formatOrderItemName(item)}</strong> is a kitchen-prepared item. Per standard workflow rules, kitchen items cannot be manually marked ready from the waiter screen.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1.5 my-2">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              Kitchen Workflow:
            </p>
            <p className="text-muted-foreground text-[11px]">
              1. Kitchen staff starts cooking in KDS station.<br />
              2. KDS marks ticket as <strong>Ready</strong> upon completion.<br />
              3. Waiter receives real-time notification to serve the food.
            </p>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsKdsInfoModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsKdsInfoModalOpen(false);
                navigate('/kds');
              }}
              className="text-xs bg-primary font-bold gap-1"
            >
              <span>Open KDS Screen</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
