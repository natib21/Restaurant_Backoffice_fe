import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

/* ======================================================
   TYPES
====================================================== */

export type ItemStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'ready' 
  | 'served' 
  | 'void';

export type ServedVia = 'auto' | 'manual';

export interface OrderItem {
  _id?: string;
  menuItem: string | { _id: string; name: string; image?: string; [key: string]: any };
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers?: Array<{ name: string; price: number }>;
  // Item status workflow fields
  requiresKitchen?: boolean;
  status?: ItemStatus;
  servedAt?: string | null;
  servedBy?: { _id?: string; fullName?: string; firstName?: string; lastName?: string } | string | null;
  servedVia?: ServedVia | null;
  voidedAt?: string | null;
  voidedBy?: { _id?: string; fullName?: string } | string | null;
  voidReason?: string | null;
  replacementItemId?: string | null;
  replacedItemId?: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  merchant: string;
  branch?: string;
  customer?: string;
  customerName: string;
  customerPhone?: string;
  table?: string;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  status:
    | 'pending'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'served'
    | 'out_for_delivery'
    | 'delivered'
    | 'completed'
    | 'canceled'
    | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  placedAt: string;
  placedBy: { firstName: string; lastName: string };
  acceptedAt?: string;
  readyAt?: string;
  servedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  canceledReason?: string;
  assignedWaiter?: { _id: string; fullName: string } | null;
  assignedKitchenStaff?: { _id: string; fullName: string } | null;
  notes?: string;
  itemCount?: number;
  elapsed?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface OrdersSummary {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  avgOrderValue: number;
}

export interface OrdersResponse {
  orders: Order[];
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  summary?: OrdersSummary;
}

/* ======================================================
   STAFF CREATE ORDER PAYLOAD
====================================================== */

export interface StaffCreateOrderPayload {
  branchId: string | null;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | null;
  tableId?: string | null;
  tableNumber?: string | null;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    unitPrice?: number;
    totalPrice?: number;
    name?: string;
  }[];
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  notes?: string;
}

/* ======================================================
   RESPONSE HELPERS
====================================================== */

const parseOrder = (payload: any): Order => {
  const body = payload?.data ?? payload;
  return body?.order ?? body;
};

const parseOrdersResponse = (payload: any): OrdersResponse => {
  const body = payload?.data ?? payload;
  return {
    orders: body?.orders ?? [],
    count: body?.count ?? payload?.meta?.count,
    total: payload?.total,
    page: payload?.page,
    pages: payload?.pages,
    summary: payload?.summary ?? body?.summary,
  };
};

/* ======================================================
   QUERY KEYS
====================================================== */

const orderKeys = {
  all: ['orders'] as const,
  list: (filters?: Record<string, any>) =>
    [...orderKeys.all, 'list', filters ?? 'all'] as const,
  active: () => [...orderKeys.all, 'active'] as const,
  pending: () => [...orderKeys.all, 'pending'] as const,
  accepted: () => [...orderKeys.all, 'accepted'] as const,
  preparing: () => [...orderKeys.all, 'preparing'] as const,
  ready: () => [...orderKeys.all, 'ready'] as const,
  served: () => [...orderKeys.all, 'served'] as const,
  completed: () => [...orderKeys.all, 'completed'] as const,
  canceled: () => [...orderKeys.all, 'canceled'] as const,
  allDbOrders: (filters?: Record<string, any>) =>
    [...orderKeys.all, 'all-db', filters ?? 'all'] as const,
  byBranchAll: (branchId: string, filters?: Record<string, any>) =>
    [...orderKeys.all, 'byBranchAll', branchId, filters ?? 'all'] as const,
  byNumber: (orderNumber: string) =>
    [...orderKeys.all, 'byNumber', orderNumber] as const,
  byBranch: (branchId: string) =>
    [...orderKeys.all, 'byBranch', branchId] as const,
  byId: (orderId: string) => [...orderKeys.all, 'byId', orderId] as const,
  myActive: () => [...orderKeys.all, 'my-active'] as const,
  myHistory: () => [...orderKeys.all, 'my-history'] as const,
};

/* ======================================================
   API FUNCTIONS
====================================================== */

// -------- STAFF --------

const fetchActiveOrdersResponse = async (
  params?: Record<string, any>
): Promise<OrdersResponse> => {
  const { data } = await api.get('/v1/order/active', { params });
  return parseOrdersResponse(data);
};

const fetchAllOrdersResponse = async (
  params?: Record<string, any>
): Promise<OrdersResponse> => {
  try {
    const { data } = await api.get('/v1/order', { params });
    const parsed = parseOrdersResponse(data);
    if (parsed.orders && parsed.orders.length > 0) {
      return parsed;
    }
  } catch (err: any) {
    console.debug('Direct /v1/order query fallback', err);
  }

  // Fallback / Aggregation: Query both active and completed orders to guarantee all statuses are fetched
  try {
    const [activeRes, completedRes] = await Promise.allSettled([
      api.get('/v1/order/active', { params }),
      api.get('/v1/order/completed', { params }),
    ]);

    const activeOrders: Order[] =
      activeRes.status === 'fulfilled'
        ? (activeRes.value.data?.data?.orders ?? activeRes.value.data?.orders ?? [])
        : [];
    const completedOrders: Order[] =
      completedRes.status === 'fulfilled'
        ? (completedRes.value.data?.data?.orders ?? completedRes.value.data?.orders ?? [])
        : [];

    const orderMap = new Map<string, Order>();
    [...activeOrders, ...completedOrders].forEach((ord) => {
      const id = ord._id || (ord as any).id;
      if (id) {
        orderMap.set(id, ord);
      }
    });

    const allOrders = Array.from(orderMap.values());
    return {
      orders: allOrders,
      total: allOrders.length,
      count: allOrders.length,
    };
  } catch (fallbackError) {
    const { data } = await api.get('/v1/order/active', { params });
    return parseOrdersResponse(data);
  }
};

const fetchOrders = async (
  params?: Record<string, any>
): Promise<OrdersResponse> => {
  return fetchActiveOrdersResponse(params);
};

const fetchBranchOrders = async (
  branchId: string,
  params?: Record<string, any>
): Promise<OrdersResponse> => {
  return fetchOrders({ ...params, branchId });
};

const fetchBranchAllOrders = async (
  branchId: string,
  params?: Record<string, any>
): Promise<OrdersResponse> => {
  return fetchAllOrdersResponse({ ...params, branchId });
};

const fetchActiveOrders = async (
  params?: Record<string, any>
): Promise<Order[]> => {
  const response = await fetchActiveOrdersResponse(params);
  return response.orders;
};

const fetchStatusOrders = async (
  status: string,
  params?: Record<string, any>
): Promise<Order[]> => {
  const { data } = await api.get(`/v1/order/${status}`, { params });
  return data.data?.orders ?? data.orders ?? [];
};

const fetchCompletedOrders = async (
  params?: Record<string, any>
): Promise<{
  orders: Order[];
  summary: OrdersSummary;
}> => {
  const { data } = await api.get('/v1/order/completed', { params });
  return {
    orders: data.data?.orders ?? data.orders ?? [],
    summary: data.summary ?? data.data?.summary ?? {
      totalRevenue: 0,
      totalOrders: 0,
      paidOrders: 0,
      avgOrderValue: 0,
    },
  };
};

const fetchOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const cleanNumber = orderNumber.replace(/^#/, '');
  const { data } = await api.get(`/v1/order/number/${cleanNumber}`);
  return parseOrder(data);
};

const fetchOrderById = async (orderId: string): Promise<Order> => {
  const { data } = await api.get(`/v1/order/${orderId}`);
  return parseOrder(data);
};

const updateOrderStatus = async ({
  orderId,
  status,
  reason,
  assignedWaiter,
  assignedKitchenStaff,
}: {
  orderId: string;
  status: Order['status'];
  reason?: string;
  assignedWaiter?: string;
  assignedKitchenStaff?: string;
}): Promise<Order> => {
  const { data } = await api.patch(`/v1/order/${orderId}/status`, {
    status,
    reason,
    assignedWaiter,
    assignedKitchenStaff,
  });
  return parseOrder(data);
};

const cancelOrder = async ({
  orderId,
  reason,
}: {
  orderId: string;
  reason?: string;
}): Promise<Order> => {
  const { data } = await api.patch(`/v1/order/${orderId}/cancel`, { reason });
  return parseOrder(data);
};

const markOrderAsPaid = async ({
  orderId,
  data,
}: {
  orderId: string;
  data: FormData;
}): Promise<Order> => {
  const response = await api.post(`/v1/order/${orderId}/pay`, data);
  return parseOrder(response.data);
};

const createStaffOrder = async (
  payload: StaffCreateOrderPayload
): Promise<Order> => {
  const { data } = await api.post('/v1/order/staff', payload);
  return parseOrder(data);
};

// Kitchen / KDS API functions
const fetchKitchenTicketsForOrder = async (orderId: string): Promise<any[]> => {
  const { data } = await api.get(`/v1/kitchen/orders/${orderId}/tickets`);
  return data.data?.tickets ?? [];
};

const fetchKitchenStations = async (): Promise<any[]> => {
  const { data } = await api.get('/v1/kitchen/stations');
  return data.data?.stations ?? [];
};

const fetchKitchenTickets = async (params?: Record<string, any>): Promise<any[]> => {
  const { data } = await api.get('/v1/kitchen/tickets', { params });
  return data.data?.tickets ?? [];
};

const updateKitchenTicketStatus = async ({
  ticketId,
  action,
  reason,
}: {
  ticketId: string;
  action: 'accept' | 'start' | 'ready' | 'cancel' | 'status';
  status?: string;
  reason?: string;
}): Promise<any> => {
  if (action === 'status') {
    const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/status`, { status: action, reason });
    return data.data?.ticket ?? data;
  }
  const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/${action}`, { reason });
  return data.data?.ticket ?? data;
};

// -------- CUSTOMER --------

const fetchMyActiveOrder = async (): Promise<Order | null> => {
  const { data } = await api.get('/v1/order/my-active');
  return data.data?.order ?? null;
};

const fetchMyOrderHistory = async (): Promise<Order[]> => {
  const { data } = await api.get('/v1/order/my-history');
  return data.data?.orders ?? [];
};

/* ======================================================
   QUERIES
====================================================== */

export const useOrdersQuery = (filters?: Record<string, any>) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    staleTime: 60000,
    refetchInterval: 15000,
  });

export const useAllOrdersQuery = (filters?: Record<string, any>) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.allDbOrders(filters),
    queryFn: () => fetchAllOrdersResponse(filters),
    staleTime: 60000,
    refetchInterval: 15000,
  });

export const useBranchAllOrdersQuery = (
  branchId?: string | null,
  filters?: Record<string, any>
) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.byBranchAll(branchId ?? 'none', filters),
    queryFn: () => fetchBranchAllOrders(branchId!, filters),
    enabled: !!branchId && branchId.trim() !== '',
    staleTime: 60_000,
  });

export const useCurrentBranchOrAllDbOrdersQuery = (
  currentBranchId?: string | null,
  filters?: Record<string, any>
) => {
  const branchQuery = useBranchAllOrdersQuery(currentBranchId, filters);
  const allQuery = useAllOrdersQuery(filters);
  return currentBranchId ? branchQuery : allQuery;
};
export const useBranchOrdersQuery = (
  branchId?: string | null,
  filters?: Record<string, any>
) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.byBranch(branchId ?? 'none'),
    queryFn: () => fetchBranchOrders(branchId!, filters),
    enabled: !!branchId && branchId.trim() !== '',
    staleTime: 60_000,
  });
export const useCurrentBranchOrAllOrdersQuery = (
  currentBranchId?: string | null
) => {
  // If branch is selected → use branch endpoint
  const branchQuery = useBranchOrdersQuery(currentBranchId);

  // If no branch → use all orders endpoint
  const allQuery = useOrdersQuery();

  // Return the appropriate one
  return currentBranchId ? branchQuery : allQuery;
};
export const useActiveOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.active(),
    queryFn: fetchActiveOrders,
    refetchInterval: 10000,
  });

export const usePendingOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.pending(),
    queryFn: () => fetchStatusOrders('pending'),
  });

export const useAcceptedOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.accepted(),
    queryFn: () => fetchStatusOrders('accepted'),
  });

export const usePreparingOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.preparing(),
    queryFn: () => fetchStatusOrders('preparing'),
  });

export const useReadyOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.ready(),
    queryFn: () => fetchStatusOrders('ready'),
  });

export const useServedOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.served(),
    queryFn: () => fetchStatusOrders('served'),
  });

export const useCompletedOrdersQuery = () =>
  useQuery<{ orders: Order[]; summary: OrdersSummary }, AxiosError>({
    queryKey: orderKeys.completed(),
    queryFn: fetchCompletedOrders,
  });

export const useCanceledOrdersQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.canceled(),
    queryFn: () => fetchStatusOrders('canceled'),
  });

export const useOrderByNumberQuery = (orderNumber?: string) =>
  useQuery<Order, AxiosError>({
    queryKey: orderKeys.byNumber(orderNumber as string),
    queryFn: () => fetchOrderByNumber(orderNumber as string),
    enabled: !!orderNumber,
  });
export const useOrderByIdQuery = (orderId?: string) =>
  useQuery<Order, AxiosError>({
    queryKey: orderKeys.byId(orderId as string),
    queryFn: () => fetchOrderById(orderId as string),
    enabled: !!orderId,
    staleTime: 30_000,
  });

export const useMyActiveOrderQuery = () =>
  useQuery<Order | null, AxiosError>({
    queryKey: orderKeys.myActive(),
    queryFn: fetchMyActiveOrder,
  });

export const useMyOrderHistoryQuery = () =>
  useQuery<Order[], AxiosError>({
    queryKey: orderKeys.myHistory(),
    queryFn: fetchMyOrderHistory,
  });

/* ======================================================
   MUTATIONS
====================================================== */

export const useCreateStaffOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, AxiosError<any>, StaffCreateOrderPayload>({
    mutationFn: createStaffOrder,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} placed successfully`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.pending() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });
};

export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    AxiosError<any>,
    {
      orderId: string;
      status: Order['status'];
      reason?: string;
      assignedWaiter?: string;
      assignedKitchenStaff?: string;
    }
  >({
    mutationFn: updateOrderStatus,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} → ${order.status}`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(order._id) });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
    },
  });
};

export const useCancelOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, AxiosError<any>, { orderId: string; reason?: string }>({
    mutationFn: cancelOrder,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} canceled`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(order._id) });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });
};

export const useMarkOrderAsPaidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    AxiosError<any>,
    { orderId: string; data: FormData }
  >({
    mutationFn: markOrderAsPaid,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} marked as paid 💰`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(order._id) });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    },
  });
};

export interface AddItemPayload {
  menuItemId?: string;
  menuItem?: string;
  quantity: number;
  notes?: string;
  specialInstructions?: string;
}

export const useAddItemsToOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    AxiosError<any>,
    { orderId: string; items: AddItemPayload[] }
  >({
    mutationFn: async ({ orderId, items }) => {
      // Map to conform to API: { menuItemId, quantity, notes }
      const formattedItems = items.map((i) => ({
        menuItemId: i.menuItemId || i.menuItem,
        quantity: i.quantity,
        notes: i.notes || i.specialInstructions || '',
      }));
      const { data } = await api.patch(`/v1/order/${orderId}/add-items`, { items: formattedItems });
      return data.data?.order || data.order;
    },
    onSuccess: (order) => {
      toast.success(`Items added to Order ${order.orderNumber}`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(order._id) });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add items to order');
    },
  });
};

/* ======================================================
   KITCHEN / KDS QUERIES & MUTATIONS
====================================================== */

export const useKitchenTicketsForOrderQuery = (orderId?: string) =>
  useQuery<any[], AxiosError>({
    queryKey: ['kitchen', 'tickets', 'order', orderId],
    queryFn: () => fetchKitchenTicketsForOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: 10000,
  });

export const useKitchenStationsQuery = () =>
  useQuery<any[], AxiosError>({
    queryKey: ['kitchen', 'stations'],
    queryFn: fetchKitchenStations,
    staleTime: 60000,
  });

export const useKitchenTicketsQuery = (params?: Record<string, any>) =>
  useQuery<any[], AxiosError>({
    queryKey: ['kitchen', 'tickets', params],
    queryFn: () => fetchKitchenTickets(params),
    refetchInterval: 8000,
  });

export const useUpdateKitchenTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    AxiosError<any>,
    {
      ticketId: string;
      action: 'accept' | 'start' | 'ready' | 'cancel' | 'status';
      status?: string;
      reason?: string;
    }
  >({
    mutationFn: updateKitchenTicketStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update kitchen ticket');
    },
  });
};

/* ======================================================
   ORDER ITEM STATUS MUTATIONS (ITEM-LEVEL WORKFLOW)
====================================================== */

export const useUpdateOrderItemStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    AxiosError<any>,
    {
      orderId: string;
      itemId: string;
      status: ItemStatus;
    }
  >({
    mutationFn: async ({ orderId, itemId, status }) => {
      const { data } = await api.patch(
        `/v1/order/${orderId}/items/${itemId}/status`,
        { status }
      );
      return data.data || data;
    },
    onSuccess: (data, variables) => {
      if (data?.noop) {
        toast.info(`Item status was already set to ${variables.status}`);
      } else {
        toast.success(`Item status updated to ${variables.status}`);
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update item status'
      );
    },
  });
};

export const useBulkServeReadyItemsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    AxiosError<any>,
    {
      orderId: string;
    }
  >({
    mutationFn: async ({ orderId }) => {
      const { data } = await api.post(
        `/v1/order/${orderId}/items/serve-ready`
      );
      return data.data || data;
    },
    onSuccess: (data, variables) => {
      const count = data?.servedCount ?? (Array.isArray(data?.servedItems) ? data.servedItems.length : 0);
      if (count > 0) {
        toast.success(`Successfully served ${count} ready ${count === 1 ? 'item' : 'items'}`);
      } else {
        toast.info(data?.message || 'No ready items to serve');
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(variables.orderId) });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to serve ready items'
      );
    },
  });
};

export const useVoidOrderItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    AxiosError<any>,
    {
      orderId: string;
      itemId: string;
      reason: string;
      createReplacement?: boolean;
    }
  >({
    mutationFn: async ({ orderId, itemId, reason, createReplacement }) => {
      const { data } = await api.patch(
        `/v1/order/${orderId}/items/${itemId}/void`,
        { reason, createReplacement: !!createReplacement }
      );
      return data.data || data;
    },
    onSuccess: (data, variables) => {
      if (data?.replacementItem || variables.createReplacement) {
        toast.success('Item voided and replacement item created for kitchen');
      } else {
        toast.success('Item voided successfully');
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
      queryClient.invalidateQueries({ queryKey: orderKeys.byId(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to void item'
      );
    },
  });
};


