import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  SendHorizontal,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Utensils,
  Package,
  BarChart3,
  WifiOff,
  ExternalLink,
  HelpCircle,
  Loader2,
  Users,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import {
  useTelegramStatusQuery,
  useTelegramConversationsQuery,
  useConnectTelegramBotMutation,
  useUpdateTelegramSettingsMutation,
  useDisconnectTelegramBotMutation,
} from '@/api/Queries/telegramQueries';

export const TelegramSettingsPage: React.FC = () => {
  const { data: merchantProfile } = useMyMerchantQuery();
  const merchantId = merchantProfile?._id;

  const {
    data: status,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useTelegramStatusQuery(merchantId);

  const { data: conversations = [], isLoading: isConversationsLoading } =
    useTelegramConversationsQuery(merchantId);

  const { mutate: connectBot, isPending: isConnecting } =
    useConnectTelegramBotMutation(merchantId);

  const { mutate: updateSettings, isPending: isUpdatingSettings } =
    useUpdateTelegramSettingsMutation(merchantId);

  const { mutate: disconnectBot, isPending: isDisconnecting } =
    useDisconnectTelegramBotMutation(merchantId);

  // Connection token / PIN input state
  const [tokenInput, setTokenInput] = useState('');

  // Notification toggles state - initialized from real API
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [orderReadyAlerts, setOrderReadyAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySalesAlerts, setDailySalesAlerts] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(false);

  // Sync settings with API when loaded
  useEffect(() => {
    if (status?.settings) {
      setNewOrderAlerts(Boolean(status.settings.notificationsEnabled));
      setOrderReadyAlerts(Boolean(status.settings.deliveryEnabled));
      setDailySalesAlerts(Boolean(status.settings.marketingEnabled));
    }
  }, [status?.settings]);

  const isConnected = Boolean(status?.connected);
  const botUsername = status?.botUsername
    ? status.botUsername.startsWith('@')
      ? status.botUsername
      : `@${status.botUsername}`
    : undefined;

  const handleConnectBot = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed || trimmed.length < 4) {
      toast.error('Please enter a valid Telegram Bot Token (from @BotFather) or connection PIN');
      return;
    }

    connectBot(
      { botToken: trimmed },
      {
        onSuccess: () => {
          toast.success('Telegram bot successfully connected!');
          setTokenInput('');
          refetchStatus();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Verification failed. Please check your bot token.');
        },
      }
    );
  };

  const handleDisconnect = () => {
    if (!confirm('Are you sure you want to disconnect your Telegram bot? Alert notifications will cease.')) {
      return;
    }

    disconnectBot(undefined, {
      onSuccess: () => {
        toast.info('Telegram bot disconnected');
        refetchStatus();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to disconnect bot');
      },
    });
  };

  const handleSavePreferences = () => {
    updateSettings(
      {
        notificationsEnabled: newOrderAlerts,
        deliveryEnabled: orderReadyAlerts,
        marketingEnabled: dailySalesAlerts,
      },
      {
        onSuccess: () => {
          toast.success('Notification preferences updated');
          refetchStatus();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to save preferences');
        },
      }
    );
  };

  const formattedConnectedDate = status?.connectedAt
    ? new Date(status.connectedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : isConnected
    ? 'Active'
    : '—';

  return (
    <SettingPageLayout
      title="Telegram Integration"
      subtitle="Connect your restaurant management system to Telegram for real-time order notifications, low stock alerts, and daily sales summaries directly to your team's devices."
      breadcrumbs={[{ label: 'Telegram Integration' }]}
      actions={
        <button
          type="button"
          onClick={handleSavePreferences}
          disabled={isUpdatingSettings}
          className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          {isUpdatingSettings ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>Save Preferences</>
          )}
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bot Status & Notification Preferences (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bot Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shadow-xs">
                  <SendHorizontal className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Telegram Bot Status
                    </h3>
                    {isStatusLoading ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                      </span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-3 w-3 text-amber-600" /> Disconnected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-medium">
                      {botUsername || (isConnected ? 'Telegram Bot Connected' : 'No bot connected')}
                    </p>
                    {botUsername && (
                      <a
                        href={`https://t.me/${botUsername.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-blue-600 inline-flex items-center gap-0.5 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {isConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect Bot'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('tokenInput')?.focus();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2170E4] text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-xs"
                  >
                    Connect Bot
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Bento Row - Connected to API Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              <div className="bg-[#F8F9FF] dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Connected Date
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {formattedConnectedDate}
                </span>
              </div>

              <div className="bg-[#F8F9FF] dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Linked Customers
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono">
                  {status?.linkedCustomersCount ?? 0}
                </span>
              </div>

              <div className="bg-[#F8F9FF] dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Conversations
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono">
                  {conversations.length}
                </span>
              </div>
            </div>
          </div>

          {/* Notification Preferences Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 mb-1">
              Notification Preferences
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Choose which restaurant events trigger instant Telegram alerts via webhook synchronization.
            </p>

            <div className="space-y-4">
              {/* New Order Alerts */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      New Order Alerts
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Notify staff when a new dine-in, takeaway, or web order is placed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewOrderAlerts(!newOrderAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    newOrderAlerts ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      newOrderAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Order Ready (KDS) */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Order Ready (KDS Dispatch)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Alert waitstaff channels when kitchen marks tickets as ready for dispatch.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderReadyAlerts(!orderReadyAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    orderReadyAlerts ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      orderReadyAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Low Stock Warnings */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Low Stock Warnings
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Instant ping when an inventory ingredient falls below minimum stock.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLowStockAlerts(!lowStockAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    lowStockAlerts ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      lowStockAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Daily Sales Summary / Marketing */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Daily Sales & Marketing Broadcasts
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Automated end-of-day revenue reports and promotional broadcasts to opt-in subscribers ({status?.optInCount ?? 0} active).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDailySalesAlerts(!dailySalesAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    dailySalesAlerts ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      dailySalesAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* System Alerts */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                    <WifiOff className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      System & Hardware Alerts
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Printer offline notifications, network interruptions, or error logs.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSystemAlerts(!systemAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    systemAlerts ? 'bg-[#2170E4]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      systemAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Live Telegram Conversations Card (from API) */}
          {isConnected && conversations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#2170E4]" />
                  <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100">
                    Recent Customer Conversations ({conversations.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Live synced</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {conversations.slice(0, 4).map((conv) => (
                  <div key={conv.customer._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {conv.customer.fullName || conv.customer.phone || 'Telegram User'}
                        {conv.customer.telegram?.username && (
                          <span className="ml-1.5 font-normal text-slate-400 font-mono text-[11px]">
                            @{conv.customer.telegram.username}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.text || 'No recent messages'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {conv.lastMessage?.createdAt
                          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Setup Guide & Help (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Setup Guide Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#0058be]" />
              Bot Setup Guide
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect a dedicated Telegram bot to receive kitchen orders, alerts, and dispatch updates.
            </p>

            <ol className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Open Telegram and message{' '}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-bold"
                  >
                    @BotFather
                  </a>{' '}
                  to create a new bot or copy the token of an existing bot.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Send <strong className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/newbot</strong> and follow instructions to name your bot.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Copy the HTTP API access token provided by @BotFather.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div className="flex-1 min-w-0">
                  <span>Enter Bot API Token or Connection PIN:</span>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="tokenInput"
                      type="text"
                      placeholder="e.g. 123456789:ABCdefGHI..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-[#F8F9FF] dark:bg-slate-950 font-mono text-xs w-full outline-none focus:border-[#2170E4]"
                    />
                    <button
                      type="button"
                      onClick={handleConnectBot}
                      disabled={isConnecting}
                      className="px-3 h-8 bg-[#2170E4] text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0 flex items-center gap-1"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Verifying
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <span>
                  Add your bot as an Administrator to your kitchen team's Telegram group.
                </span>
              </li>
            </ol>

            {status?.deepLink && (
              <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={status.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-8 rounded-lg bg-[#2170E4] hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  Open Connected Bot Link
                </a>
              </div>
            )}
          </div>

          {/* Need Help Card */}
          <div className="bg-[#F8F9FF] dark:bg-slate-950 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-5 shadow-2xs">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
              <HelpCircle className="h-4 w-4 text-[#0058be]" />
              Telegram Bot API Documentation
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Learn how to configure bot webhooks, privacy mode, and inline commands for your restaurant.
            </p>
            <a
              href="https://core.telegram.org/bots"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#0058be] hover:underline inline-flex items-center gap-1"
            >
              View Official Telegram Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </SettingPageLayout>
  );
};

export default TelegramSettingsPage;
