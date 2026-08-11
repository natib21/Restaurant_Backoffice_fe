import { useParams, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Printer,
  User,
  CheckCircle2,
  Users,
  Timer,
  XCircle,
  ChevronRight,
  Loader2,
  CreditCard,
  Wallet,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/lib/Socket';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
// RTK Query hooks
import {
  useOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useMarkOrderAsPaidMutation,
} from '../../../api/Queries/orderQuery';

type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'canceled';
const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const navigate = useNavigate();

  const socket = useSocket();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_banking'>(
    'cash'
  );
  const [selectedBank, setSelectedBank] = useState<string>('CBE');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useOrderByIdQuery(orderId);
  const { mutate: updateStatus } = useUpdateOrderStatusMutation();
  const { mutate: markAsPaid, isLoading: isPaying } =
    useMarkOrderAsPaidMutation();
  const confirmPayment = async () => {
    try {
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      if (paymentMethod === 'mobile_banking') {
        formData.append('bankName', selectedBank);
      }
      if (receiptImage) {
        formData.append('image', receiptImage);
      }

      // Assuming your markAsPaid mutation can handle FormData
      await markAsPaid(
        { orderId: order._id, data: formData },
        {
          onSuccess: () => {
            setIsConfirmOpen(false);
            // Clear local states for next time
            setReceiptImage(null);
            setPreviewUrl(null);
          },
        }
      );
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };
  useEffect(() => {
    if (!socket || !orderId) return;

    const handleOrderUpdate = (payload: any) => {
      const updatedOrderId = payload.orderId || payload._id;

      if (updatedOrderId === orderId) {
        refetch();
      }
    };
    socket.on('order:status-updated', handleOrderUpdate);
    socket.on('order-paid', handleOrderUpdate);
    socket.on('order:canceled', handleOrderUpdate);
    return () => {
      socket.off('order:status-updated', handleOrderUpdate);
      socket.off('order-paid', handleOrderUpdate);
      socket.off('order:canceled', handleOrderUpdate);
    };
  }, [socket, orderId, refetch]);
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <Skeleton className="h-12 w-64" />

        <Skeleton className="h-32 w-full" />

        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />

          <div className="space-y-6">
            <Skeleton className="h-32" />

            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center">
        <p className="text-destructive text-lg font-medium">Order not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-primary hover:underline"
        >
          ← Go back
        </button>
      </div>
    );
  }
console.log("orderId from params:", orderId);
  const currentStatus = order.status as OrderStatus;

  const isPaid = order.paymentStatus === 'paid';

  const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
    pending: {
      label: 'Pending',
      color: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    },
    preparing: {
      label: 'Preparing',
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
    },
    ready: {
      label: 'Ready',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    },
    served: {
      label: 'Served',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    },
    completed: {
      label: 'Completed',
      color: 'bg-gray-900 text-white border-transparent',
    },
    canceled: {
      label: 'Canceled',
      color: 'bg-red-500/10 text-red-600 border-red-200',
    },
  };

  const handleJoinRequest = async () => {
    let nextStatus: OrderStatus = currentStatus;
    if (currentStatus === 'pending') nextStatus = 'accepted';
    else if (currentStatus === 'accepted' || currentStatus === 'ready')
      nextStatus = 'preparing';
    if (nextStatus !== currentStatus) {
      await updateStatus({ orderId: order._id, status: nextStatus });
    }
  };
  const handleNextStep = async () => {
    const sequence: OrderStatus[] = [
      'pending',
      'accepted',
      'preparing',
      'ready',
      'served',
      'completed',
    ];
    const currentIndex = sequence.indexOf(currentStatus);
    if (currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      await updateStatus({ orderId: order._id, status: nextStatus });
    }
  };
  const handleCancel = async () => {
    await updateStatus({ orderId: order._id, status: 'canceled' });
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight">
                {order.orderNumber}
              </h1>

              <Badge
                className={cn(
                  'px-3 py-0.5 font-bold uppercase tracking-wider text-[10px]',
                  statusConfig[currentStatus].color
                )}
              >
                {statusConfig[currentStatus].label}
              </Badge>

              <Badge
                variant={isPaid ? 'success' : 'warning'}
                className={cn(
                  isPaid
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                )}
              >
                {isPaid ? 'PAID' : 'UNPAID'}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {order.table?.tableNumber
                ? `Table ${order.table?.tableNumber}`
                : 'N/A'}{' '}
              • {order.orderType.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentStatus !== 'completed' && currentStatus !== 'canceled' && (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors rounded-lg border border-red-200"
              >
                <XCircle className="h-4 w-4" /> Cancel
              </button>

              {(currentStatus === 'pending' ||
                currentStatus === 'accepted') && (
                <button
                  onClick={handleJoinRequest}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Users className="h-4 w-4" />

                  {currentStatus === 'pending'
                    ? 'Join as Waiter'
                    : 'Join as Chef'}
                </button>
              )}

              {currentStatus !== 'pending' && currentStatus !== 'completed' && (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all"
                >
                  Move to Next Step <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* FIX: Show only when served and unpaid */}

              {currentStatus === 'served' && !isPaid && (
                <button
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isPaying}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all min-w-[140px] justify-center"
                >
                  Mark as Paid 💳
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* STATUS TRACKER */}

      <div className="bg-card border rounded-xl p-2 shadow-sm">
        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-8 text-center">
          Order Journey
        </h3>

        <div className="relative flex justify-between items-start max-w-3xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-0" />

          {(
            [
              'pending',
              'accepted',
              'preparing',
              'ready',
              'served',
              'completed',
            ] as OrderStatus[]
          ).map((step, idx) => {
            const steps = [
              'pending',
              'accepted',
              'preparing',
              'ready',
              'served',
              'completed',
            ];

            const currentIndex = steps.indexOf(currentStatus);

            const isCompleted = idx < currentIndex;

            const isCurrent = step === currentStatus;

            return (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center gap-3"
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center border-4 transition-all duration-500',

                    isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isCurrent
                        ? 'bg-background border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                        : 'bg-background border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                <div className="text-center">
                  <p
                    className={cn(
                      'text-[10px] font-black uppercase tracking-tighter',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}

        <div className="lg:col-span-2 bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h3 className="font-bold">Items Summary</h3>

            <button className="text-xs font-bold text-primary flex items-center gap-1">
              <Printer className="h-3 w-3" /> Print Ticket
            </button>
          </div>

          <div className="divide-y">
            {order.items.map((item: any, i: number) => (
              <div
                key={i}
                className="p-4 flex justify-between items-center hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-mono font-bold">
                    {item.quantity}x
                  </div>

                  <div>
                    <p className="font-bold text-sm">
                      {item.name || item.menuItem?.name}
                    </p>

                    {item.notes && (
                      <p className="text-xs text-orange-600 font-medium italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <p className="font-mono font-bold text-sm">
                  ${item.totalPrice.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-50 border-t">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Subtotal: ${order.subtotal.toFixed(2)}
                </p>

                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Tax: ${(order.totalAmount - order.subtotal).toFixed(2)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Total Due
                </p>

                <p className="text-3xl font-black text-primary">
                  ${order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff & Timeline */}

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              Handling Staff
            </h3>

            <div className="space-y-3">
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  order.assignedWaiter
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-muted/20 border-dashed'
                )}
              >
                <div className="p-2 bg-white rounded-md shadow-sm">
                  <User className="h-4 w-4 text-blue-600" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground">
                    Waiter
                  </p>

                  <p className="text-sm font-bold">
                    {order.placedBy?.firstName} {order.placedBy?.lastName || ''}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  order.assignedKitchenStaff
                    ? 'bg-orange-50 border-orange-100'
                    : 'bg-muted/20 border-dashed'
                )}
              >
                <div className="p-2 bg-white rounded-md shadow-sm">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground">
                    Kitchen
                  </p>

                  <p className="text-sm font-bold">
                    {order.assignedKitchenStaff?.fullName ||
                      'Waiting for Kitchen...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />

              <span className="text-xs font-bold uppercase tracking-widest">
                Live Updates
              </span>
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4 py-1">
                <p className="text-xs font-bold">
                  Placed at {new Date(order.placedAt).toLocaleTimeString()}
                </p>

                <p className="text-[11px] text-slate-400">Order received</p>
              </div>

              {order.acceptedAt && (
                <div className="border-l-2 border-blue-400 pl-4 py-1">
                  <p className="text-xs font-bold">
                    {new Date(order.acceptedAt).toLocaleTimeString()}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Accepted by waiter
                  </p>
                </div>
              )}

              {order.readyAt && (
                <div className="border-l-2 border-emerald-400 pl-4 py-1">
                  <p className="text-xs font-bold">
                    {new Date(order.readyAt).toLocaleTimeString()}
                  </p>

                  <p className="text-[11px] text-slate-400">Ready for pickup</p>
                </div>
              )}

              {order.servedAt && (
                <div className="border-l-2 border-purple-400 pl-4 py-1">
                  <p className="text-xs font-bold">
                    {new Date(order.servedAt).toLocaleTimeString()}
                  </p>

                  <p className="text-[11px] text-slate-400">Served to table</p>
                </div>
              )}

              {order.completedAt && (
                <div className="border-l-2 border-gray-400 pl-4 py-1">
                  <p className="text-xs font-bold">
                    {new Date(order.completedAt).toLocaleTimeString()}
                  </p>

                  <p className="text-[11px] text-slate-400">Order completed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {isPaying && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[50] flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-white text-[10px] font-black uppercase tracking-widest">
                  Verifying Payment...
                </p>
              </div>
            </div>
          )}
          <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Verification
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Recording manual payment for Order #{order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {/* SCROLLABLE BODY */}
          <div
            className={cn(
              'p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar',
              isPaying && 'pointer-events-none opacity-50'
            )}
          >
            {/* Payment Method Toggle */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Select Method
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isPaying}
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-bold text-sm',
                    paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-100 text-slate-500'
                  )}
                >
                  <Wallet className="h-4 w-4" /> Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('mobile_banking')}
                  className={cn(
                    'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-bold text-sm',
                    paymentMethod === 'mobile_banking'
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  )}
                >
                  <ImageIcon className="h-4 w-4" /> Mobile
                </button>
              </div>
            </div>

            {paymentMethod === 'mobile_banking' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Choose Bank / Platform
                  </Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="w-full h-12 rounded-xl border-2 font-bold focus:ring-primary bg-background">
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-xl">
                      <SelectItem value="CBE" className="font-bold py-3">
                        CBE (Commercial Bank)
                      </SelectItem>
                      <SelectItem value="telebirr" className="font-bold py-3">
                        Telebirr
                      </SelectItem>
                      <SelectItem value="Abyssinia" className="font-bold py-3">
                        Bank of Abyssinia
                      </SelectItem>
                      <SelectItem value="Awash" className="font-bold py-3">
                        Awash Bank
                      </SelectItem>
                      <SelectItem value="MPesa" className="font-bold py-3">
                        M-Pesa / Safaricom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Proof of Payment (Screenshot/Bill)
                  </Label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3',
                        previewUrl
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-200 group-hover:border-primary group-hover:bg-slate-50'
                      )}
                    >
                      {previewUrl ? (
                        <div className="relative w-full overflow-hidden rounded-xl shadow-md border">
                          {/* Note: The image will now expand and trigger the container's scrollbar */}
                          <img
                            src={previewUrl}
                            alt="Receipt"
                            className="w-full h-auto object-contain max-h-[400px]"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-black">
                              CHANGE IMAGE
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full bg-white shadow-sm border flex items-center justify-center">
                            <Printer className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-600">
                              Click to upload photo
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter font-medium">
                              JPEG, PNG or Screenshots
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 animate-in fade-in duration-300">
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  <strong>Cash Payment:</strong> Ensure you have received the
                  exact amount of{' '}
                  <span className="font-black underline">
                    ${order.totalAmount.toFixed(2)}
                  </span>{' '}
                  from the customer before confirming.
                </p>
              </div>
            )}
          </div>

          {/* FIXED FOOTER */}
          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row gap-3 shrink-0">
            <button
              disabled={isPaying}
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmPayment}
              disabled={
                isPaying ||
                (paymentMethod === 'mobile_banking' && !receiptImage)
              }
              className="flex-[2] px-6 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
            >
              {isPaying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Verify & Complete <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailsPage;
