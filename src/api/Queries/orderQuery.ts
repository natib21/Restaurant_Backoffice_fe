import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

/* ======================================================
   TYPES
====================================================== */

export interface OrderItem {
  menuItem: string | { _id: string; name: string; image?: string };
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
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
    | 'completed'
    | 'canceled';
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
  customerName?: string;
  customerPhone?: string;
  items: {
<<<<<<< HEAD
    menuItemId: string;
    quantity: number;
    notes?: string;
=======
    menuItem: string;
    quantity: number;
    notes?: string;
    unitPrice: number;
    totalPrice: number;
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  }[];
  subtotal: number;
  notes?: string;
}

/* ======================================================
<<<<<<< HEAD
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
=======
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
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

const fetchOrders = async (
  params?: Record<string, any>
): Promise<OrdersResponse> => {
<<<<<<< HEAD
  const { data } = await api.get('/v1/order/active', { params });
  return parseOrdersResponse(data);
};

const fetchBranchOrders = async (
  branchId: string,
  params?: Record<string, any>
): Promise<OrdersResponse> => {
  return fetchOrders({ ...params, branchId });
};

const fetchActiveOrders = async (
  params?: Record<string, any>
): Promise<Order[]> => {
  const response = await fetchOrders(params);
  return response.orders;
};

const fetchStatusOrders = async (
  status: string,
  params?: Record<string, any>
): Promise<Order[]> => {
  const { data } = await api.get(`/v1/order/${status}`, { params });
  return data.data?.orders ?? [];
};

const fetchCompletedOrders = async (
  params?: Record<string, any>
): Promise<{
  orders: Order[];
  summary: OrdersSummary;
}> => {
  const { data } = await api.get('/v1/order/completed', { params });
  return {
    orders: data.data?.orders ?? [],
    summary: data.summary ?? data.data?.summary,
  };
=======
  const { data } = await api.get('/v1/order', { params });
  return data.data;
};
const fetchBranchOrders = async (branchId: string): Promise<OrdersResponse> => {
  const { data } = await api.get(`/v1/order/${branchId}/orders`);
  return data.data;
};
const fetchActiveOrders = async (): Promise<Order[]> => {
  const { data } = await api.get('/v1/order/active');
  return data.data.orders;
};

const fetchStatusOrders = async (status: string): Promise<Order[]> => {
  const { data } = await api.get(`/v1/order/${status}`);
  return data.data.orders;
};

const fetchCompletedOrders = async (): Promise<{
  orders: Order[];
  summary: OrdersSummary;
}> => {
  const { data } = await api.get('/v1/order/completed');
  return data.data;
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
};

const fetchOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const { data } = await api.get(`/v1/order/number/${orderNumber}`);
<<<<<<< HEAD
  return parseOrder(data);
};

const fetchOrderById = async (orderId: string): Promise<Order> => {
  const { data } = await api.get(`/v1/order/${orderId}`);
  return parseOrder(data);
=======
  return data.data.order;
};
const fetchOrderById = async (orderId: string): Promise<Order> => {
  const { data } = await api.get(`/v1/order/${orderId}`);
  return data.data.order;
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
};

const updateOrderStatus = async ({
  orderId,
  status,
}: {
  orderId: string;
  status: Order['status'];
}): Promise<Order> => {
  const { data } = await api.patch(`/v1/order/${orderId}/status`, { status });
<<<<<<< HEAD
  return parseOrder(data);
=======
  return data.data.order;
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
};

const markOrderAsPaid = async ({
  orderId,
  data,
}: {
  orderId: string;
  data: FormData;
}): Promise<Order> => {
<<<<<<< HEAD
  const response = await api.post(`/v1/order/${orderId}/pay`, data);
  return parseOrder(response.data);
};

=======
  // Pass 'data' as the second argument (the request body)
  const response = await api.post(`/v1/order/${orderId}/pay`, data);
  return response.data.data.order;
};
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
const createStaffOrder = async (
  payload: StaffCreateOrderPayload
): Promise<Order> => {
  const { data } = await api.post('/v1/order/staff', payload);
<<<<<<< HEAD
  return parseOrder(data);
=======
  return data.data.order;
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
};

// -------- CUSTOMER --------

const fetchMyActiveOrder = async (): Promise<Order | null> => {
  const { data } = await api.get('/v1/order/my-active');
  return data.data.order;
};

const fetchMyOrderHistory = async (): Promise<Order[]> => {
  const { data } = await api.get('/v1/order/my-history');
  return data.data.orders;
};

/* ======================================================
   QUERIES
====================================================== */

export const useOrdersQuery = (filters?: Record<string, any>) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    staleTime: 120000,
  });
<<<<<<< HEAD
export const useBranchOrdersQuery = (
  branchId?: string | null,
  filters?: Record<string, any>
) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.byBranch(branchId ?? 'none'),
    queryFn: () => fetchBranchOrders(branchId!, filters),
=======
export const useBranchOrdersQuery = (branchId?: string | null) =>
  useQuery<OrdersResponse, AxiosError>({
    queryKey: orderKeys.byBranch(branchId ?? 'none'),
    queryFn: () => fetchBranchOrders(branchId!),
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
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
    { orderId: string; status: Order['status'] }
  >({
    mutationFn: updateOrderStatus,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} → ${order.status}`);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.active() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
    },
  });
};

export const useMarkOrderAsPaidMutation = () => {
  const queryClient = useQueryClient();

  // Change 'string' to '{ orderId: string, data: FormData }'
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
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    },
  });
};
