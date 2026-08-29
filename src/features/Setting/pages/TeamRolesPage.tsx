import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Briefcase,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useMerchantStaffQuery,
  useMerchantRolesQuery,
  useCreateStaffMemberMutation,
  useDeactivateStaffMemberMutation,
  type StaffUser,
  type MerchantRole,
} from '@/api/Queries/merchantQueries';
import { useMerchantTasksQuery } from '@/api/Queries/taskQuery';

export const TeamRolesPage: React.FC = () => {
  const { data: staffList = [], isLoading: isStaffLoading, refetch: refetchStaff } = useMerchantStaffQuery();
  const { data: rolesList = [], isLoading: isRolesLoading, refetch: refetchRoles } = useMerchantRolesQuery();
  const { data: tasksList = [], isLoading: isTasksLoading } = useMerchantTasksQuery();

  const { mutateAsync: createStaff, isPending: isCreatingStaff } = useCreateStaffMemberMutation();
  const { mutateAsync: deactivateStaff, isPending: isDeactivatingStaff } = useDeactivateStaffMemberMutation();

  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string>('');

  // Invite staff modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const handleSendInvite = async () => {
    if (!firstName.trim() || !phone.trim()) {
      toast.error('First name and phone number are required');
      return;
    }
    try {
      await createStaff({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim(),
        role: selectedRoleId || undefined,
      });
      setIsInviteOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSelectedRoleId('');
      refetchStaff();
    } catch (err) {
      // Error handled by mutation toast
    }
  };

  const handleDeactivate = async (user: StaffUser) => {
    if (confirm(`Are you sure you want to deactivate staff member "${user.firstName}"?`)) {
      try {
        await deactivateStaff(user._id);
        refetchStaff();
      } catch (err) {
        // Handled by mutation toast
      }
    }
  };

  const filteredMembers = staffList.filter((m) => {
    const roleName = typeof m.role === 'object' && m.role ? m.role.name : String(m.role || '');
    const matchesRole = roleFilter === 'All' || roleName.toLowerCase() === roleFilter.toLowerCase();
    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.phone && m.phone.includes(searchQuery));
    return matchesRole && matchesSearch;
  });

  const activeCount = staffList.filter((s) => s.isActive !== false).length;

  return (
    <SettingPageLayout
      title="Team & Roles"
      subtitle="Manage staff accounts, assign roles, and configure system permissions."
      breadcrumbs={[{ label: 'Team & Roles' }]}
      actions={
        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          <UserPlus className="h-4 w-4" />
          Add Staff Member
        </button>
      }
    >
      {/* Stat Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Staff
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {staffList.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Staff
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeCount}
            </span>
            <span className="text-xs text-slate-400">of {staffList.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Configured Roles
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {rolesList.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">roles defined</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Permission Tasks
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {tasksList.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">available</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Roster (col-span-2) + Role Permissions (col-span-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Staff Roster */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              Staff Roster ({filteredMembers.length})
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-2.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none w-36 sm:w-44 focus:border-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs px-2 outline-none font-medium"
              >
                <option value="All">All Roles</option>
                {rolesList.map((r) => (
                  <option key={r._id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {isStaffLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs">Loading staff roster...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No staff members found
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Add staff members to grant them access to the POS terminal, kitchen display, and administrative views.
                </p>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E293B] text-white rounded text-xs font-semibold hover:bg-[#091426] transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add First Staff Member
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-[#E2E8F0] dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {filteredMembers.map((member) => {
                    const roleName =
                      typeof member.role === 'object' && member.role
                        ? member.role.name
                        : member.role || 'Staff';
                    const initials = `${(member.firstName || 'S')[0]}${(member.lastName || '')[0] || ''}`;

                    return (
                      <tr
                        key={member._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors h-14"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {member.firstName} {member.lastName || ''}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {member.email || member.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Shield className="h-3 w-3 text-[#2170E4]" />
                            {roleName}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {member.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => handleDeactivate(member)}
                            className="text-xs text-rose-600 hover:underline font-medium"
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Roles & Permission Tasks */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#0058be]" />
              Merchant Roles
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Available roles and system task access
            </p>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {isRolesLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading roles...</span>
              </div>
            ) : rolesList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No roles defined in the system.
              </p>
            ) : (
              rolesList.map((role) => (
                <div
                  key={role._id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {role.name}
                    </span>
                    {role.isSystemRole && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-slate-500 mt-1">{role.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <Briefcase className="h-3 w-3" />
                    <span>{Array.isArray(role.tasks) ? role.tasks.length : 0} tasks assigned</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jenkins"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input
                type="tel"
                placeholder="+251 91 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="sarah@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Assigned Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-8 px-2 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              >
                <option value="">Select a role...</option>
                {rolesList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsInviteOpen(false)}
              className="px-3 py-1.5 border rounded text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvite}
              disabled={isCreatingStaff}
              className="px-4 py-1.5 bg-[#2170E4] hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5"
            >
              {isCreatingStaff && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Member
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingPageLayout>
  );
};

export default TeamRolesPage;
