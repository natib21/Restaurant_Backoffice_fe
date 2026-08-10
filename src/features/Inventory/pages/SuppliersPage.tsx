import React, { useState, useMemo } from 'react';
import {
  useGetSuppliersList,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  type Supplier,
  type SupplierCreateRequest,
} from '@/api/Queries/supplierQueries';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Factory,
  Phone,
  Mail,
  MapPin,
  Star,
  Filter,
} from 'lucide-react';

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

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
};

const SuppliersPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierCreateRequest & { isActive: boolean }>({
    ...emptySupplierForm,
    isActive: true,
  });

  const { data, isLoading, error } = useGetSuppliersList();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const suppliers: Supplier[] = data?.data?.suppliers || [];

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [suppliers, searchQuery]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.isActive).length;
    const totalRating = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0);
    const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '0.0';
    const topRated = suppliers.length > 0 ? [...suppliers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] : null;
    return { total, active, avgRating, topRated };
  }, [suppliers]);

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
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      const { isActive, ...submitData } = formData;

      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          supplierId: editingSupplier._id,
          data: { ...submitData, isActive },
        });
        toast({
          title: 'Supplier Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await createSupplier.mutateAsync({ ...submitData, isActive } as any);
        toast({
          title: 'Supplier Created',
          description: `${formData.name} has been added to your suppliers.`,
        });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to save supplier. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplier.mutateAsync(deletingSupplier._id);
      toast({
        title: 'Supplier Deleted',
        description: `${deletingSupplier.name} has been removed.`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingSupplier(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete supplier. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPaymentTermsLabel = (terms: string) => {
    const option = paymentTermsOptions.find((o) => o.value === terms);
    return option ? option.label : terms;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Suppliers</CardTitle>
            <CardDescription>Unable to load supplier data. Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your supplier network, track delivery performance, and maintain vendor relationships
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, contact, phone, email, or city..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p>
              </div>
              <Factory className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : stats.active}</p>
              </div>
              <Badge className="bg-green-500 text-white">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{isLoading ? '...' : stats.avgRating}</p>
                  {!isLoading && <StarRating rating={Math.round(Number(stats.avgRating))} size={20} />}
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-400/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Rated</p>
                <p className="text-lg font-bold truncate max-w-[140px]">
                  {isLoading ? '...' : stats.topRated?.name || 'N/A'}
                </p>
                {!isLoading && stats.topRated && (
                  <div className="mt-1">
                    <StarRating rating={stats.topRated.rating || 0} size={14} />
                  </div>
                )}
              </div>
              <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
          <CardDescription>
            {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No suppliers found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search terms' : 'No suppliers in the system yet'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Supplier
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Factory className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{supplier.contactPerson}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.address?.city || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPaymentTermsLabel(supplier.paymentTerms)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{supplier.leadTime || 0} days</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StarRating rating={supplier.rating || 0} />
                          <span className="text-sm text-muted-foreground">{supplier.rating || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={supplier.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(supplier)}
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(supplier)}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'Update supplier information and settings.'
                : 'Fill in the supplier details below to add a new vendor.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Fresh Foods Co."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                placeholder="e.g., John Smith"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="e.g., +1 234 567 8900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., contact@freshfoods.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Street Address</Label>
              <Textarea
                placeholder="123 Main Street, Industrial Zone"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., New York"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP / Postal Code</Label>
              <Input
                id="zipCode"
                placeholder="e.g., 10001"
                value={formData.address.zipCode}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(val: any) => setFormData({ ...formData, paymentTerms: val })}
              >
                <SelectTrigger id="paymentTerms">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadTime">Lead Time (days)</Label>
              <Input
                id="leadTime"
                type="number"
                min={0}
                placeholder="e.g., 7"
                value={formData.leadTime ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, leadTime: e.target.value ? Number(e.target.value) : 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                step={1}
                placeholder="1-5"
                value={formData.rating ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : 1;
                  const clamped = Math.max(1, Math.min(5, val));
                  setFormData({ ...formData, rating: clamped });
                }}
              />
              <div className="pt-1">
                <StarRating rating={formData.rating || 1} size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supplier Status</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSupplier.isPending || updateSupplier.isPending}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingSupplier?.name}</strong>? This action cannot be
              undone and may affect existing purchase orders.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-4 py-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{deletingSupplier?.name}</p>
              <p className="text-sm text-muted-foreground">{deletingSupplier?.contactPerson}</p>
              <p className="text-sm text-muted-foreground">{deletingSupplier?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSupplier.isPending}>
              {deleteSupplier.isPending ? 'Deleting...' : 'Delete Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;
