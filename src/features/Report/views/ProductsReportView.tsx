// src/features/Report/views/ProductsReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataCard } from '@/components/Common/DataCard';
import {
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  DollarSign,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  useProductsReportQuery,
  type ReportQueryParams,
  type ProductsReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_PRODUCTS_REPORT } from '../mockData';

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

const CATEGORY_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#64748B'];

interface ProductsReportViewProps {
  params: ReportQueryParams;
}

export const ProductsReportView: React.FC<ProductsReportViewProps> = ({ params }) => {
  const { data: reportResp, isLoading } = useProductsReportQuery(params);

  const data: ProductsReportData = reportResp?.data?.summary ? reportResp.data : MOCK_PRODUCTS_REPORT;
  const { summary } = data;

  // Convert categoryBreakdown object to array for charting
  const categoryArray = Object.entries(summary.categoryBreakdown || {}).map(([catName, stats]) => ({
    name: catName,
    quantity: stats.quantitySold,
    revenue: stats.revenue,
    itemCount: stats.itemCount,
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total Items Sold"
          value={formatNum(summary.totalItemsSold)}
          icon={<PackageCheck className="h-5 w-5" />}
          theme="indigo"
          subtitle="Cumulative menu servings"
          isLoading={isLoading}
        />

        <DataCard
          title="Product Revenue"
          value={formatETB(summary.totalItemRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="emerald"
          subtitle="Gross dish & drink sales"
          isLoading={isLoading}
        />

        <DataCard
          title="Unique Items Ordered"
          value={formatNum(summary.uniqueItemsCount)}
          icon={<UtensilsCrossed className="h-5 w-5" />}
          theme="amber"
          subtitle="Active menu varieties"
          isLoading={isLoading}
        />

        <DataCard
          title="Underperforming Items"
          value={formatNum(summary.lowPerformers?.length || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          theme="rose"
          subtitle={`Threshold: <${summary.lowPerformerThreshold} sold`}
          isLoading={isLoading}
        />
      </div>

      {/* Category Performance Breakdown Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Category Revenue Performance</span>
            <Badge variant="outline" className="text-xs">
              {categoryArray.length} Categories
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Revenue and unit volume by menu category
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? formatETB(Number(val)) : formatNum(Number(val)),
                    name === 'revenue' ? 'Revenue' : 'Quantity Sold',
                  ]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {categoryArray.map((_, idx) => (
                    <Cell
                      key={`cat-${idx}`}
                      fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Bestsellers & Low Performers Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Bestsellers */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Top Selling Menu Items</span>
              </CardTitle>
              <CardDescription className="text-xs">Highest volume & revenue contributors</CardDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 text-xs">
              Bestsellers
            </Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-5">Rank & Dish</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Sold</th>
                  <th className="p-3 pr-5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.topItems?.slice(0, 10).map((item, idx) => (
                  <tr key={item.menuItemId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 pl-5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </td>
                    <td className="p-3 text-slate-500">{item.category}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatNum(item.quantitySold)}
                    </td>
                    <td className="p-3 pr-5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatETB(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Performers Table */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                <span>Low-Volume Menu Items</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Items requiring promotion or recipe redesign
              </CardDescription>
            </div>
            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 text-xs">
              Needs Review
            </Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-5">Dish</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Sold</th>
                  <th className="p-3 pr-5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.lowPerformers?.length > 0 ? (
                  summary.lowPerformers.map((item, idx) => (
                    <tr key={item.menuItemId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 pl-5 font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="p-3 text-slate-500">{item.category}</td>
                      <td className="p-3 text-right font-bold text-rose-500">
                        {formatNum(item.quantitySold)}
                      </td>
                      <td className="p-3 pr-5 text-right font-medium text-slate-600 dark:text-slate-400">
                        {formatETB(item.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No underperforming items below threshold for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
