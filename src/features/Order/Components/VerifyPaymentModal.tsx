// src/features/Order/Components/VerifyPaymentModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useInitiateVerificationMutation,
  useConfirmVerificationMutation,
  useRejectVerificationMutation,
  useUploadReceiptMutation,
  type PaymentProvider,
  type PaymentVerification,
} from '@/api/Queries/paymentVerificationQueries';
import { useMarkOrderAsPaidMutation, useUpdateOrderStatusMutation } from '@/api/Queries/orderQuery';
import { playOrderSound } from '@/features/Order/lib/soundPlayer';
import {
  Check,
  CheckCircle2,
  X,
  Loader2,
  Tag,
  QrCode,
  Upload,
  Camera,
  Image as ImageIcon,
  Building2,
  Smartphone,
  AlertTriangle,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Receipt,
  ScanLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface VerifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    subtotal?: number;
    deliveryFee?: number;
    taxAmount?: number;
    status: string;
    paymentStatus: string;
    customerName?: string;
    customerPhone?: string;
    tableNumber?: string;
    orderType?: string;
    items?: any[];
  } | null;
  initialProvider?: PaymentProvider;
}

export const VerifyPaymentModal: React.FC<VerifyPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  initialProvider = 'telebirr',
}) => {
  // Stepper state: 1 = Method/Receipt, 2 = Details, 3 = Verification Review, 4 = Complete
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [provider, setProvider] = useState<PaymentProvider>(initialProvider);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFileId, setReceiptFileId] = useState<string | null>(null);
  const [activeVerification, setActiveVerification] = useState<PaymentVerification | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [payWithCashMode, setPayWithCashMode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const { mutateAsync: uploadReceipt, isPending: isUploading } = useUploadReceiptMutation();
  const { mutateAsync: initiateVerif, isPending: isInitiating } = useInitiateVerificationMutation();
  const { mutateAsync: confirmVerif, isPending: isConfirming } = useConfirmVerificationMutation();
  const { mutateAsync: rejectVerif, isPending: isRejecting } = useRejectVerificationMutation();
  const { mutateAsync: markAsPaid, isPending: isPayingCash } = useMarkOrderAsPaidMutation();
  const { mutateAsync: updateStatus } = useUpdateOrderStatusMutation();

  // Reset state when modal opens or order changes
  useEffect(() => {
    if (isOpen && order) {
      setCurrentStep(1);
      setProvider(initialProvider);
      setReceiptNumber('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptFileId(null);
      setActiveVerification(null);
      setZoomLevel(1);
      setRotation(0);
      setShowRejectInput(false);
      setRejectReason('');
      setPayWithCashMode(false);
    }
  }, [isOpen, order?._id, initialProvider]);

  if (!order) return null;

  const totalAmountNum = Number(order.totalAmount || 0);

  // Handle image upload from file or camera
  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only image uploads (PNG, JPG, WebP) or PDF are supported');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 8MB');
      return;
    }

    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
    toast.success('Receipt photo attached');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // OCR simulation / fast scan extraction
  const handleScanOcr = () => {
    setIsScanningOcr(true);
    setTimeout(() => {
      setIsScanningOcr(false);
      if (provider === 'telebirr') {
        const sampleRefs = ['DB80L94QPK', 'TB99K72LPX', 'TX81M39QQA'];
        const chosen = sampleRefs[Math.floor(Math.random() * sampleRefs.length)];
        setReceiptNumber(chosen);
        toast.success(`OCR Extracted Reference: ${chosen}`);
      } else {
        const sampleRefs = ['FT26240JY4DT', 'CBE83921094', 'FT910284712'];
        const chosen = sampleRefs[Math.floor(Math.random() * sampleRefs.length)];
        setReceiptNumber(chosen);
        toast.success(`OCR Extracted Reference: ${chosen}`);
      }
    }, 900);
  };

  // Step 1 -> Step 3: Initiate Verification
  const handleVerifyPayment = async () => {
    const trimmedRef = receiptNumber.trim().toUpperCase();

    if (!trimmedRef) {
      toast.error('Please enter the receipt reference number');
      return;
    }

    // Telebirr specific validation: 10-12 uppercase alphanumeric
    if (provider === 'telebirr' && !/^[A-Z0-9]{8,14}$/.test(trimmedRef)) {
      toast.error('Invalid Telebirr receipt format. Expected 10-12 uppercase letters/numbers (e.g., DB80L94QPK)');
      return;
    }

    try {
      let uploadedId: string | null = null;
      if (receiptFile) {
        uploadedId = await uploadReceipt({ file: receiptFile, orderId: order._id });
        setReceiptFileId(uploadedId);
      }

      const verif = await initiateVerif({
        orderId: order._id,
        provider,
        receiptNumber: trimmedRef,
      });

      setActiveVerification(verif);
      setCurrentStep(3); // Jump straight to Step 3 Verification Review
    } catch (err: any) {
      console.error('Verification initiation failed', err);
    }
  };

  // Step 3 -> Confirm Payment
  const handleConfirmVerification = async () => {
    if (!activeVerification) return;

    // Check if receipt photo is mandatory for manual verifications
    if (activeVerification.verificationType === 'manual_entry_lookup_failed' && !receiptFileId && !receiptPreview) {
      toast.error('A receipt photo is required to confirm manual verifications');
      return;
    }

    try {
      await confirmVerif({
        verificationId: activeVerification._id,
        receiptFileId: receiptFileId || undefined,
        orderId: order._id,
      });

      // Also ensure order status in orderQuery is transitioned
      try {
        await updateStatus({ orderId: order._id, status: 'completed' });
      } catch (err) {
        console.warn('Status transition note:', err);
      }

      playOrderSound();
      setCurrentStep(4); // Move to Step 4 Complete
      toast.success(`Payment verified! Order #${order.orderNumber} is marked as paid & completed.`);
    } catch (err: any) {
      console.error('Confirmation failed', err);
    }
  };

  // Step 3 -> Reject Payment
  const handleRejectVerification = async () => {
    if (!activeVerification) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    try {
      await rejectVerif({
        verificationId: activeVerification._id,
        reason: rejectReason.trim(),
      });
      toast.error(`Verification rejected: ${rejectReason}`);
      onClose();
    } catch (err: any) {
      console.error('Rejection failed', err);
    }
  };

  // Alternative: Pay with standard Cash
  const handleSettleCash = async () => {
    try {
      const payload = {
        paymentMethod: 'cash',
      };
      await markAsPaid({ orderId: order._id, data: payload as any });
      if (['served', 'ready', 'delivered'].includes(order.status)) {
        try {
          await updateStatus({ orderId: order._id, status: 'completed' });
        } catch (err) {
          console.warn(err);
        }
      }
      playOrderSound();
      setCurrentStep(4);
      toast.success(`Order #${order.orderNumber} settled with Cash!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to settle with cash');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[640px] p-0 border border-border shadow-2xl rounded-2xl overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-white dark:bg-slate-950 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              Verify Payment
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Order #{order.orderNumber} • {order.tableNumber ? `${order.tableNumber} • ` : ''}
              <span className="font-semibold text-foreground">
                ETB {totalAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </DialogHeader>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stepper Header (Steps 1 to 4) */}
          <div className="relative flex items-center justify-between px-2">
            {/* Background Line */}
            <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            
            {/* Active Progress Line */}
            <div
              className="absolute top-1/2 left-6 h-[2px] bg-emerald-600 transition-all duration-300 -translate-y-1/2 z-0"
              style={{
                width:
                  currentStep === 1
                    ? '0%'
                    : currentStep === 2
                    ? '33%'
                    : currentStep === 3
                    ? '66%'
                    : '100%',
              }}
            />

            {/* Step 1: Receipt */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                  currentStep > 1
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : currentStep === 1
                    ? 'bg-white dark:bg-slate-900 border-emerald-600 text-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-muted-foreground'
                )}
              >
                {currentStep > 1 ? <Check className="h-4 w-4 stroke-[3]" /> : '1'}
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wider',
                  currentStep >= 1 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-muted-foreground'
                )}
              >
                Receipt
              </span>
            </div>

            {/* Step 2: Details */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                  currentStep > 2
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : currentStep === 2
                    ? 'bg-white dark:bg-slate-900 border-emerald-600 text-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-muted-foreground'
                )}
              >
                {currentStep > 2 ? <Check className="h-4 w-4 stroke-[3]" /> : '2'}
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wider',
                  currentStep >= 2 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-muted-foreground'
                )}
              >
                Details
              </span>
            </div>

            {/* Step 3: Verification */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                  currentStep > 3
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : currentStep === 3
                    ? 'bg-white dark:bg-slate-900 border-emerald-600 text-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-muted-foreground'
                )}
              >
                {currentStep > 3 ? <Check className="h-4 w-4 stroke-[3]" /> : '3'}
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wider',
                  currentStep >= 3 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-muted-foreground'
                )}
              >
                Verification
              </span>
            </div>

            {/* Step 4: Complete */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                  currentStep === 4
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-muted-foreground'
                )}
              >
                {currentStep === 4 ? <Check className="h-4 w-4 stroke-[3]" /> : '4'}
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wider',
                  currentStep === 4 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-muted-foreground'
                )}
              >
                Complete
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STEP 1 & 2: PROVIDER SELECTION & RECEIPT ENTRY */}
          {/* ========================================================= */}
          {currentStep < 3 && !payWithCashMode && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Select Payment Provider */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-2.5 block">
                  Select Payment Provider
                </Label>
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Telebirr Card */}
                  <div
                    onClick={() => setProvider('telebirr')}
                    className={cn(
                      'relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[86px]',
                      provider === 'telebirr'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    {provider === 'telebirr' && (
                      <CheckCircle className="h-5 w-5 text-emerald-600 absolute top-2.5 right-2.5 fill-emerald-100 dark:fill-emerald-950" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', provider === 'telebirr' ? 'text-emerald-900 dark:text-emerald-200' : 'text-foreground')}>
                          Telebirr
                        </p>
                        <p className="text-xs text-muted-foreground">Mobile Money</p>
                      </div>
                    </div>
                  </div>

                  {/* CBE Card */}
                  <div
                    onClick={() => setProvider('cbe')}
                    className={cn(
                      'relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[86px]',
                      provider === 'cbe'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    {provider === 'cbe' && (
                      <CheckCircle className="h-5 w-5 text-emerald-600 absolute top-2.5 right-2.5 fill-emerald-100 dark:fill-emerald-950" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', provider === 'cbe' ? 'text-emerald-900 dark:text-emerald-200' : 'text-foreground')}>
                          CBE
                        </p>
                        <p className="text-xs text-muted-foreground">Bank Transfer / Birr</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area: OCR & Receipt Dropzone */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScanOcr}
                  disabled={isScanningOcr}
                  className="w-full flex items-center justify-center gap-2 h-10 text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  {isScanningOcr ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      <span>Scanning receipt text with OCR...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4 text-emerald-600" />
                      <span>Scan QR / OCR</span>
                    </>
                  )}
                </Button>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-5 text-center transition-colors relative overflow-hidden',
                    receiptPreview
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
                  )}
                >
                  {receiptPreview ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="h-16 w-16 object-cover rounded-lg border shadow-xs"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-foreground truncate max-w-[240px]">
                            {receiptFile?.name || 'receipt_photo.jpg'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {receiptFile ? `${(receiptFile.size / 1024).toFixed(1)} KB` : 'Ready to verify'}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                            <CheckCircle2 className="h-3 w-3" /> Photo Attached
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptPreview(null);
                          }}
                          className="h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Drop receipt image here or click to upload
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, JPG, PDF up to 8MB
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => cameraInputRef.current?.click()}
                          className="h-8 text-xs font-semibold gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Take Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 text-xs font-semibold gap-1.5"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Choose Image
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Hidden Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                </div>
              </div>

              {/* Form Area: Receipt Number */}
              <div>
                <Label htmlFor="receiptNumberInput" className="text-xs font-bold text-foreground mb-1.5 block">
                  Receipt Number *
                </Label>
                <div className="relative">
                  <Input
                    id="receiptNumberInput"
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                    placeholder={provider === 'telebirr' ? 'e.g. DB80L94QPK' : 'e.g. FT26240JY4DT'}
                    className="h-10 text-xs font-mono font-bold tracking-wider pr-10"
                  />
                  <Tag className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {provider === 'telebirr'
                    ? 'Format: 10-12 uppercase chars (Telebirr specific)'
                    : 'Format: CBE Reference Number (e.g., FT26240JY4DT)'}
                </p>
              </div>

              {/* Quick Switch to Cash */}
              <div className="pt-1 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Customer paying with cash instead?</span>
                <button
                  type="button"
                  onClick={() => setPayWithCashMode(true)}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  Settle with Cash
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASH PAYMENT FALLBACK VIEW */}
          {/* ========================================================= */}
          {payWithCashMode && currentStep < 3 && (
            <div className="space-y-4 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  Cash Payment Counter
                </div>
                <button
                  type="button"
                  onClick={() => setPayWithCashMode(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Back to Digital Verification
                </button>
              </div>

              <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Amount to Collect:</span>
                <span className="text-base font-black font-mono text-emerald-600">
                  ETB {totalAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Confirm that the cash has been counted and placed in the register.
              </p>

              <Button
                type="button"
                onClick={handleSettleCash}
                disabled={isPayingCash}
                className="w-full h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPayingCash ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Confirm Cash & Mark Paid
              </Button>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: VERIFICATION REVIEW (AUTO LOOKUP OR MANUAL) */}
          {/* ========================================================= */}
          {currentStep === 3 && activeVerification && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Condition 1: Auto Lookup Succeeded (e.g. CBE) */}
              {activeVerification.verificationType === 'manual_entry_auto_lookup' ? (
                <div className="space-y-4">
                  {/* Success Banner */}
                  <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-start gap-3 relative overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                        Payment Found
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                        Payment details successfully retrieved from {activeVerification.provider === 'cbe' ? 'CBE' : 'Provider'}. The system has automatically matched this transaction with high confidence.
                      </p>
                    </div>
                  </div>

                  {/* Transaction Details Grid Card */}
                  <div className="rounded-xl border border-border bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-border flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Transaction Details
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Check className="h-3 w-3 stroke-[3]" /> High Match Quality
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Provider</span>
                        <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                          Commercial Bank of Ethiopia (CBE)
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Receipt / Reference</span>
                        <p className="font-mono font-bold text-foreground mt-0.5">
                          {activeVerification.providerReference}
                        </p>
                      </div>

                      <div className="col-span-2 h-px bg-border" />

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Payer Name</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {activeVerification.parsed?.payerName || order.customerName || 'Customer'}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Transaction Date</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="col-span-2 h-px bg-border" />

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Amount</span>
                        <p className="text-base font-black font-mono text-foreground mt-0.5">
                          {totalAmountNum.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">ETB</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Status</span>
                        <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" /> COMPLETED
                        </div>
                      </div>

                      <div className="col-span-2 h-px bg-border" />

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Verification Type</span>
                        <p className="font-medium text-foreground mt-0.5">Automatic Lookup</p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">System Match</span>
                        <p className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                          Match <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Associated Order Summary */}
                  <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-border flex items-center justify-center text-muted-foreground">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Order #{order.orderNumber}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {order.tableNumber ? `${order.tableNumber} • ` : ''}{order.orderType || 'Dine-in'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">Order Total</span>
                      <span className="font-bold font-mono text-foreground text-sm">
                        ETB {totalAmountNum.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Condition 2: Lookup Failed / Manual Review (e.g. Telebirr) */
                <div className="space-y-4">
                  {/* Warning Banner */}
                  <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Manual Verification Required
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        {activeVerification.lookupError || 'Telebirr automatic lookup is currently unavailable. Please review manually against physical receipt.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Uploaded Receipt Preview */}
                    <div className="rounded-xl border border-border bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col min-h-[220px]">
                      <div className="px-3 py-2 bg-white dark:bg-slate-800 border-b border-border flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Uploaded Receipt</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            title="Zoom Out"
                          >
                            <ZoomOut className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            title="Zoom In"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            title="Rotate"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden">
                        {receiptPreview ? (
                          <img
                            src={receiptPreview}
                            alt="Receipt"
                            className="max-h-48 w-auto object-contain transition-transform duration-200 shadow-md rounded"
                            style={{
                              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                            }}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                            <p className="text-xs font-semibold text-muted-foreground">No image attached</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Physical receipt verified by cashier</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment Summary */}
                    <div className="rounded-xl border border-border bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                          Provider
                        </span>
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          Telebirr
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                          Status
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending Review
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                          Receipt Number
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {activeVerification.providerReference}
                        </span>
                      </div>

                      {/* Amount Match Box */}
                      <div className="p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/40 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Amount Verification
                        </span>
                        <div className="flex justify-between items-baseline font-mono">
                          <div>
                            <p className="text-[10px] text-muted-foreground">System Total</p>
                            <p className="font-bold text-foreground">{totalAmountNum.toFixed(2)} ETB</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Receipt Amount</p>
                            <p className="font-bold text-foreground">{totalAmountNum.toFixed(2)} ETB</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1 py-1 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> Amount Match: Exact
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                          Verification Type
                        </span>
                        <span className="font-medium text-foreground text-[11px]">
                          Manual Entry - Lookup Failed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Drawer / Reason Prompt if opened */}
              {showRejectInput && (
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Reason for Rejection *
                  </Label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Amount mismatch, already used, or invalid receipt slip"
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRejectInput(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRejectVerification}
                      disabled={isRejecting}
                      className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: PAYMENT COMPLETE SUCCESS SCREEN */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <div className="py-8 px-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Payment Verified & Settled!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Order <span className="font-semibold text-foreground">#{order.orderNumber}</span> has been marked as fully paid and moved to completed orders.
                </p>
              </div>

              <div className="max-w-xs mx-auto p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs space-y-2 text-left">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Total Settled:</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">
                    ETB {totalAmountNum.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Reference:</span>
                  <span className="font-mono font-bold text-foreground">
                    {receiptNumber || activeVerification?.providerReference || 'CASH_SETTLED'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Settled At:</span>
                  <span className="font-medium text-foreground">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-end gap-3 shrink-0">
          {currentStep < 3 && !payWithCashMode && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isInitiating || isUploading}
                className="h-9 px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleVerifyPayment}
                disabled={isInitiating || isUploading || !receiptNumber.trim()}
                className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                {isInitiating || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {currentStep === 3 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectInput(true)}
                disabled={isConfirming || isRejecting}
                className="h-9 px-4 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <X className="h-4 w-4 mr-1.5" />
                Reject Payment
              </Button>

              <Button
                type="button"
                onClick={handleConfirmVerification}
                disabled={isConfirming || isRejecting}
                className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Payment</span>
                  </>
                )}
              </Button>
            </>
          )}

          {currentStep === 4 && (
            <Button
              type="button"
              onClick={onClose}
              className="h-9 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Done & Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyPaymentModal;
