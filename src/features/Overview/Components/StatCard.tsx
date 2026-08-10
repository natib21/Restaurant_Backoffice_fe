// src/features/Overview/Components/StatCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: number; // positive = up, negative = down
  loading?: boolean;
}

export const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  loading = false,
}: StatCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight truncate">{value}</p>
            {sub && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</p>
            )}
            {trend !== undefined && (
              <p
                className={cn(
                  'mt-1 text-xs font-semibold',
                  trend >= 0 ? 'text-emerald-600' : 'text-rose-500'
                )}
              >
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
              </p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg bg-primary/10 shrink-0 ml-3', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
