// src/api/queries/comboQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// === Query Key Factory ===
export interface ComboQueryParams {
  search?: string;
  isActive?: boolean;
  sort?: string;
  fields?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export const comboKeys = {
  all: ['combos'] as const,
  lists: () => [...comboKeys.all, 'list'] as const,
  list: (params?: ComboQueryParams) => [...comboKeys.lists(), params] as const,
  active: () => [...comboKeys.all, 'active'] as const,
  details: () => [...comboKeys.all, 'detail'] as const,
  detail: (id: string) => [...comboKeys.details(), id] as const,
};

export interface LocalizedText {
  en: string;
  am?: string;
  [key: string]: any;
}

// === Types ===
export interface ComboItemMenu {
  _id: string;
  name: string | LocalizedText;
  image?: string;
  defaultVariant?: { price: number };
  variants?: Array<{ price: number; name?: string }>;
  available?: boolean;
  inStock?: boolean;
}

export interface ComboItem {
  menuItem: ComboItemMenu | string;
  nameFallback: string;
  quantity: number;
  _id?: string;
}

export interface ComboTimeSlot {
  start: string;
  end: string;
}

export interface ComboBranchOverride {
  branch: string;
  isActive?: boolean;
  comboPrice?: number;
  items?: ComboItem[];
  availableOnDays?: string[];
  timeSlots?: ComboTimeSlot[];
  validFrom?: string;
  validUntil?: string;
}

export interface Combo {
  _id: string;
  merchant: string;
  name: string | LocalizedText;
  slug?: string;
  description?: string | LocalizedText;
  items: ComboItem[];
  comboPrice: number;
  originalPrice?: number;
  savingsAmount?: number;
  savingsPercentage?: number;
  image?: string;
  isActive: boolean;
  branches: string[]; // [] = global
  validFrom?: string;
  validUntil?: string;
  availableOnDays?: string[];
  timeSlots?: ComboTimeSlot[];
  priority: number;
  tags?: string[];
  branchOverrides: ComboBranchOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface ComboItemInput {
  menuItem: string;
  quantity: number;
}

export interface CreateComboInput {
  name: string;
  description?: string;
  items: ComboItemInput[];
  comboPrice: number;
  image?: File;
  isActive?: boolean;
  branches?: string[];
  validFrom?: string;
  validUntil?: string;
  availableOnDays?: string[];
  timeSlots?: ComboTimeSlot[];
  priority?: number;
  tags?: string[];
}

export interface BranchOverrideInput {
  isActive?: boolean;
  comboPrice?: number | null;
  items?: ComboItemInput[] | null;
  availableOnDays?: string[] | null;
  timeSlots?: ComboTimeSlot[] | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

// === API Calls ===
const fetchAllCombos = async (params?: ComboQueryParams): Promise<Combo[]> => {
  const { data } = await api
    .get('/v1/combo', { params })
    .catch(() => api.get('/v1/combo', { params }));
  return data?.data?.combos ?? data?.data?.combo ?? data?.data ?? [];
};

const fetchCombo = async (id: string): Promise<Combo> => {
  const { data } = await api
    .get(`/v1/combo/${id}`)
    .catch(() => api.get(`/v1/combo/${id}`));
  return data?.data?.combo ?? data?.data ?? data;
};

const fetchActiveCombos = async (): Promise<Combo[]> => {
  const { data } = await api
    .get('/v1/combo/active')
    .catch(() => api.get('/v1/combo/active'));
  return data?.data?.combos ?? data?.data?.combo ?? data?.data ?? [];
};

const createCombo = async (formData: FormData): Promise<Combo> => {
  const { data } = await api
    .post('/v1/combo', formData)
    .catch(() => api.post('/v1/combo', formData));
  return data?.data?.combo ?? data?.data ?? data;
};

const updateCombo = async ({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}): Promise<Combo> => {
  const { data } = await api
    .patch(`/v1/combo/${id}`, formData)
    .catch(() => api.patch(`/v1/combo/${id}`, formData));
  return data?.data?.combo ?? data?.data ?? data;
};

const deleteCombo = async (id: string): Promise<void> => {
  await api.delete(`/v1/combo/${id}`).catch(() => api.delete(`/v1/combo/${id}`));
};

const toggleComboActive = async (
  id: string
): Promise<{ isActive: boolean; combo?: Combo }> => {
  const { data } = await api
    .patch(`/v1/combo/${id}/toggle-active`)
    .catch(() => api.patch(`/v1/combo/${id}/toggle-active`));
  const combo = data?.data?.combo;
  const isActive = combo?.isActive ?? data?.data?.isActive ?? data?.isActive ?? false;
  return { isActive, combo };
};

const updateBranchOverride = async ({
  comboId,
  overrideData,
}: {
  comboId: string;
  overrideData: BranchOverrideInput;
}): Promise<Combo> => {
  const { data } = await api
    .patch(`/v1/combo/${comboId}/branch-override`, overrideData)
    .catch(() => api.patch(`/v1/combo/${comboId}/branch-override`, overrideData));
  return data?.data?.combo ?? data?.data ?? data;
};

const toggleBranchActive = async (
  comboId: string
): Promise<{ isActive?: boolean; branchOverride?: any }> => {
  const { data } = await api
    .patch(`/v1/combo/${comboId}/branch-toggle`)
    .catch(() => api.patch(`/v1/combo/${comboId}/branch-toggle`));
  const branchOverride = data?.data?.branchOverride;
  const isActive = branchOverride?.isActive ?? data?.data?.isActive ?? data?.isActive;
  return { isActive, branchOverride };
};

const incrementComboSold = async (id: string): Promise<void> => {
  await api
    .post(`/v1/combo/${id}/sold`)
    .catch(() => api.post(`/v1/combo/${id}/sold`));
};

// === Hooks ===
export const useGetAllCombosQuery = (params?: ComboQueryParams) => {
  return useQuery<Combo[], Error>({
    queryKey: comboKeys.list(params),
    queryFn: () => fetchAllCombos(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetComboQuery = (id?: string) => {
  return useQuery<Combo, Error>({
    queryKey: comboKeys.detail(id as string),
    queryFn: () => fetchCombo(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetActiveCombosQuery = () => {
  return useQuery<Combo[], Error>({
    queryKey: comboKeys.active(),
    queryFn: fetchActiveCombos,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useCreateComboMutation = () => {
  const qc = useQueryClient();
  return useMutation<Combo, Error, FormData>({
    mutationFn: createCombo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: comboKeys.list() });
      qc.invalidateQueries({ queryKey: comboKeys.active() });
      toast.success('Special offer created successfully');
    },
    onError: () => {
      toast.error('Failed to create special offer');
    },
  });
};

export const useUpdateComboMutation = () => {
  const qc = useQueryClient();
  return useMutation<Combo, Error, { id: string; formData: FormData }>({
    mutationFn: updateCombo,
    onSuccess: (updatedCombo) => {
      if (updatedCombo?._id) {
        qc.setQueryData(comboKeys.detail(updatedCombo._id), updatedCombo);
      }
      qc.invalidateQueries({ queryKey: comboKeys.list() });
      qc.invalidateQueries({ queryKey: comboKeys.active() });
      toast.success('Special offer updated successfully');
    },
    onError: () => {
      toast.error('Failed to update special offer');
    },
  });
};

export const useDeleteComboMutation = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCombo,
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: comboKeys.detail(id) });
      qc.invalidateQueries({ queryKey: comboKeys.list() });
      qc.invalidateQueries({ queryKey: comboKeys.active() });
      toast.success('Special offer deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete special offer');
    },
  });
};

export const useToggleComboAvailabilityMutation = () => {
  const qc = useQueryClient();

  return useMutation<{ isActive: boolean; combo?: Combo }, Error, string>({
    mutationFn: toggleComboActive,
    onSuccess: (data, id) => {
      // Optimistically update detail cache
      qc.setQueryData<Combo | undefined>(comboKeys.detail(id), (old) =>
        old ? { ...old, isActive: data.isActive } : old
      );
      qc.invalidateQueries({ queryKey: comboKeys.list() });
      qc.invalidateQueries({ queryKey: comboKeys.active() });
      qc.invalidateQueries({ queryKey: comboKeys.detail(id) });
      toast.success(data.isActive ? 'Offer is now active' : 'Offer paused');
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });
};

export const useUpdateBranchOverrideMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    Combo,
    Error,
    { comboId: string; overrideData: BranchOverrideInput }
  >({
    mutationFn: updateBranchOverride,
    onSuccess: (updatedCombo) => {
      if (updatedCombo?._id) {
        qc.setQueryData(comboKeys.detail(updatedCombo._id), updatedCombo);
      }
      qc.invalidateQueries({ queryKey: comboKeys.list() });
      qc.invalidateQueries({ queryKey: comboKeys.active() });
      toast.success('Branch override updated');
    },
    onError: () => {
      toast.error('Failed to update branch override');
    },
  });
};

export const useToggleBranchActiveMutation = () => {
  const qc = useQueryClient();
  return useMutation<{ isActive?: boolean; branchOverride?: any }, Error, string>({
    mutationFn: toggleBranchActive,
    onSuccess: (_, comboId) => {
      qc.invalidateQueries({ queryKey: comboKeys.list() });
      qc.invalidateQueries({ queryKey: comboKeys.active() });
      qc.invalidateQueries({ queryKey: comboKeys.detail(comboId) });
      toast.success('Branch availability toggled');
    },
    onError: () => {
      toast.error('Failed to toggle branch availability');
    },
  });
};

export const useIncrementComboSoldMutation = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: incrementComboSold,
    onSuccess: (_, comboId) => {
      qc.invalidateQueries({ queryKey: comboKeys.detail(comboId) });
    },
  });
};
