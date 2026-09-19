import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar/Sidebar';
import Header from './Header';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { useGetMeQuery } from '@/api/Queries/authQueries';
import { setTestMode, setCurrentBranch } from './layoutSlice';
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

  // If user only has one assigned branch, auto-select it immediately
  useEffect(() => {
    if (user?.branch && Array.isArray(user.branch)) {
      if (user.branch.length === 1) {
        const singleBranch = user.branch[0];
        const singleId = singleBranch?._id || (singleBranch as any)?.id;
        if (singleId && currentBranchId !== singleId) {
          dispatch(setCurrentBranch(singleId));
        }
      } else if (user.branch.length > 1 && currentBranchId) {
        // If user has multiple branches and previously selected one that is no longer in their list
        const exists = user.branch.some(
          (b: any) => (b._id || b.id) === currentBranchId
        );
        if (!exists) {
          dispatch(setCurrentBranch(null));
        }
      }
    }
  }, [user?.branch, currentBranchId, dispatch]);

  return (
    <SocketProvider user={user ?? null} currentBranchId={currentBranchId}>
      <div className="h-screen w-full overflow-hidden bg-background flex flex-col">
        <Header />
        <TestModeBanner variant="header" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-muted/10 relative">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="min-h-full">
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
