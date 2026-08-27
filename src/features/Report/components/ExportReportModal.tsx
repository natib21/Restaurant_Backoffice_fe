// src/features/Report/components/ExportReportModal.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ReportType,
  type ReportQueryParams,
  downloadSyncReportCsv,
  useCreateExportJobMutation,
  useExportJobStatusQuery,
} from '@/api/Queries/reportQueries';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  params: ReportQueryParams;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  params,
}) => {
  const [exportMode, setExportMode] = useState<'instant' | 'async'>('instant');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const createExportMutation = useCreateExportJobMutation();
  const { data: jobStatusResp } = useExportJobStatusQuery(
    activeJobId,
    !!activeJobId
  );

  const activeJob = jobStatusResp?.data;

  // Handle Instant Sync CSV Download
  const handleInstantDownload = async () => {
    try {
      toast.info(`Preparing ${reportType} CSV export...`);
      await downloadSyncReportCsv(reportType, params);
      toast.success('Report CSV downloaded successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to download sync CSV');
    }
  };

  // Handle Triggering Background Export Job
  const handleStartAsyncJob = async () => {
    if (selectedFormat !== 'csv') {
      toast.error('XLSX & PDF formats are not yet implemented. Please select CSV format.');
      return;
    }

    try {
      const res = await createExportMutation.mutateAsync({
        reportType,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        branchId: params.branchId,
        format: 'csv',
      });
      setActiveJobId(res.data.jobId);
      toast.success('Export job queued in background');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate export job');
    }
  };

  const resetState = () => {
    setActiveJobId(null);
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
            <Download className="h-4 w-4 text-primary" />
            <span>Export {reportType.toUpperCase()} Report</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Export timeframe: {params.dateFrom.slice(0, 10)} to {params.dateTo.slice(0, 10)}
          </DialogDescription>
        </DialogHeader>

        {!activeJobId ? (
          <div className="space-y-4 py-2">
            {/* Export Method Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Export Method
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportMode('instant')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    exportMode === 'instant'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white mb-0.5">
                    <Download className="h-3.5 w-3.5 text-primary" />
                    <span>Instant CSV</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Direct browser download of the summary data immediately.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMode('async')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    exportMode === 'async'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white mb-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                    <span>Background Job</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Process large datasets via worker job with notification.
                  </p>
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                File Format
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-80'
                  }`}
                  onClick={() => setSelectedFormat('csv')}
                >
                  <FileSpreadsheet className="h-5 w-5 mb-1 text-emerald-600" />
                  <span className="text-xs">CSV</span>
                  <Badge variant="outline" className="text-[9px] mt-1 px-1 py-0 border-emerald-300 text-emerald-600">
                    Supported
                  </Badge>
                </button>

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

                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer opacity-50 ${
                    selectedFormat === 'pdf' ? 'border-primary' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => setSelectedFormat('pdf')}
                >
                  <FileText className="h-5 w-5 mb-1 text-slate-400" />
                  <span className="text-xs text-slate-500">PDF</span>
                  <Badge variant="secondary" className="text-[9px] mt-1 px-1 py-0">
                    Phase 3
                  </Badge>
                </button>
              </div>
            </div>

            {selectedFormat !== 'csv' && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Note: Backend currently supports <strong>CSV</strong> format. XLSX and PDF export pipelines are scheduled for upcoming release.
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Active Job Progress View */
          <div className="py-4 space-y-4 text-center">
            {activeJob?.status === 'pending' || activeJob?.status === 'processing' ? (
              <div className="space-y-3">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Generating Export File...
                </h4>
                <p className="text-xs text-slate-500">
                  Job ID: <span className="font-mono">{activeJobId}</span>
                </p>
                <Progress value={activeJob.status === 'processing' ? 65 : 25} className="h-2 rounded-full" />
                <p className="text-[11px] text-slate-400">
                  Status: {activeJob.status === 'processing' ? 'Processing aggregation pipeline' : 'Pending in queue'}
                </p>
              </div>
            ) : activeJob?.status === 'ready' ? (
              <div className="space-y-3">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Export Ready for Download!
                </h4>
                <p className="text-xs text-slate-500">
                  Your dataset has been compiled and indexed.
                </p>
                {activeJob.fileId && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                    File ID: {activeJob.fileId}
                  </div>
                )}
                <Button
                  onClick={handleInstantDownload}
                  className="w-full h-9 rounded-xl font-bold text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File Now</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-rose-500" />
                <h4 className="text-sm font-bold text-rose-600">Export Job Failed</h4>
                <p className="text-xs text-slate-500">
                  {activeJob?.errorMessage || 'An error occurred during async export generation.'}
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
            {activeJob?.status === 'ready' ? 'Done' : 'Cancel'}
          </Button>

          {!activeJobId && (
            <Button
              size="sm"
              onClick={exportMode === 'instant' ? handleInstantDownload : handleStartAsyncJob}
              disabled={createExportMutation.isPending || (exportMode === 'async' && selectedFormat !== 'csv')}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportMode === 'instant' ? 'Download CSV' : 'Start Export Job'}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
