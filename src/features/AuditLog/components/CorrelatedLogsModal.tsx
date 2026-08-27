// src/features/AuditLog/components/CorrelatedLogsModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch, Clock, ArrowUpRight, Copy, Check, Timer } from 'lucide-react';
import { useCorrelatedLogsQuery } from '@/api/Queries/auditLogQueries';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditOutcomeBadge } from './AuditOutcomeBadge';
import { AuditActionBadge } from './AuditActionBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CorrelatedLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  correlationId: string | null;
  onViewLogDetail?: (logId: string) => void;
}

export const CorrelatedLogsModal: React.FC<CorrelatedLogsModalProps> = ({
  open,
  onOpenChange,
  correlationId,
  onViewLogDetail,
}) => {
  const { data: logs = [], isLoading, isError, error } = useCorrelatedLogsQuery(
    open ? correlationId : null
  );

  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    if (!correlationId) return;
    navigator.clipboard.writeText(correlationId);
    setCopied(true);
    toast.success('Correlation ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalDuration = React.useMemo(() => {
    return logs.reduce((sum, log) => sum + (log.duration || 0), 0);
  }, [logs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Distributed Request Trace</span>
                  <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800">
                    {logs.length} Trace Steps
                  </Badge>
                  {totalDuration > 0 && (
                    <Badge variant="secondary" className="font-mono text-[11px] gap-1">
                      <Timer className="h-3 w-3" />
                      {totalDuration}ms Total
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>Correlation ID:</span>
                  <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{correlationId}</code>
                  <button
                    onClick={handleCopyId}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Copy Correlation ID"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-slate-500">
              <p className="text-sm text-rose-500 font-medium">Failed to load request trace logs</p>
              <p className="text-xs mt-1">{(error as any)?.message || 'Please check backend logs'}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <GitBranch className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No correlated events found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No subsequent operations or audit events were tagged with this specific correlation ID.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900/60">
              {logs.map((log, index) => {
                const dateStr = log.createdAt
                  ? format(new Date(log.createdAt), 'HH:mm:ss.SSS')
                  : '—';

                return (
                  <div key={log._id || index} className="relative group">
                    {/* Timeline Node Step Index */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 h-6 w-6 -ml-1 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {index + 1}
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[11px] bg-white dark:bg-slate-900 font-bold">
                            {log.resource}
                          </Badge>
                          <AuditActionBadge action={log.action} method={log.method} />
                          <AuditSeverityBadge severity={log.severity} />
                          <AuditOutcomeBadge outcome={log.outcome} statusCode={log.statusCode} />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {log.duration !== undefined && (
                            <span className="font-mono bg-slate-200/60 dark:bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                              {log.duration}ms
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Endpoint & Resource ID */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                        <div className="truncate max-w-md">
                          <span className="text-slate-400 select-none">Endpoint: </span>
                          <span className="text-slate-800 dark:text-slate-200">{log.endpoint || '—'}</span>
                        </div>

                        {onViewLogDetail && log._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewLogDetail(log._id)}
                            className="h-6 text-[11px] text-primary px-2 gap-1"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Metadata or changes summary if any */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-1 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                          <span className="text-slate-400">Metadata: </span>
                          <code className="text-indigo-600 dark:text-indigo-400">
                            {JSON.stringify(log.metadata)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
