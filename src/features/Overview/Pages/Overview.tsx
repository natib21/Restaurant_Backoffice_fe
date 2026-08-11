// src/features/Overview/Pages/Overview.tsx
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { useDashboardQuery } from '@/api/Queries/analyticsQueries';
import { useTablesQuery } from '@/api/Queries/tableQueries';
import { useOrdersQuery } from '@/api/Queries/orderQuery';

import { StatCard } from '../Components/StatCard';
import { TopFoodsCard } from '../Components/TopFoodsCard';
import { CustomerGrowthCard } from '../Components/CustomerGrowthCard';
import { RecentOrdersCard } from '../Components/RecentOrdersCard';
import { DashboardError } from '../Components/DashboardError';

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
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {currentBranchId
            ? 'Showing data for selected branch'
            : 'Showing aggregated data for all branches'}
        </p>
      </div>

      {/* ── Row 1 — Revenue KPIs ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Revenue
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatETB(rev?.today.revenue ?? 0)}
            sub={`${formatNum(rev?.today.orders ?? 0)} orders`}
            icon={CircleDollarSign}
            loading={isLoading}
          />
          <StatCard
            title="This Week"
            value={formatETB(rev?.week.revenue ?? 0)}
            sub={`${formatNum(rev?.week.orders ?? 0)} orders`}
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            title="This Month"
            value={formatETB(rev?.month.revenue ?? 0)}
            sub={`${formatNum(rev?.month.orders ?? 0)} orders`}
            icon={CalendarDays}
            loading={isLoading}
          />
          <StatCard
            title="This Year"
            value={formatETB(rev?.year.revenue ?? 0)}
            sub={`${formatNum(rev?.year.orders ?? 0)} orders`}
            icon={BarChart3}
            loading={isLoading}
          />
        </div>
      </section>

      {/* ── Row 2 — Operations KPIs ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Operations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders Today"
            value={formatNum(rev?.today.orders ?? 0)}
            sub="completed orders"
            icon={ShoppingBag}
            loading={isLoading}
          />
          <StatCard
            title="Active Tables"
            value={tablesLoading ? '—' : `${activeTables} / ${totalTables}`}
            sub="occupied right now"
            icon={Armchair}
            loading={tablesLoading}
          />
          <StatCard
            title="Unique Customers Today"
            value={formatNum(rev?.today.uniqueCustomers ?? 0)}
            icon={Users}
            loading={isLoading}
          />
          <StatCard
            title="Monthly Customers"
            value={formatNum(rev?.month.uniqueCustomers ?? 0)}
            sub={`${formatNum(
              (dashboard?.customerGrowth.new ?? 0) +
              (dashboard?.customerGrowth.returning ?? 0)
            )} this month`}
            icon={Users}
            loading={isLoading}
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
    </div>
  );
};

export default Overview;
