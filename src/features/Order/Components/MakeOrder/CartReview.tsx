import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Plus,
  Minus,
  Trash2,
  Table as TableIcon,
  Loader2,
  MapPin,
  User as UserIcon,
  ShoppingBag,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from '../../store/orderSlice';
import { useTablesQuery } from '@/api/Queries/tableQueries';
import { useCreateStaffOrderMutation } from '../../../../api/Queries/orderQuery';

interface Props {
  onBack: () => void;
  onClose?: () => void;
}

const CartReview: React.FC<Props> = ({ onBack, onClose }) => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state: RootState) => state.orders);
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );
  const { data: tables = [] } = useTablesQuery(currentBranchId);
  const selectedTable = tables.find((t: any) => t._id === cart.tableId);

  const createOrderMutation = useCreateStaffOrderMutation();

  const handleConfirmOrder = () => {
    // 1. Calculate Items with Snapshots (Prices change, snapshots shouldn't)
    const calculatedItems = cart.items.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * item.quantity,
      notes: '',
    }));

    const subtotal = calculatedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // 2. Build Base Payload
    let payload: any = {
      items: calculatedItems,
      orderType: cart.orderType,
      branchId: currentBranchId, // Make sure your backend expects 'branch' or 'branchId'
      subtotal: subtotal,
      totalAmount: subtotal,
      status: 'pending',
    };

    // 3. Add Type-Specific Logic
    if (cart.orderType === 'dine_in') {
      payload.tableId = cart.tableId;
      payload.tableNumber = cart.tableNumber;
      payload.customerName = 'Walk-in Customer';
    } else if (cart.orderType === 'delivery') {
      // Ensure your Redux slice has 'deliveryDetails' populated from the form
      payload.customerName =
        cart.deliveryDetails?.customerName || 'Delivery Customer';
      payload.customerPhone = cart.deliveryDetails?.customerPhone;
      payload.location = cart.deliveryDetails?.location;
    } else if (cart.orderType === 'takeaway') {
      payload.customerName = 'Takeaway Customer';
    }

    // 4. Send to Server
    createOrderMutation.mutate(payload, {
      onSuccess: () => {
        dispatch(clearCart());
        onClose?.();
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Context Badges */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Review Order</h3>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* DINE IN BADGE */}
          {cart.orderType === 'dine_in' && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1" />
              Table {cart.tableNumber || 'N/A'}
            </Badge>
          )}

          {/* DELIVERY BADGE */}
          {cart.orderType === 'delivery' && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />
              Delivery
            </Badge>
          )}

          {/* TAKEAWAY BADGE */}
          {cart.orderType === 'takeaway' && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              Takeaway
            </Badge>
          )}
        </div>

        {/* Delivery Info Preview (Only shows if Delivery) */}
        {cart.orderType === 'delivery' && cart.deliveryDetails && (
          <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <UserIcon className="h-3 w-3" />{' '}
              {cart.deliveryDetails.customerName}
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3 w-3" />{' '}
              {cart.deliveryDetails.location.city},{' '}
              {cart.deliveryDetails.location.building}
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Your cart is empty
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border shadow-sm"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.price.toLocaleString()} ETB
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() =>
                      dispatch(updateCartQuantity({ id: item.id, delta: -1 }))
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() =>
                      dispatch(updateCartQuantity({ id: item.id, delta: 1 }))
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => dispatch(removeFromCart(item.id))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Summary and Confirm */}
      <div className="p-6 border-t bg-background">
        <div className="flex justify-between items-end mb-6">
          <span className="text-muted-foreground font-medium">Order Total</span>
          <span className="text-2xl font-black">
            {cart.totalAmount.toLocaleString()}{' '}
            <span className="text-sm font-normal">ETB</span>
          </span>
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold shadow-xl rounded-2xl"
          onClick={handleConfirmOrder}
          disabled={createOrderMutation.isPending || cart.items.length === 0}
        >
          {createOrderMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...
            </>
          ) : (
            'Confirm Order'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CartReview;
