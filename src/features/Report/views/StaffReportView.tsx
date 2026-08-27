// src/features/Report/views/StaffReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataCard } from '@/components/Common/DataCard';
import {
  UserCheck,
  ChefHat,
  Users,
  Timer,
  Award,
  Zap,
  ShoppingBag,
  Clock,
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
  useStaffReportQuery,
  type ReportQueryParams,
  type StaffReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_STAFF_REPORT } from '../mockData';

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

interface StaffReportViewProps {
  params: ReportQueryParams;
}

export const StaffReportView: React.FC<StaffReportViewProps> = ({ params }) => {
  const { data: reportResp, isLoading } = useStaffReportQuery(params);

  const data: StaffReportData = reportResp?.data?.summary ? reportResp.data : MOCK_STAFF_REPORT;
  const { summary, breakdown } = data;

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Active Team"
          value={formatNum(summary.totalStaff)}
          icon={<Users className="h-5 w-5" />}
          theme="indigo"
          subtitle={`${summary.totalWaiters} Waiters • ${summary.totalKitchenStaff} Kitchen`}
          isLoading={isLoading}
        />

        <DataCard
          title="Total Orders Processed"
          value={formatNum(summary.totalOrdersHandled)}
          icon={<ShoppingBag className="h-5 w-5" />}
          theme="emerald"
          subtitle="Orders fulfilled across team"
          isLoading={isLoading}
        />

        <DataCard
          title="Avg Orders / Staff"
          value={formatNum(summary.averageOrdersPerStaff)}
          icon={<Zap className="h-5 w-5" />}
          theme="amber"
          subtitle="Team throughput load"
          isLoading={isLoading}
        />

        <DataCard
          title="Kitchen Turnaround"
          value={`${(summary.kitchenStats?.averageTurnaround || 17.4).toFixed(1)} mins`}
          icon={<Timer className="h-5 w-5" />}
          theme="rose"
          subtitle={`Waiters: ${(summary.waiterStats?.averageTurnaround || 13.8).toFixed(1)} mins`}
          isLoading={isLoading}
        />
      </div>

      {/* Role Comparison Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Front of House (Waiters)
                </h4>
                <p className="text-xs text-slate-500">{summary.totalWaiters} active wait staff</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
              Service
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[11px] text-slate-500 font-medium">Orders Handled</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatNum(summary.waiterStats?.totalOrders || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[11px] text-slate-500 font-medium">Avg Table Turnaround</span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {(summary.waiterStats?.averageTurnaround || 0).toFixed(1)}m
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Back of House (Kitchen)
                </h4>
                <p className="text-xs text-slate-500">{summary.totalKitchenStaff} kitchen staff</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">
              Kitchen
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[11px] text-slate-500 font-medium">Dishes Prepared</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatNum(summary.kitchenStats?.totalOrders || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[11px] text-slate-500 font-medium">Avg Prep Turnaround</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {(summary.kitchenStats?.averageTurnaround || 0).toFixed(1)}m
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Staff Orders & Turnaround Velocity Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Staff Workload Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Waiter orders vs. Kitchen orders per {params.groupBy || 'day'}
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
                  dataKey="waiterOrders"
                  name="Waiter Orders"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="kitchenOrders"
                  name="Kitchen Orders"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers Leaderboard Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span>Top Staff Performance & Efficiency</span>
            </CardTitle>
            <CardDescription className="text-xs">Highest volume & turnaround efficiency</CardDescription>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            Team Leaders
          </Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Staff Member</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5 text-center">Orders Handled</th>
                <th className="p-3.5 pr-5 text-right">Avg Turnaround</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.topPerformers?.map((st, idx) => (
                <tr key={st.staffId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5 font-mono font-medium text-slate-900 dark:text-white">
                    {st.staffId}
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        st.staffType === 'kitchen'
                          ? 'border-amber-200 text-amber-600 bg-amber-50/50'
                          : 'border-indigo-200 text-indigo-600 bg-indigo-50/50'
                      }`}
                    >
                      {st.staffType}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                    {formatNum(st.orderCount)}
                  </td>
                  <td className="p-3.5 pr-5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {st.averageTurnaroundMinutes.toFixed(1)} mins
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
