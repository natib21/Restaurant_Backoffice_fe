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

import StaffManagementPage from '../features/User/Pages/StaffManagementPage';
import RolesPermissionsPage from '../features/User/Pages/RolesPermissionsPage';
import AttendancePage from '../features/User/Pages/AttendancePage';
import StaffDetailPage from '../features/User/Pages/StaffDetailPage';

import SettingsPage from '../features/Setting/pages/SettingsPage';
import SubscriptionPlanPage from '../features/Subscription/pages/SubscriptionPlanPage';
import BillingHistoryPage from '../features/Subscription/pages/BillingHistoryPage';
import { PaymentCancel, PaymentError, PaymentSuccess } from '../features/Subscription/pages/PaymentStatus';

// Customer Pages
import CustomerListPage from '../features/Customer/pages/CustomerListPage';
import CustomerDetailPage from '../features/Customer/pages/CustomerDetailPage';
import CustomerGroupsPage from '../features/Customer/pages/CustomerGroupsPage';
import CustomerFeedbackPage from '../features/Customer/pages/CustomerFeedbackPage';

// Marketing Pages
import CampaignPage from '../features/Marketing/pages/CampaignPage';

// Inventory Pages
import StockOverviewPage from '../features/Inventory/pages/StockOverviewPage';
import IngredientsPage from '../features/Inventory/pages/IngredientsPage';
import SuppliersPage from '../features/Inventory/pages/SuppliersPage';
import RecipesPage from '../features/Inventory/pages/RecipesPage';
import PurchaseOrdersPage from '../features/Inventory/pages/PurchaseOrdersPage';
import WasteTrackingPage from '../features/Inventory/pages/WasteTrackingPage';

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
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Overview />} />
          
          {/* Customer Routes */}
          <Route path="/customers">
            <Route index element={<Navigate to="/customers/list" replace />} />
            <Route path="list" element={<CustomerListPage />} />
            <Route path="groups" element={<CustomerGroupsPage />} />
            <Route path="feedback" element={<CustomerFeedbackPage />} />
            <Route path=":id" element={<CustomerDetailPage />} />
          </Route>
          
          {/* Marketing Routes */}
          <Route path="/marketing">
            <Route index element={<Navigate to="/marketing/campaigns" replace />} />
            <Route path="campaigns" element={<CampaignPage />} />
          </Route>
          
          {/* Menu Routes */}
          <Route path="/menu">
            <Route index element={<MenuItemsPage />} />
            <Route path="items" element={<MenuItemsPage />} />
            <Route path="groups" element={<MenuGroupsPage />} />
            <Route path="specials" element={<SpecialOffersPage />} />
          </Route>

          {/* Table Routes */}
          <Route path="/tables">
            <Route index element={<TableManagementPage />} />
            <Route path="management" element={<TableManagementPage />} />
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
          </Route>

          {/* Order Routes (Fixed Route Order) */}
          <Route path="/orders" element={<OrdersLayout />}>
            <Route index element={<ActiveOrdersPage />} />
            <Route path="active" element={<ActiveOrdersPage />} />
            <Route path="history" element={<OrderHistoryPage />} />
            <Route path="delivery" element={<DeliveryManagementPage />} />
            <Route path="takeaway" element={<TakeawayManagementPage />} />
            <Route path="dine-in" element={<DineInManagementPage />} />
            <Route path=":orderId" element={<OrderDetailsPage />} />
            <Route path="*" element={<Navigate to="/orders/active" replace />} />
          </Route>

          {/* Subscription Routes */}
          <Route path="/subscription">
            <Route index element={<Navigate to="/subscription/plan" replace />} />
            <Route path="plan" element={<SubscriptionPlanPage />} />
            <Route path="billing" element={<BillingHistoryPage />} />
          </Route>

          {/* User & Staff Routes */}
          <Route path="/users">
            <Route index element={<StaffManagementPage />} />
            <Route path="staff" element={<StaffManagementPage />} />
            <Route path="staff/:id" element={<StaffDetailPage />} />
            <Route path="roles" element={<RolesPermissionsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
          </Route>

          {/* Settings Route */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;