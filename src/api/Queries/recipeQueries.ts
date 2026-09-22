import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Recipe Types
export interface RecipeItem {
  ingredientName?: string; // ⚠️ STRING, required by backend
  ingredient?: string; // Ingredient _id for backward compatibility
  quantity: number;
  unit: string;
}

export interface RecipeItemDetail {
  ingredient?: {
    _id?: string;
    name?: string;
    currentStock?: number;
    unit?: string;
  } | string;
  ingredientName?: string;
  quantity: number;
  unit: string;
}

export interface RecipeCreateRequest {
  menuItem?: string; // Menu _id
  menuItemId?: string; // Menu _id (as per guide)
  name: string;
  yield: number; // Servings this recipe produces
  items: RecipeItem[];
  isActive?: boolean;
}

export interface Recipe {
  _id: string;
  menuItem: {
    _id: string;
    name: string;
  };
  name: string;
  yield: number;
  items: RecipeItemDetail[];
  totalCost?: number; // Auto-calculated
  costPerServing?: number; // totalCost / yield
  merchant?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeListResponse {
  status: string;
  results?: number;
  data: {
    recipes: Recipe[];
  };
}

// List all recipes
export const useGetRecipesList = (merchantId?: string) => {
  return useQuery<RecipeListResponse>({
    queryKey: ['recipesList', merchantId],
    queryFn: async () => {
      const params = merchantId ? { merchantId } : undefined;
      const response = await api.get('/v1/recipes', { params });
      return response.data;
    },
  });
};

// Get recipe by ID (includes current stock)
export const useGetRecipeDetails = (recipeId?: string) => {
  return useQuery<{ status: string; data: { recipe: Recipe } }>({
    queryKey: ['recipeDetails', recipeId],
    queryFn: async () => {
      if (!recipeId) throw new Error('Recipe ID is required');
      const response = await api.get(`/v1/recipes/${recipeId}`);
      return response.data;
    },
    enabled: !!recipeId,
  });
};

// Create recipe
export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecipeCreateRequest) => {
      const response = await api.post('/v1/recipes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipesList'] });
    },
  });
};

// Update recipe
export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, data }: { recipeId: string; data: Partial<RecipeCreateRequest> }) => {
      const response = await api.patch(`/v1/recipes/${recipeId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipeDetails', variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipesList'] });
    },
  });
};

// Delete/deactivate recipe
export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await api.delete(`/v1/recipes/${recipeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipesList'] });
    },
  });
};
