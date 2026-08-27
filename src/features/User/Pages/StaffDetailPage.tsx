// src/features/Staff/Pages/StaffDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Receipt,
  TrendingUp,
  Edit,
  Trash2,
  ExternalLink,
  User,
  ShoppingBag,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

import RightSideModal from '@/components/ui/RightSideModal';

import { useMerchantStaffMemberQuery } from '../../../api/Queries/merchantQueries';
import { useOrdersQuery } from '../../../api/Queries/orderQuery';
import { toast } from 'sonner';

import StaffForm from '../Components/StaffInviteForm'; // ← your form (create + edit)

const StaffDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  const {
    data: staff,
    isLoading: staffLoading,
    error: staffError,
  } = useMerchantStaffMemberQuery(id!);
  const { data: ordersData, isLoading: ordersLoading } = useOrdersQuery({
    placedBy: id,
  });

  const orders = ordersData?.orders || [];
  console.log(staff);
  const joinedDate = staff?.createdAt
    ? format(new Date(staff.createdAt), 'MMM yyyy')
    : '—';

  const handleDeleteConfirm = async () => {
    try {
      // await deleteStaffMutation.mutateAsync(id!);
      toast.success('Staff member removed successfully');
      navigate('/users/staff');
    } catch (err) {
      toast.error('Failed to delete staff member');
    }
    setDeleteDialogOpen(false);
  };

  if (staffLoading || ordersLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (staffError || !staff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-6">
          <User className="h-10 w-10 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Staff member not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This profile may have been deleted or the link is invalid.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/users/staff')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Button
            variant="ghost"
            className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/users/staff')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team Directory
          </Button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName || staff.email}`}
                  alt={`${staff.firstName} ${staff.lastName}`}
                />
                <AvatarFallback className="text-2xl font-semibold">
                  {staff.firstName?.[0]}
                  {staff.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {staff.firstName} {staff.lastName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      staff.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
                    }
                  >
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="secondary">
                    {(staff.role as any)?.name || (typeof staff.role === 'string' ? staff.role : 'Staff')}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {joinedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100/40 dark:from-blue-950/30 dark:to-blue-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Orders Placed
                    </p>
                    <p className="mt-2 text-3xl font-black">{orders.length}</p>
                  </div>
                  <ShoppingBag className="h-10 w-10 text-blue-600/70 dark:text-blue-400/70" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Revenue Contribution
                    </p>
                    <p className="mt-2 text-3xl font-black">
                      ETB{' '}
                      {orders
                        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-emerald-600/70 dark:text-emerald-400/70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Orders */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2.5">
                <Receipt className="h-5 w-5 text-primary" />
                Recent Orders
              </h2>

              <Card className="border-none shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold">Order #</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="w-16 text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-40 text-center text-muted-foreground"
                        >
                          No orders placed yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.slice(0, 8).map((order: any) => (
                        <TableRow
                          key={order._id}
                          className="hover:bg-muted/60 transition-colors"
                        >
                          <TableCell className="font-mono font-medium text-primary">
                            {order.orderNumber ||
                              order._id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.customerName || '—'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ETB {(order.totalAmount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order);
                                setOrderDetailOpen(true);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Contact & Role */}
            <div className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact & Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </p>
                      <p className="mt-0.5 font-medium break-all">
                        {staff.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Phone
                      </p>
                      <p className="mt-0.5 font-medium">
                        {staff.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Access Level
                      </p>
                      <p className="mt-0.5 font-medium">
                        {(staff.role as any)?.name || (typeof staff.role === 'string' ? staff.role : 'Staff')}
                      </p>
                    </div>
                  </div>

                  {(staff.branch as any)?.name && (
                    <>
                      <div className="pt-2">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Branch
                            </p>
                            <p className="mt-0.5 font-medium">
                              {(staff.branch as any).name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal with StaffForm */}
      <RightSideModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title={`Edit ${staff.firstName} ${staff.lastName}`}
        description="Update personal details, role, branch and permissions."
      >
        <StaffForm
          roles={[]} // ← pass real roles (you can fetch them here or from parent)
          branches={[]} // ← pass real branches
          initialData={staff as any}
          onCancel={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false);
          }}
        />
      </RightSideModal>

      {/* Order Detail Modal */}
      <RightSideModal
        open={orderDetailOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
          setOrderDetailOpen(open);
        }}
        title={
          selectedOrder
            ? `Order ${selectedOrder.orderNumber || selectedOrder._id}`
            : ''
        }
        description="Order details and summary"
      >
        {selectedOrder && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1" variant="outline">
                  {selectedOrder.status || 'Unknown'}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">
                  ETB {(selectedOrder.totalAmount || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-center py-12 text-sm text-muted-foreground italic">
              Full order details (items, delivery, payment) coming soon...
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>
                {staff.firstName} {staff.lastName}
              </strong>
              's account and revoke all access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffDetailPage;
