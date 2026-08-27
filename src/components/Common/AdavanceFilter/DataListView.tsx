// src/components/Common/AdvancedFilter/DataListView.tsx
import React from 'react';
import { MoreVertical, Inbox, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {type DensityMode } from './types';

interface DataListViewProps<T> {
  data: T[];
  isLoading?: boolean;
  loadingCount?: number;
  selectable?: boolean;
  selectedRows?: T[];
  onToggleSelectRow?: (item: T, index: number, selected: boolean) => void;
  onItemClick?: (item: T, index: number) => void;
  getItemId: (item: T, index: number) => string | number;
  density?: DensityMode;
  renderCustomListItem?: (
    item: T,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataListView<T extends Record<string, any>>({
  data = [],
  isLoading = false,
  loadingCount = 6,
  selectable = false,
  selectedRows = [],
  onToggleSelectRow,
  onItemClick,
  getItemId,
  density = 'comfortable',
  renderCustomListItem,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'No records match the current filter settings.',
  className = '',
}: DataListViewProps<T>) {
  const rowPadding =
    density === 'compact'
      ? 'py-2 px-3'
      : density === 'spacious'
      ? 'py-4 px-5'
      : 'py-3 px-4';

  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 ${className}`}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
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
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs ${className}`}
    >
      {data.map((item, index) => {
        const id = getItemId(item, index);
        const isSelected = selectedRows.some((r, i) => getItemId(r, i) === id);

        if (renderCustomListItem) {
          return (
            <div key={String(id)} onClick={() => onItemClick && onItemClick(item, index)}>
              {renderCustomListItem(item, isSelected, (checked) =>
                onToggleSelectRow && onToggleSelectRow(item, index, checked)
              )}
            </div>
          );
        }

        const title = item.name || item.title || item.tableNumber || item.orderNumber || `Record #${index + 1}`;
        const subtitle = item.subtitle || item.category || item.section || item.email || item.branch?.name;
        const status = item.status || item.state || (item.available !== undefined ? (item.available ? 'Active' : 'Paused') : null);
        const price = item.price || item.totalAmount || item.capacity;

        return (
          <div
            key={String(id)}
            onClick={() => onItemClick && onItemClick(item, index)}
            className={`group flex items-center justify-between gap-3 ${rowPadding} transition-colors ${
              isSelected
                ? 'bg-primary/5 dark:bg-primary/10'
                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
            } ${onItemClick ? 'cursor-pointer' : ''}`}
          >
            {/* Left: Checkbox + Title / Subtitle */}
            <div className="flex items-center gap-3 min-w-0">
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

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {title}
                  </h5>
                  {status && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold px-1.5 py-0 rounded capitalize ${
                        String(status).toLowerCase() === 'active' ||
                        String(status).toLowerCase() === 'available' ||
                        String(status).toLowerCase() === 'ready'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {String(status)}
                    </Badge>
                  )}
                </div>

                {subtitle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Metrics / View Button */}
            <div className="flex items-center gap-4 shrink-0 text-xs">
              {price !== undefined && (
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {typeof price === 'number' ? `ETB ${price.toFixed(2)}` : price}
                </span>
              )}

              <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
