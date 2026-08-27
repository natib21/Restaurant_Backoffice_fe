// src/features/Report/components/ReportHeaderControls.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  Building2,
  SlidersHorizontal,
  Clock,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useBranchesQuery, type Branch } from '@/api/Queries/branchQueries';
import type { ReportQueryParams } from '@/api/Queries/reportQueries';

export type DatePresetKey = 'today' | '7days' | '30days' | '90days' | 'thisMonth' | 'ytd' | 'custom';

interface ReportHeaderControlsProps {
  params: ReportQueryParams;
  onChangeParams: (newParams: Partial<ReportQueryParams>) => void;
  onRefresh: () => void;
  onOpenExportModal: () => void;
  isLoading?: boolean;
}

export const ReportHeaderControls: React.FC<ReportHeaderControlsProps> = ({
  params,
  onChangeParams,
  onRefresh,
  onOpenExportModal,
  isLoading,
}) => {
  const { data: branches = [] } = useBranchesQuery();

  const [datePreset, setDatePreset] = React.useState<DatePresetKey>('30days');
  const [customFrom, setCustomFrom] = React.useState(params.dateFrom.slice(0, 10));
  const [customTo, setCustomTo] = React.useState(params.dateTo.slice(0, 10));
  const [customError, setCustomError] = React.useState<string | null>(null);

  const handleSelectPreset = (preset: DatePresetKey) => {
    setDatePreset(preset);
    const now = new Date();
    let from: Date;
    const to = now;

    switch (preset) {
      case 'today':
        from = now;
        break;
      case '7days':
        from = subDays(now, 7);
        break;
      case '30days':
        from = subDays(now, 30);
        break;
      case '90days':
        from = subDays(now, 90);
        break;
      case 'thisMonth':
        from = startOfMonth(now);
        break;
      case 'ytd':
        from = startOfYear(now);
        break;
      case 'custom':
        return; // Handled in custom date popover
      default:
        from = subDays(now, 30);
    }

    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');

    setCustomFrom(fromStr);
    setCustomTo(toStr);
    onChangeParams({
      dateFrom: fromStr,
      dateTo: toStr,
    });
  };

  const handleApplyCustomDates = () => {
    if (!customFrom || !customTo) {
      setCustomError('Both start and end dates are required.');
      return;
    }

    const dFrom = new Date(customFrom);
    const dTo = new Date(customTo);

    if (dFrom > dTo) {
      setCustomError('Start date must be before or equal to end date.');
      return;
    }

    const daysDiff = differenceInDays(dTo, dFrom);
    if (daysDiff > 366) {
      setCustomError('Date range exceeds maximum of 366 days. Please shorten the range or use export.');
      return;
    }

    setCustomError(null);
    setDatePreset('custom');
    onChangeParams({
      dateFrom: customFrom,
      dateTo: customTo,
    });
    toast.success('Custom date range applied');
  };

  const getPresetLabel = () => {
    switch (datePreset) {
      case 'today':
        return 'Today';
      case '7days':
        return 'Last 7 Days';
      case '30days':
        return 'Last 30 Days';
      case '90days':
        return 'Last 90 Days';
      case 'thisMonth':
        return 'This Month';
      case 'ytd':
        return 'Year to Date';
      case 'custom':
        return `${params.dateFrom.slice(0, 10)} to ${params.dateTo.slice(0, 10)}`;
      default:
        return 'Date Range';
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Left: Filters & Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Preset Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <Button
            type="button"
            variant={datePreset === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectPreset('today')}
            className="h-7 px-2.5 text-xs rounded-lg font-medium"
          >
            Today
          </Button>
          <Button
            type="button"
            variant={datePreset === '7days' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectPreset('7days')}
            className="h-7 px-2.5 text-xs rounded-lg font-medium"
          >
            7D
          </Button>
          <Button
            type="button"
            variant={datePreset === '30days' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectPreset('30days')}
            className="h-7 px-2.5 text-xs rounded-lg font-medium"
          >
            30D
          </Button>
          <Button
            type="button"
            variant={datePreset === 'thisMonth' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectPreset('thisMonth')}
            className="h-7 px-2.5 text-xs rounded-lg font-medium hidden sm:inline-flex"
          >
            Month
          </Button>
          <Button
            type="button"
            variant={datePreset === 'ytd' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectPreset('ytd')}
            className="h-7 px-2.5 text-xs rounded-lg font-medium hidden md:inline-flex"
          >
            YTD
          </Button>

          {/* Custom Date Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={datePreset === 'custom' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-lg font-medium gap-1"
              >
                <CalendarIcon className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {datePreset === 'custom' ? getPresetLabel() : 'Custom'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 rounded-2xl space-y-3" align="start">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Select Date Interval</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Maximum report interval limit is 366 days.
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    From (Start Date)
                  </Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 text-xs rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    To (End Date)
                  </Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 text-xs rounded-xl mt-1"
                  />
                </div>
              </div>

              {customError && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{customError}</span>
                </div>
              )}

              <Button
                type="button"
                size="sm"
                onClick={handleApplyCustomDates}
                className="w-full h-8 text-xs rounded-xl font-bold"
              >
                Apply Range
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Branch Filter */}
        <Select
          value={params.branchId || 'all'}
          onValueChange={(val) => onChangeParams({ branchId: val === 'all' ? null : val })}
        >
          <SelectTrigger className="h-9 w-[150px] sm:w-[170px] text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="All Branches" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="text-xs">
              All Branches
            </SelectItem>
            {branches.map((b) => (
              <SelectItem key={b._id} value={b._id} className="text-xs">
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Group By Selector */}
        <Select
          value={params.groupBy || 'day'}
          onValueChange={(val) => onChangeParams({ groupBy: val as 'day' | 'week' | 'month' })}
        >
          <SelectTrigger className="h-9 w-[120px] text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 truncate">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="Group by" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="day" className="text-xs">
              Daily
            </SelectItem>
            <SelectItem value="week" className="text-xs">
              Weekly
            </SelectItem>
            <SelectItem value="month" className="text-xs">
              Monthly
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 px-3 text-xs font-medium rounded-xl gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        <Button
          onClick={onOpenExportModal}
          size="sm"
          className="h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Report</span>
        </Button>
      </div>
    </div>
  );
};
