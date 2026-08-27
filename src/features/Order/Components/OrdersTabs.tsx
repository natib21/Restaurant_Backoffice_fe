import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '@/app/store';
import { toggleOrderSidebar } from '@/components/Layout/layoutSlice';
import { Button } from '@/components/ui/button';
import { ShoppingBag, GitFork, Clock } from 'lucide-react';
import { useReviewQueueQuery } from '@/api/Queries/orderFlowQueries';

const OrdersTabs = () => {
  const dispatch = useDispatch<AppDispatch>();
  const orderSidebarOpen = useSelector((state: RootState) => state.ui.orderSidebarOpen);
  const { data: reviewOrders = [] } = useReviewQueueQuery({ refetchInterval: 15_000 });

  return (
    <div className="border-b bg-card/60 backdrop-blur-xs flex items-center justify-between px-6">
      <div className="flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar items-center">
        {[
          { label: 'Active Orders', to: '/orders/active' },
          {
            label: 'Review Queue',
            to: '/orders/review-queue',
            badge: reviewOrders.length > 0 ? reviewOrders.length : undefined,
            badgeColor: 'bg-amber-500 text-white',
          },
          { label: 'All Orders', to: '/orders/all' },
          { label: '+ New Order', to: '/orders/new' },
          { label: 'Delivery', to: '/orders/delivery' },
          { label: 'Takeaway', to: '/orders/takeaway' },
          { label: 'Dine-in', to: '/orders/dine-in' },
          { label: 'History', to: '/orders/history' },
          { label: 'Flow Routing', to: '/orders/flow-config' },
        ].map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'py-3.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5',
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  tab.badgeColor || 'bg-primary text-primary-foreground'
                )}
              >
                {tab.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="shrink-0 py-2">
        <Button
          variant={orderSidebarOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => dispatch(toggleOrderSidebar())}
          className={cn(
            'h-8 px-2.5 text-xs gap-1.5 font-medium transition-colors shadow-none',
            orderSidebarOpen && 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {orderSidebarOpen ? 'Hide Orders Queue' : 'Show Orders Queue'}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default OrdersTabs;
