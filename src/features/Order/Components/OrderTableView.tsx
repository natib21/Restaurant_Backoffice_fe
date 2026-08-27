import React from 'react';
import { type OrderCardData } from './OrderCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  UtensilsCrossed,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Plus,
  ChefHat,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatOrderItemName } from '../lib/orderUtils';

interface OrderTableViewProps {
  orders: OrderCardData[];
  onSelectOrder: (orderId: string) => void;
  onAcceptOrder: (orderId: string) => void;
  onPrepareOrder: (orderId: string) => void;
  onReadyOrder: (orderId: string) => void;
  onServeOrder: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
  onDeliverOrder: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onPayOrder: (order: OrderCardData) => void;
  onCancelOrder: (order: OrderCardData) => void;
  onAddItems: (order: OrderCardData) => void;
}

export const OrderTableView: React.FC<OrderTableViewProps> = ({
  orders,
  onSelectOrder,
  onAcceptOrder,
  onPrepareOrder,
  onReadyOrder,
  onServeOrder,
  onDispatchOrder,
  onDeliverOrder,
  onCompleteOrder,
  onPayOrder,
  onCancelOrder,
  onAddItems,
}) => {
  if (orders.length === 0) {
    return (
      <div className="border rounded-xl p-12 text-center text-muted-foreground bg-card">
        <Package className="h-10 w-10 mx-auto opacity-30 mb-2" />
        <p className="font-semibold text-sm">No orders matching the current filter</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-3">Type / Destination</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Items Summary</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Payment</th>
              <th className="py-3 px-3">Placed</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((order) => {
              const orderId = order._id || order.id || '';
              const tableNum =
                typeof order.table === 'object'
                  ? order.table?.tableNumber
                  : order.tableNumber || (order.table as string);
              const items = order.items || [];
              const totalItems =
                order.itemCount ??
                items.reduce((s, i) => s + (i.quantity || 1), 0);
              const isPaid = order.paymentStatus === 'paid';

              let timeAgo = 'Just now';
              try {
                timeAgo = formatDistanceToNow(new Date(order.placedAt), {
                  addSuffix: true,
                });
              } catch (e) {
                console.debug('Invalid order date', e);
              }

              return (
                <tr
                  key={orderId}
                  onClick={() => onSelectOrder(orderId)}
                  className="hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  {/* Order Number */}
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {order.orderNumber}
                  </td>

                  {/* Order Type */}
                  <td className="py-3 px-3">
                    {order.orderType === 'dine_in' && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold"
                      >
                        <UtensilsCrossed className="h-3 w-3 mr-1" />
                        Table {tableNum || '—'}
                      </Badge>
                    )}
                    {order.orderType === 'delivery' && (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-semibold"
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Delivery
                      </Badge>
                    )}
                    {order.orderType === 'takeaway' && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold"
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Takeaway
                      </Badge>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground truncate max-w-[140px]">
                      {order.customerName || 'Walk-in'}
                    </div>
                    {order.customerPhone && (
                      <div className="text-[10px] text-muted-foreground truncate font-mono">
                        {order.customerPhone}
                      </div>
                    )}
                  </td>

                  {/* Items Summary */}
                  <td className="py-3 px-3 max-w-[200px]">
                    <span className="font-semibold text-foreground">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-muted-foreground truncate block text-[11px]">
                      {items
                        .slice(0, 2)
                        .map((i) => `${i.quantity}x ${formatOrderItemName(i)}`)
                        .join(', ')}
                      {items.length > 2 && '...'}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                    ETB {(order.totalAmount || 0).toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                    >
                      {order.status}
                    </Badge>
                  </td>

                  {/* Payment */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                        isPaid
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      )}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>

                  {/* Placed At */}
                  <td className="py-3 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                    {timeAgo}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {/* View button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectOrder(orderId)}
                        title="View Details"
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {/* State Machine Transition Shortcuts */}
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => onAcceptOrder(orderId)}
                          className="h-7 px-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Accept
                        </Button>
                      )}

                      {order.status === 'accepted' && (
                        <Button
                          size="sm"
                          onClick={() => onPrepareOrder(orderId)}
                          className="h-7 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Start Preparing
                        </Button>
                      )}

                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => onReadyOrder(orderId)}
                          className="h-7 px-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Ready
                        </Button>
                      )}

                      {order.status === 'ready' &&
                        order.orderType !== 'delivery' && (
                          <Button
                            size="sm"
                            onClick={() => onServeOrder(orderId)}
                            className="h-7 px-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Serve
                          </Button>
                        )}

                      {order.status === 'ready' &&
                        order.orderType === 'delivery' && (
                          <Button
                            size="sm"
                            onClick={() => onDispatchOrder(orderId)}
                            className="h-7 px-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white"
                          >
                            Dispatch
                          </Button>
                        )}

                      {order.status === 'out_for_delivery' && (
                        <Button
                          size="sm"
                          onClick={() => onDeliverOrder(orderId)}
                          className="h-7 px-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          Delivered
                        </Button>
                      )}

                      {(order.status === 'served' ||
                        order.status === 'delivered') &&
                        !isPaid && (
                          <Button
                            size="sm"
                            onClick={() => onPayOrder(order)}
                            className="h-7 px-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Pay & Settle
                          </Button>
                        )}

                      {(order.status === 'served' ||
                        order.status === 'delivered') &&
                        isPaid && (
                          <Button
                            size="sm"
                            onClick={() => onCompleteOrder ? onCompleteOrder(orderId) : onServeOrder(orderId)}
                            className="h-7 px-2 text-xs font-semibold bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </Button>
                        )}

                      {['pending', 'accepted', 'preparing'].includes(
                        order.status
                      ) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAddItems(order)}
                          title="Add items"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {order.status !== 'completed' &&
                        order.status !== 'canceled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCancelOrder(order)}
                            title="Cancel order"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default OrderTableView;
