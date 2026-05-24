// src/features/Menu/Components/MenuGroupFormPage.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { MultiSelect } from '@/components/ui/multi-select'; // You'll need this or implement
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronsUpDown,
  GripVertical,
  Plus,
  X,
  Calendar,
  Clock,
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
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { toast } from 'sonner';
import {
  useCreateMenuGroupMutation,
  useUpdateMenuGroupMutation,
  useMenuItemsQuery,
} from '@/api/Queries/menuQueries';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

// Zod Schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  visibility: z.enum(['always', 'scheduled', 'hidden']),
  priority: z.number().int(),
  isAlcoholMenu: z.boolean(),
  activeDays: z.array(z.string()),
  blockedDays: z.array(z.string()),
  timeSlots: z.array(
    z.object({
      start: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
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

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border',
        isDragging && 'opacity-50'
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

const MenuGroupFormPage: React.FC<MenuGroupFormPageProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!initialData;
  // const isSystemDefault = initialData?.isSystemDefault;

  const createMutation = useCreateMenuGroupMutation();
  const updateMutation = useUpdateMenuGroupMutation();
  const { data: allMenuItems = [], isLoading: itemsLoading } =
    useMenuItemsQuery();

  const [selectedItems, setSelectedItems] = useState<any[]>(
    initialData?.items?.map((i: any) => ({
      _id: i.menu?._id || i.menu,
      name: i.customName || i.menu?.name,
      type: i.menu?.type,
      variants: i.menu?.variants || [],
    })) || []
  );

  const [openPopover, setOpenPopover] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>(
    initialData?.timeSlots || []
  );
  const [specialDates, setSpecialDates] = useState<
    { date: string; recurringYearly: boolean }[]
  >(initialData?.specialDates || []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      visibility: initialData?.visibility || 'always',
      priority: initialData?.priority || 0,
      isAlcoholMenu: initialData?.isAlcoholMenu || false,
      activeDays: initialData?.activeDays || [],
      blockedDays: initialData?.blockedDays || [],
      timeSlots: initialData?.timeSlots || [],
      specialDates: initialData?.specialDates || [],
    },
  });

  const visibility = form.watch('visibility');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedItems((items) => {
      const oldIndex = items.findIndex((i) => i._id === active.id);
      const newIndex = items.findIndex((i) => i._id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addItem = (item: any) => {
    if (selectedItems.some((i) => i._id === item._id)) return;
    setSelectedItems([...selectedItems, item]);
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((i) => i._id !== itemId));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        timeSlots,
        specialDates,
        items: selectedItems.map((item, index) => ({
          menu: item._id,
          sortOrder: index + 1,
          overridePrice: null, // or undefined if allowed
          customName: null,
          customDescription: null,
          isHidden: false, // ← REQUIRED
          // _id is auto-generated by MongoDB on create, so not needed here
        })),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialData._id,
          groupData: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success(isEdit ? 'Menu group updated!' : 'Menu group created!');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save menu group');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Breakfast Menu" {...field} />
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Optional description..."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="always">Always Visible</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
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
                  <FormLabel>Priority (higher = shown first)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isAlcoholMenu"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Alcohol Menu</FormLabel>
                  <FormDescription>
                    Contains alcoholic beverages
                  </FormDescription>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </div>

        {/* Scheduling (only if visibility = scheduled) */}
        {visibility === 'scheduled' && (
          <div className="space-y-6 rounded-lg border p-6 bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduling Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Active Days</Label>
                <MultiSelect
                  options={daysOfWeek.map((d) => ({
                    value: d,
                    label: d.charAt(0).toUpperCase() + d.slice(1),
                  }))}
                  selected={form.watch('activeDays')}
                  onChange={(vals) => form.setValue('activeDays', vals)}
                  placeholder="All days"
                />
              </div>

              <div>
                <Label>Blocked Days</Label>
                <MultiSelect
                  options={daysOfWeek.map((d) => ({
                    value: d,
                    label: d.charAt(0).toUpperCase() + d.slice(1),
                  }))}
                  selected={form.watch('blockedDays')}
                  onChange={(vals) => form.setValue('blockedDays', vals)}
                  placeholder="None"
                />
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                Time Slots
              </Label>
              <div className="space-y-3">
                {timeSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => {
                        const newSlots = [...timeSlots];
                        newSlots[idx].start = e.target.value;
                        setTimeSlots(newSlots);
                      }}
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={slot.end}
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
                      onClick={() =>
                        setTimeSlots(timeSlots.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTimeSlots([
                      ...timeSlots,
                      { start: '09:00', end: '17:00' },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </div>

            {/* Special Dates */}
            <div>
              <Label>Special Dates</Label>
              <div className="space-y-3">
                {specialDates.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Input
                      type="date"
                      value={d.date}
                      onChange={(e) => {
                        const newDates = [...specialDates];
                        newDates[idx].date = e.target.value;
                        setSpecialDates(newDates);
                      }}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d.recurringYearly}
                        onChange={(e) => {
                          const newDates = [...specialDates];
                          newDates[idx].recurringYearly = e.target.checked;
                          setSpecialDates(newDates);
                        }}
                      />
                      <span className="text-sm">Recurring yearly</span>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setSpecialDates(
                          specialDates.filter((_, i) => i !== idx)
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSpecialDates([
                      ...specialDates,
                      { date: '', recurringYearly: false },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Special Date
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-4">
          <Label>Menu Items ({selectedItems.length})</Label>
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>
                  {selectedItems.length === 0
                    ? 'Select items...'
                    : `${selectedItems.length} selected`}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search items..." />
                <CommandList>
                  <CommandEmpty>No items found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-72">
                      {allMenuItems.map((item: any) => {
                        const isSelected = selectedItems.some(
                          (i) => i._id === item._id
                        );
                        return (
                          <CommandItem
                            key={item._id}
                            onSelect={() =>
                              isSelected ? removeItem(item._id) : addItem(item)
                            }
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                isSelected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.type} • ETB{' '}
                                {item.variants?.[0]?.price || item.price}
                              </p>
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

          {selectedItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Drag to reorder
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedItems.map((i) => i._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedItems.map((item) => (
                    <SortableItem key={item._id} id={item._id}>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.type}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item._id)}
                      >
                        Remove
                      </Button>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-8 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'Saving...'
              : isEdit
                ? 'Update Group'
                : 'Create Group'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MenuGroupFormPage;
