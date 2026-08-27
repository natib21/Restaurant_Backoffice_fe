// src/features/Inventory/lib/types.ts

export interface Ingredient {
  _id: string;
  merchant: string;
  name: string;
  category: 'vegetables' | 'meat' | 'dairy' | 'grains' | 'spices' | 'beverages' | 'other';
  unit: 'kg' | 'g' | 'liter' | 'ml' | 'pieces' | 'boxes' | 'cans';
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit?: number;
  supplier?: string | Supplier;
  isActive: boolean;
  lastRestocked?: string;
  expiryDate?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'over_stock';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  _id: string;
  merchant: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  paymentTerms: 'cash' | 'net_7' | 'net_15' | 'net_30' | 'net_60';
  leadTime?: number;
  isActive: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  ingredient: string | Ingredient;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  _id: string;
  merchant: string;
  supplier: string | Supplier;
  poNumber: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  merchant: string;
  ingredient: string | Ingredient;
  type: 'addition' | 'deduction' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceType?: 'purchase_order' | 'order' | 'manual' | 'waste';
  referenceId?: string;
  performedBy: string;
  createdAt: string;
}

export interface StockAdjustmentPayload {
  ingredientId: string;
  quantity: number;
  type: 'add' | 'subtract' | 'set';
  reason: string;
}

export interface InventoryValuation {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: Array<{
    category: string;
    value: number;
    count: number;
  }>;
}