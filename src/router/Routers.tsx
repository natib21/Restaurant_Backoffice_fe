// src/routes/AppRoutes.tsx or src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/Auth/Pages/Login';
import SignUpPage from '@/features/Auth/Pages/SignUp';
import ForgotPasswordPage from '@/features/Auth/Pages/ForgotPasswordPage';
import PrivateRoute from './PrivateRoute';
import MainLayout from '@/components/Layout/MainLayout';

import Overview from '../features/Overview/Pages/Overview';

import MenuItemsPage from '../features/Menu/pages/MenuItemsPage';
import MenuGroupsPage from '../features/Menu/pages/MenuGroupsPage';
import SpecialOffersPage from '../features/Menu/pages/MenuSpecialsPage';

import TableManagementPage from '@/features/Table/pages/TableManagementPage';
import BranchManagementPage from '@/features/Branch/pages/BranchManagementPage';

import OrdersLayout from '../features/Order/Components/OrdersLayout';
import ActiveOrdersPage from '../features/Order/pages/ActiveOrdersPage';
import OrderHistoryPage from '../features/Order/pages/OrderHistoryPage';
import DeliveryManagementPage from '../features/Order/pages/DeliveryManagementPage';
import OrderDetailsPage from '../features/Order/pages/OrderDetailsPage';
import TakeawayManagementPage from '../features/Order/pages/TakeawayManagementPage';
import DineInManagementPage from '../features/Order/pages/DineInManagementPage';
import OrderFlowConfigPage from '../features/Order/pages/OrderFlowConfigPage';

import StaffManagementPage from '../features/User/Pages/StaffManagementPage';
import RolesPermissionsPage from '../features/User/Pages/RolesPermissionsPage';
import StaffDetailPage from '../features/User/Pages/StaffDetailPage';

import SettingsPage from '../features/Setting/pages/SettingsPage';
import TelegramSettingsPage from '../features/Setting/pages/TelegramSettingsPage';
import SubscriptionPlanPage from '../features/Subscription/pages/SubscriptionPlanPage';
import BillingHistoryPage from '../features/Subscription/pages/BillingHistoryPage';
import { PaymentCancel, PaymentError, PaymentSuccess } from '../features/Subscription/pages/PaymentStatus';

// Customer Pages
import CustomerListPage from '../features/Customer/pages/CustomerListPage';
import CustomerDetailPage from '../features/Customer/pages/CustomerDetailPage';
import CustomerGroupsPage from '../features/Customer/pages/CustomerGroupsPage';
import CustomerFeedbackPage from '../features/Customer/pages/CustomerFeedbackPage';
import TelegramChatPage from '../features/Customer/pages/TelegramChatPage';

// Marketing Pages
import CampaignPage from '../features/Marketing/pages/CampaignPage';

// Inventory Pages
import StockOverviewPage from '../features/Inventory/pages/StockOverviewPage';
import IngredientsPage from '../features/Inventory/pages/IngredientsPage';
import SuppliersPage from '../features/Inventory/pages/SuppliersPage';
import RecipesPage from '../features/Inventory/pages/RecipesPage';
import PurchaseOrdersPage from '../features/Inventory/pages/PurchaseOrdersPage';
import WasteTrackingPage from '../features/Inventory/pages/WasteTrackingPage';

// Report Pages
import ReportsPage from '../features/Report/views/ReportsPage';

import KdsMainPage from '../features/KDS/pages/KdsMainPage';
import KdsTvPage from '../features/KDS/pages/KdsTvPage';

import AuditLogsPage from '../features/AuditLog/pages/AuditLogsPage';
import MenuCategoriesPage from '@/features/Menu/pages/MenuCategoriesPage';
import NewOrderPosPage from '@/features/Order/pages/NewOrderPosPage';
import AllOrdersPage from '@/features/Order/pages/AllOrdersPage';
import ReviewQueuePage from '@/features/Order/pages/ReviewQueuePage';
import TableSessionsPage from '@/features/Table/pages/TableSessionsPage';
import TableAssignmentsPage from '@/features/Table/pages/TableAssignmentsPage';
import PrintMenuPage from '@/features/Table/pages/PrintMenuPage';
import MerchantProfilePage from '@/features/Setting/pages/MerchantProfilePage';
import BrandKycPage from '@/features/Setting/pages/BrandKycPage';
import KitchenStationsPage from '@/features/Setting/pages/KitchenStationsPage';
import OrderFlowSettingsPage from '@/features/Setting/pages/OrderFlowSettingsPage';
import PaymentMethodsPage from '@/features/Setting/pages/PaymentMethodsPage';
import TeamRolesPage from '@/features/Setting/pages/TeamRolesPage';
import BillingPlansPage from '@/features/Setting/pages/BillingPlansPage';
import PaymentVerificationPage from '@/features/Order/pages/PaymentVerificationPage';
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancel" element={<PaymentCancel />} />
      <Route path="/payment-error" element={<PaymentError />} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>

        <Route path="/kds" element={<KdsMainPage />} />
          <Route path="/kds/history" element={<KdsMainPage />} />
        <Route path="/kds/:stationId" element={<KdsMainPage />} />
        <Route path="/kds/tv" element={<KdsTvPage />} />
        <Route path="/kitchen" element={<Navigate to="/kds" replace />} />
        <Route path="/kitchen/*" element={<Navigate to="/kds" replace />} />



        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Overview />} />
          
          {/* Customer Routes */}
          <Route path="/customers">
            <Route index element={<Navigate to="/customers/list" replace />} />
            <Route path="list" element={<CustomerListPage />} />
            <Route path="groups" element={<CustomerGroupsPage />} />
            <Route path="telegram-chat" element={<TelegramChatPage />} />
            <Route path="feedback" element={<CustomerFeedbackPage />} />
            <Route path=":id" element={<CustomerDetailPage />} />
          </Route>
          
          {/* Marketing Routes */}
          <Route path="/marketing">
            <Route index element={<Navigate to="/marketing/campaigns" replace />} />
            <Route path="campaigns" element={<CampaignPage />} />
            <Route path="broadcast" element={<Navigate to="/marketing/campaigns" replace />} />
            <Route path="telegram-broadcast" element={<Navigate to="/marketing/campaigns" replace />} />
          </Route>
          
          {/* Menu Routes */}
          <Route path="/menu">
            <Route index element={<MenuItemsPage />} />
            <Route path="items" element={<MenuItemsPage />} />
            <Route path="groups" element={<MenuGroupsPage />} />
            <Route path="specials" element={<SpecialOffersPage />} />
            <Route path="categories" element={<MenuCategoriesPage />} />
          </Route>

          {/* Table Routes */}
         <Route path="/tables">
            <Route index element={<TableManagementPage />} />
            <Route path="floor-plan" element={<TableManagementPage />} />
            <Route path="management" element={<Navigate to="/tables" replace />} />
            <Route path="sessions" element={<TableSessionsPage />} />
            <Route path="assignments" element={<TableAssignmentsPage />} />
            <Route path="assign" element={<Navigate to="/tables/assignments" replace />} />
            <Route path="Assign" element={<Navigate to="/tables/assignments" replace />} />
            <Route path="print-menu" element={<PrintMenuPage />} />
            <Route path="print-menu/:tableId" element={<PrintMenuPage />} />
            <Route path="print" element={<PrintMenuPage />} />
            <Route path=":tableId/print-menu" element={<PrintMenuPage />} />
          </Route>
          <Route path="/print-menu" element={<PrintMenuPage />} />
          {/* Promotions / Discounts Compatibility Routes */}
          <Route path="/promotions">
            <Route index element={<Navigate to="/marketing/campaigns" replace />} />
            <Route path="discounts" element={<Navigate to="/menu/specials" replace />} />
            <Route path="coupons" element={<Navigate to="/marketing/campaigns" replace />} />
            <Route path="loyalty" element={<Navigate to="/customers/list" replace />} />
            <Route path="*" element={<Navigate to="/marketing/campaigns" replace />} />
          </Route>

          {/* Inventory Routes */}
          <Route path="/inventory">
            <Route index element={<Navigate to="/inventory/stock" replace />} />
            <Route path="stock" element={<StockOverviewPage />} />
            <Route path="ingredients" element={<IngredientsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="purchase" element={<PurchaseOrdersPage />} />
            <Route path="waste" element={<WasteTrackingPage />} />
          </Route>

          {/* Branch Routes */}
          <Route path="/branches">
            <Route index element={<BranchManagementPage />} />
            <Route path="management" element={<BranchManagementPage />} />
            <Route path="settings" element={<Navigate to="/branches" replace />} />
          </Route>

          {/* Order Routes (Fixed Route Order) */}
         <Route path="/orders" element={<OrdersLayout />}>
            <Route index element={<ActiveOrdersPage />} />
            <Route path="active" element={<ActiveOrdersPage />} />
            <Route path="all" element={<AllOrdersPage />} />
            <Route path="review-queue" element={<ReviewQueuePage />} />
            <Route path="reviews" element={<ReviewQueuePage />} />
            <Route path="flow-config" element={<OrderFlowConfigPage />} />
            <Route path="routing" element={<OrderFlowConfigPage />} />
            <Route path="new" element={<NewOrderPosPage />} />
            <Route path="create" element={<NewOrderPosPage />} />
            <Route path="history" element={<OrderHistoryPage />} />
            <Route path="delivery" element={<DeliveryManagementPage />} />
            <Route path="takeaway" element={<TakeawayManagementPage />} />
            <Route path="dine-in" element={<DineInManagementPage />} />
            <Route path="payment-verification" element={<PaymentVerificationPage />} />
            <Route path="verifications" element={<PaymentVerificationPage />} />
            <Route path=":orderId" element={<OrderDetailsPage />} />
            <Route path="*" element={<Navigate to="/orders/active" replace />} />
          </Route>

          {/* Subscription Routes */}
          <Route path="/subscription">
            <Route index element={<Navigate to="/subscription/plan" replace />} />
            <Route path="plan" element={<SubscriptionPlanPage />} />
            <Route path="billing" element={<BillingHistoryPage />} />
            <Route path="callback" element={<PaymentSuccess />} />
            <Route path="verify" element={<PaymentSuccess />} />
          </Route>

          {/* User & Staff Routes */}
          <Route path="/users">
            <Route index element={<StaffManagementPage />} />
            <Route path="staff" element={<StaffManagementPage />} />
            <Route path="staff/:id" element={<StaffDetailPage />} />
            <Route path="roles" element={<RolesPermissionsPage />} />
            <Route path="attendance" element={<Navigate to="/users/staff" replace />} />
          </Route>

          {/* Reports Routes */}
          <Route path="/reports">
            <Route index element={<ReportsPage />} />
            <Route path=":type" element={<ReportsPage />} />
            <Route path="sales" element={<ReportsPage />} />
            <Route path="orders" element={<ReportsPage />} />
            <Route path="products" element={<ReportsPage />} />
            <Route path="profitability" element={<ReportsPage />} />
            <Route path="customers" element={<ReportsPage />} />
            <Route path="delivery" element={<ReportsPage />} />
            <Route path="staff" element={<ReportsPage />} />
            <Route path="inventory" element={<ReportsPage />} />
            <Route path="transactions" element={<ReportsPage />} />
            <Route path="pos" element={<ReportsPage />} />
            <Route path="analytics" element={<ReportsPage />} />
          </Route>

          {/* Settings Route */}
          <Route path="/settings">
            <Route index element={<SettingsPage />} />
            <Route path="profile" element={<MerchantProfilePage />} />
            <Route path="brand" element={<BrandKycPage />} />
            <Route path="kyc" element={<BrandKycPage />} />
            <Route path="kitchen-stations" element={<KitchenStationsPage />} />
            <Route path="stations" element={<KitchenStationsPage />} />
            <Route path="kitchen" element={<KitchenStationsPage />} />
            <Route path="order-flow" element={<OrderFlowSettingsPage />} />
            <Route path="routing" element={<OrderFlowSettingsPage />} />
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
            <Route path="payments" element={<PaymentMethodsPage />} />
            <Route path="team" element={<TeamRolesPage />} />
            <Route path="roles" element={<TeamRolesPage />} />
            <Route path="telegram" element={<TelegramSettingsPage />} />
            <Route path="billing" element={<BillingPlansPage />} />
            <Route path="plans" element={<BillingPlansPage />} />
            <Route path="taxes" element={<PaymentMethodsPage />} />
            <Route path="printers" element={<KitchenStationsPage />} />
          </Route>



 {/* Audit Logs Routes */}
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/security/audit" element={<Navigate to="/audit-logs" replace />} />
          <Route path="/compliance/audit" element={<Navigate to="/audit-logs" replace />} />
          
          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;