import React, { useMemo } from 'react';
import {
  Users,
  Phone,
  Mail,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  Star,
  Store,
  Tag,
  CalendarDays,
  Flame,
  Moon,
  Crown,
  Download,
  UserCircle,
  BadgeCheck,
  Shield,
  Sparkles,
} from 'lucide-react';
import { format, isWithinInterval, subDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';

type CustomerRow = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastVisit: string;
  visits: number;
  tier: 'bronze' | 'silver' | 'gold';
  signUpDate: string;
  branch: string;
  tagged: string[];
};

const BRANCH_OPTIONS = ['Main Branch', 'Downtown', 'Airport Lounge', 'Riverside'];
const TIER_OPTIONS: CustomerRow['tier'][] = ['bronze', 'silver', 'gold'];
const TAG_OPTIONS = ['VIP', 'Birthday Club', 'Vegetarian', 'Corporate', 'Delivery', 'Dine-In Regular', 'First Time', 'Feedback'];

const generateMockCustomers = (): CustomerRow[] => {
  const firstNames = ['Dawit', 'Selam', 'Yared', 'Martha', 'Nahom', 'Tsion', 'Abel', 'Hana', 'Biruk', 'Sofia', 'Kidus', 'Betty', 'Samrawit', 'Eyob', 'Mikayla', 'Teddy', 'Helen', 'Meron', 'Fitsum', 'Bilen'];
  const lastNames = ['Abebe', 'Tekle', 'Mengistu', 'Bekele', 'Girma', 'Haile', 'Tesfaye', 'Kebede', 'Desta', 'Wolde', 'Seyoum', 'Tadesse', 'Gebeyehu', 'Assefa', 'Legesse', 'Debebe', 'Kiros', 'Negash', 'Getachew', 'Adane'];
  const now = new Date();
  const data: CustomerRow[] = [];

  for (let i = 0; i < 20; i++) {
    const totalOrders = Math.floor(2 + Math.random() * 148);
    const totalSpent = Math.round((totalOrders * (180 + Math.random() * 820)) * 100) / 100;
    const avgOrderValue = Math.round((totalSpent / totalOrders) * 100) / 100;
    const visits = totalOrders + Math.floor(Math.random() * 5);
    const tier: CustomerRow['tier'] = totalSpent > 80000 ? 'gold' : totalSpent > 25000 ? 'silver' : 'bronze';
    const lastVisit = subDays(now, Math.floor(Math.random() * 120)).toISOString();
    const signUpDate = subDays(now, Math.floor(30 + Math.random() * 400)).toISOString();
    const tagCount = Math.floor(Math.random() * 3);
    const tagged = TAG_OPTIONS.slice(0, tagCount).filter(() => Math.random() > 0.5);
    if (tier === 'gold' && !tagged.includes('VIP') && Math.random() > 0.3) tagged.push('VIP');

    data.push({
      _id: `cust-${1000 + i}`,
      name: `${firstNames[i]} ${lastNames[(i * 3) % lastNames.length]}`,
      phone: `+251 ${911 + Math.floor(Math.random() * 8)}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      email: `${firstNames[i].toLowerCase()}.${lastNames[(i * 3) % lastNames.length].toLowerCase()}${i}@gmail.com`,
      totalOrders,
      totalSpent,
      avgOrderValue,
      lastVisit,
      visits,
      tier,
      signUpDate,
      branch: BRANCH_OPTIONS[i % BRANCH_OPTIONS.length],
      tagged,
    });
  }
  return data;
};

const CustomerAnalyticsPage: React.FC = () => {
  const customers = useMemo(() => generateMockCustomers(), []);
  const isLoading = false;

  const stats = useMemo(() => {
    const total = customers.length;
    const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
    const avgOrder = customers.reduce((s, c) => s + c.avgOrderValue, 0) / Math.max(customers.length, 1);
    const bronze = customers.filter(c => c.tier === 'bronze').length;
    const silver = customers.filter(c => c.tier === 'silver').length;
    const gold = customers.filter(c => c.tier === 'gold').length;
    return { total, totalSpent, avgOrder, bronze, silver, gold };
  }, [customers]);

  const bronzeMatcher = (c: CustomerRow) => c.tier === 'bronze';
  const silverMatcher = (c: CustomerRow) => c.tier === 'silver';
  const goldMatcher = (c: CustomerRow) => c.tier === 'gold';
  const active30Matcher = (c: CustomerRow) => isWithinInterval(new Date(c.lastVisit), { start: subDays(new Date(), 30), end: new Date() });
  const inactive90Matcher = (c: CustomerRow) => new Date(c.lastVisit) < subDays(startOfDay(new Date()), 90);
  const highValueMatcher = (c: CustomerRow) => c.totalSpent > 50000;

  const quickFilters: QuickFilterOption<CustomerRow>[] = [
    { key: 'all', label: 'All Customers', count: customers.length, icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'bronze', label: 'Bronze', count: customers.filter(bronzeMatcher).length, icon: <Shield className="h-3.5 w-3.5" />, color: 'amber', matcher: bronzeMatcher },
    { key: 'silver', label: 'Silver', count: customers.filter(silverMatcher).length, icon: <Award className="h-3.5 w-3.5" />, color: 'slate', matcher: silverMatcher },
    { key: 'gold', label: 'Gold', count: customers.filter(goldMatcher).length, icon: <Crown className="h-3.5 w-3.5" />, color: 'yellow', matcher: goldMatcher },
    { key: 'active-30d', label: 'Active (30d)', count: customers.filter(active30Matcher).length, icon: <Flame className="h-3.5 w-3.5" />, color: 'emerald', matcher: active30Matcher },
    { key: 'inactive-90d', label: 'Inactive (90d+)', count: customers.filter(inactive90Matcher).length, icon: <Moon className="h-3.5 w-3.5" />, color: 'rose', matcher: inactive90Matcher },
    { key: 'high-value', label: 'High Value', count: customers.filter(highValueMatcher).length, icon: <Sparkles className="h-3.5 w-3.5" />, color: 'purple', matcher: highValueMatcher },
  ];

  const filterFields: AdvancedFilterField[] = [
    { id: 'tier', label: 'Loyalty Tier', type: 'multi-select', options: TIER_OPTIONS.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t })) },
    { id: 'branch', label: 'Primary Branch', type: 'multi-select', options: BRANCH_OPTIONS.map(b => ({ label: b, value: b })) },
    { id: 'totalSpent', label: 'Total Spent (ETB)', type: 'number-range', min: 0, max: 500000, step: 1000, prefix: 'ETB' },
    { id: 'totalOrders', label: 'Orders Count', type: 'number-range', min: 0, max: 500, step: 1 },
    { id: 'avgOrderValue', label: 'Avg Order Value', type: 'number-range', min: 0, max: 5000, step: 50, prefix: 'ETB' },
    { id: 'signUpDate', label: 'Sign-up Date', type: 'date-range' },
    { id: 'lastVisit', label: 'Last Visit', type: 'date-range' },
    { id: 'tagged', label: 'Tags', type: 'multi-select', options: TAG_OPTIONS.map(t => ({ label: t, value: t })) },
  ];

  const groupByOptions: GroupByOption<CustomerRow>[] = [
    { id: 'tier', label: 'By Loyalty Tier', accessor: (c) => c.tier || 'N/A', icon: <Award className="h-3.5 w-3.5" /> },
    { id: 'branch', label: 'By Branch', accessor: (c) => c.branch || 'N/A', icon: <Store className="h-3.5 w-3.5" /> },
    { id: 'monthJoined', label: 'By Sign-up Month', accessor: (c) => format(new Date(c.signUpDate), 'MMMM yyyy'), icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];

  const sortOptions: SortOption<CustomerRow>[] = [
    { id: 'name', label: 'Name (A-Z)', field: 'name' },
    { id: 'spentDesc', label: 'Total Spent (High to Low)', field: 'totalSpent', direction: 'desc' },
    { id: 'ordersDesc', label: 'Orders (Most)', field: 'totalOrders', direction: 'desc' },
    { id: 'aovDesc', label: 'Avg Order Value (High)', field: 'avgOrderValue', direction: 'desc' },
    { id: 'recentVisit', label: 'Last Visit (Recent)', field: 'lastVisit', direction: 'desc' },
    { id: 'signUpDesc', label: 'Sign-up (Newest)', field: 'signUpDate', direction: 'desc' },
    { id: 'visitsDesc', label: 'Visits (Most)', field: 'visits', direction: 'desc' },
  ];

  const kanbanColumns: KanbanColumnConfig<CustomerRow>[] = [
    {
      id: 'bronze', title: 'Bronze', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200',
      icon: <Shield className="h-4 w-4" />, matcher: bronzeMatcher,
    },
    {
      id: 'silver', title: 'Silver', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-300',
      icon: <Award className="h-4 w-4" />, matcher: silverMatcher,
    },
    {
      id: 'gold', title: 'Gold', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200',
      icon: <Crown className="h-4 w-4" />, matcher: goldMatcher,
    },
  ];

  const initialPresets: SavedPreset[] = [
    {
      id: 'preset-vip-lookout',
      name: 'VIP / Gold Customers',
      isSystem: true,
      filters: { quickFilter: 'gold', sortField: 'totalSpent', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-reengagement',
      name: 'Re-engagement List',
      isSystem: true,
      filters: { quickFilter: 'inactive-90d', sortField: 'totalSpent', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-top-spenders',
      name: 'Top Spenders',
      isSystem: true,
      filters: { quickFilter: 'high-value', groupBy: 'branch', sortField: 'totalSpent', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-new-customers',
      name: 'Recent Sign-ups',
      isSystem: true,
      filters: { sortField: 'signUpDate', sortDirection: 'desc', viewMode: 'table' },
    },
  ];

  const bulkActions: BulkAction<CustomerRow>[] = [
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Customer ID,Name,Phone,Email,Total Orders,Total Spent,Avg Order Value,Last Visit,Visits,Loyalty Tier,Sign-up Date,Branch,Tags';
        const rows = selectedRows.map((c) =>
          [
            c._id, c.name, c.phone, c.email, c.totalOrders,
            c.totalSpent.toFixed(2), c.avgOrderValue.toFixed(2),
            format(new Date(c.lastVisit), 'yyyy-MM-dd'), c.visits,
            c.tier, format(new Date(c.signUpDate), 'yyyy-MM-dd'),
            c.branch, c.tagged.join('; '),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Customer_Analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Export successful', { description: `${selectedRows.length} customers exported to CSV` });
        clearSelection();
      },
    },
  ];

  const getTierBadge = (tier: CustomerRow['tier']) => {
    switch (tier) {
      case 'gold':
        return (
          <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-[10px] font-bold gap-1">
            <Crown className="h-3 w-3" /> Gold
          </Badge>
        );
      case 'silver':
        return (
          <Badge className="bg-slate-200/60 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300 border-slate-300 dark:border-slate-600 text-[10px] font-bold gap-1">
            <Award className="h-3 w-3" /> Silver
          </Badge>
        );
      case 'bronze':
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1">
            <Shield className="h-3 w-3" /> Bronze
          </Badge>
        );
    }
  };

  const columns: ColumnDef<CustomerRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      accessorKey: 'name',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-purple-400/20 flex items-center justify-center text-primary shrink-0 font-bold text-xs ring-2 ring-white dark:ring-slate-900">
            {c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{c.name}</p>
              {c.tier === 'gold' && <BadgeCheck className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Mail className="h-2.5 w-2.5" />
              <span className="truncate">{c.email || 'N/A'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      sortable: true,
      cell: (c) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{c.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      id: 'orders',
      header: 'Orders',
      sortable: true,
      accessorKey: 'totalOrders',
      cell: (c) => (
        <Badge variant="outline" className="font-mono text-[10px] font-bold gap-1">
          <ShoppingBag className="h-3 w-3" />
          {c.totalOrders}
        </Badge>
      ),
    },
    {
      id: 'totalSpent',
      header: 'Total Spent',
      sortable: true,
      accessorKey: 'totalSpent',
      cell: (c) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {c.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: 'aov',
      header: 'AOV',
      sortable: true,
      accessorKey: 'avgOrderValue',
      cell: (c) => (
        <div className="flex items-center gap-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ETB {c.avgOrderValue.toFixed(2)}
        </div>
      ),
    },
   {
      id: 'lastVisit',
      header: 'Last Visit',
      sortable: true,
      accessorKey: 'lastVisit',
      cell: (c) => {
        const last = new Date(c.lastVisit);
        const daysAgo = Math.floor((new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        const isRecent = daysAgo <= 30;
        return (
          <div className={`text-xs flex items-center gap-1 ${isRecent ? 'text-emerald-700 dark:text-emerald-400' : daysAgo <= 90 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}`}>
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <div>
              <p className="font-medium">{format(last, 'MMM d, yyyy')}</p>
              <p className="text-[10px] opacity-80">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</p>
            </div>
          </div>
        );
      },  // ← added closing brace before the comma
    },
    {
      id: 'visits',
      header: 'Visits',
      sortable: true,
      accessorKey: 'visits',
      cell: (c) => (
        <Badge variant="outline" className="font-mono text-[10px] font-bold gap-1">
          <Star className="h-3 w-3" />
          {c.visits}
        </Badge>
      ),
    },
    {
      id: 'tier',
      header: 'Loyalty Tier',
      sortable: true,
      cell: (c) => getTierBadge(c.tier),
    },
    {
      id: 'since',
      header: 'Since',
      sortable: true,
      accessorKey: 'signUpDate',
      cell: (c) => (
        <div className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{format(new Date(c.signUpDate), 'MMM yyyy')}</span>
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      sortable: true,
      cell: (c) => (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{c.branch || 'N/A'}</span>
        </div>
      ),
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: (c) => (
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {c.tagged.length === 0 ? (
            <span className="text-[10px] text-slate-400 italic">No tags</span>
          ) : (
            c.tagged.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0.5 gap-0.5">
                <Tag className="h-2.5 w-2.5" />
                {t}
              </Badge>
            ))
          )}
          {c.tagged.length > 3 && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
              +{c.tagged.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Customer Analytics"
        subtitle="Segment patrons by loyalty, lifetime value, visit frequency, and branch behavior"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Customers"
            value={isLoading ? '...' : stats.total}
            icon={<Users className="h-5 w-5" />}
            theme="primary"
            subtitle="Total registered patrons"
            isLoading={isLoading}
          />
          <DataCard
            title="Total Spent"
            value={isLoading ? '...' : `ETB ${stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme="purple"
            subtitle="Cumulative lifetime revenue"
            isLoading={isLoading}
          />
          <DataCard
            title="Avg Order Value"
            value={isLoading ? '...' : `ETB ${stats.avgOrder.toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            theme="emerald"
            subtitle="Mean per-customer basket size"
            isLoading={isLoading}
          />
          <DataCard
            title="Loyalty Distribution"
            value={isLoading ? '...' : (
              <span className="text-xs font-bold flex items-center gap-2">
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] gap-1"><Shield className="h-3 w-3" />{stats.bronze}</Badge>
                <Badge className="bg-slate-200/60 text-slate-700 border-slate-300 text-[10px] gap-1"><Award className="h-3 w-3" />{stats.silver}</Badge>
                <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-[10px] gap-1"><Crown className="h-3 w-3" />{stats.gold}</Badge>
              </span>
            )}
            icon={<Award className="h-5 w-5" />}
            theme="amber"
            subtitle="Bronze · Silver · Gold counts"
            isLoading={isLoading}
          />
        </div>

        <DataViewSystem<CustomerRow>
          data={customers}
          rowKey="_id"
          entityName="Customers"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<UserCircle className="h-8 w-8 text-slate-400" />}
          emptyTitle="No customers found"
          emptyDescription="Customer records will populate here once they sign up or place orders."
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search name, phone, email, branch..."
          searchFields={['name', 'phone', 'email', 'branch']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="totalSpent"
          defaultSortDirection="desc"
          presetStorageKey="customerAnalytics"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="tier"
          exportFileName="Customer_Analytics"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default CustomerAnalyticsPage;
