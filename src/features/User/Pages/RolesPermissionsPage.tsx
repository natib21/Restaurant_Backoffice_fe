// src/features/User/Pages/RolesPermissionsPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Settings2,
  Eye,
  Lock,
  CheckCircle2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Shield,
  KeyRound,
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
import { toast } from 'sonner';
import RightSideModal from '@/components/ui/RightSideModal';

import {
  useMerchantRolesQuery,
  useDeactivateMerchantRoleMutation,
  useActivateMerchantRoleMutation,
} from '../../../api/Queries/merchantQueries';
import { useMerchantTasksQuery } from '../../../api/Queries/taskQuery';

import RoleForm from '../Components/RoleCreateForm';
import RoleDetailView from '../Pages/RoleDetailPage';
import {
  enrichRoleData,
  getMethodStyle,
  PERMISSION_DOMAINS,
} from '../lib/rolePermissionUtils';

import { PageHeader, DataCard, type ColumnDef } from '@/components/Common';
import { DataViewSystem } from '../../../components/Common/AdavanceFilter';
import type {
  QuickFilterOption,
  AdvancedFilterField,
  GroupByOption,
  SortOption,
  BulkAction,
} from '../../../components/Common/AdavanceFilter';
import { useTranslation } from '@/locales/i18n';

type ModalMode = 'create' | 'detail' | 'edit';

const RolesPermissionsPage: React.FC = () => {
  const { t } = useTranslation('team');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  const { data: rawRoles = [], isLoading: rolesLoading } = useMerchantRolesQuery();
  const { data: rawTasks = [], isLoading: tasksLoading } = useMerchantTasksQuery();

  const deactivateMutation = useDeactivateMerchantRoleMutation();
  const activateMutation = useActivateMerchantRoleMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

  // Enriched roles with computed metrics
  const roles = useMemo(() => {
    return (rawRoles || []).map(enrichRoleData);
  }, [rawRoles]);

  const tasks = useMemo(() => {
    return rawTasks || [];
  }, [rawTasks]);

  // Summary Metrics
  const activeRolesCount = useMemo(() => roles.filter((r) => r.isActive).length, [roles]);
  const systemRolesCount = useMemo(() => roles.filter((r) => r.isSystemRole).length, [roles]);
  const customRolesCount = useMemo(() => roles.filter((r) => !r.isSystemRole).length, [roles]);

  // --- Toggle Active Logic ---
  const handleToggleActive = async (role: any) => {
    const isActivating = !role.isActive;
    setTogglingRoleId(role._id);
    try {
      if (isActivating) {
        await activateMutation.mutateAsync(role._id);
        toast.success(`Role "${role.name}" activated successfully`);
      } else {
        await deactivateMutation.mutateAsync(role._id);
        toast.success(`Role "${role.name}" deactivated`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update role status');
    } finally {
      setTogglingRoleId(null);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedRole(null);
    setModalOpen(true);
  };

  const handleOpenDetail = (role: any) => {
    setModalMode('detail');
    setSelectedRole(role);
    setModalOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setModalMode('edit');
    setSelectedRole(role);
    setModalOpen(true);
  };

  const handleDuplicateRole = (role: any) => {
    setModalMode('create');
    setSelectedRole({
      ...role,
      _id: undefined,
      name: `${role.name}_COPY`,
      description: `Copy of ${role.name}: ${role.description || ''}`,
    });
    setModalOpen(true);
    toast.info(`Configuring clone of ${role.name}`);
  };

  // --- Advanced Filter Bar Configurations ---
  const quickFilters: QuickFilterOption<any>[] = [
    { key: 'all', label: 'All Roles', count: roles.length, icon: <Shield className="h-3.5 w-3.5" /> },
    {
      key: 'active',
      label: 'Active',
      count: activeRolesCount,
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
      matcher: (r) => r.isActive,
    },
    {
      key: 'inactive',
      label: 'Inactive',
      count: roles.length - activeRolesCount,
      matcher: (r) => !r.isActive,
    },
    {
      key: 'system',
      label: 'System Roles',
      count: systemRolesCount,
      icon: <Lock className="h-3.5 w-3.5 text-sky-500" />,
      matcher: (r) => Boolean(r.isSystemRole),
    },
    {
      key: 'custom',
      label: 'Custom Created',
      count: customRolesCount,
      icon: <Settings2 className="h-3.5 w-3.5 text-amber-500" />,
      matcher: (r) => !r.isSystemRole,
    },
    {
      key: 'admin_tier',
      label: 'Admin / High Access',
      count: roles.filter((r) => r.accessTier === 'Admin / Full' || r.accessTier === 'Manager / High').length,
      icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />,
      matcher: (r) => r.accessTier === 'Admin / Full' || r.accessTier === 'Manager / High',
    },
  ];

  const filterFields: AdvancedFilterField[] = [
    {
      id: 'isActive',
      label: 'Activation Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Active Only', value: 'true' },
        { label: 'Inactive Only', value: 'false' },
      ],
    },
    {
      id: 'isSystemRole',
      label: 'Role Origin',
      type: 'select',
      options: [
        { label: 'All Origins', value: 'all' },
        { label: 'System Predefined', value: 'true' },
        { label: 'Custom Merchant Role', value: 'false' },
      ],
    },
    {
      id: 'primaryDomain',
      label: 'Primary Domain Focus',
      type: 'select',
      options: [
        { label: 'All Domains', value: 'all' },
        ...PERMISSION_DOMAINS.map((dom) => ({ label: dom, value: dom })),
      ],
    },
    {
      id: 'accessTier',
      label: 'Security Tier',
      type: 'select',
      options: [
        { label: 'All Security Tiers', value: 'all' },
        { label: 'Admin / Full Access', value: 'Admin / Full' },
        { label: 'Manager / High Access', value: 'Manager / High' },
        { label: 'Operational Access', value: 'Operational' },
        { label: 'View Only Access', value: 'View Only' },
      ],
    },
    {
      id: 'taskCount',
      label: 'Capabilities Range',
      type: 'number-range',
      min: 0,
      max: 100,
      suffix: 'capabilities',
    },
  ];

  const groupByOptions: GroupByOption<any>[] = [
    {
      id: 'status',
      label: 'Activation Status',
      accessor: (r) => (r.isActive ? 'Active Roles' : 'Deactivated Roles'),
    },
    {
      id: 'origin',
      label: 'Role Origin',
      accessor: (r) => (r.isSystemRole ? 'System Built-in' : 'Custom Defined'),
    },
    {
      id: 'domain',
      label: 'Primary Domain',
      accessor: (r) => r.primaryDomain || 'General',
    },
    {
      id: 'tier',
      label: 'Security Tier',
      accessor: (r) => r.accessTier,
    },
  ];

  const sortOptions: SortOption<any>[] = [
    { id: 'name_asc', label: 'Role Name (A - Z)', field: 'name', direction: 'asc' },
    { id: 'name_desc', label: 'Role Name (Z - A)', field: 'name', direction: 'desc' },
    { id: 'tasks_desc', label: 'Most Capabilities', field: 'taskCount', direction: 'desc' },
    { id: 'tasks_asc', label: 'Fewest Capabilities', field: 'taskCount', direction: 'asc' },
    { id: 'created_desc', label: 'Recently Created', field: 'createdAt', direction: 'desc' },
  ];

  const bulkActions: BulkAction<any>[] = [
    {
      id: 'bulk_activate',
      label: 'Activate Selected',
      icon: <ToggleRight className="h-4 w-4 text-emerald-500" />,
      onClick: async (selected, clear) => {
        try {
          for (const item of selected) {
            if (!item.isActive) {
              await activateMutation.mutateAsync(item._id);
            }
          }
          toast.success(`Activated ${selected.length} roles`);
          clear();
        } catch {
          toast.error('Failed to activate some roles');
        }
      },
    },
    {
      id: 'bulk_deactivate',
      label: 'Deactivate Selected',
      variant: 'destructive',
      icon: <ToggleLeft className="h-4 w-4" />,
      onClick: async (selected, clear) => {
        try {
          for (const item of selected) {
            if (item.isActive) {
              await deactivateMutation.mutateAsync(item._id);
            }
          }
          toast.success(`Deactivated ${selected.length} roles`);
          clear();
        } catch {
          toast.error('Failed to deactivate some roles');
        }
      },
    },
  ];

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      id: 'role',
      header: 'Role Identity',
      sortable: true,
      accessorKey: 'name',
      cell: (role) => (
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 ${
              role.isActive
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {role.isSystemRole ? (
              <Lock className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {role.name}
              </span>
              {role.isSystemRole && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/50 text-sky-600 border-sky-200 dark:border-sky-800"
                >
                  System
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-slate-500 truncate max-w-xs">
              {role.description || 'No description provided'}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'capabilities',
      header: 'Authorized Capabilities',
      sortable: true,
      accessorKey: 'taskCount',
      cell: (role) => (
        <div className="flex items-center gap-1.5 flex-wrap max-w-md">
          <Badge
            variant="outline"
            className="text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {role.taskCount} Methods
          </Badge>
          {role.tasks?.slice(0, 2).map((t: any) => (
            <Badge
              key={t._id || t.name}
              variant="secondary"
              className="text-[9px] font-medium max-w-[120px] truncate"
            >
              {t.name}
            </Badge>
          ))}
          {role.taskCount > 2 && (
            <span className="text-[10px] font-bold text-slate-400">
              +{role.taskCount - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'domain',
      header: 'Primary Domain',
      cell: (role) => (
        <Badge
          variant="secondary"
          className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          {role.primaryDomain}
        </Badge>
      ),
    },
    {
      id: 'securityTier',
      header: 'Security Level',
      cell: (role) => {
        let badgeColor = 'bg-slate-100 text-slate-600';
        if (role.accessTier === 'Admin / Full') {
          badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
        } else if (role.accessTier === 'Manager / High') {
          badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
        } else if (role.accessTier === 'Operational') {
          badgeColor = 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200';
        }
        return (
          <Badge variant="outline" className={`text-[10px] font-bold ${badgeColor}`}>
            {role.accessTier}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (role) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={role.isActive}
            disabled={togglingRoleId === role._id}
            onCheckedChange={() => handleToggleActive(role)}
          />
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              role.isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            {togglingRoleId === role._id
              ? '...'
              : role.isActive
              ? 'Active'
              : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (role) => (
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem onClick={() => handleOpenDetail(role)} className="text-xs cursor-pointer">
                <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(role)} className="text-xs cursor-pointer">
                <Settings2 className="mr-2 h-3.5 w-3.5 text-slate-500" /> Edit Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateRole(role)} className="text-xs cursor-pointer">
                <Copy className="mr-2 h-3.5 w-3.5 text-slate-500" /> Duplicate Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleToggleActive(role)}
                className={`text-xs cursor-pointer font-semibold ${
                  role.isActive ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {role.isActive ? 'Deactivate Role' : 'Activate Role'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Unified Page Header */}
      <PageHeader
        title="Roles Management"
        subtitle="Configure granular security policies, operational roles, and authorization levels"
        actionLabel="Create New Role"
        actionIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
        onAction={handleOpenCreate}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Security Roles"
            value={rolesLoading ? '...' : roles.length}
            icon={<Shield className="h-5 w-5" />}
            theme="primary"
            subtitle="Defined authorization profiles"
            isLoading={rolesLoading}
          />
          <DataCard
            title="Active Operational Roles"
            value={rolesLoading ? '...' : activeRolesCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Assignable to floor & office staff"
            isLoading={rolesLoading}
          />
          <DataCard
            title="System Predefined"
            value={rolesLoading ? '...' : systemRolesCount}
            icon={<Lock className="h-5 w-5" />}
            theme="sky"
            subtitle="Core immutable roles"
            isLoading={rolesLoading}
          />
          <DataCard
            title="API Capabilities"
            value={tasksLoading ? '...' : tasks.length}
            icon={<KeyRound className="h-5 w-5" />}
            theme="amber"
            subtitle="Available permissions"
            isLoading={tasksLoading}
          />
        </div>

        {/* Dedicated Pure DataViewSystem with Advanced Filter (No in-table tabs) */}
        <DataViewSystem<any>
          data={roles}
          rowKey="_id"
          entityName="roles"
          columns={columns}
          isLoading={rolesLoading}
          supportedViewModes={['grid', 'table', 'kanban', 'list']}
          defaultViewMode="grid"
          searchPlaceholder="Search by role name, description, capabilities, or domains..."
          searchFields={['name', 'description', 'primaryDomain', 'accessTier']}
          quickFilters={quickFilters}
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="name"
          presetStorageKey="merchant_roles_view"
          selectable={true}
          bulkActions={bulkActions}
          onItemClick={(role) => handleOpenDetail(role)}
          exportFileName="merchant_roles_export"
          primaryAction={{
            label: 'Create Role',
            onClick: handleOpenCreate,
          }}
          emptyIcon={<Shield className="h-8 w-8 text-slate-400" />}
          emptyTitle="No Roles Found"
          emptyDescription="No roles match your current search and filter criteria. Adjust your filters or create a new role."
          emptyActionLabel="Create New Role"
          onEmptyAction={handleOpenCreate}
          renderCustomCard={(role, isSelected, onSelect) => (
            <div
              key={role._id}
              onClick={() => handleOpenDetail(role)}
              className={`group relative rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md hover:border-primary/50 transition-all duration-200 space-y-4 cursor-pointer flex flex-col justify-between ${
                isSelected ? 'ring-2 ring-primary border-primary' : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center border shadow-2xs shrink-0 ${
                      role.isActive
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {role.isSystemRole ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {role.name}
                      </h3>
                      {role.isSystemRole && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 border-sky-200 dark:border-sky-800"
                        >
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {role.description || 'Custom defined role'}
                    </p>
                  </div>
                </div>

                {/* Actions & Switch */}
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={role.isActive}
                    disabled={togglingRoleId === role._id}
                    onCheckedChange={() => handleToggleActive(role)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => handleOpenDetail(role)}
                        className="text-xs cursor-pointer"
                      >
                        <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(role)}
                        className="text-xs cursor-pointer"
                      >
                        <Settings2 className="mr-2 h-3.5 w-3.5 text-slate-500" /> Edit Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateRole(role)}
                        className="text-xs cursor-pointer"
                      >
                        <Copy className="mr-2 h-3.5 w-3.5 text-slate-500" /> Duplicate Role
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Capabilities Tags Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Capabilities Preview</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {role.taskCount} Methods
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[52px]">
                  {role.tasks?.slice(0, 3).map((t: any) => {
                    const style = getMethodStyle(t.method);
                    return (
                      <div
                        key={t._id || t.name}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-800 truncate max-w-[170px]"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dotColor}`} />
                        <span className="truncate">{t.name}</span>
                      </div>
                    );
                  })}
                  {role.taskCount > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800">
                      +{role.taskCount - 3}
                    </span>
                  )}
                  {role.taskCount === 0 && (
                    <span className="text-xs text-slate-400 italic py-1">No permissions configured</span>
                  )}
                </div>
              </div>

              {/* Card Bottom Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {role.primaryDomain}
                </span>

                <Badge
                  variant={role.isActive ? 'default' : 'secondary'}
                  className={`text-[9px] font-bold uppercase ${
                    role.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                      : ''
                  }`}
                >
                  {role.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          )}
        />
      </div>

      {/* Right Side Slide-over Modal for Create / Detail / Edit */}
      <RightSideModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          modalMode === 'create'
            ? 'Create Security Role'
            : modalMode === 'edit'
            ? `Edit Permissions — ${selectedRole?.name}`
            : `${selectedRole?.name} Access Overview`
        }
        description={
          modalMode === 'create'
            ? 'Define role identity, operational scope, and authorized capabilities.'
            : modalMode === 'edit'
            ? 'Update granular capabilities and endpoint authorizations.'
            : 'Inspect authorized endpoints, assigned methods, and security tier.'
        }
      >
        {modalMode === 'create' && (
          <RoleForm
            role={selectedRole}
            tasks={tasks}
            onSuccess={() => setModalOpen(false)}
            onCancel={() => setModalOpen(false)}
          />
        )}
        {modalMode === 'detail' && (
          <RoleDetailView
            role={selectedRole}
            onEdit={() => setModalMode('edit')}
            onClose={() => setModalOpen(false)}
          />
        )}
        {modalMode === 'edit' && (
          <RoleForm
            role={selectedRole}
            tasks={tasks}
            onSuccess={() => setModalOpen(false)}
            onCancel={() => setModalMode('detail')}
          />
        )}
      </RightSideModal>
    </div>
  );
};

export default RolesPermissionsPage;
