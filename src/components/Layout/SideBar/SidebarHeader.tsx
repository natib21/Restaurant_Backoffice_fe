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
    <div className="px-4 py-6 border-b">
      <div
        className={cn(
          'flex items-center gap-3 transition-all duration-200',
          !isExpanded && 'justify-center'
        )}
      >
        {/* Logo + Status Dot */}
        <div className="relative flex-shrink-0">
          <Building2 className="h-8 w-8 text-blue-900" />

          {/* Online/Offline dot */}
          {!isLoading && displayedBranch && (
            <span
              className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ring-2 ring-background shadow-sm',
                isBranchActive ? 'bg-green-500' : 'bg-red-500'
              )}
            />
          )}

          {/* Loading pulse */}
          {isLoading && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-muted animate-pulse border-2 border-background" />
          )}
        </div>

        {/* Text Content - Only when expanded */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-0 flex-1"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Merchant Name */}
              {isLoading ? (
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              ) : (
                <p className="font-bold text-base text-foreground truncate max-w-[180px]">
                  {merchantName}
                </p>
              )}

              {/* Test Mode Badge */}
              {!isLoading && isTestMode && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Test Mode
                </span>
              )}

              {/* Online/Offline Status */}
              {!isLoading && displayedBranch && (
                <span
                  className={cn(
                    'text-xs font-medium flex items-center gap-1',
                    isBranchActive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  ● {isBranchActive ? 'Online' : 'Offline'}
                </span>
              )}
            </div>

            {/* Branch Name / Type */}
            {!isLoading && displayedBranch && (
              <p className="text-xs text-muted-foreground italic mt-0.5 truncate max-w-[180px]">
                {branchType || displayedBranch.name}
              </p>
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="mt-1 h-4 w-24 bg-muted rounded animate-pulse" />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
