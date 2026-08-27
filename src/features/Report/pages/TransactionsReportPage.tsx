import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  DollarSign,
  Percent,
  Wallet,
  Calendar,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  RefreshCcw,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Store,
  Hash,
  Download,
  FileSpreadsheet,
  Landmark,
} from 'lucide-react';
import { format, isToday, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';
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

type TransactionRow = {
  _id: string;
  txnId: string;
  date: string;
  customer: string;
  amount: number;
  method: 'card' | 'cash' | 'transfer' | 'mobile';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  orderId: string;
  branch: string;
  processedBy: string;
  fee: number;
  netAmount: number;
};

const BRANCHES = ['Main Branch', 'Downtown', 'Airport', 'Mall Location'];
const METHODS: TransactionRow['method'][] = ['card', 'cash', 'transfer', 'mobile'];
const STATUSES: TransactionRow['status'][] = ['completed', 'pending', 'failed', 'refunded'];
const CUSTOMERS = [
  'Abebe Kebede', 'Sara Ahmed', 'Martha Bekele', 'Daniel Tadesse',
  'Helen Haile', 'Yared Tesfaye', 'Mikayla Solomon', 'Tigist Girma',
  'Bekele Mengistu', 'Selamawit Dereje',
];
const STAFF = ['Dawit M.', 'Hanna S.', 'Tigist A.', 'Biruk K.', 'Selam T.'];

const generateMockTransactions = (): TransactionRow[] => {
  const rows: TransactionRow[] = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 21));
    date.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60));

    const method = METHODS[Math.floor(Math.random() * METHODS.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const amount = Math.round((Math.random() * 3000 + 200) * 100) / 100;
    const fee = status === 'refunded' ? 0 : Math.round(amount * (method === 'card' ? 0.025 : method === 'mobile' ? 0.015 : 0.005) * 100) / 100;
    const netAmount = status === 'refunded' ? -amount : Math.round((amount - fee) * 100) / 100;

    rows.push({
      _id: `txn-${String(i + 1).padStart(5, '0')}`,
      txnId: `TXN${String(20240000 + i + 1)}`,
      date: date.toISOString(),
      customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      amount,
      method,
      status,
      orderId: `ORD-${String(2024000 + i + 1)}`,
      branch: BRANCHES[Math.floor(Math.random() * BRANCHES.length)],
      processedBy: STAFF[Math.floor(Math.random() * STAFF.length)],
      fee,
      netAmount,
    });
  }
  return rows.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
};

const MOCK_TXN_DATA: TransactionRow[] = generateMockTransactions();

const getMethodBadge = (method: TransactionRow['method']) => {
  switch (method) {
    case 'cash':
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"><Banknote className="h-3 w-3" />Cash</Badge>;
    case 'card':
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold gap-1"><CreditCard className="h-3 w-3" />Card</Badge>;
    case 'transfer':
      return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold gap-1"><ArrowRightLeft className="h-3 w-3" />Transfer</Badge>;
    case 'mobile':
      return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold gap-1"><Landmark className="h-3 w-3" />Mobile</Badge>;
    default:
      return <Badge variant="outline">{method}</Badge>;
  }
};

const getStatusBadge = (status: TransactionRow['status']) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case 'failed':
      return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    case 'refunded':
      return <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] font-bold gap-1"><RefreshCcw className="h-3 w-3" />Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const TransactionsReportPage: React.FC = () => {
  const navigate = useNavigate();
  const txnData = MOCK_TXN_DATA;

  const stats = useMemo(() => {
    const totalTxns = txnData.length;
    const totalAmount = txnData.filter((t) => t.status !== 'refunded').reduce((sum, t) => sum + t.amount, 0);
    const totalFees = txnData.reduce((sum, t) => sum + t.fee, 0);
    const totalNet = txnData.reduce((sum, t) => sum + t.netAmount, 0);
    return { totalTxns, totalAmount, totalFees, totalNet };
  }, [txnData]);

  const todayMatcher = (t: TransactionRow) => isToday(parseISO(t.date));
  const weekMatcher = (t: TransactionRow) => isAfter(parseISO(t.date), startOfWeek(new Date(), { weekStartsOn: 1 }));
  const monthMatcher = (t: TransactionRow) => isAfter(parseISO(t.date), startOfMonth(new Date()));
  const cardMatcher = (t: TransactionRow) => t.method === 'card';
  const cashMatcher = (t: TransactionRow) => t.method === 'cash';
  const transferMatcher = (t: TransactionRow) => t.method === 'transfer';
  const refundedMatcher = (t: TransactionRow) => t.status === 'refunded';
  const completedMatcher = (t: TransactionRow) => t.status === 'completed';
  const pendingMatcher = (t: TransactionRow) => t.status === 'pending';
  const failedMatcher = (t: TransactionRow) => t.status === 'failed';

  const quickFilters: QuickFilterOption<TransactionRow>[] = useMemo(() => [
    { key: 'all', label: 'All Transactions', count: txnData.length, icon: <Receipt className="h-3.5 w-3.5" /> },
    { key: 'today', label: 'Today', count: txnData.filter(todayMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: todayMatcher },
    { key: 'week', label: 'This Week', count: txnData.filter(weekMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: weekMatcher },
    { key: 'month', label: 'This Month', count: txnData.filter(monthMatcher).length, icon: <Calendar className="h-3.5 w-3.5" />, matcher: monthMatcher },
    { key: 'card', label: 'Card', count: txnData.filter(cardMatcher).length, icon: <CreditCard className="h-3.5 w-3.5" />, matcher: cardMatcher },
    { key: 'cash', label: 'Cash', count: txnData.filter(cashMatcher).length, icon: <Banknote className="h-3.5 w-3.5" />, matcher: cashMatcher },
    { key: 'transfer', label: 'Transfer', count: txnData.filter(transferMatcher).length, icon: <ArrowRightLeft className="h-3.5 w-3.5" />, matcher: transferMatcher },
    { key: 'refunded', label: 'Refunded', count: txnData.filter(refundedMatcher).length, icon: <RefreshCcw className="h-3.5 w-3.5" />, color: 'sky', matcher: refundedMatcher },
    { key: 'completed', label: 'Completed', count: txnData.filter(completedMatcher).length, icon: <CheckCircle2 className="h-3.5 w-3.5" />, matcher: completedMatcher },
    { key: 'pending', label: 'Pending', count: txnData.filter(pendingMatcher).length, icon: <Clock className="h-3.5 w-3.5" />, color: 'amber', matcher: pendingMatcher },
    { key: 'failed', label: 'Failed', count: txnData.filter(failedMatcher).length, icon: <XCircle className="h-3.5 w-3.5" />, color: 'rose', matcher: failedMatcher },
  ], [txnData]);

  const filterFields: AdvancedFilterField[] = useMemo(() => [
    { id: 'method', label: 'Payment Method', type: 'multi-select', options: [
      { label: 'Cash', value: 'cash' },
      { label: 'Card', value: 'card' },
      { label: 'Transfer', value: 'transfer' },
      { label: 'Mobile', value: 'mobile' },
    ]},
    { id: 'status', label: 'Status', type: 'multi-select', options: [
      { label: 'Completed', value: 'completed' },
      { label: 'Pending', value: 'pending' },
      { label: 'Failed', value: 'failed' },
      { label: 'Refunded', value: 'refunded' },
    ]},
    { id: 'branch', label: 'Branch', type: 'multi-select', options: BRANCHES.map((b) => ({ label: b, value: b })) },
    { id: 'amount', label: 'Amount', type: 'number-range', min: 0, max: 100000, step: 50, prefix: 'ETB' },
    { id: 'date', label: 'Transaction Date', type: 'date-range' },
  ], []);

  const groupByOptions: GroupByOption<TransactionRow>[] = useMemo(() => [
    {
      id: 'status',
      label: 'By Status',
      accessor: (t) => {
        const map: Record<string, string> = { completed: 'Completed', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' };
        return map[t.status] || t.status || 'N/A';
      },
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    {
      id: 'method',
      label: 'By Method',
      accessor: (t) => {
        const map: Record<string, string> = { cash: 'Cash', card: 'Card', transfer: 'Transfer', mobile: 'Mobile' };
        return map[t.method] || t.method || 'N/A';
      },
      icon: <CreditCard className="h-3.5 w-3.5" />,
    },
    {
      id: 'branch',
      label: 'By Branch',
      accessor: (t) => t.branch || 'N/A',
      icon: <Store className="h-3.5 w-3.5" />,
    },
  ], []);

  const sortOptions: SortOption<TransactionRow>[] = useMemo(() => [
    { id: 'dateDesc', label: 'Date (Newest)', field: 'date', direction: 'desc' },
    { id: 'dateAsc', label: 'Date (Oldest)', field: 'date', direction: 'asc' },
    { id: 'amountDesc', label: 'Amount (High to Low)', field: 'amount', direction: 'desc' },
    { id: 'amountAsc', label: 'Amount (Low to High)', field: 'amount', direction: 'asc' },
    { id: 'netDesc', label: 'Net Amount (High to Low)', field: 'netAmount', direction: 'desc' },
    { id: 'feeDesc', label: 'Fee (High to Low)', field: 'fee', direction: 'desc' },
  ], []);

  const kanbanColumns: KanbanColumnConfig<TransactionRow>[] = useMemo(() => [
    {
      id: 'pending',
      title: 'Pending',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Clock className="h-4 w-4" />,
      matcher: (t) => t.status === 'pending',
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      matcher: (t) => t.status === 'completed',
    },
    {
      id: 'refunded',
      title: 'Refunded',
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      icon: <RefreshCcw className="h-4 w-4" />,
      matcher: (t) => t.status === 'refunded',
    },
    {
      id: 'failed',
      title: 'Failed',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <XCircle className="h-4 w-4" />,
      matcher: (t) => t.status === 'failed',
    },
  ], []);

  const initialPresets: SavedPreset[] = useMemo(() => [
    {
      id: 'preset-monthly-txns',
      name: 'Monthly Transactions',
      isSystem: true,
      filters: { quickFilter: 'month', sortField: 'date', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-failed-review',
      name: 'Failed Review',
      isSystem: true,
      filters: { quickFilter: 'failed', sortField: 'date', sortDirection: 'desc', viewMode: 'table' },
    },
    {
      id: 'preset-method-breakdown',
      name: 'Method Breakdown',
      isSystem: true,
      filters: { groupBy: 'method', viewMode: 'kanban' },
    },
  ], []);

  const bulkActions: BulkAction<TransactionRow>[] = useMemo(() => [
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'TXN ID,Date,Customer,Amount,Method,Status,Order ID,Branch,Processed By,Fee,Net Amount';
        const rows = selectedRows.map((t) =>
          [
            t.txnId || 'N/A',
            format(parseISO(t.date), 'yyyy-MM-dd HH:mm'),
            t.customer || 'N/A',
            t.amount.toFixed(2),
            t.method || 'N/A',
            t.status || 'N/A',
            t.orderId || 'N/A',
            t.branch || 'N/A',
            t.processedBy || 'N/A',
            t.fee.toFixed(2),
            t.netAmount.toFixed(2),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Transactions exported', { description: `${selectedRows.length} transactions exported to CSV` });
        clearSelection();
      },
    },
    {
      id: 'export-reconciliation',
      label: 'Export Reconciliation',
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedRows, clearSelection) => {
        const headers = 'TXN ID,Date,Method,Status,Gross,Fee,Net,Order ID';
        const rows = selectedRows.map((t) =>
          [
            t.txnId || 'N/A',
            format(parseISO(t.date), 'yyyy-MM-dd'),
            t.method || 'N/A',
            t.status || 'N/A',
            t.amount.toFixed(2),
            t.fee.toFixed(2),
            t.netAmount.toFixed(2),
            t.orderId || 'N/A',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Reconciliation exported', { description: `${selectedRows.length} rows exported` });
        clearSelection();
      },
    },
  ], []);

  const columns: ColumnDef<TransactionRow>[] = useMemo(() => [
    {
      id: 'txnId',
      header: 'TXN ID',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white font-mono">{t.txnId || 'N/A'}</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Hash className="h-2.5 w-2.5" />
              {t.orderId || 'N/A'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      sortable: true,
      cell: (t) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          <p className="font-medium text-slate-800 dark:text-slate-200">{format(parseISO(t.date), 'MMM d, yyyy')}</p>
          <p className="text-[10px] text-slate-500">{format(parseISO(t.date), 'HH:mm')}</p>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (t) => (
        <div>
          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <User className="h-3 w-3 text-slate-400" />
          {t.customer || 'N/A'}
          </p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Store className="h-2.5 w-2.5" />
            {t.branch || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      sortable: true,
      cell: (t) => (
        <span className={`font-mono text-xs font-bold ${t.status === 'refunded' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
          {t.status === 'refunded' ? '-' : ''}ETB {t.amount.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'method',
      header: 'Method',
      sortable: true,
      cell: (t) => getMethodBadge(t.method),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (t) => getStatusBadge(t.status),
    },
    {
      id: 'orderId',
      header: 'Order ID',
      sortable: true,
      cell: (t) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t.orderId || 'N/A'}
        </span>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      sortable: true,
      cell: (t) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {t.branch || 'N/A'}
        </span>
      ),
    },
    {
      id: 'processedBy',
      header: 'Processed By',
      sortable: true,
      cell: (t) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {t.processedBy || 'N/A'}
        </span>
      ),
    },
    {
      id: 'fee',
      header: 'Fee',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-1.5">
          <Percent className="h-3 w-3 text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            ETB {t.fee.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      id: 'netAmount',
      header: 'Net',
      sortable: true,
      cell: (t) => (
        <span className={`font-mono text-xs font-bold ${t.netAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {t.netAmount >= 0 ? '+' : ''}ETB {t.netAmount.toFixed(2)}
        </span>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Transactions Report"
        subtitle="Reconcile payments, track processing fees, and transaction status across all channels"
        breadcrumbText="Reports"
        breadcrumbAction={() => navigate('/reports')}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Transactions"
            value={stats.totalTxns.toLocaleString()}
            icon={<Receipt className="h-5 w-5" />}
            theme="primary"
            subtitle="All transaction records"
          />
          <DataCard
            title="Total Amount"
            value={`ETB ${stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme="emerald"
            subtitle="Gross before fees & refunds"
          />
          <DataCard
            title="Fees Collected"
            value={`ETB ${stats.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Percent className="h-5 w-5" />}
            theme="indigo"
            subtitle="Processing & service charges"
          />
          <DataCard
            title="Net"
            value={`ETB ${stats.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Wallet className="h-5 w-5" />}
            theme="purple"
            subtitle="Net after fees & refunds"
          />
        </div>

        <DataViewSystem<TransactionRow>
          data={txnData}
          rowKey="_id"
          entityName="Transactions"
          columns={columns}
          isLoading={false}
          loadingRowsCount={8}
          emptyIcon={<Receipt className="h-8 w-8 text-slate-400" />}
          emptyTitle="No transactions found"
          emptyDescription="Adjust your filters or check back for new payment activity."
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search TXN ID, order ID, customer, branch..."
          searchFields={['txnId', 'orderId', 'customer', 'branch', 'processedBy']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="date"
          defaultSortDirection="desc"
          presetStorageKey="transactionsReport"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="status"
          exportFileName="TransactionsReport"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default TransactionsReportPage;
