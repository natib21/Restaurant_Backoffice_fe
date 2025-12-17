// src/routes/Routes.tsx or src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';

import PrivateRoute from './PrivateRoute';
import MainLayout from '@/components/Layout/MainLayout';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Default redirect for protected area */}
          {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
