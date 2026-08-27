import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Feedback Types
export interface FeedbackSubmitRequest {
  rating: number; // 1-5
  comment?: string;
  categories?: string[]; // e.g., ['food_quality', 'service']
  channel?: string; // 'app', 'in-store', 'website', 'qr', etc.
  order?: string; // Order ID
  images?: string[]; // Array of image URLs
  isPublic?: boolean;
}

export interface FeedbackResponse {
  _id: string;
  rating: number;
  comment?: string;
  categories?: string[];
  channel?: string;
  order?: string;
  images?: string[];
  isPublic?: boolean;
  status?: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
  customer?: {
    _id: string;
    name: string;
    phone: string;
  };
  branch?: string;
  merchantResponse?: {
    responseText: string;
    respondedBy: string;
    respondedAt: string;
  };
  flaggedReason?: string;
}

export interface FeedbackListRequest {
  status?: 'new' | 'reviewed' | 'resolved';
  branchId?: string;
  rating?: number; // Filter by specific rating or above
  page?: number;
  limit?: number;
}

export interface FeedbackUpdateRequest {
  status?: 'new' | 'reviewed' | 'resolved';
  responseText?: string;
  isPublic?: boolean;
  flaggedReason?: string;
}

export interface FeedbackListResponse {
  status: string;
  data: FeedbackResponse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Customer Feedback Submission (QR/Table Session)
export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (data: FeedbackSubmitRequest) => {
      const response = await api.post('/v1/feedback', data);
      return response.data;
    },
  });
};

// Staff: List all feedback
export const useGetFeedbackList = (params?: FeedbackListRequest) => {
  return useQuery<FeedbackListResponse>({
    queryKey: ['feedbackList', params],
    queryFn: async () => {
      const response = await api.get('/v1/feedback');
      return response.data;
    },
  });
};

// Staff: Get feedback details
export const useGetFeedbackDetails = (feedbackId?: string) => {
  return useQuery<{ status: string; data: FeedbackResponse }>({
    queryKey: ['feedbackDetails', feedbackId],
    queryFn: async () => {
      if (!feedbackId) throw new Error('Feedback ID is required');
      const response = await api.get(`/v1/feedback/${feedbackId}`);
      return response.data;
    },
    enabled: !!feedbackId,
  });
};

// Staff: Respond to feedback
export const useRespondToFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ feedbackId, data }: { feedbackId: string; data: FeedbackUpdateRequest }) => {
      const response = await api.patch(`/v1/feedback/${feedbackId}/response`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedbackDetails', variables.feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedbackList'] });
    },
  });
};

// Feedback Statistics
export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  positive: number;
  neutral: number;
  negative: number;
  responded: number;
  responseRate: number;
}

export const useGetFeedbackStats = () => {
  return useQuery<{ status: string; data: FeedbackStats }>({
    queryKey: ['feedbackStats'],
    queryFn: async () => {
      const response = await api.get('/v1/feedback/stats');
      return response.data;
    },
  });
};
