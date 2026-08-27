// src/features/Customer/pages/CustomerListPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCustomersList } from '@/api/Queries/customerQueries';
import type { CustomerSession } from '@/api/Queries/customerQueries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Phone,
  Gift,
  SendHorizontal,
  History,
  Sparkles,
  UtensilsCrossed,
  ArrowRight,
  Heart,
  ShoppingBag,
  Mail,
  Tag,
  Download,
  Users,
  Calendar,
  DollarSign,
  Award,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  PageHeader,
  DataCard,
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type BulkAction,
  type KanbanColumnConfig,
  type SavedPreset,
} from '@/components/Common';
import { toast } from 'sonner';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyCustomer, setHistoryCustomer] = useState<CustomerSession | null>(null);

  const { data, isLoading } = useGetCustomersList();
  const customers: CustomerSession[] = data?.data?.customers || [];

  // Helper functions
  const getFavoriteMeals = (customer: CustomerSession): string[] => {
    const list: string[] = [];
    if (customer.favoriteMeals?.length) {
      customer.favoriteMeals.forEach((meal: any) => {
        if (typeof meal === 'string') list.push(meal);
        else if (meal?.name) list.push(meal.name);
      });
    }
    if (customer.tags?.length) {
      customer.tags.forEach((tag: string) => {
        if (tag.toLowerCase().startsWith('fav:')) {
          const name = tag.slice(4).trim();
          if (name && !list.includes(name)) list.push(name);
        }
      });
    }
    return list;
  };

  const isNewThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const getInitials = (name?: string, telegramUsername?: string) => {
    if (name && name.toLowerCase() !== 'guest') {
      return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    if (telegramUsername) {
      return telegramUsername.slice(0, 2).toUpperCase();
    }
    return 'CU';
  };

  const getTierBadge = (tier?: string) => {
    const normalized = (tier || 'bronze').toLowerCase();
    switch (normalized) {
      case 'gold':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-bold text-[10px]">
            <Sparkles className="h-3 w-3 fill-amber-500" />
            GOLD
          </Badge>
        );
      case 'silver':
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 gap-1 font-bold text-[10px]">
            <Sparkles className="h-3 w-3 fill-slate-400" />
            SILVER
          </Badge>
        );
      case 'bronze':
      default:
        return (
          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30 gap-1 font-bold text-[10px]">
            BRONZE
          </Badge>
        );
    }
  };

  // Metrics for summary cards & quick filter badges
  const telegramLinkedCount = useMemo(
    () => customers.filter((c) => Boolean(c.telegram?.linked || c.telegram?.username)).length,
    [customers]
  );

  const vipCount = useMemo(
    () => customers.filter((c) => c.loyalty?.tier?.toLowerCase() === 'gold').length,
    [customers]
  );

  const newThisMonthCount = useMemo(
    () => customers.filter((c) => isNewThisMonth(c.lastSeen || c.createdAt)).length,
    [customers]
  );

  const favoritesCount = useMemo(
    () => customers.filter((c) => getFavoriteMeals(c).length > 0).length,
    [customers]
  );

  const loyaltyCount = useMemo(
    () => customers.filter((c) => (c.loyalty?.points ?? 0) > 0).length,
    [customers]
  );

  // 1. Table Columns Definition
  const columns: ColumnDef<CustomerSession>[] = useMemo(
    () => [
      {
        id: 'profile',
        header: 'Customer Profile',
        sortable: true,
        accessorKey: 'fullName',
        cell: (customer) => {
          const isTelegramLinked = Boolean(
            customer.telegram?.linked || customer.telegram?.username
          );
          const telegramHandle = customer.telegram?.username;
          const avatarSrc =
            customer.telegram?.profilePic ||
            (customer.profileImage !== '/images/default-avatar.png'
              ? customer.profileImage
              : undefined);
          const isVip = customer.loyalty?.tier?.toLowerCase() === 'gold';

          return (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar
                  className={`h-10 w-10 border ${
                    isVip
                      ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <AvatarImage src={avatarSrc} alt={customer.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(customer.fullName, telegramHandle)}
                  </AvatarFallback>
                </Avatar>
                {isTelegramLinked && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 bg-sky-500 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900"
                    title="Telegram Linked"
                  >
                    <SendHorizontal className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {customer.fullName && customer.fullName !== 'Guest'
                      ? customer.fullName
                      : customer.telegram?.firstName || 'Guest Customer'}
                  </p>
                  {isVip && (
                    <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize font-medium">
                    {customer.source || 'guest'}
                  </Badge>
                  {customer.currentTable && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-1">
                      <UtensilsCrossed className="h-2.5 w-2.5 text-amber-500" /> Seated
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'contact',
        header: 'Telegram & Contact',
        cell: (customer) => {
          const isTelegramLinked = Boolean(
            customer.telegram?.linked || customer.telegram?.username
          );
          const telegramHandle = customer.telegram?.username;

          return (
            <div className="space-y-1">
              {telegramHandle ? (
                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">
                  <SendHorizontal className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                  <span>@{telegramHandle}</span>
                  {customer.telegram?.optIn && (
                    <Badge className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-normal">
                      Opted-in
                    </Badge>
                  )}
                </div>
              ) : isTelegramLinked ? (
                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 text-xs font-medium">
                  <SendHorizontal className="h-3.5 w-3.5 shrink-0" />
                  <span>Telegram Linked</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No Telegram</span>
              )}

              {customer.phone ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">No phone</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'favorites',
        header: 'Favorite Dishes',
        cell: (customer) => {
          const favorites = getFavoriteMeals(customer);
          if (favorites.length === 0) {
            return <span className="text-xs text-slate-400">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {favorites.slice(0, 2).map((fav, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 gap-1 truncate max-w-[120px]"
                >
                  <Heart className="h-2.5 w-2.5 fill-rose-500 shrink-0" />
                  <span className="truncate">{fav}</span>
                </Badge>
              ))}
              {favorites.length > 2 && (
                <span className="text-[10px] text-slate-400 font-mono self-center">
                  +{favorites.length - 2} more
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'loyalty',
        header: 'Loyalty Tier',
        sortable: true,
        accessorKey: 'loyalty.points',
        cell: (customer) => (
          <div className="flex items-center gap-2">
            {getTierBadge(customer.loyalty?.tier)}
            <span className="text-xs text-slate-500 font-mono font-medium">
              {customer.loyalty?.points ?? 0} pts
            </span>
          </div>
        ),
      },
      {
        id: 'spent',
        header: 'Orders & Spent',
        sortable: true,
        accessorKey: 'stats.totalSpent',
        cell: (customer) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
              <span>{customer.stats?.totalOrders ?? 0} orders</span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              ETB {(customer.stats?.totalSpent ?? 0).toLocaleString()}
            </div>
          </div>
        ),
      },
      {
        id: 'activity',
        header: 'Last Activity',
        sortable: true,
        accessorKey: 'lastSeen',
        cell: (customer) => {
          const date = customer.lastSeen || customer.telegram?.lastInteractionAt || customer.createdAt;
          if (!date) return <span className="text-xs text-slate-400">—</span>;
          return (
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (customer) => {
          const isTelegramLinked = Boolean(
            customer.telegram?.linked || customer.telegram?.username
          );
          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              {isTelegramLinked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-sky-600 border-sky-500/30 hover:bg-sky-500/10 rounded-xl"
                  title="Open Telegram Chat"
                  onClick={() => navigate(`/customers/telegram-chat?customerId=${customer._id}`)}
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Chat</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 rounded-xl"
                onClick={() => setHistoryCustomer(customer)}
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">History</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-1 rounded-xl font-semibold"
                onClick={() => navigate(`/customers/${customer._id}`)}
              >
                <span>Details</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate]
  );

  // 2. Quick Filter Tabs with Counts and Icons
  const quickFilters: QuickFilterOption<CustomerSession>[] = useMemo(
    () => [
      {
        key: 'all',
        label: 'All Customers',
        count: customers.length,
        matcher: () => true,
      },
      {
        key: 'telegram',
        label: 'Telegram Linked',
        count: telegramLinkedCount,
        icon: <SendHorizontal className="h-3.5 w-3.5 text-sky-500" />,
        matcher: (c) => Boolean(c.telegram?.linked || c.telegram?.username),
      },
      {
        key: 'vip',
        label: 'VIP (Gold Tier)',
        count: vipCount,
        icon: <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />,
        matcher: (c) => c.loyalty?.tier?.toLowerCase() === 'gold',
      },
      {
        key: 'new',
        label: 'New This Month',
        count: newThisMonthCount,
        icon: <Calendar className="h-3.5 w-3.5 text-indigo-500" />,
        matcher: (c) => isNewThisMonth(c.lastSeen || c.createdAt),
      },
      {
        key: 'favorites',
        label: 'With Favorites',
        count: favoritesCount,
        icon: <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />,
        matcher: (c) => getFavoriteMeals(c).length > 0,
      },
      {
        key: 'loyalty',
        label: 'Loyalty Members',
        count: loyaltyCount,
        icon: <Gift className="h-3.5 w-3.5 text-emerald-500" />,
        matcher: (c) => (c.loyalty?.points ?? 0) > 0,
      },
    ],
    [customers.length, telegramLinkedCount, vipCount, newThisMonthCount, favoritesCount, loyaltyCount]
  );

  // 3. Advanced Filter Drawer Fields
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'loyalty.tier',
        label: 'Loyalty Tier',
        type: 'select',
        placeholder: 'Select tier...',
        options: [
          { label: 'All Tiers', value: 'all' },
          { label: 'Gold Tier (VIP)', value: 'gold', color: '#f59e0b' },
          { label: 'Silver Tier', value: 'silver', color: '#94a3b8' },
          { label: 'Bronze Tier', value: 'bronze', color: '#ea580c' },
        ],
      },
      {
        id: 'source',
        label: 'Customer Source',
        type: 'select',
        placeholder: 'Select acquisition source...',
        options: [
          { label: 'All Sources', value: 'all' },
          { label: 'POS Terminal', value: 'pos' },
          { label: 'Telegram Bot', value: 'telegram' },
          { label: 'QR Ordering', value: 'qr' },
          { label: 'Web Portal', value: 'web' },
          { label: 'Guest Walk-in', value: 'guest' },
        ],
      },
      {
        id: 'loyalty.points',
        label: 'Loyalty Points Range',
        type: 'number-range',
        suffix: 'pts',
        min: 0,
        max: 5000,
        step: 10,
        description: 'Filter customers having points between minimum and maximum',
      },
      {
        id: 'stats.totalSpent',
        label: 'Total Spent (ETB)',
        type: 'number-range',
        prefix: 'ETB ',
        min: 0,
        max: 50000,
        step: 100,
      },
      {
        id: 'stats.totalOrders',
        label: 'Total Orders Placed',
        type: 'number-range',
        min: 0,
        max: 100,
        step: 1,
      },
      {
        id: 'createdAt',
        label: 'Registration Date Range',
        type: 'date-range',
      },
    ],
    []
  );

  // 4. Grouping Options
  const groupByOptions: GroupByOption<CustomerSession>[] = useMemo(
    () => [
      {
        id: 'tier',
        label: 'Loyalty Tier',
        icon: <Award className="h-4 w-4" />,
        accessor: (customer) => {
          const tier = (customer.loyalty?.tier || 'bronze').toUpperCase();
          return `${tier} TIER`;
        },
      },
      {
        id: 'source',
        label: 'Customer Source',
        icon: <Users className="h-4 w-4" />,
        accessor: (customer) => {
          const src = (customer.source || 'guest').toUpperCase();
          return `SOURCE: ${src}`;
        },
      },
      {
        id: 'telegram',
        label: 'Telegram Status',
        icon: <SendHorizontal className="h-4 w-4" />,
        accessor: (customer) => {
          return customer.telegram?.linked || customer.telegram?.username
            ? 'TELEGRAM LINKED'
            : 'NO TELEGRAM';
        },
      },
    ],
    []
  );

  // 5. Sorting Options
  const sortOptions: SortOption<CustomerSession>[] = useMemo(
    () => [
      { id: 'name_asc', label: 'Customer Name (A-Z)', field: 'fullName', direction: 'asc' },
      { id: 'name_desc', label: 'Customer Name (Z-A)', field: 'fullName', direction: 'desc' },
      { id: 'points_desc', label: 'Loyalty Points (High to Low)', field: 'loyalty.points', direction: 'desc' },
      { id: 'points_asc', label: 'Loyalty Points (Low to High)', field: 'loyalty.points', direction: 'asc' },
      { id: 'spent_desc', label: 'Total Spent (High to Low)', field: 'stats.totalSpent', direction: 'desc' },
      { id: 'orders_desc', label: 'Order Count (High to Low)', field: 'stats.totalOrders', direction: 'desc' },
      { id: 'activity_desc', label: 'Recent Activity', field: 'lastSeen', direction: 'desc' },
      { id: 'created_desc', label: 'Registration Date (Newest)', field: 'createdAt', direction: 'desc' },
    ],
    []
  );

  // 6. Kanban Column Config (Kanban View by Loyalty Tier)
  const kanbanColumns: KanbanColumnConfig<CustomerSession>[] = useMemo(
    () => [
      {
        id: 'bronze',
        title: 'Bronze Tier',
        color: '#ea580c',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        icon: <Award className="h-4 w-4 text-orange-600" />,
        matcher: (item) => (item.loyalty?.tier || 'bronze').toLowerCase() === 'bronze',
      },
      {
        id: 'silver',
        title: 'Silver Tier',
        color: '#64748b',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        icon: <Award className="h-4 w-4 text-slate-500" />,
        matcher: (item) => item.loyalty?.tier?.toLowerCase() === 'silver',
      },
      {
        id: 'gold',
        title: 'Gold Tier (VIP)',
        color: '#f59e0b',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        icon: <Sparkles className="h-4 w-4 text-amber-500" />,
        matcher: (item) => item.loyalty?.tier?.toLowerCase() === 'gold',
      },
    ],
    []
  );

  // 7. Saved System Presets
  const initialPresets: SavedPreset[] = useMemo(
    () => [
      {
        id: 'preset-vip',
        name: 'VIP Gold Customers',
        isSystem: true,
        filters: {
          search: '',
          quickFilter: 'vip',
          advanced: {},
          groupBy: null,
          viewMode: 'grid',
          sortField: 'loyalty.points',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-telegram',
        name: 'Telegram Connected',
        isSystem: true,
        filters: {
          search: '',
          quickFilter: 'telegram',
          advanced: {},
          groupBy: null,
          viewMode: 'table',
          sortField: 'lastSeen',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-spenders',
        name: 'Top Spenders',
        isSystem: true,
        filters: {
          search: '',
          quickFilter: 'all',
          advanced: { 'stats.totalSpent': { min: 1000 } },
          groupBy: null,
          viewMode: 'table',
          sortField: 'stats.totalSpent',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
    ],
    []
  );

  // 8. Bulk Actions
  const bulkActions: BulkAction<CustomerSession>[] = useMemo(
    () => [
      {
        id: 'send_message',
        label: 'Send Broadcast',
        icon: <SendHorizontal className="h-4 w-4 text-sky-500" />,
        variant: 'default',
        onClick: (selectedRows, clearSelection) => {
          const telegramUsers = selectedRows.filter(
            (c) => c.telegram?.linked || c.telegram?.username
          );
          if (telegramUsers.length === 0) {
            toast.warning('None of the selected customers have a linked Telegram account.');
            return;
          }
          toast.success(
            `Broadcast queue created for ${telegramUsers.length} Telegram connected customer(s).`
          );
          clearSelection();
        },
      },
      {
        id: 'assign_campaign',
        label: 'Assign Campaign',
        icon: <Tag className="h-4 w-4 text-primary" />,
        variant: 'secondary',
        onClick: (selectedRows, clearSelection) => {
          toast.success(
            `Added ${selectedRows.length} customer(s) to promotional loyalty campaign.`
          );
          clearSelection();
        },
      },
      {
        id: 'export_contacts',
        label: 'Export Contacts',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline',
        onClick: (selectedRows, clearSelection) => {
          const rows = selectedRows.map((c) => ({
            ID: c._id,
            Name: c.fullName || 'Guest',
            Phone: c.phone || '',
            Telegram: c.telegram?.username ? `@${c.telegram.username}` : '',
            Tier: c.loyalty?.tier || 'Bronze',
            Points: c.loyalty?.points || 0,
            Orders: c.stats?.totalOrders || 0,
            TotalSpent: c.stats?.totalSpent || 0,
            Source: c.source || 'guest',
          }));
          const csvHeader = Object.keys(rows[0] || {}).join(',');
          const csvBody = rows
            .map((row) =>
              Object.values(row)
                .map((val) => `"${String(val).replace(/"/g, '""')}"`)
                .join(',')
            )
            .join('\n');
          const blob = new Blob([`${csvHeader}\n${csvBody}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `customer_contacts_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${selectedRows.length} contacts to CSV.`);
          clearSelection();
        },
      },
    ],
    []
  );

  // 9. Custom Card Renderer (Grid View)
  const renderCustomerCard = (
    customer: CustomerSession,
    _isSelected: boolean,
    _onSelect: (checked: boolean) => void
  ) => {
    const isTelegramLinked = Boolean(
      customer.telegram?.linked || customer.telegram?.username
    );
    const telegramHandle = customer.telegram?.username;
    const avatarSrc =
      customer.telegram?.profilePic ||
      (customer.profileImage !== '/images/default-avatar.png'
        ? customer.profileImage
        : undefined);
    const isVip = customer.loyalty?.tier?.toLowerCase() === 'gold';
    const favorites = getFavoriteMeals(customer);

    return (
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-3">
          {/* Header row: Avatar + Name + Tier */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Avatar
                  className={`h-11 w-11 border ${
                    isVip
                      ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/25'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <AvatarImage src={avatarSrc} alt={customer.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(customer.fullName, telegramHandle)}
                  </AvatarFallback>
                </Avatar>
                {isTelegramLinked && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 bg-sky-500 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900"
                    title="Telegram Linked"
                  >
                    <SendHorizontal className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {customer.fullName && customer.fullName !== 'Guest'
                      ? customer.fullName
                      : customer.telegram?.firstName || 'Guest Customer'}
                  </h4>
                  {isVip && (
                    <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                    {customer.source || 'guest'}
                  </Badge>
                  {customer.currentTable && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-1">
                      <UtensilsCrossed className="h-2.5 w-2.5 text-amber-500" /> Seated
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {getTierBadge(customer.loyalty?.tier)}
          </div>

          {/* Contact / Telegram info */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <SendHorizontal className="h-3 w-3 text-sky-500" /> Telegram
              </span>
              {telegramHandle ? (
                <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">
                  @{telegramHandle}
                </span>
              ) : isTelegramLinked ? (
                <span className="text-sky-600 dark:text-sky-400 font-medium">Linked</span>
              ) : (
                <span className="text-slate-400 italic">Not connected</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> Phone
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {customer.phone || '—'}
              </span>
            </div>
          </div>

          {/* Stats Bar (Spent, Orders, Points) */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400">Total Spent</p>
              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                ETB {(customer.stats?.totalSpent ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Orders</p>
              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {customer.stats?.totalOrders ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Points</p>
              <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {customer.loyalty?.points ?? 0} pts
              </p>
            </div>
          </div>

          {/* Favorites Tags */}
          {favorites.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Heart className="h-2.5 w-2.5 text-rose-500 fill-rose-500" /> Favorite Dishes:
              </p>
              <div className="flex flex-wrap gap-1">
                {favorites.slice(0, 2).map((fav, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 truncate max-w-[120px]"
                  >
                    {fav}
                  </Badge>
                ))}
                {favorites.length > 2 && (
                  <span className="text-[10px] text-slate-400 font-mono self-center">
                    +{favorites.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          {isTelegramLinked && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5 text-sky-600 border-sky-500/30 hover:bg-sky-500/10 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers/telegram-chat?customerId=${customer._id}`);
              }}
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              Chat
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-slate-500 rounded-xl"
            title="View History"
            onClick={(e) => {
              e.stopPropagation();
              setHistoryCustomer(customer);
            }}
          >
            <History className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-1 h-8 text-xs gap-1 font-semibold rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/${customer._id}`);
            }}
          >
            Details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  // 10. Custom List Item Renderer (List View)
  const renderCustomerListItem = (
    customer: CustomerSession,
    _isSelected: boolean,
    _onSelect: (checked: boolean) => void
  ) => {
    const isTelegramLinked = Boolean(
      customer.telegram?.linked || customer.telegram?.username
    );
    const telegramHandle = customer.telegram?.username;
    const avatarSrc =
      customer.telegram?.profilePic ||
      (customer.profileImage !== '/images/default-avatar.png'
        ? customer.profileImage
        : undefined);
    const isVip = customer.loyalty?.tier?.toLowerCase() === 'gold';
    const favorites = getFavoriteMeals(customer);

    return (
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Avatar + Profile */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Avatar
              className={`h-9 w-9 border ${
                isVip
                  ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <AvatarImage src={avatarSrc} alt={customer.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {getInitials(customer.fullName, telegramHandle)}
              </AvatarFallback>
            </Avatar>
            {isTelegramLinked && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-sky-500 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900">
                <SendHorizontal className="h-2 w-2" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {customer.fullName && customer.fullName !== 'Guest'
                  ? customer.fullName
                  : customer.telegram?.firstName || 'Guest Customer'}
              </span>
              {isVip && (
                <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
              )}
              {getTierBadge(customer.loyalty?.tier)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              {telegramHandle ? (
                <span className="text-sky-600 dark:text-sky-400 font-mono font-medium">
                  @{telegramHandle}
                </span>
              ) : (
                <span>{customer.phone || customer.source || 'guest'}</span>
              )}
              {favorites.length > 0 && (
                <span className="hidden sm:inline text-rose-500 flex items-center gap-0.5">
                  • <Heart className="h-2.5 w-2.5 fill-rose-500 inline" /> {favorites[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Metrics + Action buttons */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] text-slate-400">Spent</p>
              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                ETB {(customer.stats?.totalSpent ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Points</p>
              <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {customer.loyalty?.points ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {isTelegramLinked && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-sky-600 hover:bg-sky-500/10 rounded-xl"
                title="Chat on Telegram"
                onClick={() => navigate(`/customers/telegram-chat?customerId=${customer._id}`)}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-xl"
              title="History"
              onClick={() => setHistoryCustomer(customer)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-2.5 text-xs font-semibold rounded-xl"
              onClick={() => navigate(`/customers/${customer._id}`)}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer relationships, Telegram messaging, VIP loyalty tiers, favorite dishes, and lifetime spend"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Summary DataCards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Customers"
            value={isLoading ? '...' : customers.length}
            icon={<User className="h-5 w-5" />}
            theme="primary"
            subtitle="Registered guest & member accounts"
            isLoading={isLoading}
          />

          <DataCard
            title="Telegram Linked"
            value={isLoading ? '...' : telegramLinkedCount}
            icon={<SendHorizontal className="h-5 w-5" />}
            theme="sky"
            trend={{
              value: `${customers.length ? Math.round((telegramLinkedCount / customers.length) * 100) : 0}%`,
              label: 'of total base',
              isPositive: true,
            }}
            isLoading={isLoading}
          />

          <DataCard
            title="VIP (Gold Tier)"
            value={isLoading ? '...' : vipCount}
            icon={<Sparkles className="h-5 w-5" />}
            theme="amber"
            subtitle="High-tier reward members"
            isLoading={isLoading}
          />

          <DataCard
            title="Favorites Logged"
            value={isLoading ? '...' : favoritesCount}
            icon={<Heart className="h-5 w-5 fill-current" />}
            theme="rose"
            subtitle="With dish preference history"
            isLoading={isLoading}
          />
        </div>

        {/* Complete Unified DataViewSystem Component */}
        <DataViewSystem<CustomerSession>
          data={customers}
          rowKey="_id"
          entityName="customers"
          columns={columns}
          isLoading={isLoading}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search customers by name, phone, Telegram @username, or favorite dish..."
          searchFields={[
            'fullName',
            'phone',
            'source',
            'telegram.username',
            'telegram.firstName',
            'favoriteMeals',
            'tags',
          ]}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="lastSeen"
          defaultSortDirection="desc"
          kanbanColumns={kanbanColumns}
          presetStorageKey="customers_view_presets"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          renderCustomCard={renderCustomerCard}
          renderCustomListItem={renderCustomerListItem}
          exportFileName="restaurant_customers_export"
          emptyTitle="No customers found"
          emptyDescription="No customer profiles match the current filter or search criteria."
          emptyIcon={<Users className="h-8 w-8 text-slate-400" />}
          onItemClick={(customer) => navigate(`/customers/${customer._id}`)}
          paginated={true}
          pageSize={10}
        />
      </div>

      {/* History Dialog */}
      <Dialog open={!!historyCustomer} onOpenChange={(open) => !open && setHistoryCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <History className="h-4 w-4 text-primary" />
              {historyCustomer?.fullName && historyCustomer.fullName !== 'Guest'
                ? historyCustomer.fullName
                : historyCustomer?.telegram?.firstName || 'Guest Customer'}{' '}
              — Activity Timeline
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chronological log of account registration, Telegram links, and interactions.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-4 pr-1 pt-2">
            {historyCustomer?.history?.length ? (
              historyCustomer.history
                .slice()
                .sort(
                  (a: any, b: any) =>
                    new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
                )
                .map((entry: any) => (
                  <div key={entry._id || entry.id} className="flex gap-3 items-start">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shrink-0 ring-4 ring-primary/10" />
                    <div className="flex-1 space-y-0.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                          {entry.action?.replace(/_/g, ' ')}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {entry.addedAt
                            ? formatDistanceToNow(new Date(entry.addedAt), { addSuffix: true })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{entry.details}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                No activity history recorded for this customer yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerListPage;
