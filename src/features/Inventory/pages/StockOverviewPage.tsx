import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import {
  useGetInventoryValuation,
  useGetLowStockItems,
  useGetInventoryMovements,
  useAdjustStock,
  type StockMovement,
} from '@/api/Queries/inventoryQueries';
import { useGetIngredientsList } from '@/api/Queries/ingredientQueries';
import { useBranchesQuery, type Branch } from '@/api/Queries/branchQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RefreshCw,
  SlidersHorizontal,
  Plus,
  Boxes,
  History,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PageHeader from '@/components/Layout/PageHeader';
import { DataCard } from '@/components/Common/DataCard';

const StockOverviewPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'waste' | 'adjustment'>('in');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjustCost, setAdjustCost] = useState('');
  const [adjustBranchId, setAdjustBranchId] = useState('');

  const currentBranchId = useSelector((state: RootState) => state.ui.currentBranchId);
  const { data: branchesData } = useBranchesQuery();
  const branches: Branch[] = branchesData || [];

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

  const adjustStockMutation = useAdjustStock();

  // Robustly extract valuation data from backend response
  const rawInventory = (valuationData?.data as any)?.inventory;
  const rawValuation = valuationData?.data?.valuation;
  const valuation = rawInventory || rawValuation;

  const lowStockItems = lowStockData?.data?.items || [];
  const ingredients = ingredientsData?.data?.ingredients || [];
  const movements: StockMovement[] = movementsData?.data?.movements || [];

  // Effective branch for adjustment
  const effectiveBranchId = useMemo(() => {
    if (adjustBranchId) return adjustBranchId;
    if (currentBranchId && currentBranchId !== 'all') return currentBranchId;
    if (branches.length > 0) return branches[0]._id;
    return '';
  }, [adjustBranchId, currentBranchId, branches]);

  const outOfStockCount = ingredients.filter(
    (i) => i.stockStatus === 'out_of_stock' || i.currentStock <= 0
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
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
      case 'out':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30';
      case 'waste':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30';
      case 'adjustment':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30';
      case 'deduction':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
      case 'restoration':
        return 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const getIngredientDisplayName = (ing: any): string => {
    if (typeof ing === 'string') return ing;
    if (ing && typeof ing === 'object') return ing.name || ing._id || 'Ingredient';
    return 'Ingredient';
  };

  const getIngredientUnit = (m: StockMovement): string => {
    if (typeof m.ingredient === 'object' && m.ingredient?.unit) {
      return m.ingredient.unit;
    }
    const name = getIngredientDisplayName(m.ingredient);
    const matched = ingredients.find((i) => i.name === name || i._id === name);
    return matched?.unit || '';
  };

  // Build ingredients valuation table either from valuation.ingredients or local calculation
  const valuationItems = useMemo(() => {
    if (rawValuation?.ingredients && rawValuation.ingredients.length > 0) {
      return rawValuation.ingredients;
    }
    return ingredients.map((ing) => ({
      ingredientId: ing._id,
      name: ing.name,
      currentStock: ing.currentStock || 0,
      unit: ing.unit || '',
      costPerUnit: ing.costPerUnit || 0,
      value: (ing.currentStock || 0) * (ing.costPerUnit || 0),
    }));
  }, [rawValuation, ingredients]);

  const filteredValuationIngredients = useMemo(() => {
    return valuationItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [valuationItems, searchQuery]);

  const totalCalculatedValuation = useMemo(() => {
    if (valuation?.totalValue !== undefined && valuation.totalValue !== null) {
      return valuation.totalValue;
    }
    return valuationItems.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [valuation, valuationItems]);

  const filteredLowStockItems = useMemo(() => {
    return lowStockItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lowStockItems, searchQuery]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const ingName = getIngredientDisplayName(m.ingredient).toLowerCase();
      const reasonText = (m.reason || '').toLowerCase();
      const refText = (m.reference || '').toLowerCase();
      const performedByText = (m.createdBy || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return (
        ingName.includes(query) ||
        reasonText.includes(query) ||
        refText.includes(query) ||
        performedByText.includes(query)
      );
    });
  }, [movements, searchQuery]);

  const handleOpenAdjustDialog = (ingredientId?: string) => {
    if (ingredientId) {
      setSelectedIngredientId(ingredientId);
      const ing = ingredients.find((i) => i._id === ingredientId);
      if (ing?.costPerUnit) {
        setAdjustCost(String(ing.costPerUnit));
      }
    } else if (ingredients.length > 0 && !selectedIngredientId) {
      setSelectedIngredientId(ingredients[0]._id);
    }
    setIsAdjustDialogOpen(true);
  };

  const handleQuickAdjustSubmit = async () => {
    const qty = parseFloat(adjustQuantity);
    if (!selectedIngredientId || isNaN(qty) || qty <= 0) {
      toast.error('Please select an ingredient and enter a positive quantity');
      return;
    }

    const branch = effectiveBranchId;
    if (!branch) {
      toast.error('A branch is required to adjust stock');
      return;
    }

    const costNum = adjustCost ? parseFloat(adjustCost) : undefined;

    try {
      await adjustStockMutation.mutateAsync({
        ingredientId: selectedIngredientId,
        quantity: qty,
        type: adjustType,
        reason: adjustReason.trim() || undefined,
        reference: adjustReference.trim() || undefined,
        cost: costNum,
      });

      toast.success(
        `Stock adjusted (${adjustType.toUpperCase()} +${qty}) successfully`
      );
      setIsAdjustDialogOpen(false);
      setAdjustQuantity('');
      setAdjustReason('');
      setAdjustReference('');
      setAdjustCost('');
      refetchAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to adjust stock'
      );
    }
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-xs font-medium gap-1.5 rounded-full"
            onClick={() => refetchAll()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            className="h-10 text-xs font-semibold gap-1.5 rounded-full shadow-xs"
            onClick={() => handleOpenAdjustDialog()}
          >
            <Plus className="h-4 w-4" />
            <span>Adjust Stock</span>
          </Button>
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Inventory Value"
            value={formatCurrency(totalCalculatedValuation)}
            icon={<DollarSign className="h-5 w-5" />}
            theme="emerald"
            subtitle="Current warehouse valuation"
            isLoading={valuationLoading}
          />

          <DataCard
            title="Total Items"
            value={valuation?.itemCount || valuation?.totalItems || ingredients.length || 0}
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
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  {lowStockItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="movements" className="gap-2 rounded-lg text-xs font-semibold">
              <History className="h-4 w-4" />
              Movements Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="valuation">
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Inventory Valuation Breakdown</span>
                  <span className="text-sm font-semibold text-primary">
                    Total: {formatCurrency(totalCalculatedValuation)}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of current stock and asset value by ingredient
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
                          <TableHead className="text-xs font-bold">Ingredient</TableHead>
                          <TableHead className="text-xs font-bold">Current Stock</TableHead>
                          <TableHead className="text-xs font-bold">Unit</TableHead>
                          <TableHead className="text-xs font-bold">Cost / Unit</TableHead>
                          <TableHead className="text-xs font-bold text-right">Total Value</TableHead>
                          <TableHead className="text-xs font-bold text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredValuationIngredients.map((item, idx) => (
                          <TableRow key={item.ingredientId || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <TableCell className="font-semibold text-xs text-slate-900 dark:text-white">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-medium">
                              {item.currentStock}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.unit}</TableCell>
                            <TableCell className="text-xs font-mono">{formatCurrency(item.costPerUnit)}</TableCell>
                            <TableCell className="text-xs text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(item.value)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] px-2 text-primary hover:bg-primary/10"
                                onClick={() => handleOpenAdjustDialog(item.ingredientId)}
                              >
                                <SlidersHorizontal className="h-3 w-3 mr-1" />
                                Adjust
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50/90 dark:bg-slate-800/70 font-bold border-t-2">
                          <TableCell colSpan={4} className="text-xs">
                            Total Valuation ({filteredValuationIngredients.length} items)
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(totalCalculatedValuation)}
                          </TableCell>
                          <TableCell />
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
                <CardTitle className="text-base font-bold">Low Stock & Safety Threshold Alerts</CardTitle>
                <CardDescription className="text-xs">
                  Ingredients currently at or below minimum threshold requiring restocking
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
                    <h3 className="mt-4 text-base font-bold">All stock levels healthy</h3>
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
                          <TableHead className="text-xs font-bold">Ingredient</TableHead>
                          <TableHead className="text-xs font-bold">Current Stock</TableHead>
                          <TableHead className="text-xs font-bold">Min Threshold</TableHead>
                          <TableHead className="text-xs font-bold">Unit</TableHead>
                          <TableHead className="text-xs font-bold">Supplier</TableHead>
                          <TableHead className="text-xs font-bold">Status</TableHead>
                          <TableHead className="text-xs font-bold text-right">Quick Restock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLowStockItems.map((item) => (
                          <TableRow
                            key={item._id}
                            className={
                              item.currentStock <= 0
                                ? 'bg-rose-50/50 dark:bg-rose-900/10 hover:bg-rose-100/50'
                                : 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50'
                            }
                          >
                            <TableCell className="font-semibold text-xs">
                              <div className="flex items-center gap-2">
                                <AlertTriangle
                                  className={
                                    item.currentStock <= 0
                                      ? 'h-4 w-4 text-rose-600 shrink-0'
                                      : 'h-4 w-4 text-amber-600 shrink-0'
                                  }
                                />
                                <span>{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  item.currentStock <= 0
                                    ? 'font-bold text-xs text-rose-600 font-mono'
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
                              {typeof item.supplier === 'object' && item.supplier?.name
                                ? item.supplier.name
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  item.currentStock <= 0
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold'
                                }
                              >
                                {item.currentStock <= 0 ? 'Out of Stock' : 'Low Stock'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2.5 font-medium rounded-lg"
                                onClick={() => {
                                  setAdjustType('in');
                                  handleOpenAdjustDialog(item._id);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Restock (In)
                              </Button>
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
                <CardTitle className="text-base font-bold">Stock Audit & Movement History</CardTitle>
                <CardDescription className="text-xs">
                  Complete audit trail of additions, order deductions, item void restorations, waste, and adjustments
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
                    <h3 className="mt-4 text-base font-bold">No stock movements recorded</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Stock movements from orders, receipts, voids, and waste will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                        <TableRow>
                          <TableHead className="text-xs font-bold">Date & Time</TableHead>
                          <TableHead className="text-xs font-bold">Ingredient</TableHead>
                          <TableHead className="text-xs font-bold">Type</TableHead>
                          <TableHead className="text-xs font-bold text-right">Quantity</TableHead>
                          <TableHead className="text-xs font-bold">Stock Transition</TableHead>
                          <TableHead className="text-xs font-bold">Reason / Reference</TableHead>
                          <TableHead className="text-xs font-bold">Performed By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.map((m) => {
                          const ingName = getIngredientDisplayName(m.ingredient);
                          const unit = getIngredientUnit(m);
                          const isPositive = m.type === 'in';

                          return (
                            <TableRow key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {m.createdAt
                                  ? format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-slate-900 dark:text-white">
                                {ingName}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getMovementBadgeClass(m.type)} text-[10px] font-bold capitalize`}>
                                  <div className="flex items-center gap-1">
                                    {m.type === 'in' && <TrendingUp className="h-3 w-3" />}
                                    {(m.type === 'out' || m.type === 'waste') && (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {m.type === 'adjustment' && <SlidersHorizontal className="h-3 w-3" />}
                                    <span>{m.type}</span>
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold font-mono">
                                <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                                  {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                                </span>{' '}
                                <span className="text-muted-foreground text-[10px] font-normal">
                                  {unit}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs font-mono">
                                {m.balance !== undefined ? (
                                  <span>Bal: {m.balance}</span>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                                {m.reference && <span className="font-mono text-slate-700 dark:text-slate-300 mr-1.5 font-bold">[{m.reference}]</span>}
                                {m.reason || '—'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 text-slate-400" />
                                  <span>{m.createdBy || 'Staff'}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Quick Stock Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              Record an incoming delivery, waste/spoilage, or physical inventory count adjustment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Branch Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Branch *</Label>
              <Select
                value={effectiveBranchId}
                onValueChange={setAdjustBranchId}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b._id} value={b._id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ingredient Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ingredient *</Label>
              <Select
                value={selectedIngredientId}
                onValueChange={(val) => {
                  setSelectedIngredientId(val);
                  const found = ingredients.find((i) => i._id === val);
                  if (found?.costPerUnit) setAdjustCost(String(found.costPerUnit));
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing._id} value={ing._id} className="text-xs">
                      {ing.name} ({ing.currentStock} {ing.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Adjustment Type *</Label>
              <Select
                value={adjustType}
                onValueChange={(v: any) => setAdjustType(v)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in" className="text-xs">
                    In (Receive stock / Delivery)
                  </SelectItem>
                  <SelectItem value="out" className="text-xs">
                    Out (Stock transfer / deduction)
                  </SelectItem>
                  <SelectItem value="waste" className="text-xs">
                    Waste (Spoilage / Damaged)
                  </SelectItem>
                  <SelectItem value="adjustment" className="text-xs">
                    Adjustment (Inventory count correction)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 25"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Unit Cost (ETB) {adjustType === 'in' && <span className="text-emerald-600">(Weighted avg)</span>}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional cost"
                  value={adjustCost}
                  onChange={(e) => setAdjustCost(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reference (PO / Invoice #)</Label>
              <Input
                type="text"
                placeholder="e.g., PO-2024-001 or INV-892"
                value={adjustReference}
                onChange={(e) => setAdjustReference(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason</Label>
              <Input
                type="text"
                placeholder="e.g., Weekly supplier restock or physical count recount"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={adjustStockMutation.isPending}
              onClick={handleQuickAdjustSubmit}
            >
              {adjustStockMutation.isPending ? 'Adjusting...' : 'Confirm Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockOverviewPage;
