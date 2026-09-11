export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    followUps: number;
    challans: number;
  };
  followUps?: CustomerFollowUp[];
  challans?: SalesChallan[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
    category: string;
    currentStock: number;
  };
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId?: string | null;
  productName: string;
  productSku: string;
  category: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdBy: string;
  createdDate: string;
  updatedAt: string;
  notes?: string | null;
  customer: {
    id: string;
    customerName: string;
    businessName: string;
    mobileNumber: string;
    email: string;
    address?: string;
    gstNumber?: string | null;
  };
  items: ChallanItem[];
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  totalRevenue: number;
  totalItemsDispatched: number;
}
