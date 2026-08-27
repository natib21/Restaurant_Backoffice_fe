# Inventory Domain — Frontend Integration Guide

This document covers the **5 inventory API modules** and how to integrate them into the merchant app frontend.

**Base URL**: `http://localhost:8000/api/v1`  
**Authentication**: All requests require `Authorization: Bearer <JWT>` header

---

## Quick Start: Import Hooks

All hooks are in `src/api/Queries/`:

```typescript
// Suppliers
import { 
  useGetSuppliersList, 
  useGetSupplierDetails, 
  useCreateSupplier, 
  useUpdateSupplier, 
  useDeleteSupplier 
} from '@/api/Queries/supplierQueries';

// Ingredients
import { 
  useGetIngredientsList, 
  useGetIngredientDetails, 
  useCreateIngredient, 
  useUpdateIngredient, 
  useDeleteIngredient 
} from '@/api/Queries/ingredientQueries';

// Recipes
import { 
  useGetRecipesList, 
  useGetRecipeDetails, 
  useCreateRecipe, 
  useUpdateRecipe, 
  useDeleteRecipe 
} from '@/api/Queries/recipeQueries';

// Inventory (Stock ops)
import { 
  useAdjustStock, 
  useBatchAdjustStock, 
  useGetInventoryMovements, 
  useGetInventoryValuation, 
  useGetLowStockItems, 
  useSetStockThresholds, 
  useValidateOrder 
} from '@/api/Queries/inventoryQueries';

// Purchase Orders
import { 
  useGetPurchaseOrdersList, 
  useGetPurchaseOrderDetails, 
  useCreatePurchaseOrder, 
  useUpdatePurchaseOrder, 
  useDeletePurchaseOrder, 
  useReceiveGoodsForPO 
} from '@/api/Queries/purchaseOrderQueries';
```

---

## 1. Suppliers — `/v1/suppliers`

### List Suppliers

```typescript
const { data: suppliersData, isLoading, error, refetch } = useGetSuppliersList();
const suppliers = suppliersData?.data?.suppliers || [];
```

**Response**:
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "suppliers": [
      {
        "_id": "6a243d6c5dd23ba4b994e149",
        "name": "Green Farm Co.",
        "contactPerson": "Abebe Bekele",
        "phone": "+251911123456",
        "email": "sales@greenfarm.et",
        "address": {
          "street": "Bole Road",
          "city": "Addis Ababa",
          "zipCode": "1000"
        },
        "paymentTerms": "net_15",
        "leadTime": 3,
        "rating": 4,
        "isActive": true,
        "createdAt": "2026-08-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Supplier

```typescript
const createMutation = useCreateSupplier();

const handleCreate = async () => {
  await createMutation.mutateAsync({
    name: "Green Farm Co.",
    contactPerson: "Abebe Bekele",
    phone: "+251911123456",
    email: "sales@greenfarm.et",
    address: {
      street: "Bole Road",
      city: "Addis Ababa",
      zipCode: "1000"
    },
    paymentTerms: "net_15", // cash | net_7 | net_15 | net_30 | net_60
    leadTime: 3, // Days
    rating: 4 // 1-5
  });
};
```

**Response (201)**:
```json
{
  "status": "success",
  "data": {
    "supplier": {
      "_id": "6a243d6c5dd23ba4b994e149",
      "name": "Green Farm Co.",
      "merchant": "...",
      "isActive": true
    }
  }
}
```

### Update Supplier

```typescript
const updateMutation = useUpdateSupplier();

await updateMutation.mutateAsync({
  supplierId: "6a243d6c5dd23ba4b994e149",
  data: {
    name: "Updated Name",
    phone: "+251911999999"
  }
});
```

---

## 2. Ingredients — `/v1/ingredients`

### List Ingredients

```typescript
const { data: ingredientsData, isLoading, error } = useGetIngredientsList();
const ingredients = ingredientsData?.data?.ingredients || [];

// Each ingredient has a virtual stockStatus field
// stockStatus: "in_stock" | "low_stock" | "out_of_stock"
```

**Response**:
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "ingredients": [
      {
        "_id": "6b0c...",
        "name": "Tomato (local)",
        "category": "vegetables",
        "unit": "kg",
        "currentStock": 25,
        "minStock": 10,
        "maxStock": 100,
        "costPerUnit": 120,
        "supplier": {
          "_id": "6a243d6c5dd23ba4b994e149",
          "name": "Green Farm Co."
        },
        "stockStatus": "in_stock",
        "expiryDate": "2026-09-15T00:00:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

### Create Ingredient

```typescript
const createMutation = useCreateIngredient();

await createMutation.mutateAsync({
  name: "Tomato (local)",
  category: "vegetables", // vegetables | meat | dairy | grains | spices | beverages | other
  unit: "kg", // kg | g | liter | ml | pieces | boxes | cans
  currentStock: 25,
  minStock: 10,
  maxStock: 100,
  costPerUnit: 120,
  supplier: "6a243d6c5dd23ba4b994e149", // Supplier _id
  expiryDate: "2026-09-15T00:00:00.000Z" // Optional
});
```

---

## 3. Recipes — `/v1/recipes`

### List Recipes

```typescript
const { data: recipesData, isLoading } = useGetRecipesList();
const recipes = recipesData?.data?.recipes || [];
```

**Response**:
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "recipes": [
      {
        "_id": "6c...",
        "menuItem": {
          "_id": "6a421b0c03d39206c382def0",
          "name": "Margharita Pizza"
        },
        "name": "Margharita — Standard Recipe",
        "yield": 1,
        "items": [
          {
            "ingredient": {
              "_id": "6b0c...",
              "name": "Tomato (local)",
              "currentStock": 25,
              "unit": "kg"
            },
            "quantity": 0.15,
            "unit": "kg"
          }
        ],
        "totalCost": 18,
        "costPerServing": 18,
        "isActive": true
      }
    ]
  }
}
```

### Create Recipe

```typescript
const createMutation = useCreateRecipe();

await createMutation.mutateAsync({
  menuItem: "6a421b0c03d39206c382def0", // Menu _id
  name: "Margharita — Standard Recipe",
  yield: 1, // Servings this produces
  items: [
    {
      ingredient: "6b0c...ingredientId",
      quantity: 0.15,
      unit: "kg"
    },
    {
      ingredient: "6b0c...ingredientId2",
      quantity: 0.05,
      unit: "kg"
    }
  ]
});
```

---

## 4. Inventory (Stock Operations) — `/v1/inventory`

### Single Stock Adjustment

```typescript
const adjustMutation = useAdjustStock();

await adjustMutation.mutateAsync({
  ingredientId: "6a421b0c03d39206c382def0",
  quantity: 10,
  type: "in", // in | out | waste | adjustment
  reason: "Delivery received",
  reference: "PO-20260808-001", // Optional
  cost: 120 // Per-unit cost (optional, for valuation)
});
```

**Response**:
```json
{
  "status": "success",
  "message": "Stock adjusted successfully",
  "data": {
    "ingredient": {
      "_id": "6a421b0c03d39206c382def0",
      "name": "Tomato (local)",
      "currentStock": 35,
      "unit": "kg"
    }
  }
}
```

### Batch Stock Adjustments

```typescript
const batchMutation = useBatchAdjustStock();

await batchMutation.mutateAsync({
  adjustments: [
    {
      ingredientId: "6a421...A",
      quantity: 5,
      type: "out",
      reason: "Kitchen prep"
    },
    {
      ingredientId: "6a421...B",
      quantity: 10,
      type: "waste",
      reason: "Spoilage"
    }
  ]
});
```

### Get Stock Movements (Audit Log)

```typescript
const { data: movementsData, isLoading } = useGetInventoryMovements({
  ingredientId: "6a421b0c03d39206c382def0", // Optional
  type: "in", // Optional: in | out | waste | adjustment
  startDate: "2026-08-01T00:00:00.000Z", // Optional
  endDate: "2026-08-08T23:59:59.999Z", // Optional
  limit: 20,
  offset: 0
});

const movements = movementsData?.data?.movements || [];
```

**Response**:
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "movements": [
      {
        "_id": "...",
        "ingredient": {
          "_id": "6a421...",
          "name": "Tomato (local)",
          "unit": "kg"
        },
        "quantity": 10,
        "type": "in",
        "reason": "Delivery received",
        "reference": "PO-20260808-001",
        "costPerUnit": 120,
        "movementValue": 1200,
        "balance": 35,
        "createdBy": "staff_id",
        "createdAt": "2026-08-08T10:30:00.000Z"
      }
    ]
  }
}
```

### Get Inventory Valuation

Shows total stock value (currentStock × costPerUnit) across all ingredients.

```typescript
const { data: valuationData, isLoading } = useGetInventoryValuation();
const valuation = valuationData?.data?.valuation || {};

console.log(valuation.totalValue); // 5000 (total inventory value)
console.log(valuation.totalItems); // 15 (count of ingredients)
console.log(valuation.ingredients); // Array with name, value, etc.
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "valuation": {
      "totalValue": 5000,
      "totalItems": 15,
      "ingredients": [
        {
          "ingredientId": "6a421...",
          "name": "Tomato (local)",
          "currentStock": 25,
          "unit": "kg",
          "costPerUnit": 120,
          "value": 3000
        }
      ]
    }
  }
}
```

### Get Low Stock Items

Items where `currentStock ≤ minStock`.

```typescript
const { data: lowStockData, isLoading } = useGetLowStockItems();
const lowStockItems = lowStockData?.data?.items || [];
```

**Response**:
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "items": [
      {
        "_id": "6b0c...",
        "name": "Tomato (local)",
        "currentStock": 8,
        "minStock": 10,
        "unit": "kg",
        "supplier": {
          "_id": "6a243...",
          "name": "Green Farm Co."
        },
        "daysToReorder": 2
      }
    ]
  }
}
```

### Set Stock Thresholds

```typescript
const setThresholdsMutation = useSetStockThresholds();

await setThresholdsMutation.mutateAsync({
  ingredientId: "6a421b0c03d39206c382def0",
  minStock: 10,
  maxStock: 100
});
```

### Validate Order (Pre-check for stock availability)

Before placing an order, check if you have enough stock.

```typescript
const validateMutation = useValidateOrder();

const result = await validateMutation.mutateAsync([
  {
    ingredientId: "6a421...A",
    quantity: 1.2
  },
  {
    ingredientId: "6a421...B",
    quantity: 0.5
  }
]);

if (!result.data.available) {
  console.log("Not enough stock!");
  console.log(result.data.shortages); // Array of what's missing
} else {
  console.log("Order is valid, proceed!");
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "available": false,
    "shortages": [
      {
        "ingredientId": "6a421...A",
        "required": 1.2,
        "available": 0.7,
        "unit": "kg"
      }
    ]
  }
}
```

---

## 5. Purchase Orders — `/v1/purchase-orders`

### List Purchase Orders

```typescript
const { data: posData, isLoading } = useGetPurchaseOrdersList({
  status: "draft", // Optional filter
  supplier: "6a243...", // Optional filter
  page: 1,
  limit: 10
});

const pos = posData?.data?.purchaseOrders || [];
```

**Response**:
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "purchaseOrders": [
      {
        "_id": "...",
        "poNumber": "PO-20260808-001",
        "supplier": {
          "_id": "6a243...",
          "name": "Green Farm Co.",
          "phone": "+251...",
          "email": "sales@..."
        },
        "status": "draft",
        "items": [
          {
            "ingredient": {
              "_id": "6a421...",
              "name": "Tomato (local)",
              "unit": "kg"
            },
            "quantity": 50,
            "unitPrice": 120,
            "totalPrice": 6000
          }
        ],
        "subtotal": 12000,
        "taxAmount": 480,
        "totalAmount": 12480,
        "expectedDeliveryDate": "2026-08-12T00:00:00.000Z",
        "createdAt": "2026-08-08T10:00:00.000Z"
      }
    ]
  }
}
```

### Create Purchase Order

```typescript
const createMutation = useCreatePurchaseOrder();

await createMutation.mutateAsync({
  supplier: "6a243d6c5dd23ba4b994e149", // Supplier _id
  status: "draft", // draft | sent | confirmed | partially_received | received | cancelled
  items: [
    {
      ingredient: "6a421...A",
      quantity: 50,
      unitPrice: 120,
      totalPrice: 6000
    },
    {
      ingredient: "6a421...B",
      quantity: 20,
      unitPrice: 300,
      totalPrice: 6000
    }
  ],
  taxAmount: 480,
  expectedDeliveryDate: "2026-08-12T00:00:00.000Z",
  notes: "Ring bell at back door" // Optional
});

// Auto-generated fields (don't include):
// - poNumber (e.g., "PO-20260808-001")
// - subtotal (sum of items.totalPrice)
// - totalAmount (subtotal + taxAmount)
```

### Receive Goods (Stock In)

When goods arrive, mark the PO as received and auto-adjust stock.

```typescript
const receiveMutation = useReceiveGoodsForPO();

await receiveMutation.mutateAsync({
  poId: "6d...",
  data: {
    receivedItems: [
      {
        ingredientId: "6a421...A",
        receivedQuantity: 50 // Could be less than ordered (partial)
      },
      {
        ingredientId: "6a421...B",
        receivedQuantity: 18 // Received less than ordered
      }
    ]
  }
});

// This automatically:
// 1. Creates stock movements with reason="purchase"
// 2. Increments ingredient.currentStock by receivedQuantity
// 3. Sets PO.status = "received"
// 4. Sets PO.actualDeliveryDate = now
```

---

## UI Workflow Example: Stock Receive Flow

```typescript
import React, { useState } from 'react';
import { useGetPurchaseOrdersList, useReceiveGoodsForPO } from '@/api/Queries/purchaseOrderQueries';

const ReceiveGoodsPage: React.FC = () => {
  const { data: posData, isLoading } = useGetPurchaseOrdersList({ 
    status: "sent" // Only show POs that are sent/confirmed
  });
  const receiveMutation = useReceiveGoodsForPO();
  
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  
  const handleReceive = async () => {
    if (!selectedPO) return;
    
    const receivedItems = selectedPO.items.map((item: any) => ({
      ingredientId: item.ingredient._id,
      receivedQuantity: receivedQtys[item.ingredient._id] || item.quantity
    }));
    
    try {
      await receiveMutation.mutateAsync({
        poId: selectedPO._id,
        data: { receivedItems }
      });
      
      alert('Goods received and stock updated!');
      setSelectedPO(null);
      setReceivedQtys({});
    } catch (error) {
      alert('Error receiving goods');
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  const pos = posData?.data?.purchaseOrders || [];
  
  return (
    <div>
      <h1>Receive Goods</h1>
      
      {/* List of pending POs */}
      <div>
        {pos.map(po => (
          <div 
            key={po._id}
            onClick={() => setSelectedPO(po)}
            style={{
              border: selectedPO?._id === po._id ? '2px solid blue' : '1px solid gray',
              padding: '10px',
              cursor: 'pointer'
            }}
          >
            <p><strong>{po.poNumber}</strong> from {po.supplier.name}</p>
            <p>Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      
      {/* Receive items for selected PO */}
      {selectedPO && (
        <div style={{ marginTop: '20px', border: '1px solid green', padding: '10px' }}>
          <h2>Receive Items — {selectedPO.poNumber}</h2>
          
          {selectedPO.items.map((item: any) => (
            <div key={item.ingredient._id} style={{ marginBottom: '10px' }}>
              <label>
                {item.ingredient.name} ({item.ingredient.unit})
                <br />
                Ordered: {item.quantity}
                <br />
                Received:
                <input
                  type="number"
                  max={item.quantity}
                  value={receivedQtys[item.ingredient._id] || item.quantity}
                  onChange={(e) =>
                    setReceivedQtys({
                      ...receivedQtys,
                      [item.ingredient._id]: parseFloat(e.target.value)
                    })
                  }
                />
              </label>
            </div>
          ))}
          
          <button 
            onClick={handleReceive}
            disabled={receiveMutation.isPending}
          >
            {receiveMutation.isPending ? 'Receiving...' : 'Confirm Receipt'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiveGoodsPage;
```

---

## Error Handling

All API errors follow this shape:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    {
      "field": "quantity",
      "message": "Must be a positive number"
    }
  ]
}
```

Catch errors in mutations:

```typescript
const adjustMutation = useAdjustStock();

try {
  await adjustMutation.mutateAsync({...});
} catch (error: any) {
  const message = error.response?.data?.message || 'Unknown error';
  console.error(message);
}
```

---

## Summary

**5 Modules**:
1. **Suppliers** — Create/manage suppliers (payment terms, lead time, rating)
2. **Ingredients** — Create/manage ingredients with supplier links and stock levels
3. **Recipes** — Define recipes linking menu items to ingredient lists
4. **Inventory** — Adjust stock, view movements, check valuation, validate orders
5. **Purchase Orders** — Create POs, receive goods (auto-adjusts stock)

**Key Hooks**:
- `useGetSuppliersList()` / `useCreateSupplier()`
- `useGetIngredientsList()` / `useCreateIngredient()`
- `useGetRecipesList()` / `useCreateRecipe()`
- `useAdjustStock()` / `useBatchAdjustStock()` / `useValidateOrder()`
- `useGetPurchaseOrdersList()` / `useReceiveGoodsForPO()`

**Next Steps**:
1. Import hooks into your UI pages
2. Call them with the exact payloads shown above
3. Handle responses and errors gracefully
4. Test with backend (ensure JWT is valid)
5. Build inventory management dashboard showing valuation, low stock, and movements
