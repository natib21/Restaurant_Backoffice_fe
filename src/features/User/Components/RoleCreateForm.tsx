import React, { useEffect, useState, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import z from 'zod';
import {
  ShieldCheck,
  Search,
  Check,
  Layers,
  Wand2,
  Trash2,
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import {
  useCreateMerchantRoleMutation,
  useUpdateMerchantRoleMutation,
} from '../../../api/Queries/merchantQueries';
import { useTranslation } from '@/locales/i18n';
import {
  getTaskDomain,
  getMethodStyle,
  PERMISSION_DOMAINS,
} from '../lib/rolePermissionUtils';

type RoleFormValues = {
  name: string;
  description: string;
  tasks: string[];
};

interface RoleFormProps {
  role?: any;
  tasks: { _id: string; name: string; endpoint?: string; method?: string; description?: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const schema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .regex(/^[A-Z0-9_]+$/, 'Use uppercase, numbers, and underscores only'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  tasks: z.array(z.string()).min(1, 'Select at least one permission'),
});

// Professional Templates for Quick Selection
const TEMPLATES = [
  {
    label: 'Waiter',
    icon: '🍽️',
    keys: ['order', 'menu', 'table', 'active assignments'],
  },
  { label: 'Kitchen', icon: '👨‍🍳', keys: ['order', 'menu', 'combo'] },
  {
    label: 'Manager',
    icon: '💼',
    keys: ['merchants/users', 'merchants/roles', 'branch', 'stats', 'report'],
  },
];

const RoleForm: React.FC<RoleFormProps> = ({
  role,
  tasks,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('team');
  const { t: tCommon } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const isEditMode = !!role;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      tasks: [],
    },
  });

  /* 1. Logic: Group Tasks by Business Domain */
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof tasks> = {};

    PERMISSION_DOMAINS.forEach((domain) => {
      groups[domain] = [];
    });

    tasks.forEach((task) => {
      const domain = getTaskDomain(task);
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(task);
    });

    return Object.fromEntries(
      Object.entries(groups).filter(([_, v]) => v.length > 0)
    );
  }, [tasks]);

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || '',
        tasks:
          role.tasks?.map((t: any) => (typeof t === 'string' ? t : t._id)) ||
          [],
      });
    }
  }, [role, form]);

  const createMutation = useCreateMerchantRoleMutation();
  const updateMutation = useUpdateMerchantRoleMutation();

  /* 2. Logic: Bulk Selection Helpers */
  const applyTemplate = (keys: string[]) => {
    const matchedIds = tasks
      .filter((t) =>
        keys.some(
          (k) => t.endpoint?.includes(k) || t.name.toLowerCase().includes(k)
        )
      )
      .map((t) => t._id);
    form.setValue('tasks', matchedIds, { shouldValidate: true });
    toast.success('Template permissions applied');
  };

  const toggleGroup = (groupIds: string[], isAllInGroupSelected: boolean) => {
    const current = form.getValues('tasks');
    if (isAllInGroupSelected) {
      form.setValue(
        'tasks',
        current.filter((id) => !groupIds.includes(id))
      );
    } else {
      form.setValue('tasks', Array.from(new Set([...current, ...groupIds])));
    }
  };

  const onSubmit: SubmitHandler<RoleFormValues> = async (values) => {
    try {
      const payload = { ...values, name: values.name.trim().toUpperCase() };
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: role._id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      toast.success(`Role ${isEditMode ? 'updated' : 'created'} successfully`);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed');
    }
  };

  const selectedTasks = form.watch('tasks');
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full bg-background"
      >
        <div className="flex-1 px-8  space-y-10 overflow-y-auto custom-scrollbar">
          {/* Section 1: Definition */}
          <section className="space-y-6">
            <Header
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Role Identity"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Unique Key
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={role?.isSystemRole}
                        className="font-mono uppercase h-11 bg-muted/30"
                        placeholder="MANAGER_LEVEL_1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 bg-muted/30"
                        placeholder="Describe role responsibilities..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Section 2: Templates (Quick Action) */}
          <section className="space-y-4">
            <Header
              icon={<Wand2 className="h-4 w-4" />}
              title="Quick Setup Templates"
            />
            <div className="flex flex-wrap gap-3">
              {TEMPLATES.map((t) => (
                <Button
                  key={t.label}
                  type="button"
                  variant="outline"
                  onClick={() => applyTemplate(t.keys)}
                  className="rounded-xl border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="mr-2">{t.icon}</span> {t.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.setValue('tasks', [])}
                className="text-destructive hover:text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Clear All
              </Button>
            </div>
          </section>

          {/* Section 3: Permission Grid */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
              <Header
                icon={<Layers className="h-4 w-4" />}
                title="Access Capabilities"
              />
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter permissions..."
                    className="pl-9 h-8 text-xs bg-muted/50 border-none shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Method Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Method:</span>
              {[
                { key: 'all', label: 'All' },
                { key: 'GET', label: 'GET (Read)' },
                { key: 'POST', label: 'POST (Create)' },
                { key: 'PUT', label: 'PUT / PATCH (Modify)' },
                { key: 'DELETE', label: 'DELETE (Remove)' },
              ].map((m) => {
                const isActive = methodFilter === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethodFilter(m.key)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-8">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
                const visibleTasks = groupTasks.filter((t) => {
                  const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (t.endpoint || '').toLowerCase().includes(searchTerm.toLowerCase());
                  if (!matchSearch) return false;

                  const method = (t.method || 'GET').toUpperCase();
                  if (methodFilter === 'GET' && method !== 'GET') return false;
                  if (methodFilter === 'POST' && method !== 'POST') return false;
                  if (methodFilter === 'PUT' && method !== 'PUT' && method !== 'PATCH') return false;
                  if (methodFilter === 'DELETE' && method !== 'DELETE') return false;

                  return true;
                });
                if (visibleTasks.length === 0) return null;

                const groupIds = visibleTasks.map((t) => t._id);
                const isAllSelected = groupIds.every((id) =>
                  selectedTasks.includes(id)
                );

                return (
                  <div key={groupName} className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-tighter text-foreground">
                          {groupName}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 h-4"
                        >
                          {visibleTasks.length}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5"
                        onClick={() => toggleGroup(groupIds, isAllSelected)}
                      >
                        {isAllSelected ? 'Deselect Group' : 'Select Group'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {visibleTasks.map((task) => {
                        const isChecked = selectedTasks.includes(task._id);
                        const methodStyle = getMethodStyle(task.method);
                        return (
                          <label
                            key={task._id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                : 'hover:bg-muted/50 border-transparent'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...selectedTasks, task._id]
                                  : selectedTasks.filter(
                                      (id) => id !== task._id
                                    );
                                form.setValue('tasks', next, {
                                  shouldValidate: true,
                                });
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-xs font-bold truncate ${isChecked ? 'text-primary' : 'text-foreground'}`}
                                >
                                  {task.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[8px] font-mono font-bold px-1 py-0 rounded ${methodStyle.badgeClass}`}
                                >
                                  {task.method || 'GET'}
                                </Badge>
                              </div>
                              {task.endpoint && (
                                <p className="text-[9px] font-mono opacity-50 truncate mt-0.5">
                                  {task.endpoint}
                                </p>
                              )}
                            </div>
                            {isChecked && (
                              <Check className="h-3 w-3 text-primary shrink-0" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="px-8 py-5 border-t bg-background flex justify-between items-center shadow-lg">
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              {t('taskPermissions')}
            </p>
            <p className="text-sm font-black text-primary">
              {selectedTasks.length} / {tasks.length}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={onCancel}
              className="font-bold text-xs uppercase"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="font-black px-10 rounded-full shadow-lg active:scale-95 transition-all"
            >
              {isPending
                ? t('savingRole')
                : isEditMode
                  ? tCommon('save')
                  : t('saveRole')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

const Header = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2">
    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
      {title}
    </h3>
  </div>
);

export default RoleForm;
