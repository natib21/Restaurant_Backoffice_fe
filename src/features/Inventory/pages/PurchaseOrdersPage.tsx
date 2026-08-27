// src/features/Inventory/pages/PurchaseOrdersPage.tsx
import React, { useState, useMemo } from 'react';
import {
  useGetPurchaseOrdersList,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useReceiveGoodsForPO,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from '@/api/Queries/purchaseOrderQueries';
import { useGetSuppliersList } from '@/api/Queries/supplierQueries';
import { useGetIngredientsList } from '@/api/Queries/ingredientQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Package,
  ShoppingBag,
  Edit,
  Trash2,
  CheckCircle,
  Truck,
  Calendar,
  Clock,
  DollarSign,
  X,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  FileSpreadsheet,
  Layers,
  Copy,
} from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
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

type POStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

const STATUS_OPTIONS: Array<{ value: POStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface FormItem {
  id: string;
  ingredient: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface POFormData {
  supplier: string;
  status: POStatus;
  expectedDeliveryDate: string;
  notes: string;
  taxAmount: number;
  items: FormItem[];
}

const emptyPoForm: POFormData = {
  supplier: '',
  status: 'draft',
  expectedDeliveryDate: '',
  notes: '',
  taxAmount: 0,
  items: [],
};

const isOverdue = (po: PurchaseOrder): boolean => {
  if (!po.expectedDeliveryDate) return false;
  if (po.status === 'received' || po.status === 'cancelled') return false;
  const today = startOfDay(new Date());
  const expected = startOfDay(parseISO(po.expectedDeliveryDate));
  return isBefore(expected, today);
};

const PurchaseOrdersPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [deletingPoId, setDeletingPoId] = useState<string | null>(null);

  const [poForm, setPoForm] = useState<POFormData>(emptyPoForm);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const { data, isLoading, refetch } = useGetPurchaseOrdersList();
  const { data: suppliersData } = useGetSuppliersList();
  const { data: ingredientsData } = useGetIngredientsList();

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();
  const receiveMutation = useReceiveGoodsForPO();

  const purchaseOrders: PurchaseOrder[] = data?.data?.purchaseOrders || [];
  const suppliers = suppliersData?.data?.suppliers || [];
  const ingredients = ingredientsData?.data?.ingredients || [];

  const stats = useMemo(() => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter((po) =>
      ['sent', 'confirmed', 'partially_received'].includes(po.status)
    ).length;
    const receivedThisPeriod = purchaseOrders.filter((po) => po.status === 'received').length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    return { total, pending, receivedThisPeriod, totalValue };
  }, [purchaseOrders]);

  const subtotalCalc = useMemo(() => {
    return poForm.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [poForm.items]);

  const totalCalc = useMemo(() => {
    return subtotalCalc + (Number(poForm.taxAmount) || 0);
  }, [subtotalCalc, poForm.taxAmount]);

  const addFormItem = () => {
    const newItem: FormItem = {
      id: `item-${Date.now()}`,
      ingredient: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setPoForm((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeFormItem = (id: string) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateFormItem = (id: string, field: keyof FormItem, value: any) => {
    setPoForm((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        if (field === 'ingredient') {
          const ing = ingredients.find((i) => i._id === value);
          if (ing) {
            updated.unitPrice = ing.costPerUnit || 0;
            updated.totalPrice = updated.quantity * (ing.costPerUnit || 0);
          }
        }
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : updated.quantity;
          const price = field === 'unitPrice' ? parseFloat(value) || 0 : updated.unitPrice;
          updated.totalPrice = qty * price;
        }
        return updated;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const resetPoForm = () => {
    setPoForm(emptyPoForm);
  };

  const handleCreatePO = async () => {
    if (!poForm.supplier) {
      toast.error('Validation Error', { description: 'Supplier is required' });
      return;
    }
    if (poForm.items.length === 0) {
      toast.error('Validation Error', { description: 'At least one ingredient item is required' });
      return;
    }

    const invalidItems = poForm.items.some((item) => !item.ingredient || item.quantity <= 0);
    if (invalidItems) {
      toast.error('Validation Error', { description: 'All items must have an ingredient and positive quantity' });
      return;
    }

    const items: PurchaseOrderItem[] = poForm.items.map((item) => ({
      ingredient: item.ingredient,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice),
    }));

    try {
      await createMutation.mutateAsync({
        supplier: poForm.supplier,
        status: poForm.status,
        items,
        taxAmount: Number(poForm.taxAmount) || 0,
        expectedDeliveryDate: poForm.expectedDeliveryDate || undefined,
        notes: poForm.notes || undefined,
      });

      resetPoForm();
      setIsCreateDialogOpen(false);
      refetch();
      toast.success('Success', { description: 'Purchase order created successfully' });
    } catch (err) {
      toast.error('Error', { description: 'Failed to create purchase order' });
    }
  };

  const openEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoForm({
      supplier: po.supplier?._id || '',
      status: po.status,
      expectedDeliveryDate: po.expectedDeliveryDate
        ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0]
        : '',
      notes: po.notes || '',
      taxAmount: po.taxAmount || 0,
      items:
        po.items?.map((item, idx) => ({
          id: `edit-${idx}-${Date.now()}`,
          ingredient: item.ingredient?._id || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePO = async () => {
    if (!editingPO) return;
    if (!poForm.supplier) {
      toast.error('Error', { description: 'Supplier is required' });
      return;
    }
    if (poForm.items.length === 0) {
      toast.error('Error', { description: 'At least one item is required' });
      return;
    }

    const items: PurchaseOrderItem[] = poForm.items.map((item) => ({
      ingredient: item.ingredient,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice),
    }));

    try {
      await updateMutation.mutateAsync({
        poId: editingPO._id,
        data: {
          supplier: poForm.supplier,
          status: poForm.status,
          items,
          taxAmount: Number(poForm.taxAmount) || 0,
          expectedDeliveryDate: poForm.expectedDeliveryDate || undefined,
          notes: poForm.notes || undefined,
        },
      });

      setEditingPO(null);
      resetPoForm();
      setIsEditDialogOpen(false);
      refetch();
      toast.success('Success', { description: 'Purchase order updated successfully' });
    } catch (err) {
      toast.error('Error', { description: 'Failed to update purchase order' });
    }
  };

  const handleDeletePO = async () => {
    if (!deletingPoId) return;
    try {
      await deleteMutation.mutateAsync(deletingPoId);
      refetch();
      toast.success('Success', { description: 'Purchase order deleted successfully' });
      setIsDeleteDialogOpen(false);
      setDeletingPoId(null);
    } catch (err) {
      toast.error('Error', { description: 'Failed to delete purchase order' });
    }
  };

  const openReceiveDialog = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const qtys: Record<string, number> = {};
    po.items?.forEach((item) => {
      qtys[item.ingredient._id] = item.quantity;
    });
    setReceivedQtys(qtys);
    setIsReceiveDialogOpen(true);
  };

  const handleReceiveGoods = async () => {
    if (!receivingPO) return;

    const receivedItems = receivingPO.items.map((item) => ({
      ingredientId: item.ingredient._id,
      receivedQuantity: receivedQtys[item.ingredient._id] ?? item.quantity,
    }));

    try {
      await receiveMutation.mutateAsync({
        poId: receivingPO._id,
        data: { receivedItems },
      });

      setIsReceiveDialogOpen(false);
      setReceivingPO(null);
      refetch();
      toast.success('Success', { description: 'Goods received and inventory levels updated' });
    } catch (err) {
      toast.error('Error', { description: 'Failed to record received goods' });
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-[10px] font-semibold">Draft</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">Sent</Badge>;
      case 'confirmed':
        return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold">Confirmed</Badge>;
      case 'partially_received':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">Partial</Badge>;
      case 'received':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">Received</Badge>;
      case 'cancelled':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingMatcher = (po: PurchaseOrder) =>
    ['sent', 'confirmed', 'partially_received'].includes(po.status);
  const approvedMatcher = (po: PurchaseOrder) => po.status === 'confirmed';
  const deliveredMatcher = (po: PurchaseOrder) => po.status === 'received';
  const overdueMatcher = (po: PurchaseOrder) => isOverdue(po);

  const quickFilters: QuickFilterOption<PurchaseOrder>[] = [
    {
      key: 'all',
      label: 'All Orders',
      count: purchaseOrders.length,
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
    },
    {
      key: 'pending',
      label: 'Pending',
      count: purchaseOrders.filter(pendingMatcher).length,
      icon: <Clock className="h-3.5 w-3.5" />,
      matcher: pendingMatcher,
    },
    {
      key: 'approved',
      label: 'Approved',
      count: purchaseOrders.filter(approvedMatcher).length,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      matcher: approvedMatcher,
    },
    {
      key: 'draft',
      label: 'Draft',
      count: purchaseOrders.filter((p) => p.status === 'draft').length,
      icon: <FileText className="h-3.5 w-3.5" />,
      matcher: (po) => po.status === 'draft',
    },
    {
      key: 'sent',
      label: 'Sent',
      count: purchaseOrders.filter((p) => p.status === 'sent').length,
      icon: <Truck className="h-3.5 w-3.5" />,
      matcher: (po) => po.status === 'sent',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      count: purchaseOrders.filter(deliveredMatcher).length,
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      matcher: deliveredMatcher,
    },
    {
      key: 'overdue',
      label: 'Overdue',
      count: purchaseOrders.filter(overdueMatcher).length,
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      color: 'rose',
      matcher: overdueMatcher,
    },
  ];

  const filterFields: AdvancedFilterField[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'multi-select',
      options: STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
    },
    {
      id: 'supplier',
      label: 'Supplier',
      type: 'multi-select',
      options: suppliers.map((s) => ({ label: s.name, value: s._id })),
    },
    {
      id: 'totalAmount',
      label: 'Total Amount',
      type: 'number-range',
      min: 0,
      max: 1000000,
      step: 100,
      prefix: 'ETB',
      description: 'Filter by total purchase order amount range',
    },
    {
      id: 'createdAt',
      label: 'Order Date',
      type: 'date-range',
    },
    {
      id: 'expectedDeliveryDate',
      label: 'Expected Delivery Date',
      type: 'date-range',
    },
  ];

  const groupByOptions: GroupByOption<PurchaseOrder>[] = [
    {
      id: 'supplier',
      label: 'By Supplier',
      accessor: (po) => po.supplier?.name || 'No Supplier',
      icon: <Truck className="h-3.5 w-3.5" />,
    },
    {
      id: 'status',
      label: 'By Status',
      accessor: 'status',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    {
      id: 'month',
      label: 'By Month',
      accessor: (po) => format(new Date(po.createdAt), 'MMMM yyyy'),
      icon: <Calendar className="h-3.5 w-3.5" />,
    },
  ];

  const sortOptions: SortOption<PurchaseOrder>[] = [
    { id: 'poNumber', label: 'PO #', field: 'poNumber' },
    { id: 'createdDesc', label: 'Created (Newest)', field: 'createdAt', direction: 'desc' },
    { id: 'createdAsc', label: 'Created (Oldest)', field: 'createdAt', direction: 'asc' },
    { id: 'totalValueDesc', label: 'Total Value (High to Low)', field: 'totalAmount', direction: 'desc' },
    { id: 'expectedDeliveryAsc', label: 'Expected Delivery (Soonest)', field: 'expectedDeliveryDate', direction: 'asc' },
    { id: 'itemsCount', label: 'Items Count', field: 'items.length' },
  ];

  const kanbanColumns: KanbanColumnConfig<PurchaseOrder>[] = [
    {
      id: 'draft',
      title: 'Draft',
      color: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      icon: <FileText className="h-4 w-4" />,
      matcher: (po) => po.status === 'draft',
    },
    {
      id: 'pending',
      title: 'Pending',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Clock className="h-4 w-4" />,
      matcher: (po) => po.status === 'sent',
    },
    {
      id: 'approved',
      title: 'Approved',
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      matcher: (po) => po.status === 'confirmed',
    },
    {
      id: 'delivered',
      title: 'Delivered',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle className="h-4 w-4" />,
      matcher: (po) => po.status === 'partially_received' || po.status === 'received',
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <XCircle className="h-4 w-4" />,
      matcher: (po) => po.status === 'cancelled',
    },
  ];

  const initialPresets: SavedPreset[] = [
    {
      id: 'preset-pending-approvals',
      name: 'Pending Approvals',
      isSystem: true,
      filters: {
        quickFilter: 'pending',
        groupBy: 'supplier',
        viewMode: 'table',
      },
    },
    {
      id: 'preset-overdue-watchlist',
      name: 'Overdue Watchlist',
      isSystem: true,
      filters: {
        quickFilter: 'overdue',
        sortField: 'expectedDeliveryDate',
        sortDirection: 'asc',
        viewMode: 'table',
      },
    },
    {
      id: 'preset-monthly-spend',
      name: 'Monthly Spend',
      isSystem: true,
      filters: {
        quickFilter: 'delivered',
        groupBy: 'month',
        sortField: 'totalAmount',
        sortDirection: 'desc',
        viewMode: 'table',
      },
    },
    {
      id: 'preset-po-receiving-queue',
      name: 'PO Receiving Queue',
      isSystem: true,
      filters: {
        advanced: {
          status: ['sent', 'confirmed', 'partially_received'],
        },
        viewMode: 'grid',
      },
    },
  ];

  const bulkActions: BulkAction<PurchaseOrder>[] = [
    {
      id: 'approve-orders',
      label: 'Approve Orders',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      variant: 'default',
      confirmTitle: 'Approve Selected Orders?',
      confirmMessage: 'This will change the status of sent orders to confirmed. Continue?',
      onClick: async (selectedPOs, clearSelection) => {
        const sentPOs = selectedPOs.filter((po) => po.status === 'sent');
        if (sentPOs.length === 0) {
          toast.error('No eligible orders', { description: 'Only Sent status orders can be approved' });
          return;
        }
        let successCount = 0;
        for (const po of sentPOs) {
          try {
            await updateMutation.mutateAsync({
              poId: po._id,
              data: { status: 'confirmed' } as any,
            });
            successCount++;
          } catch {
            // continue
          }
        }
        refetch();
        toast.success(`Approved ${successCount} order(s)`, {
          description: `${successCount} of ${sentPOs.length} sent orders were approved`,
        });
        clearSelection();
      },
    },
    {
      id: 'export-accounting',
      label: 'Export for Accounting',
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedPOs, clearSelection) => {
        const headers = 'PO #,Supplier,Total,Status,Date';
        const rows = selectedPOs.map((po) =>
          [
            po.poNumber,
            po.supplier?.name || '',
            (po.totalAmount || 0).toFixed(2),
            po.status,
            po.createdAt ? format(new Date(po.createdAt), 'yyyy-MM-dd') : '',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Accounting_PO_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Accounting export downloaded', {
          description: `${selectedPOs.length} POs exported for accounting`,
        });
        clearSelection();
      },
    },
    {
      id: 'export-po',
      label: 'Export Purchase Orders',
      icon: <Download className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedPOs, clearSelection) => {
        const headers = 'PO #,Supplier,Supplier Phone,Items Count,Subtotal,Tax,Total,Status,Order Date,Expected Delivery,Notes';
        const rows = selectedPOs.map((po) =>
          [
            po.poNumber,
            po.supplier?.name || '',
            po.supplier?.phone || '',
            po.items?.length || 0,
            (po.subtotal || 0).toFixed(2),
            (po.taxAmount || 0).toFixed(2),
            (po.totalAmount || 0).toFixed(2),
            po.status,
            po.createdAt ? format(new Date(po.createdAt), 'yyyy-MM-dd') : '',
            po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'yyyy-MM-dd') : '',
            po.notes || '',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PurchaseOrders_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Purchase orders exported', {
          description: `${selectedPOs.length} POs exported to CSV`,
        });
        clearSelection();
      },
    },
    {
      id: 'clone-orders',
      label: 'Clone Orders',
      icon: <Copy className="h-3.5 w-3.5" />,
      variant: 'outline',
      onClick: (selectedPOs, clearSelection) => {
        toast.success('Clone action (demo)', {
          description: `${selectedPOs.length} POs would be cloned in production`,
        });
        clearSelection();
      },
    },
  ];

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      id: 'poNumber',
      header: 'PO #',
      sortable: true,
      accessorKey: 'poNumber',
      cell: (po) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white">
              {po.poNumber}
            </p>
            <p className="text-[10px] text-slate-500">
              {format(new Date(po.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'supplier',
      header: 'Supplier',
      sortable: true,
      cell: (po) => (
        <div>
          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {po.supplier?.name || '—'}
          </p>
          {po.supplier?.phone && (
            <p className="text-[10px] text-slate-500 font-mono">{po.supplier.phone}</p>
          )}
        </div>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: (po) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {po.items?.length || 0} line item{po.items?.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Total Value',
      sortable: true,
      cell: (po) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ETB {(po.totalAmount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'expectedDeliveryDate',
      header: 'Expected Delivery',
      sortable: true,
      cell: (po) => {
        const overdue = isOverdue(po);
        return (
          <div className={`text-xs flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
            <Calendar className={`h-3.5 w-3.5 shrink-0 ${overdue ? 'text-rose-500' : 'text-slate-400'}`} />
            <span className="flex items-center gap-1">
              {po.expectedDeliveryDate
                ? format(new Date(po.expectedDeliveryDate), 'MMM d, yyyy')
                : '—'}
              {overdue && <AlertCircle className="h-3 w-3" />}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (po) => {
        const overdue = isOverdue(po);
        return (
          <div className="flex items-center gap-1.5">
            {getStatusBadge(po.status)}
            {overdue && (
              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[9px] font-bold">
                Overdue
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (po) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 rounded-xl"
            onClick={() => {
              setViewingPO(po);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </Button>

          {(po.status === 'sent' || po.status === 'confirmed' || po.status === 'partially_received') && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => openReceiveDialog(po)}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Receive</span>
            </Button>
          )}

          {po.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 rounded-xl"
              onClick={() => openEditPO(po)}
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => {
              setDeletingPoId(po._id);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const renderCustomCard = (po: PurchaseOrder, isSelected: boolean, onSelect: (checked: boolean) => void) => {
    const overdue = isOverdue(po);
    return (
      <div
        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="absolute top-3 right-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>

        <div className="flex items-start gap-3 mb-3 pr-10">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {po.poNumber}
              </p>
              {getStatusBadge(po.status)}
              {overdue && (
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[9px] font-bold">
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(po.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
              {po.supplier?.name || '—'}
            </p>
            {po.supplier?.phone && (
              <p className="text-[11px] text-slate-500 font-mono">{po.supplier.phone}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <Badge variant="outline" className="font-mono text-[10px]">
              {po.items?.length || 0} item{po.items?.length !== 1 ? 's' : ''}
            </Badge>
            <div className={`text-xs flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
              <Clock className={`h-3 w-3 ${overdue ? 'text-rose-500' : ''}`} />
              <span>
                {po.expectedDeliveryDate
                  ? format(new Date(po.expectedDeliveryDate), 'MMM d')
                  : 'No date'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              ETB {(po.totalAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {(po.status === 'sent' || po.status === 'confirmed' || po.status === 'partially_received') && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-[10px] gap-1 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => openReceiveDialog(po)}
              >
                <Truck className="h-3 w-3" />
                Receive
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => {
                setViewingPO(po);
                setIsViewDialogOpen(true);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {po.status === 'draft' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => openEditPO(po)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => {
                setDeletingPoId(po._id);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomListItem = (po: PurchaseOrder, isSelected: boolean, onSelect: (checked: boolean) => void) => {
    const overdue = isOverdue(po);
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
        onClick={(e) => {
          setViewingPO(po);
          setIsViewDialogOpen(true);
        }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>

        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono text-xs font-bold">
          <Package className="h-4 w-4" />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">
            {po.poNumber}
          </span>
          {getStatusBadge(po.status)}
          {overdue && (
            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[9px] font-bold whitespace-nowrap">
              Overdue
            </Badge>
          )}
        </div>

        <div className="hidden md:block min-w-0 flex-1">
          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
            {po.supplier?.name || '—'}
          </p>
        </div>

        <div className="hidden sm:block text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
          {po.items?.length || 0} item{po.items?.length !== 1 ? 's' : ''}
        </div>

        <div className="hidden lg:block font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
          ETB {(po.totalAmount || 0).toFixed(2)}
        </div>

        <div className={`hidden md:flex items-center gap-1 text-xs whitespace-nowrap ${overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
          <Calendar className={`h-3.5 w-3.5 ${overdue ? 'text-rose-500' : 'text-slate-400'}`} />
          <span>
            {po.expectedDeliveryDate
              ? format(new Date(po.expectedDeliveryDate), 'MMM d, yyyy')
              : '—'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          {(po.status === 'sent' || po.status === 'confirmed' || po.status === 'partially_received') && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-[10px] gap-1 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => openReceiveDialog(po)}
            >
              <Truck className="h-3 w-3" />
              Receive
            </Button>
          )}
          {po.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 rounded-lg"
              onClick={() => openEditPO(po)}
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => {
              setViewingPO(po);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => {
              setDeletingPoId(po._id);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage supplier procurement, line-item restocking, and incoming goods verification"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total POs"
            value={isLoading ? '...' : stats.total}
            icon={<ShoppingBag className="h-5 w-5" />}
            theme="primary"
            subtitle="All recorded purchase orders"
            isLoading={isLoading}
          />

          <DataCard
            title="Pending Deliveries"
            value={isLoading ? '...' : stats.pending}
            icon={<Truck className="h-5 w-5" />}
            theme="amber"
            subtitle="En route or awaiting arrival"
            isLoading={isLoading}
          />

          <DataCard
            title="Fully Received"
            value={isLoading ? '...' : stats.receivedThisPeriod}
            icon={<CheckCircle className="h-5 w-5" />}
            theme="emerald"
            subtitle="Goods verified in inventory"
            isLoading={isLoading}
          />

          <DataCard
            title="Total Procurement"
            value={isLoading ? '...' : `ETB ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme="purple"
            subtitle="Gross supply inventory expense"
            isLoading={isLoading}
          />
        </div>

        <DataViewSystem<PurchaseOrder>
          data={purchaseOrders}
          rowKey="_id"
          entityName="Purchase Orders"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<ShoppingBag className="h-8 w-8 text-slate-400" />}
          emptyTitle="No purchase orders found"
          emptyDescription="Create your first purchase order to reorder inventory supplies."
          emptyActionLabel="New Purchase Order"
          onEmptyAction={() => {
            resetPoForm();
            setIsCreateDialogOpen(true);
          }}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search PO #, supplier name, phone, notes..."
          searchFields={['poNumber', 'supplier.name', 'supplier.phone', 'notes']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="createdAt"
          defaultSortDirection="desc"
          presetStorageKey="purchaseOrders"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          onItemClick={(po) => {
            setViewingPO(po);
            setIsViewDialogOpen(true);
          }}
          renderCustomCard={renderCustomCard}
          renderCustomListItem={renderCustomListItem}
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="status"
          exportFileName="PurchaseOrders"
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          primaryAction={{
            label: 'New Purchase Order',
            icon: <Plus className="h-4 w-4 stroke-[2.5]" />,
            onClick: () => {
              resetPoForm();
              setIsCreateDialogOpen(true);
            },
          }}
        />
      </div>

      {/* Create Purchase Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Purchase Order</DialogTitle>
            <DialogDescription className="text-xs">
              Generate a restock purchase order and allocate supplies to a vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="supplier" className="text-xs font-semibold">Supplier *</Label>
                <Select
                  value={poForm.supplier}
                  onValueChange={(val) => setPoForm((prev) => ({ ...prev, supplier: val }))}
                >
                  <SelectTrigger id="supplier" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s._id} value={s._id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                <Select
                  value={poForm.status}
                  onValueChange={(val) =>
                    setPoForm((prev) => ({ ...prev, status: val as POStatus }))
                  }
                >
                  <SelectTrigger id="status" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="expectedDeliveryDate" className="text-xs font-semibold">Expected Delivery Date</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) =>
                    setPoForm((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))
                  }
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxAmount" className="text-xs font-semibold">Tax / Freight (ETB)</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={poForm.taxAmount}
                  onChange={(e) =>
                    setPoForm((prev) => ({
                      ...prev,
                      taxAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold">Notes / Vendor Instructions</Label>
              <Textarea
                id="notes"
                placeholder="Add special delivery instructions or references..."
                value={poForm.notes}
                onChange={(e) => setPoForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Line Items</Label>
                <Button variant="outline" size="sm" onClick={addFormItem} className="gap-1 h-7 text-xs rounded-lg font-bold">
                  <Plus className="h-3 w-3" />
                  Add Ingredient Item
                </Button>
              </div>

              {poForm.items.length === 0 ? (
                <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground text-xs">
                  No items added. Click "Add Ingredient Item" to specify quantities and prices.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {poForm.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <div className="col-span-4 space-y-1">
                        <Label className="text-[11px] font-semibold">Ingredient {idx + 1}</Label>
                        <Select
                          value={item.ingredient}
                          onValueChange={(val) => updateFormItem(item.id, 'ingredient', val)}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Select ingredient" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing._id} value={ing._id} className="text-xs">
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[11px] font-semibold">Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateFormItem(item.id, 'quantity', e.target.value)}
                          className="h-8 text-xs rounded-lg bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[11px] font-semibold">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateFormItem(item.id, 'unitPrice', e.target.value)}
                          className="h-8 text-xs rounded-lg bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold">Total</Label>
                        <div className="h-8 px-2.5 flex items-center rounded-lg border bg-white/60 dark:bg-slate-950 text-xs font-mono font-bold">
                          ETB {item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFormItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">ETB {subtotalCalc.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax & Fees:</span>
                <span className="font-mono font-semibold">ETB {(poForm.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t text-slate-900 dark:text-white">
                <span>Total PO Amount:</span>
                <span className="font-mono">ETB {totalCalc.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetPoForm();
                setIsCreateDialogOpen(false);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePO}
              disabled={createMutation.isPending}
              className="rounded-xl font-bold"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Purchase Order</DialogTitle>
            <DialogDescription className="text-xs">
              Update purchase order details and line items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-supplier" className="text-xs font-semibold">Supplier</Label>
                <Select
                  value={poForm.supplier}
                  onValueChange={(val) => setPoForm((prev) => ({ ...prev, supplier: val }))}
                >
                  <SelectTrigger id="edit-supplier" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s._id} value={s._id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-semibold">Status</Label>
                <Select
                  value={poForm.status}
                  onValueChange={(val) =>
                    setPoForm((prev) => ({ ...prev, status: val as POStatus }))
                  }
                >
                  <SelectTrigger id="edit-status" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-expectedDeliveryDate" className="text-xs font-semibold">Expected Delivery Date</Label>
                <Input
                  id="edit-expectedDeliveryDate"
                  type="date"
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) =>
                    setPoForm((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))
                  }
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-taxAmount" className="text-xs font-semibold">Tax Amount</Label>
                <Input
                  id="edit-taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={poForm.taxAmount}
                  onChange={(e) =>
                    setPoForm((prev) => ({
                      ...prev,
                      taxAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-notes" className="text-xs font-semibold">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add notes..."
                value={poForm.notes}
                onChange={(e) => setPoForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Items</Label>
                <Button variant="outline" size="sm" onClick={addFormItem} className="gap-1 h-7 text-xs rounded-lg font-bold">
                  <Plus className="h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {poForm.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold">Ingredient {idx + 1}</Label>
                      <Select
                        value={item.ingredient}
                        onValueChange={(val) => updateFormItem(item.id, 'ingredient', val)}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg bg-white dark:bg-slate-950">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing._id} value={ing._id} className="text-xs">
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold">Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(item.id, 'quantity', e.target.value)}
                        className="h-8 text-xs rounded-lg bg-white dark:bg-slate-950"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateFormItem(item.id, 'unitPrice', e.target.value)}
                        className="h-8 text-xs rounded-lg bg-white dark:bg-slate-950"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold">Total</Label>
                      <div className="h-8 px-2.5 flex items-center rounded-lg border bg-white/60 dark:bg-slate-950 text-xs font-mono font-bold">
                        ETB {item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFormItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">ETB {subtotalCalc.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax:</span>
                <span className="font-mono font-semibold">ETB {(poForm.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t text-slate-900 dark:text-white">
                <span>Total:</span>
                <span className="font-mono">ETB {totalCalc.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPO(null);
                resetPoForm();
                setIsEditDialogOpen(false);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdatePO}
              disabled={updateMutation.isPending}
              className="rounded-xl font-bold"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Purchase Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Purchase Order Summary</DialogTitle>
            <DialogDescription className="text-xs">
              {viewingPO?.poNumber} — {viewingPO?.supplier?.name}
            </DialogDescription>
          </DialogHeader>
          {viewingPO && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Status</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {getStatusBadge(viewingPO.status)}
                    {isOverdue(viewingPO) && (
                      <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[9px] font-bold">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Created Date</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {format(new Date(viewingPO.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Expected Delivery</p>
                  <p className={`font-semibold mt-0.5 ${isOverdue(viewingPO) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    {viewingPO.expectedDeliveryDate
                      ? format(new Date(viewingPO.expectedDeliveryDate), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Amount</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    ETB {viewingPO.totalAmount?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Order Line Items</p>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow>
                        <TableHead className="text-xs">Ingredient</TableHead>
                        <TableHead className="text-xs text-right">Quantity</TableHead>
                        <TableHead className="text-xs text-right">Unit Price</TableHead>
                        <TableHead className="text-xs text-right">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPO.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-semibold">{item.ingredient.name}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{item.quantity} {item.ingredient.unit}</TableCell>
                          <TableCell className="text-xs text-right font-mono">ETB {item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right font-mono font-bold">ETB {item.totalPrice?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {viewingPO.notes && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl">
                  <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-0.5">Notes</p>
                  <p>{viewingPO.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)} className="rounded-xl">
              Close
            </Button>
            {(viewingPO?.status === 'sent' || viewingPO?.status === 'confirmed' || viewingPO?.status === 'partially_received') && (
              <Button
                size="sm"
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  if (viewingPO) openReceiveDialog(viewingPO);
                }}
              >
                <Truck className="h-4 w-4 mr-1.5" />
                Receive Goods
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Goods Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Receive Goods & Verify Stock</DialogTitle>
            <DialogDescription className="text-xs">
              {receivingPO?.poNumber} from {receivingPO?.supplier?.name}
            </DialogDescription>
          </DialogHeader>
          {receivingPO && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">PO Identifier</p>
                  <p className="font-bold text-slate-900 dark:text-white">{receivingPO.poNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Supplier Vendor</p>
                  <p className="font-bold text-slate-900 dark:text-white">{receivingPO.supplier?.name}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-xs font-bold">Received Quantities</Label>
                <div className="space-y-2">
                  {receivingPO.items?.map((item) => (
                    <div key={item.ingredient._id} className="grid grid-cols-12 gap-3 items-center border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-950">
                      <div className="col-span-5">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{item.ingredient.name}</p>
                        <p className="text-[11px] text-slate-500">Unit: {item.ingredient.unit}</p>
                      </div>
                      <div className="col-span-3 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Ordered</p>
                        <p className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{item.quantity}</p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Delivered Qty</p>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          step="any"
                          value={receivedQtys[item.ingredient._id] ?? item.quantity}
                          onChange={(e) =>
                            setReceivedQtys((prev) => ({
                              ...prev,
                              [item.ingredient._id]: Math.min(
                                parseFloat(e.target.value) || 0,
                                item.quantity
                              ),
                            }))
                          }
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReceivingPO(null);
                setReceivedQtys({});
                setIsReceiveDialogOpen(false);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReceiveGoods}
              disabled={receiveMutation.isPending}
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              {receiveMutation.isPending ? 'Receiving...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently remove this purchase order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold"
              onClick={handleDeletePO}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseOrdersPage;
