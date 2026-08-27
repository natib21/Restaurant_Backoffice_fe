// src/features/Report/views/ProfitabilityReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataCard } from '@/components/Common/DataCard';
import {
  Coins,
  TrendingUp,
  Percent,
  AlertTriangle,
  Receipt,
  Scale,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  ChefHat,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  useProfitabilityReportQuery,
  type ReportQueryParams,
  type ProfitabilityReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_PROFITABILITY_REPORT } from '../mockData';

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

interface ProfitabilityReportViewProps {
  params: ReportQueryParams;
}

export const ProfitabilityReportView: React.FC<ProfitabilityReportViewProps> = ({ params }) => {
  const navigate = useNavigate();
  const { data: reportResp, isLoading } = useProfitabilityReportQuery(params);

  const data: ProfitabilityReportData = reportResp?.data?.summary ? reportResp.data : MOCK_PROFITABILITY_REPORT;
  const warnings = reportResp?.warnings || MOCK_PROFITABILITY_REPORT.warnings || [];
  const { summary, breakdown } = data;

  return (
    <div className="space-y-6">
      {/* Top-Level Warnings Alert (Per Guide Specification) */}
      {(warnings.length > 0 || (summary.itemsWithoutCost && summary.itemsWithoutCost > 0)) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold flex items-center gap-2">
                <span>Incomplete Cost Calculation Warning</span>
                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                  {summary.itemsWithoutCost || 2} Items Without Cost Data
                </Badge>
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 max-w-2xl">
                {warnings[0]?.message || 'Some menu items currently have no ingredient cost or recipe mapped.'}{' '}
                {warnings[0]?.recommendation || 'Configure recipe costs to improve margin precision.'}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/inventory/recipes')}
            className="rounded-xl text-xs font-bold border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-100 shrink-0 gap-1.5"
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>Map Recipes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total COGS"
          value={formatETB(summary.totalCOGS)}
          icon={<Scale className="h-5 w-5" />}
          theme="amber"
          subtitle="Cost of Goods Sold (Ingredients)"
          isLoading={isLoading}
        />

        <DataCard
          title="Gross Profit"
          value={formatETB(summary.grossProfit)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="emerald"
          subtitle="Net Revenue minus COGS"
          isLoading={isLoading}
        />

        <DataCard
          title="Gross Margin"
          value={`${(summary.grossMarginPercentage || 0).toFixed(1)}%`}
          icon={<Percent className="h-5 w-5" />}
          theme="indigo"
          subtitle="Profitability efficiency ratio"
          isLoading={isLoading}
        />

        <DataCard
          title="Items Without Cost"
          value={formatNum(summary.itemsWithoutCost || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          theme="rose"
          subtitle="Requires recipe mapping"
          isLoading={isLoading}
        />
      </div>

      {/* Margin Trend Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            Gross Margin & Profit Trajectory
          </CardTitle>
          <CardDescription className="text-xs">
            COGS versus Gross Profit over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name.includes('Margin') ? `${Number(val).toFixed(1)}%` : formatETB(Number(val)),
                    name,
                  ]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  name="Gross Profit (ETB)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalCOGS"
                  name="Total COGS (ETB)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Low Margin Items & Periodic Margin Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Margin Items (5 cols) */}
        <Card className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span>Low-Margin Menu Items</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Items with slim margins after ingredient deductions
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-5">Menu Item ID</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3 pr-5 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.lowMarginItems?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 pl-5 font-mono text-slate-900 dark:text-white font-medium">
                      {item.menuItemId}
                    </td>
                    <td className="p-3 text-amber-600 font-medium">
                      {formatETB(item.totalCost)}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {formatETB(item.totalRevenue)}
                    </td>
                    <td className="p-3 pr-5 text-right font-bold text-rose-500">
                      {item.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Periodic Profit Ledger (7 cols) */}
        <Card className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Periodic Margin Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              COGS and profit ratios over selected periods
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-5">Period</th>
                  <th className="p-3">Net Revenue</th>
                  <th className="p-3">COGS</th>
                  <th className="p-3">Gross Profit</th>
                  <th className="p-3 pr-5 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {breakdown?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 pl-5 font-mono font-medium text-slate-900 dark:text-white">
                      {row.period}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {formatETB(row.netRevenue)}
                    </td>
                    <td className="p-3 text-amber-600">
                      {formatETB(row.totalCOGS)}
                    </td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatETB(row.grossProfit)}
                    </td>
                    <td className="p-3 pr-5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {row.grossMarginPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
