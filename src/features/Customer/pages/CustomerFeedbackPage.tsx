// src/features/Customer/pages/CustomerFeedbackPage.tsx
import React, { useState, useMemo } from 'react';
import {
  useGetFeedbackList,
  useGetFeedbackStats,
  useRespondToFeedback,
  type FeedbackResponse,
  type FeedbackUpdateRequest,
} from '@/api/Queries/feedbackQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Reply,
  Phone,
  Calendar,
  Send,
  SendHorizontal,
  Sparkles,
  RefreshCw,
  Download,
  CheckSquare,
  Filter,
  Check,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  MessageCircle,
  Smartphone,
  QrCode,
  Store,
  Globe,
  Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import PageHeader from '@/components/Layout/PageHeader';
import { DataCard } from '@/components/Common/DataCard';
import {
  AdvancedFilterBar,
  AdvancedFilterDrawer,
  ActiveFilterChips,
  BulkActionBar,
  useDataViewState,
  type AdvancedFilterField,
  type QuickFilterOption,
  type BulkAction,
  type SortOption,
} from '../../../components/Common/AdavanceFilter';

// Mock sample feedback for fallback demonstration if API returns empty list
const SAMPLE_FEEDBACKS: FeedbackResponse[] = [
  {
    _id: 'fb-001',
    rating: 5,
    comment: 'The traditional Doro Wat and fresh Injera were absolutely exceptional! Service was fast and welcoming.',
    categories: ['Food Quality', 'Service'],
    channel: 'qr',
    order: 'ORD-8942',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    customer: {
      _id: 'cust-1',
      name: 'Abebe Bikila',
      phone: '+251 91 123 4567',
    },
  },
  {
    _id: 'fb-002',
    rating: 2,
    comment: 'Delivery took over 50 minutes and the soup arrived lukewarm. Please improve packaging for takeaway orders.',
    categories: ['Delivery Speed', 'Food Quality'],
    channel: 'telegram',
    order: 'ORD-8910',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    customer: {
      _id: 'cust-2',
      name: 'Sara Yohannes',
      phone: '+251 92 345 6789',
    },
  },
  {
    _id: 'fb-003',
    rating: 4,
    comment: 'Great coffee ceremony atmosphere and friendly staff. Slightly noisy near the entrance but overall lovely.',
    categories: ['Ambiance', 'Service'],
    channel: 'in-store',
    status: 'reviewed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    customer: {
      _id: 'cust-3',
      name: 'Dawit Haile',
      phone: '+251 93 456 7890',
    },
    merchantResponse: {
      responseText: 'Thank you for the warm review Dawit! We are adding acoustic panels to enhance our diner comfort.',
      respondedBy: 'Manager Helen',
      respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  },
  {
    _id: 'fb-004',
    rating: 5,
    comment: 'Quick order via Telegram bot, seamless payment, and delicious Tibs! Will definitely order weekly.',
    categories: ['Food Quality', 'Order Accuracy', 'Pricing'],
    channel: 'telegram',
    order: 'ORD-8876',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    customer: {
      _id: 'cust-4',
      name: 'Meron Tadesse',
      phone: '+251 94 567 8901',
    },
    merchantResponse: {
      responseText: 'We are thrilled you enjoyed the bot ordering experience! See you again soon Meron.',
      respondedBy: 'Support Team',
      respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
  },
  {
    _id: 'fb-005',
    rating: 3,
    comment: 'Food was decent but the bill had an extra beverage that we did not order. Rectified by server promptly.',
    categories: ['Order Accuracy', 'Service'],
    channel: 'in-store',
    order: 'ORD-8820',
    status: 'reviewed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    customer: {
      _id: 'cust-5',
      name: 'Elias Kebede',
      phone: '+251 95 678 9012',
    },
  },
];

export const CustomerFeedbackPage: React.FC = () => {
  // ── Queries ──
  const { data: feedbackData, isLoading, refetch } = useGetFeedbackList();
  const { data: statsData, isLoading: statsLoading } = useGetFeedbackStats();
  const respondMutation = useRespondToFeedback();

  // Selected feedback for inspection & reply
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  // Response text state for single reply
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'reviewed' | 'resolved'>('reviewed');

  // Bulk template dialog state
  const [bulkReplyDialogOpen, setBulkReplyDialogOpen] = useState(false);
  const [bulkReplyText, setBulkReplyText] = useState('');

  // Source list: API or Fallback
  const rawList = useMemo(() => {
    const apiList = feedbackData?.data;
    if (apiList && apiList.length > 0) return apiList;
    return SAMPLE_FEEDBACKS;
  }, [feedbackData]);

  // Derive Statistics
  const computedStats = useMemo(() => {
    if (statsData?.data) return statsData.data;

    const total = rawList.length;
    if (total === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        responded: 0,
        responseRate: 0,
      };
    }

    const sumRating = rawList.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const pos = rawList.filter((f) => f.rating >= 4).length;
    const neu = rawList.filter((f) => f.rating === 3).length;
    const neg = rawList.filter((f) => f.rating <= 2).length;
    const respondedCount = rawList.filter((f) => !!f.merchantResponse || f.status === 'resolved').length;

    return {
      totalFeedback: total,
      averageRating: sumRating / total,
      positive: pos,
      neutral: neu,
      negative: neg,
      responded: respondedCount,
      responseRate: Math.round((respondedCount / total) * 100),
    };
  }, [statsData, rawList]);

  // ── Filter Definitions ──
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'New / Unread', value: 'new' },
          { label: 'Reviewed', value: 'reviewed' },
          { label: 'Resolved', value: 'resolved' },
        ],
      },
      {
        id: 'rating',
        label: 'Rating',
        type: 'select',
        options: [
          { label: '5 Stars ★★★★★', value: '5' },
          { label: '4 Stars ★★★★☆', value: '4' },
          { label: '3 Stars ★★★☆☆', value: '3' },
          { label: '2 Stars ★★☆☆☆', value: '2' },
          { label: '1 Star ★☆☆☆☆', value: '1' },
        ],
      },
      {
        id: 'channel',
        label: 'Channel',
        type: 'select',
        options: [
          { label: 'Telegram Bot', value: 'telegram' },
          { label: 'QR Ordering', value: 'qr' },
          { label: 'In-Store / POS', value: 'in-store' },
          { label: 'Mobile App', value: 'app' },
          { label: 'Website', value: 'website' },
        ],
      },
      {
        id: 'categories',
        label: 'Feedback Category',
        type: 'multi-select',
        options: [
          { label: 'Food Quality', value: 'Food Quality' },
          { label: 'Service', value: 'Service' },
          { label: 'Ambiance', value: 'Ambiance' },
          { label: 'Delivery Speed', value: 'Delivery Speed' },
          { label: 'Pricing', value: 'Pricing' },
          { label: 'Cleanliness', value: 'Cleanliness' },
          { label: 'Order Accuracy', value: 'Order Accuracy' },
        ],
      },
      {
        id: 'hasResponse',
        label: 'Has Merchant Response',
        type: 'boolean',
        description: 'Only show reviews where staff have already provided a reply',
      },
      {
        id: 'createdAt',
        label: 'Date Received',
        type: 'date-range',
      },
    ],
    []
  );

  const quickFilters: QuickFilterOption<FeedbackResponse>[] = useMemo(
    () => [
      { key: 'all', label: 'All Reviews', count: rawList.length },
      {
        key: 'new',
        label: 'Needs Reply',
        icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
        matcher: (item) => item.status === 'new' || !item.merchantResponse,
        count: rawList.filter((f) => f.status === 'new' || !f.merchantResponse).length,
      },
      {
        key: 'positive',
        label: '5-Star Ratings',
        icon: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />,
        matcher: (item) => item.rating === 5,
        count: rawList.filter((f) => f.rating === 5).length,
      },
      {
        key: 'critical',
        label: 'Low / Critical (≤2★)',
        icon: <ThumbsDown className="h-3.5 w-3.5 text-rose-500" />,
        matcher: (item) => item.rating <= 2,
        count: rawList.filter((f) => f.rating <= 2).length,
      },
      {
        key: 'telegram',
        label: 'Telegram Inquiries',
        icon: <SendHorizontal className="h-3.5 w-3.5 text-sky-500" />,
        matcher: (item) => item.channel === 'telegram',
        count: rawList.filter((f) => f.channel === 'telegram').length,
      },
      {
        key: 'resolved',
        label: 'Resolved',
        icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
        matcher: (item) => item.status === 'resolved',
        count: rawList.filter((f) => f.status === 'resolved').length,
      },
    ],
    [rawList]
  );

  const sortOptions: SortOption<FeedbackResponse>[] = useMemo(
    () => [
      { id: 'date-desc', field: 'createdAt', label: 'Date (Newest First)', direction: 'desc' },
      { id: 'date-asc', field: 'createdAt', label: 'Date (Oldest First)', direction: 'asc' },
      { id: 'rating-desc', field: 'rating', label: 'Rating (Highest First)', direction: 'desc' },
      { id: 'rating-asc', field: 'rating', label: 'Rating (Lowest First)', direction: 'asc' },
      { id: 'name-asc', field: 'customer.name', label: 'Customer Name (A-Z)', direction: 'asc' },
    ],
    []
  );

  // ── Data View State Hook ──
  const {
    searchQuery,
    setSearchQuery,
    quickFilter,
    setQuickFilter,
    advancedFilters,
    setAdvancedFilterValue,
    removeAdvancedFilter,
    resetAllFilters,
    activeAdvancedCount,
    hasActiveFilters,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    selectedRows,
    toggleSelectRow,
    toggleSelectAll,
    clearSelection,
    isItemSelected,
    sortedData: filteredFeedbackList,
    totalCount,
    filteredCount,
    presets,
    activePresetId,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    viewMode,
    setViewMode,
    density,
    setDensity,
    groupBy,
    setGroupBy,
  } = useDataViewState<FeedbackResponse>({
    data: rawList,
    rowKey: '_id',
    searchFields: ['customer.name', 'customer.phone', 'comment', 'order', 'categories', 'merchantResponse.responseText'],
    filterFields,
    quickFilters,
    sortOptions,
    defaultQuickFilter: 'all',
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    presetStorageKey: 'customer_feedback_view',
  });

  // Active selected item for right pane
  const activeFeedback = useMemo(() => {
    if (selectedFeedbackId) {
      const found = filteredFeedbackList.find((f) => f._id === selectedFeedbackId);
      if (found) return found;
    }
    return filteredFeedbackList[0] || null;
  }, [selectedFeedbackId, filteredFeedbackList]);

  // ── Handlers ──

  const handleSelectFeedbackItem = (feedback: FeedbackResponse) => {
    setSelectedFeedbackId(feedback._id);
    setReplyText(feedback.merchantResponse?.responseText || '');
    setReplyStatus(feedback.status === 'resolved' ? 'resolved' : 'reviewed');
  };

  const handleSendSingleReply = async () => {
    if (!activeFeedback) return;
    if (!replyText.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    try {
      await respondMutation.mutateAsync({
        feedbackId: activeFeedback._id,
        data: {
          responseText: replyText.trim(),
          status: replyStatus,
        },
      });
      toast.success('Response sent successfully to customer!');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit response');
    }
  };

  const handleApplyTemplate = (templateText: string) => {
    setReplyText(templateText);
  };

  // ── Bulk Actions ──
  const bulkActions: BulkAction<FeedbackResponse>[] = [
    {
      id: 'bulk-mark-reviewed',
      label: 'Mark Reviewed',
      icon: <Check className="h-3.5 w-3.5 text-sky-500" />,
      onClick: async (items, onDone) => {
        try {
          for (const item of items) {
            await respondMutation.mutateAsync({
              feedbackId: item._id,
              data: { status: 'reviewed' },
            });
          }
          toast.success(`Marked ${items.length} feedback items as Reviewed`);
          onDone();
          refetch();
        } catch {
          toast.error('Failed to update status for selected items');
        }
      },
    },
    {
      id: 'bulk-mark-resolved',
      label: 'Mark Resolved',
      icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
      onClick: async (items, onDone) => {
        try {
          for (const item of items) {
            await respondMutation.mutateAsync({
              feedbackId: item._id,
              data: { status: 'resolved' },
            });
          }
          toast.success(`Marked ${items.length} feedback items as Resolved`);
          onDone();
          refetch();
        } catch {
          toast.error('Failed to update status for selected items');
        }
      },
    },
    {
      id: 'bulk-reply',
      label: 'Quick Reply Template',
      icon: <Reply className="h-3.5 w-3.5 text-primary" />,
      onClick: () => {
        setBulkReplyDialogOpen(true);
      },
    },
    {
      id: 'bulk-export',
      label: 'Export CSV',
      icon: <Download className="h-3.5 w-3.5 text-slate-500" />,
      onClick: (items) => {
        const header = ['ID', 'Customer', 'Phone', 'Rating', 'Comment', 'Channel', 'Status', 'Date'].join(',');
        const rows = items.map((f) =>
          [
            `"${f._id}"`,
            `"${f.customer?.name || 'Anonymous'}"`,
            `"${f.customer?.phone || ''}"`,
            f.rating,
            `"${(f.comment || '').replace(/"/g, '""')}"`,
            `"${f.channel || 'direct'}"`,
            `"${f.status || 'new'}"`,
            `"${f.createdAt}"`,
          ].join(',')
        );
        const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `feedback_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${items.length} feedback records`);
      },
    },
  ];

  const handleExecuteBulkReply = async () => {
    if (!bulkReplyText.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    try {
      for (const item of selectedRows) {
        await respondMutation.mutateAsync({
          feedbackId: item._id,
          data: {
            responseText: bulkReplyText.trim(),
            status: 'reviewed',
          },
        });
      }
      toast.success(`Sent response to ${selectedRows.length} customers!`);
      setBulkReplyDialogOpen(false);
      setBulkReplyText('');
      clearSelection();
      refetch();
    } catch {
      toast.error('Failed to submit bulk response');
    }
  };

  const getChannelBadge = (channel?: string) => {
    switch (channel) {
      case 'telegram':
        return (
          <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-[10px] font-bold gap-1">
            <SendHorizontal className="h-3 w-3" />
            Telegram
          </Badge>
        );
      case 'qr':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold gap-1">
            <QrCode className="h-3 w-3" />
            QR Menu
          </Badge>
        );
      case 'in-store':
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold gap-1">
            <Store className="h-3 w-3" />
            In-Store
          </Badge>
        );
      case 'app':
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[10px] font-bold gap-1">
            <Smartphone className="h-3 w-3" />
            Mobile App
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-bold gap-1">
            <Globe className="h-3 w-3" />
            Direct
          </Badge>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'resolved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold gap-1">
            <CheckCircle className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 text-[10px] font-bold gap-1">
            <MessageSquare className="h-3 w-3" />
            Reviewed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-[10px] font-bold gap-1">
            <Clock className="h-3 w-3" />
            New
          </Badge>
        );
    }
  };

  return (
    <>
      {/* ── Page Header ── */}
      <PageHeader
        title="Feedback & Reviews"
        subtitle="Monitor customer satisfaction, explore reviews, and respond to diner inquiries"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-xs font-medium gap-1.5 rounded-full"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </PageHeader>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Top Metric DataCards (Matching Dashboard & Stock Overview) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <DataCard
          title="Total Feedback"
          value={computedStats.totalFeedback}
          icon={<MessageSquare className="h-5 w-5" />}
          theme="indigo"
          subtitle="All received reviews"
          isLoading={statsLoading || isLoading}
        />

        <DataCard
          title="Average Rating"
          value={`${computedStats.averageRating?.toFixed(1)} / 5.0`}
          icon={<Star className="h-5 w-5 fill-amber-500 text-amber-500" />}
          theme="amber"
          subtitle="Overall satisfaction score"
          isLoading={statsLoading || isLoading}
        />

        <DataCard
          title="Positive Reviews"
          value={computedStats.positive}
          icon={<ThumbsUp className="h-5 w-5" />}
          theme="emerald"
          subtitle="4 & 5-star ratings"
          badge={`${Math.round((computedStats.positive / (computedStats.totalFeedback || 1)) * 100)}%`}
          isLoading={statsLoading || isLoading}
        />

        <DataCard
          title="Neutral Reviews"
          value={computedStats.neutral}
          icon={<Minus className="h-5 w-5" />}
          theme="slate"
          subtitle="3-star ratings"
          isLoading={statsLoading || isLoading}
        />

        <DataCard
          title="Critical Reviews"
          value={computedStats.negative}
          icon={<ThumbsDown className="h-5 w-5" />}
          theme="rose"
          subtitle="1 & 2-star ratings"
          badge={computedStats.negative > 0 ? `${computedStats.negative} Alerts` : undefined}
          badgeVariant="destructive"
          isLoading={statsLoading || isLoading}
        />

        <DataCard
          title="Response Rate"
          value={`${computedStats.responseRate}%`}
          icon={<Reply className="h-5 w-5" />}
          theme="sky"
          subtitle="Inquiries answered"
          isLoading={statsLoading || isLoading}
        />
      </div>

      {/* ── Advanced Filter Bar ── */}
      <div className="space-y-3">
        <AdvancedFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by customer name, phone, review notes, or order #..."
          quickFilters={quickFilters}
          activeQuickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
          hasFilterFields={filterFields.length > 0}
          activeAdvancedCount={activeAdvancedCount}
          onToggleFilterDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          isFilterDrawerOpen={isFilterDrawerOpen}
          sortOptions={sortOptions}
          activeSortField={sortField}
          activeSortDirection={sortDirection}
          onSortChange={(field, dir) => {
            setSortField(field);
            setSortDirection(dir || 'desc');
          }}
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={(p) => applyPreset(p)}
          onDeletePreset={(id) => deleteCustomPreset(id)}
          activeViewMode={viewMode}
          onViewModeChange={setViewMode}
          activeDensity={density}
          onDensityChange={setDensity}
          activeGroupBy={groupBy}
          onGroupByChange={setGroupBy}
          onResetAll={resetAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Advanced Filter Drawer */}
        <AdvancedFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filterFields={filterFields}
          values={advancedFilters}
          onChange={setAdvancedFilterValue}
          onApply={() => setIsFilterDrawerOpen(false)}
          onReset={resetAllFilters}
          onSavePreset={saveCustomPreset}
          activeCount={activeAdvancedCount}
        />

        {/* Active Filter Chips */}
        <ActiveFilterChips
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          quickFilter={quickFilter}
          quickFilterOptions={quickFilters}
          onClearQuickFilter={() => setQuickFilter('all')}
          advancedFilters={advancedFilters}
          filterFields={filterFields}
          onRemoveAdvancedFilter={removeAdvancedFilter}
          groupBy={groupBy}
          onClearGroupBy={() => setGroupBy(null)}
          totalCount={totalCount}
          filteredCount={filteredCount}
          selectedCount={selectedRows.length}
          entityName="reviews"
          onResetAll={resetAllFilters}
        />

        {/* Floating Bulk Action Bar */}
        <BulkActionBar
          selectedRows={selectedRows}
          totalCount={filteredCount}
          onClearSelection={clearSelection}
          onSelectAll={() => toggleSelectAll(true)}
          bulkActions={bulkActions}
        />
      </div>

      {/* ── Main Interactive Split View (Select Feedback & Inspect) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Feedback Cards List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Header Row with Bulk Select Helper */}
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRows.length > 0 && selectedRows.length === filteredFeedbackList.length}
                onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                id="select-all-feedback"
              />
              <label htmlFor="select-all-feedback" className="cursor-pointer">
                Select all ({filteredFeedbackList.length} reviews)
              </label>
            </div>

            <span>
              Showing {filteredFeedbackList.length} of {totalCount} reviews
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredFeedbackList.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                No matching feedback found
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search criteria or clearing active filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="mt-4 rounded-xl text-xs"
              >
                Clear all filters
              </Button>
            </Card>
          ) : (
            filteredFeedbackList.map((item, index) => {
              const isInspecting = activeFeedback?._id === item._id;
              const isChecked = isItemSelected(item, index);

              return (
                <Card
                  key={item._id}
                  onClick={() => handleSelectFeedbackItem(item)}
                  className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 sm:p-5 ${
                    isInspecting
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04] shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for Bulk Selection */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-0.5 shrink-0"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          toggleSelectRow(item, index, Boolean(checked))
                        }
                      />
                    </div>

                    {/* Feedback Content */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Top Row: Customer info + Rating + Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {item.customer?.name || 'Anonymous Guest'}
                          </span>
                          {item.customer?.phone && (
                            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                              {item.customer.phone}
                            </span>
                          )}
                          {item.order && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                              #{item.order}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {getChannelBadge(item.channel)}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      {/* Stars Row & Date */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= item.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1 font-bold text-xs text-slate-700 dark:text-slate-300">
                            {item.rating}.0
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          {item.createdAt
                            ? format(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')
                            : 'Recent'}
                        </span>
                      </div>

                      {/* Comment */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.comment || 'No written comment provided.'}
                      </p>

                      {/* Categories & Reply status pill */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1">
                          {item.categories?.map((cat) => (
                            <span
                              key={cat}
                              className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        {item.merchantResponse ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Responded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <Reply className="h-3.5 w-3.5" />
                            Click to reply
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Right: Selected Feedback Detail & Immediate Response Console (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          {activeFeedback ? (
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              {/* Header */}
              <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Eye className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                        Selected Review Details
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        Review ID: {activeFeedback._id}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {getStatusBadge(activeFeedback.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Diner Information Card */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {activeFeedback.customer?.name || 'Anonymous Customer'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {activeFeedback.customer?.phone || 'No phone number linked'}
                      </p>
                    </div>
                    {getChannelBadge(activeFeedback.channel)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= activeFeedback.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-xs ml-1">
                        {activeFeedback.rating}/5
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {activeFeedback.createdAt
                        ? format(new Date(activeFeedback.createdAt), 'MMM d, yyyy HH:mm')
                        : ''}
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Customer Comment
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    "{activeFeedback.comment || 'No written text provided.'}"
                  </div>
                </div>

                {/* Categories */}
                {activeFeedback.categories && activeFeedback.categories.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Feedback Categories
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFeedback.categories.map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs font-medium">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Response Display */}
                {activeFeedback.merchantResponse && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Previous Response
                      </span>
                      <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                        {activeFeedback.merchantResponse.respondedAt
                          ? format(
                              new Date(activeFeedback.merchantResponse.respondedAt),
                              'MMM d, h:mm a'
                            )
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-950 dark:text-emerald-200">
                      "{activeFeedback.merchantResponse.responseText}"
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      Sent by: {activeFeedback.merchantResponse.respondedBy || 'Staff'}
                    </p>
                  </div>
                )}

                {/* Response / Reply Console */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Reply className="h-3.5 w-3.5 text-primary" />
                      <span>{activeFeedback.merchantResponse ? 'Update Response' : 'Reply to Diner'}</span>
                    </label>

                    {/* Status Toggle */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={replyStatus === 'reviewed' ? 'default' : 'ghost'}
                        onClick={() => setReplyStatus('reviewed')}
                        className="h-6 px-2 text-[10px] rounded-lg"
                      >
                        Reviewed
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={replyStatus === 'resolved' ? 'default' : 'ghost'}
                        onClick={() => setReplyStatus('resolved')}
                        className="h-6 px-2 text-[10px] rounded-lg"
                      >
                        Resolved
                      </Button>
                    </div>
                  </div>

                  {/* Quick Preset Templates */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Quick Responses:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyTemplate(
                            'Thank you so much for your kind words! We look forward to hosting you again soon.'
                          )
                        }
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium"
                      >
                        ⭐ Appreciation
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyTemplate(
                            'We sincerely apologize for the inconvenience. Our manager has been alerted and will ensure your next visit is flawless.'
                          )
                        }
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium"
                      >
                        🙏 Apology & Remedy
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyTemplate(
                            'Thank you for the constructive feedback! We have shared this with our kitchen & service crew to make immediate improvements.'
                          )
                        }
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium"
                      >
                        💡 Constructive Note
                      </button>
                    </div>
                  </div>

                  {/* Textarea */}
                  <Textarea
                    placeholder="Type your response to the diner here..."
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900"
                  />

                  {/* Action Button */}
                  <Button
                    onClick={handleSendSingleReply}
                    disabled={respondMutation.isPending || !replyText.trim()}
                    className="w-full h-9 text-xs font-bold rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {respondMutation.isPending ? 'Sending...' : 'Send Response to Customer'}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center text-slate-500">
              <Eye className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                Select a review to inspect
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Click any feedback card on the left to read full details and send customer replies.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* ── Bulk Reply Dialog ── */}
      <Dialog open={bulkReplyDialogOpen} onOpenChange={setBulkReplyDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Reply className="h-4 w-4 text-primary" />
              <span>Bulk Reply to {selectedRows.length} Customers</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This message will be applied to all {selectedRows.length} selected feedback entries and mark their status as Reviewed.
            </p>

            <Textarea
              placeholder="Enter collective response message..."
              rows={4}
              value={bulkReplyText}
              onChange={(e) => setBulkReplyText(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkReplyDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteBulkReply}
              disabled={!bulkReplyText.trim() || respondMutation.isPending}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send to All {selectedRows.length}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </main>
    </>
  );
};

export default CustomerFeedbackPage;
