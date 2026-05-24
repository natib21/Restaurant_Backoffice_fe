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
} from 'lucide-react';
import { useOrderByIdQuery } from '../../../api/Queries/orderQuery';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const OrderDetailsContent = ({ orderId }: { orderId: string }) => {
  const { data: response, isLoading, isError } = useOrderByIdQuery(orderId);

  const order = response?.data?.order || response;

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
      detail: 'Pickup',
    },
  };

  const config =
    typeConfigs[order.orderType as keyof typeof typeConfigs] ||
    typeConfigs.dine_in;

  return (
    <div className="flex flex-col h-full bg-slate-50/30 overflow-x-hidden">
      {/* 1. Header - Compact for Modal */}
      <div className="bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${config.theme}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tight text-slate-900 truncate">
              {order.orderNumber}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              {new Date(order.placedAt || order.createdAt).toLocaleTimeString(
                [],
                { hour: '2-digit', minute: '2-digit' }
              )}
            </p>
          </div>
        </div>
        <Badge
          className={`border-none px-3 py-0.5 font-black uppercase text-[9px] tracking-tighter ${
            order.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'
          }`}
        >
          {order.status}
        </Badge>
      </div>

      <div className="p-4 space-y-4 max-w-full">
        {/* 2. Top Info Grid - 2 Columns (Stable in Sidebar) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2 border-b border-slate-50 pb-1">
              <User className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Customer
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">
              {order.customerName || 'Walk-in'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {order.customerPhone || 'No Contact'}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2 border-b border-slate-50 pb-1">
              <Zap className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Service
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900">{config.label}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {config.detail}
            </p>
          </div>
        </div>

        {/* 3. Staff Accountability Card - Full Width in Modal */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 border-b pb-2 mb-3">
            <UserCheck className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Staff Trace
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                  {order.placedBy?.firstName?.[0]}
                  {order.placedBy?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-1">
                    Placed By
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    {order.placedBy?.firstName} {order.placedBy?.lastName}
                  </p>
                </div>
              </div>
              <p className="text-[9px] font-mono text-slate-300">
                ID: {order.placedBy?._id?.slice(-4)}
              </p>
            </div>

            <div className="space-y-2 relative before:absolute before:left-[6px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
              {[
                {
                  label: 'Accepted',
                  time: order.acceptedAt,
                  color: 'border-emerald-500',
                },
                {
                  label: 'Ready',
                  time: order.readyAt,
                  color: 'border-amber-500',
                },
                {
                  label: 'Completed',
                  time: order.completedAt,
                  color: 'border-blue-500',
                },
              ]
                .filter((step) => step.time)
                .map((step, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center relative pl-5"
                  >
                    <div
                      className={`absolute left-0 h-3 w-3 rounded-full bg-white border-2 ${step.color} z-10`}
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {step.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-900">
                      {new Date(step.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 4. Payment - Compact for Modal */}
        {order.paymentDetails && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Payment Detail
              </span>
              <Badge
                variant="outline"
                className="text-[8px] h-4 bg-white font-bold"
              >
                {order.paymentDetails.method}
              </Badge>
            </div>
            <div className="p-3 flex items-center gap-4">
              <div className="flex-1 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank</span>
                  <span className="font-bold">
                    {order.paymentDetails.bankName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid At</span>
                  <span className="font-bold truncate max-w-[80px]">
                    {order.paymentDetails.paidAt
                      ? new Date(
                          order.paymentDetails.paidAt
                        ).toLocaleTimeString()
                      : '-'}
                  </span>
                </div>
              </div>
              {order.paymentDetails.receiptImage && (
                <a
                  href={order.paymentDetails.receiptImage}
                  target="_blank"
                  className="h-10 w-16 rounded border overflow-hidden shrink-0 group relative"
                >
                  <img
                    src={order.paymentDetails.receiptImage}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-3 w-3 text-white" />
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 5. Items Manifest */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2 text-slate-500">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Order Manifest
            </span>
          </div>
          <div className="divide-y max-h-[250px] overflow-y-auto">
            {order.items?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-primary">
                    {item.quantity}×
                  </span>
                  <span className="font-bold text-slate-700 truncate max-w-[120px]">
                    {item.name || item.menuItem?.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-500">
                  {item.totalPrice?.toLocaleString() ||
                    (item.unitPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Summary - Compact Final Section */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mb-2">
            <span>Subtotal</span>
            <span>{(order.subtotal ?? 0).toLocaleString()} ETB</span>
          </div>
          <Separator className="bg-white/5 mb-3" />
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Total Amount
              </p>
              <p className="text-2xl font-black tracking-tighter leading-none">
                {order.totalAmount?.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500">ETB</span>
              </p>
            </div>
            <div
              className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                order.paymentStatus === 'paid'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-rose-500 text-rose-500'
              }`}
            >
              {order.paymentStatus?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsContent;
