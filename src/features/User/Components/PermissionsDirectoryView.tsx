// src/features/User/Pages/PermissionsDirectoryPage.tsx
import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Search,
  Lock,
  Users,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Code2,
  SlidersHorizontal,
  Info,
  ChevronRight,
  Eye,
  FileCheck,
  Shield,
  Activity,
  Filter,
} from 'lucide-react';

import { PageHeader, DataCard, type ColumnDef } from '@/components/Common';
import { DataViewSystem } from '@/components/Common/AdvancedFilter';
import type {
  QuickFilterOption,
  AdvancedFilterField,
  GroupByOption,
  SortOption,
  BulkAction,
} from '@/components/Common/AdvancedFilter/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import RightSideModal from '@/components/ui/RightSideModal';

import {
  useMerchantRolesQuery,
} from '../../../api/Queries/merchantQueries';
import { useMerchantTasksQuery } from '../../../api/Queries/taskQuery';

import {
  getTaskDomain,
  getMethodStyle,
  PERMISSION_DOMAINS,
  type PermissionDomain,
} from '../lib/rolePermissionUtils';
import RoleDetailView from '../Pages/RoleDetailPage';
import RoleForm from '../Components/RoleCreateForm';

export const PermissionsDirectoryPage: React.FC = () => {
  const { data: rawTasks = [], isLoading: tasksLoading } = useMerchantTasksQuery();
  const { data: rawRoles = [], isLoading: rolesLoading } = useMerchantRolesQuery();

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<any | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<'detail' | 'edit'>('detail');

  // Map each task to the roles that contain it
  const taskToRolesMap = useMemo(() => {
    const map = new Map<string, any[]>();
    (rawTasks || []).forEach((t: any) => map.set(t._id, []));

    (rawRoles || []).forEach((r: any) => {
      if (Array.isArray(r.tasks)) {
        r.tasks.forEach((rt: any) => {
          const taskId = typeof rt === 'string' ? rt : rt?._id;
          if (taskId && map.has(taskId)) {
            const list = map.get(taskId)!;
            list.push(r);
          }
        });
      }
    });

    return map;
  }, [rawTasks, rawRoles]);

  // Enriched tasks with computed properties
  const tasks = useMemo(() => {
    return (rawTasks || []).map((t: any) => {
      const assignedRoles = taskToRolesMap.get(t._id) || [];
      const domain = getTaskDomain(t);
      const method = (t.method || 'GET').toUpperCase();
      const isAssigned = assignedRoles.length > 0;
      const actionType = getMethodStyle(method).actionType;

      return {
        ...t,
        domain,
        method,
        actionType,
        isAssigned,
        assignedRoles,
        assignedRoleCount: assignedRoles.length,
        assignedRoleNames: assignedRoles.map((r: any) => r.name).join(', '),
      };
    });
  }, [rawTasks, taskToRolesMap]);

  // Metrics
  const readCount = useMemo(() => tasks.filter((t: any) => t.method === 'GET').length, [tasks]);
  const writeCount = useMemo(
    () => tasks.filter((t: any) => t.method === 'POST' || t.method === 'PUT' || t.method === 'PATCH').length,
    [tasks]
  );
  const deleteCount = useMemo(() => tasks.filter((t: any) => t.method === 'DELETE').length, [tasks]);
  const assignedCount = useMemo(() => tasks.filter((t: any) => t.isAssigned).length, [tasks]);

  const handleOpenRoleDetail = (role: any) => {
    setSelectedRoleForDetail(role);
    setRoleModalMode('detail');
    setRoleModalOpen(true);
    setSelectedTask(null);
  };

  // --- Advanced Filter Bar Configurations ---
  const quickFilters: QuickFilterOption<any>[] = [
    { key: 'all', label: 'All Capabilities', count: tasks.length, icon: <KeyRound className="h-3.5 w-3.5" /> },
    {
      key: 'assigned',
      label: 'Assigned in Roles',
      count: assignedCount,
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
      matcher: (t) => t.isAssigned,
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      count: tasks.length - assignedCount,
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
      matcher: (t) => !t.isAssigned,
    },
    {
      key: 'get_methods',
      label: 'Read (GET)',
      count: readCount,
      matcher: (t) => t.method === 'GET',
    },
    {
      key: 'mutations',
      label: 'Modify / Create',
      count: writeCount,
      matcher: (t) => t.method === 'POST' || t.method === 'PUT' || t.method === 'PATCH',
    },
    {
      key: 'destructive',
      label: 'Destructive (DELETE)',
      count: deleteCount,
      icon: <Lock className="h-3.5 w-3.5 text-rose-500" />,
      matcher: (t) => t.method === 'DELETE',
    },
  ];

  const filterFields: AdvancedFilterField[] = [
    {
      id: 'method',
      label: 'HTTP Method',
      type: 'select',
      options: [
        { label: 'All Methods', value: 'all' },
        { label: 'GET (Read Only)', value: 'GET' },
        { label: 'POST (Create)', value: 'POST' },
        { label: 'PUT (Update / Replace)', value: 'PUT' },
        { label: 'PATCH (Partial Update)', value: 'PATCH' },
        { label: 'DELETE (Remove)', value: 'DELETE' },
      ],
    },
    {
      id: 'domain',
      label: 'Functional Domain',
      type: 'select',
      options: [
        { label: 'All Domains', value: 'all' },
        ...PERMISSION_DOMAINS.map((dom) => ({ label: dom, value: dom })),
      ],
    },
    {
      id: 'isAssigned',
      label: 'Assignment Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Assigned to Roles', value: 'true' },
        { label: 'Not Assigned to Any Role', value: 'false' },
      ],
    },
    {
      id: 'assignedRoleCount',
      label: 'Assigned Roles Count',
      type: 'number-range',
      min: 0,
      max: (rawRoles || []).length || 10,
      suffix: 'roles',
    },
  ];

  const groupByOptions: GroupByOption<any>[] = [
    {
      id: 'domain',
      label: 'Functional Domain',
      accessor: (t) => t.domain || 'General & System',
    },
    {
      id: 'method',
      label: 'HTTP Method',
      accessor: (t) => t.method || 'GET',
    },
    {
      id: 'assigned',
      label: 'Assignment Status',
      accessor: (t) => (t.isAssigned ? 'Assigned Capabilities' : 'Unassigned Capabilities'),
    },
  ];

  const sortOptions: SortOption<any>[] = [
    { id: 'name_asc', label: 'Capability Name (A - Z)', field: 'name', direction: 'asc' },
    { id: 'name_desc', label: 'Capability Name (Z - A)', field: 'name', direction: 'desc' },
    { id: 'method_asc', label: 'HTTP Method (GET > POST > DELETE)', field: 'method', direction: 'asc' },
    { id: 'domain_asc', label: 'Domain (A - Z)', field: 'domain', direction: 'asc' },
    { id: 'roles_desc', label: 'Most Assigned Roles', field: 'assignedRoleCount', direction: 'desc' },
  ];

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      id: 'method',
      header: 'Method',
      sortable: true,
      accessorKey: 'method',
      cell: (task) => {
        const style = getMethodStyle(task.method);
        return (
          <Badge
            variant="outline"
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${style.badgeClass}`}
          >
            {task.method}
          </Badge>
        );
      },
    },
    {
      id: 'name',
      header: 'Capability Name',
      sortable: true,
      accessorKey: 'name',
      cell: (task) => (
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
            {task.name}
          </span>
          <span className="font-mono text-[10px] text-slate-500 truncate max-w-xs opacity-75">
            {task.endpoint || '/api/internal/v1/...'}
          </span>
        </div>
      ),
    },
    {
      id: 'domain',
      header: 'Business Domain',
      sortable: true,
      accessorKey: 'domain',
      cell: (task) => (
        <Badge
          variant="secondary"
          className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          {task.domain}
        </Badge>
      ),
    },
    {
      id: 'assignedRoles',
      header: 'Assigned Roles',
      sortable: true,
      accessorKey: 'assignedRoleCount',
      cell: (task) => (
        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
          {task.assignedRoles.slice(0, 2).map((r: any) => (
            <Badge
              key={r._id}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRoleDetail(r);
              }}
              className="text-[9px] font-semibold bg-slate-50 dark:bg-slate-800/60 max-w-[110px] truncate hover:border-primary cursor-pointer"
            >
              {r.name}
            </Badge>
          ))}
          {task.assignedRoles.length > 2 && (
            <Badge variant="secondary" className="text-[9px] font-bold">
              +{task.assignedRoles.length - 2}
            </Badge>
          )}
          {task.assignedRoles.length === 0 && (
            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Inspect',
      align: 'right',
      cell: (task) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTask(task);
          }}
          className="h-8 text-xs font-bold text-primary hover:text-primary/80 gap-1 rounded-xl"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Details</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Permissions & Capabilities Matrix"
        subtitle="Granular security inspection of all API endpoints, system methods, and role authorizations"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Capabilities"
            value={tasksLoading ? '...' : tasks.length}
            icon={<KeyRound className="h-5 w-5" />}
            theme="primary"
            subtitle="Registered system endpoints"
            isLoading={tasksLoading}
          />
          <DataCard
            title="Assigned in Roles"
            value={tasksLoading ? '...' : assignedCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle={`${Math.round((assignedCount / (tasks.length || 1)) * 100)}% coverage across roles`}
            isLoading={tasksLoading}
          />
          <DataCard
            title="Read Actions (GET)"
            value={tasksLoading ? '...' : readCount}
            icon={<Shield className="h-5 w-5" />}
            theme="sky"
            subtitle="Safe querying capabilities"
            isLoading={tasksLoading}
          />
          <DataCard
            title="Mutations & Writes"
            value={tasksLoading ? '...' : writeCount + deleteCount}
            icon={<Activity className="h-5 w-5" />}
            theme="amber"
            subtitle="State-changing operations"
            isLoading={tasksLoading}
          />
        </div>

        {/* DataViewSystem with Advanced Filter */}
        <DataViewSystem<any>
          data={tasks}
          rowKey="_id"
          entityName="capabilities"
          columns={columns}
          isLoading={tasksLoading}
          supportedViewModes={['grid', 'table', 'kanban', 'list']}
          defaultViewMode="grid"
          searchPlaceholder="Search capabilities by name, API endpoint URL, description, or assigned roles..."
          searchFields={['name', 'endpoint', 'description', 'domain', 'assignedRoleNames']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="name"
          presetStorageKey="merchant_permissions_view"
          selectable={false}
          onItemClick={(task) => setSelectedTask(task)}
          exportFileName="merchant_permissions_export"
          emptyIcon={<KeyRound className="h-8 w-8 text-slate-400" />}
          emptyTitle="No Capabilities Found"
          emptyDescription="No capabilities match your active search and filter criteria."
          renderCustomCard={(task) => {
            const methodStyle = getMethodStyle(task.method);
            return (
              <div
                key={task._id}
                onClick={() => setSelectedTask(task)}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${methodStyle.badgeClass}`}
                      >
                        {task.method}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-semibold text-slate-600 dark:text-slate-400"
                      >
                        {task.domain}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span>{task.assignedRoleCount}</span>
                    </div>
                  </div>

                  {/* Title & Endpoint */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                      {task.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-1 bg-slate-50 dark:bg-slate-800/70 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      {task.endpoint || '/api/v1/...'}
                    </p>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Assigned Roles Pill Preview */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1 items-center">
                    {task.assignedRoles.slice(0, 2).map((r: any) => (
                      <Badge
                        key={r._id}
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRoleDetail(r);
                        }}
                        className="text-[9px] font-semibold bg-slate-50 dark:bg-slate-800/60 max-w-[100px] truncate hover:border-primary"
                      >
                        {r.name}
                      </Badge>
                    ))}
                    {task.assignedRoles.length > 2 && (
                      <Badge variant="secondary" className="text-[9px] font-bold">
                        +{task.assignedRoles.length - 2}
                      </Badge>
                    )}
                    {task.assignedRoles.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Capability Inspection Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
          {selectedTask && (
            <>
              <DialogHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-black uppercase ${getMethodStyle(selectedTask.method).badgeClass}`}
                  >
                    {selectedTask.method}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {getTaskDomain(selectedTask)}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedTask.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  System API Capability Definition
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {/* Endpoint */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    API Endpoint Path
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {selectedTask.endpoint || 'Internal Handler'}
                  </p>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Functionality Description
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Assigned Roles List */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Authorized Roles</span>
                    <span className="text-primary font-bold">
                      {selectedTask.assignedRoles?.length || 0} Roles
                    </span>
                  </span>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedTask.assignedRoles?.map((r: any) => (
                      <div
                        key={r._id}
                        onClick={() => handleOpenRoleDetail(r)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {r.name}
                          </span>
                        </div>
                        <Badge
                          variant={r.isActive ? 'default' : 'secondary'}
                          className={`text-[9px] ${
                            r.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''
                          }`}
                        >
                          {r.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}

                    {(!selectedTask.assignedRoles || selectedTask.assignedRoles.length === 0) && (
                      <p className="text-xs text-slate-400 italic p-2">
                        This capability is not currently assigned to any merchant role.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Slide-over Modal */}
      <RightSideModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        title={
          roleModalMode === 'edit'
            ? `Edit Permissions — ${selectedRoleForDetail?.name}`
            : `${selectedRoleForDetail?.name} Access Overview`
        }
        description={
          roleModalMode === 'edit'
            ? 'Update granular capabilities and endpoint authorizations.'
            : 'Inspect authorized endpoints, assigned methods, and security tier.'
        }
      >
        {roleModalMode === 'detail' && (
          <RoleDetailView
            role={selectedRoleForDetail}
            onEdit={() => setRoleModalMode('edit')}
            onClose={() => setRoleModalOpen(false)}
          />
        )}
        {roleModalMode === 'edit' && (
          <RoleForm
            role={selectedRoleForDetail}
            tasks={tasks}
            onSuccess={() => setRoleModalOpen(false)}
            onCancel={() => setRoleModalMode('detail')}
          />
        )}
      </RightSideModal>
    </div>
  );
};

export default PermissionsDirectoryPage;
