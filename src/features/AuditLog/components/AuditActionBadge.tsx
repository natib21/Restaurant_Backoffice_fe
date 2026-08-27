// src/features/AuditLog/components/AuditActionBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getMethodStyle } from '@/features/User/lib/rolePermissionUtils';

interface AuditActionBadgeProps {
  action: string;
  method?: string;
  className?: string;
}

export const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({
  action,
  method,
  className,
}) => {
  const methodStyle = getMethodStyle(method);
  
  // Format action text: replace underscores with spaces
  const cleanAction = (action || '').replace(/_/g, ' ');

  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {method && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border',
            methodStyle.badgeClass
          )}
        >
          {method}
        </span>
      )}
      <Badge
        variant="outline"
        className="bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 text-[11px] font-medium tracking-tight px-2 py-0.5"
      >
        {cleanAction}
      </Badge>
    </div>
  );
};
