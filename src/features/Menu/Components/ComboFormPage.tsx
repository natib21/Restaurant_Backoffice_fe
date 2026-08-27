// src/features/Menu/Components/ComboFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Upload,
  Pencil,
  X,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { comboFormSchema, type ComboFormValues } from '../lib/Schemas';
import { getLocalizedName, extractLocalizedPair } from '../lib/localizationUtils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { MultiSelect } from '@/components/ui/multi-select';

import {
  useCreateComboMutation,
  useUpdateComboMutation,
} from '../../../api/Queries/comboQueries';
import { useMenuItemsQuery } from '@/api/Queries/menuQueries';
import { useBranchesQuery } from '@/api/Queries/branchQueries';

const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

interface ComboFormPageProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ComboFormPage: React.FC<ComboFormPageProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!initialData;

  const createMutation = useCreateComboMutation();
  const updateMutation = useUpdateComboMutation();
  const { data: menuItems = [] } = useMenuItemsQuery();
  const { data: branches = [], isLoading: branchesLoading } =
    useBranchesQuery();

  const [activeTab, setActiveTab] = useState<'basic' | 'scheduling' | 'items'>(
    'basic'
  );
  const [langTab, setLangTab] = useState<'en' | 'am'>('en');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<ComboFormValues>({
    resolver: zodResolver(comboFormSchema) as any,
    defaultValues: {
      name: { en: '', am: '' },
      description: { en: '', am: '' },
      comboPrice: 0,
      isActive: true,
      priority: 0,
      maxPerOrder: 10,
      tags: [],
      availableOnDays: [],
      timeSlots: [],
      items: [],
      branches: [],
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (initialData) {
      const safeItems = Array.isArray(initialData.items)
        ? initialData.items.map((i: any) => ({
            menuItem:
              typeof i.menuItem === 'object'
                ? i.menuItem._id
                : String(i.menuItem || ''),
            quantity: Number(i.quantity) || 1,
          }))
        : [];

      const namePair = extractLocalizedPair(initialData.name);
      const descPair = extractLocalizedPair(initialData.description);

      form.reset({
        name: namePair,
        description: descPair,
        comboPrice: Number(initialData.comboPrice) || 0,
        isActive: Boolean(initialData.isActive ?? true),
        priority: Number(initialData.priority || 0),
        maxPerOrder: Number(initialData.maxPerOrder || 10),
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        availableOnDays: Array.isArray(initialData.availableOnDays)
          ? initialData.availableOnDays
          : [],
        timeSlots: Array.isArray(initialData.timeSlots)
          ? initialData.timeSlots.map((s: any) => ({
              start: s.start || '09:00',
              end: s.end || '17:00',
            }))
          : [],
        items: safeItems,
        branches: Array.isArray(initialData.branches)
          ? initialData.branches.map((b: any) =>
              typeof b === 'object' ? b._id : String(b)
            )
          : [],
      });

      if (initialData.image) {
        setImagePreview(
          initialData.image.startsWith('http')
            ? initialData.image
            : `${initialData.image}`
        );
      }
    }
  }, [initialData, form]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const current = form.getValues('tags');
      if (!current.includes(tagInput.trim())) {
        form.setValue('tags', [...current, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const onSubmit: SubmitHandler<ComboFormValues> = async (values) => {
    try {
      if (values.branches.length === 0) {
        toast.error('Please select at least one branch.');
        return;
      }

      const formData = new FormData();

      const nameEn = values.name.en.trim();
      const nameAm = values.name.am?.trim();
      formData.append('name', nameEn);
      if (nameAm) {
        formData.append('nameAm', nameAm);
      }

      formData.append('comboPrice', String(values.comboPrice));
      formData.append('isActive', String(values.isActive));
      formData.append('priority', String(values.priority || 0));
      formData.append('maxPerOrder', String(values.maxPerOrder || 10));

      const descEn = values.description?.en?.trim() || '';
      const descAm = values.description?.am?.trim() || '';
      if (descEn) {
        formData.append('description', descEn);
      }
      if (descAm) {
        formData.append('descriptionAm', descAm);
      }

      formData.append('branches', JSON.stringify(values.branches));
      formData.append('tags', JSON.stringify(values.tags || []));
      formData.append('availableOnDays', JSON.stringify(values.availableOnDays || []));
      formData.append('items', JSON.stringify(values.items));
      formData.append('timeSlots', JSON.stringify(values.timeSlots));

      // Only send image if it's a real File
      if (
        values.image &&
        values.image instanceof File &&
        values.image.size > 0
      ) {
        formData.append('image', values.image);
      }

      if (isEdit && initialData?._id) {
        await updateMutation.mutateAsync({
          id: initialData._id,
          formData,
        });
        toast.success('Combo updated successfully');
      } else {
        await createMutation.mutateAsync(formData as any);
        toast.success('Combo created successfully');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error?.message || 'Failed to save combo');
    }
  };

  const handleNext = async () => {
    let valid = false;

    if (activeTab === 'basic') {
      valid = await form.trigger(['name', 'comboPrice']);
    } else if (activeTab === 'scheduling') {
      valid = await form.trigger(['branches']);
    } else if (activeTab === 'items') {
      valid = await form.trigger(['items']);
    }

    if (!valid) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (activeTab === 'basic') {
      setActiveTab('scheduling');
    } else if (activeTab === 'scheduling') {
      setActiveTab('items');
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  const branchOptions = [
    { value: 'all', label: 'All Branches (Select All)' },
    ...branches.map((b: any) => ({ value: b._id, label: b.name })),
  ];

  return (
    <div className="max-w-5xl mx-auto py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="scheduling">
                Scheduling & Branches
              </TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-6 pt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle>General Information</CardTitle>
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setLangTab('en')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        langTab === 'en'
                          ? 'bg-background shadow-xs text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      English (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLangTab('am')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        langTab === 'am'
                          ? 'bg-background shadow-xs text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      አማርኛ (AM)
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {langTab === 'en' ? (
                    <>
                      <FormField
                        control={form.control}
                        name="name.en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Offer Name (English) *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Family Feast Combo" {...field} />
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
                            <FormLabel>Description (English)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. A hearty feast for the entire family"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="name.am"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>የልዩ ቅናሽ ስም (አማርኛ)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ምሳሌ፦ የቤተሰብ ኮምቦ"
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
                            <FormLabel>መግለጫ (አማርኛ)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ምሳሌ፦ ለመላው ቤተሰብ የሚሆን የተሟላ ቅናሽ"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="comboPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Combo Price (ETB) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                      {form.watch('tags').map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}{' '}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() =>
                              form.setValue(
                                'tags',
                                form.getValues('tags').filter((t) => t !== tag)
                              )
                            }
                          />
                        </Badge>
                      ))}
                      <input
                        className="outline-none text-sm flex-1"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            e.preventDefault();
                            form.setValue('tags', [
                              ...form.getValues('tags'),
                              tagInput.trim(),
                            ]);
                            setTagInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status and Image */}
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded-md">
                        <Label>Active Status</Label>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden border-2 border-dashed relative group">
                            {imagePreview ? (
                              <>
                                <img
                                  src={imagePreview}
                                  className="w-full h-full object-cover"
                                  alt="Preview"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                                  <label className="cursor-pointer">
                                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                      <Pencil className="h-5 w-5" />
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) {
                                          field.onChange(null);
                                          setImagePreview(null);
                                          return;
                                        }
                                        if (file.size > 5 * 1024 * 1024) {
                                          toast.error('Image must be < 5MB');
                                          return;
                                        }
                                        field.onChange(file);
                                        setImagePreview(
                                          URL.createObjectURL(file)
                                        );
                                      }}
                                    />
                                  </label>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                      field.onChange(null);
                                      setImagePreview(null);
                                    }}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center py-8">
                                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">
                                  Upload Image
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) {
                                      field.onChange(null);
                                      setImagePreview(null);
                                      return;
                                    }
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error('Image must be < 5MB');
                                      return;
                                    }
                                    field.onChange(file);
                                    setImagePreview(URL.createObjectURL(file));
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scheduling & Branches */}
            <TabsContent value="scheduling" className="space-y-6 pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="branches"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Select Branches
                        </FormLabel>
                        <MultiSelect
                          options={branchOptions}
                          selected={field.value}
                          onChange={(vals) => {
                            if (vals.includes('all')) {
                              field.onChange(branches.map((b: any) => b._id));
                            } else {
                              field.onChange(vals.filter((v) => v !== 'all'));
                            }
                          }}
                          placeholder="Select at least one branch"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableOnDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Days</FormLabel>
                        <MultiSelect
                          options={daysOfWeek.map((d) => ({
                            value: d,
                            label: d.charAt(0).toUpperCase() + d.slice(1),
                          }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="All Days"
                        />
                        <FormDescription>
                          Leave empty for every day
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items */}
            <TabsContent value="items" className="space-y-6 pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Combo Composition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Add Item <Plus className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search items..." />
                        <CommandList>
                          <CommandEmpty>No items found.</CommandEmpty>
                          <CommandGroup>
                            {menuItems.map((item: any) => {
                              const enName = getLocalizedName(item, 'en', 'Unnamed Item');
                              const amName = getLocalizedName(item, 'am');
                              return (
                                <CommandItem
                                  key={item._id}
                                  value={`${enName} ${amName || ''}`}
                                  onSelect={() =>
                                    appendItem({
                                      menuItem: item._id,
                                      quantity: 1,
                                    })
                                  }
                                  className="flex items-center justify-between"
                                >
                                  <span className="font-medium">{enName}</span>
                                  {amName && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {amName}
                                    </span>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="space-y-3 mt-6">
                    {itemFields.map((field, index) => {
                      const menuItem = menuItems.find(
                        (m: any) => m._id === field.menuItem
                      );
                      const enName = menuItem
                        ? getLocalizedName(menuItem, 'en', 'Unknown Item')
                        : 'Unknown Item';
                      const amName = menuItem
                        ? getLocalizedName(menuItem, 'am')
                        : '';
                      return (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {enName}
                            </span>
                            {amName && (
                              <span className="text-xs text-muted-foreground">
                                {amName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              className="w-20"
                              min="1"
                              defaultValue={1}
                              onChange={(e) =>
                                form.setValue(
                                  `items.${index}.quantity`,
                                  Number(e.target.value) || 1
                                )
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleNext}>
              {activeTab === 'items' ? (isEdit ? 'Update' : 'Create') : 'Next'}{' '}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ComboFormPage;
