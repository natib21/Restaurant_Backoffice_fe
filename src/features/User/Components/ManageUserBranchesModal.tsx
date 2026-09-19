// src/features/User/Components/ManageUserBranchesModal.tsx

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useBranchesQuery,
  useUserBranchesQuery,
  useAssignUserBranchesMutation,
  useRemoveUserBranchMutation,
  type AssignedBranch,
} from '@/api/Queries/branchQueries';
import { toast } from 'sonner';

interface ManageUserBranchesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: string;
    id?: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    role?: any;
    branch?: any;
  } | null;
}

export const ManageUserBranchesModal: React.FC<ManageUserBranchesModalProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const userId = user?._id || user?.id || '';

  // Queries
  const { data: userBranchData, isLoading: isUserBranchesLoading } = useUserBranchesQuery(
    open && userId ? userId : undefined
  );
  const { data: allMerchantBranches = [], isLoading: isAllBranchesLoading } = useBranchesQuery();

  // Mutations
  const assignMutation = useAssignUserBranchesMutation();
  const removeMutation = useRemoveUserBranchMutation();

  // Local state
  const [selectedBranchIdToAdd, setSelectedBranchIdToAdd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'manage' | 'transfer'>('manage');
  const [transferTargetBranchId, setTransferTargetBranchId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Extract branches assigned to this user
  const assignedBranches: AssignedBranch[] = useMemo(() => {
    if (userBranchData?.branches && Array.isArray(userBranchData.branches)) {
      return userBranchData.branches;
    }
    // Fallback from user prop if query is loading/empty
    if (user?.branch) {
      if (Array.isArray(user.branch)) return user.branch;
      if (typeof user.branch === 'object' && user.branch._id) return [user.branch];
    }
    return [];
  }, [userBranchData, user]);

  const assignedBranchIds = useMemo(() => {
    return new Set(assignedBranches.map((b) => b._id || b.id));
  }, [assignedBranches]);

  // Branches that are available to add (not yet assigned)
  const unassignedBranches = useMemo(() => {
    return allMerchantBranches.filter(
      (b) => !assignedBranchIds.has(b._id) && !assignedBranchIds.has((b as any).id)
    );
  }, [allMerchantBranches, assignedBranchIds]);

  const roleName = user?.role
    ? typeof user.role === 'string'
      ? user.role
      : user.role.name || 'Team Member'
    : 'Team Member';

  // Add single branch
  const handleAddBranch = async () => {
    if (!selectedBranchIdToAdd || !userId) return;

    try {
      await assignMutation.mutateAsync({
        userId,
        branchId: selectedBranchIdToAdd,
      });
      setSelectedBranchIdToAdd('');
    } catch {
      // Handled in mutation onError
    }
  };

  // Remove branch
  const handleRemoveBranch = async (branchId: string, branchName: string) => {
    if (!userId) return;

    // Validation rule: minimum 1 branch required
    if (assignedBranches.length <= 1) {
      toast.error('Cannot remove branch. Staff must remain assigned to at least one branch.');
      return;
    }

    try {
      await removeMutation.mutateAsync({
        userId,
        branchId,
      });
    } catch {
      // Handled in mutation onError
    }
  };

  // Transfer user: Add new branch, then remove previous branch(es)
  const handleTransfer = async () => {
    if (!transferTargetBranchId || !userId) return;

    setIsTransferring(true);
    try {
      // 1. Assign target branch first
      await assignMutation.mutateAsync({
        userId,
        branchId: transferTargetBranchId,
      });

      // 2. Remove previous branches
      for (const oldBranch of assignedBranches) {
        const oldId = oldBranch._id || oldBranch.id;
        if (oldId && oldId !== transferTargetBranchId) {
          try {
            await removeMutation.mutateAsync({
              userId,
              branchId: oldId,
            });
          } catch (err) {
            console.error('Failed removing previous branch during transfer:', err);
          }
        }
      }

      toast.success(
        `Transferred ${user?.firstName} to new branch successfully.`
      );
      setTransferTargetBranchId('');
      setActiveTab('manage');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!user) return null;

  const isPending =
    assignMutation.isPending ||
    removeMutation.isPending ||
    isTransferring;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="manage-user-branches-modal"
        className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl bg-card border-border shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{user.firstName} {user.lastName || ''}</span>
                  <Badge variant="outline" className="text-[11px] font-medium bg-background/80">
                    <ShieldCheck className="h-3 w-3 mr-1 text-primary" />
                    {roleName}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{user.email || user.phone || 'Staff User'}</span>
                  <span>•</span>
                  <span>
                    {assignedBranches.length}{' '}
                    {assignedBranches.length === 1 ? 'branch assigned' : 'branches assigned'}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Quick Mode Toggle */}
            <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/50 text-xs">
              <button
                type="button"
                id="btn-tab-manage-branches"
                onClick={() => setActiveTab('manage')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'manage'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Assignments
              </button>
              <button
                type="button"
                id="btn-tab-transfer-branches"
                onClick={() => setActiveTab('transfer')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'transfer'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowRightLeft className="h-3 w-3" />
                Transfer
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'manage' ? (
            <>
              {/* Section 1: Assigned Branches List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Current Branch Access ({assignedBranches.length})
                  </h4>
                  {assignedBranches.length === 1 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Must keep at least 1 branch
                    </span>
                  )}
                </div>

                {isUserBranchesLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs">Loading branch assignments...</span>
                  </div>
                ) : assignedBranches.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No branches assigned yet. Assign a branch below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {assignedBranches.map((branch) => {
                      const branchId = branch._id || branch.id || '';
                      const isOnlyBranch = assignedBranches.length <= 1;

                      return (
                        <div
                          key={branchId}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {branch.name}
                                </span>
                                {branch.isMain && (
                                  <Badge className="text-[10px] bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
                                    Main Branch
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {branch.branchCode && (
                                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                    {branch.branchCode}
                                  </span>
                                )}
                                {branch.location?.city && (
                                  <span>{branch.location.city}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isOnlyBranch ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                title="Cannot remove user's last branch (minimum 1 required)"
                                className="h-8 px-2.5 text-xs text-muted-foreground/60 cursor-not-allowed"
                              >
                                <LockIcon className="h-3.5 w-3.5 mr-1" />
                                Locked
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleRemoveBranch(branchId, branch.name)}
                                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Add Branch */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Assign Additional Branch
                </h4>

                {unassignedBranches.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>This user already has access to all active merchant branches.</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Select
                      value={selectedBranchIdToAdd}
                      onValueChange={setSelectedBranchIdToAdd}
                      disabled={isPending || isAllBranchesLoading}
                    >
                      <SelectTrigger
                        id="select-add-branch-trigger"
                        className="flex-1 h-10 rounded-xl bg-background border-border text-xs"
                      >
                        <SelectValue placeholder="Select a branch to assign..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {unassignedBranches.map((b) => (
                          <SelectItem key={b._id} value={b._id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{b.name}</span>
                              {b.shortCode && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  ({b.shortCode})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      id="btn-assign-branch-submit"
                      onClick={handleAddBranch}
                      disabled={!selectedBranchIdToAdd || isPending}
                      className="h-10 px-5 rounded-xl text-xs font-semibold shrink-0"
                    >
                      {assignMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Assign Branch
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Transfer Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                  Branch Transfer Workflow
                </p>
                <p>
                  Transferring will assign the selected target branch to {user.firstName} and
                  automatically remove their current branch assignments.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Target Destination Branch
                </label>
                <Select
                  value={transferTargetBranchId}
                  onValueChange={setTransferTargetBranchId}
                  disabled={isPending || isAllBranchesLoading}
                >
                  <SelectTrigger
                    id="select-transfer-branch-trigger"
                    className="h-10 rounded-xl bg-background border-border text-xs"
                  >
                    <SelectValue placeholder="Choose new branch location..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allMerchantBranches.map((b) => (
                      <SelectItem key={b._id} value={b._id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{b.name}</span>
                          {assignedBranchIds.has(b._id) && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              Current
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  id="btn-confirm-transfer"
                  onClick={handleTransfer}
                  disabled={!transferTargetBranchId || isPending}
                  className="h-10 px-6 rounded-xl text-xs font-semibold"
                >
                  {isTransferring ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Execute Transfer
                </Button>
              </div>
            </div>
          )}

          {/* Security & System Info Footer Note */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Isolation & Security: </span>
              All operations are scoped to your merchant account. When branch assignments update,
              session caches sync automatically.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default ManageUserBranchesModal;
