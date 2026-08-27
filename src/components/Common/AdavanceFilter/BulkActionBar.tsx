// src/components/Common/AdvancedFilter/BulkActionBar.tsx
import React, { useState } from 'react';
import {
  CheckSquare,
  X,
  Trash2,
  Download,
  Printer,
  ChevronDown,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {type BulkAction } from './types';

interface BulkActionBarProps<T> {
  selectedRows: T[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  bulkActions?: BulkAction<T>[];
  className?: string;
}

export function BulkActionBar<T extends Record<string, any>>({
  selectedRows,
  totalCount,
  onClearSelection,
  onSelectAll,
  bulkActions = [],
  className = '',
}: BulkActionBarProps<T>) {
  const [activeConfirmAction, setActiveConfirmAction] = useState<BulkAction<T> | null>(null);

  if (selectedRows.length === 0) return null;

  const count = selectedRows.length;
  const isAllSelected = count === totalCount && totalCount > 0;

  const handleActionClick = (action: BulkAction<T>) => {
    if (action.confirmTitle) {
      setActiveConfirmAction(action);
    } else {
      action.onClick(selectedRows, onClearSelection);
    }
  };

  const handleConfirm = () => {
    if (activeConfirmAction) {
      activeConfirmAction.onClick(selectedRows, onClearSelection);
      setActiveConfirmAction(null);
    }
  };

  return (
    <>
      <div
        className={`w-full rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 p-3 sm:px-4 sm:py-3 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200 ${className}`}
      >
        {/* Left Info & Select All trigger */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 text-primary-foreground flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold">
              {count} {count === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isAllSelected && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Select all ({totalCount})
              </button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 ml-2"
            >
              <X className="h-3.5 w-3.5" />
              Deselect
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'secondary'}
              size="sm"
              onClick={() => handleActionClick(action)}
              className="h-8 text-xs font-bold rounded-xl gap-1.5"
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={Boolean(activeConfirmAction)}
        onOpenChange={(open) => !open && setActiveConfirmAction(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-bold">
                {activeConfirmAction?.confirmTitle || 'Confirm Action'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              {activeConfirmAction?.confirmMessage ||
                `Are you sure you want to perform this action on ${count} selected records?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="h-8 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
