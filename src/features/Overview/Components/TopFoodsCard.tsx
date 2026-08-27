// src/features/Overview/Components/TopFoodsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { TopFoodItem } from '@/api/Queries/analyticsQueries';
import { UtensilsCrossed } from 'lucide-react';

interface Props {
  items: TopFoodItem[];
  loading: boolean;
}

const formatETB = (n: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n);

const getFoodName = (name: any): string => {
  if (!name) return 'Unnamed item';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') {
    return name.en || name.am || Object.values(name)[0]?.toString() || 'Unnamed item';
  }
  return String(name);
};

export const TopFoodsCard = ({ items, loading }: Props) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <UtensilsCrossed className="h-4 w-4 text-primary" />
        Top Selling Items
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      {loading ? (
        <div className="px-6 pb-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground py-8">
          No completed orders yet
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((item, idx) => {
            const foodName = getFoodName(item.name);
            return (
              <li
                key={typeof item._id === 'string' ? item._id : idx}
                className="px-6 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
                {/* Rank badge */}
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">
                  {idx + 1}
                </span>
                {/* Thumbnail */}
                <div className="h-9 w-9 rounded-lg bg-muted shrink-0 overflow-hidden">
                  {item.image && item.image !== 'default-menu-item.jpg' ? (
                    <img
                      src={`/img/menu/${item.image}`}
                      alt={foodName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <UtensilsCrossed className="h-4 w-4" />
                    </div>
                  )}
                </div>
                {/* Name + revenue */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{foodName}</p>
                  <p className="text-xs text-muted-foreground">{formatETB(item.revenue)}</p>
                </div>
                {/* Quantity */}
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  ×{item.quantity}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </CardContent>
  </Card>
);

