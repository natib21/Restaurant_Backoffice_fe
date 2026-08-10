import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Customer Session Types
export interface CustomerSession {
  _id: string;
  merchant: string;
  branch: string;
  fullName: string;
  phone: string;
  source: string;
  currentTable?: string;
  lastSeen: string;
  loyalty: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold';
    gifts: any[];
  };
  tags: string[];
  notes: string[];
  stats: {
    totalOrders: number;
    totalSpent: number;
  };
}

export interface CustomerLoginRequest {
  fullName: string;
  phone: string;
  source: 'guest' | 'qr' | 'app';
}

export interface CustomerGiftRequest {
  giftId: string;
}

export interface StaffCustomerUpdateRequest {
  fullName?: string;
  phone?: string;
  tags?: Array<{ value: string }>;
  notes?: Array<{ text: string }>;
  'loyalty.points'?: number;
  'loyalty.tier'?: 'bronze' | 'silver' | 'gold';
  'stats.totalOrders'?: number;
  'stats.totalSpent'?: number;
}

export interface StaffTagNoteRequest {
  tag?: string;
  note?: string;
}

export interface StaffGiftRequest {
  name: string;
  type: 'free_item' | 'discount' | 'points';
  value: number;
  menuItemId?: string;
  expiresInDays?: number;
  reason?: string;
}

// Customer Order
export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

// Response Types
export interface CustomerResponse {
  status: string;
  message?: string;
  existing?: boolean;
  seated?: boolean;
  data?: {
    customer?: CustomerSession;
  };
  results?: number;
  stats?: {
    totalSpent: number;
    visits: number;
  };
}

// Customer Session API (for customers using session token)
export const useCustomerLogin = () => {
  return useMutation({
    mutationFn: async (data: CustomerLoginRequest) => {
      const response = await api.post('/v1/customer/login', data);
      return response.data;
    },
  });
};

export const useCustomerGiftClaim = (sessionToken?: string) => {
  return useMutation({
    mutationFn: async (data: CustomerGiftRequest) => {
      const headers = sessionToken ? { 'X-Session-Token': sessionToken } : {};
      const response = await api.post('/v1/customer/gift/claim', data, { headers });
      return response.data;
    },
  });
};

export const useGetCustomerProfile = (sessionToken?: string) => {
  return useQuery({
    queryKey: ['customerProfile', sessionToken],
    queryFn: async () => {
      const headers = sessionToken ? { 'X-Session-Token': sessionToken } : {};
      const response = await api.get('/v1/customer/me', { headers });
      return response.data;
    },
    enabled: !!sessionToken,
  });
};

export const useUpdateCustomerProfile = (sessionToken?: string) => {
  return useMutation({
    mutationFn: async (data: Partial<CustomerLoginRequest>) => {
      const headers = sessionToken ? { 'X-Session-Token': sessionToken } : {};
      const response = await api.patch('/v1/customer/me', data, { headers });
      return response.data;
    },
  });
};

export const useGetCustomerOrders = (sessionToken?: string) => {
  return useQuery({
    queryKey: ['customerOrders', sessionToken],
    queryFn: async () => {
      const headers = sessionToken ? { 'X-Session-Token': sessionToken } : {};
      const response = await api.get('/v1/customer/my-orders', { headers });
      return response.data;
    },
    enabled: !!sessionToken,
  });
};

// Staff CRM API (for merchant staff with JWT auth)
export const useGetCustomersList = () => {
  return useQuery<CustomerResponse>({
    queryKey: ['customersList'],
    queryFn: async () => {
      const response = await api.get('/v1/customer/crm');
      return response.data;
    },
  });
};

export const useGetCustomerDetails = (customerId?: string) => {
  return useQuery<CustomerResponse>({
    queryKey: ['customerDetails', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const response = await api.get(`/v1/customer/${customerId}`);
      return response.data;
    },
    enabled: !!customerId,
  });
};

export const useStaffGiveGift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, giftData }: { customerId: string; giftData: StaffGiftRequest }) => {
      const response = await api.post(`/v1/customer/${customerId}/gift`, giftData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate customer details cache
      queryClient.invalidateQueries({ queryKey: ['customerDetails', variables.customerId] });
    },
  });
};

export const useStaffAddTagNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, tagOrNote }: { customerId: string; tagOrNote: StaffTagNoteRequest }) => {
      const response = await api.patch(`/v1/customer/${customerId}/tag`, tagOrNote);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate customer details cache
      queryClient.invalidateQueries({ queryKey: ['customerDetails', variables.customerId] });
    },
  });
};

export const useStaffUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, updateData }: { customerId: string; updateData: StaffCustomerUpdateRequest }) => {
      const response = await api.patch(`/v1/customer/${customerId}`, updateData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate customer details and list cache
      queryClient.invalidateQueries({ queryKey: ['customerDetails', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customersList'] });
    },
  });
};

export const useStaffDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await api.delete(`/v1/customer/${customerId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate customer list cache
      queryClient.invalidateQueries({ queryKey: ['customersList'] });
    },
  });
};