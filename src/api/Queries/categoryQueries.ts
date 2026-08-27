// src/api/Queries/categoryQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

/* ======================================================
   Types
====================================================== */

export interface LocalizedText {
  en: string;
  am?: string;
}

export interface Category {
  id: string;
  _id?: string;
  merchant?: string;
  name: LocalizedText;
  description?: LocalizedText | string;
  displayOrder: number;
  icon?: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryInput {
  name: LocalizedText;
  description?: LocalizedText | string;
  displayOrder?: number;
  icon?: string;
  isActive?: boolean;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  isActive?: boolean | string;
  fields?: string;
  [key: string]: any;
}

export interface CategoryListResponse {
  categories: Category[];
  results?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ======================================================
   Query Keys
====================================================== */

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params?: CategoryQueryParams) => [...categoryKeys.lists(), params] as const,
  active: () => [...categoryKeys.all, 'active'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

/* ======================================================
   API Functions
====================================================== */

// Helper to normalize id / _id
const normalizeCategory = (cat: any): Category => {
  if (!cat) return cat;
  const id = cat.id || cat._id || '';
  const _id = cat._id || cat.id || '';
  
  // Normalize name
  let name: LocalizedText = { en: '' };
  if (typeof cat.name === 'string') {
    name = { en: cat.name };
  } else if (cat.name && typeof cat.name === 'object') {
    name = {
      en: cat.name.en || '',
      am: cat.name.am || '',
    };
  }

  // Normalize description
  let description = cat.description;
  if (typeof cat.description === 'string') {
    description = { en: cat.description };
  } else if (cat.description && typeof cat.description === 'object') {
    description = {
      en: cat.description.en || '',
      am: cat.description.am || '',
    };
  }

  return {
    ...cat,
    id,
    _id,
    name,
    description,
    displayOrder: typeof cat.displayOrder === 'number' ? cat.displayOrder : 0,
    isActive: cat.isActive !== undefined ? Boolean(cat.isActive) : true,
    isDeleted: Boolean(cat.isDeleted),
  };
};

const fetchAllCategories = async (params?: CategoryQueryParams): Promise<Category[]> => {
  const { data } = await api
    .get('/v1/categories', { params })
    .catch(() => api.get('/v1/category', { params }));
  const rawList = data?.data?.categories ?? data?.data?.category ?? data?.data ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizeCategory);
};

const fetchActiveCategories = async (): Promise<Category[]> => {
  const { data } = await api
    .get('/v1/categories/active')
    .catch(() => api.get('/v1/category/active'))
    .catch(() => api.get('/v1/categories', { params: { isActive: true } }));
  const rawList = data?.data?.categories ?? data?.data?.category ?? data?.data ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizeCategory);
};

const fetchCategory = async (id: string): Promise<Category> => {
  const { data } = await api
    .get(`/v1/categories/${id}`)
    .catch(() => api.get(`/v1/category/${id}`));
  const raw = data?.data?.category ?? data?.data ?? data;
  return normalizeCategory(raw);
};

const createCategory = async (input: CategoryInput): Promise<Category> => {
  const { data } = await api
    .post('/v1/categories', input)
    .catch(() => api.post('/v1/category', input));
  const raw = data?.data?.category ?? data?.data ?? data;
  return normalizeCategory(raw);
};

const updateCategory = async ({
  id,
  input,
}: {
  id: string;
  input: Partial<CategoryInput>;
}): Promise<Category> => {
  const { data } = await api
    .patch(`/v1/categories/${id}`, input)
    .catch(() => api.patch(`/v1/category/${id}`, input));
  const raw = data?.data?.category ?? data?.data ?? data;
  return normalizeCategory(raw);
};

const deleteCategory = async (id: string): Promise<void> => {
  await api
    .delete(`/v1/categories/${id}`)
    .catch(() => api.delete(`/v1/category/${id}`));
};

const restoreCategory = async (id: string): Promise<Category> => {
  const { data } = await api
    .patch(`/v1/categories/${id}/restore`)
    .catch(() => api.patch(`/v1/category/${id}/restore`));
  const raw = data?.data?.category ?? data?.data ?? data;
  return normalizeCategory(raw);
};

/* ======================================================
   React Query Hooks
====================================================== */

export const useCategoriesQuery = (params?: CategoryQueryParams) => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => fetchAllCategories(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

export const useActiveCategoriesQuery = () => {
  return useQuery({
    queryKey: categoryKeys.active(),
    queryFn: fetchActiveCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes cache for dropdowns
  });
};

export const useCategoryQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: categoryKeys.detail(id || ''),
    queryFn: () => fetchCategory(id!),
    enabled: Boolean(id),
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      const name = newCat?.name?.en || 'Category';
      toast.success(`Category "${name}" created successfully`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create category';
      toast.error(msg);
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      const name = updated?.name?.en || 'Category';
      toast.success(`Category "${name}" updated successfully`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update category';
      toast.error(msg);
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category deleted successfully');
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Cannot delete category. It may be currently assigned to menu items.';
      toast.error(msg);
    },
  });
};

export const useRestoreCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreCategory,
    onSuccess: (restored) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      const name = restored?.name?.en || 'Category';
      toast.success(`Category "${name}" restored successfully`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to restore category';
      toast.error(msg);
    },
  });
};
