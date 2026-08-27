// src/features/Menu/pages/MenuItemsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  UtensilsCrossed,
  Layers,
  Tag,
  CheckCircle2,
  PauseCircle,
  ToggleLeft,
  ToggleRight,
  Flame,
  FolderKanban,
  Gift,
  Leaf,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import RightSideModal from '@/components/ui/RightSideModal';
import PageHeader from '@/components/Layout/PageHeader';
import MenuItemFormPage from '../Components/MenuItemFormPage';
import MenuItemPage from './MenuItemPage';
import StationSelector from '../Components/StationSelector';

import {
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type BulkAction,
  type KanbanColumnConfig,
  type DataViewQueryParams,
} from '@/components/Common';

import { toast } from 'sonner';
import {
  useMenuItemsQuery,
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailabilityMutation,
  type MenuQueryParams,
} from '../../../api/Queries/menuQueries';
import { useKitchenStationsQuery } from '../../../api/Queries/kitchenQueries';
import { useActiveCategoriesQuery } from '../../../api/Queries/categoryQueries';
import { getCategoryName, getCategoryIcon } from '../lib/categoryUtils';
import { getLocalizedName, getLocalizedDescription } from '../lib/localizationUtils';
import LocalizedNameCell from '../Components/LocalizedNameCell';
import { useState, useMemo, useCallback } from 'react';

const MenuItemsPage = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState<MenuQueryParams>({
    page: 1,
    limit: 10,
  });

  const { data: menuItems = [], isLoading, isError } = useMenuItemsQuery(queryParams);
  const { data: kitchenStations = [] } = useKitchenStationsQuery();
  const { data: dbCategories = [] } = useActiveCategoriesQuery();
  const deleteMutation = useDeleteMenuItemMutation();
  const toggleAvailabilityMutation = useToggleMenuItemAvailabilityMutation();

  const handleQueryChange = useCallback((params: DataViewQueryParams) => {
    const nextParams: MenuQueryParams = {
      page: params.page,
      limit: params.pageSize,
    };

    if (params.search?.trim()) {
      nextParams.search = params.search.trim();
    }

    if (params.quickFilter && params.quickFilter !== 'all') {
      if (params.quickFilter === 'live') {
        nextParams.available = true;
      } else if (params.quickFilter === 'paused') {
        nextParams.available = false;
      } else if (params.quickFilter === 'fasting') {
        nextParams.isFasting = true;
      } else if (params.quickFilter === 'food' || params.quickFilter === 'drink') {
        nextParams.type = params.quickFilter;
      }
    }

    if (params.advancedFilters) {
      if (params.advancedFilters.type && params.advancedFilters.type !== 'all') {
        nextParams.type = params.advancedFilters.type;
      }
      if (params.advancedFilters.category && params.advancedFilters.category !== 'all') {
        nextParams.category = params.advancedFilters.category;
      }
      if (params.advancedFilters.cuisineOrigin && params.advancedFilters.cuisineOrigin !== 'all') {
        nextParams.cuisineOrigin = params.advancedFilters.cuisineOrigin;
      }
      if (params.advancedFilters.isFasting && params.advancedFilters.isFasting !== 'all') {
        nextParams.isFasting = params.advancedFilters.isFasting === 'true';
      }
      if (params.advancedFilters.available && params.advancedFilters.available !== 'all') {
        nextParams.available = params.advancedFilters.available === 'true';
      }
      if (params.advancedFilters.kitchenStation && params.advancedFilters.kitchenStation !== 'all') {
        nextParams.kitchenStation = params.advancedFilters.kitchenStation;
      }
    }

    if (params.sortField) {
      nextParams.sort = params.sortDirection === 'desc' ? `-${params.sortField}` : params.sortField;
    }

    setQueryParams(nextParams);
  }, []);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>('detail');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const getImageSrc = (item: any) => {
    const path = item?.imageUrl || item?.imageData?.url || null;
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
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

  // Unique categories and types for filters
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

  // Panel handlers
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

  // 1. Table Columns Definition
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: 'image',
        header: 'Image',
        width: '64px',
        cell: (item) => {
          const imageSrc = getImageSrc(item);
          const displayName = getLocalizedName(item);
          return imageSrc ? (
            <img
              src={imageSrc}
              alt={item.imageFilename || displayName}
              className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 font-bold">No img</span>
            </div>
          );
        },
      },
      {
        id: 'name',
        header: 'Item Name',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => (
          <LocalizedNameCell
            name={item.name}
            description={item.description}
            badge={
              <div className="flex items-center gap-1">
                {item.isFasting && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] py-0 px-1 font-bold flex items-center gap-0.5">
                    <Leaf className="h-2.5 w-2.5" /> Fasting
                  </Badge>
                )}
                {item.isVeg && !item.isFasting && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] py-0 px-1 font-bold">
                    Veg
                  </Badge>
                )}
                {item.isSpicy && (
                  <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0 text-[10px] py-0 px-1 font-bold">
                    Spicy
                  </Badge>
                )}
              </div>
            }
          />
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorKey: 'category',
        sortable: true,
        cell: (item) => {
          const catName = getCategoryName(item.category, 'en');
          const catObj = typeof item.category === 'object' ? item.category : dbCategories.find(c => (c.id || c._id) === item.categoryId || c.name?.en === item.category);
          const icon = catObj ? getCategoryIcon(catObj) : null;

          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              {icon && <span>{icon}</span>}
              <span>{catName || item.category || '—'}</span>
            </span>
          );
        },
      },
      {
        id: 'cuisineOrigin',
        header: 'Origin',
        width: '100px',
        accessorKey: 'cuisineOrigin',
        sortable: true,
        cell: (item) => {
          const isIntl = item.cuisineOrigin === 'international';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                isIntl
                  ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span className="mr-1">{isIntl ? '🌐' : '🇪🇹'}</span>
              {isIntl ? 'Intl' : 'Local'}
            </Badge>
          );
        },
      },
      {
        id: 'isFasting',
        header: 'Fasting (የፆም)',
        width: '105px',
        align: 'center',
        cell: (item) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={item.isFasting === true}
              disabled
              className="h-4 w-4 pointer-events-none data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-default"
            />
          </div>
        ),
      },
      {
        id: 'kitchenStation',
        header: 'Station / Prep',
        width: '180px',
        cell: (item) => (
          <div onClick={(e) => e.stopPropagation()} className="py-0.5">
            {item.requiresKitchen === false ? (
              <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                Direct / Bar (No Cooking)
              </Badge>
            ) : (
              <StationSelector menuItem={item} stations={kitchenStations} compact />
            )}
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        sortable: true,
        cell: (item) => (
          <Badge
            variant="outline"
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-slate-200 dark:border-slate-700"
          >
            {item.type}
          </Badge>
        ),
      },
      {
        id: 'price',
        header: 'Price Range',
        cell: (item) => (
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            {getPriceRange(item.variants)}
          </span>
        ),
      },
      {
        id: 'availability',
        header: 'Status',
        cell: (item) => {
          const available = item.available === true;
          return (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={available}
                onCheckedChange={() =>
                  handleToggleAvailability(item.id || item._id, available)
                }
              />
              <span
                className={`text-xs font-bold ${
                  available
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {available ? 'Live' : 'Paused'}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (item) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl">
                <DropdownMenuItem
                  onClick={() => openDetail(item)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openEdit(item)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                  onClick={() => openDeleteDialog(item.id || item._id)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [kitchenStations]
  );

  // 2. Quick Filters (Pills)
  const quickFilters: QuickFilterOption[] = useMemo(() => {
    const liveCount = menuItems.filter((i: any) => i.available === true).length;
    const pausedCount = menuItems.filter((i: any) => i.available === false).length;
    const fastingCount = menuItems.filter((i: any) => i.isFasting === true).length;

    return [
      { key: 'all', label: 'All Items', count: menuItems.length },
      { key: 'live', label: 'Live on Menu', count: liveCount, icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
      { key: 'fasting', label: 'Fasting (የፆም)', count: fastingCount, icon: <Leaf className="h-3.5 w-3.5 text-emerald-500" /> },
      { key: 'paused', label: 'Paused', count: pausedCount, icon: <PauseCircle className="h-3.5 w-3.5 text-amber-500" /> },
    ];
  }, [menuItems]);

  // 3. Advanced Filters Definition
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'category',
        label: 'Category',
        type: 'select',
        options: dbCategories.length > 0
          ? dbCategories.map((c) => ({
              label: `${getCategoryIcon(c)} ${getCategoryName(c, 'en')}${c.name?.am ? ` (${c.name.am})` : ''}`,
              value: getCategoryName(c, 'en'),
            }))
          : categories.map((c) => ({ label: c, value: c })),
      },
      {
        id: 'cuisineOrigin',
        label: 'Cuisine Origin',
        type: 'select',
        options: [
          { label: 'Local (Ethiopian 🇪🇹)', value: 'local' },
          { label: 'International (🌐)', value: 'international' },
        ],
      },
      {
        id: 'isFasting',
        label: 'Fasting (የፆም)',
        type: 'select',
        options: [
          { label: 'Fasting Friendly (Yes)', value: 'true' },
          { label: 'Non-Fasting (No)', value: 'false' },
        ],
      },
      {
        id: 'kitchenStation',
        label: 'Kitchen Station',
        type: 'select',
        options: [
          { label: 'Unassigned (No Station)', value: 'unassigned' },
          ...kitchenStations.map((st) => ({
            label: `${st.name} (${st.code})`,
            value: st._id || st.stationId,
          })),
        ],
      },
      {
        id: 'type',
        label: 'Dish Type',
        type: 'select',
        options: types.map((t) => ({ label: t, value: t })),
      },
      {
        id: 'available',
        label: 'Availability',
        type: 'select',
        options: [
          { label: 'Live', value: 'true' },
          { label: 'Paused', value: 'false' },
        ],
      },
    ],
    [dbCategories, categories, types, kitchenStations]
  );

  // 4. Group By Options
  const groupByOptions: GroupByOption[] = useMemo(
    () => [
      { id: 'category', label: 'Category', accessor: 'category' },
      {
        id: 'cuisineOrigin',
        label: 'Cuisine Origin',
        accessor: (item) => (item.cuisineOrigin === 'international' ? 'International Dishes 🌐' : 'Local Dishes 🇪🇹'),
      },
      {
        id: 'isFasting',
        label: 'Fasting Status',
        accessor: (item) => (item.isFasting ? 'Fasting Menu (የፆም)' : 'Non-Fasting (የፍስክ)'),
      },
      {
        id: 'kitchenStation',
        label: 'Kitchen Station',
        accessor: (item) => {
          if (!item.kitchenStation) return 'No Station';
          if (typeof item.kitchenStation === 'string') {
            const st = kitchenStations.find(
              (s) => s._id === item.kitchenStation || s.stationId === item.kitchenStation
            );
            return st ? `${st.name} (${st.code})` : 'Assigned Station';
          }
          return item.kitchenStation.name
            ? `${item.kitchenStation.name} (${item.kitchenStation.code})`
            : 'Assigned Station';
        },
      },
      { id: 'type', label: 'Dish Type', accessor: 'type' },
      {
        id: 'status',
        label: 'Availability',
        accessor: (item) => (item.available ? 'Live Items' : 'Paused Items'),
      },
    ],
    [kitchenStations]
  );

  // 5. Sort Options
  const sortOptions: SortOption[] = useMemo(
    () => [
      { id: 'name-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
      { id: 'name-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
      { id: 'category', label: 'Category', field: 'category', direction: 'asc' },
    ],
    []
  );

  // 6. Kanban Columns Configuration
  const kanbanColumns: KanbanColumnConfig[] = useMemo(
    () => [
      {
        id: 'live',
        title: 'Live On Menu',
        color: 'bg-emerald-500',
        matcher: (item: any) => item.available === true,
      },
      {
        id: 'paused',
        title: 'Paused / Sold Out',
        color: 'bg-amber-500',
        matcher: (item: any) => item.available === false,
      },
    ],
    []
  );

  // 7. Bulk Actions
  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        id: 'bulk-live',
        label: 'Set Live',
        icon: <ToggleRight className="h-3.5 w-3.5" />,
        onClick: async (rows, clear) => {
          for (const row of rows) {
            if (!row.available) {
              await toggleAvailabilityMutation.mutateAsync(row.id || row._id);
            }
          }
          toast.success(`Updated ${rows.length} items to Live`);
          clear();
        },
      },
      {
        id: 'bulk-pause',
        label: 'Pause Selected',
        icon: <ToggleLeft className="h-3.5 w-3.5" />,
        variant: 'outline',
        onClick: async (rows, clear) => {
          for (const row of rows) {
            if (row.available) {
              await toggleAvailabilityMutation.mutateAsync(row.id || row._id);
            }
          }
          toast.success(`Paused ${rows.length} items`);
          clear();
        },
      },
      {
        id: 'bulk-delete',
        label: 'Delete Selected',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        variant: 'destructive',
        confirmTitle: 'Delete Selected Menu Items?',
        confirmMessage: 'Are you sure you want to permanently delete the selected items? This cannot be undone.',
        onClick: async (rows, clear) => {
          for (const row of rows) {
            await deleteMutation.mutateAsync(row.id || row._id);
          }
          toast.success(`Deleted ${rows.length} items`);
          clear();
        },
      },
    ],
    [toggleAvailabilityMutation, deleteMutation]
  );

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <p className="text-xs text-slate-500">
              Unable to load menu items. Please check network connection and try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/menu')} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950 min-h-screen pb-16">
      <PageHeader
        title="Menu Items"
        subtitle="Manage food items, recipes, availability, and pricing across branches."
        breadcrumbText="Menu"
        breadcrumbAction={() => navigate('/menu')}
        actionLabel="Add Item"
        onAction={openAdd}
      />

      {/* Menu Sub-Nav Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl shadow-2xs"
          >
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
            Menu Items
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/menu/groups')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary rounded-xl"
          >
            <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
            Menu Groups
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/menu/categories')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary rounded-xl"
          >
            <Tag className="h-3.5 w-3.5 mr-1.5" />
            Categories
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/menu/specials')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary rounded-xl"
          >
            <Gift className="h-3.5 w-3.5 mr-1.5" />
            Special Offers & Combos
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <DataViewSystem<any>
          data={menuItems}
          rowKey={(item) => item.id || item._id}
          entityName="menu items"
          columns={columns}
          isLoading={isLoading}
          isServerSide={true}
          onQueryChange={handleQueryChange}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchPlaceholder="Search by name, ingredients, or category..."
          searchFields={['name', 'category', 'type', 'description']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          kanbanColumns={kanbanColumns}
          presetStorageKey="menu_items"
          selectable={true}
          bulkActions={bulkActions}
          onItemClick={(item) => openDetail(item)}
          exportFileName="restaurant_menu_items"
          primaryAction={{
            label: 'Add Item',
            onClick: openAdd,
          }}
          emptyIcon={<UtensilsCrossed className="h-6 w-6 text-slate-400" />}
          emptyTitle="No Menu Items Found"
          emptyDescription="Create your first delicious dish or adjust your filter parameters."
          emptyActionLabel="Add New Item"
          onEmptyAction={openAdd}
          renderCustomCard={(item, isSelected, onSelect) => {
            const available = item.available === true;
            const imageSrc = getImageSrc(item);
            return (
              <div
                className={`relative group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 p-4 space-y-3 cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/2'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
                onClick={() => openDetail(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={getLocalizedName(item)}
                        className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <LocalizedNameCell
                        name={item.name}
                        description={item.category || item.type}
                        showDescription={true}
                      />
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {item.cuisineOrigin && (
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold px-1 py-0 h-4 border ${
                              item.cuisineOrigin === 'international'
                                ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {item.cuisineOrigin === 'international' ? 'Intl 🌐' : 'Local 🇪🇹'}
                          </Badge>
                        )}
                        {item.isFasting && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] py-0 px-1 font-bold h-4">
                            <Leaf className="h-2.5 w-2.5 mr-0.5" /> Fasting
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(item)} className="text-xs">
                          <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(item.id || item._id)}
                          className="text-xs text-rose-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] font-medium text-slate-400">Station:</span>
                    <StationSelector menuItem={item} stations={kitchenStations} compact />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {getPriceRange(item.variants)}
                    </span>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={available}
                        onCheckedChange={() =>
                          handleToggleAvailability(item.id || item._id, available)
                        }
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          available
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {available ? 'Live' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </main>

      {/* Right Side Modal & Delete Dialog */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        title={
          panelMode === 'add'
            ? 'Add New Menu Item'
            : panelMode === 'edit'
            ? `Edit ${getLocalizedName(selectedItem)}`
            : getLocalizedName(selectedItem, 'en', 'Item Details')
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
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Delete Menu Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              This action cannot be undone. This will permanently delete the menu item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-8 text-xs rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
