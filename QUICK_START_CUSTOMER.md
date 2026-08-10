# Customer Features - Quick Start Guide

## 🚀 Quick Access

### Sidebar Navigation
```
Customer Section (in sidebar)
├── Customer List          → /customers/list
├── Customer Groups        → /customers/groups
├── Feedback & Reviews     → /customers/feedback
├── Loyalty Members        → (coming soon)
└── Marketing              → (coming soon)
```

---

## 📋 Common Tasks

### 1. View All Customers
```typescript
// Page: CustomerListPage
// Route: /customers/list
// Features: Search, Filter, Stats Overview
```

### 2. View Customer Details
```typescript
// Page: CustomerDetailPage
// Route: /customers/:id
// Features: Edit info, Add tags, Send gifts, View stats
```

### 3. Send Gift to Customer
```typescript
// On Customer Detail Page → Gifts Tab
const giftData = {
  name: "Free Coffee",
  type: "free_item",
  value: 1,
  expiresInDays: 30,
  reason: "Loyalty reward"
};
// Click "Send Gift" button
```

### 4. Add Customer Tag
```typescript
// On Customer Detail Page → Tags & Notes Tab
// Type tag name (e.g., "VIP")
// Click add button
```

### 5. Respond to Feedback
```typescript
// Page: CustomerFeedbackPage
// Route: /customers/feedback
// Select feedback → Type response → Send
```

---

## 🔌 API Hook Usage

### Get Customer List
```typescript
import { useGetCustomersList } from '@/api/Queries/customerQueries';

function MyComponent() {
  const { data, isLoading, error } = useGetCustomersList();
  const customers = data?.data?.customers || [];
  
  return <div>{/* render customers */}</div>;
}
```

### Get Customer Details
```typescript
import { useGetCustomerDetails } from '@/api/Queries/customerQueries';

function CustomerProfile({ customerId }: { customerId: string }) {
  const { data, isLoading } = useGetCustomerDetails(customerId);
  const customer = data?.data?.customer;
  
  return <div>{customer?.fullName}</div>;
}
```

### Update Customer
```typescript
import { useStaffUpdateCustomer } from '@/api/Queries/customerQueries';

function EditCustomer() {
  const updateMutation = useStaffUpdateCustomer();
  
  const handleUpdate = async () => {
    await updateMutation.mutateAsync({
      customerId: 'cus123',
      updateData: {
        fullName: 'John Doe',
        phone: '+251912345678'
      }
    });
  };
  
  return <button onClick={handleUpdate}>Update</button>;
}
```

### Send Gift
```typescript
import { useStaffGiveGift } from '@/api/Queries/customerQueries';

function GiftButton() {
  const giftMutation = useStaffGiveGift();
  
  const handleGift = async () => {
    await giftMutation.mutateAsync({
      customerId: 'cus123',
      giftData: {
        name: 'Free Dessert',
        type: 'free_item',
        value: 1,
        expiresInDays: 7,
        reason: 'Birthday gift'
      }
    });
  };
  
  return <button onClick={handleGift}>Send Gift</button>;
}
```

### Add Tag/Note
```typescript
import { useStaffAddTagNote } from '@/api/Queries/customerQueries';

function TagManager() {
  const tagMutation = useStaffAddTagNote();
  
  const addTag = async () => {
    await tagMutation.mutateAsync({
      customerId: 'cus123',
      tagOrNote: { tag: 'VIP' }
    });
  };
  
  const addNote = async () => {
    await tagMutation.mutateAsync({
      customerId: 'cus123',
      tagOrNote: { note: 'Prefers window seat' }
    });
  };
  
  return (
    <>
      <button onClick={addTag}>Add Tag</button>
      <button onClick={addNote}>Add Note</button>
    </>
  );
}
```

---

## 🎨 UI Components Used

### From Shadcn UI:
- `Card` - Container for content sections
- `Button` - All actions and navigation
- `Input` - Search and form inputs
- `Badge` - Status indicators and tags
- `Tabs` - Organize content (Loyalty, Tags, Gifts)
- `Skeleton` - Loading states
- `Select` - Dropdowns
- `Textarea` - Notes and feedback

### Icons (Lucide React):
```typescript
import {
  User,          // Customer profile
  Users,         // Customer list
  Gift,          // Loyalty gifts
  Tag,           // Tags
  Star,          // Ratings
  MessageSquare, // Feedback
  Phone,         // Contact
  Mail,          // Email
  ShoppingBag,   // Orders
  Calendar,      // Dates
  // ... and more
} from 'lucide-react';
```

---

## 🔧 Configuration

### API Base URL
```typescript
// .env file
VITE_API_URL=http://localhost:8000/api
```

### API Endpoints
```typescript
// All customer endpoints are at:
/api/v1/customer/*

// Examples:
POST   /api/v1/customer/login
GET    /api/v1/customer/crm          // List all
GET    /api/v1/customer/:id          // Get one
PATCH  /api/v1/customer/:id          // Update
DELETE /api/v1/customer/:id          // Delete
POST   /api/v1/customer/:id/gift     // Send gift
PATCH  /api/v1/customer/:id/tag      // Add tag/note
```

---

## 💡 Tips & Best Practices

### 1. Always Check Loading State
```typescript
const { data, isLoading, error } = useGetCustomersList();

if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage />;
```

### 2. Use Toast for Feedback
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Customer updated successfully"
});
```

### 3. Invalidate Queries After Mutations
```typescript
// Automatically handled in hooks
// Queries are invalidated after successful mutations
```

### 4. Handle Empty States
```typescript
if (customers.length === 0) {
  return (
    <EmptyState 
      icon={<Users />}
      message="No customers found"
    />
  );
}
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot read property 'customer' of undefined"
```typescript
// ❌ Wrong
const customer = data.data.customer;

// ✅ Correct
const customer = data?.data?.customer;
```

### Issue: Type errors with map()
```typescript
// ❌ Wrong
customers.map((customer, index) => ...)

// ✅ Correct - Add types
customers.map((customer: any, index: number) => ...)
```

### Issue: Customer data not updating
```typescript
// Solution: Refetch after mutation
const { refetch } = useGetCustomerDetails(id);

await updateMutation.mutateAsync({...});
refetch(); // Force refresh
```

---

## 📊 Data Structure Reference

### Customer Object
```typescript
{
  _id: string;
  fullName: string;
  phone: string;
  source: 'guest' | 'qr' | 'app';
  lastSeen: string;
  loyalty: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold';
    gifts: any[];
  };
  tags: string[];
  notes: string[];
  stats: {
    totalOrders: number;
    totalSpent: number;
  };
}
```

### API Response Format
```typescript
{
  status: 'success';
  message?: string;
  data?: {
    customer?: Customer;
    customers?: Customer[];
  };
  results?: number;
  stats?: {
    totalSpent: number;
    visits: number;
  };
}
```

---

## 🎯 Keyboard Shortcuts (Future Enhancement)

```
Cmd/Ctrl + K    → Search customers
Cmd/Ctrl + N    → New customer
Cmd/Ctrl + E    → Edit mode
Escape          → Close modals
```

---

## 📱 Mobile Responsive

All customer pages are fully responsive:
- ✅ Mobile sidebar (hamburger menu)
- ✅ Stacked cards on mobile
- ✅ Touch-friendly buttons
- ✅ Scrollable tables
- ✅ Responsive forms

---

## ⚡ Performance Tips

1. **Lazy Loading**: Pages load only when accessed
2. **Query Caching**: React Query caches for 10 minutes
3. **Optimistic Updates**: UI updates immediately
4. **Debounced Search**: Search waits for user to stop typing
5. **Pagination**: Ready for implementation when needed

---

## 🔐 Security Notes

- ✅ JWT authentication for all staff endpoints
- ✅ Session tokens for customer endpoints
- ✅ Automatic token refresh
- ✅ 401 redirects to login
- ✅ CORS enabled with credentials

---

## 📞 Support

**Need Help?**
1. Check `CUSTOMER_INTEGRATION_COMPLETE.md` for detailed docs
2. Review TypeScript types in `customerQueries.ts`
3. Check browser console for errors
4. Inspect network tab in DevTools

---

**Happy Coding! 🎉**