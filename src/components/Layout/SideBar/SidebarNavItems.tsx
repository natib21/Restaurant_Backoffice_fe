// src/components/layout/SidebarNavItems.tsx
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lock } from 'lucide-react';
import { useTranslation } from '@/locales/i18n';
import { useFeatureAccess } from '@/features/Subscription/hooks/useFeatureAccess';
import type { FeatureKey } from '@/api/Queries/subscriptionQueries';
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
  KeyRound,
  SendHorizontal,
  DollarSign,
  FileText,
  CreditCard,
  Printer,
  Tag,
  Ticket,
  Carrot,
  ChefHat,
  Activity,
  Truck,
  UserCheck,
  Coins,
  History,
  Plus,
  Database,
  GitFork,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  featureKey?: FeatureKey | string;
  subItems?: { label: string; to: string; icon?: React.ReactNode; featureKey?: FeatureKey | string }[];
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
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useFeatureAccess();

  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionId: string) => {
    if (!isExpanded) return;
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
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
      id: 'dashboard',
      label: t('nav_dashboard'),
      icon: <LayoutDashboard className="h-4 w-4" />,
      to: '/dashboard',
    },
    {
      id: 'menu',
      label: t('nav_menu'),
      icon: <UtensilsCrossed className="h-4 w-4" />,
      featureKey: 'menu',
      subItems: [
        {
          label: t('nav_menuItems'),
          to: '/menu/items',
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_menuGroups'),
          to: '/menu/groups',
          icon: <LayoutDashboard className="h-3.5 w-3.5" />,
        },
        {
          label: 'Categories',
          to: '/menu/categories',
          icon: <Tag className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_specialOffers'),
          to: '/menu/specials',
          icon: <Gift className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'pos',
      label: t('nav_pos'),
      icon: <Receipt className="h-4 w-4" />,
      to: '/pos',
      featureKey: 'sales',
    },
    {
      id: 'order',
      label: t('nav_order'),
      icon: <ShoppingCart className="h-4 w-4" />,
      featureKey: 'orders',
      subItems: [
        {
          label: 'Live Active Orders',
          to: '/orders/active',
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: 'Review Queue',
          to: '/orders/review-queue',
          icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
        },
        {
          label: 'All Orders (Database)',
          to: '/orders/all',
          icon: <Database className="h-3.5 w-3.5" />,
        },
        {
          label: 'Order Flow Routing',
          to: '/orders/flow-config',
          icon: <GitFork className="h-3.5 w-3.5 text-primary" />,
        },
        {
          label: 'Create New Order',
          to: '/orders/new',
          icon: <Plus className="h-3.5 w-3.5" />,
        },
        {
          label: 'Order History',
          to: '/orders/history',
          icon: <History className="h-3.5 w-3.5" />,
        },
        {
          label: 'Delivery Management',
          to: '/orders/delivery',
          icon: <Truck className="h-3.5 w-3.5" />,
        },
        {
          label: 'Takeaway Orders',
          to: '/orders/takeaway',
          icon: <ShoppingBag className="h-3.5 w-3.5" />,
        },
        {
          label: 'Dine-In Orders',
          to: '/orders/dine-in',
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'kds',
      label: 'KDS PRO (Kitchen)',
      icon: <ChefHat className="h-4 w-4 text-amber-400" />,
      subItems: [
        {
          label: 'All Stations Overview',
          to: '/kds',
          icon: <LayoutDashboard className="h-3.5 w-3.5" />,
        },
        {
          label: 'Grill Station',
          to: '/kds/grill',
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
        },
        {
          label: 'Salad Station',
          to: '/kds/salad',
          icon: <Carrot className="h-3.5 w-3.5" />,
        },
        {
          label: 'Fry Station',
          to: '/kds/fry',
          icon: <Boxes className="h-3.5 w-3.5" />,
        },
        {
          label: 'Expo Station',
          to: '/kds/expo',
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: 'TV Display Mode',
          to: '/kds/tv',
          icon: <Activity className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'customer',
      label: t('nav_customer'),
      icon: <Users className="h-4 w-4" />,
      featureKey: 'customerManagement',
      subItems: [
        {
          label: t('nav_customerList'),
          to: '/customers/list',
          icon: <Users className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_customerGroups'),
          to: '/customers/groups',
          icon: <UserRound className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_telegramChat'),
          to: '/customers/telegram-chat',
          icon: <SendHorizontal className="h-3.5 w-3.5" />,
          featureKey: 'telegram',
        },
        {
          label: t('nav_feedback'),
          to: '/customers/feedback',
          icon: <MessageSquare className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_loyalty'),
          to: '/customers',
          icon: <Gift className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_marketing'),
          to: '/marketing/campaigns',
          icon: <Megaphone className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'branches',
      label: t('nav_branches'),
      icon: <Building2 className="h-4 w-4" />,
      featureKey: 'multiBranch',
      subItems: [
        {
          label: t('nav_branchManagement'),
          to: '/branches',
          icon: <Building2 className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'tables',
      label: t('nav_tables'),
      icon: <Table className="h-4 w-4" />,
      featureKey: 'tableManagement',
      subItems: [
        {
          label: t('nav_floorPlan'),
          to: '/tables',
          icon: <TableProperties className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_seatedSessions'),
          to: '/tables/sessions',
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_tableAssignments'),
          to: '/tables/assignments',
          icon: <UserCheck className="h-3.5 w-3.5" />,
        },
        {
          label: 'Print Menus',
          to: '/tables/print-menu',
          icon: <Printer className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'inventory',
      label: t('nav_inventory'),
      icon: <Package className="h-4 w-4" />,
      featureKey: 'inventory',
      subItems: [
        {
          label: t('nav_stockOverview'),
          to: '/inventory/stock',
          icon: <Boxes className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_ingredients'),
          to: '/inventory/ingredients',
          icon: <Carrot className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_suppliers'),
          to: '/inventory/suppliers',
          icon: <Factory className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_recipes'),
          to: '/inventory/recipes',
          icon: <ChefHat className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_purchaseOrders'),
          to: '/inventory/purchase',
          icon: <ShoppingBag className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_wasteTracking'),
          to: '/inventory/waste',
          icon: <Trash2 className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'users',
      label: t('nav_users'),
      icon: <Users className="h-4 w-4" />,
      to: '/users/staff',
      subItems: [
        {
          label: t('nav_staffManagement'),
          to: '/users/staff',
          icon: <UserCog className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_roles'),
          to: '/users/roles',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_permissions'),
          to: '/users/permissions',
          icon: <KeyRound className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_auditLogs') || 'Audit Logs',
          to: '/audit-logs',
          icon: <History className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'reports',
      label: t('nav_reports'),
      icon: <BarChart3 className="h-4 w-4" />,
      featureKey: 'reports',
      subItems: [
        {
          label: 'Sales & Revenue',
          to: '/reports/sales',
          icon: <DollarSign className="h-3.5 w-3.5" />,
        },
        {
          label: 'Orders Lifecycle',
          to: '/reports/orders',
          icon: <ShoppingCart className="h-3.5 w-3.5" />,
        },
        {
          label: 'Products & Menu',
          to: '/reports/products',
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
        },
        {
          label: 'Profitability & COGS',
          to: '/reports/profitability',
          icon: <Coins className="h-3.5 w-3.5" />,
        },
        {
          label: 'Guests & Retention',
          to: '/reports/customers',
          icon: <Users className="h-3.5 w-3.5" />,
        },
        {
          label: 'Delivery & Logistics',
          to: '/reports/delivery',
          icon: <Truck className="h-3.5 w-3.5" />,
        },
        {
          label: 'Staff Efficiency',
          to: '/reports/staff',
          icon: <UserCheck className="h-3.5 w-3.5" />,
        },
        {
          label: 'Inventory Valuation',
          to: '/reports/inventory',
          icon: <Package className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'subscription',
      label: t('nav_subscription'),
      icon: <CreditCard className="h-4 w-4" />,
      subItems: [
        {
          label: t('nav_myPlan'),
          to: '/subscription/plan',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_billingHistory'),
          to: '/subscription/billing',
          icon: <FileText className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'settings',
      label: t('nav_settings'),
      icon: <Settings className="h-4 w-4" />,
      subItems: [
        {
          label: t('nav_generalSettings'),
          to: '/settings?tab=profile',
          icon: <Settings className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_taxes'),
          to: '/settings?tab=taxes',
          icon: <Percent className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_paymentMethods'),
          to: '/settings?tab=payments',
          icon: <CreditCard className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_printers'),
          to: '/settings?tab=printers',
          icon: <Printer className="h-3.5 w-3.5" />,
        },
        {
          label: t('nav_telegramBot'),
          to: '/settings?tab=telegram',
          icon: <SendHorizontal className="h-3.5 w-3.5" />,
          featureKey: 'telegram',
        },
      ],
    },
  ];

  return (
    <nav className="space-y-0.5">
      {navItems.map((item) => {
        const isOpen = openSections.has(item.id);
        const active = isActive(item.to, item.subItems);
        const hasDropdown = item.subItems && item.subItems.length > 0;
        const isItemEnabled = item.featureKey ? hasFeature(item.featureKey) : true;

        const handleClick = () => {
          if (!isItemEnabled) {
            navigate('/subscription/plan');
            if (isMobile) onMobileClose();
            return;
          }

          if (hasDropdown) {
            toggleSection(item.id);
          } else {
            if (item.to) navigate(item.to);
            if (isMobile) onMobileClose();
          }

          onNavClick?.();
        };

        return (
          <div key={item.id}>
            <button
              onClick={handleClick}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-xs sm:text-sm font-medium',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                !isItemEnabled && 'opacity-75',
                !isExpanded && 'justify-center px-2 py-2 w-9 h-9 mx-auto'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {isExpanded && <span className="truncate">{item.label}</span>}
              {!isItemEnabled && isExpanded && (
                <span className="ml-auto flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold shrink-0">
                  <Lock className="h-3 w-3" />
                  Upgrade
                </span>
              )}
              {isItemEnabled && hasDropdown && isExpanded && (
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
              {hasDropdown && isOpen && isExpanded && isItemEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="ml-4 pl-3 border-l border-border/60 my-0.5 space-y-0.5 overflow-hidden"
                >
                  {item.subItems!.map((sub) => {
                    const isSubEnabled = sub.featureKey ? hasFeature(sub.featureKey) : true;
                    if (!isSubEnabled) {
                      return (
                        <button
                          key={sub.to}
                          onClick={() => {
                            navigate('/subscription/plan');
                            if (isMobile) onMobileClose();
                          }}
                          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors font-medium text-muted-foreground/70 hover:bg-amber-50 hover:text-amber-800"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="shrink-0">{sub.icon || <div className="w-3.5 h-3.5" />}</span>
                            <span className="truncate">{sub.label}</span>
                          </span>
                          <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                        </button>
                      );
                    }
                    return (
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
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
};
