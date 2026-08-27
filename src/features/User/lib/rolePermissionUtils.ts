// src/features/User/lib/rolePermissionUtils.ts
import type { TaskReference } from '@/api/Queries/merchantQueries';

export type PermissionDomain =
  | 'Staff & Access'
  | 'Menu & Catalog'
  | 'Orders & POS'
  | 'Tables & QR'
  | 'Branch Control'
  | 'Inventory & Stock'
  | 'Reports & Analytics'
  | 'General & System';

export const PERMISSION_DOMAINS: PermissionDomain[] = [
  'Staff & Access',
  'Menu & Catalog',
  'Orders & POS',
  'Tables & QR',
  'Branch Control',
  'Inventory & Stock',
  'Reports & Analytics',
  'General & System',
];

export const DOMAIN_ICONS: Record<PermissionDomain, string> = {
  'Staff & Access': 'Users',
  'Menu & Catalog': 'UtensilsCrossed',
  'Orders & POS': 'ShoppingCart',
  'Tables & QR': 'QrCode',
  'Branch Control': 'Store',
  'Inventory & Stock': 'Package',
  'Reports & Analytics': 'BarChart3',
  'General & System': 'Sliders',
};

/**
 * Classifies a task/permission into a business domain based on name and endpoint
 */
export function getTaskDomain(task: { name?: string; endpoint?: string }): PermissionDomain {
  const text = `${task.name || ''} ${task.endpoint || ''}`.toLowerCase();

  if (
    text.includes('user') ||
    text.includes('staff') ||
    text.includes('role') ||
    text.includes('permission') ||
    text.includes('invite') ||
    text.includes('attendance') ||
    text.includes('merchants/users') ||
    text.includes('merchants/roles')
  ) {
    return 'Staff & Access';
  }

  if (
    text.includes('order') ||
    text.includes('pos') ||
    text.includes('bill') ||
    text.includes('checkout') ||
    text.includes('payment') ||
    text.includes('delivery') ||
    text.includes('takeaway') ||
    text.includes('active assignments')
  ) {
    return 'Orders & POS';
  }

  if (
    text.includes('menu') ||
    text.includes('item') ||
    text.includes('group') ||
    text.includes('combo') ||
    text.includes('category') ||
    text.includes('modifier') ||
    text.includes('recipe') ||
    text.includes('dish')
  ) {
    return 'Menu & Catalog';
  }

  if (
    text.includes('table') ||
    text.includes('qr') ||
    text.includes('area') ||
    text.includes('zone') ||
    text.includes('room')
  ) {
    return 'Tables & QR';
  }

  if (
    text.includes('branch') ||
    text.includes('store') ||
    text.includes('merchant') ||
    text.includes('setting') ||
    text.includes('subscription')
  ) {
    return 'Branch Control';
  }

  if (
    text.includes('inventory') ||
    text.includes('ingredient') ||
    text.includes('stock') ||
    text.includes('purchase') ||
    text.includes('waste') ||
    text.includes('supplier')
  ) {
    return 'Inventory & Stock';
  }

  if (
    text.includes('report') ||
    text.includes('analytic') ||
    text.includes('stat') ||
    text.includes('metric') ||
    text.includes('cogs') ||
    text.includes('profit')
  ) {
    return 'Reports & Analytics';
  }

  return 'General & System';
}

/**
 * Returns color classes and label badge for an HTTP Method
 */
export function getMethodStyle(method?: string) {
  const m = (method || 'GET').toUpperCase();
  switch (m) {
    case 'GET':
      return {
        label: 'GET',
        badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        dotColor: 'bg-sky-500',
        actionType: 'Read',
      };
    case 'POST':
      return {
        label: 'POST',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
        actionType: 'Create',
      };
    case 'PUT':
    case 'PATCH':
      return {
        label: m,
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dotColor: 'bg-amber-500',
        actionType: 'Modify',
      };
    case 'DELETE':
      return {
        label: 'DELETE',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        dotColor: 'bg-rose-500',
        actionType: 'Delete',
      };
    default:
      return {
        label: m,
        badgeClass: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dotColor: 'bg-slate-500',
        actionType: 'API',
      };
  }
}

/**
 * Extracts domain coverage and method breakdown for a role
 */
export function enrichRoleData(role: any) {
  const tasks: TaskReference[] = Array.isArray(role.tasks)
    ? role.tasks.filter((t: any) => typeof t === 'object' && t !== null)
    : [];

  const domains = new Set<PermissionDomain>();
  const methods = new Set<string>();
  let hasDestructive = false;
  let hasMutating = false;

  tasks.forEach((task) => {
    domains.add(getTaskDomain(task));
    const m = (task.method || 'GET').toUpperCase();
    methods.add(m);
    if (m === 'DELETE') hasDestructive = true;
    if (m === 'POST' || m === 'PUT' || m === 'PATCH') hasMutating = true;
  });

  const domainList = Array.from(domains);
  const methodList = Array.from(methods);

  // Access Tier
  let accessTier: 'Admin / Full' | 'Manager / High' | 'Operational' | 'View Only' = 'View Only';
  if (role.isSystemRole || (hasDestructive && tasks.length >= 10)) {
    accessTier = 'Admin / Full';
  } else if (hasDestructive || (hasMutating && tasks.length >= 6)) {
    accessTier = 'Manager / High';
  } else if (hasMutating || tasks.length >= 3) {
    accessTier = 'Operational';
  }

  return {
    ...role,
    taskCount: tasks.length,
    domains: domainList,
    primaryDomain: domainList[0] || 'General & System',
    methods: methodList,
    hasDestructive,
    hasMutating,
    accessTier,
    formattedDate: role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '—',
  };
}
