// src/components/Common/AdvancedFilter/AdvancedFilterBar.tsx
import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  Columns3,
  AlignJustify,
  Download,
  Bookmark,
  Layers,
  Check,
  ChevronDown,
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
 type ViewMode,
  type DensityMode,
 type  QuickFilterOption,
 type GroupByOption,
 type SortOption,
 type SavedPreset,
} from './types';
import { type ColumnDef  } from '../DataTable';

interface AdvancedFilterBarProps<T> {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Quick Filters
  quickFilters?: QuickFilterOption[];
  activeQuickFilter: string;
  onQuickFilterChange: (key: string) => void;

  // Advanced Filters
  onToggleFilterDrawer: () => void;
  isFilterDrawerOpen: boolean;
  activeAdvancedCount: number;
  hasFilterFields: boolean;

  // Group By
  groupByOptions?: GroupByOption<T>[];
  activeGroupBy: string | null;
  onGroupByChange: (groupBy: string | null) => void;

  // View Modes
  supportedViewModes?: ViewMode[];
  activeViewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // Density
  activeDensity: DensityMode;
  onDensityChange: (density: DensityMode) => void;

  // Sorting
  sortOptions?: SortOption<T>[];
  activeSortField: string | null;
  activeSortDirection: 'asc' | 'desc' | null;
  onSortChange: (field: string | null, direction: 'asc' | 'desc' | null) => void;

  // Presets
  presets?: SavedPreset[];
  activePresetId?: string;
  onSelectPreset?: (preset: SavedPreset) => void;
  onDeletePreset?: (presetId: string) => void;

  // Columns visibility (for Table view)
  columns?: ColumnDef<T>[];
  hiddenColumnIds?: string[];
  onToggleColumnVisibility?: (columnId: string) => void;

  // Export
  onExport?: (format: 'csv' | 'json') => void;

  // Reset
  onResetAll?: () => void;
  hasActiveFilters?: boolean;

  // Extras
  extraActions?: React.ReactNode;
  className?: string;
}

const viewModeIcons: Record<ViewMode, { icon: React.ReactNode; label: string }> = {
  table: { icon: <LayoutList className="h-4 w-4" />, label: 'Table View' },
  grid: { icon: <LayoutGrid className="h-4 w-4" />, label: 'Card Grid' },
  kanban: { icon: <Columns3 className="h-4 w-4" />, label: 'Kanban Board' },
  list: { icon: <AlignJustify className="h-4 w-4" />, label: 'Compact List' },
};

export function AdvancedFilterBar<T extends Record<string, any>>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  quickFilters = [],
  activeQuickFilter,
  onQuickFilterChange,
  onToggleFilterDrawer,
  isFilterDrawerOpen,
  activeAdvancedCount,
  hasFilterFields,
  groupByOptions = [],
  activeGroupBy,
  onGroupByChange,
  supportedViewModes = ['table', 'grid', 'kanban', 'list'],
  activeViewMode,
  onViewModeChange,
  activeDensity,
  onDensityChange,
  sortOptions = [],
  activeSortField,
  activeSortDirection,
  onSortChange,
  presets = [],
  activePresetId = 'preset-all',
  onSelectPreset,
  onDeletePreset,
  columns = [],
  hiddenColumnIds = [],
  onToggleColumnVisibility,
  onExport,
  onResetAll,
  hasActiveFilters,
  extraActions,
  className = '',
}: AdvancedFilterBarProps<T>) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (/ or ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-2xs space-y-3 ${className}`}
    >
      {/* Top Main Toolbar Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Side: Search + Group By + Presets */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Global Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-14 h-9 text-xs bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-xl focus-visible:bg-white dark:focus-visible:bg-slate-900 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                ⌘K
              </span>
            )}
          </div>

          {/* Group By Selector */}
          {groupByOptions.length > 0 && (
            <div className="w-36">
              <Select
                value={activeGroupBy || 'none'}
                onValueChange={(val) => onGroupByChange(val === 'none' ? null : val)}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {activeGroupBy
                        ? groupByOptions.find((g) => g.id === activeGroupBy)?.label
                        : 'Group By'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs font-medium">
                    No Grouping
                  </SelectItem>
                  {groupByOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Saved View Presets Dropdown */}
          {presets.length > 1 && onSelectPreset && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5 text-xs font-semibold rounded-xl border-slate-200/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/40 gap-1.5"
                >
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[100px] truncate">
                    {presets.find((p) => p.id === activePresetId)?.name || 'Views'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-xl">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Saved Views & Presets
                </DropdownMenuLabel>
                {presets.map((preset) => {
                  const isActive = preset.id === activePresetId;
                  return (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => onSelectPreset(preset)}
                      className={`text-xs flex items-center justify-between cursor-pointer ${
                        isActive ? 'bg-primary/10 text-primary font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isActive ? (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <span className="w-3.5" />
                        )}
                        <span className="truncate">{preset.name}</span>
                      </div>
                      {!preset.isSystem && onDeletePreset && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePreset(preset.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete view preset"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right Side: Advanced Filters Toggle, View Switcher & Controls */}
        <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
          {/* Advanced Filter Panel Toggle Button */}
          {hasFilterFields && (
            <Button
              variant={isFilterDrawerOpen || activeAdvancedCount > 0 ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleFilterDrawer}
              className={`h-9 gap-1.5 text-xs font-bold rounded-xl border-slate-200/80 dark:border-slate-700/80 transition-all ${
                activeAdvancedCount > 0 && !isFilterDrawerOpen
                  ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                  : ''
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeAdvancedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 px-1 rounded-full text-[10px] font-black bg-primary text-white dark:bg-white dark:text-slate-900"
                >
                  {activeAdvancedCount}
                </Badge>
              )}
            </Button>
          )}

          {/* View Mode Switcher (Extensible Segmented Control) */}
          {supportedViewModes.length > 1 && (
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <TooltipProvider delayDuration={150}>
                {supportedViewModes.map((mode) => {
                  const isActive = activeViewMode === mode;
                  const item = viewModeIcons[mode];
                  return (
                    <Tooltip key={mode}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onViewModeChange(mode)}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                            isActive
                              ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {item.icon}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          )}

          {/* More Controls Dropdown (Density, Columns, Export) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300"
                title="View & Export Settings"
              >
                <Sliders className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              {/* Density options */}
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Display Density
              </DropdownMenuLabel>
              {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map((d) => (
                <DropdownMenuItem
                  key={d}
                  onClick={() => onDensityChange(d)}
                  className={`text-xs capitalize cursor-pointer ${
                    activeDensity === d ? 'font-bold text-primary bg-primary/5' : ''
                  }`}
                >
                  {activeDensity === d && <Check className="h-3.5 w-3.5 mr-2 text-primary" />}
                  <span className={activeDensity !== d ? 'ml-5' : ''}>{d}</span>
                </DropdownMenuItem>
              ))}

              {/* Column customizer (if columns available) */}
              {columns.length > 0 && onToggleColumnVisibility && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Visible Columns
                  </DropdownMenuLabel>
                  <div className="max-h-48 overflow-y-auto">
                    {columns.map((col) => {
                      const isVisible = !hiddenColumnIds.includes(col.id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={col.id}
                          checked={isVisible}
                          onCheckedChange={() => onToggleColumnVisibility(col.id)}
                          className="text-xs cursor-pointer"
                        >
                          {typeof col.header === 'string' ? col.header : col.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Export items */}
              {onExport && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Data
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onExport('csv')}
                    className="text-xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onExport('json')}
                    className="text-xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    Export as JSON
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset All */}
          {hasActiveFilters && onResetAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetAll}
              className="h-9 px-2 text-xs font-semibold text-slate-500 hover:text-rose-600 rounded-xl"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Quick Filter Chips Row */}
      {quickFilters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
          {quickFilters.map((chip) => {
            const isActive = activeQuickFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onQuickFilterChange(chip.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {chip.icon && <span className="shrink-0">{chip.icon}</span>}
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
