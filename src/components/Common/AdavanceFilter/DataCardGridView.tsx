// src/components/Common/AdvancedFilter/DataCardGridView.tsx
import React from 'react';
import {
  MoreVertical,
  Check,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {type DensityMode } from './types';

interface DataCardGridViewProps<T> {
  data: T[];
  isLoading?: boolean;
  loadingCount?: number;
  selectable?: boolean;
  selectedRows?: T[];
  onToggleSelectRow?: (item: T, index: number, selected: boolean) => void;
  onItemClick?: (item: T, index: number) => void;
  getItemId: (item: T, index: number) => string | number;
  density?: DensityMode;
  renderCustomCard?: (
    item: T,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
}

export function DataCardGridView<T extends Record<string, any>>({
  data = [],
  isLoading = false,
  loadingCount = 8,
  selectable = false,
  selectedRows = [],
  onToggleSelectRow,
  onItemClick,
  getItemId,
  density = 'comfortable',
  renderCustomCard,
  emptyIcon,
  emptyTitle = 'No items found',
  emptyDescription = 'There are no records matching your current filter settings.',
  emptyActionLabel,
  onEmptyAction,
  className = '',
}: DataCardGridViewProps<T>) {
  // Density grid gap & padding mappings
  const gridGap =
    density === 'compact'
      ? 'gap-3'
      : density === 'spacious'
      ? 'gap-6'
      : 'gap-4';

  const cardPadding =
    density === 'compact'
      ? 'p-3.5'
      : density === 'spacious'
      ? 'p-5 sm:p-6'
      : 'p-4 sm:p-5';

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridGap} ${className}`}
      >
        {Array.from({ length: loadingCount }).map((_, i) => (
          <Card
            key={i}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            {emptyIcon || <Inbox className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {emptyTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {emptyDescription}
            </p>
          </div>
          {emptyActionLabel && onEmptyAction && (
            <Button
              size="sm"
              onClick={onEmptyAction}
              className="mt-2 text-xs font-semibold rounded-xl"
            >
              {emptyActionLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridGap} ${className}`}
    >
      {data.map((item, index) => {
        const id = getItemId(item, index);
        const isSelected = selectedRows.some((r, i) => getItemId(r, i) === id);

        if (renderCustomCard) {
          return (
            <div key={String(id)} onClick={() => onItemClick && onItemClick(item, index)}>
              {renderCustomCard(item, isSelected, (checked) =>
                onToggleSelectRow && onToggleSelectRow(item, index, checked)
              )}
            </div>
          );
        }

        // Generic High-Fidelity Data Card Renderer
        const title = item.name || item.title || item.tableNumber || item.orderNumber || `Record #${index + 1}`;
        const subtitle = item.subtitle || item.category || item.section || item.email || item.branch?.name;
        const status = item.status || item.state || (item.available !== undefined ? (item.available ? 'Active' : 'Paused') : null);
        const image = item.image || item.imageUrl || item.avatar;
        const price = item.price || item.totalAmount || item.capacity;

        return (
          <Card
            key={String(id)}
            onClick={() => onItemClick && onItemClick(item, index)}
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm ${
              isSelected
                ? 'border-primary ring-2 ring-primary/20 bg-primary/2 dark:bg-primary/5'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            } ${onItemClick ? 'cursor-pointer' : ''}`}
          >
            <CardContent className={`${cardPadding} space-y-3`}>
              {/* Header: Checkbox + Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectable && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onToggleSelectRow &&
                          onToggleSelectRow(item, index, Boolean(checked))
                        }
                        aria-label={`Select ${title}`}
                      />
                    </div>
                  )}
                  {image && (
                    <img
                      src={image}
                      alt={title}
                      className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                  )}
                </div>

                {status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      String(status).toLowerCase() === 'active' ||
                      String(status).toLowerCase() === 'available' ||
                      String(status).toLowerCase() === 'ready' ||
                      String(status).toLowerCase() === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : String(status).toLowerCase() === 'occupied' ||
                          String(status).toLowerCase() === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {String(status)}
                  </Badge>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                  {title}
                </h4>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Attributes / Key-Value summary */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                {price !== undefined ? (
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {typeof price === 'number' ? `ETB ${price.toFixed(2)}` : price}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">ID: {String(id).slice(-6)}</span>
                )}

                <span className="text-[11px] font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                  View →
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
