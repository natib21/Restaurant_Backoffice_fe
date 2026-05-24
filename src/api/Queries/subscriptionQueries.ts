import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';



export interface SubscriptionUsage {
  orders: number;
  staff: number;
}

export interface SubscriptionLimits {
  orders: number;
  staff: number;
}

export interface Subscription {
  _id: string;
  status: 'active' | 'pending' | 'none' | 'expired';
  plan: 'basic' | 'pro' | 'enterprise';
  amount: number;
  endDate: string;
  nextPaymentDate?: string;
  nextAmount?: number;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  features: string[];
  transactionReference: string;
}

export interface InitiateResponse {
  session: {
    paymentUrl:string
  };
  tx_ref: string;
}



export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: () => [...subscriptionKeys.all, 'status'] as const,
};



export const fetchSubscriptionStatus = async (): Promise<Subscription> => {
  const { data } = await api.get('/v1/subscriptions/status');
  return data.data;
};

export const initiateSubscription = async (payload: { 
  plan: string; 
  durationMonths: number 
}): Promise<InitiateResponse> => {
  const { data } = await api.post('/v1/subscriptions/subscribe', payload);
  return data.data;
};

export const verifySubscription = async (tx_ref: string): Promise<{ message: string }> => {
  const { data } = await api.post('/v1/subscriptions/verify', { tx_ref });
  return data;
};




export const useSubscriptionQuery = () => {
  return useQuery<Subscription>({
    queryKey: subscriptionKeys.status(),
    queryFn: fetchSubscriptionStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // refetchInterval: 30000,    // Poll every 30s to update usage bars
    /* retry: (failureCount, error: any) => {
      // Don't retry if the backend specifically says no subscription found (404)
      if (error.response?.status === 404) return false;
      return failureCount < 2;
    }, */
  });
};

/**
 * 2. Hook to start a new subscription or upgrade an existing one.
 * It automatically handles the redirect to the checkout URL.
 */
export const useSubscribeMutation = () => {
  return useMutation<InitiateResponse, Error, { plan: string; durationMonths: number }>({
    mutationFn: initiateSubscription,
    onSuccess: (data) => {
        console.log(data)
      if (data.session) {
        window.location.href = data.session.paymentUrl;
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize subscription');
    },
  });
};

/**
 * 3. Hook to verify a payment using the tx_ref.
 * Useful on your "Payment Success" page.
 */
export const useVerifyPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: verifySubscription,
    onSuccess: () => {
      toast.success('Payment verified successfully!');
      // Invalidate the status query so all components get the updated 'active' status
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Verification failed');
    },
  });
};