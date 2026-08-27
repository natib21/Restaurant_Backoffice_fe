import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCancelOrderMutation } from '@/api/Queries/orderQuery';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderNumber: string;
    customerName?: string;
    status: string;
  } | null;
}

const CANCEL_REASONS = [
  'Customer changed mind',
  'Customer walked out / No show',
  'Kitchen out of stock / ingredients',
  'Order placed by mistake / duplicate',
  'Delivery address unreachable / no response',
  'Long preparation wait time',
  'Payment declined / refused',
  'Other (specify below)',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  const { mutate: cancelOrder, isPending } = useCancelOrderMutation();

  if (!order) return null;

  const handleConfirmCancel = () => {
    const finalReason =
      selectedPreset === 'Other (specify below)'
        ? customReason.trim() || 'Canceled by staff'
        : customReason.trim()
        ? `${selectedPreset} - ${customReason.trim()}`
        : selectedPreset;

    cancelOrder(
      { orderId: order._id, reason: finalReason },
      {
        onSuccess: () => {
          setCustomReason('');
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-destructive">
                Cancel Order {order.orderNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to cancel this order? This will release table/inventory and cancel any open kitchen tickets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Reason for Cancellation
            </Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason} className="text-xs">
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Additional Notes (Optional)
            </Label>
            <Textarea
              placeholder="Add details for auditing purposes..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirmCancel}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>Confirm Cancel</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default CancelOrderModal;
