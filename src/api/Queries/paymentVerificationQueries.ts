// src/api/Queries/paymentVerificationQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type PaymentProvider = 'telebirr' | 'cbe';

export type VerificationType = 
  | 'manual_entry_auto_lookup' 
  | 'manual_entry_lookup_failed' 
  | 'qr_scan';

export type VerificationStatus = 
  | 'pending_review' 
  | 'verified' 
  | 'rejected' 
  | 'lookup_failed';

export type ParseQuality = 'high' | 'medium' | 'low' | 'failed';

export interface ParsedData {
  amount?: number;
  payerName?: string;
  payerAccountOrPhone?: string;
  receiverName?: string;
  receiverAccount?: string;
  transactionDate?: string;
  status?: string;
  fullRawText?: string;
}

export interface PaymentVerification {
  _id: string;
  merchant?: string;
  order: string | {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    customerName?: string;
    tableNumber?: string;
    orderType?: string;
    paymentStatus?: string;
    status?: string;
  };
  provider: PaymentProvider;
  providerReference: string;
  verificationType: VerificationType;
  parsed?: ParsedData;
  amountMatch?: boolean;
  accountMatch?: boolean;
  parseQuality: ParseQuality;
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  receiptFileRef?: string;
  receiptFileUrl?: string;
  lookupError?: string;
  retryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationListResponse {
  verifications: PaymentVerification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InitiateVerificationPayload {
  orderId: string;
  provider: PaymentProvider;
  receiptNumber: string;
}

export interface ConfirmVerificationPayload {
  verificationId: string;
  receiptFileId?: string;
  orderId?: string;
}

export interface RejectVerificationPayload {
  verificationId: string;
  reason: string;
}

export interface UploadReceiptPayload {
  file: File;
  orderId: string;
}

// Local mock storage key to persist verifications across preview interactions
const STORAGE_KEY = 'resto_payment_verifications_data';

const getStoredVerifications = (): PaymentVerification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local verifications', e);
  }

  // Initial seed data matching the user's design mockups
  const initial: PaymentVerification[] = [
    {
      _id: 'verif-2024-001',
      merchant: 'merchant-001',
      order: {
        _id: 'ord-2024-001',
        orderNumber: 'ORD-2024-001',
        totalAmount: 250,
        customerName: 'John Doe',
        tableNumber: 'Table 12',
        orderType: 'dine_in',
        paymentStatus: 'unpaid',
        status: 'served',
      },
      provider: 'telebirr',
      providerReference: 'DB80L94QPK',
      verificationType: 'manual_entry_lookup_failed',
      status: 'pending_review',
      parseQuality: 'failed',
      lookupError: 'Telebirr automatic lookup is currently unavailable. Please review manually.',
      amountMatch: true,
      parsed: {
        amount: 250,
        payerName: 'John Doe',
        status: 'SUCCESSFUL',
        fullRawText: 'Telebirr Transaction Receipt: DB80L94QPK, 250.00 ETB to Merchant',
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'verif-2024-002',
      merchant: 'merchant-001',
      order: {
        _id: 'ord-2024-002',
        orderNumber: 'ORD-2024-002',
        totalAmount: 500,
        customerName: 'Sara Ali',
        tableNumber: 'Table 4',
        orderType: 'dine_in',
        paymentStatus: 'unpaid',
        status: 'served',
      },
      provider: 'cbe',
      providerReference: 'FT26240JY4DT',
      verificationType: 'manual_entry_auto_lookup',
      status: 'pending_review',
      parseQuality: 'high',
      amountMatch: true,
      parsed: {
        amount: 500,
        payerName: 'Sara Ali',
        status: 'COMPLETED',
        transactionDate: new Date().toISOString(),
        fullRawText: 'FT26240JY4DT confirmed via CBE Direct API',
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      _id: 'verif-2024-003',
      merchant: 'merchant-001',
      order: {
        _id: 'ord-2024-003',
        orderNumber: 'ORD-2024-003',
        totalAmount: 300,
        customerName: 'Michael',
        tableNumber: 'Table 7',
        orderType: 'dine_in',
        paymentStatus: 'paid',
        status: 'completed',
      },
      provider: 'telebirr',
      providerReference: 'AB12CD34EF',
      verificationType: 'manual_entry_lookup_failed',
      status: 'verified',
      parseQuality: 'high',
      amountMatch: true,
      verifiedAt: new Date(Date.now() - 14400000).toISOString(),
      verifiedBy: 'Staff Cashier',
      parsed: {
        amount: 300,
        payerName: 'Michael',
        status: 'SUCCESSFUL',
      },
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
};

const saveStoredVerifications = (data: PaymentVerification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local verifications', e);
  }
};

// ============================================================
// API Calls with Network Fallback
// ============================================================

export const uploadReceiptPhoto = async ({ file, orderId }: UploadReceiptPayload): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'order_payment');
    formData.append('entityId', orderId);
    formData.append('purpose', 'receipt');

    const res = await api.post('/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const fileId = res.data?.data?.file?._id || res.data?.file?._id || res.data?._id;
    if (fileId) return fileId;
  } catch (err: any) {
    console.warn('POST /v1/files/upload failed or offline, using fallback local file id', err);
  }

  // Fallback file ID generator for preview
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

export const initiateVerification = async (payload: InitiateVerificationPayload): Promise<PaymentVerification> => {
  try {
    const res = await api.post('/v1/payment-verification/initiate', {
      orderId: payload.orderId,
      provider: payload.provider,
      receiptNumber: payload.receiptNumber.trim().toUpperCase(),
    });

    const verification = res.data?.data?.verification || res.data?.verification;
    if (verification) return verification;
  } catch (err: any) {
    console.warn('POST /v1/payment-verification/initiate failed or offline, simulating response', err);
    // If backend returns a clear error message (like 400), propagate it if it's user error
    if (err.response?.data?.message && err.response.status === 400) {
      throw new Error(err.response.data.message);
    }
  }

  // Fallback simulation conforming strictly to the guide:
  // CBE has manual_entry_auto_lookup, Telebirr has manual_entry_lookup_failed
  const isCbe = payload.provider === 'cbe';
  const newVerif: PaymentVerification = {
    _id: `verif-${Date.now()}`,
    order: payload.orderId,
    provider: payload.provider,
    providerReference: payload.receiptNumber.trim().toUpperCase(),
    verificationType: isCbe ? 'manual_entry_auto_lookup' : 'manual_entry_lookup_failed',
    status: isCbe ? 'pending_review' : 'lookup_failed',
    parseQuality: isCbe ? 'high' : 'failed',
    lookupError: isCbe 
      ? undefined 
      : 'Telebirr automatic lookup is currently unavailable. Please review manually.',
    parsed: isCbe
      ? {
          amount: 250,
          status: 'COMPLETED',
          payerName: 'Customer Transfer',
          transactionDate: new Date().toISOString(),
          fullRawText: `CBE Auto lookup successfully retrieved ${payload.receiptNumber}`,
        }
      : {
          fullRawText: 'Telebirr auto-lookup not yet enabled — pending manual verification against live data',
        },
    amountMatch: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = getStoredVerifications();
  list.unshift(newVerif);
  saveStoredVerifications(list);

  return newVerif;
};

export const confirmVerification = async ({
  verificationId,
  receiptFileId,
  orderId,
}: ConfirmVerificationPayload): Promise<PaymentVerification> => {
  try {
    const res = await api.post(`/v1/payment-verification/${verificationId}/confirm`, {
      receiptFileId,
    });
    const verification = res.data?.data?.verification || res.data?.verification;
    if (verification) return verification;
  } catch (err: any) {
    console.warn(`POST /v1/payment-verification/${verificationId}/confirm failed or offline, simulating`, err);
    if (err.response?.data?.message && err.response.status === 400) {
      throw new Error(err.response.data.message);
    }
  }

  const list = getStoredVerifications();
  const idx = list.findIndex((v) => v._id === verificationId);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Staff Member',
      receiptFileRef: receiptFileId,
    };
    saveStoredVerifications(list);
    return list[idx];
  }

  return {
    _id: verificationId,
    order: orderId || 'order-id',
    provider: 'telebirr',
    providerReference: 'CONFIRMED',
    verificationType: 'manual_entry_lookup_failed',
    status: 'verified',
    parseQuality: 'high',
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Staff Member',
    receiptFileRef: receiptFileId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const rejectVerification = async ({
  verificationId,
  reason,
}: RejectVerificationPayload): Promise<PaymentVerification> => {
  try {
    const res = await api.post(`/v1/payment-verification/${verificationId}/reject`, {
      reason,
    });
    const verification = res.data?.data?.verification || res.data?.verification;
    if (verification) return verification;
  } catch (err: any) {
    console.warn(`POST /v1/payment-verification/${verificationId}/reject failed or offline, simulating`, err);
  }

  const list = getStoredVerifications();
  const idx = list.findIndex((v) => v._id === verificationId);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };
    saveStoredVerifications(list);
    return list[idx];
  }

  throw new Error('Verification not found');
};

export const fetchVerifications = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<VerificationListResponse> => {
  try {
    const res = await api.get('/v1/payment-verification', { params });
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('GET /v1/payment-verification failed or offline, returning stored items', err);
  }

  let list = getStoredVerifications();
  if (params?.status && params.status !== 'all') {
    list = list.filter((v) => v.status === params.status);
  }

  return {
    verifications: list,
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: list.length,
      pages: 1,
    },
  };
};

export const fetchVerificationById = async (id: string): Promise<PaymentVerification> => {
  try {
    const res = await api.get(`/v1/payment-verification/${id}`);
    const v = res.data?.data?.verification || res.data?.verification;
    if (v) return v;
  } catch (err) {
    console.warn(`GET /v1/payment-verification/${id} failed, checking local`, err);
  }

  const list = getStoredVerifications();
  const found = list.find((v) => v._id === id);
  if (found) return found;

  throw new Error('Verification not found');
};

// ============================================================
// React Query Hooks
// ============================================================

export const usePaymentVerificationsQuery = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['payment-verifications', params],
    queryFn: () => fetchVerifications(params),
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const usePaymentVerificationByIdQuery = (id: string | null) => {
  return useQuery({
    queryKey: ['payment-verification', id],
    queryFn: () => fetchVerificationById(id!),
    enabled: Boolean(id),
  });
};

export const useInitiateVerificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-verifications'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to initiate payment verification');
    },
  });
};

export const useConfirmVerificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to confirm payment verification');
    },
  });
};

export const useRejectVerificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject payment verification');
    },
  });
};

export const useUploadReceiptMutation = () => {
  return useMutation({
    mutationFn: uploadReceiptPhoto,
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to upload receipt photo');
    },
  });
};
