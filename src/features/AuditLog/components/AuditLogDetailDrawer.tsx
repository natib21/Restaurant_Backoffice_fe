// src/features/AuditLog/components/AuditLogDetailDrawer.tsx
import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  User,
  Clock,
  Shield,
  Server,
  Globe,
  GitBranch,
  History,
  Copy,
  Check,
  ArrowRight,
  Code,
  FileJson,
  Layers,
  Terminal,
  Activity,
} from 'lucide-react';
import { useAuditLogDetailQuery } from '@/api/Queries/auditLogQueries';
import { AuditSeverityBadge } from './AuditSeverityBadge';
import { AuditOutcomeBadge } from './AuditOutcomeBadge';
import { AuditActionBadge } from './AuditActionBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { AuditLog } from '../types/auditLogTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLogDetailDrawerProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenResourceHistory?: (resource: string, resourceId: string) => void;
  onOpenCorrelation?: (correlationId: string) => void;
  initialLog?: AuditLog | null;
}

export const AuditLogDetailDrawer: React.FC<AuditLogDetailDrawerProps> = ({
  logId,
  open,
  onOpenChange,
  onOpenResourceHistory,
  onOpenCorrelation,
  initialLog,
}) => {
  const { data: fetchedLog, isLoading } = useAuditLogDetailQuery(open ? logId : null);
  const log = fetchedLog || initialLog;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dateFormatted = log?.createdAt
    ? format(new Date(log.createdAt), 'EEEE, MMMM dd, yyyy • HH:mm:ss.SSS')
    : '—';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <SheetHeader className="p-4 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {log && <AuditActionBadge action={log.action} method={log.method} />}
                {log && <AuditSeverityBadge severity={log.severity} />}
                {log && <AuditOutcomeBadge outcome={log.outcome} statusCode={log.statusCode} />}
              </div>
              {log?.duration !== undefined && (
                <Badge variant="secondary" className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800">
                  {log.duration}ms latency
                </Badge>
              )}
            </div>

            <div>
              <SheetTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{log?.resource || 'Audit Event'}</span>
                <span className="text-slate-400 font-normal text-sm font-mono truncate max-w-[200px]">
                  #{log?._id}
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{dateFormatted}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading && !log ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : !log ? (
            <div className="text-center py-12 text-slate-500">
              <p>Audit log details could not be found.</p>
            </div>
          ) : (
            <>
              {/* Quick Action Bar */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                {log.resource && log.resourceId && onOpenResourceHistory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenResourceHistory(log.resource as string, log.resourceId as string)}
                    className="h-8 text-xs font-semibold gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    <History className="h-3.5 w-3.5 text-primary" />
                    <span>View Resource History</span>
                  </Button>
                )}

                {log.correlationId && onOpenCorrelation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenCorrelation(log.correlationId as string)}
                    className="h-8 text-xs font-semibold gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Trace Request Flow</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(log, null, 2), 'Full Log JSON')}
                  className="h-8 text-xs font-medium gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ml-auto shadow-2xs hover:bg-slate-50"
                >
                  {copiedKey === 'Full Log JSON' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span>Copy JSON</span>
                </Button>
              </div>

              {/* Operator & Context Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Operator Card */}
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" />
                    <span>Operator Info</span>
                  </div>

                  {log.user ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {log.user.name?.[0] || log.user.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {log.user.name || 'User'}
                        </span>
                        <span className="text-xs text-slate-500 truncate">{log.user.email}</span>
                        {log.user.role?.name && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-primary">
                            Role: {log.user.role.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-1">
                      System automated background process (No human actor)
                    </div>
                  )}

                  {log.user?._id && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">User ID:</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-slate-700 dark:text-slate-300">{log.user._id}</code>
                        <button
                          onClick={() => copyToClipboard(log.user!._id, 'User ID')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <Copy className="h-3 w-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* HTTP & Request Metadata Card */}
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Server className="h-3.5 w-3.5" />
                    <span>Request Context</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">HTTP Method:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.method}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status Code:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.statusCode}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IP Address:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{log.ip || '—'}</span>
                    </div>

                    {log.duration !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Execution Time:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{log.duration} ms</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Endpoint & Identifiers Card */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Identifiers & Endpoint</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-slate-400 font-sans text-[11px] block mb-0.5">Endpoint URL</span>
                      <span className="text-slate-900 dark:text-white font-bold">{log.endpoint}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(log.endpoint, 'Endpoint')}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-slate-400 font-sans text-[11px] block mb-0.5">Resource ID</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{log.resourceId || '—'}</span>
                      </div>
                      {log.resourceId && (
                        <button
                          onClick={() => copyToClipboard(log.resourceId!, 'Resource ID')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-slate-400 font-sans text-[11px] block mb-0.5">Correlation ID</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{log.correlationId || '—'}</span>
                      </div>
                      {log.correlationId && (
                        <button
                          onClick={() => copyToClipboard(log.correlationId!, 'Correlation ID')}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {log.userAgent && (
                    <div className="text-[11px] text-slate-500 truncate pt-1">
                      <span className="font-sans text-slate-400">User-Agent: </span>
                      {log.userAgent}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Diff Tabs */}
              <div className="space-y-3">
                <Tabs defaultValue="changes" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="changes" className="text-xs font-semibold rounded-lg">
                      Changes Diff ({log.changes?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="newValues" className="text-xs font-semibold rounded-lg">
                      New State
                    </TabsTrigger>
                    <TabsTrigger value="oldValues" className="text-xs font-semibold rounded-lg">
                      Old State
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className="text-xs font-semibold rounded-lg">
                      Metadata
                    </TabsTrigger>
                  </TabsList>

                  {/* Changes Diff Tab */}
                  <TabsContent value="changes" className="mt-3">
                    {Array.isArray(log.changes) && log.changes.length > 0 ? (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <div className="col-span-3">Attribute</div>
                          <div className="col-span-4">Previous Value</div>
                          <div className="col-span-1 text-center"></div>
                          <div className="col-span-4">Updated Value</div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                          {log.changes.map((change, idx) => (
                            <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center gap-2">
                              <div className="col-span-3 font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {change.field}
                              </div>
                              <div className="col-span-4 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 p-2 rounded-lg border border-rose-200/50 dark:border-rose-900/50 break-all text-[11px]">
                                {typeof change.oldValue === 'object'
                                  ? JSON.stringify(change.oldValue)
                                  : String(change.oldValue ?? 'null')}
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="col-span-4 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50 break-all text-[11px] font-semibold">
                                {typeof change.newValue === 'object'
                                  ? JSON.stringify(change.newValue)
                                  : String(change.newValue ?? 'null')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        No field-by-field diff payload recorded for this operation.
                      </div>
                    )}
                  </TabsContent>

                  {/* New Values Tab */}
                  <TabsContent value="newValues" className="mt-3">
                    <div className="relative bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(log.newValues, null, 2), 'New Values')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        title="Copy JSON"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <pre>{JSON.stringify(log.newValues || {}, null, 2)}</pre>
                    </div>
                  </TabsContent>

                  {/* Old Values Tab */}
                  <TabsContent value="oldValues" className="mt-3">
                    <div className="relative bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(log.oldValues, null, 2), 'Old Values')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        title="Copy JSON"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <pre>{JSON.stringify(log.oldValues || {}, null, 2)}</pre>
                    </div>
                  </TabsContent>

                  {/* Metadata Tab */}
                  <TabsContent value="metadata" className="mt-3">
                    <div className="relative bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(log.metadata, null, 2), 'Metadata')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        title="Copy JSON"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <pre>{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
