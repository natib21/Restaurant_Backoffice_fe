import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetCustomerDetails, 
  useStaffGiveGift, 
  useStaffAddTagNote,
  useStaffUpdateCustomer,
  useStaffDeleteCustomer 
} from '@/api/Queries/customerQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Phone, 
  Gift, 
  Tag, 
  Edit, 
  Trash2,
  Save,
  X,
  Calendar,
  DollarSign,
  ShoppingBag,
  MessageSquare,
  Star,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
  });
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [giftForm, setGiftForm] = useState({
    name: '',
    type: 'free_item' as const,
    value: 1,
    menuItemId: '',
    expiresInDays: 30,
    reason: '',
  });
  
  const { data, isLoading, error, refetch } = useGetCustomerDetails(id);
  const customer = data?.data?.customer;
  // Stats is part of customer.stats, not a separate field in response
  const stats = customer?.stats;
  
  const updateCustomerMutation = useStaffUpdateCustomer();
  const addTagNoteMutation = useStaffAddTagNote();
  const giveGiftMutation = useStaffGiveGift();
  const deleteCustomerMutation = useStaffDeleteCustomer();
  
  React.useEffect(() => {
    if (customer && !isEditing) {
      setEditForm({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
      });
    }
  }, [customer, isEditing]);
  
  const handleUpdateCustomer = async () => {
    try {
      await updateCustomerMutation.mutateAsync({
        customerId: id!,
        updateData: {
          fullName: editForm.fullName,
          phone: editForm.phone,
        },
      });
      setIsEditing(false);
      refetch();
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };
  
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      await addTagNoteMutation.mutateAsync({
        customerId: id!,
        tagOrNote: { tag: newTag.trim() },
      });
      setNewTag('');
      refetch();
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await addTagNoteMutation.mutateAsync({
        customerId: id!,
        tagOrNote: { note: newNote.trim() },
      });
      setNewNote('');
      refetch();
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };
  
  const handleGiveGift = async () => {
    try {
      await giveGiftMutation.mutateAsync({
        customerId: id!,
        giftData: giftForm,
      });
      setGiftForm({
        name: '',
        type: 'free_item',
        value: 1,
        menuItemId: '',
        expiresInDays: 30,
        reason: '',
      });
      refetch();
      toast({
        title: "Gift Sent!",
        description: "Gift has been sent to customer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send gift",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteCustomer = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await deleteCustomerMutation.mutateAsync(id!);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      navigate('/customers');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };
  
  const getTierColor = (tier?: string) => {
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
            <CardTitle className="text-destructive">Error Loading Customer</CardTitle>
            <CardDescription>
              Unable to load customer data. Customer may not exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/customers')}>
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-8 w-48" /> : customer?.fullName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customer ID: {id}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCustomer}
                className="gap-2"
                disabled={updateCustomerMutation.isPending}
              >
                {updateCustomerMutation.isPending ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteCustomer}
                className="gap-2"
                disabled={deleteCustomerMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Basic details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      {isEditing ? (
                        <Input
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                        />
                      ) : (
                        <p className="text-lg font-medium">{customer?.fullName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      {isEditing ? (
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-lg font-medium">{customer?.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Source</label>
                    <Badge variant="outline" className="capitalize">
                      {customer?.source || 'guest'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Seen</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>
                        {customer?.lastSeen ? 
                          format(new Date(customer.lastSeen), 'PPpp') : 
                          'Never'
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Tabs for Details */}
          <Tabs defaultValue="loyalty">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
              <TabsTrigger value="tags">Tags & Notes</TabsTrigger>
              <TabsTrigger value="gifts">Gifts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="loyalty">
              <Card>
                <CardHeader>
                  <CardTitle>Loyalty Program</CardTitle>
                  <CardDescription>
                    Customer loyalty points and tier status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Tier</p>
                          <Badge className={`${getTierColor(customer?.loyalty?.tier)} text-lg px-3 py-1`}>
                            {customer?.loyalty?.tier?.toUpperCase() || 'BRONZE'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Loyalty Points</p>
                          <p className="text-2xl font-bold flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            {customer?.loyalty?.points || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Available Gifts</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {customer?.loyalty?.gifts?.length ? (
                            customer.loyalty.gifts.map((gift: any, index: number) => (
                              <Card key={index} className="p-3">
                                <p className="font-medium">{gift.name}</p>
                                <p className="text-sm text-muted-foreground">Expires: {gift.expiresAt}</p>
                              </Card>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No available gifts</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle>Tags & Notes</CardTitle>
                  <CardDescription>
                    Add tags and notes to track customer preferences and history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tags Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Tags</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag (e.g., VIP, Prefers Spicy)"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="w-48"
                        />
                        <Button 
                          onClick={handleAddTag}
                          disabled={!newTag.trim() || addTagNoteMutation.isPending}
                          size="sm"
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : customer?.tags?.length ? (
                        customer.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags yet</p>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Notes</h3>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add a note about this customer"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-64"
                          rows={2}
                        />
                        <Button 
                          onClick={handleAddNote}
                          disabled={!newNote.trim() || addTagNoteMutation.isPending}
                          size="sm"
                          className="self-start"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {isLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : customer?.notes?.length ? (
                        customer.notes.map((note: string, index: number) => (
                          <Card key={index} className="p-3">
                            <p className="text-sm">{note}</p>
                          </Card>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No notes yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="gifts">
              <Card>
                <CardHeader>
                  <CardTitle>Send Gift</CardTitle>
                  <CardDescription>
                    Send a gift to this customer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gift Name</label>
                        <Input
                          placeholder="e.g., Free Coffee, 10% Discount"
                          value={giftForm.name}
                          onChange={(e) => setGiftForm({...giftForm, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gift Type</label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={giftForm.type}
                          onChange={(e) => setGiftForm({...giftForm, type: e.target.value as any})}
                        >
                          <option value="free_item">Free Item</option>
                          <option value="discount">Discount</option>
                          <option value="points">Points</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason (Optional)</label>
                      <Input
                        placeholder="e.g., Loyalty reward, Birthday gift"
                        value={giftForm.reason}
                        onChange={(e) => setGiftForm({...giftForm, reason: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Value</label>
                        <Input
                          type="number"
                          value={giftForm.value}
                          onChange={(e) => setGiftForm({...giftForm, value: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Expires in (days)</label>
                        <Input
                          type="number"
                          value={giftForm.expiresInDays}
                          onChange={(e) => setGiftForm({...giftForm, expiresInDays: parseInt(e.target.value) || 30})}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleGiveGift}
                      disabled={!giftForm.name.trim() || giveGiftMutation.isPending}
                      className="w-full gap-2"
                    >
                      <Gift className="h-4 w-4" />
                      {giveGiftMutation.isPending ? 'Sending Gift...' : 'Send Gift'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column - Stats and Quick Actions */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Stats</CardTitle>
              <CardDescription>
                Performance and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold">
                          ETB {stats?.totalSpent?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">
                          {stats?.totalOrders || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average Order</p>
                        <p className="text-2xl font-bold">
                          ETB {stats?.totalSpent && stats?.totalOrders ? 
                            Math.round(stats.totalSpent / stats.totalOrders) : 0
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions for this customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate(`/orders?customer=${id}`)}
              >
                <ShoppingBag className="h-4 w-4" />
                View Order History
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => {
                  setGiftForm({
                    name: '',
                    type: 'free_item',
                    value: 1,
                    menuItemId: '',
                    expiresInDays: 30,
                    reason: '',
                  });
                  document.querySelector('[value="gifts"]')?.dispatchEvent(new Event('click'));
                }}
              >
                <Gift className="h-4 w-4" />
                Send Gift
              </Button>
              
              {/* Email button removed - customer model doesn't have email field */}
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Loyalty Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Loyalty Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Tier</span>
                    <Badge className={getTierColor(customer?.loyalty?.tier)}>
                      {customer?.loyalty?.tier?.toUpperCase() || 'BRONZE'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Points to Silver</span>
                      <span className="font-medium">
                        {Math.max(500 - (customer?.loyalty?.points || 0), 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((customer?.loyalty?.points || 0) / 500 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;