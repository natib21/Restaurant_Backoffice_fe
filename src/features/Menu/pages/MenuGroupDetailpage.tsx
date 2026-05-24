// src/features/Menu/Components/MenuGroupDetailPage.tsx

import React from 'react';
import {
  Edit3,
  Clock,
  Calendar,
  EyeOff,
  Package,
  Info,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMenuGroupQuery } from '../../../api/Queries/menuQueries';

type MenuGroupDetailPageProps = {
  groupId: string;
  onEdit?: () => void;
  onOpenItemDetail?: (itemId: string) => void;
};

const MenuGroupDetailPage: React.FC<MenuGroupDetailPageProps> = ({
  groupId,
  onEdit,
  onOpenItemDetail,
}) => {
  const { data: group, isLoading, isError } = useMenuGroupQuery(groupId);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'always':
        return <Clock className="h-5 w-5" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5" />;
      case 'hidden':
        return <EyeOff className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'always':
        return 'Always Visible';
      case 'scheduled':
        return 'Scheduled Visibility';
      case 'hidden':
        return 'Hidden';
      default:
        return visibility;
    }
  };

  const getPriceRange = (variants: any[] = []) => {
    if (variants.length === 0) return '—';
    const prices = variants.map((v) => Number(v.price)).filter((p) => p > 0);
    if (prices.length === 0) return '—';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? `ETB ${min.toFixed(2)}`
      : `ETB ${min.toFixed(2)} – ETB ${max.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading group details...
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="p-8 text-center text-destructive">Group not found</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Banner Image */}
        {group.bannerImage ? (
          <div className="relative h-64 w-full overflow-hidden bg-muted">
            <img
              src={group.bannerImage}
              alt={group.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold">{group.name}</h1>
            </div>
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              {!group.bannerImage && (
                <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
              )}
              {group.description && (
                <p className="text-muted-foreground text-lg">
                  {group.description}
                </p>
              )}
            </div>
            <Button onClick={onEdit} variant="outline" size="lg">
              <Edit3 className="mr-2 h-5 w-5" /> Edit Group
            </Button>
          </div>

          <Separator />

          {/* Visibility & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-2">
                {getVisibilityIcon(group.visibility)}
                <p className="font-medium">Visibility</p>
              </div>
              <p className="text-lg font-bold capitalize">
                {getVisibilityText(group.visibility)}
              </p>
            </div>

            <div className="p-5 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5" />
                <p className="font-medium">Items</p>
              </div>
              <p className="text-2xl font-bold">{group.items?.length || 0}</p>
            </div>

            <div className="p-5 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5" />
                <p className="font-medium">Status</p>
              </div>
              <Badge
                variant={
                  group.visibility === 'hidden' ? 'secondary' : 'default'
                }
                className="text-base py-1"
              >
                {group.visibility === 'hidden' ? 'Inactive' : 'Active'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Items in Group */}
          <div>
            <h2 className="text-xl font-bold mb-6">Items in this Group</h2>

            {group.items?.length ? (
              <div className="grid grid-cols-2 gap-6 ">
                {group.items.map((item: any, index: number) => {
                  const menuItemId = item.menu?._id || item.menu?._id;
                  const displayName =
                    item.customName || item.menu?.name || 'Unnamed Item';
                  const displayPrice =
                    item.overridePrice !== null &&
                    item.overridePrice !== undefined
                      ? `ETB ${Number(item.overridePrice).toFixed(2)}`
                      : getPriceRange(item.menu?.variants);

                  return (
                    <div
                      key={index}
                      className="group flex gap-4 border-none p-1  rounded-xl border bg-card hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() =>
                        menuItemId && onOpenItemDetail?.(menuItemId)
                      }
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Image */}
                        {item.menu?.image ? (
                          <img
                            src={item.menu.image}
                            alt={displayName}
                            className="h-20 w-20 rounded-lg object-cover flex-shrink-0 border"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border">
                            <span className="text-xs text-muted-foreground text-center">
                              No Image
                            </span>
                          </div>
                        )}

                        {/* Content */}

                        {/* Top: Name + Badges */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg">{displayName}</h4>
                            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {item.customDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {item.customDescription}
                            </p>
                          )}

                          {/* Hidden badge */}
                          {item.isHidden && (
                            <Badge variant="secondary" className="w-fit">
                              Hidden
                            </Badge>
                          )}
                        </div>

                        {/* Bottom: Price */}
                        <p className="text-sm text-center sm:text-left font-black text-primary mt-4 ">
                          {displayPrice}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No items added to this group yet.</p>
                <p className="text-sm mt-2">Click Edit to add menu items.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuGroupDetailPage;
