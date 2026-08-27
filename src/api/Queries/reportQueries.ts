// src/api/Queries/reportQueries.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AxiosError } from 'axios';

// ─── Query Parameters ─────────────────────────────────────────────────────────

export interface ReportQueryParams {
  dateFrom: string; // ISO string or YYYY-MM-DD
  dateTo: string;   // ISO string or YYYY-MM-DD
  branchId?: string | null;
  groupBy?: 'day' | 'week' | 'month';
  page?: number;
  limit?: number;
  format?: 'json' | 'csv';
}

export interface ReportMeta {
  dateFrom: string;
  dateTo: string;
  branchId: string | null;
  page: number;
  pages: number;
  total: number;
}

export interface ReportEnvelope<TData> {
  status: 'success' | 'error';
  data: TData;
  meta: ReportMeta;
  warnings?: Array<{
    code: string;
    message: string;
    recommendation?: string;
  }>;
}

// ─── 1. Sales Report ──────────────────────────────────────────────────────────

export interface SalesReportSummary {
  grossRevenue: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalRefunds: number; // hardcoded 0 in backend pending Phase 3
  totalDeliveryFees: number;
  netRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    mobile_banking: number;
    unspecified: number;
  };
}

export interface SalesReportBreakdownItem {
  period: string;
  grossRevenue: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalDeliveryFees: number;
  netRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface SalesReportData {
  summary: SalesReportSummary;
  breakdown: SalesReportBreakdownItem[];
}

// ─── 2. Orders Report ─────────────────────────────────────────────────────────

export interface OrdersReportSummary {
  totalOrders: number;
  ordersByStatus: {
    pending: number;
    accepted: number;
    preparing: number;
    ready: number;
    completed: number;
    canceled: number;
  };
  cancellationRate: number;
  averagePreparationTime: number | null; // null when no orders have readyAt
  ordersWithPreparationTime: number;
}

export interface OrdersReportBreakdownItem {
  period: string;
  orderCount: number;
  ordersByStatus: {
    pending: number;
    accepted: number;
    preparing: number;
    ready: number;
    completed: number;
    canceled: number;
  };
  cancellationRate: number;
}

export interface OrdersReportData {
  summary: OrdersReportSummary;
  breakdown: OrdersReportBreakdownItem[];
}

// ─── 3. Products Report ───────────────────────────────────────────────────────

export interface ProductReportItem {
  menuItemId: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
}

export interface ProductsReportSummary {
  totalItemsSold: number;
  totalItemRevenue: number;
  uniqueItemsCount: number;
  topItems: ProductReportItem[];
  lowPerformers: ProductReportItem[];
  lowPerformerThreshold: number;
  categoryBreakdown: Record<string, {
    quantitySold: number;
    revenue: number;
    itemCount: number;
  }>;
}

export interface ProductsReportBreakdownItem {
  period: string;
  menuItemId: string;
  menuItemName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
}

export interface ProductsReportData {
  summary: ProductsReportSummary;
  breakdown: ProductsReportBreakdownItem[];
}

// ─── 4. Customers Report ──────────────────────────────────────────────────────

export interface TopCustomerItem {
  customerId: string;
  customerName: string;
  totalSpend: number;
  orderCount: number;
  customerType: 'new' | 'returning' | string;
}

export interface CustomersReportSummary {
  newCustomerCount: number;
  returningCustomerCount: number;
  totalCustomers: number;
  spendDistribution: {
    percentile25th: number;
    percentile50th: number;
    percentile75th: number;
    percentile90th: number;
  };
  topCustomers: TopCustomerItem[];
}

export interface CustomersReportBreakdownItem {
  period: string;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
}

export interface CustomersReportData {
  summary: CustomersReportSummary;
  breakdown: CustomersReportBreakdownItem[];
}

// ─── 5. Delivery Report ───────────────────────────────────────────────────────

export interface DeliveryReportSummary {
  deliveryOrderCount: number;
  totalDeliveryFees: number;
  averageDeliveryDuration: number | null; // minutes or null
  onTimeDeliveryPercentage: number | null; // always null pending SLA
}

export interface DeliveryReportBreakdownItem {
  period: string;
  deliveryOrderCount: number;
  totalDeliveryFees: number;
  averageDeliveryFee: number;
  ordersWithDuration: number;
}

export interface DeliveryReportData {
  summary: DeliveryReportSummary;
  breakdown: DeliveryReportBreakdownItem[];
}

// ─── 6. Staff Report ──────────────────────────────────────────────────────────

export interface TopStaffPerformer {
  staffId: string;
  staffType: 'waiter' | 'kitchen' | string;
  orderCount: number;
  averageTurnaroundMinutes: number;
}

export interface StaffReportSummary {
  totalWaiters: number;
  totalKitchenStaff: number;
  totalStaff: number;
  totalOrdersHandled: number;
  averageOrdersPerStaff: number;
  topPerformers: TopStaffPerformer[];
  waiterStats: {
    totalOrders: number;
    averageTurnaround: number;
  };
  kitchenStats: {
    totalOrders: number;
    averageTurnaround: number;
  };
}

export interface StaffReportBreakdownItem {
  period: string;
  totalOrders: number;
  waiterOrders: number;
  kitchenOrders: number;
  activeWaiters: number;
  activeKitchenStaff: number;
}

export interface StaffReportData {
  summary: StaffReportSummary;
  breakdown: StaffReportBreakdownItem[];
}

// ─── 7. Inventory Report ──────────────────────────────────────────────────────

export interface LowStockReportItem {
  ingredientId: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  stockValue: number;
}

export interface InventoryCategoryItem {
  category: string;
  value: number;
}

export interface InventoryReportSummary {
  totalStockValue: number;
  totalItems: number;
  lowStockItemCount: number;
  lowStockItems: LowStockReportItem[];
  movements: {
    totalInbound: number;
    totalOutbound: number;
    netChange: number;
    movementCount: number;
  };
  categoryBreakdown: InventoryCategoryItem[]; // Array in inventory report
}

export interface InventoryReportBreakdownItem {
  period: string;
  inboundMovements: number;
  outboundMovements: number;
  inboundValue: number;
  outboundValue: number;
  netValue: number;
}

export interface InventoryReportData {
  summary: InventoryReportSummary;
  breakdown: InventoryReportBreakdownItem[];
}

// ─── 8. Profitability Report ──────────────────────────────────────────────────

export interface LowMarginReportItem {
  menuItemId: string;
  totalRevenue: number;
  totalCost: number;
  margin: number;
  totalQuantity: number;
}

export interface ProfitabilityReportSummary {
  totalCOGS: number;
  grossRevenue: number;
  totalDiscounts: number;
  totalTaxes: number;
  netRevenue: number;
  grossProfit: number;
  grossMarginPercentage: number;
  itemsWithoutCost: number;
  lowMarginItems: LowMarginReportItem[];
}

export interface ProfitabilityReportBreakdownItem {
  period: string;
  totalCOGS: number;
  netRevenue: number;
  grossProfit: number;
  grossMarginPercentage: number;
  itemsWithoutCost: number;
}

export interface ProfitabilityReportData {
  summary: ProfitabilityReportSummary;
  breakdown: ProfitabilityReportBreakdownItem[];
}

// ─── Export Job Types ─────────────────────────────────────────────────────────

export type ReportType =
  | 'sales'
  | 'orders'
  | 'products'
  | 'customers'
  | 'delivery'
  | 'profitability'
  | 'staff'
  | 'inventory';

export interface CreateExportJobInput {
  reportType: ReportType;
  dateFrom: string;
  dateTo: string;
  branchId?: string | null;
  format?: 'csv'; // Only CSV is operational right now (xlsx/pdf return 501)
}

export interface ExportJob {
  jobId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  reportType: ReportType;
  format: 'csv' | 'xlsx' | 'pdf';
  dateFrom?: string;
  dateTo?: string;
  branchId?: string | null;
  createdAt: string;
  completedAt?: string | null;
  fileId?: string | null;
  errorMessage?: string | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reportKeys = {
  all: ['reports'] as const,
  sales: (params: ReportQueryParams) => [...reportKeys.all, 'sales', params] as const,
  orders: (params: ReportQueryParams) => [...reportKeys.all, 'orders', params] as const,
  products: (params: ReportQueryParams) => [...reportKeys.all, 'products', params] as const,
  customers: (params: ReportQueryParams) => [...reportKeys.all, 'customers', params] as const,
  delivery: (params: ReportQueryParams) => [...reportKeys.all, 'delivery', params] as const,
  staff: (params: ReportQueryParams) => [...reportKeys.all, 'staff', params] as const,
  inventory: (params: ReportQueryParams) => [...reportKeys.all, 'inventory', params] as const,
  profitability: (params: ReportQueryParams) => [...reportKeys.all, 'profitability', params] as const,
  exportJob: (jobId: string) => [...reportKeys.all, 'export-job', jobId] as const,
};

// ─── Helpers: Clean Params ───────────────────────────────────────────────────

const cleanParams = (params: ReportQueryParams) => {
  const query: Record<string, any> = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    groupBy: params.groupBy || 'day',
    page: params.page || 1,
    limit: params.limit || 50,
  };
  if (params.branchId) {
    query.branchId = params.branchId;
  }
  if (params.format) {
    query.format = params.format;
  }
  return query;
};

// ─── React Query Hooks ────────────────────────────────────────────────────────

export const useSalesReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<SalesReportData>, AxiosError>({
    queryKey: reportKeys.sales(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/sales', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useOrdersReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<OrdersReportData>, AxiosError>({
    queryKey: reportKeys.orders(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/orders', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useProductsReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<ProductsReportData>, AxiosError>({
    queryKey: reportKeys.products(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/products', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useCustomersReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<CustomersReportData>, AxiosError>({
    queryKey: reportKeys.customers(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/customers', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useDeliveryReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<DeliveryReportData>, AxiosError>({
    queryKey: reportKeys.delivery(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/delivery', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useStaffReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<StaffReportData>, AxiosError>({
    queryKey: reportKeys.staff(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/staff', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useInventoryReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<InventoryReportData>, AxiosError>({
    queryKey: reportKeys.inventory(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/inventory', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

export const useProfitabilityReportQuery = (params: ReportQueryParams, enabled = true) =>
  useQuery<ReportEnvelope<ProfitabilityReportData>, AxiosError>({
    queryKey: reportKeys.profitability(params),
    queryFn: async () => {
      const { data } = await api.get('/v1/reports/profitability', { params: cleanParams(params) });
      return data;
    },
    enabled: enabled && !!params.dateFrom && !!params.dateTo,
    staleTime: 60 * 1000,
  });

// ─── Export Mutations & Polling ───────────────────────────────────────────────

export const useCreateExportJobMutation = () =>
  useMutation<{ data: ExportJob }, AxiosError, CreateExportJobInput>({
    mutationFn: async (payload) => {
      const body: Record<string, any> = {
        reportType: payload.reportType,
        dateFrom: payload.dateFrom,
        dateTo: payload.dateTo,
        format: payload.format || 'csv',
      };
      if (payload.branchId) body.branchId = payload.branchId;
      const { data } = await api.post('/v1/reports/exports', body);
      return data;
    },
  });

export const useExportJobStatusQuery = (jobId: string | null, enabled = true) =>
  useQuery<{ data: ExportJob }, AxiosError>({
    queryKey: reportKeys.exportJob(jobId || ''),
    queryFn: async () => {
      const { data } = await api.get(`/v1/reports/exports/${jobId}`);
      return data;
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'ready' || status === 'failed') return false;
      return 2500; // Poll every 2.5 seconds while pending/processing
    },
  });

/**
 * Direct Synchronous CSV Export helper
 */
export const downloadSyncReportCsv = async (
  reportType: ReportType,
  params: ReportQueryParams
) => {
  const query = cleanParams({ ...params, format: 'csv' });
  const response = await api.get(`/v1/reports/${reportType}`, {
    params: query,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `${reportType}_report_${params.dateFrom.slice(0, 10)}_to_${params.dateTo.slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
