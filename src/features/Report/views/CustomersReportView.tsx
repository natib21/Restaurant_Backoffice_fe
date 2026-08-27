// src/features/Report/views/CustomersReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataCard } from '@/components/Common/DataCard';
import {
  Users,
  UserPlus,
  UserCheck,
  Crown,
  Sparkles,
  DollarSign,
  PieChart as PieIcon,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  useCustomersReportQuery,
  type ReportQueryParams,
  type CustomersReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_CUSTOMERS_REPORT } from '../mockData';

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

interface CustomersReportViewProps {
  params: ReportQueryParams;
}

export const CustomersReportView: React.FC<CustomersReportViewProps> = ({ params }) => {
  const { data: reportResp, isLoading } = useCustomersReportQuery(params);

  const data: CustomersReportData = reportResp?.data?.summary ? reportResp.data : MOCK_CUSTOMERS_REPORT;
  const { summary, breakdown } = data;

  const returningRate = ((summary.returningCustomerCount / (summary.totalCustomers || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total Active Guests"
          value={formatNum(summary.totalCustomers)}
          icon={<Users className="h-5 w-5" />}
          theme="indigo"
          subtitle="Served during selected timeframe"
          isLoading={isLoading}
        />

        <DataCard
          title="New Guests"
          value={formatNum(summary.newCustomerCount)}
          icon={<UserPlus className="h-5 w-5" />}
          theme="emerald"
          subtitle="First-time dining guests"
          isLoading={isLoading}
        />

        <DataCard
          title="Returning Guests"
          value={formatNum(summary.returningCustomerCount)}
          icon={<UserCheck className="h-5 w-5" />}
          theme="amber"
          subtitle={`${returningRate}% repeat patron rate`}
          isLoading={isLoading}
        />

        <DataCard
          title="Median Spend (50th %)"
          value={formatETB(summary.spendDistribution?.percentile50th || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="sky"
          subtitle={`Top 10%: ${formatETB(summary.spendDistribution?.percentile90th || 0)}+`}
          isLoading={isLoading}
        />
      </div>

      {/* Spend Distribution Percentiles */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span>Customer Spend Distribution Curve</span>
          </h3>
          <p className="text-xs text-slate-500">
            Statistical breakdown of customer expenditure quartiles
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500">25th Percentile</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatETB(summary.spendDistribution?.percentile25th || 0)}
            </p>
            <p className="text-[10px] text-slate-400">Entry spending tier</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500">50th Percentile (Median)</span>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatETB(summary.spendDistribution?.percentile50th || 0)}
            </p>
            <p className="text-[10px] text-slate-400">Typical customer order value</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500">75th Percentile</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatETB(summary.spendDistribution?.percentile75th || 0)}
            </p>
            <p className="text-[10px] text-slate-400">High-tier regular patrons</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              90th Percentile (VIP)
            </span>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatETB(summary.spendDistribution?.percentile90th || 0)}
            </p>
            <p className="text-[10px] text-amber-600/70">Top 10% highest spenders</p>
          </div>
        </div>
      </Card>

      {/* Retention Dynamics Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Guest Acquisition & Retention Trajectory
          </CardTitle>
          <CardDescription className="text-xs">
            New vs. Returning guests per {params.groupBy || 'day'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={breakdown}>
                <defs>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [formatNum(Number(val)), name]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="returningCustomers"
                  name="Returning Guests"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#retGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  name="New Guests"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#newGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 VIP Customers Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-500" />
              <span>Top Patron & VIP Spender Leaderboard</span>
            </CardTitle>
            <CardDescription className="text-xs">Highest cumulative revenue contributors</CardDescription>
          </div>
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 text-xs">
            Top Patrons
          </Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Rank & Guest</th>
                <th className="p-3.5">Customer Type</th>
                <th className="p-3.5 text-center">Orders Placed</th>
                <th className="p-3.5 pr-5 text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.topCustomers?.map((cust, idx) => (
                <tr key={cust.customerId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <span>{cust.customerName}</span>
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        cust.customerType === 'returning'
                          ? 'border-indigo-200 text-indigo-600 bg-indigo-50/50'
                          : 'border-emerald-200 text-emerald-600 bg-emerald-50/50'
                      }`}
                    >
                      {cust.customerType}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                    {cust.orderCount}
                  </td>
                  <td className="p-3.5 pr-5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatETB(cust.totalSpend)}
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
