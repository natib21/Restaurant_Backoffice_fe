import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCustomersList } from '@/api/Queries/customerQueries';
import type { CustomerSession } from '@/api/Queries/customerQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  User,
  Phone,
  Gift,
  TrendingUp,
  Filter,
  Calendar,
  History,
  Star,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/Layout/PageHeader';

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyCustomer, setHistoryCustomer] = useState<CustomerSession | null>(null);

  const { data, isLoading, error } = useGetCustomersList();

  const customers: CustomerSession[] = data?.data?.customers || [];

  const filteredCustomers = customers.filter((customer: CustomerSession) => {
    const matchesSearch =
      customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.source?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'vip' && customer.loyalty?.tier === 'gold') ||
      (statusFilter === 'loyalty' && (customer.loyalty?.points ?? 0) > 0) ||
      (statusFilter === 'new' && isNewThisMonth(customer.lastSeen));

    return matchesSearch && matchesStatus;
  });

  function isNewThisMonth(dateStr?: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'gold':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'silver':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'bronze':
        return 'bg-orange-100 text-orange-900 border-orange-200';
      default:
        return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getInitials = (name?: string) =>
    (name || 'G')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Customers</CardTitle>
            <CardDescription>
              Unable to load customer data. Please try again.
            </CardDescription>
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
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer profiles, loyalty programs, and customer relationships"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search customers by name, phone, or source..."
      />

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, phone, or source..."
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
            {[
              { key: 'all', label: `All Customers (${customers.length})` },
              { key: 'vip', label: 'VIP' },
              { key: 'loyalty', label: 'Loyalty Members' },
              { key: 'new', label: 'New This Month' },
            ].map((chip) => (
              <Badge
                key={chip.key}
                variant={statusFilter === chip.key ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setStatusFilter(chip.key)}
              >
                {chip.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : customers.length}</p>
              </div>
              <User className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Loyalty</p>
                <p className="text-2xl font-bold">
                  {isLoading
                    ? '...'
                    : customers.filter((c) => (c.loyalty?.points ?? 0) > 0).length}
                </p>
              </div>
              <Gift className="h-8 w-8 text-emerald-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {isLoading
                    ? '...'
                    : customers.filter((c) => isNewThisMonth(c.lastSeen)).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Points</p>
                <p className="text-2xl font-bold">
                  {isLoading
                    ? '...'
                    : Math.round(
                        customers.reduce((sum, c) => sum + (c.loyalty?.points || 0), 0) /
                          Math.max(customers.length, 1)
                      )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No customers found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search terms' : 'No customers in the system yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Loyalty</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Seen</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/customers/${customer._id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={customer.profileImage} alt={customer.fullName} />
                            <AvatarFallback>{getInitials(customer.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium leading-tight">
                              {customer.fullName || 'Guest'}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {customer.source || 'guest'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{customer.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getTierColor(customer.loyalty?.tier)}>
                            {customer.loyalty?.tier?.toUpperCase() || 'NONE'}
                          </Badge>
                          <span className="text-muted-foreground">
                            {customer.loyalty?.points ?? 0} pts
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{customer.stats?.totalOrders ?? 0}</span>
                          {!!customer.stats?.totalSpent && (
                            <span className="ml-2 flex items-center gap-1">
                              <Wallet className="h-3.5 w-3.5" />
                              {customer.stats.totalSpent.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {customer.rating?.totalReviews ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{customer.rating.average.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">
                              ({customer.rating.totalReviews})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No reviews</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {customer.lastSeen
                          ? format(new Date(customer.lastSeen), 'MMM d, yyyy')
                          : 'Never'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryCustomer(customer);
                            }}
                          >
                            <History className="h-3.5 w-3.5" />
                            History
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/${customer._id}`);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle send gift
                            }}
                          >
                            Gift
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Drawer */}
      <Dialog open={!!historyCustomer} onOpenChange={(open) => !open && setHistoryCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {historyCustomer?.fullName || 'Guest'} — Activity History
            </DialogTitle>
            <DialogDescription>
              A timeline of account events for this customer.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
            {historyCustomer?.history?.length ? (
              historyCustomer.history
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
                )
                .map((entry) => (
                  <div key={entry._id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize">
                          {entry.action.replace(/_/g, ' ')}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.addedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.details}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No history recorded yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerListPage;