// src/components/Common/DataTable.tsx
import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Inbox,
  Loader2,
  Check,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from './Pagination';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  loadingRowsCount?: number;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: keyof T | ((row: T) => string | number);
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  initialSortColumn?: string;
  initialSortDirection?: SortDirection;
  onSortChange?: (columnId: string, direction: SortDirection) => void;
  // Pagination
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  totalCount?: number; // If server-side pagination
  className?: string;
  headerSticky?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns,
  isLoading = false,
  loadingRowsCount = 5,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria at this time.',
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  rowKey = '_id' as keyof T,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  initialSortColumn,
  initialSortDirection = null,
  onSortChange,
  paginated = false,
  pageSize: propPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  currentPage: propCurrentPage,
  onPageChange,
  onPageSizeChange,
  totalCount,
  className = '',
  headerSticky = false,
}: DataTableProps<T>) {
  // Sorting internal state
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  // Pagination internal state (for client-side pagination)
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(propPageSize);

  const currentPage = propCurrentPage ?? clientPage;
  const pageSize = propPageSize ?? clientPageSize;

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setClientPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      setClientPageSize(size);
      setClientPage(1);
    }
  };

  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable) return;

    let newDirection: SortDirection = 'asc';
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
      else newDirection = 'asc';
    }

    setSortColumn(newDirection ? columnId : null);
    setSortDirection(newDirection);

    if (onSortChange) {
      onSortChange(columnId, newDirection);
    }
  };

  // Client-side sort & pagination
  const processedData = useMemo(() => {
    let result = [...data];

    // Client sort
    if (sortColumn && sortDirection && !onSortChange) {
      const col = columns.find((c) => c.id === sortColumn);
      const accessor = col?.accessorKey;

      result.sort((a, b) => {
        let valA: any = accessor ? (typeof accessor === 'string' ? a[accessor] : a[accessor as keyof T]) : a[sortColumn];
        let valB: any = accessor ? (typeof accessor === 'string' ? b[accessor] : b[accessor as keyof T]) : b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
    }

    return result;
  }, [data, sortColumn, sortDirection, onSortChange, columns]);

  const displayData = useMemo(() => {
    if (!paginated || totalCount !== undefined) {
      // Server paginated or not paginated
      return processedData;
    }
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, paginated, totalCount, currentPage, pageSize]);

  const totalItems = totalCount !== undefined ? totalCount : processedData.length;

  const getRowId = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row);
    return row[rowKey] ?? index;
  };

  const isAllSelected = useMemo(() => {
    if (!selectable || displayData.length === 0) return false;
    return displayData.every((row, index) =>
      selectedRows.some((sel) => getRowId(sel, index) === getRowId(row, index))
    );
  }, [selectable, displayData, selectedRows]);

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const combined = [...selectedRows];
      displayData.forEach((row, index) => {
        const id = getRowId(row, index);
        if (!combined.some((sel) => getRowId(sel, index) === id)) {
          combined.push(row);
        }
      });
      onSelectionChange(combined);
    } else {
      const remaining = selectedRows.filter(
        (sel, index) => !displayData.some((row, rIndex) => getRowId(row, rIndex) === getRowId(sel, index))
      );
      onSelectionChange(remaining);
    }
  };

  const handleSelectRow = (row: T, index: number, checked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const rowId = getRowId(row, index);
    if (checked) {
      onSelectionChange([...selectedRows, row]);
    } else {
      onSelectionChange(
        selectedRows.filter((sel, i) => getRowId(sel, i) !== rowId)
      );
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Standard Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Standard Header */}
            <thead
              className={`bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                headerSticky ? 'sticky top-0 z-10 backdrop-blur-md' : ''
              }`}
            >
              <tr>
                {selectable && (
                  <th className="w-10 px-4 py-3.5 text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const alignClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  return (
                    <th
                      key={col.id}
                      style={{ width: col.width }}
                      className={`px-4 py-3.5 transition-colors ${alignClass} ${
                        col.sortable
                          ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white'
                          : ''
                      } ${col.headerClassName || ''}`}
                      onClick={() => handleSort(col.id, col.sortable)}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'right'
                            ? 'flex-row-reverse'
                            : col.align === 'center'
                            ? 'justify-center'
                            : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-400">
                            {isSorted && sortDirection === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5 text-primary" />
                            ) : isSorted && sortDirection === 'desc' ? (
                              <ChevronDown className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal text-slate-700 dark:text-slate-300">
              {isLoading ? (
                // Standard Skeleton Rows
                Array.from({ length: loadingRowsCount }).map((_, rIdx) => (
                  <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                    {selectable && (
                      <td className="px-4 py-4 text-center">
                        <Skeleton className="h-4 w-4 mx-auto rounded" />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td key={`skel-col-${cIdx}`} className="px-4 py-4">
                        <Skeleton
                          className={`h-4 rounded ${
                            cIdx === 0 ? 'w-3/4' : cIdx === 1 ? 'w-1/2' : 'w-2/3'
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayData.length === 0 ? (
                // Standard Empty State
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
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
                  </td>
                </tr>
              ) : (
                // Data Rows
                displayData.map((row, index) => {
                  const rowId = getRowId(row, index);
                  const isSelected = selectedRows.some(
                    (sel, i) => getRowId(sel, i) === rowId
                  );

                  return (
                    <tr
                      key={String(rowId)}
                      onClick={() => onRowClick && onRowClick(row, index)}
                      className={`group transition-colors duration-150 ${
                        onRowClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      } ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                    >
                      {selectable && (
                        <td
                          className="w-10 px-4 py-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectRow(row, index, Boolean(checked), {} as any)
                            }
                            aria-label={`Select row ${index + 1}`}
                          />
                        </td>
                      )}

                      {columns.map((col) => {
                        const alignClass =
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left';

                        const cellContent = col.cell
                          ? col.cell(row, index)
                          : col.accessorKey
                          ? typeof col.accessorKey === 'string'
                            ? row[col.accessorKey]
                            : row[col.accessorKey as keyof T]
                          : null;

                        return (
                          <td
                            key={col.id}
                            className={`px-4 py-3.5 text-xs ${alignClass} ${col.className || ''}`}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standard Pagination Footer */}
      {paginated && !isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
