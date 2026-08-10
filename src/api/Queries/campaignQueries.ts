import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Campaign Types
export interface CampaignAudience {
  loyaltyTier?: string[]; // ['bronze', 'silver', 'gold']
  minSpent?: number;
  maxSpent?: number;
  orderCount?: number;
  tags?: string[];
  lastSeenDays?: number; // Days since last order
  excludeTags?: string[];
  customerGroups?: string[]; // Segment IDs
}

export interface CampaignCreateRequest {
  name: string;
  message: string;
  imageUrl?: string;
  audience?: CampaignAudience;
  branch?: string;
  channels?: string[]; // ['email', 'sms', 'in-app', 'push']
  scheduledFor?: string; // ISO date string
  expiresAt?: string; // ISO date string
}

export interface Campaign {
  _id: string;
  name: string;
  message: string;
  imageUrl?: string;
  audience?: CampaignAudience;
  branch?: string;
  channels?: string[];
  status: 'draft' | 'scheduled' | 'sent' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  expiresAt?: string;
  sentAt?: string;
  stats?: {
    totalRecipients: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

export interface CampaignListResponse {
  status: string;
  results?: number;
  data: {
    campaigns: Campaign[];
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AudiencePreviewResponse {
  status: string;
  data: {
    count: number;
    preview: Array<{
      _id: string;
      fullName: string;
      phone: string;
      email?: string;
      loyaltyTier?: string;
      lastSpent?: number;
    }>;
  };
}

// Create campaign
export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CampaignCreateRequest) => {
      const response = await api.post('/v1/campaigns', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
    },
  });
};

// List campaigns
export const useGetCampaignsList = (params?: { status?: string; branch?: string; page?: number; limit?: number }) => {
  return useQuery<CampaignListResponse>({
    queryKey: ['campaignsList', params],
    queryFn: async () => {
      const response = await api.get('/v1/campaigns', { params });
      return response.data;
    },
  });
};

// Get campaign by ID
export const useGetCampaignDetails = (campaignId?: string) => {
  return useQuery<{ status: string; data: Campaign }>({
    queryKey: ['campaignDetails', campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID is required');
      const response = await api.get(`/v1/campaigns/${campaignId}`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

// Preview audience
export const usePreviewCampaignAudience = () => {
  return useMutation({
    mutationFn: async ({ campaignId, audience }: { campaignId: string; audience: CampaignAudience }) => {
      const response = await api.post(`/v1/campaigns/${campaignId}/preview-audience`, { audience });
      return response.data as AudiencePreviewResponse;
    },
  });
};

// Send campaign
export const useSendCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/v1/campaigns/${campaignId}/send`);
      return response.data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaignDetails', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
    },
  });
};

// Update campaign
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ campaignId, data }: { campaignId: string; data: Partial<CampaignCreateRequest> }) => {
      const response = await api.patch(`/v1/campaigns/${campaignId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaignDetails', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
    },
  });
};

// Delete campaign
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.delete(`/v1/campaigns/${campaignId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
    },
  });
};
