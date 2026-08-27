// src/components/Common/AdvancedFilter/useDataViewState.ts
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type {
  ViewMode,
  DensityMode,
  AdvancedFilterField,
  QuickFilterOption,
  SavedPreset,
  GroupByOption,
  SortOption,
  DataViewQueryParams,
} from './types';
import type { SortDirection } from '../DataTable';

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  if (path in obj) return obj[path];
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

interface UseDataViewStateOptions<T> {
  data: T[];
  searchFields?: (keyof T | string)[];
  quickFilters?: QuickFilterOption<T>[];
  filterFields?: AdvancedFilterField[];
  groupByOptions?: GroupByOption<T>[];
  sortOptions?: SortOption<T>[];
  defaultViewMode?: ViewMode;
  defaultQuickFilter?: string;
  defaultGroupBy?: string | null;
  defaultSortField?: string;
  defaultSortDirection?: SortDirection;
  presetStorageKey?: string;
  initialPresets?: SavedPreset[];
  rowKey?: keyof T | ((item: T) => string | number);
  pageSize?: number;
  isServerSide?: boolean;
  serverTotalCount?: number;
  onQueryChange?: (params: DataViewQueryParams) => void;
}

export function useDataViewState<T extends Record<string, any>>({
  data = [],
  searchFields,
  quickFilters = [],
  filterFields = [],
  groupByOptions = [],
  sortOptions = [],
  defaultViewMode = 'table',
  defaultQuickFilter = 'all',
  defaultGroupBy = null,
  defaultSortField,
  defaultSortDirection = 'asc',
  presetStorageKey,
  initialPresets = [],
  rowKey = '_id' as keyof T,
  pageSize: initialPageSize = 10,
  isServerSide = false,
  serverTotalCount,
  onQueryChange,
}: UseDataViewStateOptions<T>) {
  // 1. Core States
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [quickFilter, setQuickFilter] = useState(defaultQuickFilter);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [groupBy, setGroupBy] = useState<string | null>(defaultGroupBy);
  const [sortField, setSortField] = useState<string | null>(
    defaultSortField || (sortOptions[0]?.field as string) || null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  // 2. Selection
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // 3. Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 4. Panel Drawer Open State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // 5. Presets (Loaded from localStorage if presetStorageKey provided)
  const systemPresets = useMemo<SavedPreset[]>(() => {
    const base: SavedPreset[] = [
      {
        id: 'preset-all',
        name: 'Default View',
        isDefault: true,
        isSystem: true,
        filters: {
          search: '',
          quickFilter: 'all',
          advanced: {},
          groupBy: null,
          viewMode: defaultViewMode,
          sortField: defaultSortField || null,
          sortDirection: defaultSortDirection,
          density: 'comfortable',
        },
      },
      ...initialPresets,
    ];
    return base;
  }, [defaultViewMode, defaultSortField, defaultSortDirection, initialPresets]);

  const [presets, setPresets] = useState<SavedPreset[]>(() => {
    if (!presetStorageKey) return systemPresets;
    try {
      const stored = localStorage.getItem(`preset_${presetStorageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...systemPresets, ...parsed.filter((p: SavedPreset) => !p.isSystem)];
      }
    } catch {
      // ignore
    }
    return systemPresets;
  });

  const [activePresetId, setActivePresetId] = useState<string>('preset-all');

  // Sync custom presets to localStorage
  const saveCustomPreset = useCallback(
    (name: string) => {
      const newPreset: SavedPreset = {
        id: `preset-custom-${Date.now()}`,
        name,
        isSystem: false,
        filters: {
          search: searchQuery,
          quickFilter,
          advanced: { ...advancedFilters },
          groupBy,
          viewMode,
          sortField,
          sortDirection,
          density,
        },
      };

      setPresets((prev) => {
        const customOnly = prev.filter((p) => !p.isSystem);
        const updated = [...prev, newPreset];
        if (presetStorageKey) {
          try {
            localStorage.setItem(
              `preset_${presetStorageKey}`,
              JSON.stringify([...customOnly, newPreset])
            );
          } catch {
            // ignore
          }
        }
        return updated;
      });

      setActivePresetId(newPreset.id);
    },
    [
      searchQuery,
      quickFilter,
      advancedFilters,
      groupBy,
      viewMode,
      sortField,
      sortDirection,
      density,
      presetStorageKey,
    ]
  );

  const deleteCustomPreset = useCallback(
    (presetId: string) => {
      setPresets((prev) => {
        const updated = prev.filter((p) => p.id !== presetId);
        if (presetStorageKey) {
          try {
            const customOnly = updated.filter((p) => !p.isSystem);
            localStorage.setItem(
              `preset_${presetStorageKey}`,
              JSON.stringify(customOnly)
            );
          } catch {
            // ignore
          }
        }
        return updated;
      });
      if (activePresetId === presetId) {
        setActivePresetId('preset-all');
      }
    },
    [presetStorageKey, activePresetId]
  );

  const applyPreset = useCallback(
    (preset: SavedPreset) => {
      setActivePresetId(preset.id);
      const f = preset.filters;
      if (f.search !== undefined) setSearchQuery(f.search);
      if (f.quickFilter !== undefined) setQuickFilter(f.quickFilter);
      if (f.advanced !== undefined) setAdvancedFilters({ ...f.advanced });
      if (f.groupBy !== undefined) setGroupBy(f.groupBy);
      if (f.viewMode !== undefined) setViewMode(f.viewMode);
      if (f.sortField !== undefined) setSortField(f.sortField);
      if (f.sortDirection !== undefined) setSortDirection(f.sortDirection);
      if (f.density !== undefined) setDensity(f.density);
      setCurrentPage(1);
    },
    []
  );

  // 6. Reset Filters
  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setQuickFilter(defaultQuickFilter);
    setAdvancedFilters({});
    setGroupBy(defaultGroupBy);
    setCurrentPage(1);
    setActivePresetId('preset-all');
  }, [defaultQuickFilter, defaultGroupBy]);

  const removeAdvancedFilter = useCallback((key: string) => {
    setAdvancedFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCurrentPage(1);
  }, []);

  const setAdvancedFilterValue = useCallback((key: string, value: any) => {
    setAdvancedFilters((prev) => {
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  }, []);

  // 7. Active Filter Count
  const activeAdvancedCount = useMemo(() => {
    return Object.keys(advancedFilters).filter((k) => {
      const val = advancedFilters[k];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      if (typeof val === 'object' && !Array.isArray(val)) {
        return Object.values(val).some((v) => v !== '' && v !== null && v !== undefined);
      }
      return true;
    }).length;
  }, [advancedFilters]);

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery) ||
      (quickFilter !== 'all' && quickFilter !== '') ||
      activeAdvancedCount > 0 ||
      Boolean(groupBy)
    );
  }, [searchQuery, quickFilter, activeAdvancedCount, groupBy]);

  // 8. Server-side Query Notification with Debounce
  const initialMount = useRef(true);
  useEffect(() => {
    if (!onQueryChange) return;

    const handler = () => {
      onQueryChange({
        search: searchQuery,
        quickFilter,
        advancedFilters,
        groupBy,
        sortField,
        sortDirection,
        page: currentPage,
        pageSize,
      });
    };

    if (initialMount.current) {
      initialMount.current = false;
      handler();
      return;
    }

    const timer = setTimeout(handler, 350);
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    quickFilter,
    advancedFilters,
    groupBy,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
    onQueryChange,
  ]);

  // 9. Data Filtering Engine
  const filteredData = useMemo(() => {
    if (isServerSide) {
      return data;
    }

    return data.filter((item: T) => {
      // A. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        let matches = false;

        if (searchFields && searchFields.length > 0) {
          matches = searchFields.some((field) => {
            const val = getNestedValue(item, String(field));
            if (val === null || val === undefined) return false;
            if (Array.isArray(val)) {
              return val.some((v) =>
                typeof v === 'object' && v !== null
                  ? String(v.name || v.label || '').toLowerCase().includes(query)
                  : String(v).toLowerCase().includes(query)
              );
            }
            return String(val).toLowerCase().includes(query);
          });
        } else {
          matches = Object.values(item).some((val) => {
            if (val === null || val === undefined) return false;
            if (typeof val === 'string' || typeof val === 'number') {
              return String(val).toLowerCase().includes(query);
            }
            return false;
          });
        }

        if (!matches) return false;
      }

      // B. Quick Filter
      if (quickFilter && quickFilter !== 'all') {
        const matchingQuick = quickFilters.find((q) => q.key === quickFilter);
        if (matchingQuick?.matcher) {
          if (!matchingQuick.matcher(item)) {
            return false;
          }
        } else {
          const statusVal = item.status || item.state || item.type || item.category;
          if (statusVal) {
            if (String(statusVal).toLowerCase() !== quickFilter.toLowerCase()) {
              return false;
            }
          }
        }
      }

      // C. Advanced Filters
      for (const [key, filterVal] of Object.entries(advancedFilters)) {
        if (filterVal === undefined || filterVal === null || filterVal === '') continue;

        const fieldDef = filterFields.find((f) => f.id === key);
        const itemVal = getNestedValue(item, key);

        if (fieldDef?.type === 'select') {
          if (filterVal !== 'all' && String(itemVal) !== String(filterVal)) {
            return false;
          }
        } else if (fieldDef?.type === 'multi-select') {
          if (Array.isArray(filterVal) && filterVal.length > 0) {
            if (Array.isArray(itemVal)) {
              const hasOverlap = filterVal.some((v) => itemVal.includes(v));
              if (!hasOverlap) return false;
            } else {
              if (!filterVal.includes(String(itemVal))) {
                return false;
              }
            }
          }
        } else if (fieldDef?.type === 'number-range') {
          const num = Number(itemVal);
          if (typeof filterVal === 'object') {
            if (filterVal.min !== undefined && filterVal.min !== '' && num < Number(filterVal.min)) {
              return false;
            }
            if (filterVal.max !== undefined && filterVal.max !== '' && num > Number(filterVal.max)) {
              return false;
            }
          }
        } else if (fieldDef?.type === 'date-range') {
          if (typeof filterVal === 'object') {
            const itemTime = new Date(itemVal).getTime();
            if (filterVal.from && itemTime < new Date(filterVal.from).getTime()) {
              return false;
            }
            if (filterVal.to) {
              const toDate = new Date(filterVal.to);
              toDate.setHours(23, 59, 59, 999);
              if (itemTime > toDate.getTime()) {
                return false;
              }
            }
          }
        } else if (fieldDef?.type === 'boolean') {
          if (Boolean(itemVal) !== Boolean(filterVal)) {
            return false;
          }
        } else if (fieldDef?.type === 'status-pills') {
          if (filterVal !== 'all' && String(itemVal).toLowerCase() !== String(filterVal).toLowerCase()) {
            return false;
          }
        } else {
          if (itemVal === undefined || itemVal === null) return false;
          if (!String(itemVal).toLowerCase().includes(String(filterVal).toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    data,
    searchQuery,
    searchFields,
    quickFilter,
    quickFilters,
    advancedFilters,
    filterFields,
    isServerSide,
  ]);

  // 10. Sorted Data
  const sortedData = useMemo(() => {
    if (isServerSide || !sortField || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = getNestedValue(a, sortField);
      const valB = getNestedValue(b, sortField);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return sortDirection === 'asc'
        ? String(valA) > String(valB)
          ? 1
          : -1
        : String(valA) < String(valB)
        ? 1
        : -1;
    });
  }, [filteredData, sortField, sortDirection, isServerSide]);

  // 11. Grouped Data
  const groupedData = useMemo(() => {
    if (!groupBy) return null;

    const groupOption = groupByOptions.find((g) => g.id === groupBy);
    const accessor = groupOption?.accessor || groupBy;

    const groups: Record<string, T[]> = {};

    sortedData.forEach((item) => {
      let groupKey = 'Other';
      if (typeof accessor === 'function') {
        groupKey = accessor(item) || 'Other';
      } else {
        const val = getNestedValue(item, String(accessor));
        if (val !== undefined && val !== null && val !== '') {
          groupKey = String(val);
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [sortedData, groupBy, groupByOptions]);

  // 12. Paginated Data
  const paginatedData = useMemo(() => {
    if (isServerSide) {
      return data;
    }
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, isServerSide, data]);

  // 13. Helpers
  const getItemId = useCallback(
    (item: T, index: number): string | number => {
      if (typeof rowKey === 'function') return rowKey(item);
      return item[rowKey] ?? index;
    },
    [rowKey]
  );

  const isItemSelected = useCallback(
    (item: T, index: number) => {
      const id = getItemId(item, index);
      return selectedRows.some((r, i) => getItemId(r, i) === id);
    },
    [selectedRows, getItemId]
  );

  const toggleSelectRow = useCallback(
    (item: T, index: number, selected: boolean) => {
      const id = getItemId(item, index);
      setSelectedRows((prev) => {
        if (selected) {
          if (!prev.some((r, i) => getItemId(r, i) === id)) {
            return [...prev, item];
          }
          return prev;
        } else {
          return prev.filter((r, i) => getItemId(r, i) !== id);
        }
      });
    },
    [getItemId]
  );

  const toggleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedRows([...sortedData]);
      } else {
        setSelectedRows([]);
      }
    },
    [sortedData]
  );

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const totalCalculated = serverTotalCount !== undefined ? serverTotalCount : data.length;
  const filteredCalculated = serverTotalCount !== undefined ? serverTotalCount : sortedData.length;

  return {
    // State
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    density,
    setDensity,
    quickFilter,
    setQuickFilter,
    advancedFilters,
    setAdvancedFilters,
    setAdvancedFilterValue,
    removeAdvancedFilter,
    groupBy,
    setGroupBy,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    selectedRows,
    setSelectedRows,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,

    // Presets
    presets,
    activePresetId,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,

    // Counts & Derived
    totalCount: totalCalculated,
    filteredCount: filteredCalculated,
    activeAdvancedCount,
    hasActiveFilters,

    // Processed Data
    filteredData,
    sortedData,
    groupedData,
    paginatedData,

    // Row selection helpers
    getItemId,
    isItemSelected,
    toggleSelectRow,
    toggleSelectAll,
    clearSelection,
    resetAllFilters,
  };
}
