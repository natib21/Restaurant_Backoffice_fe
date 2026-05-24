// src/features/Orders/pages/OrderHistoryPage.tsx
import React from 'react';
import { Calendar, Search, Filter } from 'lucide-react';
import OrderCard from '../Components/OrderCard';
// import OrdersEmptyState from '../components/OrdersEmptyState';

const mockHistory = [
  {
    id: 'ORD-100',
    orderNumber: '#TAKE-105',
    customerName: 'Mike Chen',
    itemsCount: 3,
    total: 58.0,
    status: 'completed',
    placedAt: '2026-01-09T09:15:00',
    completedAt: '2026-01-09T09:45:00',
    timeAgo: '1 hour ago',
  },
  // More completed/cancelled orders
];

const OrderHistoryPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-1">
            View past orders and performance
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted">
            <Calendar className="h-4 w-4" />
            Date Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by order number, customer, or table..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockHistory.map((order) => (
          <OrderCard key={order.id} order={order} showCompletedTime />
        ))}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
