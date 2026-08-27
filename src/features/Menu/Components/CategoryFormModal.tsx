// src/features/Menu/Components/CategoryFormModal.tsx

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type Category,
} from '@/api/Queries/categoryQueries';
import { categoryFormSchema, type CategoryFormValues } from '../lib/Schemas';
import { Sparkles, Tag, Globe2 } from 'lucide-react';

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: Category | null;
  onSuccess?: (category: Category) => void;
}

const COMMON_EMOJIS = [
  '🥗', '🍕', '🍔', '☕', '🍹', '🍰', '🍜', '🥩', '🍷', '🥐', 
  '🍣', '🍦', '🍟', '🌮', '🍛', '🍲', '🥨', '🥪', '🥣', '🍱', 
  '🥞', '🧇', '🍗', '🍩', '🍺', '🧃', '🥤', '🍽️'
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  open,
  onOpenChange,
  categoryToEdit,
  onSuccess,
}) => {
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const [langTab, setLangTab] = useState<'en' | 'am'>('en');

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: {
        en: '',
        am: '',
      },
      description: {
        en: '',
        am: '',
      },
      displayOrder: 0,
      icon: '🍽️',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        const nameEn =
          typeof categoryToEdit.name === 'string'
            ? categoryToEdit.name
            : categoryToEdit.name?.en || '';
        const nameAm =
          typeof categoryToEdit.name === 'object'
            ? categoryToEdit.name?.am || ''
            : '';

        let descEn = '';
        let descAm = '';
        if (typeof categoryToEdit.description === 'string') {
          descEn = categoryToEdit.description;
        } else if (categoryToEdit.description && typeof categoryToEdit.description === 'object') {
          descEn = categoryToEdit.description.en || '';
          descAm = categoryToEdit.description.am || '';
        }

        form.reset({
          name: { en: nameEn, am: nameAm },
          description: { en: descEn, am: descAm },
          displayOrder: categoryToEdit.displayOrder ?? 0,
          icon: categoryToEdit.icon || '🍽️',
          isActive: categoryToEdit.isActive !== false,
        });
      } else {
        form.reset({
          name: { en: '', am: '' },
          description: { en: '', am: '' },
          displayOrder: 0,
          icon: '🍽️',
          isActive: true,
        });
      }
    }
  }, [open, categoryToEdit, form]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      const payload = {
        name: {
          en: values.name.en.trim(),
          ...(values.name.am?.trim() ? { am: values.name.am.trim() } : {}),
        },
        description: {
          en: values.description?.en?.trim() || '',
          ...(values.description?.am?.trim() ? { am: values.description.am.trim() } : {}),
        },
        displayOrder: Number(values.displayOrder) || 0,
        icon: values.icon?.trim() || '🍽️',
        isActive: values.isActive,
      };

      let result: Category;
      if (categoryToEdit && (categoryToEdit.id || categoryToEdit._id)) {
        const targetId = categoryToEdit.id || categoryToEdit._id!;
        result = await updateMutation.mutateAsync({ id: targetId, input: payload });
      } else {
        result = await createMutation.mutateAsync(payload);
      }

      onSuccess?.(result);
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const selectedIcon = form.watch('icon') || '🍽️';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shadow-xs">
              {selectedIcon}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                {categoryToEdit ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Organize menu dishes into localized, dynamic food and beverage groups.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-5">
            {/* Language Switcher Tabs */}
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5" /> Language Content
              </span>
              <Tabs
                value={langTab}
                onValueChange={(val) => setLangTab(val as 'en' | 'am')}
                className="w-auto"
              >
                <TabsList className="h-7 bg-white dark:bg-slate-900 shadow-2xs rounded-lg p-0.5">
                  <TabsTrigger
                    value="en"
                    className="text-xs px-2.5 py-1 font-medium data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all"
                  >
                    English (Required)
                  </TabsTrigger>
                  <TabsTrigger
                    value="am"
                    className="text-xs px-2.5 py-1 font-medium data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all"
                  >
                    አማርኛ (Amharic)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Localized Name */}
            {langTab === 'en' ? (
              <FormField
                control={form.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Category Name (English) <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Appetizers, Main Courses, Hot Drinks"
                        className="rounded-xl text-xs h-9 bg-white dark:bg-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="name.am"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span>Category Name (Amharic / አማርኛ)</span>
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        Optional
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ለምሳሌ፡ ክዳነ ምግብ፣ ዋና ምግብ፣ ሙቅ መጠጦች"
                        className="rounded-xl text-xs h-9 bg-white dark:bg-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            )}

            {/* Localized Description */}
            {langTab === 'en' ? (
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span>Description (English)</span>
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        Optional
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short summary of items in this category (max 200 characters)..."
                        className="rounded-xl text-xs min-h-[68px] resize-none bg-white dark:bg-slate-900"
                        maxLength={200}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] text-right text-slate-400">
                      {(field.value || '').length}/200
                    </FormDescription>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="description.am"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span>Description (Amharic / አማርኛ)</span>
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        Optional
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ስለ ምድቡ አጭር መግለጫ..."
                        className="rounded-xl text-xs min-h-[68px] resize-none bg-white dark:bg-slate-900"
                        maxLength={200}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] text-right text-slate-400">
                      {(field.value || '').length}/200
                    </FormDescription>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            )}

            {/* Icon / Emoji Picker */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Category Icon / Emoji
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        placeholder="🍕"
                        className="w-16 text-center text-lg h-9 rounded-xl font-mono bg-white dark:bg-slate-900"
                        maxLength={4}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex flex-wrap gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex-1 max-h-16 overflow-y-auto">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => field.onChange(emoji)}
                          className={`h-6 w-6 text-sm rounded-lg flex items-center justify-center hover:scale-125 transition-transform ${
                            field.value === emoji
                              ? 'bg-primary/20 ring-1 ring-primary'
                              : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Display Order & Active Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Display Order (Sort)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="rounded-xl text-xs h-9 bg-white dark:bg-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Lower numbers appear first on customer menus.
                    </FormDescription>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 self-start">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Active Status
                      </FormLabel>
                      <FormDescription className="text-[10px]">
                        {field.value ? 'Visible to guests' : 'Hidden from menu'}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-xl text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl text-xs h-8 font-bold gap-1.5"
              >
                {isPending ? 'Saving...' : categoryToEdit ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormModal;
