import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Edit3,
  Info,
  Calendar,
  Layers,
  Users,
  Power,
  Utensils,
  ShoppingBag,
  Bike,
  BookOpen,
  Plus,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  useBranchQuery,
  useSuspendBranchMutation,
  useActivateBranchMutation,
  useUpdateBranchFeaturesMutation,
  useAssignMenuGroupToBranchMutation,
  useBranchStaffQuery,
} from '../../../api/Queries/branchQueries';
import { useMenuGroupsQuery, usePublishMenuGroupMutation } from '../../../api/Queries/menuQueries';

interface BranchDetailPageProps {
  branchId: string;
  onEdit: () => void;
}

const BranchDetailPage: React.FC<BranchDetailPageProps> = ({
  branchId,
  onEdit,
}) => {
  const { data: branch, isLoading, refetch } = useBranchQuery(branchId);
  const { data: staff = [], isLoading: isLoadingStaff } = useBranchStaffQuery(branchId);
  const { data: menuGroups = [] } = useMenuGroupsQuery();

  const suspendMutation = useSuspendBranchMutation();
  const activateMutation = useActivateBranchMutation();
  const updateFeaturesMutation = useUpdateBranchFeaturesMutation();
  const assignMenuGroupMutation = useAssignMenuGroupToBranchMutation();
  const publishMenuGroupMutation = usePublishMenuGroupMutation();

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedMenuGroupId, setSelectedMenuGroupId] = useState('');

  if (isLoading) {
    return <BranchDetailSkeleton />;
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Info className="h-10 w-10 mb-2 opacity-20" />
        <p>Branch information not found</p>
      </div>
    );
  }

  const features = branch.settings?.features || {
    dineIn: true,
    takeaway: true,
    delivery: false,
  };

  const handleToggleFeature = async (featureKey: string, value: boolean) => {
    try {
      await updateFeaturesMutation.mutateAsync({
        id: branchId,
        features: {
          ...features,
          [featureKey]: value,
        },
      });
      refetch();
    } catch {
      // Handled in mutation
    }
  };

  const handleSuspendConfirm = async () => {
    try {
      await suspendMutation.mutateAsync({
        id: branchId,
        reason: suspendReason || undefined,
      });
      setIsSuspendModalOpen(false);
      setSuspendReason('');
      refetch();
    } catch {
      // Handled in mutation
    }
  };

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(branchId);
      refetch();
    } catch {
      // Handled in mutation
    }
  };

  const handleAssignMenuGroup = async () => {
    if (!selectedMenuGroupId) {
      toast.error('Please select a menu group to assign');
      return;
    }
    try {
      await assignMenuGroupMutation.mutateAsync({
        branchId,
        menuGroupId: selectedMenuGroupId,
      });
      setSelectedMenuGroupId('');
      refetch();
    } catch {
      // Handled in mutation
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 space-y-6">
      {/* 1. VISUAL HEADER */}
      <div className="relative h-36 bg-gradient-to-br from-primary/15 via-primary/5 to-background rounded-2xl p-4 overflow-hidden border border-primary/10 flex flex-col justify-between">
        <div className="absolute right-4 top-4 opacity-10">
          <Building2 className="h-24 w-24 text-primary" />
        </div>
        
        <div className="flex items-start justify-between z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">
                {branch.name}
              </h2>
              {branch.isMain && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-[10px] font-black uppercase shadow-sm">
                  Main HQ
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {branch.isActive ? (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Suspended / Offline
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onEdit}
              size="sm"
              variant="secondary"
              className="rounded-full shadow-sm bg-background/90 backdrop-blur-sm border hover:bg-background h-8"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>

            {branch.isActive ? (
              <Button
                onClick={() => setIsSuspendModalOpen(true)}
                size="sm"
                variant="destructive"
                className="rounded-full shadow-sm h-8 gap-1.5 text-xs font-semibold"
                disabled={suspendMutation.isPending}
              >
                <PauseCircle className="h-3.5 w-3.5" />
                Suspend
              </Button>
            ) : (
              <Button
                onClick={handleActivate}
                size="sm"
                className="rounded-full shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1.5 text-xs font-semibold"
                disabled={activateMutation.isPending}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Activate
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground z-10">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {branch.location.city} {branch.location.subCity ? `• ${branch.location.subCity}` : ''}
          </span>
          {branch.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-primary" />
              {branch.phone}
            </span>
          )}
        </div>
      </div>

      {/* 2. ORDERING FEATURES TOGGLE */}
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />
            Service Capabilities
          </h4>
          <span className="text-[11px] text-muted-foreground">Real-time sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40">
            <div className="space-y-0.5">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-indigo-500" /> Dine-In
              </span>
              <p className="text-[10px] text-muted-foreground">QR Table Orders</p>
            </div>
            <Switch
              checked={features.dineIn ?? true}
              onCheckedChange={(val) => handleToggleFeature('dineIn', val)}
              disabled={updateFeaturesMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40">
            <div className="space-y-0.5">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-500" /> Takeaway
              </span>
              <p className="text-[10px] text-muted-foreground">Self Pickup</p>
            </div>
            <Switch
              checked={features.takeaway ?? true}
              onCheckedChange={(val) => handleToggleFeature('takeaway', val)}
              disabled={updateFeaturesMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40">
            <div className="space-y-0.5">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Bike className="h-3.5 w-3.5 text-emerald-500" /> Delivery
              </span>
              <p className="text-[10px] text-muted-foreground">Direct Dispatch</p>
            </div>
            <Switch
              checked={features.delivery ?? false}
              onCheckedChange={(val) => handleToggleFeature('delivery', val)}
              disabled={updateFeaturesMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* 3. MENU GROUP ASSIGNMENT */}
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-4 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Branch Menu Groups & Publishing
        </h4>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedMenuGroupId} onValueChange={setSelectedMenuGroupId}>
            <SelectTrigger className="flex-1 h-9 text-xs">
              <SelectValue placeholder="Select a menu group to assign..." />
            </SelectTrigger>
            <SelectContent>
              {menuGroups.map((mg: any) => (
                <SelectItem key={mg._id} value={mg._id}>
                  {mg.name} ({mg.items?.length || 0} items)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold"
            onClick={handleAssignMenuGroup}
            disabled={assignMenuGroupMutation.isPending || !selectedMenuGroupId}
          >
            <Plus className="h-3.5 w-3.5" />
            Assign Group
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold border-primary/30 text-primary"
            onClick={async () => {
              if (!selectedMenuGroupId) {
                toast.error('Select a menu group first');
                return;
              }
              await publishMenuGroupMutation.mutateAsync({
                branchId,
                menuGroupId: selectedMenuGroupId,
              });
            }}
            disabled={publishMenuGroupMutation.isPending || !selectedMenuGroupId}
          >
            Publish Menu
          </Button>
        </div>
      </div>

      {/* 4. BRANCH STAFF LIST */}
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Assigned Branch Staff ({staff.length})
          </h4>
        </div>

        {isLoadingStaff ? (
          <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
            Loading branch staff...
          </div>
        ) : staff.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-muted-foreground">
            No dedicated staff assigned directly to this branch yet.
          </div>
        ) : (
          <div className="divide-y border rounded-xl overflow-hidden">
            {staff.map((member: any) => (
              <div key={member._id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {member.fullName || member.username}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{member.phone || member.email}</p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                  {typeof member.role === 'object' ? member.role?.name : member.role || 'Staff'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. LOCATION & CONTACT METADATA */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Formatted Address</h5>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {branch.location.formattedAddress || `${branch.location.building || ''} ${branch.location.specificArea || ''}, ${branch.location.city}`}
          </p>
        </div>

        <div className="text-center pt-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <Calendar className="h-3 w-3" />
            Registered on {new Date(branch.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* SUSPEND REASON DIALOG */}
      <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <PauseCircle className="h-5 w-5" />
              Suspend Branch Operations
            </DialogTitle>
            <DialogDescription>
              Temporarily take {branch.name} offline. Customers will not be able to place new orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Suspension Reason (Optional)
            </label>
            <Input
              placeholder="e.g. Renovation, Scheduled maintenance, Staff training"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendConfirm}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Polished Loading State
const BranchDetailSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-32 w-full rounded-2xl" />
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
    <div className="space-y-4 pt-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Separator />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

export default BranchDetailPage;

