import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Purchase Order Types
export interface PurchaseOrderItem {
  ingredient: string; // Ingredient _id
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderItemResponse {
  ingredient: {
    _id: string;
    name: string;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}

export interface PurchaseOrderCreateRequest {
  supplier: string; // Supplier _id
  status?: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  taxAmount?: number;
  expectedDeliveryDate?: string; // ISO date string
  notes?: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string; // Auto-generated: PO-YYYYMMDD-NNN
  supplier: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  items: PurchaseOrderItemResponse[];
  subtotal: number; // Sum of items.totalPrice
  taxAmount: number;
  totalAmount: number; // subtotal + taxAmount
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string; // Set when received
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  merchant: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderListResponse {
  status: string;
  results: number;
  data: {
    purchaseOrders: PurchaseOrder[];
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ReceiveGoodsRequest {
  receivedItems: Array<{
    ingredientId: string;
    receivedQuantity: number;
  }>;
}

// List purchase orders
export const useGetPurchaseOrdersList = (params?: {
  status?: string;
  supplier?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<PurchaseOrderListResponse>({
    queryKey: ['purchaseOrdersList', params],
    queryFn: async () => {
      const response = await api.get('/v1/purchase-orders', { params });
      return response.data;
    },
  });
};

// Get purchase order by ID
export const useGetPurchaseOrderDetails = (poId?: string) => {
  return useQuery<{ status: string; data: { purchaseOrder: PurchaseOrder } }>({
    queryKey: ['purchaseOrderDetails', poId],
    queryFn: async () => {
      if (!poId) throw new Error('Purchase Order ID is required');
      const response = await api.get(`/v1/purchase-orders/${poId}`);
      return response.data;
    },
    enabled: !!poId,
  });
};

// Create purchase order
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PurchaseOrderCreateRequest) => {
      const response = await api.post('/v1/purchase-orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrdersList'] });
    },
  });
};

// Update purchase order
export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, data }: { poId: string; data: Partial<PurchaseOrderCreateRequest> }) => {
      const response = await api.patch(`/v1/purchase-orders/${poId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrdersList'] });
    },
  });
};

// Delete purchase order
export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poId: string) => {
      const response = await api.delete(`/v1/purchase-orders/${poId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrdersList'] });
    },
  });
};

// Receive goods (marks PO as received and auto-adjusts stock)
export const useReceiveGoodsForPO = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, data }: { poId: string; data: ReceiveGoodsRequest }) => {
      const response = await api.post(`/v1/purchase-orders/${poId}/receive`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};
