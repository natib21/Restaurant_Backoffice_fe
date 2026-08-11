// src/components/layout/SidebarHeader.tsx
import React from 'react';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGetMeQuery } from '../../../api/Queries/authQueries';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';

interface SidebarHeaderProps {
  isExpanded: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isExpanded }) => {
  const { data: user, isLoading } = useGetMeQuery();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // Determine which branch to show
  const displayedBranch = React.useMemo(() => {
    if (!user || !user.branch) return null;

    const branches = user.branch; // array of Branch objects

    // 1. If a branch is selected in the header selector → use it
    if (currentBranchId) {
      return branches.find((b: any) => b._id === currentBranchId) || null;
    }

    // 2. If no selection → show the first branch (or main one if you mark it)
    return branches[0] || null;
  }, [user, currentBranchId]);

  const merchantName = user?.merchant?.businessName || 'My Restaurant';
  const isTestMode = user?.merchant?.mode === 'Test';
  const isBranchActive = displayedBranch?.isActive ?? false;

  // Extract branch type (e.g., "Main Branch" from "TiruPOS - Main Branch")
  const getBranchDisplayName = () => {
    if (!displayedBranch?.name) return null;
    const parts = displayedBranch.name.split(' - ');
    return parts.length > 1 ? parts[1].trim() : null;
  };

  const branchType = getBranchDisplayName();

  return (
    <div className="px-3.5 py-4 border-b border-border/70 bg-card/50">
      <div
        className={cn(
          'flex items-center gap-3 transition-all duration-200',
          !isExpanded && 'justify-center'
        )}
      >
        {/* Logo Icon + Status Dot */}
        <div className="relative flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Building2 className="h-4 w-4" />

          {/* Online/Offline status dot (simplified, clean) */}
          {!isLoading && displayedBranch && (
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card',
                isBranchActive ? 'bg-emerald-500' : 'bg-rose-500'
              )}
            />
          )}

          {/* Loading status dot */}
          {isLoading && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-muted animate-pulse ring-2 ring-card" />
          )}
        </div>

        {/* Text Content - Only when expanded */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="min-w-0 flex-1"
          >
            <div className="flex items-center justify-between gap-1.5">
              {/* Merchant Name */}
              {isLoading ? (
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              ) : (
                <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[130px] leading-tight">
                  {merchantName}
                </p>
              )}

              {/* Test Mode Badge */}
              {!isLoading && isTestMode && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider shrink-0">
                  Test
                </span>
              )}
            </div>

            {/* Branch Name & Online Status Line */}
            <div className="flex items-center justify-between gap-1.5 mt-1">
              {!isLoading && displayedBranch ? (
                <p className="text-[11px] text-muted-foreground truncate max-w-[110px] font-normal leading-none">
                  {branchType || displayedBranch.name}
                </p>
              ) : isLoading ? (
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              ) : null}

              {!isLoading && displayedBranch && (
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none shrink-0',
                    isBranchActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {isBranchActive ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
