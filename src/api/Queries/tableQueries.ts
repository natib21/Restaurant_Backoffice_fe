// src/api/queries/tableQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

// ====================== QUERY KEY FACTORY ======================
export const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (branchId: string | null) => [...tableKeys.lists(), branchId] as const,
  details: () => [...tableKeys.all, 'detail'] as const,
  detail: (id: string) => [...tableKeys.details(), id] as const,
};

// ====================== TYPES ======================
export interface Table {
  _id: string;
  merchant: string;
  branch: {
    _id: string;
    name: string;
    location?: { city: string };
  };
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'needs-cleaning' | 'disabled';
  location: string;
  section?: string;
  qrCode?: string;
  qrUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ====================== API CALLS ======================

// GET /v1/table — default (all tables or branch manager's)
const fetchAllTables = async (): Promise<Table[]> => {
  const { data } = await api.get('/v1/table');
  return data.data.tables;
};

// GET /v1/table/branch/:id — specific branch
const fetchTablesByBranch = async (branchId: string): Promise<Table[]> => {
  const { data } = await api.get(`/v1/table/branch/${branchId}`);
  return data.data.tables;
};

const fetchTable = async (id: string): Promise<Table> => {
  const { data } = await api.get(`/v1/table/${id}`);
  return data.data.table;
};

const createTable = async (tableData: any): Promise<Table> => {
  const { data } = await api.post('/v1/table', tableData);
  return data.data.table;
};

const updateTable = async ({
  id,
  body,
}: {
  id: string;
  body: any;
}): Promise<Table> => {
  const { data } = await api.patch(`/v1/table/${id}`, body);
  return data.data.table;
};

const deleteTable = async (id: string): Promise<void> => {
  await api.delete(`/v1/table/${id}`);
};

const regenerateQR = async (tableId: string): Promise<Table> => {
  const { data } = await api.post(`/v1/table/${tableId}/regenerate-qr`);
  return data.data.table;
};

export interface ChangeTablePayload {
  fromTableId: string;
  toTableId: string;
  reason?: string;
}

export interface ChangeTableResponse {
  status: string;
  message: string;
  data: {
    session: any;
  };
}

const changeTable = async (payload: ChangeTablePayload): Promise<ChangeTableResponse> => {
  const { data } = await api.post('/v1/table/change', payload);
  return data;
};

const updateTableStatus = async ({
  id,
  status,
}: {
  id: string;
  status: Table['status'];
}): Promise<Table> => {
  const { data } = await api.patch(`/v1/table/${id}/status`, { status });
  return data.data.table;
};

// ====================== SMART HOOK ======================

/**
 * Smart hook: Automatically chooses the right endpoint
 * - branchId = null → GET /v1/table (all tables or fallback)
 * - branchId = string → GET /v1/table/branch/:id
 */
export const useTablesQuery = (branchId: string | null) => {
  return useQuery<Table[], AxiosError<any>>({
    queryKey: tableKeys.list(branchId),
    queryFn: () => {
      if (branchId) {
        return fetchTablesByBranch(branchId);
      }
      return fetchAllTables();
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Keep these for backward compatibility if needed
export const useGetAllTablesQuery = () => useTablesQuery(null);
export const useGetTablesByBranchQuery = (branchId: string) =>
  useTablesQuery(branchId);

export const useGetTableQuery = (id: string) => {
  return useQuery<Table, AxiosError<any>>({
    queryKey: tableKeys.detail(id),
    queryFn: () => fetchTable(id),
    enabled: !!id,
  });
};

export const useCreateTableMutation = () => {
  const qc = useQueryClient();
  return useMutation<Table, AxiosError<any>, any>({
    mutationFn: createTable,
    onSuccess: (newTable) => {
      qc.invalidateQueries({ queryKey: tableKeys.lists() });
      qc.setQueryData(tableKeys.detail(newTable._id), newTable);
      toast.success('Table created successfully with secure QR code');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create table');
    },
  });
};

export const useUpdateTableMutation = () => {
  const qc = useQueryClient();
  return useMutation<Table, AxiosError<any>, { id: string; body: any }>({
    mutationFn: updateTable,
    onSuccess: (updatedTable) => {
      qc.setQueryData(tableKeys.detail(updatedTable._id), updatedTable);
      qc.invalidateQueries({ queryKey: tableKeys.lists() });
      toast.success('Table updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update table');
    },
  });
};

export const useDeleteTableMutation = () => {
  const qc = useQueryClient();
  return useMutation<void, AxiosError<any>, string>({
    mutationFn: deleteTable,
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: tableKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tableKeys.lists() });
      toast.success('Table deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete table');
    },
  });
};

export const useRegenerateQRMutation = () => {
  const qc = useQueryClient();
  return useMutation<Table, AxiosError<any>, string>({
    mutationFn: regenerateQR,
    onSuccess: (updatedTable) => {
      qc.setQueryData(tableKeys.detail(updatedTable._id), updatedTable);
      qc.invalidateQueries({ queryKey: tableKeys.lists() });
      toast.success('QR code regenerated successfully!', {
        description: 'New secure QR is ready for use',
      });
    },
    onError: () => {
      toast.error('Failed to regenerate QR code');
    },
  });
};

export const useChangeTableMutation = () => {
  const qc = useQueryClient();
  return useMutation<ChangeTableResponse, AxiosError<any>, ChangeTablePayload>({
    mutationFn: changeTable,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: tableKeys.all });
      toast.success(res.message || 'Table changed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change table');
    },
  });
};

export const useUpdateTableStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation<Table, AxiosError<any>, { id: string; status: Table['status'] }>({
    mutationFn: updateTableStatus,
    onSuccess: (updatedTable) => {
      qc.setQueryData(tableKeys.detail(updatedTable._id), updatedTable);
      qc.invalidateQueries({ queryKey: tableKeys.lists() });
      toast.success(`Table status updated to ${updatedTable.status}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update table status');
    },
  });
};

