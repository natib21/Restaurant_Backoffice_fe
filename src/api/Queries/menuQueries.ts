// src/api/queries/menuQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import axios, { type AxiosError } from 'axios';

/* ======================================================
   Types
====================================================== */

export interface LocalizedText {
  en: string;
  am?: string;
  [key: string]: any;
}

export interface Variant {
  name: string;
  size?: string;
  volume?: string;
  price: number;
  calories?: number;
  available: boolean;
  isDefault?: boolean;
}

export interface MenuItem {
  _id: string;
  name: string | LocalizedText;
  slug: string;
  description?: string | LocalizedText;
  type: 'food' | 'drink';
  category: string | any;
  categoryId?: string | null;
  drinkType?: string | null;
  isAlcoholic?: boolean;
  alcoholPercentage?: number;
  isVeg?: boolean | null;
  isFasting?: boolean | null;
  cuisineOrigin?: 'local' | 'international' | string;
  isSpicy?: boolean;
  variants: Variant[];
  price?: number;
  image?: string;
  images?: string[];
  imageUrl?: string;
  imageData?: { url?: string };
  prepTime?: string;
  ingredients?: string[];
  requiresKitchen?: boolean;
  allergens?: string[];
  available: boolean;
  inStock: boolean;
  tags?: string[];
  ratingAverage?: number;
  ratingQuantity?: number;
  kitchenStation?:
    | {
        _id?: string;
        id?: string;
        stationId?: string;
        name: string;
        code: string;
        color?: string;
        isActive?: boolean;
      }
    | string
    | null;
  createdAt: string;
  updatedAt: string;
}

/* ---------- MenuGroup Types (Real Model) ---------- */
export interface MenuGroupItem {
  menu: string | MenuItem; // ObjectId or populated
  sortOrder: number;
  overridePrice?: number | null;
  customName?: string;
  customDescription?: string;
  isHidden: boolean;
  _id?: string;
}

export interface MenuGroup {
  _id: string;
  name: string | LocalizedText;
  slug: string;
  description?: string | LocalizedText;
  bannerImage?: string;
  visibility: 'always' | 'scheduled' | 'hidden';
  activeDays?: string[];
  blockedDays?: string[];
  timeSlots?: { start: string; end: string }[];
  priority: number;
  isAlcoholMenu: boolean;
  items: MenuGroupItem[];
  merchant: string;
  branches: string[]; // Array of branch IDs
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Staff Menu Response Type (Unchanged Custom Shape) ---------- */
export interface StaffMenuResponse {
  restaurant: string;
  totalItems: number;
  menu: {
    id: string;
    name: string;
    description: string;
    image: string | null;
    price: number;
    variants: Variant[];
    type: 'food' | 'drink';
    isVeg: boolean | null;
    isSpicy: boolean;
    isAlcoholic: boolean;
    prepTime: string;
    rating: number;
    category: string;
  }[];
}

/* ---------- Query Filter Parameters ---------- */
export interface MenuQueryParams {
  search?: string;
  type?: 'food' | 'drink' | string;
  available?: boolean;
  sort?: string;
  fields?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface MenuGroupQueryParams {
  search?: string;
  visibility?: 'always' | 'scheduled' | 'hidden' | string;
  sort?: string;
  fields?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

/* ======================================================
   Query Keys
====================================================== */

export const menuKeys = {
  all: ['menu'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (params?: MenuQueryParams) => [...menuKeys.lists(), params] as const,
  staff: () => [...menuKeys.all, 'staff'] as const,
  public: () => [...menuKeys.all, 'public'] as const,
  active: () => [...menuKeys.all, 'active'] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
};

export const menuGroupKeys = {
  all: ['menu-group'] as const,
  lists: () => [...menuGroupKeys.all, 'list'] as const,
  list: (params?: MenuGroupQueryParams) => [...menuGroupKeys.lists(), params] as const,
  details: () => [...menuGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuGroupKeys.details(), id] as const,
  light: () => [...menuGroupKeys.all, 'light'] as const,
  branch: (branchId?: string) => [...menuGroupKeys.all, 'branch', branchId] as const,
};

/* ======================================================
   API Calls - Menu Items (Standardized Endpoints)
====================================================== */

const fetchStaffMenu = async (): Promise<StaffMenuResponse> => {
  const { data } = await api.get('/v1/menu/staff').catch(() => api.get('/v1/menu/staff'));
  return data.data; // data.data contains { restaurant, totalItems, menu }
};

const fetchMenuItems = async (params?: MenuQueryParams): Promise<MenuItem[]> => {
  const { data } = await api
    .get('/v1/menu', { params })
    .catch(() => api.get('/v1/menu', { params }));
  // Standardized response uses data.data.menus (with fallback to data.data.menu or data.data)
  return data?.data?.menus ?? data?.data?.menu ?? data?.data ?? [];
};

const fetchMenuItem = async (id: string): Promise<MenuItem> => {
  const { data } = await api
    .get(`/v1/menu/${id}`)
    .catch(() => api.get(`/v1/menu/${id}`));
  return data?.data?.menu ?? data?.data ?? data;
};

const createMenuItem = async (formData: FormData): Promise<MenuItem> => {
  const { data } = await api
    .post('/v1/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .catch(() =>
      api.post('/v1/menu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  return data?.data?.menu ?? data?.data ?? data;
};

const updateMenuItem = async ({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}): Promise<MenuItem> => {
  const { data } = await api
    .patch(`/v1/menu/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .catch(() =>
      api.patch(`/v1/menu/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  return data?.data?.menu ?? data?.data ?? data;
};

const deleteMenuItem = async (id: string): Promise<void> => {
  await api.delete(`/v1/menu/${id}`).catch(() => api.delete(`/v1/menu/${id}`));
};

const toggleMenuItemAvailability = async (id: string): Promise<MenuItem> => {
  const { data } = await api
    .patch(`/v1/menu/${id}/toggle-availability`)
    .catch(() => api.patch(`/v1/menu/${id}/toggle-availability`));
  return data?.data?.menu ?? data?.data ?? data;
};

const archiveMenuItem = async (id: string): Promise<MenuItem> => {
  const { data } = await api
    .patch(`/v1/menu/${id}/archive`)
    .catch(() => api.patch(`/v1/menu/${id}/archive`));
  return data?.data?.menu ?? data?.data ?? data;
};

const publishMenuGroup = async (payload: {
  menuGroupId: string;
  branchId: string;
}): Promise<any> => {
  const { data } = await api
    .post('/v1/menu/publish', payload)
    .catch(() => api.post('/v1/menu/publish', payload));
  return data?.data?.publication ?? data?.data ?? data;
};

const fetchBranchPublications = async (branchId: string): Promise<any[]> => {
  const { data } = await api
    .get(`/v1/menu/publications/branch/${branchId}`)
    .catch(() => api.get(`/v1/menu/publications/branch/${branchId}`));
  return data?.data?.publications ?? data?.publications ?? data?.data ?? [];
};

/* ---------- API Calls - Menu Groups (Standardized Endpoints) ---------- */

const fetchMenuGroups = async (params?: MenuGroupQueryParams): Promise<MenuGroup[]> => {
  const { data } = await api
    .get('/v1/menu-group', { params })
    .catch(() => api.get('/v1/menu-group', { params }));
  return data?.data?.menuGroups ?? data?.data?.menuGroup ?? data?.data ?? [];
};

const fetchMenuGroupsLight = async (): Promise<MenuGroup[]> => {
  const { data } = await api
    .get('/v1/menu-group/light')
    .catch(() => api.get('/v1/menu-group/light'));
  return data?.data?.menuGroups ?? data?.data?.menuGroup ?? data?.data ?? [];
};

const fetchMenuGroup = async (id: string): Promise<MenuGroup> => {
  const { data } = await api
    .get(`/v1/menu-group/${id}`)
    .catch(() => api.get(`/v1/menu-group/${id}`));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const createMenuGroup = async (
  groupData: Partial<MenuGroup>
): Promise<MenuGroup> => {
  const { data } = await api
    .post('/v1/menu-group', groupData)
    .catch(() => api.post('/v1/menu-group', groupData));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const updateMenuGroup = async ({
  id,
  groupData,
}: {
  id: string;
  groupData: Partial<MenuGroup>;
}): Promise<MenuGroup> => {
  const { data } = await api
    .patch(`/v1/menu-group/${id}`, groupData)
    .catch(() => api.patch(`/v1/menu-group/${id}`, groupData));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const deleteMenuGroup = async (id: string): Promise<void> => {
  await api
    .delete(`/v1/menu-group/${id}`)
    .catch(() => api.delete(`/v1/menu-group/${id}`));
};

const addMenuItemToGroup = async ({
  groupId,
  itemData,
}: {
  groupId: string;
  itemData: Partial<MenuGroupItem>;
}): Promise<MenuGroup> => {
  const { data } = await api
    .patch(`/v1/menu-group/${groupId}/items`, itemData)
    .catch(() => api.patch(`/v1/menu-group/${groupId}/items`, itemData));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const removeMenuItemFromGroup = async ({
  groupId,
  itemId,
}: {
  groupId: string;
  itemId: string;
}): Promise<MenuGroup> => {
  const { data } = await api
    .patch(`/v1/menu-group/${groupId}/items/${itemId}`)
    .catch(() => api.patch(`/v1/menu-group/${groupId}/items/${itemId}`));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const reorderGroupItems = async ({
  groupId,
  items,
}: {
  groupId: string;
  items: Array<{ menu: string; sortOrder: number }>;
}): Promise<MenuGroup> => {
  const { data } = await api
    .patch(`/v1/menu-group/${groupId}/reorder`, { items })
    .catch(() => api.patch(`/v1/menu-group/${groupId}/reorder`, { items }));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

/* ---------- API Calls - Branch Menu Groups ---------- */

const fetchBranchMenuGroups = async (branchId?: string): Promise<MenuGroup[]> => {
  const { data } = await api
    .get('/v1/branch-menu-groups', {
      params: branchId ? { branch: branchId } : undefined,
    })
    .catch(() =>
      api.get('/v1/branch-menu-group', {
        params: branchId ? { branch: branchId } : undefined,
      })
    );
  return data?.data?.menuGroups ?? data?.data?.menuGroup ?? data?.data ?? [];
};

const fetchBranchMenuGroup = async (id: string): Promise<MenuGroup> => {
  const { data } = await api
    .get(`/v1/branch-menu-groups/${id}`)
    .catch(() => api.get(`/v1/branch-menu-group/${id}`));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const createBranchMenuGroup = async (
  groupData: Partial<MenuGroup>
): Promise<MenuGroup> => {
  const { data } = await api
    .post('/v1/branch-menu-groups', groupData)
    .catch(() => api.post('/v1/branch-menu-group', groupData));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const updateBranchMenuGroup = async ({
  id,
  groupData,
}: {
  id: string;
  groupData: Partial<MenuGroup>;
}): Promise<MenuGroup> => {
  const { data } = await api
    .patch(`/v1/branch-menu-groups/${id}`, groupData)
    .catch(() => api.patch(`/v1/branch-menu-group/${id}`, groupData));
  return data?.data?.menuGroup ?? data?.data ?? data;
};

const deleteBranchMenuGroup = async (id: string): Promise<void> => {
  await api
    .delete(`/v1/branch-menu-groups/${id}`)
    .catch(() => api.delete(`/v1/branch-menu-group/${id}`));
};

/* ======================================================
   Hooks - Menu Items
====================================================== */

/**
 * Hook for Waiters/Staff to fetch the active merchant menu.
 * Respects scheduling and stock availability automatically.
 */
export const useStaffMenuQuery = () =>
  useQuery<StaffMenuResponse, AxiosError>({
    queryKey: menuKeys.staff(),
    queryFn: fetchStaffMenu,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useMenuItemsQuery = (params?: MenuQueryParams) =>
  useQuery<MenuItem[], AxiosError>({
    queryKey: menuKeys.list(params),
    queryFn: () => fetchMenuItems(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useMenuItemQuery = (id?: string) =>
  useQuery<MenuItem, AxiosError>({
    queryKey: menuKeys.detail(id as string),
    queryFn: () => fetchMenuItem(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useCreateMenuItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      toast.success('Menu item created', {
        description: 'It is now available to customers.',
      });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to create menu item'
      );
    },
  });
};

export const useUpdateMenuItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMenuItem,
    onSuccess: (updatedItem, { id }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(id) });
      if (updatedItem) {
        queryClient.setQueryData(menuKeys.detail(id), updatedItem);
      }
      toast.success('Menu item updated');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to update menu item'
      );
    },
  });
};

export const useDeleteMenuItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      toast.success('Menu item deleted');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to delete menu item'
      );
    },
  });
};

export const useToggleMenuItemAvailabilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleMenuItemAvailability,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.list() });
      queryClient.invalidateQueries({ queryKey: menuKeys.details() });
      if (data) {
        queryClient.setQueryData(menuKeys.detail(id), data);
      }
      toast.success(
        data?.available ? 'Menu item is now available' : 'Menu item marked unavailable'
      );
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    },
  });
};

/* ======================================================
   Kitchen Station Assignment
====================================================== */

export const assignMenuItemStation = async ({
  menuItemId,
  stationId,
}: {
  menuItemId: string;
  stationId: string | null;
}): Promise<MenuItem> => {
  const { data } = await api.patch(`/v1/kitchen/menu-items/${menuItemId}/station`, {
    stationId,
  });
  return data?.data?.menuItem || data?.data || data;
};

export const useAssignMenuItemStationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignMenuItemStation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(variables.menuItemId) });
      queryClient.invalidateQueries({ queryKey: menuKeys.staff() });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    },
  });
};

export const useAssignMenuItemStation = useAssignMenuItemStationMutation;

/* ======================================================
   Hooks - Menu Groups
====================================================== */

// Get all menu groups
export const useMenuGroupsQuery = (params?: MenuGroupQueryParams) =>
  useQuery<MenuGroup[], AxiosError>({
    queryKey: menuGroupKeys.list(params),
    queryFn: () => fetchMenuGroups(params),
    staleTime: 5 * 60 * 1000,
  });

// Get menu groups light
export const useMenuGroupsLightQuery = () =>
  useQuery<MenuGroup[], AxiosError>({
    queryKey: menuGroupKeys.light(),
    queryFn: fetchMenuGroupsLight,
    staleTime: 5 * 60 * 1000,
  });

// Get single menu group
export const useMenuGroupQuery = (id?: string) =>
  useQuery<MenuGroup, AxiosError>({
    queryKey: menuGroupKeys.detail(id as string),
    queryFn: () => fetchMenuGroup(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Create
export const useCreateMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMenuGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.lists() });
      toast.success('Menu group created successfully');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to create menu group'
      );
    },
  });
};

// Update (handles items, scheduling, branches, etc.)
export const useUpdateMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMenuGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.lists() });
      if (data?._id) {
        queryClient.setQueryData(menuGroupKeys.detail(data._id), data);
      }
      toast.success('Menu group updated');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to update menu group'
      );
    },
  });
};

// Delete
export const useDeleteMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMenuGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.lists() });
      toast.success('Menu group deleted');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to delete menu group'
      );
    },
  });
};

// Add item to group
export const useAddMenuItemToGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMenuItemToGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.lists() });
      if (data?._id) {
        queryClient.setQueryData(menuGroupKeys.detail(data._id), data);
      }
      toast.success('Item added to group');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to add item to group');
    },
  });
};

// Remove item from group
export const useRemoveMenuItemFromGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMenuItemFromGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.lists() });
      if (data?._id) {
        queryClient.setQueryData(menuGroupKeys.detail(data._id), data);
      }
      toast.success('Item removed from group');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to remove item from group');
    },
  });
};

// Reorder group items
export const useReorderGroupItemsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderGroupItems,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.lists() });
      if (data?._id) {
        queryClient.setQueryData(menuGroupKeys.detail(data._id), data);
      }
      toast.success('Item order saved');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to reorder items');
    },
  });
};

/* ======================================================
   Hooks - Branch Menu Groups
====================================================== */

export const useBranchMenuGroupsQuery = (branchId?: string) =>
  useQuery<MenuGroup[], AxiosError>({
    queryKey: menuGroupKeys.branch(branchId),
    queryFn: () => fetchBranchMenuGroups(branchId),
    staleTime: 5 * 60 * 1000,
  });

export const useBranchMenuGroupQuery = (id?: string) =>
  useQuery<MenuGroup, AxiosError>({
    queryKey: ['branch-menu-group', id],
    queryFn: () => fetchBranchMenuGroup(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateBranchMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranchMenuGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.all });
      toast.success('Branch menu group created');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to create branch menu group');
    },
  });
};

export const useUpdateBranchMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBranchMenuGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.all });
      if (data?._id) {
        queryClient.setQueryData(['branch-menu-group', data._id], data);
      }
      toast.success('Branch menu group updated');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to update branch menu group');
    },
  });
};

export const useDeleteBranchMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBranchMenuGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.all });
      toast.success('Branch menu group deleted');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to delete branch menu group');
    },
  });
};

/* ======================================================
   Publishing & Archiving
====================================================== */

// POST /v1/menu/publish
export const usePublishMenuGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    AxiosError<any>,
    { menuGroupId: string; branchId: string }
  >({
    mutationFn: publishMenuGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
      queryClient.invalidateQueries({ queryKey: menuGroupKeys.all });
      queryClient.invalidateQueries({ queryKey: ['menuPublications', variables.branchId] });
      toast.success('Menu group published successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to publish menu group');
    },
  });
};

// PATCH /v1/menu/:id/archive
export const useArchiveMenuItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, AxiosError<any>, string>({
    mutationFn: archiveMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
      toast.success('Menu item archived');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to archive menu item');
    },
  });
};

// GET /v1/menu/publications/branch/:branchId
export const useMenuPublicationsQuery = (branchId?: string) => {
  return useQuery<any[], AxiosError<any>>({
    queryKey: ['menuPublications', branchId],
    queryFn: () => fetchBranchPublications(branchId as string),
    enabled: !!branchId,
  });
};

/* ======================================================
   PDF Render Endpoint & Hooks (POST /api/v1/menu/render-pdf)
====================================================== */

/**
 * Resolves the full URL for the PDF render endpoint.
 * Fallback targets local backend running at http://localhost:8000/api
 */
export function getRenderPdfEndpoint(): string {
  const baseUrl = 'http://localhost:8000/api';

  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/api')) {
    return `${cleanBase}/v1/menu/render-pdf`;
  }
  if (cleanBase.endsWith('/api/v1')) {
    return `${cleanBase}/menu/render-pdf`;
  }
  return `${cleanBase}/api/v1/menu/render-pdf`;
}

/**
 * API call to render menu PDF via backend Puppeteer service.
 * Endpoint: POST /api/v1/menu/render-pdf
 * Response: PDF binary Blob
 */
export const renderMenuPdf = async (payload: any): Promise<Blob> => {
  const { data } = await api.post('/v1/menu/render-pdf', payload, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
      'Content-Type': 'application/json',
    },
    timeout: 45000,
  });
  return data;
};

/**
 * React Query mutation hook for generating menu PDFs from the backend
 */
export const useRenderMenuPdfMutation = () => {
  return useMutation<Blob, AxiosError<any>, any>({
    mutationFn: renderMenuPdf,
  });
};


