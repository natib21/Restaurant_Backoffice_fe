// src/features/orders/mock/ordersMockData.ts
export const mockOrders = [
  {
    _id: 'ord_001',
    orderNumber: '1001',
    customerName: 'Abebe Kebede',
    customerPhone: '+251911234567',
    status: 'new',
    total: 850,
    createdAt: '2025-04-05T10:15:00Z',
    items: [
      { name: 'Cheese Burger', quantity: 2, price: 250 },
      { name: 'French Fries', quantity: 1, price: 100 },
      { name: 'Coca Cola', quantity: 2, price: 50 },
    ],
    timeline: [
      {
        by: 'Customer',
        text: 'Order placed via mobile app',
        time: '2025-04-05T10:15:00Z',
        type: 'system',
      },
      {
        by: 'Agent',
        text: 'Order confirmed and sent to kitchen',
        time: '2025-04-05T10:18:00Z',
        type: 'note',
      },
    ],
    unread: 1,
  },
  {
    _id: 'ord_002',
    orderNumber: '1002',
    customerName: 'Mulugeta Tadesse',
    customerPhone: '+251922345678',
    status: 'preparing',
    total: 1200,
    createdAt: '2025-04-05T09:45:00Z',
    items: [
      { name: 'Pizza Margherita', quantity: 1, price: 800 },
      { name: 'Caesar Salad', quantity: 1, price: 300 },
      { name: 'Sparkling Water', quantity: 1, price: 100 },
    ],
    timeline: [
      {
        by: 'Customer',
        text: 'Order placed',
        time: '2025-04-05T09:45:00Z',
        type: 'system',
      },
      {
        by: 'Agent',
        text: 'Started preparing',
        time: '2025-04-05T09:55:00Z',
        type: 'status',
      },
      {
        by: 'Kitchen',
        text: 'Pizza in oven',
        time: '2025-04-05T10:05:00Z',
        type: 'note',
      },
    ],
    unread: 0,
  },
  {
    _id: 'ord_003',
    orderNumber: '1003',
    customerName: 'Selamawit Lemma',
    customerPhone: '+251933456789',
    status: 'ready',
    total: 650,
    createdAt: '2025-04-05T09:30:00Z',
    items: [
      { name: 'Chicken Sandwich', quantity: 1, price: 350 },
      { name: 'Milkshake', quantity: 1, price: 200 },
      { name: 'Onion Rings', quantity: 1, price: 100 },
    ],
    timeline: [
      {
        by: 'Customer',
        text: 'Order placed',
        time: '2025-04-05T09:30:00Z',
        type: 'system',
      },
      {
        by: 'Agent',
        text: 'Order ready for pickup',
        time: '2025-04-05T09:50:00Z',
        type: 'status',
      },
    ],
    unread: 0,
  },
];
