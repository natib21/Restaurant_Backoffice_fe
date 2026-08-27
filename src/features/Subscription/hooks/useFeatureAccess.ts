import { FEATURE_CATALOG, type FeatureKey } from '@/api/Queries/subscriptionQueries';
import { useMyMerchantQuery, type Merchant } from '@/api/Queries/merchantQueries';

/**
 * Evaluates whether a given feature key is enabled for the active merchant.
 * Follows Rule 1 of the Integration Guide:
 * The frontend must ONLY read Merchant.features (via GET /api/v1/merchant/me)
 * to decide what to show or hide. Never reconstruct feature access by
 * inspecting Subscription records directly.
 */
export function hasFeatureAccess(
  merchant: Merchant | null | undefined,
  featureKey: FeatureKey | string
): boolean {
  if (!featureKey) return true;

  // Core features: menu & tableManagement are always enabled by default
  if (featureKey === 'menu' || featureKey === 'tableManagement') {
    const coreVal = merchant?.features?.core?.[featureKey]?.enabled;
    return coreVal !== undefined ? coreVal : true;
  }

  // Check Merchant.features (core or optional)
  if (merchant?.features) {
    if (merchant.features.core?.[featureKey]?.enabled) return true;
    if (merchant.features.optional?.[featureKey]?.enabled) return true;
  }

  return false;
}

export function useFeatureAccess(featureKey?: FeatureKey | string) {
  const { data: merchant, isLoading, error, refetch } = useMyMerchantQuery();

  const hasAccess = featureKey ? hasFeatureAccess(merchant, featureKey) : true;
  const featureDetail = featureKey ? FEATURE_CATALOG[featureKey as FeatureKey] : undefined;

  const checkFeature = (key: FeatureKey | string): boolean => {
    return hasFeatureAccess(merchant, key);
  };

  return {
    hasAccess,
    hasFeature: checkFeature,
    isLoading,
    error,
    merchant,
    featureDetail,
    hasActiveAccess: merchant?.hasActiveAccess ?? true,
    isSubscriptionActive: merchant?.isSubscriptionActive ?? false,
    trialDaysLeft: merchant?.trialDaysLeft,
    refetchMerchant: refetch,
  };
}

