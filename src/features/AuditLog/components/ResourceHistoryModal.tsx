// src/features/AuditLog/components/ResourceHistoryModal.tsx
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
import { History, User, Clock, ArrowRight, ArrowUpRight, Copy, Check } from 'lucide-react';
import { useResourceHistoryQuery } from '@/api/Queries/auditLogQueries';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditOutcomeBadge } from './AuditOutcomeBadge';
import { AuditActionBadge } from './AuditActionBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ResourceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: string | null;
  resourceId: string | null;
  onViewLogDetail?: (logId: string) => void;
}

export const ResourceHistoryModal: React.FC<ResourceHistoryModalProps> = ({
  open,
  onOpenChange,
  resource,
  resourceId,
  onViewLogDetail,
}) => {
  const { data: logs = [], isLoading, isError, error } = useResourceHistoryQuery(
    open ? resource : null,
    open ? resourceId : null
  );

  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    if (!resourceId) return;
    navigator.clipboard.writeText(resourceId);
    setCopied(true);
    toast.success('Resource ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{resource || 'Resource'} Audit Trail</span>
                  <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800">
                    {logs.length} Changes
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>Resource ID:</span>
                  <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{resourceId}</code>
                  <button
                    onClick={handleCopyId}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Copy Resource ID"
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
              <p className="text-sm text-rose-500 font-medium">Failed to load resource history</p>
              <p className="text-xs mt-1">{(error as any)?.message || 'Please check backend logs'}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No change history found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No recorded modifications or audit events match this specific resource ID.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {logs.map((log) => {
                const dateStr = log.createdAt
                  ? format(new Date(log.createdAt), 'MMM dd, yyyy • HH:mm:ss')
                  : '—';

                return (
                  <div key={log._id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-primary shadow-xs ring-2 ring-primary/20" />

                    <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600">
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <AuditActionBadge action={log.action} method={log.method} />
                          <AuditSeverityBadge severity={log.severity} />
                          <AuditOutcomeBadge outcome={log.outcome} statusCode={log.statusCode} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Operator Info */}
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium">
                            {log.user ? log.user.name || log.user.email : 'System Background Job'}
                          </span>
                          {log.user?.role?.name && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {log.user.role.name}
                            </span>
                          )}
                        </div>

                        {onViewLogDetail && (
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

                      {/* Field Changes List */}
                      {Array.isArray(log.changes) && log.changes.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Modified Attributes ({log.changes.length})
                          </p>
                          <div className="space-y-1 font-mono text-[11px]">
                            {log.changes.map((change, idx) => (
                              <div
                                key={idx}
                                className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                              >
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{change.field}:</span>
                                <span className="line-through text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded text-[10px]">
                                  {typeof change.oldValue === 'object'
                                    ? JSON.stringify(change.oldValue)
                                    : String(change.oldValue ?? 'null')}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  {typeof change.newValue === 'object'
                                    ? JSON.stringify(change.newValue)
                                    : String(change.newValue ?? 'null')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
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
