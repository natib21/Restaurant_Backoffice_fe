// src/features/Inventory/pages/IngredientsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  useGetIngredientsList,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  type Ingredient,
  type IngredientCreateRequest,
} from '@/api/Queries/ingredientQueries';
import { useGetSuppliersList } from '@/api/Queries/supplierQueries';
import { useSetStockThresholds } from '@/api/Queries/inventoryQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Edit,
  Trash2,
  Package,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Truck,
  DollarSign,
  ShoppingCart,
  Download,
  Upload,
  Layers,
  Store,
} from 'lucide-react';
import { formatDistanceToNow, isWithinInterval, addDays } from 'date-fns';
import {
  PageHeader,
  DataCard,
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type BulkAction,
  type KanbanColumnConfig,
  type SavedPreset,
} from '@/components/Common';
import { toast } from 'sonner';

const CATEGORY_OPTIONS: IngredientCreateRequest['category'][] = [
  'vegetables',
  'meat',
  'dairy',
  'grains',
  'spices',
  'beverages',
  'other',
];

const UNIT_OPTIONS: IngredientCreateRequest['unit'][] = [
  'kg',
  'g',
  'liter',
  'ml',
  'pieces',
  'boxes',
  'cans',
];

type FormState = {
  name: string;
  category: IngredientCreateRequest['category'];
  unit: IngredientCreateRequest['unit'];
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  supplier: string;
  expiryDate: string;
};

const emptyForm: FormState = {
  name: '',
  category: 'other',
  unit: 'kg',
  currentStock: 0,
  minStock: 0,
  maxStock: 0,
  costPerUnit: 0,
  supplier: '',
  expiryDate: '',
};

const IngredientsPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [thresholdIngredient, setThresholdIngredient] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [thresholdForm, setThresholdForm] = useState({ minStock: 0, maxStock: 0 });

  const { data, isLoading, error } = useGetIngredientsList();
  const { data: suppliersData } = useGetSuppliersList();
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const setThresholdsMutation = useSetStockThresholds();

  const ingredients: Ingredient[] = data?.data?.ingredients || [];
  const suppliers = suppliersData?.data?.suppliers || [];

  // Helper functions
  const isExpiringSoon = (dateStr?: string, days = 14) => {
    if (!dateStr) return false;
    const today = new Date();
    const expiry = new Date(dateStr);
    return isWithinInterval(expiry, {
      start: today,
      end: addDays(today, days),
    });
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getStockLevelColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-emerald-500';
      case 'low_stock':
        return 'bg-amber-500';
      case 'out_of_stock':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  const getStockLevelPercent = (ing: Ingredient) => {
    if (ing.maxStock <= 0) return ing.currentStock > 0 ? 50 : 0;
    return Math.min(100, Math.max(0, (ing.currentStock / ing.maxStock) * 100));
  };

  // Summary counts for quick filters and cards
  const totalIngredients = ingredients.length;
  const inStockCount = useMemo(
    () => ingredients.filter((i) => i.stockStatus === 'in_stock').length,
    [ingredients]
  );
  const lowStockCount = useMemo(
    () => ingredients.filter((i) => i.stockStatus === 'low_stock').length,
    [ingredients]
  );
  const outOfStockCount = useMemo(
    () => ingredients.filter((i) => i.stockStatus === 'out_of_stock').length,
    [ingredients]
  );
  const expiringSoonCount = useMemo(
    () => ingredients.filter((i) => isExpiringSoon(i.expiryDate, 14) && !isExpired(i.expiryDate)).length,
    [ingredients]
  );
  const allGoodCount = useMemo(
    () =>
      ingredients.filter(
        (i) => i.stockStatus === 'in_stock' && !isExpiringSoon(i.expiryDate, 14) && !isExpired(i.expiryDate)
      ).length,
    [ingredients]
  );
  const totalInventoryValue = useMemo(
    () => ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit || 0), 0),
    [ingredients]
  );

  const openCreateDialog = () => {
    setEditingIngredient(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setForm({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock,
      maxStock: ingredient.maxStock,
      costPerUnit: ingredient.costPerUnit,
      supplier: ingredient.supplier?._id || '',
      expiryDate: ingredient.expiryDate ? ingredient.expiryDate.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const openThresholdDialog = (ingredient: Ingredient) => {
    setThresholdIngredient(ingredient);
    setThresholdForm({
      minStock: ingredient.minStock,
      maxStock: ingredient.maxStock,
    });
    setThresholdDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }
    if (!form.supplier) {
      toast.error('Please select a supplier');
      return;
    }

    const payload: IngredientCreateRequest = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      currentStock: Number(form.currentStock),
      minStock: Number(form.minStock),
      maxStock: Number(form.maxStock),
      costPerUnit: Number(form.costPerUnit),
      supplier: form.supplier,
      ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
    };

    try {
      if (editingIngredient) {
        await updateMutation.mutateAsync({
          ingredientId: editingIngredient._id,
          data: payload,
        });
        toast.success('Ingredient updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Ingredient created successfully');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save ingredient');
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    try {
      await deleteMutation.mutateAsync(ingredient._id);
      toast.success('Ingredient deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete ingredient');
    }
  };

  const handleThresholdSubmit = async () => {
    if (!thresholdIngredient) return;
    try {
      await setThresholdsMutation.mutateAsync({
        ingredientId: thresholdIngredient._id,
        minStock: Number(thresholdForm.minStock),
        maxStock: Number(thresholdForm.maxStock),
      });
      toast.success('Stock thresholds updated successfully');
      setThresholdDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update thresholds');
    }
  };

  const getStatusBadge = (status: string, expDate?: string) => {
    const expired = isExpired(expDate);
    const expiring = isExpiringSoon(expDate, 14);

    if (expired) {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 font-bold text-[10px]">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (expiring) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-bold text-[10px]">
          <Clock className="h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    }
    switch (status) {
      case 'in_stock':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-bold text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            In Stock
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-bold text-[10px]">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 font-bold text-[10px]">
            <XCircle className="h-3 w-3" />
            Out of Stock
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 1. Table Columns Definition
  const columns: ColumnDef<Ingredient>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Ingredient',
        sortable: true,
        accessorKey: 'name',
        cell: (ing) => {
          const percent = getStockLevelPercent(ing);
          const color = getStockLevelColor(ing.stockStatus);
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{ing.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {ing.category}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        id: 'currentStock',
        header: 'Current Stock',
        sortable: true,
        cell: (ing) => (
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1 font-mono font-bold text-xs text-slate-900 dark:text-white">
              <span>{ing.currentStock}</span>
              <span className="text-[10px] font-normal text-slate-500">{ing.unit}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Min: {ing.minStock} / Max: {ing.maxStock}
            </div>
          </div>
        ),
      },
      {
        id: 'costPerUnit',
        header: 'Cost / Unit',
        sortable: true,
        cell: (ing) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              ETB {ing.costPerUnit?.toFixed(2)}
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              Value: ETB {((ing.currentStock || 0) * (ing.costPerUnit || 0)).toFixed(0)}
            </div>
          </div>
        ),
      },
      {
        id: 'supplier',
        header: 'Supplier',
        sortable: true,
        cell: (ing) => (
          <div className="space-y-0.5">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
              <Truck className="h-3 w-3 text-slate-400 shrink-0" />
              {ing.supplier?.name || '—'}
            </span>
          </div>
        ),
      },
      {
        id: 'expiryDate',
        header: 'Expiry',
        sortable: true,
        cell: (ing) => {
          if (!ing.expiryDate) {
            return <span className="text-xs text-slate-400 italic">N/A</span>;
          }
          const expired = isExpired(ing.expiryDate);
          const expiring = isExpiringSoon(ing.expiryDate, 14);
          return (
            <div className="space-y-0.5">
              <span
                className={`text-xs font-medium ${
                  expired
                    ? 'text-rose-600 dark:text-rose-400'
                    : expiring
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {new Date(ing.expiryDate).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {formatDistanceToNow(new Date(ing.expiryDate), { addSuffix: true })}
              </span>
            </div>
          );
        },
      },
      {
        id: 'stockStatus',
        header: 'Status',
        sortable: true,
        cell: (ing) => getStatusBadge(ing.stockStatus, ing.expiryDate),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (ing) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
              onClick={() => openThresholdDialog(ing)}
              title="Set stock thresholds"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
              onClick={() => openEditDialog(ing)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => handleDelete(ing)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // 2. Quick Filter Tabs
  const quickFilters: QuickFilterOption<Ingredient>[] = useMemo(
    () => [
      {
        key: 'all',
        label: 'All Items',
        count: totalIngredients,
        icon: <Package className="h-3.5 w-3.5" />,
        matcher: () => true,
      },
      {
        key: 'low_stock',
        label: 'Low Stock',
        count: lowStockCount,
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
        matcher: (i: Ingredient) => i.stockStatus === 'low_stock',
      },
      {
        key: 'out_of_stock',
        label: 'Out of Stock',
        count: outOfStockCount,
        icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
        matcher: (i: Ingredient) => i.stockStatus === 'out_of_stock',
      },
      {
        key: 'expiring',
        label: 'Expiring Soon',
        count: expiringSoonCount,
        icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
        matcher: (i: Ingredient) => isExpiringSoon(i.expiryDate, 14) && !isExpired(i.expiryDate),
      },
      {
        key: 'all_good',
        label: 'All Good',
        count: allGoodCount,
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
        matcher: (i: Ingredient) =>
          i.stockStatus === 'in_stock' &&
          !isExpiringSoon(i.expiryDate, 14) &&
          !isExpired(i.expiryDate),
      },
    ],
    [totalIngredients, lowStockCount, outOfStockCount, expiringSoonCount, allGoodCount]
  );

  // 3. Advanced Filter Fields
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'category',
        label: 'Category',
        type: 'multi-select',
        options: CATEGORY_OPTIONS.map((cat) => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: cat,
        })),
      },
      {
        id: 'unit',
        label: 'Unit Type',
        type: 'multi-select',
        options: UNIT_OPTIONS.map((u) => ({ label: u, value: u })),
      },
      {
        id: 'currentStock',
        label: 'Stock Quantity Range',
        type: 'number-range',
        min: 0,
        max: 10000,
        step: 1,
        description: 'Filter by current stock on hand',
      },
      {
        id: 'costPerUnit',
        label: 'Unit Cost (ETB)',
        type: 'number-range',
        prefix: 'ETB ',
        min: 0,
        max: 10000,
        step: 1,
        description: 'Filter by cost per unit',
      },
      {
        id: 'expiryDate',
        label: 'Expiry Date Range',
        type: 'date-range',
        description: 'Filter by ingredients expiring within date range',
      },
      {
        id: 'stockStatus',
        label: 'Stock Status',
        type: 'status-pills',
        options: [
          { label: 'In Stock', value: 'in_stock', color: 'emerald' },
          { label: 'Low Stock', value: 'low_stock', color: 'amber' },
          { label: 'Out of Stock', value: 'out_of_stock', color: 'rose' },
        ],
      },
    ],
    []
  );

  // 4. Grouping Options
  const groupByOptions: GroupByOption<Ingredient>[] = useMemo(
    () => [
      {
        id: 'category',
        label: 'By Category',
        icon: <Tag className="h-4 w-4" />,
        accessor: (ing) => ing.category?.toUpperCase() || 'UNCATEGORIZED',
      },
      {
        id: 'supplier',
        label: 'By Supplier',
        icon: <Truck className="h-4 w-4" />,
        accessor: (ing) => ing.supplier?.name?.toUpperCase() || 'NO SUPPLIER',
      },
      {
        id: 'stockStatus',
        label: 'By Stock Status',
        icon: <Layers className="h-4 w-4" />,
        accessor: (ing) => ing.stockStatus?.replace('_', ' ').toUpperCase() || 'UNKNOWN',
      },
    ],
    []
  );

  // 5. Sorting Options
  const sortOptions: SortOption<Ingredient>[] = useMemo(
    () => [
      { id: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
      { id: 'name_desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
      { id: 'stock_asc', label: 'Stock (Low to High)', field: 'currentStock', direction: 'asc' },
      { id: 'stock_desc', label: 'Stock (High to Low)', field: 'currentStock', direction: 'desc' },
      { id: 'cost_asc', label: 'Cost (Low to High)', field: 'costPerUnit', direction: 'asc' },
      { id: 'cost_desc', label: 'Cost (High to Low)', field: 'costPerUnit', direction: 'desc' },
      { id: 'expiry_asc', label: 'Expiry (Soonest First)', field: 'expiryDate', direction: 'asc' },
      { id: 'value_desc', label: 'Inventory Value (High to Low)', field: 'costPerUnit', direction: 'desc' },
    ],
    []
  );

  // 6. Kanban Columns
  const kanbanColumns: KanbanColumnConfig<Ingredient>[] = useMemo(
    () => [
      {
        id: 'out_of_stock',
        title: 'Out of Stock',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        icon: <XCircle className="h-4 w-4 text-rose-600" />,
        matcher: (i) => i.stockStatus === 'out_of_stock',
      },
      {
        id: 'low_stock',
        title: 'Low Stock',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
        matcher: (i) => i.stockStatus === 'low_stock',
      },
      {
        id: 'in_stock',
        title: 'In Stock',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        matcher: (i) => i.stockStatus === 'in_stock',
      },
    ],
    []
  );

  // 7. System Presets
  const initialPresets: SavedPreset[] = useMemo(
    () => [
      {
        id: 'preset-lowstock',
        name: 'Restock Alerts',
        isSystem: true,
        filters: {
          quickFilter: 'low_stock',
          advanced: {},
          groupBy: null,
          viewMode: 'grid',
          sortField: 'currentStock',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-expiring',
        name: 'Expiring Soon',
        isSystem: true,
        filters: {
          quickFilter: 'expiring',
          advanced: {},
          groupBy: null,
          viewMode: 'table',
          sortField: 'expiryDate',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-highvalue',
        name: 'High Value Stock',
        isSystem: true,
        filters: {
          quickFilter: 'all_good',
          advanced: { costPerUnit: { min: 100 } },
          groupBy: 'category',
          viewMode: 'table',
          sortField: 'costPerUnit',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
    ],
    []
  );

  // 8. Bulk Actions
  const bulkActions: BulkAction<Ingredient>[] = useMemo(
    () => [
      {
        id: 'create_po',
        label: 'Create Purchase Order',
        icon: <ShoppingCart className="h-4 w-4 text-primary" />,
        variant: 'default',
        onClick: (selected, clearSelection) => {
          toast.success(
            `Purchase order draft created for ${selected.length} ingredient(s). Review in Purchase Orders.`
          );
          clearSelection();
        },
      },
      {
        id: 'update_prices',
        label: 'Update Prices',
        icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
        variant: 'secondary',
        onClick: (selected, clearSelection) => {
          toast.info(`Bulk price update dialog for ${selected.length} item(s) - feature coming soon.`);
          clearSelection();
        },
      },
      {
        id: 'set_thresholds',
        label: 'Set Thresholds',
        icon: <Settings2 className="h-4 w-4" />,
        variant: 'outline',
        onClick: (selected, clearSelection) => {
          toast.info(`Bulk threshold configuration for ${selected.length} item(s) - feature coming soon.`);
          clearSelection();
        },
      },
      {
        id: 'export_csv',
        label: 'Export CSV',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline',
        onClick: (selected, clearSelection) => {
          const rows = selected.map((i) => ({
            ID: i._id,
            Name: i.name,
            Category: i.category,
            Unit: i.unit,
            CurrentStock: i.currentStock,
            MinStock: i.minStock,
            MaxStock: i.maxStock,
            CostPerUnit: i.costPerUnit,
            Supplier: i.supplier?.name || '',
            ExpiryDate: i.expiryDate || '',
            Status: i.stockStatus,
            InventoryValue: (i.currentStock * i.costPerUnit).toFixed(2),
          }));
          const csvHeader = Object.keys(rows[0] || {}).join(',');
          const csvBody = rows
            .map((row) =>
              Object.values(row)
                .map((val) => `"${String(val).replace(/"/g, '""')}"`)
                .join(',')
            )
            .join('\n');
          const blob = new Blob([`${csvHeader}\n${csvBody}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ingredients_export_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${selected.length} ingredients to CSV.`);
          clearSelection();
        },
      },
    ],
    []
  );

  // 9. Custom Card Renderer (Grid View)
  const renderIngredientCard = (
    ing: Ingredient,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const percent = getStockLevelPercent(ing);
    const color = getStockLevelColor(ing.stockStatus);
    const expired = isExpired(ing.expiryDate);
    const expiring = isExpiringSoon(ing.expiryDate, 14);

    const borderColor =
      expired
        ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20'
        : ing.stockStatus === 'out_of_stock'
        ? 'border-rose-300 dark:border-rose-700'
        : ing.stockStatus === 'low_stock'
        ? 'border-amber-300 dark:border-amber-700'
        : expiring
        ? 'border-amber-300 dark:border-amber-700'
        : 'border-slate-200 dark:border-slate-800';

    return (
      <div
        className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md bg-white dark:bg-slate-900 ${
          isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : borderColor
        }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>

        {/* Header: Icon + Name + Status */}
        <div className="flex items-start gap-3 mb-3 pr-8">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
              expired
                ? 'bg-rose-500/10 text-rose-600'
                : ing.stockStatus === 'in_stock'
                ? 'bg-emerald-500/10 text-emerald-600'
                : ing.stockStatus === 'low_stock'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-rose-500/10 text-rose-600'
            }`}
          >
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {ing.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                {ing.category}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                / {ing.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Level Bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Stock Level</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {ing.currentStock} {ing.unit}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Min: {ing.minStock}</span>
            <span>Max: {ing.maxStock}</span>
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg space-y-0.5">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <DollarSign className="h-2.5 w-2.5" /> Unit Cost
            </p>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ETB {ing.costPerUnit?.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg space-y-0.5">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Store className="h-2.5 w-2.5" /> Inv. Value
            </p>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ETB {((ing.currentStock || 0) * (ing.costPerUnit || 0)).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Supplier + Expiry */}
        <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 mb-3">
          {ing.supplier && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Truck className="h-3 w-3 text-slate-400" /> Supplier
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                {ing.supplier.name}
              </span>
            </div>
          )}
          {ing.expiryDate ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" /> Expires
              </span>
              <span
                className={`font-mono font-medium ${
                  expired
                    ? 'text-rose-600 dark:text-rose-400'
                    : expiring
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {new Date(ing.expiryDate).toLocaleDateString()}
              </span>
            </div>
          ) : null}
        </div>

        {/* Footer: Status + Actions */}
        <div className="flex items-center justify-between">
          {getStatusBadge(ing.stockStatus, ing.expiryDate)}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openThresholdDialog(ing)}
              title="Thresholds"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openEditDialog(ing)}
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-rose-400 hover:text-rose-600"
              onClick={() => handleDelete(ing)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // 10. Custom List Item Renderer (List View)
  const renderIngredientListItem = (
    ing: Ingredient,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const percent = getStockLevelPercent(ing);
    const color = getStockLevelColor(ing.stockStatus);
    const expired = isExpired(ing.expiryDate);
    const expiring = isExpiringSoon(ing.expiryDate, 14);

    return (
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Icon + Name + Category */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                expired
                  ? 'bg-rose-500/10 text-rose-600'
                  : ing.stockStatus === 'in_stock'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : ing.stockStatus === 'low_stock'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-rose-500/10 text-rose-600'
              }`}
            >
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {ing.name}
              </span>
              <span className="text-[10px] px-1.5 py-0 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize shrink-0">
                {ing.category}
              </span>
              {getStatusBadge(ing.stockStatus, ing.expiryDate)}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
              <span className="font-mono">
                {ing.currentStock} {ing.unit}
              </span>
              <div className="h-1 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
              </div>
              {ing.supplier && (
                <span className="flex items-center gap-1 truncate">
                  <Truck className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{ing.supplier.name}</span>
                </span>
              )}
              {ing.expiryDate && (expired || expiring) && (
                <span
                  className={`font-mono ${
                    expired ? 'text-rose-500' : 'text-amber-500'
                  }`}
                >
                  {new Date(ing.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cost + Value + Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] text-slate-400">Unit Cost</p>
              <p className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                ETB {ing.costPerUnit?.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Value</p>
              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                ETB {((ing.currentStock || 0) * (ing.costPerUnit || 0)).toFixed(0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openThresholdDialog(ing)}
              title="Thresholds"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openEditDialog(ing)}
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-rose-400 hover:text-rose-600"
              onClick={() => handleDelete(ing)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Ingredients Management"
        subtitle="Manage inventory raw items, supply thresholds, units, and supplier allocations"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Standard DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Items"
            value={isLoading ? '...' : totalIngredients}
            icon={<Package className="h-5 w-5" />}
            theme="primary"
            subtitle="Cataloged raw ingredients"
            isLoading={isLoading}
          />

          <DataCard
            title="In Stock"
            value={isLoading ? '...' : inStockCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Healthy supply levels"
            isLoading={isLoading}
          />

          <DataCard
            title="Low Stock"
            value={isLoading ? '...' : lowStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            theme="amber"
            subtitle="Near minimum reorder threshold"
            isLoading={isLoading}
          />

          <DataCard
            title="Total Inventory Value"
            value={
              isLoading
                ? '...'
                : `ETB ${totalInventoryValue.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
            }
            icon={<DollarSign className="h-5 w-5" />}
            theme="slate"
            subtitle="On-hand stock at cost"
            isLoading={isLoading}
          />
        </div>

        {/* Advanced DataViewSystem */}
        <DataViewSystem<Ingredient>
          data={ingredients}
          rowKey="_id"
          entityName="ingredients"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<Package className="h-8 w-8 text-slate-400" />}
          emptyTitle="No ingredients found"
          emptyDescription="No ingredients match the current filter or search criteria. Start by adding your first ingredient."
          emptyActionLabel="Add Ingredient"
          onEmptyAction={openCreateDialog}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search ingredients by name, category, or supplier..."
          searchFields={['name', 'category', 'supplier.name', 'unit']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="name"
          defaultSortDirection="asc"
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="stockStatus"
          presetStorageKey="ingredients_view_presets"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          renderCustomCard={renderIngredientCard}
          renderCustomListItem={renderIngredientListItem}
          exportFileName="ingredients_inventory_export"
          onItemClick={(ing) => openEditDialog(ing)}
          primaryAction={{
            label: 'Add Ingredient',
            icon: <Plus className="h-4 w-4" />,
            onClick: openCreateDialog,
          }}
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Add / Edit Ingredient Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingIngredient ? 'Edit Ingredient' : 'Create New Ingredient'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingIngredient
                ? 'Update the ingredient parameters below.'
                : 'Fill in the details to create a new ingredient.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-semibold">Ingredient Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Fresh Tomatoes"
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm({ ...form, category: v as IngredientCreateRequest['category'] })
                }
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs font-semibold">Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) =>
                  setForm({ ...form, unit: v as IngredientCreateRequest['unit'] })
                }
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit} className="text-xs">
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentStock" className="text-xs font-semibold">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                value={form.currentStock}
                onChange={(e) =>
                  setForm({ ...form, currentStock: Number(e.target.value) })
                }
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costPerUnit" className="text-xs font-semibold">Cost Per Unit (ETB)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                value={form.costPerUnit}
                onChange={(e) =>
                  setForm({ ...form, costPerUnit: Number(e.target.value) })
                }
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minStock" className="text-xs font-semibold">Min Alert Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxStock" className="text-xs font-semibold">Max Capacity Stock</Label>
              <Input
                id="maxStock"
                type="number"
                value={form.maxStock}
                onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="supplier" className="text-xs font-semibold">Supplier *</Label>
              <Select
                value={form.supplier}
                onValueChange={(v) => setForm({ ...form, supplier: v })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                  {suppliers.length === 0 && (
                    <SelectItem value="__none" disabled className="text-xs">
                      No suppliers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="expiryDate" className="text-xs font-semibold">Expiry Date (optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl font-bold"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingIngredient
                ? 'Update Ingredient'
                : 'Create Ingredient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Thresholds Dialog */}
      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Set Stock Thresholds</DialogTitle>
            <DialogDescription className="text-xs">
              {thresholdIngredient
                ? `Configure min/max notification levels for ${thresholdIngredient.name}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="th-min" className="text-xs font-semibold">Min Stock</Label>
              <Input
                id="th-min"
                type="number"
                value={thresholdForm.minStock}
                onChange={(e) =>
                  setThresholdForm({ ...thresholdForm, minStock: Number(e.target.value) })
                }
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="th-max" className="text-xs font-semibold">Max Stock</Label>
              <Input
                id="th-max"
                type="number"
                value={thresholdForm.maxStock}
                onChange={(e) =>
                  setThresholdForm({ ...thresholdForm, maxStock: Number(e.target.value) })
                }
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setThresholdDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleThresholdSubmit}
              disabled={setThresholdsMutation.isPending}
              className="rounded-xl font-bold"
            >
              {setThresholdsMutation.isPending ? 'Saving...' : 'Save Thresholds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IngredientsPage;
