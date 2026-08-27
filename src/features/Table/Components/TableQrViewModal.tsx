// src/features/Table/Components/TableQrViewModal.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Users,
  MapPin,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import type { Table } from '@/api/Queries/tableQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';

interface TableQrViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  merchant?: Merchant | null;
  onOpenPrintMenu?: (table: Table) => void;
}

export const TableQrViewModal: React.FC<TableQrViewModalProps> = ({
  open,
  onOpenChange,
  table,
  merchant,
  onOpenPrintMenu,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  if (!table) return null;

  // Use the exact QR url / code string from the existing API
  const digitalMenuUrl = table.qrUrl || (table.qrCode && !table.qrCode.startsWith('data:image') && !table.qrCode.startsWith('http') ? table.qrCode : '') || '';
  const qrImageSrc = table.qrCode && (table.qrCode.startsWith('data:image') || table.qrCode.startsWith('http')) ? table.qrCode : null;

  const handleCopyUrl = () => {
    if (digitalMenuUrl) {
      navigator.clipboard.writeText(digitalMenuUrl);
      setCopied(true);
      toast.success('Digital menu URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('No digital menu URL available for this table');
    }
  };

  const handleDownloadQR = () => {
    // If table.qrCode is a direct image URL or base64
    if (qrImageSrc) {
      const link = document.createElement('a');
      link.href = qrImageSrc;
      link.download = `table-${table.tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded QR Code for Table ${table.tableNumber}`);
      return;
    }

    // Otherwise grab from canvas
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-${table.tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded QR Code for Table ${table.tableNumber}`);
    } else {
      toast.error('Unable to export QR image');
    }
  };

  const handlePrintTent = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print table QR tent');
      return;
    }

    const restaurantName = merchant?.businessName || 'Restaurant';
    const branchName = typeof table.branch === 'object' ? table.branch?.name : 'Main Dining';

    // Get QR image source for print
    let qrSrcForPrint = qrImageSrc;
    if (!qrSrcForPrint) {
      const canvas = qrCanvasRef.current?.querySelector('canvas');
      if (canvas) {
        qrSrcForPrint = canvas.toDataURL('image/png');
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table ${table.tableNumber} - QR Stand</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
            @page { size: auto; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
              color: #0f172a;
            }
            .card {
              width: 320px;
              padding: 32px 24px;
              border: 2px solid #e2e8f0;
              border-radius: 24px;
              text-align: center;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
            }
            .brand {
              font-family: 'Playfair Display', serif;
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .branch {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
              margin-bottom: 24px;
            }
            .table-badge {
              display: inline-block;
              background: #0f172a;
              color: #fff;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 800;
              margin-bottom: 20px;
            }
            .qr-wrapper {
              width: 200px;
              height: 200px;
              margin: 0 auto 20px;
              padding: 12px;
              background: #fff;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
            }
            .qr-wrapper img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .scan-text {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .sub-text {
              font-size: 11px;
              color: #64748b;
            }
            .footer-url {
              margin-top: 20px;
              padding-top: 14px;
              border-top: 1px dashed #e2e8f0;
              font-size: 10px;
              color: #94a3b8;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">${restaurantName}</div>
            <div class="branch">${branchName}</div>
            <div class="table-badge">TABLE ${table.tableNumber}</div>
            <div class="qr-wrapper">
              <img src="${qrSrcForPrint || ''}" alt="QR" />
            </div>
            <div class="scan-text">Scan for Digital Menu</div>
            <div class="sub-text">Order & pay directly from your phone</div>
            ${digitalMenuUrl ? `<div class="footer-url">${digitalMenuUrl}</div>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
        {/* Header with table identity */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-6 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center font-black text-xl border border-primary/20">
                {table.tableNumber}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  Table {table.tableNumber} QR Identity
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {table.capacity} Seats
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {table.section || table.location || 'Floor'}
                  </span>
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-bold"
            >
              Active QR
            </Badge>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="p-6 flex flex-col items-center space-y-5">
          <div
            ref={qrCanvasRef}
            className="p-5 bg-white dark:bg-slate-950 rounded-3xl border-2 border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[220px] min-w-[220px]"
          >
            {qrImageSrc ? (
              <img
                src={qrImageSrc}
                alt={`QR Code for Table ${table.tableNumber}`}
                className="w-48 h-48 object-contain rounded-xl"
              />
            ) : digitalMenuUrl ? (
              <QRCodeCanvas
                value={digitalMenuUrl}
                size={192}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
                <QrCode className="h-10 w-10 mb-2 text-slate-300" />
                <span>QR payload not available</span>
              </div>
            )}
          </div>

          {/* Full Digital Menu URL Display & Copy */}
          {digitalMenuUrl && (
            <div className="w-full bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
              <div className="truncate flex-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 select-all">
                {digitalMenuUrl}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className="h-7 text-xs font-semibold px-2.5 gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Download QR</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintTent}
              className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print QR Card</span>
            </Button>
          </div>
        </div>

        {/* Footer with Print Full Menu Promo */}
        <DialogFooter className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-row items-center justify-between sm:justify-between gap-3">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Want a physical dining menu?
            </p>
            <p className="text-[11px] text-slate-500">
              Print complete menu with Table {table.tableNumber} QR
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              if (onOpenPrintMenu) {
                onOpenPrintMenu(table);
              } else {
                navigate(`/tables/print-menu?tableId=${table._id}`);
              }
            }}
            className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 shadow-xs"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Print Menu</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
