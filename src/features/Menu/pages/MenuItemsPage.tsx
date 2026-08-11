// src/features/Menu/pages/MenuItemsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Search,
  UtensilsCrossed,
  Filter,
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
import PageHeader from '@/components/Layout/PageHeader';
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

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const getImageSrc = (item: any) => {
    const path = item?.imageUrl || item?.imageData?.url || null;
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

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
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted/60 rounded-md animate-pulse" />
          <div className="h-9 w-28 bg-muted/60 rounded-md animate-pulse" />
        </div>
        <div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load menu items. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title="Menu Items"
        subtitle="Manage your menu items"
        breadcrumbText="Menu"
        breadcrumbAction={() => navigate('/menu')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search menu items..."
        actionLabel="Add Item"
        onAction={openAdd}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Controls Card */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                All Menu Items
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {filteredItems.length} of {menuItems.length} items
              </p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="w-full sm:w-40 min-w-0">
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  Category
                </Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="h-8 text-xs bg-card border-border/80">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Categories
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-36 min-w-0">
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  Type
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 text-xs bg-card border-border/80 capitalize">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Types
                    </SelectItem>
                    {types.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-36 min-w-0">
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  Availability
                </Label>
                <Select
                  value={filterAvailability}
                  onValueChange={(v) => setFilterAvailability(v as any)}
                >
                  <SelectTrigger className="h-8 text-xs bg-card border-border/80">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Status
                    </SelectItem>
                    <SelectItem value="live" className="text-xs">
                      Live
                    </SelectItem>
                    <SelectItem value="paused" className="text-xs">
                      Paused
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Table & List Container */}
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="w-16 py-3 text-xs font-semibold">
                    Image
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold">
                    Type
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold">
                    Price Range
                  </TableHead>
                  <TableHead className="w-32 py-3 text-xs font-semibold">
                    Availability
                  </TableHead>
                  <TableHead className="w-16 text-right py-3 text-xs font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                        <p className="text-xs font-medium">
                          No menu items found matching your filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: any) => {
                    const available = item.available === true;
                    const imageSrc = getImageSrc(item);
                    return (
                      <TableRow
                        key={item.id || item._id}
                        className="border-border/60 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-2.5">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.imageFilename || item.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border/60"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted/50 border border-border/60 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground font-medium">
                                No img
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 font-medium text-xs text-foreground">
                          {item.name}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground capitalize">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-muted-foreground">
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground capitalize">
                          {item.category || '—'}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs font-medium text-foreground">
                          {getPriceRange(item.variants)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Switch
                              checked={available}
                              onCheckedChange={() =>
                                handleToggleAvailability(
                                  item.id || item._id,
                                  available
                                )
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                available
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {available ? 'Live' : 'Paused'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={() => openDetail(item)}
                                className="text-xs"
                              >
                                <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEdit(item)}
                                className="text-xs"
                              >
                                <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs text-destructive focus:text-destructive"
                                onClick={() =>
                                  openDeleteDialog(item.id || item._id)
                                }
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
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
          <div className="block md:hidden divide-y divide-border/60">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground/40 stroke-1 mb-2" />
                <p className="text-xs font-medium">
                  No menu items found matching your filters.
                </p>
              </div>
            ) : (
              filteredItems.map((item: any) => {
                const available = item.available === true;
                const imageSrc = getImageSrc(item);
                return (
                  <div
                    key={item.id || item._id}
                    className="p-3.5 flex gap-3 items-start"
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.imageFilename || item.name}
                        className="h-16 w-16 rounded-lg object-cover border border-border/60 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted/50 border border-border/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          No img
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-xs text-foreground truncate">
                          {item.name}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => openDetail(item)}
                              className="text-xs"
                            >
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEdit(item)}
                              className="text-xs"
                            >
                              <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs text-destructive focus:text-destructive"
                              onClick={() =>
                                openDeleteDialog(item.id || item._id)
                              }
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">{item.category || '—'}</span>
                        <span>•</span>
                        <span className="capitalize">{item.type}</span>
                      </div>

                      <p className="text-xs font-medium text-foreground">
                        {getPriceRange(item.variants)}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={available}
                          onCheckedChange={() =>
                            handleToggleAvailability(
                              item.id || item._id,
                              available
                            )
                          }
                        />
                        <span
                          className={`text-xs font-medium ${
                            available
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {available ? 'Live' : 'Paused'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Delete Menu Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action cannot be undone. This will permanently delete the
              item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-8 text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuItemsPage;

