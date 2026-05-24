// src/features/orders/store/orderSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  status: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  customer: { name: string; phone: string; address?: string };
  notes?: string;
  timeline: Array<{
    type: 'status' | 'note' | 'message';
    text: string;
    by: string;
    time: string;
  }>;
}

interface OrderState {
  orders: Order[];
  selectedOrderId: string | null;
  filterStatus: string | 'all';
  unreadCount: { [key: string]: number };
  cart: {
    items: CartItem[];
    totalAmount: number;
    tableId: string | null;
    tableNumber: string;
    orderType: 'dine_in' | 'takeaway' | 'delivery' | null;
    deliveryDetails?: {
      customerName: string;
      customerPhone: string;
      location: {
        coordinates: [number, number];
        city: string;
        specificArea?: string;
        building?: string;
        formattedAddress?: string;
      };
    };
  };
}

const initialState: OrderState = {
  orders: [],
  selectedOrderId: null,
  filterStatus: 'all',
  unreadCount: {},
  cart: {
    items: [],
    totalAmount: 0,
    tableId: null,
    tableNumber: '',
    orderType: null,
  },
};

const calculateTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders(state, action: PayloadAction<Order[]>) {
      state.orders = action.payload;
    },
    selectOrder(state, action: PayloadAction<string | null>) {
      state.selectedOrderId = action.payload;
      if (action.payload) {
        state.unreadCount[action.payload] = 0;
      }
    },
    setFilter(state, action: PayloadAction<string>) {
      state.filterStatus = action.payload;
    },

    // In orderSlice.ts
    setOrderContext(
      state,
      action: PayloadAction<{
        type: 'dine_in' | 'takeaway' | 'delivery';
        tableId?: string;
      }>
    ) {
      state.cart.orderType = action.payload.type;
      state.cart.tableId = action.payload.tableId || null;
      state.cart.tableNumber = action.payload.tableNumber;
    },

    addToCart(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const existingItem = state.cart.items.find(
        (item) => item.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cart.items.push({ ...action.payload, quantity: 1 });
      }
      state.cart.totalAmount = calculateTotal(state.cart.items);
    },

    setDeliveryDetails(
      state,
      action: PayloadAction<OrderState['cart']['deliveryDetails']>
    ) {
      state.cart.deliveryDetails = action.payload;
      state.cart.orderType = 'delivery';
    },

    updateCartQuantity(
      state,
      action: PayloadAction<{ id: string; delta: number }>
    ) {
      const item = state.cart.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.quantity += action.payload.delta;
      }
      state.cart.totalAmount = calculateTotal(state.cart.items);
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.cart.items = state.cart.items.filter(
        (item) => item.id !== action.payload
      );
      state.cart.totalAmount = calculateTotal(state.cart.items);
    },

    clearCart(state) {
      state.cart = initialState.cart;
    },

    addOrderUpdate(
      state,
      action: PayloadAction<{ orderId: string; update: any }>
    ) {
      const order = state.orders.find((o) => o._id === action.payload.orderId);
      if (order) {
        order.timeline.push(action.payload.update);
        if (state.selectedOrderId !== action.payload.orderId) {
          state.unreadCount[action.payload.orderId] =
            (state.unreadCount[action.payload.orderId] || 0) + 1;
        }
      }
    },
    markAsRead(state, action: PayloadAction<string>) {
      state.unreadCount[action.payload] = 0;
    },
  },
});

export const {
  setOrders,
  selectOrder,
  setFilter,
  addOrderUpdate,
  markAsRead,
  setOrderContext,
  addToCart,
  updateCartQuantity,
  setDeliveryDetails,
  removeFromCart,
  clearCart,
} = orderSlice.actions;

export default orderSlice.reducer;
