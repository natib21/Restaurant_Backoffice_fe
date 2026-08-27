import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Store,
  Palette,
  MapPin,
  Sliders,
  SendHorizontal,
  Users,
  CreditCard,
  CheckCircle2,
  Save,
  ArrowRight,
  ShieldCheck,
  Building2,
  Printer,
  Percent,
  Layers,
  GitFork,
} from 'lucide-react';

import { useMyMerchantQuery, useUpdateMeMutation } from '@/api/Queries/merchantQueries';
import { useFeatureAccess } from '@/features/Subscription/hooks/useFeatureAccess';
import { FeatureGate } from '@/features/Subscription/components/FeatureGate';
import { KdsStationManagement } from '@/features/KDS/components/KdsStationManagement';
import OrderFlowConfigPage from '@/features/Order/pages/OrderFlowConfigPage';

import { ProfileSection } from '../Components/ProfileSection';
import { BrandingSection } from '../Components/BrandingSection';
import { OrderingSection } from '../Components/OrderingSection';
import { QrSection } from '../Components/QrSection';
import { TelegramSettingsPage } from './TelegramSettingsPage';
import { PaymentMethodsSection } from '../Components/PaymentMethodsSection';
import { PrintersSection } from '../Components/PrintersSection';
import { TaxAndChargesSection } from '../Components/TaxAndChargesSection';
import {
  formSchema,
  type SettingsFormValues,
  defaultValues,
} from '../lib/settingsSchema';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      prev.set('tab', tab);
      return prev;
    });
  };

  const { data: merchant, isLoading: isFetching, refetch } = useMyMerchantQuery();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMeMutation();
  const { hasAccess: hasTelegramFeature } = useFeatureAccess('telegram');

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (merchant) {
      const s = (merchant as any).settings || {};
      form.reset({
        ...defaultValues,
        businessName: merchant.businessName || '',
        slug: merchant.slug || '',
        sector: (merchant as any).sector || 'Restaurant',
        cuisineType: Array.isArray((merchant as any).cuisineType)
          ? (merchant as any).cuisineType.join(', ')
          : (merchant as any).cuisineType || '',
        brandColor: (merchant as any).brandColor || '#1A1A2E',
        phone: merchant.phone || merchant.owner?.phone || '',
        owner: {
          fullName: merchant.owner?.fullName || '',
          gender: merchant.owner?.gender || 'Male',
          phone: merchant.owner?.phone || '',
          email: merchant.owner?.email || '',
        },
        location: {
          address: merchant.location?.address || '',
          city: merchant.location?.city || 'Addis Ababa',
          subcity: merchant.location?.subcity || '',
        },
        tinId: merchant.tinId || '',
        licenseNumber: (merchant as any)?.licenseNumber || merchant.tradeLicense?.licenseNumber || '',
        tradeLicense: merchant.tradeLicense?.url ? { url: merchant.tradeLicense.url } : null,
        logo: merchant.logo ? { url: merchant.logo } : null,
        coverImage: merchant.coverImage ? { url: merchant.coverImage } : null,
        currency: s.currency || 'ETB',
        taxRate: s.taxRate ?? 15,
        serviceCharge: s.serviceCharge ?? 0,
        tipsEnabled: s.tipsEnabled ?? true,
        tipOptions: s.tipOptions || [10, 15, 20],
        language: s.language || 'both',
        defaultLanguage: s.defaultLanguage || 'en',
        onlineOrderingEnabled: s.onlineOrderingEnabled ?? true,
        deliveryEnabled: s.deliveryEnabled ?? false,
        pickupEnabled: s.pickupEnabled ?? true,
        autoAcceptOrders: s.autoAcceptOrders ?? false,
        requireWaiterConfirmation: s.requireWaiterConfirmation ?? false,
        prepTimeMinutes: s.prepTimeMinutes ?? 15,
        showTableNumberOnQR: s.showTableNumberOnQR ?? true,
        qrStyle: s.qrStyle || 'modern',
        qrLogoEnabled: s.qrLogoEnabled ?? true,
      });
    }
  }, [merchant, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      // Step 1: Clean JSON payload for non-file text/nested settings
      const jsonPayload = {
        businessName: data.businessName,
        owner: {
          fullName: data.owner.fullName,
          gender: data.owner.gender,
          email: data.owner.email,
          phone: data.owner.phone,
        },
        sector: data.sector,
        phone: data.phone || data.owner.phone,
        cuisineType: typeof data.cuisineType === 'string' && data.cuisineType
          ? data.cuisineType.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        brandColor: data.brandColor || '#1A1A2E',
        location: {
          address: data.location.address,
          city: data.location.city,
          subcity: data.location.subcity || '',
        },
        tinId: data.tinId || '',
        settings: {
          currency: data.currency || 'ETB',
          taxRate: Number(data.taxRate || 0),
          serviceCharge: Number(data.serviceCharge || 0),
          tipsEnabled: Boolean(data.tipsEnabled),
          tipOptions: data.tipOptions || [10, 15, 20],
          language: data.language || 'both',
          defaultLanguage: data.defaultLanguage || 'en',
          onlineOrderingEnabled: Boolean(data.onlineOrderingEnabled),
          deliveryEnabled: Boolean(data.deliveryEnabled),
          pickupEnabled: Boolean(data.pickupEnabled),
          autoAcceptOrders: Boolean(data.autoAcceptOrders),
          requireWaiterConfirmation: Boolean(data.requireWaiterConfirmation),
          prepTimeMinutes: Number(data.prepTimeMinutes || 15),
          showTableNumberOnQR: Boolean(data.showTableNumberOnQR),
          qrStyle: data.qrStyle || 'modern',
          qrLogoEnabled: Boolean(data.qrLogoEnabled),
        },
      };

      await updateMe(jsonPayload);

      // Step 2: Multipart update for files if any new files were attached
      const hasLogoFile = Boolean(data.logo && data.logo.file instanceof File);
      const hasCoverFile = Boolean(data.coverImage && data.coverImage.file instanceof File);
      const hasLicenseFile = Boolean(data.tradeLicense && data.tradeLicense.file instanceof File);

      if (hasLogoFile || hasCoverFile || hasLicenseFile) {
        const formData = new FormData();
        if (hasLogoFile && data.logo) formData.append('logo', data.logo.file);
        if (hasCoverFile && data.coverImage) formData.append('coverImage', data.coverImage.file);
        if (hasLicenseFile && data.tradeLicense) {
          formData.append('documents', data.tradeLicense.file);
          formData.append('documentTypes[0]', 'trade_license');
        }

        await updateMe(formData);
      }

      toast.success('Merchant settings updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update merchant settings');
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#3e4095]" />
        <p className="text-sm font-medium text-slate-500">Loading merchant configuration...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">General Settings</h1>
            <Badge variant="outline" className="text-xs font-mono bg-slate-50">
              {merchant?.slug || 'merchant'}
            </Badge>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Manage profile, store ordering preferences, branding, team members, and subscription.
          </p>
        </div>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="bg-[#3e4095] hover:bg-[#32347d] text-white min-w-[140px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1 h-auto border border-slate-200">
          <TabsTrigger value="profile" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Store className="h-3.5 w-3.5 text-[#3e4095]" /> Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Sliders className="h-3.5 w-3.5 text-[#3e4095]" /> Store Preferences
          </TabsTrigger>
          <TabsTrigger value="order-flow" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <GitFork className="h-3.5 w-3.5 text-primary" /> Order Flow Routing
          </TabsTrigger>
          <TabsTrigger value="taxes" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Percent className="h-3.5 w-3.5 text-amber-600" /> Taxes & Charges
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Payment Methods
          </TabsTrigger>
          <TabsTrigger value="printers" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Printer className="h-3.5 w-3.5 text-indigo-600" /> Printers & KOT
          </TabsTrigger>
          <TabsTrigger value="stations" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Layers className="h-3.5 w-3.5 text-blue-600" /> Kitchen Stations
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Palette className="h-3.5 w-3.5 text-[#3e4095]" /> Branding & KYC
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <SendHorizontal className="h-3.5 w-3.5 text-sky-500" /> Telegram Integration
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <Users className="h-3.5 w-3.5 text-indigo-500" /> Team & Roles
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Billing
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Tab 1: Profile & Location */}
            <TabsContent value="profile" className="space-y-6">
              <ProfileSection form={form} />
            </TabsContent>

            {/* Tab 2: Store Preferences (Ordering, Rates, QR & Tipping) */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="border-slate-200 shadow-2xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-[#3e4095]" /> Store Ordering & Rates
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure ordering channels, preparation time, and QR tipping rules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <OrderingSection form={form} />
                  <div className="border-t pt-6">
                    <QrSection form={form} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Taxes & VAT */}
            <TabsContent value="taxes" className="space-y-6">
              <TaxAndChargesSection form={form} />
            </TabsContent>

            {/* Tab 4: Branding & KYC */}
            <TabsContent value="branding" className="space-y-6">
              <Card className="border-slate-200 shadow-2xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[#3e4095]" /> Branding & Official Verification
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Upload merchant logo, cover banner, brand accent color, and trade license documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BrandingSection form={form} />
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>

        {/* Order Flow Routing Tab */}
        <TabsContent value="order-flow" className="space-y-6">
          <OrderFlowConfigPage />
        </TabsContent>

        {/* Tab 5: Payment Methods */}
        <TabsContent value="payments" className="space-y-6">
          <PaymentMethodsSection />
        </TabsContent>

        {/* Tab 6: Printers & Hardware */}
        <TabsContent value="printers" className="space-y-6">
          <PrintersSection />
        </TabsContent>

        {/* Tab 7: Kitchen Stations Management */}
        <TabsContent value="stations" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <KdsStationManagement
              darkMode={false}
              onSelectStationForLiveView={(stId) => navigate(`/kds/${stId}`)}
            />
          </div>
        </TabsContent>

        {/* Tab 8: Telegram Integration */}
        <TabsContent value="telegram" className="space-y-6">
          {hasTelegramFeature ? (
            <TelegramSettingsPage />
          ) : (
            <FeatureGate feature="telegram" mode="fullscreen">
              <TelegramSettingsPage />
            </FeatureGate>
          )}
        </TabsContent>

        {/* Tab 5: Team & Roles */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-2xs hover:border-[#3e4095]/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-[#3e4095]" />
                  <Badge variant="secondary">Staff Management</Badge>
                </div>
                <CardTitle className="text-lg font-bold mt-2">Team Members</CardTitle>
                <CardDescription className="text-xs">
                  Create waiters, cashiers, kitchen staff, and assign branch access.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={() => navigate('/users/staff')}
                  className="w-full bg-[#3e4095] hover:bg-[#32347d]"
                >
                  Manage Staff Members <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs hover:border-[#3e4095]/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <ShieldCheck className="h-8 w-8 text-indigo-600" />
                  <Badge variant="secondary">Access Controls</Badge>
                </div>
                <CardTitle className="text-lg font-bold mt-2">Roles & Permissions</CardTitle>
                <CardDescription className="text-xs">
                  Configure custom staff roles, task permissions, and system access constraints.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={() => navigate('/users/roles')}
                  variant="outline"
                  className="w-full border-[#3e4095] text-[#3e4095] hover:bg-[#3e4095]/5"
                >
                  Manage Roles & Tasks <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: Billing & Subscription */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" /> Subscription & Module Entitlements
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Manage feature subscriptions, renew plan duration, or unlock optional modules.
                  </CardDescription>
                </div>
                <Badge className="capitalize bg-emerald-600">
                  {merchant?.subscriptionPlan || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-500">Business Name</p>
                  <p className="font-bold text-slate-900 mt-0.5">{merchant?.businessName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Trial Days Remaining</p>
                  <p className="font-bold text-amber-600 mt-0.5">{merchant?.trialDaysLeft ?? 'N/A'} Days</p>
                </div>
                <div>
                  <p className="text-slate-500">Active Access</p>
                  <p className="font-bold text-emerald-600 mt-0.5">
                    {merchant?.hasActiveAccess !== false ? 'Active' : 'Expired'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Current Plan</p>
                  <p className="font-bold text-slate-900 capitalize mt-0.5">{merchant?.subscriptionPlan || 'Custom'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate('/subscription/plan')}
                  className="bg-[#3e4095] hover:bg-[#32347d]"
                >
                  Manage Subscription & Features
                </Button>
                <Button
                  onClick={() => navigate('/subscription/billing')}
                  variant="outline"
                >
                  View Invoices & Billing Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
