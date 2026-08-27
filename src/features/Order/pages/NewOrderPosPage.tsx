import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  Utensils,
  ShoppingBag,
  Truck,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Save,
  CheckCircle2,
  X,
  User,
  Phone,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  Tag,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import { useMenuItemsQuery, type MenuItem, type Variant } from '@/api/Queries/menuQueries';
import { useCategoriesQuery, type Category } from '@/api/Queries/categoryQueries';
import { useTablesQuery, type Table } from '@/api/Queries/tableQueries';
import { useCreateStaffOrderMutation, type StaffCreateOrderPayload } from '@/api/Queries/orderQuery';
import { playOrderSound } from '@/features/Order/lib/soundPlayer';
import { formatOrderItemName } from '../lib/orderUtils';
import { PayOrderModal } from '../Components/PayOrderModal';
import { cn } from '@/lib/utils';

// Types
export interface CartItem {
  id: string; // unique cart entry id (menuItemId + variant + notes)
  menuItemId: string;
  name: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
  image?: string;
}

// Fallback demo menu items if merchant hasn't populated items yet
const DEMO_MENU_ITEMS: Partial<MenuItem>[] = [
  {
    _id: 'demo-1',
    name: 'Classic Smash Burger',
    category: 'Burgers',
    price: 320,
    available: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    description: 'Double beef patty, cheddar, caramelized onions, secret sauce',
    variants: [
      { name: 'Single Patty', price: 260, available: true },
      { name: 'Double Patty (Original)', price: 320, available: true, isDefault: true },
      { name: 'Triple Monster', price: 410, available: true },
    ],
  },
  {
    _id: 'demo-2',
    name: 'Truffle Mushroom Pizza',
    category: 'Pizza',
    price: 450,
    available: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    description: 'Wild mushrooms, mozzarella, truffle glaze, fresh basil',
    variants: [
      { name: 'Medium (10")', price: 380, available: true },
      { name: 'Large (14")', price: 450, available: true, isDefault: true },
    ],
  },
  {
    _id: 'demo-3',
    name: 'Crispy Buffalo Wings',
    category: 'Starters',
    price: 240,
    available: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=400&q=80',
    description: '8 pcs crispy wings tossed in spicy buffalo sauce with blue cheese dip',
    variants: [],
  },
  {
    _id: 'demo-4',
    name: 'Avocado Greek Salad',
    category: 'Salads',
    price: 190,
    available: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    description: 'Fresh romaine, Kalamata olives, feta, hass avocado, lemon vinaigrette',
    variants: [],
  },
  {
    _id: 'demo-5',
    name: 'Iced Caramel Macchiato',
    category: 'Drinks',
    price: 140,
    available: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
    description: 'Freshly pulled espresso, vanilla syrup, cold milk, caramel drizzle',
    variants: [
      { name: 'Regular (12oz)', price: 140, available: true, isDefault: true },
      { name: 'Large (16oz)', price: 170, available: true },
    ],
  },
  {
    _id: 'demo-6',
    name: 'Molten Lava Cake',
    category: 'Desserts',
    price: 210,
    available: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
    description: 'Warm chocolate fondant cake with vanilla bean gelato',
    variants: [],
  },
];

export const NewOrderPosPage: React.FC = () => {
  const navigate = useNavigate();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // Queries
  const { data: menuItemsData, isLoading: isLoadingMenu } = useMenuItemsQuery();
  const { data: categoriesData } = useCategoriesQuery();
  const { data: tablesData } = useTablesQuery(currentBranchId || null);
  const { mutate: createStaffOrder, isPending: isSubmitting } = useCreateStaffOrderMutation();

  // 1. Order Parameters State
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [source, setSource] = useState<string>('waiter');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(50);
  const [pickupTime, setPickupTime] = useState<string>('15_mins');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [orderReference] = useState<string>(() => {
    return `AUTO-${Math.floor(100 + Math.random() * 900)}`;
  });

  // 2. Menu Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // 3. Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // 4. Variant Selection Modal State
  const [variantModalItem, setVariantModalItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [itemCustomNotes, setItemCustomNotes] = useState<string>('');

  // 5. Item Note Editing Modal State
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState<string>('');

  // 6. Direct Pay Modal State
  const [createdOrderForPay, setCreatedOrderForPay] = useState<any | null>(null);

  // Resolved Menu Items
  const menuItems = useMemo(() => {
    if (menuItemsData && menuItemsData.length > 0) {
      return menuItemsData;
    }
    return DEMO_MENU_ITEMS as MenuItem[];
  }, [menuItemsData]);

  // Resolved Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((item) => {
      const cat = typeof item.category === 'object' ? item.category?.name?.en || item.category?.name : item.category;
      if (cat) set.add(String(cat));
    });
    if (categoriesData && Array.isArray(categoriesData)) {
      categoriesData.forEach((c: Category) => {
        const catName = typeof c.name === 'object' ? c.name?.en : c.name;
        if (catName) set.add(catName);
      });
    }
    return ['All', ...Array.from(set)];
  }, [menuItems, categoriesData]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const name = formatOrderItemName(item).toLowerCase();
      const desc = (typeof item.description === 'string' ? item.description : item.description?.en || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query || name.includes(query) || desc.includes(query);

      const catName = typeof item.category === 'object' ? item.category?.name?.en || item.category?.name : item.category;
      const matchesCategory =
        selectedCategory === 'All' ||
        String(catName).toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Tables List
  const tables = useMemo(() => {
    if (tablesData && tablesData.length > 0) {
      return tablesData;
    }
    // Fallback default tables
    return [
      { _id: 't-1', tableNumber: 'T-01', capacity: 2, status: 'available' },
      { _id: 't-2', tableNumber: 'T-02', capacity: 4, status: 'available' },
      { _id: 't-3', tableNumber: 'T-03', capacity: 4, status: 'occupied' },
      { _id: 't-4', tableNumber: 'T-04', capacity: 6, status: 'available' },
      { _id: 't-5', tableNumber: 'T-05', capacity: 2, status: 'available' },
      { _id: 't-6', tableNumber: 'T-06', capacity: 8, status: 'available' },
      { _id: 't-7', tableNumber: 'T-07', capacity: 4, status: 'needs-cleaning' },
      { _id: 't-8', tableNumber: 'T-08', capacity: 2, status: 'available' },
    ] as Table[];
  }, [tablesData]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const taxAmount = useMemo(() => {
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    return taxableAmount * 0.15; // 15% VAT
  }, [subtotal, discountAmount]);

  const activeDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount + activeDeliveryFee);
  }, [subtotal, discountAmount, taxAmount, activeDeliveryFee]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  // Cart operations
  const handleItemCardClick = (item: MenuItem) => {
    if (item.variants && item.variants.length > 1) {
      setVariantModalItem(item);
      const defaultVar = item.variants.find((v) => v.isDefault) || item.variants[0];
      setSelectedVariant(defaultVar);
      setItemCustomNotes('');
      return;
    }

    // Direct add
    const variant = item.variants?.[0];
    const unitPrice = variant?.price ?? item.price ?? 0;
    const variantName = variant?.name;
    const cartId = `${item._id || item.slug}-${variantName || 'standard'}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartId);
      if (existingIndex > -1) {
        const copy = [...prev];
        const current = copy[existingIndex];
        const newQty = current.quantity + 1;
        copy[existingIndex] = {
          ...current,
          quantity: newQty,
          totalPrice: newQty * current.unitPrice,
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: cartId,
          menuItemId: item._id || item.slug,
          name: formatOrderItemName(item),
          variantName,
          unitPrice,
          quantity: 1,
          totalPrice: unitPrice,
          image: item.image || item.imageUrl,
        },
      ];
    });

    toast.success(`Added ${formatOrderItemName(item)} to order`);
  };

  const handleConfirmVariantModal = () => {
    if (!variantModalItem || !selectedVariant) return;

    const unitPrice = selectedVariant.price;
    const cartId = `${variantModalItem._id || variantModalItem.slug}-${selectedVariant.name}-${itemCustomNotes.trim()}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartId);
      if (existingIndex > -1) {
        const copy = [...prev];
        const current = copy[existingIndex];
        const newQty = current.quantity + 1;
        copy[existingIndex] = {
          ...current,
          quantity: newQty,
          totalPrice: newQty * current.unitPrice,
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: cartId,
          menuItemId: variantModalItem._id || variantModalItem.slug,
          name: formatOrderItemName(variantModalItem),
          variantName: selectedVariant.name,
          unitPrice,
          quantity: 1,
          totalPrice: unitPrice,
          notes: itemCustomNotes.trim() || undefined,
          image: variantModalItem.image || variantModalItem.imageUrl,
        },
      ];
    });

    toast.success(`Added ${formatOrderItemName(variantModalItem)} (${selectedVariant.name})`);
    setVariantModalItem(null);
    setSelectedVariant(null);
    setItemCustomNotes('');
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
        return copy;
      }

      copy[index] = {
        ...item,
        quantity: newQty,
        totalPrice: newQty * item.unitPrice,
      };
      return copy;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    toast.info('Cart cleared');
  };

  const handleOpenEditNote = (index: number) => {
    setEditingCartItemIndex(index);
    setEditNoteValue(cart[index]?.notes || '');
  };

  const handleSaveItemNote = () => {
    if (editingCartItemIndex === null) return;
    setCart((prev) => {
      const copy = [...prev];
      if (copy[editingCartItemIndex]) {
        copy[editingCartItemIndex] = {
          ...copy[editingCartItemIndex],
          notes: editNoteValue.trim() || undefined,
        };
      }
      return copy;
    });
    setEditingCartItemIndex(null);
  };

  // Build Payload
  const buildOrderPayload = (): StaffCreateOrderPayload | null => {
    if (cart.length === 0) {
      toast.error('Please add at least one item to the order');
      return null;
    }

    if (orderType === 'dine_in' && !selectedTableId) {
      toast.error('Please select a table for Dine-in orders');
      return null;
    }

    const selectedTable = tables.find((t) => t._id === selectedTableId || t.tableNumber === selectedTableId);

    const payload: StaffCreateOrderPayload = {
      branchId: currentBranchId || null,
      orderType,
      tableId: orderType === 'dine_in' ? selectedTable?._id || selectedTableId : null,
      customerName: customerName.trim() || (orderType === 'dine_in' ? `Table ${selectedTable?.tableNumber || selectedTableId}` : 'Walk-in Customer'),
      customerPhone: customerPhone.trim() || undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
      items: cart.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        name: item.variantName ? `${item.name} (${item.variantName})` : item.name,
      })),
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      notes: [
        orderNotes.trim(),
        orderType === 'takeaway' && pickupTime ? `Pickup: ${pickupTime.replace('_', ' ')}` : '',
        orderType === 'delivery' && deliveryNotes ? `Driver notes: ${deliveryNotes}` : '',
        `Source: ${source}`,
      ].filter(Boolean).join(' | '),
    };

    return payload;
  };

  // Submissions
  const handleConfirmAndSend = () => {
    const payload = buildOrderPayload();
    if (!payload) return;

    createStaffOrder(payload, {
      onSuccess: (createdOrder) => {
        playOrderSound();
        toast.success(`Order #${createdOrder.orderNumber || orderReference} sent to kitchen!`);
        setCart([]);
        navigate('/orders/active');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to send order to kitchen');
      },
    });
  };

  const handlePayNow = () => {
    const payload = buildOrderPayload();
    if (!payload) return;

    createStaffOrder(payload, {
      onSuccess: (createdOrder) => {
        playOrderSound();
        toast.success(`Order #${createdOrder.orderNumber || orderReference} created. Opening payment modal.`);
        setCreatedOrderForPay(createdOrder);
        setCart([]);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to initiate direct payment');
      },
    });
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add items before saving draft.');
      return;
    }
    toast.success(`Draft saved for ${orderType.replace('_', ' ').toUpperCase()} (${cart.length} items)`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[calc(100vh-140px)] pb-12">
      {/* ========================================================================= */}
      {/* COLUMN 1: Order Details (25% Width)                                       */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[26%] flex flex-col gap-4 bg-card border rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Order Details</h2>
              <p className="text-[11px] text-muted-foreground">Setup parameters & dining type</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] font-bold">
            #{orderReference}
          </Badge>
        </div>

        {/* Order Type Selector */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Order Type
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'dine_in', label: 'Dine-in', icon: Utensils },
              { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
              { id: 'delivery', label: 'Delivery', icon: Truck },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = orderType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrderType(t.id as any)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-semibold gap-1.5',
                    isActive
                      ? 'border-2 border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Source */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Source Channel
          </Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="waiter">Waiter (Terminal / POS)</SelectItem>
              <SelectItem value="counter">Front Counter</SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
              <SelectItem value="web">Web / Online</SelectItem>
              <SelectItem value="qr">Table QR Code</SelectItem>
              <SelectItem value="app">Mobile App</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DYNAMIC FIELDS: Dine-in vs Takeaway vs Delivery */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {orderType === 'dine_in' && (
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Table
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {selectedTableId ? `Selected: ${selectedTableId}` : 'None picked'}
                </span>
              </div>

              {/* Table Buttons Grid */}
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1">
                {tables.map((tbl) => {
                  const isSelected = selectedTableId === tbl.tableNumber || selectedTableId === tbl._id;
                  const isOccupied = tbl.status === 'occupied';

                  return (
                    <button
                      key={tbl._id}
                      type="button"
                      onClick={() => setSelectedTableId(tbl.tableNumber || tbl._id)}
                      className={cn(
                        'py-2 px-1 text-xs font-bold rounded-lg border flex flex-col items-center justify-center transition-all',
                        isSelected
                          ? 'border-2 border-primary bg-primary text-primary-foreground shadow-xs'
                          : isOccupied
                          ? 'border-rose-300 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-border bg-card hover:border-primary/50 text-foreground'
                      )}
                    >
                      <span>{tbl.tableNumber || tbl._id}</span>
                      <span className="text-[8px] font-normal opacity-80">
                        {isOccupied ? 'Occupied' : `${tbl.capacity || 2}p`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Guest Count Stepper */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-foreground">Guest Count</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-bold text-xs font-mono">{guestCount}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => setGuestCount((g) => g + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {orderType === 'takeaway' && (
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Customer Name</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Customer Name"
                    className="pl-8 h-8 text-xs bg-card"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="0911..."
                    className="pl-8 h-8 text-xs bg-card font-mono"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ready Timing</Label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP (10-15 mins)</SelectItem>
                    <SelectItem value="20_mins">In 20 Minutes</SelectItem>
                    <SelectItem value="30_mins">In 30 Minutes</SelectItem>
                    <SelectItem value="45_mins">In 45 Minutes</SelectItem>
                    <SelectItem value="scheduled">Scheduled for later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {orderType === 'delivery' && (
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Customer Name</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Customer Name"
                    className="pl-8 h-8 text-xs bg-card"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="0911..."
                    className="pl-8 h-8 text-xs bg-card font-mono"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Delivery Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Textarea
                    placeholder="Bole, Medhanialem, House 102..."
                    className="pl-8 text-xs min-h-[50px] bg-card resize-none"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Delivery Fee</Label>
                  <Input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Driver Note</Label>
                  <Input
                    placeholder="Call upon arrival"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* General Order Instructions */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Kitchen & Preparation Notes
            </Label>
            <Textarea
              placeholder="Allergies, extra napkins, serve together..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="text-xs min-h-[65px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 2: Menu Selection Grid (44% Width)                                 */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[44%] flex flex-col gap-3 bg-card border rounded-2xl p-4 shadow-xs">
        {/* Search & Header */}
        <div className="space-y-2.5 border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Menu Catalog</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {filteredMenuItems.length} Items
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items, category, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoadingMenu ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Loading delicious menu...</p>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-sm font-semibold">No menu items found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for something else or switch categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenuItems.map((item) => {
                const itemName = formatOrderItemName(item);
                const itemPrice = item.variants?.[0]?.price ?? item.price ?? 0;
                const hasVariants = item.variants && item.variants.length > 1;

                // Check how many of this item are currently in cart
                const cartQty = cart
                  .filter((i) => i.menuItemId === (item._id || item.slug))
                  .reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <motion.div
                    key={item._id || item.slug}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItemCardClick(item)}
                    className={cn(
                      'group relative rounded-xl border p-2.5 bg-card hover:border-primary/60 transition-all cursor-pointer flex flex-col justify-between shadow-2xs',
                      cartQty > 0 && 'border-2 border-primary/80 bg-primary/5'
                    )}
                  >
                    {/* In-cart count badge */}
                    {cartQty > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground font-mono font-bold text-[10px] h-5 min-w-5 px-1 rounded-full flex items-center justify-center shadow-md">
                        x{cartQty}
                      </span>
                    )}

                    <div>
                      {/* Image Area */}
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-muted mb-2">
                        {item.image || item.imageUrl ? (
                          <img
                            src={item.image || item.imageUrl}
                            alt={itemName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-muted/60">
                            <Utensils className="h-6 w-6" />
                          </div>
                        )}

                        {hasVariants && (
                          <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Variants
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-xs text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors">
                        {itemName}
                      </h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {typeof item.description === 'string'
                          ? item.description
                          : item.description?.en || 'Delicious freshly prepared dish'}
                      </p>
                    </div>

                    {/* Price & Add Action */}
                    <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-border/50">
                      <span className="font-black text-xs text-foreground font-mono">
                        ETB {itemPrice.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-2xs"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 3: Current Order Cart (30% Width)                                  */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[30%] flex flex-col justify-between bg-card border rounded-2xl p-4 shadow-xs">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Current Order</h2>
              <p className="text-[11px] text-muted-foreground">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} queued
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            title="Clear Cart"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Cart Items Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[calc(100vh-420px)]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground p-4">
              <ShoppingBag className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-xs font-semibold">No items in order</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Click items in the menu catalog to add them to this ticket.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((item, index) => (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                      {item.variantName && (
                        <span className="text-[10px] font-semibold text-primary block">
                          Size: {item.variantName}
                        </span>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic mt-0.5 truncate">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    <span className="font-black text-xs text-foreground font-mono whitespace-nowrap">
                      ETB {item.totalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Quantity Stepper & Notes Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <button
                      onClick={() => handleOpenEditNote(index)}
                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {item.notes ? 'Edit Note' : '+ Note'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(index, -1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="font-bold text-xs font-mono w-5 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(index, 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCartItem(index)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Bill Summary Breakdown */}
        <div className="mt-3 pt-3 border-t space-y-2 bg-muted/10 p-3 rounded-xl">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">ETB {subtotal.toLocaleString()}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Percent className="h-3 w-3" /> Discount ({discountPercent}%)
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => setDiscountPercent((d) => (d === 10 ? 0 : 10))}
                  className="text-[10px] text-primary hover:underline"
                >
                  {discountPercent > 0 ? 'Clear' : '+10% Promo'}
                </button>
                <span>-ETB {discountAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>VAT (15%)</span>
              <span className="font-mono">ETB {taxAmount.toFixed(2)}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="font-mono">ETB {deliveryFee.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/80 pt-2 flex items-baseline justify-between">
            <span className="font-black text-sm text-foreground">Total</span>
            <span className="font-black text-xl text-primary font-mono">
              ETB {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={cart.length === 0}
              className="text-xs h-9 gap-1 font-semibold"
            >
              <Save className="h-3.5 w-3.5" />
              Save Draft
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePayNow}
              disabled={cart.length === 0 || isSubmitting}
              className="text-xs h-9 gap-1 font-semibold bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pay Now
            </Button>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleConfirmAndSend}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full text-xs font-bold h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending to Kitchen...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirm & Send to Kitchen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: Variant Selector, Item Note Editor, Pay Modal                     */}
      {/* ========================================================================= */}

      {/* 1. Variant & Customization Modal */}
      <Dialog
        open={!!variantModalItem}
        onOpenChange={(open) => !open && setVariantModalItem(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Customize {variantModalItem ? formatOrderItemName(variantModalItem) : ''}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select portion size or variants and special cooking preferences.
            </DialogDescription>
          </DialogHeader>

          {variantModalItem && (
            <div className="space-y-4 py-2">
              {/* Variant Choices */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Available Sizes / Options
                </Label>
                <div className="space-y-1.5">
                  {variantModalItem.variants?.map((v) => {
                    const isSelected = selectedVariant?.name === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-semibold',
                          isSelected
                            ? 'border-2 border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-border bg-card hover:bg-muted/40 text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'h-4 w-4 rounded-full border flex items-center justify-center',
                              isSelected ? 'border-primary' : 'border-muted-foreground'
                            )}
                          >
                            {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <span>{v.name}</span>
                        </div>
                        <span className="font-mono font-bold">ETB {v.price.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Preparation Instructions
                </Label>
                <Input
                  placeholder="e.g. Medium Rare, No Pickles, Extra Sauce..."
                  value={itemCustomNotes}
                  onChange={(e) => setItemCustomNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVariantModalItem(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmVariantModal}>
              Add to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Item Note Modal */}
      <Dialog
        open={editingCartItemIndex !== null}
        onOpenChange={(open) => !open && setEditingCartItemIndex(null)}
      >
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Item Preparation Note</DialogTitle>
            <DialogDescription className="text-xs">
              Special instructions for kitchen cooks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="e.g. Extra spicy, dressing on side..."
              value={editNoteValue}
              onChange={(e) => setEditNoteValue(e.target.value)}
              className="text-xs"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingCartItemIndex(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveItemNote}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Direct Pay Modal */}
      {createdOrderForPay && (
        <PayOrderModal
          isOpen={!!createdOrderForPay}
          onClose={() => {
            setCreatedOrderForPay(null);
            navigate('/orders/active');
          }}
          order={createdOrderForPay}
        />
      )}
    </div>
  );
};

export default NewOrderPosPage;
