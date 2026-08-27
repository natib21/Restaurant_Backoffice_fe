import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReviewQueueQuery,
  useApproveReviewOrderMutation,
  useRejectReviewOrderMutation,
  type ReviewQueueOrder,
  type UrgencyLevel,
} from '@/api/Queries/orderFlowQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import RightSideModal from '@/components/ui/RightSideModal';
import OrderDetailsContent from '../Components/OrderDetailsPanel';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  SendHorizontal,
  Headphones,
  Smartphone,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  RotateCcw,
  Loader2,
  Sliders,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  X,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

const getUrgencyBadge = (urgency?: UrgencyLevel) => {
  switch (urgency) {
    case 'critical':
      return {
        label: 'Critical (>60m)',
        color: 'bg-rose-500 text-white border-rose-600 animate-pulse',
        icon: Flame,
      };
    case 'high':
      return {
        label: 'Urgent (30-60m)',
        color: 'bg-orange-500 text-white border-orange-600',
        icon: AlertTriangle,
      };
    case 'medium':
      return {
        label: 'Medium (15-30m)',
        color: 'bg-amber-500 text-white border-amber-600',
        icon: Clock,
      };
    case 'low':
    default:
      return {
        label: 'Fresh (<15m)',
        color: 'bg-emerald-600 text-white border-emerald-700',
        icon: CheckCircle2,
      };
  }
};

const getSourceMeta = (source?: string) => {
  switch (source) {
    case 'web':
      return {
        label: 'Web / QR Code',
        icon: Globe,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40',
      };
    case 'telegram':
      return {
        label: 'Telegram Bot',
        icon: SendHorizontal,
        color: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40',
      };
    case 'admin':
      return {
        label: 'Admin / Call-In',
        icon: Headphones,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40',
      };
    case 'waiter':
      return {
        label: 'Waiter POS',
        icon: Smartphone,
        color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40',
      };
    default:
      return {
        label: source || 'External',
        icon: Globe,
        color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900',
      };
  }
};

export const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();

  // Queries & Mutations
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useReviewQueueQuery({ refetchInterval: 15_000 });

  const { mutateAsync: approveOrder, isPending: isApproving } =
    useApproveReviewOrderMutation();
  const { mutateAsync: rejectOrder, isPending: isRejecting } =
    useRejectReviewOrderMutation();

  // States
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalOrder, setRejectModalOrder] = useState<ReviewQueueOrder | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState<string>('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Common preset cancellation reasons
  const PRESET_REASONS = [
    'Item out of stock in kitchen',
    'Customer unreachable / fake phone number',
    'Customer requested cancellation',
    'Table occupied / unavailable',
    'Kitchen closed / overloaded',
  ];

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedChannel !== 'all' && order.source !== selectedChannel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = order.orderNumber?.toLowerCase().includes(q);
        const matchesName = order.customerName?.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone?.toLowerCase().includes(q);
        const tableStr =
          typeof order.table === 'object'
            ? order.table?.tableNumber
            : order.tableNumber;
        const matchesTable = tableStr?.toLowerCase().includes(q);
        if (!matchesNum && !matchesName && !matchesPhone && !matchesTable) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedChannel, searchQuery]);

  const channelCounts = useMemo(() => {
    return {
      all: orders.length,
      web: orders.filter((o) => o.source === 'web').length,
      telegram: orders.filter((o) => o.source === 'telegram').length,
      admin: orders.filter((o) => o.source === 'admin').length,
      waiter: orders.filter((o) => o.source === 'waiter').length,
    };
  }, [orders]);

  const handleApprove = async (order: ReviewQueueOrder) => {
    try {
      setProcessingOrderId(order._id);
      await approveOrder(order._id);
    } catch {
      // Toast handled by mutation
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleOpenRejectModal = (order: ReviewQueueOrder) => {
    setRejectModalOrder(order);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalOrder) return;
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason for the customer');
      return;
    }

    try {
      setProcessingOrderId(rejectModalOrder._id);
      await rejectOrder({
        orderId: rejectModalOrder._id,
        reason: rejectReason.trim(),
      });
      setRejectModalOrder(null);
    } catch {
      // Toast handled by mutation
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Order Review Queue
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 rounded-full">
                  {orders.length} Awaiting Authorization
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authorize incoming guest orders before tickets are dispatched to the kitchen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders/flow-config')}
            className="text-xs h-9 gap-1.5 font-medium shadow-2xs"
          >
            <Sliders className="h-3.5 w-3.5" />
            Configure Routing Rules
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9 gap-1.5"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`}
            />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* 2. Channel Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Channels', count: channelCounts.all },
            { id: 'web', label: 'Web / QR', count: channelCounts.web },
            { id: 'telegram', label: 'Telegram', count: channelCounts.telegram },
            { id: 'admin', label: 'Admin / Call-in', count: channelCounts.admin },
            { id: 'waiter', label: 'Waiter POS', count: channelCounts.waiter },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedChannel(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedChannel === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedChannel === tab.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search order #, customer, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 3. Orders Grid / List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Loading Review Queue...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl bg-card/50">
          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            All Caught Up!
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {orders.length === 0
              ? 'There are no pending orders awaiting review. Incoming guest orders will appear here automatically in real time.'
              : 'No orders matched your current search or channel filter.'}
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/orders/active')}
              className="text-xs"
            >
              Go to Active Kitchen Board
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/orders/new')}
              className="text-xs font-bold"
            >
              + Create New Order
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const urgency = getUrgencyBadge(order.urgency);
            const source = getSourceMeta(order.source);
            const UrgencyIcon = urgency.icon;
            const SourceIcon = source.icon;
            const isProcessing = processingOrderId === order._id;

            const tableStr =
              typeof order.table === 'object'
                ? order.table?.tableNumber
                : order.tableNumber;

            return (
              <div
                key={order._id}
                className="border rounded-xl bg-card shadow-2xs flex flex-col justify-between overflow-hidden hover:border-primary/40 transition-colors"
              >
                {/* Card Top / Header */}
                <div className="p-4 border-b space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-base text-foreground tracking-tight">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 border flex items-center gap-1 ${source.color}`}
                        >
                          <SourceIcon className="h-3 w-3" />
                          {source.label}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {order.customerName || 'Walk-in Customer'}
                        {order.customerPhone && (
                          <span className="font-mono font-normal text-muted-foreground ml-1.5 text-[11px]">
                            ({order.customerPhone})
                          </span>
                        )}
                      </p>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1 shadow-2xs ${urgency.color}`}
                    >
                      <UrgencyIcon className="h-3 w-3" />
                      {order.elapsed || urgency.label}
                    </Badge>
                  </div>

                  {/* Context chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {tableStr && (
                      <span className="px-2 py-0.5 rounded bg-muted font-bold text-foreground flex items-center gap-1">
                        <UtensilsCrossed className="h-3 w-3 text-primary" />
                        Table {tableStr}
                      </span>
                    )}

                    {order.orderType && (
                      <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground capitalize flex items-center gap-1">
                        {order.orderType === 'delivery' ? (
                          <Truck className="h-3 w-3" />
                        ) : order.orderType === 'takeaway' ? (
                          <ShoppingBag className="h-3 w-3" />
                        ) : (
                          <UtensilsCrossed className="h-3 w-3" />
                        )}
                        {order.orderType.replace('_', ' ')}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                      Reviewer: {order.reviewerRole || 'Staff'}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2 bg-slate-50/50 dark:bg-slate-900/20">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Items to Prepare ({order.itemCount || order.items?.length || 0})
                  </p>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-start justify-between gap-2"
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="font-mono font-bold text-primary shrink-0">
                            {item.quantity}x
                          </span>
                          <div>
                            <p className="font-medium text-foreground leading-tight">
                              {item.name}
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                          ETB {((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Bottom / Actions */}
                <div className="p-4 border-t space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      Total Order Amount
                    </span>
                    <span className="text-base font-black font-mono text-foreground">
                      ETB {(order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRejectModal(order)}
                      disabled={isProcessing}
                      className="text-xs h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/40"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleApprove(order)}
                      disabled={isProcessing}
                      className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      )}
                      Approve & Cook
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order._id)}
                    className="w-full text-center text-[11px] font-medium text-primary hover:underline flex items-center justify-center gap-1 pt-1"
                  >
                    <Eye className="h-3 w-3" /> View Detailed Order Ticket
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Reject Order Modal with Reason Picker */}
      <Dialog
        open={!!rejectModalOrder}
        onOpenChange={(open) => !open && setRejectModalOrder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject Order {rejectModalOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              This order will be canceled and the guest will be notified of the reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-foreground">
              Select or type rejection reason:
            </label>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border text-left transition-colors ${
                    rejectReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Type specific explanation for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOrder(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="text-xs font-bold"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Right Side Order Details Drawer */}
      <RightSideModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Order Details"
      >
        {selectedOrderId && <OrderDetailsContent orderId={selectedOrderId} />}
      </RightSideModal>
    </div>
  );
};

export default ReviewQueuePage;
