// src/features/Order/lib/orderFilterUtils.ts
import { type AdvancedFilterField } from '@/components/Common/AdavanceFilter/types';
import { type OrderFilterState } from '../Components/OrderFilterBar';

export const DEFAULT_ORDER_FILTER_FIELDS: AdvancedFilterField[] = [
  {
    id: 'channel',
    label: 'Order Source / Channel',
    type: 'select',
    placeholder: 'All Order Sources',
    options: [
      { label: '📱 QR Code Orders', value: 'qr' },
      { label: '🌐 Online Web Orders', value: 'web' },
      { label: '🖥️ POS / Cashier', value: 'pos' },
      { label: '🧑‍🍳 Waiter Staff', value: 'waiter' },
      { label: '👥 Walk-in Customer', value: 'customer' },
    ],
  },
  {
    id: 'paymentMethod',
    label: 'Payment Method',
    type: 'select',
    placeholder: 'All Payment Methods',
    options: [
      { label: 'Cash', value: 'cash' },
      { label: 'Telebirr', value: 'telebirr' },
      { label: 'CBE Birr', value: 'cbe_birr' },
      { label: 'Credit / Debit Card', value: 'card' },
      { label: 'Bank Transfer', value: 'transfer' },
    ],
  },
  {
    id: 'amountRange',
    label: 'Order Bill Range (ETB)',
    type: 'number-range',
    min: 0,
    prefix: 'ETB',
  },
  {
    id: 'dateRange',
    label: 'Date Placed',
    type: 'date-range',
  },
  {
    id: 'phone',
    label: 'Customer Phone',
    type: 'text',
    placeholder: 'Filter by phone number...',
  },
  {
    id: 'tableNumber',
    label: 'Table / Location',
    type: 'text',
    placeholder: 'Table number or address...',
  },
  {
    id: 'orderType',
    label: 'Service Type',
    type: 'select',
    placeholder: 'All Service Types',
    options: [
      { label: '🍽️ Dine-In', value: 'dine_in' },
      { label: '🛍️ Takeaway', value: 'takeaway' },
      { label: '🛵 Delivery', value: 'delivery' },
    ],
  },
];

/**
 * Evaluates whether an order matches the active advanced filter criteria.
 */
export function matchOrderWithAdvancedFilters(
  order: any,
  advancedFilters?: Record<string, any>
): boolean {
  if (!advancedFilters) return true;

  // 1. Channel / Source
  if (advancedFilters.channel && advancedFilters.channel !== 'all') {
    const desired = String(advancedFilters.channel).toLowerCase();
    const source = String(order.source || '').toLowerCase();
    const channel = String(order.channel || '').toLowerCase();
    const isQr = order.isQrOrder === true;
    const orderChannel =
      typeof order.orderChannel === 'string'
        ? order.orderChannel.toLowerCase()
        : '';
    const notes =
      typeof order.notes === 'string' ? order.notes.toLowerCase() : '';

    if (desired === 'qr') {
      const matchesQr =
        source === 'qr' ||
        channel === 'qr' ||
        isQr ||
        orderChannel.includes('qr') ||
        notes.includes('qr');
      if (!matchesQr) return false;
    } else if (desired === 'web') {
      const matchesWeb =
        source === 'web' || channel === 'web' || orderChannel.includes('web');
      if (!matchesWeb) return false;
    } else if (desired === 'pos') {
      const matchesPos =
        source === 'pos' || channel === 'pos' || orderChannel.includes('pos');
      if (!matchesPos) return false;
    } else if (desired === 'waiter') {
      const matchesWaiter =
        source === 'waiter' ||
        Boolean(order.assignedWaiter) ||
        orderChannel.includes('waiter');
      if (!matchesWaiter) return false;
    } else if (desired === 'customer') {
      const matchesCust =
        source === 'customer' ||
        channel === 'customer' ||
        source === 'qr' ||
        isQr;
      if (!matchesCust) return false;
    }
  }

  // 2. Payment Method
  if (
    advancedFilters.paymentMethod &&
    advancedFilters.paymentMethod !== 'all'
  ) {
    const desired = String(advancedFilters.paymentMethod).toLowerCase();
    const method = String(
      order.paymentDetails?.method || order.paymentMethod || ''
    ).toLowerCase();
    if (!method.includes(desired)) return false;
  }

  // 3. Amount Range
  if (advancedFilters.amountRange) {
    const { min, max } = advancedFilters.amountRange;
    const amount = Number(order.totalAmount ?? order.subtotal ?? 0);
    if (min !== '' && min !== undefined && !isNaN(Number(min))) {
      if (amount < Number(min)) return false;
    }
    if (max !== '' && max !== undefined && !isNaN(Number(max))) {
      if (amount > Number(max)) return false;
    }
  }

  // 4. Date Range
  if (advancedFilters.dateRange) {
    const { from, to } = advancedFilters.dateRange;
    const placedTime = new Date(order.placedAt || order.createdAt).getTime();
    if (from) {
      const fromTime = new Date(from).setHours(0, 0, 0, 0);
      if (placedTime < fromTime) return false;
    }
    if (to) {
      const toTime = new Date(to).setHours(23, 59, 59, 999);
      if (placedTime > toTime) return false;
    }
  }

  // 5. Phone
  if (advancedFilters.phone && advancedFilters.phone.trim() !== '') {
    const q = advancedFilters.phone.toLowerCase().trim();
    const phone = String(order.customerPhone || '').toLowerCase();
    if (!phone.includes(q)) return false;
  }

  // 6. Table Number / Location
  if (advancedFilters.tableNumber && advancedFilters.tableNumber.trim() !== '') {
    const q = advancedFilters.tableNumber.toLowerCase().trim();
    const rawTable =
      typeof order.table === 'object' && order.table !== null
        ? order.table.tableNumber
        : order.tableNumber || order.table || '';
    const tableNum = String(rawTable || '').toLowerCase();
    const address = String(
      order.location?.formattedAddress || order.deliveryAddress || ''
    ).toLowerCase();
    if (!tableNum.includes(q) && !address.includes(q)) return false;
  }

  // 7. Order Type
  if (advancedFilters.orderType && advancedFilters.orderType !== 'all') {
    if (order.orderType !== advancedFilters.orderType) return false;
  }

  return true;
}

/**
 * Generic order filtering and sorting helper for all Order views.
 */
export function filterAndSortOrders<T extends Record<string, any>>(
  orders: T[],
  filters: OrderFilterState,
  now: number = Date.now()
): T[] {
  return orders
    .filter((order) => {
      // 1. Text Search
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const num = String(order.orderNumber || '').toLowerCase();
        const cust = String(order.customerName || '').toLowerCase();
        const phone = String(order.customerPhone || '').toLowerCase();
        const rawTable =
          typeof order.table === 'object' && order.table !== null
            ? order.table.tableNumber
            : order.tableNumber || order.table || '';
        const tableNum = String(rawTable || '').toLowerCase();
        const waiter = String(
          order.assignedWaiter?.fullName || order.waiterName || ''
        ).toLowerCase();
        const address = String(
          order.location?.formattedAddress || order.deliveryAddress || ''
        ).toLowerCase();

        const matches =
          num.includes(q) ||
          cust.includes(q) ||
          phone.includes(q) ||
          tableNum.includes(q) ||
          waiter.includes(q) ||
          address.includes(q);

        if (!matches) return false;
      }

      // 2. Order Type filter (if specified and not 'all')
      if (filters.orderType && filters.orderType !== 'all') {
        if (order.orderType !== filters.orderType) return false;
      }

      // 3. Status filter
      if (filters.status && filters.status !== 'all') {
        if (order.status !== filters.status) return false;
      }

      // 4. Payment status filter
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        if (order.paymentStatus !== filters.paymentStatus) return false;
      }

      // 5. Urgency
      if (filters.urgency === 'urgent') {
        const placed = order.placedAt || order.createdAt;
        if (placed) {
          const elapsed = (now - new Date(placed).getTime()) / (1000 * 60);
          if (elapsed < 20) return false;
        }
      }

      // 6. Advanced filters
      if (!matchOrderWithAdvancedFilters(order, filters.advancedFilters)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.placedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.placedAt || b.createdAt || 0).getTime();

      if (filters.sortBy === 'newest') {
        return timeB - timeA;
      }
      if (filters.sortBy === 'oldest') {
        return timeA - timeB;
      }
      if (filters.sortBy === 'urgency') {
        return timeA - timeB;
      }
      if (filters.sortBy === 'amount_high') {
        const amtA = Number(a.totalAmount ?? a.subtotal ?? 0);
        const amtB = Number(b.totalAmount ?? b.subtotal ?? 0);
        return amtB - amtA;
      }
      if (filters.sortBy === 'amount_low') {
        const amtA = Number(a.totalAmount ?? a.subtotal ?? 0);
        const amtB = Number(b.totalAmount ?? b.subtotal ?? 0);
        return amtA - amtB;
      }
      return 0;
    });
}
