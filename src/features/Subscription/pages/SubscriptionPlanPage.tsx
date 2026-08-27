import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Zap,
  Crown,
  Loader2,
  RefreshCcw,
  History,
  Sparkles,
  Phone,
  Calendar,
  ShieldCheck,
  CreditCard,
  Building2,
  Bot,
  BarChart3,
  Users,
  Truck,
  Globe,
  Receipt,
  RotateCw,
  Globe2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useSubscriptionStatusQuery,
  useStartTrialMutation,
  useInitiateSubscriptionMutation,
  useRenewSubscriptionMutation,
  useFeatureCatalogQuery,
  FEATURE_KEYS,
  FEATURE_CATALOG,
  type FeatureKey,
} from '@/api/Queries/subscriptionQueries';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import { toast } from 'sonner';
import { useTranslation, type Language } from '@/locales/i18n';

// Exchange rate constant for cosmetic USD preview conversion (1 USD = 135 ETB)
const USD_TO_ETB_RATE = 135;

export default function SubscriptionPlanPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('subscription');

  // Queries & Mutations
  const { data: subResponse, isLoading: isSubLoading, refetch, isRefetching } = useSubscriptionStatusQuery();
  const { data: catalogData, isLoading: isCatalogLoading } = useFeatureCatalogQuery();
  const { data: merchant } = useMyMerchantQuery();

  const subscription = subResponse ?? (subResponse as any)?.data?.subscription ?? subResponse;

  const { mutate: startTrial, isPending: startingTrial } = useStartTrialMutation();
  const { mutate: initiateSubscription, isPending: initiating } = useInitiateSubscriptionMutation();
  const { mutate: renewSubscription, isPending: renewing } = useRenewSubscriptionMutation();

  // Local Selection & Settings State - default to all 10 features
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([...FEATURE_KEYS]);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [renewDialogOpen, setRenewDialogOpen] = useState<boolean>(false);
  const [renewMonths, setRenewMonths] = useState<number>(1);

  // Currency & Language Settings State
  const [displayCurrency, setDisplayCurrency] = useState<'ETB' | 'USD'>('ETB');

  // Set defaults from merchant settings or active subscription
  useEffect(() => {
    if (merchant?.phone) {
      setPhoneNumber(merchant.phone);
    }
    if (merchant?.settings?.currency) {
      setDisplayCurrency(merchant.settings.currency === 'USD' ? 'USD' : 'ETB');
    }
  }, [merchant]);

  // Pre-select active subscription features if available, otherwise keep all features
  useEffect(() => {
    if (subscription?.features && Array.isArray(subscription.features) && subscription.features.length > 0) {
      const activeKeys = (subscription.features as string[])
        .filter((k): k is FeatureKey => FEATURE_KEYS.includes(k as FeatureKey));
      if (activeKeys.length > 0) {
        setSelectedFeatures(activeKeys);
      }
    }
  }, [subscription]);

  // Reliable price getter with fallback to FEATURE_CATALOG default ETB prices
  const getItemETBPrice = (key: FeatureKey): number => {
    const fallbackPrice = FEATURE_CATALOG[key]?.priceMonthlyETB ?? 500;
    if (!catalogData) return fallbackPrice;

    const rawCatalog = (catalogData as any)?.catalog || (catalogData as any)?.data?.catalog || catalogData;
    const item = rawCatalog?.[key];
    if (!item) return fallbackPrice;

    const price = item.pricePerMonth ?? item.priceMonthlyETB ?? item.price;
    if (typeof price === 'number' && !isNaN(price) && price > 0) {
      return price;
    }
    return fallbackPrice;
  };

  // Active status checks
  const isActive = Boolean(subscription?.isActive || subscription?.status === 'active');
  const isTrial = Boolean(subscription?.isTrial);
  const isPending = subscription?.status === 'pending';
  const daysRemaining = subscription?.daysRemaining ?? null;
  const activeFeatures: string[] = Array.isArray(subscription?.features)
    ? (subscription.features as string[])
    : [];

  // Toggle Feature Selection
  const toggleFeature = (key: FeatureKey) => {
    if (selectedFeatures.includes(key)) {
      if (selectedFeatures.length === 1) {
        toast.warning(t('selectAtLeastOneFeature') || 'Please keep at least one feature selected.');
        return;
      }
      setSelectedFeatures(selectedFeatures.filter((k) => k !== key));
    } else {
      setSelectedFeatures([...selectedFeatures, key]);
    }
  };

  // Quick Preset Bundles
  const applyPreset = (preset: 'starter' | 'growth' | 'all') => {
    let targets: FeatureKey[] = [];
    if (preset === 'starter') {
      targets = ['orders', 'sales'];
    } else if (preset === 'growth') {
      targets = ['orders', 'sales', 'inventory', 'telegram', 'reports'];
    } else if (preset === 'all') {
      targets = [...FEATURE_KEYS];
    }
    setSelectedFeatures(targets);
  };

  // Dynamic Price Calculation
  const calculateTotalETB = (): number => {
    const monthlySum = selectedFeatures.reduce((sum, key) => {
      return sum + getItemETBPrice(key);
    }, 0);

    let discount = 1;
    if (durationMonths === 3) discount = 0.95;
    if (durationMonths === 6) discount = 0.9;
    if (durationMonths === 12) discount = 0.8;

    return Math.round(monthlySum * durationMonths * discount);
  };
  // Add this helper function
const normalizeEthiopianPhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;

  // Remove spaces, dashes, etc.
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Already has +251
  if (cleaned.startsWith('+251')) return cleaned;

  // Starts with 251 → add +
  if (cleaned.startsWith('251') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // Local format 09... or 07...
  if (/^0[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned.slice(1)}`;
  }

  // Already 9 digits starting with 9 or 7
  if (/^[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned}`;
  }

  return cleaned; // fallback
};

  // Format cosmetic display price
  const formatDisplayPrice = (priceInETB: number): string => {
    if (displayCurrency === 'USD') {
      const usdAmount = priceInETB / USD_TO_ETB_RATE;
      return `$${usdAmount.toFixed(2)} / mo`;
    }
    return `${priceInETB.toLocaleString()} ETB / mo`;
  };

  // Handle Subscription Initiate Payment
  const handleInitiatePayment = () => {
    if (selectedFeatures.length === 0) {
      toast.error(t('pleaseSelectAtLeastOne') || 'Please select at least one feature.');
      return;
    }
    const normalizedPhone = normalizeEthiopianPhone(
    phoneNumber || merchant?.phone
  );

  if (!normalizedPhone) {
    toast.error('Please enter a valid Ethiopian phone number');
    return;
  }

    initiateSubscription({
      features: selectedFeatures,
      durationMonths,
      phone: phoneNumber || merchant?.phone || undefined,
    });
  };

  // Handle Subscription Renewal
  const handleRenew = () => {
    renewSubscription(
      { durationMonths: renewMonths },
      {
        onSuccess: () => {
          setRenewDialogOpen(false);
        },
      }
    );
  };

  // Map Feature Key to Lucide Icon
  const getFeatureIcon = (key: FeatureKey) => {
    switch (key) {
      case 'orders':
        return <Receipt className="h-5 w-5 text-blue-600" />;
      case 'inventory':
        return <Zap className="h-5 w-5 text-amber-600" />;
      case 'multiBranch':
        return <Building2 className="h-5 w-5 text-purple-600" />;
      case 'telegram':
        return <Bot className="h-5 w-5 text-sky-600" />;
      case 'sales':
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case 'reports':
        return <BarChart3 className="h-5 w-5 text-indigo-600" />;
      case 'customerManagement':
        return <Users className="h-5 w-5 text-rose-600" />;
      case 'deliveryManagement':
        return <Truck className="h-5 w-5 text-orange-600" />;
      case 'paymentIntegration':
        return <ShieldCheck className="h-5 w-5 text-teal-600" />;
      case 'restaurantWebsite':
        return <Globe className="h-5 w-5 text-cyan-600" />;
      default:
        return <Check className="h-5 w-5 text-slate-600" />;
    }
  };

  if (isSubLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#3e4095]" />
        <p className="text-sm text-slate-500 font-medium">{t('loadingSubscription') || 'Loading subscription status...'}</p>
      </div>
    );
  }

  const totalETB = calculateTotalETB();

  return (
    <div className="container mx-auto space-y-8 py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t('billingAndSubscriptions') || 'Billing & Subscriptions'}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="h-8 w-8 text-slate-400 hover:text-slate-700"
              title={t('refreshStatus') || 'Refresh Status'}
            >
              <RefreshCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{t('headerSubtitle') || 'Manage feature modules, plan tier and payment status.'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Display Controls: Currency & Language Switchers */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-1">
              {t('displayCurrency') || 'Currency'}:
            </span>
            <button
              type="button"
              onClick={() => setDisplayCurrency('ETB')}
              className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                displayCurrency === 'ETB'
                  ? 'bg-white text-[#3e4095] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ETB
            </button>
            <button
              type="button"
              onClick={() => setDisplayCurrency('USD')}
              className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                displayCurrency === 'USD'
                  ? 'bg-white text-[#3e4095] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Globe2 className="h-3.5 w-3.5 text-slate-500 ml-1" />
            <button
              type="button"
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                i18n.language === 'en'
                  ? 'bg-white text-[#3e4095] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => i18n.changeLanguage('am')}
              className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                i18n.language === 'am'
                  ? 'bg-white text-[#3e4095] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              አማ
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subscription/billing')}
            className="text-slate-700"
          >
            <History className="mr-2 h-4 w-4 text-slate-500" />
            {t('billingHistory') || 'Billing History'}
          </Button>

          <Badge
            className={`px-4 py-1.5 text-xs font-semibold shadow-sm rounded-full ${
              isActive && isTrial
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isActive
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isPending
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isActive && isTrial
              ? (t('freeTrialActive', { days: daysRemaining ?? 30 }) || `Free Trial Active (${daysRemaining ?? 30} Days)`)
              : isActive
              ? (t('activeSubscription', { days: daysRemaining ?? 30 }) || `Active Subscription (${daysRemaining ?? 30} Days)`)
              : isPending
              ? (t('paymentPendingVerification') || 'Pending Verification')
              : (t('noActiveSubscription') || 'No Active Subscription')}
          </Badge>
        </div>
      </div>

      {/* Free Trial Banner */}
      {(!subscription || subscription.status === 'expired') && (
        <Card className="border-2 border-[#3e4095]/20 bg-gradient-to-r from-[#3e4095]/5 via-white to-amber-500/5 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#3e4095] font-bold text-sm">
                <Sparkles className="h-4 w-4 fill-current text-amber-500" />
                <span>{t('firstTimePromotion') || 'First Time Promotion'}</span>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {t('startFreeTrialTitle') || 'Start 30-Day Free Trial'}
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm max-w-2xl">
                {t('startFreeTrialDesc') || 'Get full access to all restaurant features free for 30 days.'}
              </CardDescription>
            </div>
            <Button
              size="lg"
              className="bg-[#3e4095] hover:bg-[#32347d] text-white font-semibold shadow-md shrink-0"
              onClick={() => startTrial()}
              disabled={startingTrial}
            >
              {startingTrial ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Crown className="mr-2 h-5 w-5 text-amber-400" />
              )}
              {t('activateFreeTrial') || 'Activate Free Trial'}
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Active Subscription Overview Card */}
      {isActive && (
        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardHeader className="pb-3 border-b border-emerald-100/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>{isTrial ? (t('freeTrialSub') || 'Free Trial Plan') : (t('paidMerchantSub') || 'Active Merchant Subscription')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">
                    {subscription?.endDate &&
                      (t('validUntil', {
                        date: new Date(subscription.endDate).toLocaleDateString(
                          i18n.language === 'am' ? 'am-ET' : 'en-US',
                          { dateStyle: 'medium' }
                        ),
                      }) || `Valid until ${new Date(subscription.endDate).toLocaleDateString()}`)}
                  </CardDescription>
                </div>
              </div>

              {/* Renewal Dialog Trigger */}
              <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3e4095] hover:bg-[#32347d] text-white font-medium">
                    <RotateCw className="mr-2 h-4 w-4" />
                    {t('renewSubscription') || 'Renew Subscription'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                      <RotateCw className="h-5 w-5 text-[#3e4095]" />
                      {t('renewTitle') || 'Renew Subscription'}
                    </DialogTitle>
                    <DialogDescription>{t('renewDesc') || 'Select renewal duration to extend subscription access.'}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-3">
                    <Label className="text-sm font-semibold">{t('selectDuration') || 'Select Duration'}</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRenewMonths(m)}
                          className={`p-3 rounded-xl border text-center transition-all text-sm font-medium ${
                            renewMonths === m
                              ? 'border-[#3e4095] bg-[#3e4095]/10 text-[#3e4095] font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {m === 1 ? '1 Month' : `${m} Months`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
                      {t('cancel') || 'Cancel'}
                    </Button>
                    <Button
                      className="bg-[#3e4095] hover:bg-[#32347d] text-white"
                      onClick={handleRenew}
                      disabled={renewing}
                    >
                      {renewing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        t('confirmRenewal') || 'Confirm Renewal'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('activeIncludedFeatures', { count: activeFeatures.length }) || `Active Modules (${activeFeatures.length})`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {activeFeatures.map((featKey) => {
                  const fallback = FEATURE_CATALOG[featKey as FeatureKey];
                  const catalogItem = (catalogData as any)?.[featKey as FeatureKey];
                  const featName = catalogItem?.name || fallback?.name || featKey;
                  const featCat = catalogItem?.category || fallback?.category || 'Feature';

                  return (
                    <div
                      key={featKey}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-200/60 shadow-2xs"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{featName}</p>
                        <p className="text-[10px] text-slate-500">{featCat}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Selector & Subscription Initiation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Feature Catalog Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('customFeatureBuilder') || 'Custom Feature Builder'}</h2>
              <p className="text-xs text-slate-500">{t('customFeatureBuilderDesc') || 'Select feature modules for your tailored subscription plan.'}</p>
            </div>

            {/* Quick Bundles */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1">{t('presets') || 'Presets:'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('starter')}
                className="text-xs h-7 px-2.5 rounded-lg hover:border-[#3e4095] hover:text-[#3e4095]"
              >
                {t('presetStarter') || 'Starter'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('growth')}
                className="text-xs h-7 px-2.5 rounded-lg hover:border-[#3e4095] hover:text-[#3e4095]"
              >
                {t('presetGrowth') || 'Growth'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('all')}
                className="text-xs h-7 px-2.5 rounded-lg text-[#3e4095] border-[#3e4095]/40 hover:bg-[#3e4095]/10"
              >
                {t('presetAll') || 'All Modules'}
              </Button>
            </div>
          </div>

          {/* Feature Catalog Grid */}
          {isCatalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FEATURE_KEYS.map((k) => (
                <div key={k} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full rounded" />
                  <div className="pt-2 flex justify-between">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FEATURE_KEYS.map((key) => {
                const catalogItem = (catalogData as any)?.[key];
                const fallbackItem = FEATURE_CATALOG[key];
                const itemETBPrice = getItemETBPrice(key);
                const isChecked = selectedFeatures.includes(key);

                const featName = catalogItem?.name || fallbackItem?.name || key;
                const featCat = catalogItem?.category || fallbackItem?.category || 'Feature';
                const featDesc = catalogItem?.description || fallbackItem?.description || '';

                return (
                  <div
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className={`p-4 rounded-xl border transition-all duration-200 space-y-2 flex flex-col justify-between cursor-pointer select-none ${
                      isChecked
                        ? 'border-[#3e4095] bg-[#3e4095]/5 shadow-2xs ring-1 ring-[#3e4095]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border shadow-2xs bg-white border-slate-200">
                          {getFeatureIcon(key)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {featName}
                          </h3>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mt-0.5">
                            {featCat}
                          </span>
                        </div>
                      </div>

                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleFeature(key)}
                        className="mt-1 data-[state=checked]:bg-[#3e4095]"
                      />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{featDesc}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">{key}</span>
                      <span className="font-bold text-[#3e4095]">
                        {formatDisplayPrice(itemETBPrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Summary & Duration */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-md sticky top-6">
            <CardHeader className="bg-slate-50/80 border-b pb-4">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
                <span>{t('orderSummary') || 'Order Summary'}</span>
                <Badge variant="outline" className="text-xs font-mono bg-white">
                  {selectedFeatures.length} {selectedFeatures.length === 1 ? 'Module' : 'Modules'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">{t('reviewFeatures') || 'Review selected features and billing duration.'}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
              {/* Selected Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedFeatures.map((key) => {
                  const itemPrice = getItemETBPrice(key);
                  const catalogItem = (catalogData as any)?.[key];
                  const fallbackItem = FEATURE_CATALOG[key];
                  const featName = catalogItem?.name || fallbackItem?.name || key;

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none"
                    >
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600" />
                        {featName}
                      </span>
                      <span className="text-slate-600 font-mono">
                        {displayCurrency === 'USD'
                          ? `$${(itemPrice / USD_TO_ETB_RATE).toFixed(2)}`
                          : `${itemPrice.toLocaleString()} ETB`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Duration Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {t('billingDuration') || 'Billing Duration'}
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { months: 1, label: t('oneMonth') || '1 Month', tag: null },
                    { months: 3, label: t('threeMonths') || '3 Months', tag: '5% OFF' },
                    { months: 6, label: t('sixMonths') || '6 Months', tag: '10% OFF' },
                    { months: 12, label: t('oneYear') || '1 Year', tag: '20% OFF' },
                  ].map((option) => (
                    <button
                      key={option.months}
                      type="button"
                      onClick={() => setDurationMonths(option.months)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all relative ${
                        durationMonths === option.months
                          ? 'border-[#3e4095] bg-[#3e4095]/10 font-bold text-[#3e4095]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.tag && (
                        <span className="absolute top-1 right-1 text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">
                          {option.tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  {t('paymentPhone') || 'Payment Mobile Phone'}
                </Label>
                <Input
                  type="text"
                  placeholder={t('phonePlaceholder') || '0912345678'}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Total Price Display Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{t('totalPayableAmount') || 'Total Amount'}</span>
                  <span>
                    {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-amber-400 font-mono">
                    {displayCurrency === 'USD'
                      ? `$${(totalETB / USD_TO_ETB_RATE).toFixed(2)}`
                      : totalETB.toLocaleString()}
                  </p>
                  <span className="text-xs font-semibold text-slate-300">
                    {displayCurrency}
                  </span>
                </div>

                {displayCurrency !== 'ETB' && (
                  <p className="text-[11px] text-amber-300/90 leading-tight pt-1 border-t border-slate-800">
                    Approx. {totalETB.toLocaleString()} ETB payable via payment gateway.
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/50 border-t pt-4">
              <Button
                className="w-full bg-[#3e4095] hover:bg-[#32347d] text-white font-bold h-11 shadow-sm"
                onClick={handleInitiatePayment}
                disabled={initiating || selectedFeatures.length === 0}
              >
                {initiating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {t('initiatePayment') || 'Initiate Payment'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

