// src/components/Common/AdvancedFilter/DataKanbanView.tsx
import React, { useMemo } from 'react';
import {
  MoreVertical,
  Plus,
  Inbox,
  ArrowRight,
  MoveRight,
  Circle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {type KanbanColumnConfig } from './types';

interface DataKanbanViewProps<T> {
  data: T[];
  kanbanColumns?: KanbanColumnConfig<T>[];
  groupByField?: keyof T | string;
  onItemClick?: (item: T, index: number) => void;
  getItemId: (item: T, index: number) => string | number;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataKanbanView<T extends Record<string, any>>({
  data = [],
  kanbanColumns,
  groupByField = 'status',
  onItemClick,
  getItemId,
  emptyIcon,
  emptyTitle = 'No records in Kanban',
  emptyDescription = 'No records match the current filter criteria.',
  className = '',
}: DataKanbanViewProps<T>) {
  // Generate columns either from provided kanbanColumns or auto-group from data
  const columns = useMemo<KanbanColumnConfig<T>[]>(() => {
    if (kanbanColumns && kanbanColumns.length > 0) {
      return kanbanColumns;
    }

    // Auto-discover unique column values from dataset
    const uniqueValues = Array.from(
      new Set(
        data
          .map((item) => {
            const val = item[groupByField];
            return val ? String(val) : 'Unassigned';
          })
          .filter(Boolean)
      )
    );

    if (uniqueValues.length === 0) {
      return [
        { id: 'all', title: 'All Items', matcher: () => true },
      ];
    }

    return uniqueValues.map((val) => ({
      id: val.toLowerCase(),
      title: val.charAt(0).toUpperCase() + val.slice(1),
      matcher: (item: T) => {
        const itemVal = item[groupByField] ? String(item[groupByField]).toLowerCase() : 'unassigned';
        return itemVal === val.toLowerCase();
      },
    }));
  }, [kanbanColumns, data, groupByField]);

  // Distribute items into columns
  const columnData = useMemo(() => {
    const result: Record<string, T[]> = {};
    columns.forEach((col) => {
      result[col.id] = [];
    });

    data.forEach((item) => {
      for (const col of columns) {
        if (col.matcher) {
          if (col.matcher(item)) {
            result[col.id].push(item);
            break;
          }
        } else {
          const itemVal = item[groupByField] ? String(item[groupByField]).toLowerCase() : 'unassigned';
          if (itemVal === col.id.toLowerCase()) {
            result[col.id].push(item);
            break;
          }
        }
      }
    });

    return result;
  }, [columns, data, groupByField]);

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
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4 ${className}`}
    >
      {columns.map((col) => {
        const items = columnData[col.id] || [];

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3 min-w-[260px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1.5 py-1 mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    col.color ? col.color : 'bg-primary'
                  }`}
                />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {col.title}
                </h4>
              </div>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 rounded-full text-[10px] font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs"
              >
                {items.length}
              </Badge>
            </div>

            {/* Column Items list */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh] pr-0.5">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 p-6 text-center text-xs text-slate-400 bg-white/40 dark:bg-slate-900/30">
                  No items
                </div>
              ) : (
                items.map((item, index) => {
                  const id = getItemId(item, index);
                  const title = item.name || item.title || item.tableNumber || item.orderNumber || `Item #${index + 1}`;
                  const subtitle = item.subtitle || item.category || item.section || item.email;
                  const price = item.price || item.totalAmount || item.capacity;

                  return (
                    <Card
                      key={String(id)}
                      onClick={() => onItemClick && onItemClick(item, index)}
                      className={`rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all p-3.5 space-y-2 ${
                        onItemClick ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                          {title}
                        </h5>
                      </div>

                      {subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {subtitle}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        {price !== undefined ? (
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {typeof price === 'number' ? `ETB ${price.toFixed(2)}` : price}
                          </span>
                        ) : (
                          <span className="text-slate-400">ID: {String(id).slice(-4)}</span>
                        )}

                        <span className="font-semibold text-primary hover:underline flex items-center gap-0.5 text-[10px]">
                          Details →
                        </span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
