// src/api/queries/branchQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

/* ======================================================
   Types
====================================================== */

export interface BranchLocation {
  coordinates: [number, number]; // [lng, lat]
  city: string;
  subCity?: string;
  specificArea?: string;
  building?: string;
  formattedAddress: string;
}

export interface Branch {
  _id: string;
  name: string;
  phone?: string;
  shortCode?: string;
  isActive: boolean;
  isMain?: boolean;
  location: BranchLocation;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
  qrVersion?: number;

  merchant: {
    _id: string;
    businessName: string;
    slug: string;
    brandColor?: string;
  };

  createdAt: string;
  updatedAt: string;
}

/* Input types for mutations */
export interface CreateBranchInput {
  name: string;
  phone?: string;
  city: string;
  subCity?: string;
  specificArea?: string;
  building?: string;
  coordinates: [number, number];
  isMain?: boolean;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

export interface UpdateBranchInput {
  name?: string;
  phone?: string;
  city?: string;
  subCity?: string;
  specificArea?: string;
  building?: string;
  coordinates?: [number, number];
  isMain?: boolean;
  isActive?: boolean;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

export interface InviteBranchManagerInput {
  email: string;
  phone: string;
  branchId: string;
  firstName: string;
}

/* ======================================================
   Query Keys
====================================================== */

const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: () => [...branchKeys.lists()] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
  nearby: ['branches', 'nearby'] as const,
};

/* ======================================================
   API Calls
====================================================== */

const fetchBranches = async (): Promise<Branch[]> => {
  const { data } = await api.get('/v1/branch');
  return data.data.branches;
};

const fetchBranch = async (id: string): Promise<Branch> => {
  const { data } = await api.get(`/v1/branch/${id}`);
  return data.data.branch;
};

const createBranch = async (input: CreateBranchInput): Promise<Branch> => {
  const { data } = await api.post('/v1/branch', input);
  return data.data.branch;
};

const updateBranch = async ({
  id,
  input,
}: {
  id: string;
  input: UpdateBranchInput;
}): Promise<Branch> => {
  const { data } = await api.patch(`/v1/branch/${id}`, input);
  return data.data.branch;
};

const deleteBranch = async (id: string): Promise<void> => {
  await api.delete(`/v1/branch/${id}`);
};

const regenerateQRCodes = async (
  id: string
): Promise<{ qrVersion: number }> => {
  const { data } = await api.patch(`/v1/branch/${id}/regenerate-qr`);
  return data.data;
};

const fetchNearbyBranches = async ({
  lat,
  lng,
  maxDistance = 5000,
}: {
  lat: number;
  lng: number;
  maxDistance?: number;
}): Promise<Branch[]> => {
  const { data } = await api.get('/v1/branch/nearby', {
    params: { lat, lng, maxDistance },
  });
  return data.data.branches;
};

const inviteBranchManager = async (
  input: InviteBranchManagerInput
): Promise<{ message: string }> => {
  const { data } = await api.post('/v1/branch/invite-manager', input);
  return data;
};

/* ======================================================
   Hooks
====================================================== */

/* ---------- All Branches (Merchant Admin) ---------- */
export const useBranchesQuery = () =>
  useQuery<Branch[], AxiosError>({
    queryKey: branchKeys.list(),
    queryFn: fetchBranches,
    staleTime: 10 * 60 * 1000,
    select: (data) =>
      [...data].sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return a.name.localeCompare(b.name);
      }),
  });

/* ---------- Single Branch ---------- */
export const useBranchQuery = (id?: string) =>
  useQuery<Branch, AxiosError>({
    queryKey: branchKeys.detail(id as string),
    queryFn: () => fetchBranch(id as string),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });

/* ---------- Create Branch ---------- */
export const useCreateBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Branch, AxiosError, CreateBranchInput>({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success('Branch created successfully');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to create branch');
    },
  });
};

/* ---------- Update Branch ---------- */
export const useUpdateBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Branch,
    AxiosError,
    { id: string; input: UpdateBranchInput }
  >({
    mutationFn: updateBranch,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.setQueryData(branchKeys.detail(variables.id), data);
      toast.success('Branch updated successfully');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || 'Failed to update branch');
    },
  });
};

/* ---------- Delete / Deactivate Branch ---------- */
export const useDeleteBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success('Branch deactivated');
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || 'Failed to deactivate branch'
      );
    },
  });
};

/* ---------- Regenerate QR Codes ---------- */
export const useRegenerateQRCodesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<{ qrVersion: number }, AxiosError, string>({
    mutationFn: regenerateQRCodes,
    onSuccess: (data, branchId) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(branchId) });
      toast.success(`QR codes regenerated (v${data.qrVersion})`);
    },
    onError: () => {
      toast.error('Failed to regenerate QR codes');
    },
  });
};

/* ---------- Nearby Branches (Public) ---------- */
export const useNearbyBranchesQuery = (
  lat: number | null,
  lng: number | null,
  maxDistance = 5000
) =>
  useQuery<Branch[], AxiosError>({
    queryKey: [...branchKeys.nearby, lat, lng, maxDistance],
    queryFn: () => fetchNearbyBranches({ lat: lat!, lng: lng!, maxDistance }),
    enabled: lat !== null && lng !== null,
    staleTime: 15 * 60 * 1000,
  });

/* ---------- Invite Branch Manager ---------- */
export const useInviteBranchManagerMutation = () => {
  return useMutation<{ message: string }, AxiosError, InviteBranchManagerInput>(
    {
      mutationFn: inviteBranchManager,
      onSuccess: (data) => {
        toast.success(data.message || 'Invitation sent successfully');
      },
      onError: (error: AxiosError<any>) => {
        toast.error(
          error.response?.data?.message || 'Failed to send invitation'
        );
      },
    }
  );
};
