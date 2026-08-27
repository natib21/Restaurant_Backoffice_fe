// src/features/Inventory/pages/RecipesPage.tsx
import React, { useState, useMemo } from 'react';
import {
  useGetRecipesList,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  type Recipe,
  type RecipeCreateRequest,
  type RecipeItem,
} from '@/api/Queries/recipeQueries';
import { useMenuItemsQuery, type MenuItem } from '@/api/Queries/menuQueries';
import { getLocalizedName, getLocalizedText } from '@/features/Menu/lib/localizationUtils';
import { useGetIngredientsList, type Ingredient } from '@/api/Queries/ingredientQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  ChefHat,
  Edit,
  Trash2,
  PlusCircle,
  MinusCircle,
  DollarSign,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  PageHeader,
  DataCard,
  FilterBar,
  DataTable,
  type ColumnDef,
} from '@/components/Common';

type UnitType = 'kg' | 'g' | 'liter' | 'ml' | 'pieces' | 'boxes' | 'cans';

const UNIT_OPTIONS: UnitType[] = ['kg', 'g', 'liter', 'ml', 'pieces', 'boxes', 'cans'];

interface RecipeFormItem {
  id: string;
  ingredient: string;
  quantity: number;
  unit: UnitType;
}

const createEmptyItem = (): RecipeFormItem => ({
  id: Math.random().toString(36).substring(2, 9),
  ingredient: '',
  quantity: 0,
  unit: 'kg',
});

const formatCurrency = (n: number) => `$${Number(n || 0).toFixed(2)}`;

const RecipesPage: React.FC = () => {
  const { toast } = useToast();

  // Basic Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuItemFilter, setMenuItemFilter] = useState<string>('all');
  const [costTierFilter, setCostTierFilter] = useState<string>('all');

  // Advanced Filter States
  const [minCost, setMinCost] = useState<string>('');
  const [maxCost, setMaxCost] = useState<string>('');
  const [minYield, setMinYield] = useState<string>('');
  const [maxYield, setMaxYield] = useState<string>('');
  const [ingredientFilter, setIngredientFilter] = useState<string>('all');

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Form States
  const [formMenuItem, setFormMenuItem] = useState('');
  const [formName, setFormName] = useState('');
  const [formYield, setFormYield] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formItems, setFormItems] = useState<RecipeFormItem[]>([createEmptyItem()]);

  // Queries & Mutations
  const recipesQuery = useGetRecipesList();
  const menuItemsQuery = useMenuItemsQuery();
  const ingredientsQuery = useGetIngredientsList();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const recipes: Recipe[] = recipesQuery.data?.data?.recipes ?? [];
  const menuItems: MenuItem[] = menuItemsQuery.data ?? [];
  const ingredients: Ingredient[] = ingredientsQuery.data?.data?.ingredients ?? [];

  const ingredientCostMap = useMemo(() => {
    const map = new Map<string, { cost: number; name: string; unit: string }>();
    ingredients.forEach((ing) => {
      if (ing._id) {
        map.set(ing._id, {
          cost: ing.costPerUnit || 0,
          name: ing.name || 'Ingredient',
          unit: ing.unit || 'unit',
        });
      }
    });
    return map;
  }, [ingredients]);

  // Active advanced filters count
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (minCost.trim() !== '') count++;
    if (maxCost.trim() !== '') count++;
    if (minYield.trim() !== '') count++;
    if (maxYield.trim() !== '') count++;
    if (ingredientFilter !== 'all') count++;
    return count;
  }, [minCost, maxCost, minYield, maxYield, ingredientFilter]);

  // Filtered Recipes list
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const recipeName = getLocalizedText(r.name, 'en', typeof r.name === 'string' ? r.name : '').toLowerCase();
      const menuItemName = getLocalizedName(r.menuItem, 'en', '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      // Search matching: recipe name, menu item name, or ingredients contained
      const matchesSearch =
        !q ||
        recipeName.includes(q) ||
        menuItemName.includes(q) ||
        r.items?.some((it) => {
          const ingName = typeof it.ingredient === 'object' && it.ingredient?.name ? it.ingredient.name : '';
          return ingName.toLowerCase().includes(q);
        });

      // Status Filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && r.isActive) ||
        (statusFilter === 'inactive' && !r.isActive);

      // Menu Item Filter
      const matchesMenuItem =
        menuItemFilter === 'all' ||
        (r.menuItem?._id === menuItemFilter);

      // Cost Tier Filter
      const cost = r.costPerServing || 0;
      let matchesCostTier = true;
      if (costTierFilter === 'under_5') matchesCostTier = cost < 5;
      else if (costTierFilter === '5_to_15') matchesCostTier = cost >= 5 && cost <= 15;
      else if (costTierFilter === 'over_15') matchesCostTier = cost > 15;

      // Advanced filters: min/max cost
      let matchesMinCost = true;
      if (minCost.trim() !== '' && !isNaN(Number(minCost))) {
        matchesMinCost = cost >= Number(minCost);
      }
      let matchesMaxCost = true;
      if (maxCost.trim() !== '' && !isNaN(Number(maxCost))) {
        matchesMaxCost = cost <= Number(maxCost);
      }

      // Advanced filters: min/max yield
      const y = r.yield || 1;
      let matchesMinYield = true;
      if (minYield.trim() !== '' && !isNaN(Number(minYield))) {
        matchesMinYield = y >= Number(minYield);
      }
      let matchesMaxYield = true;
      if (maxYield.trim() !== '' && !isNaN(Number(maxYield))) {
        matchesMaxYield = y <= Number(maxYield);
      }

      // Advanced filters: specific ingredient
      let matchesIngredient = true;
      if (ingredientFilter !== 'all') {
        matchesIngredient =
          r.items?.some((it) => {
            const ingId = typeof it.ingredient === 'object' ? it.ingredient?._id : it.ingredient;
            return ingId === ingredientFilter;
          }) ?? false;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMenuItem &&
        matchesCostTier &&
        matchesMinCost &&
        matchesMaxCost &&
        matchesMinYield &&
        matchesMaxYield &&
        matchesIngredient
      );
    });
  }, [
    recipes,
    searchQuery,
    statusFilter,
    menuItemFilter,
    costTierFilter,
    minCost,
    maxCost,
    minYield,
    maxYield,
    ingredientFilter,
  ]);

  // Statistical Overview Cards
  const stats = useMemo(() => {
    const total = recipes.length;
    const active = recipes.filter((r) => r.isActive).length;
    const inactive = total - active;
    const avgCostPerServing =
      total > 0
        ? recipes.reduce((sum, r) => sum + (r.costPerServing || 0), 0) / total
        : 0;
    const totalIngredientsUsed = new Set(
      recipes.flatMap((r) =>
        r.items?.map((it) => (typeof it.ingredient === 'object' ? it.ingredient?._id : it.ingredient)) || []
      ).filter(Boolean)
    ).size;

    return { total, active, inactive, avgCostPerServing, totalIngredientsUsed };
  }, [recipes]);

  // Live total cost in modal
  const liveTotalCost = useMemo(() => {
    return formItems.reduce((sum, item) => {
      if (!item.ingredient) return sum;
      const ingInfo = ingredientCostMap.get(item.ingredient);
      const costPerUnit = ingInfo?.cost || 0;
      return sum + (Number(item.quantity) || 0) * costPerUnit;
    }, 0);
  }, [formItems, ingredientCostMap]);

  const liveCostPerServing = useMemo(() => {
    const y = Number(formYield) || 1;
    return liveTotalCost / (y > 0 ? y : 1);
  }, [liveTotalCost, formYield]);

  // Dialog Handlers
  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingRecipe(null);
    setFormMenuItem('');
    setFormName('');
    setFormYield(1);
    setFormIsActive(true);
    setFormItems([createEmptyItem()]);
    setDialogOpen(true);
  };

  const openEditDialog = (recipe: Recipe) => {
    setDialogMode('edit');
    setEditingRecipe(recipe);
    setFormMenuItem(recipe.menuItem?._id || '');
    setFormName(getLocalizedText(recipe.name, 'en', typeof recipe.name === 'string' ? recipe.name : ''));
    setFormYield(recipe.yield || 1);
    setFormIsActive(recipe.isActive ?? true);
    setFormItems(
      (recipe.items?.length
        ? recipe.items.map((it) => ({
            id: Math.random().toString(36).substring(2, 9),
            ingredient: typeof it.ingredient === 'string' ? it.ingredient : it.ingredient?._id || '',
            quantity: it.quantity || 0,
            unit: (it.unit as UnitType) || 'kg',
          }))
        : [createEmptyItem()]
      ) as RecipeFormItem[]
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRecipe(null);
  };

  const addItemRow = () => {
    setFormItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItemRow = (id: string) => {
    setFormItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  const updateItemRow = (id: string, field: keyof RecipeFormItem, value: any) => {
    setFormItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          // If ingredient changed, auto-sync unit if available
          if (field === 'ingredient' && value) {
            const ing = ingredients.find((i) => i._id === value);
            if (ing && ing.unit) {
              updated.unit = ing.unit as UnitType;
            }
          }
          return updated;
        }
        return it;
      })
    );
  };

  const getPayload = (): RecipeCreateRequest | null => {
    if (!formMenuItem || !formName.trim() || formYield < 1) {
      return null;
    }
    const items: RecipeItem[] = formItems
      .filter((it) => it.ingredient && it.quantity > 0)
      .map((it) => ({
        ingredient: it.ingredient,
        quantity: Number(it.quantity),
        unit: it.unit,
      }));
    if (items.length === 0) return null;
    return {
      menuItem: formMenuItem,
      name: formName.trim(),
      yield: Number(formYield),
      items,
      isActive: formIsActive,
    };
  };

  const handleSubmit = async () => {
    const payload = getPayload();
    if (!payload) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields and add at least one ingredient with quantity.',
        variant: 'destructive',
      });
      return;
    }
    try {
      if (dialogMode === 'create') {
        await createRecipe.mutateAsync(payload);
        toast({ title: 'Recipe Created', description: `${payload.name} has been added.` });
      } else if (editingRecipe) {
        await updateRecipe.mutateAsync({ recipeId: editingRecipe._id, data: payload });
        toast({ title: 'Recipe Updated', description: `${payload.name} has been updated.` });
      }
      closeDialog();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const openDeleteConfirm = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recipeToDelete) return;
    try {
      await deleteRecipe.mutateAsync(recipeToDelete._id);
      toast({
        title: 'Recipe Deleted',
        description: `${getLocalizedText(recipeToDelete.name, 'en', typeof recipeToDelete.name === 'string' ? recipeToDelete.name : 'Recipe')} has been removed.`,
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMenuItemFilter('all');
    setCostTierFilter('all');
    setMinCost('');
    setMaxCost('');
    setMinYield('');
    setMaxYield('');
    setIngredientFilter('all');
  };

  const resetAdvancedFilters = () => {
    setMinCost('');
    setMaxCost('');
    setMinYield('');
    setMaxYield('');
    setIngredientFilter('all');
  };

  // Table Columns Definition
  const columns: ColumnDef<Recipe>[] = [
    {
      id: 'name',
      header: 'Recipe / Formulation',
      sortable: true,
      accessorKey: 'name',
      cell: (recipe) => {
        const recipeName = getLocalizedText(
          recipe.name,
          'en',
          typeof recipe.name === 'string' ? recipe.name : 'Unnamed Recipe'
        );
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ChefHat className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">
                {recipeName}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                #{recipe._id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'menuItem',
      header: 'Menu Item',
      sortable: true,
      cell: (recipe) => {
        const itemName = getLocalizedName(recipe.menuItem, 'en', '—');
        return (
          <div className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {itemName}
            </span>
          </div>
        );
      },
    },
    {
      id: 'yield',
      header: 'Yield',
      sortable: true,
      align: 'center',
      cell: (recipe) => (
        <Badge variant="outline" className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5">
          {recipe.yield} {recipe.yield === 1 ? 'serving' : 'servings'}
        </Badge>
      ),
    },
    {
      id: 'items',
      header: 'Ingredients',
      sortable: true,
      cell: (recipe) => {
        const items = recipe.items || [];
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0.5">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
            {items.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-slate-700"
                    title="View ingredients"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 text-xs space-y-2" align="start">
                  <p className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1">
                    Ingredients List ({items.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it, idx) => {
                      const ingName =
                        typeof it.ingredient === 'object' && it.ingredient?.name
                          ? it.ingredient.name
                          : 'Ingredient';
                      return (
                        <div key={idx} className="flex justify-between pt-1 text-[11px]">
                          <span className="text-slate-700 dark:text-slate-300">{ingName}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      },
    },
    {
      id: 'totalCost',
      header: 'Total Cost',
      sortable: true,
      align: 'right',
      cell: (recipe) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {formatCurrency(recipe.totalCost || 0)}
        </span>
      ),
    },
    {
      id: 'costPerServing',
      header: 'Cost / Serving',
      sortable: true,
      align: 'right',
      cell: (recipe) => (
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(recipe.costPerServing || 0)}
          </span>
          <p className="text-[9px] text-slate-400">per portion</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (recipe) => (
        <Badge
          className={
            recipe.isActive
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold'
              : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 text-[10px] font-bold'
          }
        >
          {recipe.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (recipe) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => openEditDialog(recipe)}
            title="Edit Recipe"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
            onClick={() => openDeleteConfirm(recipe)}
            title="Delete Recipe"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const isLoading = recipesQuery.isLoading || menuItemsQuery.isLoading || ingredientsQuery.isLoading;
  const isSubmitting = createRecipe.isPending || updateRecipe.isPending;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Recipe Management"
        subtitle="Build standardized formulas, track ingredient quantities, calculate portion yields, and monitor food cost margins"
        actionLabel="Add Recipe"
        actionIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
        onAction={openCreateDialog}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Standard DataCards metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Recipes"
            value={isLoading ? '...' : stats.total}
            icon={<ChefHat className="h-5 w-5" />}
            theme="primary"
            subtitle="Registered dish formulations"
            isLoading={isLoading}
          />

          <DataCard
            title="Active Formulations"
            value={isLoading ? '...' : stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Live recipes in production"
            isLoading={isLoading}
          />

          <DataCard
            title="Avg Cost / Serving"
            value={isLoading ? '...' : formatCurrency(stats.avgCostPerServing)}
            icon={<DollarSign className="h-5 w-5" />}
            theme="amber"
            subtitle="Average portion ingredient cost"
            isLoading={isLoading}
          />

          <DataCard
            title="Ingredients Linked"
            value={isLoading ? '...' : stats.totalIngredientsUsed}
            icon={<Layers className="h-5 w-5" />}
            theme="indigo"
            subtitle="Catalog items utilized in recipes"
            isLoading={isLoading}
          />
        </div>

        {/* Standard FilterBar with Advanced Drawer & Multi-criteria */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by recipe name, menu item, or ingredients..."
          quickFilters={{
            activeKey: statusFilter,
            onChange: setStatusFilter,
            options: [
              { key: 'all', label: 'All Recipes', count: stats.total },
              { key: 'active', label: 'Active', count: stats.active, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
              { key: 'inactive', label: 'Inactive', count: stats.inactive, icon: <XCircle className="h-3.5 w-3.5" /> },
            ],
          }}
          selectFilters={[
            {
              id: 'menuItem',
              label: 'Menu Item',
              placeholder: 'All Menu Items',
              value: menuItemFilter,
              onChange: setMenuItemFilter,
              width: '190px',
              options: [
                { label: 'All Menu Items', value: 'all' },
                ...menuItems.map((mi) => ({
                  label: getLocalizedName(mi, 'en', 'Menu Item'),
                  value: mi._id,
                })),
              ],
            },
            {
              id: 'costTier',
              label: 'Cost Tier',
              placeholder: 'All Cost Tiers',
              value: costTierFilter,
              onChange: setCostTierFilter,
              width: '160px',
              options: [
                { label: 'All Cost Tiers', value: 'all' },
                { label: 'Under $5.00', value: 'under_5' },
                { label: '$5.00 - $15.00', value: '5_to_15' },
                { label: 'Over $15.00', value: 'over_15' },
              ],
            },
          ]}
          advancedFiltersContent={
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Min Cost / Serving ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max Cost / Serving ($)</Label>
                <Input
                  type="number"
                  placeholder="50.00"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Min Yield (Servings)</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={minYield}
                  onChange={(e) => setMinYield(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contains Ingredient</Label>
                <Select value={ingredientFilter} onValueChange={setIngredientFilter}>
                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 rounded-lg">
                    <SelectValue placeholder="Select ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Ingredients
                    </SelectItem>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing._id} value={ing._id} className="text-xs">
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          activeAdvancedCount={activeAdvancedCount}
          onResetAdvanced={resetAdvancedFilters}
          onReset={resetAllFilters}
        />

        {/* Standard DataTable */}
        <DataTable
          data={filteredRecipes}
          columns={columns}
          isLoading={isLoading}
          paginated={true}
          pageSize={10}
          emptyIcon={<ChefHat className="h-8 w-8 text-slate-400" />}
          emptyTitle="No recipes found"
          emptyDescription={
            searchQuery || statusFilter !== 'all' || activeAdvancedCount > 0
              ? 'No recipes match your filter conditions.'
              : 'Add your first recipe to start calculating food costs and batch requirements.'
          }
          emptyActionLabel="Add Recipe"
          onEmptyAction={openCreateDialog}
        />
      </div>

      {/* Create / Edit Recipe Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? null : closeDialog())}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {dialogMode === 'create'
                ? 'Create New Recipe'
                : `Edit Recipe: ${getLocalizedText(editingRecipe?.name, 'en', typeof editingRecipe?.name === 'string' ? editingRecipe.name : '')}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {dialogMode === 'create'
                ? 'Define a new standardized recipe, link it to a menu item, and detail its ingredient components.'
                : 'Update formulation parameters, ingredient quantities, or portion yield.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="menuItem" className="text-xs font-semibold">Menu Item *</Label>
                <Select
                  value={formMenuItem}
                  onValueChange={setFormMenuItem}
                  disabled={menuItemsQuery.isLoading}
                >
                  <SelectTrigger id="menuItem" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((mi) => (
                      <SelectItem key={mi._id} value={mi._id} className="text-xs">
                        {getLocalizedName(mi, 'en', 'Menu Item')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recipeName" className="text-xs font-semibold">Recipe Formulation Name *</Label>
                <Input
                  id="recipeName"
                  placeholder="e.g. Classic Margherita"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recipeYield" className="text-xs font-semibold">Yield (Servings) *</Label>
                <Input
                  id="recipeYield"
                  type="number"
                  min={1}
                  value={formYield}
                  onChange={(e) => setFormYield(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 self-end">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Formulation</p>
                  <p className="text-[10px] text-slate-500">Enable usage in kitchen production</p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            </div>

            {/* Dynamic Items Builder */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ingredient Breakdown *
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Add ingredients, quantities, and units required for this batch.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className="gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-xl"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-primary" />
                  Add Ingredient
                </Button>
              </div>

              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 max-h-60 overflow-y-auto">
                {formItems.map((item, idx) => {
                  const ingInfo = ingredientCostMap.get(item.ingredient);
                  const rowCost = (Number(item.quantity) || 0) * (ingInfo?.cost || 0);

                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex items-center justify-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Select
                          value={item.ingredient}
                          onValueChange={(v) => updateItemRow(item.id, 'ingredient', v)}
                          disabled={ingredientsQuery.isLoading}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg">
                            <SelectValue placeholder="Select ingredient" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing._id} value={ing._id} className="text-xs">
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Qty"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => updateItemRow(item.id, 'quantity', Number(e.target.value) || 0)}
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItemRow(item.id, 'unit', v as UnitType)}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u} value={u} className="text-xs">
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 text-right text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {formatCurrency(rowCost)}
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(item.id)}
                          disabled={formItems.length === 1}
                          className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Cost Summary Banner */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total Batch Cost</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {formatCurrency(liveTotalCost)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Cost / Serving</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(liveCostPerServing)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeDialog} disabled={isSubmitting} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl font-bold"
            >
              {isSubmitting
                ? 'Saving...'
                : dialogMode === 'create'
                ? 'Create Recipe'
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog (Matching SuppliersPage) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Recipe?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete formulation{' '}
              <b className="text-slate-900 dark:text-white">
                {getLocalizedText(
                  recipeToDelete?.name,
                  'en',
                  typeof recipeToDelete?.name === 'string' ? recipeToDelete.name : 'Recipe'
                )}
              </b>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold"
              onClick={handleDelete}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecipesPage;
