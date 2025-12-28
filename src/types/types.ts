// src/types.ts

// --- ENUMS & LOGIC ---

export enum AppRole {
  owner = 'owner',
  admin = 'admin',
  manager = 'manager',
  cashier = 'cashier'
}

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'canceled' | 'refunded';

export enum PaymentCategory {
  offline = 'offline',
  online = 'online',
  foodDelivery = 'foodDelivery'
}

export enum PaymentSubCategory {
  qris = 'qris',
  eWallet = 'eWallet',
  debit = 'debit',
  credit = 'credit',
  transfer = 'transfer',
  cash = 'cash',
  shopeeFood = 'shopeeFood',
  goFood = 'goFood',
  grabFood = 'grabFood'
}

// --- DOMAIN MODELS ---

export interface Product {
  id: string;
  name: string;
  price: bigint;      // Admin page perlu BigInt
  category: string;
  image?: string;
  available: boolean;
  description?: string;
  stock: bigint;      // Admin page perlu BigInt
  outletId?: string;
  isDeleted?: boolean;
}

export interface ProductPackage {
  id: string;
  name: string;
  price: bigint;
  description?: string;
  image?: string;
  available: boolean;
  // Support 'items' DAN 'components' agar kompatibel dengan kode lama & baru
  items: {
    productId: string;
    quantity: number;
  }[];
  components?: {
    productId: string;
    quantity: number;
  }[];
  stock?: bigint;
  isActive?: boolean;
}

export interface BundleItem {
  productId: string;
  quantity: number;
}



export interface Bundle {
  id: string;
  name: string;
  price: bigint;
  items: BundleItem[];
  image?: string;
  active: boolean;
  description?: string;
  calculatedStock?: bigint;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
  description?: string; // Tambahan
  isActive?: boolean;   // Tambahan
}

export interface Brand { // Interface Baru
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  lastOrder?: string;
  status: 'online' | 'offline';
  unread?: number;
  registeredAt: bigint;
}

export interface CartItem extends Product {
  quantity: number;
  type?: 'product' | 'package' | 'bundle';
  availableStock?: bigint;
}

// --- TRANSACTION & PAYMENT ---

export interface TransactionItem {
  productId: string;
  name?: string;
  price: bigint;
  quantity: bigint;
  subtotal?: number;
  note?: string;
  isPackage?: boolean;
  isBundle?: boolean;
}

export interface PaymentMethod {
  id?: string;
  category: PaymentCategory;
  subCategory?: PaymentSubCategory;
  methodName: string;
  amount: bigint;
  // Field optional untuk kompatibilitas
  name?: string;
  type?: string;
  enabled?: boolean;
  transactionFee?: number;
}

export interface GuestCustomerData {
  name: string;
  phone: string;
  address: string;
}

// --- ADMIN & BACKEND TYPES ---

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  isActive: boolean;  // Digunakan oleh OutletsManagementPage
  createdAt: bigint;  // Digunakan oleh OutletsManagementPage
  status?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: AppRole | string;
  outletId: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface InventoryItem {
  productId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
}

export interface MenuAccess {
  menu: string;
  isAccessible: boolean;
}

export interface MenuAccessConfig {
  manager: MenuAccess[];
  cashier: MenuAccess[];
  owner: MenuAccess[];
}

// --- IDENTITY / LEGACY TYPES (Wajib untuk Staff & Customer Page) ---

export interface UserProfile {
  name: string;
  role: AppRole;
  email?: string;
  outletId?: string;
  registeredAt?: bigint;
}

// Class Principal tiruan untuk kompatibilitas dengan kode admin yang mungkin pakai Dfinity/IC logic
export class Principal {
  private _id: string;
  
  constructor(id: string) {
    this._id = id;
  }

  toString(): string {
    return this._id;
  }

  toText(): string {
    return this._id;
  }

  static fromText(text: string): Principal {
    return new Principal(text);
  }
}

// --- FINANCE & EXPENSES ---

export interface Expense {
  id: string;
  title: string;
  amount: bigint;
  category: string; // e.g., 'operational', 'salary', 'purchase', 'other'
  date: bigint;     // Timestamp
  note?: string;
  outletId?: string;
}

export interface CashflowSummary {
  totalIncome: bigint;
  totalExpense: bigint;
  netProfit: bigint;
  period: string; // 'daily', 'weekly', 'monthly'
  chartData: {
    date: string;
    income: number;
    expense: number;
  }[];
}