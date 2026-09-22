// src/features/Report/components/ExportReportModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileSpreadsheet,
  FileType,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ReportType,
  type ReportQueryParams,
  downloadSyncReportCsv,
  downloadExportedFile,
  useCreateExportJobMutation,
  useExportJobStatusQuery,
} from '@/api/Queries/reportQueries';
import { useSocket } from '@/lib/Socket';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  params: ReportQueryParams;
  defaultFormat?: 'pdf' | 'csv' | 'xlsx';
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  params,
  defaultFormat = 'pdf',
}) => {
  const [exportMode, setExportMode] = useState<'instant' | 'async'>(
    defaultFormat === 'csv' ? 'instant' : 'async'
  );
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx' | 'pdf'>(defaultFormat);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [readyFileId, setReadyFileId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const autoDownloadedRef = useRef<string | null>(null);

  const socket = useSocket();
  const createExportMutation = useCreateExportJobMutation();
  const { data: jobStatusResp } = useExportJobStatusQuery(
    activeJobId,
    !!activeJobId && !readyFileId
  );

  const activeJob = jobStatusResp?.data;
  const effectiveFileId = readyFileId || activeJob?.fileId || null;
  const isReady = activeJob?.status === 'ready' || Boolean(readyFileId);

  // Sync format if defaultFormat prop updates
  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(defaultFormat);
      if (defaultFormat === 'pdf') {
        setExportMode('async');
      }
    }
  }, [isOpen, defaultFormat]);

  // Listen for real-time WebSocket notification from backend
  useEffect(() => {
    if (!socket) return;

    const handleExportReady = (data: any) => {
      // If data is for current job or general report ready
      if (data?.jobId && activeJobId && data.jobId !== activeJobId) return;
      if (data?.fileId) {
        setReadyFileId(data.fileId);
        toast.success(`Export ready for download!`);
      }
    };

    socket.on('report:export:ready', handleExportReady);
    return () => {
      socket.off('report:export:ready', handleExportReady);
    };
  }, [socket, activeJobId]);

  // Handle Instant Sync CSV Download
  const handleInstantDownload = async () => {
    try {
      setIsDownloading(true);
      toast.info(`Preparing ${reportType} CSV export...`);
      await downloadSyncReportCsv(reportType, params);
      toast.success('Report CSV downloaded successfully!');
      setIsDownloading(false);
      onClose();
    } catch (err: any) {
      setIsDownloading(false);
      toast.error(err?.response?.data?.message || 'Failed to download sync CSV');
    }
  };

  // Trigger File Download from /api/v1/files/{fileId}
  const handleDownloadFile = async (fileIdToDownload: string) => {
    try {
      setIsDownloading(true);
      const ext = selectedFormat === 'pdf' ? 'pdf' : 'csv';
      const filename = `${reportType}_report_${params.dateFrom.slice(0, 10)}_to_${params.dateTo.slice(0, 10)}.${ext}`;
      await downloadExportedFile(fileIdToDownload, filename);
      toast.success(`${selectedFormat.toUpperCase()} downloaded successfully!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to download exported file');
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-download when job status flips to ready
  useEffect(() => {
    if (isReady && effectiveFileId && autoDownloadedRef.current !== effectiveFileId) {
      autoDownloadedRef.current = effectiveFileId;
      handleDownloadFile(effectiveFileId);
    }
  }, [isReady, effectiveFileId]);

  // Handle Triggering Background Export Job (PDF or CSV)
  const handleStartExport = async () => {
    if (selectedFormat === 'xlsx') {
      toast.error('XLSX format is scheduled for an upcoming release. Please select PDF or CSV.');
      return;
    }

    // Instant CSV shortcut
    if (selectedFormat === 'csv' && exportMode === 'instant') {
      await handleInstantDownload();
      return;
    }

    try {
      setReadyFileId(null);
      autoDownloadedRef.current = null;
      const res = await createExportMutation.mutateAsync({
        reportType,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        branchId: params.branchId,
        format: selectedFormat,
      });

      const newJobId = res.data.jobId;
      setActiveJobId(newJobId);
      toast.success(`${selectedFormat.toUpperCase()} export job queued`);

      // If backend returned immediate file or ready state
      if (res.data.status === 'ready' && res.data.fileId) {
        setReadyFileId(res.data.fileId);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate export job');
    }
  };

  const resetState = () => {
    setActiveJobId(null);
    setReadyFileId(null);
    autoDownloadedRef.current = null;
    setIsDownloading(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {selectedFormat === 'pdf' ? (
              <FileText className="h-4 w-4 text-rose-500" />
            ) : (
              <Download className="h-4 w-4 text-primary" />
            )}
            <span>Export {reportType.toUpperCase()} Report</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Timeframe: {params.dateFrom.slice(0, 10)} to {params.dateTo.slice(0, 10)}
            {params.branchId ? ' • Filtered by branch' : ' • All branches'}
          </DialogDescription>
        </DialogHeader>

        {!activeJobId && !readyFileId ? (
          <div className="space-y-4 py-2">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Format
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {/* PDF Button */}
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFormat === 'pdf'
                      ? 'border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-400 font-bold ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    setSelectedFormat('pdf');
                    setExportMode('async');
                  }}
                >
                  <FileText className="h-5 w-5 mb-1 text-rose-500" />
                  <span className="text-xs">PDF</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] mt-1 px-1 py-0 border-rose-300 text-rose-600 dark:text-rose-400 dark:border-rose-800"
                  >
                    Ready
                  </Badge>
                </button>

                {/* CSV Button */}
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedFormat('csv')}
                >
                  <FileSpreadsheet className="h-5 w-5 mb-1 text-emerald-600" />
                  <span className="text-xs">CSV</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] mt-1 px-1 py-0 border-emerald-300 text-emerald-600 dark:text-emerald-400 dark:border-emerald-800"
                  >
                    Ready
                  </Badge>
                </button>

                {/* XLSX Button */}
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer opacity-50 ${
                    selectedFormat === 'xlsx' ? 'border-primary' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => setSelectedFormat('xlsx')}
                >
                  <FileType className="h-5 w-5 mb-1 text-slate-400" />
                  <span className="text-xs text-slate-500">XLSX</span>
                  <Badge variant="secondary" className="text-[9px] mt-1 px-1 py-0">
                    Phase 3
                  </Badge>
                </button>
              </div>
            </div>

            {/* Export Method Toggle (Only for CSV) */}
            {selectedFormat === 'csv' ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Export Mode
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportMode('instant')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      exportMode === 'instant'
                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white mb-0.5">
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Instant CSV</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Direct browser download of current summary data.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportMode('async')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      exportMode === 'async'
                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white mb-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                      <span>Async Job</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Process entire historical dataset in background.
                    </p>
                  </button>
                </div>
              </div>
            ) : selectedFormat === 'pdf' ? (
              <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>PDF Document Generation</span>
                </div>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                  Generates an executive print-ready PDF with metrics, charts, and detailed breakdown tables via backend PDF worker.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Note: Backend currently supports <strong>PDF</strong> and <strong>CSV</strong> formats. XLSX export is scheduled for an upcoming release.
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Active Job Progress View */
          <div className="py-4 space-y-4 text-center">
            {!isReady ? (
              <div className="space-y-3">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Generating {selectedFormat.toUpperCase()} Report...
                </h4>
                {activeJobId && (
                  <p className="text-xs text-slate-500">
                    Job ID: <span className="font-mono text-xs">{activeJobId}</span>
                  </p>
                )}
                <Progress
                  value={activeJob?.status === 'processing' ? 65 : 30}
                  className="h-2 rounded-full"
                />
                <p className="text-[11px] text-slate-400">
                  {activeJob?.status === 'processing'
                    ? 'Rendering charts and compiling document tables...'
                    : 'Queued in worker queue. Listening for ready signal...'}
                </p>
              </div>
            ) : isReady ? (
              <div className="space-y-3">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedFormat.toUpperCase()} Report Ready!
                </h4>
                <p className="text-xs text-slate-500">
                  Your report has been compiled and saved to storage.
                </p>
                {effectiveFileId && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="truncate">File ID: {effectiveFileId}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                      {selectedFormat}
                    </span>
                  </div>
                )}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={() => effectiveFileId && handleDownloadFile(effectiveFileId)}
                    disabled={isDownloading || !effectiveFileId}
                    className="w-full h-9 rounded-xl font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>{isDownloading ? 'Downloading...' : `Download ${selectedFormat.toUpperCase()} File`}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-rose-500" />
                <h4 className="text-sm font-bold text-rose-600">Export Job Failed</h4>
                <p className="text-xs text-slate-500">
                  {activeJob?.errorMessage || 'An error occurred during export generation.'}
                </p>
                <Button
                  variant="outline"
                  onClick={resetState}
                  className="rounded-xl text-xs"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded-xl text-xs"
          >
            {isReady ? 'Close' : 'Cancel'}
          </Button>

          {!activeJobId && !readyFileId && (
            <Button
              size="sm"
              onClick={handleStartExport}
              disabled={createExportMutation.isPending || isDownloading || selectedFormat === 'xlsx'}
              className={`rounded-xl text-xs font-bold gap-1.5 text-white ${
                selectedFormat === 'pdf'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {createExportMutation.isPending || isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : selectedFormat === 'pdf' ? (
                <FileText className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>
                {createExportMutation.isPending || isDownloading
                  ? 'Starting...'
                  : selectedFormat === 'pdf'
                  ? 'Generate PDF Report'
                  : exportMode === 'instant'
                  ? 'Download CSV'
                  : 'Start CSV Job'}
              </span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
