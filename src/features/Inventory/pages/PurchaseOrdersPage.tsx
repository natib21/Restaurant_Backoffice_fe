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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Search,
  Filter,
  ChevronDown,
  Send,
  Inbox,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type POStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

const STATUS_FILTERS: Array<{ value: string | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_OPTIONS: Array<{ value: POStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

const getStatusBadgeClass = (status: POStatus): string => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'confirmed':
      return 'bg-indigo-100 text-indigo-800';
    case 'partially_received':
      return 'bg-yellow-100 text-yellow-800';
    case 'received':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

interface POFormItem {
  id: string;
  ingredient: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const PurchaseOrdersPage: React.FC = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  const [poForm, setPoForm] = useState({
    supplier: '',
    status: 'draft' as POStatus,
    expectedDeliveryDate: '',
    notes: '',
    taxAmount: 0,
    items: [] as POFormItem[],
  });

  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const listParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [statusFilter]);

  const { data: posData, isLoading, error, refetch } = useGetPurchaseOrdersList(listParams);
  const { data: suppliersData } = useGetSuppliersList();
  const { data: ingredientsData } = useGetIngredientsList();

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();
  const receiveMutation = useReceiveGoodsForPO();

  const purchaseOrders: PurchaseOrder[] = posData?.data?.purchaseOrders || [];
  const suppliers = suppliersData?.data?.suppliers || [];
  const ingredients = ingredientsData?.data?.ingredients || [];

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab =
        activeTab === 'all' ? true : po.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [purchaseOrders, searchQuery, activeTab]);

  const stats = useMemo(() => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter(
      (po) => po.status === 'sent' || po.status === 'confirmed'
    ).length;
    const now = new Date();
    const receivedThisPeriod = purchaseOrders.filter((po) => {
      if (po.status !== 'received') return false;
      const received = new Date(po.actualDeliveryDate || po.updatedAt);
      return (
        received.getMonth() === now.getMonth() &&
        received.getFullYear() === now.getFullYear()
      );
    }).length;
    const totalValue = purchaseOrders.reduce(
      (sum, po) => sum + (po.totalAmount || 0),
      0
    );
    return { total, pending, receivedThisPeriod, totalValue };
  }, [purchaseOrders]);

  const subtotalCalc = useMemo(() => {
    return poForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [poForm.items]);

  const totalCalc = useMemo(() => {
    return subtotalCalc + (poForm.taxAmount || 0);
  }, [subtotalCalc, poForm.taxAmount]);

  const resetPoForm = () => {
    setPoForm({
      supplier: '',
      status: 'draft',
      expectedDeliveryDate: '',
      notes: '',
      taxAmount: 0,
      items: [],
    });
  };

  const addFormItem = () => {
    setPoForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          ingredient: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    }));
  };

  const removeFormItem = (id: string) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateFormItem = (
    id: string,
    field: keyof POFormItem,
    value: string | number
  ) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'ingredient') {
          const ing = ingredients.find((i) => i._id === value);
          if (ing) {
            updated.unitPrice = ing.costPerUnit;
          }
        }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice =
            Number(updated.quantity) * Number(updated.unitPrice);
        }
        if (field === 'quantity' && field === 'quantity') {
          updated[field] = Number(value);
        }
        if (field === 'unitPrice') {
          updated[field] = Number(value);
        }
        updated.quantity = Number(updated.quantity);
        updated.unitPrice = Number(updated.unitPrice);
        updated.totalPrice = updated.quantity * updated.unitPrice;
        return updated;
      }),
    }));
  };

  const handleCreatePO = async () => {
    if (!poForm.supplier) {
      toast({
        title: 'Error',
        description: 'Supplier is required',
        variant: 'destructive',
      });
      return;
    }
    if (poForm.items.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one item is required',
        variant: 'destructive',
      });
      return;
    }
    if (poForm.items.some((item) => !item.ingredient || item.quantity <= 0)) {
      toast({
        title: 'Error',
        description: 'All items must have an ingredient and positive quantity',
        variant: 'destructive',
      });
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
      toast({
        title: 'Success',
        description: 'Purchase order created successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create purchase order',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Supplier is required',
        variant: 'destructive',
      });
      return;
    }
    if (poForm.items.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one item is required',
        variant: 'destructive',
      });
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
      toast({
        title: 'Success',
        description: 'Purchase order updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update purchase order',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePO = async (poId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await deleteMutation.mutateAsync(poId);
      refetch();
      toast({
        title: 'Success',
        description: 'Purchase order deleted successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete purchase order',
        variant: 'destructive',
      });
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

      setReceivingPO(null);
      setReceivedQtys({});
      setIsReceiveDialogOpen(false);
      refetch();
      toast({
        title: 'Success',
        description: 'Goods received and stock updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to receive goods',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Purchase Orders</CardTitle>
            <CardDescription>
              Unable to load purchase order data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage purchase orders, track deliveries, and receive goods into inventory
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order to send to a supplier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={poForm.supplier}
                    onValueChange={(val) =>
                      setPoForm((prev) => ({ ...prev, supplier: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={poForm.status}
                    onValueChange={(val) =>
                      setPoForm((prev) => ({ ...prev, status: val as POStatus }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) =>
                      setPoForm((prev) => ({
                        ...prev,
                        expectedDeliveryDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxAmount">Tax Amount</Label>
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
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for this purchase order..."
                  value={poForm.notes}
                  onChange={(e) =>
                    setPoForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button variant="outline" size="sm" onClick={addFormItem} className="gap-1">
                    <Plus className="h-3 w-3" />
                    Add Item
                  </Button>
                </div>
                {poForm.items.length === 0 ? (
                  <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground text-sm">
                    No items added. Click "Add Item" to start.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {poForm.items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4 space-y-1">
                          <Label className="text-xs">Ingredient {idx + 1}</Label>
                          <Select
                            value={item.ingredient}
                            onValueChange={(val) =>
                              updateFormItem(item.id, 'ingredient', val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ing) => (
                                <SelectItem key={ing._id} value={ing._id}>
                                  {ing.name} ({ing.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateFormItem(item.id, 'quantity', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateFormItem(item.id, 'unitPrice', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">Total</Label>
                          <div className="h-9 px-3 flex items-center rounded-md border bg-muted/40 text-sm font-medium">
                            {formatCurrency(item.totalPrice)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
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
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotalCalc)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">{formatCurrency(poForm.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(totalCalc)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetPoForm();
                  setIsCreateDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePO} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO # or supplier..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.value === null
                  ? purchaseOrders.length
                  : purchaseOrders.filter((po) => po.status === filter.value).length;
              return (
                <Badge
                  key={filter.label}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setActiveTab(filter.value || 'all');
                  }}
                >
                  {filter.label} ({count})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total POs</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.total}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.pending}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received This Period</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.receivedThisPeriod}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : formatCurrency(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                {filteredPOs.length} purchase order{filteredPOs.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="partially_received">Partially Received</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            {(['all', 'draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'] as const).map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue}>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredPOs.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <h3 className="mt-4 text-lg font-medium">No purchase orders found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery || statusFilter
                        ? 'Try adjusting your search or filters'
                        : 'No purchase orders in the system yet. Create one to get started.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO #</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Expected Delivery</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPOs.map((po) => (
                          <TableRow key={po._id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{po.poNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{po.supplier?.name}</p>
                                {po.supplier?.phone && (
                                  <p className="text-xs text-muted-foreground">{po.supplier.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(po.status)}>
                                {po.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{po.items?.length || 0}</TableCell>
                            <TableCell>{formatCurrency(po.subtotal)}</TableCell>
                            <TableCell>{formatCurrency(po.taxAmount)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(po.totalAmount)}</TableCell>
                            <TableCell>
                              {po.expectedDeliveryDate ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {format(new Date(po.expectedDeliveryDate), 'MMM d, yyyy')}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(po.createdAt), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {(po.status === 'sent' || po.status === 'confirmed' || po.status === 'partially_received') && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => {
                                        setViewingPO(po);
                                        setIsViewDialogOpen(true);
                                      }}
                                    >
                                      <Package className="h-3 w-3" />
                                      View
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="gap-1 bg-green-600 hover:bg-green-700"
                                      onClick={() => openReceiveDialog(po)}
                                    >
                                      <Truck className="h-3 w-3" />
                                      Receive
                                    </Button>
                                  </>
                                )}
                                {po.status === 'draft' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => openEditPO(po)}
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeletePO(po._id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>
              Update the purchase order details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Select
                  value={poForm.supplier}
                  onValueChange={(val) =>
                    setPoForm((prev) => ({ ...prev, supplier: val }))
                  }
                >
                  <SelectTrigger id="edit-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={poForm.status}
                  onValueChange={(val) =>
                    setPoForm((prev) => ({ ...prev, status: val as POStatus }))
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expectedDeliveryDate">Expected Delivery Date</Label>
                <Input
                  id="edit-expectedDeliveryDate"
                  type="date"
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) =>
                    setPoForm((prev) => ({
                      ...prev,
                      expectedDeliveryDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-taxAmount">Tax Amount</Label>
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any notes for this purchase order..."
                value={poForm.notes}
                onChange={(e) =>
                  setPoForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button variant="outline" size="sm" onClick={addFormItem} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Item
                </Button>
              </div>
              {poForm.items.length === 0 ? (
                <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground text-sm">
                  No items added. Click "Add Item" to start.
                </div>
              ) : (
                <div className="space-y-2">
                  {poForm.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Ingredient {idx + 1}</Label>
                      <Select
                        value={item.ingredient}
                        onValueChange={(val) =>
                          updateFormItem(item.id, 'ingredient', val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing._id} value={ing._id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          updateFormItem(item.id, 'quantity', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateFormItem(item.id, 'unitPrice', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 px-3 flex items-center rounded-md border bg-muted/40 text-sm font-medium">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
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
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotalCalc)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">{formatCurrency(poForm.taxAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(totalCalc)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingPO(null);
                resetPoForm();
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePO} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {viewingPO?.poNumber} — {viewingPO?.supplier?.name}
            </DialogDescription>
          </DialogHeader>
          {viewingPO && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Status</p>
                  <Badge className={getStatusBadgeClass(viewingPO.status)}>
                    {viewingPO.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Created</p>
                  <p className="text-sm">{format(new Date(viewingPO.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Expected Delivery</p>
                  <p className="text-sm">
                    {viewingPO.expectedDeliveryDate
                      ? format(new Date(viewingPO.expectedDeliveryDate), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Total Amount</p>
                  <p className="text-sm font-semibold">{formatCurrency(viewingPO.totalAmount)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Items</p>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPO.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.ingredient.name}</TableCell>
                          <TableCell className="text-right">{item.quantity} {item.ingredient.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {viewingPO.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Notes</p>
                  <p className="text-sm">{viewingPO.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {(viewingPO?.status === 'sent' || viewingPO?.status === 'confirmed' || viewingPO?.status === 'partially_received') && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  if (viewingPO) openReceiveDialog(viewingPO);
                }}
              >
                <Truck className="h-4 w-4 mr-2" />
                Receive Goods
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Goods</DialogTitle>
            <DialogDescription>
              {receivingPO?.poNumber} from {receivingPO?.supplier?.name}
            </DialogDescription>
          </DialogHeader>
          {receivingPO && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">PO Number</p>
                  <p className="font-medium">{receivingPO.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Supplier</p>
                  <p className="font-medium">{receivingPO.supplier?.name}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Received Quantities</Label>
                <div className="space-y-3">
                  {receivingPO.items?.map((item) => (
                    <div key={item.ingredient._id} className="grid grid-cols-12 gap-3 items-center border rounded-md p-3">
                      <div className="col-span-5">
                        <p className="font-medium text-sm">{item.ingredient.name}</p>
                        <p className="text-xs text-muted-foreground">Unit: {item.ingredient.unit}</p>
                      </div>
                      <div className="col-span-3 text-center">
                        <p className="text-xs text-muted-foreground uppercase">Ordered</p>
                        <p className="font-semibold">{item.quantity}</p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Received</p>
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
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReceivingPO(null);
                setReceivedQtys({});
                setIsReceiveDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReceiveGoods}
              disabled={receiveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {receiveMutation.isPending ? 'Receiving...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrdersPage;
