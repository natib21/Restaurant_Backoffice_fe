import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
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

import {
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useMenuItemQuery,
} from '../../../api/Queries/menuQueries';

import { type MenuFormValues, menuformSchema } from '../lib/Schemas';

type MenuItemFormPageProps = {
  initialData?: MenuFormValues & { _id?: string; id?: string };
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

  const { data: fetchedItem, isLoading: isFetching } = shouldFetch
    ? useMenuItemQuery(paramId!)
    : { data: null, isLoading: false };

  const itemToEdit = initialData || fetchedItem;

  const createMutation = useCreateMenuItemMutation();
  const updateMutation = useUpdateMenuItemMutation();

  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState('');
  const [activeTab, setActiveTab] = useState<string>('basic'); // To control tab switching

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuformSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'food',
      category: '',

      drinkType: null,
      isAlcoholic: false,
      alcoholPercentage: undefined,
      isVeg: null,
      isSpicy: false,
      available: true,
      prepTime: '',
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
      const resetValues: MenuFormValues = {
        name: itemToEdit.name || '',
        description: itemToEdit.description || '',
        type: itemToEdit.type || 'food',
        category: itemToEdit.category || '',
        isAlcoholic: itemToEdit.isAlcoholic || false,
        alcoholPercentage: itemToEdit.alcoholPercentage,
        isVeg: itemToEdit.isVeg,
        isSpicy: itemToEdit.isSpicy || false,
        available: itemToEdit.available ?? true,
        prepTime: itemToEdit.prepTime || '',
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
            price: 0,
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

  const onSubmit: SubmitHandler<MenuFormValues> = async (values) => {
    try {
      const formData = new FormData();

      formData.append('name', values.name);
      formData.append('type', values.type);
      formData.append('category', values.category);
      formData.append('available', String(values.available));
      formData.append('isSpicy', String(values.isSpicy));
      formData.append('isAlcoholic', String(values.isAlcoholic));

      if (values.description)
        formData.append('description', values.description);
      if (values.prepTime) formData.append('prepTime', values.prepTime);
      if (values.drinkType) formData.append('drinkType', values.drinkType);
      if (values.alcoholPercentage !== undefined) {
        formData.append('alcoholPercentage', String(values.alcoholPercentage));
      }
      if (values.isVeg !== null) {
        formData.append('isVeg', String(values.isVeg));
      }

      formData.append('variants', JSON.stringify(values.variants));
      formData.append('ingredients', JSON.stringify(values.ingredients || []));
      formData.append('allergens', JSON.stringify(values.allergens || []));
      formData.append('tags', JSON.stringify(values.tags || []));

      if (values.image && values.image instanceof File) {
        formData.append('image', values.image);
      }

      const isEdit = !!itemToEdit;
      const itemId = itemToEdit?._id || paramId;

      if (isEdit && itemId) {
        await updateMutation.mutateAsync({ id: itemId, formData });
        toast.success('Menu item updated');
      } else {
        await createMutation.mutateAsync(formData);
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
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Margherita Pizza" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <Input placeholder="Pizza" {...field} />
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
                          <Input
                            placeholder="e.g. Fresh mozzarella, tomato sauce, basil on a thin crust..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A short description shown to customers on the menu.
                        </FormDescription>
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

              {/* Availability */}
              <Card>
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Item Availability
                        </FormLabel>
                        <FormDescription>
                          Turn off to hide this item from customers
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
