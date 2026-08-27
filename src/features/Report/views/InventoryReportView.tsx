// src/features/Report/views/InventoryReportView.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataCard } from '@/components/Common/DataCard';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Layers,
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
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  useInventoryReportQuery,
  type ReportQueryParams,
  type InventoryReportData,
} from '@/api/Queries/reportQueries';
import { MOCK_INVENTORY_REPORT } from '../mockData';

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNum = (n: number) => new Intl.NumberFormat('en-ET').format(n || 0);

const CATEGORY_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

interface InventoryReportViewProps {
  params: ReportQueryParams;
}

export const InventoryReportView: React.FC<InventoryReportViewProps> = ({ params }) => {
  const navigate = useNavigate();
  const { data: reportResp, isLoading } = useInventoryReportQuery(params);

  const data: InventoryReportData = reportResp?.data?.summary ? reportResp.data : MOCK_INVENTORY_REPORT;
  const { summary, breakdown } = data;

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total Stock Valuation"
          value={formatETB(summary.totalStockValue)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="emerald"
          subtitle="Inventory assets on hand"
          isLoading={isLoading}
        />

        <DataCard
          title="Tracked Items"
          value={formatNum(summary.totalItems)}
          icon={<Boxes className="h-5 w-5" />}
          theme="indigo"
          subtitle="Unique ingredients & supplies"
          isLoading={isLoading}
        />

        <DataCard
          title="Low Stock Alerts"
          value={formatNum(summary.lowStockItemCount)}
          icon={<AlertTriangle className="h-5 w-5" />}
          theme="rose"
          subtitle="Below safety threshold"
          isLoading={isLoading}
        />

        <DataCard
          title="Net Stock Movements"
          value={`${summary.movements?.netChange > 0 ? '+' : ''}${formatNum(summary.movements?.netChange || 0)}`}
          icon={<Layers className="h-5 w-5" />}
          theme="amber"
          subtitle={`${summary.movements?.totalInbound || 0} in / ${summary.movements?.totalOutbound || 0} out`}
          isLoading={isLoading}
        />
      </div>

      {/* Category Inventory Value Chart */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Inventory Valuation by Stock Category</span>
            <Badge variant="outline" className="text-xs">
              {summary.categoryBreakdown?.length || 0} Categories
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Capital allocation across pantry, meats, produce, and dry goods
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatETB(Number(val)), 'Stock Value']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {summary.categoryBreakdown?.map((_, idx) => (
                    <Cell
                      key={`inv-cat-${idx}`}
                      fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Urgent Items Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>Low Stock Depletion Warnings</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ingredients below safe minimum stock levels requiring immediate purchase order
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/inventory/purchase')}
            className="rounded-xl text-xs font-bold gap-1 bg-primary text-primary-foreground"
          >
            <span>Create Purchase Order</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/70 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Ingredient</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Min Threshold</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5 pr-5 text-right">Remaining Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.lowStockItems?.map((item, idx) => (
                <tr key={item.ingredientId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5 font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">
                    {item.currentStock} {item.unit}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {item.minStock} {item.unit}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">
                    {item.unit}
                  </td>
                  <td className="p-3.5 pr-5 text-right font-bold text-slate-900 dark:text-white">
                    {formatETB(item.stockValue)}
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
