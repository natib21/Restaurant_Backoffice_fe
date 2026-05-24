import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  ShieldCheck,
  Settings2,
  Eye,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; // Import Switch component
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

type ModalMode = 'create' | 'detail' | 'edit';

const RolesPermissionsPage = () => {
  const navigate = useNavigate();

  const { data: roles = [], isLoading: rolesLoading } = useMerchantRolesQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useMerchantTasksQuery();

  const deactivateMutation = useDeactivateMerchantRoleMutation();
  const activateMutation = useActivateMerchantRoleMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // --- Toggle Logic ---
  const handleToggleActive = async (role: any) => {
    const isActivating = !role.isActive;
    try {
      if (isActivating) {
        await activateMutation.mutateAsync(role._id);
        toast.success(`${role.name} activated`);
      } else {
        await deactivateMutation.mutateAsync(role._id);
        toast.success(`${role.name} deactivated`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
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

  if (rolesLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
            Syncing Roles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 items-center px-4 md:px-8 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight">
              Roles & Permissions
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Access Control Center
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="font-bold shadow-lg">
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </Button>
        </div>
      </header>

      <main className="mx-auto px-4 py-8 md:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role: any) => (
            <Card
              key={role._id}
              className={`group overflow-hidden border shadow-sm hover:shadow-md transition-all cursor-pointer ${!role.isActive && 'opacity-70 saturate-50'}`}
              onClick={() => handleOpenDetail(role)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-xl p-2.5 transition-colors ${role.isActive ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'}`}
                    >
                      {role.isSystemRole ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <ShieldCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold">
                          {role.name}
                        </CardTitle>
                        {role.isSystemRole && (
                          <Badge className="text-[8px] h-4 uppercase">
                            System
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs line-clamp-1">
                        {role.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* TOGGLE SWITCH INSTEAD OF DROPDOWN ITEM */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2"
                  >
                    <Switch
                      checked={role.isActive}
                      onCheckedChange={() => handleToggleActive(role)}
                      disabled={
                        activateMutation.isPending ||
                        deactivateMutation.isPending
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenDetail(role)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(role)}>
                          <Settings2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {role.tasks?.slice(0, 3).map((t: any) => (
                    <Badge
                      key={t._id}
                      variant="secondary"
                      className="text-[9px] bg-muted/50 font-medium"
                    >
                      {t.name}
                    </Badge>
                  ))}
                  {role.tasks?.length > 3 && (
                    <Badge variant="outline" className="text-[9px] font-bold">
                      +{role.tasks.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="bg-muted/10 py-2.5 flex justify-between items-center border-t">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {role.tasks?.length || 0} Capabilities
                </span>
                <Badge
                  variant={role.isActive ? 'default' : 'secondary'}
                  className={`text-[9px] h-4 uppercase ${role.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''}`}
                >
                  {role.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <RightSideModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          modalMode === 'create'
            ? 'Create New Role'
            : modalMode === 'edit'
              ? `Edit ${selectedRole?.name}`
              : `${selectedRole?.name} Details`
        }
        description={
          modalMode === 'create'
            ? 'Define identity and permissions.'
            : modalMode === 'edit'
              ? 'Update permissions.'
              : 'Role overview.'
        }
      >
        {modalMode === 'create' && (
          <RoleForm
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
