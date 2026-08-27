// src/api/Queries/campaignQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';

export interface CampaignAudience {
  tags?: string[];
  loyaltyTier?: ('bronze' | 'silver' | 'gold' | 'platinum' | string)[];
  minTotalOrders?: number;
  minSpent?: number;
  maxSpent?: number;
}

export interface CampaignCreateRequest {
  name: string;
  message: string;
  imageUrl?: string;
  audience?: CampaignAudience;
  branch?: string;
}

export interface CampaignStats {
  audienceSize?: number;
  sentCount?: number;
  failedCount?: number;
  totalRecipients?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
}

export interface Campaign {
  _id: string;
  name: string;
  message: string;
  imageUrl?: string;
  audience?: CampaignAudience;
  branch?: string;
  status: 'draft' | 'sending' | 'sent' | 'failed' | 'scheduled';
  stats?: CampaignStats;
  sentAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CampaignListResponse {
  results?: number;
  campaigns?: Campaign[];
  data?: {
    campaigns?: Campaign[];
  };
}

export interface PreviewAudienceResponse {
  audienceSize?: number;
  count?: number;
  data?: {
    count?: number;
    preview?: any[];
  };
}

// GET /v1/campaigns
export const fetchCampaignsList = async (): Promise<Campaign[]> => {
  try {
    const response = await apiClient.get<any>('/v1/campaigns');
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.campaigns)) return response.data.campaigns;
    if (Array.isArray(response.data?.data?.campaigns)) return response.data.data.campaigns;
    return [];
  } catch (err) {
    const response = await apiClient.get<any>('/campaigns');
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.campaigns)) return response.data.campaigns;
    if (Array.isArray(response.data?.data?.campaigns)) return response.data.data.campaigns;
    return [];
  }
};

export const useGetCampaignsList = () => {
  return useQuery({
    queryKey: ['campaignsList'],
    queryFn: fetchCampaignsList,
    refetchInterval: (query) => {
      const campaigns = query.state.data;
      const hasSending = campaigns?.some((c) => c.status === 'sending');
      return hasSending ? 5000 : false;
    },
  });
};

// GET /v1/campaigns/:id
export const fetchCampaignDetails = async (campaignId: string): Promise<Campaign> => {
  try {
    const response = await apiClient.get<any>(`/v1/campaigns/${campaignId}`);
    if (response.data?.campaign) return response.data.campaign;
    if (response.data?.data) return response.data.data;
    return response.data;
  } catch (err) {
    const response = await apiClient.get<any>(`/campaigns/${campaignId}`);
    if (response.data?.campaign) return response.data.campaign;
    if (response.data?.data) return response.data.data;
    return response.data;
  }
};

export const useGetCampaignDetails = (campaignId?: string | null) => {
  return useQuery({
    queryKey: ['campaignDetails', campaignId],
    queryFn: () => fetchCampaignDetails(campaignId!),
    enabled: !!campaignId,
    refetchInterval: (query) => {
      const campaign = query.state.data;
      if (campaign?.status === 'sending') {
        return 2000; // Poll every 2 seconds while status is 'sending'
      }
      return false;
    },
  });
};

// POST /v1/campaigns
export const createCampaign = async (data: CampaignCreateRequest): Promise<Campaign> => {
  try {
    const response = await apiClient.post<any>('/v1/campaigns', data);
    return response.data?.campaign || response.data?.data || response.data;
  } catch (err) {
    const response = await apiClient.post<any>('/campaigns', data);
    return response.data?.campaign || response.data?.data || response.data;
  }
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
    },
  });
};

// POST /v1/campaigns/:id/preview-audience
export const previewCampaignAudience = async (
  campaignId: string,
  audience?: CampaignAudience
): Promise<number> => {
  try {
    const response = await apiClient.post<any>(
      `/v1/campaigns/${campaignId}/preview-audience`,
      { audience }
    );
    return (
      response.data?.audienceSize ??
      response.data?.count ??
      response.data?.data?.count ??
      0
    );
  } catch (err) {
    const response = await apiClient.post<any>(
      `/campaigns/${campaignId}/preview-audience`,
      { audience }
    );
    return (
      response.data?.audienceSize ??
      response.data?.count ??
      response.data?.data?.count ??
      0
    );
  }
};

export const usePreviewCampaignAudience = () => {
  return useMutation({
    mutationFn: ({ campaignId, audience }: { campaignId: string; audience?: CampaignAudience }) =>
      previewCampaignAudience(campaignId, audience),
  });
};

// POST /v1/campaigns/:id/send
export const sendCampaign = async (campaignId: string): Promise<Campaign> => {
  try {
    const response = await apiClient.post<any>(`/v1/campaigns/${campaignId}/send`);
    return response.data?.campaign || response.data?.data || response.data;
  } catch (err) {
    const response = await apiClient.post<any>(`/campaigns/${campaignId}/send`);
    return response.data?.campaign || response.data?.data || response.data;
  }
};

export const useSendCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendCampaign,
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
      queryClient.invalidateQueries({ queryKey: ['campaignDetails', campaignId] });
    },
  });
};

// DELETE /v1/campaigns/:id
export const deleteCampaign = async (campaignId: string): Promise<void> => {
  try {
    await apiClient.delete(`/v1/campaigns/${campaignId}`);
  } catch (err) {
    await apiClient.delete(`/campaigns/${campaignId}`);
  }
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
    },
  });
};
