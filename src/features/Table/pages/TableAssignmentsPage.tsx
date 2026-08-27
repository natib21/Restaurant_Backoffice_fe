// src/features/Table/pages/TableAssignmentsPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Table as TableIcon,
  Shield,
  ArrowRightLeft,
  Sparkles,
  Layers,
  Save,
  Building2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader, DataCard, type ColumnDef } from '@/components/Common';
import { DataViewSystem } from '@/components/Common';
import type {
  QuickFilterOption,
  AdvancedFilterField,
  GroupByOption,
  SortOption,
}  from '../../../components/Common/AdavanceFilter/types';
import { useTablesQuery, type Table } from '@/api/Queries/tableQueries';
import { useMerchantStaffQuery } from '@/api/Queries/merchantQueries';
import { useBranchesQuery } from '@/api/Queries/branchQueries';
import { toast } from 'sonner';
import { useTranslation } from '@/locales/i18n';

interface EnrichedTable extends Table {
  isAssigned: boolean;
  assignedStaffId: string | null;
  assignedStaffName: string;
}

export const TableAssignmentsPage: React.FC = () => {
  const { t } = useTranslation('table');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  const { data: branches = [] } = useBranchesQuery();
  const currentBranch = branches.find((b) => b._id === currentBranchId);
  const currentBranchName = currentBranch?.name || 'All Locations';

  const { data: tables = [], isLoading: isTablesLoading, refetch } = useTablesQuery(currentBranchId);
  const { data: staffList = [], isLoading: isStaffLoading } = useMerchantStaffQuery();

  // Local state for assignments: { [tableId]: { staffId: string, staffName: string } }
  const [assignments, setAssignments] = useState<Record<string, { staffId: string; staffName: string }>>({});

  // Quick Bulk Assign Dialog State
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTargetSection, setBulkTargetSection] = useState('all');
  const [bulkStaffId, setBulkStaffId] = useState('');

  // Extract distinct sections
  const sections = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((table: Table) => {
      if (table.section) set.add(table.section);
    });
    return Array.from(set).sort();
  }, [tables]);

  // Active staff
  const activeStaff = useMemo(() => {
    return (staffList as any[]).filter((s) => s.isActive !== false);
  }, [staffList]);

  // Handle single assign
  const handleAssignSingle = (tableId: string, staffId: string) => {
    if (staffId === 'unassigned') {
      setAssignments((prev) => {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      });
      toast.success('Table unassigned');
      return;
    }

    const staffMember = activeStaff.find((s) => s._id === staffId);
    const staffName = staffMember
      ? `${staffMember.firstName} ${staffMember.lastName}`
      : 'Staff Member';

    setAssignments((prev) => ({
      ...prev,
      [tableId]: { staffId, staffName },
    }));
    toast.success(`Assigned to ${staffName}`);
  };

  // Bulk assign all tables in a section
  const handleBulkAssign = () => {
    if (!bulkStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    const staffMember = activeStaff.find((s) => s._id === bulkStaffId);
    const staffName = staffMember
      ? `${staffMember.firstName} ${staffMember.lastName}`
      : 'Staff Member';

    const targetTables =
      bulkTargetSection === 'all'
        ? tables
        : tables.filter((t: Table) => t.section === bulkTargetSection);

    setAssignments((prev) => {
      const next = { ...prev };
      targetTables.forEach((t: Table) => {
        next[t._id] = { staffId: bulkStaffId, staffName };
      });
      return next;
    });

    toast.success(`Assigned ${targetTables.length} tables to ${staffName}`);
    setBulkDialogOpen(false);
    setBulkStaffId('');
  };

  // Clear all assignments for a section
  const handleClearSection = (section: string) => {
    const targetTables =
      section === 'all'
        ? tables
        : tables.filter((t: Table) => t.section === section);

    setAssignments((prev) => {
      const next = { ...prev };
      targetTables.forEach((t: Table) => {
        delete next[t._id];
      });
      return next;
    });

    toast.success(`Cleared assignments for ${section === 'all' ? 'all tables' : section}`);
  };

  // Metrics
  const totalTables = tables.length;
  const assignedCount = Object.keys(assignments).length;
  const unassignedCount = Math.max(0, totalTables - assignedCount);
  const activeStaffCount = activeStaff.length;

  // Workload summary per staff member
  const staffWorkload = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(assignments).forEach((a) => {
      counts[a.staffId] = (counts[a.staffId] || 0) + 1;
    });
    return activeStaff.map((staff) => ({
      ...staff,
      assignedTableCount: counts[staff._id] || 0,
    }));
  }, [assignments, activeStaff]);

  // Enrich tables with assigned staff info
  const enrichedTables: EnrichedTable[] = useMemo(() => {
    return tables.map((t: Table) => {
      const assignment = assignments[t._id];
      return {
        ...t,
        isAssigned: Boolean(assignment),
        assignedStaffId: assignment?.staffId || null,
        assignedStaffName: assignment?.staffName || 'Unassigned',
      };
    });
  }, [tables, assignments]);

  // Quick Filters
  const quickFilters: QuickFilterOption<EnrichedTable>[] = useMemo(
    () => [
      { key: 'all', label: 'All Tables', count: totalTables },
      {
        key: 'assigned',
        label: 'Assigned',
        count: assignedCount,
        matcher: (t) => t.isAssigned,
      },
      {
        key: 'unassigned',
        label: 'Unassigned',
        count: unassignedCount,
        matcher: (t) => !t.isAssigned,
      },
      ...sections.slice(0, 3).map((sec) => ({
        key: `section_${sec}`,
        label: sec,
        count: tables.filter((t: Table) => t.section === sec).length,
        matcher: (t: EnrichedTable) => t.section === sec,
      })),
    ],
    [totalTables, assignedCount, unassignedCount, sections, tables]
  );

  // Advanced Filters
  const filterFields: AdvancedFilterField[] = [
    {
      id: 'section',
      label: 'Section',
      type: 'select',
      options: [
        { label: 'All Sections', value: 'all' },
        ...sections.map((s) => ({ label: s, value: s })),
      ],
    },
    {
      id: 'assignmentStatus',
      label: 'Assignment Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Unassigned', value: 'unassigned' },
      ],
    },
  ];

  // Group By
  const groupByOptions: GroupByOption<EnrichedTable>[] = [
    {
      id: 'section',
      label: 'Section',
      accessor: (t) => t.section || 'Main Area',
    },
    {
      id: 'assignedStaffName',
      label: 'Assigned Staff',
      accessor: (t) => t.assignedStaffName || 'Unassigned',
    },
  ];

  // Sort
  const sortOptions: SortOption<EnrichedTable>[] = [
    { id: 'tableNumber', label: 'Table Number (A-Z)', field: 'tableNumber', direction: 'asc' },
    { id: 'section', label: 'Section Name', field: 'section', direction: 'asc' },
    { id: 'assignedStaffName', label: 'Assigned Staff', field: 'assignedStaffName', direction: 'asc' },
  ];

  // Columns for Table View
  const columns: ColumnDef<EnrichedTable>[] = useMemo(
    () => [
      {
        id: 'tableNumber',
        header: 'Table Number',
        accessorKey: 'tableNumber',
        sortable: true,
        cell: (table: EnrichedTable) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 border">
              {table.tableNumber}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Table {table.tableNumber}
              </div>
              <div className="text-xs text-muted-foreground">{table.capacity} Seats</div>
            </div>
          </div>
        ),
      },
      {
        id: 'section',
        header: 'Section',
        accessorKey: 'section',
        sortable: true,
        cell: (table: EnrichedTable) => (
          <Badge variant="outline" className="font-medium">
            {table.section || 'Main Area'}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: 'Dining Status',
        accessorKey: 'status',
        sortable: true,
        cell: (table: EnrichedTable) => (
          <Badge
            variant={table.status === 'occupied' ? 'destructive' : table.status === 'available' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {table.status || 'Available'}
          </Badge>
        ),
      },
      {
        id: 'staff',
        header: 'Assigned Server',
        cell: (table: EnrichedTable) => {
          const assignment = assignments[table._id];
          return (
            <Select
              value={assignment?.staffId || 'unassigned'}
              onValueChange={(val) => handleAssignSingle(table._id, val)}
            >
              <SelectTrigger className="h-9 w-[190px] text-xs">
                <SelectValue placeholder="Assign Staff..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-muted-foreground italic">
                  -- Unassigned --
                </SelectItem>
                {activeStaff.map((s: any) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
    ],
    [assignments, activeStaff]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20">
      <PageHeader
        title="Staff Table Assignments"
        subtitle={`${currentBranchName} • Delegate floor zones and specific tables to servers and waiters`}
        breadcrumbText={tCommon('back')}
        breadcrumbAction={() => navigate(-1)}
        actionLabel="Bulk Assign Section"
        onAction={() => setBulkDialogOpen(true)}
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
            title="Assigned Tables"
            value={assignedCount}
            subtitle="Covered by servers"
            icon={<UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          />
          <DataCard
            title="Unassigned"
            value={unassignedCount}
            subtitle="Needs coverage"
            icon={<UserX className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          />
          <DataCard
            title="Servers on Duty"
            value={activeStaffCount}
            subtitle="Active roster"
            icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          />
        </div>
      </div>

      {/* Staff Workload Overview Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-xs p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              Staff Workload Distribution
            </h4>
            <span className="text-xs text-muted-foreground">
              {assignedCount}/{totalTables} Tables Allocated
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {staffWorkload.map((staff: any) => (
              <div
                key={staff._id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {staff.firstName} {staff.lastName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {staff.role?.name || 'Server'}
                  </div>
                </div>
                <Badge
                  variant={staff.assignedTableCount > 0 ? 'default' : 'outline'}
                  className="font-bold shrink-0"
                >
                  {staff.assignedTableCount} tbls
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* DataView System (No tabs) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <DataViewSystem<EnrichedTable>
          data={enrichedTables}
          rowKey="_id"
          entityName="tables"
          columns={columns}
          title="Floor Table Assignments"
          subtitle="Directly map waiters and waitresses to tables"
          searchPlaceholder="Search table number, section, or server..."
          searchFields={['tableNumber', 'section', 'assignedStaffName']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          supportedViewModes={['grid', 'table', 'list']}
          defaultViewMode="grid"
          presetStorageKey="table_assignments_view"
          isLoading={isTablesLoading || isStaffLoading}
          renderCustomCard={(table: EnrichedTable, isSelected, onSelect) => {
            const assignment = assignments[table._id];
            return (
              <Card
                key={table._id}
                className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all p-4 ${
                  isSelected ? 'ring-2 ring-primary border-primary' : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {table.section || 'Main Area'}
                  </Badge>
                  <Badge
                    variant={
                      table.status === 'occupied'
                        ? 'destructive'
                        : table.status === 'available'
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-[10px] uppercase font-bold"
                  >
                    {table.status || 'Available'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 my-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-lg">
                    {table.tableNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      Table {table.tableNumber}
                    </h4>
                    <p className="text-xs text-muted-foreground">{table.capacity} Seats Capacity</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assigned Server:
                  </label>
                  <Select
                    value={assignment?.staffId || 'unassigned'}
                    onValueChange={(val) => handleAssignSingle(table._id, val)}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="Assign Staff..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-muted-foreground italic">
                        -- Unassigned --
                      </SelectItem>
                      {activeStaff.map((s: any) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          }}
        />
      </div>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Bulk Assign Section
            </DialogTitle>
            <DialogDescription>
              Assign all tables in a specific floor section to a waiter or waitress.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Floor Section
              </label>
              <Select value={bulkTargetSection} onValueChange={setBulkTargetSection}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections (Entire Restaurant)</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assign To Staff Member
              </label>
              <Select value={bulkStaffId} onValueChange={setBulkStaffId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose a waiter/server..." />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} ({s.role?.name || 'Staff'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleClearSection(bulkTargetSection)}
              className="text-rose-600 hover:text-rose-700"
            >
              Clear Section
            </Button>
            <Button onClick={handleBulkAssign} disabled={!bulkStaffId}>
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableAssignmentsPage;
