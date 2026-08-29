import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Crown,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Loader2,
  Calendar,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useSubscriptionStatusQuery,
  useStartTrialMutation,
  useRenewSubscriptionMutation,
  FEATURE_CATALOG,
  type FeatureKey,
} from '@/api/Queries/subscriptionQueries';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';

export const BillingPlansPage: React.FC = () => {
  const { data: subscription, isLoading: isSubLoading, refetch: refetchSub } = useSubscriptionStatusQuery();
  const { data: merchant, isLoading: isMerchantLoading } = useMyMerchantQuery();

  const { mutateAsync: startTrial, isPending: isStartingTrial } = useStartTrialMutation();
  const { mutateAsync: renewSub, isPending: isRenewing } = useRenewSubscriptionMutation();

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState(1);

  const planName = merchant?.subscriptionPlan || subscription?.plan || 'Standard Merchant Plan';
  const isActive = merchant?.hasActiveAccess ?? (subscription?.status === 'active');
  const isTrial = Boolean(subscription?.isTrial || (merchant?.trialDaysLeft && merchant.trialDaysLeft > 0));
  const daysLeft = merchant?.trialDaysLeft ?? subscription?.daysRemaining ?? 0;

  const handleStartTrial = async () => {
    try {
      await startTrial();
      refetchSub();
    } catch (err) {
      // toast handled by mutation
    }
  };

  const handleRenew = async () => {
    try {
      await renewSub({ durationMonths: renewalMonths });
      setIsRenewModalOpen(false);
      refetchSub();
      toast.success(`Subscription renewal initiated for ${renewalMonths} month(s)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to renew subscription');
    }
  };

  // Determine active feature keys
  const activeFeatures: string[] = Array.isArray(subscription?.features)
    ? (subscription.features as string[])
    : Object.keys(merchant?.features?.optional || {}).filter(
        (k) => (merchant?.features?.optional as any)?.[k]?.enabled
      );

  return (
    <SettingPageLayout
      title="Billing & Subscription Plans"
      subtitle="View your active merchant license, feature access entitlement, and renewal schedule."
      breadcrumbs={[{ label: 'Billing' }]}
      actions={
        <div className="flex items-center gap-2">
          {!isActive && (
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={isStartingTrial}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
            >
              {isStartingTrial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Start Free Trial
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsRenewModalOpen(true)}
            disabled={isRenewing}
            className="bg-[#1E293B] hover:bg-[#091426] text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4" />
            Renew / Extend License
          </button>
        </div>
      }
    >
      {isSubLoading || isMerchantLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Loading billing details...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Plan Status Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                    {planName} License
                  </h2>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200">
                      <AlertTriangle className="h-3 w-3 text-rose-600" /> Inactive / Expired
                    </span>
                  )}
                  {isTrial && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      Trial Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{daysLeft} days remaining on current term</span>
                  </div>
                  {subscription?.endDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Expires: {new Date(subscription.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(true)}
                className="px-4 py-2 bg-[#2170E4] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Manage License
              </button>
            </div>
          </div>

          {/* Feature Entitlement Catalog Grid */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-500" />
                  Module Entitlements & Features
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status of system feature modules provisioned for your restaurant account.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {activeFeatures.length} of {Object.keys(FEATURE_CATALOG).length} Modules Provisioned
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(FEATURE_CATALOG) as FeatureKey[]).map((fKey) => {
                const item = FEATURE_CATALOG[fKey];
                const isEnabled = activeFeatures.includes(fKey) || isActive;

                return (
                  <div
                    key={fKey}
                    className={`p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                      isEnabled
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{item.category}</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.priceMonthlyETB} ETB / mo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Renew License Modal */}
      <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Renew / Extend License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Select the billing duration for extending your merchant subscription:
            </p>
            <div>
              <label className="block font-semibold mb-1">Duration (Months)</label>
              <select
                value={renewalMonths}
                onChange={(e) => setRenewalMonths(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-xs"
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months (Quarterly)</option>
                <option value={6}>6 Months (Biannual)</option>
                <option value={12}>12 Months (Annual)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsRenewModalOpen(false)}
              className="px-3 py-1.5 border rounded text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleRenew}
              disabled={isRenewing}
              className="px-4 py-1.5 bg-[#1E293B] hover:bg-[#091426] text-white rounded text-xs font-semibold flex items-center gap-1.5"
            >
              {isRenewing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Renewal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingPageLayout>
  );
};

export default BillingPlansPage;
