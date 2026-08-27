// src/features/Table/Pages/TableDetailPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Trash2,
  QrCode,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Ban,
  Printer,
  Copy,
  LayoutGrid,
  Store,
  ExternalLink,
  RefreshCw,
  ArrowRightLeft,
  Sparkles,
  Clock,
  Unlock,
  UtensilsCrossed,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import {
  useGetTableQuery,
  useDeleteTableMutation,
  useRegenerateQRMutation,
  useUpdateTableStatusMutation,
  useChangeTableMutation,
  useTablesQuery,
  type Table,
} from '../../../api/Queries/tableQueries';
import {
  useTableSessionQuery,
  useFreeSessionMutation,
} from '../../../api/Queries/sessionQueries';

type TableDetailPageProps = {
  tableId: string;
  onEdit?: () => void;
  onOpenPrintMenu?: (table: Table) => void;
};

const statusConfig: Record<
  string,
  { label: string; variant: string; bg: string; text: string; icon: any }
> = {
  available: {
    label: 'Available',
    variant: 'outline',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  occupied: {
    label: 'Occupied',
    variant: 'outline',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-400',
    icon: Users,
  },
  'needs-cleaning': {
    label: 'Needs Cleaning',
    variant: 'outline',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    icon: AlertCircle,
  },
  disabled: {
    label: 'Disabled',
    variant: 'secondary',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    icon: Ban,
  },
};

const TableDetailPage: React.FC<TableDetailPageProps> = ({
  tableId,
  onEdit,
  onOpenPrintMenu,
}) => {
  const navigate = useNavigate();
  const {
    data: table,
    isLoading,
    isError,
    refetch,
  } = useGetTableQuery(tableId);

  const { data: session, refetch: refetchSession } = useTableSessionQuery(tableId);
  const { mutateAsync: regenerateQR, isPending: isRegenerating } =
    useRegenerateQRMutation();
  const deleteMutation = useDeleteTableMutation();
  const updateStatusMutation = useUpdateTableStatusMutation();
  const changeTableMutation = useChangeTableMutation();
  const freeSessionMutation = useFreeSessionMutation();

  const branchId = typeof table?.branch === 'object' ? table.branch?._id : null;
  const { data: allBranchTables = [] } = useTablesQuery(branchId);

  // Table Change Modal State
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState('');
  const [moveReason, setMoveReason] = useState('');

  const handleStatusChange = async (newStatus: any) => {
    try {
      await updateStatusMutation.mutateAsync({ id: tableId, status: newStatus });
      refetch();
    } catch {
      // Toast handled by mutation
    }
  };

  const handleFreeSession = async () => {
    if (!session?._id) return;
    try {
      await freeSessionMutation.mutateAsync(session._id);
      refetch();
      refetchSession();
    } catch {
      // Handled by mutation
    }
  };

  const handleConfirmMoveTable = async () => {
    if (!targetTableId) {
      toast.error('Please select a destination table');
      return;
    }
    try {
      await changeTableMutation.mutateAsync({
        fromTableId: tableId,
        toTableId: targetTableId,
        reason: moveReason || undefined,
      });
      setIsMoveOpen(false);
      setTargetTableId('');
      setMoveReason('');
      refetch();
      refetchSession();
    } catch {
      // Handled by mutation
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure? This will deactivate all active QR links for this table.'
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync(tableId);
      toast.success('Table removed from floor plan');
    } catch {
      toast.error('Could not delete table');
    }
  };

  const handleRegenerateQR = async () => {
    try {
      await regenerateQR(tableId);
      toast.success('QR code regenerated successfully!', {
        description: 'New secure link is ready for printing',
      });
      refetch(); // Instantly updates the displayed QR image
    } catch {
      toast.error('Failed to regenerate QR code', {
        description: 'Please try again',
      });
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !table?.qrCode) return;
    printWindow.document.write(`
     <html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Table ${table.tableNumber} - QR Menu</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap');

    body {
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(to bottom, #ffffff, #f8f9fa);
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
    }

    .container {
      width: 420px;
      padding: 50px 40px;
      background: white;
      border-radius: 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .table-number {
      font-family: 'Playfair Display', serif;
      font-size: 56px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #111827;
    }

    .branch-name {
      font-size: 20px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 32px;
      letter-spacing: 0.5px;
    }

    .instruction {
      font-size: 18px;
      color: #4b5563;
      margin: 20px 0 32px 0;
      font-weight: 500;
    }

    .qr-code {
      width: 320px;
      height: 320px;
      margin: 0 auto;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .qr-code img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .footer {
      margin-top: 40px;
      font-size: 13px;
      color: #6b7280;
      font-weight: 400;
    }

    .footer a {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 500;
    }

    @media print {
      body { background: white; height: auto; }
      .container { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="table-number">Table ${table.tableNumber}</h1>
    <p class="branch-name">${table.branch}</p>
    <p class="instruction">Scan to View Digital Menu</p>
    <div class="qr-code">
      <img src="${table.qrCode}" alt="QR Code for Digital Menu" />
    </div>
    <div class="footer">
      Powered by <a href="https://triusolutions.com" target="_blank">TriuSolutions.com</a>
    </div>
  </div>
</body>
</html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading)
    return (
      <div className="p-12 text-center animate-pulse text-slate-400">
        Loading details...
      </div>
    );
  if (isError || !table)
    return (
      <div className="p-12 text-center text-rose-500 font-medium">
        Table metadata unavailable
      </div>
    );

  const status = statusConfig[table.status] || statusConfig.available;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* 1. Hero Identity Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex flex-col items-center">
          <h1 className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white">
            {table.tableNumber}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${status.bg} ${status.text} border-current/20`}
            >
              <StatusIcon className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {status.label}
              </span>
            </div>

            {/* Quick Status Selector */}
            <Select
              value={table.status}
              onValueChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="h-8 text-xs font-medium w-[150px] bg-background">
                <SelectValue placeholder="Set Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="needs-cleaning">Needs Cleaning</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ACTIVE SESSION CARD (IF ANY) */}
      {session && (
        <Card className="border-indigo-100 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  Active Table Session
                </p>
                {session.isAnonymous ? (
                  <Badge variant="outline" className="text-[10px]">Guest Session</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">{session.customer?.fullName || 'Customer'}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Started: {new Date(session.startedAt).toLocaleTimeString()}
                {session.totalSpent ? ` • Total: ${session.totalSpent} ETB` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5 flex-1 sm:flex-none border-indigo-200 hover:bg-indigo-100 dark:border-indigo-800"
                onClick={() => setIsMoveOpen(true)}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Change Table
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs h-8 gap-1.5 flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleFreeSession}
                disabled={freeSessionMutation.isPending}
              >
                <Unlock className="h-3.5 w-3.5" />
                Free Table
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Info Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Capacity
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {table.capacity} Guests
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <MapPin className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Location
              </p>
              <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
                {table.location}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <LayoutGrid className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Section
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {table.section || 'General'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <Store className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Branch
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Main Hall
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. QR Code Centered Preview */}
      {/* QR Code Section with Regeneration Pending State */}
      <div className="relative group">
        <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800  rounded-[2.5rem]">
          <CardContent className="p-8 flex flex-col items-center bg-white dark:bg-slate-950">
            <div className="relative">
              {isRegenerating ? (
                // Loading state during regeneration
                <div className="w-64 h-64 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">
                    Generating new QR...
                  </p>
                </div>
              ) : table.qrCode ? (
                // Normal QR display
                <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700">
                  <img
                    src={table.qrCode}
                    alt="Table QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
              ) : (
                // Fallback if no QR
                <div className="w-64 h-64 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-slate-200" />
                </div>
              )}

              {/* Live Badge */}
              {!isRegenerating && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-lg">
                  <ExternalLink className="h-3 w-3" />
                  LIVE PRODUCTION CODE
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-12 w-full flex flex-col sm:flex-row gap-3">
              {/* Print Physical Menu */}
              <Button
                onClick={() => {
                  if (onOpenPrintMenu) {
                    onOpenPrintMenu(table);
                  } else {
                    navigate(`/tables/print-menu?tableId=${table._id}`);
                  }
                }}
                variant="default"
                className="h-12 justify-center bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-95 flex-1"
              >
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Print Physical Menu
              </Button>

              {/* Print Label */}
              <Button
                onClick={handlePrintQR}
                disabled={isRegenerating}
                variant="outline"
                className="h-12 justify-center border-slate-200 hover:bg-slate-50 dark:border-slate-800 font-semibold transition-all active:scale-95 flex-1"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Stand/Tent
              </Button>

              {/* Copy URL */}
              <Button
                variant="outline"
                disabled={isRegenerating}
                className="h-12 justify-center border-slate-200 hover:bg-slate-50 dark:border-slate-800 font-semibold transition-all active:scale-95"
                onClick={() => {
                  if (table.qrUrl) {
                    navigator.clipboard.writeText(table.qrUrl);
                    toast.success('QR link copied to clipboard!');
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>

              {/* Regenerate QR - Icon only */}
              <Button
                onClick={handleRegenerateQR}
                disabled={isRegenerating}
                variant="outline"
                className="h-12 w-12 justify-center border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-95 p-0"
                title={
                  isRegenerating ? 'Generating new QR...' : 'Regenerate QR Code'
                }
              >
                <RefreshCw
                  className={`h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-slate-100 dark:bg-slate-800" />

      {/* 4. Dangerous Actions Area */}
      <div className="flex items-center justify-between px-2">
        <Button onClick={onEdit} variant="secondary" className="font-bold">
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Details
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold transition-all"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Table
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">
                Permanently remove this table?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400">
                This action will:
                <ul className="mt-3 space-y-1 list-disc list-inside">
                  <li>Deactivate the table from the floor plan</li>
                  <li>Invalidate all current QR codes</li>
                  <li>End any active staff assignments</li>
                </ul>
                <p className="mt-4 font-medium">This cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="font-medium">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 font-medium"
              >
                Yes, Remove Table
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="text-center text-[11px] text-slate-400 font-medium pb-4">
        Table ID:{' '}
        <span className="font-mono uppercase">{tableId.slice(-8)}</span> • Last
        synced: Just now
      </p>

      {/* Change / Move Table Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Transfer Table Session
            </DialogTitle>
            <DialogDescription>
              Move customer and active orders from Table {table.tableNumber} to another available table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Destination Table
              </label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target table" />
                </SelectTrigger>
                <SelectContent>
                  {allBranchTables
                    .filter((t: any) => t._id !== tableId)
                    .map((t: any) => (
                      <SelectItem key={t._id} value={t._id}>
                        Table {t.tableNumber} ({t.section || 'Main'} • {t.status})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reason (Optional)
              </label>
              <Input
                placeholder="e.g. Customer requested larger booth, AC issue"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleConfirmMoveTable}
              disabled={changeTableMutation.isPending || !targetTableId}
            >
              {changeTableMutation.isPending ? 'Moving...' : 'Confirm Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableDetailPage;
