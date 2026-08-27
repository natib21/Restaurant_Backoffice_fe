// src/features/Report/mockData.ts
import type {
  SalesReportData,
  OrdersReportData,
  ProductsReportData,
  CustomersReportData,
  DeliveryReportData,
  StaffReportData,
  InventoryReportData,
  ProfitabilityReportData,
} from '@/api/Queries/reportQueries';

export const MOCK_SALES_REPORT: SalesReportData = {
  summary: {
    grossRevenue: 284500,
    totalDiscounts: 8900,
    totalTaxes: 42675,
    totalRefunds: 0, // Hardcoded 0 per backend spec
    totalDeliveryFees: 12400,
    netRevenue: 275600,
    orderCount: 1420,
    averageOrderValue: 200.35,
    paymentMethodBreakdown: {
      cash: 112000,
      card: 65400,
      mobile_banking: 98200,
      unspecified: 8900,
    },
  },
  breakdown: [
    { period: '2026-08-01', grossRevenue: 34500, totalDiscounts: 1200, totalTaxes: 5175, totalDeliveryFees: 1500, netRevenue: 33300, orderCount: 172, averageOrderValue: 200.58 },
    { period: '2026-08-02', grossRevenue: 41200, totalDiscounts: 1500, totalTaxes: 6180, totalDeliveryFees: 1900, netRevenue: 39700, orderCount: 204, averageOrderValue: 201.96 },
    { period: '2026-08-03', grossRevenue: 29800, totalDiscounts: 900, totalTaxes: 4470, totalDeliveryFees: 1300, netRevenue: 28900, orderCount: 150, averageOrderValue: 198.66 },
    { period: '2026-08-04', grossRevenue: 38900, totalDiscounts: 1100, totalTaxes: 5835, totalDeliveryFees: 1700, netRevenue: 37800, orderCount: 195, averageOrderValue: 199.48 },
    { period: '2026-08-05', grossRevenue: 45600, totalDiscounts: 1400, totalTaxes: 6840, totalDeliveryFees: 2100, netRevenue: 44200, orderCount: 228, averageOrderValue: 200.0 },
    { period: '2026-08-06', grossRevenue: 49500, totalDiscounts: 1600, totalTaxes: 7425, totalDeliveryFees: 2300, netRevenue: 47900, orderCount: 247, averageOrderValue: 200.4 },
    { period: '2026-08-07', grossRevenue: 45000, totalDiscounts: 1200, totalTaxes: 6750, totalDeliveryFees: 1600, netRevenue: 43800, orderCount: 224, averageOrderValue: 200.89 },
  ],
};

export const MOCK_ORDERS_REPORT: OrdersReportData = {
  summary: {
    totalOrders: 1420,
    ordersByStatus: {
      pending: 12,
      accepted: 28,
      preparing: 35,
      ready: 18,
      completed: 1290,
      canceled: 37,
    },
    cancellationRate: 2.6,
    averagePreparationTime: 18.5, // in minutes
    ordersWithPreparationTime: 1280,
  },
  breakdown: [
    { period: '2026-08-01', orderCount: 172, ordersByStatus: { pending: 1, accepted: 3, preparing: 4, ready: 2, completed: 158, canceled: 4 }, cancellationRate: 2.3 },
    { period: '2026-08-02', orderCount: 204, ordersByStatus: { pending: 2, accepted: 4, preparing: 5, ready: 3, completed: 185, canceled: 5 }, cancellationRate: 2.45 },
    { period: '2026-08-03', orderCount: 150, ordersByStatus: { pending: 1, accepted: 2, preparing: 3, ready: 2, completed: 139, canceled: 3 }, cancellationRate: 2.0 },
    { period: '2026-08-04', orderCount: 195, ordersByStatus: { pending: 2, accepted: 4, preparing: 6, ready: 3, completed: 175, canceled: 5 }, cancellationRate: 2.56 },
    { period: '2026-08-05', orderCount: 228, ordersByStatus: { pending: 2, accepted: 5, preparing: 6, ready: 3, completed: 206, canceled: 6 }, cancellationRate: 2.63 },
    { period: '2026-08-06', orderCount: 247, ordersByStatus: { pending: 3, accepted: 6, preparing: 7, ready: 3, completed: 221, canceled: 7 }, cancellationRate: 2.83 },
    { period: '2026-08-07', orderCount: 224, ordersByStatus: { pending: 1, accepted: 4, preparing: 4, ready: 2, completed: 206, canceled: 7 }, cancellationRate: 3.12 },
  ],
};

export const MOCK_PRODUCTS_REPORT: ProductsReportData = {
  summary: {
    totalItemsSold: 3840,
    totalItemRevenue: 284500,
    uniqueItemsCount: 48,
    topItems: [
      { menuItemId: 'item-1', name: 'Special Doro Wat', category: 'Traditional', quantitySold: 420, revenue: 54600 },
      { menuItemId: 'item-2', name: 'Shekla Tibs', category: 'Traditional', quantitySold: 380, revenue: 49400 },
      { menuItemId: 'item-3', name: 'Gored Gored', category: 'Beef Specialties', quantitySold: 290, revenue: 40600 },
      { menuItemId: 'item-4', name: 'Beyeaynetu (Veggie Feast)', category: 'Fasting', quantitySold: 310, revenue: 34100 },
      { menuItemId: 'item-5', name: 'Kitfo Special', category: 'Traditional', quantitySold: 240, revenue: 33600 },
      { menuItemId: 'item-6', name: 'Fresh Mango Juice', category: 'Beverages', quantitySold: 450, revenue: 27000 },
      { menuItemId: 'item-7', name: 'Traditional Coffee Pot (Jebena)', category: 'Beverages', quantitySold: 560, revenue: 16800 },
      { menuItemId: 'item-8', name: 'Derek Tibs', category: 'Traditional', quantitySold: 120, revenue: 15600 },
      { menuItemId: 'item-9', name: 'Shiro Tagamino', category: 'Fasting', quantitySold: 140, revenue: 12600 },
      { menuItemId: 'item-10', name: 'Avocado Salad', category: 'Appetizers', quantitySold: 90, revenue: 9900 },
    ],
    lowPerformers: [
      { menuItemId: 'item-44', name: 'Mint Lemonade', category: 'Beverages', quantitySold: 8, revenue: 640 },
      { menuItemId: 'item-45', name: 'Spicy Lentil Dip', category: 'Appetizers', quantitySold: 12, revenue: 960 },
      { menuItemId: 'item-46', name: 'Lamb Broth', category: 'Soups', quantitySold: 14, revenue: 1400 },
      { menuItemId: 'item-47', name: 'Grilled Fish Cutlet', category: 'Seafood', quantitySold: 16, revenue: 2240 },
      { menuItemId: 'item-48', name: 'Ginger Tea Pot', category: 'Beverages', quantitySold: 18, revenue: 900 },
    ],
    lowPerformerThreshold: 20,
    categoryBreakdown: {
      'Traditional': { quantitySold: 1220, revenue: 153200, itemCount: 12 },
      'Beef Specialties': { quantitySold: 410, revenue: 56200, itemCount: 6 },
      'Fasting': { quantitySold: 510, revenue: 52700, itemCount: 8 },
      'Beverages': { quantitySold: 1240, revenue: 47400, itemCount: 10 },
      'Appetizers': { quantitySold: 280, revenue: 18400, itemCount: 6 },
      'Desserts': { quantitySold: 180, revenue: 12600, itemCount: 6 },
    },
  },
  breakdown: [
    { period: '2026-08-01', menuItemId: 'item-1', menuItemName: 'Special Doro Wat', category: 'Traditional', quantitySold: 58, revenue: 7540, orderCount: 52 },
    { period: '2026-08-01', menuItemId: 'item-2', menuItemName: 'Shekla Tibs', category: 'Traditional', quantitySold: 52, revenue: 6760, orderCount: 48 },
    { period: '2026-08-02', menuItemId: 'item-1', menuItemName: 'Special Doro Wat', category: 'Traditional', quantitySold: 64, revenue: 8320, orderCount: 58 },
    { period: '2026-08-02', menuItemId: 'item-2', menuItemName: 'Shekla Tibs', category: 'Traditional', quantitySold: 60, revenue: 7800, orderCount: 54 },
  ],
};

export const MOCK_CUSTOMERS_REPORT: CustomersReportData = {
  summary: {
    newCustomerCount: 380,
    returningCustomerCount: 640,
    totalCustomers: 1020,
    spendDistribution: {
      percentile25th: 120,
      percentile50th: 240,
      percentile75th: 480,
      percentile90th: 850,
    },
    topCustomers: [
      { customerId: 'cust-1', customerName: 'Abebe Bikila', totalSpend: 4850, orderCount: 18, customerType: 'returning' },
      { customerId: 'cust-2', customerName: 'Sara Yohannes', totalSpend: 4120, orderCount: 14, customerType: 'returning' },
      { customerId: 'cust-3', customerName: 'Dawit Haile', totalSpend: 3680, orderCount: 12, customerType: 'returning' },
      { customerId: 'cust-4', customerName: 'Meron Tadesse', totalSpend: 3450, orderCount: 11, customerType: 'returning' },
      { customerId: 'cust-5', customerName: 'Elias Kebede', totalSpend: 2980, orderCount: 9, customerType: 'returning' },
      { customerId: 'cust-6', customerName: 'Helen Mengistu', totalSpend: 2650, orderCount: 8, customerType: 'returning' },
      { customerId: 'cust-7', customerName: 'Yonas Bekele', totalSpend: 2420, orderCount: 7, customerType: 'new' },
      { customerId: 'cust-8', customerName: 'Bethelhem Alemu', totalSpend: 2190, orderCount: 6, customerType: 'returning' },
      { customerId: 'cust-9', customerName: 'Kaleb Worku', totalSpend: 1980, orderCount: 5, customerType: 'new' },
      { customerId: 'cust-10', customerName: 'Rahel Girma', totalSpend: 1850, orderCount: 5, customerType: 'returning' },
    ],
  },
  breakdown: [
    { period: '2026-08-01', newCustomers: 48, returningCustomers: 82, totalCustomers: 130 },
    { period: '2026-08-02', newCustomers: 56, returningCustomers: 98, totalCustomers: 154 },
    { period: '2026-08-03', newCustomers: 40, returningCustomers: 76, totalCustomers: 116 },
    { period: '2026-08-04', newCustomers: 52, returningCustomers: 94, totalCustomers: 146 },
    { period: '2026-08-05', newCustomers: 62, returningCustomers: 108, totalCustomers: 170 },
    { period: '2026-08-06', newCustomers: 68, returningCustomers: 118, totalCustomers: 186 },
    { period: '2026-08-07', newCustomers: 54, returningCustomers: 104, totalCustomers: 158 },
  ],
};

export const MOCK_DELIVERY_REPORT: DeliveryReportData = {
  summary: {
    deliveryOrderCount: 348,
    totalDeliveryFees: 12400,
    averageDeliveryDuration: 28.4, // in minutes
    onTimeDeliveryPercentage: null, // Always null pending SLA per spec
  },
  breakdown: [
    { period: '2026-08-01', deliveryOrderCount: 42, totalDeliveryFees: 1500, averageDeliveryFee: 35.7, ordersWithDuration: 40 },
    { period: '2026-08-02', deliveryOrderCount: 52, totalDeliveryFees: 1900, averageDeliveryFee: 36.5, ordersWithDuration: 50 },
    { period: '2026-08-03', deliveryOrderCount: 38, totalDeliveryFees: 1300, averageDeliveryFee: 34.2, ordersWithDuration: 36 },
    { period: '2026-08-04', deliveryOrderCount: 48, totalDeliveryFees: 1700, averageDeliveryFee: 35.4, ordersWithDuration: 46 },
    { period: '2026-08-05', deliveryOrderCount: 58, totalDeliveryFees: 2100, averageDeliveryFee: 36.2, ordersWithDuration: 56 },
    { period: '2026-08-06', deliveryOrderCount: 62, totalDeliveryFees: 2300, averageDeliveryFee: 37.1, ordersWithDuration: 60 },
    { period: '2026-08-07', deliveryOrderCount: 48, totalDeliveryFees: 1600, averageDeliveryFee: 33.3, ordersWithDuration: 47 },
  ],
};

export const MOCK_STAFF_REPORT: StaffReportData = {
  summary: {
    totalWaiters: 12,
    totalKitchenStaff: 8,
    totalStaff: 20,
    totalOrdersHandled: 1420,
    averageOrdersPerStaff: 71,
    topPerformers: [
      { staffId: 'st-1', staffType: 'waiter', orderCount: 164, averageTurnaroundMinutes: 12.4 },
      { staffId: 'st-2', staffType: 'waiter', orderCount: 152, averageTurnaroundMinutes: 13.1 },
      { staffId: 'st-3', staffType: 'kitchen', orderCount: 240, averageTurnaroundMinutes: 16.5 },
      { staffId: 'st-4', staffType: 'kitchen', orderCount: 220, averageTurnaroundMinutes: 17.2 },
      { staffId: 'st-5', staffType: 'waiter', orderCount: 138, averageTurnaroundMinutes: 14.0 },
      { staffId: 'st-6', staffType: 'waiter', orderCount: 129, averageTurnaroundMinutes: 14.8 },
      { staffId: 'st-7', staffType: 'kitchen', orderCount: 195, averageTurnaroundMinutes: 18.0 },
      { staffId: 'st-8', staffType: 'waiter', orderCount: 115, averageTurnaroundMinutes: 15.2 },
    ],
    waiterStats: {
      totalOrders: 940,
      averageTurnaround: 13.8,
    },
    kitchenStats: {
      totalOrders: 1420,
      averageTurnaround: 17.4,
    },
  },
  breakdown: [
    { period: '2026-08-01', totalOrders: 172, waiterOrders: 118, kitchenOrders: 172, activeWaiters: 8, activeKitchenStaff: 6 },
    { period: '2026-08-02', totalOrders: 204, waiterOrders: 142, kitchenOrders: 204, activeWaiters: 10, activeKitchenStaff: 7 },
    { period: '2026-08-03', totalOrders: 150, waiterOrders: 98, kitchenOrders: 150, activeWaiters: 7, activeKitchenStaff: 5 },
    { period: '2026-08-04', totalOrders: 195, waiterOrders: 130, kitchenOrders: 195, activeWaiters: 9, activeKitchenStaff: 6 },
    { period: '2026-08-05', totalOrders: 228, waiterOrders: 156, kitchenOrders: 228, activeWaiters: 11, activeKitchenStaff: 7 },
    { period: '2026-08-06', totalOrders: 247, waiterOrders: 168, kitchenOrders: 247, activeWaiters: 12, activeKitchenStaff: 8 },
    { period: '2026-08-07', totalOrders: 224, waiterOrders: 148, kitchenOrders: 224, activeWaiters: 10, activeKitchenStaff: 7 },
  ],
};

export const MOCK_INVENTORY_REPORT: InventoryReportData = {
  summary: {
    totalStockValue: 186400,
    totalItems: 84,
    lowStockItemCount: 5,
    lowStockItems: [
      { ingredientId: 'ing-1', name: 'Fresh Berbere Spice Mix', currentStock: 3.5, minStock: 10, unit: 'kg', stockValue: 2450 },
      { ingredientId: 'ing-2', name: 'Purified Niter Kibbeh (Spiced Butter)', currentStock: 4.2, minStock: 12, unit: 'kg', stockValue: 4620 },
      { ingredientId: 'ing-3', name: 'Fresh Prime Beef Tenderloin', currentStock: 8.0, minStock: 25, unit: 'kg', stockValue: 7200 },
      { ingredientId: 'ing-4', name: 'Teff Flour Premium (White)', currentStock: 15.0, minStock: 50, unit: 'kg', stockValue: 3300 },
      { ingredientId: 'ing-5', name: 'Yirgacheffe Coffee Beans (A-Grade)', currentStock: 5.0, minStock: 15, unit: 'kg', stockValue: 3500 },
    ],
    movements: {
      totalInbound: 245,
      totalOutbound: 310,
      netChange: -65,
      movementCount: 555,
    },
    categoryBreakdown: [
      { category: 'Meat & Poultry', value: 74500 },
      { category: 'Dairy & Fats', value: 38200 },
      { category: 'Spices & Seasoning', value: 29800 },
      { category: 'Grains & Flours', value: 24400 },
      { category: 'Beverages & Coffee', value: 19500 },
    ],
  },
  breakdown: [
    { period: '2026-08-01', inboundMovements: 32, outboundMovements: 44, inboundValue: 18400, outboundValue: 16200, netValue: 2200 },
    { period: '2026-08-02', inboundMovements: 40, outboundMovements: 52, inboundValue: 22500, outboundValue: 21000, netValue: 1500 },
    { period: '2026-08-03', inboundMovements: 25, outboundMovements: 36, inboundValue: 12000, outboundValue: 14200, netValue: -2200 },
    { period: '2026-08-04', inboundMovements: 35, outboundMovements: 48, inboundValue: 19800, outboundValue: 18600, netValue: 1200 },
    { period: '2026-08-05', inboundMovements: 45, outboundMovements: 58, inboundValue: 26000, outboundValue: 24200, netValue: 1800 },
    { period: '2026-08-06', inboundMovements: 38, outboundMovements: 42, inboundValue: 21000, outboundValue: 19500, netValue: 1500 },
    { period: '2026-08-07', inboundMovements: 30, outboundMovements: 30, inboundValue: 15200, outboundValue: 14800, netValue: 400 },
  ],
};

export const MOCK_PROFITABILITY_REPORT: ProfitabilityReportData & {
  warnings?: Array<{ code: string; message: string; recommendation: string }>;
} = {
  summary: {
    totalCOGS: 114800,
    grossRevenue: 284500,
    totalDiscounts: 8900,
    totalTaxes: 42675,
    netRevenue: 275600,
    grossProfit: 160800,
    grossMarginPercentage: 58.3,
    itemsWithoutCost: 2,
    lowMarginItems: [
      { menuItemId: 'item-22', totalRevenue: 14200, totalCost: 11360, margin: 20.0, totalQuantity: 142 },
      { menuItemId: 'item-31', totalRevenue: 8600, totalCost: 6622, margin: 23.0, totalQuantity: 86 },
      { menuItemId: 'item-14', totalRevenue: 12400, totalCost: 9300, margin: 25.0, totalQuantity: 62 },
    ],
  },
  breakdown: [
    { period: '2026-08-01', totalCOGS: 13800, netRevenue: 33300, grossProfit: 19500, grossMarginPercentage: 58.55, itemsWithoutCost: 0 },
    { period: '2026-08-02', totalCOGS: 16400, netRevenue: 39700, grossProfit: 23300, grossMarginPercentage: 58.69, itemsWithoutCost: 1 },
    { period: '2026-08-03', totalCOGS: 12100, netRevenue: 28900, grossProfit: 16800, grossMarginPercentage: 58.13, itemsWithoutCost: 0 },
    { period: '2026-08-04', totalCOGS: 15600, netRevenue: 37800, grossProfit: 22200, grossMarginPercentage: 58.73, itemsWithoutCost: 0 },
    { period: '2026-08-05', totalCOGS: 18400, netRevenue: 44200, grossProfit: 25800, grossMarginPercentage: 58.37, itemsWithoutCost: 1 },
    { period: '2026-08-06', totalCOGS: 20100, netRevenue: 47900, grossProfit: 27800, grossMarginPercentage: 58.03, itemsWithoutCost: 0 },
    { period: '2026-08-07', totalCOGS: 18400, netRevenue: 43800, grossProfit: 25400, grossMarginPercentage: 57.99, itemsWithoutCost: 0 },
  ],
  warnings: [
    {
      code: 'INCOMPLETE_COGS_DATA',
      message: '2 order items currently have no ingredient cost or recipe mapped.',
      recommendation: 'Configure recipe costs for all active menu items in Inventory > Recipes to improve margin precision.',
    },
  ],
};
