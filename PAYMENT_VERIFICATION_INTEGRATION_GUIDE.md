# Payment Verification Frontend Integration Guide

This guide is for the merchant/back-office app only. It covers how to integrate the payment verification flow used to review Telebirr and CBE payments before confirming an order as paid.

## 1. Scope

The payment verification flow lives in the merchant dashboard and is not part of the customer-facing mobile app.

Relevant merchant app files:
- `src/api/Queries/paymentVerificationQueries.ts`
- `src/features/Order/pages/PaymentVerificationPage.tsx`
- `src/features/Order/Components/VerifyPaymentModal.tsx`
- `src/router/Routers.tsx`

## 2. Backend API contract

Base URL:
- `/api/v1`

### 2.1 List verifications

Method:
- GET `/api/v1/payment-verification`

Query params:
- `status` optional: `pending_review`, `verified`, `rejected`, `lookup_failed`
- `page` optional
- `limit` optional

Example:
```http
GET /api/v1/payment-verification?status=pending_review&page=1&limit=20
```

Success response:
```json
{
  "status": "success",
  "data": {
    "verifications": [
      {
        "_id": "64f2...",
        "merchant": "64a1...",
        "order": {
          "_id": "64a2...",
          "orderNumber": "ORD-2042",
          "totalAmount": 250,
          "customerName": "John Doe",
          "tableNumber": "Table 12",
          "orderType": "dine_in",
          "paymentStatus": "unpaid",
          "status": "served"
        },
        "provider": "telebirr",
        "providerReference": "DB80L94QPK",
        "verificationType": "manual_entry_lookup_failed",
        "parsed": {
          "amount": 250,
          "payerName": "John Doe",
          "status": "SUCCESSFUL",
          "fullRawText": "Telebirr Transaction Receipt..."
        },
        "amountMatch": true,
        "accountMatch": true,
        "parseQuality": "high",
        "status": "pending_review",
        "lookupError": "Telebirr automatic lookup is currently unavailable. Please review manually.",
        "receiptFileRef": "64d1...",
        "createdAt": "2026-09-04T12:00:00.000Z",
        "updatedAt": "2026-09-04T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "pages": 1
    }
  }
}
```

### 2.2 Initiate verification

Method:
- POST `/api/v1/payment-verification/initiate`

Body:
```json
{
  "orderId": "64a2...",
  "provider": "telebirr",
  "receiptNumber": "DB80L94QPK"
}
```

Supported providers:
- `telebirr`
- `cbe`
- `cbebirr`

### 2.3 Confirm verification

Method:
- POST `/api/v1/payment-verification/:id/confirm`

Body:
```json
{
  "receiptFileId": "64d1..."
}
```

Purpose:
- mark verification as approved
- update order payment status as paid when validation succeeds

### 2.4 Reject verification

Method:
- POST `/api/v1/payment-verification/:id/reject`

Body:
```json
{
  "reason": "Amount mismatch and transaction failed"
}
```

### 2.5 Fetch single verification

Method:
- GET `/api/v1/payment-verification/:id`

### 2.6 Upload receipt file

Method:
- POST `/api/v1/files/upload`

Form-data:
- `file`
- `entityType`: `order_payment`
- `entityId`: order id
- `purpose`: `receipt`

This is required for manual verification when the provider cannot be auto-validated and staff must attach evidence.

## 3. Status model

Important values from the backend and merchant app:

- `pending_review` - waiting for staff review
- `lookup_failed` - data lookup failed or provider was not sufficient; manual attention required
- `verified` - confirmed and accepted
- `rejected` - rejected by staff

These are the main states to render in the UI and filter on.

## 4. Provider-specific behavior

### Telebirr
- Usually needs manual review if live lookup is unavailable.
- `verificationType` may be `manual_entry_lookup_failed`.
- Staff may need to upload a receipt photo before confirming.

### CBE / CBE Birr
- Can return a PDF receipt and metadata.
- `parseQuality` may be `high`, `medium`, `low`, or `failed`.
- PDF-based flows should be treated as evidence-first and staff-reviewed.

## 5. Main frontend data shape

Use this TypeScript interface in the merchant app:

```ts
export type PaymentProvider = 'telebirr' | 'cbe' | 'cbebirr';

export type VerificationStatus =
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'lookup_failed';

export type VerificationType =
  | 'manual_entry_auto_lookup'
  | 'manual_entry_lookup_failed'
  | 'qr_scan';

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
  parsed?: {
    amount?: number;
    payerName?: string;
    payerAccountOrPhone?: string;
    receiverName?: string;
    receiverAccount?: string;
    transactionDate?: string;
    status?: string;
    fullRawText?: string;
  };
  amountMatch?: boolean;
  accountMatch?: boolean;
  parseQuality: 'high' | 'medium' | 'low' | 'failed';
  status: VerificationStatus;
  verificationType?: VerificationType;
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
```

## 6. React Query integration pattern

Use a query file similar to this pattern:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const usePaymentVerificationsQuery = (params?: { status?: string }) =>
  useQuery({
    queryKey: ['payment-verifications', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/payment-verification', { params });
      return data.data;
    },
    staleTime: 15_000,
  });

export const useConfirmVerificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ verificationId, receiptFileId }: { verificationId: string; receiptFileId?: string }) => {
      const { data } = await api.post(`/v1/payment-verification/${verificationId}/confirm`, {
        receiptFileId,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-verifications'] });
    },
  });
};

export const useRejectVerificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ verificationId, reason }: { verificationId: string; reason: string }) => {
      const { data } = await api.post(`/v1/payment-verification/${verificationId}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-verifications'] });
    },
  });
};
```

## 7. UI flow for the merchant app

### 7.1 Payment verification page

Add a route under the merchant dashboard:

```tsx
<Route path="payment-verification" element={<PaymentVerificationPage />} />
```

Recommended page sections:
- summary metrics
- filter by status/provider
- search by order number, reference, or customer name
- table of pending verification items
- review detail modal
- approve/reject actions

### 7.2 Review item row

Each row should display:
- order number
- customer name
- provider (Telebirr / CBE)
- reference
- amount
- status badge
- created time
- “Review” button

### 7.3 Detail modal

The review modal should show:
- order summary
- provider and reference
- extracted data
- raw text / match status
- uploaded receipt evidence
- approve / reject buttons
- reason box for reject action

The backend may include:
- `parsed.amount`
- `parsed.status`
- `parsed.payerName`
- `parsed.receiverName`
- `lookupError`
- `receiptFileRef`

### 7.4 Receipt upload

When staff needs to validate a manual payment, allow upload:

```ts
const uploadReceiptPhoto = async ({ file, orderId }: { file: File; orderId: string }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', 'order_payment');
  formData.append('entityId', orderId);
  formData.append('purpose', 'receipt');

  const res = await api.post('/v1/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data?.data?.file?._id || res.data?.file?._id;
};
```

Then pass the returned `receiptFileId` to the confirm endpoint.

## 8. Required user actions

When a verification is in `pending_review` or `lookup_failed`:

1. Staff opens the review detail
2. Checks extracted provider data
3. Reviews attached receipt or uploaded file
4. Confirms if valid
5. Rejects with clear reason if invalid

If the user confirms a manual verification, send:
```json
{
  "receiptFileId": "64d1..."
}
```

If rejection is chosen, send:
```json
{
  "reason": "Incorrect amount / transaction not found"
}
```

## 9. Validation and error handling

Handle these cases explicitly:

- no verification items
- provider mismatch
- invalid object ID
- duplicate payment verification
- upload failure
- successful verification already exists
- order already paid

Frontend UX patterns:
- toast errors on failed confirm/reject
- disable buttons while mutation is pending
- show spinner states
- keep search and filter state in the page
- refresh list after mutation success

## 10. Example flow for the merchant dashboard

```tsx
const { data, isLoading, refetch } = usePaymentVerificationsQuery({ status: 'pending_review' });
const { mutateAsync: confirmVerif } = useConfirmVerificationMutation();
const { mutateAsync: rejectVerif } = useRejectVerificationMutation();

const handleApprove = async (verificationId: string) => {
  await confirmVerif({ verificationId });
  refetch();
};

const handleReject = async (verificationId: string, reason: string) => {
  await rejectVerif({ verificationId, reason });
  refetch();
};
```

## 11. Recommended route placement

Add the page under the merchant/admin route tree, for example:
- `/orders/payment-verification`
- or `/payments/verification`

This screen should be accessible only from merchant staff authorization and not from the customer-facing app.

## 12. Production notes

- Do not allow direct client-side trust of QR payloads or provider URLs.
- Always rely on backend validation and provider checks.
- Keep manual review tasks visible in the staff dashboard.
- For Telebirr or CBE flows where the provider cannot verify automatically, keep the record in `pending_review` instead of auto-approving.
- Treat `lookup_failed` and `pdf_manual_review_required` states as evidence review tasks, not as auto-success states.

## 13. Reference implementation already in the merchant app

The merchant app already contains the expected structure and logic for this:
- `src/api/Queries/paymentVerificationQueries.ts`
- `src/features/Order/pages/PaymentVerificationPage.tsx`
- `src/features/Order/Components/VerifyPaymentModal.tsx`

Use those as the baseline contract while adapting them to your exact UI design.

## 14. Final recommendation

The implementation should be done entirely in the merchant app. The customer app should not handle staff approval, reject flows, payment verification review, or receipt evidence confirmation.

This keeps the authority boundary correct and matches the backend security model.
