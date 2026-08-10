// src/components/layout/SidebarNavItems.tsx
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  ShoppingCart,
  Users,
  Building2,
  Percent,
  Table,
  Package,
  BarChart3,
  Settings,
  Clock,
  UserRound,
  MessageSquare,
  Gift,
  Megaphone,
  TableProperties,
  Boxes,
  Factory,
  ShoppingBag,
  Trash2,
  UserCog,
  ShieldCheck,
  DollarSign,
  FileText,
  CreditCard,
  Printer,
  Tag,
  Ticket,
<<<<<<< HEAD
  Carrot,
  ChefHat,
=======
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to?: string;
  subItems?: { label: string; to: string; icon?: React.ReactNode }[];
}

interface SidebarNavItemsProps {
  isExpanded: boolean;
  onMobileClose: () => void;
  onOrderClick?: () => void;
  onNavClick?: () => void;
}

export const SidebarNavItems: React.FC<SidebarNavItemsProps> = ({
  isExpanded,
  onMobileClose,
  onOrderClick,
  onNavClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate(); // For programmatic navigation

  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set()
  );

  const toggleSection = (label: string) => {
    if (!isExpanded) return;
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const isActive = (to?: string, subItems?: NavItem['subItems']) => {
    if (to && location.pathname.startsWith(to)) return true;
    if (subItems)
      return subItems.some((sub) => location.pathname.startsWith(sub.to));
    return false;
  };
  const isMobile = window.innerWidth < 1024;
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      to: '/dashboard',
    },
    {
      label: 'Menu',
      icon: <UtensilsCrossed className="h-5 w-5" />,
      subItems: [
        {
          label: 'Menu Items',
          to: '/menu/items',
          icon: <UtensilsCrossed className="h-4 w-4" />,
        },
        {
          label: 'Menu Groups',
          to: '/menu/groups',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          label: 'Special Offers',
          to: '/menu/specials',
          icon: <Gift className="h-4 w-4" />,
        },
      ],
    },
    { label: 'POS', icon: <Receipt className="h-5 w-5" />, to: '/pos' },
    {
      label: 'Order',
      icon: <ShoppingCart className="h-5 w-5" />,
      to: '/orders', // ← This is the route it will navigate to
      subItems: [], // No dropdown
    },
    {
      label: 'Customer',
      icon: <Users className="h-5 w-5" />,
      subItems: [
        {
          label: 'Customer List',
<<<<<<< HEAD
          to: '/customers/list',
=======
          to: '/customers',
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: 'Customer Groups',
          to: '/customers/groups',
          icon: <UserRound className="h-4 w-4" />,
        },
        {
          label: 'Feedback & Reviews',
          to: '/customers/feedback',
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          label: 'Loyalty Members',
<<<<<<< HEAD
          to: '/customers',
=======
          to: '/customers/loyalty',
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
          icon: <Gift className="h-4 w-4" />,
        },
        {
          label: 'Marketing',
<<<<<<< HEAD
          to: '/marketing/campaigns',
=======
          to: '/customers/marketing',
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
          icon: <Megaphone className="h-4 w-4" />,
        },
      ],
    },
    // ... rest of your items unchanged
    {
      label: 'Branches',
      icon: <Building2 className="h-5 w-5" />,
      subItems: [
        {
          label: 'Branches Management',
          to: '/branches',
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          label: 'Branch Settings',
          to: '/branches/settings',
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      label: 'Promotions',
      icon: <Percent className="h-5 w-5" />,
      subItems: [
        {
          label: 'Discounts',
          to: '/promotions/discounts',
          icon: <Tag className="h-4 w-4" />,
        },
        {
          label: 'Coupons',
          to: '/promotions/coupons',
          icon: <Ticket className="h-4 w-4" />,
        },
        {
          label: 'Loyalty Program',
          to: '/promotions/loyalty',
          icon: <Gift className="h-4 w-4" />,
        },
      ],
    },
    {
      label: 'Tables',
      icon: <Table className="h-5 w-5" />,
      subItems: [
        {
          label: 'Table Management',
          to: '/tables/management',
          icon: <TableProperties className="h-4 w-4" />,
        },
        {
          label: 'Assign Table To User',
          to: '/tables/Assign',
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      label: 'Inventory',
      icon: <Package className="h-5 w-5" />,
      subItems: [
        {
          label: 'Stock Overview',
          to: '/inventory/stock',
          icon: <Boxes className="h-4 w-4" />,
        },
        {
<<<<<<< HEAD
          label: 'Ingredients',
          to: '/inventory/ingredients',
          icon: <Carrot className="h-4 w-4" />,
        },
        {
=======
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
          label: 'Suppliers',
          to: '/inventory/suppliers',
          icon: <Factory className="h-4 w-4" />,
        },
        {
<<<<<<< HEAD
          label: 'Recipes',
          to: '/inventory/recipes',
          icon: <ChefHat className="h-4 w-4" />,
        },
        {
=======
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
          label: 'Purchase Orders',
          to: '/inventory/purchase',
          icon: <ShoppingBag className="h-4 w-4" />,
        },
        {
          label: 'Waste Tracking',
          to: '/inventory/waste',
          icon: <Trash2 className="h-4 w-4" />,
        },
      ],
    },
    {
      label: 'Users',
      icon: <Users className="h-5 w-5" />,
      to: '/users/staff',
      subItems: [
        {
          label: 'Staff Management',
          to: '/users/staff',
          icon: <UserCog className="h-4 w-4" />,
        },
        {
          label: 'Roles & Permissions',
          to: '/users/roles',
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          label: 'Attendance',
          to: '/users/attendance',
          icon: <Clock className="h-4 w-4" />,
        },
      ],
    },

    {
      label: 'Reports & Analysis',
      icon: <BarChart3 className="h-5 w-5" />,
      subItems: [
        {
          label: 'Sales Report',
          to: '/reports/sales',
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          label: 'Order Report',
          to: '/reports/orders',
          icon: <FileText className="h-4 w-4" />,
        },
        {
          label: 'Transaction Report',
          to: '/reports/transactions',
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          label: 'POS Report',
          to: '/reports/pos',
          icon: <Receipt className="h-4 w-4" />,
        },
        {
          label: 'Inventory Report',
          to: '/reports/inventory',
          icon: <Package className="h-4 w-4" />,
        },
        {
          label: 'Customer Analytics',
          to: '/reports/analytics',
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      label: 'Subscription',
      icon: <CreditCard className="h-5 w-5" />,
      subItems: [
        {
          label: 'My Plan',
          to: '/subscription/plan',
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          label: 'Billing History',
          to: '/subscription/billing',
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      subItems: [
        {
          label: 'General Settings',
          to: '/settings',
          icon: <Settings className="h-4 w-4" />,
        },
        {
          label: 'Payment Methods',
          to: '/settings/payments',
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          label: 'Printers',
          to: '/settings/printers',
          icon: <Printer className="h-4 w-4" />,
        },
        {
          label: 'Taxes',
          to: '/settings/taxes',
          icon: <Percent className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isOpen = openSections.has(item.label);
        const active = isActive(item.to, item.subItems);
        const hasDropdown = item.subItems && item.subItems.length > 0;

        const handleClick = () => {
          if (item.label === 'Order') {
            onOrderClick?.();
            if (item.to) navigate(item.to);
            if (isMobile) onMobileClose(); // Collapse sidebar on mobile
            return;
          }

          if (hasDropdown) {
            // Only toggle dropdown, do not close sidebar
            toggleSection(item.label);
          } else {
            // No dropdown → navigate & close sidebar on mobile
            if (item.to) navigate(item.to);
            if (isMobile) onMobileClose();
          }

          onNavClick?.();
        };

        return (
          <div key={item.label}>
            <button
              onClick={handleClick}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium',
                'hover:bg-accent hover:text-accent-foreground',
                active && 'bg-primary/10 text-primary',
                !isExpanded && 'justify-center px-2'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isExpanded && <span className="text-nowrap">{item.label}</span>}
              {hasDropdown && isExpanded && (
                <ChevronRight
                  className={cn(
                    'ml-auto h-4 w-4 transition-transform',
                    isOpen && 'rotate-90'
                  )}
                />
              )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {hasDropdown && isOpen && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="ml-9 mt-1 space-y-1 overflow-hidden"
                >
                  {item.subItems!.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={() => {
                        if (isMobile) onMobileClose(); // Only close sidebar for actual navigation
                        onNavClick?.();
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          isActive && 'bg-primary/10 text-primary font-medium'
                        )
                      }
                    >
                      <span className="flex-shrink-0">
                        {sub.icon || <div className="w-4 h-4" />}
                      </span>
                      <span>{sub.label}</span>
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
};
