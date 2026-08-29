import React, { useEffect, useState } from 'react';
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
  Clock,
  Utensils,
  ShoppingBag,
  Truck,
  RotateCcw,
  Sparkles,
  ChefHat,
  Receipt,
  FileText,
  Phone,
  Layers,
  Check,
  Send,
  AlertCircle,
  Building2,
  DollarSign,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/Socket';
import { toast } from 'sonner';
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
import { formatOrderItemName } from '../lib/orderUtils';
import OrderItemRow from '../Components/OrderItemRow';
import BulkServeButton from '../Components/BulkServeButton';
import { VerifyPaymentModal } from '../Components/VerifyPaymentModal';
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
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'canceled'
  | 'cancelled';

export const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_banking'>('cash');
  const [selectedBank, setSelectedBank] = useState<string>('CBE');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<'all' | 'ready' | 'in_progress' | 'served' | 'void'>('all');

  const {
    data: orderResponse,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useOrderByIdQuery(orderId);

  const order = (orderResponse as any)?.data?.order || orderResponse;

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatusMutation();
  const { mutate: markAsPaid, isPending: isPaying } = useMarkOrderAsPaidMutation();

  const confirmPayment = async () => {
    try {
      if (!order) return;
      let payload: any;
      if (receiptImage) {
        const formData = new FormData();
        formData.append('paymentMethod', paymentMethod);
        if (paymentMethod === 'mobile_banking') {
          formData.append('bankName', selectedBank);
        }
        formData.append('image', receiptImage);
        payload = formData;
      } else {
        payload = {
          paymentMethod,
          ...(paymentMethod === 'mobile_banking' ? { bankName: selectedBank } : {}),
        };
      }

      await markAsPaid(
        { orderId: order._id, data: payload },
        {
          onSuccess: async () => {
            const status = (order.status as string)?.toLowerCase();
            if (status === 'served' || status === 'delivered' || status === 'ready') {
              try {
                await updateStatus({ orderId: order._id, status: 'completed' });
              } catch (err) {
                console.error('Failed to update status to completed', err);
              }
            }
            toast.success('Payment verified and recorded successfully!');
            setIsConfirmOpen(false);
            setReceiptImage(null);
            setPreviewUrl(null);
            refetch();
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Payment recording failed');
          },
        }
      );
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  useEffect(() => {
    if (!socket || !orderId) return;

    const handleOrderUpdate = (payload: any) => {
      const updatedOrder = payload.order || payload;
      const updatedOrderId = updatedOrder.orderId || updatedOrder._id || payload.orderId;

      if (!updatedOrderId || updatedOrderId === orderId) {
        refetch();
      }
    };

    socket.on('order:status-updated', handleOrderUpdate);
    socket.on('order:status-changed', handleOrderUpdate);
    socket.on('order-updated', handleOrderUpdate);
    socket.on('order:item-updated', handleOrderUpdate);
    socket.on('order:items-bulk-served', handleOrderUpdate);
    socket.on('order-paid', handleOrderUpdate);
    socket.on('order:canceled', handleOrderUpdate);
    socket.on('ticket:created', handleOrderUpdate);
    socket.on('ticket:updated', handleOrderUpdate);
    socket.on('ticket:status-changed', handleOrderUpdate);

    return () => {
      socket.off('order:status-updated', handleOrderUpdate);
      socket.off('order:status-changed', handleOrderUpdate);
      socket.off('order-updated', handleOrderUpdate);
      socket.off('order:item-updated', handleOrderUpdate);
      socket.off('order:items-bulk-served', handleOrderUpdate);
      socket.off('order-paid', handleOrderUpdate);
      socket.off('order:canceled', handleOrderUpdate);
      socket.off('ticket:created', handleOrderUpdate);
      socket.off('ticket:updated', handleOrderUpdate);
      socket.off('ticket:status-changed', handleOrderUpdate);
    };
  }, [socket, orderId, refetch]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[480px] rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-muted-foreground border border-outline-variant">
          <Clock className="w-8 h-8 text-primary/80" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Order Not Found or Unavailable
        </h2>
        <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-6">
          The requested ticket could not be retrieved from the active database. It may have been archived or removed.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate('/orders/active')}
            className="text-xs font-bold bg-primary text-primary-foreground"
          >
            Active Orders Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-xs font-medium"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = (order.status || 'pending').toLowerCase() as OrderStatus;
  const isPaid = order.paymentStatus === 'paid';
  const isCanceled = currentStatus === 'canceled';

  const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string }> = {
    pending: {
      label: 'Pending Review',
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    preparing: {
      label: 'Kitchen Cooking',
      color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      dot: 'bg-orange-500',
    },
    ready: {
      label: 'Ready for Service',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    served: {
      label: 'Served / Dispatched',
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      dot: 'bg-indigo-500',
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
      dot: 'bg-teal-500',
    },
    completed: {
      label: 'Completed',
      color: 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900',
      dot: 'bg-white',
    },
    canceled: {
      label: 'Canceled',
      color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    cancelled: {
      label: 'Canceled',
      color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
  };

  const handleCancel = async () => {
    if (!order) return;
    if (window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
      await updateStatus({ orderId: order._id, status: 'canceled' });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const tableStr =
    typeof order.table === 'object'
      ? order.table?.tableNumber
      : order.tableNumber || order.table;

  const STEPS: { key: OrderStatus; label: string }[] = [
    { key: 'pending', label: '1. Pending' },
    { key: 'accepted', label: '2. Accepted' },
    { key: 'preparing', label: '3. Cooking' },
    { key: 'ready', label: '4. Ready' },
    { key: 'served', label: '5. Served' },
    { key: 'completed', label: '6. Completed' },
  ];

  const currentStepIndex = isCanceled
    ? -1
    : STEPS.findIndex((s) => s.key === currentStatus);

  const subtotal = order.subtotal || order.items?.reduce((acc: number, item: any) => acc + (item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1))), 0) || 0;
  const totalAmount = order.totalAmount || subtotal;
  const tax = order.tax || Math.max(0, totalAmount - subtotal);
  const discount = order.discount || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20 px-4 sm:px-6 pt-2">
      {/* 1. Top Bar / App Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted/80 text-on-surface rounded-lg transition-colors border border-border shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-black text-xl text-foreground tracking-tight">
                {order.orderNumber}
              </span>

              <Badge
                variant="outline"
                className={cn(
                  'px-2.5 py-0.5 font-bold text-xs border flex items-center gap-1.5',
                  statusConfig[currentStatus]?.color || 'bg-muted text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    statusConfig[currentStatus]?.dot || 'bg-slate-400'
                  )}
                />
                {statusConfig[currentStatus]?.label || currentStatus}
              </Badge>

              <Badge
                className={cn(
                  'px-2.5 py-0.5 text-xs font-bold border',
                  isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                )}
              >
                {isPaid ? 'PAID' : 'UNPAID'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>
                Placed:{' '}
                <strong className="text-foreground">
                  {new Date(order.placedAt || order.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </strong>
              </span>
              <span>•</span>
              <span>
                Source: <strong className="text-foreground capitalize">{order.source || 'In-House'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Top Action Buttons matching RestoFlow Header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Serve Ready Items */}
          {order.items && order.items.length > 0 && (
            <BulkServeButton
              orderId={order._id}
              items={order.items}
              onSuccess={() => refetch()}
            />
          )}

          {/* Quick link to Kitchen Display System if kitchen items present */}
          {order.items?.some((it: any) => it.requiresKitchen !== false) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/kds')}
              className="text-xs h-9 gap-1.5 border-border hover:bg-primary/5 text-primary font-semibold"
              title="Open Kitchen Display System (KDS)"
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>Kitchen Display</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9 gap-1.5 border-border"
          >
            <RotateCcw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
            Sync Ticket
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-9 gap-1.5 border-border"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>

          {/* 1. When status is 'pending': Show Accept and Prepare buttons */}
          {currentStatus === 'pending' && (
            <>
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => updateStatus({ orderId: order._id, status: 'accepted' })}
                className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-2xs"
              >
                <Check className="h-3.5 w-3.5" />
                Accept Order
              </Button>
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => updateStatus({ orderId: order._id, status: 'preparing' })}
                className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-2xs"
              >
                <ChefHat className="h-3.5 w-3.5" />
                Prepare Order
              </Button>
            </>
          )}

          {/* 2. When status is 'accepted': Show Prepare button to dispatch to kitchen */}
          {currentStatus === 'accepted' && (
            <Button
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => updateStatus({ orderId: order._id, status: 'preparing' })}
              className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-2xs"
            >
              <ChefHat className="h-3.5 w-3.5" />
              Prepare Order (Send to Kitchen)
            </Button>
          )}

          {/* 3. When status is 'preparing': Accept & Prepare buttons disappear as order is in kitchen */}
          {currentStatus === 'preparing' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
              <ChefHat className="h-4 w-4 animate-pulse text-orange-500" />
              <span>Cooking in Kitchen (Ticket in KDS)</span>
            </div>
          )}

          {/* 4. When status is 'ready': Show Serve button (or Dispatch) */}
          {currentStatus === 'ready' && (
            <>
              {order.orderType === 'delivery' ? (
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => updateStatus({ orderId: order._id, status: 'out_for_delivery' })}
                  className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 shadow-2xs"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Dispatch Delivery
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    updateStatus(
                      { orderId: order._id, status: 'served' },
                      {
                        onSuccess: () => {
                          if (!isPaid) {
                            setIsConfirmOpen(true);
                          }
                        },
                      }
                    )
                  }
                  className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-2xs"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Mark as Served
                </Button>
              )}
            </>
          )}

          {/* 5. When status is ready, served, or delivered and unpaid: Settle Payment button appears */}
          {(currentStatus === 'ready' ||
            currentStatus === 'served' ||
            currentStatus === 'out_for_delivery' ||
            currentStatus === 'delivered') &&
            !isPaid &&
            !isCanceled && (
              <Button
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isPaying}
                className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Settle Payment
              </Button>
            )}

          {/* 6. When status is served or delivered and already paid: Complete Order button appears */}
          {(currentStatus === 'served' ||
            currentStatus === 'out_for_delivery' ||
            currentStatus === 'delivered') &&
            isPaid && (
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => updateStatus({ orderId: order._id, status: 'completed' })}
                className="text-xs h-9 bg-slate-800 hover:bg-slate-900 text-white font-semibold gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete Order
              </Button>
            )}

          {!isCanceled && currentStatus !== 'completed' && currentStatus !== 'served' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-xs h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/30"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* 2. Order Context Badges (Dine-in / Table / Guest / Customer) */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Order Type */}
          <div className="inline-flex items-center gap-1.5 bg-primary-container text-white px-3 py-1 rounded-full text-xs font-semibold">
            {order.orderType === 'delivery' ? (
              <Truck className="h-3.5 w-3.5" />
            ) : order.orderType === 'takeaway' ? (
              <ShoppingBag className="h-3.5 w-3.5" />
            ) : (
              <Utensils className="h-3.5 w-3.5" />
            )}
            <span className="capitalize">{order.orderType?.replace('_', ' ') || 'Dine-In'}</span>
          </div>

          {/* QR / Online Order source badge */}
          {Boolean(
            order.source === 'qr' ||
            order.source === 'web' ||
            order.channel === 'qr' ||
            order.channel === 'web' ||
            order.isQrOrder ||
            (typeof (order as any).orderChannel === 'string' &&
              ((order as any).orderChannel.includes('qr') || (order as any).orderChannel.includes('web'))) ||
            (typeof (order as any).notes === 'string' && (order as any).notes.toLowerCase().includes('qr'))
          ) && (
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Order</span>
            </div>
          )}

          {/* Table Badge */}
          {tableStr && (
            <div className="inline-flex items-center gap-1.5 bg-surface-container-high border border-border text-foreground px-3 py-1 rounded-full text-xs font-semibold">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Table {tableStr}
            </div>
          )}

          {/* Customer info */}
          <div className="inline-flex items-center gap-1.5 bg-surface-container-high border border-border text-foreground px-3 py-1 rounded-full text-xs font-semibold">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{order.customerName || 'Walk-in Guest'}</span>
          </div>

          {order.customerPhone && (
            <div className="inline-flex items-center gap-1.5 bg-surface-container-high border border-border text-muted-foreground px-3 py-1 rounded-full text-xs font-mono">
              <Phone className="h-3.5 w-3.5" />
              {order.customerPhone}
            </div>
          )}

          {order.guestCount && (
            <div className="inline-flex items-center gap-1.5 bg-surface-container-high border border-border text-muted-foreground px-3 py-1 rounded-full text-xs">
              <Users className="h-3.5 w-3.5" />
              {order.guestCount} Guests
            </div>
          )}
        </div>

        {order.branch && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Branch: <strong className="text-foreground">{typeof order.branch === 'object' ? order.branch?.name : 'Main Kitchen'}</strong></span>
          </div>
        )}
      </div>

      {/* 3. Order Journey Status Progression Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-primary" />
              Order Status Progression
            </span>
            <span className="text-[11px] text-muted-foreground italic">
              (Automatically derived from item progress)
            </span>
          </div>
          <span className="text-xs font-semibold text-foreground">
            Current Stage:{' '}
            <strong className="text-primary capitalize">{statusConfig[currentStatus]?.label || currentStatus}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STEPS.map((step, idx) => {
            const isDone = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all',
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                    : isCurrent
                      ? 'bg-primary-container text-white border-primary-container font-bold shadow-xs'
                      : 'bg-surface-container-lowest border-border text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-white text-slate-900'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                </div>
                <span className="truncate">{step.label.split('. ')[1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Main 3-Column Layout matching RestoFlow POS Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Middle: Order Items Summary (8 Columns) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-border bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  Order Items Breakdown
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 bg-card border rounded-full text-muted-foreground">
                  {order.items?.length || 0} Lines
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <BulkServeButton
                  orderId={order._id}
                  items={order.items || []}
                />
                <div className="text-xs font-medium text-muted-foreground hidden sm:block">
                  Total Qty:{' '}
                  <strong className="text-foreground">
                    {order.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            {order.items && order.items.length > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 border-b bg-muted/20 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setItemFilter('all')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    itemFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-card text-muted-foreground hover:text-foreground border'
                  }`}
                >
                  All ({order.items.length})
                </button>
                {order.items.some((i: any) => (i.status || 'pending').toLowerCase() === 'ready') && (
                  <button
                    type="button"
                    onClick={() => setItemFilter('ready')}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      itemFilter === 'ready'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    Ready ({order.items.filter((i: any) => (i.status || 'pending').toLowerCase() === 'ready').length})
                  </button>
                )}
                {order.items.some((i: any) => (i.status || 'pending').toLowerCase() === 'in_progress') && (
                  <button
                    type="button"
                    onClick={() => setItemFilter('in_progress')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      itemFilter === 'in_progress'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                    }`}
                  >
                    In Kitchen ({order.items.filter((i: any) => (i.status || 'pending').toLowerCase() === 'in_progress').length})
                  </button>
                )}
                {order.items.some((i: any) => (i.status || 'pending').toLowerCase() === 'served') && (
                  <button
                    type="button"
                    onClick={() => setItemFilter('served')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      itemFilter === 'served'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    Served ({order.items.filter((i: any) => (i.status || 'pending').toLowerCase() === 'served').length})
                  </button>
                )}
                {order.items.some((i: any) => (i.status || 'pending').toLowerCase() === 'void') && (
                  <button
                    type="button"
                    onClick={() => setItemFilter('void')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      itemFilter === 'void'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    }`}
                  >
                    Voided ({order.items.filter((i: any) => (i.status || 'pending').toLowerCase() === 'void').length})
                  </button>
                )}
              </div>
            )}

            {/* Items List */}
            <div className="divide-y divide-border">
              {order.items
                ?.filter((item: any) => {
                  if (itemFilter === 'all') return true;
                  return (item.status || 'pending').toLowerCase() === itemFilter;
                })
                .map((item: any, idx: number) => (
                  <OrderItemRow
                    key={item._id || idx}
                    orderId={order._id}
                    item={item}
                    onRefresh={() => refetch()}
                  />
                ))}
            </div>

            {/* Financial Totals Card */}
            <div className="p-4 border-t border-border bg-surface-container-low space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-foreground">
                  ETB {Number(subtotal).toFixed(2)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">- ETB {Number(discount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Tax & Service</span>
                <span className="font-mono font-medium text-foreground">
                  ETB {Number(tax).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-border/80 pt-2 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Total Amount Due
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Payment Status:{' '}
                    <strong className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>
                      {isPaid ? 'Settled in Full' : 'Pending Payment'}
                    </strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-primary">
                    ETB {Number(totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Staff, Timeline, and Payment info (4 Columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Handling Personnel Card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Service & Kitchen Personnel
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-surface-container-lowest">
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Assigned Server / Waiter
                  </p>
                  <p className="text-xs font-bold text-foreground truncate">
                    {order.assignedWaiter?.fullName ||
                      order.placedBy?.firstName ||
                      'Walk-in / Auto-Routed'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-surface-container-lowest">
                <div className="p-2 rounded-md bg-amber-500/10 text-amber-600">
                  <ChefHat className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Kitchen KDS Station
                  </p>
                  <p className="text-xs font-bold text-foreground truncate">
                    {order.assignedKitchenStaff?.fullName || 'Main Station Chef Queue'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Order Timeline */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Activity Timestamp Log
            </h3>

            <div className="space-y-3 text-xs border-l-2 border-primary/40 pl-3 ml-1">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground flex items-center justify-between">
                  <span>Order Placed</span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {new Date(order.placedAt || order.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">Initial ticket recorded</p>
              </div>

              {order.acceptedAt && (
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground flex items-center justify-between">
                    <span>Staff Accepted</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {new Date(order.acceptedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Authorized for kitchen</p>
                </div>
              )}

              {order.readyAt && (
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-600 flex items-center justify-between">
                    <span>Food Ready</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {new Date(order.readyAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Kitchen ticket completed</p>
                </div>
              )}

              {order.servedAt && (
                <div className="space-y-0.5">
                  <p className="font-bold text-purple-600 flex items-center justify-between">
                    <span>Served to Table</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {new Date(order.servedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Dispatched to guest</p>
                </div>
              )}

              {order.completedAt && (
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground flex items-center justify-between">
                    <span>Closed & Paid</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {new Date(order.completedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Transaction finished</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details / Proof */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Payment Record
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  isPaid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                )}
              >
                {isPaid ? 'SETTLED' : 'DUE'}
              </span>
            </h3>

            {isPaid ? (
              <div className="p-3 rounded-lg border bg-surface-container-lowest space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-bold uppercase text-foreground">
                    {order.paymentMethod?.replace('_', ' ') || 'Cash / Counter'}
                  </span>
                </div>
                {order.bankName && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="font-bold text-foreground">{order.bankName}</span>
                  </div>
                )}
                {order.paymentProof && (
                  <div className="pt-2 border-t">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Uploaded Slip:
                    </p>
                    <a
                      href={order.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline font-medium block truncate"
                    >
                      View Attached Receipt Image
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Total amount of <strong>ETB {Number(totalAmount).toFixed(2)}</strong> is awaiting collection.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsConfirmOpen(true)}
                  className="w-full text-xs font-bold bg-primary text-primary-foreground h-8"
                >
                  <CreditCard className="h-3 w-3 mr-1.5" />
                  Settle & Verify Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Payment Confirmation & Verification Modal */}
      {order && (
        <VerifyPaymentModal
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false);
            refetch();
          }}
          order={order}
        />
      )}
    </div>
  );
};

export default OrderDetailsPage;
