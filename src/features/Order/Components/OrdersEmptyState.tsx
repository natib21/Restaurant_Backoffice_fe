// src/features/Orders/components/OrdersEmptyState.tsx
import React from 'react';
import { Package, CheckCircle2, Clock, Coffee } from 'lucide-react';

interface OrdersEmptyStateProps {
  /** Optional custom icon - defaults vary by context */
  icon?: React.ReactNode;
  /** Main title */
  title?: string;
  /** Description below title */
  description?: string;
  /** Optional extra action or hint */
  action?: React.ReactNode;
  /** Variant for different contexts */
  variant?: 'active' | 'history' | 'delivery' | 'general';
  /** Optional activeTab */
  activeTab?: string;
}

const OrdersEmptyState: React.FC<OrdersEmptyStateProps> = ({
  icon,
  title = 'No Orders Found',
  description = 'There are currently no orders matching your selected filters.',
  action,
  variant = 'general',
  activeTab,
}) => {
  const displayTitle =
    title || (activeTab ? `No ${activeTab} orders` : 'No Orders Found');
  const displayDescription =
    description ||
    'New orders will appear here automatically when placed by customers or staff.';
  // Default icons based on context
  const defaultIcons = {
    active: <Clock className="h-16 w-16 text-blue-500" />,
    history: <Package className="h-16 w-16 text-muted-foreground/50" />,
    delivery: <Coffee className="h-16 w-16 text-amber-500" />,
    general: <CheckCircle2 className="h-16 w-16 text-green-500" />,
  };

  const selectedIcon = icon || defaultIcons[variant];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-6 animate-in fade-in-50 duration-700">
        {selectedIcon}
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        {displayTitle}
      </h2>

      <p className="text-muted-foreground max-w-md leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-200">
        {displayDescription}
      </p>

      {action && (
        <div className="mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          {action}
        </div>
      )}

      {/* Subtle decorative element */}
      <div className="mt-12 text-xs text-muted-foreground/40 font-medium uppercase tracking-wider">
        {variant === 'active' && 'Waiting for new orders...'}
        {variant === 'history' && 'No records found'}
        {variant === 'delivery' && 'All deliveries completed'}
      </div>
    </div>
  );
};

export default OrdersEmptyState;
