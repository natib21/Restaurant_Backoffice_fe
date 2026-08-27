// src/features/Table/pages/TableManagementPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  Plus,
  QrCode,
  Users,
  CheckCircle2,
  AlertCircle,
  Ban,
  Building2,
  LayoutGrid,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Table as TableIcon,
  Activity,
  UserCheck,
  UtensilsCrossed,
  Printer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RightSideModal from '@/components/ui/RightSideModal';
import { PageHeader, DataCard, type ColumnDef, DataViewSystem, type QuickFilterOption, type AdvancedFilterField, type GroupByOption, type SortOption, type BulkAction } from '@/components/Common';
// import { DataViewSystem } from '../../../components/Common/AdvancedFilter';
// import type {
//   QuickFilterOption,
//   AdvancedFilterField,
//   GroupByOption,
//   SortOption,
//   BulkAction,
// } from '@/components/Common/AdvancedFilter/types';
import TableFormPage from '../Components/TableFormPage';
import TableDetailPage from './TableDetailPage';
import { TableQrViewModal } from '../Components/TableQrViewModal';
import { toast } from 'sonner';
import {
  useTablesQuery,
  useUpdateTableStatusMutation,
  useDeleteTableMutation,
  type Table,
} from '../../../api/Queries/tableQueries';
import { useGetMeQuery } from '../../../api/Queries/authQueries';
import { useBranchesQuery } from '../../../api/Queries/branchQueries';
import { useMyMerchantQuery } from '../../../api/Queries/merchantQueries';
import { useTranslation } from '@/locales/i18n';

// Status Config
const statusConfig: Record<
  string,
  { key: string; label: string; border: string; accent: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }
> = {
  available: {
    key: 'available',
    label: 'Available',
    border: 'border-emerald-500/50',
    accent: 'bg-emerald-500',
    badgeVariant: 'default',
    icon: CheckCircle2,
  },
  occupied: {
    key: 'occupied',
    label: 'Occupied',
    border: 'border-rose-500/50',
    accent: 'bg-rose-500',
    badgeVariant: 'destructive',
    icon: Users,
  },
  'needs-cleaning': {
    key: 'needsCleaning',
    label: 'Needs Cleaning',
    border: 'border-amber-500/50',
    accent: 'bg-amber-500',
    badgeVariant: 'secondary',
    icon: AlertCircle,
  },
  disabled: {
    key: 'disabled',
    label: 'Disabled',
    border: 'border-slate-300',
    accent: 'bg-slate-400',
    badgeVariant: 'outline',
    icon: Ban,
  },
};

export const TableManagementPage: React.FC = () => {
  const { t } = useTranslation('table');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  // Current branch from Header selector
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // User & role
  const { data: user } = useGetMeQuery();
  const isSuperAdmin = user?.role?.name === 'SUPER-MERCHANT-ADMIN';

  // All branches for lookup
  const { data: branches = [] } = useBranchesQuery();
  const currentBranch = branches.find((b) => b._id === currentBranchId);
  const currentBranchName = currentBranch?.name || 'All Locations';

  // Tables query
  const { data: rawTables = [], isLoading, refetch } = useTablesQuery(currentBranchId);
  const updateStatusMutation = useUpdateTableStatusMutation();
  const deleteTableMutation = useDeleteTableMutation();

  // Panel State
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>('detail');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // QR Modal State
  const [viewQrOpen, setViewQrOpen] = useState(false);
  const [viewQrTable, setViewQrTable] = useState<Table | null>(null);

  const { data: merchant } = useMyMerchantQuery();

  const openViewQr = (table: Table) => {
    setViewQrTable(table);
    setViewQrOpen(true);
  };

  const openPrintMenu = (table: Table) => {
    navigate(`/tables/print-menu?tableId=${table._id}`);
  };

  // Extract unique sections
  const sections = useMemo(() => {
    const set = new Set<string>();
    rawTables.forEach((table: Table) => {
      if (table.section) set.add(table.section);
    });
    return Array.from(set).sort();
  }, [rawTables]);

  // KPI Metrics
  const totalTables = rawTables.length;
  const availableCount = rawTables.filter((table: Table) => table.status === 'available').length;
  const occupiedCount = rawTables.filter((table: Table) => table.status === 'occupied').length;
  const cleaningCount = rawTables.filter((table: Table) => table.status === 'needs-cleaning').length;
  const totalCapacity = rawTables.reduce((sum: number, table: Table) => sum + (Number(table.capacity) || 0), 0);

  // Quick Filter Options
  const quickFilters: QuickFilterOption<Table>[] = useMemo(() => {
    const list: QuickFilterOption<Table>[] = [
      { key: 'all', label: 'All Tables', count: totalTables },
      {
        key: 'available',
        label: 'Available',
        count: availableCount,
        matcher: (t) => t.status === 'available',
      },
      {
        key: 'occupied',
        label: 'Occupied',
        count: occupiedCount,
        matcher: (t) => t.status === 'occupied',
      },
      {
        key: 'cleaning',
        label: 'Needs Cleaning',
        count: cleaningCount,
        matcher: (t) => t.status === 'needs-cleaning',
      },
    ];
    sections.slice(0, 3).forEach((sec) => {
      const count = rawTables.filter((t: Table) => t.section === sec).length;
      list.push({
        key: `section_${sec}`,
        label: sec,
        count,
        matcher: (t) => t.section === sec,
      });
    });
    return list;
  }, [totalTables, availableCount, occupiedCount, cleaningCount, sections, rawTables]);

  // Advanced Filter Fields
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Table Status',
        type: 'select',
        options: [
          { label: 'All Statuses', value: 'all' },
          { label: 'Available', value: 'available' },
          { label: 'Occupied', value: 'occupied' },
          { label: 'Needs Cleaning', value: 'needs-cleaning' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
      {
        id: 'section',
        label: 'Section / Floor Area',
        type: 'select',
        options: [
          { label: 'All Sections', value: 'all' },
          ...sections.map((sec) => ({ label: sec, value: sec })),
        ],
      },
      {
        id: 'capacity',
        label: 'Capacity Range',
        type: 'number-range',
        min: 1,
        max: 50,
        suffix: 'seats',
      },
    ],
    [sections]
  );

  // Group By Options
  const groupByOptions: GroupByOption<Table>[] = [
    {
      id: 'section',
      label: 'Section / Area',
      accessor: (table) => table.section || 'Main Hall',
    },
    {
      id: 'status',
      label: 'Dining Status',
      accessor: (table) => table.status || 'available',
    },
  ];

  // Sort Options
  const sortOptions: SortOption<Table>[] = [
    { id: 'tableNumber', label: 'Table Number (A-Z)', field: 'tableNumber', direction: 'asc' },
    { id: 'capacity_desc', label: 'Capacity (High to Low)', field: 'capacity', direction: 'desc' },
    { id: 'capacity_asc', label: 'Capacity (Low to High)', field: 'capacity', direction: 'asc' },
    { id: 'section', label: 'Section Name', field: 'section', direction: 'asc' },
  ];

  // Bulk Actions
  const bulkActions: BulkAction<Table>[] = [
    {
      id: 'mark_available',
      label: 'Set as Available',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      onClick: async (items, clearSelection) => {
        try {
          await Promise.all(
            items.map((item) =>
              updateStatusMutation.mutateAsync({
                id: item._id,
                status: 'available',
              })
            )
          );
          toast.success(`${items.length} tables marked as available`);
          clearSelection();
          refetch();
        } catch (err: any) {
          toast.error(err?.message || 'Failed to update status');
        }
      },
    },
    {
      id: 'mark_cleaning',
      label: 'Needs Cleaning',
      icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
      onClick: async (items, clearSelection) => {
        try {
          await Promise.all(
            items.map((item) =>
              updateStatusMutation.mutateAsync({
                id: item._id,
                status: 'needs-cleaning',
              })
            )
          );
          toast.success(`${items.length} tables marked for cleaning`);
          clearSelection();
          refetch();
        } catch (err: any) {
          toast.error(err?.message || 'Failed to update status');
        }
      },
    },
  ];

  // Table columns for Table View Mode
  const columns: ColumnDef<Table>[] = useMemo(
    () => [
      {
        id: 'tableNumber',
        header: 'Table Number',
        accessorKey: 'tableNumber',
        sortable: true,
        cell: (table: Table) => {
          const config = statusConfig[table.status] || statusConfig.available;
          return (
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center font-bold text-slate-800 dark:text-slate-100 border-2 ${config.border} rounded-xl bg-slate-50 dark:bg-slate-800`}
              >
                {table.tableNumber}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Table {table.tableNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  {table.location || 'Floor Table'}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'section',
        header: 'Section',
        accessorKey: 'section',
        sortable: true,
        cell: (table: Table) => (
          <Badge variant="outline" className="font-medium">
            {table.section || 'Main Hall'}
          </Badge>
        ),
      },
      {
        id: 'capacity',
        header: 'Capacity',
        accessorKey: 'capacity',
        sortable: true,
        cell: (table: Table) => (
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{table.capacity} Seats</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (table: Table) => {
          const config = statusConfig[table.status] || statusConfig.available;
          const StatusIcon = config.icon;
          return (
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${config.accent}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t(config.key)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'qr',
        header: 'QR Access',
        cell: (table: Table) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openViewQr(table);
            }}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <QrCode className="h-4 w-4 text-primary" />
            <span>View QR</span>
          </Button>
        ),
      },
      {
        id: 'printMenu',
        header: 'Physical Menu',
        cell: (table: Table) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openPrintMenu(table);
            }}
            className="h-8 gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Print Menu</span>
          </Button>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (table: Table) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openDetail(table)}
              title="Inspect Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedTable(table);
                setPanelMode('edit');
                setPanelOpen(true);
              }}
              title="Edit Table"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  const openDetail = (table: Table) => {
    setSelectedTable(table);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedTable(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedTable(null);
  };

  const isAllBranches = currentBranchId === null && isSuperAdmin;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20">
      <PageHeader
        title={t('tableManagement')}
        subtitle={`${currentBranchName} • Total Capacity: ${totalCapacity} Guests across ${totalTables} Tables`}
        breadcrumbText={tCommon('back')}
        breadcrumbAction={() => navigate(-1)}
        actions={[
          {
            label: 'Print Menu Studio',
            icon: <UtensilsCrossed className="h-4 w-4" />,
            variant: 'outline',
            onClick: () => navigate('/tables/print-menu'),
          },
          {
            label: t('addTable'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: openAdd,
          },
        ]}
      />

      {/* KPI Metric Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Tables"
            value={totalTables}
            subtitle={`${sections.length} floor sections`}
            icon={<TableIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          />
          <DataCard
            title="Available"
            value={availableCount}
            subtitle="Ready for seating"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          />
          <DataCard
            title="Occupied"
            value={occupiedCount}
            subtitle="Active guest dining"
            icon={<Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
          />
          <DataCard
            title="Needs Cleaning"
            value={cleaningCount}
            subtitle="Awaiting turnover"
            icon={<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          />
        </div>
      </div>

      {/* Main DataView System (No tabs) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <DataViewSystem<Table>
          data={rawTables}
          rowKey="_id"
          entityName="tables"
          columns={columns}
          title="Tables Directory"
          subtitle="Real-time restaurant floor plan and table seating status"
          searchPlaceholder="Search table number, section, or branch..."
          searchFields={['tableNumber', 'section']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          selectable={true}
          bulkActions={bulkActions}
          supportedViewModes={['grid', 'table', 'kanban', 'list']}
          defaultViewMode="grid"
          presetStorageKey="table_management_view"
          isLoading={isLoading}
          onItemClick={(table) => openDetail(table)}
          renderCustomCard={(table, isSelected, onSelect) => {
            const config = statusConfig[table.status] || statusConfig.available;
            const StatusIcon = config.icon;

            return (
              <div
                key={table._id}
                onClick={() => openDetail(table)}
                className={`group relative flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary border-primary' : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div
                  className={`absolute top-0 w-14 h-1.5 ${config.accent} rounded-full z-10`}
                />

                <div className="w-full flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {table.section || 'Main Area'}
                  </Badge>
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{
                      backgroundColor:
                        config.accent.replace('bg-', '') === 'slate-400'
                          ? '#94a3b8'
                          : config.accent.includes('emerald')
                          ? '#10b981'
                          : config.accent.includes('rose')
                          ? '#f43f5e'
                          : '#f59e0b',
                    }}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {t(config.key)}
                  </div>
                </div>

                <div
                  className={`relative aspect-square w-24 h-24 my-2 flex flex-col items-center justify-center border-2 ${config.border} bg-slate-50 dark:bg-slate-800/80 shadow-inner rounded-2xl`}
                >
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {table.tableNumber}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    {table.location || 'Floor Table'}
                  </span>
                </div>

                <div className="mt-3 w-full text-center space-y-2">
                  <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" /> {table.capacity} Seats
                    </span>
                  </div>

                  {isAllBranches && table.branch && (
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {table.branch.name}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-1.5 pt-2 border-t flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewQr(table);
                      }}
                      title="View Table QR Code"
                    >
                      <QrCode className="h-3.5 w-3.5 text-primary" />
                      View QR
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPrintMenu(table);
                      }}
                      title="Print Physical Menu with Table QR"
                    >
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      Print Menu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table);
                        setPanelMode('edit');
                        setPanelOpen(true);
                      }}
                      title="Edit Table Details"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Slide-Over Drawer for Table Form & Details */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        title={
          panelMode === 'add'
            ? t('newTableConfiguration')
            : `${t('table')} ${selectedTable?.tableNumber}`
        }
      >
        {panelMode === 'detail' && selectedTable && (
          <TableDetailPage
            tableId={selectedTable._id}
            onEdit={() => setPanelMode('edit')}
            onOpenPrintMenu={openPrintMenu}
          />
        )}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <TableFormPage
            initialData={panelMode === 'edit' ? selectedTable : undefined}
            onSuccess={() => {
              toast.success('Floor plan updated');
              closePanel();
              refetch();
            }}
            onCancel={closePanel}
          />
        )}
      </RightSideModal>

      {/* Dedicated View QR Modal */}
      <TableQrViewModal
        open={viewQrOpen}
        onOpenChange={setViewQrOpen}
        table={viewQrTable}
        merchant={merchant}
        onOpenPrintMenu={openPrintMenu}
      />
    </div>
  );
};

export default TableManagementPage;
