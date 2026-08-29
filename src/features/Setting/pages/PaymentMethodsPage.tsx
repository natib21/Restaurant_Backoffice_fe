import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  QrCode,
  Sliders,
  Percent,
  Save,
  Loader2,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMyMerchantQuery, useUpdateMeMutation } from '@/api/Queries/merchantQueries';

interface PaymentMethodItem {
  id: string;
  name: string;
  subtitle: string;
  isDefault?: boolean;
  enabled: boolean;
  type: 'cash' | 'card' | 'mobile_money' | 'custom';
}

const DEFAULT_METHODS: PaymentMethodItem[] = [
  {
    id: 'cash',
    name: 'Cash',
    subtitle: 'Till limits apply • In-person cash drawer',
    isDefault: true,
    enabled: true,
    type: 'cash',
  },
  {
    id: 'card',
    name: 'Card / POS',
    subtitle: 'Visa, MC, Local • Integrated Terminal',
    enabled: true,
    type: 'card',
  },
  {
    id: 'telebirr',
    name: 'Telebirr SuperApp',
    subtitle: 'Instant QR Pay & Merchant Code',
    enabled: true,
    type: 'mobile_money',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    subtitle: 'Commercial Bank of Ethiopia Direct Transfer',
    enabled: true,
    type: 'mobile_money',
  },
  {
    id: 'mobile_money',
    name: 'General Mobile Wallet',
    subtitle: 'Manual verification required at checkout',
    enabled: false,
    type: 'mobile_money',
  },
];

export const PaymentMethodsPage: React.FC = () => {
  const { data: merchant, isLoading: isMerchantLoading } = useMyMerchantQuery();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMeMutation();

  const [methods, setMethods] = useState<PaymentMethodItem[]>(DEFAULT_METHODS);
  const [allowSplitPayments, setAllowSplitPayments] = useState(true);
  const [requirePaymentBeforePrep, setRequirePaymentBeforePrep] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState('10');
  const [enableTips, setEnableTips] = useState(true);

  // Add custom method modal
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');

  useEffect(() => {
    if (merchant?.settings?.paymentSettings) {
      const ps = merchant.settings.paymentSettings;
      if (Array.isArray(ps.methods) && ps.methods.length > 0) {
        setMethods(ps.methods);
      }
      if (typeof ps.allowSplitPayments === 'boolean') {
        setAllowSplitPayments(ps.allowSplitPayments);
      }
      if (typeof ps.requirePaymentBeforePrep === 'boolean') {
        setRequirePaymentBeforePrep(ps.requirePaymentBeforePrep);
      }
      if (ps.serviceChargeRate !== undefined) {
        setServiceChargeRate(String(ps.serviceChargeRate));
      }
      if (typeof ps.enableTips === 'boolean') {
        setEnableTips(ps.enableTips);
      }
    }
  }, [merchant]);

  const handleToggle = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleAddCustom = () => {
    if (!customName.trim()) {
      toast.error('Method name is required');
      return;
    }
    const newMethod: PaymentMethodItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      subtitle: customSubtitle.trim() || 'Custom settlement method',
      enabled: true,
      type: 'custom',
    };
    setMethods((prev) => [...prev, newMethod]);
    setIsAddCustomOpen(false);
    setCustomName('');
    setCustomSubtitle('');
    toast.success(`Custom method "${customName}" added`);
  };

  const handleSave = async () => {
    try {
      await updateMe({
        settings: {
          ...(merchant as any)?.settings,
          paymentSettings: {
            methods,
            allowSplitPayments,
            requirePaymentBeforePrep,
            serviceChargeRate: Number(serviceChargeRate) || 0,
            enableTips,
          },
        },
      } as any);
      toast.success('Payment configurations saved successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save payment settings');
    }
  };

  const getIconForType = (type: PaymentMethodItem['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-5 w-5 text-emerald-600" />;
      case 'card':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'mobile_money':
        return <Smartphone className="h-5 w-5 text-amber-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <SettingPageLayout
      title="Payment Methods & Policies"
      subtitle="Manage acceptable payment gateways, cash registers, split billing, and service charges."
      breadcrumbs={[{ label: 'Payment Methods' }]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddCustomOpen(true)}
            className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 h-9 px-3.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Method
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      }
    >
      {isMerchantLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Loading payment settings...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Payment Methods (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Active Payment Methods ({methods.filter((m) => m.enabled).length} Enabled)
              </h3>

              <div className="space-y-3">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-2xs">
                        {getIconForType(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {method.name}
                          </span>
                          {method.isDefault && (
                            <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {method.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(method.id)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          method.enabled ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                            method.enabled ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Payment Rules (1/3) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sliders className="h-4 w-4 text-[#0058be]" />
                Settlement Rules
              </h3>

              {/* Split Payment Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                    Allow Split Payments
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Permit guests to divide bills across multiple methods (e.g. Cash + Card).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowSplitPayments(!allowSplitPayments)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    allowSplitPayments ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      allowSplitPayments ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Require Payment Before Prep */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                    Require Pre-Payment
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Hold orders in pending state until cashier marks them as settled.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequirePaymentBeforePrep(!requirePaymentBeforePrep)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    requirePaymentBeforePrep ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      requirePaymentBeforePrep ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Service Charge & Tips */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Charge (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={serviceChargeRate}
                      onChange={(e) => setServiceChargeRate(e.target.value)}
                      className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none focus:border-[#2170E4]"
                    />
                    <Percent className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Prompt for Tips on Checkout
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableTips(!enableTips)}
                    className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                      enableTips ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-xs ${
                        enableTips ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Method Modal */}
      <Dialog open={isAddCustomOpen} onOpenChange={setIsAddCustomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Custom Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-semibold mb-1">Method Name</label>
              <input
                type="text"
                placeholder="e.g. Corporate Voucher, Gift Card"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Description / Subtitle</label>
              <input
                type="text"
                placeholder="e.g. Internal company house account"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsAddCustomOpen(false)}
              className="px-3 py-1.5 border rounded text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustom}
              className="px-4 py-1.5 bg-[#2170E4] hover:bg-blue-700 text-white rounded text-xs font-semibold"
            >
              Add Method
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingPageLayout>
  );
};

export default PaymentMethodsPage;
