import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useOrderFlowConfigQuery,
  useUpdateOrderFlowConfigMutation,
  type ChannelName,
  type ChannelConfig,
  type ReviewerRole,
  type OrderFlowConfig,
  DEFAULT_ORDER_FLOW_CONFIG,
} from '@/api/Queries/orderFlowQueries';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitFork,
  Smartphone,
  Globe,
  Headphones,
  SendHorizontal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Save,
  RotateCcw,
  Loader2,
  Info,
  Clock,
  ChefHat,
  Users,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChannelMeta {
  id: ChannelName;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  exampleUse: string;
}

const CHANNELS: ChannelMeta[] = [
  {
    id: 'web',
    title: 'Customer Web & QR Ordering',
    subtitle: 'Self-service table QR code scans & online store',
    icon: Globe,
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    badgeText: 'Self-Service QR',
    description:
      'Orders submitted by customers scanning table QR codes or ordering via your digital menu webpage.',
    exampleUse:
      'Recommended: Review by Waiter before sending tickets to kitchen to prevent accidental/fake orders.',
  },
  {
    id: 'qr',
    title: 'QR Customer Orders',
    subtitle: 'Dedicated QR table ordering flow',
    icon: Smartphone,
    colorClass: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    badgeText: 'QR Orders',
    description:
      'Orders placed by customers scanning QR code at the table. This is the customer-facing mobile/table ordering path.',
    exampleUse:
      'Recommended: Require waiter review for table orders to prevent accidental or fake payment-free orders.',
  },
  {
    id: 'telegram',
    title: 'Telegram Mini-App & Bot',
    subtitle: 'Conversational & in-app chat orders',
    icon: SendHorizontal,
    colorClass: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    badgeText: 'Telegram Bot',
    description:
      'Orders placed through the Telegram food bot and chat channels.',
    exampleUse:
      'Recommended: Review by Support or Waiter to verify address and customer contact.',
  },
  {
    id: 'admin',
    title: 'Admin & Call Center Portal',
    subtitle: 'Back-office & telephone order entry',
    icon: Headphones,
    colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    badgeText: 'Call-in & Admin',
    description:
      'Orders recorded by managers, telephone support, or catering dispatch personnel.',
    exampleUse:
      'Can be reviewed by Support or sent immediately to kitchen.',
  },
  {
    id: 'waiter',
    title: 'Waiter POS Terminal',
    subtitle: 'In-person waitstaff device entries',
    icon: Smartphone,
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    badgeText: 'In-House POS',
    description:
      'Orders taken directly at the table or counter by your staff using merchant POS handhelds.',
    exampleUse:
      'Usually direct to kitchen since staff already confirmed the customer order in person.',
  },
];

export const OrderFlowConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: config, isLoading, isError, refetch } = useOrderFlowConfigQuery();
  const { mutateAsync: updateConfig, isPending: isSaving } = useUpdateOrderFlowConfigMutation();

  const [channelsState, setChannelsState] = useState<OrderFlowConfig['channels']>(
    DEFAULT_ORDER_FLOW_CONFIG.channels
  );

  // Sync state when config loads
  useEffect(() => {
    if (config?.channels) {
      setChannelsState(config.channels);
    }
  }, [config]);

  const handleToggleReview = (channel: ChannelName, enabled: boolean) => {
    setChannelsState((prev) => {
      const current = prev[channel] || { requiresReview: false, reviewerRole: null };
      const newRole: ReviewerRole = enabled
        ? current.reviewerRole || (channel === 'web' || channel === 'waiter' ? 'waiter' : 'support')
        : null;

      return {
        ...prev,
        [channel]: {
          requiresReview: enabled,
          reviewerRole: newRole,
        },
      };
    });
  };

  const handleRoleChange = (channel: ChannelName, role: 'waiter' | 'support') => {
    setChannelsState((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        requiresReview: true,
        reviewerRole: role,
      },
    }));
  };

  // Presets
const applyPreset = (preset: 'standard' | 'automated' | 'strict') => {
  if (preset === 'standard') {
    setChannelsState({
      waiter: { requiresReview: false, reviewerRole: null },
      web: { requiresReview: true, reviewerRole: 'waiter' },
      qr: { requiresReview: true, reviewerRole: 'waiter' },
      admin: { requiresReview: true, reviewerRole: 'support' },
      telegram: { requiresReview: true, reviewerRole: 'support' },
    });
    toast.info('Applied "Standard Balanced" flow preset');
  } else if (preset === 'automated') {
    setChannelsState({
      waiter: { requiresReview: false, reviewerRole: null },
      web: { requiresReview: false, reviewerRole: null },
      qr: { requiresReview: false, reviewerRole: null },
      admin: { requiresReview: false, reviewerRole: null },
      telegram: { requiresReview: false, reviewerRole: null },
    });
    toast.info('Applied "100% Kitchen Direct" automation preset');
  } else if (preset === 'strict') {
    setChannelsState({
      waiter: { requiresReview: true, reviewerRole: 'waiter' },
      web: { requiresReview: true, reviewerRole: 'waiter' },
      qr: { requiresReview: true, reviewerRole: 'waiter' },
      admin: { requiresReview: true, reviewerRole: 'support' },
      telegram: { requiresReview: true, reviewerRole: 'support' },
    });
    toast.info('Applied "Strict Manual Verification" preset');
  }
};

  // Validation
  const validationError = useMemo(() => {
    for (const [ch, cfg] of Object.entries(channelsState)) {
      if (cfg.requiresReview && !cfg.reviewerRole) {
        return `Channel "${ch}" is set to require review, but has no reviewer role assigned.`;
      }
    }
    return null;
  }, [channelsState]);

  const hasUnsavedChanges = useMemo(() => {
    if (!config?.channels) return false;
    return JSON.stringify(channelsState) !== JSON.stringify(config.channels);
  }, [channelsState, config]);

  const handleSave = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await updateConfig({
        channels: channelsState,
      });
    } catch (err) {
      // Toast handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          Loading Order Flow Configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Order Flow & Routing Engine
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose how orders from each incoming channel are routed to your kitchen and service team.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders/review-queue')}
            className="text-xs h-9 gap-1.5 font-medium"
          >
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Open Review Queue
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || (!!validationError && hasUnsavedChanges)}
            className="text-xs h-9 gap-1.5 font-bold shadow-xs min-w-[130px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Flow
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Strategy Presets Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => applyPreset('standard')}
          className="p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-foreground">Standard Recommended</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Popular</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            QR/Web reviewed by Waiters. Telegram & Admin reviewed by Support. POS orders go straight to kitchen.
          </p>
        </div>

        <div
          onClick={() => applyPreset('automated')}
          className="p-4 rounded-xl border bg-card hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-foreground">Direct Auto-Dispatch</p>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">Fastest</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            100% automated. All channels skip the review queue and immediately fire kitchen tickets.
          </p>
        </div>

        <div
          onClick={() => applyPreset('strict')}
          className="p-4 rounded-xl border bg-card hover:border-indigo-500/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <p className="text-xs font-bold text-foreground">Strict Verification</p>
            </div>
            <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200">Safest</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Every order must be manually verified and approved by a staff member before the kitchen sees it.
          </p>
        </div>
      </div>

      {/* 3. Validation Banner if Error */}
      {validationError && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-xs">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 4. Interactive Channel Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHANNELS.map((channel) => {
          const cfg: ChannelConfig = channelsState[channel.id] || {
            requiresReview: false,
            reviewerRole: null,
          };
          const Icon = channel.icon;

          return (
            <Card
              key={channel.id}
              className={`border transition-all shadow-2xs ${
                cfg.requiresReview
                  ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-card'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${channel.colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        {channel.title}
                        <Badge className={`text-[10px] ${channel.badgeBg} border-none`}>
                          {channel.badgeText}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {channel.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                <p className="text-xs text-muted-foreground">
                  {channel.description}
                </p>

                {/* Routing Toggle Container */}
                <div className="p-3.5 rounded-xl border bg-card flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Require Manual Staff Review
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {cfg.requiresReview
                        ? 'Hold order in Review Queue until authorized'
                        : 'Auto-route directly to Kitchen KDS and print tickets'}
                    </p>
                  </div>
                  <Switch
                    checked={cfg.requiresReview}
                    onCheckedChange={(checked) =>
                      handleToggleReview(channel.id, checked)
                    }
                  />
                </div>

                {/* Role Selection when Review is Required */}
                {cfg.requiresReview && (
                  <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-amber-600" />
                        Assigned Reviewer Role
                      </label>
                      <span className="text-[10px] font-mono font-medium text-amber-700 dark:text-amber-400">
                        Required
                      </span>
                    </div>

                    <Select
                      value={cfg.reviewerRole || 'waiter'}
                      onValueChange={(val: 'waiter' | 'support') =>
                        handleRoleChange(channel.id, val)
                      }
                    >
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700">
                        <SelectValue placeholder="Select staff role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waiter" className="text-xs">
                          🧑‍🍳 Waiter Staff (Floor & Table Servers)
                        </SelectItem>
                        <SelectItem value="support" className="text-xs">
                          🎧 Support / Manager (Call Center & Operations)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                      Orders from <strong className="capitalize">{channel.id}</strong> will be routed to the{' '}
                      <strong>{cfg.reviewerRole === 'waiter' ? 'Waiters' : 'Support Team'}</strong> review queue.
                    </p>
                  </div>
                )}

                {/* Flow Visualization Step */}
                <div className="pt-2 border-t flex items-center gap-2 text-[11px] text-muted-foreground overflow-x-auto no-scrollbar">
                  <span className="shrink-0 px-2 py-0.5 rounded bg-muted font-medium">
                    Order In
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  {cfg.requiresReview ? (
                    <>
                      <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-bold flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {cfg.reviewerRole === 'waiter' ? 'Waiter Review' : 'Support Review'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1">
                        <ChefHat className="h-2.5 w-2.5" />
                        Kitchen Cooking
                      </span>
                    </>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      Instant Kitchen Cooking
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 5. Summary Flow Preview Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Live Flow Architecture Summary
          </CardTitle>
          <CardDescription className="text-xs">
            How your restaurant operations currently process incoming guest tickets:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {CHANNELS.map((ch) => {
              const cfg = channelsState[ch.id];
              return (
                <div key={ch.id} className="p-3 rounded-lg border bg-card space-y-1">
                  <p className="font-bold text-foreground flex items-center justify-between">
                    <span>{ch.title.split('&')[0]}</span>
                    {cfg?.requiresReview ? (
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Reviewed
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Auto-Kitchen
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {cfg?.requiresReview
                      ? `Goes to ${cfg.reviewerRole === 'waiter' ? 'Waiter' : 'Support'} queue before food prep.`
                      : 'Fires tickets to kitchen and KDS stations instantly.'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderFlowConfigPage;
