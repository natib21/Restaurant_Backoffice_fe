// src/features/Menu/Components/StationSelector.tsx
import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
  Ban,
  Lock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useKitchenStationsQuery, type KdsStation } from '@/api/Queries/kitchenQueries';
import { useAssignMenuItemStationMutation } from '@/api/Queries/menuQueries';
import { useGetMeQuery } from '@/api/Queries/authQueries';
import { cn } from '@/lib/utils';
import { getLocalizedName, type LocalizedField } from '../lib/localizationUtils';

export interface StationSelectorProps {
  /** The menu item object */
  menuItem: {
    _id?: string;
    id?: string;
    name?: LocalizedField;
    kitchenStation?:
      | {
          _id?: string;
          id?: string;
          stationId?: string;
          name?: string;
          code?: string;
          color?: string;
          isActive?: boolean;
        }
      | string
      | null;
    [key: string]: any;
  };
  /** Optional pre-fetched list of stations to avoid redundant queries */
  stations?: KdsStation[];
  /** Optional branch filter */
  branchId?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Minimal compact representation for table cells */
  compact?: boolean;
  /** Custom class names */
  className?: string;
  /** Force disable interaction */
  disabled?: boolean;
  /** Callback fired after station is updated */
  onStationChange?: (newStationId: string | null, stationName?: string) => void;
}

/**
 * Checks if the current authenticated user has permission to assign kitchen stations to menu items.
 * Enforces the RBAC task: `kitchen.menuItems.assignStation`.
 */
export function useCanAssignKitchenStation(): boolean {
  const { data: user } = useGetMeQuery();

  if (!user) return true; // Default permissive in dev/preview

  const roleName = (user.role?.name || '').toLowerCase();
  if (
    roleName.includes('admin') ||
    roleName.includes('owner') ||
    roleName.includes('manager') ||
    roleName.includes('super')
  ) {
    return true;
  }

  const tasks = user.role?.tasks || [];
  if (!tasks.length) return true;

  return tasks.some(
    (t: any) =>
      t.name === 'kitchen.menuItems.assignStation' ||
      t.name?.toLowerCase().includes('assignstation') ||
      t.name?.toLowerCase().includes('kitchen.menu') ||
      (t.endpoint?.includes('/kitchen/menu-items') && t.method?.toUpperCase() === 'PATCH')
  );
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  menuItem,
  stations: propStations,
  branchId,
  size = 'default',
  compact = false,
  className,
  disabled = false,
  onStationChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const canAssign = useCanAssignKitchenStation();

  // Fetch stations if not passed via props
  const { data: fetchedStations = [], isLoading: isLoadingStations } = useKitchenStationsQuery(
    propStations ? undefined : branchId
  );

  const stationsList = useMemo(() => {
    return propStations || fetchedStations || [];
  }, [propStations, fetchedStations]);

  // Mutation for assigning/removing kitchen station
  const assignMutation = useAssignMenuItemStationMutation();
  const isUpdating = assignMutation.isPending;

  // Extract current station ID and metadata
  const currentStationId = useMemo(() => {
    const raw = menuItem?.kitchenStation;
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      return raw._id || (raw as any).id || (raw as any).stationId || null;
    }
    return null;
  }, [menuItem]);

  // Match with stations list
  const currentStation = useMemo(() => {
    if (!currentStationId) return null;

    const matched = stationsList.find(
      (s) =>
        s._id === currentStationId ||
        s.stationId?.toLowerCase() === currentStationId.toLowerCase() ||
        s.code?.toLowerCase() === currentStationId.toLowerCase()
    );

    if (matched) return matched;

    // Fallback if kitchenStation was passed as a populated object
    const rawStation = menuItem?.kitchenStation;
    if (typeof rawStation === 'object' && rawStation !== null) {
      const obj = rawStation as any;
      return {
        _id: obj._id || obj.id || currentStationId,
        stationId: obj.stationId || currentStationId,
        name: obj.name || 'Assigned Station',
        code: obj.code || 'STATION',
        color: obj.color || '#6366F1',
        isActive: obj.isActive ?? true,
      } as KdsStation;
    }

    return null;
  }, [currentStationId, stationsList, menuItem]);

  // Filter only active stations for new selection
  const activeStations = useMemo(() => {
    return stationsList.filter((s) => s.isActive !== false);
  }, [stationsList]);

  // Handle station assignment or removal
  const handleSelectStation = async (targetStation: KdsStation | null) => {
    const menuItemId = menuItem._id || menuItem.id;
    if (!menuItemId) {
      toast.error('Cannot update: Missing Menu Item ID');
      return;
    }

    const newStationId = targetStation ? targetStation._id || targetStation.stationId : null;
    const targetName = targetStation ? targetStation.name : 'No Station';

    // Prevent redundant updates
    if (newStationId === currentStationId) {
      setDropdownOpen(false);
      return;
    }

    try {
      await assignMutation.mutateAsync({
        menuItemId,
        stationId: newStationId,
      });

      toast.success(
        targetStation
          ? `Station set to ${targetStation.name} (${targetStation.code})`
          : `Station unassigned from "${getLocalizedName(menuItem, 'en', 'Item')}"`
      );

      if (onStationChange) {
        onStationChange(newStationId, targetName);
      }

      setDropdownOpen(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to update kitchen station';
      toast.error(errorMsg);
    }
  };

  const isInteractive = !disabled && canAssign && !isUpdating;

  // Station Display Pill Component
  const renderTriggerContent = () => {
    if (isUpdating) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Updating...</span>
        </span>
      );
    }

    if (!currentStation) {
      return (
        <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-medium">
          <Ban className="h-3 w-3 opacity-60" />
          <span>No Station</span>
        </span>
      );
    }

    const color = currentStation.color || '#3B82F6';
    const isInactive = currentStation.isActive === false;

    return (
      <span className="flex items-center gap-1.5 overflow-hidden text-left">
        <span
          className="h-2 w-2 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
          {currentStation.code || currentStation.name}
        </span>
        {isInactive && (
          <span className="text-[10px] text-amber-500 font-normal shrink-0">(Inactive)</span>
        )}
      </span>
    );
  };

  if (!canAssign) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs text-slate-500 cursor-not-allowed opacity-80',
                className
              )}
            >
              {renderTriggerContent()}
              <Lock className="h-3 w-3 text-slate-400 ml-1" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            You need the <code>kitchen.menuItems.assignStation</code> permission to modify stations.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('inline-block', className)} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : size}
            disabled={!isInteractive}
            className={cn(
              'h-8 px-2.5 text-xs font-normal justify-between gap-1.5 border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all rounded-lg shadow-2xs',
              !currentStation &&
                'bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
              currentStation &&
                'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900',
              isUpdating && 'opacity-70 pointer-events-none'
            )}
          >
            {renderTriggerContent()}
            <ChevronDown
              className={cn(
                'h-3 w-3 text-slate-400 transition-transform duration-200 ml-1 shrink-0',
                dropdownOpen && 'transform rotate-180 text-primary'
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-56 p-1.5 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-50 animate-in fade-in-50 zoom-in-95"
        >
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <ChefHat className="h-3.5 w-3.5 text-primary" />
              <span>Route to Station</span>
            </div>
            {menuItem.name && (
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {getLocalizedName(menuItem, 'en', 'Menu Item')}
              </p>
            )}
          </div>

          <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

          {/* Option: No Station / Unassign */}
          <DropdownMenuItem
            onClick={() => handleSelectStation(null)}
            className={cn(
              'flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors',
              !currentStation
                ? 'bg-primary/10 text-primary font-semibold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            )}
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                <Ban className="h-2.5 w-2.5 text-slate-400" />
              </div>
              <div>
                <span className="block font-medium">No Station</span>
                <span className="block text-[10px] text-slate-400">Do not send to KDS</span>
              </div>
            </div>
            {!currentStation && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Kitchen Stations ({activeStations.length})
          </DropdownMenuLabel>

          {isLoadingStations ? (
            <div className="flex items-center justify-center py-3 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading stations...
            </div>
          ) : activeStations.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-slate-400">
              No active stations found.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-0.5 py-0.5">
              {activeStations.map((station) => {
                const stationId = station._id || station.stationId;
                const isSelected =
                  currentStation &&
                  (currentStation._id === stationId ||
                    currentStation.stationId?.toLowerCase() === station.stationId?.toLowerCase() ||
                    currentStation.code?.toLowerCase() === station.code?.toLowerCase());

                const color = station.color || '#3B82F6';

                return (
                  <DropdownMenuItem
                    key={stationId}
                    onClick={() => handleSelectStation(station)}
                    className={cn(
                      'flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {station.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-3.5 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {station.code}
                          </Badge>
                        </div>
                        {station.description && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                            {station.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1.5" />}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StationSelector;
