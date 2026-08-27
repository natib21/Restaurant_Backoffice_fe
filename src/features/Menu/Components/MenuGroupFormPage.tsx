// src/features/Menu/Components/MenuGroupFormPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronsUpDown,
  GripVertical,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Flame,
  Leaf,
  Beer,
  AlertCircle,
  Hash,
  X,
  Search,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import {
  useCreateMenuGroupMutation,
  useUpdateMenuGroupMutation,
  useMenuItemsQuery,
} from '@/api/Queries/menuQueries';
import { useActiveCategoriesQuery } from '@/api/Queries/categoryQueries';
import { useBranchesQuery } from '@/api/Queries/branchQueries';
import { getCategoryName, getCategoryIcon } from '../lib/categoryUtils';
import {
  getLocalizedName,
  getLocalizedDescription,
  extractLocalizedPair,
  getLocalizedText,
} from '../lib/localizationUtils';

// Days of week
const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// Zod Schema for robust form validation
const formSchema = z.object({
  name: z.object({
    en: z.string().min(2, 'Name must be at least 2 characters in English'),
    am: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      am: z.string().optional(),
    })
    .optional(),
  visibility: z.enum(['always', 'scheduled', 'hidden']),
  priority: z.number().int(),
  isAlcoholMenu: z.boolean(),
  branches: z.array(z.string()),
  activeDays: z.array(z.string()),
  blockedDays: z.array(z.string()),
  timeSlots: z.array(
    z.object({
      start: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
      end: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    })
  ),
  specialDates: z.array(
    z.object({
      date: z.string(),
      recurringYearly: z.boolean(),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface MenuGroupFormPageProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getItemImageSrc = (data: any) => {
  if (!data) return null;
  const path =
    data.imageUrl ||
    data.imageData?.url ||
    data.image ||
    (Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : null) ||
    data.imageFilename ||
    null;

  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

// Sortable Row Component for Drag and Drop
function SortableDishRow({
  id,
  item,
  index,
  onRemove,
}: {
  id: string;
  item: any;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const nameEn = getLocalizedName(item.name || item, 'en', 'Dish');
  const nameAm = getLocalizedName(item.name || item, 'am');
  const imageSrc = getItemImageSrc(item);
  const priceDisplay =
    item.variants && item.variants.length > 0
      ? `ETB ${Number(item.variants[0].price || 0).toFixed(2)}`
      : item.price
      ? `ETB ${Number(item.price).toFixed(2)}`
      : '—';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-2.5 sm:p-3 bg-card hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-xs',
        isDragging && 'shadow-lg ring-2 ring-primary/40 bg-muted z-20'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 shrink-0">
        {index + 1}
      </div>

      <div className="h-11 w-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
        {imageSrc ? (
          <img src={imageSrc} alt={nameEn} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed className="h-4 w-4 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-xs sm:text-sm text-foreground truncate">{nameEn}</p>
          {nameAm && nameAm !== nameEn && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
              ({nameAm})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
          <span className="capitalize font-medium">{item.type || 'food'}</span>
          <span>•</span>
          <span className="font-semibold text-primary">{priceDisplay}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors"
        title="Remove dish from group"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

const MenuGroupFormPage: React.FC<MenuGroupFormPageProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!initialData;
  const [langTab, setLangTab] = useState<'en' | 'am'>('en');

  const createMutation = useCreateMenuGroupMutation();
  const updateMutation = useUpdateMenuGroupMutation();
  const { data: allMenuItems = [], isLoading: itemsLoading } = useMenuItemsQuery();
  const { data: dbCategories = [] } = useActiveCategoriesQuery();
  const { data: branches = [] } = useBranchesQuery();

  // Normalize and parse initial selected items safely
  const [selectedItems, setSelectedItems] = useState<any[]>(() => {
    if (!initialData?.items) return [];
    return initialData.items.map((i: any) => {
      const menuData = typeof i.menu === 'object' ? i.menu : {};
      const menuId = menuData._id || i.menu || i._id;
      return {
        _id: menuId,
        name: i.customName || menuData.name || 'Dish',
        type: menuData.type || i.type || 'food',
        price: menuData.price || i.price,
        variants: menuData.variants || i.variants || [],
        imageUrl: menuData.imageUrl || menuData.image || i.imageUrl,
      };
    });
  });

  const [openItemPopover, setOpenItemPopover] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>(
    initialData?.timeSlots || []
  );
  const [specialDates, setSpecialDates] = useState<
    { date: string; recurringYearly: boolean }[]
  >(initialData?.specialDates || []);

  const namePair = extractLocalizedPair(initialData?.name);
  const descPair = extractLocalizedPair(initialData?.description);

  const initialBranches =
    initialData?.branches?.map((b: any) => (typeof b === 'object' ? b._id : b)) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: namePair,
      description: descPair,
      visibility: initialData?.visibility || 'always',
      priority: initialData?.priority !== undefined ? initialData.priority : 0,
      isAlcoholMenu: initialData?.isAlcoholMenu || false,
      branches: initialBranches,
      activeDays: initialData?.activeDays || [],
      blockedDays: initialData?.blockedDays || [],
      timeSlots: initialData?.timeSlots || [],
      specialDates: initialData?.specialDates || [],
    },
  });

  // Auto-populate all branches for new group if not set
  useEffect(() => {
    if (!isEdit && branches.length > 0 && form.getValues('branches').length === 0) {
      form.setValue(
        'branches',
        branches.map((b) => b._id)
      );
    }
  }, [branches, isEdit, form]);

  const visibility = form.watch('visibility');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedItems((items) => {
      const oldIndex = items.findIndex((i) => (i._id || i.id) === active.id);
      const newIndex = items.findIndex((i) => (i._id || i.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const addItem = (item: any) => {
    const itemId = item._id || item.id;
    if (selectedItems.some((i) => (i._id || i.id) === itemId)) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        _id: itemId,
        name: item.name,
        type: item.type,
        price: item.price,
        variants: item.variants || [],
        imageUrl: item.imageUrl || item.image,
      },
    ]);
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => (i._id || i.id) !== itemId));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const localizedName = {
        en: values.name.en.trim(),
        ...(values.name.am?.trim() ? { am: values.name.am.trim() } : {}),
      };

      const localizedDesc = {
        en: values.description?.en?.trim() || '',
        ...(values.description?.am?.trim() ? { am: values.description.am.trim() } : {}),
      };

      const resolvedBranches =
        values.branches && values.branches.length > 0
          ? values.branches
          : branches.map((b) => b._id);

      const payload = {
        ...values,
        name: localizedName,
        description: localizedDesc.en || localizedDesc.am ? localizedDesc : undefined,
        branches: resolvedBranches,
        timeSlots,
        specialDates,
        items: selectedItems.map((item, index) => ({
          menu: item._id || item.id,
          sortOrder: index + 1,
          overridePrice: undefined,
          customName: undefined,
          customDescription: undefined,
          isHidden: false,
        })),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialData._id || initialData.id,
          groupData: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success(isEdit ? 'Menu group updated successfully!' : 'Menu group created successfully!');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save menu group');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
        {/* Header Summary Banner */}
        <div className="p-4 rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-primary-foreground border border-white/10">
              <Layers className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {isEdit ? 'Edit Menu Group' : 'Create New Menu Group'}
              </h2>
              <p className="text-xs text-slate-300">
                Organize menu dishes into categories, timeframes, or special collections
              </p>
            </div>
          </div>

          <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs font-semibold px-2.5 py-1">
            {selectedItems.length} Dishes Included
          </Badge>
        </div>

        {/* 1. General Info Card with Bilingual Switcher */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  General Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Set the display name and description in English and Amharic
                </CardDescription>
              </div>

              {/* Language Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLangTab('en')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    langTab === 'en'
                      ? 'bg-white dark:bg-slate-900 shadow-xs text-foreground font-extrabold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setLangTab('am')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    langTab === 'am'
                      ? 'bg-white dark:bg-slate-900 shadow-xs text-foreground font-extrabold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  አማርኛ (AM)
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {langTab === 'en' ? (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Group Name (English) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Breakfast Specials, Chef's Table, Cocktail Bar"
                          className="rounded-xl h-10 text-xs sm:text-sm font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Description (English)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Brief description of this menu group..."
                          className="rounded-xl text-xs sm:text-sm resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name.am"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        የምግብ ቡድን ስም (አማርኛ)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ምሳሌ፦ የቁርስ ዝርዝር፣ የሼፍ ምርጥ ምግቦች"
                          className="rounded-xl h-10 text-xs sm:text-sm font-medium"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.am"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">መግለጫ (አማርኛ)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="የዚህ ምግብ ቡድን አጭር መግለጫ..."
                          className="rounded-xl text-xs sm:text-sm resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Visibility, Priority & Alcohol Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Visibility Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="always">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Always Visible</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                            <span>Scheduled (Time / Days)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hidden">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                            <span>Hidden / Inactive</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Display Priority <span className="text-muted-foreground font-normal">(higher = first)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded-xl h-10 text-xs"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAlcoholMenu"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-between rounded-xl border p-3 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                          <Beer className="h-3.5 w-3.5 text-amber-600" /> Alcohol Menu
                        </FormLabel>
                        <FormDescription className="text-[11px]">
                          Contains alcoholic drinks
                        </FormDescription>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Restaurant Branches Assignment */}
        {branches && branches.length > 0 && (
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Branch Availability
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose which locations will offer this menu group
                  </CardDescription>
                </div>

                <FormField
                  control={form.control}
                  name="branches"
                  render={({ field }) => {
                    const isAllSelected = field.value?.length === branches.length;
                    return (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 rounded-lg font-bold"
                        onClick={() => {
                          const allIds = branches.map((b) => b._id);
                          field.onChange(isAllSelected ? [] : allIds);
                        }}
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All Branches'}
                      </Button>
                    );
                  }}
                />
              </div>
            </CardHeader>

            <CardContent>
              <FormField
                control={form.control}
                name="branches"
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {branches.map((branch) => {
                      const isChecked = field.value?.includes(branch._id);
                      return (
                        <div
                          key={branch._id}
                          onClick={() => {
                            const current = field.value || [];
                            if (isChecked) {
                              field.onChange(current.filter((id) => id !== branch._id));
                            } else {
                              field.onChange([...current, branch._id]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                            isChecked
                              ? 'border-primary/60 bg-primary/5 text-foreground font-bold shadow-xs'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="truncate flex-1">{branch.name}</span>
                          {branch.isMain && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 font-bold ml-auto shrink-0"
                            >
                              Main Branch
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* 3. Scheduling Settings (Conditional on visibility === 'scheduled') */}
        {visibility === 'scheduled' && (
          <Card className="rounded-2xl border shadow-xs bg-slate-50/40 dark:bg-slate-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Scheduling & Operating Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Configure specific active days, operating time slots, and yearly holidays
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Active Days</Label>
                  <MultiSelect
                    options={daysOfWeek.map((d) => ({
                      value: d,
                      label: d.charAt(0).toUpperCase() + d.slice(1),
                    }))}
                    selected={form.watch('activeDays')}
                    onChange={(vals) => form.setValue('activeDays', vals)}
                    placeholder="All days of the week"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Blocked Days</Label>
                  <MultiSelect
                    options={daysOfWeek.map((d) => ({
                      value: d,
                      label: d.charAt(0).toUpperCase() + d.slice(1),
                    }))}
                    selected={form.watch('blockedDays')}
                    onChange={(vals) => form.setValue('blockedDays', vals)}
                    placeholder="None (No blackout days)"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Active Time Slots
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg font-bold"
                    onClick={() =>
                      setTimeSlots([...timeSlots, { start: '08:00', end: '11:30' }])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Time Window
                  </Button>
                </div>

                {timeSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    No time slots configured. Menu group will be available all operating hours.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {timeSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 bg-card rounded-xl border"
                      >
                        <Input
                          type="time"
                          value={slot.start}
                          className="rounded-lg h-8 text-xs w-32"
                          onChange={(e) => {
                            const newSlots = [...timeSlots];
                            newSlots[idx].start = e.target.value;
                            setTimeSlots(newSlots);
                          }}
                        />
                        <span className="text-xs font-bold text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.end}
                          className="rounded-lg h-8 text-xs w-32"
                          onChange={(e) => {
                            const newSlots = [...timeSlots];
                            newSlots[idx].end = e.target.value;
                            setTimeSlots(newSlots);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 ml-auto rounded-lg"
                          onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Menu Items Assignment & Drag-and-Drop Reordering */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  Assigned Dishes ({selectedItems.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Search dishes to add, and drag items to adjust their live ordering
                </CardDescription>
              </div>

              {/* Popover Dish Search & Selector */}
              <Popover open={openItemPopover} onOpenChange={setOpenItemPopover}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5 shadow-sm h-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Dishes
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border" align="end">
                  <Command>
                    <CommandInput
                      placeholder="Search menu dishes..."
                      className="text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="p-4 text-xs text-center text-muted-foreground">
                        No dishes found matching search.
                      </CommandEmpty>
                      <CommandGroup heading="Available Dishes">
                        <ScrollArea className="h-72">
                          {allMenuItems.map((item: any) => {
                            const itemId = item._id || item.id;
                            const isSelected = selectedItems.some(
                              (i) => (i._id || i.id) === itemId
                            );
                            const nameEn = getLocalizedName(item.name || item, 'en', 'Dish');
                            const nameAm = getLocalizedName(item.name || item, 'am');
                            const catName = getCategoryName(item.category || item.categoryId, 'en');
                            const itemImage = getItemImageSrc(item);
                            const priceDisplay =
                              item.variants && item.variants.length > 0
                                ? `ETB ${Number(item.variants[0].price || 0).toFixed(2)}`
                                : item.price
                                ? `ETB ${Number(item.price).toFixed(2)}`
                                : '—';

                            return (
                              <CommandItem
                                key={itemId}
                                value={`${nameEn} ${nameAm || ''} ${catName || ''}`}
                                onSelect={() => {
                                  if (isSelected) {
                                    removeItem(itemId);
                                  } else {
                                    addItem(item);
                                  }
                                }}
                                className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer"
                              >
                                <div
                                  className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'bg-primary border-primary text-primary-foreground'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>

                                <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                                  {itemImage ? (
                                    <img src={itemImage} alt={nameEn} className="h-full w-full object-cover" />
                                  ) : (
                                    <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-xs truncate text-foreground">
                                      {nameEn}
                                    </p>
                                    {nameAm && nameAm !== nameEn && (
                                      <span className="text-[10px] text-muted-foreground truncate">
                                        ({nameAm})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <span className="font-semibold text-primary">{priceDisplay}</span>
                                    <span>•</span>
                                    <span className="truncate">{catName}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {selectedItems.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground">No dishes added yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                  Click "Add Dishes" above to select and organize items in this menu group.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pb-1">
                  <span>Drag handle to reorder dishes on POS and guest view</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-destructive hover:bg-destructive/10 font-bold"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear All ({selectedItems.length})
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedItems.map((i) => i._id || i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedItems.map((item, index) => {
                        const itemId = item._id || item.id;
                        return (
                          <SortableDishRow
                            key={itemId}
                            id={itemId}
                            item={item}
                            index={index}
                            onRemove={() => removeItem(itemId)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Sticky Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-md p-4 rounded-xl shadow-lg border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl font-bold text-xs h-9 px-4"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-xl font-extrabold text-xs h-9 px-5 shadow-sm"
          >
            {form.formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </div>
            ) : isEdit ? (
              'Update Menu Group'
            ) : (
              'Create Menu Group'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MenuGroupFormPage;
