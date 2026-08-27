// src/features/Report/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/Layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  UtensilsCrossed,
  Coins,
  Users,
  Truck,
  UserCheck,
  Package,
  Sparkles,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ReportHeaderControls } from '../components/ReportHeaderControls';
import { ExportReportModal } from '../components/ExportReportModal';
import { SalesReportView } from '../views/SalesReportView';
import { OrdersReportView } from '../views/OrdersReportView';
import { ProductsReportView } from '../views/ProductsReportView';
import { ProfitabilityReportView } from '../views/ProfitabilityReportView';
import { CustomersReportView } from '../views/CustomersReportView';
import { DeliveryReportView } from '../views/DeliveryReportView';
import { StaffReportView } from '../views/StaffReportView';
import { InventoryReportView } from '../views/InventoryReportView';
import type { ReportQueryParams, ReportType } from '@/api/Queries/reportQueries';

export const ReportsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type: routeType } = useParams<{ type?: string }>();

  // Determine active tab from URL path or query params
  const getActiveTabFromUrl = (): ReportType => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/reports/sales') || path.includes('/reports/transactions') || path.includes('/reports/pos')) return 'sales';
    if (path.includes('/reports/orders')) return 'orders';
    if (path.includes('/reports/products')) return 'products';
    if (path.includes('/reports/profitability')) return 'profitability';
    if (path.includes('/reports/customers') || path.includes('/reports/analytics')) return 'customers';
    if (path.includes('/reports/delivery')) return 'delivery';
    if (path.includes('/reports/staff')) return 'staff';
    if (path.includes('/reports/inventory')) return 'inventory';
    if (routeType && ['sales', 'orders', 'products', 'profitability', 'customers', 'delivery', 'staff', 'inventory'].includes(routeType)) {
      return routeType as ReportType;
    }
    return 'sales';
  };

  const [activeTab, setActiveTab] = useState<ReportType>(getActiveTabFromUrl());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Default query parameters: last 30 days
  const [queryParams, setQueryParams] = useState<ReportQueryParams>(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    return {
      dateFrom: format(thirtyDaysAgo, 'yyyy-MM-dd'),
      dateTo: format(now, 'yyyy-MM-dd'),
      branchId: null,
      groupBy: 'day',
      page: 1,
      limit: 50,
    };
  });

  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.pathname, routeType]);

  const handleTabChange = (tab: string) => {
    const nextTab = tab as ReportType;
    setActiveTab(nextTab);
    navigate(`/reports/${nextTab}`);
  };

  const handleUpdateParams = (newParams: Partial<ReportQueryParams>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  const tabsConfig: Array<{ id: ReportType; label: string; icon: React.ReactNode }> = [
    { id: 'sales', label: 'Sales & Revenue', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: 'orders', label: 'Orders Lifecycle', icon: <ShoppingCart className="h-3.5 w-3.5" /> },
    { id: 'products', label: 'Menu & Products', icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
    { id: 'profitability', label: 'Profit & COGS', icon: <Coins className="h-3.5 w-3.5" /> },
    { id: 'customers', label: 'Guests & Retention', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'delivery', label: 'Delivery & Logistics', icon: <Truck className="h-3.5 w-3.5" /> },
    { id: 'staff', label: 'Staff Efficiency', icon: <UserCheck className="h-3.5 w-3.5" /> },
    { id: 'inventory', label: 'Inventory Valuation', icon: <Package className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="Reports & Advanced Analytics"
        subtitle="Business intelligence, sales trends, kitchen operational efficiency, and inventory valuation"
      />

      {/* Global Controls Filter Bar */}
      <ReportHeaderControls
        params={queryParams}
        onChangeParams={handleUpdateParams}
        onRefresh={() => setQueryParams((prev) => ({ ...prev }))}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-11 p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl inline-flex w-auto min-w-full sm:min-w-0 shadow-2xs gap-1">
            {tabsConfig.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all gap-1.5 whitespace-nowrap"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="sales" className="mt-0 focus-visible:outline-none">
          <SalesReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
          <OrdersReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="products" className="mt-0 focus-visible:outline-none">
          <ProductsReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="profitability" className="mt-0 focus-visible:outline-none">
          <ProfitabilityReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="customers" className="mt-0 focus-visible:outline-none">
          <CustomersReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="delivery" className="mt-0 focus-visible:outline-none">
          <DeliveryReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="staff" className="mt-0 focus-visible:outline-none">
          <StaffReportView params={queryParams} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-0 focus-visible:outline-none">
          <InventoryReportView params={queryParams} />
        </TabsContent>
      </Tabs>

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportType={activeTab}
        params={queryParams}
      />
    </div>
  );
};

export default ReportsPage;
