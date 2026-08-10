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
} from 'lucide-react';
import { format } from 'date-fns';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor inventory valuation, low stock alerts, and recent stock movements
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients, movements, or reasons..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">
                  {valuationLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(valuation?.totalValue || 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">
                  {valuationLoading || ingredientsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    valuation?.totalItems || ingredients.length || 0
                  )}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">
                  {lowStockLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    lowStockItems.length
                  )}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">
                  {ingredientsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    outOfStockCount
                  )}
                </p>
              </div>
              <Boxes className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="valuation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="valuation" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Valuation
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valuation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Inventory Valuation</span>
                <span className="text-base font-normal text-muted-foreground">
                  Total: {formatCurrency(totalValuationSum)}
                </span>
              </CardTitle>
              <CardDescription>
                Breakdown of inventory value by ingredient
              </CardDescription>
            </CardHeader>
            <CardContent>
              {valuationLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredValuationIngredients.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-lg font-medium">No valuation data found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'No ingredients with valuation data yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Cost/Unit</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredValuationIngredients.map((item, idx) => (
                        <TableRow key={item.ingredientId || idx}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.currentStock}</TableCell>
                          <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                          <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right">
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
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>
                Ingredients that are at or below their minimum stock threshold
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredLowStockItems.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-lg font-medium">No low stock items</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'All ingredients are above minimum stock levels'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Days to Reorder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLowStockItems.map((item) => (
                        <TableRow
                          key={item._id}
                          className={
                            item.currentStock <= 0
                              ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                          }
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className={
                                  item.currentStock <= 0
                                    ? 'h-4 w-4 text-red-600'
                                    : 'h-4 w-4 text-yellow-600'
                                }
                              />
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                item.currentStock <= 0
                                  ? 'font-semibold text-red-600'
                                  : 'font-semibold text-yellow-700'
                              }
                            >
                              {item.currentStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.minStock}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                          <TableCell>
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
                                    ? 'bg-red-500 text-white border-red-500'
                                    : item.daysToReorder <= 3
                                    ? 'bg-yellow-500 text-white border-yellow-500'
                                    : 'bg-blue-500 text-white border-blue-500'
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>
                Audit log of all stock additions, deductions, waste, and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-lg font-medium">No movements found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'No stock movements recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {m.createdAt
                              ? format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')
                              : '—'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {typeof m.ingredient === 'object' ? m.ingredient.name : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMovementBadgeClass(m.type)}>
                              <div className="flex items-center gap-1">
                                {m.type === 'in' && <TrendingUp className="h-3 w-3" />}
                                {(m.type === 'out' || m.type === 'waste') && (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                <span className="capitalize">{m.type}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {m.quantity}{' '}
                            <span className="text-muted-foreground text-xs">
                              {typeof m.ingredient === 'object' ? m.ingredient.unit : ''}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {m.reason || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {m.balance !== undefined && m.balance !== null
                              ? m.balance
                              : '—'}{' '}
                            <span className="text-muted-foreground text-xs">
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
    </div>
  );
};

export default StockOverviewPage;
