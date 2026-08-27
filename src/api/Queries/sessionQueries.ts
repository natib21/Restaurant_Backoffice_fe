// src/api/Queries/sessionQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

export interface TableSession {
  _id: string;
  table: {
    _id: string;
    tableNumber: string;
    branch?: {
      _id: string;
      name: string;
    };
  };
  customer?: {
    _id: string;
    fullName: string;
    phone?: string;
  };
  sessionToken?: string;
  startedAt: string;
  endedAt?: string;
  duration?: string;
  orders?: any[];
  isAnonymous?: boolean;
  totalSpent?: number;
  totalOrders?: number;
}

export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters?: { branchId?: string; status?: string }) => [...sessionKeys.lists(), filters] as const,
  byTable: (tableId: string) => [...sessionKeys.all, 'table', tableId] as const,
};

// GET /v1/sessions (staff view)
const fetchSessions = async (filters?: { branchId?: string; status?: string }): Promise<TableSession[]> => {
  const { data } = await api.get('/v1/sessions', { params: filters });
  return data.data?.sessions || data.sessions || [];
};

// GET /v1/sessions/table/:tableId
const fetchSessionByTable = async (tableId: string): Promise<TableSession> => {
  const { data } = await api.get(`/v1/sessions/table/${tableId}`);
  return data.data?.session || data.session;
};

// PATCH /v1/sessions/:id/free
const freeSession = async (id: string): Promise<any> => {
  const { data } = await api.patch(`/v1/sessions/${id}/free`);
  return data;
};

// POST /v1/sessions/start
const startSession = async (qrCode: string): Promise<any> => {
  const { data } = await api.post('/v1/sessions/start', { qrCode });
  return data.data?.session || data.session;
};

// POST /v1/sessions/link
const linkSession = async (payload: { phone: string; fullName: string }): Promise<any> => {
  const { data } = await api.post('/v1/sessions/link', payload);
  return data.data?.session || data.session;
};

/* ======================================================
   Hooks
====================================================== */

export const useSessionsQuery = (filters?: { branchId?: string; status?: string }) => {
  return useQuery<TableSession[], AxiosError<any>>({
    queryKey: sessionKeys.list(filters),
    queryFn: () => fetchSessions(filters),
    refetchInterval: 10000,
  });
};

export const useTableSessionQuery = (tableId?: string) => {
  return useQuery<TableSession, AxiosError<any>>({
    queryKey: sessionKeys.byTable(tableId as string),
    queryFn: () => fetchSessionByTable(tableId as string),
    enabled: !!tableId,
  });
};

export const useFreeSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, AxiosError<any>, string>({
    mutationFn: freeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table freed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to free table session');
    },
  });
};

export const useStartSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, AxiosError<any>, string>({
    mutationFn: startSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success('Session started');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start session');
    },
  });
};

export const useLinkSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, AxiosError<any>, { phone: string; fullName: string }>({
    mutationFn: linkSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success('Customer account linked to session');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to link account');
    },
  });
};
