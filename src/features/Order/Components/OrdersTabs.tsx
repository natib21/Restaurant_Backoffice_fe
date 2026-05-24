import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const OrdersTabs = () => {
  return (
    <div className="border-b bg-background">
      <div className="flex gap-8 px-6">
        {[
          { label: 'All Orders', to: '/orders/active' },
          //   { label: 'Order History', to: '/orders/history' },
          { label: 'Delivery', to: '/orders/delivery' },
          { label: 'Takeaway', to: '/orders/takeaway' },
          { label: 'Dine-in', to: '/orders/dine-in' },
        ].map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'py-4 border-b-2 font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default OrdersTabs;
