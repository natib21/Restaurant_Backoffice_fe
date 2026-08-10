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
  Search, 
  User, 
  Phone, 
  Gift, 
  TrendingUp, 
  Filter,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data, isLoading, error } = useGetCustomersList();
  
  // API returns single customer in data.data.customer, but in CRM list it should return array
  // For now, wrap single customer in array or use empty array
  const customers: CustomerSession[] = data?.data?.customer 
    ? [data.data.customer] 
    : [];
  
  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer: CustomerSession) => {
    const matchesSearch = 
      customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.source?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });
  
  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'gold': return 'bg-yellow-500 text-yellow-900';
      case 'silver': return 'bg-gray-300 text-gray-800';
      case 'bronze': return 'bg-amber-700 text-amber-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
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
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer profiles, loyalty programs, and customer relationships
          </p>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          
          {/* Quick Filter Chips */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Badge
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              All Customers ({customers.length})
            </Badge>
            <Badge
              variant={statusFilter === 'vip' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('vip')}
            >
              VIP
            </Badge>
            <Badge
              variant={statusFilter === 'loyalty' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('loyalty')}
            >
              Loyalty Members
            </Badge>
            <Badge
              variant={statusFilter === 'new' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('new')}
            >
              New This Month
            </Badge>
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
                  {isLoading ? '...' : customers.filter((c: CustomerSession) => c.loyalty?.points > 0).length}
                </p>
              </div>
              <Gift className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : 
                    customers.filter((c: CustomerSession) => {
                      const lastSeen = new Date(c.lastSeen);
                      const now = new Date();
                      return lastSeen.getMonth() === now.getMonth() && 
                             lastSeen.getFullYear() === now.getFullYear();
                    }).length
                  }
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
                  {isLoading ? '...' : 
                    Math.round(
                      customers.reduce((sum: number, c: CustomerSession) => sum + (c.loyalty?.points || 0), 0) / 
                      Math.max(customers.length, 1)
                    )
                  }
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
              {[1, 2, 3, 4, 5].map(i => (
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
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Loyalty Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Seen</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer: CustomerSession) => (
                    <tr 
                      key={customer._id} 
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/customers/${customer._id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.fullName}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {customer.source || 'guest'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getTierColor(customer.loyalty?.tier)}>
                            {customer.loyalty?.tier?.toUpperCase() || 'NONE'}
                          </Badge>
                          <span className="text-sm font-medium">
                            {customer.loyalty?.points || 0} pts
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm">
                          {customer.lastSeen ? 
                            format(new Date(customer.lastSeen), 'MMM d, yyyy') : 
                            'Never'
                          }
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
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
    </div>
  );
};

export default CustomerListPage;