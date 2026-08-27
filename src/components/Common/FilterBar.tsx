// src/components/Common/FilterBar.tsx
import React, { useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface QuickFilterOption {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SelectFilterOption {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  width?: string;
}

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  quickFilters?: {
    options: QuickFilterOption[];
    activeKey: string;
    onChange: (key: string) => void;
  };
  selectFilters?: SelectFilterOption[];
  onReset?: () => void;
  advancedFiltersContent?: React.ReactNode;
  activeAdvancedCount?: number;
  onApplyAdvanced?: () => void;
  onResetAdvanced?: () => void;
  customActions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  quickFilters,
  selectFilters = [],
  onReset,
  advancedFiltersContent,
  activeAdvancedCount = 0,
  onApplyAdvanced,
  onResetAdvanced,
  customActions,
  className,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const hasSearch = searchQuery !== undefined && onSearchChange !== undefined;

  const isFiltered =
    Boolean(searchQuery) ||
    (quickFilters && quickFilters.activeKey !== 'all' && quickFilters.activeKey !== '') ||
    selectFilters.some((f) => f.value && f.value !== 'all' && f.value !== '') ||
    activeAdvancedCount > 0;

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-slate-200/70 dark:border-slate-800',
        'bg-white dark:bg-slate-900/50 backdrop-blur-sm',
        'p-3.5 sm:p-4 shadow-sm space-y-3.5 transition-all',
        className
      )}
    >
      {/* Primary Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Search + Selects */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {hasSearch && (
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-9 pl-9 pr-9 text-sm bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {selectFilters.map((filter) => (
            <div key={filter.id} style={{ width: filter.width || '150px' }}>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-9 text-sm bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                  <SelectValue placeholder={filter.placeholder || filter.label} />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800 shadow-lg">
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {advancedFiltersContent && (
            <Button
              variant={advancedOpen || activeAdvancedCount > 0 ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              aria-expanded={advancedOpen}
              className="h-9 gap-1.5 text-sm font-medium rounded-lg"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              Filters
              {activeAdvancedCount > 0 && (
                <Badge className="h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold">
                  {activeAdvancedCount}
                </Badge>
              )}
              {advancedOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </Button>
          )}

          {isFiltered && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}

          {customActions}
        </div>
      </div>

      {/* Quick Filters */}
      {quickFilters && quickFilters.options.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {quickFilters.options.map((chip) => {
            const isActive = quickFilters.activeKey === chip.key;

            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => quickFilters.onChange(chip.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                )}
              >
                {chip.icon && <span className="shrink-0">{chip.icon}</span>}
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span
                    className={cn(
                      'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-slate-200/80 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {advancedOpen && advancedFiltersContent && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {advancedFiltersContent}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {onResetAdvanced && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetAdvanced}
                className="h-8 text-sm font-medium rounded-lg"
              >
                Clear Advanced
              </Button>
            )}
            {onApplyAdvanced && (
              <Button
                size="sm"
                onClick={() => {
                  onApplyAdvanced();
                  setAdvancedOpen(false);
                }}
                className="h-8 text-sm font-medium rounded-lg gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Apply Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};