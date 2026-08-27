import React, { useState, useMemo } from 'react';
import {
  useGetSuppliersList,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  type Supplier,
  type SupplierCreateRequest,
} from '@/api/Queries/supplierQueries';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Factory,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileSpreadsheet,
  Download,
  UserX,
  Award,
  CreditCard,
  Users,
} from 'lucide-react';
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

const paymentTermsOptions = [
  { value: 'cash', label: 'Cash on Delivery' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
] as const;

const emptySupplierForm: SupplierCreateRequest = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: {
    street: '',
    city: '',
    zipCode: '',
  },
  paymentTerms: 'cash',
  leadTime: 0,
  rating: 1,
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
};

const SuppliersPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierCreateRequest & { isActive: boolean }>({
    ...emptySupplierForm,
    isActive: true,
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading, error } = useGetSuppliersList();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const suppliers: Supplier[] = data?.data?.suppliers || [];

  const handleToggleActive = async (supplier: Supplier) => {
    setProcessingId(supplier._id);
    try {
      await updateSupplier.mutateAsync({
        supplierId: supplier._id,
        data: { isActive: !supplier.isActive },
      });
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update supplier status');
    } finally {
      setProcessingId(null);
    }
  };

  const isProcessing = (id: string) => processingId === id;

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.isActive).length;
    const inactive = total - active;
    const totalRating = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0);
    const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '0.0';
    return { total, active, inactive, avgRating };
  }, [suppliers]);

  const topPerformersCount = useMemo(
    () => suppliers.filter((s) => (s.rating || 0) >= 4).length,
    [suppliers]
  );
  const paymentDueCount = useMemo(
    () => suppliers.filter((s) => s.paymentTerms !== 'cash' && s.isActive).length,
    [suppliers]
  );

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setFormData({ ...emptySupplierForm, isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: {
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        zipCode: supplier.address?.zipCode || '',
      },
      paymentTerms: supplier.paymentTerms,
      leadTime: supplier.leadTime || 0,
      rating: supplier.rating || 1,
      isActive: supplier.isActive,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.contactPerson || !formData.phone || !formData.email) {
        toast.error('Please fill in all required fields.');
        return;
      }

      const { isActive, ...submitData } = formData;

      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          supplierId: editingSupplier._id,
          data: { ...submitData, isActive },
        });
        toast.success(`${formData.name} has been updated successfully.`);
      } else {
        await createSupplier.mutateAsync({ ...submitData, isActive } as any);
        toast.success(`${formData.name} has been added to your suppliers.`);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save supplier. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplier.mutateAsync(deletingSupplier._id);
      toast.success(`${deletingSupplier.name} has been removed.`);
      setIsDeleteDialogOpen(false);
      setDeletingSupplier(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete supplier. Please try again.');
    }
  };

  const getPaymentTermsLabel = (terms: string) => {
    const option = paymentTermsOptions.find((o) => o.value === terms);
    return option ? option.label : terms;
  };

  const getRatingGroup = (rating: number) => {
    if (rating >= 4) return 'HIGH';
    if (rating === 3) return 'MEDIUM';
    return 'LOW';
  };

  const columns: ColumnDef<Supplier>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Supplier / Vendor',
        sortable: true,
        accessorKey: 'name',
        cell: (supplier) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Factory className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">
                {supplier.name}
              </p>
              <p className="text-[10px] text-slate-500">Contact: {supplier.contactPerson}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'contact',
        header: 'Contact Info',
        cell: (supplier) => (
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              {supplier.phone || '—'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
              {supplier.email || '—'}
            </div>
          </div>
        ),
      },
      {
        id: 'city',
        header: 'City / Location',
        sortable: true,
        cell: (supplier) => (
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{supplier.address?.city || '—'}</span>
          </div>
        ),
      },
      {
        id: 'paymentTerms',
        header: 'Payment Terms',
        sortable: true,
        cell: (supplier) => (
          <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 dark:bg-slate-800/60">
            {getPaymentTermsLabel(supplier.paymentTerms)}
          </Badge>
        ),
      },
      {
        id: 'leadTime',
        header: 'Lead Time',
        sortable: true,
        cell: (supplier) => (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            {supplier.leadTime || 0} days
          </span>
        ),
      },
      {
        id: 'rating',
        header: 'Vendor Rating',
        sortable: true,
        cell: (supplier) => (
          <div className="flex items-center gap-1.5">
            <StarRating rating={supplier.rating || 0} />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {supplier.rating || 0}.0
            </span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: (supplier) => (
          <Badge
            className={
              supplier.isActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold'
                : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 text-[10px] font-bold'
            }
          >
            {supplier.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (supplier) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
              onClick={() => openEditDialog(supplier)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => openDeleteDialog(supplier)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const quickFilters: QuickFilterOption<Supplier>[] = useMemo(
    () => [
      {
        key: 'all',
        label: 'All',
        count: stats.total,
        icon: <Users className="h-3.5 w-3.5" />,
        matcher: () => true,
      },
      {
        key: 'active',
        label: 'Active',
        count: stats.active,
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
        matcher: (s: Supplier) => s.isActive,
      },
      {
        key: 'inactive',
        label: 'Inactive',
        count: stats.inactive,
        icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
        matcher: (s: Supplier) => !s.isActive,
      },
      {
        key: 'top_performers',
        label: 'Top Performers',
        count: topPerformersCount,
        icon: <Award className="h-3.5 w-3.5 text-amber-500" />,
        matcher: (s: Supplier) => (s.rating || 0) >= 4,
      },
      {
        key: 'payment_due',
        label: 'Payment Due',
        count: paymentDueCount,
        icon: <CreditCard className="h-3.5 w-3.5 text-indigo-500" />,
        matcher: (s: Supplier) => s.paymentTerms !== 'cash' && s.isActive,
      },
    ],
    [stats.total, stats.active, stats.inactive, topPerformersCount, paymentDueCount]
  );

  const filterFields: AdvancedFilterField[] = useMemo(
    () => [
      {
        id: 'paymentTerms',
        label: 'Payment Terms',
        type: 'multi-select',
        options: paymentTermsOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
        })),
      },
      {
        id: 'rating',
        label: 'Rating Range',
        type: 'number-range',
        min: 1,
        max: 5,
        step: 1,
        description: 'Filter by vendor rating (1-5)',
      },
      {
        id: 'leadTime',
        label: 'Lead Time (Days)',
        type: 'number-range',
        min: 0,
        max: 60,
        step: 1,
        description: 'Filter by delivery lead time in days',
      },
      {
        id: 'city',
        label: 'City',
        type: 'text',
        placeholder: 'Search city...',
        description: 'Filter by supplier city location',
      },
      {
        id: 'isActive',
        label: 'Active Status',
        type: 'status-pills',
        options: [
          { label: 'Active', value: 'active', color: 'emerald' },
          { label: 'Inactive', value: 'inactive', color: 'rose' },
        ],
      },
    ],
    []
  );

  const groupByOptions: GroupByOption<Supplier>[] = useMemo(
    () => [
      {
        id: 'paymentTerms',
        label: 'By Payment Terms',
        icon: <CreditCard className="h-4 w-4" />,
        accessor: (s) => getPaymentTermsLabel(s.paymentTerms).toUpperCase(),
      },
      {
        id: 'rating',
        label: 'By Rating',
        icon: <Star className="h-4 w-4" />,
        accessor: (s) => `${getRatingGroup(s.rating || 0)} PERFORMERS`,
      },
      {
        id: 'city',
        label: 'By City',
        icon: <MapPin className="h-4 w-4" />,
        accessor: (s) => (s.address?.city || 'UNKNOWN CITY').toUpperCase(),
      },
      {
        id: 'isActive',
        label: 'By Active Status',
        icon: <CheckCircle2 className="h-4 w-4" />,
        accessor: (s) => (s.isActive ? 'ACTIVE SUPPLIERS' : 'INACTIVE SUPPLIERS'),
      },
    ],
    []
  );

  const sortOptions: SortOption<Supplier>[] = useMemo(
    () => [
      { id: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
      { id: 'name_desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
      { id: 'rating_desc', label: 'Rating (Highest)', field: 'rating', direction: 'desc' },
      { id: 'leadTime_asc', label: 'Lead Time (Fastest)', field: 'leadTime', direction: 'asc' },
      { id: 'created_desc', label: 'Created (Newest)', field: 'createdAt', direction: 'desc' },
      { id: 'active_status', label: 'Active Status', field: 'isActive', direction: 'desc' },
    ],
    []
  );

  const kanbanColumns: KanbanColumnConfig<Supplier>[] = useMemo(
    () => [
      {
        id: 'low',
        title: 'Low Performers',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <Star className="h-4 w-4 text-amber-600" />,
        matcher: (s: Supplier) => (s.rating || 0) <= 2,
      },
      {
        id: 'medium',
        title: 'Medium Performers',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        icon: <Star className="h-4 w-4 text-indigo-600" />,
        matcher: (s: Supplier) => (s.rating || 0) === 3,
      },
      {
        id: 'high',
        title: 'Top Performers',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <Award className="h-4 w-4 text-emerald-600" />,
        matcher: (s: Supplier) => (s.rating || 0) >= 4,
      },
    ],
    []
  );

  const initialPresets: SavedPreset[] = useMemo(
    () => [
      {
        id: 'preset-active-vendors',
        name: 'Active Vendor List',
        isSystem: true,
        filters: {
          quickFilter: 'active',
          advanced: {},
          groupBy: 'city',
          viewMode: 'table',
          sortField: 'name',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-top-performers',
        name: 'Top Performers',
        isSystem: true,
        filters: {
          quickFilter: 'top_performers',
          advanced: {},
          groupBy: null,
          viewMode: 'grid',
          sortField: 'rating',
          sortDirection: 'desc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-short-lead',
        name: 'Short Lead Times',
        isSystem: true,
        filters: {
          quickFilter: 'all',
          advanced: { leadTime: { max: 3 } },
          groupBy: null,
          viewMode: 'list',
          sortField: 'leadTime',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
      {
        id: 'preset-payment-terms',
        name: 'Payment Terms Report',
        isSystem: true,
        filters: {
          quickFilter: 'all',
          advanced: {},
          groupBy: 'paymentTerms',
          viewMode: 'table',
          sortField: 'name',
          sortDirection: 'asc',
          density: 'comfortable',
        },
      },
    ],
    []
  );

  const bulkActions: BulkAction<Supplier>[] = useMemo(
    () => [
      {
        id: 'send_rfq',
        label: 'Send RFQ',
        icon: <Send className="h-4 w-4 text-primary" />,
        variant: 'default',
        onClick: (selected, clearSelection) => {
          toast.success(`Sent RFQ to ${selected.length} vendors.`);
          clearSelection();
        },
      },
      {
        id: 'update_payment_terms',
        label: 'Update Payment Terms',
        icon: <CreditCard className="h-4 w-4 text-indigo-600" />,
        variant: 'secondary',
        onClick: (selected, clearSelection) => {
          toast.info(`Bulk payment terms update for ${selected.length} vendor(s) - feature coming soon.`);
          clearSelection();
        },
      },
      {
        id: 'export_csv',
        label: 'Export Vendor List CSV',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline',
        onClick: (selected, clearSelection) => {
          const rows = selected.map((s) => ({
            ID: s._id,
            Name: s.name,
            Contact: s.contactPerson,
            Phone: s.phone,
            Email: s.email,
            City: s.address?.city || '',
            PaymentTerms: getPaymentTermsLabel(s.paymentTerms),
            LeadTime: s.leadTime || 0,
            Rating: s.rating || 0,
            Status: s.isActive ? 'Active' : 'Inactive',
          }));
          const csvHeader = Object.keys(rows[0] || {}).join(',');
          const csvBody = rows
            .map((row) =>
              Object.values(row)
                .map((val) => `"${String(val).replace(/"/g, '""')}"`)
                .join(',')
            )
            .join('\n');
          const blob = new Blob([`${csvHeader}\n${csvBody}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `suppliers_export_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${selected.length} vendors to CSV.`);
          clearSelection();
        },
      },
      {
        id: 'deactivate',
        label: 'Deactivate Suppliers',
        icon: <UserX className="h-4 w-4 text-rose-600" />,
        variant: 'outline',
        onClick: async (selected, clearSelection) => {
          try {
            for (const s of selected) {
              if (s.isActive) {
                await updateSupplier.mutateAsync({
                  supplierId: s._id,
                  data: { isActive: false },
                });
              }
            }
            toast.success(`Deactivated ${selected.filter((s) => s.isActive).length} supplier(s).`);
          } catch (err: any) {
            toast.error(err?.message || 'Failed to deactivate suppliers');
          }
          clearSelection();
        },
      },
    ],
    []
  );

  const renderCustomCard = (
    supplier: Supplier,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    return (
      <div
        className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md bg-white dark:bg-slate-900 ${
          isSelected
            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
        </div>

        <div className="flex items-start gap-3 mb-3 pr-8">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Factory className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {supplier.name}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {supplier.contactPerson}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-1.5 text-xs mb-3">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="font-mono text-slate-600 dark:text-slate-300">{supplier.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 truncate">{supplier.email || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-3">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{supplier.address?.city || '—'}</span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <StarRating rating={supplier.rating || 0} size={12} />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                {supplier.rating || 0}.0
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] font-medium bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0 h-5">
              {getPaymentTermsLabel(supplier.paymentTerms)}
            </Badge>
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {supplier.leadTime || 0}d
            </span>
          </div>
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={supplier.isActive}
              disabled={isProcessing(supplier._id)}
              onCheckedChange={() => handleToggleActive(supplier)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              onClick={() => openEditDialog(supplier)}
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-rose-400 hover:text-rose-600"
              onClick={() => openDeleteDialog(supplier)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomListItem = (
    supplier: Supplier,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    return (
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Factory className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {supplier.name}
              </span>
              <span className="text-[10px] text-slate-500 shrink-0">
                {supplier.contactPerson}
              </span>
              <StarRating rating={supplier.rating || 0} size={10} />
              <Badge variant="outline" className="text-[9px] font-medium bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0 h-4">
                {getPaymentTermsLabel(supplier.paymentTerms)}
              </Badge>
              <Badge
                className={
                  supplier.isActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-bold'
                    : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 text-[9px] font-bold'
                }
              >
                {supplier.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              {supplier.phone && <span className="font-mono">{supplier.phone}</span>}
              {supplier.email && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="truncate">{supplier.email}</span>
                </>
              )}
              {supplier.address?.city && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {supplier.address.city}
                  </span>
                </>
              )}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {supplier.leadTime || 0}d
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
            onClick={() => openEditDialog(supplier)}
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-rose-400 hover:text-rose-600"
            onClick={() => openDeleteDialog(supplier)}
            title="Delete"
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
        title="Suppliers & Vendors"
        subtitle="Manage supply network, vendor contacts, terms, and purchase fulfillment reliability"
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Total Suppliers"
            value={isLoading ? '...' : stats.total}
            icon={<Factory className="h-5 w-5" />}
            theme="primary"
            subtitle="Registered external suppliers"
            isLoading={isLoading}
          />

          <DataCard
            title="Active Partnerships"
            value={isLoading ? '...' : stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            theme="emerald"
            subtitle="Suppliers with active contracts"
            isLoading={isLoading}
          />

          <DataCard
            title="Inactive"
            value={isLoading ? '...' : stats.inactive}
            icon={<XCircle className="h-5 w-5" />}
            theme="slate"
            subtitle="Disabled or archived vendors"
            isLoading={isLoading}
          />

          <DataCard
            title="Average Vendor Rating"
            value={isLoading ? '...' : `${stats.avgRating} / 5.0`}
            icon={<Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
            theme="amber"
            subtitle="Overall vendor reliability index"
            isLoading={isLoading}
          />
        </div>

        <DataViewSystem<Supplier>
          data={suppliers}
          rowKey="_id"
          entityName="Suppliers"
          columns={columns}
          isLoading={isLoading}
          loadingRowsCount={8}
          emptyIcon={<Factory className="h-8 w-8 text-slate-400" />}
          emptyTitle="No suppliers found"
          emptyDescription="No suppliers match the current filter or search criteria. Add your first vendor supplier to manage stock sourcing."
          emptyActionLabel="Add Supplier"
          onEmptyAction={openCreateDialog}
          supportedViewModes={['table', 'grid', 'kanban', 'list']}
          defaultViewMode="table"
          searchable={true}
          searchPlaceholder="Search suppliers by name, contact, phone, email, city..."
          searchFields={['name', 'contactPerson', 'phone', 'email', 'address.city', 'address.street']}
          quickFilters={quickFilters}
          defaultQuickFilter="all"
          filterFields={filterFields}
          groupByOptions={groupByOptions}
          sortOptions={sortOptions}
          defaultSortField="name"
          defaultSortDirection="asc"
          kanbanColumns={kanbanColumns}
          kanbanGroupByField="rating"
          presetStorageKey="suppliers_management_presets"
          initialPresets={initialPresets}
          selectable={true}
          bulkActions={bulkActions}
          renderCustomCard={renderCustomCard}
          renderCustomListItem={renderCustomListItem}
          exportFileName="Suppliers"
          onItemClick={(supplier) => openEditDialog(supplier)}
          primaryAction={{
            label: 'Add Supplier',
            icon: <Plus className="h-4 w-4 stroke-[2.5]" />,
            onClick: openCreateDialog,
          }}
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingSupplier
                ? 'Update supplier information and delivery agreements.'
                : 'Enter the details of the new raw item vendor.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-semibold">Company / Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Fresh Valley Farms"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPerson" className="text-xs font-semibold">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. John Doe"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 91 123 4567"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@freshvalley.com"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">City</Label>
              <Input
                id="city"
                value={formData.address?.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, city: e.target.value },
                  })
                }
                placeholder="Addis Ababa"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="street" className="text-xs font-semibold">Street Address</Label>
              <Input
                id="street"
                value={formData.address?.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, street: e.target.value },
                  })
                }
                placeholder="Bole Sub-city"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentTerms" className="text-xs font-semibold">Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(val: any) => setFormData({ ...formData, paymentTerms: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leadTime" className="text-xs font-semibold">Lead Time (Days)</Label>
              <Input
                id="leadTime"
                type="number"
                value={formData.leadTime}
                onChange={(e) => setFormData({ ...formData, leadTime: Number(e.target.value) })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rating" className="text-xs font-semibold">Quality Rating (1-5)</Label>
              <Select
                value={String(formData.rating)}
                onValueChange={(val) => setFormData({ ...formData, rating: Number(val) })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={String(num)} className="text-xs">
                      {num} Star{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Vendor</p>
                <p className="text-[11px] text-slate-500">Enable purchasing from this supplier</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createSupplier.isPending || updateSupplier.isPending}
              className="rounded-xl font-bold"
            >
              {createSupplier.isPending || updateSupplier.isPending
                ? 'Saving...'
                : editingSupplier
                ? 'Update Supplier'
                : 'Create Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Supplier?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove <b className="text-slate-900 dark:text-white">{deletingSupplier?.name}</b>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold"
              onClick={handleDelete}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuppliersPage;
