import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  GitFork,
  Utensils,
  Globe,
  ShieldCheck,
  Send,
  Save,
  Loader2,
  Tv,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import {
  useOrderFlowConfigQuery,
  useUpdateOrderFlowConfigMutation,
  type ReviewerRole,
} from '@/api/Queries/orderFlowQueries';
import { useKitchenStationsQuery } from '@/api/Queries/kitchenQueries';
import { useMyMerchantQuery, useUpdateMeMutation } from '@/api/Queries/merchantQueries';

export const OrderFlowSettingsPage: React.FC = () => {
  const { data: flowConfig, isLoading: isFlowLoading } = useOrderFlowConfigQuery();
  const { mutateAsync: updateFlowConfig, isPending: isUpdatingFlow } = useUpdateOrderFlowConfigMutation();
  const { data: stations = [] } = useKitchenStationsQuery();
  const { data: merchant } = useMyMerchantQuery();
  const { mutateAsync: updateMe, isPending: isUpdatingMerchant } = useUpdateMeMutation();

  // Channel review requirements
  const [waiterReview, setWaiterReview] = useState(false);
  const [waiterRole, setWaiterRole] = useState<ReviewerRole>('waiter');

  const [webReview, setWebReview] = useState(true);
  const [webRole, setWebRole] = useState<ReviewerRole>('waiter');

  const [adminReview, setAdminReview] = useState(true);
  const [adminRole, setAdminRole] = useState<ReviewerRole>('support');

  const [telegramReview, setTelegramReview] = useState(true);
  const [telegramRole, setTelegramRole] = useState<ReviewerRole>('support');

  // Order types
  const [dineInEnabled, setDineInEnabled] = useState(true);
  const [takeawayEnabled, setTakeawayEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);

  useEffect(() => {
    if (flowConfig?.channels) {
      setWaiterReview(Boolean(flowConfig.channels.waiter?.requiresReview));
      setWaiterRole(flowConfig.channels.waiter?.reviewerRole ?? 'waiter');

      setWebReview(Boolean(flowConfig.channels.web?.requiresReview));
      setWebRole(flowConfig.channels.web?.reviewerRole ?? 'waiter');

      setAdminReview(Boolean(flowConfig.channels.admin?.requiresReview));
      setAdminRole(flowConfig.channels.admin?.reviewerRole ?? 'support');

      setTelegramReview(Boolean(flowConfig.channels.telegram?.requiresReview));
      setTelegramRole(flowConfig.channels.telegram?.reviewerRole ?? 'support');
    }
  }, [flowConfig]);

  const handleSaveAll = async () => {
    try {
      // 1. Update order flow channels configuration
      await updateFlowConfig({
        channels: {
          waiter: { requiresReview: waiterReview, reviewerRole: waiterRole },
          web: { requiresReview: webReview, reviewerRole: webRole },
          admin: { requiresReview: adminReview, reviewerRole: adminRole },
          telegram: { requiresReview: telegramReview, reviewerRole: telegramRole },
        },
      });

      // 2. Persist order types to merchant settings
      await updateMe({
        settings: {
          ...(merchant as any)?.settings,
          orderTypes: {
            dineIn: dineInEnabled,
            takeaway: takeawayEnabled,
            delivery: deliveryEnabled,
          },
        },
      } as any);

      toast.success('Order flow configuration saved successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update order flow config');
    }
  };

  return (
    <SettingPageLayout
      title="Order Flow & Routing"
      subtitle="Define review pipelines, approval gates, and channel fulfillment routing."
      breadcrumbs={[{ label: 'Order Flow' }]}
      actions={
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isUpdatingFlow || isUpdatingMerchant}
          className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          {isUpdatingFlow || isUpdatingMerchant ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      }
    >
      {isFlowLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Loading order flow settings...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel Approval Gates */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-[#0058be]" />
                  Channel Approval Gates
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Specify whether incoming orders from each sales channel require staff review before being dispatched to the kitchen.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Waiter App Channel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Waiter POS App
                      </h4>
                      <p className="text-[11px] text-slate-500">Orders placed by on-floor servers</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiterReview}
                      onChange={(e) => setWaiterReview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0058be]"></div>
                  </label>
                </div>

                {waiterReview && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Reviewer Role:</span>
                    <select
                      value={waiterRole || 'waiter'}
                      onChange={(e) => setWaiterRole((e.target.value as ReviewerRole) || null)}
                      className="h-7 px-2 border rounded bg-white dark:bg-slate-900 text-xs outline-none"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Web Ordering Channel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Online / QR Web Menu
                      </h4>
                      <p className="text-[11px] text-slate-500">Customer self-orders via digital menu</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webReview}
                      onChange={(e) => setWebReview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0058be]"></div>
                  </label>
                </div>

                {webReview && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Reviewer Role:</span>
                    <select
                      value={webRole || 'waiter'}
                      onChange={(e) => setWebRole((e.target.value as ReviewerRole) || null)}
                      className="h-7 px-2 border rounded bg-white dark:bg-slate-900 text-xs outline-none"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Admin Portal Channel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Admin Dashboard POS
                      </h4>
                      <p className="text-[11px] text-slate-500">Direct register and counter entries</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminReview}
                      onChange={(e) => setAdminReview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0058be]"></div>
                  </label>
                </div>

                {adminReview && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Reviewer Role:</span>
                    <select
                      value={adminRole || 'support'}
                      onChange={(e) => setAdminRole((e.target.value as ReviewerRole) || null)}
                      className="h-7 px-2 border rounded bg-white dark:bg-slate-900 text-xs outline-none"
                    >
                      <option value="support">Support</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Telegram Channel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-300">
                      <Send className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Telegram Bot Store
                      </h4>
                      <p className="text-[11px] text-slate-500">Orders from Telegram Mini App bot</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramReview}
                      onChange={(e) => setTelegramReview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0058be]"></div>
                  </label>
                </div>

                {telegramReview && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Reviewer Role:</span>
                    <select
                      value={telegramRole || 'support'}
                      onChange={(e) => setTelegramRole((e.target.value as ReviewerRole) || null)}
                      className="h-7 px-2 border rounded bg-white dark:bg-slate-900 text-xs outline-none"
                    >
                      <option value="support">Support</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kitchen Routing & Order Types */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <Tv className="h-4 w-4 text-[#0058be]" />
              Fulfillment Routing Stations ({stations.length} Active)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Accepted orders are automatically routed to these physical kitchen stations based on category mappings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {stations.length === 0 ? (
                <div className="col-span-full text-center py-6 text-slate-400 text-xs">
                  No kitchen stations configured yet. Add stations in Kitchen Stations settings.
                </div>
              ) : (
                stations.map((st) => (
                  <div
                    key={st._id || st.stationId}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: st.color || '#2170E4' }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {typeof st.name === 'object' ? ((st.name as any)?.en || (st.name as any)?.am || 'Station') : (st.name || 'Station')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                      {st.code}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </SettingPageLayout>
  );
};

export default OrderFlowSettingsPage;
