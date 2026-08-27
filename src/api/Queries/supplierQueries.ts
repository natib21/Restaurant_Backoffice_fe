import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Supplier Types
export interface SupplierAddress {
  street: string;
  city: string;
  zipCode: string;
}

export interface SupplierCreateRequest {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: SupplierAddress;
  paymentTerms: 'cash' | 'net_7' | 'net_15' | 'net_30' | 'net_60';
  leadTime?: number; // Days
  rating?: number; // 1-5
  isActive?: boolean;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: SupplierAddress;
  paymentTerms: 'cash' | 'net_7' | 'net_15' | 'net_30' | 'net_60';
  leadTime?: number;
  rating?: number;
  merchant: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  status: string;
  results: number;
  data: {
    suppliers: Supplier[];
  };
}

// List all suppliers
export const useGetSuppliersList = () => {
  return useQuery<SupplierListResponse>({
    queryKey: ['suppliersList'],
    queryFn: async () => {
      const response = await api.get('/v1/suppliers');
      return response.data;
    },
  });
};

// Get supplier by ID
export const useGetSupplierDetails = (supplierId?: string) => {
  return useQuery<{ status: string; data: { supplier: Supplier } }>({
    queryKey: ['supplierDetails', supplierId],
    queryFn: async () => {
      if (!supplierId) throw new Error('Supplier ID is required');
      const response = await api.get(`/v1/suppliers/${supplierId}`);
      return response.data;
    },
    enabled: !!supplierId,
  });
};

// Create supplier
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SupplierCreateRequest) => {
      const response = await api.post('/v1/suppliers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliersList'] });
    },
  });
};

// Update supplier
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, data }: { supplierId: string; data: Partial<SupplierCreateRequest> }) => {
      const response = await api.patch(`/v1/suppliers/${supplierId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplierDetails', variables.supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliersList'] });
    },
  });
};

// Delete/deactivate supplier
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await api.delete(`/v1/suppliers/${supplierId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliersList'] });
    },
  });
};
