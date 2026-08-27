// src/features/User/Pages/StaffManagementPage.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Calendar,
  Building2,
  Download,
  FileSpreadsheet,
  Layers,
  Clock,
  Briefcase,
  Send,
  DollarSign,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RightSideModal from '@/components/ui/RightSideModal';
import { type RootState } from '@/app/store';
import {
  useMerchantStaffQuery,
  useActivateStaffMemberMutation,
  useDeactivateStaffMemberMutation,
  useCreateStaffMemberMutation,
  useUpdateStaffMemberMutation,
  useMerchantRolesQuery,
  useMerchantStaffByBranchQuery,
  type StaffUser,
} from '../../../api/Queries/merchantQueries';
import StaffForm from '../Components/StaffInviteForm';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
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
import { toast } from 'sonner';

const StaffManagementPage = () => {
  const navigate = useNavigate();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // Data Fetching
  const allStaffQuery = useMerchantStaffQuery();
  const branchStaffQuery = useMerchantStaffByBranchQuery(currentBranchId);

  const staff = useMemo(() => {
    if (currentBranchId) return branchStaffQuery.data?.users ?? [];
    return allStaffQuery.data ?? [];
  }, [currentBranchId, branchStaffQuery.data, allStaffQuery.data]);

  const isLoading = currentBranchId
    ? branchStaffQuery.isLoading
    : allStaffQuery.isLoading;
  const { data: roles = [] } = useMerchantRolesQuery();

  // Mutations
  const createMutation = useCreateStaffMemberMutation();
  const updateMutation = useUpdateStaffMemberMutation();
  const activateMut = useActivateStaffMemberMutation();
  const deactivateMut = useDeactivateStaffMemberMutation();

  // State
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>('add');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Helper functions
  const isOnLeave = (member: any) => {
    if (!member.employmentStatus) return false;
    return ['on_leave', 'leave'].includes(String(member.employmentStatus).toLowerCase());
  };

  const isTerminated = (member: any) => {
    if (!member.employmentStatus) return false;
    return ['terminated', 'inactive', 'disabled'].includes(String(member.employmentStatus).toLowerCase()) ||
           (member.isActive === false && member.employmentStatus);
  };

  const getRoleName = (member: StaffUser): string => {
    if (!member.role) return 'Staff Member';
    if (typeof member.role === 'string') return member.role;
    return member.role.name || 'Staff Member';
  };

  const getBranchName = (member: StaffUser): string => {
    if (!member.branch) return '—';
    if (typeof member.branch === 'string') return 'Assigned';
    return member.branch.name || '—';
  };

  const getEmploymentType = (member: any): string => {
    return member.employmentType || member.type || 'Full-time';
  };

  const getInitials = (member: StaffUser): string => {
    const first = member.firstName?.[0] || '';
    const last = (member as any).lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Counts for quick filters
  const activeCount = useMemo(() => staff.filter((m: any) => m.isActive && !isOnLeave(m) && !isTerminated(m)).length, [staff]);
  const onLeaveCount = useMemo(() => staff.filter((m: any) => isOnLeave(m)).length, [staff]);
  const terminatedCount = useMemo(() => staff.filter((m: any) => isTerminated(m) || !m.isActive).length, [staff]);
  const totalPayroll = useMemo(() => {
    return staff
      .filter((m: any) => m.isActive)
      .reduce((sum, m: any) => sum + (Number(m.salary) || 0), 0);
  }, [staff]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setProcessingId(id);
    try {
      if (currentActive) {
        await deactivateMut.mutateAsync(id);
        toast.success('Staff member deactivated successfully');
      } else {
        await activateMut.mutateAsync(id);
        toast.success('Staff member activated successfully');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const isToggling = (id: string) => processingId === id;

  // 1. Table Columns
  const columns: ColumnDef<StaffUser>[] = useMemo(
    () => [
      {
        id: 'member',
        header: 'Team Member',
        sortable: true,
        accessorKey: 'firstName',
        cell: (member: any) => {
          const isActive = member.isActive && !isTerminated(member);
          const leave = isOnLeave(member);
          return (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className={`h-10 w-10 border ${
                  isActive
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-rose-300 dark:border-rose-700'
                }`}>
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className={`text-xs font-bold ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                {isActive && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Active" />
                )}
                {leave && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" title="On Leave" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {member.firstName} {(member as any).lastName || ''}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {member.email || 'No email'}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'role',
        header: 'Role & Permissions',
        sortable: true,
        cell: (member) => (
          <div className="space-y-0.5">
            <Badge
              variant="outline"
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 capitalize"
            >
              <ShieldCheck className="h-3 w-3 mr-1 text-primary" />
              {getRoleName(member)}
            </Badge>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Building2 className="h-2.5 w-2.5" />
              {getBranchName(member)}
            </div>
          </div>
        ),
      },
      {
        id: 'contact',
        header: 'Contact Info',
        cell: (member) => (
          <div className="space-y-1">
            {member.phone && (
              <div className="flex items-center gap-1.5 text-xs">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-600 dark:text-slate-300">{member.phone}</span>
              </div>
            )}
            {member.email && (
              <div className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-slate-500 truncate max-w-[150px]">{member.email}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'employment',
        header: 'Employment',
        cell: (member: any) => (
          <div className="space-y-0.5">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {getEmploymentType(member)}
            </span>
            {member.salary && (
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <DollarSign className="h-2.5 w-2.5" />
                ETB {Number(member.salary).toLocaleString()}/mo
              </div>
            )}
            {member.hireDate && (
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                Since {new Date(member.hireDate).toLocaleDateString()}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'joined',
        header: 'Joined',
        sortable: true,
        cell: (member) => {
          const date = member.hireDate || member.createdAt;
          if (!date) return <span className="text-xs text-slate-400 italic">N/A</span>;
          return (
            <div className="space-y-0.5">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {new Date(date).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {formatDistanceToNow(new Date(date), { addSuffix: true })}
              </span>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Access Status',
        sortable: true,
        cell: (member: any) => {
          const leave = isOnLeave(member);
          const term = isTerminated(member);
          return (
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={member.isActive}
                disabled={isToggling(member._id)}
                onCheckedChange={() =>
                  handleToggleActive(member._id, member.isActive)
                }
              />
              <span
                className={cn(
                  'text-[11px] font-bold uppercase tracking-wider',
                  isToggling(member._id)
                    ? 'text-amber-600'
                    : leave
                    ? 'text-amber-600 dark:text-amber-400'
                    : term
                    ? 'text-slate-400'
                    : member.isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                )}
              >
                {isToggling(member._id)
                  ? 'Updating...'
                  : leave
                  ? 'On Leave'
                  : term
                  ? 'Terminated'
                  : member.isActive
                  ? 'Active'
                  : 'Disabled'}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (member) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="h-4 w-4">
                    <path d="M3.75 7.5C3.75 8.32843 3.07843 9 2.25 9C1.42157 9 0.75 8.32843 0.75 7.5C0.75 6.67157 1.42157 6 2.25 6C3.07843 6 3.75 6.67157 3.75 7.5ZM8.75 7.5C8.75 8.32843 8.07843 9 7.25 9C6.42157 9 5.75 8.32843 5.75 7.5C5.75 6.67157 6.42157 6 7.25 6C8.07843 6 8.75 6.67157 8.75 7.5ZM12.25 9C13.0784 9 13.75 8.32843 13.75 7.5C13.75 6.67157 13.0784 6 12.25 6C11.4216 6 10.75 6.67157 10.75 7.5C10.75 8.32843 11.4216 9 12.25 9Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                  onClick={() => navigate(`/users/staff/${member._id}`)}
                  className="cursor-pointer text-xs"
                >
                  <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedMember(member);
                    setPanelMode('edit');
                    setPanelOpen(true);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5 text-slate-500" /> Edit Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/5 cursor-pointer text-xs font-semibold"
                  onClick={() => {
                    setMemberToDelete(member._id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove Access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [navigate]
  );

  // 2. Quick Filters
  const quickFilters: QuickFilterOption<StaffUser>[] = useMemo(
    () => [
      {
        key: 'all',
        label: 'All Members',
        count: staff.length,
        icon: <Users className="h-3.5 w-3.5" />,
        matcher: () => true,
      },
      {
        key: 'active',
        label: 'Active',
        count: activeCount,
        icon: <UserCheck className="h-3.5 w-3.5 text-emerald-500" />,
        matcher: (m: any) => m.isActive && !isOnLeave(m) && !isTerminated(m),
      },
      {
        key: 'leave',
        label: 'On Leave',
        count: onLeaveCount,
        icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
        matcher: (m: any) => isOnLeave(m),
      },
      {
        key: 'terminated',
        label: 'Terminated',
        count: terminatedCount,
        icon: <UserX className="h-3.5 w-3.5 text-rose-500" />,
        matcher: (m: any) => isTerminated(m) || !m.isActive,
      },
    ],
    [staff.length, activeCount, onLeaveCount, terminatedCount]
  );

  // 3. Advanced Filter Fields
  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'role',
        label: 'Role / Department',
        type: 'multi-select',
        options: roles.map((r: any) => ({
          label: r.name,
          value: r._id || r.name,
        })),
      },
      {
        id: 'employmentType',
        label: 'Employment Type',
        type: 'select',
        placeholder: 'Select employment type...',
        options: [
          { label: 'All Types', value: 'all' },
          { label: 'Full-time', value: 'Full-time' },
          { label: 'Part-time', value: 'Part-time' },
          { label: 'Contract', value: 'Contract' },
          { label: 'Internship', value: 'Internship' },
          { label: 'Casual', value: 'Casual' },
        ],
      },
      {
        id: 'salary',
        label: 'Salary Range (ETB)',
        type: 'number-range',
        prefix: 'ETB ',
        min: 0,
        max: 100000,
        step: 500,
        description: 'Filter by monthly salary range',
      },
      {
        id: 'hireDate',
        label: 'Hire Date Range',
        type: 'date-range',
        description: 'Filter by date of hire',
      },
      {
        id: 'isActive',
        label: 'Account Status',
        type: 'status-pills',
        options: [
          { label: 'Active', value: 'active', color: 'emerald' },
          { label: 'Inactive', value: 'inactive', color: 'rose' },
        ],
      },
    ],
    [roles]
  );

  // 4. Grouping Options
  const groupByOptions: GroupByOption<StaffUser>[] = useMemo(
    () => [
      {
        id: 'role',
        label: 'By Role',
        icon: <ShieldCheck className="h-4 w-4" />,
        accessor: (member) => getRoleName(member).toUpperCase(),
      },
      {
        id: 'branch',
        label: 'By Branch / Department',
        icon: <Building className="h-4 w-4" />,
        accessor: (member) => getBranchName(member).toUpperCase(),
      },
      {
        id: 'employment',
        label: 'By Employment Type',
        icon: <Briefcase className="h-4 w-4" />,
        accessor: (member: any) => (getEmploymentType(member) || 'UNSPECIFIED').toUpperCase(),
      },
      {
        id: 'status',
        label: 'By Work Status',
        icon: <Layers className="h-4 w-4" />,
        accessor: (member: any) => {
          if (isOnLeave(member)) return 'ON LEAVE';
          if (isTerminated(member)) return 'TERMINATED';
          if (member.isActive) return 'ACTIVE';
          return 'DISABLED';
        },
      },
    ],
    []
  );

  // 5. Sorting Options
  const sortOptions: SortOption<StaffUser>[] = useMemo(
    () => [
      { id: 'name_asc', label: 'Name (A-Z)', field: 'firstName', direction: 'asc' },
      { id: 'name_desc', label: 'Name (Z-A)', field: 'firstName', direction: 'desc' },
      { id: 'role', label: 'By Role', field: 'role.name', direction: 'asc' },
      { id: 'hire_asc', label: 'Hire Date (Oldest First)', field: 'hireDate', direction: 'asc' },
      { id: 'hire_desc', label: 'Hire Date (Newest First)', field: 'hireDate', direction: 'desc' },
      { id: 'joined_desc', label: 'Created (Newest)', field: 'createdAt', direction: 'desc' },
      { id: 'salary_desc', label: 'Salary (High to Low)', field: 'salary', direction: 'desc' },
    ],
    []
  );

  // 6. Kanban Columns (By Status)
  const kanbanColumns: KanbanColumnConfig<StaffUser>[] = useMemo(
    () => [
      {
        id: 'active',
        title: 'Active / Working',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <UserCheck className="h-4 w-4 text-emerald-600" />,
        matcher: (m: any) => m.isActive && !isOnLeave(m) && !isTerminated(m),
      },
      {
        id: 'leave',
        title: 'On Leave',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <Clock className="h-4 w-4 text-amber-600" />,
        matcher: (m: any) => isOnLeave(m),
      },
      {
        id: 'inactive',
        title: 'Inactive / Terminated',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        icon: <UserX className="h-4 w-4 text-rose-600" />,
        matcher: (m: any) => !m.isActive || isTerminated(m),
      },
    ],
    []
  );

  // 7. System Presets
  const initialPresets: SavedPreset[] = useMemo(
    () => [
      {
        id: 'preset-active',
        name: 'Active Workforce',
        isSystem: true,
        filters: {
          quickFilter: 'active',
          advanced: {},
          groupBy: 'role',
          viewMode: 'table',
          sortField: 'firstName',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-payroll',
        name: 'Payroll Export View',
        isSystem: true,
        filters: {
          quickFilter: 'all',
          advanced: { isActive: 'active' },
          groupBy: 'branch',
          viewMode: 'table',
          sortField: 'salary',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-new',
        name: 'Recent Hires',
        isSystem: true,
        filters: {
          quickFilter: 'active',
          advanced: {},
          groupBy: null,
          viewMode: 'grid',
          sortField: 'createdAt',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
    ],
    []
  );

  // 8. Bulk Actions
  const bulkActions: BulkAction<StaffUser>[] = useMemo(
    () => [
      {
        id: 'export_payroll',
        label: 'Export Payroll',
        icon: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
        variant: 'secondary',
        onClick: (selected, clearSelection) => {
          const rows = selected.map((m: any) => ({
            ID: m._id,
            FullName: `${m.firstName} ${m.lastName || ''}`,
            Email: m.email || '',
            Phone: m.phone || '',
            Role: getRoleName(m),
            Branch: getBranchName(m),
            EmploymentType: getEmploymentType(m),
            Salary: m.salary || 0,
            HireDate: m.hireDate || m.createdAt || '',
            Status: m.isActive ? 'Active' : 'Inactive',
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
          a.download = `staff_payroll_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported payroll data for ${selected.length} member(s) to CSV.`);
          clearSelection();
        },
      },
      {
        id: 'assign_shifts',
        label: 'Assign Shifts',
        icon: <Calendar className="h-4 w-4 text-primary" />,
        variant: 'default',
        onClick: (selected, clearSelection) => {
          toast.info(`Shift assignment dialog for ${selected.length} member(s) - feature coming soon.`);
          clearSelection();
        },
      },
      {
        id: 'send_announcement',
        label: 'Send Announcement',
        icon: <Send className="h-4 w-4 text-sky-500" />,
        variant: 'outline',
        onClick: (selected, clearSelection) => {
          toast.success(`Announcement queued for ${selected.length} team member(s).`);
          clearSelection();
        },
      },
      {
        id: 'export_contacts',
        label: 'Export Contact List',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline',
        onClick: (selected, clearSelection) => {
          const rows = selected.map((m: any) => ({
            FullName: `${m.firstName} ${m.lastName || ''}`,
            Email: m.email || '',
            Phone: m.phone || '',
            Role: getRoleName(m),
            Branch: getBranchName(m),
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
          a.download = `staff_contacts_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${selected.length} contact(s) to CSV.`);
          clearSelection();
        },
      },
    ],
    []
  );

  // 9. Custom Card Renderer (Grid View)
  const renderStaffCard = (
    member: StaffUser,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const m = member as any;
    const leave = isOnLeave(m);
    const term = isTerminated(m);
    const isActive = member.isActive && !term;

    return (
      <div
        className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md bg-white dark:bg-slate-900 ${
          isSelected
            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
            : term
            ? 'border-rose-200 dark:border-rose-800/50'
            : leave
            ? 'border-amber-200 dark:border-amber-800/50'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>

        {/* Header: Avatar + Name + Role */}
        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="relative shrink-0">
            <Avatar
              className={`h-12 w-12 border-2 ${
                isActive
                  ? 'border-emerald-200 dark:border-emerald-800'
                  : term
                  ? 'border-rose-300 dark:border-rose-700'
                  : 'border-amber-200 dark:border-amber-800'
              }`}
            >
              <AvatarImage src={m.avatar} />
              <AvatarFallback
                className={`text-sm font-bold ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : term
                    ? 'bg-rose-500/10 text-rose-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {getInitials(member)}
              </AvatarFallback>
            </Avatar>
            {isActive && !leave && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            )}
            {leave && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
            )}
            {!isActive && !term && !leave && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {member.firstName} {m.lastName || ''}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 capitalize px-1.5 py-0"
              >
                <ShieldCheck className="h-2.5 w-2.5 mr-0.5 text-primary" />
                {getRoleName(member)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-1.5 text-xs mb-3">
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-600 dark:text-slate-300">{member.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">{getBranchName(member)}</span>
          </div>
        </div>

        {/* Employment Details */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Briefcase className="h-2.5 w-2.5" /> Type
            </p>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {getEmploymentType(m)}
            </p>
          </div>
          {m.salary && (
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <DollarSign className="h-2.5 w-2.5" /> Salary
              </p>
              <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                ETB {Number(m.salary).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Status + Joined */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mb-3">
          <Badge
            className={cn(
              'text-[10px] font-bold gap-1',
              leave
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : term
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : isActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30'
            )}
          >
            {leave
              ? <Clock className="h-2.5 w-2.5" />
              : term
              ? <UserX className="h-2.5 w-2.5" />
              : isActive
              ? <UserCheck className="h-2.5 w-2.5" />
              : <Users className="h-2.5 w-2.5" />
            }
            {leave ? 'On Leave' : term ? 'Terminated' : isActive ? 'Active' : 'Disabled'}
          </Badge>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            <span>
              {m.hireDate || m.createdAt
                ? formatDistanceToNow(new Date(m.hireDate || m.createdAt), { addSuffix: false })
                : '—'}
            </span>
          </div>
        </div>

        {/* Footer: Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-slate-500 rounded-xl"
            title="View Details"
            onClick={() => navigate(`/users/staff/${member._id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-slate-500 rounded-xl"
            title="Edit"
            onClick={() => {
              setSelectedMember(member);
              setPanelMode('edit');
              setPanelOpen(true);
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={member.isActive}
              disabled={isToggling(member._id)}
              onCheckedChange={() => handleToggleActive(member._id, member.isActive)}
            />
          </div>
        </div>
      </div>
    );
  };

  // 10. Custom List Item Renderer (List View)
  const renderStaffListItem = (
    member: StaffUser,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const m = member as any;
    const leave = isOnLeave(m);
    const term = isTerminated(m);
    const isActive = member.isActive && !term;

    return (
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Avatar + Profile */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <Avatar
              className={`h-9 w-9 border ${
                isActive
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-rose-300 dark:border-rose-700'
              }`}
            >
              <AvatarImage src={m.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {getInitials(member)}
              </AvatarFallback>
            </Avatar>
            {isActive && !leave && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            )}
            {leave && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {member.firstName} {m.lastName || ''}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-semibold bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 capitalize px-1.5 py-0 h-4"
              >
                {getRoleName(member)}
              </Badge>
              <span
                className={cn(
                  'text-[9px] font-bold uppercase',
                  leave
                    ? 'text-amber-600'
                    : term
                    ? 'text-rose-500'
                    : isActive
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                )}
              >
                {leave ? 'LEAVE' : term ? 'TERM' : isActive ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              {member.email ? (
                <span className="truncate">{member.email}</span>
              ) : member.phone ? (
                <span className="font-mono">{member.phone}</span>
              ) : (
                <span className="italic text-slate-400">No contact</span>
              )}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{getBranchName(member)}</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span className="hidden sm:inline">{getEmploymentType(m)}</span>
            </div>
          </div>
        </div>

        {/* Right: Salary + Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4 text-right">
            {m.salary && (
              <div>
                <p className="text-[10px] text-slate-400">Salary</p>
                <p className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                  ETB {Number(m.salary).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-slate-400">Joined</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {m.hireDate || m.createdAt
                  ? new Date(m.hireDate || m.createdAt).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              title="View Details"
              onClick={() => navigate(`/users/staff/${member._id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              title="Edit"
              onClick={() => {
                setSelectedMember(member);
                setPanelMode('edit');
                setPanelOpen(true);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Switch
              checked={member.isActive}
              disabled={isToggling(member._id)}
              onCheckedChange={() => handleToggleActive(member._id, member.isActive)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Staff Management"
        subtitle={currentBranchId ? 'Manage branch personnel and floor staff assignments' : 'Manage organization team members, roles, and system logins'}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Standard DataCards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Personnel"
            value={isLoading ? '...' : staff.length}
            icon={<Users className="h-5 w-5" />}
            theme="primary"
            subtitle="Registered employees and managers"
            isLoading={isLoading}
          />

          <DataCard
            title="Active & On Duty"
            value={isLoading ? '...' : activeCount}
            icon={<UserCheck className="h-5 w-5" />}
            theme="emerald"
            subtitle="Granted active system authentication"
            isLoading={isLoading}
          />

          <DataCard
            title="On Leave"
            value={isLoading ? '...' : onLeaveCount}
            icon={<Clock className="h-5 w-5" />}
            theme="amber"
            subtitle="Currently away from duty"
            isLoading={isLoading}
          />

          <DataCard
            title="Monthly Payroll (Est.)"
            value={
              isLoading
                ? '...'
                : `ETB ${totalPayroll.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
            }
            icon={<DollarSign className="h-5 w-5" />}
            theme="slate"
            subtitle="Active staff salaries"
            isLoading={isLoading}
          />
        </div>

        {/* Advanced DataViewSystem */}
        <DataViewSystem<StaffUser>
          data={staff}
          rowKey="_id"
          entityName="staff members"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={6}
          emptyIcon={<Users className="h-8 w-8 text-slate-400" />}
          emptyTitle="No staff members found"
          emptyDescription={
            'No staff profiles match your search criteria. Add your first restaurant team member to grant access.'
          }
          emptyActionLabel="Invite Member"
          onEmptyAction={() => {
            setSelectedMember(null);
            setPanelMode('add');
            setPanelOpen(true);
          }}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search staff by name, email, phone, or role..."
          searchFields={['firstName', 'lastName', 'email', 'phone', 'role.name']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="firstName"
          defaultSortDirection="asc"
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="isActive"
          presetStorageKey="staff_management_presets"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          renderCustomCard={renderStaffCard}
          renderCustomListItem={renderStaffListItem}
          exportFileName="staff_directory_export"
          onItemClick={(member) => navigate(`/users/staff/${member._id}`)}
          primaryAction={{
            label: 'Invite Member',
            icon: <Plus className="h-4 w-4 stroke-[2.5]" />,
            onClick: () => {
              setSelectedMember(null);
              setPanelMode('add');
              setPanelOpen(true);
            },
          }}
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Slide-over Modal */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={setPanelOpen}
        title={
          panelMode === 'add' ? 'Invite New Member' : 'Update Member Details'
        }
      >
        <div className="px-1 pt-4">
          <StaffForm
            roles={roles}
            initialData={selectedMember}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onSubmit={async (values: any) => {
              if (panelMode === 'edit')
                await updateMutation.mutateAsync({
                  id: selectedMember._id,
                  ...values,
                });
              else await createMutation.mutateAsync(values);
              setPanelOpen(false);
            }}
            onCancel={() => setPanelOpen(false)}
          />
        </div>
      </RightSideModal>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will revoke all access for this user immediately. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagementPage;
