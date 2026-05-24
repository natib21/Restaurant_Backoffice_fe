// src/components/layout/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../../../app/store';
import {
  toggleSidebar,
  toggleSidebarCollapse,
  setOrderSidebarOpen,
} from '../layoutSlice';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { useGetMeQuery } from '@/api/Queries/authQueries';
import { ChevronLeft, ChevronRight, Globe, X } from 'lucide-react';

import { SidebarNavItems } from './SidebarNavItems';
import { SidebarHeader } from './SidebarHeader';
import { OrderSidebar } from './OrderSidebar';
import { Skeleton } from '@/components/ui/skeleton';

const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 72;

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { sidebarOpen, sidebarCollapsed, orderSidebarOpen } = useSelector(
    (state: RootState) => state.ui
  );
  const { data: user, isLoading: isUserLoading } = useGetMeQuery();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Update isMobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isExpanded = !sidebarCollapsed || isMobile; // Always expanded on mobile

  // Auto-collapse main sidebar when OrderSidebar opens (desktop only)
  useEffect(() => {
    if (!isMobile && orderSidebarOpen && !sidebarCollapsed) {
      dispatch(toggleSidebarCollapse());
    }
  }, [orderSidebarOpen, sidebarCollapsed, dispatch, isMobile]);

  const handleOrderClick = () => {
    if (!orderSidebarOpen) dispatch(setOrderSidebarOpen(true));
    if (!isMobile && !sidebarCollapsed) dispatch(toggleSidebarCollapse());
  };

  const handleOtherNavClick = () => {
    if (orderSidebarOpen) dispatch(setOrderSidebarOpen(false));
    if (!isMobile && sidebarCollapsed) dispatch(toggleSidebarCollapse());
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              dispatch(toggleSidebar());
              dispatch(setOrderSidebarOpen(false));
            }}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : isMobile ? '-100%' : -SIDEBAR_WIDTH_EXPANDED,
          width: isMobile
            ? '80%'
            : isExpanded
              ? SIDEBAR_WIDTH_EXPANDED
              : SIDEBAR_WIDTH_COLLAPSED,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 h-full bg-background border-r flex flex-col',
          'lg:relative lg:z-auto shadow-xl lg:shadow-none'
        )}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border shadow-md"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Desktop Pin/Unpin Button */}
        {!isMobile && (
          <button
            onClick={() => dispatch(toggleSidebarCollapse())}
            className={cn(
              'absolute -right-3 top-9 flex h-8 w-6 items-center justify-center rounded-r-lg border bg-background shadow-md z-10 transition-opacity',
              sidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Header */}
        <SidebarHeader isExpanded={isExpanded} />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <SidebarNavItems
            isExpanded={isExpanded} // Always expanded on mobile
            onMobileClose={() => dispatch(toggleSidebar())}
            onOrderClick={handleOrderClick}
            onNavClick={handleOtherNavClick}
          />
        </div>

        {/* Website Link */}
        <div className="border-t p-4">
          {isUserLoading ? (
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg',
                !isExpanded && 'justify-center'
              )}
            >
              <Skeleton className="h-5 w-5 rounded-full" />
              {isExpanded && (
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              )}
            </div>
          ) : (
            <a
              href={user?.merchant?.publicWebsite || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => isMobile && dispatch(toggleSidebar())}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors font-medium',
                'bg-primary/5 hover:bg-primary/10 text-primary',
                !isExpanded && 'justify-center',
                !user?.merchant?.publicWebsite &&
                  'opacity-60 cursor-not-allowed pointer-events-none'
              )}
            >
              <Globe className="h-5 w-5 text-blue-900 flex-shrink-0" />
              {isExpanded && (
                <span>
                  {user?.merchant?.publicWebsite
                    ? 'Website'
                    : 'Website Not Set'}
                </span>
              )}
            </a>
          )}
        </div>
      </motion.aside>

      {/* Order Sidebar */}
      <OrderSidebar isOpen={orderSidebarOpen} />
    </>
  );
};

export default Sidebar;
