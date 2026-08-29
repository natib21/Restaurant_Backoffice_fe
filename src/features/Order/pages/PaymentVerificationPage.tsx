// src/features/Order/pages/PaymentVerificationPage.tsx
import React, { useState, useMemo } from 'react';
import {
  usePaymentVerificationsQuery,
  useConfirmVerificationMutation,
  useRejectVerificationMutation,
  type PaymentVerification,
  type PaymentProvider,
  type VerificationStatus,
} from '@/api/Queries/paymentVerificationQueries';
import { VerifyPaymentModal } from '../Components/VerifyPaymentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Smartphone,
  Copy,
  Check,
  Eye,
  Download,
  Plus,
  Loader2,
  Receipt,
  FileCheck,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const PaymentVerificationPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Selected verification for review dialog
  const [selectedVerification, setSelectedVerification] = useState<PaymentVerification | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  // Zoom & rotate controls for receipt viewer in detail dialog
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection input state
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Queries
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = usePaymentVerificationsQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const verifications = data?.verifications || [];

  const { mutateAsync: confirmVerif, isPending: isConfirming } = useConfirmVerificationMutation();
  const { mutateAsync: rejectVerif, isPending: isRejecting } = useRejectVerificationMutation();

  // Metrics summary calculations
  const stats = useMemo(() => {
    const total = verifications.length;
    const pending = verifications.filter(
      (v) => v.status === 'pending_review' || v.status === 'lookup_failed'
    ).length;
    const verified = verifications.filter((v) => v.status === 'verified').length;
    const rejected = verifications.filter((v) => v.status === 'rejected').length;

    const totalAmount = verifications
      .filter((v) => v.status === 'verified')
      .reduce((sum, v) => {
        const orderAmount = typeof v.order === 'object' ? v.order.totalAmount : 0;
        const parsedAmount = v.parsed?.amount || 0;
        return sum + (parsedAmount || orderAmount || 0);
      }, 0);

    return {
      total,
      pending,
      verified,
      rejected,
      verifiedVolume: totalAmount,
    };
  }, [verifications]);

  // Filtered List
  const filteredVerifications = useMemo(() => {
    return verifications.filter((item) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = item.providerReference?.toLowerCase().includes(q);
        const orderNumMatch =
          typeof item.order === 'object'
            ? item.order.orderNumber?.toLowerCase().includes(q)
            : false;
        const customerMatch =
          typeof item.order === 'object'
            ? item.order.customerName?.toLowerCase().includes(q)
            : false;
        const payerMatch = item.parsed?.payerName?.toLowerCase().includes(q);

        if (!refMatch && !orderNumMatch && !customerMatch && !payerMatch) {
          return false;
        }
      }

      // Provider filter
      if (providerFilter !== 'all' && item.provider !== providerFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_review' && item.status !== 'pending_review' && item.status !== 'lookup_failed') {
          return false;
        } else if (statusFilter !== 'pending_review' && item.status !== statusFilter) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && item.verificationType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [verifications, searchQuery, providerFilter, statusFilter, typeFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`);
  };

  const handleOpenReview = (item: PaymentVerification) => {
    setSelectedVerification(item);
    setZoomLevel(1);
    setRotation(0);
    setShowRejectBox(false);
    setRejectReason('');
    setIsDetailDialogOpen(true);
  };

  const handleConfirmSelected = async () => {
    if (!selectedVerification) return;
    try {
      await confirmVerif({
        verificationId: selectedVerification._id,
        receiptFileId: selectedVerification.receiptFileRef,
      });
      toast.success(`Verification confirmed for ref ${selectedVerification.providerReference}`);
      setIsDetailDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to confirm verification');
    }
  };

  const handleRejectSelected = async () => {
    if (!selectedVerification) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    try {
      await rejectVerif({
        verificationId: selectedVerification._id,
        reason: rejectReason.trim(),
      });
      toast.error(`Verification rejected: ${rejectReason}`);
      setIsDetailDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject verification');
    }
  };

  return (
    <div className="space-y-6 pb-20 p-2 sm:p-4 max-w-7xl mx-auto">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Payment Verification
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review and settle mobile money payments (Telebirr & CBE) with automatic lookup and manual checks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsManualEntryOpen(true)}
            className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Manual Verify
          </Button>
        </div>
      </div>

      {/* 2. Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Review */}
        <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Pending Review
            </p>
            <h3 className="text-2xl font-black font-mono text-foreground mt-1">
              {stats.pending}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Requires cashier confirmation
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Verified */}
        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Verified Today
            </p>
            <h3 className="text-2xl font-black font-mono text-foreground mt-1">
              {stats.verified}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ETB {stats.verifiedVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Rejected */}
        <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              Rejected
            </p>
            <h3 className="text-2xl font-black font-mono text-foreground mt-1">
              {stats.rejected}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Invalid or duplicate receipts
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Total Verifications */}
        <div className="p-4 rounded-xl border border-border bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Total Logged
            </p>
            <h3 className="text-2xl font-black font-mono text-foreground mt-1">
              {stats.total}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across Telebirr & CBE
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filtering Toolbar */}
      <div className="p-3.5 rounded-xl border border-border bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Ref, Customer..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Provider Filter */}
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="telebirr">Telebirr</SelectItem>
              <SelectItem value="cbe">CBE</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="manual_entry_auto_lookup">Auto Lookup</SelectItem>
              <SelectItem value="manual_entry_lookup_failed">Manual Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Verifications Table */}
      <div className="rounded-xl border border-border bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-muted-foreground">Loading payment verifications...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">No Verifications Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No payment transactions match your search or active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50/75 dark:bg-slate-800/50 text-muted-foreground font-bold">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Receipt / Ref</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Verification Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVerifications.map((item) => {
                  const orderObj = typeof item.order === 'object' ? item.order : null;
                  const orderNumber = orderObj?.orderNumber || 'ORD-N/A';
                  const customerName = orderObj?.customerName || item.parsed?.payerName || 'Walk-in';
                  const amount = item.parsed?.amount || orderObj?.totalAmount || 0;

                  const isPending =
                    item.status === 'pending_review' || item.status === 'lookup_failed';
                  const isVerified = item.status === 'verified';
                  const isRejected = item.status === 'rejected';

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">#{orderNumber}</div>
                        <span className="text-[11px] text-muted-foreground">
                          {orderObj?.tableNumber || orderObj?.orderType || 'Order'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {customerName}
                      </td>

                      {/* Provider */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {item.provider === 'telebirr' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Smartphone className="h-3 w-3" /> Telebirr
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Building2 className="h-3 w-3" /> CBE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Receipt / Ref */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                          <span>{item.providerReference}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.providerReference)}
                            className="p-1 hover:text-emerald-600 rounded"
                            title="Copy Reference"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        ETB {Number(amount).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Pending Review
                          </span>
                        )}
                        {isVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Verified
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                        {item.verificationType === 'manual_entry_auto_lookup' ? (
                          <span className="font-semibold text-emerald-600">Auto Lookup</span>
                        ) : (
                          <span>Manual Entry</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReview(item)}
                          className="h-7 px-2.5 text-xs font-semibold gap-1 hover:border-emerald-600"
                        >
                          <Eye className="h-3 w-3" />
                          {isPending ? 'Verify' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detail / Review Dialog for Table Rows */}
      {selectedVerification && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl p-0 border border-border shadow-2xl rounded-2xl overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <DialogHeader className="px-6 py-4 border-b border-border bg-white dark:bg-slate-950 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Review Verification: {selectedVerification.providerReference}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provider: {selectedVerification.provider.toUpperCase()} • Status:{' '}
                  <span className="font-semibold">{selectedVerification.status}</span>
                </p>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* If Auto Lookup */}
              {selectedVerification.verificationType === 'manual_entry_auto_lookup' ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                        Payment Automatically Matched
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                        Transaction retrieved from bank API with High Match Quality.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Reference</span>
                      <p className="font-mono font-bold text-foreground mt-0.5">
                        {selectedVerification.providerReference}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Payer</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {selectedVerification.parsed?.payerName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Amount</span>
                      <p className="text-base font-black font-mono text-emerald-600 mt-0.5">
                        ETB {selectedVerification.parsed?.amount || (typeof selectedVerification.order === 'object' ? selectedVerification.order.totalAmount : 0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Match Quality</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold mt-0.5">
                        <Check className="h-3.5 w-3.5" /> {selectedVerification.parseQuality.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* If Manual Review */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Manual Verification
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        {selectedVerification.lookupError || 'Confirm details against customer phone or printed receipt slip.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[180px] text-center">
                      <Receipt className="h-10 w-10 text-muted-foreground mb-2 opacity-60" />
                      <p className="font-semibold text-foreground">Physical Receipt Verification</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Receipt Ref: {selectedVerification.providerReference}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 space-y-2.5">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-bold text-foreground capitalize">
                          {selectedVerification.provider}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Receipt Ref:</span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedVerification.providerReference}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          ETB {selectedVerification.parsed?.amount || (typeof selectedVerification.order === 'object' ? selectedVerification.order.totalAmount : 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection input prompt */}
              {showRejectBox && (
                <div className="p-3 rounded-xl border border-rose-300 bg-rose-50/50 dark:bg-rose-950/30 space-y-2">
                  <span className="font-bold text-rose-900 dark:text-rose-200 block">
                    Rejection Reason:
                  </span>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason (e.g., amount mismatch, fake slip)..."
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRejectBox(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleRejectSelected}
                      disabled={isRejecting}
                      className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      {isRejecting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-border bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailDialogOpen(false)}
                className="h-9 px-4 text-xs font-semibold"
              >
                Close
              </Button>

              {selectedVerification.status === 'pending_review' ||
              selectedVerification.status === 'lookup_failed' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectBox(true)}
                    disabled={isConfirming || isRejecting}
                    className="h-9 px-4 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmSelected}
                    disabled={isConfirming || isRejecting}
                    className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    {isConfirming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Confirm Payment
                  </Button>
                </>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Verification Modal for standalone trigger */}
      {isManualEntryOpen && (
        <VerifyPaymentModal
          isOpen={isManualEntryOpen}
          onClose={() => {
            setIsManualEntryOpen(false);
            refetch();
          }}
          order={{
            _id: 'manual-order',
            orderNumber: 'MANUAL-REF',
            totalAmount: 250,
            status: 'served',
            paymentStatus: 'unpaid',
            customerName: 'Direct Cashier Lookup',
          }}
        />
      )}
    </div>
  );
};

export default PaymentVerificationPage;
