// src/routes/AppRoutes.tsx or src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/Auth/Pages/Login';
import SignUpPage from '@/features/Auth/Pages/SignUp';
import ForgotPasswordPage from '@/features/Auth/Pages/ForgotPasswordPage';
import PrivateRoute from './PrivateRoute';
import MainLayout from '@/components/Layout/MainLayout';
import StaffManagementPage from '../features/User/Pages/StaffManagementPage';
import RolesPermissionsPage from '../features/User/Pages/RolesPermissionsPage';
import AttendancePage from '../features/User/Pages/AttendancePage';

import Overview from '@/features/Overview/Pages/Overview';

import MenuItemsPage from '@/features/Menu/pages/MenuItemsPage';
import MenuGroupsPage from '@/features/Menu/pages/MenuGroupsPage';
import SpecialOffersPage from '@/features/Menu/pages/MenuSpecialsPage';

import TableManagementPage from '@/features/Table/pages/TableManagementPage';
import BranchManagementPage from '@/features/Branch/pages/BranchManagementPage';

import OrdersLayout from '@/features/Order/Components/OrdersLayout'; // New layout wrapper
import ActiveOrdersPage from '@/features/Order/pages/ActiveOrdersPage';
import OrderHistoryPage from '@/features/Order/pages/OrderHistoryPage';
import DeliveryManagementPage from '@/features/Order/pages/DeliveryManagementPage';
import OrderDetailsPage from '@/features/Order/pages/OrderDetailsPage'; // Optional: for /orders/:id
import TakeawayManagementPage from '@/features/Order/pages/TakeawayManagementPage';
import DineInManagementPage from '@/features/Order/pages/DineInManagementPage';
import StaffDetailPage from '@/features/User/Pages/StaffDetailPage';
import SettingsPage from '@/features/Setting/pages/SettingsPage';
import SubscriptionPlanPage from '@/features/Subscription/pages/SubscriptionPlanPage';
import BillingHistoryPage from '@/features/Subscription/pages/BillingHistoryPage';
import { PaymentCancel, PaymentError, PaymentSuccess } from '@/features/Subscription/pages/PaymentStatus';
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
          <Route path="/menu">
            <Route index element={<MenuItemsPage />} />
            <Route path="items" element={<MenuItemsPage />} />
            <Route path="groups" element={<MenuGroupsPage />} />
            <Route path="specials" element={<SpecialOffersPage />} />
          </Route>
          <Route path="/tables">
            <Route index element={<TableManagementPage />} />
            <Route path="management" element={<TableManagementPage />} />
          </Route>
          <Route path="/branches">
            <Route index element={<BranchManagementPage />} />
            <Route path="management" element={<BranchManagementPage />} />
          </Route>
          <Route path="/orders" element={<OrdersLayout />}>
            <Route
              path="*"
              element={<Navigate to="/orders/active" replace />}
            />
            <Route index element={<ActiveOrdersPage />} />
            <Route path="active" element={<ActiveOrdersPage />} />
            <Route path="history" element={<OrderHistoryPage />} />
            <Route path="delivery" element={<DeliveryManagementPage />} />
            <Route path="takeaway" element={<TakeawayManagementPage />} />
            <Route path="dine-in" element={<DineInManagementPage />} />
            <Route path=":orderId" element={<OrderDetailsPage />} />
          </Route>
          <Route path="/subscription">
            <Route
              index
              element={<Navigate to="/subscription/plan" replace />}
            />

            <Route path="plan" element={<SubscriptionPlanPage />} />
            <Route path="billing" element={<BillingHistoryPage />} />
          </Route>
          <Route path="/users">
            <Route index element={<StaffManagementPage />} />
            <Route path="staff/:id" element={<StaffDetailPage />} />
            <Route path="staff" element={<StaffManagementPage />} />
            <Route path="roles" element={<RolesPermissionsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
