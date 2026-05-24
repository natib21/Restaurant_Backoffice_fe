import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar/Sidebar';
import Header from './Header';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { useGetMeQuery } from '@/api/Queries/authQueries';
import { setTestMode } from './layoutSlice';
import { TestModeBanner } from './SideBar/TestModeBanner';
import { OrderSoundManager } from '../Common/OrderSoundManager';
import { SocketProvider } from '@/lib/Socket';

const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const { data: user } = useGetMeQuery();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  useEffect(() => {
    if (user?.merchant?.mode != null) {
      const inTestMode = user.merchant.mode === 'Test';
      dispatch(setTestMode(inTestMode));
    }
  }, [user, dispatch]);

  return (
    <SocketProvider user={user ?? null} currentBranchId={currentBranchId}>
      <div className="h-screen w-full overflow-hidden bg-background flex flex-col">
        <Header />
        <TestModeBanner variant="header" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-muted/10 relative">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="min-h-full p-4 md:p-6 lg:p-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>

        <OrderSoundManager />
      </div>
    </SocketProvider>
  );
};

export default MainLayout;
