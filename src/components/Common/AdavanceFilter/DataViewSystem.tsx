// src/components/Common/AdvancedFilter/DataViewSystem.tsx
import React, { useState } from 'react';
import { Plus, Download, FileSpreadsheet, FileCode, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '../DataTable';
import { Pagination } from '../Pagination';
import type { DataViewSystemProps } from './types';
import { useDataViewState } from './useDataViewState';
import { AdvancedFilterBar } from './AdvancedFilterBar';
import { AdvancedFilterDrawer } from './AdvancedFilterDrawer';
import { ActiveFilterChips } from './ActiveFilterChip';
import { BulkActionBar } from './BulkActionBar';
import { DataCardGridView } from './DataCardGridView';
import { DataKanbanView } from './DataKanbanView';
import { DataListView } from './DataListView';
import { toast } from 'sonner';

export function DataViewSystem<T extends Record<string, any>>({
  data = [],
  rowKey = '_id' as keyof T,
  title,
  subtitle,
  entityName = 'items',
  columns = [],
  isLoading = false,
  loadingRowsCount = 6,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
  supportedViewModes = ['table', 'grid', 'kanban', 'list'],
  defaultViewMode = 'table',
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFields,
  quickFilters = [],
  defaultQuickFilter = 'all',
  filterFields = [],
  groupByOptions = [],
  defaultGroupBy = null,
  sortOptions = [],
  defaultSortField,
  defaultSortDirection = 'asc',
  presetStorageKey,
  initialPresets = [],
  selectable = false,
  bulkActions = [],
  onSelectionChange,
  onItemClick,
  renderCustomCard,
  renderCustomListItem,
  kanbanColumns,
  kanbanGroupByField,
  exportFileName = 'data_export',
  onExport,
  primaryAction,
  headerExtra,
  toolbarExtra,
  paginated = true,
  pageSize: propPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  isServerSide = false,
  serverTotalCount,
  onQueryChange,
  className = '',
}: DataViewSystemProps<T>) {
  // Column visibility state for Table View
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumnIds((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const visibleColumns = columns.filter((col) => !hiddenColumnIds.includes(col.id));

  // Initialize unified data view state manager
  const state = useDataViewState<T>({
    data,
    searchFields,
    quickFilters,
    filterFields,
    groupByOptions,
    sortOptions,
    defaultViewMode,
    defaultQuickFilter,
    defaultGroupBy,
    defaultSortField,
    defaultSortDirection,
    presetStorageKey,
    initialPresets,
    rowKey,
    pageSize: propPageSize,
    isServerSide,
    serverTotalCount,
    onQueryChange,
  });

  // Notify parent of selection changes if callback provided
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(state.selectedRows);
    }
  }, [state.selectedRows, onSelectionChange]);

  // Built-in CSV / JSON export engine
  const handleExport = (format: 'csv' | 'json') => {
    if (onExport) {
      onExport(state.sortedData, format);
      return;
    }

    if (state.sortedData.length === 0) {
      toast.error('No data to export');
      return;
    }

    if (format === 'json') {
      const dataStr = JSON.stringify(state.sortedData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('JSON export downloaded successfully');
    } else {
      // CSV format
      const exportCols = visibleColumns.length > 0 ? visibleColumns : columns;
      const headers = exportCols.map((c) =>
        typeof c.header === 'string' ? c.header : c.id
      );

      const rows = state.sortedData.map((item) =>
        exportCols.map((col) => {
          const val = col.accessorKey
            ? typeof col.accessorKey === 'string'
              ? item[col.accessorKey]
              : item[col.accessorKey as keyof T]
            : item[col.id];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV export downloaded successfully');
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Optional Title / Header Section */}
      {(title || primaryAction || headerExtra) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            {title && (
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerExtra}

            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                className="h-9 px-3.5 rounded-xl text-xs font-bold bg-primary text-white shadow-2xs hover:bg-primary/90 gap-1.5 active:scale-[0.98] transition-all"
              >
                {primaryAction.icon || <Plus className="h-4 w-4" />}
                <span>{primaryAction.label}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Unified Filter & Control Bar */}
      <AdvancedFilterBar<T>
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        searchPlaceholder={searchPlaceholder}
        quickFilters={quickFilters}
        activeQuickFilter={state.quickFilter}
        onQuickFilterChange={state.setQuickFilter}
        onToggleFilterDrawer={() =>
          state.setIsFilterDrawerOpen(!state.isFilterDrawerOpen)
        }
        isFilterDrawerOpen={state.isFilterDrawerOpen}
        activeAdvancedCount={state.activeAdvancedCount}
        hasFilterFields={filterFields.length > 0}
        groupByOptions={groupByOptions}
        activeGroupBy={state.groupBy}
        onGroupByChange={state.setGroupBy}
        supportedViewModes={supportedViewModes}
        activeViewMode={state.viewMode}
        onViewModeChange={state.setViewMode}
        activeDensity={state.density}
        onDensityChange={state.setDensity}
        sortOptions={sortOptions}
        activeSortField={state.sortField}
        activeSortDirection={state.sortDirection}
        onSortChange={(f, d) => {
          state.setSortField(f);
          state.setSortDirection(d);
        }}
        presets={state.presets}
        activePresetId={state.activePresetId}
        onSelectPreset={state.applyPreset}
        onDeletePreset={state.deleteCustomPreset}
        columns={columns}
        hiddenColumnIds={hiddenColumnIds}
        onToggleColumnVisibility={toggleColumnVisibility}
        onExport={handleExport}
        onResetAll={state.resetAllFilters}
        hasActiveFilters={state.hasActiveFilters}
        extraActions={toolbarExtra}
      />

      {/* Advanced Filter Slide-down Panel */}
      {state.isFilterDrawerOpen && (
        <AdvancedFilterDrawer
          isOpen={state.isFilterDrawerOpen}
          onClose={() => state.setIsFilterDrawerOpen(false)}
          filterFields={filterFields}
          values={state.advancedFilters}
          onChange={state.setAdvancedFilterValue}
          onApply={() => state.setIsFilterDrawerOpen(false)}
          onReset={() => state.setAdvancedFilters({})}
          onSavePreset={state.saveCustomPreset}
          activeCount={state.activeAdvancedCount}
        />
      )}

      {/* Active Filter Chips Bar */}
      <ActiveFilterChips
        searchQuery={state.searchQuery}
        onClearSearch={() => state.setSearchQuery('')}
        quickFilter={state.quickFilter}
        quickFilterOptions={quickFilters}
        onClearQuickFilter={() => state.setQuickFilter('all')}
        advancedFilters={state.advancedFilters}
        filterFields={filterFields}
        onRemoveAdvancedFilter={state.removeAdvancedFilter}
        groupBy={state.groupBy}
        groupByOptions={groupByOptions}
        onClearGroupBy={() => state.setGroupBy(null)}
        totalCount={state.totalCount}
        filteredCount={state.filteredCount}
        selectedCount={state.selectedRows.length}
        entityName={entityName}
        onResetAll={state.resetAllFilters}
      />

      {/* Floating / Sticky Bulk Action Bar */}
      {selectable && state.selectedRows.length > 0 && (
        <BulkActionBar<T>
          selectedRows={state.selectedRows}
          totalCount={state.filteredCount}
          onClearSelection={state.clearSelection}
          onSelectAll={() => state.toggleSelectAll(true)}
          bulkActions={bulkActions}
        />
      )}

      {/* Grouped View Section Header Rendering */}
      {state.groupedData ? (
        <div className="space-y-6">
          {Object.entries(state.groupedData).map(([groupTitle, groupItems]) => (
            <div
              key={groupTitle}
              className="space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800"
            >
              {/* Group Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {groupTitle}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Render Selected View Mode for this group */}
              {state.viewMode === 'table' && (
                <DataTable<T>
                  data={groupItems}
                  columns={visibleColumns}
                  isLoading={isLoading}
                  loadingRowsCount={loadingRowsCount}
                  selectable={selectable}
                  selectedRows={state.selectedRows}
                  onSelectionChange={state.setSelectedRows}
                  rowKey={rowKey}
                  onRowClick={onItemClick}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                  emptyIcon={emptyIcon}
                  paginated={false}
                />
              )}

              {state.viewMode === 'grid' && (
                <DataCardGridView<T>
                  data={groupItems}
                  isLoading={isLoading}
                  selectable={selectable}
                  selectedRows={state.selectedRows}
                  onToggleSelectRow={state.toggleSelectRow}
                  onItemClick={onItemClick}
                  getItemId={state.getItemId}
                  density={state.density}
                  renderCustomCard={renderCustomCard}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                />
              )}

              {state.viewMode === 'list' && (
                <DataListView<T>
                  data={groupItems}
                  isLoading={isLoading}
                  selectable={selectable}
                  selectedRows={state.selectedRows}
                  onToggleSelectRow={state.toggleSelectRow}
                  onItemClick={onItemClick}
                  getItemId={state.getItemId}
                  density={state.density}
                  renderCustomListItem={renderCustomListItem}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Standard Non-Grouped View Modes */
        <div className="space-y-4">
          {/* Mode 1: Table View */}
          {state.viewMode === 'table' && (
            <DataTable<T>
              data={paginated ? state.paginatedData : state.sortedData}
              columns={visibleColumns}
              isLoading={isLoading}
              loadingRowsCount={loadingRowsCount}
              selectable={selectable}
              selectedRows={state.selectedRows}
              onSelectionChange={state.setSelectedRows}
              rowKey={rowKey}
              onRowClick={onItemClick}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              emptyIcon={emptyIcon}
              emptyActionLabel={emptyActionLabel}
              onEmptyAction={onEmptyAction}
              paginated={false} // Handled uniformly below
            />
          )}

          {/* Mode 2: Grid View */}
          {state.viewMode === 'grid' && (
            <DataCardGridView<T>
              data={paginated ? state.paginatedData : state.sortedData}
              isLoading={isLoading}
              loadingCount={loadingRowsCount}
              selectable={selectable}
              selectedRows={state.selectedRows}
              onToggleSelectRow={state.toggleSelectRow}
              onItemClick={onItemClick}
              getItemId={state.getItemId}
              density={state.density}
              renderCustomCard={renderCustomCard}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              emptyIcon={emptyIcon}
              emptyActionLabel={emptyActionLabel}
              onEmptyAction={onEmptyAction}
            />
          )}

          {/* Mode 3: Kanban View */}
          {state.viewMode === 'kanban' && (
            <DataKanbanView<T>
              data={state.sortedData}
              kanbanColumns={kanbanColumns}
              groupByField={kanbanGroupByField || 'status'}
              onItemClick={onItemClick}
              getItemId={state.getItemId}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              emptyIcon={emptyIcon}
            />
          )}

          {/* Mode 4: Compact List View */}
          {state.viewMode === 'list' && (
            <DataListView<T>
              data={paginated ? state.paginatedData : state.sortedData}
              isLoading={isLoading}
              loadingCount={loadingRowsCount}
              selectable={selectable}
              selectedRows={state.selectedRows}
              onToggleSelectRow={state.toggleSelectRow}
              onItemClick={onItemClick}
              getItemId={state.getItemId}
              density={state.density}
              renderCustomListItem={renderCustomListItem}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              emptyIcon={emptyIcon}
            />
          )}

          {/* Unified Pagination for Non-Kanban Views */}
          {paginated &&
            state.viewMode !== 'kanban' &&
            !isLoading &&
            state.filteredCount > 0 && (
              <Pagination
                currentPage={state.currentPage}
                totalItems={state.filteredCount}
                pageSize={state.pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageChange={state.setCurrentPage}
                onPageSizeChange={state.setPageSize}
              />
            )}
        </div>
      )}
    </div>
  );
}
