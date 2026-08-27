import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2, Upload, X, ChefHat, Globe2, Leaf, Flame, Sparkles, Check, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import {
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useMenuItemQuery,
  useAssignMenuItemStationMutation,
} from '../../../api/Queries/menuQueries';
import { useKitchenStationsQuery } from '../../../api/Queries/kitchenQueries';
import { useActiveCategoriesQuery } from '../../../api/Queries/categoryQueries';
import CategorySelect from './CategorySelect';
import { getCategoryName, extractLocalizedPair } from '../lib/categoryUtils';

import { type MenuFormValues, menuformSchema } from '../lib/Schemas';

const SPECIAL_OFFER_TAGS = [
  { id: 'chef-special', label: "Chef's Special", icon: '👨‍🍳' },
  { id: 'trending', label: 'Trending Now', icon: '🔥' },
  { id: 'bestseller', label: 'Bestseller', icon: '🏆' },
  { id: 'limited', label: 'Limited Time', icon: '⏳' },
];

const COMMON_ALLERGENS = [
  'gluten', 'dairy', 'nuts', 'peanuts', 'eggs', 'soy', 'fish', 'shellfish', 'sesame'
];

type MenuItemFormPageProps = {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const MenuItemFormPage: React.FC<MenuItemFormPageProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const shouldFetch = !initialData && !!paramId;

  const { data: fetchedItem, isLoading: isFetching } = useMenuItemQuery(
    shouldFetch ? paramId : undefined
  );

  const itemToEdit = initialData || fetchedItem;

  const createMutation = useCreateMenuItemMutation();
  const updateMutation = useUpdateMenuItemMutation();
  const assignStationMutation = useAssignMenuItemStationMutation();
  const { data: kitchenStations = [], isLoading: isLoadingStations } = useKitchenStationsQuery();
  const { data: activeCategories = [] } = useActiveCategoriesQuery();

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<string>('basic'); // To control tab switching
  const [langTab, setLangTab] = useState<'en' | 'am'>('en');

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuformSchema) as any,
    defaultValues: {
      name: {
        en: '',
        am: '',
      },
      description: {
        en: '',
        am: '',
      },
      type: 'food',
      categoryId: '',
      category: '',

      drinkType: null,
      isAlcoholic: false,
      alcoholPercentage: undefined,
      isVeg: null,
      isFasting: null,
      cuisineOrigin: 'local',
      cuisineTags: [],
      isSpicy: false,
      available: true,
      inStock: true,
      publishStatus: 'published',
      prepTime: '15-25 min',
      requiresKitchen: true,
      ingredients: [],
      allergens: [],
      tags: [],
      variants: [
        {
          name: 'Regular',
          size: '',
          volume: '',
          price: 0,
          calories: undefined,
          available: true,
          isDefault: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  useEffect(() => {
    if (itemToEdit) {
      // Extract kitchenStation ID
      const raw = itemToEdit.kitchenStation;
      if (typeof raw === 'string') {
        setSelectedStationId(raw);
      } else if (raw && typeof raw === 'object') {
        setSelectedStationId(raw._id || (raw as any).id || (raw as any).stationId || null);
      } else {
        setSelectedStationId(null);
      }

      let initialCategoryId = (itemToEdit as any).categoryId || '';
      let initialCategoryName = itemToEdit.category || '';
      if (typeof (itemToEdit as any).category === 'object' && (itemToEdit as any).category) {
        const catObj = (itemToEdit as any).category;
        initialCategoryId = catObj._id || catObj.id || initialCategoryId;
        initialCategoryName = getCategoryName(catObj, 'en');
      }

      const namePair = extractLocalizedPair(itemToEdit.name);
      const descPair = extractLocalizedPair(itemToEdit.description);

      const hasMultipleVariants = Array.isArray(itemToEdit.variants) && itemToEdit.variants.length > 1;
      setHasVariants(hasMultipleVariants);

      const resetValues: MenuFormValues = {
        name: {
          en: namePair.en || '',
          am: namePair.am || '',
        },
        description: {
          en: descPair.en || '',
          am: descPair.am || '',
        },
        type: itemToEdit.type || 'food',
        categoryId: initialCategoryId,
        category: initialCategoryName,
        drinkType: itemToEdit.drinkType || null,
        isAlcoholic: itemToEdit.isAlcoholic || false,
        alcoholPercentage: itemToEdit.alcoholPercentage,
        isVeg: itemToEdit.isVeg ?? null,
        isFasting: itemToEdit.isFasting ?? null,
        cuisineOrigin: itemToEdit.cuisineOrigin || 'local',
        cuisineTags: itemToEdit.cuisineTags || [],
        isSpicy: itemToEdit.isSpicy || false,
        available: itemToEdit.available ?? true,
        inStock: itemToEdit.inStock ?? true,
        publishStatus: itemToEdit.publishStatus || 'published',
        prepTime: itemToEdit.prepTime || '15-25 min',
        requiresKitchen: itemToEdit.requiresKitchen ?? true,
        ingredients: itemToEdit.ingredients || [],
        allergens: itemToEdit.allergens || [],
        tags: itemToEdit.tags || [],
        variants: itemToEdit.variants?.map((v: any) => ({
          name: v.name || 'Regular',
          size: v.size || '',
          volume: v.volume || '',
          price: Number(v.price) || 0,
          calories: v.calories ? Number(v.calories) : undefined,
          available: v.available ?? true,
          isDefault: v.isDefault || false,
        })) || [
          {
            name: 'Regular',
            size: '',
            volume: '',
            price: Number(itemToEdit.price) || 0,
            available: true,
            isDefault: true,
          },
        ],
      };

      form.reset(resetValues);

      if (itemToEdit.image && typeof itemToEdit.image === 'string') {
        setImagePreview(`${itemToEdit.image}`);
      }
    }
  }, [itemToEdit, form]);

  const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ingredientInput.trim()) {
      e.preventDefault();
      const current = form.getValues('ingredients') || [];
      if (!current.includes(ingredientInput.trim())) {
        form.setValue('ingredients', [...current, ingredientInput.trim()]);
      }
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    const current = form.getValues('ingredients') || [];
    form.setValue(
      'ingredients',
      current.filter((i) => i !== ingredient)
    );
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const current = form.getValues('tags') || [];
      if (!current.includes(tagInput.trim().toLowerCase())) {
        form.setValue('tags', [...current, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const toggleTag = (tagId: string) => {
    const current = form.getValues('tags') || [];
    if (current.includes(tagId)) {
      form.setValue('tags', current.filter((t) => t !== tagId));
    } else {
      form.setValue('tags', [...current, tagId]);
    }
  };

  const toggleAllergen = (allergen: string) => {
    const current = form.getValues('allergens') || [];
    if (current.includes(allergen)) {
      form.setValue('allergens', current.filter((a) => a !== allergen));
    } else {
      form.setValue('allergens', [...current, allergen]);
    }
  };

  const onSubmit: SubmitHandler<MenuFormValues> = async (values) => {
    try {
      const formData = new FormData();

      const nameEn = values.name.en.trim();
      const nameAm = values.name.am?.trim();
      formData.append('name', nameEn);
      if (nameAm) {
        formData.append('nameAm', nameAm);
      }

      formData.append('type', values.type);

      // Resolve categoryId to guarantee backend requirements are satisfied
      let resolvedCategoryId = values.categoryId?.trim() || '';
      let resolvedCategoryName = values.category?.trim() || '';

      if (!resolvedCategoryId && resolvedCategoryName) {
        const matched = activeCategories.find(
          (c) =>
            c.id === resolvedCategoryName ||
            c._id === resolvedCategoryName ||
            c.name?.en?.toLowerCase() === resolvedCategoryName.toLowerCase() ||
            (typeof c.name === 'string' && (c.name as string).toLowerCase() === resolvedCategoryName.toLowerCase())
        );
        if (matched) {
          resolvedCategoryId = matched.id || matched._id || '';
          resolvedCategoryName = getCategoryName(matched, 'en');
        } else {
          resolvedCategoryId = resolvedCategoryName;
        }
      }

      if (!resolvedCategoryId && activeCategories.length > 0) {
        resolvedCategoryId = activeCategories[0].id || activeCategories[0]._id || '';
        resolvedCategoryName = getCategoryName(activeCategories[0], 'en');
      }

      if (!resolvedCategoryId) {
        toast.error('Category is required. Please select or create a category.');
        return;
      }

      formData.append('categoryId', resolvedCategoryId);
      formData.append('category', resolvedCategoryName || resolvedCategoryId);

      // Base price
      const basePrice = Number(values.price ?? values.variants?.[0]?.price ?? 0);
      formData.append('price', String(basePrice));

      formData.append('prepTime', values.prepTime || '15-25 min');
      formData.append('requiresKitchen', String(values.requiresKitchen ?? true));
      formData.append('available', String(values.available ?? true));
      formData.append('inStock', String(values.inStock ?? true));
      formData.append('isVeg', values.isVeg !== null && values.isVeg !== undefined ? String(values.isVeg) : 'false');
      formData.append('isSpicy', String(values.isSpicy ?? false));
      if (values.isFasting !== undefined && values.isFasting !== null) {
        formData.append('isFasting', String(values.isFasting));
      }
      formData.append('cuisineOrigin', values.cuisineOrigin || 'local');
      formData.append('publishStatus', values.publishStatus || 'published');

      if (values.type === 'drink') {
        if (values.drinkType) {
          formData.append('drinkType', values.drinkType);
        }
        formData.append('isAlcoholic', String(values.isAlcoholic ?? false));
        if (values.alcoholPercentage !== undefined && !isNaN(Number(values.alcoholPercentage))) {
          formData.append('alcoholPercentage', String(values.alcoholPercentage));
        }
      }

      const descEn = values.description?.en?.trim() || '';
      const descAm = values.description?.am?.trim() || '';
      if (descEn) {
        formData.append('description', descEn);
      }
      if (descAm) {
        formData.append('descriptionAm', descAm);
      }

      if (hasVariants) {
        formData.append('variants', JSON.stringify(values.variants));
      }

      formData.append('ingredients', JSON.stringify(values.ingredients || []));
      formData.append('allergens', JSON.stringify(values.allergens || []));
      formData.append('tags', JSON.stringify(values.tags || []));
      if (values.cuisineTags && values.cuisineTags.length > 0) {
        formData.append('cuisineTags', JSON.stringify(values.cuisineTags));
      }

      if (values.image && values.image instanceof File) {
        formData.append('image', values.image);
      }

      const isEdit = !!itemToEdit;
      const itemId = (itemToEdit as any)?._id || (itemToEdit as any)?.id || paramId;

      if (isEdit && itemId) {
        await updateMutation.mutateAsync({ id: itemId, formData });
        try {
          await assignStationMutation.mutateAsync({
            menuItemId: itemId,
            stationId: selectedStationId,
          });
        } catch (stErr) {
          console.error('Failed to sync kitchen station assignment:', stErr);
        }
        toast.success('Menu item updated');
      } else {
        const createdItem: any = await createMutation.mutateAsync(formData);
        const createdId = createdItem?._id || createdItem?.id || createdItem?.data?._id || createdItem?.data?.id;
        if (createdId && selectedStationId) {
          try {
            await assignStationMutation.mutateAsync({
              menuItemId: createdId,
              stationId: selectedStationId,
            });
          } catch (stErr) {
            console.error('Failed to assign kitchen station on create:', stErr);
          }
        }
        toast.success('Menu item created');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to save menu item');
    }
  };

  if (isFetching) {
    return (
      <div className="p-8 h-96 w-full animate-pulse bg-muted rounded-xl max-w-5xl mx-auto" />
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex justify-start space-x-4 border-b-0 bg-transparent">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="variants" disabled={!hasVariants}>
                Variants & Pricing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="pt-3 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>General Information</CardTitle>
                      <CardDescription className="text-xs">
                        Enter item details in English and Amharic
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setLangTab('en')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          langTab === 'en'
                            ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        English 🇺🇸
                      </button>
                      <button
                        type="button"
                        onClick={() => setLangTab('am')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          langTab === 'am'
                            ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        አማርኛ 🇪🇹
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                  {langTab === 'en' ? (
                    <>
                      <FormField
                        control={form.control}
                        name="name.en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between">
                              <span>Name (English) *</span>
                              <span className="text-[10px] text-muted-foreground font-normal">Required</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Margherita Pizza / Special Tibs" {...field} />
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
                                placeholder="e.g. Fresh mozzarella, tomato sauce, basil on a thin crust..."
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              English description shown to customers on the menu.
                            </FormDescription>
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
                            <FormLabel className="flex items-center justify-between">
                              <span>ስም (የአማርኛ ስም)</span>
                              <span className="text-[10px] text-muted-foreground font-normal">አማራጭ (Optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="ለምሳሌ፡ ማርገሪታ ፒዛ / ልዩ ጥብስ" {...field} value={field.value || ''} />
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
                            <FormLabel>መግለጫ (የአማርኛ መግለጫ)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ለምሳሌ፡ ትኩስ ሞዛሬላ፣ የቲማቲም መረቅ እና ባሲል በስስ ዳቦ ላይ..."
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              በምናሌው ላይ ለደንበኞች የሚታይ የአማርኛ መግለጫ።
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <CategorySelect
                            value={field.value || form.watch('category')}
                            onChange={(catId, catObj) => {
                              field.onChange(catId);
                              form.setValue('categoryId', catId, { shouldValidate: true });
                              if (catObj) {
                                form.setValue(
                                  'category',
                                  getCategoryName(catObj, 'en'),
                                  { shouldValidate: true }
                                );
                              } else if (catId) {
                                form.setValue('category', catId, { shouldValidate: true });
                              }
                            }}
                            error={
                              !!form.formState.errors.category ||
                              !!form.formState.errors.categoryId
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="drink">Drink</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('type') === 'drink' && (
                    <FormField
                      control={form.control}
                      name="drinkType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drink Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select drink category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="soft-drink">Soft Drink</SelectItem>
                              <SelectItem value="juice">Fresh Juice</SelectItem>
                              <SelectItem value="beer">Beer</SelectItem>
                              <SelectItem value="wine">Wine</SelectItem>
                              <SelectItem value="cocktail">Cocktail</SelectItem>
                              <SelectItem value="hot-drink">Hot Drink / Coffee / Tea</SelectItem>
                              <SelectItem value="milkshake">Milkshake</SelectItem>
                              <SelectItem value="water">Bottled Water</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="prepTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preparation Time</FormLabel>
                        <FormControl>
                          <Input placeholder="15-25 min" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {!hasVariants && (
                    <FormField
                      control={form.control}
                      name="variants.0.price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (ETB) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                ETB
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-12"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Price for this item</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {/* Ingredients */}
                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Ingredients</FormLabel>
                        <div className="flex flex-wrap gap-2 p-2 min-h-12 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                          {field.value?.map((ingredient) => (
                            <Badge
                              key={ingredient}
                              variant="secondary"
                              className="flex items-center gap-1 py-1 pr-1"
                            >
                              {ingredient}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeIngredient(ingredient)}
                              />
                            </Badge>
                          ))}
                          <input
                            className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
                            placeholder="Type and press Enter..."
                            value={ingredientInput}
                            onChange={(e) => setIngredientInput(e.target.value)}
                            onKeyDown={handleAddIngredient}
                          />
                        </div>
                        <FormDescription>
                          Press Enter after each ingredient to add it.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Dietary, Fasting & Cuisine Origin */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Dietary, Fasting & Cuisine Origin</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Configure fasting (የፆም), culinary origin, and dietary preferences for customer filtering.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Cuisine Origin */}
                  <FormField
                    control={form.control}
                    name="cuisineOrigin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Cuisine Origin *
                        </FormLabel>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => field.onChange('local')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                              field.value === 'local'
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                                : 'border-border bg-card hover:bg-muted text-muted-foreground'
                            }`}
                          >
                            <span className="text-base">🇪🇹</span>
                            <span>Local Cuisine (Ethiopian)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('international')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                              field.value === 'international'
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                                : 'border-border bg-card hover:bg-muted text-muted-foreground'
                            }`}
                          >
                            <span className="text-base">🌐</span>
                            <span>International Cuisine</span>
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fasting (የፆም) Toggle */}
                  <FormField
                    control={form.control}
                    name="isFasting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <FormLabel className="text-sm font-bold text-foreground">
                              Fasting Friendly (የፆም ምግብ)
                            </FormLabel>
                          </div>
                          <FormDescription className="text-xs text-muted-foreground">
                            Complies with fasting traditions (100% plant-based / vegan, no meat or animal products).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Vegetarian & Spicy Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isVeg"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3.5 bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs font-bold flex items-center gap-1.5">
                              <Leaf className="h-3.5 w-3.5 text-emerald-500" /> Vegetarian (የአትክልት)
                            </FormLabel>
                            <FormDescription className="text-[11px]">
                              Meat-free dish
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === true}
                              onCheckedChange={(checked) => field.onChange(checked ? true : false)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isSpicy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3.5 bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs font-bold flex items-center gap-1.5">
                              <Flame className="h-3.5 w-3.5 text-rose-500" /> Spicy (የሚቃጥል)
                            </FormLabel>
                            <FormDescription className="text-[11px]">
                              Prepared with berbere/mitmita/chili
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-rose-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Alcoholic Toggle */}
                  <div className="space-y-3 pt-1">
                    <FormField
                      control={form.control}
                      name="isAlcoholic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3.5 bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs font-bold">
                              Contains Alcohol (አልኮል ያለበት)
                            </FormLabel>
                            <FormDescription className="text-[11px]">
                              Mark if item contains alcohol or liquor
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-amber-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('isAlcoholic') && (
                      <FormField
                        control={form.control}
                        name="alcoholPercentage"
                        render={({ field }) => (
                          <FormItem className="pl-2">
                            <FormLabel className="text-xs font-medium">Alcohol by Volume (ABV %)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 5.0"
                                className="w-40"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Special Offers (Tags) */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Special Offers & Badges</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Tag this item for promotional badges like Chef's Special, Trending, or Bestseller.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SPECIAL_OFFER_TAGS.map((tag) => {
                      const isSelected = form.watch('tags')?.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{tag.icon}</span>
                            <span>{tag.label}</span>
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <Label className="text-xs">Custom Tags</Label>
                    <div className="flex flex-wrap gap-2 p-2 mt-1.5 min-h-10 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      {form.watch('tags')?.map((t) => (
                        <Badge key={t} variant="secondary" className="flex items-center gap-1 py-1 pr-1 text-xs">
                          {t}
                          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggleTag(t)} />
                        </Badge>
                      ))}
                      <input
                        className="flex-1 bg-transparent outline-none text-xs min-w-[100px]"
                        placeholder="Add custom tag (e.g. organic, spicy)..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Allergens Information */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Allergens Information</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Select known allergens to help customers with dietary restrictions make safe choices.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.map((allergen) => {
                      const isSelected = form.watch('allergens')?.includes(allergen);
                      return (
                        <button
                          key={allergen}
                          type="button"
                          onClick={() => toggleAllergen(allergen)}
                          className={`px-3 py-1.5 rounded-full border text-xs capitalize transition-colors ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{allergen}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Availability & Publishing Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Availability & Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold">
                            Menu Item Active
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Turn off to temporarily hide this item from digital menus
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

                  <FormField
                    control={form.control}
                    name="inStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold">
                            In Stock
                          </FormLabel>
                          <FormDescription className="text-xs">
                            If turned off, shows as "Out of Stock" on the customer menu
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

                  <FormField
                    control={form.control}
                    name="publishStatus"
                    render={({ field }) => (
                      <FormItem className="pt-2">
                        <FormLabel className="text-xs font-semibold">Publish Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'published'}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="published">Published (Live)</SelectItem>
                            <SelectItem value="draft">Draft (Unpublished)</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Kitchen Station Routing & Requires Kitchen Toggle */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Kitchen Display System (KDS) Routing</CardTitle>
                  </div>
                  <CardDescription>
                    Configure whether this item needs live kitchen preparation or routes directly for service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="requiresKitchen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                        <div className="space-y-0.5 pr-4">
                          <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                            <ChefHat className="h-4 w-4 text-primary" />
                            Requires Kitchen Preparation
                          </FormLabel>
                          <FormDescription className="text-xs text-muted-foreground">
                            Turn off for items that don't need cooking (drinks, packaged goods, bar items). Non-kitchen items are auto-served or direct-pickup.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value !== false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                setSelectedStationId(null);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('requiresKitchen') !== false ? (
                    <div className="space-y-4 pt-1">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Target Kitchen Station
                        </label>
                        <Select
                          value={selectedStationId || 'none'}
                          onValueChange={(val) => setSelectedStationId(val === 'none' ? null : val)}
                        >
                          <SelectTrigger className="w-full sm:w-80 h-10 rounded-xl">
                            <SelectValue placeholder="Select a kitchen station..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none" className="text-muted-foreground font-medium">
                              No Station (Default Queue)
                            </SelectItem>
                            {kitchenStations.map((station) => (
                              <SelectItem key={station._id || station.stationId} value={station._id || station.stationId}>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {station.name}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                                    {station.code}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedStationId && (
                        <div className="p-3 bg-muted/40 rounded-xl text-xs flex items-center justify-between border border-border/50">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Assigned to:</span>
                            <span className="font-bold text-foreground">
                              {kitchenStations.find((s) => (s._id || s.stationId) === selectedStationId)?.name || selectedStationId}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => setSelectedStationId(null)}
                          >
                            Clear Station
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/50 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
                      <span className="font-semibold">Direct Service Item:</span>
                      <span>This item does not require kitchen tickets and can be served immediately upon order receipt.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Upload with Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Item Image</CardTitle>
                  <CardDescription>
                    Recommended: square image (1:1 ratio), high quality,
                    well-lit photo of the dish
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid place-items-center">
                    <div className="relative group w-full max-w-md aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 overflow-hidden transition-colors hover:border-muted-foreground/50">
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Menu item preview"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <label
                              htmlFor="image-upload"
                              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur hover:bg-white transition-colors"
                            >
                              <Pencil className="h-5 w-5 text-foreground" />
                              <span className="sr-only">Replace image</span>
                            </label>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-12 w-12 rounded-full"
                              onClick={() => {
                                form.setValue('image', undefined);
                                setImagePreview(null);
                              }}
                            >
                              <Trash2 className="h-5 w-5" />
                              <span className="sr-only">Remove image</span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <label
                          htmlFor="image-upload"
                          className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Upload className="h-12 w-12" />
                          <div className="text-center">
                            <p className="font-medium">Click to upload</p>
                            <p className="text-sm">PNG or JPG · max 5MB</p>
                          </div>
                        </label>
                      )}

                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Image must be less than 5MB');
                              return;
                            }
                            form.setValue('image', file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Item Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      checked={hasVariants}
                      onCheckedChange={(checked) => {
                        setHasVariants(checked as boolean);
                        if (!checked) {
                          setActiveTab('basic');
                        }
                      }}
                    />
                    <div className="space-y-1 leading-none">
                      <label className="text-sm font-medium leading-none">
                        Has Variants?
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Check if this item has multiple sizes or prices (e.g.,
                        Small, Medium, Large)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="pt-6 space-y-6">
              {hasVariants ? (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Variants & Pricing</h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({
                          name: '',
                          price: 0,
                          available: true,
                          isDefault: false,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Variant
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              Variant {index + 1}
                              {form.watch(`variants.${index}.isDefault`) && (
                                <Badge className="ml-3" variant="default">
                                  Default
                                </Badge>
                              )}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              disabled={fields.length === 1}
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name={`variants.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Variant Name *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g. Small, Large, Spicy"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`variants.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (ETB) *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        ETB
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="pl-12"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1  md:grid-cols-3 gap-6">
                            <FormField
                              control={form.control}
                              name={`variants.${index}.size`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Size</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g. 12 inch, 500ml"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`variants.${index}.available`}
                              render={({ field }) => (
                                <FormItem className="flex sm:flex-col items-center sm:justify-between  space-x-3 space-y-0 p-2 ">
                                  <FormLabel className="!mt-0">
                                    Available
                                  </FormLabel>
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
                              name={`variants.${index}.isDefault`}
                              render={({ field }) => (
                                <FormItem className="flex sm:flex-col items-center sm:justify-between  p-2 space-x-3 space-y-0">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0 text-nowrap">
                                    Default Variant
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <p className="text-lg">
                      Check "Has Variants?" in the Basic tab to add multiple
                      sizes and prices.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 border-t pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => navigate('/menu/items'))}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="lg"
              className="px-10"
              onClick={() => {
                if (hasVariants && activeTab === 'basic') {
                  // From Basic tab → go to Variants tab
                  setActiveTab('variants');
                  toast.info(
                    'Please add your variants and prices, then click Create Item.'
                  );
                } else {
                  // Either no variants, or already in Variants tab → submit
                  form.handleSubmit(onSubmit)();
                }
              }}
            >
              {hasVariants && activeTab === 'basic'
                ? '→ Go to Variants & Pricing'
                : itemToEdit
                  ? 'Update Item'
                  : 'Create Item'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MenuItemFormPage;
