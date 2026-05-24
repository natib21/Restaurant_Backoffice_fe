// src/features/Orders/components/OrdersLayout.tsx
import { Outlet } from 'react-router-dom';
import OrdersTabs from './OrdersTabs';
// import  {OrderSidebar}  from './OrderSidebar'; // Your sliding sidebar

const OrdersLayout = () => {
  return (
    <div className="flex h-full">
      {/* Main Orders Content */}
      <div className="flex-1 flex flex-col">
        <OrdersTabs />
        <div className="flex-1 overflow-auto p-6">
          <Outlet /> {/* Renders ActiveOrdersPage, History, etc. */}
        </div>
      </div>

      {/* Dedicated Order Sidebar - Always visible when on /orders/* */}
      {/* <OrderSidebar isOpen={true} /> */}
    </div>
  );
};

export default OrdersLayout;
