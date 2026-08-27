import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Globe,
  Crown,
  Eye,
  Edit3,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RightSideModal from '@/components/ui/RightSideModal';
import BranchFormPage from '../Components/BranchFormPage';
import BranchDetailPage from './BranchDetailPage';
import { toast } from 'sonner';
import {
  useBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  type Branch,
} from '../../../api/Queries/branchQueries';
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

const BranchManagementPage = () => {
  const navigate = useNavigate();
  const { data: branches = [], isLoading } = useBranchesQuery();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>('detail');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const stats = useMemo(
    () => ({
      total: branches.length,
      active: branches.filter((b: Branch) => b.isActive).length,
      inactive: branches.filter((b: Branch) => !b.isActive).length,
      main: branches.filter((b: Branch) => b.isMain).length,
    }),
    [branches]
  );

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    branches.forEach((b: Branch) => {
      if (b.location?.city) cities.add(b.location.city);
    });
    return Array.from(cities).sort();
  }, [branches]);

  const openDetail = (branch: Branch) => {
    setSelectedBranch(branch);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setPanelMode('edit');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedBranch(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedBranch(null);
  };

  const columns: ColumnDef<Branch>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Branch Name',
        sortable: true,
        accessorKey: 'name',
        cell: (branch: Branch) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {branch.name}
                </span>
                {branch.isMain && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 font-bold">
                    <Crown className="h-2.5 w-2.5 mr-0.5" /> HQ
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Code: {branch.shortCode || branch._id?.slice(-6)?.toUpperCase()}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'location',
        header: 'Location & Address',
        accessorKey: 'location.city',
        sortable: true,
        cell: (branch: Branch) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {branch.location?.city}
              {branch.location?.subCity ? `, ${branch.location.subCity}` : ''}
            </span>
          </div>
        ),
      },
      {
        id: 'phone',
        header: 'Phone Contact',
        accessorKey: 'phone',
        sortable: true,
        cell: (branch: Branch) => (
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" />
            {branch.phone || '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        accessorKey: 'isActive',
        cell: (branch: Branch) => (
          <Badge
            className={
              branch.isActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold'
            }
          >
            {branch.isActive ? 'Online / Open' : 'Offline / Closed'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (branch: Branch) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 rounded-xl"
              onClick={() => openDetail(branch)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1 rounded-xl font-semibold"
              onClick={() => openEdit(branch)}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const quickFilters: QuickFilterOption<Branch>[] = useMemo(
    () => [
      {
        key: 'all',
        label: 'All Branches',
        count: stats.total,
        icon: <Building2 className="h-3.5 w-3.5" />,
        matcher: () => true,
      },
      {
        key: 'active',
        label: 'Online',
        count: stats.active,
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
        matcher: (branch: Branch) => branch.isActive,
      },
      {
        key: 'inactive',
        label: 'Offline',
        count: stats.inactive,
        icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
        matcher: (branch: Branch) => !branch.isActive,
      },
      {
        key: 'main',
        label: 'Headquarters',
        count: stats.main,
        icon: <Crown className="h-3.5 w-3.5 text-amber-500" />,
        matcher: (branch: Branch) => branch.isMain === true,
      },
    ],
    [stats.total, stats.active, stats.inactive, stats.main]
  );

  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'isActive',
        label: 'Status',
        type: 'status-pills',
        options: [
          { label: 'Active / Online', value: 'true', color: 'emerald' },
          { label: 'Inactive / Offline', value: 'false', color: 'rose' },
        ],
      },
      {
        id: 'location.city',
        label: 'City',
        type: 'multi-select',
        options: uniqueCities.map((city) => ({ label: city, value: city })),
      },
      {
        id: 'createdAt',
        label: 'Created Date Range',
        type: 'date-range',
        description: 'Filter branches by registration date',
      },
      {
        id: '_id',
        label: 'Branch ID or Code',
        type: 'text',
        placeholder: 'Search by ID or short code',
      },
    ],
    [uniqueCities]
  );

  const groupByOptions: GroupByOption<Branch>[] = useMemo(
    () => [
      {
        id: 'location.city',
        label: 'By City',
        icon: <Globe className="h-4 w-4" />,
        accessor: (branch: Branch) => branch.location?.city?.toUpperCase() || 'NO CITY',
      },
      {
        id: 'isActive',
        label: 'By Status',
        icon: <Building2 className="h-4 w-4" />,
        accessor: (branch: Branch) => (branch.isActive ? 'ACTIVE / ONLINE' : 'INACTIVE / OFFLINE'),
      },
      {
        id: 'isMain',
        label: 'By HQ / Branch',
        icon: <Crown className="h-4 w-4" />,
        accessor: (branch: Branch) => (branch.isMain ? 'HEADQUARTERS (HQ)' : 'REGULAR BRANCH'),
      },
    ],
    []
  );

  const sortOptions: SortOption<Branch>[] = useMemo(
    () => [
      { id: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
      { id: 'name_desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
      { id: 'createdAt_desc', label: 'Newest First', field: 'createdAt', direction: 'desc' },
      { id: 'createdAt_asc', label: 'Oldest First', field: 'createdAt', direction: 'asc' },
    ],
    []
  );

  const kanbanColumns: KanbanColumnConfig<Branch>[] = useMemo(
    () => [
      {
        id: 'active',
        title: 'Active / Online',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        matcher: (branch: Branch) => branch.isActive,
      },
      {
        id: 'inactive',
        title: 'Inactive / Offline',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        icon: <XCircle className="h-4 w-4 text-rose-600" />,
        matcher: (branch: Branch) => !branch.isActive,
      },
    ],
    []
  );

  const initialPresets: SavedPreset[] = useMemo(
    () => [
      {
        id: 'preset-active',
        name: 'Active Branches',
        isSystem: true,
        filters: {
          quickFilter: 'active',
          advanced: {},
          groupBy: 'location.city',
          viewMode: 'table',
          sortField: 'name',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-hq',
        name: 'HQ & Main',
        isSystem: true,
        filters: {
          quickFilter: 'main',
          advanced: {},
          groupBy: null,
          viewMode: 'grid',
          sortField: 'name',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-by-city',
        name: 'Branches by City',
        isSystem: true,
        filters: {
          quickFilter: 'all',
          advanced: {},
          groupBy: 'location.city',
          viewMode: 'table',
          sortField: 'createdAt',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
    ],
    []
  );

  const bulkActions: BulkAction<Branch>[] = useMemo(
    () => [
      {
        id: 'export_csv',
        label: 'Export Branches',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline',
        onClick: (selected, clearSelection) => {
          const rows = selected.map((branch: Branch) => ({
            ID: branch._id,
            Name: branch.name,
            Code: branch.shortCode || branch._id?.slice(-6)?.toUpperCase(),
            City: branch.location?.city || '',
            SubCity: branch.location?.subCity || '',
            Address: branch.location?.formattedAddress || '',
            Phone: branch.phone || '',
            IsActive: branch.isActive ? 'Yes' : 'No',
            IsMain: branch.isMain ? 'Yes' : 'No',
            CreatedAt: branch.createdAt,
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
          a.download = `branches_export_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${selected.length} branches to CSV.`);
          clearSelection();
        },
      },
    ],
    []
  );

  const renderBranchCard = (
    branch: Branch,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    return (
      <div
        className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md bg-white dark:bg-slate-900 ${
          isSelected
            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
            : branch.isActive
            ? 'border-slate-200 dark:border-slate-800'
            : 'border-rose-200 dark:border-rose-800'
        }`}
      >
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>

        <div className="flex items-start gap-3 mb-3 pr-8">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
              branch.isMain
                ? 'bg-amber-500/10 text-amber-600'
                : branch.isActive
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {branch.name}
              </h4>
              {branch.isMain && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 font-bold shrink-0">
                  <Crown className="h-2.5 w-2.5 mr-0.5" /> HQ
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Code: {branch.shortCode || branch._id?.slice(-6)?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3 mb-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {branch.location?.city}
              {branch.location?.subCity ? `, ${branch.location.subCity}` : ''}
            </span>
          </div>
          {branch.phone && (
            <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-400">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{branch.phone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge
            className={
              branch.isActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold'
            }
          >
            {branch.isActive ? 'Online' : 'Offline'}
          </Badge>
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openDetail(branch)}
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openEdit(branch)}
              title="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderBranchListItem = (
    branch: Branch,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    return (
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                branch.isMain
                  ? 'bg-amber-500/10 text-amber-600'
                  : branch.isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {branch.name}
              </span>
              {branch.isMain && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 font-bold shrink-0">
                  <Crown className="h-2.5 w-2.5 mr-0.5" /> HQ
                </Badge>
              )}
              <Badge
                className={
                  branch.isActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold shrink-0'
                }
              >
                {branch.isActive ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
              <span className="font-mono">
                Code: {branch.shortCode || branch._id?.slice(-6)?.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">
                  {branch.location?.city}
                  {branch.location?.subCity ? `, ${branch.location.subCity}` : ''}
                </span>
              </span>
              {branch.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-2.5 w-2.5 shrink-0" />
                  <span>{branch.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
            onClick={() => openDetail(branch)}
            title="View"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
            onClick={() => openEdit(branch)}
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Branch Locations"
        subtitle="Manage restaurant branches, physical addresses, operating hours, and localized menus"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DataCard
            title="Total Branches"
            value={isLoading ? '...' : stats.total}
            icon={<Globe className="h-5 w-5" />}
            theme="primary"
            subtitle="Registered operating facilities"
            isLoading={isLoading}
          />

          <DataCard
            title="Online Locations"
            value={isLoading ? '...' : stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Actively taking customer orders"
            isLoading={isLoading}
          />

          <DataCard
            title="Main Headquarters"
            value={isLoading ? '...' : stats.main}
            icon={<Crown className="h-5 w-5" />}
            theme="amber"
            subtitle="Designated primary branch"
            isLoading={isLoading}
          />
        </div>

        <DataViewSystem<Branch>
          data={branches}
          rowKey="_id"
          entityName="branches"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={6}
          emptyIcon={<Building2 className="h-8 w-8 text-slate-400" />}
          emptyTitle="No branch locations found"
          emptyDescription="No branches match the current filter or search criteria. Add your first restaurant branch location to get started."
          emptyActionLabel="Add Branch"
          onEmptyAction={openAdd}
          supportedViewModes={['table', 'grid', 'list', 'kanban']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search branches by name, city, address, phone, or code..."
          searchFields={['name', 'location.city', 'location.subCity', 'location.formattedAddress', 'phone', 'shortCode']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="name"
          defaultSortDirection="asc"
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="isActive"
          presetStorageKey="branches"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          renderCustomCard={renderBranchCard}
          renderCustomListItem={renderBranchListItem}
          exportFileName="branches_export"
          onItemClick={(branch) => openDetail(branch)}
          primaryAction={{
            label: 'New Branch',
            icon: <Plus className="h-4 w-4" />,
            onClick: openAdd,
          }}
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
        />
      </div>

      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        className="sm:max-w-2xl"
        title={
          panelMode === 'add'
            ? 'Register New Branch'
            : panelMode === 'edit'
            ? 'Edit Branch Details'
            : selectedBranch?.name || 'Branch Details'
        }
        description={
          panelMode === 'add'
            ? 'Set up a new physical location for your restaurant network.'
            : undefined
        }
      >
        {panelMode === 'detail' && selectedBranch && (
          <BranchDetailPage
            branchId={selectedBranch._id}
            onEdit={() => setPanelMode('edit')}
          />
        )}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <BranchFormPage
            initialData={panelMode === 'edit' ? selectedBranch : undefined}
            onSuccess={() => {
              toast.success(
                panelMode === 'add' ? 'New branch registered' : 'Branch updated'
              );
              closePanel();
            }}
            onCancel={closePanel}
          />
        )}
      </RightSideModal>
    </div>
  );
};

export default BranchManagementPage;
