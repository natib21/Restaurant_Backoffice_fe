// src/features/Report/views/DeliveryReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataCard } from '@/components/Common/DataCard';
import {
  Truck,
  Timer,
  DollarSign,
  CheckCircle2,
  Navigation,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  useDeliveryReportQuery,
  type ReportQueryParams,
  type DeliveryReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_DELIVERY_REPORT } from '../mockData';

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

interface DeliveryReportViewProps {
  params: ReportQueryParams;
}

export const DeliveryReportView: React.FC<DeliveryReportViewProps> = ({ params }) => {
  const { data: reportResp, isLoading } = useDeliveryReportQuery(params);

  const data: DeliveryReportData = reportResp?.data?.summary ? reportResp.data : MOCK_DELIVERY_REPORT;
  const { summary, breakdown } = data;

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Delivery Orders"
          value={formatNum(summary.deliveryOrderCount)}
          icon={<Truck className="h-5 w-5" />}
          theme="indigo"
          subtitle="Fulfilled door-to-door orders"
          isLoading={isLoading}
        />

        <DataCard
          title="Delivery Fees Collected"
          value={formatETB(summary.totalDeliveryFees)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="emerald"
          subtitle="Total courier surcharges"
          isLoading={isLoading}
        />

        <DataCard
          title="Avg Delivery Duration"
          value={
            summary.averageDeliveryDuration !== null
              ? `${summary.averageDeliveryDuration.toFixed(1)} mins`
              : 'N/A'
          }
          icon={<Timer className="h-5 w-5" />}
          theme="amber"
          subtitle={
            summary.averageDeliveryDuration !== null
              ? 'Dispatch to doorstep duration'
              : 'Requires driver timestamp tracking'
          }
          isLoading={isLoading}
        />

        <DataCard
          title="On-Time Delivery SLA"
          value={
            summary.onTimeDeliveryPercentage !== null
              ? `${summary.onTimeDeliveryPercentage.toFixed(1)}%`
              : 'Pending SLA'
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          theme="sky"
          subtitle="Driver dispatch tracking phase"
          isLoading={isLoading}
        />
      </div>

      {/* Delivery Volume Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Delivery Order Volume & Surcharge Revenue
          </CardTitle>
          <CardDescription className="text-xs">
            Trends per {params.groupBy || 'day'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name.includes('Fee') ? formatETB(Number(val)) : formatNum(Number(val)),
                    name,
                  ]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="deliveryOrderCount"
                  name="Delivery Orders"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalDeliveryFees"
                  name="Total Delivery Fees"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Breakdown Ledger */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Delivery Performance Ledger
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Period</th>
                <th className="p-3.5">Deliveries</th>
                <th className="p-3.5">Fees Collected</th>
                <th className="p-3.5">Avg Fee per Order</th>
                <th className="p-3.5 pr-5">Tracked Duration Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {breakdown?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5 font-mono font-medium text-slate-900 dark:text-white">
                    {row.period}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {formatNum(row.deliveryOrderCount)}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatETB(row.totalDeliveryFees)}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {formatETB(row.averageDeliveryFee || (row.totalDeliveryFees / (row.deliveryOrderCount || 1)))}
                  </td>
                  <td className="p-3.5 pr-5 font-mono text-slate-700 dark:text-slate-300">
                    {row.ordersWithDuration || 0} orders
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
