import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetCustomerDetails, 
  useStaffGiveGift, 
  useStaffAddTagNote,
  useStaffUpdateCustomer,
  useStaffDeleteCustomer 
} from '@/api/Queries/customerQueries';
import { useMenuItemsQuery } from '@/api/Queries/menuQueries';
import { getLocalizedName } from '@/features/Menu/lib/localizationUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Shield,
  SendHorizontal,
  Clock,
  User,
  History,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Sparkles,
  ExternalLink,
  Heart,
  Plus,
  CookingPot,
  Check,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/Layout/PageHeader';

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
  const [customFavorite, setCustomFavorite] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');
  
  const [giftForm, setGiftForm] = useState({
    name: '',
    type: 'free_item' as const,
    value: 1,
    menuItemId: '',
    expiresInDays: 30,
    reason: '',
  });
  
  const { data, isLoading, error, refetch } = useGetCustomerDetails(id);
  const { data: menuItems } = useMenuItemsQuery();

  const customer = data?.data?.customer;
  const stats = customer?.stats;
  const telegram = customer?.telegram;
  const isTelegramLinked = Boolean(telegram?.linked || telegram?.username);

  // Extract Favorite Meals from customer.favoriteMeals OR tags starting with "fav:"
  const getFavoriteMeals = () => {
    const list: Array<{ name: string; price?: number; category?: string; image?: string; id?: string }> = [];
    
    // 1. From favoriteMeals array
    if (customer?.favoriteMeals?.length) {
      customer.favoriteMeals.forEach((meal: any) => {
        if (typeof meal === 'string') {
          list.push({ name: meal });
        } else if (meal && typeof meal === 'object') {
          list.push({
            name: meal.name || 'Unnamed Dish',
            price: meal.price,
            category: meal.category,
            image: meal.image,
            id: meal._id,
          });
        }
      });
    }

    // 2. From tags formatted as "fav:Meal Name"
    if (customer?.tags?.length) {
      customer.tags.forEach((tag: string) => {
        if (tag.toLowerCase().startsWith('fav:')) {
          const mealName = tag.slice(4).trim();
          if (mealName && !list.some((m) => m.name.toLowerCase() === mealName.toLowerCase())) {
            list.push({ name: mealName });
          }
        }
      });
    }

    return list;
  };

  const favoriteMeals = getFavoriteMeals();

  React.useEffect(() => {
    if (customer && !isEditing) {
      setEditForm({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
      });
    }
  }, [customer, isEditing]);
  
  const updateCustomerMutation = useStaffUpdateCustomer();
  const addTagNoteMutation = useStaffAddTagNote();
  const giveGiftMutation = useStaffGiveGift();
  const deleteCustomerMutation = useStaffDeleteCustomer();

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
        description: "Customer profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  const handleAddFavoriteMeal = async (mealObj: { name: string; price?: number; category?: string; image?: string }) => {
    if (!mealObj.name.trim()) return;

    try {
      // 1. Add as tag "fav:Name" for maximum backwards compatibility
      const tagValue = `fav:${mealObj.name.trim()}`;
      await addTagNoteMutation.mutateAsync({
        customerId: id!,
        tagOrNote: { tag: tagValue },
      });

      // 2. Try updating favoriteMeals array directly
      const updatedFavorites = [
        ...favoriteMeals,
        { name: mealObj.name.trim(), price: mealObj.price, category: mealObj.category, image: mealObj.image }
      ];

      await updateCustomerMutation.mutateAsync({
        customerId: id!,
        updateData: {
          favoriteMeals: updatedFavorites as any,
        },
      });

      setCustomFavorite('');
      setSelectedMenuItem('');
      refetch();
      toast({
        title: "Favorite Meal Saved",
        description: `Added "${mealObj.name.trim()}" to customer favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save favorite meal",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFavoriteMeal = async (mealName: string) => {
    try {
      // Remove tag "fav:MealName" if present
      const tagValue = `fav:${mealName}`;
      if (customer?.tags?.includes(tagValue)) {
        const remainingTags = customer.tags.filter((t) => t !== tagValue);
        await updateCustomerMutation.mutateAsync({
          customerId: id!,
          updateData: {
            tags: remainingTags,
          },
        });
      }

      // Filter out of favoriteMeals
      const remainingFavs = favoriteMeals.filter(
        (m) => m.name.toLowerCase() !== mealName.toLowerCase()
      );

      await updateCustomerMutation.mutateAsync({
        customerId: id!,
        updateData: {
          favoriteMeals: remainingFavs as any,
        },
      });

      refetch();
      toast({
        title: "Favorite Meal Removed",
        description: `Removed "${mealName}" from customer favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove favorite meal",
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
        title: "Tag Added",
        description: `Added tag "${newTag.trim()}"`,
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
        title: "Note Added",
        description: "Staff note recorded",
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
        description: "Gift has been added to customer loyalty account",
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
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    try {
      await deleteCustomerMutation.mutateAsync(id!);
      toast({
        title: "Deleted",
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
  
  const getTierBadge = (tier?: string) => {
    const normalized = (tier || 'bronze').toLowerCase();
    switch (normalized) {
      case 'gold':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 fill-amber-500" />
            GOLD TIER
          </Badge>
        );
      case 'silver':
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 fill-slate-400" />
            SILVER TIER
          </Badge>
        );
      case 'bronze':
      default:
        return (
          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30 gap-1 font-medium">
            BRONZE TIER
          </Badge>
        );
    }
  };

  const getInitials = (name?: string, telegramUsername?: string) => {
    if (name && name.toLowerCase() !== 'guest') {
      return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    if (telegramUsername) {
      return telegramUsername.slice(0, 2).toUpperCase();
    }
    return 'CU';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Customer Not Found</CardTitle>
            <CardDescription>
              The customer profile could not be retrieved or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/customers')}>
              Return to Customer List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const displayName =
    customer?.fullName && customer.fullName !== 'Guest'
      ? customer.fullName
      : telegram?.firstName || 'Guest Customer';

  const avatarSrc =
    telegram?.profilePic ||
    (customer?.profileImage !== '/images/default-avatar.png' ? customer?.profileImage : undefined);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isLoading ? 'Loading Customer...' : displayName}
        subtitle={`Customer ID: ${id}`}
        breadcrumbText="Customers"
        breadcrumbAction={() => navigate('/customers')}
      >
        <div className="flex flex-wrap gap-2">
          {isTelegramLinked && (
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              onClick={() => navigate(`/customers/telegram-chat?customerId=${id}`)}
            >
              <SendHorizontal className="h-4 w-4" />
              <span>Chat on Telegram</span>
            </Button>
          )}

          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-9 gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button 
                size="sm"
                onClick={handleUpdateCustomer}
                className="h-9 gap-1.5"
                disabled={updateCustomerMutation.isPending}
              >
                <Save className="h-4 w-4" />
                <span>{updateCustomerMutation.isPending ? 'Saving...' : 'Save'}</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-9 gap-1.5"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteCustomer}
                className="h-9 gap-1.5"
                disabled={deleteCustomerMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Customer Hero Banner */}
      <Card className="overflow-hidden border border-border shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-xs">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {getInitials(customer?.fullName, telegram?.username)}
                  </AvatarFallback>
                </Avatar>
                {isTelegramLinked && (
                  <span className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1 rounded-full border-2 border-background shadow-xs" title="Telegram Connected">
                    <SendHorizontal className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {displayName}
                  </h1>
                  {getTierBadge(customer?.loyalty?.tier)}
                  {customer?.currentTable && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <UtensilsCrossed className="h-3 w-3 text-amber-500" />
                      Table Seated
                    </Badge>
                  )}
                  {favoriteMeals.length > 0 && (
                    <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 text-xs font-medium">
                      <Heart className="h-3 w-3 fill-rose-500" />
                      {favoriteMeals.length} Favorite Dish{favoriteMeals.length > 1 ? 'es' : ''}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {telegram?.username && (
                    <span className="flex items-center gap-1 font-mono text-sky-600 dark:text-sky-400 font-medium">
                      <SendHorizontal className="h-3.5 w-3.5" />
                      @{telegram.username}
                    </span>
                  )}
                  {customer?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </span>
                  )}
                  <span className="capitalize bg-muted px-2 py-0.5 rounded-xs">
                    Source: {customer?.source || 'guest'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-muted/50 p-3 rounded-lg border text-center min-w-[100px]">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Total Spent</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  ETB {(stats?.totalSpent || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border text-center min-w-[100px]">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Orders</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {stats?.totalOrders || 0}
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border text-center min-w-[100px]">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Loyalty Pts</p>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {customer?.loyalty?.points || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/60">
          <TabsTrigger value="overview" className="py-2.5 text-xs font-medium">
            Overview & Telegram
          </TabsTrigger>
          <TabsTrigger value="favorites" className="py-2.5 text-xs font-medium gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
            Favorites ({favoriteMeals.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="py-2.5 text-xs font-medium">
            Timeline ({customer?.history?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="py-2.5 text-xs font-medium">
            Loyalty & Gifts
          </TabsTrigger>
          <TabsTrigger value="tags" className="py-2.5 text-xs font-medium">
            Tags & Staff Notes
          </TabsTrigger>
          <TabsTrigger value="orders" className="py-2.5 text-xs font-medium">
            Orders ({stats?.totalOrders || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & TELEGRAM */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Telegram Integration Card */}
            <Card className="border-sky-500/20 shadow-xs">
              <CardHeader className="bg-sky-500/5 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                      <SendHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Telegram Integration</CardTitle>
                      <CardDescription className="text-xs">
                        Connected Telegram bot chat and user account
                      </CardDescription>
                    </div>
                  </div>
                  {isTelegramLinked ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Linked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3 w-3" /> Not Linked
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                {telegram ? (
                  <div className="space-y-3">
                    <div className="flex justify-between py-1 border-b text-xs">
                      <span className="text-muted-foreground">Telegram Username</span>
                      <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">
                        {telegram.username ? `@${telegram.username}` : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b text-xs">
                      <span className="text-muted-foreground">Telegram User ID / Chat ID</span>
                      <span className="font-mono">{telegram.id || telegram.chatId || '—'}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b text-xs">
                      <span className="text-muted-foreground">Marketing Opt-In</span>
                      {telegram.optIn ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] px-2 py-0">
                          Opted In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-2 py-0">
                          Opted Out
                        </Badge>
                      )}
                    </div>

                    {telegram.linkedAt && (
                      <div className="flex justify-between py-1 border-b text-xs">
                        <span className="text-muted-foreground">Linked At</span>
                        <span>{format(new Date(telegram.linkedAt), 'PPpp')}</span>
                      </div>
                    )}

                    {telegram.lastInteractionAt && (
                      <div className="flex justify-between py-1 border-b text-xs">
                        <span className="text-muted-foreground">Last Interaction</span>
                        <span>
                          {formatDistanceToNow(new Date(telegram.lastInteractionAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        className="w-full gap-2 bg-sky-600 hover:bg-sky-700 text-white"
                        onClick={() => navigate(`/customers/telegram-chat?customerId=${id}`)}
                      >
                        <SendHorizontal className="h-4 w-4" />
                        Open Live Telegram Chat Thread
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <SendHorizontal className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">
                      This customer has not linked their Telegram account yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile & Account Card */}
            <Card className="shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Profile Details</CardTitle>
                <CardDescription className="text-xs">
                  Basic contact details and current restaurant status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="text-muted-foreground">Full Name</span>
                    {isEditing ? (
                      <Input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="h-7 text-xs w-48"
                      />
                    ) : (
                      <span className="font-semibold">{displayName}</span>
                    )}
                  </div>

                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="text-muted-foreground">Phone Number</span>
                    {isEditing ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="h-7 text-xs w-48"
                      />
                    ) : (
                      <span className="font-mono">{customer?.phone || '—'}</span>
                    )}
                  </div>

                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="text-muted-foreground">Source</span>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {customer?.source || 'guest'}
                    </Badge>
                  </div>

                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="text-muted-foreground">Joined / Created At</span>
                    <span>
                      {customer?.createdAt
                        ? format(new Date(customer.createdAt), 'PPP')
                        : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="text-muted-foreground">Last Seen</span>
                    <span>
                      {customer?.lastSeen
                        ? formatDistanceToNow(new Date(customer.lastSeen), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: FAVORITE MEALS */}
        <TabsContent value="favorites" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add Favorite Meals Controls */}
            <Card className="lg:col-span-1 shadow-xs border-rose-500/20">
              <CardHeader className="bg-rose-500/5 pb-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                  <div>
                    <CardTitle className="text-base">Add Favorite Meal</CardTitle>
                    <CardDescription className="text-xs">
                      Record dishes this customer prefers or orders frequently
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {/* Pick from Restaurant Menu */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <CookingPot className="h-3.5 w-3.5 text-primary" />
                    Select from Restaurant Menu
                  </label>
                  <select
                    className="w-full h-9 text-xs border border-input rounded-md px-3 bg-background"
                    value={selectedMenuItem}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setSelectedMenuItem(selectedId);
                      const matchedItem = menuItems?.find((item) => item._id === selectedId);
                      if (matchedItem) {
                        handleAddFavoriteMeal({
                          name: getLocalizedName(matchedItem, 'en', 'Menu Item'),
                          price: matchedItem.price || matchedItem.variants?.[0]?.price,
                          category: matchedItem.category,
                          image: matchedItem.image,
                        });
                      }
                    }}
                  >
                    <option value="">-- Choose a menu item --</option>
                    {menuItems?.map((item) => {
                      const displayName = getLocalizedName(item, 'en', 'Menu Item');
                      return (
                        <option key={item._id} value={item._id}>
                          {displayName} ({item.category}) — ETB {item.price || item.variants?.[0]?.price || 0}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="relative my-3 flex items-center justify-center">
                  <Separator />
                  <span className="absolute bg-background px-2 text-[10px] uppercase text-muted-foreground">
                    Or custom dish
                  </span>
                </div>

                {/* Custom Meal Input */}
                <div className="space-y-2">
                  <label className="font-semibold text-foreground">Custom Meal Name</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Special Doro Wat - Mild"
                      value={customFavorite}
                      onChange={(e) => setCustomFavorite(e.target.value)}
                      className="h-9 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddFavoriteMeal({ name: customFavorite });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddFavoriteMeal({ name: customFavorite })}
                      disabled={!customFavorite.trim() || updateCustomerMutation.isPending}
                      className="h-9 gap-1 text-xs shrink-0 bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Saved Favorite Dishes */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                      Saved Favorite Dishes
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Favorite choices logged for personalized dining recommendations
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {favoriteMeals.length} saved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {favoriteMeals.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl bg-muted/20">
                    <UtensilsCrossed className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <h3 className="mt-3 text-sm font-semibold">No favorite meals added yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Pick dishes from the menu on the left or type custom food preferences.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favoriteMeals.map((meal, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-border bg-card hover:shadow-xs transition-shadow flex items-start justify-between gap-3 relative group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {meal.image ? (
                            <img
                              src={meal.image}
                              alt={meal.name}
                              className="h-12 w-12 rounded-lg object-cover shrink-0 border"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                              <UtensilsCrossed className="h-6 w-6" />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <h4 className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                              {meal.name}
                            </h4>

                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              {meal.category && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                                  {meal.category}
                                </Badge>
                              )}
                              {meal.price !== undefined && (
                                <span className="font-mono text-xs font-semibold text-primary">
                                  ETB {meal.price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => handleRemoveFavoriteMeal(meal.name)}
                          title="Remove favorite dish"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: TIMELINE */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Customer History Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Log of account activities, Telegram linking, order events, and system updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer?.history?.length ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
                  {customer.history
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
                    )
                    .map((item: any) => (
                      <div key={item._id || item.id} className="flex gap-4 items-start relative z-10">
                        <div className="h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary shrink-0 shadow-xs">
                          {item.action === 'telegram_link' ? (
                            <SendHorizontal className="h-3.5 w-3.5 text-sky-500" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 bg-muted/30 p-3.5 rounded-lg border text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground capitalize">
                              {item.action?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {item.addedAt
                                ? format(new Date(item.addedAt), 'MMM d, yyyy · HH:mm')
                                : ''}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{item.details}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No timeline history events logged yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: LOYALTY & GIFTS */}
        <TabsContent value="loyalty" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  Loyalty Tier & Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Tier</p>
                    <div className="mt-1">{getTierBadge(customer?.loyalty?.tier)}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                      {customer?.loyalty?.points || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress to Next Tier</span>
                    <span>{customer?.loyalty?.points || 0} / 500 pts</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                      style={{
                        width: `${Math.min(((customer?.loyalty?.points || 0) / 500) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-emerald-500" />
                  Issue Gift / Reward
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-muted-foreground">Gift Name</label>
                  <Input
                    placeholder="e.g. Free Dessert, 15% Discount"
                    value={giftForm.name}
                    onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-muted-foreground">Type</label>
                    <select
                      className="mt-1 w-full h-8 text-xs px-2 border rounded-md bg-background"
                      value={giftForm.type}
                      onChange={(e) => setGiftForm({ ...giftForm, type: e.target.value as any })}
                    >
                      <option value="free_item">Free Item</option>
                      <option value="discount">Discount</option>
                      <option value="points">Points Reward</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground">Expires (Days)</label>
                    <Input
                      type="number"
                      value={giftForm.expiresInDays}
                      onChange={(e) =>
                        setGiftForm({ ...giftForm, expiresInDays: parseInt(e.target.value) || 30 })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGiveGift}
                  disabled={!giftForm.name.trim() || giveGiftMutation.isPending}
                  className="w-full gap-2 mt-2 h-9 text-xs"
                >
                  <Gift className="h-3.5 w-3.5" />
                  {giveGiftMutation.isPending ? 'Sending...' : 'Issue Reward'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: TAGS & NOTES */}
        <TabsContent value="tags" className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Tags & Preferences</CardTitle>
              <CardDescription className="text-xs">
                Categorize this customer for personalized service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag (e.g., VIP, Prefers Window)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="h-8 text-xs max-w-xs"
                />
                <Button
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || addTagNoteMutation.isPending}
                  size="sm"
                  className="h-8 text-xs gap-1"
                >
                  <Tag className="h-3.5 w-3.5" /> Add Tag
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {customer?.tags?.length ? (
                  customer.tags.map((t: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="gap-1 text-xs py-1 px-2.5">
                      <Tag className="h-3 w-3 text-primary" />
                      {t}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No custom tags added yet.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Staff Notes</h4>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a staff note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="text-xs min-h-[60px]"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addTagNoteMutation.isPending}
                    size="sm"
                    className="h-auto self-start text-xs gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>

                <div className="space-y-2 pt-2">
                  {customer?.notes?.length ? (
                    customer.notes.map((note: string, idx: number) => (
                      <div key={idx} className="p-3 bg-muted/40 rounded-lg border text-xs text-foreground">
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No staff notes logged.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: ORDERS */}
        <TabsContent value="orders">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Order History</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => navigate(`/orders?customer=${id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View All Merchant Orders
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer?.orders?.length ? (
                <div className="space-y-2">
                  {customer.orders.map((o: any) => (
                    <div key={o._id} className="p-3 border rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold">Order #{o.orderNumber || o._id}</p>
                        <p className="text-muted-foreground">{o.createdAt ? format(new Date(o.createdAt), 'PPpp') : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">ETB {o.totalAmount?.toLocaleString()}</p>
                        <Badge variant="outline" className="capitalize text-[10px]">{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
                  <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/30" />
                  <p>No orders registered for this customer yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetailPage;
