import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Settings2,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  const filteredIngredients = ingredients.filter((ingredient: Ingredient) => {
    const matchesSearch =
      ingredient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || ingredient.stockStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-500 text-white';
      case 'low_stock':
        return 'bg-yellow-500 text-white';
      case 'out_of_stock':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  const totalIngredients = ingredients.length;
  const inStockCount = ingredients.filter((i) => i.stockStatus === 'in_stock').length;
  const lowStockCount = ingredients.filter((i) => i.stockStatus === 'low_stock').length;
  const outOfStockCount = ingredients.filter((i) => i.stockStatus === 'out_of_stock').length;

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
      toast({
        title: 'Validation Error',
        description: 'Ingredient name is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.supplier) {
      toast({
        title: 'Validation Error',
        description: 'Please select a supplier',
        variant: 'destructive',
      });
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
        toast({
          title: 'Success',
          description: 'Ingredient updated successfully',
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: 'Success',
          description: 'Ingredient created successfully',
        });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save ingredient',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    if (!window.confirm(`Are you sure you want to delete "${ingredient.name}"?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(ingredient._id);
      toast({
        title: 'Success',
        description: 'Ingredient deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete ingredient',
        variant: 'destructive',
      });
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
      toast({
        title: 'Success',
        description: 'Stock thresholds updated successfully',
      });
      setThresholdDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update thresholds',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Ingredients</CardTitle>
            <CardDescription>
              Unable to load ingredient data. Please try again.
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
          <h1 className="text-2xl font-bold tracking-tight">Ingredients Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage inventory ingredients, stock levels, and supplier information
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIngredient ? 'Edit Ingredient' : 'Create New Ingredient'}
              </DialogTitle>
              <DialogDescription>
                {editingIngredient
                  ? 'Update the ingredient details below.'
                  : 'Fill in the details to create a new ingredient.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Fresh Tomatoes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as IngredientCreateRequest['category'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm({ ...form, unit: v as IngredientCreateRequest['unit'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({ ...form, currentStock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  value={form.costPerUnit}
                  onChange={(e) =>
                    setForm({ ...form, costPerUnit: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Max Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={form.maxStock}
                  onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={form.supplier}
                  onValueChange={(v) => setForm({ ...form, supplier: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                    {suppliers.length === 0 && (
                      <SelectItem value="__none" disabled>
                        No suppliers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
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

        <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Stock Thresholds</DialogTitle>
              <DialogDescription>
                {thresholdIngredient
                  ? `Configure min/max stock levels for ${thresholdIngredient.name}`
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="th-min">Min Stock</Label>
                <Input
                  id="th-min"
                  type="number"
                  value={thresholdForm.minStock}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, minStock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="th-max">Max Stock</Label>
                <Input
                  id="th-max"
                  type="number"
                  value={thresholdForm.maxStock}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, maxStock: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setThresholdDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleThresholdSubmit}
                disabled={setThresholdsMutation.isPending}
              >
                {setThresholdsMutation.isPending ? 'Saving...' : 'Save Thresholds'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients by name, category, or supplier..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Badge
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              All ({ingredients.length})
            </Badge>
            <Badge
              variant={statusFilter === 'in_stock' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('in_stock')}
            >
              In Stock ({inStockCount})
            </Badge>
            <Badge
              variant={statusFilter === 'low_stock' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('low_stock')}
            >
              Low Stock ({lowStockCount})
            </Badge>
            <Badge
              variant={statusFilter === 'out_of_stock' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('out_of_stock')}
            >
              Out of Stock ({outOfStockCount})
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ingredients</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : totalIngredients}</p>
              </div>
              <Package className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : inStockCount}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {isLoading ? '...' : lowStockCount}
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? '...' : outOfStockCount}
                </p>
              </div>
              <Package className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient List</CardTitle>
          <CardDescription>
            {filteredIngredients.length} ingredient{filteredIngredients.length !== 1 ? 's' : ''}{' '}
            found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No ingredients found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'No ingredients in the system yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min/Max Stock</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ingredient: Ingredient) => (
                    <TableRow key={ingredient._id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell className="capitalize">{ingredient.category}</TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>
                        {ingredient.currentStock} {ingredient.unit}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">Min:</span>{' '}
                        {ingredient.minStock}
                        <br />
                        <span className="text-muted-foreground">Max:</span>{' '}
                        {ingredient.maxStock}
                      </TableCell>
                      <TableCell>${ingredient.costPerUnit.toFixed(2)}</TableCell>
                      <TableCell>{ingredient.supplier?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(ingredient.stockStatus)}>
                          {getStatusLabel(ingredient.stockStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openThresholdDialog(ingredient)}
                            title="Set thresholds"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(ingredient)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ingredient)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
};

export default IngredientsPage;
