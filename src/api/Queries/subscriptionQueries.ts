import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ======================================================
// 1. Feature Keys & Catalog Definition
// ======================================================
export const FEATURE_KEYS = [
  'orders',
  'inventory',
  'multiBranch',
  'telegram',
  'sales',
  'reports',
  'customerManagement',
  'deliveryManagement',
  'paymentIntegration',
  'restaurantWebsite',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export interface FeatureDetail {
  key: FeatureKey;
  name: string;
  description: string;
  category: 'Core' | 'Operations' | 'Growth' | 'Integrations';
  priceMonthlyETB: number;
}

export interface FetchedCatalogItem {
  pricePerMonth?: number;
  priceMonthlyETB?: number;
  price?: number;
  description?: string;
  name?: string;
  category?: 'Core' | 'Operations' | 'Growth' | 'Integrations' | string;
}

export type FetchedCatalog = Partial<Record<FeatureKey, FetchedCatalogItem>>;

export const FEATURE_CATALOG: Record<FeatureKey, FeatureDetail> = {
  orders: {
    key: 'orders',
    name: 'Order Management',
    description: 'Active order lifecycle, POS counter, dine-in, takeaway & kitchen tracking.',
    category: 'Core',
    priceMonthlyETB: 500,
  },
  inventory: {
    key: 'inventory',
    name: 'Inventory & Stock Control',
    description: 'Ingredients tracking, recipes, supplier purchase orders & waste logs.',
    category: 'Operations',
    priceMonthlyETB: 800,
  },
  multiBranch: {
    key: 'multiBranch',
    name: 'Multi-Branch Operations',
    description: 'Manage multiple restaurant locations, transfer stock & branch staff roles.',
    category: 'Operations',
    priceMonthlyETB: 1200,
  },
  telegram: {
    key: 'telegram',
    name: 'Telegram Bot & Ordering',
    description: 'Interactive Telegram mini-app ordering, chat assistant & push updates.',
    category: 'Growth',
    priceMonthlyETB: 700,
  },
  sales: {
    key: 'sales',
    name: 'Sales & POS Terminal',
    description: 'Full POS checkout screen, payment logging, and daily register breakdown.',
    category: 'Core',
    priceMonthlyETB: 600,
  },
  reports: {
    key: 'reports',
    name: 'Advanced Analytics & Reports',
    description: 'Deep revenue trends, top-selling menu items, peak hour traffic & CSV exports.',
    category: 'Growth',
    priceMonthlyETB: 900,
  },
  customerManagement: {
    key: 'customerManagement',
    name: 'Customer CRM & Loyalty',
    description: 'Customer directory, group segmentation, loyalty tiers & feedback tracking.',
    category: 'Growth',
    priceMonthlyETB: 600,
  },
  deliveryManagement: {
    key: 'deliveryManagement',
    name: 'Delivery & Dispatch',
    description: 'Rider dispatch, delivery zone fees, address validation & live tracking.',
    category: 'Operations',
    priceMonthlyETB: 700,
  },
  paymentIntegration: {
    key: 'paymentIntegration',
    name: 'Payment Gateways',
    description: 'Integrated digital payments (Chapa, Telebirr, CBE Birr) & online verification.',
    category: 'Integrations',
    priceMonthlyETB: 800,
  },
  restaurantWebsite: {
    key: 'restaurantWebsite',
    name: 'Custom Online Menu / Website',
    description: 'Branded public web storefront for online table reservations & customer orders.',
    category: 'Growth',
    priceMonthlyETB: 1000,
  },
};

// ======================================================
// 2. Interfaces & DTOs
// ======================================================
export interface Subscription {
  _id: string;
  plan?: string;
  features: FeatureKey[] | string[];
  isTrial: boolean;
  status: 'active' | 'pending' | 'expired' | 'canceled' | 'none';
  endDate: string;
  trialEndDate?: string | null;
  isActive?: boolean;
  daysRemaining?: number;
  amount?: number;
  nextPaymentDate?: string;
}

export interface StartTrialResponse {
  status: 'success';
  message: string;
  data: {
    subscription: Subscription;
  };
}

export interface InitiateSubscriptionPayload {
  features: (FeatureKey | string)[];
  durationMonths?: number;
  phone?: string;
}

export interface InitiateSubscriptionResponse {
  status: 'success';
  data: {
    tx_ref: string;
    checkout_url?: string | null;
  };
}

export interface VerifySubscriptionPayload {
  tx_ref: string;
}

export interface VerifySubscriptionResponse {
  status: 'success';
  message: string;
  data: {
    subscription: Subscription;
  };
}

export interface CheckFeaturePayload {
  feature: FeatureKey | string;
}

export interface CheckFeatureResponse {
  status: 'success';
  data: {
    feature: string;
    hasAccess: boolean;
    reason?: string;
  };
}

export interface RenewSubscriptionPayload {
  durationMonths?: number;
}

export interface RenewSubscriptionResponse {
  status: 'success';
  message: string;
  data: {
    subscription: Subscription;
  };
}

export interface ExpiringSoonSubscription {
  _id: string;
  merchant: string | { _id: string; businessName: string };
  plan: string;
  endDate: string;
  daysRemaining: number;
}

export interface SubscriptionStats {
  totalActive: number;
  totalTrial: number;
  totalExpired: number;
  monthlyRevenue: number;
}

// ======================================================
// 3. React Query Keys (Matching Guide §12)
// ======================================================
export const subscriptionKeys = {
  status: ['subscription-status'] as const,
  merchantProfile: ['merchant', 'profile'] as const,
  expiringSoon: (days: number) => ['subscription-expiring-soon', days] as const,
  stats: ['subscription-stats'] as const,
};

// ======================================================
// 4. API Service Functions
// ======================================================

/**
 * GET /v1/subscriptions/status
 */
export const fetchSubscriptionStatus = async (): Promise<Subscription | null> => {
  try {
    const { data } = await api.get('/v1/subscriptions/status');
    const sub = data?.data?.subscription || data?.subscription || data?.data;
    return sub ?? null;
  } catch (err: any) {
    if (err.response?.status === 404) {
      // 404 means no subscription record exists yet for new merchant
      return null;
    }
    throw err;
  }
};

/**
 * POST /v1/subscriptions/trial
 */
export const startFreeTrial = async (): Promise<StartTrialResponse> => {
  const { data } = await api.post('/v1/subscriptions/trial');
  return data;
};

/**
 * POST /v1/subscriptions/initiate
 */
export const initiateSubscription = async (
  payload: InitiateSubscriptionPayload
): Promise<InitiateSubscriptionResponse> => {
  const { data } = await api.post('/v1/subscriptions/initiate', payload);
  return data;
};

/**
 * POST /v1/subscriptions/verify
 */
export const verifySubscription = async (
  payload: VerifySubscriptionPayload
): Promise<VerifySubscriptionResponse> => {
  const { data } = await api.post('/v1/subscriptions/verify', payload);
  return data;
};

/**
 * POST /v1/subscriptions/check-feature
 */
export const checkFeatureAccess = async (
  payload: CheckFeaturePayload
): Promise<CheckFeatureResponse> => {
  const { data } = await api.post('/v1/subscriptions/check-feature', payload);
  return data;
};

/**
 * POST /v1/subscriptions/renew
 */
export const renewSubscription = async (
  payload: RenewSubscriptionPayload
): Promise<RenewSubscriptionResponse> => {
  const { data } = await api.post('/v1/subscriptions/renew', payload);
  return data;
};

/**
 * GET /v1/subscriptions/expiring-soon?days=7
 */
export const fetchExpiringSoonSubscriptions = async (
  days = 7
): Promise<ExpiringSoonSubscription[]> => {
  const { data } = await api.get(`/v1/subscriptions/expiring-soon?days=${days}`);
  return data?.data?.subscriptions || [];
};

/**
 * GET /v1/subscriptions/stats
 */
export const fetchSubscriptionStats = async (): Promise<SubscriptionStats> => {
  const { data } = await api.get('/v1/subscriptions/stats');
  return data?.data || { totalActive: 0, totalTrial: 0, totalExpired: 0, monthlyRevenue: 0 };
};

// ======================================================
// 5. Custom React Query Hooks
// ======================================================

/**
 * GET /v1/subscriptions/status
 */
export const useSubscriptionStatusQuery = () => {
  return useQuery<Subscription | null>({
    queryKey: subscriptionKeys.status,
    queryFn: fetchSubscriptionStatus,
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Alias for backwards compatibility if needed
export const useSubscriptionQuery = useSubscriptionStatusQuery;

/**
 * POST /v1/subscriptions/trial
 */
export const useStartTrialMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<StartTrialResponse, Error, void>({
    mutationFn: startFreeTrial,
    onSuccess: (res) => {
      toast.success(res.message || 'Free trial activated successfully!');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Failed to activate free trial. You may already have an active subscription.'
      );
    },
  });
};

/**
 * POST /v1/subscriptions/initiate
 */
export const useInitiateSubscriptionMutation = () => {
  return useMutation<InitiateSubscriptionResponse, Error, InitiateSubscriptionPayload>({
    mutationFn: initiateSubscription,
    onSuccess: (res) => {
      const { tx_ref, checkout_url } = res.data;

      if (tx_ref) {
        localStorage.setItem('pending_tx_ref', tx_ref);
      }

      if (checkout_url) {
        toast.info('Redirecting to payment checkout...');
        window.location.href = checkout_url;
      } else {
        toast.warning(
          'Subscription initiated. Payment verification pending. Contact support if required.'
        );
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initiate subscription payment.');
    },
  });
};

// Alias for backwards compatibility
export const useSubscribeMutation = useInitiateSubscriptionMutation;

/**
 * POST /v1/subscriptions/verify
 */
export const useVerifyPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifySubscriptionResponse, Error, string>({
    mutationFn: (tx_ref: string) => verifySubscription({ tx_ref }),
    onSuccess: (res) => {
      toast.success(res.message || 'Subscription activated successfully!');
      localStorage.removeItem('pending_tx_ref');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Payment could not be verified. Contact support if you were charged.'
      );
    },
  });
};

/**
 * POST /v1/subscriptions/check-feature
 */
export const useCheckFeatureMutation = () => {
  return useMutation<CheckFeatureResponse, Error, FeatureKey | string>({
    mutationFn: (feature) => checkFeatureAccess({ feature }),
  });
};

export const useCheckFeatureQuery = (feature: FeatureKey | string, enabled = true) => {
  return useQuery<CheckFeatureResponse>({
    queryKey: ['check-feature', feature],
    queryFn: () => checkFeatureAccess({ feature }),
    enabled: enabled && !!feature,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * POST /v1/subscriptions/renew
 */
export const useRenewSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<RenewSubscriptionResponse, Error, { durationMonths?: number } | undefined>({
    mutationFn: (payload) => renewSubscription(payload || { durationMonths: 1 }),
    onSuccess: (res) => {
      toast.success(res.message || 'Subscription renewed successfully!');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to renew subscription.');
    },
  });
};

/**
 * Admin: GET /v1/subscriptions/expiring-soon
 */
export const useExpiringSoonSubscriptionsQuery = (days = 7) => {
  return useQuery<ExpiringSoonSubscription[]>({
    queryKey: subscriptionKeys.expiringSoon(days),
    queryFn: () => fetchExpiringSoonSubscriptions(days),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Admin: GET /v1/subscriptions/stats
 */
export const useSubscriptionStatsQuery = () => {
  return useQuery<SubscriptionStats>({
    queryKey: subscriptionKeys.stats,
    queryFn: fetchSubscriptionStats,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * GET /subscriptions/catalog or /v1/subscriptions/catalog
 */
export const fetchFeatureCatalog = async (): Promise<FetchedCatalog> => {
  try {
    const { data } = await api.get('/v1/subscriptions/catalog');
    return data?.data?.catalog || data?.catalog || data?.data || data || {};
  } catch {
    try {
      const { data } = await api.get('/subscriptions/catalog');
      return data?.data?.catalog || data?.catalog || data?.data || data || {};
    } catch {
      return {};
    }
  }
};

export const useFeatureCatalogQuery = () => {
  return useQuery<FetchedCatalog>({
    queryKey: ['subscriptions-catalog'],
    queryFn: fetchFeatureCatalog,
    staleTime: 1000 * 60 * 10,
  });
};

