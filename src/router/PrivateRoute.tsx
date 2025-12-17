// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useGetMeQuery } from '../api/Queries/AuthQueries';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const PrivateRoute = () => {
  const { data: user, isLoading, isError } = useGetMeQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;
