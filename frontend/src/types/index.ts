export enum Role {
  OWNER = 'OWNER',
  WORKER = 'WORKER',
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  defaultRate: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  defaultRate: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilkPurchase {
  id: string;
  vendor: Vendor;
  purchaseDate: string;
  quantityLiters: number;
  ratePerLiter: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilkDelivery {
  id: string;
  customer: Customer;
  deliveryDate: string;
  quantityLiters: number;
  ratePerLiter: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  milkPurchasedLiters: number;
  milkSuppliedLiters: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface TransactionDetail {
  date: string;
  quantityLiters: number;
  ratePerLiter: number;
  amount: number;
}

export interface MonthlyStatement {
  entityId: string;
  entityName: string;
  month: string;
  year: number;
  transactions: TransactionDetail[];
  totalLiters: number;
  totalDays: number;
  averageRate: number;
  totalAmount: number;
}

export interface BulkDeliveryError {
  customerId: string;
  customerName: string;
  reason: string;
}

export interface BulkDeliveryResponse {
  successCount: number;
  failedCount: number;
  createdDeliveries: MilkDelivery[];
  errors: BulkDeliveryError[];
}
