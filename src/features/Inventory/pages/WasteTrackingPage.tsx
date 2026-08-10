import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useAdjustStock, useBatchAdjustStock, useGetInventoryMovements } from '@/api/Queries/inventoryQueries';
import type { StockMovement } from '@/api/Queries/inventoryQueries';
import { useGetIngredientsList } from '@/api/Queries/ingredientQueries';
import type { Ingredient } from '@/api/Queries/ingredientQueries';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  Scale,
  AlertTriangle,
  Search,
  Calendar,
  Package,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

type MovementType = 'waste' | 'adjustment' | 'in' | 'out';

interface AdjustmentFormState {
  ingredientId: string;
  type: MovementType;
  quantity: string;
  reason: string;
  reference: string;
  cost: string;
}

interface BatchRowState {
  id: string;
  ingredientId: string;
  type: MovementType;
  quantity: string;
  reason: string;
}

const typeBadgeColor: Record<MovementType, string> = {
  waste: 'bg-red-100 text-red-800 hover:bg-red-200',
  adjustment: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  in: 'bg-green-100 text-green-800 hover:bg-green-200',
  out: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
};

const typeIcon: Record<MovementType, React.ReactNode> = {
  waste: <Trash2 className="h-3 w-3 mr-1" />,
  adjustment: <Scale className="h-3 w-3 mr-1" />,
  in: <ArrowUpCircle className="h-3 w-3 mr-1" />,
  out: <ArrowDownCircle className="h-3 w-3 mr-1" />,
};

const WasteTrackingPage: React.FC = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('activity');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogDefaultType, setDialogDefaultType] = useState<MovementType>('waste');
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  const [formState, setFormState] = useState<AdjustmentFormState>({
    ingredientId: '',
    type: 'waste',
    quantity: '',
    reason: '',
    reference: '',
    cost: '',
  });

  const [batchRows, setBatchRows] = useState<BatchRowState[]>([
    { id: '1', ingredientId: '', type: 'waste', quantity: '', reason: '' },
  ]);

  const adjustStockMutation = useAdjustStock();
  const batchAdjustStockMutation = useBatchAdjustStock();
  const movementsQuery = useGetInventoryMovements({ type: 'waste,adjustment,in,out' });
  const ingredientsQuery = useGetIngredientsList();

  const movements: StockMovement[] = useMemo(
    () => movementsQuery.data?.data?.movements ?? [],
    [movementsQuery.data]
  );

  const ingredients: Ingredient[] = useMemo(
    () => ingredientsQuery.data?.data?.ingredients ?? [],
    [ingredientsQuery.data]
  );

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => {
    const thisMonthMovements = movements.filter((m) => new Date(m.createdAt) >= thisMonthStart);
    const wasteMovements = thisMonthMovements.filter((m) => m.type === 'waste');
    const adjustmentCount = thisMonthMovements.filter((m) => m.type === 'adjustment').length;

    const ingredientWasteMap = new Map<string, { name: string; value: number }>();
    wasteMovements.forEach((m) => {
      const ingredientName = m.ingredient?.name ?? 'Unknown';
      const ingredientId = m.ingredient?._id ?? 'unknown';
      const value = (m.movementValue ?? Math.abs(m.quantity) * (m.costPerUnit ?? 0));
      const existing = ingredientWasteMap.get(ingredientId);
      if (existing) {
        existing.value += value;
      } else {
        ingredientWasteMap.set(ingredientId, { name: ingredientName, value });
      }
    });

    let topWastedName = '—';
    let topWastedValue = 0;
    ingredientWasteMap.forEach(({ name, value }) => {
      if (value > topWastedValue) {
        topWastedValue = value;
        topWastedName = name;
      }
    });

    const estimatedLoss = wasteMovements.reduce(
      (sum, m) => sum + (m.movementValue ?? Math.abs(m.quantity) * (m.costPerUnit ?? 0)),
      0
    );

    return {
      totalWaste: wasteMovements.length,
      adjustmentCount,
      topWastedName,
      estimatedLoss,
    };
  }, [movements, thisMonthStart]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(m.createdAt) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(m.createdAt) > end) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const ingredientMatch = m.ingredient?.name?.toLowerCase().includes(q);
        const reasonMatch = m.reason?.toLowerCase().includes(q);
        const refMatch = m.reference?.toLowerCase().includes(q);
        if (!ingredientMatch && !reasonMatch && !refMatch) return false;
      }

      return true;
    });
  }, [movements, typeFilter, startDate, endDate, searchQuery]);

  const openDialogWithType = (type: MovementType) => {
    setDialogDefaultType(type);
    setFormState({
      ingredientId: '',
      type,
      quantity: '',
      reason: '',
      reference: '',
      cost: '',
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = (field: keyof AdjustmentFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const getIngredientCostPerUnit = (ingredientId: string): number | undefined => {
    const ing = ingredients.find((i) => i._id === ingredientId);
    return ing?.costPerUnit;
  };

  const selectedIngredientCost = formState.ingredientId
    ? getIngredientCostPerUnit(formState.ingredientId)
    : undefined;

  const estimatedLossDisplay = useMemo(() => {
    if (formState.type !== 'waste') return null;
    const qty = parseFloat(formState.quantity);
    if (isNaN(qty) || qty <= 0) return null;
    const costPerUnit = formState.cost
      ? parseFloat(formState.cost)
      : selectedIngredientCost;
    if (typeof costPerUnit !== 'number' || isNaN(costPerUnit)) return null;
    return qty * costPerUnit;
  }, [formState, selectedIngredientCost]);

  const submitSingleAdjustment = async () => {
    const qty = parseFloat(formState.quantity);
    if (!formState.ingredientId || isNaN(qty) || qty <= 0 || !formState.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in ingredient, positive quantity, and reason.',
        variant: 'destructive',
      });
      return;
    }

    const costNum = formState.cost ? parseFloat(formState.cost) : undefined;

    try {
      await adjustStockMutation.mutateAsync({
        ingredientId: formState.ingredientId,
        quantity: qty,
        type: formState.type,
        reason: formState.reason.trim(),
        reference: formState.reference.trim() || undefined,
        cost: costNum,
      });
      toast({
        title: 'Success',
        description: `${formState.type.charAt(0).toUpperCase() + formState.type.slice(1)} recorded successfully.`,
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to record adjustment.',
        variant: 'destructive',
      });
    }
  };

  const addBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      { id: Date.now().toString(), ingredientId: '', type: 'waste', quantity: '', reason: '' },
    ]);
  };

  const removeBatchRow = (id: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateBatchRow = (id: string, field: keyof BatchRowState, value: string) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const submitBatchAdjustment = async () => {
    const adjustments = batchRows
      .map((r) => {
        const qty = parseFloat(r.quantity);
        return {
          ingredientId: r.ingredientId,
          quantity: qty,
          type: r.type,
          reason: r.reason.trim(),
        };
      })
      .filter(
        (a) =>
          a.ingredientId &&
          !isNaN(a.quantity) &&
          a.quantity > 0 &&
          a.reason.length > 0
      );

    if (adjustments.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in at least one complete row with ingredient, positive quantity, and reason.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await batchAdjustStockMutation.mutateAsync({ adjustments });
      toast({
        title: 'Success',
        description: `Batch operation with ${adjustments.length} adjustment(s) recorded.`,
      });
      setBatchRows([
        { id: '1', ingredientId: '', type: 'waste', quantity: '', reason: '' },
      ]);
      setActiveTab('activity');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to submit batch operation.',
        variant: 'destructive',
      });
    }
  };

  const countByType = (type: string) => movements.filter((m) => m.type === type).length;

  if (movementsQuery.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
            <CardDescription>
              Unable to load inventory movements. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waste &amp; Adjustments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track stock waste, adjustments, and movement history for inventory accuracy
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => openDialogWithType('waste')}
              >
                <Trash2 className="h-4 w-4" />
                Log Waste
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2" onClick={() => openDialogWithType('adjustment')}>
                <Scale className="h-4 w-4" />
                Log Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {formState.type === 'waste'
                    ? 'Log Waste'
                    : formState.type === 'adjustment'
                    ? 'Log Adjustment'
                    : formState.type === 'in'
                    ? 'Stock In'
                    : 'Stock Out'}
                </DialogTitle>
                <DialogDescription>
                  Record a stock movement with reason and optional reference details.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">Ingredient *</Label>
                  <Select
                    value={formState.ingredientId}
                    onValueChange={(v) => handleFormChange('ingredientId', v)}
                  >
                    <SelectTrigger id="ingredient">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ing) => (
                        <SelectItem key={ing._id} value={ing._id}>
                          {ing.name} ({ing.unit}) - Stock: {ing.currentStock}
                        </SelectItem>
                      ))}
                      {ingredients.length === 0 && (
                        <SelectItem value="none" disabled>
                          No ingredients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mtype">Movement Type *</Label>
                  <Select
                    value={formState.type}
                    onValueChange={(v) => handleFormChange('type', v as MovementType)}
                  >
                    <SelectTrigger id="mtype">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waste">Waste</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={formState.quantity}
                      onChange={(e) => handleFormChange('quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Unit Cost (optional)</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="any"
                      placeholder={
                        selectedIngredientCost !== undefined
                          ? `Default: ${selectedIngredientCost}`
                          : '0.00'
                      }
                      value={formState.cost}
                      onChange={(e) => handleFormChange('cost', e.target.value)}
                    />
                  </div>
                </div>

                {estimatedLossDisplay !== null && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      Estimated loss: <strong>${estimatedLossDisplay.toFixed(2)}</strong>
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Expired product, damaged goods, spillage, physical count correction..."
                    rows={3}
                    value={formState.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (optional)</Label>
                  <Input
                    id="reference"
                    placeholder="PO-123, Shift notes, Invoice #..."
                    value={formState.reference}
                    onChange={(e) => handleFormChange('reference', e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitSingleAdjustment}
                  disabled={adjustStockMutation.isPending}
                  className={
                    formState.type === 'waste' ? 'bg-red-600 hover:bg-red-700' : ''
                  }
                >
                  {adjustStockMutation.isPending ? 'Recording...' : 'Record Movement'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <Package className="h-4 w-4" />
            Batch Operation
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Waste</p>
                  <p className="text-2xl font-bold">
                    {movementsQuery.isLoading ? '...' : stats.totalWaste}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <Trash2 className="h-8 w-8 text-red-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adjustments</p>
                  <p className="text-2xl font-bold">
                    {movementsQuery.isLoading ? '...' : stats.adjustmentCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <Scale className="h-8 w-8 text-purple-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Wasted</p>
                  <p className="text-2xl font-bold truncate max-w-[160px]">
                    {movementsQuery.isLoading ? '...' : stats.topWastedName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">By value this month</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Est. Loss</p>
                  <p className="text-2xl font-bold">
                    {movementsQuery.isLoading
                      ? '...'
                      : `$${stats.estimatedLoss.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Waste cost this month</p>
                </div>
                <ArrowDownCircle className="h-8 w-8 text-orange-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="activity" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ingredient, reason, or reference..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9 min-w-[160px]"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9 min-w-[160px]"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                <Badge
                  variant={typeFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setTypeFilter('all')}
                >
                  All ({movements.length})
                </Badge>
                <Badge
                  variant={typeFilter === 'waste' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setTypeFilter('waste')}
                >
                  <Trash2 className="h-3 w-3 mr-1 inline" />
                  Waste ({countByType('waste')})
                </Badge>
                <Badge
                  variant={typeFilter === 'adjustment' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setTypeFilter('adjustment')}
                >
                  <Scale className="h-3 w-3 mr-1 inline" />
                  Adjustment ({countByType('adjustment')})
                </Badge>
                <Badge
                  variant={typeFilter === 'in' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setTypeFilter('in')}
                >
                  <ArrowUpCircle className="h-3 w-3 mr-1 inline" />
                  Stock In ({countByType('in')})
                </Badge>
                <Badge
                  variant={typeFilter === 'out' ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setTypeFilter('out')}
                >
                  <ArrowDownCircle className="h-3 w-3 mr-1 inline" />
                  Stock Out ({countByType('out')})
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Movements</CardTitle>
              <CardDescription>
                {filteredMovements.length} movement{filteredMovements.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movementsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <h3 className="mt-4 text-lg font-medium">No movements found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || startDate || endDate || typeFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No movements recorded yet. Log waste or an adjustment to get started.'}
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
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead>Performed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((m) => (
                        <TableRow
                          key={m._id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            setSelectedMovement(selectedMovement?._id === m._id ? null : m)
                          }
                        >
                          <TableCell className="whitespace-nowrap text-sm">
                            {format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {m.ingredient?.name ?? '—'}
                            {m.ingredient?.unit && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({m.ingredient.unit})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={typeBadgeColor[m.type] || ''}
                              variant="secondary"
                            >
                              <span className="inline-flex items-center">
                                {typeIcon[m.type]}
                                <span className="capitalize">{m.type}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {Math.abs(m.quantity).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <div className="text-sm truncate" title={m.reason}>
                              {m.reason || '—'}
                              {m.reference && (
                                <span className="text-xs text-muted-foreground ml-1 block">
                                  Ref: {m.reference}
                                </span>
                              )}
                            </div>
                            {selectedMovement?._id === m._id && (
                              <div className="mt-2 p-3 rounded-md bg-muted text-xs space-y-1 animate-in fade-in">
                                <div>
                                  <span className="font-medium">Full reason:</span> {m.reason}
                                </div>
                                <div>
                                  <span className="font-medium">Balance after:</span>{' '}
                                  {m.balance?.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  }) ?? '—'}{' '}
                                  {m.ingredient?.unit}
                                </div>
                                <div>
                                  <span className="font-medium">Movement ID:</span>{' '}
                                  <code className="bg-background px-1 rounded">{m._id}</code>
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {typeof m.movementValue === 'number' ? (
                              `$${m.movementValue.toFixed(2)}`
                            ) : typeof m.costPerUnit === 'number' ? (
                              `$${(Math.abs(m.quantity) * m.costPerUnit).toFixed(2)}`
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.createdBy || 'System'}
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

        <TabsContent value="batch" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Stock Operation</CardTitle>
              <CardDescription>
                Record multiple waste / adjustment / stock movements in a single submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {batchRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_2fr_auto] gap-3 items-start p-3 rounded-lg border border-border bg-background"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Ingredient *
                      </Label>
                      <Select
                        value={row.ingredientId}
                        onValueChange={(v) => updateBatchRow(row.id, 'ingredientId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing._id} value={ing._id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Qty *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={row.quantity}
                        onChange={(e) => updateBatchRow(row.id, 'quantity', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Type *</Label>
                      <Select
                        value={row.type}
                        onValueChange={(v) => updateBatchRow(row.id, 'type', v as MovementType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waste">Waste</SelectItem>
                          <SelectItem value="adjustment">Adjustment</SelectItem>
                          <SelectItem value="in">Stock In</SelectItem>
                          <SelectItem value="out">Stock Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Reason *</Label>
                      <Input
                        placeholder="Short reason..."
                        value={row.reason}
                        onChange={(e) => updateBatchRow(row.id, 'reason', e.target.value)}
                      />
                    </div>

                    <div className="flex items-end h-full pt-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatchRow(row.id)}
                        disabled={batchRows.length <= 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={addBatchRow} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
                <Button
                  onClick={submitBatchAdjustment}
                  disabled={batchAdjustStockMutation.isPending}
                >
                  {batchAdjustStockMutation.isPending
                    ? 'Submitting...'
                    : `Submit Batch (${batchRows.length} row${batchRows.length !== 1 ? 's' : ''})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WasteTrackingPage;
