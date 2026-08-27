// src/features/Overview/Pages/Overview.tsx
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { useDashboardQuery } from '@/api/Queries/analyticsQueries';
import { useTablesQuery } from '@/api/Queries/tableQueries';
import { useOrdersQuery } from '@/api/Queries/orderQuery';

import { DataCard } from '@/components/Common/DataCard';
import PageHeader from '@/components/Layout/PageHeader';
import { TopFoodsCard } from '../Components/TopFoodsCard';
import { CustomerGrowthCard } from '../Components/CustomerGrowthCard';
import { RecentOrdersCard } from '../Components/RecentOrdersCard';
import { DashboardError } from '../Components/DashboardError';
import { useTranslation } from '@/locales/i18n';

import {
  TrendingUp,
  ShoppingBag,
  Users,
  CircleDollarSign,
  CalendarDays,
  BarChart3,
  Armchair,
} from 'lucide-react';

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const formatNum = (n: number) =>
  new Intl.NumberFormat('en-ET').format(n ?? 0);

// ─── Component ────────────────────────────────────────────────────────────────

const Overview = () => {
  const { t } = useTranslation('overview');
  // Branch selected in the header
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // ── Data queries ──────────────────────────────────────────────────────────
  const {
    data: dashboard,
    isLoading: dashLoading,
    isError: dashError,
    error: dashErr,
    refetch: retryDash,
  } = useDashboardQuery(currentBranchId);

  const { data: tables = [], isLoading: tablesLoading } =
    useTablesQuery(currentBranchId);

  const { data: ordersResp, isLoading: ordersLoading } =
    useOrdersQuery(currentBranchId ? { branchId: currentBranchId } : undefined);

  // ── Derived values ────────────────────────────────────────────────────────
  const rev = dashboard?.revenue;

  const activeTables = tables.filter((t) => t.status === 'occupied').length;
  const totalTables  = tables.filter((t) => t.isActive).length;

  const recentOrders = (ordersResp?.orders ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    )
    .slice(0, 8);

  // ── Error state ───────────────────────────────────────────────────────────
  if (dashError) {
    const msg =
      (dashErr as any)?.response?.data?.message ??
      'Could not load dashboard data';
    return <DashboardError message={msg} onRetry={retryDash} />;
  }

  const isLoading = dashLoading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page header ── */}
      <PageHeader
        title={t('dashboard')}
        subtitle={
          currentBranchId
            ? t('branchData')
            : t('allBranchesData')
        }
      />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Row 1 — Revenue KPIs ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('revenue')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title={t('todaysSales')}
            value={formatETB(rev?.today.revenue ?? 0)}
            subtitle={t('ordersCount', { count: formatNum(rev?.today.orders ?? 0) })}
            icon={<CircleDollarSign className="h-5 w-5" />}
            theme="emerald"
            isLoading={isLoading}
          />
          <DataCard
            title={t('thisWeek')}
            value={formatETB(rev?.week.revenue ?? 0)}
            subtitle={t('ordersCount', { count: formatNum(rev?.week.orders ?? 0) })}
            icon={<TrendingUp className="h-5 w-5" />}
            theme="sky"
            isLoading={isLoading}
          />
          <DataCard
            title={t('thisMonth')}
            value={formatETB(rev?.month.revenue ?? 0)}
            subtitle={t('ordersCount', { count: formatNum(rev?.month.orders ?? 0) })}
            icon={<CalendarDays className="h-5 w-5" />}
            theme="indigo"
            isLoading={isLoading}
          />
          <DataCard
            title={t('thisYear')}
            value={formatETB(rev?.year.revenue ?? 0)}
            subtitle={t('ordersCount', { count: formatNum(rev?.year.orders ?? 0) })}
            icon={<BarChart3 className="h-5 w-5" />}
            theme="purple"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ── Row 2 — Operations KPIs ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('operations')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title={t('totalOrdersToday')}
            value={formatNum(rev?.today.orders ?? 0)}
            subtitle={t('completedOrders')}
            icon={<ShoppingBag className="h-5 w-5" />}
            theme="primary"
            isLoading={isLoading}
          />
          <DataCard
            title={t('activeTables')}
            value={tablesLoading ? '—' : `${activeTables} / ${totalTables}`}
            subtitle={t('occupiedRightNow')}
            icon={<Armchair className="h-5 w-5" />}
            theme="amber"
            isLoading={tablesLoading}
          />
          <DataCard
            title={t('uniqueCustomersToday')}
            value={formatNum(rev?.today.uniqueCustomers ?? 0)}
            subtitle="Visitors today"
            icon={<Users className="h-5 w-5" />}
            theme="sky"
            isLoading={isLoading}
          />
          <DataCard
            title={t('monthlyCustomers')}
            value={formatNum(rev?.month.uniqueCustomers ?? 0)}
            subtitle={t('thisMonthSuffix', {
              count: formatNum(
                (dashboard?.customerGrowth.new ?? 0) +
                (dashboard?.customerGrowth.returning ?? 0)
              ),
            })}
            icon={<Users className="h-5 w-5" />}
            theme="indigo"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ── Row 3 — Top foods + Customer growth ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopFoodsCard
          items={dashboard?.topFoods ?? []}
          loading={isLoading}
        />
        <CustomerGrowthCard
          growth={
            dashboard?.customerGrowth ?? { new: 0, returning: 0 }
          }
          loading={isLoading}
        />
      </section>

      {/* ── Row 4 — Recent orders (full width) ── */}
      <section>
        <RecentOrdersCard
          orders={recentOrders}
          loading={ordersLoading}
        />
      </section>
      </main>
    </>
  );
};

export default Overview;
