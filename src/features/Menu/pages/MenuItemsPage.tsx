// src/features/Menu/Pages/MenuItemsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RightSideModal from '@/components/ui/RightSideModal';
import MenuItemFormPage from '../Components/MenuItemFormPage';
import MenuItemPage from './MenuItemPage';

import { toast } from 'sonner';
import {
  useMenuItemsQuery,
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailabilityMutation,
} from '../../../api/Queries/menuQueries';
import { useState, useMemo } from 'react';

const MenuItemsPage = () => {
  const navigate = useNavigate();
  const { data: menuItems = [], isLoading, isError } = useMenuItemsQuery();
<<<<<<< HEAD
  console.log(menuItems)
=======
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  const deleteMutation = useDeleteMenuItemMutation();
  const toggleAvailabilityMutation = useToggleMenuItemAvailabilityMutation();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>(
    'detail'
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<
    'all' | 'live' | 'paused'
  >('all');

  // Unique options for filters
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(menuItems.map((item: any) => item.category).filter(Boolean))
    );
    return cats.sort();
  }, [menuItems]);

  const types = useMemo(() => {
    const tps = Array.from(
      new Set(menuItems.map((item: any) => item.type).filter(Boolean))
    );
    return tps.sort();
  }, [menuItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item: any) => {
      if (
        searchQuery &&
        !item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (filterCategory !== 'all' && item.category !== filterCategory)
        return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      const isAvailable = item.available === true;
      if (filterAvailability === 'live' && !isAvailable) return false;
      if (filterAvailability === 'paused' && isAvailable) return false;
      return true;
    });
  }, [menuItems, searchQuery, filterCategory, filterType, filterAvailability]);

  // Panel handlers (unchanged)
  const openDetail = (item: any) => {
    setSelectedItem(item);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setPanelMode('edit');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedItem(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedItem(null);
  };

  const switchToEdit = () => setPanelMode('edit');

  const onFormSuccess = () => {
    toast.success(panelMode === 'add' ? 'Item created!' : 'Item updated!');
    if (panelMode === 'add') closePanel();
    else setPanelMode('detail');
  };

  const onFormCancel = () => {
    if (panelMode === 'add') closePanel();
    else setPanelMode('detail');
  };

  const openDeleteDialog = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      toast.success('Menu item deleted successfully');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      closePanel();
    } catch {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (
    itemId: string,
    currentAvailable: boolean
  ) => {
    try {
      await toggleAvailabilityMutation.mutateAsync(itemId);
      toast.success(currentAvailable ? 'Item paused' : 'Item is now live');
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const getPriceRange = (variants: any[] | undefined) => {
    if (!variants || !Array.isArray(variants) || variants.length === 0)
      return '—';
    const validPrices = variants
      .map((v) => Number(v.price))
      .filter((p) => !isNaN(p) && p > 0);
    if (validPrices.length === 0) return '—';
    const min = Math.min(...validPrices);
    const max = Math.max(...validPrices);
    return min === max
      ? `ETB ${min.toFixed(2)}`
      : `ETB ${min.toFixed(2)} – ETB ${max.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-72 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header with Search */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
        <div className="mx-auto flex h-16 items-center px-4 gap-4">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/menu')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Menu Items</h1>
              <p className="text-xs text-muted-foreground">
                Manage your menu items
              </p>
            </div>
          </div>

          {/* Center/Right: Search + Add Button */}
          <div className="flex flex-1 items-center justify-end gap-3">
            {/* Search Input - Hidden on small screens, visible on md+ */}
            <div className="hidden md:block w-72 lg:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            {/* Mobile Search Icon (optional enhancement later) */}
            {/* You can add a search button for mobile if needed */}

            <Button onClick={openAdd} size="sm" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar - Shown only on small screens */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto p-4 lg:p-8">
        <Card>
          <CardHeader className="pb-4">
            {' '}
            {/* Reduced bottom padding for tighter layout */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10 ">
              {/* Title */}
              <div>
                <CardTitle className="text-xl font-semibold">
                  All Menu Items
                </CardTitle>

                <p className="text-sm text-muted-foreground mt-1">
                  {filteredItems.length} of {menuItems.length} groups
                </p>
              </div>

              {/* Filters - Now properly responsive with flex/grid */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1 ">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm">Category</Label>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-0">
                  <Label className="text-sm">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-0">
                  <Label className="text-sm">Availability</Label>
                  <Select
                    value={filterAvailability}
                    onValueChange={(v) => setFilterAvailability(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead className="w-32">Availability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No menu items found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item: any) => {
                      const available = item.available === true;
                      return (
                        <TableRow key={item.id || item._id}>
                          <TableCell>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-12 w-12 rounded-md object-cover border"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                  No img
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.type}
                          </TableCell>
                          <TableCell className="capitalize">
                            {item.category || '—'}
                          </TableCell>
                          <TableCell>{getPriceRange(item.variants)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={available}
                                onCheckedChange={() =>
                                  handleToggleAvailability(
                                    item.id || item._id,
                                    available
                                  )
                                }
                                className="data-[state=on]:bg-green-600"
                              />
                              <span className="text-sm font-medium">
                                {available ? 'Live' : 'Paused'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openDetail(item)}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEdit(item)}
                                >
                                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    openDeleteDialog(item.id || item._id)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-4 py-4 px-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No menu items found matching your filters.
                </div>
              ) : (
                filteredItems.map((item: any) => {
                  const available = item.available === true;
                  return (
                    <Card key={item.id || item._id} className="overflow-hidden">
                      <div className="flex gap-4 p-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 rounded-md object-cover flex-shrink-0 border"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              No img
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize mt-1">
                            {item.category || '—'}
                          </p>
                          <p className="text-xl font-bold mt-2">
                            {getPriceRange(item.variants)}
                          </p>
                          <div className="flex items-center gap-3 mt-4">
                            <Switch
                              checked={available}
                              onCheckedChange={() =>
                                handleToggleAvailability(
                                  item.id || item._id,
                                  available
                                )
                              }
                              className="data-[state=on]:bg-green-600"
                            />
                            <span className="text-sm font-medium">
                              {available ? (
                                <span className="text-green-600">Live</span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Paused
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(item)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                openDeleteDialog(item.id || item._id)
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Right Side Modal & Delete Dialog */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        title={
          panelMode === 'add'
            ? 'Add New Menu Item'
            : panelMode === 'edit'
              ? `Edit ${selectedItem?.name}`
              : selectedItem?.name || 'Item Details'
        }
        description={
          panelMode === 'add'
            ? 'Create a new menu item'
            : panelMode === 'edit'
              ? 'Update item details'
              : 'View full item information'
        }
      >
        {panelMode === 'detail' && selectedItem && (
          <MenuItemPage
            itemId={selectedItem._id || selectedItem.id}
            onEdit={switchToEdit}
          />
        )}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <MenuItemFormPage
            initialData={panelMode === 'edit' ? selectedItem : undefined}
            onSuccess={onFormSuccess}
            onCancel={onFormCancel}
          />
        )}
      </RightSideModal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuItemsPage;
