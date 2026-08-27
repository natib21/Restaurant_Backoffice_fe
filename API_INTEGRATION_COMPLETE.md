# ✅ API Integration Complete - Feedback & Campaign Endpoints

## Overview

Successfully integrated backend Feedback and Campaign endpoints into the frontend. All customer management features now have full API integration.

---

## Integrated Endpoints

### 1. Feedback API Integration ✅

**File**: `src/api/Queries/feedbackQueries.ts`

**Hooks Implemented**:

#### Customer Feedback Submission
- `useSubmitFeedback()` - Submit feedback
  - `POST /api/v1/feedback`
  - Auth: Table session Bearer token (QR)
  - Request body:
    ```json
    {
      "rating": 5,
      "comment": "Great food and service!",
      "categories": ["food_quality", "service"],
      "channel": "app",
      "order": "650f1c2b5b1f5d3aabcd1234",
      "images": ["https://.../photo1.jpg"],
      "isPublic": true
    }
    ```

#### Staff Feedback Management
- `useGetFeedbackList(params)` - List all feedback
  - `GET /api/v1/feedback`
  - Query params: `status`, `branchId`, `rating`, `page`, `limit`
  - Auth: JWT staff auth (admin/manager)

- `useGetFeedbackDetails(feedbackId)` - Get feedback details
  - `GET /api/v1/feedback/:id`
  - Auth: JWT staff auth

- `useRespondToFeedback()` - Respond to feedback
  - `PATCH /api/v1/feedback/:id/response`
  - Auth: JWT staff auth
  - Request body:
    ```json
    {
      "status": "resolved",
      "responseText": "Thank you for your feedback!",
      "isPublic": true,
      "flaggedReason": null
    }
    ```

- `useGetFeedbackStats()` - Get feedback statistics
  - Calculates: total, average rating, positive/neutral/negative counts, response rate

**Frontend Page**: `src/features/Customer/pages/CustomerFeedbackPage.tsx`
- Real-time feedback list with search and filtering
- Staff response interface
- Feedback analytics dashboard
- Status tracking (new, reviewed, resolved)

---

### 2. Campaign API Integration ✅

**File**: `src/api/Queries/campaignQueries.ts`

**Hooks Implemented**:

#### Campaign CRUD
- `useCreateCampaign()` - Create new campaign
  - `POST /api/v1/campaigns`
  - Auth: JWT staff auth
  - Request body:
    ```json
    {
      "name": "Summer Promotion",
      "message": "20% off all items!",
      "imageUrl": "https://.../banner.jpg",
      "channels": ["in-app", "email", "sms"],
      "audience": {
        "loyaltyTier": ["gold", "silver"],
        "minSpent": 5000,
        "maxSpent": 50000,
        "tags": ["regular_customer"]
      },
      "scheduledFor": "2026-08-15T10:00:00Z"
    }
    ```

- `useGetCampaignsList(params)` - List campaigns
  - `GET /api/v1/campaigns`
  - Query params: `status`, `branch`, `page`, `limit`
  - Auth: JWT staff auth

- `useGetCampaignDetails(campaignId)` - Get campaign details
  - `GET /api/v1/campaigns/:id`
  - Auth: JWT staff auth

- `useUpdateCampaign()` - Update campaign
  - Supports draft editing before sending

- `useDeleteCampaign()` - Delete campaign
  - Only works on draft campaigns

#### Campaign Execution
- `usePreviewCampaignAudience()` - Preview target audience
  - `POST /api/v1/campaigns/:id/preview-audience`
  - Returns count and sample customers matching criteria

- `useSendCampaign()` - Send campaign
  - `POST /api/v1/campaigns/:id/send`
  - Sends to all customers matching audience criteria

**Frontend Page**: `src/features/Marketing/pages/CampaignPage.tsx`
- Campaign creation with audience targeting
- Campaign status tracking (draft, scheduled, sent)
- Campaign statistics (recipients, delivered, opened, clicked)
- Bulk operations (send, delete)
- Audience preview before sending

---

## Updated Features

### Customer Feedback Page
**Location**: `/customers/feedback`

✅ **Features Implemented**:
- Real-time feedback list with API integration
- Advanced filtering (status, channel)
- Customer feedback details view
- Staff response interface
- Response tracking (new, reviewed, resolved)
- Feedback analytics dashboard
  - Total feedback count
  - Average rating
  - Sentiment breakdown (positive/neutral/negative)
  - Response rate percentage
- Search functionality
- Error handling with retry

### Marketing Campaigns Page
**Location**: `/marketing/campaigns`

✅ **Features Implemented**:
- Campaign creation form
- Campaign CRUD operations
- Campaign status tracking
- Audience targeting by:
  - Loyalty tier (bronze, silver, gold)
  - Spending amount
  - Customer tags
  - Last order date
- Campaign statistics dashboard
- Send campaign to customers
- Draft/Schedule/Send workflow
- Sidebar navigation link

---

## Data Models

### Feedback Response
```typescript
{
  _id: string;
  rating: number; // 1-5
  comment?: string;
  categories?: string[]; // ['food_quality', 'service', etc]
  channel?: string; // 'app', 'in-store', 'website', 'qr'
  order?: string; // Order ID reference
  images?: string[]; // Image URLs
  isPublic?: boolean;
  status?: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
  customer?: {
    _id: string;
    name: string;
    phone: string;
  };
  branch?: string;
  merchantResponse?: {
    responseText: string;
    respondedBy: string;
    respondedAt: string;
  };
  flaggedReason?: string;
}
```

### Campaign
```typescript
{
  _id: string;
  name: string;
  message: string;
  imageUrl?: string;
  audience?: {
    loyaltyTier?: string[];
    minSpent?: number;
    maxSpent?: number;
    orderCount?: number;
    tags?: string[];
    lastSeenDays?: number;
    excludeTags?: string[];
    customerGroups?: string[];
  };
  branch?: string;
  channels?: string[]; // ['email', 'sms', 'in-app', 'push']
  status: 'draft' | 'scheduled' | 'sent' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  expiresAt?: string;
  sentAt?: string;
  stats?: {
    totalRecipients: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}
```

---

## File Structure

### New Files Created
```
src/api/Queries/
  ├── feedbackQueries.ts          ✅ NEW
  └── campaignQueries.ts          ✅ NEW

src/features/
  ├── Customer/pages/
  │   └── CustomerFeedbackPage.tsx (UPDATED - now with API)
  └── Marketing/
      └── pages/
          └── CampaignPage.tsx    ✅ NEW
```

### Files Updated
```
src/router/Routers.tsx
  - Added /marketing/campaigns route
  - Imported CampaignPage

src/components/Layout/SideBar/SidebarNavItems.tsx
  - Updated Marketing link to /marketing/campaigns
```

---

## API Authentication

### Feedback
- **Submit** (Customer): Bearer token from table session (QR)
  - Header: `Authorization: Bearer {sessionToken}`
- **List/Respond** (Staff): JWT auth
  - Header: `Authorization: Bearer {jwtToken}`
  - Required roles: `admin`, `manager`

### Campaigns
- **All Operations** (Staff): JWT auth
  - Header: `Authorization: Bearer {jwtToken}`
  - Required roles: `admin`, `manager`

---

## Integration Checklist

✅ **Backend Endpoints**
- ✅ Feedback submit endpoint
- ✅ Feedback list endpoint
- ✅ Feedback details endpoint
- ✅ Feedback response endpoint
- ✅ Campaign create endpoint
- ✅ Campaign list endpoint
- ✅ Campaign details endpoint
- ✅ Campaign preview audience endpoint
- ✅ Campaign send endpoint

✅ **Frontend API Hooks**
- ✅ useSubmitFeedback
- ✅ useGetFeedbackList
- ✅ useGetFeedbackDetails
- ✅ useRespondToFeedback
- ✅ useGetFeedbackStats
- ✅ useCreateCampaign
- ✅ useGetCampaignsList
- ✅ useGetCampaignDetails
- ✅ useUpdateCampaign
- ✅ useDeleteCampaign
- ✅ usePreviewCampaignAudience
- ✅ useSendCampaign

✅ **Frontend Pages**
- ✅ CustomerFeedbackPage (connected to real API)
- ✅ CampaignPage (connected to real API)

✅ **Navigation**
- ✅ Sidebar updated with campaign link
- ✅ Routes configured
- ✅ Proper route guards (auth)

✅ **UI/UX**
- ✅ Loading states (Skeleton loaders)
- ✅ Error handling with retry
- ✅ Toast notifications for actions
- ✅ Search and filtering
- ✅ Status tracking
- ✅ Real-time stats

---

## Testing Recommendations

### Feedback Testing
1. ✅ Test feedback submission endpoint
2. ✅ Test feedback list retrieval with filters
3. ✅ Test staff response to feedback
4. ✅ Test stats calculation
5. ✅ Test feedback search

### Campaign Testing
1. ✅ Test campaign creation with different audiences
2. ✅ Test audience preview
3. ✅ Test campaign send
4. ✅ Test campaign status tracking
5. ✅ Test campaign deletion

### Error Testing
1. ✅ Test with invalid auth tokens
2. ✅ Test with missing required fields
3. ✅ Test network error handling
4. ✅ Test empty responses

---

## How to Use

### Submit Feedback (Customer)
```typescript
const { mutate } = useSubmitFeedback();

mutate({
  rating: 5,
  comment: "Great service!",
  categories: ["service"],
  isPublic: true
});
```

### View & Respond to Feedback (Staff)
```typescript
// List feedback
const { data: feedbackList } = useGetFeedbackList({ status: 'new' });

// Respond to feedback
const { mutate: respond } = useRespondToFeedback();

respond({
  feedbackId: "fb-123",
  data: {
    status: "resolved",
    responseText: "Thank you for your feedback!"
  }
});
```

### Create & Send Campaign (Staff)
```typescript
// Create campaign
const { mutate: create } = useCreateCampaign();

create({
  name: "Summer Sale",
  message: "20% off!",
  audience: {
    loyaltyTier: ["gold", "silver"]
  }
});

// Send campaign
const { mutate: send } = useSendCampaign();
send("campaign-id");
```

---

## Summary

All Feedback and Campaign endpoints are now fully integrated into the frontend with:
- ✅ React Query for state management
- ✅ Real-time data fetching
- ✅ Error handling
- ✅ Loading states
- ✅ Toast notifications
- ✅ User-friendly interfaces
- ✅ Complete CRUD operations
- ✅ Advanced filtering and search
- ✅ Statistics and analytics

**Status**: 🎉 **READY FOR PRODUCTION**

