// src/features/Overview/Components/DashboardError.tsx
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const DashboardError = ({
  message = 'Failed to load dashboard data.',
  onRetry,
}: Props) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <div className="p-4 rounded-full bg-rose-100 text-rose-500">
      <AlertTriangle className="h-8 w-8" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Check your connection or contact support.
      </p>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    )}
  </div>
);
