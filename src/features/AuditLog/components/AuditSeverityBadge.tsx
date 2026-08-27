// src/features/AuditLog/components/AuditSeverityBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import type { AuditSeverity } from '../types/auditLogTypes';
import { cn } from '@/lib/utils';

interface AuditSeverityBadgeProps {
  severity: AuditSeverity | string;
  className?: string;
  showIcon?: boolean;
}

export const AuditSeverityBadge: React.FC<AuditSeverityBadgeProps> = ({
  severity,
  className,
  showIcon = true,
}) => {
  const sev = (severity || 'low').toLowerCase() as AuditSeverity;

  switch (sev) {
    case 'critical':
      return (
        <Badge
          className={cn(
            'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-[10px] px-2 py-0.5 shadow-2xs gap-1 inline-flex items-center tracking-wide uppercase',
            className
          )}
        >
          {showIcon && <ShieldAlert className="h-3 w-3 animate-pulse" />}
          CRITICAL
        </Badge>
      );
    case 'high':
      return (
        <Badge
          className={cn(
            'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-[10px] px-2 py-0.5 shadow-2xs gap-1 inline-flex items-center tracking-wide uppercase',
            className
          )}
        >
          {showIcon && <AlertTriangle className="h-3 w-3" />}
          HIGH
        </Badge>
      );
    case 'medium':
      return (
        <Badge
          className={cn(
            'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30 font-semibold text-[10px] px-2 py-0.5 gap-1 inline-flex items-center tracking-wide uppercase',
            className
          )}
        >
          {showIcon && <Info className="h-3 w-3" />}
          MEDIUM
        </Badge>
      );
    case 'low':
    default:
      return (
        <Badge
          className={cn(
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[10px] px-2 py-0.5 gap-1 inline-flex items-center tracking-wide uppercase',
            className
          )}
        >
          {showIcon && <ShieldCheck className="h-3 w-3 text-slate-400" />}
          LOW
        </Badge>
      );
  }
};
