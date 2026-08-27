// src/features/Report/views/OrdersReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataCard } from '@/components/Common/DataCard';
import {
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  CheckCheck,
  AlertCircle,
  Timer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  useOrdersReportQuery,
  type ReportQueryParams,
  type OrdersReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_ORDERS_REPORT } from '../mockData';

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

interface OrdersReportViewProps {
  params: ReportQueryParams;
}

export const OrdersReportView: React.FC<OrdersReportViewProps> = ({ params }) => {
  const { data: reportResp, isLoading } = useOrdersReportQuery(params);

  const data: OrdersReportData = reportResp?.data?.summary ? reportResp.data : MOCK_ORDERS_REPORT;
  const { summary, breakdown } = data;

  const statusList = [
    { label: 'Pending', count: summary.ordersByStatus?.pending || 0, color: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Accepted', count: summary.ordersByStatus?.accepted || 0, color: 'bg-blue-500', text: 'text-blue-500' },
    { label: 'Preparing', count: summary.ordersByStatus?.preparing || 0, color: 'bg-orange-500', text: 'text-orange-500' },
    { label: 'Ready', count: summary.ordersByStatus?.ready || 0, color: 'bg-indigo-500', text: 'text-indigo-500' },
    { label: 'Completed', count: summary.ordersByStatus?.completed || 0, color: 'bg-emerald-500', text: 'text-emerald-500' },
    { label: 'Canceled', count: summary.ordersByStatus?.canceled || 0, color: 'bg-rose-500', text: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total Orders"
          value={formatNum(summary.totalOrders)}
          icon={<ShoppingCart className="h-5 w-5" />}
          theme="indigo"
          subtitle="All order channels combined"
          isLoading={isLoading}
        />

        <DataCard
          title="Completed Orders"
          value={formatNum(summary.ordersByStatus?.completed || 0)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          theme="emerald"
          subtitle={`${((summary.ordersByStatus?.completed / (summary.totalOrders || 1)) * 100).toFixed(1)}% fulfillment rate`}
          isLoading={isLoading}
        />

        <DataCard
          title="Avg Kitchen Prep Time"
          value={
            summary.averagePreparationTime !== null
              ? `${summary.averagePreparationTime.toFixed(1)} mins`
              : 'N/A'
          }
          icon={<Timer className="h-5 w-5" />}
          theme="amber"
          subtitle={
            summary.averagePreparationTime !== null
              ? `Sampled ${summary.ordersWithPreparationTime} tracked orders`
              : 'Requires kitchen stage timestamps'
          }
          isLoading={isLoading}
        />

        <DataCard
          title="Cancellation Rate"
          value={`${(summary.cancellationRate || 0).toFixed(1)}%`}
          icon={<XCircle className="h-5 w-5" />}
          theme="rose"
          subtitle={`${formatNum(summary.ordersByStatus?.canceled || 0)} canceled orders`}
          isLoading={isLoading}
        />
      </div>

      {/* Order Status Pipeline Breakdown */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Order Status Lifecycle Pipeline
            </h3>
            <p className="text-xs text-slate-500">Distribution across active and resolved stages</p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {formatNum(summary.totalOrders)} Total Records
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statusList.map((st) => (
            <div
              key={st.label}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${st.color}`} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {st.label}
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {formatNum(st.count)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {((st.count / (summary.totalOrders || 1)) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Orders Volume Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Order Volume & Completion Velocity
          </CardTitle>
          <CardDescription className="text-xs">
            Volume trend per {params.groupBy || 'day'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [formatNum(Number(val)), name]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Legend />
                <Bar
                  dataKey="orderCount"
                  name="Total Orders"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="ordersByStatus.completed"
                  name="Completed Orders"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="ordersByStatus.canceled"
                  name="Canceled"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders Periodic Breakdown Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Orders Breakdown Ledger
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Period</th>
                <th className="p-3.5">Total Orders</th>
                <th className="p-3.5">Completed</th>
                <th className="p-3.5">Preparing / Active</th>
                <th className="p-3.5">Canceled</th>
                <th className="p-3.5 pr-5">Cancel Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {breakdown?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5 font-mono font-medium text-slate-900 dark:text-white">
                    {row.period}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {formatNum(row.orderCount)}
                  </td>
                  <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatNum(row.ordersByStatus?.completed || 0)}
                  </td>
                  <td className="p-3.5 text-amber-600 font-medium">
                    {formatNum((row.ordersByStatus?.preparing || 0) + (row.ordersByStatus?.pending || 0) + (row.ordersByStatus?.accepted || 0))}
                  </td>
                  <td className="p-3.5 text-rose-500 font-medium">
                    {formatNum(row.ordersByStatus?.canceled || 0)}
                  </td>
                  <td className="p-3.5 pr-5 font-mono text-slate-700 dark:text-slate-300">
                    {(row.cancellationRate || 0).toFixed(1)}%
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
