// src/features/Menu/pages/MenuItemPage.tsx

import React, { useState } from 'react';
import {
  Edit3,
  Trash2,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Flame,
  Leaf,
  Beer,
  Clock,
  Info,
  AlertTriangle,
  Tag,
  Scale,
  Layers,
  Package,
  ChefHat,
  Globe,
  Sparkles,
  DollarSign,
  Calendar,
  Hash,
  ShieldCheck,
  Check,
  Percent,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailabilityMutation,
  useMenuItemQuery,
} from '@/api/Queries/menuQueries';
import StationSelector from '../Components/StationSelector';
import {
  getLocalizedName,
  getLocalizedDescription,
  extractLocalizedPair,
} from '../lib/localizationUtils';
import { getCategoryName } from '../lib/categoryUtils';

type MenuItemPageProps = {
  itemId: string;
  onEdit?: () => void;
};

const MenuItemPage: React.FC<MenuItemPageProps> = ({ itemId, onEdit }) => {
  const { data: item, isLoading, isError } = useMenuItemQuery(itemId);
  const [imageError, setImageError] = useState(false);

  const deleteMutation = useDeleteMenuItemMutation();
  const toggleAvailabilityMutation = useToggleMenuItemAvailabilityMutation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Helper to extract image source matching MenuItemsPage table
  const getImageSrc = (data: any) => {
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

  const primaryName = item ? getLocalizedName(item, 'en', 'Menu Item') : '';
  const amharicName = item ? getLocalizedName(item, 'am') : '';
  const descPair = item ? extractLocalizedPair(item.description) : { en: '', am: '' };
  const imageSrc = !imageError && item ? getImageSrc(item) : null;
  const categoryDisplayName = item ? getCategoryName(item.category || item.categoryId, 'en') : 'Uncategorized';

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${primaryName}"?`)) return;
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success('Menu item deleted successfully');
    } catch {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailabilityMutation.mutateAsync(itemId);
      toast.success(item?.available ? 'Item paused (hidden from menu)' : 'Item is now live on menu');
    } catch {
      toast.error('Failed to update availability status');
    }
  };

  const getPriceRange = () => {
    if (!item?.variants?.length) {
      if (item?.price !== undefined && item?.price !== null) {
        return `ETB ${Number(item.price).toFixed(2)}`;
      }
      return '—';
    }
    const prices = item.variants.map((v: any) => Number(v.price)).filter((p: number) => !isNaN(p));
    if (prices.length === 0) return '—';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? `ETB ${min.toFixed(2)}`
      : `ETB ${min.toFixed(2)} – ETB ${max.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Loading menu item details...</p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold">Item Not Found</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          The requested menu item could not be found or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background pb-12">
      {/* 1. Header Media Banner */}
      <div className="relative w-full h-56 sm:h-64 bg-slate-900 overflow-hidden shrink-0 border-b">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={primaryName}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center mb-3">
              <UtensilsCrossed className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              No Item Image Uploaded
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click edit to upload a dish photo
            </p>
          </div>
        )}

        {/* Gradient shadow for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges & Status */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className="bg-black/60 backdrop-blur-md text-white border-white/10 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              {categoryDisplayName}
            </Badge>

            {item.cuisineOrigin && (
              <Badge
                className={`backdrop-blur-md text-xs font-semibold px-2.5 py-1 shadow-sm border-0 ${
                  item.cuisineOrigin === 'international'
                    ? 'bg-indigo-600/90 text-white'
                    : 'bg-amber-600/90 text-white'
                }`}
              >
                <Globe className="h-3 w-3 mr-1" />
                {item.cuisineOrigin === 'international' ? 'International' : 'Local (Ethiopian)'}
              </Badge>
            )}

            {item.isFasting && (
              <Badge className="bg-emerald-600/90 backdrop-blur-md text-white border-0 text-xs font-semibold px-2.5 py-1 flex items-center gap-1 shadow-sm">
                <Leaf className="h-3 w-3" />
                Fasting (የፆም)
              </Badge>
            )}

            {item.isVeg && !item.isFasting && (
              <Badge className="bg-emerald-600/90 backdrop-blur-md text-white border-0 text-xs font-semibold px-2.5 py-1 flex items-center gap-1 shadow-sm">
                <Leaf className="h-3 w-3" />
                Vegetarian
              </Badge>
            )}

            {item.isSpicy && (
              <Badge className="bg-rose-600/90 backdrop-blur-md text-white border-0 text-xs font-semibold px-2.5 py-1 flex items-center gap-1 shadow-sm">
                <Flame className="h-3 w-3" />
                Spicy
              </Badge>
            )}

            {item.isAlcoholic && (
              <Badge className="bg-amber-600/90 backdrop-blur-md text-white border-0 text-xs font-semibold px-2.5 py-1 flex items-center gap-1 shadow-sm">
                <Beer className="h-3 w-3" />
                Alcoholic ({item.alcoholPercentage || 0}%)
              </Badge>
            )}
          </div>

          <Badge
            className={`backdrop-blur-md text-xs font-bold px-2.5 py-1 shadow-md border-0 ${
              item.available
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-200'
            }`}
          >
            {item.available ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Live on Menu
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Paused
              </span>
            )}
          </Badge>
        </div>

        {/* Bottom Banner Title Overlay */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md truncate">
                {primaryName}
              </h1>
              {amharicName && amharicName !== primaryName && (
                <p className="text-sm font-semibold text-white/80 drop-shadow flex items-center gap-1 mt-0.5">
                  <span>{amharicName}</span>
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-semibold text-white/70 block uppercase tracking-wider">Price</span>
              <span className="text-lg sm:text-xl font-black text-amber-300 drop-shadow">
                {getPriceRange()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="px-5 py-3 border-b bg-card flex items-center justify-between gap-3 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onEdit}
            className="rounded-xl font-bold gap-1.5 shadow-sm text-xs h-8"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Item
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAvailability}
            className="rounded-xl font-semibold gap-1.5 text-xs h-8"
          >
            {item.available ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                Pause Item
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                Make Live
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete this menu item</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 3. Main Details & Tabs */}
      <div className="p-5 space-y-6">
        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-amber-500" /> Price Range
            </span>
            <span className="text-base font-extrabold text-foreground mt-1 truncate">
              {getPriceRange()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" /> Prep Time
            </span>
            <span className="text-base font-extrabold text-foreground mt-1">
              {item.prepTime || '10-15 mins'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-emerald-500" /> Fasting Status
            </span>
            <span className={`text-base font-extrabold mt-1 ${item.isFasting ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
              {item.isFasting ? 'Fasting (የፆም)' : 'Non-Fasting (የፍስክ)'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-purple-500" /> Dish Type
            </span>
            <span className="text-base font-extrabold text-foreground mt-1 capitalize">
              {item.type || 'food'}
            </span>
          </div>
        </div>

        {/* Kitchen Station Routing Card */}
        <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Kitchen Display Station (KDS)
                </h4>
                {item.requiresKitchen === false ? (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200">
                    Direct Service
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                    Kitchen Prep Required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.requiresKitchen === false
                  ? 'This item does not route to kitchen stations and can be served directly upon receipt.'
                  : 'Assign ticket routing for live kitchen preparation stations.'}
              </p>
            </div>
          </div>
          {item.requiresKitchen !== false && (
            <div className="shrink-0">
              <StationSelector menuItem={item} size="default" />
            </div>
          )}
        </div>

        {/* Tabs for In-Depth Data */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl p-1 bg-muted/60">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-bold">
              Overview & Variants
            </TabsTrigger>
            <TabsTrigger value="dietary" className="rounded-lg text-xs font-bold">
              Dietary & Safety
            </TabsTrigger>
            <TabsTrigger value="attributes" className="rounded-lg text-xs font-bold">
              Badges & Metadata
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW & VARIANTS */}
          <TabsContent value="overview" className="space-y-5 pt-4">
            {/* Bilingual Descriptions */}
            <Card className="rounded-2xl shadow-xs border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Item Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {descPair.en ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border text-xs leading-relaxed">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      English (Primary)
                    </span>
                    <p className="text-foreground">{descPair.en}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No English description provided.</p>
                )}

                {descPair.am && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border text-xs leading-relaxed">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Amharic (አማርኛ)
                    </span>
                    <p className="text-foreground font-medium">{descPair.am}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variants Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Portion Variants ({item.variants?.length || 0})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pricing and portion sizes available for this dish
                  </p>
                </div>
              </div>

              {item.variants && item.variants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.variants.map((v: any, index: number) => (
                    <div
                      key={v._id || index}
                      className={`p-4 rounded-2xl border transition-all ${
                        v.isDefault
                          ? 'border-primary/50 bg-primary/5 shadow-xs'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-foreground">{v.name}</span>
                            {v.isDefault && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] py-0 px-1.5 font-bold">
                                Default
                              </Badge>
                            )}
                          </div>
                          {(v.size || v.volume) && (
                            <span className="text-xs text-muted-foreground block mt-0.5">
                              {[v.size, v.volume].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            v.available !== false
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {v.available !== false ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {v.calories && (
                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                              <Flame className="h-3 w-3" /> {v.calories} kcal
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-primary">
                            ETB {Number(v.price || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl border border-dashed text-xs text-muted-foreground">
                  No specific variants created. Uses default item base price.
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: DIETARY & SAFETY */}
          <TabsContent value="dietary" className="space-y-4 pt-4">
            {/* Ingredients */}
            <Card className="rounded-2xl shadow-xs border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Ingredients & Composition
                </CardTitle>
                <CardDescription className="text-xs">
                  Ingredients used in the preparation of this recipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.ingredients && item.ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.ingredients.map((ing: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Check className="h-3 w-3 text-emerald-600" /> {ing}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No specific ingredients listed.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Allergens Notice */}
            <Card className={`rounded-2xl shadow-xs border ${item.allergens?.length ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900 dark:bg-rose-950/20' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" /> Allergens & Warnings
                </CardTitle>
                <CardDescription className="text-xs">
                  Critical information for guest allergen safety
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.allergens && item.allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.allergens.map((alg: string, i: number) => (
                      <Badge
                        key={i}
                        variant="destructive"
                        className="py-1 px-2.5 rounded-lg text-xs font-bold"
                      >
                        ⚠️ {alg}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    <span>No known allergens declared for this item</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dietary Flags Summary */}
            <Card className="rounded-2xl shadow-xs border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Dietary Classifications</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                  <span className="font-semibold">Fasting (የፆም):</span>
                  <span className={`font-bold ${item.isFasting ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {item.isFasting ? 'Yes (Fasting)' : 'No (Non-Fasting)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                  <span className="font-semibold">Cuisine Style:</span>
                  <span className="font-bold capitalize">
                    {item.cuisineOrigin || 'local'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                  <span className="font-semibold">Vegetarian:</span>
                  <span className="font-bold">
                    {item.isVeg ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                  <span className="font-semibold">Spicy:</span>
                  <span className="font-bold">
                    {item.isSpicy ? 'Yes 🔥' : 'Mild'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: BADGES & METADATA */}
          <TabsContent value="attributes" className="space-y-4 pt-4">
            {/* Tags & Search Keywords */}
            <Card className="rounded-2xl shadow-xs border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Tags & Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {item.tags && item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No custom tags added.</p>
                )}
              </CardContent>
            </Card>

            {/* System Identifiers */}
            <Card className="rounded-2xl shadow-xs border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" /> System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Item ID</span>
                  <span className="font-mono font-medium">{item._id || (item as any).id || itemId}</span>
                </div>
                {item.slug && (
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Slug</span>
                    <span className="font-mono font-medium">{item.slug}</span>
                  </div>
                )}
                {item.createdAt && (
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Created Date</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {item.updatedAt && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MenuItemPage;
