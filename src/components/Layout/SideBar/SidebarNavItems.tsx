// src/components/layout/SidebarNavItems.tsx
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Carrot,
  ChefHat,
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
  const navigate = useNavigate();

  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set()
  );

  const toggleSection = (label: string) => {
    if (!isExpanded) return;
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
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
      icon: <LayoutDashboard className="h-4 w-4" />,
      to: '/dashboard',
    },
    {
      label: 'Menu',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      subItems: [
        {
          label: 'Menu Items',
          to: '/menu/items',
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
        },
        {
          label: 'Menu Groups',
          to: '/menu/groups',
          icon: <LayoutDashboard className="h-3.5 w-3.5" />,
        },
        {
          label: 'Special Offers',
          to: '/menu/specials',
          icon: <Gift className="h-3.5 w-3.5" />,
        },
      ],
    },
    { label: 'POS', icon: <Receipt className="h-4 w-4" />, to: '/pos' },
    {
      label: 'Order',
      icon: <ShoppingCart className="h-4 w-4" />,
      to: '/orders',
      subItems: [],
    },
    {
      label: 'Customer',
      icon: <Users className="h-4 w-4" />,
      subItems: [
        {
          label: 'Customer List',
          to: '/customers/list',
          icon: <Users className="h-3.5 w-3.5" />,
        },
        {
          label: 'Customer Groups',
          to: '/customers/groups',
          icon: <UserRound className="h-3.5 w-3.5" />,
        },
        {
          label: 'Feedback & Reviews',
          to: '/customers/feedback',
          icon: <MessageSquare className="h-3.5 w-3.5" />,
        },
        {
          label: 'Loyalty Members',
          to: '/customers',
          icon: <Gift className="h-3.5 w-3.5" />,
        },
        {
          label: 'Marketing',
          to: '/marketing/campaigns',
          icon: <Megaphone className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Branches',
      icon: <Building2 className="h-4 w-4" />,
      subItems: [
        {
          label: 'Branches Management',
          to: '/branches',
          icon: <Building2 className="h-3.5 w-3.5" />,
        },
        {
          label: 'Branch Settings',
          to: '/branches/settings',
          icon: <Settings className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Promotions',
      icon: <Percent className="h-4 w-4" />,
      subItems: [
        {
          label: 'Discounts',
          to: '/promotions/discounts',
          icon: <Tag className="h-3.5 w-3.5" />,
        },
        {
          label: 'Coupons',
          to: '/promotions/coupons',
          icon: <Ticket className="h-3.5 w-3.5" />,
        },
        {
          label: 'Loyalty Program',
          to: '/promotions/loyalty',
          icon: <Gift className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Tables',
      icon: <Table className="h-4 w-4" />,
      subItems: [
        {
          label: 'Table Management',
          to: '/tables/management',
          icon: <TableProperties className="h-3.5 w-3.5" />,
        },
        {
          label: 'Assign Table To User',
          to: '/tables/Assign',
          icon: <Users className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Inventory',
      icon: <Package className="h-4 w-4" />,
      subItems: [
        {
          label: 'Stock Overview',
          to: '/inventory/stock',
          icon: <Boxes className="h-3.5 w-3.5" />,
        },
        {
          label: 'Ingredients',
          to: '/inventory/ingredients',
          icon: <Carrot className="h-3.5 w-3.5" />,
        },
        {
          label: 'Suppliers',
          to: '/inventory/suppliers',
          icon: <Factory className="h-3.5 w-3.5" />,
        },
        {
          label: 'Recipes',
          to: '/inventory/recipes',
          icon: <ChefHat className="h-3.5 w-3.5" />,
        },
        {
          label: 'Purchase Orders',
          to: '/inventory/purchase',
          icon: <ShoppingBag className="h-3.5 w-3.5" />,
        },
        {
          label: 'Waste Tracking',
          to: '/inventory/waste',
          icon: <Trash2 className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      to: '/users/staff',
      subItems: [
        {
          label: 'Staff Management',
          to: '/users/staff',
          icon: <UserCog className="h-3.5 w-3.5" />,
        },
        {
          label: 'Roles & Permissions',
          to: '/users/roles',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
        },
        {
          label: 'Attendance',
          to: '/users/attendance',
          icon: <Clock className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Reports & Analysis',
      icon: <BarChart3 className="h-4 w-4" />,
      subItems: [
        {
          label: 'Sales Report',
          to: '/reports/sales',
          icon: <DollarSign className="h-3.5 w-3.5" />,
        },
        {
          label: 'Order Report',
          to: '/reports/orders',
          icon: <FileText className="h-3.5 w-3.5" />,
        },
        {
          label: 'Transaction Report',
          to: '/reports/transactions',
          icon: <CreditCard className="h-3.5 w-3.5" />,
        },
        {
          label: 'POS Report',
          to: '/reports/pos',
          icon: <Receipt className="h-3.5 w-3.5" />,
        },
        {
          label: 'Inventory Report',
          to: '/reports/inventory',
          icon: <Package className="h-3.5 w-3.5" />,
        },
        {
          label: 'Customer Analytics',
          to: '/reports/analytics',
          icon: <Users className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Subscription',
      icon: <CreditCard className="h-4 w-4" />,
      subItems: [
        {
          label: 'My Plan',
          to: '/subscription/plan',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
        },
        {
          label: 'Billing History',
          to: '/subscription/billing',
          icon: <FileText className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      subItems: [
        {
          label: 'General Settings',
          to: '/settings',
          icon: <Settings className="h-3.5 w-3.5" />,
        },
        {
          label: 'Payment Methods',
          to: '/settings/payments',
          icon: <CreditCard className="h-3.5 w-3.5" />,
        },
        {
          label: 'Printers',
          to: '/settings/printers',
          icon: <Printer className="h-3.5 w-3.5" />,
        },
        {
          label: 'Taxes',
          to: '/settings/taxes',
          icon: <Percent className="h-3.5 w-3.5" />,
        },
      ],
    },
  ];

  return (
    <nav className="space-y-0.5">
      {navItems.map((item) => {
        const isOpen = openSections.has(item.label);
        const active = isActive(item.to, item.subItems);
        const hasDropdown = item.subItems && item.subItems.length > 0;

        const handleClick = () => {
          if (item.label === 'Order') {
            onOrderClick?.();
            if (item.to) navigate(item.to);
            if (isMobile) onMobileClose();
            return;
          }

          if (hasDropdown) {
            toggleSection(item.label);
          } else {
            if (item.to) navigate(item.to);
            if (isMobile) onMobileClose();
          }

          onNavClick?.();
        };

        return (
          <div key={item.label}>
            <button
              onClick={handleClick}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-xs sm:text-sm font-medium',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                !isExpanded && 'justify-center px-2 py-2 w-9 h-9 mx-auto'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {isExpanded && <span className="truncate">{item.label}</span>}
              {hasDropdown && isExpanded && (
                <ChevronRight
                  className={cn(
                    'ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200',
                    isOpen && 'rotate-90'
                  )}
                />
              )}
            </button>

            {/* Submenu Dropdown */}
            <AnimatePresence>
              {hasDropdown && isOpen && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="ml-4 pl-3 border-l border-border/60 my-0.5 space-y-0.5 overflow-hidden"
                >
                  {item.subItems!.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={() => {
                        if (isMobile) onMobileClose();
                        onNavClick?.();
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors font-medium',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )
                      }
                    >
                      <span className="shrink-0 text-muted-foreground">
                        {sub.icon || <div className="w-3.5 h-3.5" />}
                      </span>
                      <span className="truncate">{sub.label}</span>
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
