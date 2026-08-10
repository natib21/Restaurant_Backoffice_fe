// src/features/Overview/Components/CustomerGrowthCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type { CustomerGrowth } from '@/api/Queries/analyticsQueries';

interface Props {
  growth: CustomerGrowth;
  loading: boolean;
}

export const CustomerGrowthCard = ({ growth, loading }: Props) => {
  const total = growth.new + growth.returning;
  const newPct = total > 0 ? Math.round((growth.new / total) * 100) : 0;
  const retPct = 100 - newPct;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Customer Growth (This Month)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : (
          <>
            {/* Bar */}
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${newPct}%` }}
              />
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${retPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-muted-foreground">New</span>
                <span className="font-bold">{growth.new}</span>
                <span className="text-muted-foreground">({newPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                <span className="text-muted-foreground">Returning</span>
                <span className="font-bold">{growth.returning}</span>
                <span className="text-muted-foreground">({retPct}%)</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
