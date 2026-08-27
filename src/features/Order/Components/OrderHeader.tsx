// src/features/orders/components/OrderHeader.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectOrder } from '../store/orderSlice';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { RootState } from '@/app/store';

const OrderHeader: React.FC<{ order: any }> = ({ order }) => {
  const dispatch = useDispatch();
  const isOrderSidebarOpen = useSelector(
    (state: RootState) => state.ui.orderSidebarOpen
  );

  const handleBack = () => {
    dispatch(selectOrder(null)); // deselect
  };

  return (
    <div className="p-4 border-b flex items-center gap-4">
      {/* Back Button - Only show when in full view or mobile */}
      {(isOrderSidebarOpen || window.innerWidth < 768) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="md:hidden lg:block"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1">
        <h2 className="font-semibold text-lg">
          #{order.orderNumber} - {order.customerName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="text-right">
        <p className="text-2xl font-bold">ETB {order.total}</p>
      </div>
    </div>
  );
};

export default OrderHeader;
