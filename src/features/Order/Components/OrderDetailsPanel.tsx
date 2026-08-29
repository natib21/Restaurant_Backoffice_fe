import React, { useState } from 'react';
import {
  Loader2,
  MapPin,
  User,
  Utensils,
  ShoppingBag,
  Info,
  ExternalLink,
  UserCheck,
  ClipboardCheck,
  Zap,
  CreditCard,
  Plus,
  XCircle,
  ChefHat,
  PackageCheck,
  Truck,
  CheckCircle2,
  Check,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';
import {
  useOrderByIdQuery,
  useUpdateOrderStatusMutation,
} from '../../../api/Queries/orderQuery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import PayOrderModal from './PayOrderModal';
import CancelOrderModal from './CancelOrderModal';
import AddItemsModal from './AddItemsModal';
import { formatOrderItemName } from '../lib/orderUtils';
import OrderItemRow from './OrderItemRow';
import BulkServeButton from './BulkServeButton';

const OrderDetailsContent = ({ orderId }: { orderId: string }) => {
  const { data: response, isLoading, isError, refetch } = useOrderByIdQuery(orderId);
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateOrderStatusMutation();

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);

  const order = (response as any)?.data?.order || response;

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase animate-pulse">
          Loading Order...
        </p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="p-8 text-center space-y-4">
        <Info className="text-destructive h-8 w-8 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
      </div>
    );
  }

  const typeConfigs = {
    dine_in: {
      icon: <Utensils className="h-4 w-4" />,
      label: 'Dine-In',
      theme: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      detail: `Table ${order.table?.tableNumber || order.tableNumber || 'N/A'}`,
    },
    delivery: {
      icon: <MapPin className="h-4 w-4" />,
      label: 'Delivery',
      theme: 'text-blue-600 bg-blue-50 border-blue-100',
      detail: order.location?.formattedAddress || 'No Address',
    },
    takeaway: {
      icon: <ShoppingBag className="h-4 w-4" />,
      label: 'Takeaway',
      theme: 'text-amber-600 bg-amber-50 border-amber-100',
      detail: 'Pickup Counter',
    },
  };

  const config =
    typeConfigs[order.orderType as keyof typeof typeConfigs] ||
    typeConfigs.dine_in;

  const isPaid = order.paymentStatus === 'paid';
  const isCanceled =
    order.status === 'canceled' || order.status === 'cancelled';

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-x-hidden">
      {/* 1. Header - Compact for Modal */}
      <div className="bg-card px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${config.theme}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tight text-foreground truncate">
              {order.orderNumber}
            </h2>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
              {new Date(order.placedAt || order.createdAt).toLocaleTimeString(
                [],
                { hour: '2-digit', minute: '2-digit' }
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`border-none px-3 py-0.5 font-bold uppercase text-[9px] tracking-tight ${
              order.status === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-full overflow-y-auto">
        {/* 2. Order Status Info & Action Strip */}
        <div className="bg-card p-3 rounded-xl border shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Order Actions
            </p>
            <span className="text-[10px] text-muted-foreground italic">
              Status is auto-derived from items
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bulk serve ready items */}
            {order.items && order.items.length > 0 && (
              <BulkServeButton
                orderId={order._id}
                items={order.items}
                onSuccess={() => refetch()}
              />
            )}

            {/* 1. When status is 'pending': Show Accept and Prepare buttons */}
            {order.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => updateStatus({ orderId: order._id, status: 'accepted' })}
                  className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept Order
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => updateStatus({ orderId: order._id, status: 'preparing' })}
                  className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1"
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  Prepare Order
                </Button>
              </>
            )}

            {/* 2. When status is 'accepted': Show Prepare button to dispatch to kitchen */}
            {order.status === 'accepted' && (
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => updateStatus({ orderId: order._id, status: 'preparing' })}
                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1"
              >
                <ChefHat className="h-3.5 w-3.5" />
                Prepare Order (Send to Kitchen)
              </Button>
            )}

            {/* 3. When status is 'preparing': Accept & Prepare buttons disappear as order is in kitchen */}
            {order.status === 'preparing' && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                <ChefHat className="h-4 w-4 animate-pulse text-orange-500" />
                <span>Cooking in Kitchen (Ticket Active in KDS)</span>
              </div>
            )}

            {/* 4. When status is 'ready': Show Serve button (or Dispatch) */}
            {order.status === 'ready' && (
              <>
                {order.orderType === 'delivery' ? (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => updateStatus({ orderId: order._id, status: 'out_for_delivery' })}
                    className="h-8 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Dispatch Delivery
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => updateStatus({ orderId: order._id, status: 'served' })}
                    className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    Mark as Served
                  </Button>
                )}
              </>
            )}

            {/* 5. When status is ready, served, or delivered and unpaid: Settle Payment button appears */}
            {(order.status === 'ready' ||
              order.status === 'served' ||
              order.status === 'out_for_delivery' ||
              order.status === 'delivered') &&
              !isPaid &&
              !isCanceled && (
                <Button
                  size="sm"
                  onClick={() => setIsPayOpen(true)}
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Settle Payment
                </Button>
              )}

            {/* 6. When status is served or delivered and paid: Complete Order button appears */}
            {(order.status === 'served' ||
              order.status === 'out_for_delivery' ||
              order.status === 'delivered') &&
              isPaid && (
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => updateStatus({ orderId: order._id, status: 'completed' })}
                  className="h-8 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete Order
                </Button>
              )}

            {['pending', 'accepted', 'preparing'].includes(order.status) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddItemsOpen(true)}
                className="h-8 text-xs font-semibold gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Items
              </Button>
            )}

            {!isCanceled && order.status !== 'completed' && order.status !== 'served' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCancelOpen(true)}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* 3. Top Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-3 rounded-xl border shadow-2xs">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2 border-b pb-1">
              <User className="h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Customer
              </span>
            </div>
            <p className="text-xs font-bold text-foreground truncate">
              {order.customerName || 'Walk-in'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate font-mono">
              {order.customerPhone || 'No Contact'}
            </p>
          </div>

          <div className="bg-card p-3 rounded-xl border shadow-2xs">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2 border-b pb-1">
              <Zap className="h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Service
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">{config.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {config.detail}
            </p>
          </div>
        </div>

        {/* 4. Staff Accountability */}
        <div className="bg-card p-4 rounded-xl border shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground border-b pb-2 mb-3">
            <UserCheck className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Staff & Lifecycle Trace
            </span>
          </div>

          <div className="space-y-3">
            {order.placedBy && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Order Placed By:</span>
                <span className="font-semibold text-foreground">
                  {order.placedBy?.firstName} {order.placedBy?.lastName}
                </span>
              </div>
            )}

            {order.assignedWaiter && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Assigned Waiter:</span>
                <span className="font-semibold text-foreground">
                  {order.assignedWaiter?.fullName || order.assignedWaiter}
                </span>
              </div>
            )}

            {/* Timeline stamps */}
            <div className="space-y-1.5 pt-2 border-t text-[11px]">
              {order.placedAt && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Placed</span>
                  <span className="font-mono">
                    {new Date(order.placedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {order.acceptedAt && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Accepted</span>
                  <span className="font-mono">
                    {new Date(order.acceptedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {order.readyAt && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Ready</span>
                  <span className="font-mono">
                    {new Date(order.readyAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Completed</span>
                  <span className="font-mono">
                    {new Date(order.completedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Payment Details */}
        {order.paymentDetails && (
          <div className="bg-card rounded-xl border shadow-2xs overflow-hidden">
            <div className="px-4 py-2 bg-muted/40 border-b flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Payment Verification
              </span>
              <Badge
                variant="outline"
                className="text-[9px] uppercase font-bold"
              >
                {order.paymentDetails.method}
              </Badge>
            </div>
            <div className="p-3 flex items-center gap-4">
              <div className="flex-1 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank/Provider</span>
                  <span className="font-semibold text-foreground">
                    {order.paymentDetails.bankName || 'N/A'}
                  </span>
                </div>
                {order.paymentDetails.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid At</span>
                    <span className="font-mono text-foreground">
                      {new Date(order.paymentDetails.paidAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
              {order.paymentDetails.receiptImage && (
                <a
                  href={order.paymentDetails.receiptImage}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 w-20 rounded border overflow-hidden shrink-0 group relative bg-black/10 flex items-center justify-center"
                >
                  <img
                    src={order.paymentDetails.receiptImage}
                    alt="Receipt"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4 text-white" />
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 6. Items Manifest */}
        <div className="bg-card rounded-xl border shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Order Manifest ({order.items?.length || 0} Items)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BulkServeButton orderId={order._id} items={order.items || []} size="sm" />
              {['pending', 'accepted', 'preparing'].includes(order.status) && (
                <button
                  type="button"
                  onClick={() => setIsAddItemsOpen(true)}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </button>
              )}
            </div>
          </div>
          <div className="divide-y max-h-[380px] overflow-y-auto">
            {order.items?.map((item: any, idx: number) => (
              <OrderItemRow
                key={item._id || idx}
                orderId={order._id}
                item={item}
                onRefresh={() => refetch()}
              />
            ))}
          </div>
        </div>

        {/* 7. Bill Summary */}
        <div className="bg-card rounded-2xl p-4 border text-foreground shadow-2xs space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>ETB {(order.subtotal ?? order.totalAmount ?? 0).toLocaleString()}</span>
          </div>
          {order.deliveryFee ? (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery Fee</span>
              <span>ETB {order.deliveryFee.toLocaleString()}</span>
            </div>
          ) : null}
          <Separator className="my-2" />
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                Total Amount Due
              </p>
              <p className="text-2xl font-black text-primary font-mono leading-none">
                ETB {(order.totalAmount || 0).toLocaleString()}
              </p>
            </div>
            <div
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                isPaid
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
              }`}
            >
              {order.paymentStatus?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PayOrderModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        order={order}
      />
      <CancelOrderModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        order={order}
      />
      <AddItemsModal
        isOpen={isAddItemsOpen}
        onClose={() => setIsAddItemsOpen(false)}
        order={order}
      />
    </div>
  );
};

export default OrderDetailsContent;
