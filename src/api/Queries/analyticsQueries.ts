// src/api/Queries/analyticsQueries.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodStats {
  revenue: number;
  orders: number;
  uniqueCustomers: number;
}

export interface RevenuePeriods {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  quarter: PeriodStats;
  year: PeriodStats;
}

export interface TopFoodItem {
  _id: string;
  name: string;
  quantity: number;
  revenue: number;
  image?: string;
}

export interface TopCustomer {
  _id: string;
  fullName: string;
  phone?: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
}

export interface CustomerGrowth {
  new: number;
  returning: number;
}

export interface DashboardData {
  revenue: RevenuePeriods;
  topFoods: TopFoodItem[];
  topCustomers: TopCustomer[];
  customerGrowth: CustomerGrowth;
  generatedAt: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (branchId?: string | null) =>
    [...analyticsKeys.all, 'dashboard', branchId ?? 'all'] as const,
};

// ─── API Function ─────────────────────────────────────────────────────────────

const fetchDashboard = async (branchId?: string | null): Promise<DashboardData> => {
  const params = branchId ? { branchId } : {};
  const { data } = await api.get('/v1/analytics/dashboard', { params });
  return data.data as DashboardData;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch dashboard analytics.
 * Pass `branchId` to scope to a single branch; omit (or pass null) for all branches.
 */
export const useDashboardQuery = (branchId?: string | null) =>
  useQuery<DashboardData, AxiosError>({
    queryKey: analyticsKeys.dashboard(branchId),
    queryFn: () => fetchDashboard(branchId),
    staleTime: 2 * 60 * 1000,   // 2 minutes — dashboard data is semi-real-time
    gcTime:    10 * 60 * 1000,
    retry: 1,
  });
