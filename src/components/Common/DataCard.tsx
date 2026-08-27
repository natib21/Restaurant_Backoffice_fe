// src/components/Common/DataCard.tsx
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type DataCardTheme =
  | 'primary'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'indigo'
  | 'purple'
  | 'slate';

export interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  theme?: DataCardTheme;
  trend?: {
    value: string | number;
    label?: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'outline' | 'secondary' | 'destructive';
  tooltip?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

const themeStyles: Record<
  DataCardTheme,
  {
    iconContainer: string;
    iconColor: string;
    accentBorder?: string;
    valueColor?: string;
  }
> = {
  primary: {
    iconContainer: 'bg-primary/10 text-primary dark:bg-primary/20',
    iconColor: 'text-primary',
  },
  emerald: {
    iconContainer: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    iconContainer: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    iconContainer: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  sky: {
    iconContainer: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  indigo: {
    iconContainer: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  purple: {
    iconContainer: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  slate: {
    iconContainer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    iconColor: 'text-slate-700 dark:text-slate-300',
  },
};

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon,
  theme = 'primary',
  trend,
  subtitle,
  badge,
  badgeVariant = 'secondary',
  tooltip,
  action,
  isLoading = false,
  className = '',
  onClick,
}) => {
  const styles = themeStyles[theme];

  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-all duration-200 hover:shadow-xs ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      <CardContent className="p-5 space-y-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {title}
            </p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <HelpCircle className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Right Icon / Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <Badge variant={badgeVariant} className="text-[10px] px-2 py-0.5 font-bold">
                {badge}
              </Badge>
            )}
            {icon && (
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${styles.iconContainer}`}
              >
                {icon}
              </div>
            )}
          </div>
        </div>

        {/* Metric Value */}
        <div className="space-y-1">
          {isLoading ? (
            <Skeleton className="h-8 w-28 rounded-lg" />
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {value}
              </h3>
            </div>
          )}
        </div>

        {/* Footer / Trend / Subtitle Row */}
        {(trend || subtitle || action) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {/* Trend Indicator */}
            {trend && !isLoading && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    trend.isNeutral
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : trend.isPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {trend.isNeutral ? (
                    <Minus className="h-3 w-3" />
                  ) : trend.isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {trend.value}
                </span>
                {trend.label && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {trend.label}
                  </span>
                )}
              </div>
            )}

            {/* Subtitle */}
            {subtitle && !trend && !isLoading && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {subtitle}
              </span>
            )}

            {/* Action link */}
            {action && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="text-[11px] font-bold text-primary hover:underline ml-auto"
              >
                {action.label} →
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
