// src/features/Staff/Pages/StaffManagementPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Search,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '../../../api/Queries/merchantQueries';

import StaffForm from '../Components/StaffInviteForm';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';

const StaffManagementPage = () => {
  const navigate = useNavigate();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // ────────────────────────────────────────────────
  // Data Fetching
  // ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // State
  // ────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>('add');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Track which specific ID is being toggled for the "Pending" state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    return staff.filter((member: any) => {
      const fullText =
        `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase();
      if (searchQuery && !fullText.includes(searchQuery.toLowerCase()))
        return false;
      if (filterRole !== 'all' && member.role?.name !== filterRole)
        return false;
      return true;
    });
  }, [staff, searchQuery, filterRole]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setProcessingId(id);
    try {
      if (currentActive) {
        await deactivateMut.mutateAsync(id);
      } else {
        await activateMut.mutateAsync(id);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const isToggling = (id: string) => processingId === id;

  if (isLoading)
    return (
      <div className="p-8 animate-pulse bg-muted/20 h-96 rounded-lg m-6" />
    );

  return (
    <div className="bg-[#fcfcfd] min-h-screen pb-20">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Staff Management
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              {currentBranchId ? 'Branch Personnel' : 'All Organization Staff'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setPanelMode('add');
            setPanelOpen(true);
          }}
          className="shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />{' '}
          <span className="hidden sm:inline">Add Member</span>
        </Button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email..."
              className="pl-10 bg-white border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-[180px] bg-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r: any) => (
                <SelectItem key={r._id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* List Content */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* MOBILE VIEW (Cards) */}
          <div className="block md:hidden divide-y divide-slate-100 ">
            {filteredStaff.map((member: any) => (
              <div key={member._id} className="p-4 space-y-4 mb-4 border-b-2 ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {member.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 uppercase tracking-wider"
                      >
                        {member.role?.name || 'Staff'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/users/staff/${member._id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMember(member);
                          setPanelMode('edit');
                          setPanelOpen(true);
                        }}
                      >
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3" /> {member.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {member.phone}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isToggling(member._id)
                          ? 'bg-amber-400 animate-pulse'
                          : member.isActive
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                      )}
                    />
                    <span className="text-xs font-medium">
                      {isToggling(member._id)
                        ? 'Processing...'
                        : member.isActive
                          ? 'Active'
                          : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isToggling(member._id) && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      checked={member.isActive}
                      disabled={isToggling(member._id)}
                      onCheckedChange={() =>
                        handleToggleActive(member._id, member.isActive)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (Table) */}
          <Table className="hidden md:table">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[300px]">Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-40 text-center text-muted-foreground"
                  >
                    No personnel records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member: any) => (
                  <TableRow
                    key={member._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs font-bold">
                            {member.firstName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-900">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-medium bg-white shadow-sm border-slate-200"
                      >
                        {member.role?.name || 'Staff'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />{' '}
                          {member.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative flex items-center">
                          <Switch
                            checked={member.isActive}
                            disabled={isToggling(member._id)}
                            onCheckedChange={() =>
                              handleToggleActive(member._id, member.isActive)
                            }
                            className={cn(
                              isToggling(member._id) && 'opacity-50'
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-[80px]">
                          <div
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isToggling(member._id)
                                ? 'bg-amber-500 animate-bounce'
                                : member.isActive
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-slate-300'
                            )}
                          />
                          <span
                            className={cn(
                              'text-[11px] font-bold uppercase tracking-wider',
                              isToggling(member._id)
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            )}
                          >
                            {isToggling(member._id)
                              ? 'Pending'
                              : member.isActive
                                ? 'Active'
                                : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-slate-200/50 rounded-full"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/users/staff/${member._id}`)
                            }
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-slate-500" /> View
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member);
                              setPanelMode('edit');
                              setPanelOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Edit3 className="mr-2 h-4 w-4 text-slate-500" />{' '}
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/5 cursor-pointer font-medium"
                            onClick={() => {
                              setMemberToDelete(member._id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

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
            onSubmit={async (values) => {
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all access for this user immediately. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
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
