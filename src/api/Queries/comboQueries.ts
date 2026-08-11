// src/api/queries/comboQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// === Query Key Factory ===
export const comboKeys = {
  all: ['combos'] as const,
  lists: () => [...comboKeys.all, 'list'] as const,
  list: () => [...comboKeys.lists()] as const,
  active: () => [...comboKeys.all, 'active'] as const,
  details: () => [...comboKeys.all, 'detail'] as const,
  detail: (id: string) => [...comboKeys.details(), id] as const,
};

// === Types (unchanged) ===
export interface ComboItemMenu {
  _id: string;
  name: string;
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
  name: string;
  slug?: string;
  description?: string;
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
const fetchAllCombos = async (): Promise<Combo[]> => {
  const { data } = await api.get('/v1/combo');
  return data.data.combos;
};

const fetchCombo = async (id: string): Promise<Combo> => {
  const { data } = await api.get(`/v1/combo/${id}`);
  return data.data.combo;
};

const fetchActiveCombos = async (): Promise<Combo[]> => {
  const { data } = await api.get('/v1/combo/active');
  return data.data.combos;
};

const createCombo = async (formData: FormData): Promise<Combo> => {
  const { data } = await api.post('/v1/combo', formData, {
    // headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.combo;
};

const updateCombo = async ({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}): Promise<Combo> => {
  const { data } = await api.patch(`/v1/combo/${id}`, formData, {
    // headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.combo;
};

const deleteCombo = async (id: string) => {
  await api.delete(`/v1/combo/${id}`);
};

const toggleComboActive = async (
  id: string
): Promise<{ isActive: boolean }> => {
  const { data } = await api.patch(`/v1/combo/${id}/toggle-active`);
  return data.data;
};

const updateBranchOverride = async ({
  comboId,
  overrideData,
}: {
  comboId: string;
  overrideData: BranchOverrideInput;
}): Promise<Combo> => {
  const { data } = await api.patch(
    `/v1/combo/${comboId}/branch-override`,
    overrideData
  );
  return data.data.combo;
};

const toggleBranchActive = async (
  comboId: string
): Promise<{ isActive: boolean }> => {
  const { data } = await api.patch(`/v1/combo/${comboId}/branch-toggle`);
  return data.data;
};

// === Hooks ===
export const useGetAllCombosQuery = () => {
  return useQuery<Combo[], Error>({
    queryKey: comboKeys.list(),
    queryFn: fetchAllCombos,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetComboQuery = (id: string) => {
  return useQuery<Combo, Error>({
    queryKey: comboKeys.detail(id),
    queryFn: () => fetchCombo(id),
    enabled: !!id,
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
      qc.setQueryData(comboKeys.detail(updatedCombo._id), updatedCombo);
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

  return useMutation<{ isActive: boolean }, Error, string>({
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
      qc.setQueryData(comboKeys.detail(updatedCombo._id), updatedCombo);
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
  return useMutation<{ isActive: boolean }, Error, string>({
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
