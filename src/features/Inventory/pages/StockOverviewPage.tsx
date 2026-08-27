import React, { useState } from 'react';
import {
  useGetInventoryValuation,
  useGetLowStockItems,
  useGetInventoryMovements,
} from '@/api/Queries/inventoryQueries';
import { useGetIngredientsList } from '@/api/Queries/ingredientQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowRight,
  Boxes,
  History,
  Download,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/Layout/PageHeader';
import { DataCard } from '@/components/Common/DataCard';

const StockOverviewPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: valuationData,
    isLoading: valuationLoading,
    error: valuationError,
    refetch: refetchValuation,
  } = useGetInventoryValuation();
  const {
    data: lowStockData,
    isLoading: lowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock,
  } = useGetLowStockItems();
  const {
    data: ingredientsData,
    isLoading: ingredientsLoading,
    error: ingredientsError,
    refetch: refetchIngredients,
  } = useGetIngredientsList();
  const {
    data: movementsData,
    isLoading: movementsLoading,
    error: movementsError,
    refetch: refetchMovements,
  } = useGetInventoryMovements();

  const valuation = valuationData?.data?.valuation;
  const lowStockItems = lowStockData?.data?.items || [];
  const ingredients = ingredientsData?.data?.ingredients || [];
  const movements = movementsData?.data?.movements || [];

  const outOfStockCount = ingredients.filter(
    (i) => i.stockStatus === 'out_of_stock'
  ).length;

  const anyError = valuationError || lowStockError || ingredientsError || movementsError;

  const refetchAll = () => {
    refetchValuation();
    refetchLowStock();
    refetchIngredients();
    refetchMovements();
  };

  const getMovementBadgeClass = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-500 text-green-900';
      case 'out':
        return 'bg-orange-500 text-orange-900';
      case 'waste':
        return 'bg-red-500 text-red-900';
      case 'adjustment':
        return 'bg-blue-500 text-blue-900';
      default:
        return 'bg-gray-500 text-gray-900';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const filteredValuationIngredients = (valuation?.ingredients || []).filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLowStockItems = lowStockItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovements = movements.filter(
    (m) =>
      (typeof m.ingredient === 'object'
        ? m.ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
        : false) || m.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValuationSum = filteredValuationIngredients.reduce(
    (sum, item) => sum + (item.value || 0),
    0
  );

  if (anyError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
            <CardDescription>
              Unable to load inventory data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refetchAll}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Stock Overview"
        subtitle="Monitor inventory valuation, low stock alerts, and recent stock movements"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search ingredients, movements, or reasons..."
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-xs font-medium gap-1.5 rounded-full"
            onClick={() => refetchAll()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </PageHeader>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total Inventory Value"
          value={formatCurrency(valuation?.totalValue || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          theme="emerald"
          subtitle="Current warehouse valuation"
          isLoading={valuationLoading}
        />

        <DataCard
          title="Total Items"
          value={valuation?.totalItems || ingredients.length || 0}
          icon={<Package className="h-5 w-5" />}
          theme="indigo"
          subtitle="Unique ingredients & SKUs"
          isLoading={valuationLoading || ingredientsLoading}
        />

        <DataCard
          title="Low Stock Items"
          value={lowStockItems.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          theme="amber"
          subtitle="At or below safety threshold"
          badge={lowStockItems.length > 0 ? `${lowStockItems.length} Warnings` : undefined}
          badgeVariant="destructive"
          isLoading={lowStockLoading}
        />
        <DataCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={<Boxes className="h-5 w-5" />}
          theme="rose"
          subtitle="Requires urgent restocking"
          badge={outOfStockCount > 0 ? `${outOfStockCount} Depleted` : undefined}
          badgeVariant="destructive"
          isLoading={ingredientsLoading}
        />
      </div>

      <Tabs defaultValue="valuation" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="valuation" className="gap-2 rounded-lg text-xs font-semibold">
            <DollarSign className="h-4 w-4" />
            Valuation
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="gap-2 rounded-lg text-xs font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
            {lowStockItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 rounded-lg text-xs font-semibold">
            <History className="h-4 w-4" />
            Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valuation">
          <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Inventory Valuation</span>
                <span className="text-sm font-semibold text-primary">
                  Total: {formatCurrency(totalValuationSum)}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Breakdown of inventory value by ingredient
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {valuationLoading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredValuationIngredients.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-base font-bold">No valuation data found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'No ingredients with valuation data yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Name</TableHead>
                        <TableHead className="text-xs font-bold">Stock</TableHead>
                        <TableHead className="text-xs font-bold">Unit</TableHead>
                        <TableHead className="text-xs font-bold">Cost/Unit</TableHead>
                        <TableHead className="text-xs font-bold text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredValuationIngredients.map((item, idx) => (
                        <TableRow key={item.ingredientId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <TableCell className="font-semibold text-xs text-slate-900 dark:text-white">{item.name}</TableCell>
                          <TableCell className="text-xs font-mono">{item.currentStock}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-xs font-mono">{formatCurrency(item.costPerUnit)}</TableCell>
                          <TableCell className="text-xs text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50/90 dark:bg-slate-800/70 font-bold border-t-2">
                        <TableCell colSpan={4} className="text-xs">Total Valuation</TableCell>
                        <TableCell className="text-right text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalValuationSum)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowstock">
          <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold">Low Stock Items</CardTitle>
              <CardDescription className="text-xs">
                Ingredients that are at or below their minimum stock threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {lowStockLoading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredLowStockItems.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-base font-bold">No low stock items</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'All ingredients are above minimum stock levels'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Name</TableHead>
                        <TableHead className="text-xs font-bold">Current Stock</TableHead>
                        <TableHead className="text-xs font-bold">Min Stock</TableHead>
                        <TableHead className="text-xs font-bold">Unit</TableHead>
                        <TableHead className="text-xs font-bold">Supplier</TableHead>
                        <TableHead className="text-xs font-bold text-right">Days to Reorder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLowStockItems.map((item) => (
                        <TableRow
                          key={item._id}
                          className={
                            item.currentStock <= 0
                              ? 'bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/30'
                              : 'bg-amber-50/60 dark:bg-amber-900/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30'
                          }
                        >
                          <TableCell className="font-semibold text-xs">
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className={
                                  item.currentStock <= 0
                                    ? 'h-4 w-4 text-red-600'
                                    : 'h-4 w-4 text-amber-600'
                                }
                              />
                              <span>{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                item.currentStock <= 0
                                  ? 'font-bold text-xs text-red-600 font-mono'
                                  : 'font-bold text-xs text-amber-700 dark:text-amber-400 font-mono'
                              }
                            >
                              {item.currentStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {item.minStock}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {typeof item.supplier === 'object'
                              ? item.supplier.name
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.daysToReorder !== undefined && item.daysToReorder !== null ? (
                              <Badge
                                variant="outline"
                                className={
                                  item.daysToReorder <= 1
                                    ? 'bg-red-500 text-white border-red-500 text-[10px] font-bold'
                                    : item.daysToReorder <= 3
                                    ? 'bg-amber-500 text-white border-amber-500 text-[10px] font-bold'
                                    : 'bg-blue-500 text-white border-blue-500 text-[10px] font-bold'
                                }
                              >
                                {item.daysToReorder} day{item.daysToReorder !== 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold">Recent Stock Movements</CardTitle>
              <CardDescription className="text-xs">
                Audit log of all stock additions, deductions, waste, and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {movementsLoading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-base font-bold">No movements found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'No stock movements recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Date</TableHead>
                        <TableHead className="text-xs font-bold">Ingredient</TableHead>
                        <TableHead className="text-xs font-bold">Type</TableHead>
                        <TableHead className="text-xs font-bold text-right">Quantity</TableHead>
                        <TableHead className="text-xs font-bold">Reason</TableHead>
                        <TableHead className="text-xs font-bold text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((m) => (
                        <TableRow key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {m.createdAt
                              ? format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900 dark:text-white">
                            {typeof m.ingredient === 'object' ? m.ingredient.name : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getMovementBadgeClass(m.type)} text-[10px] font-bold`}>
                              <div className="flex items-center gap-1">
                                {m.type === 'in' && <TrendingUp className="h-3 w-3" />}
                                {(m.type === 'out' || m.type === 'waste') && (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                <span className="capitalize">{m.type}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold font-mono">
                            {m.quantity}{' '}
                            <span className="text-muted-foreground text-[10px] font-normal">
                              {typeof m.ingredient === 'object' ? m.ingredient.unit : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                            {m.reason || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {m.balance !== undefined && m.balance !== null
                              ? m.balance
                              : '—'}{' '}
                            <span className="text-muted-foreground text-[10px] font-normal">
                              {typeof m.ingredient === 'object' ? m.ingredient.unit : ''}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
            </main >

    </>
  );
};

export default StockOverviewPage;
