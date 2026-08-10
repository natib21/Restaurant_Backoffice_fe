import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Inventory Types
export interface StockAdjustmentRequest {
  ingredientId: string;
  quantity: number;
  type: 'in' | 'out' | 'waste' | 'adjustment';
  reason: string;
  reference?: string; // e.g., PO number
  cost?: number; // Per-unit cost
}

export interface BatchAdjustmentRequest {
  adjustments: StockAdjustmentRequest[];
}

export interface StockMovement {
  _id: string;
  ingredient: {
    _id: string;
    name: string;
    unit: string;
  };
  quantity: number;
  type: 'in' | 'out' | 'waste' | 'adjustment';
  reason: string;
  reference?: string;
  costPerUnit?: number;
  movementValue?: number; // quantity * costPerUnit
  balance: number; // Stock balance after this movement
  createdBy: string;
  createdAt: string;
}

export interface InventoryValuation {
  totalValue: number; // Sum of all (currentStock * costPerUnit)
  totalItems: number; // Count of ingredients
  ingredients: Array<{
    ingredientId: string;
    name: string;
    currentStock: number;
    unit: string;
    costPerUnit: number;
    value: number;
  }>;
}

export interface LowStockItem {
  _id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier: {
    _id: string;
    name: string;
  };
  daysToReorder?: number; // Based on consumption rate
}

export interface OrderValidationItem {
  ingredientId: string;
  quantity: number;
  recipeId?: string; // If this is a recipe ingredient
}

export interface OrderValidationResponse {
  available: boolean;
  shortages?: Array<{
    ingredientId: string;
    required: number;
    available: number;
    unit: string;
  }>;
}

export interface AdjustmentResponse {
  status: string;
  message: string;
  data: {
    ingredient: {
      _id: string;
      name: string;
      currentStock: number;
      unit: string;
    };
  };
}

export interface MovementListResponse {
  status: string;
  results: number;
  data: {
    movements: StockMovement[];
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ValuationResponse {
  status: string;
  data: {
    valuation: InventoryValuation;
  };
}

export interface LowStockResponse {
  status: string;
  results: number;
  data: {
    items: LowStockItem[];
  };
}

// Single stock adjustment
export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StockAdjustmentRequest) => {
      const response = await api.post('/v1/inventory/adjust', data);
      return response.data as AdjustmentResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};

// Batch stock adjustments
export const useBatchAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BatchAdjustmentRequest) => {
      const response = await api.post('/v1/inventory/batch-adjust', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};

// Get stock movements (audit log)
export const useGetInventoryMovements = (params?: {
  ingredientId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery<MovementListResponse>({
    queryKey: ['inventoryMovements', params],
    queryFn: async () => {
      const response = await api.get('/v1/inventory/movements', { params });
      return response.data;
    },
  });
};

// Get inventory valuation
export const useGetInventoryValuation = () => {
  return useQuery<ValuationResponse>({
    queryKey: ['inventoryValuation'],
    queryFn: async () => {
      const response = await api.get('/v1/inventory/valuation');
      return response.data;
    },
  });
};

// Get low stock items
export const useGetLowStockItems = () => {
  return useQuery<LowStockResponse>({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      const response = await api.get('/v1/inventory/low-stock');
      return response.data;
    },
  });
};

// Set min/max thresholds for an ingredient
export const useSetStockThresholds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ingredientId,
      minStock,
      maxStock,
    }: {
      ingredientId: string;
      minStock: number;
      maxStock: number;
    }) => {
      const response = await api.patch(`/v1/inventory/${ingredientId}/thresholds`, {
        minStock,
        maxStock,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};

// Validate order (check if we have enough stock)
export const useValidateOrder = () => {
  return useMutation({
    mutationFn: async (items: OrderValidationItem[]) => {
      const response = await api.post('/v1/inventory/validate-order', { items });
      return response.data as { status: string; data: OrderValidationResponse };
    },
  });
};
