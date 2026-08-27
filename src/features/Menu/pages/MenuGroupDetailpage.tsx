// src/features/Menu/pages/MenuGroupDetailpage.tsx

import React, { useState } from 'react';
import {
  Edit3,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Package,
  Info,
  ChevronRight,
  UtensilsCrossed,
  Building2,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMenuGroupQuery } from '../../../api/Queries/menuQueries';
import {
  getLocalizedName,
  getLocalizedDescription,
  extractLocalizedPair,
} from '../lib/localizationUtils';

type MenuGroupDetailPageProps = {
  groupId: string;
  onEdit?: () => void;
  onOpenItemDetail?: (itemId: string) => void;
};

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

const MenuGroupDetailPage: React.FC<MenuGroupDetailPageProps> = ({
  groupId,
  onEdit,
  onOpenItemDetail,
}) => {
  const { data: group, isLoading, isError } = useMenuGroupQuery(groupId);
  const [bannerError, setBannerError] = useState(false);

  const groupNameEn = group ? getLocalizedName(group, 'en', 'Menu Group') : '';
  const groupNameAm = group ? getLocalizedName(group, 'am') : '';
  const groupDesc = group ? extractLocalizedPair(group.description) : { en: '', am: '' };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'always':
        return <Eye className="h-4 w-4 text-emerald-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'hidden':
        return <EyeOff className="h-4 w-4 text-slate-400" />;
      default:
        return null;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'always':
        return (
          <Badge className="bg-emerald-600 text-white border-0 text-xs font-bold px-2.5 py-0.5">
            Always Active
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-600 text-white border-0 text-xs font-bold px-2.5 py-0.5">
            Scheduled
          </Badge>
        );
      case 'hidden':
        return (
          <Badge variant="secondary" className="text-xs font-bold px-2.5 py-0.5">
            Hidden
          </Badge>
        );
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  const getPriceRange = (variants: any[] = [], defaultPrice?: number) => {
    if ((!variants || variants.length === 0) && defaultPrice !== undefined && defaultPrice !== null) {
      return `ETB ${Number(defaultPrice).toFixed(2)}`;
    }
    if (!variants || variants.length === 0) return '—';
    const prices = variants.map((v) => Number(v.price)).filter((p) => !isNaN(p) && p > 0);
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
        <p className="text-xs font-medium text-muted-foreground">Loading menu group details...</p>
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Layers className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold">Menu Group Not Found</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          The requested menu group could not be loaded or has been deleted.
        </p>
      </div>
    );
  }

  const bannerSrc = !bannerError && group.bannerImage ? getItemImageSrc({ image: group.bannerImage }) : null;

  return (
    <div className="flex flex-col h-full bg-background pb-12">
      {/* 1. Header Banner */}
      <div className="relative w-full h-48 sm:h-56 bg-slate-900 overflow-hidden shrink-0 border-b">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt={groupNameEn}
            onError={() => setBannerError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-2 backdrop-blur-md">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10 text-xs font-semibold px-2.5 py-1">
              {group.isSystemDefault ? 'System Default Group' : 'Custom Collection'}
            </Badge>
            {group.isAlcoholMenu && (
              <Badge className="bg-amber-600/90 text-white backdrop-blur-md border-0 text-xs font-semibold px-2.5 py-1">
                Alcohol Menu
              </Badge>
            )}
          </div>
          {getVisibilityBadge(group.visibility)}
        </div>

        <div className="absolute bottom-4 left-5 right-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                {groupNameEn}
              </h1>
              {groupNameAm && groupNameAm !== groupNameEn && (
                <p className="text-sm font-semibold text-white/80 drop-shadow mt-0.5">
                  {groupNameAm}
                </p>
              )}
            </div>

            <Button
              onClick={onEdit}
              size="sm"
              className="rounded-xl font-bold gap-1.5 shadow-md shrink-0 text-xs h-8"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Group
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Body Content */}
      <div className="p-5 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border bg-card/60 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary" /> Total Dishes
            </span>
            <span className="text-lg font-black text-foreground mt-1">
              {group.items?.length || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border bg-card/60 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              {getVisibilityIcon(group.visibility)} Visibility
            </span>
            <span className="text-sm font-bold text-foreground mt-1 capitalize">
              {group.visibility || 'Always'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border bg-card/60 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-500" /> Sort Priority
            </span>
            <span className="text-lg font-black text-foreground mt-1">
              {group.priority !== undefined ? group.priority : 0}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border bg-card/60 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Branches
            </span>
            <span className="text-sm font-bold text-foreground mt-1 truncate">
              {group.branches?.length ? `${group.branches.length} locations` : 'All Branches'}
            </span>
          </div>
        </div>

        {/* Descriptions if available */}
        {(groupDesc.en || groupDesc.am) && (
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-primary" /> About This Group
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed">
              {groupDesc.en && <p className="text-foreground">{groupDesc.en}</p>}
              {groupDesc.am && (
                <p className="text-muted-foreground font-medium">{groupDesc.am}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dishes List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">
                Included Dishes ({group.items?.length || 0})
              </h3>
              <p className="text-xs text-muted-foreground">
                Items ordered as displayed on customer digital menus and POS
              </p>
            </div>
          </div>

          {group.items && group.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map((item: any, index: number) => {
                const menuObj = typeof item.menu === 'object' ? item.menu : {};
                const menuItemId = menuObj?._id || item.menu;
                const itemEnName = getLocalizedName(
                  item.customName || menuObj,
                  'en',
                  'Dish'
                );
                const itemAmName = getLocalizedName(
                  item.customName || menuObj,
                  'am'
                );
                const itemDesc = extractLocalizedPair(
                  item.customDescription || menuObj?.description
                );
                const itemImage = getItemImageSrc(menuObj);
                const displayPrice =
                  item.overridePrice !== null && item.overridePrice !== undefined
                    ? `ETB ${Number(item.overridePrice).toFixed(2)}`
                    : getPriceRange(menuObj?.variants, menuObj?.price);

                return (
                  <div
                    key={index}
                    onClick={() => menuItemId && onOpenItemDetail?.(menuItemId)}
                    className="group relative flex gap-3 p-3 rounded-2xl border bg-card hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-primary/40"
                  >
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={itemEnName}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {itemEnName}
                          </h4>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        {itemAmName && itemAmName !== itemEnName && (
                          <p className="text-[11px] text-muted-foreground font-medium truncate">
                            {itemAmName}
                          </p>
                        )}
                        {(itemDesc.en || itemDesc.am) && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {itemDesc.en || itemDesc.am}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 mt-1">
                        <span className="text-xs font-black text-primary">
                          {displayPrice}
                        </span>
                        {item.isHidden && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1">
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed text-xs text-muted-foreground">
              No dishes assigned to this group yet. Click "Edit Group" to add items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuGroupDetailPage;
