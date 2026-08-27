// src/features/Menu/pages/MenuCategoriesPage.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Globe2,
  ArrowUpDown,
  UtensilsCrossed,
  FolderKanban,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import PageHeader from '@/components/Layout/PageHeader';
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

import {
  useCategoriesQuery,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
  useUpdateCategoryMutation,
  type Category,
  type CategoryQueryParams,
} from '@/api/Queries/categoryQueries';
import { getCategoryName, getCategoryDescription, getCategoryIcon, extractLocalizedPair } from '../lib/categoryUtils';
import CategoryFormModal from '../Components/CategoryFormModal';
import { toast } from 'sonner';

export const MenuCategoriesPage: React.FC = () => {
  const navigate = useNavigate();

  const [queryParams, setQueryParams] = useState<CategoryQueryParams>({
    page: 1,
    limit: 10,
    sort: 'displayOrder',
  });

  const { data: categories = [], isLoading, isError } = useCategoriesQuery(queryParams);
  const deleteMutation = useDeleteCategoryMutation();
  const restoreMutation = useRestoreCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleQueryChange = useCallback((params: DataViewQueryParams) => {
    const nextParams: CategoryQueryParams = {
      page: params.page,
      limit: params.pageSize,
    };

    if (params.search?.trim()) {
      nextParams.search = params.search.trim();
    }

    if (params.quickFilter && params.quickFilter !== 'all') {
      if (params.quickFilter === 'active') nextParams.isActive = true;
      else if (params.quickFilter === 'inactive') nextParams.isActive = false;
    }

    if (params.advancedFilters) {
      if (params.advancedFilters.isActive && params.advancedFilters.isActive !== 'all') {
        nextParams.isActive = params.advancedFilters.isActive === 'true';
      }
    }

    if (params.sortField) {
      nextParams.sort =
        params.sortDirection === 'desc' ? `-${params.sortField}` : params.sortField;
    } else {
      nextParams.sort = 'displayOrder';
    }

    setQueryParams(nextParams);
  }, []);

  const openAdd = () => {
    setCategoryToEdit(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setCategoryToEdit(cat);
    setModalOpen(true);
  };

  const openDeleteDialog = (cat: Category) => {
    setCategoryToDelete(cat);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    const targetId = categoryToDelete.id || categoryToDelete._id;
    if (!targetId) return;

    try {
      await deleteMutation.mutateAsync(targetId);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (cat: Category) => {
    const targetId = cat.id || cat._id;
    if (!targetId) return;
    try {
      await restoreMutation.mutateAsync(targetId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (cat: Category, currentStatus: boolean) => {
    const targetId = cat.id || cat._id;
    if (!targetId) return;
    try {
      await updateMutation.mutateAsync({
        id: targetId,
        input: { isActive: !currentStatus },
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Columns definition
  const columns: ColumnDef<Category>[] = useMemo(
    () => [
      {
        id: 'icon',
        header: 'Icon',
        width: '64px',
        cell: (cat: Category) => (
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-2xs">
            {getCategoryIcon(cat)}
          </div>
        ),
      },
      {
        id: 'name',
        header: 'Category Name',
        sortable: true,
        cell: (cat: Category) => {
          const { en: enName, am: amName } = extractLocalizedPair(cat.name);
          const displayName = enName || getCategoryName(cat, 'en');
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {displayName}
                </span>
                {amName && (
                  <Badge variant="outline" className="text-[10px] font-normal py-0 px-1.5 bg-slate-50 dark:bg-slate-900 border-slate-200">
                    አማ: {amName}
                  </Badge>
                )}
              </div>
              {cat.description && (
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {getCategoryDescription(cat, 'en') || getCategoryDescription(cat, 'am')}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: 'displayOrder',
        header: 'Order',
        sortable: true,
        width: '90px',
        cell: (cat: Category) => (
          <Badge variant="secondary" className="text-xs font-mono font-bold px-2 py-0.5">
            #{cat.displayOrder ?? 0}
          </Badge>
        ),
      },
      {
        id: 'isActive',
        header: 'Status',
        sortable: true,
        width: '120px',
        cell: (cat: Category) => {
          const active = cat.isActive !== false;
          return (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={active}
                onCheckedChange={() => handleToggleActive(cat, active)}
              />
              <span
                className={`text-[11px] font-bold ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        width: '80px',
        cell: (cat: Category) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
                <DropdownMenuItem
                  onClick={() => openEdit(cat)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Category
                </DropdownMenuItem>

                {cat.isDeleted ? (
                  <DropdownMenuItem
                    onClick={() => handleRestore(cat)}
                    className="text-xs font-medium text-emerald-600 cursor-pointer"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(cat)}
                    className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  // Quick filters
  const quickFilters: QuickFilterOption[] = [
    { key: 'all', label: 'All Categories', count: categories.length },
    {
      key: 'active',
      label: 'Active',
      count: categories.filter((c: any) => c.isActive !== false && !c.isDeleted).length,
    },
    {
      key: 'inactive',
      label: 'Inactive',
      count: categories.filter((c: any) => c.isActive === false && !c.isDeleted).length,
    },
  ];

  // Filter fields
  const filterFields: AdvancedFilterField[] = [
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active Only', value: 'true' },
        { label: 'Inactive Only', value: 'false' },
      ],
    },
  ];

  // Group By options
  const groupByOptions: GroupByOption[] = [
    {
      id: 'status',
      label: 'Status',
      accessor: (c: any) => (c.isActive !== false ? 'Active' : 'Inactive'),
    },
  ];

  // Sort Options
  const sortOptions: SortOption[] = [
    { id: 'order-asc', label: 'Display Order (Ascending)', field: 'displayOrder', direction: 'asc' },
    { id: 'order-desc', label: 'Display Order (Descending)', field: 'displayOrder', direction: 'desc' },
    { id: 'name-asc', label: 'Name (A to Z)', field: 'name', direction: 'asc' },
    { id: 'name-desc', label: 'Name (Z to A)', field: 'name', direction: 'desc' },
  ];

  // Kanban Columns
  const kanbanColumns: KanbanColumnConfig[] = [
    { id: 'Active', title: 'Active Categories', matcher: (c: any) => c.isActive !== false },
    { id: 'Inactive', title: 'Inactive Categories', matcher: (c: any) => c.isActive === false },
  ];

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'activate-bulk',
      label: 'Activate Selected',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      onClick: async (selected: any[], clear) => {
        for (const cat of selected) {
          const id = cat.id || cat._id;
          if (id) await updateMutation.mutateAsync({ id, input: { isActive: true } });
        }
        toast.success(`Activated ${selected.length} categories`);
        clear();
      },
    },
    {
      id: 'deactivate-bulk',
      label: 'Deactivate Selected',
      icon: <XCircle className="h-4 w-4 text-slate-400" />,
      onClick: async (selected: any[], clear) => {
        for (const cat of selected) {
          const id = cat.id || cat._id;
          if (id) await updateMutation.mutateAsync({ id, input: { isActive: false } });
        }
        toast.success(`Deactivated ${selected.length} categories`);
        clear();
      },
    },
  ];

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950 min-h-screen pb-16">
      <PageHeader
        title="Menu Categories"
        subtitle="Organize dishes into dynamic, multilingual categories with custom display sorting."
        breadcrumbText="Menu"
        breadcrumbAction={() => navigate('/menu')}
        actionLabel="Add Category"
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
            variant="secondary"
            size="sm"
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl shadow-2xs"
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
        <DataViewSystem<Category>
          data={categories}
          rowKey={(cat) => cat.id || cat._id || ''}
          entityName="categories"
          columns={columns}
          isLoading={isLoading}
          isServerSide={true}
          onQueryChange={handleQueryChange}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchPlaceholder="Search categories by English / Amharic name..."
          searchFields={['name', 'description']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          kanbanColumns={kanbanColumns}
          presetStorageKey="menu_categories"
          selectable={true}
          bulkActions={bulkActions}
          onItemClick={(cat) => openEdit(cat)}
          exportFileName="restaurant_categories_export"
          primaryAction={{
            label: 'Add Category',
            onClick: openAdd,
          }}
          emptyIcon={<Tag className="h-6 w-6 text-slate-400" />}
          emptyTitle="No Categories Found"
          emptyDescription="Create your first food or beverage category to organize menu dishes."
          emptyActionLabel="Create Category"
          onEmptyAction={openAdd}
          renderCustomCard={(cat, isSelected) => {
            const active = cat.isActive !== false;
            const enName = getCategoryName(cat, 'en');
            const amName = typeof cat.name === 'object' ? cat.name?.am : undefined;
            const desc = getCategoryDescription(cat, 'en') || getCategoryDescription(cat, 'am');

            return (
              <div
                className={`relative group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 p-4 space-y-3 cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/2'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
                onClick={() => openEdit(cat)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {getCategoryIcon(cat)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {enName}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                          #{cat.displayOrder ?? 0}
                        </Badge>
                      </div>
                      {amName && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {amName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(cat)} className="text-xs">
                          <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(cat)}
                          className="text-xs text-rose-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {desc && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {desc}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400">Order #{cat.displayOrder ?? 0}</span>
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={active}
                      onCheckedChange={() => handleToggleActive(cat, active)}
                    />
                    <span
                      className={`text-[10px] font-bold ${
                        active
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {active ? 'Active' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </main>

      {/* Category Creation / Edit Modal */}
      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        categoryToEdit={categoryToEdit}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Delete Category "{categoryToDelete ? getCategoryName(categoryToDelete, 'en') : ''}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete this category? If any menu items are assigned to this category, the deletion will be rejected to protect your menu integrity.
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

export default MenuCategoriesPage;
