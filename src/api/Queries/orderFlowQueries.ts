// src/api/Queries/orderFlowQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

// ============================================================
// Types
// ============================================================

export type ChannelName = 'waiter' | 'web' | 'admin' | 'telegram';

export type ReviewerRole = 'waiter' | 'support' | null;

export interface ChannelConfig {
  requiresReview: boolean;
  reviewerRole: ReviewerRole;
}

export interface OrderFlowConfig {
  _id?: string;
  merchant?: string;
  channels: {
    waiter: ChannelConfig;
    web: ChannelConfig;
    admin: ChannelConfig;
    telegram: ChannelConfig;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateChannelConfigRequest {
  channels: Partial<{
    waiter: ChannelConfig;
    web: ChannelConfig;
    admin: ChannelConfig;
    telegram: ChannelConfig;
  }>;
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ReviewQueueOrderItem {
  menuItem?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers?: Array<{
    name: string;
    price: number;
  }>;
}

export interface ReviewQueueOrder {
  _id: string;
  orderNumber: string;
  source: ChannelName | string;
  status: string;
  orderType?: 'dine_in' | 'takeaway' | 'delivery' | string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  table?: {
    _id?: string;
    tableNumber?: string;
  };
  totalAmount: number;
  placedAt: string;
  createdAt?: string;
  items: ReviewQueueOrderItem[];
  itemCount: number;
  elapsed?: string;
  urgency?: UrgencyLevel;
  reviewerRole?: ReviewerRole;
  assignedWaiter?: {
    _id: string;
    fullName: string;
  } | null;
  branch?: {
    _id?: string;
    name?: string;
  } | string;
}

export interface ReviewQueueResponse {
  orders: ReviewQueueOrder[];
  results?: number;
}

export const DEFAULT_ORDER_FLOW_CONFIG: OrderFlowConfig = {
  channels: {
    waiter: {
      requiresReview: false,
      reviewerRole: null,
    },
    web: {
      requiresReview: true,
      reviewerRole: 'waiter',
    },
    admin: {
      requiresReview: true,
      reviewerRole: 'support',
    },
    telegram: {
      requiresReview: true,
      reviewerRole: 'support',
    },
  },
};

// ============================================================
// Query Keys
// ============================================================

export const orderFlowKeys = {
  all: ['order-flow'] as const,
  config: () => [...orderFlowKeys.all, 'config'] as const,
  reviewQueue: () => [...orderFlowKeys.all, 'review-queue'] as const,
};

// ============================================================
// Helper: Calculate Urgency & Elapsed from placedAt
// ============================================================

export const calculateOrderUrgency = (
  placedAtDateString?: string
): { elapsed: string; urgency: UrgencyLevel; minutesAgo: number } => {
  if (!placedAtDateString) {
    return { elapsed: 'Just now', urgency: 'low', minutesAgo: 0 };
  }

  const placed = new Date(placedAtDateString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - placed);
  const minutesAgo = Math.floor(diffMs / (1000 * 60));

  let urgency: UrgencyLevel = 'low';
  if (minutesAgo >= 60) {
    urgency = 'critical';
  } else if (minutesAgo >= 30) {
    urgency = 'high';
  } else if (minutesAgo >= 15) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  let elapsed = `${minutesAgo}m ago`;
  if (minutesAgo === 0) elapsed = 'Just now';
  else if (minutesAgo >= 60) {
    const hours = Math.floor(minutesAgo / 60);
    const mins = minutesAgo % 60;
    elapsed = `${hours}h ${mins}m ago`;
  }

  return { elapsed, urgency, minutesAgo };
};

// ============================================================
// API Functions
// ============================================================

const fetchOrderFlowConfig = async (): Promise<OrderFlowConfig> => {
  try {
    const { data } = await api.get('/v1/order-flow-config');
    return data.data?.config ?? data.config ?? data.data ?? DEFAULT_ORDER_FLOW_CONFIG;
  } catch (error: any) {
    // Try fallback endpoint without prefix if needed
    try {
      const { data } = await api.get('/order-flow-config');
      return data.data?.config ?? data.config ?? data.data ?? DEFAULT_ORDER_FLOW_CONFIG;
    } catch {
      return DEFAULT_ORDER_FLOW_CONFIG;
    }
  }
};

const updateOrderFlowConfigApi = async (
  payload: UpdateChannelConfigRequest
): Promise<OrderFlowConfig> => {
  try {
    const { data } = await api.put('/v1/order-flow-config', payload);
    return data.data?.config ?? data.config ?? data.data;
  } catch (err: any) {
    const { data } = await api.put('/order-flow-config', payload);
    return data.data?.config ?? data.config ?? data.data;
  }
};

const fetchReviewQueueApi = async (): Promise<ReviewQueueOrder[]> => {
  try {
    const { data } = await api.get('/v1/order/review-queue');
    const rawOrders: any[] = data.data?.orders ?? data.orders ?? data.data ?? [];
    
    return rawOrders.map((ord) => {
      const placed = ord.placedAt || ord.createdAt;
      const { elapsed, urgency } = calculateOrderUrgency(placed);
      return {
        ...ord,
        elapsed: ord.elapsed || elapsed,
        urgency: ord.urgency || urgency,
        itemCount: ord.itemCount || ord.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0,
      };
    });
  } catch (err) {
    // Fallback: Check if there is an alternative endpoint /orders/review-queue or pending orders needing review
    try {
      const { data } = await api.get('/v1/orders/review-queue');
      const rawOrders: any[] = data.data?.orders ?? data.orders ?? [];
      return rawOrders.map((ord) => {
        const placed = ord.placedAt || ord.createdAt;
        const { elapsed, urgency } = calculateOrderUrgency(placed);
        return {
          ...ord,
          elapsed: ord.elapsed || elapsed,
          urgency: ord.urgency || urgency,
          itemCount: ord.itemCount || ord.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0,
        };
      });
    } catch {
      return [];
    }
  }
};

const approveReviewOrderApi = async (orderId: string): Promise<any> => {
  try {
    const { data } = await api.patch(`/v1/order/${orderId}/status`, {
      status: 'accepted',
    });
    return data.data?.order ?? data.order ?? data;
  } catch {
    const { data } = await api.patch(`/v1/orders/${orderId}/status`, {
      status: 'accepted',
    });
    return data.data?.order ?? data.order ?? data;
  }
};

const rejectReviewOrderApi = async ({
  orderId,
  reason,
}: {
  orderId: string;
  reason: string;
}): Promise<any> => {
  try {
    const { data } = await api.patch(`/v1/order/${orderId}/cancel`, { reason });
    return data.data?.order ?? data.order ?? data;
  } catch {
    const { data } = await api.patch(`/v1/orders/${orderId}/cancel`, { reason });
    return data.data?.order ?? data.order ?? data;
  }
};

// ============================================================
// React Query Hooks
// ============================================================

export const useOrderFlowConfigQuery = () =>
  useQuery<OrderFlowConfig, AxiosError>({
    queryKey: orderFlowKeys.config(),
    queryFn: fetchOrderFlowConfig,
    staleTime: 60_000,
  });

export const useUpdateOrderFlowConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OrderFlowConfig, AxiosError<any>, UpdateChannelConfigRequest>({
    mutationFn: updateOrderFlowConfigApi,
    onSuccess: (updated) => {
      queryClient.setQueryData(orderFlowKeys.config(), updated);
      queryClient.invalidateQueries({ queryKey: orderFlowKeys.config() });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order flow routing configuration updated successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update order flow configuration';
      toast.error(message);
    },
  });
};

export const useReviewQueueQuery = (options?: { refetchInterval?: number | false }) =>
  useQuery<ReviewQueueOrder[], AxiosError>({
    queryKey: orderFlowKeys.reviewQueue(),
    queryFn: fetchReviewQueueApi,
    refetchInterval: options?.refetchInterval ?? 15_000,
    staleTime: 10_000,
  });

export const useApproveReviewOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, string>({
    mutationFn: approveReviewOrderApi,
    onSuccess: (data, orderId) => {
      queryClient.setQueryData<ReviewQueueOrder[]>(
        orderFlowKeys.reviewQueue(),
        (old) => old?.filter((o) => o._id !== orderId) ?? []
      );
      queryClient.invalidateQueries({ queryKey: orderFlowKeys.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order approved and routed to kitchen for preparation');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to approve order';
      toast.error(message);
    },
  });
};

export const useRejectReviewOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, { orderId: string; reason: string }>({
    mutationFn: rejectReviewOrderApi,
    onSuccess: (data, { orderId }) => {
      queryClient.setQueryData<ReviewQueueOrder[]>(
        orderFlowKeys.reviewQueue(),
        (old) => old?.filter((o) => o._id !== orderId) ?? []
      );
      queryClient.invalidateQueries({ queryKey: orderFlowKeys.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order rejected and canceled');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to reject order';
      toast.error(message);
    },
  });
};
