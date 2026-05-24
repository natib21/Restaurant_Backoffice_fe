// src/features/orders/OrderDashboardPage.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setOrders, selectOrder } from '../store/orderSlice';
import { useOrdersQuery } from '../../../api/Queries/orderQuery';
import OrderSidebar from '../Components/OrderSidebar';
import type { RootState } from '@/app/store';
import OrderHeader from '../Components/OrderHeader';
import OrderTimeline from '../Components/OrderTimeline';
import OrderMessageInput from '../Components/OrderMessageInput';
import OrderDetailsPanel from '../Components/OrderDetailsPanel';
import { mockOrders } from '../mock/ordersMockData';
import { Clock, Package } from 'lucide-react';
const OrderDashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const selectedOrderId = useSelector(
    (state: RootState) => state.orders.selectedOrderId
  );

  // Simulate loading data
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      dispatch(setOrders(mockOrders));
    }, 800);

    return () => clearTimeout(timer);
  }, [dispatch]);

  const selectedOrder = mockOrders.find((o) => o._id === selectedOrderId);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <OrderSidebar orders={mockOrders} isLoading={false} />

      {/* Center */}
      <div className="flex-1 flex flex-col border-x">
        {selectedOrder ? (
          <>
            <OrderHeader order={selectedOrder} />
            <OrderTimeline order={selectedOrder} />
            <OrderMessageInput orderId={selectedOrder._id} />
          </>
        ) : mockOrders.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="bg-muted/50 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center mb-6">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No orders yet</h3>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              You're all caught up! New orders will appear here automatically
              when customers place them.
            </p>
            <div className="flex items-center gap-3 text-muted-foreground bg-muted/40 px-6 py-3 rounded-full">
              <Clock className="h-5 w-5" />
              <span>
                It's quiet right now — enjoy the calm before the rush!
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-lg">
            ← Select an order from the sidebar to view details
          </div>
        )}
      </div>

      {/* Right Panel */}
      <OrderDetailsPanel order={selectedOrder} />
    </div>
  );
};

export default OrderDashboardPage;
