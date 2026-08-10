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
import { useGetIngredientsList, type Ingredient } from '@/api/Queries/ingredientQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  ChefHat,
  Edit,
  Trash2,
  PlusCircle,
  MinusCircle,
  Search,
  DollarSign,
  UtensilsCrossed,
} from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
import { useToast } from '../../../hooks/use-toast';

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

const RecipesPage: React.FC = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const [formMenuItem, setFormMenuItem] = useState('');
  const [formName, setFormName] = useState('');
  const [formYield, setFormYield] = useState<number>(1);
  const [formItems, setFormItems] = useState<RecipeFormItem[]>([createEmptyItem()]);

  const recipesQuery = useGetRecipesList();
  const menuItemsQuery = useMenuItemsQuery();
  const ingredientsQuery = useGetIngredientsList();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const recipes: Recipe[] = recipesQuery.data?.data?.recipes ?? [];
  const menuItems: MenuItem[] = menuItemsQuery.data ?? [];
  const ingredients: Ingredient[] = ingredientsQuery.data?.data?.ingredients ?? [];

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const q = searchQuery.toLowerCase();
    return recipes.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.menuItem?.name?.toLowerCase().includes(q)
    );
  }, [recipes, searchQuery]);

  const stats = useMemo(() => {
    const total = recipes.length;
    const active = recipes.filter((r) => r.isActive).length;
    const avgCostPerServing =
      total > 0
        ? recipes.reduce((sum, r) => sum + (r.costPerServing || 0), 0) / total
        : 0;
    return { total, active, avgCostPerServing };
  }, [recipes]);

  const ingredientCostMap = useMemo(() => {
    const map = new Map<string, number>();
    ingredients.forEach((ing) => {
      if (ing._id) map.set(ing._id, ing.costPerUnit || 0);
    });
    return map;
  }, [ingredients]);

  const liveTotalCost = useMemo(() => {
    return formItems.reduce((sum, item) => {
      if (!item.ingredient) return sum;
      const costPerUnit = ingredientCostMap.get(item.ingredient) || 0;
      return sum + (Number(item.quantity) || 0) * costPerUnit;
    }, 0);
  }, [formItems, ingredientCostMap]);

  const liveCostPerServing = useMemo(() => {
    const y = Number(formYield) || 1;
    return liveTotalCost / y;
  }, [liveTotalCost, formYield]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingRecipe(null);
    setFormMenuItem('');
    setFormName('');
    setFormYield(1);
    setFormItems([createEmptyItem()]);
    setDialogOpen(true);
  };

  const openEditDialog = (recipe: Recipe) => {
    setDialogMode('edit');
    setEditingRecipe(recipe);
    setFormMenuItem(recipe.menuItem?._id || '');
    setFormName(recipe.name || '');
    setFormYield(recipe.yield || 1);
    setFormItems(
      (recipe.items?.length
        ? recipe.items.map((it) => ({
            id: Math.random().toString(36).substring(2, 9),
            ingredient: typeof it.ingredient === 'string' ? it.ingredient : it.ingredient._id,
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
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
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
        description: err?.message || 'Something went wrong.',
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
      toast({ title: 'Recipe Deleted', description: `${recipeToDelete.name} has been removed.` });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    }
  };

  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

  const isLoading = recipesQuery.isLoading || menuItemsQuery.isLoading || ingredientsQuery.isLoading;
  const queryError = recipesQuery.error || menuItemsQuery.error || ingredientsQuery.error;

  if (queryError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Recipes</CardTitle>
            <CardDescription>Unable to load recipe data. Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formValid = !!getPayload();
  const isSubmitting = createRecipe.isPending || updateRecipe.isPending;
  const isDeleting = deleteRecipe.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipes Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build recipes, track ingredient costs, and manage cost per serving
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => (o ? null : closeDialog())}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'create' ? 'Create New Recipe' : `Edit Recipe: ${editingRecipe?.name ?? ''}`}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'create'
                  ? 'Define a recipe with menu item, yield, and ingredient breakdown.'
                  : 'Update the recipe details and ingredient composition.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="menuItem">Menu Item *</Label>
                  <Select value={formMenuItem} onValueChange={setFormMenuItem} disabled={menuItemsQuery.isLoading}>
                    <SelectTrigger id="menuItem">
                      <SelectValue placeholder="Select menu item" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((mi) => (
                        <SelectItem key={mi._id} value={mi._id}>
                          {mi.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipeName">Recipe Name *</Label>
                  <Input
                    id="recipeName"
                    placeholder="e.g. Classic Margherita"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipeYield">Yield (servings) *</Label>
                  <Input
                    id="recipeYield"
                    type="number"
                    min={1}
                    value={formYield}
                    onChange={(e) => setFormYield(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Dynamic Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Ingredients *</Label>
                  <Button variant="ghost" size="sm" onClick={addItemRow} className="gap-1 h-8 px-2">
                    <PlusCircle className="h-4 w-4" />
                    Add Row
                  </Button>
                </div>

                <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-1 flex items-center justify-center text-xs text-muted-foreground font-medium">
                        {idx + 1}
                      </div>
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Ingredient</Label>
                        <Select
                          value={item.ingredient}
                          onValueChange={(v) => updateItemRow(item.id, 'ingredient', v)}
                          disabled={ingredientsQuery.isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ingredient" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing._id} value={ing._id}>
                                {ing.name} ({ing.unit}) - {formatCurrency(ing.costPerUnit || 0)}/{ing.unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(item.id, 'quantity', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItemRow(item.id, 'unit', v as UnitType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(item.id)}
                          disabled={formItems.length === 1}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Cost Summary */}
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-primary/60" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(liveTotalCost)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UtensilsCrossed className="h-8 w-8 text-green-600/60" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cost / Serving</p>
                        <p className="text-xl font-bold">{formatCurrency(liveCostPerServing)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : dialogMode === 'create' ? 'Create Recipe' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes by name or menu item..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recipes</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p>
              </div>
              <ChefHat className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Cost / Serving</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : formatCurrency(stats.avgCostPerServing)}
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
                <p className="text-sm font-medium text-muted-foreground">Active Recipes</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : stats.active}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recipe List</CardTitle>
          <CardDescription>
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No recipes found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search terms' : 'Create your first recipe to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Recipe
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe Name</TableHead>
                    <TableHead>Menu Item</TableHead>
                    <TableHead className="text-right">Yield</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Cost / Serving</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe) => (
                    <TableRow key={recipe._id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChefHat className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground">#{recipe._id.slice(-6)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{recipe.menuItem?.name ?? '—'}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{recipe.yield}</TableCell>
                      <TableCell className="text-right font-medium">{recipe.items?.length ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(recipe.totalCost || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(recipe.costPerServing || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            recipe.isActive
                              ? 'bg-green-500/10 text-green-700 border-green-500/30'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {recipe.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(recipe)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => openDeleteConfirm(recipe)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Recipe?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{recipeToDelete?.name ?? ''}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipesPage;
