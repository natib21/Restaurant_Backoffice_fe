// src/features/Menu/Pages/MenuSpecialsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Gift,
  CheckCircle2,
  PauseCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  UtensilsCrossed,
  FolderKanban,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import RightSideModal from '@/components/ui/RightSideModal';
import PageHeader from '@/components/Layout/PageHeader';
import { getLocalizedName, getLocalizedDescription } from '../lib/localizationUtils';
import LocalizedNameCell from '../Components/LocalizedNameCell';
import ComboFormPage from '../Components/ComboFormPage';
import ComboDetailPage from './MenuSpecialDetailPage';

import {
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type KanbanColumnConfig,
  type BulkAction,
  type DataViewQueryParams,
} from '@/components/Common';

import { toast } from 'sonner';
import {
  useGetAllCombosQuery,
  useDeleteComboMutation,
  useToggleComboAvailabilityMutation,
  type ComboQueryParams,
} from '../../../api/Queries/comboQueries';
import { useState, useMemo, useCallback } from 'react';

const MenuSpecialsPage = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState<ComboQueryParams>({
    page: 1,
    limit: 10,
  });

  const { data: combos = [], isLoading, isError } = useGetAllCombosQuery(queryParams);
  const deleteMutation = useDeleteComboMutation();
  const toggleMutation = useToggleComboAvailabilityMutation();

  const handleQueryChange = useCallback((params: DataViewQueryParams) => {
    const nextParams: ComboQueryParams = {
      page: params.page,
      limit: params.pageSize,
    };

    if (params.search?.trim()) {
      nextParams.search = params.search.trim();
    }

    if (params.quickFilter && params.quickFilter !== 'all') {
      if (params.quickFilter === 'active') nextParams.isActive = true;
      else if (params.quickFilter === 'paused') nextParams.isActive = false;
    }

    if (params.advancedFilters) {
      if (params.advancedFilters.isActive && params.advancedFilters.isActive !== 'all') {
        nextParams.isActive = params.advancedFilters.isActive === 'true';
      }
    }

    if (params.sortField) {
      nextParams.sort = params.sortDirection === 'desc' ? `-${params.sortField}` : params.sortField;
    }

    setQueryParams(nextParams);
  }, []);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>(
    'detail'
  );
  const [selectedCombo, setSelectedCombo] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<string | null>(null);

  const openDetail = (combo: any) => {
    setSelectedCombo(combo);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openEdit = (combo: any) => {
    setSelectedCombo(combo);
    setPanelMode('edit');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedCombo(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedCombo(null);
  };

  const switchToEdit = () => setPanelMode('edit');

  const onFormSuccess = () => {
    toast.success(
      panelMode === 'add' ? 'Special offer created!' : 'Special offer updated!'
    );
    if (panelMode === 'add') closePanel();
    else setPanelMode('detail');
  };

  const onFormCancel = () => {
    if (panelMode === 'add') closePanel();
    else setPanelMode('detail');
  };

  const openDeleteDialog = (id: string) => {
    setComboToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!comboToDelete) return;
    try {
      await deleteMutation.mutateAsync(comboToDelete);
      toast.success('Special offer deleted');
      setDeleteDialogOpen(false);
      setComboToDelete(null);
      closePanel();
    } catch {
      toast.error('Failed to delete special offer');
    }
  };

  const handleToggleAvailability = async (
    comboId: string,
    currentActive: boolean
  ) => {
    try {
      await toggleMutation.mutateAsync(comboId);
      toast.success(currentActive ? 'Offer paused' : 'Offer is now active');
    } catch {
      toast.error('Failed to update availability');
    }
  };

  // Helper for combo image src
  const getComboImageSrc = (combo: any) => {
    if (!combo.image) return null;
    return combo.image.startsWith('http')
      ? combo.image
      : `/img/combo/${combo.image}`;
  };

  // Professional branch display with tooltip
  const BranchBadges = ({ combo }: { combo: any }) => {
    const isGlobal = !combo.branches || combo.branches.length === 0;

    if (isGlobal) {
      return (
        <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
          All Branches
        </Badge>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {combo.branches.slice(0, 2).map((branch: any) => (
          <Tooltip key={branch._id || branch.id || branch.name}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {branch.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium text-xs">{branch.name}</p>
              {branch.location?.formattedAddress && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {branch.location.formattedAddress}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        {combo.branches.length > 2 && (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 border-dashed"
          >
            +{combo.branches.length - 2} more
          </Badge>
        )}
      </div>
    );
  };

  // 1. Column Definitions
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: 'image',
        header: 'Image',
        align: 'center',
        width: '60px',
        cell: (combo) => {
          const imageSrc = getComboImageSrc(combo);
          const displayName = getLocalizedName(combo, 'en', 'Special Combo');
          return imageSrc ? (
            <img
              src={imageSrc}
              alt={displayName}
              className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Gift className="h-4 w-4 text-slate-400" />
            </div>
          );
        },
      },
      {
        id: 'name',
        header: 'Offer Name',
        accessorKey: 'name',
        sortable: true,
        cell: (combo) => (
          <LocalizedNameCell
            name={combo.name}
            description={combo.description || `${combo.items?.length || 0} bundle items`}
            fallback="Special Combo"
          />
        ),
      },
      {
        id: 'items',
        header: 'Items in Combo',
        align: 'center',
        cell: (combo) => (
          <Badge
            variant="outline"
            className="text-xs font-bold border-slate-200 dark:border-slate-700"
          >
            {combo.items?.length || 0} items
          </Badge>
        ),
      },
      {
        id: 'price',
        header: 'Combo Price',
        accessorKey: 'comboPrice',
        sortable: true,
        cell: (combo) => (
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            ETB {Number(combo.comboPrice || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'branches',
        header: 'Applicable Branches',
        cell: (combo) => <BranchBadges combo={combo} />,
      },
      {
        id: 'isActive',
        header: 'Status',
        sortable: true,
        cell: (combo) => {
          const active = combo.isActive === true;
          return (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={active}
                onCheckedChange={() =>
                  handleToggleAvailability(combo._id || combo.id, active)
                }
                disabled={toggleMutation.isPending}
                className="data-[state=checked]:bg-emerald-600 scale-90"
              />
              <span
                className={`text-xs font-bold ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                {active ? 'Active' : 'Paused'}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (combo) => (
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
                  onClick={() => openDetail(combo)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openEdit(combo)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Offer
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                  onClick={() => openDeleteDialog(combo._id || combo.id)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [toggleMutation.isPending]
  );

  // 2. Quick Filters
  const quickFilters: QuickFilterOption[] = useMemo(() => {
    const activeCount = combos.filter((c: any) => c.isActive === true).length;
    const inactiveCount = combos.filter((c: any) => !c.isActive).length;

    return [
      { key: 'all', label: 'All Specials', count: combos.length },
      {
        key: 'active',
        label: 'Active Offers',
        count: activeCount,
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
      },
      {
        key: 'inactive',
        label: 'Paused',
        count: inactiveCount,
        icon: <PauseCircle className="h-3.5 w-3.5 text-slate-400" />,
      },
    ];
  }, [combos]);

  // 3. Advanced Filter Fields
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'isActive',
        label: 'Offer Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive / Paused', value: 'false' },
        ],
      },
      {
        id: 'comboPrice',
        label: 'Price Range (ETB)',
        type: 'number-range',
      },
    ],
    []
  );

  // 4. Group By Options
  const groupByOptions: GroupByOption[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Offer Status',
        accessor: (c: any) => (c.isActive ? 'Active Offers' : 'Paused Offers'),
      },
      {
        id: 'scope',
        label: 'Branch Scope',
        accessor: (c: any) =>
          !c.branches || c.branches.length === 0
            ? 'All Branches'
            : 'Branch-Specific',
      },
    ],
    []
  );

  // 5. Sort Options
  const sortOptions: SortOption[] = useMemo(
    () => [
      { id: 'name-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
      { id: 'name-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
      {
        id: 'price-asc',
        label: 'Price: Low to High',
        field: 'comboPrice',
        direction: 'asc',
      },
      {
        id: 'price-desc',
        label: 'Price: High to Low',
        field: 'comboPrice',
        direction: 'desc',
      },
    ],
    []
  );

  // 6. Kanban Columns
  const kanbanColumns: KanbanColumnConfig[] = useMemo(
    () => [
      {
        id: 'active',
        title: 'Active Offers',
        color: 'bg-emerald-500',
        matcher: (item: any) => item.isActive === true,
      },
      {
        id: 'inactive',
        title: 'Paused / Inactive',
        color: 'bg-slate-400',
        matcher: (item: any) => !item.isActive,
      },
    ],
    []
  );

  // 7. Bulk Actions
  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        id: 'bulk-live',
        label: 'Activate Selected',
        icon: <ToggleRight className="h-3.5 w-3.5" />,
        onClick: async (rows, clear) => {
          for (const row of rows) {
            if (!row.isActive) {
              await toggleMutation.mutateAsync(row._id || row.id);
            }
          }
          toast.success(`Activated ${rows.length} special offers`);
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
            if (row.isActive) {
              await toggleMutation.mutateAsync(row._id || row.id);
            }
          }
          toast.success(`Paused ${rows.length} special offers`);
          clear();
        },
      },
      {
        id: 'bulk-delete',
        label: 'Delete Selected',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        variant: 'destructive',
        confirmTitle: 'Delete Selected Offers?',
        confirmMessage:
          'Are you sure you want to permanently delete these special offers?',
        onClick: async (rows, clear) => {
          for (const row of rows) {
            await deleteMutation.mutateAsync(row._id || row.id);
          }
          toast.success(`Deleted ${rows.length} special offers`);
          clear();
        },
      },
    ],
    [toggleMutation, deleteMutation]
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
              Unable to load special offers. Please check network connection and try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/menu')}
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-slate-50/50 dark:bg-slate-950 min-h-screen pb-16">
        <PageHeader
          title="Special Offers & Combos"
          subtitle="Manage discounted combo meals, promotions, and seasonal bundles."
          breadcrumbText="Menu"
          breadcrumbAction={() => navigate('/menu')}
          actionLabel="Add Offer"
          onAction={openAdd}
        />

        {/* Menu Sub-Nav Switcher */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/menu/items')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary rounded-xl"
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
              variant="secondary"
              size="sm"
              className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl shadow-2xs"
            >
              <Gift className="h-3.5 w-3.5 mr-1.5" />
              Special Offers & Combos
            </Button>
          </div>
        </div>

        {/* Main Content with DataViewSystem */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <DataViewSystem<any>
            data={combos}
            rowKey={(combo) => combo._id || combo.id}
            entityName="special offers"
            columns={columns}
            isLoading={isLoading}
            isServerSide={true}
            onQueryChange={handleQueryChange}
            supportedViewModes={['table', 'grid', 'kanban', 'list']}
            defaultViewMode="table"
            searchPlaceholder="Search special offers by name or description..."
            searchFields={['name', 'description']}
            quickFilters={quickFilters}
            filterFields={filterFields}
            groupByOptions={groupByOptions}
            sortOptions={sortOptions}
            kanbanColumns={kanbanColumns}
            presetStorageKey="menu_specials"
            selectable={true}
            bulkActions={bulkActions}
            paginated={true}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            onItemClick={(combo) => openDetail(combo)}
            exportFileName="special_offers_export"
            primaryAction={{
              label: 'Add Offer',
              onClick: openAdd,
            }}
            emptyIcon={<Gift className="h-6 w-6 text-slate-400" />}
            emptyTitle="No Special Offers Found"
            emptyDescription="Create your first combo bundle or adjust your search filters."
            emptyActionLabel="Create New Offer"
            onEmptyAction={openAdd}
            renderCustomCard={(combo, isSelected) => {
              const isActive = combo.isActive === true;
              const imageSrc = getComboImageSrc(combo);
              return (
                <div
                  className={`relative group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 p-4 space-y-3 cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/2'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                  onClick={() => openDetail(combo)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={getLocalizedName(combo, 'en', 'Offer')}
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Gift className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <LocalizedNameCell
                          name={combo.name}
                          description={`${combo.items?.length || 0} bundle items`}
                          fallback="Special Offer"
                          showDescription={true}
                        />
                      </div>
                    </div>

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
                            onClick={() => openDetail(combo)}
                            className="text-xs font-medium cursor-pointer"
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEdit(combo)}
                            className="text-xs font-medium cursor-pointer"
                          >
                            <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                            onClick={() => openDeleteDialog(combo._id || combo.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      ETB {Number(combo.comboPrice || 0).toFixed(2)}
                    </span>
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={isActive}
                        onCheckedChange={() =>
                          handleToggleAvailability(combo._id || combo.id, isActive)
                        }
                        disabled={toggleMutation.isPending}
                        className="data-[state=checked]:bg-emerald-600 scale-75"
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </main>

        {/* Right Drawer Modal */}
        <RightSideModal
          open={panelOpen}
          onOpenChange={setPanelOpen}
          title={
            panelMode === 'add'
              ? 'Add New Special Offer'
              : panelMode === 'edit'
              ? `Edit ${getLocalizedName(selectedCombo, 'en', 'Offer')}`
              : getLocalizedName(selectedCombo, 'en', 'Offer Details')
          }
          description={
            panelMode === 'add'
              ? 'Create a new combo meal or discounted bundle'
              : panelMode === 'edit'
              ? 'Update offer pricing, items, and branch availability'
              : 'View complete special offer breakdown'
          }
        >
          {panelMode === 'detail' && selectedCombo && (
            <ComboDetailPage
              comboId={selectedCombo._id || selectedCombo.id}
              onEdit={switchToEdit}
            />
          )}

          {(panelMode === 'edit' || panelMode === 'add') && (
            <ComboFormPage
              initialData={panelMode === 'edit' ? selectedCombo : undefined}
              onSuccess={onFormSuccess}
              onCancel={onFormCancel}
            />
          )}
        </RightSideModal>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold">
                Delete Special Offer?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500">
                This action cannot be undone. This special offer will be permanently
                removed from your menu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl text-xs">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Delete Offer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default MenuSpecialsPage;
