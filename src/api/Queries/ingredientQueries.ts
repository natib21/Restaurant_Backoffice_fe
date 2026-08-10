import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Ingredient Types
export interface IngredientCreateRequest {
  name: string;
  category: 'vegetables' | 'meat' | 'dairy' | 'grains' | 'spices' | 'beverages' | 'other';
  unit: 'kg' | 'g' | 'liter' | 'ml' | 'pieces' | 'boxes' | 'cans';
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  supplier: string; // Supplier _id
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
  supplier: {
    _id: string;
    name: string;
  };
  expiryDate?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'; // Virtual field
  merchant: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientListResponse {
  status: string;
  results: number;
  data: {
    ingredients: Ingredient[];
  };
}

// List all ingredients
export const useGetIngredientsList = () => {
  return useQuery<IngredientListResponse>({
    queryKey: ['ingredientsList'],
    queryFn: async () => {
      const response = await api.get('/v1/ingredients');
      return response.data;
    },
  });
};

// Get ingredient by ID
export const useGetIngredientDetails = (ingredientId?: string) => {
  return useQuery<{ status: string; data: { ingredient: Ingredient } }>({
    queryKey: ['ingredientDetails', ingredientId],
    queryFn: async () => {
      if (!ingredientId) throw new Error('Ingredient ID is required');
      const response = await api.get(`/v1/ingredients/${ingredientId}`);
      return response.data;
    },
    enabled: !!ingredientId,
  });
};

// Create ingredient
export const useCreateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IngredientCreateRequest) => {
      const response = await api.post('/v1/ingredients', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
    },
  });
};

// Update ingredient
export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ingredientId, data }: { ingredientId: string; data: Partial<IngredientCreateRequest> }) => {
      const response = await api.patch(`/v1/ingredients/${ingredientId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredientDetails', variables.ingredientId] });
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
    },
  });
};

// Delete/deactivate ingredient
export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredientId: string) => {
      const response = await api.delete(`/v1/ingredients/${ingredientId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
    },
  });
};
