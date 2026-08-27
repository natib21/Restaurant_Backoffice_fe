import React, { useMemo } from 'react';
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  ClipboardList,
  Tag,
  Warehouse,
} from 'lucide-react';
import { format, isToday, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import {
  PageHeader,
  DataCard,
  DataViewSystem,
  type ColumnDef,
  type AdvancedFilterField,
  type QuickFilterOption,
  type GroupByOption,
  type SortOption,
  type BulkAction,
  type KanbanColumnConfig,
  type SavedPreset,
} from '@/components/Common';
import { Badge } from '@/components/ui/badge';
import { type StockMovement, useGetInventoryMovements, useGetInventoryValuation, useGetLowStockItems } from '@/api/Queries/inventoryQueries';

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    _id: 'sm-1', ingredient: { _id: 'i-1', name: 'Tomatoes', unit: 'kg' },
    quantity: 50, type: 'in', reason: 'Purchase Order PO-2024-0100', reference: 'PO-2024-0100',
    costPerUnit: 35, movementValue: 1750, balance: 120, createdBy: 'admin',
    createdAt: new Date(Date.now() - 0 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-2', ingredient: { _id: 'i-2', name: 'Beef Cubes', unit: 'kg' },
    quantity: 8, type: 'out', reason: 'Kitchen usage - Order #1234', reference: 'ORD-1234',
    costPerUnit: 420, movementValue: 3360, balance: 45, createdBy: 'chef',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-3', ingredient: { _id: 'i-3', name: 'Rice Basmati', unit: 'kg' },
    quantity: 25, type: 'in', reason: 'Purchase Order PO-2024-0099', reference: 'PO-2024-0099',
    costPerUnit: 85, movementValue: 2125, balance: 80, createdBy: 'admin',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-4', ingredient: { _id: 'i-4', name: 'Cooking Oil', unit: 'liter' },
    quantity: 3, type: 'waste', reason: 'Spoiled - expired batch', reference: 'WASTE-2024-042',
    costPerUnit: 55, movementValue: 165, balance: 22, createdBy: 'manager',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-5', ingredient: { _id: 'i-5', name: 'Onions', unit: 'kg' },
    quantity: -5, type: 'adjustment', reason: 'Stock count correction', reference: 'ADJ-2024-018',
    costPerUnit: 28, movementValue: -140, balance: 60, createdBy: 'manager',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-6', ingredient: { _id: 'i-6', name: 'Chicken Breast', unit: 'kg' },
    quantity: 20, type: 'in', reason: 'Purchase Order PO-2024-0098', reference: 'PO-2024-0098',
    costPerUnit: 280, movementValue: 5600, balance: 55, createdBy: 'admin',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-7', ingredient: { _id: 'i-1', name: 'Tomatoes', unit: 'kg' },
    quantity: 15, type: 'out', reason: 'Kitchen production batch', reference: 'BATCH-0042',
    costPerUnit: 35, movementValue: 525, balance: 105, createdBy: 'chef',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-8', ingredient: { _id: 'i-7', name: 'Milk Fresh', unit: 'liter' },
    quantity: 10, type: 'waste', reason: 'Spoiled - fridge malfunction', reference: 'WASTE-2024-041',
    costPerUnit: 42, movementValue: 420, balance: 8, createdBy: 'manager',
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-9', ingredient: { _id: 'i-2', name: 'Beef Cubes', unit: 'kg' },
    quantity: 30, type: 'in', reason: 'Purchase Order PO-2024-0097', reference: 'PO-2024-0097',
    costPerUnit: 415, movementValue: 12450, balance: 75, createdBy: 'admin',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-10', ingredient: { _id: 'i-8', name: 'Garlic', unit: 'kg' },
    quantity: 2, type: 'adjustment', reason: 'Physical count discrepancy', reference: 'ADJ-2024-017',
    costPerUnit: 95, movementValue: 190, balance: 14, createdBy: 'manager',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-11', ingredient: { _id: 'i-9', name: 'Butter', unit: 'kg' },
    quantity: 15, type: 'in', reason: 'Purchase Order PO-2024-0096', reference: 'PO-2024-0096',
    costPerUnit: 180, movementValue: 2700, balance: 25, createdBy: 'admin',
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-12', ingredient: { _id: 'i-3', name: 'Rice Basmati', unit: 'kg' },
    quantity: 12, type: 'out', reason: 'Kitchen daily usage', reference: 'DAILY-LOG',
    costPerUnit: 85, movementValue: 1020, balance: 68, createdBy: 'chef',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-13', ingredient: { _id: 'i-10', name: 'Sugar', unit: 'kg' },
    quantity: 2, type: 'waste', reason: 'Water damage', reference: 'WASTE-2024-040',
    costPerUnit: 48, movementValue: 96, balance: 48, createdBy: 'manager',
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-14', ingredient: { _id: 'i-5', name: 'Onions', unit: 'kg' },
    quantity: 40, type: 'in', reason: 'Purchase Order PO-2024-0095', reference: 'PO-2024-0095',
    costPerUnit: 28, movementValue: 1120, balance: 100, createdBy: 'admin',
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-15', ingredient: { _id: 'i-6', name: 'Chicken Breast', unit: 'kg' },
    quantity: 10, type: 'out', reason: 'Catering event prep', reference: 'CATER-007',
    costPerUnit: 280, movementValue: 2800, balance: 45, createdBy: 'chef',
    createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-16', ingredient: { _id: 'i-11', name: 'Flour All-Purpose', unit: 'kg' },
    quantity: -3, type: 'adjustment', reason: 'Count correction - shrinkage', reference: 'ADJ-2024-016',
    costPerUnit: 38, movementValue: -114, balance: 52, createdBy: 'manager',
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-17', ingredient: { _id: 'i-12', name: 'Eggs', unit: 'pieces' },
    quantity: 120, type: 'in', reason: 'Purchase Order PO-2024-0094', reference: 'PO-2024-0094',
    costPerUnit: 4.5, movementValue: 540, balance: 180, createdBy: 'admin',
    createdAt: new Date(Date.now() - 192 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-18', ingredient: { _id: 'i-12', name: 'Eggs', unit: 'pieces' },
    quantity: 8, type: 'waste', reason: 'Damaged in storage', reference: 'WASTE-2024-039',
    costPerUnit: 4.5, movementValue: 36, balance: 172, createdBy: 'manager',
    createdAt: new Date(Date.now() - 216 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-19', ingredient: { _id: 'i-13', name: 'Lemon', unit: 'kg' },
    quantity: 10, type: 'out', reason: 'Bar prep', reference: 'BATCH-BAR-023',
    costPerUnit: 55, movementValue: 550, balance: 15, createdBy: 'chef',
    createdAt: new Date(Date.now() - 240 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'sm-20', ingredient: { _id: 'i-14', name: 'Coffee Beans', unit: 'kg' },
    quantity: 5, type: 'in', reason: 'Purchase Order PO-2024-0093', reference: 'PO-2024-0093',
    costPerUnit: 450, movementValue: 2250, balance: 22, createdBy: 'admin',
    createdAt: new Date(Date.now() - 300 * 60 * 60 * 1000).toISOString(),
  },
];

const InventoryReportPage: React.FC = () => {
  const { data: movementsData } = useGetInventoryMovements();
  const { data: valuationData } = useGetInventoryValuation();
  const { data: lowStockData } = useGetLowStockItems();
  const isLoading = false;

  const movements: StockMovement[] = movementsData?.data?.movements || MOCK_MOVEMENTS;

  const mockValuation = useMemo(() => ({
    totalValue: 185420.75,
    totalItems: 124,
    lowStockCount: 18,
  }), []);

  const valuation = useMemo(() => ({
    totalValue: valuationData?.data?.valuation?.totalValue ?? mockValuation.totalValue,
    totalItems: valuationData?.data?.valuation?.totalItems ?? mockValuation.totalItems,
    lowStockCount: lowStockData?.data?.items?.length ?? mockValuation.lowStockCount,
  }), [valuationData, lowStockData, mockValuation]);

  const inMatcher = (m: StockMovement) => m.type === 'in';
  const outMatcher = (m: StockMovement) => m.type === 'out';
  const wasteMatcher = (m: StockMovement) => m.type === 'waste';
  const adjustmentMatcher = (m: StockMovement) => m.type === 'adjustment';
  const todayMatcher = (m: StockMovement) => isToday(new Date(m.createdAt));
  const weekMatcher = (m: StockMovement) => isWithinInterval(new Date(m.createdAt), { start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
  const monthMatcher = (m: StockMovement) => isWithinInterval(new Date(m.createdAt), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });

  const quickFilters: QuickFilterOption<StockMovement>[] = [
    { key: 'all', label: 'All Movements', count: movements.length, icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { key: 'in', label: 'Stock In', count: movements.filter(inMatcher).length, icon: <ArrowDownCircle className="h-3.5 w-3.5" />, color: 'emerald', matcher: inMatcher },
    { key: 'out', label: 'Stock Out', count: movements.filter(outMatcher).length, icon: <ArrowUpCircle className="h-3.5 w-3.5" />, color: 'blue', matcher: outMatcher },
    { key: 'waste', label: 'Waste', count: movements.filter(wasteMatcher).length, icon: <Trash2 className="h-3.5 w-3.5" />, color: 'rose', matcher: wasteMatcher },
    { key: 'adjustment', label: 'Adjustments', count: movements.filter(adjustmentMatcher).length, icon: <SlidersHorizontal className="h-3.5 w-3.5" />, color: 'amber', matcher: adjustmentMatcher },
    { key: 'today', label: 'Today', count: movements.filter(todayMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: todayMatcher },
    { key: 'week', label: 'This Week', count: movements.filter(weekMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: weekMatcher },
    { key: 'month', label: 'This Month', count: movements.filter(monthMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: monthMatcher },
  ];

  const filterFields: AdvancedFilterField[] = [
    {
      id: 'type', label: 'Movement Type', type: 'multi-select',
      options: [
        { label: 'Stock In', value: 'in' }, { label: 'Stock Out', value: 'out' },
        { label: 'Waste', value: 'waste' }, { label: 'Adjustment', value: 'adjustment' },
      ],
    },
    { id: 'ingredient', label: 'Ingredient Name', type: 'text', placeholder: 'Search ingredient...' },
    { id: 'movementValue', label: 'Movement Value', type: 'number-range', min: -100000, max: 100000, step: 50, prefix: 'ETB' },
    { id: 'quantity', label: 'Quantity', type: 'number-range', min: -1000, max: 1000, step: 1 },
    { id: 'createdAt', label: 'Movement Date', type: 'date-range' },
    { id: 'reason', label: 'Reason / Note', type: 'text', placeholder: 'Search reason...' },
  ];

  const groupByOptions: GroupByOption<StockMovement>[] = [
    { id: 'type', label: 'By Movement Type', accessor: (m) => m.type || 'N/A', icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
    { id: 'ingredient', label: 'By Ingredient', accessor: (m) => m.ingredient?.name || 'N/A', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'day', label: 'By Day', accessor: (m) => format(new Date(m.createdAt), 'EEEE, MMM d'), icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'createdBy', label: 'By User', accessor: (m) => m.createdBy || 'N/A', icon: <Tag className="h-3.5 w-3.5" /> },
  ];

  const sortOptions: SortOption<StockMovement>[] = [
    { id: 'createdDesc', label: 'Date (Newest)', field: 'createdAt', direction: 'desc' },
    { id: 'createdAsc', label: 'Date (Oldest)', field: 'createdAt', direction: 'asc' },
    { id: 'valueDesc', label: 'Value (High to Low)', field: 'movementValue', direction: 'desc' },
    { id: 'valueAsc', label: 'Value (Low to High)', field: 'movementValue', direction: 'asc' },
    { id: 'qtyDesc', label: 'Quantity (Largest)', field: 'quantity', direction: 'desc' },
    { id: 'ingredient', label: 'Ingredient (A-Z)', field: 'ingredient.name' },
  ];

  const kanbanColumns: KanbanColumnConfig<StockMovement>[] = [
    {
      id: 'in', title: 'Stock In', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
      icon: <ArrowDownCircle className="h-4 w-4" />, matcher: inMatcher,
    },
    {
      id: 'out', title: 'Stock Out', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
      icon: <ArrowUpCircle className="h-4 w-4" />, matcher: outMatcher,
    },
    {
      id: 'waste', title: 'Waste', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200',
      icon: <Trash2 className="h-4 w-4" />, matcher: wasteMatcher,
    },
    {
      id: 'adjustment', title: 'Adjustments', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
      icon: <SlidersHorizontal className="h-4 w-4" />, matcher: adjustmentMatcher,
    },
  ];

  const initialPresets: SavedPreset[] = [
    {
      id: 'preset-recent-activity',
      name: 'Recent Activity',
      isSystem: true,
      filters: { quickFilter: 'today', sortField: 'createdAt', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-waste-audit',
      name: 'Waste Audit Trail',
      isSystem: true,
      filters: { quickFilter: 'waste', groupBy: 'ingredient', viewMode: 'table' },
    },
    {
      id: 'preset-weekly-flow',
      name: 'Weekly Inventory Flow',
      isSystem: true,
      filters: { quickFilter: 'week', groupBy: 'day', sortField: 'createdAt', sortDirection: 'asc', viewMode: 'table' },
    },
  ];

  const bulkActions: BulkAction<StockMovement>[] = [
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'Date,Ingredient,Type,Quantity,Unit,Unit Cost,Movement Value,Balance,Reason,Reference,User';
        const rows = selectedRows.map((m) =>
          [
            format(new Date(m.createdAt), 'yyyy-MM-dd HH:mm'),
            m.ingredient?.name || '',
            m.type,
            m.quantity,
            m.ingredient?.unit || '',
            (m.costPerUnit || 0).toFixed(2),
            (m.movementValue || 0).toFixed(2),
            m.balance,
            m.reason || '',
            m.reference || '',
            m.createdBy || '',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Inventory_Movements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Export successful', { description: `${selectedRows.length} movements exported to CSV` });
        clearSelection();
      },
    },
  ];

  const getTypeBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"><ArrowDownCircle className="h-3 w-3" /> In</Badge>;
      case 'out':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold gap-1"><ArrowUpCircle className="h-3 w-3" /> Out</Badge>;
      case 'waste':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold gap-1"><Trash2 className="h-3 w-3" /> Waste</Badge>;
      case 'adjustment':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1"><SlidersHorizontal className="h-3 w-3" /> Adj</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const columns: ColumnDef<StockMovement>[] = [
    {
      id: 'date', header: 'Date', sortable: true, accessorKey: 'createdAt',
      cell: (m) => (
        <div className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div>
            <p className="font-medium">{format(new Date(m.createdAt), 'MMM d, yyyy')}</p>
            <p className="text-[10px]">{format(new Date(m.createdAt), 'HH:mm')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'ingredient', header: 'Ingredient', sortable: true,
      cell: (m) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{m.ingredient?.name || 'N/A'}</p>
            <p className="text-[10px] text-slate-500">{m.reference || m.createdBy || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'type', header: 'Type', sortable: true,
      cell: (m) => getTypeBadge(m.type),
    },
    {
      id: 'quantity', header: 'Quantity', sortable: true,
      cell: (m) => {
        const isPositive = m.type === 'in' || (m.type === 'adjustment' && m.quantity > 0);
        return (
          <div className={`font-mono text-xs font-bold ${
            m.type === 'waste' ? 'text-rose-700 dark:text-rose-400' :
            isPositive ? 'text-emerald-700 dark:text-emerald-400' :
            'text-blue-700 dark:text-blue-400'
          }`}>
            {isPositive ? '+' : ''}{m.quantity} <span className="font-normal text-[10px] text-slate-500">{m.ingredient?.unit || ''}</span>
          </div>
        );
      },
    },
    {
      id: 'unitCost', header: 'Unit Cost', sortable: true,
      cell: (m) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          ETB {(m.costPerUnit || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'movementValue', header: 'Movement Value', sortable: true,
      cell: (m) => {
        const val = m.movementValue || 0;
        return (
          <span className={`font-mono text-xs font-bold ${val >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {val >= 0 ? '+' : ''}ETB {val.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: 'balance', header: 'Balance', sortable: true,
      cell: (m) => (
        <Badge variant="outline" className="font-mono text-[10px] font-bold">
          {m.balance} {m.ingredient?.unit || ''}
        </Badge>
      ),
    },
    {
      id: 'reason', header: 'Reason',
      cell: (m) => (
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
          {m.reason || 'N/A'}
        </p>
      ),
    },
    {
      id: 'reference', header: 'Reference',
      cell: (m) => (
        <span className="text-xs font-mono text-slate-500">
          {m.reference || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Inventory Report"
        subtitle="Track stock movements, valuations, shrinkage and low-stock alerts across your pantry"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Inventory Value"
            value={isLoading ? '...' : `$${valuation.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme="purple"
            subtitle="Total on-hand stock valuation"
            isLoading={isLoading}
          />
          <DataCard
            title="Total Items"
            value={isLoading ? '...' : valuation.totalItems}
            icon={<Warehouse className="h-5 w-5" />}
            theme="primary"
            subtitle="Unique ingredient SKUs tracked"
            isLoading={isLoading}
          />
          <DataCard
            title="Low Stock Items"
            value={isLoading ? '...' : valuation.lowStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            theme="amber"
            subtitle="Below minimum reorder threshold"
            isLoading={isLoading}
          />
          <DataCard
            title="Movements Logged"
            value={isLoading ? '...' : movements.length}
            icon={<FileSpreadsheet className="h-5 w-5" />}
            theme="emerald"
            subtitle="Total recorded stock movements"
            isLoading={isLoading}
          />
        </div>

        <DataViewSystem<StockMovement>
          data={movements}
          rowKey="_id"
          entityName="Inventory Movements"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<ClipboardList className="h-8 w-8 text-slate-400" />}
          emptyTitle="No inventory movements"
          emptyDescription="Stock movements will appear here when ingredients are received, used, wasted, or adjusted."
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search ingredient, reason, reference..."
          searchFields={['ingredient.name', 'reason', 'reference', 'createdBy']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="createdAt"
          defaultSortDirection="desc"
          presetStorageKey="inventoryReport"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="type"
          exportFileName="Inventory_Movements"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default InventoryReportPage;
