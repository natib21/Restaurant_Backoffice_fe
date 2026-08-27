import React, { useState, useMemo } from 'react';
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
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getTaskDomain,
  getMethodStyle,
  PERMISSION_DOMAINS,
} from '../lib/rolePermissionUtils';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  const tasks = useMemo(() => {
    return Array.isArray(role?.tasks) ? role.tasks : [];
  }, [role]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      const name = String(task.name || '').toLowerCase();
      const endpoint = String(task.endpoint || '').toLowerCase();
      const method = String(task.method || 'GET').toUpperCase();
      const domain = getTaskDomain(task);

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!name.includes(q) && !endpoint.includes(q)) return false;
      }

      if (methodFilter !== 'all' && method !== methodFilter) return false;
      if (domainFilter !== 'all' && domain !== domainFilter) return false;

      return true;
    });
  }, [tasks, searchQuery, methodFilter, domainFilter]);

  if (!role) return null;

  const isFiltered = searchQuery !== '' || methodFilter !== 'all' || domainFilter !== 'all';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                  {role.isSystemRole && (
                    <Badge variant="secondary" className="text-[9px] font-bold uppercase ml-1">
                      System Built-in
                    </Badge>
                  )}
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
        <div className="space-y-2">
          <SectionHeader
            icon={<Info className="h-3.5 w-3.5" />}
            title="Description"
          />
          <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5 p-4">
            <p className="text-xs leading-relaxed text-foreground/70">
              {role.description ||
                'No specific guidelines provided for this role identity.'}
            </p>
          </div>
        </div>

        {/* Permissions List with Advanced Filter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={<Lock className="h-3.5 w-3.5" />}
              title="Authorized Capabilities"
            />
            <Badge
              variant="outline"
              className="rounded-full font-mono text-[10px] px-3 border-muted-foreground/30"
            >
              {filteredTasks.length} / {tasks.length} Capabilities
            </Badge>
          </div>

          {/* Quick Capability Search & Filters */}
          <div className="space-y-2.5 bg-muted/20 p-3 rounded-2xl border border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search role capabilities or endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 h-8 text-xs bg-background rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="h-7 text-[11px] flex-1 rounded-lg bg-background">
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Domains</SelectItem>
                  {PERMISSION_DOMAINS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="h-7 text-[11px] w-[110px] rounded-lg bg-background">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Methods</SelectItem>
                  <SelectItem value="GET" className="text-xs">GET (Read)</SelectItem>
                  <SelectItem value="POST" className="text-xs">POST (Create)</SelectItem>
                  <SelectItem value="PUT" className="text-xs">PUT (Modify)</SelectItem>
                  <SelectItem value="DELETE" className="text-xs">DELETE (Remove)</SelectItem>
                </SelectContent>
              </Select>

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setMethodFilter('all');
                    setDomainFilter('all');
                  }}
                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {filteredTasks.map((task: any) => {
              const methodStyle = getMethodStyle(task.method);
              return (
                <div
                  key={task._id}
                  className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl border bg-card/60 hover:bg-muted/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-background flex items-center justify-center border group-hover:border-primary/50 transition-colors">
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">{task.name}</p>
                      <p className="text-[9px] font-mono text-muted-foreground truncate opacity-60">
                        {task.endpoint || '/api/internal/v1/...'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase ${methodStyle.badgeClass}`}
                  >
                    {task.method || 'GET'}
                  </Badge>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-6 border border-dashed rounded-xl space-y-1">
                <p className="text-xs font-medium text-muted-foreground">No capabilities match filter criteria</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setMethodFilter('all');
                    setDomainFilter('all');
                  }}
                  className="text-[11px] h-6"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-2 space-y-2 opacity-60">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tighter">
            <Calendar className="h-3 w-3" />
            Record Created:{' '}
            {role.createdAt
              ? new Date(role.createdAt).toLocaleDateString(undefined, {
                  dateStyle: 'long',
                })
              : 'Standard Profile'}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tighter">
            <Fingerprint className="h-3 w-3" />
            Object ID: <span className="font-mono">{role._id}</span>
          </div>
        </div>
      </div>

      {/* Action Footer - Fixed at bottom */}
      <div className="p-4 bg-muted/20 backdrop-blur-sm border-t flex gap-3">
        <Button
          variant="ghost"
          className="flex-1 font-bold text-xs uppercase tracking-widest text-muted-foreground"
          onClick={onClose}
        >
          Dismiss
        </Button>
        <Button
          className="flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
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
