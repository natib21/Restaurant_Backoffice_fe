// src/api/queries/menuQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

/* ======================================================
   Types
====================================================== */

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
  name: string;
  slug: string;
  description?: string;
  type: 'food' | 'drink';
  category: string;
  drinkType?: string | null;
  isAlcoholic?: boolean;
  alcoholPercentage?: number;
  isVeg?: boolean | null;
  isSpicy?: boolean;
  variants: Variant[];
  price?: number;
  image?: string;
  images?: string[];
  prepTime?: string;
  ingredients?: string[];
  allergens?: string[];
  available: boolean;
  inStock: boolean;
  tags?: string[];
  ratingAverage?: number;
  ratingQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

/* ---------- MenuGroup Types (Your Real Model) ---------- */
export interface MenuGroupItem {
  menu: string | MenuItem; // ObjectId or populated
  sortOrder: number;
  overridePrice?: number | null;
  customName?: string;
  customDescription?: string;
  isHidden: boolean;
  _id: string;
}

export interface MenuGroup {
  _id: string;
  name: string;
  slug: string;
  description?: string;
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
/* ---------- Staff Menu Response Type ---------- */
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
    category: string; // The name of the MenuGroup it belongs to
  }[];
}
/* ======================================================
   Query Keys
====================================================== */

const menuKeys = {
  all: ['menu'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: () => [...menuKeys.lists()] as const,
  staff: () => [...menuKeys.all, 'staff'] as const, // New key for staff menu
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
};

const menuGroupKeys = {
<<<<<<< HEAD
  all: ['menu-group'] as const,
=======
  all: ['menuGroups'] as const,
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  lists: () => [...menuGroupKeys.all, 'list'] as const,
  list: () => [...menuGroupKeys.lists()] as const,
  details: () => [...menuGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuGroupKeys.details(), id] as const,
<<<<<<< HEAD
  light: () => [...menuGroupKeys.all, 'light'] as const,
=======
  light: ['menuGroups', 'light'] as const,
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
};

/* ======================================================
   API Calls - Menu Items
====================================================== */
const fetchStaffMenu = async (): Promise<StaffMenuResponse> => {
<<<<<<< HEAD
  const { data } = await api.get('/v1/menu/staff');
=======
  const { data } = await api.get('/v1/menu/staff-menu');
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  return data.data; // data.data contains { restaurant, totalItems, menu }
};

const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const { data } = await api.get('/v1/menu');
  return data.data.menu;
};

const fetchMenuItem = async (id: string): Promise<MenuItem> => {
  const { data } = await api.get(`/v1/menu/${id}`);
  return data.data.menu;
};

const createMenuItem = async (formData: FormData): Promise<MenuItem> => {
  const { data } = await api.post('/v1/menu', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.menu;
};

const updateMenuItem = async ({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}): Promise<MenuItem> => {
  const { data } = await api.patch(`/v1/menu/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.menu;
};

const deleteMenuItem = async (id: string): Promise<void> => {
  await api.delete(`/v1/menu/${id}`);
};

/* ---------- API Calls - Menu Groups (Correct Endpoints) ---------- */

const fetchMenuGroups = async (): Promise<MenuGroup[]> => {
<<<<<<< HEAD
  const { data } = await api.get('/v1/menu-group');
=======
  const { data } = await api.get('/v1/menuGroup');
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  return data.data.menuGroups;
};

const fetchMenuGroup = async (id: string): Promise<MenuGroup> => {
<<<<<<< HEAD
  const { data } = await api.get(`/v1/menu-group/${id}`);
=======
  const { data } = await api.get(`/v1/menuGroup/${id}`);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  return data.data.menuGroup;
};

const createMenuGroup = async (
  groupData: Partial<MenuGroup>
): Promise<MenuGroup> => {
<<<<<<< HEAD
  const { data } = await api.post('/v1/menu-group', groupData);
=======
  const { data } = await api.post('/v1/menuGroup', groupData);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  return data.data.menuGroup;
};

const updateMenuGroup = async ({
  id,
  groupData,
}: {
  id: string;
  groupData: Partial<MenuGroup>;
}): Promise<MenuGroup> => {
<<<<<<< HEAD
  const { data } = await api.patch(`/v1/menu-group/${id}`, groupData);
=======
  const { data } = await api.patch(`/v1/menuGroup/${id}`, groupData);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  return data.data.menuGroup;
};

const deleteMenuGroup = async (id: string): Promise<void> => {
<<<<<<< HEAD
  await api.delete(`/v1/menu-group/${id}`);
=======
  await api.delete(`/v1/menuGroup/${id}`);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
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
    staleTime: 2 * 60 * 1000, // Shorter stale time (2 mins) as stock/schedules change
    refetchOnWindowFocus: true, // Useful for staff to see updated stock when returning to app
  });

export const useMenuItemsQuery = () =>
  useQuery<MenuItem[], AxiosError>({
    queryKey: menuKeys.list(),
    queryFn: fetchMenuItems,
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(id) });
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
<<<<<<< HEAD
    mutationFn: (id: string) =>
      api.patch(`/v1/menu/${id}/toggle-availability`),
=======
    mutationFn: (id: string) => api.patch(`v1/menu/${id}/toggle-availability`),
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.list() });
      queryClient.invalidateQueries({ queryKey: menuKeys.details() });
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });
};

/* ======================================================
   Hooks - Menu Groups (Correct & Clean)
====================================================== */

// Get all menu groups
export const useMenuGroupsQuery = () =>
  useQuery<MenuGroup[], AxiosError>({
    queryKey: menuGroupKeys.list(),
    queryFn: fetchMenuGroups,
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
      queryClient.setQueryData(menuGroupKeys.detail(data._id), data);
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
