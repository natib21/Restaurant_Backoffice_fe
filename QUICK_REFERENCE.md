# ⚡ Quick Reference - Feedback & Campaign Integration

## URLs to Visit

### Feedback & Reviews
```
http://localhost:5173/customers/feedback
```

### Marketing Campaigns
```
http://localhost:5173/marketing/campaigns
```

---

## API Hooks Quick Lookup

### Feedback
```typescript
// Customer submits feedback
import { useSubmitFeedback } from '@/api/Queries/feedbackQueries';
const { mutate } = useSubmitFeedback();

// Staff: Get all feedback
import { useGetFeedbackList } from '@/api/Queries/feedbackQueries';
const { data } = useGetFeedbackList({ status: 'new' });

// Staff: Get single feedback
import { useGetFeedbackDetails } from '@/api/Queries/feedbackQueries';
const { data } = useGetFeedbackDetails(feedbackId);

// Staff: Respond to feedback
import { useRespondToFeedback } from '@/api/Queries/feedbackQueries';
const { mutate } = useRespondToFeedback();

// Get stats
import { useGetFeedbackStats } from '@/api/Queries/feedbackQueries';
const { data } = useGetFeedbackStats();
```

### Campaigns
```typescript
// Create campaign
import { useCreateCampaign } from '@/api/Queries/campaignQueries';
const { mutate } = useCreateCampaign();

// List campaigns
import { useGetCampaignsList } from '@/api/Queries/campaignQueries';
const { data } = useGetCampaignsList();

// Get campaign details
import { useGetCampaignDetails } from '@/api/Queries/campaignQueries';
const { data } = useGetCampaignDetails(campaignId);

// Preview audience
import { usePreviewCampaignAudience } from '@/api/Queries/campaignQueries';
const { mutate } = usePreviewCampaignAudience();

// Send campaign
import { useSendCampaign } from '@/api/Queries/campaignQueries';
const { mutate } = useSendCampaign();

// Delete campaign
import { useDeleteCampaign } from '@/api/Queries/campaignQueries';
const { mutate } = useDeleteCampaign();
```

---

## Common Tasks

### Submit Customer Feedback
```typescript
const { mutate: submitFeedback } = useSubmitFeedback();

submitFeedback({
  rating: 5,
  comment: "Great service!",
  categories: ["service"],
  channel: "app",
  isPublic: true
});
```

### List New Feedback (Staff)
```typescript
const { data } = useGetFeedbackList({
  status: 'new',
  branchId: 'branch-id',
  limit: 10,
  page: 1
});

const feedbackList = data?.data || [];
```

### Respond to Feedback
```typescript
const { mutate: respond } = useRespondToFeedback();

respond({
  feedbackId: 'fb-123',
  data: {
    status: 'resolved',
    responseText: 'Thank you for your feedback!',
    isPublic: true
  }
});
```

### Create Campaign
```typescript
const { mutate: create } = useCreateCampaign();

create({
  name: 'Summer Sale',
  message: '20% off all items!',
  imageUrl: 'https://...',
  audience: {
    loyaltyTier: ['gold', 'silver'],
    minSpent: 5000
  },
  channels: ['in-app', 'email']
});
```

### Send Campaign
```typescript
const { mutate: send } = useSendCampaign();

send('campaign-id-123');
```

### Delete Campaign
```typescript
const { mutate: delete } = useDeleteCampaign();

delete('campaign-id-123');
```

---

## File Locations

```
src/api/Queries/
├── feedbackQueries.ts       - All feedback hooks
├── campaignQueries.ts       - All campaign hooks

src/features/Customer/pages/
└── CustomerFeedbackPage.tsx - Feedback UI

src/features/Marketing/pages/
└── CampaignPage.tsx         - Campaign UI

src/router/
└── Routers.tsx              - Routes configuration
```

---

## Environment Setup

### Required Backend Running
```bash
# Backend must be running at:
http://localhost:8000
```

### API Base URL
```typescript
// Used in src/lib/api.ts
const BASE_URL = 'http://localhost:8000/api';
```

---

## Error Handling

All mutations handle errors automatically with toast notifications:

```typescript
try {
  await mutation.mutateAsync(data);
  // Success toast shown automatically
} catch (error) {
  // Error toast shown automatically
}
```

---

## Loading States

All queries provide `isLoading` state:

```typescript
const { data, isLoading, error } = useGetFeedbackList();

if (isLoading) return <Skeleton />;
if (error) return <Error />;
return <FeedbackList data={data} />;
```

---

## Polling/Refetching

Manually refetch data:

```typescript
const { refetch } = useGetFeedbackList();

// Refetch on button click
<Button onClick={() => refetch()}>Refresh</Button>
```

---

## Types Reference

### Feedback Type
```typescript
{
  _id: string;
  rating: number;
  comment?: string;
  categories?: string[];
  channel?: string;
  order?: string;
  images?: string[];
  isPublic?: boolean;
  status?: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
  customer?: {
    _id: string;
    name: string;
    phone: string;
  };
  merchantResponse?: {
    responseText: string;
    respondedBy: string;
    respondedAt: string;
  };
}
```

### Campaign Type
```typescript
{
  _id: string;
  name: string;
  message: string;
  imageUrl?: string;
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  stats?: {
    totalRecipients: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}
```

---

## Authentication

### Headers Automatically Added
```typescript
// JWT auth for staff
Authorization: Bearer {jwt_token}

// Session token for customers
Authorization: Bearer {session_token}
```

---

## Debugging Tips

### Check API calls in DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by `/api`
4. Click on request to see details
5. Check Request/Response tabs

### Check React Query state
1. Install React Query DevTools
2. Look for component state
3. Verify data is being cached

### Check error messages
1. Look at toast notifications
2. Check browser console for errors
3. Check Network tab response

---

## Common Issues

**Issue**: Data not loading
- ✅ Check backend is running on port 8000
- ✅ Check API endpoint URL is correct
- ✅ Check auth token is valid

**Issue**: Campaign not sending
- ✅ Check audience criteria is valid
- ✅ Check campaign status is 'draft'
- ✅ Verify backend has campaign send endpoint

**Issue**: Feedback response not showing
- ✅ Refetch the feedback
- ✅ Check response was actually sent
- ✅ Check backend updated the feedback

---

## Performance Tips

1. **Use React Query cache** - Data is automatically cached
2. **Pagination** - Use `limit` and `page` parameters
3. **Filtering** - Filter on backend, not frontend
4. **Lazy loading** - Load feedback/campaigns on demand

---

## Accessibility

All pages include:
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Loading/error states

---

## Testing

### Unit Tests
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useGetFeedbackList } from '@/api/Queries/feedbackQueries';

test('should fetch feedback', async () => {
  const { result } = renderHook(() => useGetFeedbackList());
  // Assert...
});
```

### Integration Tests
```typescript
import { render, screen } from '@testing-library/react';
import CustomerFeedbackPage from '@/features/Customer/pages/CustomerFeedbackPage';

test('should display feedback list', () => {
  render(<CustomerFeedbackPage />);
  expect(screen.getByText(/Feedback/)).toBeInTheDocument();
});
```

---

**Status**: ✅ Ready for use!

For more details, see `INTEGRATION_SUMMARY.md`
