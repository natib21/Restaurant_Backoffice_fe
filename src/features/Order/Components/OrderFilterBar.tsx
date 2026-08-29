import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Kanban,
  Table as TableIcon,
  Volume2,
  VolumeX,
  Clock,
  ArrowUpDown,
  UtensilsCrossed,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
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
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  AdvancedFilterDrawer,
  ActiveFilterChips,
  type AdvancedFilterField,
  type SavedPreset,
} from '@/components/Common/AdavanceFilter';
import { DEFAULT_ORDER_FILTER_FIELDS } from '../lib/orderFilterUtils';
import { toast } from 'sonner';

export interface OrderFilterState {
  search: string;
  orderType: 'all' | 'dine_in' | 'takeaway' | 'delivery';
  status: string;
  paymentStatus: 'all' | 'unpaid' | 'paid';
  urgency: 'all' | 'urgent' | 'normal';
  sortBy: 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'urgency';
  viewMode: 'kanban' | 'grid' | 'table';
  advancedFilters?: Record<string, any>;
}

interface OrderFilterBarProps {
  filters: OrderFilterState;
  onFilterChange: (filters: Partial<OrderFilterState>) => void;
  onResetFilters: () => void;
  statusCounts?: Record<string, number>;
  totalCount?: number;
  filteredCount?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onTestSound?: () => void;
  allowedTypes?: Array<'dine_in' | 'takeaway' | 'delivery'>;
  statusOptions?: Array<{ key: string; label: string; icon?: any }>;
  customFilterFields?: AdvancedFilterField[];
}

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  statusCounts = {},
  totalCount = 0,
  filteredCount,
  soundEnabled = true,
  onToggleSound,
  onTestSound,
  allowedTypes,
  statusOptions = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Cooking' },
    { key: 'ready', label: 'Ready' },
    { key: 'served', label: 'Served' },
    { key: 'out_for_delivery', label: 'Dispatched' },
    { key: 'completed', label: 'Completed' },
    { key: 'canceled', label: 'Canceled' },
  ],
  customFilterFields,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Storage key for preset views
  const storageKey = `resto_order_views_${allowedTypes?.join('_') || 'all'}`;
  const [presets, setPresets] = useState<SavedPreset[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate active advanced filter count
  const advancedFilterValues = filters.advancedFilters || {};
  const activeAdvancedCount = Object.entries(advancedFilterValues).filter(
    ([_, val]) => {
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      if (typeof val === 'object' && !Array.isArray(val)) {
        return Object.values(val).some(
          (v) => v !== '' && v !== null && v !== undefined
        );
      }
      return true;
    }
  ).length;

  // Filter fields configuration
  const filterFields: AdvancedFilterField[] = (
    customFilterFields || DEFAULT_ORDER_FILTER_FIELDS
  ).filter((field) => {
    if (field.id === 'orderType' && allowedTypes && allowedTypes.length === 1) {
      return false;
    }
    return true;
  });

  const handleAdvancedFilterChange = (key: string, value: any) => {
    onFilterChange({
      advancedFilters: {
        ...(filters.advancedFilters || {}),
        [key]: value,
      },
    });
  };

  const handleResetAdvancedFilters = () => {
    onFilterChange({
      advancedFilters: {},
    });
  };

  const handleRemoveAdvancedFilter = (key: string) => {
    const updated = { ...(filters.advancedFilters || {}) };
    delete updated[key];
    onFilterChange({
      advancedFilters: updated,
    });
  };

  const handleSavePreset = (name: string) => {
    const newPreset: SavedPreset = {
      id: `preset_${Date.now()}`,
      name,
      filters: {
        search: filters.search,
        quickFilter: filters.status,
        advanced: filters.advancedFilters || {},
        viewMode: filters.viewMode,
      },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      toast.success(`Saved view preset "${name}"`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      toast.info('Preset removed');
    } catch (e) {
      console.error(e);
    }
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.orderType && filters.orderType !== 'all' && (!allowedTypes || allowedTypes.length > 1)) ||
    (filters.status && filters.status !== 'all') ||
    (filters.paymentStatus && filters.paymentStatus !== 'all') ||
    (filters.urgency && filters.urgency !== 'all') ||
    filters.sortBy !== 'newest' ||
    activeAdvancedCount > 0;

  return (
    <div className="space-y-3 bg-card border rounded-xl p-3 shadow-2xs">
      {/* Top Row: Search + Quick Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order #, customer, table, phone, or address..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9 pr-8 h-9 text-xs bg-muted/30 focus-visible:bg-background"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Secondary controls row */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Order Type Filter (if not forced to single type) */}
          {(!allowedTypes || allowedTypes.length > 1) && (
            <Select
              value={filters.orderType}
              onValueChange={(val) =>
                onFilterChange({
                  orderType: val as OrderFilterState['orderType'],
                })
              }
            >
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Types
                </SelectItem>
                <SelectItem value="dine_in" className="text-xs">
                  🍽️ Dine-In
                </SelectItem>
                <SelectItem value="takeaway" className="text-xs">
                  🛍️ Takeaway
                </SelectItem>
                <SelectItem value="delivery" className="text-xs">
                  🛵 Delivery
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Payment Status Filter */}
          <Select
            value={filters.paymentStatus}
            onValueChange={(val) =>
              onFilterChange({
                paymentStatus: val as OrderFilterState['paymentStatus'],
              })
            }
          >
            <SelectTrigger className="h-9 w-[120px] text-xs">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Payments
              </SelectItem>
              <SelectItem value="unpaid" className="text-xs text-amber-600 font-semibold">
                ⏳ Unpaid
              </SelectItem>
              <SelectItem value="paid" className="text-xs text-emerald-600 font-semibold">
                ✓ Paid
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Dropdown */}
          <Select
            value={filters.sortBy}
            onValueChange={(val) =>
              onFilterChange({
                sortBy: val as OrderFilterState['sortBy'],
              })
            }
          >
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">
                Newest Placed
              </SelectItem>
              <SelectItem value="oldest" className="text-xs">
                Oldest First
              </SelectItem>
              <SelectItem value="urgency" className="text-xs">
                Longest Wait Time
              </SelectItem>
              <SelectItem value="amount_high" className="text-xs">
                Highest Amount
              </SelectItem>
              <SelectItem value="amount_low" className="text-xs">
                Lowest Amount
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filter Toggle Button */}
          <Button
            type="button"
            variant={isFilterDrawerOpen || activeAdvancedCount > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
            className={cn(
              'h-9 px-3 text-xs font-semibold gap-1.5 transition-colors',
              activeAdvancedCount > 0 && !isFilterDrawerOpen && 'border-primary text-primary'
            )}
            title="Open Advanced Filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeAdvancedCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 px-1.5 py-0 h-4 text-[10px] font-mono font-bold"
              >
                {activeAdvancedCount}
              </Badge>
            )}
          </Button>

          {/* Saved Views / Presets dropdown */}
          {presets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5 text-xs font-semibold gap-1.5"
                  title="Saved Filter Presets"
                >
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Views</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Saved Presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {presets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => {
                      onFilterChange({
                        search: preset.filters.search || '',
                        status: preset.filters.quickFilter || 'all',
                        advancedFilters: preset.filters.advanced || {},
                        viewMode: (preset.filters.viewMode as any) || filters.viewMode,
                      });
                      toast.info(`Applied view "${preset.name}"`);
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="truncate">{preset.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="p-1 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'kanban' })}
              title="Kanban Board View"
              className={cn(
                'p-1.5 rounded-md text-xs font-semibold transition-all',
                filters.viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              title="Grid View"
              className={cn(
                'p-1.5 rounded-md text-xs font-semibold transition-all',
                filters.viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'table' })}
              title="Compact Table View"
              className={cn(
                'p-1.5 rounded-md text-xs font-semibold transition-all',
                filters.viewMode === 'table'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sound Alert Toggle & Test */}
          {onToggleSound && (
            <div className="flex items-center gap-1 border rounded-lg px-2 py-1 bg-muted/30">
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Order audio chime enabled' : 'Order audio chime disabled'}
                className={cn(
                  'text-xs flex items-center gap-1 font-semibold transition-colors',
                  soundEnabled ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
                <span className="hidden lg:inline text-[11px]">
                  {soundEnabled ? 'Sound ON' : 'Muted'}
                </span>
              </button>
              {soundEnabled && onTestSound && (
                <button
                  type="button"
                  onClick={onTestSound}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline pl-1"
                >
                  Test
                </button>
              )}
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      <AdvancedFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filterFields={filterFields}
        values={advancedFilterValues}
        onChange={handleAdvancedFilterChange}
        onApply={() => setIsFilterDrawerOpen(false)}
        onReset={handleResetAdvancedFilters}
        onSavePreset={handleSavePreset}
        activeCount={activeAdvancedCount}
      />

      {/* Active Filter Chips */}
      <ActiveFilterChips
        searchQuery={filters.search}
        onClearSearch={() => onFilterChange({ search: '' })}
        quickFilter={filters.status}
        quickFilterOptions={statusOptions.map((o) => ({ key: o.key, label: o.label }))}
        onClearQuickFilter={() => onFilterChange({ status: 'all' })}
        advancedFilters={advancedFilterValues}
        filterFields={filterFields}
        onRemoveAdvancedFilter={handleRemoveAdvancedFilter}
        groupBy={null}
        onClearGroupBy={() => {}}
        totalCount={totalCount}
        filteredCount={filteredCount ?? totalCount}
        entityName="orders"
        onResetAll={onResetFilters}
      />

      {/* Bottom Row: Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {statusOptions.map((opt) => {
          const count =
            opt.key === 'all'
              ? totalCount
              : statusCounts[opt.key] || 0;
          const isActive = filters.status === opt.key;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onFilterChange({ status: opt.key })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
              )}
            >
              {opt.icon && <opt.icon className="h-3 w-3" />}
              <span>{opt.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default OrderFilterBar;

