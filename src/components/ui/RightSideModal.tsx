// src/components/ui/RightSideModal.tsx

import React from 'react';
import { Building2, ShieldCheck, X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { Alert, AlertDescription } from './alert';
import { useBranchesQuery } from '@/api/Queries/branchQueries';
interface RightSideModalProps {
  title: string;
  description?: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'left' | 'right';
  className?: string;

  // Footer control
  /** Custom footer - use this if you want full control (e.g. multiple buttons, complex layout) */
  footer?: React.ReactNode;

  /** Simple mode: just Cancel + Primary button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    variant?:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link';
  };
  showCancel?: boolean; // defaults to true when primaryAction exists
}

const RightSideModal: React.FC<RightSideModalProps> = ({
  title,
  description,
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  side = 'right',
  className = '',
  footer,
  primaryAction,
  showCancel = true,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const { isTestMode } = useSelector((state: RootState) => state.ui);

  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );
  const handleClose = () => {
    setIsOpen(false);
  };

  const hasDefaultFooter = !footer && primaryAction;
  const { data: branches = [] } = useBranchesQuery();
  const currentBranch = branches.find((b) => b._id === currentBranchId);
  const currentBranchName = currentBranch?.name || 'All Locations';

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent
        side={side}
        className={`w-full sm:max-w-lg md:max-w-xl lg:max-w-lg flex flex-col h-full [&>button]:hidden ${className}`}
      >
        {/* Sticky Header */}
        <SheetHeader className="sticky top-0 bg-background z-10 border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 text-left flex-1">
              <SheetTitle className="text-xl font-bold">{title}</SheetTitle>

              {description && (
                <SheetDescription className="text-sm">
                  {description}
                </SheetDescription>
              )}

              {/* CLEANER PLACEMENT: Branch indicator below the description */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-1">
                <Building2 className="h-3 w-3" />
                <span>{currentBranchName}</span>
              </div>
            </div>

            {/* Close Button stays pinned to the top right */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full shrink-0 -mt-1 -mr-2"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Test Mode Alert */}
          {isTestMode && (
            <Alert className="mt-4 py-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Test Mode:</strong> Changes will not affect live orders.
              </AlertDescription>
            </Alert>
          )}
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto ">{children}</div>

        {/* Footer */}
        {(footer || hasDefaultFooter) && (
          <div className="sticky bottom-0 bg-background border-t px-6 py-4">
            {footer ? (
              footer
            ) : (
              <div className="flex justify-end gap-3">
                {showCancel && (
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                )}
                {primaryAction && (
                  <Button
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.loading}
                    variant={primaryAction.variant || 'default'}
                  >
                    {primaryAction.loading ? 'Saving...' : primaryAction.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default RightSideModal;
