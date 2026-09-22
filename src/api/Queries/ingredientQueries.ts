import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Ingredient Types
export interface IngredientCreateRequest {
  name: string;
  category: 'vegetables' | 'meat' | 'dairy' | 'grains' | 'spices' | 'beverages' | 'other';
  unit: 'kg' | 'g' | 'liter' | 'ml' | 'pieces' | 'boxes' | 'cans';
  currentStock?: number;
  minStock: number;
  maxStock?: number;
  costPerUnit?: number;
  branchId?: string;
  branch?: string;
  supplier?: string; // Supplier _id
  expiryDate?: string; // ISO date string
}

export interface Ingredient {
  _id: string;
  name: string;
  category: 'vegetables' | 'meat' | 'dairy' | 'grains' | 'spices' | 'beverages' | 'other';
  unit: 'kg' | 'g' | 'liter' | 'ml' | 'pieces' | 'boxes' | 'cans';
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  branch?: string;
  branchId?: string;
  deficit?: number;
  supplier?: {
    _id: string;
    name: string;
  } | string;
  expiryDate?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'; // Virtual field
  merchant?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IngredientListResponse {
  status: string;
  results?: number;
  data: {
    ingredients: Ingredient[];
  };
}

// List all ingredients (branch-scoped if branchId is provided)
export const useGetIngredientsList = (branchId?: string) => {
  return useQuery<IngredientListResponse>({
    queryKey: ['ingredientsList', branchId],
    queryFn: async () => {
      const params = branchId ? { branchId } : undefined;
      try {
        const response = await api.get('/v1/inventory/ingredients', { params });
        return response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallback = await api.get('/v1/ingredients', { params });
          return fallback.data;
        }
        throw err;
      }
    },
  });
};

// Get ingredient by ID
export const useGetIngredientDetails = (ingredientId?: string) => {
  return useQuery<{ status: string; data: { ingredient: Ingredient } }>({
    queryKey: ['ingredientDetails', ingredientId],
    queryFn: async () => {
      if (!ingredientId) throw new Error('Ingredient ID is required');
      try {
        const response = await api.get(`/v1/inventory/ingredients/${ingredientId}`);
        return response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallback = await api.get(`/v1/ingredients/${ingredientId}`);
          return fallback.data;
        }
        throw err;
      }
    },
    enabled: !!ingredientId,
  });
};

// Create ingredient
export const useCreateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IngredientCreateRequest) => {
      try {
        const response = await api.post('/v1/inventory/ingredients', data);
        return response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallback = await api.post('/v1/ingredients', data);
          return fallback.data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};

// Update ingredient
export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ingredientId, data }: { ingredientId: string; data: Partial<IngredientCreateRequest> }) => {
      try {
        const response = await api.patch(`/v1/inventory/ingredients/${ingredientId}`, data);
        return response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallback = await api.patch(`/v1/ingredients/${ingredientId}`, data);
          return fallback.data;
        }
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredientDetails', variables.ingredientId] });
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};

// Delete/deactivate ingredient
export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredientId: string) => {
      try {
        const response = await api.delete(`/v1/inventory/ingredients/${ingredientId}`);
        return response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallback = await api.delete(`/v1/ingredients/${ingredientId}`);
          return fallback.data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
};
