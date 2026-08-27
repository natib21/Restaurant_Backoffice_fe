// src/features/Menu/Pages/MenuGroupsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Clock,
  Calendar,
  EyeOff,
  Eye,
  Layers,
  FolderKanban,
  UtensilsCrossed,
  Tag,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MenuGroupDetailPage from './MenuGroupDetailpage';
import MenuItemPage from './MenuItemPage';
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
import MenuGroupFormPage from '../Components/MenuGroupFormPage';

import {
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type KanbanColumnConfig,
  type DataViewQueryParams,
} from '@/components/Common';

import { toast } from 'sonner';
import {
  useMenuGroupsQuery,
  useDeleteMenuGroupMutation,
  type MenuGroupQueryParams,
} from '../../../api/Queries/menuQueries';
import { useState, useMemo, useCallback } from 'react';
import { getLocalizedName, getLocalizedDescription } from '../lib/localizationUtils';
import LocalizedNameCell from '../Components/LocalizedNameCell';

const MenuGroupsPage = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState<MenuGroupQueryParams>({
    page: 1,
    limit: 10,
  });

  const { data: groups = [], isLoading, isError } = useMenuGroupsQuery(queryParams);
  const deleteMutation = useDeleteMenuGroupMutation();

  const handleQueryChange = useCallback((params: DataViewQueryParams) => {
    const nextParams: MenuGroupQueryParams = {
      page: params.page,
      limit: params.pageSize,
    };

    if (params.search?.trim()) {
      nextParams.search = params.search.trim();
    }

    if (params.quickFilter && params.quickFilter !== 'all') {
      nextParams.visibility = params.quickFilter;
    }

    if (params.advancedFilters) {
      if (params.advancedFilters.visibility && params.advancedFilters.visibility !== 'all') {
        nextParams.visibility = params.advancedFilters.visibility;
      }
      if (params.advancedFilters.isAlcoholMenu !== undefined && params.advancedFilters.isAlcoholMenu !== '') {
        nextParams.isAlcoholMenu =
          params.advancedFilters.isAlcoholMenu === 'true' || params.advancedFilters.isAlcoholMenu === true;
      }
    }

    if (params.sortField) {
      nextParams.sort = params.sortDirection === 'desc' ? `-${params.sortField}` : params.sortField;
    }

    setQueryParams(nextParams);
  }, []);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<
    'add' | 'edit' | 'detail' | 'itemDetail'
  >('detail');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const openAdd = () => {
    setSelectedGroup(null);
    setSelectedItem(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const openEdit = (group: any) => {
    setSelectedGroup(group);
    setPanelMode('edit');
    setPanelOpen(true);
  };

  const openDetail = (group: any) => {
    setSelectedGroup(group);
    setSelectedItem(null);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const switchToEdit = () => {
    setPanelMode('edit');
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedGroup(null);
    setSelectedItem(null);
  };

  const onFormSuccess = () => {
    toast.success(
      panelMode === 'add' ? 'Menu group created!' : 'Menu group updated!'
    );
    if (panelMode === 'add') {
      closePanel();
    } else {
      setPanelMode('detail');
    }
  };

  const onFormCancel = () => {
    if (panelMode === 'add') {
      closePanel();
    } else {
      setPanelMode('detail');
    }
  };

  const openDeleteDialog = (id: string) => {
    setGroupToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteMutation.mutateAsync(groupToDelete);
      toast.success('Menu group deleted');
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      closePanel();
    } catch {
      toast.error('Failed to delete menu group');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'always':
        return <Clock className="h-3.5 w-3.5 text-emerald-500" />;
      case 'scheduled':
        return <Calendar className="h-3.5 w-3.5 text-blue-500" />;
      case 'hidden':
        return <EyeOff className="h-3.5 w-3.5 text-slate-400" />;
      default:
        return null;
    }
  };

  // 1. Column Definitions
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Group Name',
        accessorKey: 'name',
        sortable: true,
        cell: (group) => (
          <LocalizedNameCell
            name={group.name}
            badge={
              group.isSystemDefault ? (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
                  System
                </Badge>
              ) : undefined
            }
            showDescription={false}
          />
        ),
      },
      {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        cell: (group) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm">
            {getLocalizedDescription(group, 'en') || '—'}
          </span>
        ),
      },
      {
        id: 'items',
        header: 'Items Count',
        align: 'center',
        cell: (group) => (
          <Badge
            variant="outline"
            className="text-xs font-bold border-slate-200 dark:border-slate-700"
          >
            {group.items?.length || 0} items
          </Badge>
        ),
      },
      {
        id: 'visibility',
        header: 'Visibility',
        accessorKey: 'visibility',
        sortable: true,
        cell: (group) => (
          <div className="flex items-center gap-1.5">
            {getVisibilityIcon(group.visibility)}
            <span className="capitalize text-xs font-medium text-slate-700 dark:text-slate-300">
              {group.visibility || 'always'}
            </span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (group) => (
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
                  onClick={() => openDetail(group)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openEdit(group)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Group
                </DropdownMenuItem>
                {!group.isSystemDefault && (
                  <DropdownMenuItem
                    className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                    onClick={() => openDeleteDialog(group._id)}
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

  // 2. Quick Filters
  const quickFilters: QuickFilterOption[] = useMemo(() => {
    const alwaysCount = groups.filter((g: any) => g.visibility === 'always').length;
    const scheduledCount = groups.filter((g: any) => g.visibility === 'scheduled').length;
    const hiddenCount = groups.filter((g: any) => g.visibility === 'hidden').length;

    return [
      { key: 'all', label: 'All Groups', count: groups.length },
      { key: 'always', label: 'Always Visible', count: alwaysCount, icon: <Clock className="h-3.5 w-3.5 text-emerald-500" /> },
      { key: 'scheduled', label: 'Scheduled', count: scheduledCount, icon: <Calendar className="h-3.5 w-3.5 text-blue-500" /> },
      { key: 'hidden', label: 'Hidden', count: hiddenCount, icon: <EyeOff className="h-3.5 w-3.5 text-slate-400" /> },
    ];
  }, [groups]);

  // 3. Advanced Filter Fields
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'visibility',
        label: 'Visibility Mode',
        type: 'select',
        options: [
          { label: 'Always Visible', value: 'always' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Hidden', value: 'hidden' },
        ],
      },
      {
        id: 'isSystemDefault',
        label: 'Type',
        type: 'select',
        options: [
          { label: 'Custom Groups', value: 'false' },
          { label: 'System Default', value: 'true' },
        ],
      },
    ],
    []
  );

  // 4. Group By Options
  const groupByOptions: GroupByOption[] = useMemo(
    () => [
      { id: 'visibility', label: 'Visibility Mode', accessor: 'visibility' },
      {
        id: 'system',
        label: 'Group Origin',
        accessor: (g: any) => (g.isSystemDefault ? 'System Defaults' : 'Custom Created'),
      },
    ],
    []
  );

  // 5. Sort Options
  const sortOptions: SortOption[] = useMemo(
    () => [
      { id: 'name-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
      { id: 'name-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
      { id: 'visibility', label: 'Visibility', field: 'visibility', direction: 'asc' },
    ],
    []
  );

  // 6. Kanban Columns
  const kanbanColumns: KanbanColumnConfig[] = useMemo(
    () => [
      {
        id: 'always',
        title: 'Always Visible',
        color: 'bg-emerald-500',
        matcher: (item: any) => item.visibility === 'always' || !item.visibility,
      },
      {
        id: 'scheduled',
        title: 'Scheduled Time',
        color: 'bg-blue-500',
        matcher: (item: any) => item.visibility === 'scheduled',
      },
      {
        id: 'hidden',
        title: 'Hidden',
        color: 'bg-slate-400',
        matcher: (item: any) => item.visibility === 'hidden',
      },
    ],
    []
  );

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <p className="text-xs text-slate-500">
              Unable to load menu groups. Please check network connection and try again.
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
    <div className="bg-slate-50/50 dark:bg-slate-950 min-h-screen pb-16">
      <PageHeader
        title="Menu Groups"
        subtitle="Organize your menu into structured sections and timing groups."
        breadcrumbText="Menu"
        breadcrumbAction={() => navigate('/menu')}
        actionLabel="New Group"
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
            variant="secondary"
            size="sm"
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl shadow-2xs"
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

      {/* Main Content with DataViewSystem */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <DataViewSystem<any>
          data={groups}
          rowKey={(g) => g._id || g.id}
          entityName="menu groups"
          columns={columns}
          isLoading={isLoading}
          isServerSide={true}
          onQueryChange={handleQueryChange}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchPlaceholder="Search menu groups by name or description..."
          searchFields={['name', 'description', 'visibility']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          kanbanColumns={kanbanColumns}
          presetStorageKey="menu_groups"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
          onItemClick={(group) => openDetail(group)}
          exportFileName="menu_groups_export"
          primaryAction={{
            label: 'New Group',
            onClick: openAdd,
          }}
          emptyIcon={<FolderKanban className="h-6 w-6 text-slate-400" />}
          emptyTitle="No Menu Groups Found"
          emptyDescription="Create your first menu group category to organize dishes."
          emptyActionLabel="Create New Group"
          onEmptyAction={openAdd}
          renderCustomCard={(group, isSelected) => (
            <div
              className={`relative group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 p-4 space-y-3 cursor-pointer ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/2'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
              onClick={() => openDetail(group)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <LocalizedNameCell
                    name={group.name}
                    description={group.description}
                    badge={
                      group.isSystemDefault ? (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
                          System
                        </Badge>
                      ) : undefined
                    }
                    showDescription={true}
                  />
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
                        onClick={() => openDetail(group)}
                        className="text-xs font-medium cursor-pointer"
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEdit(group)}
                        className="text-xs font-medium cursor-pointer"
                      >
                        <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      {!group.isSystemDefault && (
                        <DropdownMenuItem
                          className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                          onClick={() => openDeleteDialog(group._id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <Badge
                  variant="outline"
                  className="text-[10px] border-slate-200 dark:border-slate-700"
                >
                  {group.items?.length || 0} items
                </Badge>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium capitalize">
                  {getVisibilityIcon(group.visibility)}
                  <span>{group.visibility || 'always'}</span>
                </div>
              </div>
            </div>
          )}
        />
      </main>

      {/* Right Drawer (Panel) */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={setPanelOpen}
        title={
          panelMode === 'add'
            ? 'New Menu Group'
            : panelMode === 'edit'
            ? 'Edit Menu Group'
            : panelMode === 'itemDetail'
            ? 'Item Details'
            : selectedGroup
            ? getLocalizedName(selectedGroup, 'en', 'Group Details')
            : 'Group Details'
        }
        description={
          panelMode === 'add'
            ? 'Define a new menu section with scheduling and item selection'
            : panelMode === 'edit'
            ? 'Update group settings, items, and display rules'
            : panelMode === 'itemDetail'
            ? 'View full item information'
            : 'View group information and contained items'
        }
      >
        {/* Group Detail */}
        {panelMode === 'detail' && selectedGroup && (
          <MenuGroupDetailPage
            groupId={selectedGroup._id}
            onEdit={switchToEdit}
            onOpenItemDetail={(itemId) => {
              setSelectedItem({ _id: itemId });
              setPanelMode('itemDetail');
            }}
          />
        )}

        {/* Item Detail */}
        {panelMode === 'itemDetail' && selectedItem && (
          <MenuItemPage
            itemId={selectedItem._id}
            onEdit={() => {}}
          />
        )}

        {/* Edit / Add Group */}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <MenuGroupFormPage
            initialData={panelMode === 'edit' ? selectedGroup : undefined}
            onSuccess={onFormSuccess}
            onCancel={onFormCancel}
          />
        )}
      </RightSideModal>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Delete Menu Group?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete this menu group? Items assigned to it
              will not be deleted from your general menu.
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
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuGroupsPage;
