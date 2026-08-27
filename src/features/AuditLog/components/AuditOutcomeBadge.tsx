// src/features/AuditLog/components/AuditOutcomeBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { AuditOutcome } from '../types/auditLogTypes';
import { cn } from '@/lib/utils';

interface AuditOutcomeBadgeProps {
  outcome: AuditOutcome | string;
  statusCode?: number;
  className?: string;
  showIcon?: boolean;
}

export const AuditOutcomeBadge: React.FC<AuditOutcomeBadgeProps> = ({
  outcome,
  statusCode,
  className,
  showIcon = true,
}) => {
  const out = (outcome || 'success').toLowerCase() as AuditOutcome;

  switch (out) {
    case 'failure':
      return (
        <Badge
          className={cn(
            'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 font-semibold text-[10px] px-2 py-0.5 gap-1 inline-flex items-center',
            className
          )}
        >
          {showIcon && <XCircle className="h-3 w-3" />}
          <span>Failed</span>
          {statusCode ? <span className="text-[9px] font-mono opacity-80">({statusCode})</span> : null}
        </Badge>
      );
    case 'partial':
      return (
        <Badge
          className={cn(
            'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 font-semibold text-[10px] px-2 py-0.5 gap-1 inline-flex items-center',
            className
          )}
        >
          {showIcon && <AlertCircle className="h-3 w-3" />}
          <span>Partial</span>
          {statusCode ? <span className="text-[9px] font-mono opacity-80">({statusCode})</span> : null}
        </Badge>
      );
    case 'success':
    default:
      return (
        <Badge
          className={cn(
            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-semibold text-[10px] px-2 py-0.5 gap-1 inline-flex items-center',
            className
          )}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          <span>Success</span>
          {statusCode ? <span className="text-[9px] font-mono opacity-80">({statusCode})</span> : null}
        </Badge>
      );
  }
};
