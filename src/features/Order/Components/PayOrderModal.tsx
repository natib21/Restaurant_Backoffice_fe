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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMarkOrderAsPaidMutation, useUpdateOrderStatusMutation } from '@/api/Queries/orderQuery';
import { playOrderSound } from '@/features/Order/lib/soundPlayer';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Upload,
  Receipt,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PayOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    subtotal?: number;
    deliveryFee?: number;
    taxAmount?: number;
    status: string;
    paymentStatus: string;
  } | null;
}

export const PayOrderModal: React.FC<PayOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'mobile_banking' | 'card'
  >('cash');
  const [bankName, setBankName] = useState<string>('Telebirr');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutate: markAsPaid, isPending: isPaying } = useMarkOrderAsPaidMutation();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatusMutation();

  const isPending = isPaying || isUpdatingStatus;

  if (!order) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Receipt image must be less than 5MB');
        return;
      }
      setReceiptImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSettlePayment = () => {
    if (order.status === 'canceled') {
      toast.error('Cannot mark a canceled order as paid');
      return;
    }

    let payload: any;
    if (receiptImage) {
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      if (paymentMethod === 'mobile_banking') {
        formData.append('bankName', bankName);
      }
      formData.append('image', receiptImage);
      payload = formData;
    } else {
      payload = {
        paymentMethod,
        ...(paymentMethod === 'mobile_banking' ? { bankName } : {}),
      };
    }

    markAsPaid(
      { orderId: order._id, data: payload },
      {
        onSuccess: async () => {
          playOrderSound();
          // If the order was served or delivered or ready, complete it
          if (['served', 'delivered', 'ready'].includes(order.status)) {
            try {
              updateStatus({ orderId: order._id, status: 'completed' });
            } catch (err) {
              console.error('Failed to transition to completed', err);
            }
          }
          toast.success(`Order ${order.orderNumber} settled & completed!`);
          handleRemoveImage();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Settle Payment
              </DialogTitle>
              <DialogDescription className="text-xs">
                Order <span className="font-semibold text-foreground">{order.orderNumber}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Bill Summary */}
          <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2 text-sm">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>ETB {(order.subtotal || order.totalAmount || 0).toLocaleString()}</span>
            </div>
            {order.deliveryFee ? (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Delivery Fee</span>
                <span>ETB {order.deliveryFee.toLocaleString()}</span>
              </div>
            ) : null}
            <div className="border-t pt-2 flex justify-between items-center font-bold text-base text-foreground">
              <span>Total Amount Due</span>
              <span className="text-primary font-mono text-lg">
                ETB {(order.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Method
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground'
                )}
              >
                <Banknote className="h-4 w-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_banking')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
                  paymentMethod === 'mobile_banking'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground'
                )}
              >
                <Smartphone className="h-4 w-4" />
                <span>Mobile Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground'
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span>POS / Card</span>
              </button>
            </div>
          </div>

          {/* Provider Selector for Mobile Banking */}
          {paymentMethod === 'mobile_banking' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <Label className="text-xs font-semibold text-muted-foreground">
                Select Bank / Provider
              </Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select bank or mobile wallet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Telebirr">Telebirr</SelectItem>
                  <SelectItem value="CBE_Birr">CBE / CBE Birr</SelectItem>
                  <SelectItem value="Awash_Bank">Awash Bank</SelectItem>
                  <SelectItem value="Bank_of_Abyssinia">Bank of Abyssinia (BOA)</SelectItem>
                  <SelectItem value="Dashen_Amole">Dashen Bank / Amole</SelectItem>
                  <SelectItem value="Coop_Bank">Cooperative Bank of Oromia</SelectItem>
                  <SelectItem value="Zemen_Bank">Zemen Bank</SelectItem>
                  <SelectItem value="Other_Bank">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Receipt Proof Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Receipt Proof (Optional)</span>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-destructive hover:underline text-[11px]"
                >
                  Remove
                </button>
              )}
            </Label>

            {previewUrl ? (
              <div className="relative rounded-lg border overflow-hidden bg-black/5 h-28 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">
                  Click to upload customer receipt screenshot
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSettlePayment}
            disabled={isPending || order.status === 'canceled'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirm Payment (ETB {order.totalAmount?.toLocaleString()})</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default PayOrderModal;
