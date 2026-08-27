// src/features/Marketing/pages/CampaignPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import { useTelegramStatusQuery } from '@/api/Queries/telegramQueries';
import {
  useGetCampaignsList,
  useGetCampaignDetails,
  useCreateCampaign,
  usePreviewCampaignAudience,
  useSendCampaign,
  useDeleteCampaign,
  type Campaign,
  type CampaignAudience,
} from '@/api/Queries/campaignQueries';
import { useGetCustomersList } from '@/api/Queries/customerQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  Sparkles,
  ExternalLink,
  Tag,
  RefreshCw,
  Eye,
  XCircle,
  Image as ImageIcon,
  Award,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  DataCard,
  FilterBar,
  DataTable,
  type ColumnDef,
} from '@/components/Common';

export const CampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: merchantProfile } = useMyMerchantQuery();
  const merchantId = merchantProfile?._id;

  const { data: telegramStatus } = useTelegramStatusQuery(merchantId);
  const isConnected = telegramStatus?.connected ?? false;
  const isMarketingEnabled = telegramStatus?.settings?.marketingEnabled ?? true;

  const { data: campaigns = [], isLoading: isListLoading, refetch: refetchCampaigns } = useGetCampaignsList();
  const { data: customerData } = useGetCustomersList();

  const createCampaignMutation = useCreateCampaign();
  const previewAudienceMutation = usePreviewCampaignAudience();
  const sendCampaignMutation = useSendCampaign();
  const deleteCampaignMutation = useDeleteCampaign();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected campaign detail view
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const { data: activeCampaignDetail } = useGetCampaignDetails(activeCampaignId);

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [minTotalOrders, setMinTotalOrders] = useState<number | ''>('');
  const [customTagsInput, setCustomTagsInput] = useState('');
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Extract available tags from CRM customer data for auto-suggestions
  const availableCrmTags = React.useMemo(() => {
    const rawCustomers = customerData?.data?.customers || customerData?.data || [];
    if (!Array.isArray(rawCustomers)) return [];
    const tagSet = new Set<string>();
    rawCustomers.forEach((c: any) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t: string) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [customerData]);

  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
    setPreviewSize(null);
  };

  const buildAudiencePayload = (): CampaignAudience => {
    const audience: CampaignAudience = {};
    if (selectedTiers.length > 0) {
      audience.loyaltyTier = selectedTiers;
    }
    if (typeof minTotalOrders === 'number' && minTotalOrders > 0) {
      audience.minTotalOrders = minTotalOrders;
    }
    const tags = customTagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (tags.length > 0) {
      audience.tags = tags;
    }
    return audience;
  };

  const handlePreviewAudience = async () => {
    try {
      let draftId = currentDraftId;
      if (!draftId) {
        draftId = await handleSaveDraft(true);
      }
      if (!draftId) return;

      const size = await previewAudienceMutation.mutateAsync({
        campaignId: draftId,
        audience: buildAudiencePayload(),
      });
      setPreviewSize(size ?? 0);
      toast.info(`Target audience estimated: ~${size ?? 0} customer(s) match`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to preview audience size');
    }
  };

  const handleSaveDraft = async (suppressToast = false): Promise<string | null> => {
    if (!name.trim() || !message.trim()) {
      toast.error('Campaign Name and Message Body are required');
      return null;
    }

    try {
      const payload = {
        name: name.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
        audience: buildAudiencePayload(),
      };

      const result = await createCampaignMutation.mutateAsync(payload);
      const newId = (result as any)?._id || (result as any)?.data?._id;
      setCurrentDraftId(newId);

      if (!suppressToast) {
        toast.success('Campaign draft saved successfully');
        setIsComposerOpen(false);
        resetComposer();
      }
      refetchCampaigns();
      return newId;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save campaign');
      return null;
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await sendCampaignMutation.mutateAsync(campaignId);
      toast.success('Campaign broadcast queued and started');
      setIsComposerOpen(false);
      resetComposer();
      refetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaignMutation.mutateAsync(campaignId);
      toast.success('Campaign record deleted');
      refetchCampaigns();
      if (activeCampaignId === campaignId) {
        setActiveCampaignId(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const resetComposer = () => {
    setName('');
    setMessage('');
    setImageUrl('');
    setSelectedTiers([]);
    setMinTotalOrders('');
    setCustomTagsInput('');
    setPreviewSize(null);
    setCurrentDraftId(null);
  };

  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-[10px] font-semibold">Draft</Badge>;
      case 'scheduled':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">Scheduled</Badge>;
      case 'sending':
        return (
          <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] font-bold flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sending...
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Broadcast Sent
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Campaign>[] = [
    {
      id: 'name',
      header: 'Campaign & Content',
      sortable: true,
      accessorKey: 'name',
      cell: (campaign) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-slate-900 dark:text-white">
              {campaign.name}
            </p>
            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">
              {campaign.message}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'audience',
      header: 'Target Audience',
      cell: (campaign) => {
        const audienceSize = campaign.stats?.audienceSize || campaign.stats?.totalRecipients || 0;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Users className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>{audienceSize} customers</span>
          </div>
        );
      },
    },
    {
      id: 'delivery',
      header: 'Delivery Stats',
      cell: (campaign) => {
        const sentCount = campaign.stats?.sentCount || campaign.stats?.delivered || 0;
        const failedCount = campaign.stats?.failedCount || 0;
        return (
          <div className="text-xs">
            {campaign.status === 'sent' ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {sentCount} delivered {failedCount > 0 && <span className="text-rose-500 font-normal">({failedCount} failed)</span>}
              </span>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'date',
      header: 'Date',
      sortable: true,
      cell: (campaign) => (
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>
            {campaign.sentAt
              ? `Sent ${new Date(campaign.sentAt).toLocaleDateString()}`
              : `Created ${new Date(campaign.createdAt).toLocaleDateString()}`}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (campaign) => getStatusBadge(campaign.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (campaign) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveCampaignId(campaign._id)}
            className="h-8 text-xs gap-1 rounded-xl"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </Button>

          {campaign.status === 'draft' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={!isConnected || !isMarketingEnabled || sendCampaignMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1 rounded-xl font-bold"
                >
                  <Send className="h-3 w-3" />
                  <span>Send</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base font-bold">Send Campaign Broadcast?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    This will broadcast "<b>{campaign.name}</b>" to all matching opted-in Telegram customers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleSendCampaign(campaign._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                  >
                    Confirm & Send
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold">Delete Campaign?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  Are you sure you want to delete this campaign record?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteCampaign(campaign._id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Promotions & Marketing"
        subtitle="Broadcast promotional updates, special menu discounts, and announcements to your audience"
        actionLabel="New Campaign"
        actionIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
        onAction={() => {
          resetComposer();
          setIsComposerOpen(true);
        }}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Telegram Status Warning Banner */}
        {!isConnected && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  Telegram Bot Not Connected
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  Connect your restaurant bot in Settings to enable direct broadcast messaging.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings?tab=telegram')}
              className="text-xs h-8 rounded-xl font-semibold border-amber-500/30 text-amber-800 dark:text-amber-200"
            >
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              Configure Bot
            </Button>
          </div>
        )}

        {/* Standard DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Campaigns"
            value={isListLoading ? '...' : campaigns.length}
            icon={<Megaphone className="h-5 w-5" />}
            theme="primary"
            subtitle="All marketing initiatives"
            isLoading={isListLoading}
          />

          <DataCard
            title="Delivered Broadcasts"
            value={isListLoading ? '...' : campaigns.filter((c) => c.status === 'sent').length}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Completed customer deliveries"
            isLoading={isListLoading}
          />

          <DataCard
            title="In-Progress Broadcasts"
            value={isListLoading ? '...' : campaigns.filter((c) => c.status === 'sending').length}
            icon={<Send className="h-5 w-5" />}
            theme="sky"
            subtitle="Currently dispatching messages"
            isLoading={isListLoading}
          />

          <DataCard
            title="Draft Queue"
            value={isListLoading ? '...' : campaigns.filter((c) => c.status === 'draft').length}
            icon={<Clock className="h-5 w-5" />}
            theme="amber"
            subtitle="Prepared for review and dispatch"
            isLoading={isListLoading}
          />
        </div>

        {/* Standard FilterBar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search campaigns by name or message contents..."
          quickFilters={{
            activeKey: statusFilter,
            onChange: setStatusFilter,
            options: [
              { key: 'all', label: 'All Campaigns', count: campaigns.length },
              { key: 'sent', label: 'Delivered', count: campaigns.filter((c) => c.status === 'sent').length, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
              { key: 'sending', label: 'Sending', count: campaigns.filter((c) => c.status === 'sending').length, icon: <Send className="h-3.5 w-3.5" /> },
              { key: 'draft', label: 'Drafts', count: campaigns.filter((c) => c.status === 'draft').length, icon: <Clock className="h-3.5 w-3.5" /> },
            ],
          }}
          onReset={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />

        {/* Standard DataTable */}
        <DataTable
          data={filteredCampaigns}
          columns={columns}
          isLoading={isListLoading}
          paginated={true}
          pageSize={10}
          emptyIcon={<Megaphone className="h-8 w-8 text-slate-400" />}
          emptyTitle="No campaigns found"
          emptyDescription={
            searchQuery
              ? 'No campaigns match your filter criteria.'
              : 'Create your first marketing broadcast to engage customers with promotions.'
          }
          emptyActionLabel="New Campaign"
          onEmptyAction={() => {
            resetComposer();
            setIsComposerOpen(true);
          }}
          onRowClick={(campaign) => setActiveCampaignId(campaign._id)}
        />
      </div>

      {/* Composer Modal Dialog */}
      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Create Marketing Broadcast
            </DialogTitle>
            <DialogDescription className="text-xs">
              Compose promotional messages and target specific customer loyalty tiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="comp-name" className="text-xs font-semibold">Campaign Name *</Label>
              <Input
                id="comp-name"
                placeholder="e.g. VIP Weekend 20% Discount"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setPreviewSize(null);
                }}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-msg" className="text-xs font-semibold">Message Content *</Label>
              <Textarea
                id="comp-msg"
                placeholder="Write your promotional announcement..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setPreviewSize(null);
                }}
                rows={4}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-img" className="text-xs font-semibold flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
                Image URL (Optional)
              </Label>
              <Input
                id="comp-img"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-9 text-xs rounded-xl font-mono"
              />
            </div>

            {/* Audience Targeting Card */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                <Users className="h-4 w-4 text-sky-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Audience Targeting (Optional)</h4>
                <span className="text-[10px] text-slate-500 ml-auto">
                  Leave blank to reach all opted-in customers
                </span>
              </div>

              {/* Loyalty Tier Selection */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  Loyalty Tiers
                </Label>
                <div className="flex flex-wrap gap-4">
                  {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
                    <label key={tier} className="flex items-center gap-1.5 text-xs cursor-pointer capitalize">
                      <Checkbox
                        checked={selectedTiers.includes(tier)}
                        onCheckedChange={() => toggleTier(tier)}
                      />
                      <span>{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="comp-orders" className="text-[11px] font-semibold flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />
                    Minimum Completed Orders
                  </Label>
                  <Input
                    id="comp-orders"
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    value={minTotalOrders}
                    onChange={(e) => {
                      setMinTotalOrders(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                      setPreviewSize(null);
                    }}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-tags" className="text-[11px] font-semibold flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-purple-500" />
                    Customer Tags
                  </Label>
                  <Input
                    id="comp-tags"
                    placeholder="e.g. VIP, Regular, Vegan"
                    value={customTagsInput}
                    onChange={(e) => {
                      setCustomTagsInput(e.target.value);
                      setPreviewSize(null);
                    }}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              {availableCrmTags.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block mb-1">Quick Select Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {availableCrmTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        onClick={() => {
                          if (!customTagsInput.includes(tag)) {
                            setCustomTagsInput((prev) => (prev ? `${prev}, ${tag}` : tag));
                            setPreviewSize(null);
                          }
                        }}
                        className="cursor-pointer text-[10px] hover:bg-sky-500/10 hover:text-sky-600 rounded-lg"
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audience Preview Box */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                <span>
                  {previewSize !== null ? (
                    <>
                      Target Audience: <b className="text-sky-900 dark:text-sky-200">~{previewSize} customers match</b>
                    </>
                  ) : (
                    <span className="text-slate-500">Click preview to count matching audience</span>
                  )}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewAudience}
                disabled={previewAudienceMutation.isPending || !name.trim() || !message.trim()}
                className="h-7 text-[11px] gap-1 rounded-lg"
              >
                {previewAudienceMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                Preview Audience
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSaveDraft(false)}
              disabled={createCampaignMutation.isPending || !name.trim() || !message.trim()}
              className="rounded-xl"
            >
              Save as Draft
            </Button>

            <Button
              size="sm"
              disabled={!name.trim() || !message.trim() || createCampaignMutation.isPending}
              onClick={async () => {
                const id = currentDraftId || (await handleSaveDraft(true));
                if (id) {
                  handleSendCampaign(id);
                }
              }}
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Save & Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Modal */}
      {activeCampaignId && activeCampaignDetail && (
        <Dialog open={!!activeCampaignId} onOpenChange={() => setActiveCampaignId(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Megaphone className="h-4 w-4 text-emerald-500" />
                {activeCampaignDetail.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Campaign details, message content, and real-time delivery stats.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Audience</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {activeCampaignDetail.stats?.audienceSize || activeCampaignDetail.stats?.totalRecipients || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Delivered</span>
                  <span className="text-base font-bold text-emerald-600">
                    {activeCampaignDetail.stats?.sentCount || activeCampaignDetail.stats?.delivered || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] text-rose-600 uppercase font-semibold block">Failed</span>
                  <span className="text-base font-bold text-rose-600">
                    {activeCampaignDetail.stats?.failedCount || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Message Content:</span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                  {activeCampaignDetail.message}
                </div>
              </div>

              {activeCampaignDetail.imageUrl && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Attached Image:</span>
                  <img
                    src={activeCampaignDetail.imageUrl}
                    alt="Campaign header"
                    className="max-h-48 rounded-xl border object-cover w-full"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveCampaignId(null)} className="rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CampaignPage;
