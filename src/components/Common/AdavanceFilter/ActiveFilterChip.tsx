// src/components/Common/AdvancedFilter/ActiveFilterChips.tsx
import React from 'react';
import { X, RotateCcw, Filter, Layers, ArrowUpDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdvancedFilterField, GroupByOption, QuickFilterOption } from './types';

interface ActiveFilterChipsProps {
  searchQuery: string;
  onClearSearch: () => void;
  quickFilter: string;
  quickFilterOptions?: QuickFilterOption[];
  onClearQuickFilter: () => void;
  advancedFilters: Record<string, any>;
  filterFields?: AdvancedFilterField[];
  onRemoveAdvancedFilter: (key: string) => void;
  groupBy: string | null;
  groupByOptions?: GroupByOption[];
  onClearGroupBy: () => void;
  totalCount: number;
  filteredCount: number;
  selectedCount?: number;
  entityName?: string;
  onResetAll: () => void;
  className?: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  searchQuery,
  onClearSearch,
  quickFilter,
  quickFilterOptions = [],
  onClearQuickFilter,
  advancedFilters,
  filterFields = [],
  onRemoveAdvancedFilter,
  groupBy,
  groupByOptions = [],
  onClearGroupBy,
  totalCount,
  filteredCount,
  selectedCount = 0,
  entityName = 'records',
  onResetAll,
  className = '',
}) => {
  const activeQuickOption = quickFilterOptions.find((q) => q.key === quickFilter && q.key !== 'all');
  const activeGroupOption = groupByOptions.find((g) => g.id === groupBy);

  const activeAdvancedEntries = Object.entries(advancedFilters).filter(([_, val]) => {
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === 'object' && !Array.isArray(val)) {
      return Object.values(val).some((v) => v !== '' && v !== null && v !== undefined);
    }
    return true;
  });

  const hasAnyFilters =
    Boolean(searchQuery) ||
    Boolean(activeQuickOption) ||
    Boolean(groupBy) ||
    activeAdvancedEntries.length > 0;

  if (!hasAnyFilters && selectedCount === 0) {
    return null;
  }

  const formatFilterValue = (fieldDef: AdvancedFilterField | undefined, val: any): string => {
    if (!fieldDef) return String(val);
    if (fieldDef.type === 'select' && fieldDef.options) {
      const opt = fieldDef.options.find((o) => o.value === val);
      return opt ? opt.label : String(val);
    }
    if (fieldDef.type === 'multi-select' && Array.isArray(val)) {
      return val
        .map((v) => {
          const opt = fieldDef.options?.find((o) => o.value === v);
          return opt ? opt.label : v;
        })
        .join(', ');
    }
    if (fieldDef.type === 'number-range' && typeof val === 'object') {
      const parts = [];
      if (val.min) parts.push(`≥ ${val.min}`);
      if (val.max) parts.push(`≤ ${val.max}`);
      return parts.join(' & ');
    }
    if (fieldDef.type === 'date-range' && typeof val === 'object') {
      const parts = [];
      if (val.from) parts.push(new Date(val.from).toLocaleDateString());
      if (val.to) parts.push(new Date(val.to).toLocaleDateString());
      return parts.join(' → ');
    }
    if (fieldDef.type === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    return String(val);
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-1 py-1 text-xs ${className}`}
    >
      {/* Left: Active Chips list */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="h-3 w-3" />
          Active:
        </span>

        {/* Search Query Chip */}
        {searchQuery && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
            <span className="text-slate-400">Search:</span>
            <span className="font-bold">"{searchQuery}"</span>
            <button
              type="button"
              onClick={onClearSearch}
              className="ml-0.5 p-0.5 rounded-md hover:bg-indigo-200/60 dark:hover:bg-indigo-900 text-indigo-500 hover:text-indigo-700"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        {/* Quick Filter Chip */}
        {activeQuickOption && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
            <Tag className="h-3 w-3 text-sky-500" />
            <span className="font-bold">{activeQuickOption.label}</span>
            <button
              type="button"
              onClick={onClearQuickFilter}
              className="ml-0.5 p-0.5 rounded-md hover:bg-sky-200/60 dark:hover:bg-sky-900 text-sky-500 hover:text-sky-700"
              aria-label="Clear quick filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        {/* Group By Chip */}
        {activeGroupOption && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
            <Layers className="h-3 w-3 text-amber-500" />
            <span className="text-slate-400">Group:</span>
            <span className="font-bold">{activeGroupOption.label}</span>
            <button
              type="button"
              onClick={onClearGroupBy}
              className="ml-0.5 p-0.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-900 text-amber-500 hover:text-amber-700"
              aria-label="Clear grouping"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        {/* Advanced Filter Chips */}
        {activeAdvancedEntries.map(([key, val]) => {
          const fieldDef = filterFields.find((f) => f.id === key);
          const label = fieldDef?.label || key;
          const displayVal = formatFilterValue(fieldDef, val);

          return (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
            >
              <span className="text-slate-400">{label}:</span>
              <span className="font-bold max-w-[180px] truncate">{displayVal}</span>
              <button
                type="button"
                onClick={() => onRemoveAdvancedFilter(key)}
                className="ml-0.5 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label={`Remove filter ${label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}

        {/* Clear All Button */}
        {hasAnyFilters && (
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1"
          >
            <RotateCcw className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Right: Results counter badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredCount}</span> of{' '}
          <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span> {entityName}
        </span>
        {selectedCount > 0 && (
          <Badge className="bg-primary text-white font-bold text-[11px] px-2 py-0.5 rounded-full">
            {selectedCount} selected
          </Badge>
        )}
      </div>
    </div>
  );
};
