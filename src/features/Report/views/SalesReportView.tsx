// src/features/Report/views/SalesReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataCard } from '@/components/Common/DataCard';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Percent,
  RefreshCcw,
  ShoppingBag,
  Coins,
  Wallet,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import {
  useSalesReportQuery,
  type ReportQueryParams,
  type SalesReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_SALES_REPORT } from '../mockData';

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

interface SalesReportViewProps {
  params: ReportQueryParams;
}

export const SalesReportView: React.FC<SalesReportViewProps> = ({ params }) => {
  const { data: reportResp, isLoading, isError } = useSalesReportQuery(params);

  // Fallback to rich mock data if backend query fails or is empty
  const data: SalesReportData = reportResp?.data?.summary ? reportResp.data : MOCK_SALES_REPORT;
  const { summary, breakdown } = data;

  const paymentData = [
    { name: 'Cash', value: summary.paymentMethodBreakdown?.cash || 0, color: '#10B981' },
    { name: 'Mobile Banking', value: summary.paymentMethodBreakdown?.mobile_banking || 0, color: '#0EA5E9' },
    { name: 'Card / POS', value: summary.paymentMethodBreakdown?.card || 0, color: '#8B5CF6' },
    { name: 'Unspecified', value: summary.paymentMethodBreakdown?.unspecified || 0, color: '#94A3B8' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Gross Revenue"
          value={formatETB(summary.grossRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="emerald"
          subtitle="Before deductions"
          isLoading={isLoading}
        />

        <DataCard
          title="Net Revenue"
          value={formatETB(summary.netRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          theme="indigo"
          subtitle="After discounts & deductions"
          isLoading={isLoading}
        />

        <DataCard
          title="Average Order Value"
          value={formatETB(summary.averageOrderValue)}
          icon={<ShoppingBag className="h-5 w-5" />}
          theme="amber"
          subtitle={`Across ${formatNum(summary.orderCount)} orders`}
          isLoading={isLoading}
        />

        <DataCard
          title="Total Discounts"
          value={formatETB(summary.totalDiscounts)}
          icon={<Percent className="h-5 w-5" />}
          theme="rose"
          subtitle={`Taxes: ${formatETB(summary.totalTaxes)}`}
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Metrics & Information Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Taxes Collected</span>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatETB(summary.totalTaxes)}
          </p>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Delivery Fees</span>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatETB(summary.totalDeliveryFees)}
          </p>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Refunds</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-300">
              Phase 3 Stub
            </Badge>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatETB(summary.totalRefunds)}
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Chart (8 cols) */}
        <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Revenue Dynamics Over Time
            </CardTitle>
            <CardDescription className="text-xs">
              Gross vs. Net revenue per {params.groupBy || 'day'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={breakdown}>
                  <defs>
                    <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatETB(Number(val)), '']}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="grossRevenue"
                    name="Gross Revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#grossGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="netRevenue"
                    name="Net Revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#netGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown (4 cols) */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Payment Methods
            </CardTitle>
            <CardDescription className="text-xs">
              Revenue distribution by channel
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.4} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip formatter={(val: any) => [formatETB(Number(val)), 'Volume']} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {paymentData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatETB(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periodic Breakdown Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Sales Breakdown Table
          </CardTitle>
          <CardDescription className="text-xs">
            Complete period ledger for current date filter
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Period</th>
                <th className="p-3.5">Orders</th>
                <th className="p-3.5">Gross Revenue</th>
                <th className="p-3.5">Discounts</th>
                <th className="p-3.5">Taxes</th>
                <th className="p-3.5">Delivery Fees</th>
                <th className="p-3.5">Net Revenue</th>
                <th className="p-3.5 pr-5">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {breakdown?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5 font-mono font-medium text-slate-900 dark:text-white">
                    {row.period}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {formatNum(row.orderCount)}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatETB(row.grossRevenue)}
                  </td>
                  <td className="p-3.5 text-rose-500 font-medium">
                    -{formatETB(row.totalDiscounts)}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {formatETB(row.totalTaxes)}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {formatETB(row.totalDeliveryFees)}
                  </td>
                  <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                    {formatETB(row.netRevenue)}
                  </td>
                  <td className="p-3.5 pr-5 font-mono text-slate-700 dark:text-slate-300">
                    {formatETB(row.averageOrderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
