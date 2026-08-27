// src/components/Common/AdvancedFilter/types.ts
import React from 'react';
import type { ColumnDef, SortDirection } from '../DataTable';

export type ViewMode = 'table' | 'grid' | 'kanban' | 'list';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';

export type FilterFieldType =
  | 'text'
  | 'select'
  | 'multi-select'
  | 'date-range'
  | 'number-range'
  | 'boolean'
  | 'status-pills';

export interface FilterOption {
  label: string;
  value: string;
  color?: string;
  count?: number;
}

export interface AdvancedFilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: FilterOption[];
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  description?: string;
}

export interface QuickFilterOption<T = any> {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
  matcher?: (item: T) => boolean;
}

export interface GroupByOption<T = any> {
  id: string;
  label: string;
  accessor: keyof T | ((item: T) => string);
  icon?: React.ReactNode;
}

export interface SortOption<T = any> {
  id: string;
  label: string;
  field: keyof T | string;
  direction?: SortDirection;
}

export interface SavedPreset {
  id: string;
  name: string;
  isDefault?: boolean;
  isSystem?: boolean;
  icon?: string;
  filters: {
    search?: string;
    quickFilter?: string;
    advanced?: Record<string, any>;
    groupBy?: string | null;
    viewMode?: ViewMode;
    sortField?: string | null;
    sortDirection?: SortDirection;
    density?: DensityMode;
  };
}

export interface BulkAction<T = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  onClick: (selectedRows: T[], clearSelection: () => void) => void | Promise<void>;
  confirmTitle?: string;
  confirmMessage?: string;
}

export interface KanbanColumnConfig<T = any> {
  id: string;
  title: string;
  color?: string;
  bg?: string;
  border?: string;
  icon?: React.ReactNode;
  matcher?: (item: T) => boolean;
}

export interface DataViewQueryParams {
  search: string;
  quickFilter: string;
  advancedFilters: Record<string, any>;
  groupBy: string | null;
  sortField: string | null;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export interface DataViewSystemProps<T extends Record<string, any>> {
  // Data & Identity
  data: T[];
  rowKey?: keyof T | ((row: T) => string | number);
  title?: string;
  subtitle?: string;
  entityName?: string; // e.g. "Menu Items", "Tables", "Customers"

  // Server-side Integration
  isServerSide?: boolean;
  serverTotalCount?: number;
  onQueryChange?: (params: DataViewQueryParams) => void;

  
  // Table columns definition
  columns: ColumnDef<T>[];

  // Loading & Empty
  isLoading?: boolean;
  loadingRowsCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;

  // View modes allowed
  supportedViewModes?: ViewMode[];
  defaultViewMode?: ViewMode;

  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];

  // Quick Filters
  quickFilters?: QuickFilterOption[];
  defaultQuickFilter?: string;

  // Advanced Filters
  filterFields?: AdvancedFilterField[];

  // Group By
  groupByOptions?: GroupByOption<T>[];
  defaultGroupBy?: string | null;

  // Sorting
  sortOptions?: SortOption<T>[];
  defaultSortField?: string;
  defaultSortDirection?: SortDirection;

  // Presets
  presetStorageKey?: string;
  initialPresets?: SavedPreset[];

  // Bulk Actions & Row Selection
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
  onSelectionChange?: (selected: T[]) => void;

  // Item Click & Actions
  onItemClick?: (item: T, index: number) => void;
  renderCustomCard?: (item: T, isSelected: boolean, onSelect: (checked: boolean) => void) => React.ReactNode;
  renderCustomListItem?: (item: T, isSelected: boolean, onSelect: (checked: boolean) => void) => React.ReactNode;

  // Kanban setup
  kanbanColumns?: KanbanColumnConfig<T>[];
  kanbanGroupByField?: keyof T | string;

  // Export
  exportFileName?: string;
  onExport?: (data: T[], format: 'csv' | 'json' | 'excel') => void;

  // Primary Action Button (e.g. "+ Add Customer")
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };

  // Additional header/custom elements
  headerExtra?: React.ReactNode;
  toolbarExtra?: React.ReactNode;

  // Pagination
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  className?: string;
}
