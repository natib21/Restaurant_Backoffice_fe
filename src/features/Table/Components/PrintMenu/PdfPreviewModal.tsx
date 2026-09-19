// src/features/Table/Components/PrintMenu/PdfPreviewModal.tsx
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
import {
  Download,
  ExternalLink,
  Printer,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlobUrl: string | null;
  filename: string;
  tableNumber?: string | number;
  source: 'server' | 'client';
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  onOpenChange,
  pdfBlobUrl,
  filename,
  tableNumber,
  source,
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleDownloadAgain = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Downloaded "${filename}" to your device!`);
  };

  const handleOpenInNewTab = () => {
    if (!pdfBlobUrl) return;
    window.open(pdfBlobUrl, '_blank');
  };

  const handlePrintPdf = () => {
    if (!pdfBlobUrl) return;
    try {
      const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        window.open(pdfBlobUrl, '_blank');
      }
    } catch {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl 2xl:max-w-6xl w-[95vw] sm:w-[90vw] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <span>Backend Menu PDF Ready</span>
                  {tableNumber && (
                    <Badge variant="secondary" className="text-xs">
                      Table #{tableNumber}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                    Backend Service
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Rendered by backend server with embedded vector QR code & typography
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-mono text-slate-500 max-w-[200px] truncate hidden sm:inline-flex">
              <FileText className="h-3 w-3 mr-1" />
              {filename}
            </Badge>
          </div>
        </DialogHeader>

        {/* Informative Download Banner */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 my-2 flex-shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Where is my PDF?</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
              The PDF has been sent to your browser's default <strong>Downloads</strong> folder as <code className="bg-white/80 dark:bg-black/30 px-1 py-0.5 rounded font-mono text-[11px]">{filename}</code>. You can also preview, print, or open it below.
            </p>
          </div>
        </div>

        {/* Live PDF Viewer Iframe */}
        <div className="flex-1 w-full min-h-[350px] sm:min-h-[480px] bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          {pdfBlobUrl ? (
            <iframe
              id="pdf-preview-iframe"
              src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
              title="PDF Preview"
              onLoad={() => setIframeLoaded(true)}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No PDF document loaded</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 flex-wrap gap-2 sm:justify-between items-center">
          <p className="text-xs text-slate-400 hidden sm:block">
            Tip: Press <kbd className="px-1 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded border">Ctrl+P</kbd> to print immediately
          </p>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in Tab</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print PDF</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadAgain}
              className="h-8 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Again</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
