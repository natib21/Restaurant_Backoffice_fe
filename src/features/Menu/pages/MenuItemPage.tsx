// src/features/Menu/Pages/MenuItemPage.tsx

import React from 'react';
import {
  Edit3,
  Trash2,
  Utensils,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailabilityMutation,
  useMenuItemQuery,
} from '../../../api/Queries/menuQueries';

type MenuItemPageProps = {
  itemId: string;
  onEdit?: () => void;
};

const MenuItemPage: React.FC<MenuItemPageProps> = ({ itemId, onEdit }) => {
  const { data: item, isLoading, isError } = useMenuItemQuery(itemId);

  const deleteMutation = useDeleteMenuItemMutation();
  const toggleAvailabilityMutation = useToggleMenuItemAvailabilityMutation();

  const handleDelete = async () => {
    if (!confirm(`Delete "${item?.name}" permanently?`)) return;
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success('Deleted successfully');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailabilityMutation.mutateAsync(itemId);
      toast.success(item?.available ? 'Item paused' : 'Item is now live');
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const getPriceRange = () => {
    if (!item?.variants?.length) return '—';
    const prices = item.variants.map((v: any) => Number(v.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? `ETB ${min.toFixed(2)}`
      : `ETB ${min.toFixed(2)} – ETB ${max.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading item details...</p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Item not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image */}
        <div className="relative h-72 w-full overflow-hidden bg-muted">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-1000 hover:scale-110"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-950">
              <Utensils className="h-20 w-20 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                No Image
              </p>
            </div>
          )}

          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {item.isVeg && (
              <Badge className="bg-emerald-600 text-white">
                <Leaf className="h-3 w-3 mr-1" /> Veg
              </Badge>
            )}
            {item.isSpicy && (
              <Badge className="bg-red-600 text-white">
                <Flame className="h-3 w-3 mr-1" /> Spicy
              </Badge>
            )}
            {item.isAlcoholic && (
              <Badge className="bg-amber-600 text-white">
                <Beer className="h-3 w-3 mr-1" /> Alcohol
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <Layers className="h-3.5 w-3.5" />
                {item.category || 'Uncategorized'}
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {item.name}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={onEdit} variant="outline">
                <Edit3 className="h-4 w-4 mr-2" /> Edit Item
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {item.description && (
            <p className="text-base text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4">
              "{item.description}"
            </p>
          )}

          <Separator />

          {/* Availability */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-3">
              {item.available ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-zinc-400" />
              )}
              <div>
                <p className="font-semibold">
                  {item.available ? 'Visible on Menu' : 'Hidden from Menu'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Customers {item.available ? 'can' : 'cannot'} order this
                </p>
              </div>
            </div>
            <Switch
              checked={item.available ?? false}
              onCheckedChange={handleToggleAvailability}
              className="data-[state=on]:bg-emerald-600"
            />
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Package className="h-4 w-4" /> Type
              </div>
              <p className="text-lg font-bold">{item.type || '—'}</p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Clock className="h-4 w-4" /> Prep Time
              </div>
              <p className="text-lg font-bold">{item.prepTime || '—'}</p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Beer className="h-4 w-4" /> Alcohol
              </div>
              <p className="text-lg font-bold">
                {item.isAlcoholic ? `${item.alcoholPercentage || 0}%` : 'None'}
              </p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                Price Range
              </div>
              <p className="text-lg font-bold">{getPriceRange()}</p>
            </div>
          </div>

          {/* Ingredients & Allergens */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-3">
                <Info className="h-4 w-4" /> Ingredients
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients?.length ? (
                  item.ingredients.map((i: string) => (
                    <Badge key={i} variant="secondary">
                      {i}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not specified
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" /> Allergens
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.allergens?.length ? (
                  item.allergens.map((a: string) => (
                    <Badge key={a} variant="destructive">
                      {a}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    None declared
                  </span>
                )}
              </div>
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Variants - Responsive Card Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">
              Variants ({item.variants?.length || 0})
            </h3>

            {item.variants?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {item.variants.map((v: any, i: number) => (
                  <Card
                    key={i}
                    className={`overflow-hidden transition-all hover:shadow-xl ${
                      v.isDefault ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold">{v.name}</p>
                          {v.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <Badge variant={v.available ? 'default' : 'secondary'}>
                          {v.available ? 'In Stock' : 'Sold Out'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {v.size && (
                            <div className="flex items-center gap-2">
                              <Scale className="h-4 w-4" />
                              <span>{v.size}</span>
                            </div>
                          )}
                          {v.volume && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>{v.volume}</span>
                            </div>
                          )}
                          {v.calories && (
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span>{v.calories} kcal</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-2xl font-black text-primary">
                            ETB {Number(v.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-lg text-muted-foreground">
                    No variants defined
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This item has a single price.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemPage;
