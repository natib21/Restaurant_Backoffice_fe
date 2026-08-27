// src/features/Order/Components/OrdersLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import OrdersTabs from './OrdersTabs';

const OrdersLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Top Orders Tabs with Queue Toggle */}
      <OrdersTabs />
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default OrdersLayout;
