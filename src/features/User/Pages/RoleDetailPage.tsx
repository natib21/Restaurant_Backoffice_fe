import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Lock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Fingerprint,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RoleDetailViewProps {
  role: any;
  onEdit: () => void;
  onClose: () => void;
}

const RoleDetailView: React.FC<RoleDetailViewProps> = ({
  role,
  onEdit,
  onClose,
}) => {
  if (!role) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
        {/* Modern Status Header */}
        <div className="relative overflow-hidden rounded-3xl border bg-muted/30 p-6 transition-all">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                  role.isActive
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {role.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`h-2 w-2 rounded-full animate-pulse ${role.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {role.isActive ? 'Active System Role' : 'Deactivated'}
                  </span>
                </div>
              </div>
            </div>
            {role.isActive ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-20" />
            ) : (
              <AlertCircle className="h-6 w-6 text-slate-400 opacity-20" />
            )}
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Description Section */}
        <div className="space-y-4">
          <SectionHeader
            icon={<Info className="h-3.5 w-3.5" />}
            title="Description"
          />
          <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5 p-4">
            <p className="text-sm leading-relaxed text-foreground/70">
              {role.description ||
                'No specific guidelines provided for this role identity.'}
            </p>
          </div>
        </div>

        {/* Permissions List */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={<Lock className="h-3.5 w-3.5" />}
              title="Authorized Capabilities"
            />
            <Badge
              variant="outline"
              className="rounded-full font-mono text-[10px] px-3 border-muted-foreground/30"
            >
              {role.tasks?.length || 0} Methods
            </Badge>
          </div>

          <div className="grid gap-3">
            {role.tasks?.map((task: any) => (
              <div
                key={task._id}
                className="group flex items-center justify-between px-4 py-3 rounded-2xl border bg-card/50 hover:bg-muted/40 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border group-hover:border-primary/50 transition-colors">
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{task.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground truncate max-w-[180px] opacity-60">
                      {task.endpoint || '/api/internal/v1/...'}
                    </p>
                  </div>
                </div>
                <Badge className="text-[9px] font-bold h-5 bg-muted text-muted-foreground hover:bg-muted">
                  {task.method || 'GET'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-4 space-y-3 opacity-60">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tighter">
            <Calendar className="h-3 w-3" />
            Record Created:{' '}
            {new Date(role.createdAt).toLocaleDateString(undefined, {
              dateStyle: 'long',
            })}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tighter">
            <Fingerprint className="h-3 w-3" />
            Object ID: <span className="font-mono">{role._id}</span>
          </div>
        </div>
      </div>

      {/* Action Footer - Fixed at bottom */}
      <div className="p-6 bg-muted/20 backdrop-blur-sm border-t flex gap-4">
        <Button
          variant="ghost"
          className="flex-1 font-bold text-xs uppercase tracking-widest text-muted-foreground"
          onClick={onClose}
        >
          Dismiss
        </Button>
        <Button
          className="flex-1 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
          onClick={onEdit}
        >
          <Edit3 className="mr-2 h-3.5 w-3.5" /> Modify Access
        </Button>
      </div>
    </div>
  );
};

/* --- Helper Component --- */
const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-2 px-1">
    <div className="p-1.5 rounded-md bg-primary/10 text-primary">{icon}</div>
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
      {title}
    </h3>
  </div>
);

export default RoleDetailView;
