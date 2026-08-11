// src/components/layout/Sidebar.tsx
import React, { useEffect, useState, useRef } from 'react';
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

  const prevOrderSidebarOpen = useRef(orderSidebarOpen);

  // Auto-collapse main sidebar when OrderSidebar opens (desktop only)
  useEffect(() => {
    const justOpened = orderSidebarOpen && !prevOrderSidebarOpen.current;
    if (!isMobile && justOpened && !sidebarCollapsed) {
      dispatch(toggleSidebarCollapse());
    }
    prevOrderSidebarOpen.current = orderSidebarOpen;
  }, [orderSidebarOpen, isMobile, dispatch]);

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
            className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : isMobile ? '-100%' : -SIDEBAR_WIDTH_EXPANDED,
          width: isMobile
            ? '85%'
            : isExpanded
              ? SIDEBAR_WIDTH_EXPANDED
              : SIDEBAR_WIDTH_COLLAPSED,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'group fixed inset-y-0 left-0 z-50 h-full bg-card border-r border-border/80 flex flex-col',
          'lg:relative lg:z-auto shadow-lg lg:shadow-none transition-colors'
        )}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="absolute top-3.5 right-3.5 z-20">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Desktop Pin/Unpin Button */}
        {!isMobile && (
          <button
            onClick={() => dispatch(toggleSidebarCollapse())}
            className={cn(
              'absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-xs z-20 transition-all hover:bg-muted',
              sidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 lg:group-hover:opacity-100'
            )}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Header */}
        <SidebarHeader isExpanded={isExpanded} />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 custom-scrollbar">
          <SidebarNavItems
            isExpanded={isExpanded} // Always expanded on mobile
            onMobileClose={() => dispatch(toggleSidebar())}
            onOrderClick={handleOrderClick}
            onNavClick={handleOtherNavClick}
          />
        </div>

        {/* Website Link */}
        <div className="border-t border-border/70 p-2.5 bg-muted/20">
          {isUserLoading ? (
            <div
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md',
                !isExpanded && 'justify-center'
              )}
            >
              <Skeleton className="h-4 w-4 rounded-full" />
              {isExpanded && (
                <div className="h-3.5 w-28 bg-muted rounded animate-pulse" />
              )}
            </div>
          ) : (
            <a
              href={user?.merchant?.publicWebsite || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => isMobile && dispatch(toggleSidebar())}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors font-medium text-xs',
                'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                !isExpanded && 'justify-center px-1.5',
                !user?.merchant?.publicWebsite &&
                  'opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              <Globe className="h-4 w-4 text-primary shrink-0" />
              {isExpanded && (
                <span className="truncate">
                  {user?.merchant?.publicWebsite
                    ? 'Visit Live Website'
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
